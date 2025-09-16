// barriers:
//(0,49) to (49,49)
//(0,0) to (149, 0)
//(0,0) to ()

const canvas = document.getElementById('gridBg');
const ctx = canvas.getContext('2d');
let gridSize = 50; // each grid square size
let offsetX = 0;
let offsetY = 0;
const speed = 2;
const keys = { w: false, a: false, s: false, d: false };

// Shades of gray for 9 sections (3x3)
const shades = [
  "#e0e0e0", "#c0c0c0", "#a0a0a0",
  "#808080", "#606060", "#404040",
  "#202020", "#101010", "#000000"
];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Center the grid so (0,0) is at the center of the screen
  offsetX = canvas.width / 2;
  offsetY = canvas.height / 2;
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cols = 50 * 3;
  const rows = 50 * 3;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const sectionCol = Math.floor(col / 50);
      const sectionRow = Math.floor(row / 50);
      const sectionIndex = sectionRow * 3 + sectionCol;

      ctx.fillStyle = shades[sectionIndex];
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

      // Draw coordinates in each tile
      ctx.fillStyle = "#222";
      ctx.font = "14px monospace";
      ctx.fillText(
        `(${col},${row})`,
        col * gridSize + offsetX + 4,
        row * gridSize + offsetY + 18
      );
    }
  }

  // Draw barriers
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 4; // thicker for barriers
  for (const b of barriers) {
    const [x1, y1, x2, y2] = b;
    ctx.beginPath();
    ctx.moveTo(x1 * 50 * gridSize + offsetX, y1 * 50 * gridSize + offsetY);
    ctx.lineTo(x2 * 50 * gridSize + offsetX, y2 * 50 * gridSize + offsetY);
    ctx.stroke();
  }
}

function animate() {
  if (keys.w) offsetY += speed;
  if (keys.s) offsetY -= speed;
  if (keys.a) offsetX += speed;
  if (keys.d) offsetX -= speed;
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
