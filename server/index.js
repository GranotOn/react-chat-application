/* Configs */
const PORT = process.env.PORT || 5000;
const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");
const router = require("./router");

/* Global Requirements */
const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");

/* Socket Io & Express config */
const app = express();
const server = http.createServer(app);
const io = socketio(server);

/* IO connections */
io.on("connection", (socket) => {
  //Join
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    socket.emit("message", {
      user: "admin",
      text: `${user.name} Welcome to the ${user.room}!`,
    });
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name} has joined!` });
    socket.join(user.room);
  });

  //Message
  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, text: message });

    callback();
  });
  //Disconnection
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      socket
        .to(user.room)
        .emit("message", { user: "admin", text: ` ${user.name} disconnected` });
    }
  });
});

/* uses */
app.use(router);
app.use(cors);

/* Server Initialize */
server.listen(PORT, () => console.log(`server has started on port ${PORT}`));
