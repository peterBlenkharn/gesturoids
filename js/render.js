// js/render.js - UPDATED

import { DOM } from './main.js';
import { CONSTANTS, state } from './state.js';

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

    // 2. Draw Hand Landmarks (Optional, but useful for debugging AI)
    if (results && results.landmarks) {
        // Simple dot for the wrist landmark
        ctx.fillStyle = colorPalette.MINT;
        results.landmarks.forEach(landmarks => {
            landmarks.forEach((point, index) => {
                // Scale the normalized landmark coordinates (0 to 1) to the canvas size (80x60)
                const x = point.x * w;
                const y = point.y * h;
                
                // Draw a small dot (only draw the wrist landmark (index 0) for performance)
                if (index === 0) {
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, 2*Math.PI); 
                    ctx.fill();
                }
            });
        });
    }
}

/**
 * The main function to draw all game elements in the loop.
 * (Full implementation will occur later)
 */
export function updateVisuals(dt) {
    // Logic for drawing entities, starfield, shields, and applying screen effects
}
