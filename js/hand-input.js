/**
 * Converts a MediaPipe GestureRecognizerResult into the game's two controls.
 *
 * MediaPipe 0.10.x exposes handedness data as `handednesses` (plural). The
 * recognizer's landmarks are sorted by horizontal position as well, so two
 * visible hands still occupy separate controls when both wrists cross the
 * centre line during play.
 */
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Gesture recognition can be hesitant when a palm is angled. Use the hand
 * landmarks as a fallback by checking that at least three fingers extend
 * away from the wrist beyond their middle joints.
 */
export function looksLikeOpenPalm(landmarks) {
    if (!landmarks || landmarks.length < 21) return false;

    const wrist = landmarks[0];
    const fingers = [
        [8, 6],
        [12, 10],
        [16, 14],
        [20, 18],
    ];

    const extendedFingers = fingers.filter(([tip, middleJoint]) =>
        distance(wrist, landmarks[tip]) > distance(wrist, landmarks[middleJoint]) * 1.12
    ).length;

    return extendedFingers >= 3;
}

export function advanceCalibration(score, palmsReady, threshold) {
    const nextScore = palmsReady ? score + 1 : Math.max(0, score - 2);
    return {
        score: nextScore,
        complete: nextScore >= threshold,
    };
}

export function getHandInput(results, confidenceThreshold, calibrationConfidence = 0.45) {
    const landmarks = results?.landmarks ?? [];
    const handednesses = results?.handednesses ?? [];
    const gestures = results?.gestures ?? [];

    const detectedHands = landmarks
        .map((handLandmarks, index) => ({
            landmarks: handLandmarks,
            handedness: handednesses[index]?.[0] ?? null,
            gesture: gestures[index]?.[0] ?? null,
        }))
        .filter(({ landmarks: handLandmarks, handedness }) =>
            Boolean(handLandmarks?.[0]) && (!handedness || handedness.score >= 0.5)
        )
        .sort((a, b) => a.landmarks[0].x - b.landmarks[0].x);

    const input = {
        hasLeft: false,
        hasRight: false,
        inputLeft: "None",
        inputRight: "None",
        gestureLeft: "None",
        gestureRight: "None",
        gestureScoreLeft: 0,
        gestureScoreRight: 0,
        openPalmLeft: false,
        openPalmRight: false,
    };

    const applyGesture = (control, hand) => {
        input[`has${control}`] = true;
        input[`gesture${control}`] = hand.gesture?.categoryName ?? "None";
        input[`gestureScore${control}`] = hand.gesture?.score ?? 0;
        input[`openPalm${control}`] = (
            hand.gesture?.categoryName === "Open_Palm" &&
            hand.gesture.score >= calibrationConfidence
        ) || looksLikeOpenPalm(hand.landmarks);

        if (hand.gesture?.score >= confidenceThreshold) {
            input[`input${control}`] = hand.gesture.categoryName;
        }
    };

    if (detectedHands.length >= 2) {
        // The preview is mirrored: raw left is the weapons (right-hand) side.
        applyGesture("Right", detectedHands[0]);
        applyGesture("Left", detectedHands[detectedHands.length - 1]);
    } else if (detectedHands.length === 1) {
        const hand = detectedHands[0];
        applyGesture(hand.landmarks[0].x < 0.5 ? "Right" : "Left", hand);
    }

    return input;
}
