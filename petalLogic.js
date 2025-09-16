const petalCount = 5;
const rotationSpeed = 0.75;
const rotationMultiplier = 1;
const distanceMultiplier = 1;

function renderPetals(ctx, playerX, playerY, offsetX, offsetY, playerSize, playerEmoji, gridSize) {
  const time = Date.now() * rotationSpeed * rotationMultiplier * 0.001;

  let petalDistance = 0.8 * distanceMultiplier;
  if (playerEmoji === "😠") petalDistance = 1.2 * distanceMultiplier;
  else if (playerEmoji === "😥") petalDistance = 0.5 * distanceMultiplier;

  for (let i = 0; i < petalCount; i++) {
    const angle = time * rotationSpeed + (i * (2 * Math.PI / petalCount));
    const petalX = playerX * gridSize + offsetX + gridSize / 2 + Math.cos(angle) * petalDistance * gridSize;
    const petalY = playerY * gridSize + offsetY + gridSize / 2 + Math.sin(angle) * petalDistance * gridSize;

    ctx.font = `${playerSize}px serif`;
    ctx.fillText("🌸", petalX, petalY);
  }
}