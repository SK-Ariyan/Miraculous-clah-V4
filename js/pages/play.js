// Back
document.getElementById("backBtn").onclick = ()=>{

    goTo("lobby.html");

};

// Pass & Play
document.getElementById("passPlayBtn").onclick = ()=>{

    sessionStorage.setItem("mode","pass");

    goTo("kwami.html");

};

// VS AI
document.getElementById("vsAiBtn").onclick = ()=>{

    sessionStorage.setItem("mode","ai");

    goTo("kwami.html");

};

// Multiplayer
// Multiplayer
document.getElementById("multiplayerBtn").onclick = ()=>{

    sessionStorage.setItem("mode", "multiplayer");

    goTo("multiplayer.html");

};