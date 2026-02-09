const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const livesEl = document.getElementById("lives");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");

const W = canvas.width;
const H = canvas.height;

const state = {
  running: false,
  score: 0,
  best: Number(localStorage.getItem("comet-best") || 0),
  lives: 3,
  speed: 1,
  spawnTimer: 0,
  spawnInterval: 0.9,
  time: 0,
};

const player = {
  x: W / 2,
  y: H - 70,
  w: 26,
  h: 34,
  vx: 0,
  accel: 1800,
  max: 360,
};

const comets = [];
const stars = [];

for (let i = 0; i < 80; i += 1) {
  stars.push({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.6 + 0.4,
    s: Math.random() * 20 + 20,
  });
}

const keys = new Set();
window.addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(e.key)) {
    e.preventDefault();
  }
  keys.add(e.key);
});
window.addEventListener("keyup", (e) => keys.delete(e.key));

function resetGame() {
  state.score = 0;
  state.lives = 3;
  state.speed = 1;
  state.spawnTimer = 0;
  state.spawnInterval = 0.9;
  state.time = 0;
  comets.length = 0;
  player.x = W / 2;
  player.vx = 0;
  updateHud();
}

function updateHud() {
  scoreEl.textContent = Math.floor(state.score);
  bestEl.textContent = state.best;
  livesEl.textContent = state.lives;
}

function spawnComet() {
  const radius = Math.random() * 14 + 10;
  const x = Math.random() * (W - radius * 2) + radius;
  const y = -radius - 10;
  const speed = Math.random() * 120 + 160 + state.speed * 25;
  comets.push({ x, y, r: radius, s: speed });
}

function drawShip() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.beginPath();
  ctx.moveTo(0, -player.h / 2);
  ctx.lineTo(player.w / 2, player.h / 2);
  ctx.lineTo(-player.w / 2, player.h / 2);
  ctx.closePath();
  ctx.fillStyle = "#40e0ff";
  ctx.shadowColor = "rgba(64,224,255,0.7)";
  ctx.shadowBlur = 12;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, player.h / 2 - 2);
  ctx.lineTo(6, player.h / 2 + 12);
  ctx.lineTo(-6, player.h / 2 + 12);
  ctx.closePath();
  ctx.fillStyle = "#ffb454";
  ctx.shadowColor = "rgba(255,180,84,0.7)";
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.restore();
}

function drawComet(c) {
  const gradient = ctx.createRadialGradient(c.x, c.y, c.r * 0.2, c.x, c.y, c.r);
  gradient.addColorStop(0, "#ffd6a1");
  gradient.addColorStop(1, "#ff7a59");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
  ctx.fill();
}

function hitTest(c) {
  const dx = Math.abs(c.x - player.x);
  const dy = Math.abs(c.y - player.y);
  const rx = player.w / 2;
  const ry = player.h / 2;
  return dx < c.r + rx && dy < c.r + ry;
}

function update(dt) {
  state.time += dt;
  state.score += dt * 10;
  state.speed = 1 + state.time / 18;

  state.spawnInterval = Math.max(0.35, 0.9 - state.time / 80);
  state.spawnTimer += dt;
  if (state.spawnTimer >= state.spawnInterval) {
    state.spawnTimer = 0;
    spawnComet();
  }

  const left = keys.has("ArrowLeft") || keys.has("a") || keys.has("A");
  const right = keys.has("ArrowRight") || keys.has("d") || keys.has("D");

  if (left) player.vx -= player.accel * dt;
  if (right) player.vx += player.accel * dt;

  if (!left && !right) player.vx *= 0.88;

  if (player.vx > player.max) player.vx = player.max;
  if (player.vx < -player.max) player.vx = -player.max;

  player.x += player.vx * dt;
  player.x = Math.max(player.w / 2 + 8, Math.min(W - player.w / 2 - 8, player.x));

  for (const s of stars) {
    s.y += s.s * dt * (0.6 + state.speed * 0.2);
    if (s.y > H + 10) {
      s.y = -10;
      s.x = Math.random() * W;
    }
  }

  for (let i = comets.length - 1; i >= 0; i -= 1) {
    const c = comets[i];
    c.y += c.s * dt;
    if (c.y - c.r > H + 40) comets.splice(i, 1);
    else if (hitTest(c)) {
      comets.splice(i, 1);
      state.lives -= 1;
      if (state.lives <= 0) {
        endGame();
      }
    }
  }

  updateHud();
}

function render() {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "#081124";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const c of comets) drawComet(c);
  drawShip();
}

let last = 0;
function loop(ts) {
  if (!state.running) return;
  const dt = Math.min(0.033, (ts - last) / 1000 || 0);
  last = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function startGame() {
  resetGame();
  state.running = true;
  overlay.style.display = "none";
  last = 0;
  requestAnimationFrame(loop);
}

function endGame() {
  state.running = false;
  state.best = Math.max(state.best, Math.floor(state.score));
  localStorage.setItem("comet-best", state.best);
  updateHud();
  overlay.innerHTML = `
    <div class="panel">
      <h1>Game Over</h1>
      <p>Score: ${Math.floor(state.score)}</p>
      <button id="restartBtn">Restart</button>
    </div>
  `;
  overlay.style.display = "grid";
  document.getElementById("restartBtn").addEventListener("click", () => {
    overlay.innerHTML = `
      <div class="panel">
        <h1>Comet Dodge</h1>
        <p>Move with A/D or arrow keys. Survive the comet storm.</p>
        <button id="startBtn">Start</button>
      </div>
    `;
    document.getElementById("startBtn").addEventListener("click", startGame);
  });
}

startBtn.addEventListener("click", startGame);
updateHud();
render();
