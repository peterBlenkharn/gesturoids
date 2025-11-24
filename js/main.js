// js/main.js - UPDATED

import { state, CONSTANTS, resetEntities } from './state.js';
import { initAI, startWebcam } from './controls.js';
import { updateVisuals, initRender } from './render.js'; // We'll update render.js next

/**
 * Global DOM element references.
 */
export const DOM = {
    canvas: null,
    ctx: null,
    video: null,
    
    // UI specific references for easy access
    // UI specific references
    ui: {
        debugCanvas: null,
        debugCtx: null,
        
        // Menu & Calibration
        menu: null,
        calib: null,
        startBtn: null,
        loadingText: null,
        
        // HUD
        shieldCanvas: null,
        shieldCtx: null,
        scoreDisp: null,
        
        // Debug Toggle
        camToggle: null,
        cameraPip: null,
    } 
};

/**
 * Handles state transitions for the Menu and Initialization process.
 */
function updateMenuState() {
    if (state.mode === "LOADING") {
        DOM.ui.menu.classList.remove("hidden");
        DOM.ui.loadingText.textContent = "BOOTING NEURAL NET...";
        DOM.ui.startBtn.disabled = true;
    } else if (state.mode === "MENU") {
        // AI model is loaded, enable the button
        DOM.ui.menu.classList.remove("hidden");
        DOM.ui.loadingText.textContent = "SYSTEM READY. PRESS INITIALIZE.";
        DOM.ui.startBtn.disabled = false;
        
        // Ensure the button is only listening once
        DOM.ui.startBtn.onclick = enterCalibration;
    } else if (state.mode === "CALIBRATING") {
        // Hide the main menu, show the calibration screen
        DOM.ui.menu.classList.add("hidden");
        DOM.ui.calib.classList.remove("hidden");
    }
}

/**
 * Triggered by the "INITIALIZE SYSTEMS" button.
 * Sets the mode and starts the camera (critical for mobile gesture security).
 */
function enterCalibration() {
    if (state.mode !== "MENU") return;

    state.mode = "CALIBRATING";
    updateMenuState();
    
    // CRITICAL MOBILE FIX: Camera start MUST happen inside the user gesture handler
    startWebcam();
}

/**
 * Initial setup function called when the script starts.
 */
function initialize() {
    console.log("Gesturoids System Booting...");
    
    // 1. Get Core DOM References
    DOM.canvas = document.getElementById("gameCanvas");
    DOM.ctx = DOM.canvas.getContext("2d");
    DOM.video = document.getElementById("webcam");
    
    // 2. Get Debug Canvas & PIP References
    DOM.ui.debugCanvas = document.getElementById("debugCanvas");
    DOM.ui.debugCtx = DOM.ui.debugCanvas.getContext("2d");
    DOM.ui.camToggle = document.getElementById("camToggle");
    DOM.ui.cameraPip = document.getElementById("camera-pip");
    
    // 3. Get UI References
    DOM.ui.menu = document.getElementById("menu-overlay");
    DOM.ui.calib = document.getElementById("calibration-overlay");
    DOM.ui.startBtn = document.getElementById("startBtn");
    DOM.ui.loadingText = document.getElementById("loadingText");
    DOM.ui.shieldCanvas = document.getElementById("shieldCanvas");
    DOM.ui.shieldCtx = DOM.ui.shieldCanvas.getContext("2d");
    DOM.ui.scoreDisp = document.getElementById("scoreDisp");

    // CRITICAL: ADD MISSING CALIBRATION UI REFERENCES
    DOM.ui.statLeft = document.getElementById("status-left");
    DOM.ui.statRight = document.getElementById("status-right");
    DOM.ui.calibBar = document.getElementById("calib-progress");
    DOM.ui.calibMsg = document.querySelector("#calibration-overlay .msg");
    
    // 4. Set Initial Canvas Size
    DOM.canvas.width = CONSTANTS.CANVAS_WIDTH;
    DOM.canvas.height = CONSTANTS.CANVAS_HEIGHT;

    // CRITICAL: Set debug canvas size immediately here.
    if (DOM.ui.debugCanvas) {
        DOM.ui.debugCanvas.width = CONSTANTS.CRUNCH_WIDTH;
        DOM.ui.debugCanvas.height = CONSTANTS.CRUNCH_HEIGHT;
    }

    // 5. Initialize Renderer
    initRender(); 

    // 6. Start AI Model Loading
    initAI();

    // 7. Event Listeners
    DOM.ui.camToggle.addEventListener('change', (e) => {
        state.debugCam = e.target.checked;
        DOM.ui.cameraPip.classList.toggle("hidden", !state.debugCam);
    });

    // 8. Initial Game Loop Call
    requestAnimationFrame(gameLoop);
}

/**
 * The main game loop function.
 */
function gameLoop(timestamp) {
    
    let dt = 1.0; 

    // Update the menu state on every frame
    if (state.mode === "LOADING" || state.mode === "MENU" || state.mode === "CALIBRATING") {
        updateMenuState(); 

        // Always draw black background when not playing
        DOM.ctx.fillStyle = "black";
        DOM.ctx.fillRect(0, 0, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);
        
    // --- Calibration UI Update ---
    if (state.mode === "CALIBRATING") {
        
        // 1. Update hand status indicators (using pre-fetched DOM.ui references)
        DOM.ui.statLeft.classList.toggle("ok", state.hasLeft);
        DOM.ui.statRight.classList.toggle("ok", state.hasRight);

        // 2. Update progress bar
        const progress = (state.calibScore / CONSTANTS.CALIB_THRESHOLD) * 100;
        DOM.ui.calibBar.style.width = `${progress}%`;
        
        // 3. Update message based on status and gesture
        const isCalibratingGesture = (state.inputLeft === "Open_Palm" && state.inputRight === "Open_Palm");
        
        if (!state.hasLeft || !state.hasRight) {
            // Hands not detected
            DOM.ui.calibMsg.textContent = "SHOW BOTH HANDS";
        } else if (!isCalibratingGesture) {
            // Hands detected, but not the right gesture
            DOM.ui.calibMsg.textContent = "HOLD OPEN PALMS";
        } else {
            // Hands detected with correct gesture, synchronizing...
            DOM.ui.calibMsg.textContent = "SYNCHRONIZING...";
        }
    }
    } 
    
    requestAnimationFrame(gameLoop);
}

window.addEventListener('load', initialize);
