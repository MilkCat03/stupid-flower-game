// -------------------------
// Render Hitboxes
// -------------------------
function drawHitboxes(ctx) {
    const playerCenterX = playerX * gridSize + offsetX + gridSize / 2;
    const playerCenterY = playerY * gridSize + offsetY + gridSize / 2;
    const playerRadius = gridSize / 5;

    ctx.save();

    // --- Player Hitbox ---
    ctx.strokeStyle = "rgba(0, 17, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(playerCenterX, playerCenterY, playerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // --- Petal Hitboxes ---
    const activeBuildId = "build1";
    const buildPetals = builds[activeBuildId].filter(slot => slot !== null);
    const totalPetals = Math.min(buildPetals.length, petalSlots);
    const time = Date.now() * rotationSpeed * rotationMultiplier * 0.001;

    let petalDistance = 0.8 * distanceMultiplier;
    if (playerEmoji === "😠") petalDistance = 1.2 * distanceMultiplier;
    else if (playerEmoji === "😥") petalDistance = 0.5 * distanceMultiplier;

    for (let i = 0; i < totalPetals; i++) {
        const angle = time + (i * (2 * Math.PI / totalPetals));
        const petalX = playerCenterX + Math.cos(angle) * petalDistance * gridSize;
        const petalY = playerCenterY + Math.sin(angle) * petalDistance * gridSize;
        const petalRadius = gridSize * 0.15;

        ctx.strokeStyle = "rgba(255, 192, 203, 0.8)";
        ctx.beginPath();
        ctx.arc(petalX, petalY, petalRadius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // --- Mob/World Item Hitboxes ---
    if (window.worldItems) {
        window.worldItems.forEach(item => {
            if (!item.alive) return; // <-- skip dead mobs

            const xPos = item.x * gridSize + offsetX + gridSize / 2;
            const yPos = item.y * gridSize + offsetY + gridSize / 2;
            const mobRadius = gridSize * 0.4;

            ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
            ctx.beginPath();
            ctx.arc(xPos, yPos, mobRadius, 0, Math.PI * 2);
            ctx.stroke();
        });
    }

    ctx.restore();
}

function circlesCollide(x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < r1 + r2;
}

function detectCollisions() {
    const playerCenterX = playerX * gridSize + offsetX + gridSize / 2;
    const playerCenterY = playerY * gridSize + offsetY + gridSize / 2;
    const playerRadius = gridSize / 5;

    // --- Petal Hitboxes ---
    const activeBuildId = "build1";
    const buildPetals = builds[activeBuildId].filter(slot => slot !== null);
    const totalPetals = Math.min(buildPetals.length, petalSlots);
    const time = Date.now() * rotationSpeed * rotationMultiplier * 0.001;

    let petalDistance = 0.8 * distanceMultiplier;
    if (playerEmoji === "😠") petalDistance = 1.2 * distanceMultiplier;
    else if (playerEmoji === "😥") petalDistance = 0.5 * distanceMultiplier;

    const petalHitboxes = [];
    for (let i = 0; i < totalPetals; i++) {
        const angle = time + (i * (2 * Math.PI / totalPetals));
        const petalX = playerCenterX + Math.cos(angle) * petalDistance * gridSize;
        const petalY = playerCenterY + Math.sin(angle) * petalDistance * gridSize;
        const petalRadius = gridSize * 0.15;
        const petalDamage = buildPetals[i].damage || 1;

        petalHitboxes.push({ x: petalX, y: petalY, r: petalRadius, damage: petalDamage });
    }

    // --- World Item / Mob Hitboxes ---
    if (window.worldItems) {
        window.worldItems.forEach(item => {
            if (!item.alive) return;

            const xPos = item.x * gridSize + offsetX + gridSize / 2;
            const yPos = item.y * gridSize + offsetY + gridSize / 2;
            const mobRadius = gridSize * 0.4;

            // Petal collisions
            petalHitboxes.forEach((petal, index) => {
                if (circlesCollide(petal.x, petal.y, petal.r, xPos, yPos, mobRadius)) {
                    // Apply damage
                    item.health -= petal.damage;

                    if (item.health <= 0 && item.alive) {
                        item.alive = false; // hide immediately on this client

                        // Notify server to spawn a new rock
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({
                                type: "rockDestroyed",
                                originalRockId: item.id
                            }));
                        }

                        console.log(`${item.name} destroyed!`);
                    }
                }
            });

            // Optional: player collision
            if (circlesCollide(playerCenterX, playerCenterY, playerRadius, xPos, yPos, mobRadius)) {
                console.log(`Player hit by ${item.name}`);
                // Apply damage to player if desired
            }
        });
    }
}

// --- Circle collision helper ---
function circlesCollide(x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy) < r1 + r2;
}


function updateRespawns(deltaTime) {
    if (!window.worldItems) return;

    window.worldItems.forEach(item => {
        if (!item.alive && item.respawnTimer > 0) {
            item.respawnTimer -= deltaTime;
            if (item.respawnTimer <= 0) {
                item.alive = true;
                item.health = item.maxHealth;
                console.log(`${item.name} respawned!`);
            }
        }
    });
}
