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
    ui: {
        debugCanvas: null,
        debugCtx: null,
        // Other UI elements (menus, HUD, buttons) will go here
    } 
};

/**
 * Initial setup function called when the script starts.
 */
function initialize() {
    console.log("Gesturoids System Booting...");
    
    // 1. Get Core DOM References
    // ... (unchanged DOM retrieval) ...
    DOM.canvas = document.getElementById("gameCanvas");
    DOM.ctx = DOM.canvas.getContext("2d");
    DOM.video = document.getElementById("webcam");
    
    // 2. Get Debug Canvas References
    DOM.ui.debugCanvas = document.getElementById("debugCanvas");
    DOM.ui.debugCtx = DOM.ui.debugCanvas.getContext("2d");
    
    // 3. Set Initial Canvas Size
    DOM.canvas.width = CONSTANTS.CANVAS_WIDTH;
    DOM.canvas.height = CONSTANTS.CANVAS_HEIGHT;

    // 4. Initialize Renderer (Audio, Color Palettes)
    initRender(); // <-- NEW CALL

    // 5. Start AI Model Loading
    initAI();

    // 6. Initial Game Loop Call
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
