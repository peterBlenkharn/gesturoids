import { CONFIG } from "./config.js";

export function collectDom() {
    const dom = {
        canvas: document.getElementById("gameCanvas"),
        video: document.getElementById("webcam"),
        debugCanvas: document.getElementById("debugCanvas"),
        shieldCanvas: document.getElementById("shieldCanvas"),
        menu: document.getElementById("menu-overlay"),
        calibration: document.getElementById("calibration-overlay"),
        hud: document.querySelector(".hud-top"),
        controlsLayer: document.querySelector(".controls-layer"),
        startButton: document.getElementById("startBtn"),
        loadingText: document.getElementById("loadingText"),
        finalBox: document.getElementById("final-score-box"),
        finalScore: document.getElementById("finalScoreVal"),
        score: document.getElementById("scoreDisp"),
        missile: document.getElementById("missileDisp"),
        cameraToggle: document.getElementById("camToggle"),
        cameraPip: document.getElementById("camera-pip"),
        calibrationBar: document.getElementById("calib-progress"),
        calibrationMessage: document.querySelector("#calibration-overlay .msg"),
        leftStatus: document.getElementById("status-left"),
        rightStatus: document.getElementById("status-right"),
        cards: [...document.querySelectorAll(".card")],
    };

    dom.leftStatusIcon = dom.leftStatus.querySelector(".status-icon");
    dom.rightStatusIcon = dom.rightStatus.querySelector(".status-icon");
    dom.leftStatusSub = dom.leftStatus.querySelector(".status-sub");
    dom.rightStatusSub = dom.rightStatus.querySelector(".status-sub");
    return dom;
}

export function showLoading(dom) {
    dom.menu.classList.remove("hidden");
    dom.calibration.classList.add("hidden");
    dom.hud.classList.add("hidden");
    dom.controlsLayer.classList.add("hidden");
    dom.loadingText.textContent = "BOOTING NEURAL NET...";
    dom.startButton.disabled = true;
}

export function showReady(dom) {
    dom.menu.classList.remove("hidden");
    dom.calibration.classList.add("hidden");
    dom.hud.classList.add("hidden");
    dom.controlsLayer.classList.add("hidden");
    dom.finalBox.classList.add("hidden");
    dom.loadingText.textContent = "SYSTEM READY. PRESS INITIALIZE.";
    dom.startButton.textContent = "INITIALIZE SYSTEMS";
    dom.startButton.disabled = false;
}

export function showCalibration(dom) {
    dom.menu.classList.add("hidden");
    dom.calibration.classList.remove("hidden");
    dom.hud.classList.add("hidden");
    dom.controlsLayer.classList.add("hidden");
}

export function showPlaying(dom) {
    dom.menu.classList.add("hidden");
    dom.calibration.classList.add("hidden");
    dom.hud.classList.remove("hidden");
    dom.controlsLayer.classList.remove("hidden");
    dom.finalBox.classList.add("hidden");
}

export function showGameOver(dom, score) {
    dom.menu.classList.remove("hidden");
    dom.calibration.classList.add("hidden");
    dom.hud.classList.add("hidden");
    dom.controlsLayer.classList.add("hidden");
    dom.finalBox.classList.remove("hidden");
    dom.finalScore.textContent = String(score);
    dom.loadingText.textContent = "SYSTEMS OFFLINE";
    dom.startButton.textContent = "RE-INITIALIZE";
    dom.startButton.disabled = false;
}

export function showLoadError(dom, message) {
    dom.loadingText.textContent = message;
    dom.startButton.disabled = true;
}

function readableGesture(gesture) {
    return gesture === "None" ? "HAND FOUND" : gesture.replaceAll("_", " ");
}

function updateHandStatus(element, icon, subtitle, present, openPalm, gesture, readyText) {
    element.classList.toggle("ok", present);
    icon.textContent = openPalm ? "✋" : (present ? "✅" : "❌");
    if (openPalm) subtitle.textContent = "OPEN PALM";
    else if (present) subtitle.textContent = readableGesture(gesture);
    else subtitle.textContent = readyText;
}

export function updateCalibration(dom, state) {
    updateHandStatus(
        dom.leftStatus,
        dom.leftStatusIcon,
        dom.leftStatusSub,
        state.input.hasLeft,
        state.input.openPalmLeft,
        state.input.gestureLeft,
        "LEFT SIDE"
    );
    updateHandStatus(
        dom.rightStatus,
        dom.rightStatusIcon,
        dom.rightStatusSub,
        state.input.hasRight,
        state.input.openPalmRight,
        state.input.gestureRight,
        "RIGHT SIDE"
    );

    const progress = Math.min(100, (state.calibrationScore / CONFIG.calibration.requiredFrames) * 100);
    dom.calibrationBar.style.width = `${progress}%`;

    if (!state.input.hasLeft || !state.input.hasRight) {
        dom.calibrationMessage.textContent = "SHOW BOTH HANDS";
    } else if (!state.input.openPalmLeft || !state.input.openPalmRight) {
        dom.calibrationMessage.textContent = "HOLD OPEN PALMS";
    } else {
        dom.calibrationMessage.textContent = "SYNCHRONIZING...";
    }
}

export function updateHud(dom, state, now = performance.now()) {
    dom.score.textContent = String(state.score);
    const cooldown = state.missileReadyAt - now;
    if (cooldown <= 0) {
        dom.missile.textContent = "READY";
        dom.missile.classList.remove("cooldown");
    } else {
        dom.missile.textContent = `${(cooldown / 1000).toFixed(1)}s`;
        dom.missile.classList.add("cooldown");
    }
}

export function updateControlCards(dom, input) {
    for (const card of dom.cards) {
        const active = (
            card.dataset.side === "left" && input.left === card.dataset.gesture
        ) || (
            card.dataset.side === "right" && input.right === card.dataset.gesture
        );
        card.classList.toggle("active", active);
    }
}

export function setCameraPreviewVisible(dom, visible) {
    dom.cameraPip.classList.toggle("hidden", !visible);
}
