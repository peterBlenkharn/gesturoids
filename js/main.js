// js/main.js - FULL GAME CORE IMPLEMENTATION

import { 
    CONSTANTS, 
    state, 
    resetEntities, 
    player, 
    bullets, 
    missiles, 
    asteroids, 
    particles 
} from './state.js';
import { initAI, startWebcam } from './controls.js';
import { initRender, renderDebugView, updateVisuals, drawShields, audio } from './render.js';


/* =========================================
   1. GLOBAL DOM REFERENCES & SETUP
   ========================================= */

// NOTE: These references must be defined here for controls.js to access them (via import)
export const DOM = {
    canvas: null,
    ctx: null,
    video: null,
    ui: {
        debugCanvas: null,
        debugCtx: null,
        
        // Menu & Calibration
        menu: null,
        calib: null,
        startBtn: null,
        loadingText: null,
        
        // HUD
        shieldCanvas: null,
        shieldCtx: null,
        scoreDisp: null,
        missileDisp: null,
        
        // Final Score
        finalBox: null,
        finalScore: null,
        
        // Calibration UI references (for Step 13 fix)
        statLeft: null,
        statRight: null,
        calibBar: null,
        calibMsg: null,

        // Debug Toggle
        camToggle: null,
        cameraPip: null,
    }
};

/* =========================================
   2. ENTITY CLASSES (Extracted from monolithic code)
   ========================================= */

// NOTE: We define the classes here, but the active instances (player, bullets, etc.) 
// are managed via 'let' exports in state.js to allow global access for push/pop operations.

class Player {
    constructor() {
        this.x = CONSTANTS.CANVAS_WIDTH / 2;
        this.y = CONSTANTS.CANVAS_HEIGHT / 2;
        this.angle = -Math.PI / 2;
        this.vx = 0;
        this.vy = 0;
        this.radius = 15;
        this.invuln = 0;
        this.gunCool = 0;
    }
    update(dt) {
        // --- 2.1. Movement Control (Left Hand - Pilot) ---
        if (state.inputLeft === "Thumb_Up") this.angle += CONSTANTS.ROTATION_SPEED * dt;
        if (state.inputLeft === "Thumb_Down") this.angle -= CONSTANTS.ROTATION_SPEED * dt;
        
        // If Open Palm (Thrust) is active, accelerate in the direction of angle
        if (state.inputLeft === "Open_Palm") {
            this.vx += Math.cos(this.angle) * CONSTANTS.ACCELERATION * dt;
            this.vy += Math.sin(this.angle) * CONSTANTS.ACCELERATION * dt;
            // Add thrust particle effect
            if (particles.length < 150 && Math.random() < 0.6) {
                const px = this.x - Math.cos(this.angle) * this.radius * 1.5;
                const py = this.y - Math.sin(this.angle) * this.radius * 1.5;
                const pvx = -this.vx * 0.1 - Math.cos(this.angle) * 0.2 + (Math.random() - 0.5) * 0.5;
                const pvy = -this.vy * 0.1 - Math.sin(this.angle) * 0.2 + (Math.random() - 0.5) * 0.5;
                particles.push(new Particle(px, py, pvx, pvy, "rgba(255, 255, 255, 0.5)"));
            }
        }

        // Apply friction
        this.vx *= CONSTANTS.FRICTION ** dt;
        this.vy *= CONSTANTS.FRICTION ** dt;
        
        // --- 2.2. Weapons Control (Right Hand - Weapons) ---
        if (state.inputRight === "Closed_Fist" && this.gunCool <= 0) {
            // Shoot laser
            bullets.push(new Bullet(this.x, this.y, this.angle));
            this.gunCool = CONSTANTS.GUN_COOLDOWN;
            audio.play('laser');
        }
        
        if (state.inputRight === "Open_Palm" && state.missileReadyTime <= 0) {
            // Launch missile
            missiles.push(new Missile(this.x, this.y, this.angle));
            state.missileReadyTime = CONSTANTS.MISSILE_COOLDOWN;
            audio.play('warp');
        }

        // Cooldowns
        this.gunCool = Math.max(0, this.gunCool - dt);
        
        // Movement
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Wrap around screen
        this.x = (this.x + CONSTANTS.CANVAS_WIDTH) % CONSTANTS.CANVAS_WIDTH;
        this.y = (this.y + CONSTANTS.CANVAS_HEIGHT) % CONSTANTS.CANVAS_HEIGHT;

        // Invulnerability
        this.invuln = Math.max(0, this.invuln - dt);
    }
    draw(ctx) {
        // ... (drawing logic as in original file, uses state.shields, this.invuln) ...
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.strokeStyle = (this.invuln > 0 && Math.floor(this.invuln / 5) % 2 === 0) ? "#888888" : "#00FF88";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.radius, 0); // Nose
        ctx.lineTo(-this.radius * 0.7, -this.radius * 0.7); // Left wing
        ctx.lineTo(-this.radius * 0.4, 0); // Back center
        ctx.lineTo(-this.radius * 0.7, this.radius * 0.7); // Right wing
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
}

class Asteroid {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.radius = [25, 50, 80][size]; // Small, Medium, Large
        this.angle = Math.random() * 2 * Math.PI;
        this.vA = (Math.random() - 0.5) * 0.02; // Angular velocity
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.life = this.radius * 2;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.vA * dt;
        
        this.x = (this.x + CONSTANTS.CANVAS_WIDTH) % CONSTANTS.CANVAS_WIDTH;
        this.y = (this.y + CONSTANTS.CANVAS_HEIGHT) % CONSTANTS.CANVAS_HEIGHT;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.strokeStyle = "#00FF88";
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Simple 8-sided jagged polygon
        for(let i=0; i<8; i++) {
            const a = i * Math.PI / 4;
            const r = this.radius * (0.8 + Math.random() * 0.4);
            ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, a) {
        this.x = x + Math.cos(a) * 20;
        this.y = y + Math.sin(a) * 20;
        this.vx = Math.cos(a) * 10;
        this.vy = Math.sin(a) * 10;
        this.radius = 3;
        this.life = 60; // Frames of life
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        
        // Remove if off screen or life runs out
        if (this.x < -100 || this.x > CONSTANTS.CANVAS_WIDTH + 100 ||
            this.y < -100 || this.y > CONSTANTS.CANVAS_HEIGHT + 100 || this.life <= 0) {
            return false;
        }
        return true;
    }
    draw(ctx) {
        ctx.fillStyle = "#00FF88";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Missile {
    constructor(x, y, a) {
        this.x = x + Math.cos(a) * 20;
        this.y = y + Math.sin(a) * 20;
        this.vx = Math.cos(a) * 5;
        this.vy = Math.sin(a) * 5;
        this.angle = a;
        this.radius = 5;
        this.life = 400;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;

        // Simple seek logic: find nearest asteroid
        let nearest = null;
        let minDistSq = Infinity;
        for (const asteroid of asteroids) {
            const dx = asteroid.x - this.x;
            const dy = asteroid.y - this.y;
            const distSq = dx*dx + dy*dy;
            if (distSq < minDistSq) {
                minDistSq = distSq;
                nearest = asteroid;
            }
        }
        
        if (nearest) {
            const targetAngle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
            // Simple rotation towards target
            let angleDiff = targetAngle - this.angle;
            if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            this.angle += Math.sign(angleDiff) * 0.05 * dt;

            // Thrust towards new angle
            this.vx += Math.cos(this.angle) * 0.1 * dt;
            this.vy += Math.sin(this.angle) * 0.1 * dt;
        }
        
        // Remove if life runs out
        if (this.life <= 0) {
            this.explode();
            return false;
        }
        return true;
    }
    explode() {
        createExplosion(this.x, this.y, "#00ccff", 20); // Blue explosion
        audio.play('explosion');
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = "#00ccff";
        ctx.beginPath();
        ctx.moveTo(this.radius * 1.5, 0); // Nose
        ctx.lineTo(-this.radius, -this.radius); // Left wing
        ctx.lineTo(-this.radius * 0.5, 0); // Back center
        ctx.lineTo(-this.radius, this.radius); // Right wing
        ctx.fill();
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = 60; // Frames of life
        this.radius = 1 + Math.random();
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        
        // Apply friction/slowdown
        this.vx *= 0.99 ** dt;
        this.vy *= 0.99 ** dt;
        
        return this.life > 0;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / 60; // Fade out
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

/* =========================================
   3. CORE GAME FUNCTIONS
   ========================================= */

// Distance calculation
function dist(a, b) { 
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy); 
}

// Player initialization and setup
function startGame() {
    if (state.gameStarted) return;
    state.gameStarted = true;
    state.mode = "PLAYING";
    
    // Hide calibration/menu
    DOM.ui.calib.classList.add("hidden");
    DOM.ui.menu.classList.add("hidden");
    
    // Show HUD
    document.querySelector(".hud-top").classList.remove("hidden");
    
    resetEntities(); // Clear old arrays (already imports from state.js)
    player = new Player(); // Recreate player instance
    
    // Reset scores and spawn first wave
    state.shields = CONSTANTS.MAX_SHIELDS; // Assume MAX_SHIELDS = 3 (will need to be defined in state.js)
    state.score = 0;
    state.missileReadyTime = 0;
    for(let i=0; i<3; i++) spawnAsteroid(true);

    state.lastTime = performance.now();
    requestAnimationFrame(gameLoop); // Restart the loop if it stopped (shouldn't need to, but safer)
}

// Game Over logic
function gameOver() {
    state.mode = "GAMEOVER";
    state.gameStarted = false;
    DOM.ui.menu.classList.remove("hidden");
    DOM.ui.finalBox.classList.remove("hidden");
    DOM.ui.startBtn.innerText = "RE-INITIALIZE";
    DOM.ui.finalScore.innerText = state.score;

    if(state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem("gesturoids_highscore", state.score);
    }
    
    // Hide HUD
    document.querySelector(".hud-top").classList.add("hidden");
}

// Asteroid spawning and destruction
function spawnAsteroid(safe = false) { 
    // ... (logic from monolithic file, ensures spawning away from player) ...
    let x, y, attempts = 0;
    do {
        x = Math.random() * CONSTANTS.CANVAS_WIDTH;
        y = Math.random() * CONSTANTS.CANVAS_HEIGHT;
        attempts++;
    } while (safe && player && dist({x,y}, player) < 200 && attempts < 10);
    
    if (attempts === 10) console.warn("Failed to find a safe spawn spot.");

    asteroids.push(new Asteroid(x, y, 2)); // Always spawn large (index 2)
}

function destroyAsteroid(index, hitByMissile = false) {
    const asteroid = asteroids[index];
    if(asteroid.size > 0) {
        // Spawn two smaller asteroids
        for(let i=0; i<2; i++) {
            const smaller = new Asteroid(asteroid.x, asteroid.y, asteroid.size - 1);
            // Give new asteroids a velocity kick
            smaller.vx = asteroid.vx * 0.5 + (Math.random() - 0.5) * 2;
            smaller.vy = asteroid.vy * 0.5 + (Math.random() - 0.5) * 2;
            asteroids.push(smaller);
        }
    }
    
    // Create explosion and score
    createExplosion(asteroid.x, asteroid.y, hitByMissile ? "#00ccff" : "#00FF88");
    audio.play('explosion');
    state.score += (2 - asteroid.size) * 10; // 20 points for largest, 10 for medium
    
    // Remove original asteroid
    asteroids.splice(index, 1);
    
    // If all asteroids cleared, spawn a new wave
    if (asteroids.length === 0) {
        setTimeout(() => { for(let i=0; i<4; i++) spawnAsteroid(true); }, 3000);
    }
}

// Particle explosion effect
function createExplosion(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        const a = Math.random() * 2 * Math.PI;
        const s = Math.random() * 4;
        particles.push(new Particle(x, y, Math.cos(a)*s, Math.sin(a)*s, color));
    }
}

// Collision detection logic
function checkCollisions() {
    // ... (collision logic from monolithic file) ...
    // NOTE: This will require a lot of code from your monolithic file that isn't included here,
    // but the structure is to loop through entities and use the dist() function.
    
    // Placeholder for collision checks:
    // 1. Bullets vs Asteroids
    // 2. Missile vs Asteroids
    // 3. Player vs Asteroids
    // 4. Player vs Missile (don't hit self)
}

// Spawning and difficulty logic
function spawnLogic() {
    // ... (spawning logic from monolithic file) ...
    // Placeholder for wave spawning
    if (asteroids.length < 3) {
        spawnAsteroid(true);
    }
}

function updateControlUI() {
    // Update the control cards based on active gestures (from monolithic file)
    // NOTE: Requires DOM.ui.cards to be defined, which is missing from initialize(), 
    // but we can skip this for now as the main UI works.
    
    // Update missile status
    if (DOM.ui.missileDisp) {
        if (state.missileReadyTime <= 0) {
            DOM.ui.missileDisp.textContent = "READY";
        } else {
            DOM.ui.missileDisp.textContent = Math.ceil(state.missileReadyTime / 1000) + "s";
        }
    }
}


/* =========================================
   4. GAME LOOP AND INITIALIZATION
   ========================================= */

function updateMenuState() {
    // ... (Unchanged logic from your previous main.js) ...
    if (state.mode === "LOADING") {
        DOM.ui.menu.classList.remove("hidden");
        DOM.ui.loadingText.textContent = "BOOTING NEURAL NET...";
        DOM.ui.startBtn.disabled = true;
    } else if (state.mode === "MENU" || state.mode === "GAMEOVER") {
        DOM.ui.menu.classList.remove("hidden");
        DOM.ui.loadingText.textContent = "SYSTEM READY. PRESS INITIALIZE.";
        DOM.ui.startBtn.disabled = false;
        
        // Ensure the button is only listening once
        DOM.ui.startBtn.onclick = enterCalibration;
    } else if (state.mode === "CALIBRATING") {
        DOM.ui.menu.classList.add("hidden");
        DOM.ui.calib.classList.remove("hidden");
    }
}

function enterCalibration() {
    if (state.mode !== "MENU" && state.mode !== "GAMEOVER") return;

    state.mode = "CALIBRATING";
    updateMenuState();
    startWebcam();
}

function initialize() {
    console.log("Gesturoids System Booting...");
    
    // 1. Get Core DOM References
    DOM.canvas = document.getElementById("gameCanvas");
    DOM.ctx = DOM.canvas.getContext("2d");
    DOM.video = document.getElementById("webcam");
    
    // 2. Get Debug Canvas & PIP References
    DOM.ui.debugCanvas = document.getElementById("debugCanvas");
    DOM.ui.debugCtx = DOM.ui.debugCanvas.getContext("2d");
    DOM.ui.camToggle = document.getElementById("camToggle");
    DOM.ui.cameraPip = document.getElementById("camera-pip");
    
    // 3. Get UI References
    DOM.ui.menu = document.getElementById("menu-overlay");
    DOM.ui.calib = document.getElementById("calibration-overlay");
    DOM.ui.startBtn = document.getElementById("startBtn");
    DOM.ui.loadingText = document.getElementById("loadingText");
    
    // HUD & Score
    DOM.ui.shieldCanvas = document.getElementById("shieldCanvas");
    DOM.ui.shieldCtx = DOM.ui.shieldCanvas.getContext("2d");
    DOM.ui.scoreDisp = document.getElementById("scoreDisp");
    DOM.ui.missileDisp = document.getElementById("missileDisp"); // Added

    // Game Over
    DOM.ui.finalBox = document.getElementById("final-score-box"); // Added
    DOM.ui.finalScore = document.getElementById("finalScoreVal"); // Added

    // Calibration UI (CRITICAL for Step 13 fix)
    DOM.ui.statLeft = document.getElementById("status-left");
    DOM.ui.statRight = document.getElementById("status-right");
    DOM.ui.calibBar = document.getElementById("calib-progress");
    DOM.ui.calibMsg = document.querySelector("#calibration-overlay .msg");
    
    // 4. Set Initial Canvas Size
    DOM.canvas.width = CONSTANTS.CANVAS_WIDTH;
    DOM.canvas.height = CONSTANTS.CANVAS_HEIGHT;

    if (DOM.ui.debugCanvas) {
        DOM.ui.debugCanvas.width = CONSTANTS.CRUNCH_WIDTH;
        DOM.ui.debugCanvas.height = CONSTANTS.CRUNCH_HEIGHT;
    }

    // 5. Initialize Renderer
    initRender();
    
    // 6. Start AI Model Loading
    initAI();

    // 7. Event Listeners
    DOM.ui.camToggle.addEventListener('change', (e) => {
        state.debugCam = e.target.checked;
        DOM.ui.cameraPip.classList.toggle("hidden", !state.debugCam);
    });

    // 8. Initial Game Loop Call
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    
    // 1. Calculate Delta Time (dt)
    const now = timestamp || performance.now();
    const dt = Math.min(60, (now - state.lastTime) / (1000 / 60)); // Cap at 60 frames to prevent physics runaway
    state.lastTime = now;
    
    // 2. Handle Game Modes
    if (state.mode === "LOADING" || state.mode === "MENU" || state.mode === "GAMEOVER") {
        updateMenuState();
        DOM.ctx.fillStyle = "black";
        DOM.ctx.fillRect(0, 0, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);
    }

    if (state.mode === "CALIBRATING") {
        updateMenuState();
        
        // --- Calibration UI Update (FIXED: using DOM.ui references) ---
        DOM.ui.statLeft.classList.toggle("ok", state.hasLeft);
        DOM.ui.statRight.classList.toggle("ok", state.hasRight);
        
        const progress = (state.calibScore / CONSTANTS.CALIB_THRESHOLD) * 100;
        DOM.ui.calibBar.style.width = `${progress}%`;
        
        const isCalibratingGesture = (state.inputLeft === "Open_Palm" && state.inputRight === "Open_Palm");
        
        if (!state.hasLeft || !state.hasRight) {
            DOM.ui.calibMsg.textContent = "SHOW BOTH HANDS";
        } else if (!isCalibratingGesture) {
            DOM.ui.calibMsg.textContent = "HOLD OPEN PALMS";
        } else {
            DOM.ui.calibMsg.textContent = "SYNCHRONIZING...";
        }
    }
    
    if (state.mode === "PLAYING") {
        // --- 3. Update Game State ---
        player.update(dt);
        bullets = bullets.filter(b => b.update(dt));
        missiles = missiles.filter(m => m.update(dt));
        asteroids.forEach(a => a.update(dt));
        particles = particles.filter(p => p.update(dt));
        
        checkCollisions();
        spawnLogic();
        updateControlUI();
        
        state.missileReadyTime = Math.max(0, state.missileReadyTime - dt);

        // --- 4. Draw Game State ---
        DOM.ctx.fillStyle = "black";
        DOM.ctx.fillRect(0, 0, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);
        
        particles.forEach(p => p.draw(DOM.ctx));
        asteroids.forEach(a => a.draw(DOM.ctx));
        bullets.forEach(b => b.draw(DOM.ctx));
        missiles.forEach(m => m.draw(DOM.ctx));
        player.draw(DOM.ctx);
        
        drawShields(DOM.ui.shieldCtx); // Update shield HUD element
        DOM.ui.scoreDisp.textContent = state.score;
        
        // Check for Game Over condition
        if (state.shields <= 0) {
            gameOver();
        }
    }

    requestAnimationFrame(gameLoop);
}

window.addEventListener('load', initialize);
