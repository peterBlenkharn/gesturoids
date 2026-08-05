export const CONFIG = Object.freeze({
    background: "#050505",
    maxFrameStep: 3,
    maxShields: 3,
    initialAsteroids: 5,
    safeSpawnDistance: 220,
    maxAsteroids: 12,
    baseAsteroidTarget: 4,
    scorePerDifficultyStep: 2000,
    asteroidSpawnChance: 0.02,

    player: Object.freeze({
        radius: 15,
        acceleration: 0.2,
        rotationSpeed: 0.08,
        friction: 0.97,
        brakeFriction: 0.9,
        maxSpeed: 7,
        invulnerabilityFrames: 180,
        laserCooldownFrames: 8,
    }),

    missile: Object.freeze({
        cooldownMs: 3000,
        speed: 8,
        lifetimeFrames: 150,
        expansionSpeed: 5,
        maximumRadius: 150,
    }),

    calibration: Object.freeze({
        requiredFrames: 20,
        gestureConfidence: 0.45,
    }),

    gestureConfidence: 0.55,
    debugWidth: 80,
    debugHeight: 60,
});

export const HAND_CONNECTIONS = Object.freeze([
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20],
    [0, 17],
]);
