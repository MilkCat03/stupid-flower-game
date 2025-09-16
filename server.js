const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const port = 3000;

// --- Game Data ---
let players = {};

// --- Mob Base Data ---
const mobsData = [
  { name: 'Ant Hole', baseHealth: 150, baseDamage: 25, baseSize: 1, speed: 0 },
  { name: 'Avacado', baseHealth: 60, baseDamage: 25, baseSize: 1, speed: 0 },
  { name: 'Baby Ant', baseHealth: 60, baseDamage: 20, baseSize: 1, speed: 1 },
  { name: 'Baby Fire Ant', baseHealth: 80, baseDamage: 25, baseSize: 1, speed: 1 },
  { name: 'Bee', baseHealth: 50, baseDamage: 10, baseSize: 1, speed: 1 },
  { name: 'Beehive', baseHealth: 100, baseDamage: 5, baseSize: 1, speed: 0 },
  { name: 'Beetle', baseHealth: 70, baseDamage: 15, baseSize: 1, speed: 0 },
  { name: 'Bubble', baseHealth: 50, baseDamage: 10, baseSize: 1, speed: 0 },
  { name: 'Bush', baseHealth: 50, baseDamage: 10, baseSize: 1, speed: 0 },
  { name: 'Cactus', baseHealth: 94, baseDamage: 5, baseSize: 1, speed: 0 },
  { name: 'Crab', baseHealth: 80, baseDamage: 20, baseSize: 1, speed: 1 },
  { name: 'Dark Ladybug', baseHealth: 90, baseDamage: 20, baseSize: 1, speed: 1 },
  { name: 'Dice', baseHealth: 50, baseDamage: 15, baseSize: 1, speed: 0 },
  { name: 'Dragon', baseHealth: 500, baseDamage: 100, baseSize: 1, speed: 1 },
  { name: 'Dragon Nest', baseHealth: 200, baseDamage: 70, baseSize: 1, speed: 1 },
  { name: 'Fossil', baseHealth: 50, baseDamage: 5, baseSize: 1, speed: 0 },
  { name: 'Furry', baseHealth: 200, baseDamage: 30, baseSize: 1, speed: 1 },
  { name: 'Ghost', baseHealth: 200, baseDamage: 5, baseSize: 1, speed: 1 },
  { name: 'Guardian', baseHealth: 400, baseDamage: 50, baseSize: 1, speed: 1 },
  { name: 'Hornet', baseHealth: 100, baseDamage: 20, baseSize: 1, speed: 1 },
  { name: 'Jellyfish', baseHealth: 80, baseDamage: 20, baseSize: 1, speed: 1 },
  { name: 'Ladybug', baseHealth: 80, baseDamage: 15, baseSize: 1, speed: 0 },
  { name: 'M28', baseHealth: 50, baseDamage: 10, baseSize: 1, speed: 0 },
  { name: 'Nigersaurus', baseHealth: 60, baseDamage: 100, baseSize: 1, speed: 1 },
  { name: 'Pacman', baseHealth: 120, baseDamage: 35, baseSize: 1, speed: 1 },
  { name: 'PedoX', baseHealth: 120, baseDamage: 40, baseSize: 1, speed: 1 },
  { name: 'Petaler', baseHealth: 50, baseDamage: 10, baseSize: 1, speed: 0 },
  { name: 'Queen Ant', baseHealth: 250, baseDamage: 80, baseSize: 1, speed: 1 },
  { name: 'Rock', baseHealth: 10, baseDamage: 5, baseSize: 1, speed: 0 },
  { name: 'Scorpion', baseHealth: 130, baseDamage: 60, baseSize: 1, speed: 1 },
  { name: 'Snail', baseHealth: 120, baseDamage: 30, baseSize: 1, speed: 0 },
  { name: 'Spider', baseHealth: 100, baseDamage: 30, baseSize: 1, speed: 1 },
  { name: 'Spider Cave', baseHealth: 150, baseDamage: 50, baseSize: 1, speed: 1 },
  { name: 'Spider Yoba', baseHealth: 200, baseDamage: 60, baseSize: 1, speed: 1 },
  { name: 'Statue', baseHealth: 500, baseDamage: 0, baseSize: 1, speed: 0 },
  { name: 'Stickbug', baseHealth: 50, baseDamage: 20, baseSize: 1, speed: 0 },
  { name: 'Tumbleweed', baseHealth: 50, baseDamage: 5, baseSize: 1, speed: 0 },
  { name: 'Yellow Ladybug', baseHealth: 80, baseDamage: 15, baseSize: 1, speed: 0 },
  { name: 'Yoba', baseHealth: 150, baseDamage: 50, baseSize: 1, speed: 1 }
];

// --- Rarity Multipliers ---
const rarityMultipliers = {
    C:  { health: 1,   damage: 1,   size: 1 },
    UC: { health: 1.5, damage: 1.2, size: 1 },
    R:  { health: 2,   damage: 1.5, size: 1.2 },
    E:  { health: 3,   damage: 2,   size: 1.3 },
    L:  { health: 4,   damage: 2.5, size: 1.5 },
    M:  { health: 6,   damage: 3,   size: 1.7 },
    U:  { health: 8,   damage: 4,   size: 2 },
    S:  { health: 12,  damage: 5,   size: 2.5 },
    H:  { health: 20,  damage: 8,   size: 3 }
};

// --- Rarity Spawn Table ---
const raritySpawnTable = [
    { rarity: 'C', probability: 40 },
    { rarity: 'UC', probability: 25 },
    { rarity: 'R', probability: 15 },
    { rarity: 'E', probability: 10 },
    { rarity: 'L', probability: 5 },
    { rarity: 'M', probability: 3 },
    { rarity: 'U', probability: 1 },
    { rarity: 'S', probability: 0.5 },
    { rarity: 'H', probability: 0.5 }
];

// --- World Items / Mobs ---
let worldItems = [];

// --- Utility Functions ---
function pickFromTable(table) {
    const total = table.reduce((sum, item) => sum + item.probability, 0);
    let rand = Math.random() * total;
    for (let item of table) {
        if (rand < item.probability) return item;
        rand -= item.probability;
    }
    return table[0];
}

function spawnMobInZone(zoneX, zoneY) {
    // Pick a base mob
    const mobBase = mobsData[Math.floor(Math.random() * mobsData.length)];

    // Pick a rarity
    const rarity = pickFromTable(raritySpawnTable).rarity;
    const mult = rarityMultipliers[rarity];

    return {
        id: uuidv4(),
        name: mobBase.name,
        rarity,
        health: Math.round(mobBase.baseHealth * mult.health),
        damage: Math.round(mobBase.baseDamage * mult.damage),
        size: +(mobBase.baseSize * mult.size).toFixed(1),
        speed: mobBase.speed,
        x: zoneX * 50 + Math.floor(Math.random() * 50),
        y: zoneY * 50 + Math.floor(Math.random() * 50),
        alive: true
    };
}

function spawnMobsForZone(zoneX, zoneY, count = 10) {
    const mobs = [];
    for (let i = 0; i < count; i++) {
        mobs.push(spawnMobInZone(zoneX, zoneY));
    }
    return mobs;
}

// --- Initialize World ---
const mapWidthZones = 5;
const mapHeightZones = 5;

for (let zx = 0; zx < mapWidthZones; zx++) {
    for (let zy = 0; zy < mapHeightZones; zy++) {
        worldItems.push(...spawnMobsForZone(zx, zy, 10));
    }
}

// --- HTTP Endpoints ---
app.get('/connect', (req, res) => {
    const playerId = 'player_' + Math.floor(Math.random() * 10000);
    const x = Math.floor(Math.random() * 50);
    const y = Math.floor(Math.random() * 50);

    players[playerId] = {
        x,
        y,
        inventory: [
            { name: 'Basic', quantity: 1, rarity: 'common' },
            { name: 'Rock', quantity: 1, rarity: 'common' },
            { name: 'Basic', quantity: 1, rarity: 'common' },
            { name: 'Rock', quantity: 1, rarity: 'common' },
            { name: 'Basic', quantity: 1, rarity: 'common' },
            { name: 'Rock', quantity: 1, rarity: 'common' },
            { name: 'Basic', quantity: 1, rarity: 'common' },
            { name: 'Rock', quantity: 1, rarity: 'common' }
        ],
        equipped: [
            { name: 'Basic', quantity: 1, rarity: 'common' },
            { name: 'Basic', quantity: 1, rarity: 'common' },
            { name: 'Basic', quantity: 1, rarity: 'common' },
            { name: 'Basic', quantity: 1, rarity: 'common' },
            { name: 'Basic', quantity: 1, rarity: 'common' }
        ],
        petalSlots: 5
    };

    res.json({
        playerId,
        x,
        y,
        inventory: players[playerId].inventory,
        equipped: players[playerId].equipped,
        petalSlots: players[playerId].petalSlots
    });
});

app.get('/players', (req, res) => res.json(players));
app.get('/worldItems', (req, res) => res.json(worldItems));

// --- WebSocket Setup ---
const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.send(JSON.stringify({ type: 'update', players, worldItems }));

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch(data.type) {
            case 'update':
                if (data.worldItems) {
                    window.worldItems = data.worldItems.map(item => ({
                        ...item,
                        alive: item.alive,
                        health: item.health
                    }));
                }
                if (data.players) {
                    window.players = data.players;
                }
                break;

            case 'newRock':
                window.worldItems.push(data.rock);
                break;
        }
    };

    ws.on('close', () => {
        console.log('WebSocket disconnected');
    });
});

// --- Optional: Mob Movement/Respawn Loop ---
setInterval(() => {
    worldItems.forEach(mob => {
        if (!mob.alive || mob.speed === 0) return;
        const dx = Math.floor(Math.random() * 3) - 1; // -1,0,1
        const dy = Math.floor(Math.random() * 3) - 1;
        mob.x = Math.max(0, Math.min(mapWidthZones*50-1, mob.x + dx));
        mob.y = Math.max(0, Math.min(mapHeightZones*50-1, mob.y + dy));
    });

    // Broadcast updated mobs to all clients
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(JSON.stringify({ type: 'update', worldItems }));
        }
    });
}, 1000);
