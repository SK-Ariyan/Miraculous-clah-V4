const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const crypto = require("crypto");
const battleEngine = require("./server/battleEngine");

const app = express();
const server = http.createServer(app);

const io = new Server(server);

const PORT = Number(process.env.PORT) || 3000;
const ROOM_ID_PATTERN = /^MC-\d{5}$/;
const PLAYER_TOKEN_PATTERN = /^[a-f\d]{48}$/i;
const AVATAR_PATH_PATTERN = /^(?:\.\.\/|\/)?hero\/[\w.-]+\.(?:png|jpe?g|webp)$/i;
const SOCKET_EVENT_LIMIT = 120;
const SOCKET_EVENT_WINDOW_MS = 10_000;

const publicDirectories = [
    "assets",
    "css",
    "effects",
    "hero",
    "html",
    "js",
    "photos",
    "sounds",
    "voices"
];
const developmentPages = new Set(["/test.html", "/multiplayer-test.html"]);

for (const directory of publicDirectories) {
    const staticFiles = express.static(path.join(__dirname, directory), {
        dotfiles: "ignore",
        index: false
    });

    if (directory === "html") {
        app.use("/html", (req, res, next) => {
            let requestPath;
            try {
                requestPath = decodeURIComponent(req.path).toLowerCase();
            } catch {
                return res.sendStatus(400);
            }

            if (developmentPages.has(requestPath)) {
                return res.sendStatus(404);
            }
            next();
        }, staticFiles);
    } else {
        app.use(`/${directory}`, staticFiles);
    }
}

app.get("/manifest.webmanifest", (req, res) => {
    res.sendFile(path.join(__dirname, "manifest.webmanifest"));
});

app.get("/healthz", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.get("/", (req, res) => {
    res.redirect("/html/index.html");
});

// Multiplayer Room System
const rooms = new Map();
const KWAMI_NAMES = new Set([
    "Tikki", "Plagg", "Wayz", "Trics", "Pollen", "Roaar", "Longg",
    "Kaalki", "Fluff", "Sass", "Daizzi", "Mullo", "Nuroo", "Orikko",
    "Stomp", "Tussoo", "Xuppu", "Ziggy", "Bark"
]);

const HERO_IDS = new Set([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
]);
const DRAFT_SEQUENCE = [
    { seat: "p1", action: "ban" },
    { seat: "p2", action: "ban" },
    { seat: "p1", action: "pick" },
    { seat: "p2", action: "pick" },
    { seat: "p2", action: "pick" },
    { seat: "p1", action: "pick" },
    { seat: "p1", action: "pick" },
    { seat: "p2", action: "pick" }
];

function acknowledge(callback, response) {
    if (typeof callback === "function") callback(response);
}

function normalizeRoomId(value) {
    if (typeof value !== "string") return "";
    const roomId = value.trim().toUpperCase();
    return ROOM_ID_PATTERN.test(roomId) ? roomId : "";
}

function parsePlayerProfile(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return { error: "Invalid player details." };
    }

    const username = typeof data.username === "string"
        ? data.username.trim().slice(0, 20)
        : "";
    const avatar = typeof data.avatar === "string" ? data.avatar : "";

    if (!username) return { error: "Enter a username." };
    if (avatar.length > 512) return { error: "Avatar value is too long." };
    if (avatar && !AVATAR_PATH_PATTERN.test(avatar)) {
        return { error: "Choose a valid avatar." };
    }

    return { username, avatar };
}

function createDraftState() {
    return {
        status: "drafting",
        turnIndex: 0,
        sequence: DRAFT_SEQUENCE.map(step => ({ ...step })),
        banned: { p1: [], p2: [] },
        teams: { p1: [], p2: [] }
    };
}

function createHeroState() {
    return {
        status: "selecting",
        currentSeat: "p2",
        selections: {
            p1: null,
            p2: null
        }
    };
}

function getHeroSnapshot(room) {
    const hero = room.heroState;

    if (!hero) return null;

    return {
        roomId: room.id,
        status: hero.status,
        currentSeat: hero.currentSeat,
        selections: {
            p1: hero.selections.p1,
            p2: hero.selections.p2
        },
        players: getRoomPlayers(room).map(({ seat, username, avatar }) => ({
            seat,
            username,
            avatar
        }))
    };
}

function getRoomPlayers(room) {
    return room.players.map(({ seat, username, avatar, ready, socketId }) => ({
        seat,
        username,
        avatar,
        ready,
        connected: Boolean(socketId)
    }));
}

function getDraftSnapshot(room) {
    const draft = room.draftState;
    return {
        roomId: room.id,
        status: draft.status,
        turnIndex: draft.turnIndex,
        totalTurns: draft.sequence.length,
        currentAction: draft.sequence[draft.turnIndex] || null,
        banned: {
            p1: [...draft.banned.p1],
            p2: [...draft.banned.p2]
        },
        teams: {
            p1: [...draft.teams.p1],
            p2: [...draft.teams.p2]
        },
        players: getRoomPlayers(room).map(({ seat, username }) => ({ seat, username }))
    };
}

function broadcastRoomUpdate(room) {
    io.to(room.id).emit("room-updated", {
        roomId: room.id,
        players: getRoomPlayers(room),
        host: room.host,
        matchStarted: room.matchStarted
    });
}

function closeRoom(room, eventName, message) {
    io.to(room.id).emit(eventName, { roomId: room.id, message });

    room.players.forEach(player => {
        const playerSocket = io.sockets.sockets.get(player.socketId);
        if (!playerSocket) return;

        playerSocket.leave(room.id);
        if (playerSocket.data.roomId === room.id) {
            playerSocket.data.roomId = null;
            playerSocket.data.playerToken = null;
            playerSocket.data.seat = null;
        }
    });

    rooms.delete(room.id);
}

io.on("connection", (socket) => {

    console.log("Player connected:", socket.id);

    let eventWindowStart = Date.now();
    let eventCount = 0;
    socket.use((_packet, next) => {
        const now = Date.now();
        if (now - eventWindowStart >= SOCKET_EVENT_WINDOW_MS) {
            eventWindowStart = now;
            eventCount = 0;
        }

        eventCount++;
        if (eventCount > SOCKET_EVENT_LIMIT) {
            console.warn("Disconnecting socket that exceeded the event rate limit:", socket.id);
            socket.disconnect(true);
            return;
        }

        next();
    });

    socket.on("create-room", (data, callback) => {
        if (socket.data.roomId) {
            return acknowledge(callback, {
                success: false,
                message: "Leave your current room before creating another."
            });
        }

        const profile = parsePlayerProfile(data);
        if (profile.error) {
            return acknowledge(callback, { success: false, message: profile.error });
        }
        const { username, avatar } = profile;

        let roomId;
        do {
            roomId = "MC-" + Math.floor(10000 + Math.random() * 90000);
        } while (rooms.has(roomId));

        const playerToken = crypto.randomBytes(24).toString("hex");
        const room = {
            id: roomId,
            host: socket.id,
            matchStarted: false,
            battleStarted: false,
            draftState: null,
            heroState: null,
            players: [{
                token: playerToken,
                seat: "p1",
                socketId: socket.id,
                username,
                avatar,
                ready: false
            }]
        };

        rooms.set(roomId, room);
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.playerToken = playerToken;
        socket.data.seat = "p1";

        acknowledge(callback, {
            success: true,
            roomId,
            playerToken,
            seat: "p1",
            players: getRoomPlayers(room),
            host: room.host
        });
        console.log("Room created:", roomId);
    });

    socket.on("join-room", (data, callback) => {
        if (socket.data.roomId) {
            return acknowledge(callback, {
                success: false,
                message: "Leave your current room before joining another."
            });
        }

        const roomId = normalizeRoomId(data?.roomId);
        const profile = parsePlayerProfile(data);

        if (!roomId) {
            return acknowledge(callback, { success: false, message: "Enter a valid room code." });
        }
        if (profile.error) {
            return acknowledge(callback, { success: false, message: profile.error });
        }
        const { username, avatar } = profile;
        const room = rooms.get(roomId);

        if (!room) {
            return acknowledge(callback, { success: false, message: "Room not found." });
        }
        if (room.matchStarted || room.players.length >= 2) {
            return acknowledge(callback, { success: false, message: "Room is full or the match has started." });
        }

        const playerToken = crypto.randomBytes(24).toString("hex");
        room.players.push({
            token: playerToken,
            seat: "p2",
            socketId: socket.id,
            username,
            avatar,
            ready: false
        });
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.playerToken = playerToken;
        socket.data.seat = "p2";

        broadcastRoomUpdate(room);
        acknowledge(callback, {
            success: true,
            roomId,
            playerToken,
            seat: "p2",
            players: getRoomPlayers(room),
            host: room.host
        });
        console.log(username + " joined room:", roomId);
    });

    socket.on("rejoin-room", (data, callback) => {
        const roomId = normalizeRoomId(data?.roomId);
        const playerToken = typeof data?.playerToken === "string" ? data.playerToken : "";
        if (!roomId || !PLAYER_TOKEN_PATTERN.test(playerToken)) {
            return acknowledge(callback, { success: false, message: "This room session could not be restored." });
        }
        const room = rooms.get(roomId);
        const player = room?.players.find(candidate => candidate.token === playerToken);

        if (!room || !player) {
            return acknowledge(callback, { success: false, message: "This room session could not be restored." });
        }
        if (socket.data.roomId && socket.data.roomId !== room.id) {
            return acknowledge(callback, {
                success: false,
                message: "Leave your current room before reconnecting to another."
            });
        }

        const previousSocketId = player.socketId;
        player.socketId = socket.id;
        socket.data.roomId = roomId;
        socket.data.playerToken = playerToken;
        socket.data.seat = player.seat;
        socket.join(roomId);
        if (player.seat === "p1") room.host = socket.id;

        if (previousSocketId && previousSocketId !== socket.id) {
            io.sockets.sockets.get(previousSocketId)?.disconnect(true);
        }

        acknowledge(callback, {
            success: true,
            roomId,
            seat: player.seat,
            players: getRoomPlayers(room),
            host: room.host,
            matchStarted: room.matchStarted,
            battleStarted: room.battleStarted,
            draftState: room.draftState ? getDraftSnapshot(room) : null,
            heroState: getHeroSnapshot(room),
            battle: room.battle ? battleEngine.snapshot(room) : null
        });
        broadcastRoomUpdate(room);
                if (room.draftState) {
            socket.emit("draft-state", getDraftSnapshot(room));
        }

                if (room.heroState) {
            socket.emit("hero-state", getHeroSnapshot(room));
        }
        if (room.battle) {
            socket.emit("battle-state", battleEngine.snapshot(room));
        }

    });

    socket.on("player-ready", (roomIdValue, callback) => {
        const room = rooms.get(normalizeRoomId(roomIdValue));
        const player = room?.players.find(candidate => candidate.socketId === socket.id);

        if (!room || !player || room.matchStarted) {
            return acknowledge(callback, { success: false, message: "Unable to change ready status." });
        }

        player.ready = !player.ready;
        broadcastRoomUpdate(room);
        acknowledge(callback, { success: true });
        console.log(player.username, "Ready:", player.ready);
    });

    socket.on("start-match", (roomIdValue, callback) => {
        const room = rooms.get(normalizeRoomId(roomIdValue));

        if (!room || room.host !== socket.id || room.matchStarted ||
            room.players.length !== 2 ||
            !room.players.every(player => player.ready && player.socketId)) {
            return acknowledge(callback, { success: false, message: "Both connected players must be ready." });
        }

        room.matchStarted = true;
        room.draftState = createDraftState();
        io.to(room.id).emit("match-starting", { roomId: room.id });
        acknowledge(callback, { success: true });
        console.log("Match starting:", room.id);
    });

    socket.on("draft-action", (data, callback) => {
        const roomId = normalizeRoomId(data?.roomId);
        const room = rooms.get(roomId);
        const player = room?.players.find(candidate =>
            candidate.token === socket.data.playerToken && candidate.socketId === socket.id
        );
        const draft = room?.draftState;

        const reject = message => acknowledge(callback, { success: false, message });
        if (!room || !room.matchStarted || !draft || !player) {
            return reject("You are not connected to this active draft.");
        }
        if (draft.status !== "drafting" || !Number.isInteger(data.turnIndex) ||
            data.turnIndex !== draft.turnIndex) {
            return reject("That draft turn is no longer active.");
        }

        const expected = draft.sequence[draft.turnIndex];
        if (!expected || player.seat !== expected.seat || data.action !== expected.action) {
            return reject("It is not your turn for that action.");
        }

        const kwamiName = String(data.kwamiName || "");
        if (!KWAMI_NAMES.has(kwamiName)) {
            return reject("Unknown Kwami.");
        }

        const alreadyUsed = [
            ...draft.banned.p1,
            ...draft.banned.p2,
            ...draft.teams.p1,
            ...draft.teams.p2
        ].includes(kwamiName);
        if (alreadyUsed) {
            return reject("That Kwami has already been banned or selected.");
        }

        if (expected.action === "ban") {
            draft.banned[player.seat].push(kwamiName);
        } else {
            draft.teams[player.seat].push(kwamiName);
        }

       draft.turnIndex++;

if (draft.turnIndex === draft.sequence.length) {
    draft.status = "complete";
    room.heroState = createHeroState();
}

const snapshot = getDraftSnapshot(room);

io.to(room.id).emit("draft-state", snapshot);

if (room.heroState) {
    io.to(room.id).emit("hero-state", getHeroSnapshot(room));
}

acknowledge(callback, { success: true, state: snapshot });
    });


// HERO SELECTION
socket.on("hero-action", (data, callback) => {

    const roomId = normalizeRoomId(data?.roomId);

    const room = rooms.get(roomId);

    const player = room?.players.find(candidate =>
        candidate.token === socket.data.playerToken &&
        candidate.socketId === socket.id
    );

    const hero = room?.heroState;

    const reject = message =>
        acknowledge(callback, {
            success: false,
            message
        });

    if (!room || !room.matchStarted || !player || !hero) {
        return reject("Hero selection is not available.");
    }

    if (hero.status !== "selecting") {
        return reject("Hero selection is already complete.");
    }

    if (player.seat !== hero.currentSeat) {
        return reject("It is not your turn to select a hero.");
    }

    const heroId = data?.heroId;

    if (!Number.isInteger(heroId) || !HERO_IDS.has(heroId)) {
        return reject("Invalid hero selection.");
    }

    const alreadySelected = Object.values(hero.selections)
        .includes(heroId);

    if (alreadySelected) {
        return reject("This hero has already been selected. Choose another hero.");
    }

    // Save the selected hero
    hero.selections[player.seat] = heroId;

    // Give the next turn to P1
    if (player.seat === "p2") {
        hero.currentSeat = "p1";
    } else {
        hero.status = "complete";
        hero.currentSeat = null;
    }

    const snapshot = getHeroSnapshot(room);

    // Update both players
    io.to(room.id).emit("hero-state", snapshot);

    acknowledge(callback, {
        success: true,
        state: snapshot
    });

    console.log(
        player.username,
        "selected hero:",
        heroId
    );

});

socket.on("start-battle", (data, callback) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return acknowledge(callback, { success: false, message: "Invalid battle request." });
    }

    const room = rooms.get(normalizeRoomId(data.roomId));

    if (!room) {
        return acknowledge(callback, {
            success: false,
            message: "Room not found."
        });
    }

    const player = room.players.find(
        p => p.token === data.playerToken &&
             p.token === socket.data.playerToken &&
             p.socketId === socket.id
    );

    if (!player) {
        return acknowledge(callback, {
            success: false,
            message: "Invalid player."
        });
    }

    if (player.seat !== "p1") {
    return acknowledge(callback, {
        success: false,
        message: "Only Player 1 can start the battle."
    });
}

    if (!room.heroState || room.heroState.status !== "complete") {
        return acknowledge(callback, {
            success: false,
            message: "Both players must select their heroes."
        });
    }

    if (room.battleStarted) {
        return acknowledge(callback, {
            success: true,
            message: "Battle has already started."
        });
    }

    room.battleStarted = true;
    battleEngine.initializeBattle(room);

    io.to(room.id).emit("battle-started", battleEngine.snapshot(room));
    io.to(room.id).emit("battle-state", battleEngine.snapshot(room));

    acknowledge(callback, {
        success: true,
        message: "Battle starting."
    });
});

socket.on("battle-action", (data, callback) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return acknowledge(callback, { success: false, message: "Invalid battle action." });
    }

    const roomId = normalizeRoomId(data.roomId);
    const room = rooms.get(roomId);
    const player = room?.players.find(candidate =>
        candidate.token === socket.data.playerToken &&
        candidate.socketId === socket.id
    );

    if (!room || !room.battle || !player) {
        return acknowledge(callback, { success: false, message: "Battle session not found." });
    }
    if (room.battle.status !== "active") {
        return acknowledge(callback, { success: false, message: "The battle is already finished." });
    }
    if (room.battle.currentTurn !== player.seat) {
        return acknowledge(callback, { success: false, message: "It is not your turn." });
    }

    const actionId = data.actionId;
    if (typeof actionId !== "string" || !actionId || actionId.length > 100) {
        return acknowledge(callback, { success: false, message: "Invalid action ID." });
    }
    if (room.battle.processedActionIds?.includes(actionId)) {
        const state = battleEngine.snapshot(room);
        io.to(room.id).emit("battle-state", state);
        return acknowledge(callback, { success: true, state, duplicate: true });
    }

    let result;
    if (data.type === "normal") {
        result = battleEngine.performNormalAttack(room);
    } else if (data.type === "ability" && typeof data.kwamiName === "string") {
        result = battleEngine.performAbility(room, data.kwamiName);
    } else {
        result = { success: false, message: "Unknown battle action." };
    }

    if (!result.success) {
        acknowledge(callback, result);
        return;
    }

    if (!room.battle.processedActionIds) room.battle.processedActionIds = [];
    room.battle.processedActionIds.push(actionId);

    const state = battleEngine.snapshot(room);
    io.to(room.id).emit("battle-action-result", {
        ...result.event,
        actionId,
        roomId: room.id
    });
    io.to(room.id).emit("battle-state", state);
    acknowledge(callback, { success: true, state, actionId });
});

socket.on("battle-snapshot", (data, callback) => {
    const roomId = normalizeRoomId(data?.roomId);
    const room = rooms.get(roomId);
    const player = room?.players.find(candidate =>
        candidate.token === socket.data.playerToken &&
        candidate.socketId === socket.id
    );
    if (!room || !room.battle || !player) {
        return acknowledge(callback, { success: false, message: "Battle session not found." });
    }
    acknowledge(callback, { success: true, state: battleEngine.snapshot(room) });
});

// CANCEL / LEAVE ROOM
socket.on("leave-room", (data, callback) => {

    const roomId = normalizeRoomId(data?.roomId);
    const room = rooms.get(roomId);

    if (!room) {
        return acknowledge(callback, { success: true, closed: true, alreadyClosed: true });
    }

    const playerToken = typeof data?.playerToken === "string"
        ? data.playerToken
        : socket.data.playerToken;
    const player = room?.players.find(candidate =>
        candidate.token === playerToken &&
        (candidate.socketId === socket.id || candidate.socketId === null)
    );

    if (!player || (socket.data.roomId && socket.data.roomId !== room.id)) {
        return acknowledge(callback, {
            success: false,
            message: "Unable to leave this room."
        });
    }

    if (player.socketId === null) {
        player.socketId = socket.id;
        socket.data.roomId = room.id;
        socket.data.playerToken = player.token;
        socket.data.seat = player.seat;
        socket.join(room.id);
    }

    if (room.battleStarted) {
        if (room.battle?.status !== "finished") {
            return acknowledge(callback, {
                success: false,
                message: "Surrender to leave an active battle."
            });
        }

        closeRoom(room, "match-closed", "The completed match has been closed.");
        acknowledge(callback, { success: true, closed: true });
        console.log("Completed match closed:", roomId);
        return;
    }

    if (room.matchStarted) {
        closeRoom(room, "room-closed", "The match was cancelled because a player left.");
        acknowledge(callback, { success: true, closed: true });
        console.log("Match cancelled during draft or hero selection:", roomId);
        return;
    }

    if (player.seat === "p1") {
        closeRoom(room, "room-closed", "The host cancelled the room.");
        acknowledge(callback, { success: true, closed: true });
        console.log("Room cancelled by host:", roomId);
        return;
    }

    socket.leave(room.id);
    room.players = room.players.filter(member => member.token !== player.token);
    socket.data.roomId = null;
    socket.data.playerToken = null;
    socket.data.seat = null;

    broadcastRoomUpdate(room);

    io.to(room.id).emit("player-left", {
        roomId: room.id,
        players: getRoomPlayers(room)
    });

    acknowledge(callback, { success: true, closed: false });

    console.log("Player left room:", roomId);

});


socket.on("surrender-battle", (data, callback) => {

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return acknowledge(callback, { success: false, message: "Invalid surrender request." });
    }

    const room = rooms.get(normalizeRoomId(data.roomId));

    if (!room || !room.battleStarted) {
        callback?.({
            success: false,
            message: "Battle room not found."
        });
        return;
    }

    const quitter = room.players.find(
        p => p.token === data.playerToken &&
             p.token === socket.data.playerToken &&
             p.socketId === socket.id
    );

    if (!quitter) {
        callback?.({
            success: false,
            message: "Player not found."
        });
        return;
    }

    const opponent = room.players.find(
        p => p.token !== data.playerToken
    );

    if (!opponent) {
        rooms.delete(room.id);

        callback?.({ success: true });
        return;
    }

    if (room.battle) {
        room.battle.status = "finished";
        room.battle.winnerSeat = opponent.seat;
    }

    io.to(room.id).emit("battle-state", battleEngine.snapshot(room));

    // Notify the opponent that the player surrendered
    io.to(opponent.socketId).emit("opponent-surrendered", {
        roomId: room.id,
        quitterSeat: quitter.seat,
        quitterName: quitter.username,
        winnerSeat: opponent.seat,
        winnerName: opponent.username
    });

    // Remove the old room
    rooms.delete(room.id);

    // Clear multiplayer data from connected sockets
    room.players.forEach(player => {
        const playerSocket = io.sockets.sockets.get(
            player.socketId
        );

        if (playerSocket) {
            playerSocket.data.roomId = null;
            playerSocket.data.playerToken = null;
            playerSocket.data.seat = null;
            playerSocket.leave(room.id);
        }
    });

    callback?.({ success: true });

    console.log(
        `${quitter.username} surrendered. ${opponent.username} wins.`
    );

});


    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);

        const room = rooms.get(socket.data.roomId);
        const player = room?.players.find(candidate => candidate.socketId === socket.id);
        if (!room || !player) return;

        player.socketId = null;
        if (player.seat === "p1") room.host = null;
        broadcastRoomUpdate(room);
        io.to(room.id).emit("player-left", {
            roomId: room.id,
            players: getRoomPlayers(room)
        });
    });

});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Miraculous Clash server listening on port ${PORT}`);
});