// ==========================================
// MIRACULOUS CLASH - MULTIPLAYER
// ==========================================

const socket = io();

let currentRoom = null;
let isHost = false;

// Player information
const username = localStorage.getItem("playerName") || "Player";
const avatar = localStorage.getItem("playerAvatar") || "";

// HTML elements
const roomIdInput = document.getElementById("roomIdInput");
const copyRoomBtn = document.getElementById("copyRoomBtn");
const cancelRoomBtn = document.getElementById("cancelRoomBtn");

const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");

const roomActions = document.getElementById("roomActions");
const roomSection = document.getElementById("roomSection");

const roomIdDisplay = document.getElementById("roomIdDisplay");
const playersList = document.getElementById("playersList");
const roomStatus = document.getElementById("roomStatus");

const readyBtn = document.getElementById("readyBtn");
const startBtn = document.getElementById("startBtn");
const backBtn = document.getElementById("backBtn");
const ROOM_STORAGE_KEY = "multiplayerRoomId";
const PLAYER_TOKEN_STORAGE_KEY = "multiplayerPlayerToken";



// BACK BUTTON
backBtn.onclick = () => {
    backBtn.disabled = true;
    multiplayerSession.leave(socket, response => {
        backBtn.disabled = false;
        if (!response?.success) {
            alert(response?.message || "Unable to leave the multiplayer room.");
            return;
        }

        resetRoomScreen();
        goTo("play.html");
    });
};

function saveRoomSession(response) {
    currentRoom = response.roomId;
    sessionStorage.setItem(ROOM_STORAGE_KEY, response.roomId);
    if (response.playerToken)
        sessionStorage.setItem(PLAYER_TOKEN_STORAGE_KEY, response.playerToken);
    sessionStorage.setItem("multiplayerSeat", response.seat);
    sessionStorage.setItem("mode", "multiplayer");
}


// CREATE ROOM
createRoomBtn.onclick = () => {

    const playerName = username.trim() || "Player";

    socket.emit("create-room", {
        username: playerName,
        avatar: avatar
    }, (response) => {

        if (!response.success) {
            alert(response.message);
            return;
        }

        multiplayerSession.clear({ clearTeams: true });
        saveRoomSession(response);
        showRoom(response.roomId, response.players, response.host);

    });

};


// JOIN ROOM
joinRoomBtn.onclick = () => {

    const playerName = username.trim() || "Player";

    socket.emit("join-room", {
        roomId: roomIdInput.value,
        username: playerName,
        avatar: avatar
    }, (response) => {

        if (!response.success) {
            alert(response.message);
            return;
        }

        multiplayerSession.clear({ clearTeams: true });
        saveRoomSession(response);
        showRoom(response.roomId, response.players, response.host);

    });

};


// SHOW ROOM
function showRoom(roomId, players, host) {

    currentRoom = roomId;
    isHost = host === socket.id;

    roomActions.style.display = "none";
    roomSection.style.display = "block";

    roomIdDisplay.textContent = "ROOM ID: " + roomId;

    startBtn.style.display = isHost ? "inline-block" : "none";

    updatePlayers(players);

}

// COPY ROOM ID
copyRoomBtn.onclick = async () => {
    if (!currentRoom) return;

    try {
        await navigator.clipboard.writeText(currentRoom);
        copyRoomBtn.textContent = "✅ COPIED!";

        setTimeout(() => {
            copyRoomBtn.textContent = "📋 COPY";
        }, 1500);

    } catch (error) {
        alert("Unable to copy Room ID. Please copy it manually.");
    }
};

// CANCEL ROOM
cancelRoomBtn.onclick = () => {

    if (!currentRoom) return;

    const confirmCancel = confirm(
        isHost
            ? "Are you sure you want to close this room for everyone?"
            : "Are you sure you want to leave this room?"
    );

    if (!confirmCancel) return;

    cancelRoomBtn.disabled = true;

    socket.emit("leave-room", {
        roomId: currentRoom,
        playerToken: sessionStorage.getItem(PLAYER_TOKEN_STORAGE_KEY)
    }, response => {

        cancelRoomBtn.disabled = false;

        if (!response?.success) {
            roomStatus.textContent =
                response?.message || "Unable to cancel the room.";
            return;
        }

        resetRoomScreen();
    });

};

// RESET ROOM SCREEN
function resetRoomScreen() {

    currentRoom = null;
    isHost = false;

    multiplayerSession.clear({ clearTeams: true });

    roomSection.style.display = "none";
    roomActions.style.display = "block";

    roomIdInput.value = "";
    playersList.innerHTML = "";
    roomStatus.textContent = "Waiting for players...";

    startBtn.style.display = "none";
    readyBtn.disabled = false;
    cancelRoomBtn.disabled = false;

}

// UPDATE PLAYERS
function updatePlayers(players) {

    playersList.innerHTML = "";

    players.forEach(player => {

        const card = document.createElement("div");
        card.className = "playerCard";

        const img = document.createElement("img");
        img.src = player.avatar;
        img.alt = player.username + " avatar";

        const name = document.createElement("span");
        name.textContent = player.username;

        const status = document.createElement("p");
        status.textContent = player.ready ? "🟢 READY" : "⏳ NOT READY";

        card.appendChild(img);
        card.appendChild(name);
        card.appendChild(status);

        playersList.appendChild(card);

    });

    const connectedPlayers = players.filter(player => player.connected !== false);

    if (connectedPlayers.length < 2 && players.length === 2) {
        roomStatus.textContent = "Waiting for the other player to reconnect...";
    } else if (players.length < 2) {
        roomStatus.textContent = "Waiting for another player...";
    } else {
        roomStatus.textContent = "Both players joined! Ready up!";
    }

}


// ROOM UPDATES
socket.on("room-updated", (data) => {

    if (data.roomId !== currentRoom) return;

    showRoom(data.roomId, data.players, data.host);

});

socket.on("connect", () => {
    const roomId = sessionStorage.getItem(ROOM_STORAGE_KEY);
    const playerToken = sessionStorage.getItem(PLAYER_TOKEN_STORAGE_KEY);
    if (!roomId || !playerToken) return;

    socket.emit("rejoin-room", { roomId, playerToken }, response => {
        if (sessionStorage.getItem(ROOM_STORAGE_KEY) !== roomId ||
            sessionStorage.getItem(PLAYER_TOKEN_STORAGE_KEY) !== playerToken) {
            return;
        }

        if (!response?.success) {
            resetRoomScreen();
            roomStatus.textContent = response?.message || "Could not restore the room.";
            return;
        }

        saveRoomSession(response);

        if (response.battle?.status === "finished") {
            multiplayerSession.leave(socket, cleanupResponse => {
                if (!cleanupResponse?.success) {
                    showRoom(response.roomId, response.players, response.host);
                    roomStatus.textContent = cleanupResponse?.message ||
                        "Could not close the completed match.";
                    return;
                }

                resetRoomScreen();
                roomStatus.textContent = "The previous match has ended. Create or join a room.";
            });
            return;
        }

        showRoom(response.roomId, response.players, response.host);

        if (response.matchStarted) {
            const destination = response.battle
                ? "battle.html"
                : response.heroState
                    ? "hero-selection.html"
                    : "kwami.html";
            goTo(destination);
        }
    });
});


// PLAYER READY
readyBtn.onclick = () => {

    if (!currentRoom) return;

    socket.emit("player-ready", currentRoom);

};


// START MATCH
startBtn.onclick = () => {

    if (!currentRoom) return;

    socket.emit("start-match", currentRoom, response => {
        if (!response?.success)
            roomStatus.textContent = response?.message || "Unable to start the match.";
    });

};

// ROOM CLOSED BY HOST
socket.on("room-closed", (data) => {

    if (data?.roomId && data.roomId !== currentRoom) return;
    resetRoomScreen();

    alert(data?.message || "The room has been closed.");

});

socket.on("match-closed", data => {
    if (data?.roomId && data.roomId !== currentRoom) return;
    resetRoomScreen();
    roomStatus.textContent = "The previous match has ended. Create or join a room.";
});


// MATCH STARTING
socket.on("match-starting", (data) => {
    if (data?.roomId !== currentRoom) return;
    sessionStorage.setItem("mode", "multiplayer");
    goTo("kwami.html");

});


// PLAYER LEFT
socket.on("player-left", (data) => {

    if (data?.roomId !== currentRoom) return;
    updatePlayers(data.players);

    roomStatus.textContent = "A player left the room.";

});