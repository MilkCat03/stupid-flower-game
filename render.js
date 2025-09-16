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

let playerX = Math.floor(Math.random() * 50);
let playerY = Math.floor(Math.random() * 50);

let offsetX = 0;
let offsetY = 0;
let playerSpeed = 0.012;
let playerSize = gridSize / 5;
let playerEmoji = "😃";

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  offsetX = canvas.width / 2 - playerX * gridSize - gridSize / 2;
  offsetY = canvas.height / 2 - playerY * gridSize - gridSize / 2;
}

function getSectionShade(col, row) {
  const sectionCol = Math.floor(col / sectionSize);
  const sectionRow = Math.floor(row / sectionSize);
  return shades[sectionRow * sections + sectionCol];
}

const barrierCells = [];
for (let c = 0; c <= 100; c++) {
  barrierCells.push([c, 49]);
  barrierCells.push([c, 50]);
}
for (let r = 50; r <= 75; r++) {
  barrierCells.push([100, r]);
  barrierCells.push([99, r]);
}
for (let c = 50; c <= 149; c++) {
  barrierCells.push([c, 99]);
  barrierCells.push([c, 100]);
}
for (let r = 75; r <= 135; r++) {
  barrierCells.push([49, r]);
  barrierCells.push([48, r]);
}

function isBarrier(col, row) {
  return barrierCells.some(([bc, br]) => bc === Math.round(col) && br === Math.round(row));
}

function handleEmoji() {
  if (keys.shift) playerEmoji = "😥";
  else if (keys.space) playerEmoji = "😠";
  else playerEmoji = "😃";
}

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
    playerX = newX;
    playerY = newY;
  }

  offsetX = canvas.width / 2 - playerX * gridSize - gridSize / 2;
  offsetY = canvas.height / 2 - playerY * gridSize - gridSize / 2;

  handleEmoji();
  drawGrid();
  renderPetals(ctx, playerX, playerY, offsetX, offsetY, playerSize, playerEmoji, gridSize);
  requestAnimationFrame(animate);
}

resizeCanvas();
animate();

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