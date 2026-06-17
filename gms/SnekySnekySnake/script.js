/* ============================================================
   Snake — games/snake/assets/js/script.js
   ============================================================ */

/* ---------- Constants -------------------------------------- */
const COLS        = 20;
const ROWS        = 20;
const CELL        = 20;          // px per grid cell
const BASE_POINTS = 1;

const SPEEDS = { easy: 150, medium: 100, hard: 60 }; // ms per tick

/* ---------- Tier definitions ------------------------------- */
const TIERS = [
  { min: 400, emoji: '👑', name: 'Legendary Danger Noodle' },
  { min: 275, emoji: '🐲', name: 'Ssserpent Sovereign'       },
  { min: 175, emoji: '💎', name: 'Top of the Food Chain'     },
  { min: 100, emoji: '🔥', name: 'Sssensational!'            },
  { min:  50, emoji: '🎶', name: 'Snake Charmer'             },
  { min:  25, emoji: '🐍', name: 'Hiss-tory in the Making'   },
  { min:  10, emoji: '🐛', name: "Lil' Wriggler"             },
  { min:   0, emoji: '🥚', name: 'Just Hatched'              },
];

/* ---------- DOM refs --------------------------------------- */
const canvas        = document.getElementById('game-canvas');
const ctx           = canvas.getContext('2d');

const scoreEl       = document.getElementById('score');
const highScoreEl   = document.getElementById('high-score');
const levelEl       = document.getElementById('level');

const rankIcon      = document.getElementById('rank-icon');
const rankName      = document.getElementById('rank-name');
const rankBanner    = document.querySelector('.rank-banner');

const overlay       = document.getElementById('overlay');
const overlayIcon   = document.getElementById('overlay-icon');
const overlayTitle  = document.getElementById('overlay-title');
const overlayMsg    = document.getElementById('overlay-msg');
const overlayScore  = document.getElementById('overlay-score');
const btnStart      = document.getElementById('btn-start');

const diffBtns      = document.querySelectorAll('.diff-btn');
const tierItems     = document.querySelectorAll('.tier-item');

const lbBody        = document.getElementById('lb-body');
const btnClear      = document.getElementById('btn-clear');

/* ---------- State ------------------------------------------ */
let snake, dir, nextDir, food, score, multiplier, speed, loopId, running;

/* ---------- Difficulty ------------------------------------- */
let activeDiff = 'easy';

diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (running) return;           // lock during play
    diffBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeDiff  = btn.dataset.diff;
    multiplier  = parseInt(btn.dataset.mult, 10);
    speed       = SPEEDS[activeDiff];
    levelEl.textContent = btn.querySelector('span').textContent;
  });
});

/* ---------- Init state ------------------------------------- */
function initGame() {
  const activeBtn = document.querySelector('.diff-btn.active');
  multiplier  = parseInt(activeBtn.dataset.mult, 10);
  speed       = SPEEDS[activeDiff];

  snake   = [{ x: 10, y: 10 }];
  dir     = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score   = 0;
  running = false;

  updateScore(0);
  placeFood();
  draw();
}

/* ---------- Food ------------------------------------------- */
function placeFood() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  food = pos;
}

/* ---------- Score + Tier ----------------------------------- */
function updateScore(delta) {
  score += delta;
  scoreEl.textContent = score;

  // update high score display
  const stored = getLocalScores();
  const best   = stored.length ? stored[0].score : 0;
  highScoreEl.textContent = Math.max(score, best);

  // find current tier
  const tier = TIERS.find(t => score >= t.min);
  rankIcon.textContent = tier.emoji;
  rankName.textContent = tier.name;

  // highlight tier ladder
  tierItems.forEach(item => {
    const min = parseInt(item.dataset.min, 10);
    item.classList.toggle('active', min === tier.min);
  });

  // glow rank banner at high tiers
  rankBanner.classList.toggle('glow', tier.min >= 50);
}

/* ---------- Game Loop -------------------------------------- */
function startLoop() {
  if (loopId) clearTimeout(loopId);
  running = true;
  loopId  = setTimeout(tick, speed);
}

function tick() {
  // apply queued direction
  dir = { ...nextDir };

  // new head
  const head = {
    x: (snake[0].x + dir.x + COLS) % COLS,
    y: (snake[0].y + dir.y + ROWS) % ROWS,
  };

  // collision with self
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    endGame();
    return;
  }

  snake.unshift(head);

  // eat food?
  if (head.x === food.x && head.y === food.y) {
    updateScore(BASE_POINTS * multiplier);
    placeFood();
  } else {
    snake.pop();
  }

  draw();
  loopId = setTimeout(tick, speed);
}

/* ---------- Draw ------------------------------------------- */
function draw() {
  // background
  ctx.fillStyle = '#11141c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth   = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(canvas.width, y * CELL);
    ctx.stroke();
  }

  // snake body
  snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? '#5fffa0' : '#43e97b';
    ctx.shadowColor  = i === 0 ? '#43e97b' : 'transparent';
    ctx.shadowBlur   = i === 0 ? 10 : 0;
    ctx.beginPath();
    ctx.roundRect(
      seg.x * CELL + 1,
      seg.y * CELL + 1,
      CELL - 2,
      CELL - 2,
      4
    );
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  // food
  ctx.fillStyle   = '#ff4d6d';
  ctx.shadowColor = '#ff4d6d';
  ctx.shadowBlur  = 12;
  ctx.beginPath();
  ctx.arc(
    food.x * CELL + CELL / 2,
    food.y * CELL + CELL / 2,
    CELL / 2 - 2,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.shadowBlur = 0;
}

/* ---------- End Game --------------------------------------- */
function endGame() {
  running = false;
  clearTimeout(loopId);

  saveScore(score);

  overlayIcon.textContent  = '💀';
  overlayTitle.textContent = 'Game Over';
  overlayMsg.textContent   = 'You ran into yourself!';
  if (overlayScore) overlayScore.textContent = `Score: ${score}`;
  btnStart.textContent     = '▶ Play Again';
  overlay.classList.remove('hidden');

  renderLeaderboard();
}

/* ---------- Start ------------------------------------------ */
btnStart.addEventListener('click', () => {
  overlay.classList.add('hidden');
  initGame();
  startLoop();
});

/* ---------- Keyboard --------------------------------------- */
const KEY_MAP = {
  ArrowUp:    { x:  0, y: -1 },
  ArrowDown:  { x:  0, y:  1 },
  ArrowLeft:  { x: -1, y:  0 },
  ArrowRight: { x:  1, y:  0 },
  w:          { x:  0, y: -1 },
  s:          { x:  0, y:  1 },
  a:          { x: -1, y:  0 },
  d:          { x:  1, y:  0 },
};

document.addEventListener('keydown', e => {
  const newDir = KEY_MAP[e.key];
  if (!newDir) return;
  // prevent 180° reversal
  if (newDir.x === -dir.x && newDir.y === -dir.y) return;
  nextDir = newDir;
  e.preventDefault();
});

/* ---------- Local Leaderboard ------------------------------ */
const LS_KEY = 'snake_scores';

function getLocalScores() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}

function saveScore(s) {
  if (s === 0) return;
  const scores = getLocalScores();
  scores.push({ score: s, date: new Date().toLocaleDateString() });
  scores.sort((a, b) => b.score - a.score);
  scores.splice(5);                   // keep top 5
  localStorage.setItem(LS_KEY, JSON.stringify(scores));
}

function renderLeaderboard() {
  const scores = getLocalScores();
  if (!scores.length) {
    lbBody.innerHTML = '<tr><td colspan="3" style="color:#555;text-align:center">No scores yet</td></tr>';
    return;
  }
  lbBody.innerHTML = scores.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${s.score}</td>
      <td>${s.date}</td>
    </tr>`).join('');
}

btnClear.addEventListener('click', () => {
  localStorage.removeItem(LS_KEY);
  renderLeaderboard();
  highScoreEl.textContent = 0;
});

/* ---------- Boot ------------------------------------------- */
initGame();
renderLeaderboard();
