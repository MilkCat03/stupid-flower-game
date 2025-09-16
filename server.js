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