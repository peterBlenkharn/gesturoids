import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import { CONFIG } from "./config.js";
import { getHandInput } from "./hand-input.js";

const WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm";
const MODEL_PATH = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";

export function createGestureController({ video, onFrame, onError }) {
    let recognizer = null;
    let stream = null;
    let running = false;
    let animationFrame = null;
    let lastVideoTime = -1;

    async function createRecognizer(vision, delegate) {
        return GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: MODEL_PATH,
                delegate,
            },
            runningMode: "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });
    }

    async function initialize() {
        const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
        try {
            recognizer = await createRecognizer(vision, "GPU");
        } catch (gpuError) {
            console.warn("GPU gesture recognition unavailable; using CPU.", gpuError);
            recognizer = await createRecognizer(vision, "CPU");
        }
    }

    async function startCamera() {
        if (!recognizer) throw new Error("Gesture recognizer is not ready.");
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error("This browser does not support camera access.");
        }

        if (!stream?.active) {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: "user",
                    },
                    audio: false,
                });
            } catch (preferredCameraError) {
                console.warn("Preferred camera unavailable; using any camera.", preferredCameraError);
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }

            video.srcObject = stream;
            await video.play();
        }

        if (!running) {
            running = true;
            lastVideoTime = -1;
            animationFrame = requestAnimationFrame(predict);
        }
    }

    function predict() {
        if (!running) return;

        try {
            if (!video.paused && !video.ended && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
                lastVideoTime = video.currentTime;
                const results = recognizer.recognizeForVideo(video, performance.now());
                const handInput = getHandInput(
                    results,
                    CONFIG.gestureConfidence,
                    CONFIG.calibration.gestureConfidence
                );
                onFrame(handInput, results);
            }
        } catch (error) {
            onError(error);
        }

        animationFrame = requestAnimationFrame(predict);
    }

    function stopCamera() {
        running = false;
        if (animationFrame !== null) cancelAnimationFrame(animationFrame);
        animationFrame = null;
        lastVideoTime = -1;
        stream?.getTracks().forEach((track) => track.stop());
        stream = null;
        video.srcObject = null;
    }

    return {
        initialize,
        startCamera,
        stopCamera,
    };
}
