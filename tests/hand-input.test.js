import assert from "node:assert/strict";
import test from "node:test";
import { advanceCalibration, getHandInput, looksLikeOpenPalm } from "../js/hand-input.js";

function landmarks(x, open) {
    const points = Array.from({ length: 21 }, () => ({ x, y: 0.7 }));
    points[0] = { x, y: 0.9 };
    for (const [tip, middleJoint] of [[8, 6], [12, 10], [16, 14], [20, 18]]) {
        points[middleJoint] = { x, y: 0.5 };
        points[tip] = { x, y: open ? 0.1 : 0.65 };
    }
    return points;
}

const category = (categoryName, score) => ({ categoryName, score });

test("detects open palms from landmarks when the classifier returns None", () => {
    const result = {
        landmarks: [landmarks(0.2, true), landmarks(0.8, true)],
        handednesses: [[category("Right", 0.99)], [category("Left", 0.99)]],
        gestures: [[category("None", 0.9)], [category("None", 0.9)]],
    };

    const input = getHandInput(result, 0.55, 0.45);
    assert.equal(input.hasLeft, true);
    assert.equal(input.hasRight, true);
    assert.equal(input.openPalmLeft, true);
    assert.equal(input.openPalmRight, true);
    assert.equal(input.inputLeft, "Open_Palm");
    assert.equal(input.inputRight, "Open_Palm");
});

test("does not mistake folded fingers for an open palm", () => {
    assert.equal(looksLikeOpenPalm(landmarks(0.5, false)), false);
});

test("completes calibration after the configured number of ready frames", () => {
    let calibration = { score: 0, complete: false };
    for (let frame = 0; frame < 20; frame += 1) {
        calibration = advanceCalibration(calibration.score, true, 20);
    }
    assert.equal(calibration.complete, true);
});
