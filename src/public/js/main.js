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
const aitranslateBtn = document.querySelector('callAitranslate');
const boundingCanvas = document.getElementById('boundingCanvas');
const context = boundingCanvas.getContext("2d");
const menu = document.getElementById("dropup-content");
const korean = document.getElementById("korean");
const english = document.getElementById("english");
const japanese = document.getElementById("japanese");
const textOverlay = document.getElementById("textOverlay");
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext('2d');
myScreen.style.width = '70vw';
myScreen.style.left = '15vw';

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
let participant;
let isDragging = false;
let initialX = 0;
let initialY = 0;
let base64Data = null;
let flagLanguage;
let checkStatusTranslate = 0;
let checkOtherTranslate;
// ------------------------function for when the user enterd the room----------------------------
// Function to capture the current frame
// aitranslateBtn.addEventListener("click", captureScreen);
// var dropupButton = document.querySelector("#callAitranslate");
// var dropupContent = document.querySelector("#dropup-content");

// dropupButton.addEventListener("click", function() {
//     console.log("hi");
//     dropupContent.classList.toggle("active");
// });

function eraseAll() {
  while (textOverlay.firstChild) {
    textOverlay.removeChild(textOverlay.firstChild);
  }
}


document.getElementById("callAitranslate").addEventListener("click", function () {
  menu.style.display = menu.style.display === "block" ? "none" : "block";

});

korean.addEventListener("click", () => {
  menu.style.display = menu.style.display === "block" ? "none" : "block";
  flagLanguage = "cluster-korean";

  // if (checkStatusTranslate === 0 || checkOtherTranslate !== "korean") {
  //   korean.style.color = "#FF00CC";
  //   japanese.style.color = "black";
  //   english.style.color = "black";
  //   checkStatusTranslate = 1;
  //   checkOtherTranslate = "korean";
  //   context.clearRect(0, 0, boundingCanvas.width, boundingCanvas.height);
  //   // eraseAll();
  //   captureScreen();
  // }
  // else if (checkStatusTranslate === 1) {
  //   clearInterval(intervalId);
  //   context.clearRect(0, 0, boundingCanvas.width, boundingCanvas.height);
  //   // eraseAll();
  //   korean.style.color = "black";
  //   checkStatusTranslate = 0;
  // }

});

english.addEventListener("click", () => {
  menu.style.display = menu.style.display === "block" ? "none" : "block";
  flagLanguage = "cluster-english";

  if (checkStatusTranslate === 0 || checkOtherTranslate !== "english") {
    english.style.color = "#FF00CC";
    japanese.style.color = "black";
    korean.style.color = "black";
    checkStatusTranslate = 1;
    checkOtherTranslate = "english";
    context.clearRect(0, 0, boundingCanvas.width, boundingCanvas.height);
    // eraseAll();
    captureScreen();
  }
  else if (checkStatusTranslate === 1) {
    clearInterval(intervalId);
    context.clearRect(0, 0, boundingCanvas.width, boundingCanvas.height);
    // eraseAll();
    english.style.color = "black";
    checkStatusTranslate = 0;
  }
});


japanese.addEventListener("click", () => {
  menu.style.display = menu.style.display === "block" ? "none" : "block";
  flagLanguage = "cluster-japan";

  if (checkStatusTranslate === 0 || checkOtherTranslate !== "japanese") {
    japanese.style.color = "#FF00CC";
    english.style.color = "black";
    korean.style.color = "black";
    checkStatusTranslate = 1;
    checkOtherTranslate = "japanese";
    context.clearRect(0, 0, boundingCanvas.width, boundingCanvas.height);
    // eraseAll();
    captureScreen();
  }
  else if (checkStatusTranslate === 1) {
    clearInterval(intervalId);
    context.clearRect(0, 0, boundingCanvas.width, boundingCanvas.height);
    // eraseAll();
    japanese.style.color = "black";
    checkStatusTranslate = 0;
  }
});


async function captureScreen() {
  console.log(myScreen.style.display);
  console.log(peerScreen.style.display);
  if (screenStream) {
    console.log("hi");
    intervalId = setInterval(() => {
      if (!myScreen.paused && !myScreen.ended) {
        processVideoFrameMyVideo();
      }
    }, 1000);
    const canvas = document.createElement('canvas');
    canvas.width = myScreen.offsetWidth;
    canvas.height = myScreen.offsetHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(myScreen, 0, 0, canvas.width, canvas.height);
    canvas.style.position = 'absolute';
    canvas.style.zIndex = '10';
    canvas.style.left = myScreen.offsetLeft + 'px';
    canvas.style.top = myScreen.offsetTop + 'px';


    const base64Canvas = canvas.toDataURL("image/jpeg");
    base64Data = base64Canvas.split(',')[1];
    // const link = document.createElement('a');
    // link.href = base64Canvas;
    // link.download = 'screenshot.jpg';
    // link.click();
    socket.emit('sendImage', base64Data, flagLanguage, nickname);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  else if (peerScreen.style.display !== "none") {

    intervalId = setInterval(() => {
      if (!peerScreen.paused && !peerScreen.ended) {
        processVideoFramePeerVideo();
        console.log("hi");
      }
    }, 1000);
    const canvas = document.createElement('canvas');
    canvas.width = peerScreen.offsetWidth;
    canvas.height = peerScreen.offsetHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(peerScreen, 0, 0, canvas.width, canvas.height);
    canvas.style.position = 'absolute';
    canvas.style.left = peerScreen.offsetLeft + 'px';
    canvas.style.top = peerScreen.offsetTop + 'px';

    const base64Canvas = canvas.toDataURL("image/jpeg");
    base64Data = base64Canvas.split(',')[1];

    socket.emit('sendImage', base64Data, flagLanguage, nickname);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  else {
    japanese.style.color = "black"
    english.style.color = "black"
    korean.style.color = "black"
    alert("화면 공유된 자료가 없습니다.");
    checkStatusTranslate = 0;
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


    if (myPeerConnection) {
      myPeerConnection.addTrack(videoStream.getVideoTracks()[0], videoStream);
      const offer = await myPeerConnection.createOffer();
      await myPeerConnection.setLocalDescription(offer);
      console.log(offer);
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
      video: true
    });
    screenStream.getVideoTracks()[0].applyConstraints({
      width: 1665,
      height: 970
    });

    canvas.willReadFrequently = true;
    canvas.width = myScreen.offsetWidth;
    canvas.height = myScreen.offsetHeight;
    canvas.hidden = true;
    canvas.style.left = myScreen.offsetLeft + 'px';
    canvas.style.top = myScreen.offsetTop + 'px';

    screenoff = !screenoff;
    // myVideo.style.display = "none";
    peerVideo.style.display = "none";

    myScreen.style.width = '70vw';
    myScreen.style.left = '15vw';
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





function processVideoFrameMyVideo() {

  ctx.drawImage(myScreen, 0, 0, canvas.width, canvas.height);
  canvas.style.zIndex = '10';
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
      console.log(1);
      context.clearRect(0, 0, boundingCanvas.width, boundingCanvas.height);
      if (base64Data) {
        const canvas = document.createElement('canvas');
        canvas.width = myScreen.offsetWidth;
        canvas.height = myScreen.offsetHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(myScreen, 0, 0, canvas.width, canvas.height);
        canvas.style.position = 'absolute';
        canvas.style.left = myScreen.offsetLeft + 'px';
        canvas.style.top = myScreen.offsetTop + 'px';

        const base64Canvas = canvas.toDataURL("image/jpeg");
        base64Data = base64Canvas.split(',')[1];
        // const link = document.createElement('a');
        // link.href = base64Canvas;
        // link.download = 'screenshot.jpg';
        // link.click();
        socket.emit('sendImage', base64Data, flagLanguage, nickname);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        context.clearRect(0, 0, boundingCanvas.width, boundingCanvas.height);
        // eraseAll();
      }
      previousFrame = currentFrame;
    }
  }

  previousFrame = currentFrame.slice();
}


function processVideoFramePeerVideo() {

  ctx.drawImage(peerScreen, 0, 0, canvas.width, canvas.height);
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
      console.log(1);
      context.clearRect(0, 0, boundingCanvas.width, boundingCanvas.height);
      // ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (base64Data) {
        const canvas = document.createElement('canvas');
        canvas.width = myScreen.offsetWidth;
        canvas.height = myScreen.offsetHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(peerScreen, 0, 0, canvas.width, canvas.height);
        canvas.style.position = 'absolute';
        canvas.style.left = myScreen.offsetLeft + 'px';
        canvas.style.top = myScreen.offsetTop + 'px';

        const base64Canvas = canvas.toDataURL("image/jpeg");
        base64Data = base64Canvas.split(',')[1];
        socket.emit('sendImage', base64Data, flagLanguage, nickname);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        context.clearRect(0, 0, boundingCanvas.width, boundingCanvas.height);
        // eraseAll();
      }
      previousFrame = currentFrame;
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
    clearInterval(intervalId);
    context.clearRect(0, 0, boundingCanvas.width, boundingCanvas.height);
    // eraseAll();
    korean.style.color = "black";
    english.style.color = "black";
    japanese.style.color = "black";
  

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


screenBtn.addEventListener("click", handleScreenClick);
videoBtn.addEventListener("click", handleCameraClick);
callVideoBtn.addEventListener("click", handleCameraClick);
audioBtn.addEventListener("click", handleAudioClick);
callAudioBtn.addEventListener("click", handleAudioClick);

// --------------------------- Socket Code ------------------------------------------

//when entering room, my server.js  will emit welcome, and it will enter this socket. Welcome socket will make data channel, and opens up my dataChannel.
socket.on("welcome", async () => {
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", addMessage);

  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("send_offer", offer, roomName);
});

function decimalToHex(decimalNumber) {
  return decimalNumber.toString(16).toUpperCase();
}


socket.on("imageData", (data) => {
  const jsonData = JSON.parse(data);

  boundingCanvas.width = myScreen.offsetWidth;
  boundingCanvas.height = myScreen.offsetHeight;

  boundingCanvas.style.position = 'absolute';
  boundingCanvas.style.left = myScreen.offsetLeft + 'px';
  boundingCanvas.style.top = myScreen.offsetTop + 'px';

  textOverlay.style.width = myScreen.offsetWidth + 'px';
  textOverlay.style.height = myScreen.offsetHeight + 'px';
  textOverlay.style.left = myScreen.offsetLeft + 'px';
  textOverlay.style.top = myScreen.offsetTop + 'px';
  let firstx;
  let secondx;
  let firsty;
  let secondy;


  jsonData.forEach(jsonString => {
    const obj = JSON.parse(jsonString);
    const boxes = obj.boxes;
    console.log(boxes);


    context.lineWidth = 2; // 상자 테두리 두께
    let flag = 0;

    boxes.forEach(box => {
      const x = box[0] * boundingCanvas.width;
      const y = box[1] * boundingCanvas.height;

      const text = obj.text;
      const colorArray = obj.background_color;
      var red = colorArray[0];
      var green = colorArray[1];
      var blue = colorArray[2];
      var rgbColor = "rgb(" + red + ", " + green + ", " + blue + ")";
      context.strokeStyle = rgbColor; // 상자의 테두리 색상
      context.fillStyle = rgbColor; // 글자 색상

     
      flag = flag + 1;
      // // 상자 그리기
      if (flag === 1) {
        context.beginPath();
        firstx = x;
        firsty = y;
      }
      else if (flag === 2) {
        secondx = x;
      }
      else if (flag === 3) {
        secondy = y;
      }
      context.lineTo(x, y);
      if (flag === 4) {
        const colorText = obj.text_color;
        var red = colorText[0];
        var green = colorText[1];
        var blue = colorText[2];
        var rgbColor = "rgb(" + red + ", " + green + ", " + blue + ")";
        context.stroke();
        context.closePath();
        context.fill(); // 영역 색칠
        context.fillStyle = rgbColor; // 텍스트 색상을 검정색으로 변경

        const fontSize = Math.min(secondx - firstx, secondy - firsty) * 0.7;
        console.log(secondx - firstx); // 예시로 폰트 크기를 상자의 절반으로 설정
        context.font = `${fontSize}px Arial`;
        context.fillText(text, x, y - 5);
        // const overlayText = document.createElement("div");
        // overlayText.textContent = text;
        // overlayText.style.position = "absolute";
        // overlayText.style.left = x + 'px';
        // overlayText.style.top = ((secondy + firsty) / 2) + 'px';

        // overlayText.style.color = "black";
        // overlayText.style.font = `${fontSize}px Arial`;
        // overlayText.style.zIndex = "5";
        // textOverlay.appendChild(overlayText);
      }

    });
  });
  boundingCanvas.style.zIndex = '2';
  boundingCanvas.style.display = "flex";
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
  console.log("hi333");
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
    myVideo.style.width = "20vw";  // Set the desired width
    myVideo.style.height = "20vh";
    myVideo.style.top = "35vh"; // 화면 높이의 10% 위치에 위치
    myVideo.style.left = "75vw"; // 화면 너비의 20% 위치에 위치
    myVideo.style.borderRadius = "10px";
    peerVideo.style.display = "none";

  }
  else if (participantCount === 2) {
    myVideo.style.width = "20vw";  // Set the desired width
    myVideo.style.height = "20vh";
    myVideo.style.top = "35vh"; // 화면 높이의 10% 위치에 위치
    myVideo.style.left = "75vw"; // 화면 너비의 20% 위치에 위치
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
    peerScreen.style.width = '70vw';
    peerScreen.style.left = '15vw';
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
    peerScreen.style.width = '70vw';
    peerScreen.style.left = '15vw';
    peerStream = new MediaStream([event.track]);
    peerScreen.srcObject = peerStream;
    myVideo.style.display = "flex";
    peerVideo.style.display = "flex";
    context.clearRect(0, 0, boundingCanvas.width, boundingCanvas.height);
    // eraseAll();
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

// --------------- wait room form (choose and enter a room) -----------------

/* wait room function part */

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
  nickname = nicknameInput.value;
  console.log(nickname);
  showSharingRoom();
}


async function handleRoom(e) {
  e.preventDefault();
  await makeConnection();
  const roomNameInput = modal.querySelector("#roomName");
  roomName = roomNameInput.value;
  console.log(roomName);
  if (videoStream) {
    console.log("hi");
    myPeerConnection.addTrack(videoStream.getVideoTracks()[0], videoStream);
    const offer = await myPeerConnection.createOffer();

    await myPeerConnection.setLocalDescription(offer);
    console.log(offer);
    console.log(trackevent);
    console.log(roomName);
    const offerData = {
      offer,
      trackevent
    };
    const offerDataString = JSON.stringify(offerData); // when sending data to the backend, it needs to be in string
    await socket.emit("send_media", offerDataString, roomName);
  }
  if (roomNameInput.value === '') {
    // Input is empty, show an error message or handle accordingly
    alert('Please enter a room name');
  }
  else {
    socket.emit("set_nickname", nickname);
    socket.emit("enter_room", roomName, showRoom);
  }
}

/* wait room event part */

joinRoomButton.addEventListener('click', handleRoom);
loginRoomForm.addEventListener("submit", handleRoomSubmit);


// ----------------------------------- Chatting Area ---------------------------------------------------

/* chat room function part */

function addMessage(e) {
  const li = document.createElement("li");
  li.innerHTML = e.data;
  messages.append(li);
}

function addMyMessage(e) {
  const li = document.createElement("li");
  li.innerHTML = e.data;
  
  messages.append(li);
}

function handleChatSubmit(e) {
  e.preventDefault();
  const input = chatForm.querySelector("textarea");
  if (myDataChannel != null) {
    myDataChannel.send(`${nickname}: ${input.value}`);
  }
  addMyMessage({ data: `You: ${input.value}` });
  input.value = "";
  scrollToBottom();
}
// Scroll to the bottom of the messages container
function scrollToBottom() {
  messages.scrollTop = messages.scrollHeight;
}

/* chat room event part */

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


callChatBtn.addEventListener("click", () => {

  chatContainer.style.display = chatContainer.style.display === "block" ? "none" : "block";

});

chatCloseBtn.addEventListener("click", () => {
  chatContainer.style.display = "none";
});


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

const listItems = document.querySelectorAll('#messages > li');
listItems.forEach(item => {
  item.style.height = 'auto'; // Reset the height to auto initially
  const itemHeight = item.clientHeight;
  item.style.height = itemHeight + 'px';
});

