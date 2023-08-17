import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);
const roomSockets = {};
let currentRoom = null;

wsServer.on("connection", (socket) => {
  socket["nickname"] = "Annymous";

  // socket.onAny((eventName, ...args) => {
  //   console.log(`Received event: ${eventName}`);
  //   console.log("Arguments:", args);
  // });

  socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    currentRoom = roomName;
    if (!roomSockets[roomName]) {
      roomSockets[roomName] = [];
    }
    roomSockets[roomName].push(socket);
    done();
    socket.to(roomName).emit("welcome");

    updateRoomParticipantCount(roomName);
  });

  socket.on("set_nickname", (nickname) => {
    socket["nickname"] = nickname;
  });

  socket.on("send_offer", (offer, roomName) => {
    socket.to(roomName).emit("receive_offer", offer);

  });
  socket.on("send_media", (offer, roomName) => {
    socket.to(roomName).emit("receive_media", offer);

  });

  socket.on("send_answer", (answer, roomName) => {
    socket.to(roomName).emit("receive_answer", answer);
  });

  socket.on("send_ice", (ice, roomName) => {
    socket.to(roomName).emit("receive_ice", ice);
  });
  socket.on("disconnecting", () => {
    // Use the currentRoom variable instead of roomName
    if (currentRoom && roomSockets[currentRoom]) {
      const index = roomSockets[currentRoom].indexOf(socket);
      if (index !== -1) {
        roomSockets[currentRoom].splice(index, 1); // Remove the socket
        updateRoomParticipantCount(currentRoom);
      }
    }
  });

});


function updateRoomParticipantCount(roomName) {
  if (roomSockets[roomName]) {
    const participantCount = roomSockets[roomName].length;
    console.log(participantCount);
    wsServer.to(roomName).emit("participant_count", participantCount);
  }
}


const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);
