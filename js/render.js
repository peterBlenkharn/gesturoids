import { CONFIG, HAND_CONNECTIONS } from "./config.js";

export function createRenderer(dom) {
    const gameContext = dom.canvas.getContext("2d");
    const shieldContext = dom.shieldCanvas.getContext("2d");
    const debugContext = dom.debugCanvas.getContext("2d");
    debugContext.imageSmoothingEnabled = false;

    function resize(width, height) {
        dom.canvas.width = width;
        dom.canvas.height = height;
        dom.debugCanvas.width = CONFIG.debugWidth;
        dom.debugCanvas.height = CONFIG.debugHeight;
    }

    function clear() {
        gameContext.fillStyle = CONFIG.background;
        gameContext.fillRect(0, 0, dom.canvas.width, dom.canvas.height);
    }

    function renderGame(state) {
        clear();
        for (const particle of state.particles) drawParticle(gameContext, particle);
        for (const asteroid of state.asteroids) drawAsteroid(gameContext, asteroid);
        for (const bullet of state.bullets) drawBullet(gameContext, bullet);
        for (const missile of state.missiles) drawMissile(gameContext, missile);
        if (state.player) drawPlayer(gameContext, state.player);
        drawShields(shieldContext, state.shields);
    }

    function renderDebug(results) {
        if (!dom.video.srcObject || dom.video.readyState < 2) return;
        const width = CONFIG.debugWidth;
        const height = CONFIG.debugHeight;

        debugContext.clearRect(0, 0, width, height);
        debugContext.drawImage(dom.video, 0, 0, width, height);
        if (!results?.landmarks) return;

        debugContext.strokeStyle = "#00ff88";
        debugContext.fillStyle = "#00ff88";
        debugContext.lineWidth = 1;

        for (const landmarks of results.landmarks) {
            debugContext.beginPath();
            for (const [start, end] of HAND_CONNECTIONS) {
                const first = landmarks[start];
                const second = landmarks[end];
                debugContext.moveTo(first.x * width, first.y * height);
                debugContext.lineTo(second.x * width, second.y * height);
            }
            debugContext.stroke();

            for (const point of landmarks) {
                debugContext.fillRect(Math.floor(point.x * width), Math.floor(point.y * height), 1, 1);
            }
        }
    }

    return { clear, renderDebug, renderGame, resize };
}

function drawPlayer(context, player) {
    if (player.invulnerability > 0 && Math.floor(Date.now() / 100) % 2) return;
    context.save();
    context.translate(player.x, player.y);
    context.rotate(player.angle);
    context.strokeStyle = "#00ff88";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(20, 0);
    context.lineTo(-15, 10);
    context.lineTo(-10, 0);
    context.lineTo(-15, -10);
    context.closePath();
    context.stroke();

    if (player.invulnerability > 0) {
        context.beginPath();
        context.arc(0, 0, 22, 0, Math.PI * 2);
        context.strokeStyle = "#00ccff";
        context.stroke();
    }
    context.restore();
}

function drawAsteroid(context, asteroid) {
    context.save();
    context.translate(asteroid.x, asteroid.y);
    context.strokeStyle = "#ffffff";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(asteroid.vertices[0].x, asteroid.vertices[0].y);
    for (const vertex of asteroid.vertices) context.lineTo(vertex.x, vertex.y);
    context.closePath();
    context.stroke();
    context.restore();
}

function drawBullet(context, bullet) {
    context.fillStyle = "#00ccff";
    context.fillRect(bullet.x - 2, bullet.y - 2, 4, 4);
}

function drawMissile(context, missile) {
    if (missile.exploding) {
        context.beginPath();
        context.arc(missile.x, missile.y, missile.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(255, 100, 50, ${1 - missile.radius / CONFIG.missile.maximumRadius})`;
        context.fill();
        context.strokeStyle = "#ffffff";
        context.stroke();
        return;
    }

    context.fillStyle = "orange";
    context.beginPath();
    context.arc(missile.x, missile.y, 6, 0, Math.PI * 2);
    context.fill();
}

function drawParticle(context, particle) {
    context.globalAlpha = Math.max(0, particle.life / particle.maximumLife);
    context.fillStyle = particle.color;
    context.fillRect(particle.x, particle.y, 3, 3);
    context.globalAlpha = 1;
}

function drawShields(context, shields) {
    context.clearRect(0, 0, 100, 30);
    context.strokeStyle = "#ff3333";
    context.lineWidth = 2;

    for (let index = 0; index < shields; index += 1) {
        const x = 15 + index * 30;
        const y = 8;
        const size = 10;
        context.beginPath();
        context.moveTo(x, y + size * 0.3);
        context.bezierCurveTo(x, y, x - size, y - size * 0.5, x - size, y - size * 0.2);
        context.bezierCurveTo(x - size, y + size * 0.5, x, y + size * 1.2, x, y + size * 1.2);
        context.bezierCurveTo(x, y + size * 1.2, x + size, y + size * 0.5, x + size, y - size * 0.2);
        context.bezierCurveTo(x + size, y - size * 0.5, x, y, x, y + size * 0.3);
        context.stroke();
    }
}
