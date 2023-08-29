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
const connectedUsers = {};
let currentRoom = null;
let targetLanguage;
let targetNickname;

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['52.91.126.82:9092', '34.232.53.143:9092', '100.24.240.6:9092']
});

let jsonString = null;


wsServer.on("connection", async (socket) => {
  socket["nickname"] = "Annymous";
  
  const producer = kafka.producer();
  producer.connect();
  const consumer = kafka.consumer({ groupId: `${socket.id}` });
  consumer.connect();
  consumer.subscribe({ topics: ['cluster-korean', 'cluster-english', 'cluster-japan'] });

  consumer.run({
    eachMessage: async  ({ topic, partition, message }) => {
      console.log("topic", topic);
      console.log("target", targetNickname);
      console.log("tttt", targetLanguage);
      if(topic === targetLanguage){
        
        const buffer = message.value; // 위에서 제공한 value 값
      // 버퍼를 문자열로 변환
      jsonString = buffer.toString('utf-8'); // 'utf-8'은 문자 인코딩 방식입니다.
      console.log(jsonString);
      processImageData(targetNickname, jsonString);
      }
  
      
      
    }
});
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
    connectedUsers[nickname] = socket.id;
    socket["nickname"] = nickname;
    console.log(connectedUsers);
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
    consumer.disconnect();
  });

  socket.on('sendImage', async (data, flagLanguage, flagNickname) => {
    // Produce the image data to Kafka topic
    targetLanguage = flagLanguage;
    targetNickname = flagNickname;
    producer.send({
      topic: 'cluster',
      messages: [{ value: data }],
    });
    console.log('Image data sent to Kafka.');
   
  });

  
 




});


function updateRoomParticipantCount(roomName) {
  if (roomSockets[roomName]) {
    const participantCount = roomSockets[roomName].length;
    console.log(participantCount);
    wsServer.to(roomName).emit("participant_count", participantCount);
  }
}




function processImageData(targetNickname, jsonString) {
  // 이미지 데이터 처리 로직
  console.log(targetNickname);
  const userSocketId = connectedUsers[targetNickname];
  console.log(userSocketId);
  console.log('Processing image data:', jsonString);

  // 소켓을 통해 데이터 전송
  
  wsServer.to(userSocketId).emit("imageData", jsonString);
  
}

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);


