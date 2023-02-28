const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

// 방에 입장하기 전에는 방 속성 숨기기
room.hidden = true;

// 방에 입장하면 실행될 함수
function showRoom() {
    // 화면 표시
    welcome.hidden = true;
    room.hidden = false;
    // 방 이름 표시
    const h3= room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
}

let roomName;

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
