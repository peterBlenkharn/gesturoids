// js/render.js - UPDATED

import { DOM } from './main.js';
import { CONSTANTS, state , HAND_CONNECTIONS} from './state.js';

/**
 * Placeholder for the Color Palette (Monochrome Mint Green)
 */
export const colorPalette = {
    MINT: "#00FF88", // Core color
    STATIC: "#AAAAAA", // Used for noise/inactive elements
    // Add cycling hues later: HUES: ["#00FF88", "#00EE77", "#00DD66"]
};


/**
 * Audio Framework
 */
export const audio = {
    sfx: {},
    // Placeholder to load all MP3 files into the sfx object
    load: async (name, path) => { 
        console.log(`Audio system: Loading ${name}...`);
        // Real implementation will use the Web Audio API or a simple <audio> element
    },
    // Placeholder to play a sound
    play: (name) => { 
        // console.log(`Audio system: Playing ${name}`); 
    }
};


/**
 * Non-loop initialization of rendering and audio systems.
 */
export function initRender() {
    console.log("Render: Initializing systems.");
    
    // 1. Load Audio (Mock implementation for now)
    // Replace with actual paths when files are available
    audio.load('laser', 'sfx/laser.mp3'); 
    audio.load('explosion', 'sfx/explosion.mp3');
    audio.load('warp', 'sfx/warp.mp3');

    // 2. Set up initial debug canvas context settings (already done in controls.js loadeddata)
    // We can ensure the context exists here:
    if (DOM.ui.debugCtx) {
        DOM.ui.debugCtx.imageSmoothingEnabled = false; 
    }
}

/**
 * Renders the low-res camera feed and hand tracking points.
 * Also applies the retro bit-crunched aesthetic.
 */
export function renderDebugView(results) {
    if (!DOM.video.srcObject || DOM.video.readyState < 2 || !state.debugCam) {
        return;
    }
    
    const ctx = DOM.ui.debugCtx;
    const w = CONSTANTS.CRUNCH_WIDTH;
    const h = CONSTANTS.CRUNCH_HEIGHT;

    // 1. Draw the Video Frame onto the low-res canvas
    // CRITICAL: Draw the video at the Crunched size (80x60)
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    
    // Scale the context to flip the image (match CSS transform)
    ctx.scale(-1, 1); 
    // Draw the image, then translate back (since we scaled on the x-axis)
    ctx.drawImage(DOM.video, 0, 0, w * -1, h); 
    ctx.restore();

    // 2. Draw Hand Landmarks (Wireframe)
    if (results && results.landmarks) {
        
        // Set style for drawing lines and points
        ctx.strokeStyle = colorPalette.MINT;
        ctx.lineWidth = 1;
        ctx.fillStyle = colorPalette.MINT;
        
        results.landmarks.forEach(landmarks => {
            
            // CRITICAL FIX: Apply inverse transform for landmarks
            // We save/restore context *per hand* to ensure correct drawing boundaries
            ctx.save();
            ctx.scale(-1, 1);     // Flip X back
            ctx.translate(-w, 0); // Translate back by the width 'w'

            // --- A. Draw Connections (Lines) ---
            ctx.beginPath();
            for (const [start, end] of HAND_CONNECTIONS) { // Now correctly imported
                const p1 = landmarks[start];
                const p2 = landmarks[end];
                // Scale normalized coordinates (0-1) to crunched size (w, h)
                ctx.moveTo(p1.x * w, p1.y * h);
                ctx.lineTo(p2.x * w, p2.y * h);
            }
            ctx.stroke();

            // --- B. Draw Points (Dots) ---
            landmarks.forEach(point => {
                // Draw a tiny 1x1 rectangle for the point
                ctx.fillRect(Math.floor(point.x * w), Math.floor(point.y * h), 1, 1);
            });

            ctx.restore(); // Restore context
        });
    }
}

/**
 * Draws the shield status bar on the HUD canvas.
 * Must be exported to be called from main.js gameLoop.
 */
export function drawShields(shieldCtx) {
  // Clear the shield canvas area
  shieldCtx.clearRect(0, 0, 100, 30);
  
  // Set style for drawing the health bars
  shieldCtx.strokeStyle = "#ff3333"; // Danger color from original file
  shieldCtx.lineWidth = 2;
  
  // Draw one bar for each shield point the player has
  for (let i = 0; i < CONSTANTS.MAX_SHIELDS; i++) {
    // Calculate position: [5, 30, 55] for 3 bars
    const x = 5 + i * 25; 
    
    // Check if the current shield point is active
    if (i < state.shields) {
      shieldCtx.fillStyle = colorPalette.MINT; // Active shield color
      shieldCtx.fillRect(x, 5, 20, 20);
    } 
    
    // Draw the shield container box (always drawn, whether active or not)
    shieldCtx.strokeRect(x, 5, 20, 20);
  }
}

/**
 * The main function to draw all game elements in the loop.
 * (Full implementation will occur later)
 */
export function updateVisuals(dt) {
    // Logic for drawing entities, starfield, shields, and applying screen effects
}
