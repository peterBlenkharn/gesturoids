import assert from "node:assert/strict";
import test from "node:test";
import { Asteroid } from "../js/entities.js";
import { destroyAsteroid, startGame, updateGame } from "../js/game.js";
import { clearEntities, clearHandInput, setViewport, state } from "../js/state.js";

function reset() {
    clearEntities();
    clearHandInput();
    setViewport(1000, 700);
    state.mode = "MENU";
    state.score = 0;
    state.shields = 3;
    state.missileReadyAt = 0;
    state.gameStarted = false;
}

test("starts a complete playable world", () => {
    reset();
    startGame(1000);
    assert.equal(state.mode, "PLAYING");
    assert.ok(state.player);
    assert.equal(state.asteroids.length, 5);
    assert.equal(state.shields, 3);
});

test("pilot gestures thrust and brake the ship", () => {
    reset();
    startGame(1000);
    state.asteroids = [];
    state.input.left = "Open_Palm";
    updateGame(1, 1017);
    assert.ok(Math.hypot(state.player.vx, state.player.vy) > 0);

    state.player.vx = 5;
    state.player.vy = 0;
    state.input.left = "Closed_Fist";
    updateGame(1, 1034);
    assert.ok(state.player.vx < 5);
});

test("gunner gestures fire lasers and cooldown-limited missiles", () => {
    reset();
    startGame(1000);
    state.asteroids = [];
    state.input.right = "Open_Palm";
    updateGame(1, 1017);
    assert.equal(state.bullets.length, 1);

    state.input.right = "Victory";
    updateGame(1, 5000);
    updateGame(1, 5017);
    assert.equal(state.missiles.length, 1);
});

test("destroyed asteroids award points and split", () => {
    reset();
    startGame(1000);
    state.asteroids = [new Asteroid(200, 200, 3)];
    destroyAsteroid(0);
    assert.equal(state.score, 100);
    assert.equal(state.asteroids.length, 2);
    assert.deepEqual(state.asteroids.map((asteroid) => asteroid.size), [2, 2]);
});

test("a final ship collision ends the game", () => {
    reset();
    startGame(1000);
    state.shields = 1;
    const asteroid = new Asteroid(state.player.x, state.player.y, 1);
    asteroid.vx = 0;
    asteroid.vy = 0;
    state.asteroids = [asteroid];
    updateGame(1, 1017);
    assert.equal(state.shields, 0);
    assert.equal(state.mode, "GAMEOVER");
});
