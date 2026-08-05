import { CONFIG } from "./config.js";

function readHighScore() {
    try {
        return Number.parseInt(globalThis.localStorage?.getItem("gesturoids_highscore"), 10) || 0;
    } catch {
        return 0;
    }
}

export const state = {
    mode: "LOADING",
    viewport: {
        width: globalThis.innerWidth || 1280,
        height: globalThis.innerHeight || 720,
    },
    score: 0,
    highScore: readHighScore(),
    shields: CONFIG.maxShields,
    missileReadyAt: 0,
    lastFrameTime: null,
    gameStarted: false,
    debugCamera: true,

    input: {
        left: "None",
        right: "None",
        hasLeft: false,
        hasRight: false,
        openPalmLeft: false,
        openPalmRight: false,
        gestureLeft: "None",
        gestureRight: "None",
        gestureScoreLeft: 0,
        gestureScoreRight: 0,
    },

    calibrationScore: 0,
    player: null,
    bullets: [],
    missiles: [],
    asteroids: [],
    particles: [],
};

export function setViewport(width, height) {
    state.viewport.width = width;
    state.viewport.height = height;
}

export function applyHandInput(handInput) {
    state.input.left = handInput.inputLeft;
    state.input.right = handInput.inputRight;
    state.input.hasLeft = handInput.hasLeft;
    state.input.hasRight = handInput.hasRight;
    state.input.openPalmLeft = handInput.openPalmLeft;
    state.input.openPalmRight = handInput.openPalmRight;
    state.input.gestureLeft = handInput.gestureLeft;
    state.input.gestureRight = handInput.gestureRight;
    state.input.gestureScoreLeft = handInput.gestureScoreLeft;
    state.input.gestureScoreRight = handInput.gestureScoreRight;
}

export function clearHandInput() {
    applyHandInput({
        inputLeft: "None",
        inputRight: "None",
        hasLeft: false,
        hasRight: false,
        openPalmLeft: false,
        openPalmRight: false,
        gestureLeft: "None",
        gestureRight: "None",
        gestureScoreLeft: 0,
        gestureScoreRight: 0,
    });
}

export function clearEntities() {
    state.player = null;
    state.bullets = [];
    state.missiles = [];
    state.asteroids = [];
    state.particles = [];
}

export function saveHighScore() {
    if (state.score <= state.highScore) return;
    state.highScore = state.score;
    try {
        globalThis.localStorage?.setItem("gesturoids_highscore", String(state.highScore));
    } catch {
        // Storage can be unavailable in private browsing; gameplay should continue.
    }
}
