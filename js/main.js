import { CONFIG } from "./config.js";
import { createGestureController } from "./controls.js";
import { startGame, updateGame } from "./game.js";
import { advanceCalibration } from "./hand-input.js";
import { createRenderer } from "./render.js";
import { applyHandInput, clearHandInput, setViewport, state } from "./state.js";
import {
    collectDom,
    setCameraPreviewVisible,
    showCalibration,
    showGameOver,
    showLoadError,
    showLoading,
    showPlaying,
    showReady,
    updateCalibration,
    updateControlCards,
    updateHud,
} from "./ui.js";

const dom = collectDom();
const renderer = createRenderer(dom);
let displayedMode = null;

const gestureController = createGestureController({
    video: dom.video,
    onFrame: handleGestureFrame,
    onError: (error) => console.error("Gesture prediction failed:", error),
});

function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    setViewport(width, height);
    renderer.resize(width, height);
    renderer.clear();
}

function handleGestureFrame(handInput, results) {
    applyHandInput(handInput);
    if (state.debugCamera) renderer.renderDebug(results);

    if (state.mode === "CALIBRATING") {
        const palmsReady = (
            state.input.hasLeft &&
            state.input.hasRight &&
            state.input.openPalmLeft &&
            state.input.openPalmRight
        );
        const calibration = advanceCalibration(
            state.calibrationScore,
            palmsReady,
            CONFIG.calibration.requiredFrames
        );
        state.calibrationScore = calibration.score;
        updateCalibration(dom, state);

        if (calibration.complete) {
            startGame(performance.now());
            syncMode();
        }
    }

    if (state.mode === "PLAYING") updateControlCards(dom, state.input);
}

async function enterCalibration() {
    if (state.mode !== "MENU" && state.mode !== "GAMEOVER") return;
    state.mode = "CALIBRATING";
    state.calibrationScore = 0;
    clearHandInput();
    syncMode();
    updateCalibration(dom, state);

    try {
        await gestureController.startCamera();
    } catch (error) {
        console.error("Camera start failed:", error);
        state.mode = "MENU";
        showReady(dom);
        dom.loadingText.textContent = `CAMERA ERROR: ${error.message}`;
    }
}

function syncMode() {
    if (displayedMode === state.mode) return;
    displayedMode = state.mode;

    if (state.mode === "LOADING") showLoading(dom);
    if (state.mode === "MENU") showReady(dom);
    if (state.mode === "CALIBRATING") showCalibration(dom);
    if (state.mode === "PLAYING") showPlaying(dom);
    if (state.mode === "GAMEOVER") showGameOver(dom, state.score);
}

function gameLoop(timestamp) {
    const previousTime = state.lastFrameTime ?? timestamp;
    const elapsed = (timestamp - previousTime) / (1000 / 60);
    const dt = Math.max(0, Math.min(CONFIG.maxFrameStep, elapsed));
    state.lastFrameTime = timestamp;

    if (state.mode === "PLAYING") {
        updateGame(dt, timestamp);
        renderer.renderGame(state);
        updateHud(dom, state, timestamp);
        updateControlCards(dom, state.input);
    }

    syncMode();
    requestAnimationFrame(gameLoop);
}

async function initialize() {
    resize();
    showLoading(dom);

    dom.startButton.addEventListener("click", enterCalibration);
    dom.cameraToggle.addEventListener("change", (event) => {
        state.debugCamera = event.target.checked;
        setCameraPreviewVisible(dom, state.debugCamera);
    });
    window.addEventListener("resize", resize);
    window.addEventListener("pagehide", () => gestureController.stopCamera());
    requestAnimationFrame(gameLoop);

    try {
        await gestureController.initialize();
        state.mode = "MENU";
        syncMode();
    } catch (error) {
        console.error("AI model failed to load:", error);
        showLoadError(dom, "AI LOAD FAILED — CHECK CONNECTION");
    }
}

initialize();
