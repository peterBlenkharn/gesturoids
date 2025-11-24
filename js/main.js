// js/main.js

import { state, CONSTANTS } from './state.js';
// All other modules will be imported here
import { initAI } from './controls.js'; 

/**
 * Global DOM element references.
 * Must be accessed after the DOM is fully loaded.
 */
export const DOM = {
    canvas: null,
    ctx: null,
    video: null,
    // Add references for all other UI elements (shieldCanvas, debugCanvas, menus, etc.) later
    ui: {} 
};

/**
 * Initial setup function called when the script starts.
 */
function initialize() {
    console.log("Gesturoids System Booting...");
    
    // 1. Get DOM References
    DOM.canvas = document.getElementById("gameCanvas");
    DOM.ctx = DOM.canvas.getContext("2d");
    DOM.video = document.getElementById("webcam");
    
    // 2. Set Initial Canvas Size
    DOM.canvas.width = CONSTANTS.CANVAS_WIDTH;
    DOM.canvas.height = CONSTANTS.CANVAS_HEIGHT;

    // 3. Start AI Model Loading
    initAI();

    // 4. Initial Game Loop Call (Will run only the loading state initially)
    requestAnimationFrame(gameLoop);
}

/**
 * The main game loop function.
 * This will be expanded to handle PHYSICS, RENDERING, and state transitions.
 */
function gameLoop(timestamp) {
    if (state.mode === "LOADING") {
        // Simple loading screen loop
        DOM.ctx.fillStyle = "black";
        DOM.ctx.fillRect(0, 0, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);
    } 
    // Other game modes (PLAYING, PAUSED, etc.) handled later
    
    requestAnimationFrame(gameLoop);
}

// Start the whole application
window.addEventListener('load', initialize);
