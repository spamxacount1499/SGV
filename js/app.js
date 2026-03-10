// ─── STATE ───────────────────────────────────────────────────────────────────
const state = {
  likes: new Set(),
  saves: new Set(),
  hotScores: {},
  rateHistory: [],
  wyrScores: { left: 0, right: 0 },
  modelFilter: 'All',
};

// ─── UTILS ───────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2000);
}
function filteredPhotos() {
  return state.modelFilter === 'All'
    ? PHOTOS
    : PHOTOS.filter(p => p.model === state.modelFilter);
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
function showTab(id) {
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('nav button[data-tab]').forEach(b => b.classList.remove('on'));
  $(id).classList.add('on');
  const btn = document.querySelector(`nav button[data-tab="${id}"]`);
  if (btn) btn.classList.add('on');
}
document.querySelectorAll('nav button[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => showTab(btn.dataset.tab));
});

// ─── MODEL TABS ──────────────────────────────────────────────────────────────
function buildModelTabs() {
  const wrap = $('modelTabs');
  const models = ['All', ...Object.keys(MODELS)];
  wrap.innerHTML = '';
  models.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'model-tab' + (m === 'All' ? ' on' : '');
    const count = m === 'All' ? PHOTOS.length : (MODELS[m] ? MODELS[m].length : 0);
    btn.innerHTML = `${m} <span class="model-count">${count}</span>`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.model-tab').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      state.modelFilter = m;
      renderGrid();
      updateStats();
    });
    wrap.appendChild(btn);
  });
}

// ─── GRID ────────────────────────────────────────────────────────────────────
function renderGrid() {
  const grid = $('grid');
  const photos = filteredPhotos();
  grid.innerHTML = '';

  if (!photos.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="big">✦</div>
        <p>No photos yet</p>
        <small>Upload images to imgs/${state.modelFilter === 'All' ? 'ModelName' : state.modelFilter}/ and add filenames to data.js</small>
      </div>`;
    return;
  }

  photos.forEach(photo => {
    const liked = state.likes.has(photo.src);
    const saved = state.saves.has(photo.src);
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <img src="${photo.src}" alt="${photo.name}" loading="lazy">
      <div class="ctop">
        <button class="icon-btn ${liked ? 'liked' : ''}" data-action="like" title="Like">♡</button>
        <button class="icon-btn ${saved ? 'saved' : ''}" data-action="save" title="Save">◈</button>
      </div>
      <div class="cbot">
        <div class="cmodel">${photo.model}</div>
        <div class="cname">${photo.name}</div>
      </div>`;
    div.addEventListener('click', e => {
      if (e.target.dataset.action) return;
      openModal(photo);
    });
    div.querySelectorAll('.icon-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (btn.dataset.action === 'like') toggleLike(photo);
        else toggleSave(photo);
      });
    });
    grid.appendChild(div);
  });
}

// ─── LIKE / SAVE ─────────────────────────────────────────────────────────────
function toggleLike(photo) {
  if (state.likes.has(photo.src)) state.likes.delete(photo.src);
  else { state.likes.add(photo.src); toast('♡ Liked'); }
  updateStats();
  renderGrid();
}
function toggleSave(photo) {
  if (state.saves.has(photo.src)) { state.saves.delete(photo.src); toast('Unsaved'); }
  else { state.saves.add(photo.src); toast('◈ Saved'); }
  updateStats();
  $('savedCount').textContent = state.saves.size || '';
  renderGrid();
  renderSaved();
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function openModal(photo) {
  const liked = state.likes.has(photo.src);
  const saved = state.saves.has(photo.src);
  $('modalImg').src = photo.src;
  $('modalName').textContent = photo.name;
  $('modalModel').textContent = photo.model;
  const likeBtn = $('modalLike');
  const saveBtn = $('modalSave');
  likeBtn.className = 'modal-btn' + (liked ? ' active-like' : '');
  likeBtn.textContent = liked ? '♡ Liked' : '♡ Like';
  saveBtn.className = 'modal-btn' + (saved ? ' active-save' : '');
  saveBtn.textContent = saved ? '◈ Saved' : '◈ Save';
  likeBtn.onclick = () => { toggleLike(photo); openModal(photo); };
  saveBtn.onclick = () => { toggleSave(photo); openModal(photo); };
  $('modalOverlay').classList.add('open');
}
$('modalOverlay').addEventListener('click', e => {
  if (e.target === $('modalOverlay')) closeModal();
});
$('modalClose').addEventListener('click', closeModal);
function closeModal() { $('modalOverlay').classList.remove('open'); }

// ─── SAVED TAB ───────────────────────────────────────────────────────────────
function renderSaved() {
  const wrap = $('savedGrid');
  if (state.saves.size === 0) {
    wrap.innerHTML = '<div class="saved-empty">No saved looks yet ◈</div>';
    return;
  }
  const saved = PHOTOS.filter(p => state.saves.has(p.src));
  const grid = document.createElement('div');
  grid.className = 'grid';
  saved.forEach(photo => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <img src="${photo.src}" alt="${photo.name}" loading="lazy">
      <div class="ctop">
        <button class="icon-btn saved" title="Unsave">◈</button>
      </div>
      <div class="cbot">
        <div class="cmodel">${photo.model}</div>
        <div class="cname">${photo.name}</div>
      </div>`;
    div.addEventListener('click', e => { if (e.target.closest('.icon-btn')) return; openModal(photo); });
    div.querySelector('.icon-btn').addEventListener('click', e => {
      e.stopPropagation(); toggleSave(photo);
    });
    grid.appendChild(div);
  });
  wrap.innerHTML = '';
  wrap.appendChild(grid);
}

// ─── STATS ───────────────────────────────────────────────────────────────────
function updateStats() {
  const photos = filteredPhotos();
  $('statPhotos').textContent = photos.length;
  $('statLikes').textContent = state.likes.size;
  $('statSaves').textContent = state.saves.size;
}

// ─── GAME TABS ───────────────────────────────────────────────────────────────
document.querySelectorAll('.game-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.game-tab').forEach(b => b.classList.remove('on'));
    document.querySelectorAll('.game-pane').forEach(p => p.classList.remove('on'));
    btn.classList.add('on');
    $(btn.dataset.pane).classList.add('on');
  });
});

// ─── WOULD YOU RATHER ────────────────────────────────────────────────────────
let wyrPair = [];
const WYR_QUOTES = [
  'Bold choice 👑', 'She\'s eating 🔥', 'That drip hits different',
  'No contest tbh', 'Main character behaviour', 'The girlies agree',
  'Zero competition', 'She ate and left no crumbs', 'Era-defining', 'Iconic ✦'
];

function newWyrPair() {
  if (PHOTOS.length < 2) {
    $('wyrLeft').innerHTML = '<div style="padding:20px;color:var(--muted)">Add photos to play</div>';
    $('wyrRight').innerHTML = '';
    return;
  }
  const s = shuffle(PHOTOS);
  wyrPair = [s[0], s[1]];
  $('wyrLeft').innerHTML = `<img src="${wyrPair[0].src}" alt=""><div class="wyr-label">${wyrPair[0].name}</div>`;
  $('wyrRight').innerHTML = `<img src="${wyrPair[1].src}" alt=""><div class="wyr-label">${wyrPair[1].name}</div>`;
  $('wyrLeft').className = 'wyr-card';
  $('wyrRight').className = 'wyr-card';
  $('wyrReaction').textContent = '';
}

function wyrVote(side) {
  if (wyrPair.length < 2) return;
  $('wyrLeft').className = 'wyr-card ' + (side === 'left' ? 'winner' : 'loser');
  $('wyrRight').className = 'wyr-card ' + (side === 'right' ? 'winner' : 'loser');
  state.wyrScores[side]++;
  $('wyrReaction').textContent = rand(WYR_QUOTES);
  $('wyrScoreL').textContent = state.wyrScores.left;
  $('wyrScoreR').textContent = state.wyrScores.right;
}

$('wyrLeft').addEventListener('click', () => wyrVote('left'));
$('wyrRight').addEventListener('click', () => wyrVote('right'));
$('wyrNext').addEventListener('click', newWyrPair);

// ─── HOT OR NOT ──────────────────────────────────────────────────────────────
let honQueue = [];
let honCurrent = null;

function honNext() {
  if (!PHOTOS.length) { $('honImg').src = ''; return; }
  if (honQueue.length === 0) honQueue = shuffle(PHOTOS);
  honCurrent = honQueue.pop();
  $('honImg').src = honCurrent.src;
  $('honOverlay').className = 'hon-overlay';
  $('honOverlay').textContent = '';
}

function honVote(isHot) {
  if (!honCurrent) return;
  const key = honCurrent.src;
  if (!state.hotScores[key]) state.hotScores[key] = { hot: 0, not: 0 };
  if (isHot) state.hotScores[key].hot++;
  else state.hotScores[key].not++;
  $('honOverlay').className = 'hon-overlay ' + (isHot ? 'hot' : 'not') + ' show';
  $('honOverlay').textContent = isHot ? '🔥 HOT' : '❌ NOT';
  setTimeout(() => { honNext(); renderHonLeaderboard(); }, 700);
}

function renderHonLeaderboard() {
  const scored = Object.entries(state.hotScores)
    .map(([key, s]) => ({ key, pct: s.hot / (s.hot + s.not) * 100, total: s.hot + s.not }))
    .filter(x => x.total > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);
  if (!scored.length) { $('honLeaderboard').innerHTML = ''; return; }
  $('honLeaderboard').innerHTML = `<div class="hon-podium-title">🔥 Hottest Looks</div>` +
    scored.map((x, i) => {
      const photo = PHOTOS.find(p => p.src === x.key);
      return `<div class="hon-row">
        <div class="hon-rank">${i + 1}</div>
        <img class="hon-thumb" src="${x.key}" alt="">
        <div class="hon-info">
          <div class="hon-info-name">${photo ? photo.name : ''} · ${photo ? photo.model : ''}</div>
          <div class="hon-info-score">${Math.round(x.pct)}% hot · ${x.total} votes</div>
          <div class="hon-bar" style="width:${x.pct}%"></div>
        </div>
      </div>`;
    }).join('');
}

$('honHot').addEventListener('click', () => honVote(true));
$('honNot').addEventListener('click', () => honVote(false));

// ─── RATE THE FIT ─────────────────────────────────────────────────────────────
let rtfQueue = [];
let rtfCurrent = null;
let rtfSelected = 0;
const RTF_VERDICTS = ['', '💀 Brutal', '😬 Meh', '✨ Cute', '🔥 Fire', '👑 ICONIC'];

function rtfNext() {
  if (!PHOTOS.length) { $('rtfImg').src = ''; return; }
  if (rtfQueue.length === 0) rtfQueue = shuffle(PHOTOS);
  rtfCurrent = rtfQueue.pop();
  $('rtfImg').src = rtfCurrent.src;
  rtfSelected = 0;
  $('rtfVerdict').textContent = '';
  document.querySelectorAll('.star').forEach(s => s.classList.remove('on'));
}

function rtfRate(n) {
  rtfSelected = n;
  document.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('on', i < n));
  $('rtfVerdict').textContent = RTF_VERDICTS[n];
  if (rtfCurrent) {
    state.rateHistory.unshift({ photo: rtfCurrent, stars: n });
    if (state.rateHistory.length > 20) state.rateHistory.pop();
    renderRtfHistory();
    setTimeout(rtfNext, 900);
  }
}

function renderRtfHistory() {
  $('rtfHistory').innerHTML = state.rateHistory.map(r => `
    <div class="rtf-history-row">
      <img class="rtf-history-thumb" src="${r.photo.src}" alt="">
      <span class="rtf-history-name">${r.photo.name} · ${r.photo.model}</span>
      <span class="rtf-history-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span>
    </div>`).join('');
}

document.querySelectorAll('.star').forEach((s, i) => {
  s.addEventListener('click', () => rtfRate(i + 1));
  s.addEventListener('mouseenter', () => {
    document.querySelectorAll('.star').forEach((ss, j) => ss.classList.toggle('on', j <= i));
  });
});
document.querySelector('.rtf-stars').addEventListener('mouseleave', () => {
  document.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('on', i < rtfSelected));
});

// ─── SPIN WHEEL ──────────────────────────────────────────────────────────────
const WHEEL_COLORS = ['#3d0a18','#5a1228','#2a0d1e','#4a1020','#1e0810','#3a0e16','#2e0a14','#4e1224'];
let spinAngle = 0, spinVelocity = 0, spinAnimId = null;
let WHEEL_PHOTOS = [];

function initWheel() {
  WHEEL_PHOTOS = PHOTOS.length ? shuffle(PHOTOS).slice(0, 8) : [];
  drawWheel(0);
}

function drawWheel(angle) {
  const canvas = $('spinWheel');
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 4;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!WHEEL_PHOTOS.length) {
    ctx.fillStyle = 'rgba(244,167,185,0.1)';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#6b3a47'; ctx.font = '14px serif'; ctx.textAlign = 'center';
    ctx.fillText('Add photos to spin', cx, cy);
    return;
  }
  const n = WHEEL_PHOTOS.length, arc = (2 * Math.PI) / n;
  WHEEL_PHOTOS.forEach((p, i) => {
    const start = angle + i * arc, end = start + arc;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.closePath();
    ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length]; ctx.fill();
    ctx.strokeStyle = '#f4a7b9'; ctx.lineWidth = 1; ctx.stroke();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(start + arc / 2);
    ctx.textAlign = 'right'; ctx.fillStyle = '#f4a7b9';
    ctx.font = '10px Cormorant Garamond, serif';
    ctx.fillText(p.name.slice(0, 12), r - 8, 4); ctx.restore();
  });
  ctx.beginPath(); ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
  ctx.fillStyle = '#d4af37'; ctx.fill();
  ctx.fillStyle = '#0a0406'; ctx.font = 'bold 9px serif'; ctx.textAlign = 'center';
  ctx.fillText('SGG', cx, cy + 3);
}

function spinWheel() {
  if (spinAnimId || !WHEEL_PHOTOS.length) return;
  spinVelocity = 0.18 + Math.random() * 0.25;
  $('spinBtn').disabled = true;
  $('spinResult').classList.remove('show');
  function frame() {
    spinAngle += spinVelocity; spinVelocity *= 0.988; drawWheel(spinAngle);
    if (spinVelocity > 0.002) { spinAnimId = requestAnimationFrame(frame); }
    else { spinAnimId = null; $('spinBtn').disabled = false; showSpinResult(); }
  }
  spinAnimId = requestAnimationFrame(frame);
}

function showSpinResult() {
  const n = WHEEL_PHOTOS.length, arc = (2 * Math.PI) / n;
  const norm = ((Math.PI - spinAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const photo = WHEEL_PHOTOS[Math.floor(norm / arc) % n];
  $('spinResultImg').src = photo.src;
  $('spinResultName').textContent = `${photo.name} · ${photo.model}`;
  $('spinResult').classList.add('show');
}

$('spinBtn').addEventListener('click', spinWheel);

// ─── INIT ────────────────────────────────────────────────────────────────────
buildModelTabs();
renderGrid();
renderSaved();
newWyrPair();
honNext();
rtfNext();
initWheel();
updateStats();
showTab('moodboard');
