import { io } from "socket.io-client";

class SocketioService {
  socket;
  room;
  constructor() {}
  setupSocketConnection() {
    this.socket = io(import.meta.env.VITE_VUE_APP_SOCKET_ENDPOINT);

    this.socket.on("room-info", (roomObj) => {
      this.room = roomObj;
      console.log(roomObj);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  createRoom(roomCode) {
    this.socket.emit("join", { room: roomCode, admin: true }, (result) => {
      console.log(result);
    });
  }

  joinRoom(roomCode) {
    this.socket.emit("join", { room: roomCode, admin: false }, (result) => {
      console.log(result);
    });
  }
}

export default new SocketioService();
