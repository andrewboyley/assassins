<template>
  <div id="main">
    <form id="profile">
      <fieldset>
        <legend>Profile</legend>
        <label for="name">Username</label>
        <input
          type="text"
          name="name"
          id="name"
          placeholder="Enter name"
          v-model="username"
        />
      </fieldset>
    </form>
    <form id="create">
      <fieldset>
        <legend>Create</legend>

        <button @click="createRoom">Create room</button>
      </fieldset>
    </form>
    <form id="join">
      <fieldset>
        <legend>Join</legend>
        <p>Enter room code to join room</p>
        <input type="text" placeholder="ABCDE" v-model="joinRoomCode" />
        <button @click="joinRoom">Join room</button>
      </fieldset>
    </form>

    <div>
      <h2 v-if="currentRoomName">Current room: {{ currentRoomName }}</h2>
      <h2 v-if="currentRoom?.target">Target: {{ currentRoom?.target }}</h2>
      <button v-if="currentRoomName" @click="leaveRoom">Leave room</button>
      <button v-if="isAdmin" @click="beginAssign">Assign targets</button>
      <p v-for="member in roomMembers" :key="member.id">
        {{ member.username }} <span v-if="member.admin">~~Admin~~</span>
      </p>
    </div>
  </div>
</template>

<script>
import { io } from "socket.io-client";

export default {
  setup() {},
  data() {
    return {
      socket: io(),
      joinRoomCode: "",
      currentRoom: null,
      username: "",
      isAdmin: false,
    };
  },
  created() {
    if (import.meta.env.DEV) {
      this.socket = io(import.meta.env.VITE_VUE_APP_SOCKET_ENDPOINT);
    } else {
      this.socket = io();
    }

    this.socket.on("connect", () => {
      this.username = "";
    });

    this.socket.on("target", (user) => {
      // console.log(`My target is ${user.username}`);
      this.currentRoom.target = user.username;
    });

    this.socket.on("room-info", (room) => {
      this.currentRoom = room;
      // console.log(room);
      this.setAdmin();
    });
  },

  computed: {
    currentRoomName() {
      return this.currentRoom?.room;
    },

    roomMembers() {
      return this.currentRoom?.members;
    },
  },

  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },

  methods: {
    usernameReminder() {
      alert("Please enter a username");
    },

    beginAssign() {
      this.socket.emit("assign", { room: this.currentRoomName });
    },

    setAdmin() {
      this.currentRoom?.members.forEach((member) => {
        if (member.id === this.socket.id) this.isAdmin = member.admin;
      });
    },

    leaveRoom(e) {
      this.socket.emit("leave");
      this.currentRoom = null;
      this.isAdmin = false;
    },
    createRoom(e) {
      // console.log("Creating room");
      e.preventDefault();

      if (!this.username) {
        this.usernameReminder();
        return;
      }

      this.socket.emit(
        "join",
        { room: null, admin: true, username: this.username },
        (result) => {
          // console.log(result);
        }
      );
    },
    joinRoom(e) {
      // console.log("Joining room");
      e.preventDefault();

      if (!this.username) {
        this.usernameReminder();
        return;
      }

      this.socket.emit(
        "join",
        { room: this.joinRoomCode, admin: false, username: this.username },
        (result) => {
          // console.log(result);
        }
      );
    },
  },
};
</script>

<style>
html,
body {
  max-width: 100%;
  overflow-x: hidden;
}

body {
  position: relative;
}
</style>