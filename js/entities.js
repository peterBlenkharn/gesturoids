import { CONFIG } from "./config.js";

export class Player {
    constructor(width, height) {
        this.x = width / 2;
        this.y = height / 2;
        this.angle = -Math.PI / 2;
        this.vx = 0;
        this.vy = 0;
        this.radius = CONFIG.player.radius;
        this.invulnerability = 0;
        this.laserCooldown = 0;
    }

    update(dt, gesture, viewport, emitParticle) {
        if (gesture === "Thumb_Up") this.angle += CONFIG.player.rotationSpeed * dt;
        if (gesture === "Thumb_Down") this.angle -= CONFIG.player.rotationSpeed * dt;

        if (gesture === "Open_Palm") {
            this.vx += Math.cos(this.angle) * CONFIG.player.acceleration * dt;
            this.vy += Math.sin(this.angle) * CONFIG.player.acceleration * dt;
            if (Math.random() > 0.5) {
                emitParticle(
                    this.x - Math.cos(this.angle) * 12,
                    this.y - Math.sin(this.angle) * 12,
                    -this.vx + (Math.random() - 0.5),
                    -this.vy + (Math.random() - 0.5),
                    "orange"
                );
            }
        }

        if (gesture === "Closed_Fist") {
            const braking = CONFIG.player.brakeFriction ** dt;
            this.vx *= braking;
            this.vy *= braking;
        }

        const friction = CONFIG.player.friction ** dt;
        this.vx *= friction;
        this.vy *= friction;

        const speed = Math.hypot(this.vx, this.vy);
        if (speed > CONFIG.player.maxSpeed) {
            this.vx = (this.vx / speed) * CONFIG.player.maxSpeed;
            this.vy = (this.vy / speed) * CONFIG.player.maxSpeed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.x = (this.x + viewport.width) % viewport.width;
        this.y = (this.y + viewport.height) % viewport.height;
        this.invulnerability = Math.max(0, this.invulnerability - dt);
        this.laserCooldown = Math.max(0, this.laserCooldown - dt);
    }
}

export class Asteroid {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.radius = size * 12;

        const direction = Math.random() * Math.PI * 2;
        const speed = (4 - size) * 0.5;
        this.vx = Math.cos(direction) * speed;
        this.vy = Math.sin(direction) * speed;
        this.vertices = [];

        const vertexCount = 6 + Math.floor(Math.random() * 4);
        for (let index = 0; index < vertexCount; index += 1) {
            const angle = (index / vertexCount) * Math.PI * 2;
            const radius = this.radius * (0.7 + Math.random() * 0.6);
            this.vertices.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
            });
        }
    }

    update(dt, viewport) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        const margin = 50;
        if (this.x < -margin) this.x = viewport.width + margin;
        if (this.x > viewport.width + margin) this.x = -margin;
        if (this.y < -margin) this.y = viewport.height + margin;
        if (this.y > viewport.height + margin) this.y = -margin;
    }
}

export class Bullet {
    constructor(x, y, angle) {
        this.x = x + Math.cos(angle) * 20;
        this.y = y + Math.sin(angle) * 20;
        this.vx = Math.cos(angle) * 15;
        this.vy = Math.sin(angle) * 15;
        this.life = 60;
        this.active = true;
    }

    update(dt, viewport) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        this.active = this.life > 0 && this.x >= 0 && this.x <= viewport.width && this.y >= 0 && this.y <= viewport.height;
    }
}

export class Missile {
    constructor(x, y, angle) {
        this.x = x + Math.cos(angle) * 20;
        this.y = y + Math.sin(angle) * 20;
        this.vx = Math.cos(angle) * CONFIG.missile.speed;
        this.vy = Math.sin(angle) * CONFIG.missile.speed;
        this.life = CONFIG.missile.lifetimeFrames;
        this.radius = 5;
        this.active = true;
        this.exploding = false;
    }

    update(dt, viewport) {
        if (this.exploding) {
            this.radius += CONFIG.missile.expansionSpeed * dt;
            if (this.radius >= CONFIG.missile.maximumRadius) this.active = false;
            return;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0 || this.x < 0 || this.x > viewport.width || this.y < 0 || this.y > viewport.height) {
            this.explode();
        }
    }

    explode() {
        if (this.exploding) return;
        this.exploding = true;
        this.vx = 0;
        this.vy = 0;
    }
}

export class Particle {
    constructor(x, y, vx, vy, color, life = 30) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maximumLife = life;
        this.active = true;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        this.active = this.life > 0;
    }
}
