function createMultiplayerActionEventHandler({
    getRoomId,
    appendLogMessages,
    playAttackAnimation,
    playHurtAnimation,
    schedule = setTimeout
}) {
    const seenActionEvents = new Set();
    let lastActionSequence = 0;

    return event => {
        if (!event || event.roomId !== getRoomId()) return;

        const sequence = Number(event.sequence);
        const eventId = typeof event.actionId === "string"
            ? event.actionId
            : `${event.roomId}:${sequence}`;

        if (!Number.isInteger(sequence) || sequence <= lastActionSequence ||
            seenActionEvents.has(eventId)) {
            return;
        }

        seenActionEvents.add(eventId);
        if (seenActionEvents.size > 256) {
            seenActionEvents.delete(seenActionEvents.values().next().value);
        }
        lastActionSequence = sequence;
        appendLogMessages(event.messages, event.logStart);

        const attackerSeat = event.attacker?.seat;
        if (attackerSeat !== "p1" && attackerSeat !== "p2") return;
        playAttackAnimation(attackerSeat);
        if (event.effects?.doubleAttack) {
            schedule(() => playAttackAnimation(attackerSeat), 250);
        }

        const targetSeat = event.target?.seat;
        if (event.directDamage?.hp > 0 &&
            (targetSeat === "p1" || targetSeat === "p2")) {
            playHurtAnimation(targetSeat);
        }
    };
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { createMultiplayerActionEventHandler };
}
