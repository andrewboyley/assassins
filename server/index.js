const express = require("express");
const app = express();
const http = require("http");
const path = require('path');

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { cors: { origin: "*" } });


app.use(express.static(path.resolve(__dirname, '../client/dist')));

app.get('*', function(request, response) {
  response.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
});

let rooms = {};

let exitRooms = function (socket) {
  socket.rooms.forEach((room) => {
    if (!rooms[room]) return;

    // console.log(`${socket.id} leaving room ${room}`);
    socket.leave(room);
    if (rooms[room].length === 1) {
      delete rooms[room];
      console.log(`Room ${room} destroyed`);
    } else {
      for (var i = 0; i < rooms[room].length; i++) {
        if (rooms[room][i].id == socket.id) {
          rooms[room].splice(i, 1);
          break;
        }
      }
      rooms[room][0].admin = true;

      io.to(room).emit("room-info", { room, members: rooms[room] });
    }
  });
};

let randomCode = function (length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

let sendRoomInfo = function (room) {
  io.to(room).emit("room-info", { room, members: rooms[room] });
};

io.on("connection", (socket) => {
  socket.on("disconnecting", () => {
    exitRooms(socket);
  });

  socket.on("disconnect", (reason) => {
    // console.log(`${socket.id} disconnected`);

  });

  // console.log(`${socket.id} connected`);

  socket.on("assign", (room) => {
    var members = rooms[room.room];
    for (var i = 0; i < members.length; i++) {
      if (members[i].id == socket.id && !members[i].admin) {
        console.log("Not an admin");
        return;
      } else {
        break;
      }
    }

    var arr1 = members.slice(),
      arr2 = members.slice();
    arr1.sort(function () {
      return 0.5 - Math.random();
    }); // shuffle arrays
    arr2.sort(function () {
      return 0.5 - Math.random();
    });

    while (arr1.length) {
      var name1 = arr1.pop(), // get the last value of arr1
        name2 = arr2.pop();
      //        ^^ if the first value is the same as name1,
      //           get the last value, otherwise get the first

      // console.log(name1.username + " gets " + name2.username);

      io.to(name1.id).emit("target", { username: name2.username });
      io.to(name2.id).emit("target", { username: name1.username });
    }
  });

  socket.on("leave", () => {
    exitRooms(socket);
  });

  socket.on("join", ({ room, admin, username }, callback) => {
    // const { error, user } = addUser({ id: socket.id, name, room });

    if (socket.rooms.size > 1) {
      exitRooms(socket);
    }

    if (admin) {
      room = randomCode(4);
      while (rooms[room]) {
        room = randomCode(4);
      }
      console.log(`Room ${room} created`);
    }

    if (!rooms[room]) {
      rooms[room] = [];
    }

    if (rooms[room].length > 0) admin = false;

    rooms[room].push({ id: socket.id, username: username, admin: admin });

    // console.log(`${socket.id} joined room ${room}`);
    socket.join(room);

    // if (error) return callback(error);
    sendRoomInfo(room);
  });
});

let port = process.env.PORT || 3001;

server.listen(port, () => console.log(`Server has started on port ${port}`));
