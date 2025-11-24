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
        
        // 3. IMPORTANT: Explicitly handle the play promise for mobile policies
        await DOM.video.play();
        
        // 4. Wait for video data to start flowing before starting the prediction loop
        DOM.video.addEventListener("loadeddata", () => {
            // Setup the low-res debug canvas size here
            DOM.ui.debugCanvas.width = CONSTANTS.CRUNCH_WIDTH;
            DOM.ui.debugCanvas.height = CONSTANTS.CRUNCH_HEIGHT;
            DOM.ui.debugCtx.imageSmoothingEnabled = false; 

            // Start the AI prediction loop
            requestAnimationFrame(predictWebcam);
        }, { once: true });


    } catch(e) {
        console.error("CAMERA ERROR:", e);
        // Provide clear feedback on mobile
        alert(`CAMERA ACCESS FAILED: ${e.name} - ${e.message}\n\nPlease ensure:\n1. You are on HTTPS.\n2. You clicked 'Allow' on the camera prompt.`);
    }
}


/**
 * The main loop for AI prediction and frame rendering.
 */
export async function predictWebcam() {
    try {
        // 1. Stop if video isn't ready or paused (e.g., in PAUSED mode)
        if (DOM.video.paused || DOM.video.ended || DOM.video.readyState < 2) {
            requestAnimationFrame(predictWebcam);
            return;
        }

        // 2. Check if a new frame is available
        if (DOM.video.currentTime !== lastVideoTime) {
            lastVideoTime = DOM.video.currentTime;
            
            // 3. Run prediction
            const results = gestureRecognizer.recognizeForVideo(DOM.video, performance.now());
            
            // 4. Process results and apply input smoothing
            processHands(results);
            
            // 5. Render debug view (if camera PIP is toggled on)
            if (state.debugCam) {
                // Render function will be implemented in render.js
                // renderDebugView(results); 
            }
        }
        
        // 6. Loop
        requestAnimationFrame(predictWebcam);

    } catch (err) {
        console.error("AI Prediction Loop Error:", err);
        requestAnimationFrame(predictWebcam);
    }
}

/**
 * Maps raw results to smoothed state inputs and applies input smoothing.
 * Also handles the state transition out of calibration.
 */
export function processHands(results) {
    // 1. Reset Hand Presence Flags
    state.hasLeft = false;
    state.hasRight = false;

    // 2. Identify and Process Hands
    if (results.handedness && results.handedness.length > 0) {
        
        // Find which hand is which (Left or Right) based on the model's prediction
        const rawLeftInput = { gesture: "None", score: 0 };
        const rawRightInput = { gesture: "None", score: 0 };
        let handCount = 0;

        for (let i = 0; i < results.handedness.length; i++) {
            const hand = results.handedness[i][0];
            const gesture = results.gestures[i][0];
            const landmark = results.landmarks[i];

            if (hand.score > 0.8) { // Use a fixed score check for hand presence
                handCount++;
                
                // Determine screen side (Left side is the Player's right hand due to scaleX(-1) on video)
                const handSide = (landmark[0].x < 0.5) ? 'Left' : 'Right'; 
                
                // Update presence flags based on screen side
                if (handSide === 'Left') {
                    state.hasLeft = true;
                } else if (handSide === 'Right') {
                    state.hasRight = true;
                }

                // Placeholder for actual gesture mapping (we only care about "None" vs other for now)
                const currentGesture = (gesture && gesture.score > state.confidenceThreshold) ? gesture.categoryName : "None";
                const score = (gesture) ? gesture.score : 0;
                
                if (handSide === 'Left') {
                    rawLeftInput.gesture = currentGesture;
                    rawLeftInput.score = score;
                } else {
                    rawRightInput.gesture = currentGesture;
                    rawRightInput.score = score;
                }
            }
        }
    }

    // --- 3. Run Calibration Logic (Only if in CALIBRATING mode) ---
    if (state.mode === "CALIBRATING") {
        checkCalibration();
    }
    
    // --- 4. Apply Input Smoothing (To be fully implemented later) ---
    // For now, we'll bypass smoothing and directly map the inputs 
    state.inputLeft = rawLeftInput.gesture;
    state.inputRight = rawRightInput.gesture;

    // 5. Render debug view
    if (state.debugCam) {
        renderDebugView(results); 
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
