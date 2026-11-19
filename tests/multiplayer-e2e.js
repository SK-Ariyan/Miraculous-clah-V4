const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const vm = require("node:vm");
const { io } = require("socket.io-client");
const { createMultiplayerActionEventHandler } =
    require("../js/battle/multiplayerEvents");

const root = path.resolve(__dirname, "..");
const timeoutMs = 10_000;

function getFreePort() {
    return new Promise((resolve, reject) => {
        const probe = net.createServer();
        probe.once("error", reject);
        probe.listen(0, "127.0.0.1", () => {
            const { port } = probe.address();
            probe.close(error => error ? reject(error) : resolve(port));
        });
    });
}

function waitFor(predicate, message, timeout = timeoutMs) {
    const started = Date.now();
    return new Promise((resolve, reject) => {
        const check = () => {
            if (predicate()) return resolve();
            if (Date.now() - started >= timeout) {
                return reject(new Error(`Timed out: ${message}`));
            }
            setTimeout(check, 25);
        };
        check();
    });
}

function emitAck(socket, event, ...args) {
    return new Promise((resolve, reject) => {
        socket.timeout(timeoutMs).emit(event, ...args, (error, response) => {
            if (error) return reject(new Error(`${event} acknowledgement timed out.`));
            if (!response?.success) {
                return reject(new Error(response?.message || `${event} was rejected.`));
            }
            resolve(response);
        });
    });
}

function emitResponse(socket, event, ...args) {
    return new Promise((resolve, reject) => {
        socket.timeout(timeoutMs).emit(event, ...args, (error, response) => {
            if (error) return reject(new Error(`${event} acknowledgement timed out.`));
            resolve(response);
        });
    });
}

function waitForEvent(socket, event) {
    return new Promise(resolve => socket.once(event, resolve));
}

async function waitForServer(url, child) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
        if (child.exitCode !== null) {
            throw new Error(`Server exited before becoming ready (code ${child.exitCode}).`);
        }
        try {
            const response = await fetch(`${url}/healthz`);
            if (response.ok) return;
        } catch {
            // The server may not have bound its port yet.
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error("Local server did not become ready.");
}

async function main() {
    const port = await getFreePort();
    const baseUrl = `http://127.0.0.1:${port}`;
    const server = spawn(process.execPath, ["server.js"], {
        cwd: root,
        env: { ...process.env, PORT: String(port) },
        stdio: "ignore"
    });
    const clients = [];

    try {
        await waitForServer(baseUrl, server);
        const testSourceResponse = await fetch(`${baseUrl}/tests/multiplayer-e2e.js`);
        assert.equal(testSourceResponse.status, 404,
            "The local test harness must not be served publicly.");

        const connectPlayer = name => new Promise((resolve, reject) => {
            const socket = io(baseUrl, {
                reconnection: false,
                timeout: timeoutMs
            });
            clients.push(socket);
            socket.once("connect", () => resolve(socket));
            socket.once("connect_error", reject);
        });

        let p1 = await connectPlayer("Player One");
        let p2 = await connectPlayer("Player Two");
        const created = await emitAck(p1, "create-room", {
            username: "Player One",
            avatar: ""
        });
        const roomId = created.roomId;
        const joined = await emitAck(p2, "join-room", {
            roomId,
            username: "Player Two",
            avatar: ""
        });
        assert.equal(joined.seat, "p2");

        await emitAck(p1, "player-ready", roomId);
        await emitAck(p2, "player-ready", roomId);
        await emitAck(p1, "start-match", roomId);

        const draft = [
            ["p1", "ban", "Plagg"],
            ["p2", "ban", "Orikko"],
            ["p1", "pick", "Roaar"],
            ["p2", "pick", "Wayz"],
            ["p2", "pick", "Fluff"],
            ["p1", "pick", "Tikki"],
            ["p1", "pick", "Longg"],
            ["p2", "pick", "Daizzi"]
        ];
        for (let turnIndex = 0; turnIndex < draft.length; turnIndex++) {
            const [seat, action, kwamiName] = draft[turnIndex];
            await emitAck(seat === "p1" ? p1 : p2, "draft-action", {
                roomId,
                turnIndex,
                action,
                kwamiName
            });
        }

        await emitAck(p2, "hero-action", { roomId, heroId: 2 });
        await emitAck(p1, "hero-action", { roomId, heroId: 9 });

        const streams = {
            p1: { actions: [], states: [], order: [] },
            p2: { actions: [], states: [], order: [] }
        };
        for (const [seat, socket] of [["p1", p1], ["p2", p2]]) {
            socket.on("battle-action-result", event => {
                streams[seat].actions.push(event);
                streams[seat].order.push({ type: "action", sequence: event.sequence });
            });
            socket.on("battle-state", state => {
                streams[seat].states.push(state);
                streams[seat].order.push({ type: "state", sequence: state.sequence });
            });
        }

        await emitAck(p1, "start-battle", {
            roomId,
            playerToken: created.playerToken
        });
        await waitFor(
            () => streams.p1.states.some(state => state.sequence === 0) &&
                streams.p2.states.some(state => state.sequence === 0),
            "initial battle state"
        );
        assert.equal(streams.p1.states.at(-1).currentTurn, "p1",
            "The controlled matchup should start with Player 1.");

        async function takeTurn(seat, action) {
            const beforeCount = streams.p1.actions.length;
            const client = seat === "p1" ? p1 : p2;
            const actionId = `${seat}-test-${beforeCount + 1}`;
            await emitAck(client, "battle-action", {
                roomId,
                actionId,
                ...action
            });
            const sequence = beforeCount + 1;
            await waitFor(
                () => ["p1", "p2"].every(playerSeat =>
                    streams[playerSeat].actions.some(event => event.sequence === sequence) &&
                    streams[playerSeat].states.some(state => state.sequence === sequence)
                ),
                `action and state delivery for sequence ${sequence}`
            );

            const events = ["p1", "p2"].map(playerSeat =>
                streams[playerSeat].actions.find(event => event.sequence === sequence)
            );
            assert.deepEqual(events[0], events[1],
                `Both players must receive the same action event at sequence ${sequence}.`);
            const event = events[0];
            assert.equal(event.actionId, actionId);
            assert.deepEqual(
                event.messages,
                streams.p1.states.find(state => state.sequence === sequence)
                    .log.slice(event.logStart, event.logEnd),
                "The action narration must match the authoritative log slice."
            );

            for (const playerSeat of ["p1", "p2"]) {
                const order = streams[playerSeat].order;
                const actionIndex = order.findIndex(item =>
                    item.type === "action" && item.sequence === sequence
                );
                const stateIndex = order.findIndex(item =>
                    item.type === "state" && item.sequence === sequence
                );
                assert.ok(actionIndex >= 0 && actionIndex < stateIndex,
                    `Action event must precede state for ${playerSeat}, sequence ${sequence}.`);
                assert.equal(
                    streams[playerSeat].actions.filter(item => item.sequence === sequence).length,
                    1,
                    `No duplicate action event for ${playerSeat}, sequence ${sequence}.`
                );
            }
            return event;
        }

        const first = await takeTurn("p1", { type: "normal" });
        assert.equal(first.attacker.seat, "p1");
        assert.equal(first.target.seat, "p2");
        assert.ok(first.messages.some(message => message.includes("Player One used Normal Attack!")));
        assert.ok(first.messages.some(message => message.includes("Wayz passively granted")));

        const second = await takeTurn("p2", { type: "normal" });
        assert.equal(second.attacker.seat, "p2");
        assert.equal(second.target.seat, "p1");
        assert.ok(second.messages.some(message => message.includes("Player Two used Normal Attack!")));
        assert.ok(second.messages.some(message => message.includes("Tikki passively granted")));

        const ability = await takeTurn("p1", { type: "ability", kwamiName: "Roaar" });
        assert.equal(ability.actionName, "Clout");
        assert.ok(ability.messages.some(message => message.includes("Roaar used Clout!")));
        assert.ok(ability.messages.includes("Extra Turn!"));
        assert.equal(ability.effects.extraTurn, true);

        const longg = await takeTurn("p1", {
            type: "ability",
            kwamiName: "Longg"
        });
        assert.ok(longg.directDamage.hp >= 10,
            "Longg's direct true damage must be represented for hurt animation dispatch.");
        assert.equal(longg.effects.doubleAttackReady, true);

        const battleSource = fs.readFileSync(
            path.join(root, "js", "battle", "battle.js"),
            "utf8"
        );
        const animationSource = fs.readFileSync(
            path.join(root, "html", "battle.html"),
            "utf8"
        );
        assert.match(battleSource, /battleSocket\.on\("battle-action-result"/);
        assert.match(battleSource, /createMultiplayerActionEventHandler/);
        assert.match(animationSource, /multiplayerEvents\.js/);

        const animationCalls = [];
        const displayedMessages = [];
        const deferredAnimations = [];
        const handleActionEvent = createMultiplayerActionEventHandler({
            getRoomId: () => roomId,
            appendLogMessages: messages => displayedMessages.push(...messages),
            playAttackAnimation: seat => animationCalls.push(`attack:${seat}`),
            playHurtAnimation: seat => animationCalls.push(`hurt:${seat}`),
            schedule: callback => deferredAnimations.push(callback)
        });
        const p1Hit = {
            ...ability,
            roomId,
            actionId: "animation-p1",
            sequence: 10,
            attacker: { seat: "p1" },
            target: { seat: "p2" },
            directDamage: { hp: 12, shield: 0 },
            effects: { doubleAttack: true }
        };
        handleActionEvent(p1Hit);
        handleActionEvent(p1Hit);
        assert.deepEqual(animationCalls, ["attack:p1", "hurt:p2"]);
        assert.equal(displayedMessages.length, ability.messages.length);
        assert.equal(deferredAnimations.length, 1);
        deferredAnimations[0]();
        assert.deepEqual(animationCalls, ["attack:p1", "hurt:p2", "attack:p1"]);

        handleActionEvent({
            ...p1Hit,
            actionId: "animation-p2",
            sequence: 11,
            attacker: { seat: "p2" },
            target: { seat: "p1" },
            directDamage: { hp: 0, shield: 10 },
            effects: { doubleAttack: false }
        });
        assert.deepEqual(animationCalls, [
            "attack:p1",
            "hurt:p2",
            "attack:p1",
            "attack:p2"
        ], "Shield-only damage should animate the attack without a hurt animation.");

        let battleState = streams.p1.states.at(-1);
        for (let turn = 0; turn < 100 && battleState.status === "active"; turn++) {
            await takeTurn(battleState.currentTurn, { type: "normal" });
            battleState = streams.p1.states.at(-1);
        }
        assert.equal(battleState.status, "finished",
            "The existing server-authoritative actions should complete the match.");

        const completedRoomId = roomId;
        const matchClosed = waitForEvent(p2, "match-closed");
        await emitAck(p1, "leave-room", {
            roomId: completedRoomId,
            playerToken: created.playerToken
        });
        assert.equal((await matchClosed).roomId, completedRoomId);
        assert.equal((await emitResponse(p1, "rejoin-room", {
            roomId: completedRoomId,
            playerToken: created.playerToken
        })).success, false, "A completed room must not be resumable.");

        const freshRoom = await emitAck(p2, "create-room", {
            username: "Player Two",
            avatar: ""
        });
        const freshJoin = await emitAck(p1, "join-room", {
            roomId: freshRoom.roomId,
            username: "Player One",
            avatar: ""
        });
        assert.notEqual(freshRoom.roomId, completedRoomId);
        await emitAck(p2, "player-ready", freshRoom.roomId);
        await emitAck(p1, "player-ready", freshRoom.roomId);
        await emitAck(p2, "start-match", freshRoom.roomId);

        const freshState = await emitAck(p1, "rejoin-room", {
            roomId: freshRoom.roomId,
            playerToken: freshJoin.playerToken
        });
        assert.equal(freshState.draftState.turnIndex, 0);
        assert.deepEqual(freshState.draftState.banned, { p1: [], p2: [] });
        assert.deepEqual(freshState.draftState.teams, { p1: [], p2: [] });
        assert.equal(freshState.heroState, null);

        await emitAck(p2, "draft-action", {
            roomId: freshRoom.roomId,
            turnIndex: 0,
            action: "ban",
            kwamiName: "Plagg"
        });
        const disconnected = waitForEvent(p1, "player-left");
        p2.disconnect();
        await disconnected;
        p2 = await connectPlayer("Player Two");
        const resumedDraft = await emitAck(p2, "rejoin-room", {
            roomId: freshRoom.roomId,
            playerToken: freshRoom.playerToken
        });
        assert.equal(resumedDraft.draftState.turnIndex, 1);
        assert.deepEqual(resumedDraft.draftState.banned.p1, ["Plagg"],
            "Refreshing during the active draft must preserve its server state.");

        for (let turnIndex = 1; turnIndex < draft.length; turnIndex++) {
            const [seat, action, kwamiName] = draft[turnIndex];
            await emitAck(seat === "p1" ? p2 : p1, "draft-action", {
                roomId: freshRoom.roomId,
                turnIndex,
                action,
                kwamiName
            });
        }
        await emitAck(p1, "hero-action", {
            roomId: freshRoom.roomId,
            heroId: 2
        });

        const heroRoomClosed = waitForEvent(p1, "room-closed");
        await emitAck(p2, "leave-room", {
            roomId: freshRoom.roomId,
            playerToken: freshRoom.playerToken
        });
        assert.equal((await heroRoomClosed).roomId, freshRoom.roomId);
        assert.equal((await emitResponse(p1, "rejoin-room", {
            roomId: freshRoom.roomId,
            playerToken: freshJoin.playerToken
        })).success, false, "Leaving hero selection must close the old match.");

        const preMatchRoom = await emitAck(p1, "create-room", {
            username: "Player One",
            avatar: ""
        });
        const preMatchJoin = await emitAck(p2, "join-room", {
            roomId: preMatchRoom.roomId,
            username: "Player Two",
            avatar: ""
        });
        const preMatchClosed = waitForEvent(p2, "room-closed");
        await emitAck(p1, "leave-room", {
            roomId: preMatchRoom.roomId,
            playerToken: preMatchRoom.playerToken
        });
        assert.equal((await preMatchClosed).roomId, preMatchRoom.roomId);
        assert.equal((await emitResponse(p2, "rejoin-room", {
            roomId: preMatchRoom.roomId,
            playerToken: preMatchJoin.playerToken
        })).success, false, "Leaving before a match starts must close that room.");

        const replacementRoom = await emitAck(p2, "create-room", {
            username: "Player Two",
            avatar: ""
        });
        const replacementJoin = await emitAck(p1, "join-room", {
            roomId: replacementRoom.roomId,
            username: "Player One",
            avatar: ""
        });
        assert.notEqual(replacementRoom.roomId, preMatchRoom.roomId);
        await emitAck(p2, "player-ready", replacementRoom.roomId);
        await emitAck(p1, "player-ready", replacementRoom.roomId);
        await emitAck(p2, "start-match", replacementRoom.roomId);
        const replacementState = await emitAck(p1, "rejoin-room", {
            roomId: replacementRoom.roomId,
            playerToken: replacementJoin.playerToken
        });
        assert.equal(replacementState.draftState.turnIndex, 0);
        assert.deepEqual(replacementState.draftState.teams, { p1: [], p2: [] });

        for (let turnIndex = 0; turnIndex < draft.length; turnIndex++) {
            const [seat, action, kwamiName] = draft[turnIndex];
            await emitAck(seat === "p1" ? p2 : p1, "draft-action", {
                roomId: replacementRoom.roomId,
                turnIndex,
                action,
                kwamiName
            });
        }
        await emitAck(p1, "hero-action", {
            roomId: replacementRoom.roomId,
            heroId: 2
        });
        await emitAck(p2, "hero-action", {
            roomId: replacementRoom.roomId,
            heroId: 9
        });
        await emitAck(p2, "start-battle", {
            roomId: replacementRoom.roomId,
            playerToken: replacementRoom.playerToken
        });

        const battleDisconnected = waitForEvent(p2, "player-left");
        p1.disconnect();
        await battleDisconnected;
        p1 = await connectPlayer("Player One");
        const resumedBattle = await emitAck(p1, "rejoin-room", {
            roomId: replacementRoom.roomId,
            playerToken: replacementJoin.playerToken
        });
        assert.equal(resumedBattle.battle.status, "active",
            "Refreshing during battle must restore the active server battle.");
        assert.equal(resumedBattle.battle.roomId, replacementRoom.roomId);

        const sessionData = new Map([
            ["mode", "multiplayer"],
            ["multiplayerRoomId", replacementRoom.roomId],
            ["multiplayerPlayerToken", replacementJoin.playerToken],
            ["multiplayerSeat", "p2"],
            ["multiplayerDraftComplete", "true"],
            ["player1HeroIndex", "1"],
            ["player2HeroIndex", "2"],
            ["playerName", "Player One"]
        ]);
        const localData = new Map([
            ["player1", "old team"],
            ["player2", "old team"],
            ["multiplayerDraft", "old draft"],
            ["playerName", "Player One"],
            ["musicVolume", "0.5"]
        ]);
        const storage = values => ({
            getItem: key => values.has(key) ? values.get(key) : null,
            setItem: (key, value) => values.set(key, String(value)),
            removeItem: key => values.delete(key)
        });
        const helperWindow = {};
        vm.runInNewContext(
            fs.readFileSync(path.join(root, "js", "multiplayer", "session.js"), "utf8"),
            {
                window: helperWindow,
                sessionStorage: storage(sessionData),
                localStorage: storage(localData)
            }
        );
        let failedLeave;
        helperWindow.multiplayerSession.leave({ connected: false }, response => {
            failedLeave = response;
        });
        assert.equal(failedLeave.success, false);
        assert.equal(sessionData.get("multiplayerRoomId"), replacementRoom.roomId,
            "A temporary disconnect must not clear the active room token.");

        let leavePayload;
        let leaveResponse;
        helperWindow.multiplayerSession.leave({
            connected: true,
            emit: (event, payload, callback) => {
                assert.equal(event, "leave-room");
                leavePayload = payload;
                callback({ success: true, closed: true });
            }
        }, response => {
            leaveResponse = response;
        });
        assert.equal(leaveResponse.success, true);
        assert.equal(leavePayload.roomId, replacementRoom.roomId);
        assert.equal(leavePayload.playerToken, replacementJoin.playerToken);
        assert.equal(sessionData.has("multiplayerRoomId"), false);
        assert.equal(sessionData.has("player1HeroIndex"), false);
        assert.equal(sessionData.get("playerName"), "Player One");
        assert.equal(localData.has("player1"), false);
        assert.equal(localData.has("multiplayerDraft"), false);
        assert.equal(localData.get("playerName"), "Player One");
        assert.equal(localData.get("musicVolume"), "0.5");

        console.log("PASS: Two real Socket.IO clients created a room, drafted, selected heroes, and entered battle.");
        console.log("PASS: P1 and P2 attacks, Roaar/Clout narration, passive messages, extra turn, and event-before-state ordering.");
        console.log("PASS: Both clients received identical, non-duplicated action events and authoritative log slices.");
        console.log("PASS: The page's action dispatcher triggers correct P1/P2 animations, deduplicates events, and handles double attacks.");
        console.log("PASS: Completed matches, draft/hero exits, fresh room state, and active draft/battle reconnect.");
        console.log("PASS: Multiplayer cleanup preserves profiles and saved settings.");
    } finally {
        for (const client of clients) client.disconnect();
        if (server.exitCode === null) {
            server.kill();
            await new Promise(resolve => {
                server.once("exit", resolve);
                setTimeout(resolve, 2_000);
            });
        }
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
