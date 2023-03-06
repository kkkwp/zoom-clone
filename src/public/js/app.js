const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

// 방에 입장하기 전에는 방 속성 숨기기
room.hidden = true;

// 방에 입장하면 실행될 함수
function showRoom(newCount) {
    // 화면 표시
    welcome.hidden = true;
    room.hidden = false;
    // 방 이름 표시
    const h3= room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    // submit을 누르면 메시지 표시
    const msgForm = room.querySelector("#msg");
    const nameForm = room.querySelector("#name")
    msgForm.addEventListener("submit", handleMessageSubmit);
    nameForm.addEventListener("submit", handleNicknameSubmit);
}

let roomName;

function addMessage(message) {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function handleNicknameSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#name input");
    socket.emit("nickname", input.value);
}

function handleMessageSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#msg input");
    const value = input.value;
    // backend로 이벤트 new_message와 인수 input.value, roomName, 함수를 보냄
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = "";
}

function handleRoomSubmit(event) {
    event.preventDefault();
    const input = form.querySelector("input");
    // emit: 서버가 현재 접속해있는 모든 클라이언트에게 이벤트 전달
    // 방에 접속하면, input.value를 전달하고 showRoom 함수 실행
    socket.emit("enter_room", input.value, showRoom);
    // 방 이름 가져오기
    roomName = input.value;
    // input 값 초기화
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

// 누군가 들어옴
socket.on("welcome", (user, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${user} Joined!`);
});

// 누군가 나감
socket.on("bye", (left, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${left} left...`);
});

// 메시지를 받음
socket.on("new_message", addMessage);

// 방에 변화가 생김
socket.on("room_change", (rooms) => {
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = "";
    // room이 하나도 없으면 화면을 비움
    if (rooms.length === 0) {
        return;
    }
    // 방 리스트를 화면에 출력
    rooms.forEach(room => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    });
});