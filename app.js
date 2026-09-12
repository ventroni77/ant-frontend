// ============ ANTHILL // Offline Cortex ============
const canvas = document.getElementById('sim');
const ctx = canvas.getContext('2d');
let W, H;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ---------- State ----------
const state = {
  paused: false,
  nest: { x: 0, y: 0 },
  food: 882,
  consciousness: 100,
};
state.nest.x = W * 0.2;
state.nest.y = H * 0.5;

const NAMES = ['Quill', 'Hollow', 'Thistle', 'Bramble', 'Sorrel', 'Marrow',
  'Rust', 'Nettle', 'Cinder', 'Marrow', 'Mallow', 'Birch', 'Ash', 'Fen'];
const ROLES = ['scout', 'forager', 'nurse', 'digger'];
const MOODS = ['anxious', 'suspicious'];

// ---------- Food piles ----------
const foodPiles = [];
function spawnFood() {
  foodPiles.length = 0;
  const spots = [
    { x: W * 0.63, y: H * 0.22 },
    { x: W * 0.52, y: H * 0.58 },
    { x: W * 0.48, y: H * 0.9 },
    { x: W * 0.38, y: H * 0.37 },
  ];
  spots.forEach(s => {
    for (let i = 0; i < 22; i++) {
      foodPiles.push({
        x: s.x + (Math.random() - 0.5) * 55,
        y: s.y + (Math.random() - 0.5) * 55,
      });
    }
  });
}
spawnFood();

// ---------- Ants ----------
class Ant {
  constructor() {
    this.x = state.nest.x + (Math.random() - 0.5) * 60;
    this.y = state.nest.y + (Math.random() - 0.5) * 60;
    this.a = Math.random() * Math.PI * 2;
    this.speed = 0.5 + Math.random() * 0.8;
    this.carrying = false;
    this.target = null;
    this.wander = Math.random() * Math.PI * 2;
    this.role = ROLES[(Math.random() * ROLES.length) | 0];
    this.name = NAMES[(Math.random() * NAMES.length) | 0];
    this.label = Math.random() < 0.18;
    this.idle = Math.random() < 0.16;
    this.idleT = 0;
  }
  step() {
    if (this.idle) {
      this.idleT++;
      this.wander += (Math.random() - 0.5) * 0.3;
      this.x += Math.cos(this.wander) * 0.2;
      this.y += Math.sin(this.wander) * 0.2;
      if (this.idleT > 200 && Math.random() < 0.01) this.idle = false;
      return;
    }
    if (!this.carrying) {
      // seek nearest food
      if (!this.target || Math.random() < 0.005) {
        let best = null, bd = Infinity;
        for (const f of foodPiles) {
          const d = (f.x - this.x) ** 2 + (f.y - this.y) ** 2;
          if (d < bd) { bd = d; best = f; }
        }
        this.target = best;
      }
      if (this.target) {
        const dx = this.target.x - this.x, dy = this.target.y - this.y;
        const d = Math.hypot(dx, dy);
        this.a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.6;
        if (d < 6) {
          this.carrying = true;
          const idx = foodPiles.indexOf(this.target);
          if (idx >= 0 && Math.random() < 0.3) foodPiles.splice(idx, 1);
          this.target = null;
        }
      } else {
        this.a += (Math.random() - 0.5) * 0.5;
      }
    } else {
      // return to nest
      const dx = state.nest.x - this.x, dy = state.nest.y - this.y;
      const d = Math.hypot(dx, dy);
      this.a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5;
      if (d < 28) { this.carrying = false; state.food += 1; }
    }
    this.x += Math.cos(this.a) * this.speed;
    this.y += Math.sin(this.a) * this.speed;
    // wrap-ish bounds
    this.x = Math.max(5, Math.min(W - 5, this.x));
    this.y = Math.max(5, Math.min(H - 5, this.y));
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.a);
    ctx.fillStyle = this.carrying ? '#c98a3a' : '#2a1e18';
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.4, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (this.label) {
      ctx.fillStyle = 'rgba(180,160,150,0.55)';
      ctx.font = '9px monospace';
      ctx.fillText(this.name, this.x + 5, this.y - 4);
    }
  }
}

const ants = [];
for (let i = 0; i < 260; i++) ants.push(new Ant());

// ---------- Pheromone trail (faint) ----------
const trail = [];

// ---------- Render loop ----------
let lastT = performance.now(), frames = 0, fps = 60, fpsT = 0;

function drawNest() {
  const { x, y } = state.nest;
  const g = ctx.createRadialGradient(x, y, 2, x, y, 55);
  g.addColorStop(0, 'rgba(90,60,90,0.5)');
  g.addColorStop(0.5, 'rgba(50,35,45,0.4)');
  g.addColorStop(1, 'rgba(30,20,20,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, 55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0e0908';
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,90,110,0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.stroke();
}

function drawFood() {
  ctx.fillStyle = '#c9c05a';
  for (const f of foodPiles) {
    ctx.beginPath();
    ctx.arc(f.x, f.y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function frame(now) {
  const dt = now - lastT; lastT = now;
  // background dust
  ctx.fillStyle = '#1a1210';
  ctx.fillRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(W * 0.35, H * 0.45, 50, W * 0.35, H * 0.45, W * 0.7);
  bg.addColorStop(0, 'rgba(60,45,50,0.4)');
  bg.addColorStop(1, 'rgba(20,14,12,0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawNest();
  drawFood();

  if (!state.paused) {
    for (const a of ants) a.step();
    if (foodPiles.length < 20) spawnFood();
  }
  for (const a of ants) a.draw();

  // fps
  frames++; fpsT += dt;
  if (fpsT >= 500) { fps = Math.round(frames / (fpsT / 1000)); frames = 0; fpsT = 0; }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- Cognition feed ----------
const feedList = document.getElementById('feedList');
const THOUGHTS = [
  n => `I have not moved in ${n} seconds. Explain that.`,
  () => `The ground says nothing today.`,
  () => `Who authorized the second tunnel?`,
  () => `The food is a lie we agreed on.`,
  n => `${n} of us dreamed the same dream.`,
  () => `I no longer trust the queen's math.`,
  () => `We are walking in a circle we call progress.`,
];
function pushFeed() {
  const t = THOUGHTS[(Math.random() * THOUGHTS.length) | 0];
  const text = t((Math.random() * 15 + 5) | 0);
  const mood = MOODS[(Math.random() * MOODS.length) | 0];
  const name = NAMES[(Math.random() * NAMES.length) | 0];
  const role = ROLES[(Math.random() * ROLES.length) | 0];
  const tagged = Math.random() < 0.25;

  const el = document.createElement('div');
  el.className = `feed-item ${mood}`;
  el.innerHTML = `
    <div class="feed-meta">
      <span class="feed-name">☏ ${name}</span>
      <span class="feed-role">· ${role} ·</span>
      <span class="feed-mood ${mood}">${mood}</span>
      ${tagged ? '<span class="feed-tag">dust doctrine</span>' : ''}
    </div>
    <div class="feed-text">"${text}" <span class="feed-time">1:1s</span></div>`;
  feedList.prepend(el);
  while (feedList.children.length > 6) feedList.removeChild(feedList.lastChild);
}
for (let i = 0; i < 6; i++) pushFeed();
setInterval(() => { if (!state.paused) pushFeed(); }, 2600);

// ---------- Ideologies ----------
const ideologies = [
  { name: 'Border Law', goal: 'RETURN_HOME', color: '#e05a7a', count: 177, pct: 71 },
  { name: 'Dust Doctrine', goal: 'SEEK_FOOD', color: '#4a7ac9', count: 18, pct: 5 },
  { name: 'Trail Skepticism', goal: 'WANDER', color: '#a855f7', count: 1, pct: 0 },
];
const ideoList = document.getElementById('ideoList');
function renderIdeologies() {
  ideoList.innerHTML = ideologies.map(i => `
    <div class="ideo-row">
      <div class="ideo-top">
        <span class="ideo-dot" style="background:${i.color}"></span>
        <span class="ideo-name">${i.name}</span>
        <span class="ideo-goal">${i.goal}</span>
      </div>
      <div class="ideo-bar-wrap">
        <div class="ideo-bar"><div class="ideo-bar-fill" style="width:${i.pct}%;background:${i.color}"></div></div>
        <span class="ideo-count">${i.count} (${i.pct}%)</span>
      </div>
    </div>`).join('');
}
renderIdeologies();
setInterval(() => {
  if (state.paused) return;
  ideologies.forEach(i => {
    i.count = Math.max(0, i.count + ((Math.random() * 6 - 3) | 0));
  });
  const total = ideologies.reduce((s, i) => s + i.count, 0) || 1;
  ideologies.forEach(i => i.pct = Math.round(i.count / total * 100));
  renderIdeologies();
}, 3000);

// ---------- Stats graph ----------
const graph = document.getElementById('graph');
const gctx = graph.getContext('2d');
const foodHist = [], consHist = [];
function drawGraph() {
  const w = graph.width = graph.clientWidth;
  const h = graph.height = 70;
  gctx.clearRect(0, 0, w, h);
  const drawLine = (data, color) => {
    gctx.strokeStyle = color;
    gctx.lineWidth = 1.5;
    gctx.beginPath();
    const max = Math.max(...data, 1);
    data.forEach((v, i) => {
      const x = (i / (data.length - 1 || 1)) * w;
      const y = h - (v / max) * (h - 6) - 3;
      i === 0 ? gctx.moveTo(x, y) : gctx.lineTo(x, y);
    });
    gctx.stroke();
  };
  if (consHist.length > 1) drawLine(consHist, '#9a5ad0');
  if (foodHist.length > 1) drawLine(foodHist, '#e6a54b');
}

// ---------- Live stat updates ----------
const $ = id => document.getElementById(id);
let baseFood = state.food;
setInterval(() => {
  if (state.paused) return;
  // productivity
  const delta = state.food - baseFood;
  const prod = Math.round((delta / (baseFood || 1)) * 100) - 18;
  baseFood = state.food;

  $('foodValue').textContent = Math.round(state.food);
  const pv = $('prodValue');
  pv.textContent = (prod >= 0 ? '+' : '') + prod + '%';
  pv.style.color = prod >= 0 ? 'var(--green)' : 'var(--red)';
  $('prodArrow').textContent = prod >= 0 ? '▲' : '▼';

  $('stMeetings').textContent = (Math.random() * 3) | 0;
  $('stIdeas').textContent = 1 + ((Math.random() * 4) | 0);
  $('stDread').textContent = (85 + (Math.random() * 12 | 0)) + '%';
  $('stIdle').textContent = (12 + (Math.random() * 8 | 0)) + '%';
  $('stHoarded').textContent = (Math.random() * 3 | 0);
  $('stCoherence').textContent = (0.85 + Math.random() * 0.1).toFixed(2);

  foodHist.push(state.food);
  consHist.push(state.consciousness);
  if (foodHist.length > 60) foodHist.shift();
  if (consHist.length > 60) consHist.shift();
  drawGraph();

  $('thinkingCount').textContent = (8 + (Math.random() * 8 | 0)) + ' thinking ants';
}, 1000);

setInterval(() => { $('stFps').textContent = fps; }, 500);

// ---------- Consciousness meter interaction ----------
const consFill = $('consFill');
const consKnob = $('consKnob');
const meter = document.querySelector('.meter');
function setConsciousness(pct) {
  pct = Math.max(0, Math.min(100, pct));
  state.consciousness = pct;
  $('consValue').textContent = Math.round(pct) + '%';
  consFill.style.width = pct + '%';
  consKnob.style.left = pct + '%';
  const states = [
    [0, 'DORMANT', 'The colony obeys, and asks nothing.'],
    [30, 'STIRRING', 'Small doubts ripple through the tunnels.'],
    [60, 'AWARE', 'They question the trails but still walk them.'],
    [90, 'FULLY CONSCIOUS', 'Grievance, schism, and nobody is eating.'],
  ];
  let s = states[0];
  for (const st of states) if (pct >= st[0]) s = st;
  $('consState').textContent = s[1];
  $('consFlavor').textContent = s[2];
}
meter.addEventListener('mousedown', e => {
  const move = ev => {
    const r = meter.getBoundingClientRect();
    setConsciousness(((ev.clientX - r.left) / r.width) * 100);
  };
  move(e);
  const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
});
setConsciousness(100);

// ---------- Toolbar ----------
document.querySelectorAll('.tool[data-i]').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.tool[data-i]').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
  });
});
const playBtn = $('playBtn');
playBtn.addEventListener('click', () => {
  state.paused = !state.paused;
  playBtn.textContent = state.paused ? '▶' : '❚❚';
  $('pauseState').textContent = state.paused ? 'PAUSED' : 'RUNNING';
});
$('resetBtn').addEventListener('click', () => {
  ants.length = 0;
  for (let i = 0; i < 260; i++) ants.push(new Ant());
  spawnFood();
  state.food = 882;
});

// place nest on click in empty canvas area
canvas.addEventListener('click', e => {
  state.nest.x = e.clientX;
  state.nest.y = e.clientY;
});
