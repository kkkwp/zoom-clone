import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import express from "express";

const app = express();

// front 설정
app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
// redirect
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

// httpServer에 socketIO를 같이 올림
const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
    // admin-ui를 사용해보기
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    },
});

instrument(wsServer, {
    auth: false,
});

// public room 찾기
function publicRooms() {
    // const sids = wsServer.sockets.adapter.sids;
    // const rooms = wsServer.sockets.adapter.rooms;
    const { 
        sockets: {
            adapter: { sids, rooms },
        },
    } = wsServer;

    // sids = socket id
    // <Map> sids에서 key를 가져왔는데, undefined이면 client가 생성한 방(공개 방)
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if (sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    });
    return publicRooms;
}

function countRoom(roomName) {
    // roomName을 찾으면(null일 수도 있음) size를 반환
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

// 연결되었을 때의 이벤트
wsServer.on("connection", (socket) => {
    // socket이 연결되었을 때 모든 socket이 공지 방에 입장
    //wsServer.socketsJoin("announcement");

    // 처음 접속하면 Anon(익명)으로 닉네임 설정
    socket["nickname"] = "Anon";

    // onAny: 미들웨어처럼, 모든 event에서 다음의 함수를 수행
    socket.onAny((event) => {
        console.log(wsServer.sockets.adapter);
        console.log(`Socket Event: ${event}`);
    });

    // on: 방에 입장했을 때의 이벤트
    socket.on("enter_room", (roomName, done) => {
        // 방에 들어감
        socket.join(roomName);
        done();
        // event를 roomName에 있는 모든 클라이언트에게 emit함
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
        // 메시지를 모든 socket에게 보냄
        wsServer.sockets.emit("room_change", publicRooms());
    });

    // disconnecting: 연결이 아직 끊어지지 않음(room 정보가 살아 있음)
    // disconnect: 연결이 완전히 끊어짐(room 정보가 비어 있음)
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => 
            // 방을 떠나기 전이므로 방 개수에 내가 포함되어 있음! 따라서 -1
            socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
        );
    });

    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    });
    
    // room에 msg를 보냄
    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        // done을 호출할 때 front에서 done 함수를 실행함!
        done(countRoom(roomName));
    });

    // room 이름dlfmadmf 
    socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});

const handleListen = () => console.log(`Listening on https://localhost:3000`);
httpServer.listen(3000, handleListen);
