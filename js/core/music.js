const music = document.getElementById("musicPlayer");

if (music) {
    const masterVolume =
        Number(localStorage.getItem("masterVolume")) || 100;

    const musicVolume =
        Number(localStorage.getItem("musicVolume")) || 80;

    music.volume =
        (masterVolume / 100) * (musicVolume / 100);

    const savedTime = localStorage.getItem("musicTime");

    if (savedTime) {
        music.currentTime = parseFloat(savedTime);
    }

    const autoMusic =
        localStorage.getItem("autoMusic");

    if (autoMusic === null || autoMusic === "true") {
        music.play().catch(() => {});
    } else {
        music.pause();
    }

    setInterval(() => {
        localStorage.setItem("musicTime", music.currentTime);
    }, 500);
}

function applyMusicVolume(){
    if (!music) return;

    const master =
    Number(localStorage.getItem("masterVolume")) || 100;

    const musicVol =
    Number(localStorage.getItem("musicVolume")) || 80;

    music.volume =
    (master / 100) * (musicVol / 100);

}