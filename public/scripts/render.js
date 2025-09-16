let playerId;
let playerX, playerY;
let playerSpeed = 0.02;
let rotationSpeed = 2; // radians per second 
let rotationMultiplier = 1; // Adjusts rotation speed
let distanceMultiplier = 1; // Adjusts petal distance from player
let petalSlots, petalCount;
let inventory = []; // player inventory
const canvas = document.getElementById('gridBg');
const ctx = canvas.getContext('2d');

const gridSize = 250;
const gridCols = 150;
const gridRows = 150;
const sections = 3;
const sectionSize = 50;

const shades = [
  "#83ff8dff", "#62c06aff", "#408d46ff",
  "#ff8a8aff", "#ac5d5dff", "#7a3a3aff",
  "#202020", "#101010", "#000000"
];

const keys = { w: false, a: false, s: false, d: false, shift: false, space: false };
let offsetX = 0, offsetY = 0;
let playerSize = gridSize / 5;
let playerEmoji = "😃";

// Barrier cells
const barrierCells = [];
for (let c = 0; c <= 100; c++) barrierCells.push([c, 49], [c, 50]);
for (let r = 50; r <= 75; r++) barrierCells.push([100, r], [99, r]);
for (let c = 50; c <= 149; c++) barrierCells.push([c, 99], [c, 100]);
for (let r = 75; r <= 135; r++) barrierCells.push([49, r], [48, r]);

// --- WebSocket ---
const ws = new WebSocket('ws://76a2b3cd-4971-4e70-952e-74a94a725d6b-00-5rcgg7jt3bol.spock.replit.dev:3000');
ws.onopen = () => console.log('WebSocket connected');
ws.onclose = () => console.log('WebSocket disconnected');
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'update' && data.worldItems) {
        data.worldItems.forEach(serverMob => {
            const localMob = window.worldItems.find(m => m.id === serverMob.id);
            if (localMob) {
                // Update target positions
                localMob.prevX = localMob.x;
                localMob.prevY = localMob.y;
                localMob.x = serverMob.x;
                localMob.y = serverMob.y;
                localMob.health = serverMob.health;
                localMob.maxHealth = serverMob.maxHealth;
            } else {
                // Initialize new mob
                serverMob.prevX = serverMob.x;
                serverMob.prevY = serverMob.y;
                serverMob.renderX = serverMob.x;
                serverMob.renderY = serverMob.y;
                window.worldItems.push(serverMob);
            }
        });
    }
};

// --- Initialize player ---
async function initPlayer() {
    const res = await fetch('https://76a2b3cd-4971-4e70-952e-74a94a725d6b-00-5rcgg7jt3bol.spock.replit.dev:3000/connect');
    const data = await res.json();

    playerId = data.playerId;
    playerX = data.x;
    playerY = data.y;
    petalSlots = data.petalSlots;
    petalCount = data.petalCount || petalSlots;
    inventory = data.inventory || [{ name: 'Common Petal', quantity: petalCount }];

    console.log('Player loaded:', data);
    resizeCanvas();
    await fetchWorldItems();
    initializeMobRenderPositions();
    animate();
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    offsetX = canvas.width / 2 - playerX * gridSize - gridSize / 2;
    offsetY = canvas.height / 2 - playerY * gridSize - gridSize / 2;
}

function isBarrier(col, row) {
    return barrierCells.some(([bc, br]) => bc === Math.round(col) && br === Math.round(row));
}

function getSectionShade(col, row) {
    const sectionCol = Math.floor(col / sectionSize);
    const sectionRow = Math.floor(row / sectionSize);
    return shades[sectionRow * sections + sectionCol];
}

function handleEmoji() {
    if (keys.shift) playerEmoji = "😥";
    else if (keys.space) playerEmoji = "😠";
    else playerEmoji = "😃";
}

// --- Linear interpolation for smooth movement ---
function lerp(start, end, t) {
    return start + (end - start) * t;
}

// --- Draw grid and player ---
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const startCol = Math.max(0, Math.floor(-offsetX / gridSize));
    const endCol = Math.min(gridCols, Math.ceil((canvas.width - offsetX) / gridSize));
    const startRow = Math.max(0, Math.floor(-offsetY / gridSize));
    const endRow = Math.min(gridRows, Math.ceil((canvas.height - offsetY) / gridSize));

    for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
            ctx.fillStyle = isBarrier(col, row) ? "#ff2222" : getSectionShade(col, row);
            ctx.fillRect(col * gridSize + offsetX, row * gridSize + offsetY, gridSize, gridSize);

            ctx.strokeStyle = "#000";
            ctx.strokeRect(col * gridSize + offsetX, row * gridSize + offsetY, gridSize, gridSize);

            ctx.font = "24px monospace";
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#000";
            ctx.fillStyle = "#fff";
            const coordText = `(${col},${row})`;
            const textX = col * gridSize + offsetX + 6;
            const textY = row * gridSize + offsetY + 22;
            ctx.strokeText(coordText, textX, textY);
            ctx.fillText(coordText, textX, textY);
        }
    }

    ctx.font = `${playerSize * 2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(playerEmoji, playerX * gridSize + offsetX + gridSize / 2, playerY * gridSize + offsetY + gridSize / 2);
}

// --- Render player's petals ---
function renderPetals(ctx, x, y, offsetX, offsetY) {
    const centerX = x * gridSize + offsetX + gridSize / 2;
    const centerY = y * gridSize + offsetY + gridSize / 2;
    for (let i = 0; i < petalSlots; i++) {
        const angle = (i / petalSlots) * 2 * Math.PI + performance.now() * 0.001 * rotationMultiplier;
        const px = centerX + Math.cos(angle) * gridSize * distanceMultiplier * 0.5;
        const py = centerY + Math.sin(angle) * gridSize * distanceMultiplier * 0.5;
        ctx.fillText("🌸", px, py);
    }
}

// --- Fetch and initialize world items ---
window.worldItems = [];

async function fetchWorldItems() {
    try {
        const res = await fetch('https://76a2b3cd-4971-4e70-952e-74a94a725d6b-00-5rcgg7jt3bol.spock.replit.dev:3000/worldItems');
        const items = await res.json();
        window.worldItems = items;
    } catch (err) {
        console.error('Failed to fetch world items:', err);
    }
}

function initializeMobRenderPositions() {
    window.worldItems.forEach(item => {
        item.prevX = item.x;
        item.prevY = item.y;
        item.renderX = item.x;
        item.renderY = item.y;
    });
}

// --- Render world items with tweening ---
function renderWorldItems() {
    if (!window.worldItems) return;

    const delta = 0.1; // tween speed

    window.worldItems.forEach(item => {
        if (!item.alive) return;

        // Tween positions
        item.renderX = lerp(item.renderX ?? item.x, item.x, delta);
        item.renderY = lerp(item.renderY ?? item.y, item.y, delta);

        // Look up icon from window.mobs
        const mobData = window.mobs.find(m => m.name === item.name);
        const icon = mobData ? mobData.icon : "❓";

        const xPos = item.renderX * gridSize + offsetX + gridSize / 2;
        const yPos = item.renderY * gridSize + offsetY + gridSize / 2;

        ctx.font = `${playerSize}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(icon, xPos, yPos);

        // Draw health bar
        const barWidth = gridSize * 0.6;
        const barHeight = 6;
        const healthRatio = item.health / item.maxHealth;

        ctx.fillStyle = 'red';
        ctx.fillRect(xPos - barWidth / 2, yPos - gridSize / 2 - 10, barWidth, barHeight);

        ctx.fillStyle = 'lime';
        ctx.fillRect(xPos - barWidth / 2, yPos - gridSize / 2 - 10, barWidth * healthRatio, barHeight);

        ctx.strokeStyle = 'black';
        ctx.strokeRect(xPos - barWidth / 2, yPos - gridSize / 2 - 10, barWidth, barHeight);
    });
}


// --- Send player position to server ---
function sendPlayerPosition() {
    if (!playerId || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'move', playerId, x: playerX, y: playerY }));
}

// --- Animation loop ---
function animate() {
    let newX = playerX;
    let newY = playerY;

    if (keys.w) newY -= playerSpeed;
    if (keys.s) newY += playerSpeed;
    if (keys.a) newX -= playerSpeed;
    if (keys.d) newX += playerSpeed;

    newX = Math.max(0, Math.min(gridCols - 1, newX));
    newY = Math.max(0, Math.min(gridRows - 1, newY));

    if (!isBarrier(newX, newY)) {
        if (newX !== playerX || newY !== playerY) sendPlayerPosition();
        playerX = newX;
        playerY = newY;
    }

    offsetX = canvas.width / 2 - playerX * gridSize - gridSize / 2;
    offsetY = canvas.height / 2 - playerY * gridSize - gridSize / 2;

    handleEmoji();
    drawGrid();
    renderWorldItems();

    requestAnimationFrame(animate);
    renderPetals(ctx, playerX, playerY, offsetX, offsetY, playerSize, playerEmoji, gridSize);


    detectCollisions?.();
    updateRespawns?.(16); // if these functions exist
}

// --- Input ---
window.addEventListener('resize', resizeCanvas);

document.addEventListener('keydown', e => {
    let key = e.key.toLowerCase();
    if (key === " ") key = "space";
    if (key in keys) keys[key] = true;
});

document.addEventListener('keyup', e => {
    let key = e.key.toLowerCase();
    if (key === " ") key = "space";
    if (key in keys) keys[key] = false;
});

// --- Start ---
initPlayer();
