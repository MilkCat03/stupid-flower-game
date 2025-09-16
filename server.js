const express = require('express');
const app = express();

const cors = require('cors');
app.use(cors());

const port = 3000;
app.use(express.static('public'));
app.get('/connect', (req, res) => {
    res.sendStatus(200);
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
app.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
});

//getinventory(playerId) {
//    // Fetch inventory from database
//    return database.fetchInventory(playerId);
//}
//updateInventory(playerId, item) {
//    // Update inventory in database
//    database.addItemToInventory(playerId, item);
//}
//removeFromInventory(playerId, item) {
//    // Remove item from inventory in database
//    database.removeItemFromInventory(playerId, item);
//}
//listAllPlayers() {
//    // Return a list of all connected players
//    return database.getAllPlayers();
//}