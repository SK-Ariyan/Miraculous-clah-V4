// ==========================
// CARD CONTAINER
// ==========================

const cardContainer = document.getElementById("cardContainer");
const multiplayerMode = sessionStorage.getItem("mode") === "multiplayer";

// ==========================
// HTML ELEMENTS
// ==========================

const player1Title = document.getElementById("player1");
const player2Title = document.getElementById("player2");

const turnText = document.getElementById("turnText");



const pickInfo = document.getElementById("pickInfo");

// PLAYER SLOTS

const p1Slots = [
document.getElementById("p1slot1"),
document.getElementById("p1slot2"),
document.getElementById("p1slot3")
];

const p2Slots = [
document.getElementById("p2slot1"),
document.getElementById("p2slot2"),
document.getElementById("p2slot3")
];

// BANNED KWAMI SLOTS

const p1BanSlot = document.getElementById("p1banSlot");
const p2BanSlot = document.getElementById("p2banSlot");

let player1BannedKwamis = [];
let player2BannedKwamis = [];

// ==========================
// ALL KWAMIS
// ==========================



// ==========================
// CREATE CARDS
// ==========================

kwamis.forEach((kwami,index)=>{

    const card = document.createElement("div");

    card.className = "card";
card.dataset.index = index;
card.dataset.kwami = kwami.name.toLowerCase();

// Individual Kwami theme
let themeColor = kwami.accent;

if (kwami.name === "Orikko") {
    themeColor = "#90CAF9"; // Avoid a white card
}

card.style.setProperty("--kwami-color", themeColor);
card.dataset.kwami = kwami.name.toLowerCase();

    card.innerHTML = `
        <img src="${kwami.image}">
    `;

    card.addEventListener("click",()=>{
        selectKwami(card,kwami);
    });

    cardContainer.appendChild(card);

});



// ==========================
// DRAFT VARIABLES
// ==========================
// ==========================
// DRAFT VARIABLES
// ==========================

let draftOrder;

if(multiplayerMode){
    draftOrder = [];
}else if(Math.random() < 0.5){

    draftOrder = [
        "p1",
        "p2",
        "p2",
        "p1",
        "p1",
        "p2"
    ];

}else{

    draftOrder = [
        "p2",
        "p1",
        "p1",
        "p2",
        "p2",
        "p1"
    ];

}
let turn = 0;

let player1Team = [];
let player2Team = [];

// Separate ban records for display
 player1BannedKwamis = [];
 player2BannedKwamis = [];

let phase = "ban";
let bannedKwamis = [];
let multiplayerSocket = null;
let multiplayerSeat = null;
let multiplayerDraftState = null;
let multiplayerActionPending = false;
let multiplayerRedirectScheduled = false;

// ==========================
// UPDATE UI
// ==========================
// ==========================
// ADVANCE TURN
// ==========================
let uiLocked = false;

function lockUI(duration = 1500){

    uiLocked = true;

    setTimeout(()=>{

        uiLocked = false;

    }, duration);

}
function advanceTurn(){

    // Draft finished
if(turn >= draftOrder.length){

    localStorage.setItem("player1", JSON.stringify(player1Team));
    localStorage.setItem("player2", JSON.stringify(player2Team));

    if(window.bgMusic){
        bgMusic.pause();
    }

    goTo("./hero-selection.html");
    return;
}

    updateTurnUI();

    const mode = sessionStorage.getItem("mode");

    if(mode != "ai")
    return;

// AI Ban
if(phase == "ban" && turn == 1){

    nextBanTurn();
    return;

}

// AI Draft
if(phase == "draft" && draftOrder[turn] == "p2"){

    nextDraftTurn();
    return;

}

}
function updateTurnUI(){

    if(uiLocked)
    return;

    player1Title.classList.remove("active");
    player2Title.classList.remove("active");

    if(phase=="ban"){

        if(turn==0){

            player1Title.classList.add("active");
            turnText.innerHTML=`❌ ${playerName} BANNING`;

        }else{

            player2Title.classList.add("active");
            turnText.innerHTML=`❌ Opponent BANNING`;

        }

        pickInfo.innerHTML="Ban "+(turn+1)+" of 2";
        return;

    }

    if(draftOrder[turn]=="p1"){

        player1Title.classList.add("active");
        turnText.innerHTML=`✨ ${playerName} SELECTING ✨`;

    }else{

        player2Title.classList.add("active");
        turnText.innerHTML=`✨ Opponent SELECTING ✨`;

    }

    pickInfo.innerHTML="Pick "+(turn+1)+" of 6";

}

function isAITurn(){
    if(sessionStorage.getItem("mode") !== "ai")
        return false;

    if(phase === "ban")
        return turn === 1;

    return draftOrder[turn] === "p2";
}

// ==========================
// SELECT A KWAMI
// ==========================

function selectKwami(card,kwami,aiAction = false){

    if(multiplayerMode){
        submitMultiplayerDraftAction(kwami);
        return;
    }

    if(isAITurn() && !aiAction)
        return;

    if(card.classList.contains("selected"))
        return;

    if(card.classList.contains("banned"))
        return;

    // -------------------------
    // BAN PHASE
    // -------------------------

   
if(phase=="ban"){

    bannedKwamis.push(kwami.name);

    // Record which player banned this Kwami
    if(turn === 0){
        player1BannedKwamis.push(kwami);
    }else{
        player2BannedKwamis.push(kwami);
    }

    card.classList.add("banned");

    updateBannedSlots();

    banSound.currentTime = 0;
    banSound.play();

    turn++;

    if(turn == 2){
        phase = "draft";
        turn = 0;
    }

    advanceTurn();
    return;
}

    // -------------------------
    // PICK PHASE
    // -------------------------

const currentPlayer = draftOrder[turn];

if(currentPlayer=="p1"){

    player1Team.push(kwami);

}else{

    player2Team.push(kwami);

}

card.classList.add("selected");
selectSound.currentTime = 0;
selectSound.play();

updateSlots();

updatePreviewStats();

turn++;

advanceTurn();

return;

}

function updatePreviewStats(){

    let p1HP = 200;
    let p1Damage = 0;
    let p1Speed = 0;

    player1Team.forEach(k=>{
        p1HP += k.hp;
        p1Damage += k.damage;
        p1Speed += k.speed;
    });

    document.getElementById("player1HPPreview").innerHTML = p1HP;
    document.getElementById("player1DamagePreview").innerHTML = p1Damage;
    document.getElementById("player1SpeedPreview").innerHTML = p1Speed;

    let p2HP = 200;
    let p2Damage = 0;
    let p2Speed = 0;

    player2Team.forEach(k=>{
        p2HP += k.hp;
        p2Damage += k.damage;
        p2Speed += k.speed;
    });

    document.getElementById("player2HPPreview").innerHTML = p2HP;
    document.getElementById("player2DamagePreview").innerHTML = p2Damage;
    document.getElementById("player2SpeedPreview").innerHTML = p2Speed;

}

function nextDraftTurn(){
    if(uiLocked)
    return;

    const thinkTime = 1200 + Math.random() * 800;

    turnText.innerHTML = "🤖 Opponent is analyzing...";

    setTimeout(()=>{

        const aiPick = DraftAI.choosePick(player2Team);

        if(!aiPick){
            console.log("No AI Pick");
            return;
        }

        const aiCard = [...document.querySelectorAll(".card")].find(card=>{

            return Number(card.dataset.index) === kwamis.indexOf(aiPick);

        });

        if(!aiCard){
            console.log("Card not found");
            return;
        }

        turnText.innerHTML =
        `🤖 Opponent selected ${aiPick.name}`;

        setTimeout(()=>{

            selectKwami(aiCard, aiPick, true);

        },700);

    },thinkTime);

}

function nextBanTurn(){

    turnText.innerHTML = "🤖 Opponent is analyzing...";

    const thinkTime = 1000 + Math.random() * 700;

    setTimeout(()=>{

        const aiBan = DraftAI.chooseBan(
            kwamis,
            bannedKwamis
        );

        if(!aiBan){
            console.log("No AI Ban");
            return;
        }

        const aiCard = [...document.querySelectorAll(".card")].find(card=>{

            return Number(card.dataset.index) === kwamis.indexOf(aiBan);

        });

        if(!aiCard){
            console.log("Ban card not found");
            return;
        }

        turnText.innerHTML =
        `🤖 Opponent banned ${aiBan.name}`;

        setTimeout(()=>{

            selectKwami(aiCard, aiBan, true);

        },700);

    },thinkTime);

}




function updateSlots(){

    p1Slots.forEach(slot => slot.innerHTML = "");
    p2Slots.forEach(slot => slot.innerHTML = "");

    player1Team.forEach((kwami,index)=>{
        p1Slots[index].innerHTML = `<img src="${kwami.image}">`;
    });

    player2Team.forEach((kwami,index)=>{
        p2Slots[index].innerHTML = `<img src="${kwami.image}">`;
    });

}

// ==========================
// UPDATE BANNED KWAMI SLOTS
// ==========================

function updateBannedSlots(){

    p1BanSlot.innerHTML = "";
    p2BanSlot.innerHTML = "";
    
    player1BannedKwamis.forEach(kwami=>{
        p1BanSlot.innerHTML += `
            <div class="bannedKwami">
                <img src="${kwami.image}" alt="${kwami.name}">
                <span>${kwami.name}</span>
                <strong>BANNED</strong>
            </div>
        `;
    });
    
    player2BannedKwamis.forEach(kwami=>{
        p2BanSlot.innerHTML += `
            <div class="bannedKwami">
                <img src="${kwami.image}" alt="${kwami.name}">
                <span>${kwami.name}</span>
                <strong>BANNED</strong>
            </div>
        `;
    });
    
    }

function startMultiplayerDraft(){
    const roomId = sessionStorage.getItem("multiplayerRoomId");
    const playerToken = sessionStorage.getItem("multiplayerPlayerToken");

    if(!roomId || !playerToken || typeof io !== "function"){
        turnText.textContent = "Room connection information is missing. Return to the multiplayer lobby.";
        cardContainer.querySelectorAll(".card").forEach(card => {
            card.style.pointerEvents = "none";
        });
        return;
    }

    multiplayerSocket = io({ reconnection: true });

    multiplayerSocket.on("connect", ()=>{
        multiplayerActionPending = false;
        turnText.textContent = "Reconnecting to the multiplayer draft...";
        multiplayerSocket.emit("rejoin-room", { roomId, playerToken }, response => {
            if(!response?.success){
                turnText.textContent = response?.message || "Could not rejoin the draft room.";
                return;
            }

            multiplayerSeat = response.seat;
            sessionStorage.setItem("multiplayerSeat", multiplayerSeat);
            if(response.draftState)
                renderMultiplayerDraft(response.draftState);

            console.log("MULTIPLAYER REJOIN:", {
                seat: multiplayerSeat,
                roomId,
                draftState: response.draftState
            });
        });
    });

    multiplayerSocket.on("draft-state", renderMultiplayerDraft);
    multiplayerSocket.on("disconnect", ()=>{
        multiplayerActionPending = false;
        turnText.textContent = "Connection lost. Reconnecting to the draft...";
        cardContainer.querySelectorAll(".card").forEach(card => {
            card.style.pointerEvents = "none";
        });
    });
    multiplayerSocket.on("connect_error", ()=>{
        turnText.textContent = "Unable to connect. Retrying...";
    });
}

function submitMultiplayerDraftAction(kwami){
    const currentAction = multiplayerDraftState?.currentAction;
    if(!multiplayerSocket?.connected || multiplayerActionPending ||
        multiplayerDraftState?.status !== "drafting" ||
        currentAction?.seat !== multiplayerSeat){
        return;
    }

    multiplayerActionPending = true;
    cardContainer.querySelectorAll(".card").forEach(card => {
        card.style.pointerEvents = "none";
    });

    multiplayerSocket.emit("draft-action", {
        roomId: sessionStorage.getItem("multiplayerRoomId"),
        action: currentAction.action,
        kwamiName: kwami.name,
        turnIndex: multiplayerDraftState.turnIndex
    }, response => {
        multiplayerActionPending = false;
        if(!response?.success){
            turnText.textContent = response?.message || "That draft action was rejected.";
            if(multiplayerDraftState)
                renderMultiplayerDraft(multiplayerDraftState);
        }else if(multiplayerDraftState){
            renderMultiplayerDraft(multiplayerDraftState);
        }
    });
}

function renderMultiplayerDraft(state){
    if(!state || !Array.isArray(state.teams?.p1) || !Array.isArray(state.teams?.p2))
        return;

    const previousState = multiplayerDraftState;
    multiplayerDraftState = state;
    player1Team = state.teams.p1.map(name => kwamis.find(kwami => kwami.name === name)).filter(Boolean);
    player2Team = state.teams.p2.map(name => kwamis.find(kwami => kwami.name === name)).filter(Boolean);
    player1BannedKwamis = state.banned.p1.map(name => kwamis.find(kwami => kwami.name === name)).filter(Boolean);
    player2BannedKwamis = state.banned.p2.map(name => kwamis.find(kwami => kwami.name === name)).filter(Boolean);
    bannedKwamis = [...state.banned.p1, ...state.banned.p2];

    const playerNames = Object.fromEntries((state.players || []).map(player => [player.seat, player.username]));
    player1Title.textContent = playerNames.p1 || "Player 1";
    player2Title.textContent = playerNames.p2 || "Player 2";
    player1Title.classList.toggle("active", state.currentAction?.seat === "p1");
    player2Title.classList.toggle("active", state.currentAction?.seat === "p2");

    const selectedNames = [...state.teams.p1, ...state.teams.p2];
    const bannedNames = [...state.banned.p1, ...state.banned.p2];
    const canAct = state.status === "drafting" &&
        state.currentAction?.seat === multiplayerSeat &&
        !multiplayerActionPending && multiplayerSocket?.connected;

        console.log("DRAFT PERMISSION:", {
    mySeat: multiplayerSeat,
    expectedSeat: state.currentAction?.seat,
    action: state.currentAction?.action,
    status: state.status,
    connected: multiplayerSocket?.connected,
    pending: multiplayerActionPending,
    canAct: canAct
});
    cardContainer.querySelectorAll(".card").forEach(card => {
        const name = kwamis[Number(card.dataset.index)]?.name;
        card.classList.toggle("selected", selectedNames.includes(name));
        card.classList.toggle("banned", bannedNames.includes(name));
        card.style.pointerEvents = canAct && !selectedNames.includes(name) && !bannedNames.includes(name)
            ? ""
            : "none";
    });

    updateSlots();
    updateBannedSlots();
    updatePreviewStats();

    if(state.status === "complete"){
        turnText.textContent = "Draft complete!";
        pickInfo.textContent = "Both teams are ready for hero selection.";
        localStorage.setItem("player1", JSON.stringify(player1Team));
        localStorage.setItem("player2", JSON.stringify(player2Team));
        localStorage.setItem("multiplayerDraft", JSON.stringify(state));
        sessionStorage.setItem("multiplayerDraftComplete", "true");

        if(!multiplayerRedirectScheduled){
            multiplayerRedirectScheduled = true;
            setTimeout(()=>goTo("./hero-selection.html"), 1800);
        }
    }else if(state.currentAction){
        const activeName = playerNames[state.currentAction.seat] ||
            (state.currentAction.seat === "p1" ? "Player 1" : "Player 2");
        turnText.textContent = `${activeName} ${state.currentAction.action === "ban" ? "BANNING" : "SELECTING"}`;

        if(state.currentAction.action === "ban"){
            const banNumber = state.currentAction.seat === "p1" ? 1 : 2;
            pickInfo.textContent = `Ban ${banNumber} of 2`;
        }else{
            pickInfo.textContent = `Pick ${state.turnIndex - 1} of 6`;
        }
    }

    if(previousState && state.turnIndex === previousState.turnIndex + 1){
        const completedAction = previousState.currentAction;
        const sound = completedAction?.action === "ban" ? banSound : selectSound;
        sound.currentTime = 0;
        sound.play().catch(()=>{});
    }
}

const personality = PersonalityManager.choose();

if(multiplayerMode){
    startMultiplayerDraft();
}else{
    updateTurnUI();
    updatePreviewStats();
}

