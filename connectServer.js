let connected = false;
let playerId = null;
let playerX = 0;
let playerY = 0;
let playerInventory = [];
let petalSlots = 0;

fetch('https://76a2b3cd-4971-4e70-952e-74a94a725d6b-00-5rcgg7jt3bol.spock.replit.dev/connect')
    .then(response => response.json())
    .then(data => {
        connected = true;

        // Pull all player variables from server
        playerId = data.playerId;
        playerX = data.x || 0;
        playerY = data.y || 0;
        playerInventory = data.inventory || [];
        petalSlots = data.petalSlots || 5;

        console.log('Connected to server');
        console.log('Player ID:', playerId);
        console.log('Position:', playerX, playerY);
        console.log('Inventory:', playerInventory);
        console.log('Petal Slots:', petalSlots);

        // Initialize WebSocket
        initWebSocket();

        // Dynamically load external scripts
        loadScript('petalLogic.js', () => {
            console.log('petalLogic.js loaded');
            loadScript('render.js', () => {
                console.log('render.js loaded');
                // Optionally, call a function from render.js to start rendering
                if (typeof initRender === 'function') initRender();
            });
        });

    })
    .catch(error => {
        const errorDetails = `
            <h1 style="color: red; text-align: center; margin-bottom: 16px;">Error: Unable to connect to the server.</h1>
            <div style="color: #fff; text-align: center;">
                <p><strong>Details:</strong></p>
                <pre style="background:#222; color:#fff; padding:12px; border-radius:8px; display:inline-block;">${error.message}</pre>
                <p>Make sure your server is running at <code>http://localhost:3000</code>.</p>
                <p>If you just started the server, wait a few seconds and refresh.</p>
                <p>If the problem persists, check your firewall or network settings.</p>
            </div>
        `;
        document.body.innerHTML = errorDetails;
        document.body.style.backgroundColor = '#000';
        document.body.style.color = '#fff';
        document.body.style.fontFamily = 'sans-serif';
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100%';
        document.body.style.display = 'flex';
        document.body.style.flexDirection = 'column';
        document.body.style.justifyContent = 'center';
        document.body.style.alignItems = 'center';
    });

// Helper function to dynamically load JS files
function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = callback;
    script.onerror = () => console.error(`Failed to load ${src}`);
    document.body.appendChild(script);
}

// Example WebSocket init function
function initWebSocket() {
    const ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
        console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'update') {
            console.log('Updated player positions:', message.players);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
    };
}