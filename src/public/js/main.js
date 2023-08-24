const socket = io();

//getElement
const myScreen = document.getElementById("myScreen");
const myVideo = document.getElementById("myVideo");
const cameraSelect = document.getElementById("cameraSelect");
const videoBtn = document.getElementById("video");
const callVideoBtn = document.getElementById("callVideo");
const callAudioBtn = document.getElementById("callAudio");
const audioBtn = document.getElementById("audio");
const screenBtn = document.getElementById("callDisplay");
const messages = document.getElementById("messages");
const chatForm = document.getElementById("chat");
const loginRoom = document.getElementById("loginRoom");
const loginRoomForm = loginRoom.querySelector("form");
const callRoom = document.getElementById("callRoom");
const waitRoom = document.getElementById("waitRoom");
const waitRoomContainer = document.getElementById("waitRoom-container")
const wait = document.getElementById("wait");
const userScreen = document.getElementById("userScreen");
const joinButton = document.getElementById('join-button');
const roomModal = document.getElementById('roomModal');
const closeButton = document.querySelector('.close');
const joinRoomButton = document.getElementById('joinRoomButton');
const roomInput = document.getElementById('roomInput');
const modal = document.querySelector('.modal');
const modalContent = document.querySelector('.modal-content');
const homeButton = document.getElementById('home');
const screenStreamContainer = document.querySelector("#screenStream");
const peerVideo = document.getElementById('peerVideo');
const peerScreen = document.getElementById('peerScreen');
const callChatBtn = document.getElementById('callChat');
const chatCloseBtn = document.getElementById('closeChat');
const callPeople = document.getElementById('callPeople');
const disconnectBtn = document.getElementById('disconnect');
const aitranslateBtn = document.getElementById('callAitranslate');
const boundingCanvas = document.getElementById('boundingCanvas');
const context = boundingCanvas.getContext("2d");

callChatBtn.addEventListener("click", () => {
  chatContainer.style.display = "block";
  console.log(chatContainer.style.display);
});

chatCloseBtn.addEventListener("click", () => {
  chatContainer.style.display = "none";
});

let isDragging = false;
let initialX = 0;
let initialY = 0;

chatContainer.addEventListener("mousedown", (e) => {
  if (e.button === 0) { // Check if left mouse button is pressed
    isDragging = true;
    initialX = e.clientX - chatContainer.getBoundingClientRect().left;
    initialY = e.clientY - chatContainer.getBoundingClientRect().top;
  }
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const newX = e.clientX - initialX;
  const newY = e.clientY - initialY;

  chatContainer.style.left = `${newX}px`;
  chatContainer.style.top = `${newY}px`;
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});


//const cameraIconContainer = document.getElementById('camera-icon-container');

//callRoom is not shown until the user goes into the room
waitRoom.style.display = "none";
callRoom.style.display = "none";

//cameraIconContainer.style.display = 'block';
//variables that is used through out my frontend
let videoStream;
let screenStream;
let muted = false;
let screenoff = true;
let cameraOff = true;
let roomName;
let nickname;
let myPeerConnection;
let myDataChannel;
let trackevent = 2;
let peerStream;
let previousFrame = null;
let intervalId;
let participant

// ------------------------function for when the user enterd the room----------------------------
// Function to capture the current frame
aitranslateBtn.addEventListener("click", captureScreen);

function drawText(text, x, y, font, color) {
  context.fillStyle = color;
  context.font = font;
  context.fillText(text, x, y);
}


function captureScreen() {
  if (screenStream) {
    const canvas = document.createElement('canvas');
    canvas.width = myScreen.offsetWidth;
    canvas.height = myScreen.offsetHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(myScreen, 0, 0, canvas.width, canvas.height);
    canvas.style.position = 'absolute';
    canvas.style.left = myScreen.offsetLeft + 'px';
    canvas.style.top = myScreen.offsetTop + 'px';


    const imageBase64 = canvas.toDataURL('image/jpeg');
    const base64Data = imageBase64.split(',')[1];
    const link = document.createElement('a');
    link.href = imageBase64;
    link.download = 'screenshot.jpg';
    link.click();

    // socket.emit('sendImage', { base64Data });

    //  socket.on('imageData', (base64Image) => {
    //   const canvas = document.getElementById('canvas');
    //   const ctx = canvas.getContext('2d');
    //   const img = new Image();

    //   img.onload = () => {
    //     canvas.width = img.width;
    //     canvas.height = img.height;
    //     ctx.drawImage(img, 0, 0);
    //   };

    //   img.src = 'data:image/jpeg;base64,' + base64Image; // Set the image source directly from the base64 data
    // });
  }
}

//function for sharing video
async function getVideo() {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: { ideal: 1765 },
        height: { ideal: 970 }
      }
    });

    trackevent = 2; // letting the backend know that the user opened up camera(video) sharing
    myVideo.srcObject = videoStream;
    console.log(videoStream);
    if (myPeerConnection) {
      console.log("ehck");
      myPeerConnection.addTrack(videoStream.getVideoTracks()[0], videoStream);
      const offer = await myPeerConnection.createOffer();
      await myPeerConnection.setLocalDescription(offer);
      const offerData = {
        offer,
        trackevent
      };
      const offerDataString = JSON.stringify(offerData); // when sending data to the backend, it needs to be in string
      socket.emit("send_media", offerDataString, roomName)
    }
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
        width:   1665 , // 원하는 가로 해상도 설정
        height:  970   // 원하는 세로 해상도 설정
      }
    });
    screenStream.getVideoTracks()[0].applyConstraints({
      width: 1665,
      height: 970
    });


    screenoff = !screenoff;
    myVideo.style.display = "none";
    peerVideo.style.display = "none";
    myScreen.addEventListener('play', () => {
      intervalId = setInterval(() => {
        if (!myScreen.paused && !myScreen.ended) {
          processVideoFrame();
        }
      }, 1000);
    });
    console.log(screenStream.videoWidth); // 비디오 요소의 너비
console.log(screenStream.videoHeight); // 비디오 요소의 높이
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
      context.clearRect(0, 0, boundingCanvas.width, boundingCanvas.height);
      console.log(1); // 차이 감지 시 콘솔에 1 출력
    }
    else {

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
    cameraSelect.removeAttribute("hidden");
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
  const imgElement = document.createElement("img");
  imgElement.width = "40";
  imgElement.height = "40";
  const callImgElement = document.createElement("img");
  callImgElement.width = "40";
  callImgElement.height = "30";

  if (!muted) {
    imgElement.src = "/public/image/speaker.png";
    callImgElement.src = "/public/image/speaker.png";
    audioBtn.innerText = "";
    audioBtn.appendChild(imgElement);
    callAudioBtn.innerText = "";
    callAudioBtn.appendChild(callImgElement);
  } else {
    imgElement.src = "/public/image/mute.png";
    callImgElement.src = "/public/image/mute.png";
    audioBtn.innerText = "";
    audioBtn.appendChild(imgElement);
    callAudioBtn.innerText = "";
    callAudioBtn.appendChild(callImgElement);
  }
  muted = !muted;
}

//function for when the user clicked the camera button, the web will process so that the user's video sharing will be off or on.
async function handleCameraClick() {
  // When opening up the camera sharing for the first time, the app must first get the video.
  const imgElement = document.createElement("img");
  imgElement.width = "40";
  imgElement.height = "40";
  const callImgElement = document.createElement("img");
  callImgElement.width = "40";
  callImgElement.height = "30";

  if (!cameraOff) {
    videoStream.getTracks().forEach((track) => track.stop());
    myVideo.srcObject = null;
    imgElement.src = "/public/image/cameraOff.png";
    callImgElement.src = "/public/image/cameraOff.png";
    videoBtn.innerText = "";
    videoBtn.appendChild(imgElement);
    callVideoBtn.innerText = "";
    callVideoBtn.appendChild(callImgElement);
    handleCameraChange();
  } else {
    await getVideo();
    imgElement.src = "/public/image/cameraOn.png";
    callImgElement.src = "/public/image/cameraOn.png";
    videoBtn.innerText = "";
    videoBtn.appendChild(imgElement);
    callVideoBtn.innerText = "";
    callVideoBtn.appendChild(callImgElement);

  }
  cameraOff = !cameraOff;
}

//function for when the user clicked the screen button, the web will process so that the user's screen sharing will be off or on.
async function handleScreenClick() {
  if (!screenoff) {
    screenStream.getTracks().forEach((track) => track.stop());
    myScreen.srcObject = null;
    if (participant === 1) {
      myVideo.style.display = "flex";
    }
    else if (participant === 2) {
      myVideo.style.display = "flex";
      peerVideo.style.display = "flex";
    }



    screenoff = !screenoff;
    handleScreenChange();
  }
  else if (screenoff) {
    getScreen();
  }
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
  trackevent = 3;
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
callVideoBtn.addEventListener("click", handleCameraClick);
//screenBtn.addEventListener("click", handleScreenClick);
audioBtn.addEventListener("click", handleAudioClick);
callAudioBtn.addEventListener("click", handleAudioClick);
//cameraSelect.addEventListener("change", handleCameraChange);

// --------------- wait room form (choose and enter a room) -----------------

async function showRoom() {
  wait.style.display = "none";
  loginRoom.style.display = "none";
  waitRoom.style.display = "none";
  waitRoomContainer.style.display = "none";
  callRoom.style.display = "flex";
  screenStreamContainer.appendChild(myVideo);


}


function showSharingRoom() {
  wait.style.display = "none";
  loginRoom.style.display = "none";
  waitRoom.style.display = "flex";
}

async function handleRoomSubmit(e) {
  e.preventDefault();
  //make connection to peer. using ice candidate. look at initCall for more detail
  //setting nickname
  const nicknameInput = loginRoom.querySelector("#nickname");
  //entering chatting room
  //const roomNameInput = loginRoom.querySelector("#roomName");
  //socket.emit("enter_room", roomNameInput.value, showRoom);

  //roomName = roomNameInput.value;
  nickname = nicknameInput.value;
  showSharingRoom();
}

async function initCall() {
  makeConnection();
}

async function handleRoom(e) {
  e.preventDefault();
  await initCall();
  const roomNameInput = modal.querySelector("#roomName");
  console.log(roomNameInput);
  if (videoStream) {
    console.log("hi");
    myPeerConnection.addTrack(videoStream.getVideoTracks()[0], videoStream);
    const offer = myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    const offerData = {
      offer,
      trackevent
    };
    const offerDataString = JSON.stringify(offerData); // when sending data to the backend, it needs to be in string
    socket.emit("send_media", offerDataString, roomName)
  }
  if (roomNameInput.value === '') {
    // Input is empty, show an error message or handle accordingly
    console.log('Please enter a room name');
  }
  else {
    socket.emit("set_nickname", nickname);
    socket.emit("enter_room", roomNameInput.value, showRoom);
    roomName = roomNameInput.value;
  }
}

joinRoomButton.addEventListener('click', handleRoom);
loginRoomForm.addEventListener("submit", handleRoomSubmit);

// --------------------------- Socket Code ------------------------------------------

//when entering room, my server.js  will emit welcome, and it will enter this socket. Welcome socket will make data channel, and opens up my dataChannel.
socket.on("welcome", async () => {
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", addMessage);

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

socket.on("receive_event", async (event) => {
  myPeerConnection.addEventListener("datachannel", (e) => {
    myDataChannel = e.channel;
    myDataChannel.addEventListener("message", addMessage);
  });
});


socket.on("receive_ice", (ice) => {
  myPeerConnection.addIceCandidate(ice);

});

socket.on("participant_count", (participantCount) => {
  const imgElement = document.createElement("img");
  imgElement.width = "20";
  imgElement.height = "20";
  imgElement.src = "/public/image/human.png";
  const numberElement = document.createElement("span");
  numberElement.style.whiteSpace = "pre";
  numberElement.textContent = "  " + participantCount; // 추가할 숫자 설정
  callPeople.innerText = "";
  callPeople.appendChild(imgElement);
  callPeople.appendChild(numberElement);
  participant = participantCount;
  if (participantCount === 1) {
    myVideo.style.width = "90vw";  // Set the desired width
    myVideo.style.height = "75vh";
    myVideo.style.top = "10vh"; // 화면 높이의 10% 위치에 위치
    myVideo.style.left = "5vw"; // 화면 너비의 20% 위치에 위치
    myVideo.style.borderRadius = "10px";
    peerVideo.style.display = "none";

  }
  else if (participantCount === 2) {
    myVideo.style.width = "40vw";  // Set the desired width
    myVideo.style.height = "75vh";
    myVideo.style.top = "10vh";
    myVideo.style.left = "5vw";         // Set the desired top position
    myVideo.style.borderRadius = "10px";
    peerVideo.style.display = "flex";
  }

})

// --------------------------------------- RTC Code -------------------------------------------

function handleIce(data) {
  console.log(data);
  socket.emit("send_ice", data.candidate, roomName);
}

function handleAddTrack(event) {
  //Because trackevent value has changed when sending and receiving sockets, when handling add track, my program knows the changed value of
  //trackevent. Thus, my web will be able to know where to put the video.
  //This coding all happened because screen sharing and video sharing track event kind is all video. If it was different I could have used
  //if function so that if track event is video put peerVideo, and use else functon if other track event kind came in. But there was no other way
  //to differeniate these two kinds. So I made trackevent variables and used it as a flag.
  console.log("trackevent", trackevent);
  if (trackevent === 1) {
    peerStream = new MediaStream([event.track]);
    peerScreen.srcObject = peerStream;
    myVideo.style.display = "none";
    peerVideo.style.display = "none";
  }
  else if (trackevent === 2) {
    console.log("wihy");
    peerStream = new MediaStream([event.track]);
    peerVideo.srcObject = peerStream;
  }
  else if (trackevent === 3) {
    peerStream = new MediaStream([event.track]);
    peerScreen.srcObject = peerStream;
    myVideo.style.display = "flex";
    peerVideo.style.display = "flex";
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
  li.style.background = "#D3C9B5";
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



joinButton.addEventListener('click', () => {
  modal.style.display = 'block';
});

closeButton.addEventListener('click', () => {
  const room = modalContent.querySelector('#roomName');
  modal.style.display = 'none';
  room.value = "";
  room.placeholder = "회의 ID 혹은 초대 링크";
});


modal.addEventListener('click', function (event) {
  // Check if the clicked element is the modal itself (or its content)
  if (event.target === modal || event.target === modalContent) {
    // Clicking inside the modal should not do anything
    event.preventDefault();
    event.stopPropagation();
  }
});

homeButton.addEventListener('click', () => {
  window.location.href = 'http://localhost:3000/'; // Replace with your actual home page URL
});

disconnectBtn.addEventListener('click', () => {
  window.location.href = 'http://localhost:3000/'; // Replace with your actual home page URL
});
