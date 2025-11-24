// js/main.js - UPDATED

import { state, CONSTANTS, resetEntities } from './state.js';
import { initAI } from './controls.js'; 
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

    // 4. Set Initial Canvas Size
    DOM.canvas.width = CONSTANTS.CANVAS_WIDTH;
    DOM.canvas.height = CONSTANTS.CANVAS_HEIGHT;

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
    
    let dt = 1.0; // Placeholder for time delta

    if (state.mode === "LOADING" || state.mode === "MENU") {
        // Simple loading/menu screen loop
        DOM.ctx.fillStyle = "black";
        DOM.ctx.fillRect(0, 0, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);
        // We will call a dedicated menu render function here later
    } 
    // Other game modes handled later
    
    // updateVisuals(dt); // Will be added once render.js is ready
    
    requestAnimationFrame(gameLoop);
}

window.addEventListener('load', initialize);
