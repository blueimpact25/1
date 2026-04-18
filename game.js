const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");

const state = {
  running: false,
  score: 0,
  best: Number(localStorage.getItem("holo-flap-best") ?? 0),
  birdY: canvas.height * 0.4,
  birdV: 0,
  gravity: 0.34,
  lift: -6.2,
  pipes: [],
  pipeGap: 165,
  pipeWidth: 62,
  pipeSpeed: 2.4,
  frame: 0,
  collided: false,
};

bestEl.textContent = state.best;

function resetGame() {
  state.running = true;
  state.score = 0;
  state.birdY = canvas.height * 0.4;
  state.birdV = 0;
  state.pipes = [];
  state.frame = 0;
  state.collided = false;
  scoreEl.textContent = "0";
  overlay.classList.remove("show");
}

function spawnPipe() {
  const min = 90;
  const max = canvas.height - state.pipeGap - 120;
  const top = Math.floor(Math.random() * (max - min + 1) + min);
  state.pipes.push({ x: canvas.width + 20, top, passed: false });
}

function flap() {
  if (!state.running) {
    resetGame();
    return;
  }
  state.birdV = state.lift;
}

function endGame() {
  state.running = false;
  state.collided = true;
  state.best = Math.max(state.best, state.score);
  localStorage.setItem("holo-flap-best", String(state.best));
  bestEl.textContent = String(state.best);
  overlay.classList.add("show");
  startBtn.textContent = "再来一局";
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#2f2a76");
  grad.addColorStop(0.45, "#5f58ba");
  grad.addColorStop(1, "#8d79dc");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 30; i += 1) {
    const x = (i * 53 + state.frame * 0.16) % (canvas.width + 20);
    const y = (i * 97) % (canvas.height * 0.65);
    ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.8)" : "rgba(101,246,255,0.8)";
    ctx.beginPath();
    ctx.arc(x, y, i % 3 ? 1.2 : 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBird() {
  const birdX = canvas.width * 0.3;
  ctx.save();
  ctx.translate(birdX, state.birdY);
  ctx.rotate(Math.max(-0.35, Math.min(0.45, state.birdV / 8)));

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(0, 0, 19, 0, Math.PI * 2);
  ctx.fill();

  const wingY = Math.sin(state.frame * 0.35) * 5;
  ctx.fillStyle = "#ff8de8";
  ctx.beginPath();
  ctx.ellipse(-8, wingY, 9, 6, 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#65f6ff";
  ctx.beginPath();
  ctx.arc(6, -7, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2d225f";
  ctx.beginPath();
  ctx.arc(8, -6, 2.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffc85f";
  ctx.beginPath();
  ctx.moveTo(18, -2);
  ctx.lineTo(28, 0);
  ctx.lineTo(18, 5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawPipes() {
  state.pipes.forEach((pipe) => {
    const x = pipe.x;
    const top = pipe.top;
    const bottomY = top + state.pipeGap;

    ctx.fillStyle = "#73ffe2";
    ctx.fillRect(x, 0, state.pipeWidth, top);
    ctx.fillRect(x, bottomY, state.pipeWidth, canvas.height - bottomY);

    ctx.fillStyle = "#9ffff0";
    ctx.fillRect(x - 4, top - 16, state.pipeWidth + 8, 16);
    ctx.fillRect(x - 4, bottomY, state.pipeWidth + 8, 16);
  });
}

function update() {
  if (!state.running) return;

  state.frame += 1;
  state.birdV += state.gravity;
  state.birdY += state.birdV;

  if (state.frame % 95 === 0) spawnPipe();

  const birdX = canvas.width * 0.3;
  const birdR = 15;

  for (const pipe of state.pipes) {
    pipe.x -= state.pipeSpeed;

    if (!pipe.passed && pipe.x + state.pipeWidth < birdX) {
      pipe.passed = true;
      state.score += 1;
      scoreEl.textContent = String(state.score);
    }

    const hitX = birdX + birdR > pipe.x && birdX - birdR < pipe.x + state.pipeWidth;
    const hitY = state.birdY - birdR < pipe.top || state.birdY + birdR > pipe.top + state.pipeGap;

    if (hitX && hitY) {
      endGame();
      return;
    }
  }

  state.pipes = state.pipes.filter((pipe) => pipe.x + state.pipeWidth > -20);

  if (state.birdY > canvas.height - 20 || state.birdY < 20) {
    endGame();
  }
}

function render() {
  drawBackground();
  drawPipes();
  drawBird();

  if (!state.running && state.collided) {
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  requestAnimationFrame(loop);
}

function loop() {
  update();
  render();
}

startBtn.addEventListener("click", resetGame);
canvas.addEventListener("touchstart", (event) => {
  event.preventDefault();
  flap();
});
canvas.addEventListener("mousedown", flap);
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    flap();
  }
});

requestAnimationFrame(loop);
