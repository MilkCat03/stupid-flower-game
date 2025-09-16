// barriers:
//(0,0) to (149, 0)
//(0,0) to (0,149)
//(149,0) to (149,149)
//(0,149) to (149,149)

const canvas = document.getElementById('gridBg');
const ctx = canvas.getContext('2d');
let gridSize = 50; // each grid square size
let offsetX = 0;
let offsetY = 0;
const speed = 100;
const keys = { w: false, a: false, s: false, d: false };

// Shades of gray for 9 sections (3x3)
const shades = [
  "#e0e0e0", "#c0c0c0", "#a0a0a0",
  "#808080", "#606060", "#404040",
  "#202020", "#101010", "#000000"
];

// Define barriers as lines: [x1, y1, x2, y2] in grid coordinates
const barriers = [
  [0, 0, 149, 0],    // top
  [0, 0, 0, 149],    // left
  [149, 0, 149, 149],// right
  [0, 149, 149, 149] // bottom
];

// Player position in grid coordinates
let playerX = Math.floor(Math.random() * 50);
let playerY = Math.floor(Math.random() * 50);

// Helper to check if movement crosses a barrier
function isBlocked(newX, newY) {
  // Only block if trying to cross a barrier line
  for (const [x1, y1, x2, y2] of barriers) {
    // Vertical barrier
    if (x1 === x2) {
      if (
        ((playerX < x1 && newX >= x1) || (playerX > x1 && newX <= x1)) &&
        ((playerY >= y1 && playerY <= y2) || (playerY >= y2 && playerY <= y1))
      ) return true;
    }
    // Horizontal barrier
    if (y1 === y2) {
      if (
        ((playerY < y1 && newY >= y1) || (playerY > y1 && newY <= y1)) &&
        ((playerX >= x1 && playerX <= x2) || (playerX >= x2 && playerX <= x1))
      ) return true;
    }
  }
  return false;
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Center the grid so (0,0) is at the center of the screen
  offsetX = canvas.width / 2;
  offsetY = canvas.height / 2;
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cols = 150;
  const rows = 150;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.fillStyle = "#e0e0e0";
      ctx.fillRect(
        col * gridSize + offsetX,
        row * gridSize + offsetY,
        gridSize,
        gridSize
      );

      ctx.strokeStyle = "#000";
      ctx.strokeRect(
        col * gridSize + offsetX,
        row * gridSize + offsetY,
        gridSize,
        gridSize
      );

      // Draw coordinates in each tile with black text stroke
      ctx.font = "14px monospace";
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#000";
      ctx.fillStyle = "#fff";
      const coordText = `(${col},${row})`;
      const textX = col * gridSize + offsetX + 4;
      const textY = row * gridSize + offsetY + 18;
      ctx.strokeText(coordText, textX, textY);
      ctx.fillText(coordText, textX, textY);
    }
  }

  // Draw barriers in red
  ctx.strokeStyle = "red";
  ctx.lineWidth = 4;
  for (const [x1, y1, x2, y2] of barriers) {
    ctx.beginPath();
    ctx.moveTo(x1 * gridSize + offsetX, y1 * gridSize + offsetY);
    ctx.lineTo(x2 * gridSize + offsetX, y2 * gridSize + offsetY);
    ctx.stroke();
  }

  // Draw player as a yellow dot
  ctx.beginPath();
  ctx.arc(
    playerX * gridSize + offsetX + gridSize / 2,
    playerY * gridSize + offsetY + gridSize / 2,
    gridSize / 3,
    0,
    2 * Math.PI
  );
  ctx.fillStyle = "yellow";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
}

function animate() {
  let newX = playerX;
  let newY = playerY;
  if (keys.w) newY -= 1;
  if (keys.s) newY += 1;
  if (keys.a) newX -= 1;
  if (keys.d) newX += 1;

  // Only move if not blocked and within bounds
  if (
    newX >= 0 && newX < 150 &&
    newY >= 0 && newY < 150 &&
    !isBlocked(newX, newY)
  ) {
    playerX = newX;
    playerY = newY;
  }

  drawGrid();
  requestAnimationFrame(animate);
}

resizeCanvas();
animate();

window.addEventListener('resize', resizeCanvas);

document.addEventListener('keydown', function(e) {
  const key = e.key.toLowerCase();
  if (key in keys) keys[key] = true;
});
document.addEventListener('keyup', function(e) {
  const key = e.key.toLowerCase();
  if (key in keys) keys[key] = false;
});
