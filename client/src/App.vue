<template>
  <div id="main">
    <h1>Assassins!</h1>
    <p>Current global assassins: {{ totalAssassins }}</p>
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
        <p>Enter room code to join</p>
        <input
          type="text"
          placeholder="ABCD"
          v-model="joinRoomCode"
          id="roomcode"
        />
        <button @click="joinRoom">Join room</button>
      </fieldset>
    </form>

    <div>
      <h2 v-if="currentRoomName">Current room: {{ currentRoomName }}</h2>
      <h2 v-if="currentRoom?.target">Target: {{ currentRoom?.target }}</h2>
      <button v-if="currentRoomName" @click="leaveRoom">Leave room</button>
      <button v-if="isAdmin" @click="beginAssign">Assign targets</button>
      <p class="subtle" v-if="!isAdmin && currentRoomName">
        *Ask your admin to start the game by clicking the 'Assign targets'
        button
      </p>
      <fieldset class="members-field" v-if="currentRoomName">
        <legend>Members</legend>
        <p v-for="member in roomMembers" :key="member.id">
          {{ member.username }} <span v-if="member.admin">~~Admin~~</span>
        </p>
      </fieldset>
    </div>
    <footer>
      Made with &#10084;&#65039; by Andrew Boyley, please don't assassinate me
      &copy; {{ new Date().getFullYear() }}
    </footer>
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
      totalAssassins: 0,
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

    this.socket.on("numPlayers", (numberOfPlayers) => {
      this.totalAssassins = numberOfPlayers;
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
          if (!result) {
            alert("Problem joining room");
          }
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

#roomcode {
  text-transform: uppercase;
}

.members-field{
  margin: 1rem auto;
}

label {
  margin-right: 1rem;
}

.subtle {
  font-size: 0.75rem;
}

form {
  margin: 1rem auto;
}

footer {
  margin: 2rem 0;
  font-size: 0.75rem;
}
</style>