import http from "http";
import SocketIO from "socket.io";
import express from "express";
import { Kafka } from "kafkajs";

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


const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['52.91.126.82:9092','34.232.53.143:9092','100.24.240.6:9092']
});

const producer = kafka.producer();




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

  socket.on("send_event", (trackevent, roomName) => {
    socket.to(roomName).emit("receive_event", trackevent);

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

  socket.on('sendImage', async (data) => {
    try {
      const base64Data = data.base64Data;
      
      // Produce the image data to Kafka topic
      await producer.connect();
      await producer.send({
        topic: 'your-kafka-topic',
        messages: [{ value: base64Data }],
      });
      
      console.log('Image data sent to Kafka.');

      const consumer = kafka.consumer({ groupId: 'image-processing-group' });

      await consumer.connect();
      await consumer.subscribe({ topic: 'your-kafka-topic', fromBeginning: false });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
         
    
          // Assuming the message contains a base64 encoded image
          const base64Image = message.value.toString(); // Convert buffer to string
          socket.to(roomName).emit('imageData', base64Image);
        }
      });


      // Respond to the frontend
      socket.emit('imageReceived', { success: true });
    } catch (error) {
      console.error('Error sending image data to Kafka:', error);
      socket.emit('imageReceived', { success: false });
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


