const HEROES = {
    0: { name: "Ayzen", hp: 250, attack: 40, speed: 30, criticalChance: 5, criticalDamage: 20, luck: 5, dodge: 5, shield: 0, healthRegen: 0 },
    1: { name: "Rebecca", hp: 280, attack: 18, speed: 5, criticalChance: 30, criticalDamage: 30, luck: 20, dodge: 10, shield: 0, healthRegen: 10 },
    2: { name: "Dook", hp: 400, attack: 18, speed: 0, criticalChance: 0, criticalDamage: 10, luck: 0, dodge: 0, shield: 0, healthRegen: 0 },
    3: { name: "Azrath", hp: 300, attack: 45, speed: 20, criticalChance: 10, criticalDamage: 10, luck: 0, dodge: 0, shield: 10, healthRegen: 0 },
    4: { name: "Ghoul", hp: 220, attack: 60, speed: 40, criticalChance: 10, criticalDamage: 50, luck: 0, dodge: 0, shield: 10, healthRegen: 0 },
    5: { name: "Devike", hp: 160, attack: 55, speed: 60, criticalChance: 30, criticalDamage: 40, luck: 0, dodge: 0, shield: 0, healthRegen: 0 },
    6: { name: "Hyloporus", hp: 360, attack: 30, speed: 5, criticalChance: 0, criticalDamage: 0, luck: 0, dodge: 0, shield: 20, healthRegen: 0 },
    7: { name: "Jabuz", hp: 200, attack: 80, speed: 10, criticalChance: 0, criticalDamage: 0, luck: 0, dodge: 0, shield: 0, healthRegen: 0 },
    8: { name: "Raya", hp: 220, attack: 50, speed: 0, criticalChance: 30, criticalDamage: 50, luck: 10, dodge: 20, shield: 0, healthRegen: 0 },
    9: { name: "Roku", hp: 300, attack: 30, speed: 0, criticalChance: 0, criticalDamage: 0, luck: 0, dodge: 0, shield: 80, healthRegen: 0 },
    10: { name: "Archi", hp: 200, attack: 90, speed: 45, criticalChance: 40, criticalDamage: 30, luck: 0, dodge: 0, shield: 0, healthRegen: 0 }
};

const KWAMI_STATS = {
    Tikki: { hp: 50, damage: 5, speed: 5, luck: 5, charge: 6 },
    Plagg: { hp: 10, damage: 120, speed: 10, luck: 5, charge: 3 },
    Wayz: { hp: 40, damage: 8, speed: 1, luck: 5, charge: 6 },
    Trics: { hp: 30, damage: 4, speed: 12, luck: 5, charge: 6 },
    Pollen: { hp: 15, damage: 12, speed: 12, luck: 5, charge: 5 },
    Roaar: { hp: 10, damage: 20, speed: 7, luck: 5, charge: 8 },
    Longg: { hp: 30, damage: 15, speed: 3, luck: 5, charge: 2 },
    Kaalki: { hp: 30, damage: 2, speed: 5, luck: 5, charge: 4 },
    Fluff: { hp: 20, damage: 2, speed: 10, luck: 5, charge: 6 },
    Sass: { hp: 20, damage: 12, speed: 10, luck: 5, charge: 4 },
    Daizzi: { hp: 60, damage: 2, speed: 3, luck: 5, charge: 5 },
    Mullo: { hp: 15, damage: 20, speed: 4, luck: 50, charge: 2 },
    Nuroo: { hp: 35, damage: 15, speed: 9, luck: 5, charge: 10 },
    Orikko: { hp: 40, damage: 20, speed: 3, luck: 5, charge: 4 },
    Stomp: { hp: 40, damage: 4, speed: 1, luck: 5, charge: 6 },
    Tussoo: { hp: 30, damage: 18, speed: 2, luck: 5, charge: 4 },
    Xuppu: { hp: 10, damage: 15, speed: 4, luck: 5, charge: 4 },
    Ziggy: { hp: 45, damage: 10, speed: 2, luck: 5, charge: 3 },
    Bark: { hp: 30, damage: 5, speed: 10, luck: 5, charge: 3 }
};

const ABILITY_DETAILS = {
    Tikki: { name: "Lucky Charm", message: "✨ Tikki used Lucky Charm!" },
    Plagg: { name: "Cataclysm", message: "💥 Plagg used Cataclysm!" },
    Wayz: { name: "Shell-ter", message: "🛡 Wayz used Shell-ter!" },
    Trics: { name: "Mirage", message: "🦊 Trics used Mirage!" },
    Pollen: { name: "Venom", message: "🐝 Pollen used Venom!" },
    Roaar: { name: "Clout", message: "🦁 Roaar used Clout!" },
    Longg: { name: "Elemental Burst", message: "🐉 Longg used Elemental Burst!" },
    Kaalki: { name: "Voyage", message: "🐎 Kaalki used Voyage!" },
    Fluff: { name: "Burrow", message: "🐇 Fluff used Burrow!" },
    Sass: { name: "Second Chance", message: "🐍 Sass used Second Chance!" },
    Daizzi: { name: "Jubilation", message: "🐷 Daizzi used Jubilation!" },
    Mullo: { name: "Multitude", message: "🐭 Mullo used Multitude!" },
    Nuroo: { name: "Akumatize", message: "🦋 Nuroo used Akumatize!" },
    Orikko: { name: "Sublimation", message: "🪽 Orikko used Sublimation!" },
    Stomp: { name: "Resistance", message: "🐂 Stomp used Resistance!" },
    Tussoo: { name: "Genesis Feast", message: "🐖 Tussoo used Genesis Feast!" },
    Xuppu: { name: "Uproar", message: "🐵 Xuppu used Uproar!" },
    Ziggy: { name: "Genesis", message: "🐐 Ziggy used Genesis!" },
    Bark: { name: "Copycat", message: "🐶 Bark used Copycat!" }
};

function createPlayer(seat, heroId, teamNames, username) {
    const hero = HEROES[heroId];
    const team = teamNames.map(name => {
        const stats = KWAMI_STATS[name] || {};
        return { name, cooldown: 0, charge: stats.charge || 0 };
    });

    let hp = hero.hp;
    let damage = hero.attack;
    let speed = hero.speed;
    let luck = 5 + (hero.luck || 0);
    let shield = hero.shield || 0;
    let maxHp = hp;

    team.forEach(kwami => {
        const stats = KWAMI_STATS[kwami.name] || {};
        hp += stats.hp || 0;
        damage += stats.damage || 0;
        speed += stats.speed || 0;
        luck = Math.max(luck, stats.luck || 0);
    });
    maxHp = hp;

    if (teamNames.includes("Longg") && teamNames.includes("Kaalki")) {
        speed += 20;
    }

    return {
        seat,
        username,
        heroId,
        heroName: hero.name,
        team,
        hp,
        maxHp,
        damage,
        speed,
        luck,
        shield,
        dodge: false,
        immune: false,
        stunned: false,
        frozen: false,
        damageBuff: 0,
        damageReduction: 0,
        regenAmount: 0,
        regenTurns: 0,
        passiveDisabled: false,
        abilityBoost: false,
        creationDestruction: teamNames.includes("Tikki") && teamNames.includes("Plagg"),
        guardian: teamNames.includes("Wayz") && teamNames.includes("Stomp"),
        chaosIllusion: teamNames.includes("Trics") && teamNames.includes("Nuroo"),
        dragonRider: teamNames.includes("Longg") && teamNames.includes("Kaalki"),
        timeLoop: teamNames.includes("Fluff") && teamNames.includes("Sass"),
        firstTurnBonus: true
    };
}

function initializeBattle(room) {
    const p1 = room.players.find(player => player.seat === "p1");
    const p2 = room.players.find(player => player.seat === "p2");
    const players = {
        p1: createPlayer("p1", room.heroState.selections.p1, room.draftState.teams.p1, p1.username),
        p2: createPlayer("p2", room.heroState.selections.p2, room.draftState.teams.p2, p2.username)
    };

    if (players.p1.creationDestruction) {
        players.p1.hp += 20;
        players.p1.maxHp += 20;
    }
    if (players.p2.creationDestruction) {
        players.p2.hp += 20;
        players.p2.maxHp += 20;
    }
    if (players.p1.guardian) players.p1.shield += 30;
    if (players.p2.guardian) players.p2.shield += 30;

    let currentTurn = "p1";
    if (players.p1.dragonRider && !players.p2.dragonRider) currentTurn = "p1";
    else if (players.p2.dragonRider && !players.p1.dragonRider) currentTurn = "p2";
    else if (players.p2.speed > players.p1.speed) currentTurn = "p2";
    else if (players.p2.speed === players.p1.speed) currentTurn = Math.random() < 0.5 ? "p1" : "p2";

    room.battle = {
        status: "active",
        currentTurn,
        players,
        sequence: 0,
        lastAbilityUsed: null,
        extraTurn: false,
        doubleAttack: false,
        log: [],
        winnerSeat: null
    };

    const synergies = [];
    for (const seat of ["p1", "p2"]) {
        const player = players[seat];
        if (player.dragonRider) synergies.push(`${player.username}: Dragon Rider activated.`);
        if (player.creationDestruction) synergies.push(`${player.username}: Creation & Destruction activated.`);
        if (player.guardian) synergies.push(`${player.username}: Guardian activated.`);
        if (player.chaosIllusion) synergies.push(`${player.username}: Chaos Illusion activated.`);
        if (player.timeLoop) synergies.push(`${player.username}: Time Loop activated.`);
    }
    room.battle.log.push(...synergies);
}

function snapshot(room) {
    if (!room.battle) return null;
    const battle = room.battle;
    return {
        roomId: room.id,
        status: battle.status,
        currentTurn: battle.currentTurn,
        sequence: battle.sequence,
        extraTurn: battle.extraTurn,
        doubleAttack: battle.doubleAttack,
        players: {
            p1: publicPlayer(battle.players.p1),
            p2: publicPlayer(battle.players.p2)
        },
        log: [...battle.log],
        winnerSeat: battle.winnerSeat,
        winnerName: battle.winnerSeat ? battle.players[battle.winnerSeat].username : null
    };
}

function publicPlayer(player) {
    return {
        seat: player.seat,
        username: player.username,
        heroId: player.heroId,
        heroName: player.heroName,
        hp: player.hp,
        maxHp: player.maxHp,
        shield: player.shield,
        damage: player.damage,
        speed: player.speed,
        team: player.team.map(kwami => ({ name: kwami.name, cooldown: kwami.cooldown, charge: kwami.charge })),
        stunned: player.stunned,
        frozen: player.frozen,
        dodge: player.dodge,
        immune: player.immune,
        damageBuff: player.damageBuff,
        damageReduction: player.damageReduction,
        regenTurns: player.regenTurns,
        passiveDisabled: player.passiveDisabled,
        abilityBoost: player.abilityBoost
    };
}

function changedPlayerEffects(beforePlayer, afterPlayer) {
    const fields = [
        "hp", "maxHp", "shield", "stunned", "frozen", "dodge", "immune",
        "damageBuff", "damageReduction", "regenTurns", "passiveDisabled",
        "abilityBoost"
    ];
    const changes = {};

    fields.forEach(field => {
        if (beforePlayer[field] !== afterPlayer[field]) {
            changes[field] = {
                before: beforePlayer[field],
                after: afterPlayer[field]
            };
        }
    });

    const beforeCooldowns = new Map(beforePlayer.team.map(kwami => [kwami.name, kwami.cooldown]));
    const cooldownChanges = afterPlayer.team
        .filter(kwami => beforeCooldowns.get(kwami.name) !== kwami.cooldown)
        .map(kwami => ({
            kwamiName: kwami.name,
            before: beforeCooldowns.get(kwami.name),
            after: kwami.cooldown
        }));

    if (cooldownChanges.length) changes.cooldowns = cooldownChanges;
    return changes;
}

function createActionEvent(before, after, actionType, abilityName, directDamage) {
    const actorSeat = before.currentTurn;
    const targetSeat = actorSeat === "p1" ? "p2" : "p1";
    const attacker = after.players[actorSeat];
    const target = after.players[targetSeat];
    const previousTarget = before.players[targetSeat];
    const messages = after.log.slice(before.log.length);

    return {
        sequence: after.sequence,
        actionType,
        actionName: actionType === "normal"
            ? "Normal Attack"
            : (ABILITY_DETAILS[abilityName]?.name || abilityName),
        abilityName: abilityName || null,
        actor: { seat: actorSeat, username: attacker.username },
        attacker: {
            seat: attacker.seat,
            username: attacker.username,
            heroName: attacker.heroName
        },
        target: {
            seat: target.seat,
            username: target.username,
            heroName: target.heroName
        },
        damage: {
            hp: Math.max(0, previousTarget.hp - target.hp),
            shield: Math.max(0, previousTarget.shield - target.shield),
            total: Math.max(0, previousTarget.hp - target.hp) +
                Math.max(0, previousTarget.shield - target.shield)
        },
        directDamage,
        effects: {
            players: {
                p1: changedPlayerEffects(before.players.p1, after.players.p1),
                p2: changedPlayerEffects(before.players.p2, after.players.p2)
            },
            extraTurn: messages.includes("Extra Turn!"),
            doubleAttack: messages.includes("Double Attack!"),
            doubleAttackReady: after.doubleAttack
        },
        messages,
        logStart: before.log.length,
        logEnd: after.log.length
    };
}

function reduceCooldowns(player) {
    player.team.forEach(kwami => {
        if (kwami.cooldown > 0) kwami.cooldown--;
    });
}

function endTurn(battle) {
    const current = battle.players[battle.currentTurn];
    reduceCooldowns(current);

    if (battle.extraTurn) {
        battle.extraTurn = false;
        battle.log.push("Extra Turn!");
        activatePassives(battle, battle.currentTurn);
        return;
    }

    current.damageBuff = 0;
    current.damageReduction = 0;
    battle.currentTurn = battle.currentTurn === "p1" ? "p2" : "p1";

    const next = battle.players[battle.currentTurn];
    if (next.stunned || next.frozen) {
        battle.log.push(next.stunned ? "The next player is stunned!" : "The next player is frozen!");
        next.stunned = false;
        next.frozen = false;
        reduceCooldowns(next);
        battle.currentTurn = battle.currentTurn === "p1" ? "p2" : "p1";
    }
    activatePassives(battle, battle.currentTurn);
}

function activatePassives(battle, seat) {
    const player = battle.players[seat];
    if (player.regenTurns > 0) {
        player.hp = Math.min(player.maxHp, player.hp + player.regenAmount);
        player.regenTurns--;
        battle.log.push(`${player.username} regenerated ${player.regenAmount} HP.`);
    }
    if (player.passiveDisabled) {
        player.passiveDisabled = false;
        battle.log.push(`${player.username}'s passive was disabled.`);
        return;
    }

    player.team.forEach(kwami => {
        if (kwami.name === "Tikki") {
            player.regenAmount = 4;
            player.regenTurns = 3;
            battle.log.push("Tikki passively granted 4 HP regeneration for 3 turns.");
        } else if (kwami.name === "Plagg") {
            const opponentSeat = seat === "p1" ? "p2" : "p1";
            battle.players[opponentSeat].hp = Math.max(0, battle.players[opponentSeat].hp - 10);
            battle.log.push("Plagg passively dealt 10 True Damage.");
        } else if (kwami.name === "Wayz") {
            player.regenAmount = 5;
            player.regenTurns = 2;
            battle.log.push("Wayz passively granted 5 HP regeneration for 2 turns.");
        } else if (kwami.name === "Tussoo") {
            player.regenAmount = 10;
            player.regenTurns = 2;
            battle.log.push("Tussoo passively granted 10 HP regeneration for 2 turns.");
        }
    });
    checkWinner(battle);
}

function applyDamage(battle, attackerSeat, amount) {
    const attacker = battle.players[attackerSeat];
    const defenderSeat = attackerSeat === "p1" ? "p2" : "p1";
    const defender = battle.players[defenderSeat];

    if (attacker.abilityBoost) {
        amount = Math.floor(amount * 1.5);
        attacker.abilityBoost = false;
    }

    amount = Math.max(0, amount + attacker.damageBuff - defender.damageReduction);

    if (defender.dodge) {
        defender.dodge = false;
        battle.log.push(`${defender.username} dodged!`);
        return;
    }
    if (defender.immune) {
        defender.immune = false;
        battle.log.push(`${defender.username} is immune!`);
        return;
    }

    let shieldDamage = 0;
    if (!attacker.chaosIllusion && defender.shield > 0) {
        const previousShield = defender.shield;
        if (defender.shield >= amount) {
            defender.shield -= amount;
            amount = 0;
        } else {
            amount -= defender.shield;
            defender.shield = 0;
        }
        shieldDamage = previousShield - defender.shield;
    }

    const previousHp = defender.hp;
    defender.hp = Math.max(0, defender.hp - amount);
    if (battle.currentActionDamage) {
        battle.currentActionDamage.hp += previousHp - defender.hp;
        battle.currentActionDamage.shield += shieldDamage;
    }
}

function checkWinner(battle) {
    if (battle.players.p1.hp <= 0) {
        battle.status = "finished";
        battle.winnerSeat = "p2";
    } else if (battle.players.p2.hp <= 0) {
        battle.status = "finished";
        battle.winnerSeat = "p1";
    }
}

function performNormalAttack(room) {
    const battle = room.battle;
    if (!battle || battle.status !== "active") return { success: false, message: "The battle is not active." };

    const before = snapshot(room);
    const directDamage = { hp: 0, shield: 0 };
    battle.currentActionDamage = directDamage;
    const attackerSeat = battle.currentTurn;
    const attacker = battle.players[attackerSeat];
    battle.log.push(`⚔ ${attacker.username} used Normal Attack!`);

    if (Math.random() * 100 < 5) {
        battle.log.push("Attack Missed!");
    } else {
        let damage = attacker.damage;
        if (attacker.creationDestruction && attacker.firstTurnBonus) {
            damage += 20;
            attacker.firstTurnBonus = false;
        }

        if (Math.random() * 100 < attacker.luck) {
            damage = Math.floor(damage * 1.5);
            battle.log.push("Critical Hit!");
        }

        applyDamage(battle, attackerSeat, damage);

        if (battle.doubleAttack) {
            battle.doubleAttack = false;
            battle.log.push("Double Attack!");
            applyDamage(battle, attackerSeat, damage);
        }
    }

    checkWinner(battle);
    battle.sequence++;
    if (battle.status === "active") endTurn(battle);
    battle.currentActionDamage = null;
    return {
        success: true,
        event: createActionEvent(before, snapshot(room), "normal", null, directDamage)
    };
}

function performAbility(room, kwamiName) {
    const battle = room.battle;
    if (!battle || battle.status !== "active") return { success: false, message: "The battle is not active." };
    const attackerSeat = battle.currentTurn;
    const attacker = battle.players[attackerSeat];
    const defenderSeat = attackerSeat === "p1" ? "p2" : "p1";
    const defender = battle.players[defenderSeat];
    const kwami = attacker.team.find(item => item.name === kwamiName);
    if (!kwami) return { success: false, message: "That Kwami does not belong to the active player." };
    if (kwami.cooldown !== 0) return { success: false, message: "Ability is on cooldown." };

    const before = snapshot(room);
    const directDamage = { hp: 0, shield: 0 };
    battle.currentActionDamage = directDamage;
    const miss = () => Math.random() * 100 < 5;
    const criticalAbility = (damage) => {
        if (miss()) {
            battle.log.push("Attack Missed!");
            return 0;
        }
        let finalDamage = damage;
        if (Math.random() * 100 < (kwami.luck + (attacker.luckBonus || 0))) {
            finalDamage = Math.floor(finalDamage * 1.5);
            battle.log.push("Critical Hit!");
        }
        applyDamage(battle, attackerSeat, finalDamage);
        return finalDamage;
    };
    const heal = amount => {
        attacker.hp = Math.min(attacker.hp + amount, attacker.maxHp);
    };
    const reduceAlliesCooldowns = amount => {
        attacker.team.forEach(other => {
            if (other.name !== "Fluff" && other.cooldown > 0)
                other.cooldown = Math.max(0, other.cooldown - amount);
        });
    };

    battle.log.push(ABILITY_DETAILS[kwamiName]?.message || `${kwamiName} used an ability.`);

    switch (kwamiName) {
        case "Tikki":
            heal(70);
            criticalAbility(40);
            break;
        case "Plagg":
            defender.shield = 0;
            criticalAbility(120);
            break;
        case "Wayz":
            criticalAbility(40);
            attacker.shield += 30;
            attacker.damageReduction = 10;
            battle.extraTurn = true;
            break;
        case "Trics":
            criticalAbility(60);
            heal(10);
            battle.extraTurn = true;
            break;
        case "Pollen":
            criticalAbility(55);
            defender.stunned = true;
            break;
        case "Roaar":
            criticalAbility(100);
            battle.extraTurn = true;
            break;
        case "Longg": {
            criticalAbility(80);
            heal(20);
            battle.doubleAttack = true;
            const longgDamageBefore = defender.hp;
            defender.hp = Math.max(0, defender.hp - 10);
            directDamage.hp += longgDamageBefore - defender.hp;
            break;
        }
        case "Kaalki":
            attacker.dodge = true;
            criticalAbility(60);
            defender.shield = 0;
            break;
        case "Fluff":
            criticalAbility(40);
            reduceAlliesCooldowns(10);
            break;
        case "Sass":
            criticalAbility(30);
            reduceAlliesCooldowns(1);
            battle.extraTurn = true;
            break;
        case "Daizzi":
            heal(50);
            battle.extraTurn = true;
            break;
        case "Mullo":
            criticalAbility(35);
            battle.doubleAttack = true;
            break;
        case "Nuroo":
            criticalAbility(150);
            attacker.damageBuff = 40;
            attacker.regenAmount = 10;
            attacker.regenTurns = 2;
            break;
        case "Orikko": {
            const randomBuff = Math.floor(Math.random() * 5);
            if (randomBuff === 0) heal(40);
            else if (randomBuff === 1) attacker.damageBuff = 50;
            else if (randomBuff === 2) attacker.shield += 50;
            else if (randomBuff === 3) attacker.dodge = true;
            battle.log.push(`Sublimation result: ${randomBuff === 0 ? "Healing" : randomBuff === 1 ? "Strength" : randomBuff === 2 ? "Protection" : randomBuff === 3 ? "Agility" : "No effect"}`);
            break;
        }
        case "Stomp":
            attacker.immune = true;
            attacker.shield += 10;
            criticalAbility(40);
            battle.extraTurn = true;
            break;
        case "Tussoo":
            heal(10);
            criticalAbility(80);
            break;
        case "Xuppu":
            defender.passiveDisabled = true;
            criticalAbility(100);
            break;
        case "Ziggy":
            attacker.luckBonus = 20;
            attacker.abilityBoost = true;
            break;
        case "Bark": {
            const previous = battle.lastAbilityUsed?.name;
            if (previous && previous !== "Bark") {
                battle.log.push(`Bark copied ${previous}.`);
                switch (previous) {
                    case "Tikki": heal(50); criticalAbility(35); break;
                    case "Plagg": defender.shield = 0; criticalAbility(80); break;
                    case "Wayz": criticalAbility(35); attacker.shield += 30; attacker.damageReduction = 10; battle.extraTurn = true; break;
                    case "Trics": criticalAbility(40); heal(10); battle.extraTurn = true; break;
                    case "Pollen": criticalAbility(30); defender.stunned = true; break;
                    case "Roaar": criticalAbility(50); battle.extraTurn = true; break;
                    case "Longg": {
                        criticalAbility(45);
                        heal(10);
                        battle.doubleAttack = true;
                        const longgDamageBefore = defender.hp;
                        defender.hp = Math.max(0, defender.hp - 10);
                        directDamage.hp += longgDamageBefore - defender.hp;
                        break;
                    }
                    case "Kaalki": attacker.dodge = true; criticalAbility(40); defender.shield = 0; break;
                    case "Fluff": criticalAbility(40); reduceAlliesCooldowns(10); break;
                    case "Sass": criticalAbility(20); reduceAlliesCooldowns(1); battle.extraTurn = true; break;
                    case "Daizzi": heal(60); battle.extraTurn = true; break;
                    case "Mullo": criticalAbility(25); battle.doubleAttack = true; break;
                    case "Nuroo": criticalAbility(40); attacker.damageBuff = 40; attacker.regenAmount = 10; attacker.regenTurns = 2; break;
                    case "Orikko": {
                        const copiedBuff = Math.floor(Math.random() * 5);
                        if (copiedBuff === 0) heal(40);
                        else if (copiedBuff === 1) attacker.damageBuff = 50;
                        else if (copiedBuff === 2) attacker.shield += 50;
                        else if (copiedBuff === 3) attacker.dodge = true;
                        break;
                    }
                    case "Stomp": attacker.immune = true; attacker.shield += 10; criticalAbility(30); battle.extraTurn = true; break;
                    case "Tussoo": heal(10); criticalAbility(60); break;
                    case "Xuppu": criticalAbility(60); defender.passiveDisabled = true; break;
                    case "Ziggy": attacker.luckBonus = 20; attacker.abilityBoost = true; break;
                }
            } else {
                criticalAbility(20);
            }
            break;
        }
    }

    if (attacker.creationDestruction && (kwamiName === "Tikki" || kwamiName === "Plagg")) {
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + 20);
    }

    battle.lastAbilityUsed = { name: kwamiName };
    kwami.cooldown = Math.max(1, kwami.charge - (attacker.timeLoop ? 1 : 0));
    checkWinner(battle);
    battle.sequence++;
    if (battle.status === "active") endTurn(battle);
    battle.currentActionDamage = null;
    return {
        success: true,
        event: createActionEvent(before, snapshot(room), "ability", kwamiName, directDamage)
    };
}

module.exports = { initializeBattle, snapshot, performNormalAttack, performAbility };
