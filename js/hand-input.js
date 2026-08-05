/**
 * Converts a MediaPipe GestureRecognizerResult into the game's two controls.
 *
 * MediaPipe 0.10.x exposes handedness data as `handednesses` (plural). The
 * recognizer's landmarks are sorted by horizontal position as well, so two
 * visible hands still occupy separate controls when both wrists cross the
 * centre line during play.
 */
export function getHandInput(results, confidenceThreshold) {
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
    };

    const applyGesture = (control, hand) => {
        input[`has${control}`] = true;
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
