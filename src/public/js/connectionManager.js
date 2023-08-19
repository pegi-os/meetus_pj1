// ConnectionManager.js
class ConnectionManager {
    constructor(socket) {
        this.socket = socket;
        this.myPeerConnection = null;
        this.myDataChannel = null;
        this.trackevent = null;
        // Initialize other connection-related properties...
        this.wait = document.getElementById("wait");
        this.loginRoom = document.getElementById("loginRoom");
        this.waitRoom = document.getElementById("waitRoom");
        this.waitRoomContainer = document.getElementById("waitRoom-container");
        this.callRoom = document.getElementById("callRoom");
        this.myVideo = document.getElementById("myVideo");
        this.peerScreen = document.getElementById("peerScreen");
        this.peerVideo = document.getElementById("peerVideo");
        this.modal = document.querySelector(".modal");
        this.modalContent = document.querySelector('.modal-content');
        this.body = document.getElementById("body");
        this.joinButton = document.getElementById('join-button');
        this.closeButton = document.querySelector('.close');
        this.joinRoomButton = document.getElementById('joinRoomButton');
        this.homeButton = document.getElementById('home');
        this.screenStreamContainer = document.querySelector("#screenStream");
        this.setupEventListeners();

    }
    async handleWelcome() {
        myDataChannel = myPeerConnection.createDataChannel("chat");
        myDataChannel.addEventListener("message", addMessage);
        console.log(myDataChannel);

        const offer = await myPeerConnection.createOffer();
        myPeerConnection.setLocalDescription(offer);
        socket.emit("send_offer", offer, roomName);
    }

    async handleReceiveOffer(offer) {
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
    }

    handleReceiveAnswer(answer) {
        myPeerConnection.setRemoteDescription(answer);
    }

    async handleReceiveMedia(offerDataString) {
        myPeerConnection.addEventListener("datachannel", (e) => {
            myDataChannel = e.channel;
            myDataChannel.addEventListener("message", addMessage);
        });

        // Parse offer data
        const offerData = JSON.parse(offerDataString);
        const offer = offerData.offer;
        trackevent = offerData.trackevent;

        myPeerConnection.setRemoteDescription(offer);
        // getMedia
        const answer = await myPeerConnection.createAnswer();
        myPeerConnection.setLocalDescription(answer);
        socket.emit("send_answer", answer, roomName);
    }

    handleReceiveIce(ice) {
        myPeerConnection.addIceCandidate(ice);
    }

    handleParticipantCount(participantCount) {
        console.log(participantCount);
        if (participantCount === 1) {
            myVideo.style.width = "90vw"; // Set the desired width
            myVideo.style.height = "75vh";
            myVideo.style.top = "120px"; // Set the desired top position
            myVideo.style.borderRadius = "10px";
            peerVideo.style.display = "none";
        } else if (participantCount === 2) {
            myVideo.style.width = "40vw"; // Set the desired width
            myVideo.style.height = "75vh";
            myVideo.style.top = "120px"; // Set the desired top position
            myVideo.style.borderRadius = "10px";
            peerVideo.style.display = "flex";
        }
    }

    setupEventListeners() {
        this.loginRoomForm.addEventListener("submit", this.handleRoomSubmit());
        this.joinButton.addEventListener('click', this.newRoomInvitation());
        this.joinRoomButton.addEventListener('click', this.handleRoom());
        this.closeButton.addEventListener('click', this.closeRoomInvitation());
        this.modal.addEventListener('click', this.blockClick());
        this.homeButton.addEventListener('click', this.goBackHome());
        this.loginRoomForm.addEventListener("submit", this.handleRoomSubmit());
        // Add more event listeners...
    }

    async showRoom() {
        wait.style.display = "none";
        loginRoom.style.display = "none";
        waitRoom.style.display = "none";
        waitRoomContainer.style.display = "none";
        callRoom.style.display = "flex";
        screenStreamContainer.appendChild(myVideo);
        if (myPeerConnection && videoStream) {
            trackevent = 2;
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
    }


    showSharingRoom() {
        wait.style.display = "none";
        loginRoom.style.display = "none";
        waitRoom.style.display = "flex";
    }

    async handleRoomSubmit(e) {
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

    async initCall() {
        makeConnection();
    }

    async handleRoom(e) {
        e.preventDefault();
        await initCall();
        const roomNameInput = modal.querySelector("#roomName");
        console.log(roomNameInput);
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


    handleIce(data) {
        console.log(data);
        socket.emit("send_ice", data.candidate, roomName);
    }

    handleAddTrack(event) {
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

    makeConnection() {
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

        // Define other connection-related methods...
    }


    newRoomInvitation() {
        modal.style.display = 'block';
    }

    closeRoomInvitation() {
        const room = modalContent.querySelector('#roomName');
        modal.style.display = 'none';
        room.value = "";
        room.placeholder = "회의 ID 혹은 초대 링크";
    }

    blockClick(e) {
        // Check if the clicked element is the modal itself (or its content)
        if (e.target === modal || e.target === modalContent) {
            // Clicking inside the modal should not do anything
            e.preventDefault();
            e.stopPropagation();
        }
    }

    goBackHome() {
        window.location.href = 'http://localhost:3000/'; // Replace with your actual home page URL
    }
}

