const socket = io();

//getElement
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


//callRoom is not shown until the user goes into the room
callRoom.style.display = "none";

//variables that is used through out my frontend
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
let currentFrame;
let previousFrame = null;
let intervalId;

// ------------------------function for when the user enterd the room----------------------------
// Function to capture the current frame
function captureCurrentFrame(videoElement) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  console.log(videoElement.videoWidth, videoElement.videoHeight);
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  const frameData = context.getImageData(0, 0, canvas.width, canvas.height);
  currentFrame = cv.matFromImageData(frameData); // Assign the current frame

  
  console.log(currentFrame);
  currentFrame.delete(); // Make sure to delete the frame to free memory

  // Continue processing or capturing the frame as needed
}


//function for sharing video
async function getVideo() {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: 640,
        height: 480
      }
    });
    trackevent = 2; // letting the backend know that the user opened up camera(video) sharing
    myVideo.srcObject = videoStream;
    myPeerConnection.addTrack(videoStream.getVideoTracks()[0], videoStream);
    const offer = await myPeerConnection.createOffer();
    await myPeerConnection.setLocalDescription(offer);
    const offerData = {
      offer,
      trackevent
    };
    const offerDataString = JSON.stringify(offerData); // when sending data to the backend, it needs to be in string
    socket.emit("send_media", offerDataString, roomName)
    await getCamera();
  } catch (e) {
    console.log(e);
  }
}

//function for sharng screen
async function getScreen() {
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: {
        width: { ideal: 1280 }, // 원하는 가로 해상도 설정
        height: { ideal: 720 }  // 원하는 세로 해상도 설정
      }
    });
    
    myScreen.addEventListener('play', () => {
      intervalId = setInterval(() => {
        if(!myScreen.paused && !myScreen.ended){
          processVideoFrame();
        }
      }, 1000);
    });

    trackevent = 1; // letthing the backend know that the user opened up screen sharing
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

function processVideoFrame() {
  const canvas = document.getElementById("myCanvas");
  const ctx = canvas.getContext('2d');
  canvas.willReadFrequently = true;
  canvas.width = myScreen.videoWidth;
  canvas.height = myScreen.videoHeight;
  canvas.hidden = true;
  ctx.drawImage(myScreen, 0, 0, canvas.width, canvas.height);
  
  const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  if (previousFrame) {
    const diffThreshold = 5; // 임계값 설정
    let totalDiff = 0;

    for (let i = 0; i < currentFrame.length; i += 4) {
      const diff = Math.abs(currentFrame[i] - previousFrame[i]);
      totalDiff += diff;
    }

    const averageDiff = totalDiff / (currentFrame.length / 4);

    if (averageDiff > diffThreshold) {
      console.log(1); // 차이 감지 시 콘솔에 1 출력
    }
    else{
      
    }
  }

  previousFrame = currentFrame.slice();
}

//function for allowing the user to change camera in their device.
//For example back camera or front camera
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

//function for when the user clicked the mute button, the web will process so that the user's voice will be muted or not.
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

//function for when the user clicked the camera button, the web will process so that the user's video sharing will be off or on.
async function handleCameraClick() {
  // When opening up the camera sharing for the first time, the app must first get the video.
  if (!videoStream) {
    videoBtn.innerText = "Turn Camera off";
    await getVideo();
    return;
  }
  if (!cameraOff) {
    videoStream.getTracks().forEach((track) => track.stop());
    videoBtn.innerText = "Turn Camera on";
    handleCameraChange();
  } else {
    await getVideo();
    videoBtn.innerText = "Turn Camera off";

  }
  cameraOff = !cameraOff;
}

//function for when the user clicked the screen button, the web will process so that the user's screen sharing will be off or on.
async function handleScreenClick() {
  if (!screenStream) {
    screenBtn.innerText = "Turn screen off";
    await getScreen();
    return;
  }
  if (!screenoff) {
    screenStream.getTracks().forEach((track) => track.stop());
    screenBtn.innerText = "Turn screen on";
    handleScreenChange();
  }
  else if (screenoff) {
    await getScreen();
    screenBtn.innerText = "Turn screen off";
  }
  screenoff = !screenoff;
}

//function for when the user clicked the camera on and off button, the peer should know that and turn the video sharing off.
//So this function sends that the camera has changed. 
//The problem when just making the video off is that the screen does not go black as I assumed for the peer. Instead, for the peer the screen just stops whenever
//the user stops their video sharing. So in order to fix this problem, I made a white canvas and switched the video for the peer anytime the video is turned off.
async function handleCameraChange() {
  if (!myPeerConnection) return; // when there is no myPeerConnection, this function should not happen.
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

//same function as handleCameraChange()
async function handleScreenChange() {
  if (!myPeerConnection) return;
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
  clearInterval(intervalId);
}

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

// Scroll to the bottom of the messages container
function scrollToBottom() {
  messages.scrollTop = messages.scrollHeight;
}

screenBtn.addEventListener("click", handleScreenClick);
videoBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("change", handleCameraChange);

// --------------- wait room form (choose and enter a room) -----------------

function showRoom() {
  waitRoom.style.display = "none";
  callRoom.hidden = false;
  callRoom.style.display = "flex";
}

async function handleRoomSubmit(e) {
  e.preventDefault();
  //make connection to peer. using ice candidate. look at initCall for more detail
  await initCall();
  //setting nickname
  const nicknameInput = waitRoom.querySelector("#nickname");
  socket.emit("set_nickname", nicknameInput.value);
  //entering chatting room
  const roomNameInput = waitRoom.querySelector("#roomName");
  socket.emit("enter_room", roomNameInput.value, showRoom);

  roomName = roomNameInput.value;
  nickname = nicknameInput.value;
}

async function initCall() {
  makeConnection();
}

waitRoomForm.addEventListener("submit", handleRoomSubmit);

// --------------------------- Socket Code ------------------------------------------

//when entering room, my server.js  will emit welcome, and it will enter this socket. Welcome socket will make data channel, and opens up my dataChannel.
socket.on("welcome", async () => {
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", addMessage);
  myDataChannel.addEventListener("open", () => {
    console.log("Data channel is open and ready to send/receive data");
  });

  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("send_offer", offer, roomName);
});

socket.on("receive_offer", async (offer) => {
  myPeerConnection.addEventListener("datachannel", (e) => {
    myDataChannel = e.channel;
    console.log(myDataChannel);
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
  myPeerConnection.addEventListener("datachannel", (e) => {
    myDataChannel = e.channel;
    myDataChannel.addEventListener("message", addMessage);
  });
  //this is getting the offerdata from the media handling section. Since I got two datas, event and trackevent, my frontend should be able to parse these two data.
  const offerData = JSON.parse(offerDataString);
  const offer = offerData.offer;
  trackevent = offerData.trackevent;

  myPeerConnection.setRemoteDescription(offer);
  // getMedia
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("send_answer", answer, roomName);
});

socket.on("receive_ice", (ice) => {
  myPeerConnection.addIceCandidate(ice);
});

// --------------------------------------- RTC Code -------------------------------------------

function handleIce(data) {
  socket.emit("send_ice", data.candidate, roomName);
}

function handleAddTrack(event) {
  //Because trackevent value has changed when sending and receiving sockets, when handling add track, my program knows the changed value of
  //trackevent. Thus, my web will be able to know where to put the video.
  //This coding all happened because screen sharing and video sharing track event kind is all video. If it was different I could have used
  //if function so that if track event is video put peerVideo, and use else functon if other track event kind came in. But there was no other way
  //to differeniate these two kinds. So I made trackevent variables and used it as a flag.
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
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.relay.metered.ca:80",
      },
      {
        urls: "turn:a.relay.metered.ca:80",
        username: "dbea1dda7e80fffd5e3810d5",
        credential: "TmKDa1kTOtEcN/BG",
      },
      {
        urls: "turn:a.relay.metered.ca:80?transport=tcp",
        username: "dbea1dda7e80fffd5e3810d5",
        credential: "TmKDa1kTOtEcN/BG",
      },
      {
        urls: "turn:a.relay.metered.ca:443",
        username: "dbea1dda7e80fffd5e3810d5",
        credential: "TmKDa1kTOtEcN/BG",
      },
      {
        urls: "turn:a.relay.metered.ca:443?transport=tcp",
        username: "dbea1dda7e80fffd5e3810d5",
        credential: "TmKDa1kTOtEcN/BG",
      },
    ],
  });
  //add ice candiate. Make connection between two peers
  myPeerConnection.addEventListener("icecandidate", handleIce);
  //add track to stream my videos and screens
  myPeerConnection.addEventListener("track", handleAddTrack);
}

// ----------------------------------- Chatting Area ---------------------------------------------------

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
  scrollToBottom();
}

chatForm.addEventListener("submit", handleChatSubmit);
