import http from "http";
import SocketIO from "socket.io";
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
const wsServer = SocketIO(httpServer);

// 연결되었을 때의 이벤트
wsServer.on("connection", (socket) => {
    // onAny: 미들웨어처럼, 모든 event에서 다음의 함수를 수행
    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`);
    });

    // on: 방에 입장했을 때의 이벤트
    socket.on("enter_room", (roomName, done) => {
        // 방에 들어감
        socket.join(roomName);
        done();
        // event를 roomName에 있는 모든 클라이언트에게 emit함
        socket.to(roomName).emit("welcome");
    });

    // disconnecting: 연결이 아직 끊어지지 않음(room 정보가 살아 있음)
    // disconnect: 연결이 완전히 끊어짐(room 정보가 비어 있음)
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => socket.to(room).emit("bye"));
    });

    // room에 msg를 보냄
    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", msg);
        // done을 호출할 때 front에서 done 함수를 실행함!
        done();
    });
});

const handleListen = () => console.log(`Listening on https://localhost:3000`);
httpServer.listen(3000, handleListen);
