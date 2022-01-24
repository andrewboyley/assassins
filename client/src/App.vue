<template>
  <div id="main">
    <h1>Assassins!</h1>
    <h2>Step 1: Choose a name</h2>
    <form id="profile">
      <label for="name">Username</label>
      <input
        type="text"
        name="name"
        id="name"
        placeholder="Enter name"
        v-model="username"
      />
    </form>
    <h2>Step 2: Create or join a game</h2>
    <div id="actions">
      <form id="create">
        <fieldset>
          <legend>Create</legend>
          <p>
            If you are running the game, create a room and send the code to
            everybody else so that they can join
          </p>
          <button @click="createRoom">Create room</button>
        </fieldset>
      </form>
      <div class="center"><strong>or</strong></div>
      <form id="join">
        <fieldset>
          <legend>Join</legend>
          <p>Enter the room code that the game admin created to join the game</p>
          <input
            type="text"
            placeholder="ABCD"
            v-model="joinRoomCode"
            id="roomcode"
          />
          <button @click="joinRoom">Join room</button>
        </fieldset>
      </form>
    </div>
    <h2>Step 3: Don't get assassinated</h2>
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
          {{ member.username }} <span v-if="member.admin"> &#x1F451; </span>
        </p>
      </fieldset>
    </div>
    <div>
      <hr>
      <h2>Rules</h2>
      <p>Assassins works on a core function called Passing.</p>
      <p>
        A Pass is when you hand something to someone else. This includes a
        hand-off or throwing it to them. The intention is what counts in making
        a Pass. In cases of uncertain intention, the game rules in favour of an
        elimination.
      </p>
      <p>
        For example, Abby throws an apple near Brittany. Abby was intending to
        throw it near Brittany, but not to her, so that it wouldn’t count as a
        Pass. However, she didn’t make that clear, by saying it or throwing it a
        sizable distance away from Brittany. So then, Brittany catches the
        apple. This would be an elimination
      </p>
      <p>
        Each player will receive a Target. A Target is the person you are trying
        to eliminate, and you eliminate them by getting them to Pass you
        something. Do not reveal your target except to give it to the person who
        eliminated you.
      </p>
      <p>
        Once you eliminate your Target, they give you their Target, and so it
        goes on until one Assassin is left standing.
      </p>
      <p>
        Free-for-All is a special state where you have no specific Target and
        can instead eliminate any other player. They then give you their Target.
      </p>
      <p>
        Dead Men Tell No Tales means that eliminated players may not reveal
        their targets or other information they have to living players.
      </p>
      <h3>Notable Rule Exceptions</h3>
      <p>
        If you eliminate your Target, and their Target was you, then you are in
        Free-for-All
      </p>
      <p>
        If your Target is eliminated by a player in Free-for-All, then you are
        now in Free-for-All
      </p>
    </div>
    <footer>
      Made with &#10084;&#65039; by <a href="https://andrewboyley.co.za" target="_blank">Andrew Boyley</a> (please don't assassinate me).
      Rules by Benjamin Dorfan &copy; {{ new Date().getFullYear() }}
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
        {
          room: this.joinRoomCode.toUpperCase(),
          admin: false,
          username: this.username,
        },
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

.center {
  position: relative;
  margin: .5rem 2rem;
}

.center > * {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

#roomcode {
  text-transform: uppercase;
}

.members-field {
  margin: 1rem auto;
}

label {
  margin-right: 1rem;
}

.subtle {
  font-size: 0.75rem;
}

a{
  text-decoration: none;
  color: inherit;
}

form {
  margin: 1rem auto;
}

footer {
  margin: 2rem 0;
  font-size: 0.75rem;
}

#actions {
  display: flex;
}

#actions form {
  flex: 1;
  width: 100%;
  text-align: center;
}

fieldset {
  height: 100%;
}

@media only screen and (max-width: 600px) {
  #actions {
    flex-direction: column;
  }
}
</style>