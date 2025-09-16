window.inventory = [];
window.builds = { build1: [] };
window.petalSlots = 5;

// -------------------------
// Wait for connection
// -------------------------
function waitForConnection(callback) {
    if (window.connected) callback();
    else setTimeout(() => waitForConnection(callback), 100);
    
}

// -------------------------
// Render petals around player
// -------------------------
function renderPetals(ctx, playerX, playerY, offsetX, offsetY, playerSize, playerEmoji, gridSize) {
    const time = Date.now() * rotationSpeed * rotationMultiplier * 0.001;

    let petalDistance = 0.8 * distanceMultiplier;
    if (playerEmoji === "😠") petalDistance = 1.2 * distanceMultiplier;
    else if (playerEmoji === "😥") petalDistance = 0.5 * distanceMultiplier;

    const activeBuildId = "build1";
    const buildPetals = window.builds[activeBuildId].filter(slot => slot !== null);
    const totalPetals = Math.min(buildPetals.length, window.petalSlots);

    for (let i = 0; i < totalPetals; i++) {
        const angle = time + (i * (2 * Math.PI / totalPetals));
        const petalX = playerX * gridSize + offsetX + gridSize / 2 + Math.cos(angle) * petalDistance * gridSize;
        const petalY = playerY * gridSize + offsetY + gridSize / 2 + Math.sin(angle) * petalDistance * gridSize;

        const icon = buildPetals[i].icon || (window.petalData.find(p => p.name === buildPetals[i].name) || {}).icon || "❓";

        ctx.font = `${playerSize}px serif`;
        ctx.fillText(icon, petalX, petalY);
    }
}

// Call initPlayer or animate AFTER this function is declared
animate();

// -------------------------
// Fetch player and inventory
// -------------------------
waitForConnection(() => {
    fetch("https://76a2b3cd-4971-4e70-952e-74a94a725d6b-00-5rcgg7jt3bol.spock.replit.dev:3000/connect")
        .then(res => res.json())
        .then(data => {
            window.playerId = data.playerId;
            window.connected = true;

            populateInventory(data);

            if (Array.isArray(data.equipped)) {
                window.builds.build1 = data.equipped.slice(0, window.petalSlots).map((item, i) => ({
                    uid: item.uid || `build1_${i}`,
                    name: item.name,
                    rarity: item.rarity,
                    icon: (window.petalData.find(p => p.name === item.name) || {}).icon || "❓"
                }));
            }

            renderInventory(window.inventory);
            renderBuild('build1');
        });
});

// -------------------------
// Populate inventory
// -------------------------
function populateInventory(data) {
    window.inventory = data.inventory.map((item, i) => ({
        ...item,
        uid: item.uid || `${item.name}_${i}`,
        icon: (window.petalData.find(p => p.name === item.name) || {}).icon || "❓"
    }));
}

// -------------------------
// Render inventory (fixed colors)
// -------------------------
function renderInventory(items) {
    const container = document.querySelector("#inventory");
    container.innerHTML = '';

    items.forEach(item => {
        const div = document.createElement("div");
        div.className = "item";
        div.dataset.uid = item.uid;
        div.dataset.name = item.name;
        div.dataset.icon = item.icon;
        div.dataset.rarity = item.rarity;
        div.draggable = true;

        // Safe color assignment
        const colorPair = colors[item.rarity] || colors.default;
        div.style.backgroundColor = colorPair[0];
        div.style.border = `3px solid ${colorPair[1]}`;

        div.innerHTML = `${div.dataset.icon}<span>${item.name}</span>`;

        div.addEventListener("dragstart", e => {
            e.dataTransfer.setData("text/plain", JSON.stringify({
                uid: item.uid,
                name: item.name,
                icon: item.icon,
                rarity: item.rarity,
                from: "inventory"
            }));
        });

        container.appendChild(div);
    });
}

// -------------------------
// Render build (fixed colors)
// -------------------------
function renderBuild(buildId = "build1") {
    const buildDiv = document.getElementById(buildId);
    if (!buildDiv) return;

    const slots = buildDiv.querySelectorAll(".slot");
    const buildArray = window.builds[buildId];

    slots.forEach((slot, i) => {
        const item = buildArray[i];

        // Reset slot
        slot.className = "slot";
        slot.textContent = '';
        slot.style.backgroundColor = '';
        slot.style.border = '';
        slot.dataset.uid = '';
        slot.dataset.name = '';
        slot.dataset.rarity = '';
        slot.draggable = false;

        if (item) {
            slot.classList.add("filled");
            slot.textContent = `${item.icon} ${item.name}`;
            slot.dataset.uid = item.uid;
            slot.dataset.name = item.name;
            slot.dataset.rarity = item.rarity;
            slot.draggable = true;

            // Safe color assignment
            const colorPair = colors[item.rarity] || colors.default;
            slot.style.backgroundColor = colorPair[0];
            slot.style.border = `3px solid ${colorPair[1]}`;

            slot.addEventListener("dragstart", e => {
                e.dataTransfer.setData("text/plain", JSON.stringify({
                    uid: item.uid,
                    name: item.name,
                    icon: item.icon,
                    rarity: item.rarity,
                    from: "build",
                    buildId,
                    slotIndex: i
                }));
            });
        }

        // Drag over / drop
        slot.addEventListener("dragover", e => e.preventDefault());
        slot.addEventListener("drop", e => {
            e.preventDefault();
            const data = JSON.parse(e.dataTransfer.getData("text/plain"));
            const targetIndex = i;
            const existingItem = buildArray[targetIndex];

            if (data.from === "inventory") {
                const invIndex = window.inventory.findIndex(it => it.uid === data.uid);
                if (invIndex > -1) window.inventory.splice(invIndex, 1);

                buildArray[targetIndex] = {
                    uid: data.uid,
                    name: data.name,
                    icon: data.icon,
                    rarity: data.rarity
                };
            } else if (data.from === "build") {
                // Swap between build slots
                buildArray[data.slotIndex] = existingItem || null;
                buildArray[targetIndex] = {
                    uid: data.uid,
                    name: data.name,
                    icon: data.icon,
                    rarity: data.rarity
                };
            }

            renderInventory(window.inventory);
            renderBuild(buildId);
        });
    });
}

// -------------------------
// Drop back into inventory
// -------------------------
const inventoryContainer = document.querySelector("#inventory");
inventoryContainer.addEventListener("dragover", e => e.preventDefault());
inventoryContainer.addEventListener("drop", e => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));

    if (data.from !== "build") return;

    // Remove from build
    window.builds[data.buildId][data.slotIndex] = null;

    // Prevent duplicates
    if (!window.inventory.some(i => i.uid === data.uid)) {
        window.inventory.push({
            uid: data.uid,
            name: data.name,
            icon: data.icon,
            rarity: data.rarity
        });
    }

    renderInventory(window.inventory);
    renderBuild(data.buildId);
});
