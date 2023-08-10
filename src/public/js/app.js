const socket = io();

const myScreen = document.getElementById("myScreen");
const myVideo = document.getElementById("myVideo");
const cameraSelect = document.getElementById("cameraSelect");
const videoBtn = document.getElementById("video");
const audioBtn = document.getElementById("audio");
const screenBtn = document.getElementById("screen");
const messages = document.getElementById("messages");
const chatForm = document.getElementById("chat");
const waitRoom = document.getElementById("waitRoom");
const waitRoomForm = waitRoom.querySelector("form");
const callRoom = document.getElementById("callRoom");

// callRoom.hidden = true;
callRoom.style.display = "none";

let videoStream;
let screenStream;
let muted = false;
let screenoff = false;
let cameraOff = false;
let roomName;
let nickname;
let myPeerConnection;
let myDataChannel;
let trackevent;

async function getVideo() {

  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });
    myVideo.srcObject = videoStream;
    trackevent = 2;
    myPeerConnection.addTrack(videoStream.getVideoTracks()[0], videoStream);
    const offer = await myPeerConnection.createOffer();
    await myPeerConnection.setLocalDescription(offer);
    const offerData = {
      offer,
      trackevent
    };
    const offerDataString = JSON.stringify(offerData);
    socket.emit("send_media", offerDataString, roomName)
    await getCamera();
  } catch (e) {
    console.log(e);
  }
}

async function getCamera() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");

    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      cameraSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

function handleAudioClick() {
  videoStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));

  if (!muted) {
    audioBtn.innerText = "Unmute";
  } else {
    audioBtn.innerText = "Mute";
  }
  muted = !muted;
}

async function handleCameraClick() {
  if (!videoStream) {
    await getVideo();
    return;
  }

  if (!cameraOff) {
    videoStream.getTracks().forEach((track) => track.stop());
    videoBtn.innerText = "Turn Camera off";
    handleCameraChange();
  } else {
    await getVideo();
    videoBtn.innerText = "Turn Camera on";

  }
  cameraOff = !cameraOff;
}

async function handleCameraChange() {
  if (!myPeerConnection) return; // myPeerConnection이 존재하지 않는 경우 종료
  trackevent = 2;
  // Find existing screen video sender
  const screenVideoSender = myPeerConnection
    .getSenders()
    .find((sender) => sender.track && sender.track.kind === "video");

  if (screenVideoSender) {
    // Remove the existing sender
    myPeerConnection.removeTrack(screenVideoSender);
  }

  // Create a new black canvas video track
  const blackVideoTrack = createBlackVideoTrack();

  // Add the new black canvas video track to the connection
  myPeerConnection.addTrack(blackVideoTrack, videoStream);

  // Create and send the offer
  const offer = await myPeerConnection.createOffer();
  await myPeerConnection.setLocalDescription(offer);
  const offerData = {
    offer,
    trackevent
  };
  const offerDataString = JSON.stringify(offerData);
  socket.emit("send_media", offerDataString, roomName);
}

async function getScreen() {

  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: true
    });
    trackevent = 1;
    myScreen.srcObject = screenStream;
    myPeerConnection.addTrack(screenStream.getVideoTracks()[0], screenStream);

    const offer = await myPeerConnection.createOffer();
    await myPeerConnection.setLocalDescription(offer);
    const offerData = {
      offer,
      trackevent
    };
    const offerDataString = JSON.stringify(offerData);
    socket.emit("send_media", offerDataString, roomName);
  } catch (e) {
    console.log(e);
  }
}



async function handleScreenClick() {
  if (!screenStream) {
    screenBtn.innerText = "Turn screen off";
    await getScreen();
    // myPeerConnection = null; // 기존 커넥션 종료
    // makeConnection(); // 새로운 커넥션 설정
    return;
  }

  if (!screenoff) {
    screenStream.getTracks().forEach((track) => track.stop());

    // Create a new black video track
    screenBtn.innerText = "Turn screen on";
    handleScreenChange();
  }
  else if (screenoff) {
    await getScreen(); // 화면 공유를 시작
    screenBtn.innerText = "Turn screen off";
  }
  screenoff = !screenoff;
}

async function handleScreenChange() {
  if (!myPeerConnection) return; // myPeerConnection이 존재하지 않는 경우 종료
  trackevent = 1;
  // Find existing screen video sender
  const screenVideoSender = myPeerConnection
    .getSenders()
    .find((sender) => sender.track && sender.track.kind === "video");

  if (screenVideoSender) {
    // Remove the existing sender
    myPeerConnection.removeTrack(screenVideoSender);
  }

  // Create a new black canvas video track
  const blackVideoTrack = createBlackVideoTrack();

  // Add the new black canvas video track to the connection
  myPeerConnection.addTrack(blackVideoTrack, screenStream);

  // Create and send the offer
  const offer = await myPeerConnection.createOffer();
  await myPeerConnection.setLocalDescription(offer);
  const offerData = {
    offer,
    trackevent
  };
  const offerDataString = JSON.stringify(offerData);
  socket.emit("send_media", offerDataString, roomName);
}

screenBtn.addEventListener("click", handleScreenClick);
videoBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("change", handleCameraChange);

// --------------- wait room form (choose and enter a room) -----------------

function createBlackVideoTrack() {
  const canvas = document.createElement("canvas");
  canvas.width = 640; // Set the desired width
  canvas.height = 480; // Set the desired height

  const context = canvas.getContext("2d");
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Create a video track from the canvas stream and add it to the video stream
  const canvasStream = canvas.captureStream();
  const canvasVideoTrack = canvasStream.getVideoTracks()[0];
  return canvasVideoTrack;
}


function showRoom() {
  waitRoom.style.display = "none";

  callRoom.hidden = false;
  callRoom.style.display = "flex";
}

async function handleRoomSubmit(e) {
  e.preventDefault();

  // 카메라, 마이크 장치 연결 설정
  await initCall();
  // 닉네임 설정
  const nicknameInput = waitRoom.querySelector("#nickname");
  socket.emit("set_nickname", nicknameInput.value);

  // 채팅방 입장
  const roomNameInput = waitRoom.querySelector("#roomName");
  socket.emit("enter_room", roomNameInput.value, showRoom);

  roomName = roomNameInput.value;
  nickname = nicknameInput.value;
}

async function initCall() {
  // waitRoom.style.display = "none";
  // // waitRoom.hidden = true;
  // callRoom.hidden = false;
  // callRoom.style.display = "flex";
  makeConnection();
}


waitRoomForm.addEventListener("submit", handleRoomSubmit);

// --------- Socket Code ----------

socket.on("welcome", async () => {
  myDataChannel = myPeerConnection.createDataChannel("chat");
  console.log(myDataChannel); 
  myDataChannel.addEventListener("message", addMessage);

  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("send_offer", offer, roomName);
});

socket.on("receive_offer", async (offer) => {
  console.log(myDataChannel);
  myPeerConnection.addEventListener("datachannel", (e) => {
    myDataChannel = e.channel;
    myDataChannel.addEventListener("message", addMessage);
  });
  myPeerConnection.setRemoteDescription(offer);

  // getMedia
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("send_answer", answer, roomName);
});

socket.on("receive_answer", (answer) => {
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("receive_media", async (offerDataString) => {
  console.log(myDataChannel);
  myPeerConnection.addEventListener("datachannel", (e) => {
    myDataChannel = e.channel;
    myDataChannel.addEventListener("message", addMessage);
  });

  const offerData = JSON.parse(offerDataString);
  const offer = offerData.offer;
  const receivedTrackEvent = offerData.trackevent;
  console.log(receivedTrackEvent);
  myPeerConnection.setRemoteDescription(offer);
  trackevent = receivedTrackEvent;
  // getMedia
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("send_answer", answer, roomName);
});

socket.on("receive_ice", (ice) => {
  myPeerConnection.addIceCandidate(ice);
});

// --------- RTC Code ---------

function handleIce(data) {
  socket.emit("send_ice", data.candidate, roomName);
}



function handleAddTrack(event) {
  console.log(trackevent);
  console.log(event);
  if (trackevent === 1) {
    peerStream = new MediaStream([event.track]);
    peerScreen.srcObject = peerStream;
  }
  else {
    peerStream = new MediaStream([event.track]);
    peerVideo.srcObject = peerStream;
  }
}



function makeConnection() {
  // Define STUN and TURN server configurations
  const iceServers = [
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ];

  const configuration = { iceServers };

  myPeerConnection = new RTCPeerConnection(configuration);

  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("track", handleAddTrack);
  myDataChannel = myPeerConnection.createDataChannel("chat");
}

// --------- Data Channel Code ---------

function addMessage(e) {
  const li = document.createElement("li");
  li.innerHTML = e.data;
  messages.append(li);
}

function addMyMessage(e) {
  const li = document.createElement("li");
  li.innerHTML = e.data;
  li.style.color = "black";
  li.style.background = "#FEE715";
  messages.append(li);
}

function handleChatSubmit(e) {
  e.preventDefault();
  const input = chatForm.querySelector("input");
  if (myDataChannel != null) {
    myDataChannel.send(`${nickname}: ${input.value}`);
  }
  addMyMessage({ data: `You: ${input.value}` });
  input.value = "";
}

chatForm.addEventListener("submit", handleChatSubmit);
