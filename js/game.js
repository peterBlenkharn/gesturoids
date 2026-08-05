import { CONFIG } from "./config.js";
import { Asteroid, Bullet, Missile, Particle, Player } from "./entities.js";
import { clearEntities, saveHighScore, state } from "./state.js";

export function startGame(now = performance.now()) {
    clearEntities();
    state.player = new Player(state.viewport.width, state.viewport.height);
    state.score = 0;
    state.shields = CONFIG.maxShields;
    state.missileReadyAt = 0;
    state.calibrationScore = 0;
    state.lastFrameTime = now;
    state.gameStarted = true;
    state.mode = "PLAYING";

    for (let index = 0; index < CONFIG.initialAsteroids; index += 1) {
        spawnAsteroid(true);
    }
}

export function updateGame(dt, now = performance.now()) {
    if (state.mode !== "PLAYING" || !state.player) return;

    state.player.update(dt, state.input.left, state.viewport, createParticle);
    handleWeapons(now);

    for (const bullet of state.bullets) bullet.update(dt, state.viewport);
    for (const missile of state.missiles) missile.update(dt, state.viewport);
    for (const asteroid of state.asteroids) asteroid.update(dt, state.viewport);
    for (const particle of state.particles) particle.update(dt);

    checkCollisions();

    state.bullets = state.bullets.filter((bullet) => bullet.active);
    state.missiles = state.missiles.filter((missile) => missile.active);
    state.particles = state.particles.filter((particle) => particle.active);
    spawnLogic();
}

function handleWeapons(now) {
    if (state.input.right === "Open_Palm" && state.player.laserCooldown <= 0) {
        state.bullets.push(new Bullet(state.player.x, state.player.y, state.player.angle));
        state.player.laserCooldown = CONFIG.player.laserCooldownFrames;
    }

    if (state.input.right === "Victory" && now >= state.missileReadyAt) {
        state.missiles.push(new Missile(state.player.x, state.player.y, state.player.angle));
        state.missileReadyAt = now + CONFIG.missile.cooldownMs;
    }
}

function spawnLogic() {
    const difficulty = Math.floor(state.score / CONFIG.scorePerDifficultyStep);
    const target = Math.min(CONFIG.maxAsteroids, CONFIG.baseAsteroidTarget + difficulty);
    if (state.asteroids.length < target && Math.random() < CONFIG.asteroidSpawnChance) {
        spawnAsteroid(false);
    }
}

export function spawnAsteroid(safe = false) {
    let x = 0;
    let y = 0;
    let attempts = 0;

    do {
        x = Math.random() * state.viewport.width;
        y = Math.random() * state.viewport.height;
        attempts += 1;
    } while (
        safe &&
        state.player &&
        distance({ x, y }, state.player) < CONFIG.safeSpawnDistance &&
        attempts < 30
    );

    state.asteroids.push(new Asteroid(x, y, 3));
}

function checkCollisions() {
    checkBulletCollisions();
    checkMissileCollisions();
    checkPlayerCollisions();
}

function checkBulletCollisions() {
    for (let bulletIndex = state.bullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
        const bullet = state.bullets[bulletIndex];
        if (!bullet.active) continue;

        for (let asteroidIndex = state.asteroids.length - 1; asteroidIndex >= 0; asteroidIndex -= 1) {
            const asteroid = state.asteroids[asteroidIndex];
            if (distance(bullet, asteroid) <= asteroid.radius) {
                bullet.active = false;
                createExplosion(asteroid.x, asteroid.y, "#ffffff", 5);
                destroyAsteroid(asteroidIndex);
                break;
            }
        }
    }
}

function checkMissileCollisions() {
    for (const missile of state.missiles) {
        if (!missile.exploding) {
            const impact = state.asteroids.some((asteroid) =>
                distance(missile, asteroid) <= asteroid.radius + missile.radius
            );
            if (impact) missile.explode();
        }

        if (!missile.exploding) continue;
        for (let asteroidIndex = state.asteroids.length - 1; asteroidIndex >= 0; asteroidIndex -= 1) {
            const asteroid = state.asteroids[asteroidIndex];
            if (distance(missile, asteroid) <= missile.radius + asteroid.radius) {
                destroyAsteroid(asteroidIndex);
            }
        }
    }
}

function checkPlayerCollisions() {
    if (state.player.invulnerability > 0) return;

    for (let asteroidIndex = state.asteroids.length - 1; asteroidIndex >= 0; asteroidIndex -= 1) {
        const asteroid = state.asteroids[asteroidIndex];
        if (distance(state.player, asteroid) >= state.player.radius + asteroid.radius - 5) continue;

        state.shields -= 1;
        state.player.invulnerability = CONFIG.player.invulnerabilityFrames;
        createExplosion(state.player.x, state.player.y, "#00ccff", 20);
        destroyAsteroid(asteroidIndex);

        if (state.shields <= 0) endGame();
        break;
    }
}

export function destroyAsteroid(index) {
    const asteroid = state.asteroids[index];
    if (!asteroid) return;

    state.score += (4 - asteroid.size) * 100;
    createExplosion(asteroid.x, asteroid.y, "#aaaaaa", 3);

    if (asteroid.size > 1) {
        state.asteroids.push(new Asteroid(asteroid.x, asteroid.y, asteroid.size - 1));
        state.asteroids.push(new Asteroid(asteroid.x, asteroid.y, asteroid.size - 1));
    }
    state.asteroids.splice(index, 1);
}

export function createExplosion(x, y, color, count = 8) {
    for (let index = 0; index < count; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4;
        createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color);
    }
}

function createParticle(x, y, vx, vy, color) {
    if (state.particles.length >= 250) return;
    state.particles.push(new Particle(x, y, vx, vy, color));
}

export function endGame() {
    state.mode = "GAMEOVER";
    state.gameStarted = false;
    saveHighScore();
}

export function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}
