(function () {
    "use strict";

    const roomKey = "multiplayerRoomId";
    const playerTokenKey = "multiplayerPlayerToken";
    const sessionKeys = [
        roomKey,
        playerTokenKey,
        "multiplayerSeat",
        "multiplayerDraftComplete",
        "player1HeroIndex",
        "player2HeroIndex"
    ];

    function clear(options = {}) {
        const clearTeams = options.clearTeams === true ||
            sessionStorage.getItem("mode") === "multiplayer";

        sessionKeys.forEach(key => sessionStorage.removeItem(key));
        if (sessionStorage.getItem("mode") === "multiplayer")
            sessionStorage.removeItem("mode");

        if (clearTeams) {
            localStorage.removeItem("player1");
            localStorage.removeItem("player2");
            localStorage.removeItem("multiplayerDraft");
        }
    }

    function leave(socket, callback) {
        const roomId = sessionStorage.getItem(roomKey);
        const playerToken = sessionStorage.getItem(playerTokenKey);

        if (!roomId || !playerToken) {
            clear({ clearTeams: true });
            callback?.({ success: true, closed: false });
            return;
        }

        if (!socket?.connected) {
            callback?.({
                success: false,
                message: "Reconnect before leaving the multiplayer room."
            });
            return;
        }

        socket.emit("leave-room", { roomId, playerToken }, response => {
            if (response?.success)
                clear({ clearTeams: true });
            callback?.(response || {
                success: false,
                message: "Unable to leave the multiplayer room."
            });
        });
    }

    window.multiplayerSession = Object.freeze({ clear, leave });
})();
