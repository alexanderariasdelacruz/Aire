// ==========================================
// SKY WAR - COMBATE AÉREO
// Temática: Segunda Guerra Mundial
// ==========================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = 1100;
const H = 500;
const SEA = 305;

const livesText = document.getElementById("lives");
const scoreText = document.getElementById("score");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOver");
const finalScoreText = document.getElementById("finalScore");

let running = false;
let score = 0;
let lives = 3;
let frame = 0;

const keys = {};

let player;
let bullets = [];
let bombs = [];
let enemyBullets = [];
let missiles = [];
let enemies = [];
let ships = [];
let explosions = [];
let particles = [];
let splashes = [];

const rand = (min, max) => Math.random() * (max - min) + min;

// ==========================================
// INICIALIZACIÓN
// ==========================================

function resetGame() {
    score = 0;
    lives = 3;
    frame = 0;

    player = {
        x: 130,
        y: 125,
        w: 52,
        h: 24,
        speed: 4.2,
        shootCooldown: 0,
        bombCooldown: 0,
        invulnerable: 0
    };

    bullets = [];
    bombs = [];
    enemyBullets = [];
    missiles = [];
    enemies = [];
    ships = [];
    explosions = [];
    particles = [];
    splashes = [];

    updateHUD();
}

function updateHUD() {
    livesText.textContent = lives;
    scoreText.textContent = score;
}

function startGame() {
    resetGame();
    running = true;
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
}

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("restartBtn").addEventListener("click", startGame);

// ==========================================
// CONTROLES DE TECLADO
// ==========================================

window.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();

    if (
        [" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)
    ) {
        e.preventDefault();
    }

    keys[key] = true;

    if (!running) return;

    if (key === " " && !e.repeat) shoot();
    if (key === "x" && !e.repeat) dropBomb();
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

window.addEventListener("blur", () => {
    for (const key in keys) keys[key] = false;
});

// ==========================================
// CONTROLES TÁCTILES
// ==========================================

document.querySelectorAll("[data-key]").forEach(button => {
    const key = button.dataset.key;

    button.addEventListener("pointerdown", e => {
        e.preventDefault();
        keys[key] = true;
    });

    const release = e => {
        e.preventDefault();
        keys[key] = false;
    };

    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
});

document.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("pointerdown", e => {
        e.preventDefault();

        if (!running) return;

        if (button.dataset.action === "shoot") shoot();
        if (button.dataset.action === "bomb") dropBomb();
    });
});

// ==========================================
// DISPAROS DEL JUGADOR
// ==========================================

function shoot() {
    if (!running || player.shootCooldown > 0) return;

    bullets.push({
        x: player.x + player.w,
        y: player.y + player.h / 2,
        vx: 10,
        vy: 0,
        radius: 3,
        gravity: 0.035
    });

    player.shootCooldown = 10;
}

// ==========================================
// BOMBAS DEL JUGADOR
// ==========================================

function dropBomb() {
    if (!running || player.bombCooldown > 0) return;

    bombs.push({
        x: player.x + player.w / 2,
        y: player.y + player.h,
        vx: 1.1,
        vy: 2.2,
        radius: 7
    });

    player.bombCooldown = 38;
}

// ==========================================
// CREACIÓN DE ENEMIGOS
// ==========================================

function createEnemy() {
    enemies.push({
        x: W + 70,
        y: rand(40, 205),
        w: 66,
        h: 32,
        hp: 5,
        maxHp: 5,
        speed: rand(1.7, 2.7),
        phase: rand(0, Math.PI * 2),
        shootCooldown: rand(65, 120),
        missileCooldown: rand(180, 270)
    });
}

function createShip() {
    ships.push({
        x: W + 100,
        y: SEA - 70,
        w: 180,
        h: 65,
        hp: 2,
        maxHp: 2,
        speed: 1.1,
        shootCooldown: rand(90, 140)
    });
}

// ==========================================
// PROYECTILES ENEMIGOS
// ==========================================

function enemyShoot(x, y) {
    const targetX = player.x + player.w / 2;
    const targetY = player.y + player.h / 2;

    const dx = targetX - x;
    const dy = targetY - y;
    const length = Math.sqrt(dx * dx + dy * dy) || 1;

    enemyBullets.push({
        x,
        y,
        vx: (dx / length) * 5,
        vy: (dy / length) * 5,
        radius: 4,
        gravity: 0.025
    });
}

// ==========================================
// MISILES ENEMIGOS
// ==========================================

function enemyMissile(x, y) {
    const targetX = player.x + player.w / 2;
    const targetY = player.y + player.h / 2;

    const dx = targetX - x;
    const dy = targetY - y;
    const length = Math.sqrt(dx * dx + dy * dy) || 1;

    missiles.push({
        x,
        y,
        vx: (dx / length) * 3.4,
        vy: (dy / length) * 3.4,
        angle: Math.atan2(dy, dx),
        life: 135
    });
}

// ==========================================
// EFECTOS DE EXPLOSIÓN
// ==========================================

function createExplosion(x, y, size = 1) {
    explosions.push({
        x,
        y,
        radius: 5,
        maxRadius: 35 * size,
        life: 25,
        maxLife: 25
    });

    const amount = Math.floor(22 * size);

    for (let i = 0; i < amount; i++) {
        const angle = rand(0, Math.PI * 2);
        const speed = rand(1, 4.5);

        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            gravity: 0.07,
            life: rand(18, 38),
            size: rand(2, 5),
            water: false
        });
    }
}

// ==========================================
// EFECTOS EN EL AGUA
// ==========================================

function createSplash(x, y) {
    splashes.push({
        x,
        y,
        life: 22,
        maxLife: 22
    });

    for (let i = 0; i < 9; i++) {
        particles.push({
            x,
            y,
            vx: rand(-2.5, 2.5),
            vy: rand(-3.5, -0.5),
            gravity: 0.14,
            life: rand(12, 20),
            size: rand(2, 4),
            water: true
        });
    }
}

// ==========================================
// DESTRUCCIÓN DEL JUGADOR
// ==========================================

function destroyPlayer() {
    if (!running || player.invulnerable > 0) return;

    createExplosion(
        player.x + player.w / 2,
        player.y + player.h / 2,
        1.5
    );

    lives--;
    updateHUD();

    if (lives <= 0) {
        running = false;
        finalScoreText.textContent = score;
        gameOverScreen.classList.remove("hidden");
        return;
    }

    player.x = 130;
    player.y = 125;
    player.invulnerable = 110;
}

// ==========================================
// DESTRUCCIÓN DE AVIONES Y BARCOS
// ==========================================

function destroyEnemy(enemy) {
    createExplosion(
        enemy.x + enemy.w / 2,
        enemy.y + enemy.h / 2,
        1.3
    );

    enemies = enemies.filter(item => item !== enemy);

    score += 100;
    updateHUD();
}

function destroyShip(ship) {
    createExplosion(
        ship.x + ship.w / 2,
        ship.y + ship.h / 2,
        2
    );

    ships = ships.filter(item => item !== ship);

    score += 250;
    updateHUD();
}

// ==========================================
// FONDO: CIELO Y MAR
// ==========================================

function drawBackground() {
    let topColor;
    let bottomColor;

    if (score < 500) {
        topColor = "#66b9e8";
        bottomColor = "#c9e8f4";
    } else if (score < 1000) {
        topColor = "#718fa7";
        bottomColor = "#d0d9df";
    } else if (score < 1500) {
        topColor = "#d6a36e";
        bottomColor = "#f3d6a4";
    } else if (score < 2000) {
        topColor = "#bd7664";
        bottomColor = "#e9b39a";
    } else {
        topColor = "#172b4c";
        bottomColor = "#637c9c";
    }

    const sky = ctx.createLinearGradient(0, 0, 0, SEA);
    sky.addColorStop(0, topColor);
    sky.addColorStop(1, bottomColor);

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, SEA);

    // NUBES

    ctx.fillStyle = "rgba(255,255,255,0.62)";

    for (let i = 0; i < 7; i++) {
        let x = (
            i * 190 - frame * 0.35 + W + 200
        ) % (W + 200);

        const y = 42 + (i % 3) * 65;

        ctx.beginPath();
        ctx.arc(x, y, 23, 0, Math.PI * 2);
        ctx.arc(x + 25, y - 8, 29, 0, Math.PI * 2);
        ctx.arc(x + 53, y, 23, 0, Math.PI * 2);
        ctx.fill();
    }

    // MAR

    const sea = ctx.createLinearGradient(0, SEA, 0, H);
    sea.addColorStop(0, "#15547a");
    sea.addColorStop(1, "#071e36");

    ctx.fillStyle = sea;
    ctx.fillRect(0, SEA, W, H - SEA);

    // OLAS

    ctx.strokeStyle = "rgba(150,210,230,0.35)";
    ctx.lineWidth = 2;

    for (let i = 0; i < 18; i++) {
        const x = (i * 95 - frame * 1.7) % (W + 100);

        ctx.beginPath();
        ctx.moveTo(x, SEA + 25 + (i % 4) * 35);
        ctx.lineTo(x + 48, SEA + 25 + (i % 4) * 35);
        ctx.stroke();
    }

    ctx.fillStyle = "#a5d3e4";
    ctx.fillRect(0, SEA, W, 2);
}

// ==========================================
// AVIÓN PRINCIPAL: MODELO DE HÉLICE
// ==========================================

function drawPlayer() {
    if (player.invulnerable > 0 && frame % 8 < 4) return;

    ctx.save();

    ctx.translate(
        player.x + player.w / 2,
        player.y + player.h / 2
    );

    const tilt =
        keys["arrowup"] || keys["w"] || keys["up"] ? -0.12 :
        keys["arrowdown"] || keys["s"] || keys["down"] ? 0.12 : 0;

    ctx.rotate(tilt);

    // HÉLICE

    ctx.fillStyle = "#343b40";
    ctx.fillRect(-27, -3, 4, 6);

    ctx.fillStyle = "#c4cdd0";
    ctx.fillRect(-31, -10, 3, 20);

    // ALA TRASERA

    ctx.fillStyle = "#626e74";

    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(1, -14);
    ctx.lineTo(13, -14);
    ctx.lineTo(8, -3);
    ctx.fill();

    // ALA PRINCIPAL

    const wing = ctx.createLinearGradient(0, -15, 0, 15);
    wing.addColorStop(0, "#d8dfe1");
    wing.addColorStop(0.5, "#78868d");
    wing.addColorStop(1, "#414d54");

    ctx.fillStyle = wing;

    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.lineTo(0, -14);
    ctx.lineTo(19, -14);
    ctx.lineTo(9, -3);
    ctx.lineTo(19, 14);
    ctx.lineTo(0, 14);
    ctx.lineTo(-10, 4);
    ctx.fill();

    // FUSELAJE

    const body = ctx.createLinearGradient(0, -5, 0, 5);
    body.addColorStop(0, "#e0e5e5");
    body.addColorStop(0.5, "#8b989d");
    body.addColorStop(1, "#536067");

    ctx.fillStyle = body;

    ctx.beginPath();
    ctx.moveTo(-27, -4);
    ctx.lineTo(20, -5);
    ctx.lineTo(28, 0);
    ctx.lineTo(20, 5);
    ctx.lineTo(-27, 4);
    ctx.closePath();
    ctx.fill();

    // CABINA

    ctx.fillStyle = "#263f50";
    ctx.beginPath();
    ctx.ellipse(5, -2, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#d7e1e4";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
}

// ==========================================
// AVIONES ENEMIGOS
// ==========================================

function drawEnemy(enemy) {
    ctx.save();

    ctx.translate(
        enemy.x + enemy.w / 2,
        enemy.y + enemy.h / 2
    );

    ctx.scale(-1, 1);

    // HÉLICE

    ctx.fillStyle = "#424c50";
    ctx.fillRect(-33, -3, 3, 6);

    ctx.fillStyle = "#c2c9ca";
    ctx.fillRect(-36, -9, 2, 18);

    // FUSELAJE

    ctx.fillStyle = "#737e82";

    ctx.beginPath();
    ctx.moveTo(-32, -4);
    ctx.lineTo(22, -5);
    ctx.lineTo(33, 0);
    ctx.lineTo(22, 5);
    ctx.lineTo(-32, 4);
    ctx.closePath();
    ctx.fill();

    // ALAS

    const wing = ctx.createLinearGradient(0, -16, 0, 16);
    wing.addColorStop(0, "#d0d7d8");
    wing.addColorStop(1, "#566268");

    ctx.fillStyle = wing;

    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(3, -16);
    ctx.lineTo(20, -15);
    ctx.lineTo(11, -3);
    ctx.lineTo(20, 15);
    ctx.lineTo(3, 16);
    ctx.lineTo(-8, 4);
    ctx.fill();

    // CABINA

    ctx.fillStyle = "#203c4b";
    ctx.beginPath();
    ctx.ellipse(5, -2, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // BARRA DE RESISTENCIA

    ctx.fillStyle = "#293238";
    ctx.fillRect(enemy.x + 8, enemy.y - 10, 48, 4);

    ctx.fillStyle = "#d04d3d";
    ctx.fillRect(
        enemy.x + 8,
        enemy.y - 10,
        48 * (enemy.hp / enemy.maxHp),
        4
    );
}

// ==========================================
// BARCOS DE GUERRA GRANDES
// ==========================================

function drawShip(ship) {
    ctx.save();
    ctx.translate(ship.x, ship.y);

    // CASCO METÁLICO

    const hull = ctx.createLinearGradient(0, 28, 0, 65);
    hull.addColorStop(0, "#c1c9cc");
    hull.addColorStop(0.45, "#747f85");
    hull.addColorStop(1, "#3e4a50");

    ctx.fillStyle = hull;

    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.lineTo(ship.w, 30);
    ctx.lineTo(ship.w - 23, 59);
    ctx.lineTo(25, 59);
    ctx.closePath();
    ctx.fill();

    // CUBIERTA

    ctx.fillStyle = "#89969b";
    ctx.fillRect(25, 19, 125, 12);

    // ESTRUCTURA CENTRAL

    ctx.fillStyle = "#c5cdce";
    ctx.fillRect(58, 2, 55, 20);

    ctx.fillStyle = "#56646a";
    ctx.fillRect(73, -9, 25, 12);

    // VENTANAS

    ctx.fillStyle = "#273d4b";

    for (let i = 0; i < 5; i++) {
        ctx.fillRect(63 + i * 9, 7, 5, 5);
    }

    // TORRETAS DECORATIVAS

    ctx.fillStyle = "#424e53";

    for (let i = 0; i < 2; i++) {
        const x = 34 + i * 90;

        ctx.fillRect(x, 17, 21, 7);
        ctx.fillRect(x + 8, 10, 4, 10);
        ctx.fillRect(x + 8, 7, 22, 3);
    }

    // CHIMENEA

    ctx.fillStyle = "#515b60";
    ctx.fillRect(118, 1, 14, 18);

    ctx.fillStyle = "#28363d";
    ctx.fillRect(118, 0, 14, 4);

    ctx.restore();

    // BARRA DE RESISTENCIA

    ctx.fillStyle = "#28343b";
    ctx.fillRect(ship.x + 40, ship.y - 12, 90, 5);

    ctx.fillStyle = "#d49a3e";
    ctx.fillRect(
        ship.x + 40,
        ship.y - 12,
        90 * (ship.hp / ship.maxHp),
        5
    );
}

// ==========================================
// DIBUJAR PROYECTILES
// ==========================================

function drawBullets() {
    // BALAS DEL JUGADOR

    bullets.forEach(b => {
        ctx.fillStyle = "#ffe49b";

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255,220,140,0.4)";
        ctx.fillRect(b.x - 14, b.y - 1, 12, 2);
    });

    // PROYECTILES ENEMIGOS

    enemyBullets.forEach(b => {
        ctx.fillStyle = "#ff9a55";

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // MISILES ENEMIGOS

    missiles.forEach(m => {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.angle);

        ctx.fillStyle = "#3e464a";
        ctx.fillRect(-10, -4, 20, 8);

        ctx.fillStyle = "#b9c1c4";

        ctx.beginPath();
        ctx.moveTo(10, -4);
        ctx.lineTo(17, 0);
        ctx.lineTo(10, 4);
        ctx.fill();

        ctx.fillStyle = "#d58b36";
        ctx.fillRect(-13, -2, 4, 4);

        ctx.restore();
    });

    // BOMBAS

    bombs.forEach(b => {
        ctx.fillStyle = "#313a40";

        ctx.beginPath();
        ctx.ellipse(b.x, b.y, 5, 10, 0, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ==========================================
// DIBUJAR EXPLOSIONES Y PARTÍCULAS
// ==========================================

function drawEffects() {
    explosions.forEach(e => {
        const progress = 1 - e.life / e.maxLife;

        ctx.globalAlpha = Math.max(0, e.life / e.maxLife);

        ctx.fillStyle = "#ff9d25";
        ctx.beginPath();
        ctx.arc(
            e.x,
            e.y,
            e.radius + progress * e.maxRadius,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = "#fff0a3";
        ctx.beginPath();
        ctx.arc(
            e.x,
            e.y,
            (e.radius + progress * e.maxRadius) * 0.45,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });

    particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life / 35);
        ctx.fillStyle = p.water ? "#a6e8ff" : "#d99a5a";

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });

    splashes.forEach(s => {
        ctx.globalAlpha = s.life / s.maxLife;
        ctx.strokeStyle = "#b6e9f7";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(
            s.x,
            s.y,
            (s.maxLife - s.life) * 1.8,
            Math.PI,
            Math.PI * 2
        );
        ctx.stroke();
    });

    ctx.globalAlpha = 1;
}

// ==========================================
// COLISIONES
// ==========================================

function overlap(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

function bulletHitsEnemy(bullet, enemy) {
    return (
        bullet.x > enemy.x &&
        bullet.x < enemy.x + enemy.w &&
        bullet.y > enemy.y &&
        bullet.y < enemy.y + enemy.h
    );
}

// ==========================================
// ACTUALIZACIÓN DEL JUEGO
// ==========================================

function update() {
    if (!running) return;

    frame++;

    // MOVIMIENTO DEL AVIÓN

    if (keys["arrowup"] || keys["w"] || keys["up"]) {
        player.y -= player.speed;
    }

    if (keys["arrowdown"] || keys["s"] || keys["down"]) {
        player.y += player.speed;
    }

    if (keys["arrowleft"] || keys["a"] || keys["left"]) {
        player.x -= player.speed;
    }

    if (keys["arrowright"] || keys["d"] || keys["right"]) {
        player.x += player.speed;
    }

    player.x = Math.max(5, Math.min(W - player.w - 5, player.x));
    player.y = Math.max(5, Math.min(SEA - player.h + 3, player.y));

    if (player.shootCooldown > 0) player.shootCooldown--;
    if (player.bombCooldown > 0) player.bombCooldown--;
    if (player.invulnerable > 0) player.invulnerable--;

    if (keys["shoot"]) shoot();
    if (keys["bomb"]) dropBomb();

    // APARICIÓN DE ENEMIGOS

    if (frame % 105 === 0) createEnemy();
    if (frame % 205 === 0) createShip();

    // MOVIMIENTO DE AVIONES ENEMIGOS

    enemies.forEach(enemy => {
        enemy.x -= enemy.speed;

        enemy.y += Math.sin(frame * 0.045 + enemy.phase) * 1.5;

        enemy.shootCooldown--;
        enemy.missileCooldown--;

        if (enemy.shootCooldown <= 0) {
            enemyShoot(enemy.x, enemy.y + enemy.h / 2);
            enemy.shootCooldown = rand(85, 135);
        }

        if (enemy.missileCooldown <= 0) {
            enemyMissile(enemy.x, enemy.y + enemy.h / 2);
            enemy.missileCooldown = rand(220, 300);
        }
    });

    enemies = enemies.filter(e => e.x > -100);

    // MOVIMIENTO DE BARCOS

    ships.forEach(ship => {
        ship.x -= ship.speed;
        ship.shootCooldown--;

        if (s

