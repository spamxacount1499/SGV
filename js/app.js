// ─── STATE ───────────────────────────────────────────────────────────────────
const state = {
  likes: new Set(),
  saves: new Set(),
  hotScores: {},
  rateHistory: [],
  wyrScores: { left: 0, right: 0 },
};

// ─── UTILS ───────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const imgSrc = filename => `imgs/${filename}`;

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
function hasPhotos() { return PHOTOS && PHOTOS.length > 0; }

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

// ─── MOOD BOARD ──────────────────────────────────────────────────────────────
function renderGrid() {
  const grid = $('grid');
  grid.innerHTML = '';

  if (!hasPhotos()) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="big">✦</div>
        <p>No photos yet</p>
        <small>Add filenames to js/data.js and upload images to the imgs/ folder</small>
      </div>`;
    return;
  }

  PHOTOS.forEach(filename => {
    const liked = state.likes.has(filename);
    const saved = state.saves.has(filename);
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <img src="${imgSrc(filename)}" alt="" loading="lazy">
      <div class="ctop">
        <button class="icon-btn ${liked ? 'liked' : ''}" data-action="like" data-key="${filename}" title="Like">♡</button>
        <button class="icon-btn ${saved ? 'saved' : ''}" data-action="save" data-key="${filename}" title="Save">◈</button>
      </div>
      <div class="cbot">
        <div class="cname">${filename.replace(/\.[^.]+$/, '')}</div>
      </div>`;
    div.addEventListener('click', e => {
      if (e.target.dataset.action) return;
      openModal(filename);
    });
    div.querySelectorAll('.icon-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (btn.dataset.action === 'like') toggleLike(filename);
        else toggleSave(filename);
      });
    });
    grid.appendChild(div);
  });
}

// ─── LIKE / SAVE ─────────────────────────────────────────────────────────────
function toggleLike(key) {
  if (state.likes.has(key)) state.likes.delete(key);
  else { state.likes.add(key); toast('♡ Liked'); }
  updateStats();
  renderGrid();
}
function toggleSave(key) {
  if (state.saves.has(key)) { state.saves.delete(key); toast('Unsaved'); }
  else { state.saves.add(key); toast('◈ Saved'); }
  updateStats();
  $('savedCount').textContent = state.saves.size || '';
  renderGrid();
  renderSaved();
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function openModal(filename) {
  const liked = state.likes.has(filename);
  const saved = state.saves.has(filename);
  $('modalImg').src = imgSrc(filename);
  $('modalFilename').textContent = filename.replace(/\.[^.]+$/, '');
  const likeBtn = $('modalLike');
  const saveBtn = $('modalSave');
  likeBtn.className = 'modal-btn' + (liked ? ' active-like' : '');
  likeBtn.textContent = liked ? '♡ Liked' : '♡ Like';
  saveBtn.className = 'modal-btn' + (saved ? ' active-save' : '');
  saveBtn.textContent = saved ? '◈ Saved' : '◈ Save';
  likeBtn.onclick = () => { toggleLike(filename); openModal(filename); };
  saveBtn.onclick = () => { toggleSave(filename); openModal(filename); };
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
    wrap.innerHTML = '<div class="saved-empty">No saved looks yet. Start heart-ing your faves ◈</div>';
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'grid';
  [...state.saves].forEach(filename => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <img src="${imgSrc(filename)}" alt="" loading="lazy">
      <div class="ctop">
        <button class="icon-btn saved" data-key="${filename}" title="Unsave">◈</button>
      </div>
      <div class="cbot">
        <div class="cname">${filename.replace(/\.[^.]+$/, '')}</div>
      </div>`;
    div.addEventListener('click', e => { if (e.target.dataset.key) return; openModal(filename); });
    div.querySelector('.icon-btn').addEventListener('click', e => {
      e.stopPropagation(); toggleSave(filename);
    });
    grid.appendChild(div);
  });
  wrap.innerHTML = '';
  wrap.appendChild(grid);
}

// ─── STATS ───────────────────────────────────────────────────────────────────
function updateStats() {
  $('statPhotos').textContent = hasPhotos() ? PHOTOS.length : 0;
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

function noPhotosMsg() {
  return `<div class="game-no-photos">Add photos to play ✦</div>`;
}

// ─── WOULD YOU RATHER ────────────────────────────────────────────────────────
let wyrPair = [];
const WYR_QUOTES = [
  'Bold choice 👑', 'She\'s eating 🔥', 'That drip hits different',
  'No contest tbh', 'Main character behaviour', 'The girlies agree',
  'Zero competition', 'She ate and left no crumbs', 'Era-defining', 'Iconic ✦'
];

function newWyrPair() {
  if (!hasPhotos() || PHOTOS.length < 2) {
    $('wyrLeft').innerHTML = noPhotosMsg();
    $('wyrRight').innerHTML = '';
    return;
  }
  const s = shuffle(PHOTOS);
  wyrPair = [s[0], s[1]];
  $('wyrLeft').innerHTML = `<img src="${imgSrc(wyrPair[0])}" alt=""><div class="wyr-label">${wyrPair[0].replace(/\.[^.]+$/, '')}</div>`;
  $('wyrRight').innerHTML = `<img src="${imgSrc(wyrPair[1])}" alt=""><div class="wyr-label">${wyrPair[1].replace(/\.[^.]+$/, '')}</div>`;
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
  if (!hasPhotos()) { $('honImg').src = ''; return; }
  if (honQueue.length === 0) honQueue = shuffle(PHOTOS);
  honCurrent = honQueue.pop();
  $('honImg').src = imgSrc(honCurrent);
  $('honOverlay').className = 'hon-overlay';
  $('honOverlay').textContent = '';
}

function honVote(isHot) {
  if (!honCurrent) return;
  if (!state.hotScores[honCurrent]) state.hotScores[honCurrent] = { hot: 0, not: 0 };
  if (isHot) state.hotScores[honCurrent].hot++;
  else state.hotScores[honCurrent].not++;
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
  if (scored.length === 0) { $('honLeaderboard').innerHTML = ''; return; }
  $('honLeaderboard').innerHTML = `<div class="hon-podium-title">🔥 Hottest Looks</div>` +
    scored.map((x, i) => `
      <div class="hon-row">
        <div class="hon-rank">${i + 1}</div>
        <img class="hon-thumb" src="${imgSrc(x.key)}" alt="">
        <div class="hon-info">
          <div class="hon-info-name">${x.key.replace(/\.[^.]+$/, '')}</div>
          <div class="hon-info-score">${Math.round(x.pct)}% hot · ${x.total} votes</div>
          <div class="hon-bar" style="width:${x.pct}%"></div>
        </div>
      </div>`).join('');
}

$('honHot').addEventListener('click', () => honVote(true));
$('honNot').addEventListener('click', () => honVote(false));

// ─── RATE THE FIT ─────────────────────────────────────────────────────────────
let rtfQueue = [];
let rtfCurrent = null;
let rtfSelected = 0;
const RTF_VERDICTS = ['', '💀 Brutal', '😬 Meh', '✨ Cute', '🔥 Fire', '👑 ICONIC'];

function rtfNext() {
  if (!hasPhotos()) { $('rtfImg').src = ''; return; }
  if (rtfQueue.length === 0) rtfQueue = shuffle(PHOTOS);
  rtfCurrent = rtfQueue.pop();
  $('rtfImg').src = imgSrc(rtfCurrent);
  rtfSelected = 0;
  $('rtfVerdict').textContent = '';
  document.querySelectorAll('.star').forEach(s => s.classList.remove('on'));
}

function rtfRate(n) {
  rtfSelected = n;
  document.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('on', i < n));
  $('rtfVerdict').textContent = RTF_VERDICTS[n];
  if (rtfCurrent) {
    state.rateHistory.unshift({ key: rtfCurrent, stars: n });
    if (state.rateHistory.length > 20) state.rateHistory.pop();
    renderRtfHistory();
    setTimeout(rtfNext, 900);
  }
}

function renderRtfHistory() {
  $('rtfHistory').innerHTML = state.rateHistory.map(r => `
    <div class="rtf-history-row">
      <img class="rtf-history-thumb" src="${imgSrc(r.key)}" alt="">
      <span class="rtf-history-name">${r.key.replace(/\.[^.]+$/, '')}</span>
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
let spinAngle = 0;
let spinVelocity = 0;
let spinAnimId = null;
let WHEEL_PHOTOS = [];

function initWheel() {
  WHEEL_PHOTOS = hasPhotos() ? shuffle(PHOTOS).slice(0, 8) : [];
  drawWheel(0);
}

function drawWheel(angle) {
  const canvas = $('spinWheel');
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const r = cx - 4;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (WHEEL_PHOTOS.length === 0) {
    ctx.fillStyle = 'rgba(244,167,185,0.1)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#6b3a47';
    ctx.font = '14px Cormorant Garamond, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Add photos to spin', cx, cy);
    return;
  }

  const n = WHEEL_PHOTOS.length;
  const arc = (2 * Math.PI) / n;
  WHEEL_PHOTOS.forEach((_, i) => {
    const start = angle + i * arc;
    const end = start + arc;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
    ctx.fill();
    ctx.strokeStyle = '#f4a7b9';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + arc / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f4a7b9';
    ctx.font = '10px Cormorant Garamond, serif';
    ctx.fillText(WHEEL_PHOTOS[i].replace(/\.[^.]+$/, '').slice(0, 12), r - 8, 4);
    ctx.restore();
  });
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
  ctx.fillStyle = '#d4af37';
  ctx.fill();
  ctx.fillStyle = '#0a0406';
  ctx.font = 'bold 9px serif';
  ctx.textAlign = 'center';
  ctx.fillText('SGG', cx, cy + 3);
}

function spinWheel() {
  if (spinAnimId || WHEEL_PHOTOS.length === 0) return;
  spinVelocity = 0.18 + Math.random() * 0.25;
  $('spinBtn').disabled = true;
  $('spinResult').classList.remove('show');
  function frame() {
    spinAngle += spinVelocity;
    spinVelocity *= 0.988;
    drawWheel(spinAngle);
    if (spinVelocity > 0.002) {
      spinAnimId = requestAnimationFrame(frame);
    } else {
      spinAnimId = null;
      $('spinBtn').disabled = false;
      showSpinResult();
    }
  }
  spinAnimId = requestAnimationFrame(frame);
}

function showSpinResult() {
  const n = WHEEL_PHOTOS.length;
  const arc = (2 * Math.PI) / n;
  const norm = ((Math.PI - spinAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const idx = Math.floor(norm / arc) % n;
  const filename = WHEEL_PHOTOS[idx];
  $('spinResultImg').src = imgSrc(filename);
  $('spinResultName').textContent = filename.replace(/\.[^.]+$/, '');
  $('spinResult').classList.add('show');
}

$('spinBtn').addEventListener('click', spinWheel);

// ─── INIT ────────────────────────────────────────────────────────────────────
renderGrid();
renderSaved();
newWyrPair();
honNext();
rtfNext();
initWheel();
updateStats();
showTab('moodboard');
