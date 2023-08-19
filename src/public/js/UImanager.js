
const myScreen = document.getElementById("myScreen");
const myVideo = document.getElementById("myVideo");
const cameraSelect = document.getElementById("cameraSelect");
const videoBtn = document.getElementById("video");
const videoBtn1 = document.getElementById("video1");
const audioBtn = document.getElementById("audio");
const screenBtn = document.getElementById("screen");
// const messages = document.getElementById("messages");
// const chatForm = document.getElementById("chat");
// const loginRoom = document.getElementById("loginRoom");
// const loginRoomForm = loginRoom.querySelector("form");
// const callRoom = document.getElementById("callRoom");
// const body = document.getElementById("body");
// const waitRoom = document.getElementById("waitRoom");
// const waitRoomContainer = document.getElementById("waitRoom-container")
// const wait = document.getElementById("wait");
// const userScreen = document.getElementById("userScreen");
// const joinButton = document.getElementById('join-button');
// const roomModal = document.getElementById('roomModal');
// const closeButton = document.querySelector('.close');
// const joinRoomButton = document.getElementById('joinRoomButton');
// const roomInput = document.getElementById('roomInput');
// const modal = document.querySelector('.modal');
// const modalContent = document.querySelector('.modal-content');
// const homeButton = document.getElementById('home');
// const screenStreamContainer = document.querySelector("#screenStream");
// const peerVideo = document.getElementById('peerVideo');
// const header = document.getElementById('header');
// const footer = document.getElementById('footer');
//const cameraIconContainer = document.getElementById('camera-icon-container');

//callRoom is not shown until the user goes into the room
waitRoom.style.display = "none";
callRoom.style.display = "none";
//cameraIconContainer.style.display = 'block';
//variables that is used through out my frontend
let videoStream;
let screenStream;
let muted = false;
let screenoff = false;
let cameraOff = false;
// let roomName;
// let nickname;
// let myPeerConnection;
// let myDataChannel;
// let trackevent;
// let currentFrame;
// let previousFrame = null;
// let intervalId;
// let flagPeer = 0;

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
        width: { ideal: 1765 },
        height: { ideal: 970 }
      }
    });
    trackevent = 2; // letting the backend know that the user opened up camera(video) sharing
    myVideo.srcObject = videoStream;
    console.log(videoStream);
    if (myPeerConnection) {
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
        width: { ideal: 1665}, // 원하는 가로 해상도 설정
        height: { ideal: 970 }  // 원하는 세로 해상도 설정
      }
    });

    myScreen.addEventListener('play', () => {
      intervalId = setInterval(() => {
        if (!myScreen.paused && !myScreen.ended) {
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

  if (!muted) {
    audioBtn.innerText = "🔊";
  } else {
    audioBtn.innerText = "🔇";
  }
  muted = !muted;
}

//function for when the user clicked the camera button, the web will process so that the user's video sharing will be off or on.
async function handleCameraClick() {
  // When opening up the camera sharing for the first time, the app must first get the video.
  if (!videoStream) {
    videoBtn.innerText = "❌";
    await getVideo();
    return;
  }
  if (!cameraOff) {
    videoStream.getTracks().forEach((track) => track.stop());
    myVideo.srcObject = null;
    videoBtn.innerText = "🖵";
    handleCameraChange();
  } else {
    await getVideo();
    videoBtn.innerText = "❌";

  }
  cameraOff = !cameraOff;
}

//function for when the user clicked the screen button, the web will process so that the user's screen sharing will be off or on.
async function handleScreenClick() {
  if (!screenStream) {
    showSharingRoom();
    screenBtn.innerText = "Turn screen off";
    await getScreen();
    return;
  }
  if (!screenoff) {
    screenStream.getTracks().forEach((track) => track.stop());
    myScreen.srcObject = null;
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

//screenBtn.addEventListener("click", handleScreenClick);
videoBtn.addEventListener("click", handleCameraClick);
videoBtn1.addEventListener("click", handleCameraClick);
//screenBtn.addEventListener("click", handleScreenClick);
audioBtn.addEventListener("click", handleAudioClick);