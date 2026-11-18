(function () {
    "use strict";

    const existingLink = document.querySelector('link[href="../css/mobile.css"]');
    if (!existingLink) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "../css/mobile.css";
        document.head.appendChild(link);
    }

    if (!document.getElementById("orientationOverlay")) {
        const overlay = document.createElement("div");
        overlay.id = "orientationOverlay";
        overlay.setAttribute("role", "status");
        overlay.setAttribute("aria-live", "polite");
        overlay.innerHTML =
            '<div>' +
                '<div class="orientationIcon" aria-hidden="true"></div>' +
                '<h2>Please rotate your device</h2>' +
                '<p>Please rotate your device to landscape mode to play Miraculous Clash.</p>' +
            '</div>';
        document.body.appendChild(overlay);
    }
})();
