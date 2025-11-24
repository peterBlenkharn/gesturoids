// js/controls.js 

import {
  GestureRecognizer,
  FilesetResolver
} from "@mediapipe/tasks-vision";
import { state, CONSTANTS, player, resetEntities } from './state.js';
import { DOM } from './main.js';
import { renderDebugView } from './render.js'; // Import the debug render function

let gestureRecognizer;
let lastVideoTime = -1;

/**
 * Initializes the MediaPipe Gesture Recognizer model.
 */
export async function initAI() {
    try {
        // 1. Update UI (Assuming a loading message exists in index.html)
        // For now, we'll just log
        console.log("Controls: Loading MediaPipe...");

        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        // 2. Create the recognizer instance
        gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
                delegate: "GPU" // Use GPU for better mobile performance
            },
            runningMode: "VIDEO",
            numHands: 2
        });

        // 3. Model Loaded Successfully
        state.mode = "MENU"; 
        console.log("Controls: AI Model READY.");
        // We'll update the menu UI in a later step
        
    } catch (error) {
        console.error("Controls: AI Model FAILED to load:", error);
        alert("SYSTEM ERROR: AI Model failed. Check internet connection.");
    }
}


// js/controls.js - UPDATED startWebcam (Simplified)

/**
 * Requests camera access with robust fallback constraints.
 */
export async function startWebcam() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Browser does not support camera access.");
        return;
    }
    
    try {
        let stream;
        try {
            // 1. Try mobile-friendly constraints (user-facing)
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: "user" 
                } 
            });
        } catch (err) {
            // 2. Fallback: Try any available video source
            console.warn("Camera fallback triggered: using any video source.");
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        DOM.video.srcObject = stream;
        
        // 3. IMPORTANT: Wait for the video to start playing.
        await DOM.video.play();
        
        // 4. CRITICAL FIX: Start the AI prediction loop immediately.
        // We rely on the DOM.video.readyState check inside predictWebcam to prevent drawing too early.
        requestAnimationFrame(predictWebcam);

    } catch(e) {
        console.error("CAMERA ERROR:", e);
        alert(`CAMERA ACCESS FAILED: ${e.name} - ${e.message}\n\nPlease ensure:\n1. You are on HTTPS.\n2. You clicked 'Allow' on the camera prompt.`);
    }
}


// js/controls.js - UPDATED predictWebcam
export async function predictWebcam() {
    try {
        // 1. Stop if video isn't ready or paused (e.g., in PAUSED mode)
        // CRITICAL CHECK: Ensure video has sufficient data to be drawn
        if (DOM.video.paused || DOM.video.ended || DOM.video.readyState < 2) {
            requestAnimationFrame(predictWebcam);
            return;
        }

        // 2. Check if a new frame is available
        const now = DOM.video.currentTime;
        if (now !== lastVideoTime) {
            lastVideoTime = now;
            
            // 3. Run prediction
            // Use timeStamp from performance.now() as required by MediaPipe's video runningMode
            const results = gestureRecognizer.recognizeForVideo(DOM.video, performance.now()); 
            
            // 4. Process results and apply input smoothing
            processHands(results);
        }
        
        // 5. Loop (Always call requestAnimationFrame to keep the prediction loop running)
        requestAnimationFrame(predictWebcam);

    } catch (err) {
        console.error("AI Prediction Loop Error:", err);
        requestAnimationFrame(predictWebcam); // Keep trying to loop
    }
}

// js/controls.js - UPDATED processHands

export function processHands(results) {
    // 1. Reset Hand Presence Flags
    state.hasLeft = false; // Flag for PILOT (Left Control side)
    state.hasRight = false; // Flag for WEAPONS (Right Control side)
    state.inputLeft = "None"; // Gesture for PILOT
    state.inputRight = "None"; // Gesture for WEAPONS

    // 2. Identify and Process Hands
    if (results.handedness && results.handedness.length > 0) {
        
        for (let i = 0; i < results.handedness.length; i++) {
            const hand = results.handedness[i][0];
            const gesture = results.gestures[i] && results.gestures[i].length > 0 ? results.gestures[i][0] : null;
            const landmark = results.landmarks[i];

            if (hand.score > 0.8 && landmark) { 
                
                // Determine screen side using wrist landmark (index 0)
                // x < 0.5 is the LEFT HALF of the screen (Player's Right Hand)
                const wristX = landmark[0].x;
                
                if (wristX < 0.5) { // LEFT HALF of Screen -> WEAPONS Control
                    state.hasRight = true;
                    if (gesture && gesture.score > state.confidenceThreshold) {
                        state.inputRight = gesture.categoryName;
                    }
                } else { // RIGHT HALF of Screen -> PILOT Control
                    state.hasLeft = true;
                    if (gesture && gesture.score > state.confidenceThreshold) {
                        state.inputLeft = gesture.categoryName;
                    }
                }
            }
        }
    }

    // --- 3. Run Calibration Logic (Only if in CALIBRATING mode) ---
    if (state.mode === "CALIBRATING") {
        checkCalibration();
    }
    
    // 4. Render debug view (Must be called in the same frame as prediction)
    if (state.debugCam) {
        renderDebugView(results); // The results contain the landmarks needed for the dots
    }
}


/**
 * Handles the logic for confirming the player is ready to start.
 */
function checkCalibration() {
    // Calibration requires both hands to be visible and stable
    if (state.hasLeft && state.hasRight) {
        
        // Both hands are detected, increase calibration score
        state.calibScore++;
        
        // If score reaches threshold, transition to game start
        if (state.calibScore >= CONSTANTS.CALIB_THRESHOLD) {
            console.log("CALIBRATION COMPLETE: Starting Game.");
            state.mode = "HOLDING"; // Transition to Spatial Start state
            // startGame(); // To be called from main.js or a dedicated game start module
            state.calibScore = 0; // Reset
        }
    } else {
        // Hands are not visible or stable, decrease score (prevents cheating/accidental starts)
        state.calibScore = Math.max(0, state.calibScore - 2); 
    }
}

// Placeholder for Power Management (to be implemented later)
export function toggleCameraStream(on) {
    if (on) {
        startWebcam();
    } else {
        // Shutdown logic: find stream and stop all tracks
        const stream = DOM.video.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            DOM.video.srcObject = null;
            console.log("Controls: Camera stream shutdown.");
        }
        lastVideoTime = -1; // Reset frame time
    }
}
