// ─── STATE ───────────────────────────────────────────────────────────────────
const state = {
  likes: new Set(), saves: new Set(),
  hotScores: {}, rateHistory: [],
  wyrScores: { left: 0, right: 0 },
  modelFilter: 'All',
  secretUnlocked: false,
  secretModelFilter: 'All',
  dangerScores: {}, // src -> total score
  sHotScores: {},
  confessions: [],
  sConfessions: [],
  cinemaPhotos: [], cinemaIndex: 0,
  bracketState: null,
  tierState: {},
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
  const el = $('toast'); el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2000);
}
function filteredPhotos() {
  return state.modelFilter === 'All' ? PHOTOS : PHOTOS.filter(p => p.model === state.modelFilter);
}
function filteredSecretPhotos() {
  return state.secretModelFilter === 'All' ? SECRET_PHOTOS : SECRET_PHOTOS.filter(p => p.model === state.secretModelFilter);
}
function addDangerScore(src, points) {
  state.dangerScores[src] = (state.dangerScores[src] || 0) + points;
  updateDangerMeter();
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

// ─── SECRET ENTRY ────────────────────────────────────────────────────────────
let logoClicks = 0, logoTimer = null;
$('logoBtn').addEventListener('click', () => {
  logoClicks++;
  clearTimeout(logoTimer);
  logoTimer = setTimeout(() => { logoClicks = 0; }, 600);
  if (logoClicks >= 3) { logoClicks = 0; openPasswordPrompt(); }
});
function openPasswordPrompt() {
  $('pwInput').value = ''; $('pwError').textContent = '';
  $('pwOverlay').classList.add('open');
  setTimeout(() => $('pwInput').focus(), 100);
}
$('pwBtn').addEventListener('click', checkPassword);
$('pwInput').addEventListener('keydown', e => { if (e.key === 'Enter') checkPassword(); });
$('pwCancel').addEventListener('click', () => $('pwOverlay').classList.remove('open'));
function checkPassword() {
  if ($('pwInput').value === 'SchoolGirls') {
    $('pwOverlay').classList.remove('open');
    openVault();
  } else {
    $('pwError').textContent = 'Wrong password';
    $('pwInput').value = ''; $('pwInput').focus();
  }
}

// ─── VAULT OPEN / SPOTLIGHT ──────────────────────────────────────────────────
function openVault() {
  state.secretUnlocked = true;
  $('secretWrap').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.body.classList.add('vault-open');
  // show spotlight
  if (SECRET_PHOTOS.length) {
    const featured = rand(SECRET_PHOTOS);
    $('spotlightImg').src = featured.src;
    $('spotlightName').textContent = featured.name;
    $('spotlightModel').textContent = featured.model;
    $('vaultSpotlight').style.display = 'flex';
    $('vaultMain').style.display = 'none';
  } else {
    $('vaultSpotlight').style.display = 'none';
    $('vaultMain').style.display = 'flex';
    initVaultContent();
  }
}
$('spotlightEnter').addEventListener('click', () => {
  $('vaultSpotlight').style.display = 'none';
  $('vaultMain').style.display = 'flex';
  initVaultContent();
});
function initVaultContent() {
  renderSecretGrid();
  updateSecretSidebarCounts();
  sHonNext(); sRtfNext(); newSwyrPair(); initSWheel();
  updateDangerMeter(); updateSDangerMeter();
  buildTierList(); buildBracket();
  updateMostWanted();
  buildQuiz(false); buildQuiz(true);
  renderSConfessions();
  buildFmk(true);
  todNext();
  buildDraft();
}
$('secretExit').addEventListener('click', () => {
  $('secretWrap').classList.remove('open');
  document.body.style.overflow = '';
  document.body.classList.remove('vault-open');
  setVaultCursor(false);
});

// ─── VAULT SIDEBAR ───────────────────────────────────────────────────────────
function updateSecretSidebarCounts() {
  ['All','Nya','Remi','Stella','Allie','Rileigh','Macy'].forEach(m => {
    const el = $('scount'+m);
    if (el) el.textContent = m === 'All' ? SECRET_PHOTOS.length : (SECRET_MODELS[m]?.length || 0);
  });
}
document.querySelectorAll('.secret-model-btn[data-smodel]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.secret-model-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    state.secretModelFilter = btn.dataset.smodel;
    document.querySelectorAll('.secret-section').forEach(s => s.classList.remove('on'));
    $('sgallery').classList.add('on');
    renderSecretGrid();
  });
});
document.querySelectorAll('.secret-model-btn[data-ssection]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.secret-model-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    document.querySelectorAll('.secret-section').forEach(s => s.classList.remove('on'));
    $(btn.dataset.ssection).classList.add('on');
    if (btn.dataset.ssection === 'smostwanted') updateMostWanted();
  });
});
document.querySelectorAll('#sgames .game-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#sgames .game-tab').forEach(b => b.classList.remove('on'));
    document.querySelectorAll('#sgames .game-pane').forEach(p => p.classList.remove('on'));
    btn.classList.add('on'); $(btn.dataset.pane).classList.add('on');
  });
});

// ─── MODEL TABS ──────────────────────────────────────────────────────────────
function buildModelTabs() {
  const wrap = $('modelTabs');
  ['All', ...Object.keys(MODELS)].forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'model-tab' + (m === 'All' ? ' on' : '');
    const count = m === 'All' ? PHOTOS.length : (MODELS[m]?.length || 0);
    btn.innerHTML = `${m} <span class="model-count">${count}</span>`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.model-tab').forEach(b => b.classList.remove('on'));
      btn.classList.add('on'); state.modelFilter = m; renderGrid(); updateStats();
    });
    wrap.appendChild(btn);
  });
}

// ─── PUBLIC GRID ─────────────────────────────────────────────────────────────
function renderGrid() {
  const grid = $('grid'), photos = filteredPhotos();
  grid.innerHTML = '';
  if (!photos.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="big">✦</div><p>No photos yet</p><small>Upload to imgs/ModelName/ and add to data.js</small></div>`;
    return;
  }
  photos.forEach(photo => {
    const liked = state.likes.has(photo.src), saved = state.saves.has(photo.src);
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<img src="${photo.src}" alt="${photo.name}" loading="lazy">
      <div class="shine"></div>
      <div class="card-num">${String(grid.children.length + 1).padStart(2,'0')}</div>
      <div class="ctop">
        <button class="icon-btn ${liked?'liked':''}" data-action="like" title="Like">♡</button>
        <button class="icon-btn ${saved?'saved':''}" data-action="save" title="Save">◈</button>
      </div>
      <div class="cbot"><div class="cmodel">${photo.model}</div><div class="cname">${photo.name}</div></div>`;
    div.addEventListener('click', e => { if (e.target.dataset.action) return; openModal(photo); });
    div.querySelectorAll('.icon-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); btn.dataset.action==='like'?toggleLike(photo):toggleSave(photo); });
    });
    grid.appendChild(div);
  });
}

// ─── SECRET GRID ─────────────────────────────────────────────────────────────
function renderSecretGrid() {
  const grid = $('secretGrid'), photos = filteredSecretPhotos();
  grid.innerHTML = '';
  if (!photos.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;color:#8a3030"><div class="big" style="color:#ff2222;opacity:0.3">✦</div><p style="color:#8a3030">No photos yet</p><small style="color:#5a2020">Upload to imgs/Secret/ModelName/</small></div>`;
    return;
  }
  photos.forEach(photo => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<img src="${photo.src}" alt="${photo.name}" loading="lazy">
      <div class="shine"></div>
      <div class="cbot"><div class="cmodel" style="color:#ff4444">${photo.model}</div><div class="cname">${photo.name}</div></div>`;
    div.addEventListener('click', () => openModal(photo, true));
    grid.appendChild(div);
  });
}

// ─── LIKE / SAVE ─────────────────────────────────────────────────────────────
function toggleLike(photo) {
  if (state.likes.has(photo.src)) state.likes.delete(photo.src);
  else { state.likes.add(photo.src); toast('♡ Liked'); addDangerScore(photo.src, 5); }
  updateStats(); renderGrid();
}
function toggleSave(photo) {
  if (state.saves.has(photo.src)) { state.saves.delete(photo.src); toast('Unsaved'); }
  else { state.saves.add(photo.src); toast('◈ Saved'); addDangerScore(photo.src, 8); }
  updateStats(); $('savedCount').textContent = state.saves.size||''; renderGrid(); renderSaved();
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function openModal(photo, isSecret=false) {
  const liked=state.likes.has(photo.src), saved=state.saves.has(photo.src);
  $('modalImg').src=photo.src; $('modalName').textContent=photo.name;
  $('modalModel').textContent=photo.model; $('modalModel').style.color=isSecret?'#ff4444':'';
  const lb=$('modalLike'), sb=$('modalSave');
  lb.className='modal-btn'+(liked?' active-like':''); lb.textContent=liked?'♡ Liked':'♡ Like';
  sb.className='modal-btn'+(saved?' active-save':''); sb.textContent=saved?'◈ Saved':'◈ Save';
  lb.onclick=()=>{toggleLike(photo);openModal(photo,isSecret);};
  sb.onclick=()=>{toggleSave(photo);openModal(photo,isSecret);};
  $('modalOverlay').classList.add('open');
}
$('modalOverlay').addEventListener('click', e=>{if(e.target===$('modalOverlay'))closeModal();});
$('modalClose').addEventListener('click', closeModal);
function closeModal(){$('modalOverlay').classList.remove('open');}

// ─── SAVED ───────────────────────────────────────────────────────────────────
function renderSaved() {
  const wrap=$('savedGrid');
  if(!state.saves.size){wrap.innerHTML='<div class="saved-empty">No saved looks yet ◈</div>';return;}
  const all=[...PHOTOS,...SECRET_PHOTOS], saved=all.filter(p=>state.saves.has(p.src));
  const grid=document.createElement('div'); grid.className='grid';
  saved.forEach(photo=>{
    const div=document.createElement('div'); div.className='card';
    div.innerHTML=`<img src="${photo.src}" alt="${photo.name}" loading="lazy">
      <div class="ctop"><button class="icon-btn saved" title="Unsave">◈</button></div>
      <div class="cbot"><div class="cmodel">${photo.model}</div><div class="cname">${photo.name}</div></div>`;
    div.addEventListener('click',e=>{if(e.target.closest('.icon-btn'))return;openModal(photo);});
    div.querySelector('.icon-btn').addEventListener('click',e=>{e.stopPropagation();toggleSave(photo);});
    grid.appendChild(div);
  });
  wrap.innerHTML=''; wrap.appendChild(grid);
}
function updateStats() {
  $('statPhotos').textContent=filteredPhotos().length;
  $('statLikes').textContent=state.likes.size;
  $('statSaves').textContent=state.saves.size;
  // most dangerous public
  const top=getTopDanger(PHOTOS,1);
  $('statDanger').textContent=top.length?top[0].photo.name.split(' ')[0]:'—';
}

// ─── DANGER METER ─────────────────────────────────────────────────────────────
function getTopDanger(photos, limit=10) {
  return photos.map(p=>({photo:p,score:state.dangerScores[p.src]||0}))
    .filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,limit);
}
function renderDangerList(el, photos, isVault=false) {
  const top=getTopDanger(photos);
  if(!top.length){el.innerHTML=`<div style="text-align:center;padding:40px;color:${isVault?'#8a3030':'var(--muted)'};font-family:'Cormorant Garamond',serif;font-size:18px;font-style:italic">Play games to build the danger meter</div>`;return;}
  const maxScore=top[0].score;
  el.innerHTML=top.map((x,i)=>`
    <div class="danger-row">
      <div class="danger-rank ${i<3?'top':''}">${i+1}</div>
      <img class="danger-thumb" src="${x.photo.src}" alt="">
      <div class="danger-info">
        <div class="danger-model">${x.photo.model}</div>
        <div class="danger-name">${x.photo.name}</div>
        <div class="danger-bar-wrap"><div class="danger-bar-fill" style="width:${(x.score/maxScore*100).toFixed(0)}%"></div></div>
      </div>
      <div class="danger-score">${x.score}</div>
    </div>`).join('');
}
function updateDangerMeter(){if($('dangerMeter'))renderDangerList($('dangerMeter'),PHOTOS,false);}
function updateSDangerMeter(){if($('sDangerMeter'))renderDangerList($('sDangerMeter'),SECRET_PHOTOS,true);}

// ─── GAME TABS (public) ──────────────────────────────────────────────────────
document.querySelectorAll('#games .game-tab').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('#games .game-tab').forEach(b=>b.classList.remove('on'));
    document.querySelectorAll('#games .game-pane').forEach(p=>p.classList.remove('on'));
    btn.classList.add('on'); $(btn.dataset.pane).classList.add('on');
    if(btn.dataset.pane==='paneDanger') updateDangerMeter();
  });
});

// ─── WYR ─────────────────────────────────────────────────────────────────────
let wyrPair=[];
const WYR_QUOTES=['Bro that\'s not even close 🔥','She\'d ruin your life and you\'d thank her','Zero competition, zero mercy','That body is not fair','You already know who you\'re picking','That look hits different at 2am','She woke up like this and it\'s illegal','Main character, no contest','Your boys would never let you live this down','That\'s wife material and you know it 👑'];
function newWyrPair(){
  if(PHOTOS.length<2){$('wyrLeft').innerHTML='<div style="padding:20px;color:var(--muted)">Add photos</div>';$('wyrRight').innerHTML='';return;}
  const s=shuffle(PHOTOS);wyrPair=[s[0],s[1]];
  $('wyrLeft').innerHTML=`<img src="${wyrPair[0].src}" alt=""><div class="wyr-label">${wyrPair[0].name}</div>`;
  $('wyrRight').innerHTML=`<img src="${wyrPair[1].src}" alt=""><div class="wyr-label">${wyrPair[1].name}</div>`;
  $('wyrLeft').className='wyr-card';$('wyrRight').className='wyr-card';$('wyrReaction').textContent='';
}
function wyrVote(side){
  if(wyrPair.length<2)return;
  $('wyrLeft').className='wyr-card '+(side==='left'?'winner':'loser');
  $('wyrRight').className='wyr-card '+(side==='right'?'winner':'loser');
  const winner=side==='left'?wyrPair[0]:wyrPair[1];
  addDangerScore(winner.src,10);
  $('wyrReaction').textContent=rand(WYR_QUOTES);
  $('wyrScoreL').textContent=side==='left'?parseInt($('wyrScoreL').textContent)+1:$('wyrScoreL').textContent;
  $('wyrScoreR').textContent=side==='right'?parseInt($('wyrScoreR').textContent)+1:$('wyrScoreR').textContent;
}
$('wyrLeft').addEventListener('click',()=>wyrVote('left'));
$('wyrRight').addEventListener('click',()=>wyrVote('right'));
$('wyrNext').addEventListener('click',newWyrPair);

// ─── HON (public) ────────────────────────────────────────────────────────────
let honQueue=[],honCurrent=null;
function honNext(){
  if(!PHOTOS.length){$('honImg').src='';return;}
  if(!honQueue.length)honQueue=shuffle(PHOTOS);
  honCurrent=honQueue.pop();$('honImg').src=honCurrent.src;
  $('honOverlay').className='hon-overlay';$('honOverlay').textContent='';
}
function honVote(isHot){
  if(!honCurrent)return;
  if(!state.hotScores[honCurrent.src])state.hotScores[honCurrent.src]={hot:0,not:0};
  if(isHot){state.hotScores[honCurrent.src].hot++;addDangerScore(honCurrent.src,7);}
  else state.hotScores[honCurrent.src].not++;
  $('honOverlay').className='hon-overlay '+(isHot?'hot':'not')+' show';
  $('honOverlay').textContent=isHot?'🔥 HOT':'❌ NOT';
  setTimeout(()=>{honNext();renderHonLeaderboard();},700);
}
function renderHonLeaderboard(){
  const scored=Object.entries(state.hotScores).map(([key,s])=>({key,pct:s.hot/(s.hot+s.not)*100,total:s.hot+s.not})).filter(x=>x.total>0).sort((a,b)=>b.pct-a.pct).slice(0,5);
  if(!scored.length){$('honLeaderboard').innerHTML='';return;}
  $('honLeaderboard').innerHTML=`<div class="hon-podium-title">🔥 Hottest</div>`+scored.map((x,i)=>{
    const p=PHOTOS.find(p=>p.src===x.key);
    return `<div class="hon-row"><div class="hon-rank">${i+1}</div><img class="hon-thumb" src="${x.key}" alt=""><div class="hon-info"><div class="hon-info-name">${p?p.name:''}</div><div class="hon-info-score">${Math.round(x.pct)}% hot · ${x.total} votes</div><div class="hon-bar" style="width:${x.pct}%"></div></div></div>`;
  }).join('');
}
$('honHot').addEventListener('click',()=>honVote(true));
$('honNot').addEventListener('click',()=>honVote(false));

// ─── RTF (public) ────────────────────────────────────────────────────────────
let rtfQueue=[],rtfCurrent=null,rtfSelected=0;
const RTF_VERDICTS=['','💀 Not it','😬 Mid, she tried','🔥 She\'s dangerous','👀 Would not survive','👑 MARRY HER'];
function rtfNext(){
  if(!PHOTOS.length){$('rtfImg').src='';return;}
  if(!rtfQueue.length)rtfQueue=shuffle(PHOTOS);
  rtfCurrent=rtfQueue.pop();$('rtfImg').src=rtfCurrent.src;
  rtfSelected=0;$('rtfVerdict').textContent='';
  document.querySelectorAll('#paneRtf .star').forEach(s=>s.classList.remove('on'));
}
function rtfRate(n){
  rtfSelected=n;
  document.querySelectorAll('#paneRtf .star').forEach((s,i)=>s.classList.toggle('on',i<n));
  $('rtfVerdict').textContent=RTF_VERDICTS[n];
  if(rtfCurrent){addDangerScore(rtfCurrent.src,n*2);setTimeout(rtfNext,900);}
}
document.querySelectorAll('#paneRtf .star').forEach((s,i)=>{
  s.addEventListener('click',()=>rtfRate(i+1));
  s.addEventListener('mouseenter',()=>document.querySelectorAll('#paneRtf .star').forEach((ss,j)=>ss.classList.toggle('on',j<=i)));
});
document.querySelector('#paneRtf .rtf-stars').addEventListener('mouseleave',()=>document.querySelectorAll('#paneRtf .star').forEach((s,i)=>s.classList.toggle('on',i<rtfSelected)));

// ─── SPIN (public) ───────────────────────────────────────────────────────────
const WC=['#3d0a18','#5a1228','#2a0d1e','#4a1020','#1e0810','#3a0e16','#2e0a14','#4e1224'];
let spinAngle=0,spinVelocity=0,spinAnimId=null,WHEEL_PHOTOS=[];
function initWheel(){WHEEL_PHOTOS=PHOTOS.length?shuffle(PHOTOS).slice(0,8):[];drawWheel(0);}
function drawWheel(angle){
  const cv=$('spinWheel'),ctx=cv.getContext('2d'),cx=cv.width/2,cy=cv.height/2,r=cx-4;
  ctx.clearRect(0,0,cv.width,cv.height);
  if(!WHEEL_PHOTOS.length){ctx.fillStyle='rgba(244,167,185,0.1)';ctx.beginPath();ctx.arc(cx,cy,r,0,2*Math.PI);ctx.fill();return;}
  const n=WHEEL_PHOTOS.length,arc=(2*Math.PI)/n;
  WHEEL_PHOTOS.forEach((p,i)=>{const s=angle+i*arc,e=s+arc;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,s,e);ctx.closePath();ctx.fillStyle=WC[i%WC.length];ctx.fill();ctx.strokeStyle='#f4a7b9';ctx.lineWidth=1;ctx.stroke();ctx.save();ctx.translate(cx,cy);ctx.rotate(s+arc/2);ctx.textAlign='right';ctx.fillStyle='#f4a7b9';ctx.font='10px serif';ctx.fillText(p.name.slice(0,10),r-8,4);ctx.restore();});
  ctx.beginPath();ctx.arc(cx,cy,18,0,2*Math.PI);ctx.fillStyle='#d4af37';ctx.fill();ctx.fillStyle='#000';ctx.font='bold 8px serif';ctx.textAlign='center';ctx.fillText('SGG',cx,cy+3);
}
function doSpin(velId,angleVar,canvasId,resultId,imgId,nameId,photos,colors){
  let vel=0.18+Math.random()*0.25,ang=0,animId=null;
  $(velId)&&($(velId).disabled=true);
  $(resultId).classList.remove('show');
  function frame(){ang+=vel;vel*=0.988;drawWheelOn(canvasId,ang,photos,colors);if(vel>0.002){animId=requestAnimationFrame(frame);}else{$(velId)&&($(velId).disabled=false);const n=photos.length,arc=(2*Math.PI)/n,norm=((Math.PI-ang)%(2*Math.PI)+2*Math.PI)%(2*Math.PI),photo=photos[Math.floor(norm/arc)%n];$(imgId).src=photo.src;$(nameId).textContent=`${photo.name} · ${photo.model}`;$(resultId).classList.add('show');}}
  animId=requestAnimationFrame(frame);
}
function drawWheelOn(id,angle,photos,colors){
  const cv=$(id);if(!cv)return;const ctx=cv.getContext('2d'),cx=cv.width/2,cy=cv.height/2,r=cx-4;
  ctx.clearRect(0,0,cv.width,cv.height);
  if(!photos.length)return;
  const n=photos.length,arc=(2*Math.PI)/n;
  photos.forEach((p,i)=>{const s=angle+i*arc,e=s+arc;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,s,e);ctx.closePath();ctx.fillStyle=colors[i%colors.length];ctx.fill();ctx.strokeStyle=colors===SWC?'#ff2222':'#f4a7b9';ctx.lineWidth=1;ctx.stroke();ctx.save();ctx.translate(cx,cy);ctx.rotate(s+arc/2);ctx.textAlign='right';ctx.fillStyle=colors===SWC?'#ff6666':'#f4a7b9';ctx.font='10px serif';ctx.fillText(p.name.slice(0,10),r-8,4);ctx.restore();});
  ctx.beginPath();ctx.arc(cx,cy,18,0,2*Math.PI);ctx.fillStyle=colors===SWC?'#ff2222':'#d4af37';ctx.fill();ctx.fillStyle='#000';ctx.font='bold 8px serif';ctx.textAlign='center';ctx.fillText(colors===SWC?'VAULT':'SGG',cx,cy+3);
}
$('spinBtn').addEventListener('click',()=>{if(!WHEEL_PHOTOS.length)return;doSpin('spinBtn','sa','spinWheel','spinResult','spinResultImg','spinResultName',WHEEL_PHOTOS,WC);});

// ─── CONFESSIONS ─────────────────────────────────────────────────────────────
function addConfession(text, wallId, arr, isVault=false) {
  if(!text.trim()) return;
  const now = new Date();
  const time = now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  arr.unshift({text, time});
  renderConfessionWall(wallId, arr, isVault);
}
function renderConfessionWall(wallId, arr, isVault=false) {
  const wall=$(wallId);
  if(!wall) return;
  if(!arr.length){wall.innerHTML=`<div style="text-align:center;padding:40px;font-family:'Cormorant Garamond',serif;font-size:18px;font-style:italic;color:${isVault?'#8a3030':'var(--muted)'}">No confessions yet. Say something.</div>`;return;}
  wall.innerHTML=arr.slice(0,50).map(c=>`
    <div class="confession-card ${isVault?'vault-confession':''}">
      ${c.text}
      <div class="confession-time">Anonymous · ${c.time}</div>
    </div>`).join('');
}
$('confessionSubmit').addEventListener('click',()=>{
  const input=$('confessionInput');
  addConfession(input.value,'confessionWall',state.confessions,false);
  input.value='';
});
$('confessionInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.ctrlKey){addConfession($('confessionInput').value,'confessionWall',state.confessions,false);$('confessionInput').value='';}});
function renderSConfessions(){renderConfessionWall('sConfessionWall',state.sConfessions,true);}

// ─── QUIZ ─────────────────────────────────────────────────────────────────────
const PUBLIC_QUIZ = [
  {q:"First thing you notice on a girl:", opts:[["Face and eyes","face"],["Body, obviously","body"],["How she carries herself","vibe"],["The way she looks at you","eyes"]]},
  {q:"Your ideal girl's style:", opts:[["Sundress and messy hair","soft"],["Tight everything, no apologies","baddie"],["Bikini body, beach all day","beach"],["Oversized fits, still looks incredible","cozy"]]},
  {q:"She texts you at 11pm. She says:", opts:[["\"come over\"","baddie"],["\"wanna watch a movie?\"","cozy"],["\"beach tomorrow?\"","beach"],["\"thinking about you\"","soft"]]},
  {q:"Dream date:", opts:[["Rooftop dinner, she dresses up","baddie"],["Beach sunset, barely dressed","beach"],["Netflix, she steals your hoodie","cozy"],["Park picnic, she looks effortless","soft"]]},
  {q:"Your type in one word:", opts:[["Sweet","soft"],["Dangerous","baddie"],["Carefree","beach"],["Comfortable","cozy"]]},
];
const PUBLIC_RESULTS = {
  soft:{name:"The Sweet One",desc:"You're a sucker for the girl-next-door. Soft smiles, effortless looks, and she doesn't even know how hot she is. That's your weakness and you know it."},
  baddie:{name:"The Baddie",desc:"You want the one who walks in and owns the room. Dressed up, confident, and slightly out of your league. You love the challenge."},
  beach:{name:"The Beach Babe",desc:"Sun, skin, and salt water. You want the girl who looks best in the least amount of clothing. No complaints here."},
  cozy:{name:"The Comfortable Danger",desc:"The most underrated type. She looks incredible doing nothing. Stolen hoodies and lazy Sundays — somehow the sexiest thing imaginable."},
};
const VAULT_QUIZ = [
  {q:"She walks in. What are you looking at:", opts:[["Eyes first, everything second","eye"],["Body. Not sorry.","body"],["The way she moves","vibe"],["Her mouth","mouth"]]},
  {q:"Ideal situation:", opts:[["Hotel room, just the two of you","hotel"],["Pool at midnight","pool"],["Her place, lights low","bed"],["Back seat, middle of nowhere","wild"]]},
  {q:"She's wearing:", opts:[["White. Just white.","soft"],["Red bikini, nothing else","danger"],["Your shirt and nothing else","bed"],["All black, wants to be taken seriously","mystery"]]},
  {q:"She leans over and says:", opts:[["\"I've been thinking about you all day\"","soft"],["\"You can't handle me\"","danger"],["\"Everyone's asleep\"","wild"],["\"I don't do this with just anyone\"","mystery"]]},
  {q:"After, you:", opts:[["Stay. Obviously.","soft"],["Can't stop thinking about her","danger"],["Tell your boys nothing. This one's yours.","mystery"],["Do it again","wild"]]},
];
const VAULT_RESULTS = {
  eye:{name:"Eye Contact Destroyer",desc:"She doesn't have to say anything. One look and you're gone. You want the girl who knows exactly what she's doing to you and does it anyway."},
  body:{name:"Honest Man",desc:"No games, no pretense. You know what you want, you go after it, and you don't apologize. Respect."},
  vibe:{name:"Vibe Addict",desc:"It's not just looks — it's the whole package. The way she moves, talks, exists. You're the hardest one to impress and the best one to have."},
  mouth:{name:"Trouble Seeker",desc:"You want the one who says the wrong things in the best way. That mouth is going to get you both in serious trouble."},
  hotel:{name:"Luxury Threat",desc:"You want it cinematic. Silk, gold light, someone who matches the room. You have taste and it costs you every time."},
  pool:{name:"Midnight Only",desc:"Your best stories start at midnight and end when the sun comes up. You don't do boring and boring doesn't find you."},
  bed:{name:"Private Collection",desc:"The best things never leave the room. You keep the good ones secret and the secrets even better."},
  wild:{name:"No Rules",desc:"Unplanned, unpredictable, unforgettable. You're the reason she has a story she'll never tell anyone."},
  soft:{name:"Soft Destruction",desc:"Looks harmless. Completely ruins you. You fall for the sweet ones every time and they do the most damage. You're not learning your lesson."},
  danger:{name:"Red Flag Hunter",desc:"You saw the signs. You ignored them. You'd do it again tomorrow. Some men are built different."},
  mystery:{name:"The Obsession Type",desc:"You want the one you can't fully read. She gives you just enough to keep you up at night. That's the most dangerous kind."},
};

function buildQuiz(isVault=false) {
  const containerId = isVault ? 'squizContainer' : 'quizContainer';
  const el = $(containerId); if(!el) return;
  const questions = isVault ? VAULT_QUIZ : PUBLIC_QUIZ;
  let current=0, scores={};
  function render() {
    if(current >= questions.length) { showResult(); return; }
    const q = questions[current];
    el.className = isVault ? 'vault-quiz' : '';
    el.innerHTML = `
      <div class="quiz-progress">Question ${current+1} of ${questions.length}</div>
      <div class="quiz-question">${q.q}</div>
      <div class="quiz-options">
        ${q.opts.map(([label,key])=>`<button class="quiz-option" data-key="${key}">${label}</button>`).join('')}
      </div>`;
    el.querySelectorAll('.quiz-option').forEach(btn=>{
      btn.addEventListener('click',()=>{
        scores[btn.dataset.key]=(scores[btn.dataset.key]||0)+1;
        current++; render();
      });
    });
  }
  function showResult() {
    const top=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0];
    const result = isVault ? VAULT_RESULTS[top] : PUBLIC_RESULTS[top];
    const photos = isVault ? SECRET_PHOTOS : PHOTOS;
    const img = photos.length ? rand(photos).src : '';
    el.innerHTML = `<div class="quiz-result ${isVault?'vault-quiz':''}">
      ${img?`<img class="quiz-result-img" src="${img}" alt="">`:''}
      <div class="quiz-result-title">${result.name}</div>
      <div class="quiz-result-desc">${result.desc}</div>
      <button class="quiz-retry" onclick="this.closest('.quiz-result').parentElement.innerHTML='';buildQuiz(${isVault})">Try Again ↺</button>
    </div>`;
  }
  render();
}

// ─── CINEMA MODE ─────────────────────────────────────────────────────────────
$('vaultCinemaBtn').addEventListener('click', openCinema);
function openCinema() {
  if(!SECRET_PHOTOS.length) return;
  state.cinemaPhotos = shuffle(SECRET_PHOTOS);
  state.cinemaIndex = 0;
  updateCinema();
  $('cinemaOverlay').classList.add('open');
}
function updateCinema() {
  const photo = state.cinemaPhotos[state.cinemaIndex];
  $('cinemaImg').src = photo.src;
  $('cinemaName').textContent = photo.name;
  $('cinemaModel').textContent = photo.model;
}
$('cinemaClose').addEventListener('click', ()=>$('cinemaOverlay').classList.remove('open'));
$('cinemaPrev').addEventListener('click', ()=>{state.cinemaIndex=(state.cinemaIndex-1+state.cinemaPhotos.length)%state.cinemaPhotos.length;updateCinema();});
$('cinemaNext').addEventListener('click', ()=>{state.cinemaIndex=(state.cinemaIndex+1)%state.cinemaPhotos.length;updateCinema();});
document.addEventListener('keydown', e=>{
  if(!$('cinemaOverlay').classList.contains('open')) return;
  if(e.key==='ArrowLeft') $('cinemaPrev').click();
  if(e.key==='ArrowRight') $('cinemaNext').click();
  if(e.key==='Escape') $('cinemaClose').click();
});

// ─── TIER LIST ───────────────────────────────────────────────────────────────
function buildTierList() {
  const board=$('tierBoard'), pool=$('tierPool');
  if(!board||!pool) return;
  const tiers=['S','A','B','C','D'];
  board.innerHTML=tiers.map(t=>`
    <div class="tier-row">
      <div class="tier-label ${t.toLowerCase()}">${t}</div>
      <div class="tier-drop" data-tier="${t}" id="tierDrop${t}"></div>
    </div>`).join('');
  pool.innerHTML='';
  // populate pool
  const photos = SECRET_PHOTOS.length ? SECRET_PHOTOS : PHOTOS;
  shuffle(photos).forEach(photo=>{
    const img=document.createElement('img');
    img.className='tier-item'; img.src=photo.src; img.alt=photo.name;
    img.title=photo.name; img.draggable=true;
    img.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',photo.src);img.classList.add('dragging');});
    img.addEventListener('dragend',()=>img.classList.remove('dragging'));
    pool.appendChild(img);
  });
  // make drop zones
  [...document.querySelectorAll('.tier-drop'), pool].forEach(zone=>{
    zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag-over');});
    zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));
    zone.addEventListener('drop',e=>{
      e.preventDefault(); zone.classList.remove('drag-over');
      const src=e.dataTransfer.getData('text/plain');
      const dragging=document.querySelector(`.tier-item[src="${src}"]`);
      if(dragging) zone.appendChild(dragging);
    });
  });
  $('tierReset').addEventListener('click',buildTierList);
}

// ─── BRACKET TOURNAMENT ──────────────────────────────────────────────────────
function buildBracket() {
  const wrap=$('bracketWrap'); if(!wrap) return;
  const photos=SECRET_PHOTOS.length?SECRET_PHOTOS:PHOTOS;
  if(photos.length<2){wrap.innerHTML='<div style="color:#8a3030;text-align:center;padding:40px;font-style:italic">Add more photos to run a tournament</div>';return;}
  const pool=shuffle(photos).slice(0,8);
  state.bracketState={rounds:[pool.map(p=>({photo:p,winner:false}))],currentRound:0,champions:[]};
  renderBracket();
}
function renderBracket() {
  const wrap=$('bracketWrap'); if(!wrap) return;
  const bs=state.bracketState;
  if(!bs){wrap.innerHTML='';return;}
  // check if champion
  if(bs.rounds[bs.currentRound].length===1&&bs.rounds[bs.currentRound][0].winner===false) {
    const champ=bs.rounds[bs.currentRound][0].photo;
    wrap.innerHTML=`<div class="bracket-champion">
      <div style="font-size:10px;letter-spacing:4px;color:#8a3030;text-transform:uppercase;margin-bottom:16px">Champion</div>
      <img class="bracket-champion-img" src="${champ.src}" alt="">
      <div class="bracket-champion-title">👑 ${champ.name}</div>
      <div class="bracket-champion-model">${champ.model}</div>
      <button class="bracket-restart" onclick="buildBracket()">New Tournament ↺</button>
    </div>`;
    return;
  }
  const roundNames=['Round 1','Semifinals','Final','Champion'];
  const html=`<div class="bracket-wrap"><div class="bracket-rounds">
    ${bs.rounds.map((round,ri)=>`
      <div class="bracket-round">
        <div class="bracket-round-title">${roundNames[ri]||'Round '+(ri+1)}</div>
        ${chunkArray(round,2).map((pair,pi)=>`
          <div class="bracket-match">
            ${pair.map((entry,ei)=>`
              <div class="bracket-contestant ${entry.winner===true?'winner':entry.winner===false&&ri===bs.currentRound&&pi===Math.floor(bs.currentMatchup)?'':''}
                ${ri===bs.currentRound?'active-match':''}"
                ${ri===bs.currentRound?`data-round="${ri}" data-pair="${pi}" data-pos="${ei}"`:''}>
                <img class="bracket-thumb" src="${entry.photo.src}" alt="">
                <div class="bracket-name">${entry.photo.name}</div>
              </div>`).join('')}
          </div>`).join('')}
      </div>`).join('')}
  </div></div>`;
  wrap.innerHTML=html;
  wrap.querySelectorAll('.bracket-contestant[data-round]').forEach(el=>{
    el.addEventListener('click',()=>{
      const ri=parseInt(el.dataset.round),pi=parseInt(el.dataset.pair),pos=parseInt(el.dataset.pos);
      const round=bs.rounds[ri]; if(ri!==bs.currentRound) return;
      const pair=chunkArray(round,2)[pi];
      const winner=pair[pos], loser=pair[1-pos];
      winner.winner=true; loser.winner=false;
      addDangerScore(winner.photo.src,15);
      // advance
      const allPairs=chunkArray(round,2);
      const allVoted=allPairs.every(p=>p.some(e=>e.winner===true));
      if(allVoted) {
        const nextRound=allPairs.map(p=>({photo:p.find(e=>e.winner===true).photo,winner:false}));
        if(nextRound.length===1){bs.rounds.push(nextRound);bs.currentRound++;}
        else{bs.rounds.push(nextRound);bs.currentRound++;}
      }
      renderBracket();
    });
  });
}
function chunkArray(arr,size){const r=[];for(let i=0;i<arr.length;i+=size)r.push(arr.slice(i,i+size));return r;}

// ─── MOST WANTED ─────────────────────────────────────────────────────────────
function updateMostWanted() {
  const el=$('mostWantedList'); if(!el) return;
  const photos=SECRET_PHOTOS.length?SECRET_PHOTOS:PHOTOS;
  const top=getTopDanger(photos,10);
  if(!top.length){el.innerHTML='<div class="most-wanted-empty">Play games in the vault to build the Most Wanted list</div>';return;}
  el.innerHTML=top.map((x,i)=>`
    <div class="most-wanted-row">
      <div class="most-wanted-rank ${i===0?'top1':i===1?'top2':i===2?'top3':''}">${i+1}</div>
      <img class="most-wanted-img" src="${x.photo.src}" alt="">
      <div class="most-wanted-info">
        <div class="most-wanted-name">${x.photo.name}</div>
        <div class="most-wanted-model">${x.photo.model}</div>
        <div class="most-wanted-stats">
          <span class="most-wanted-stat">Danger: ${x.score}</span>
        </div>
      </div>
      <div class="most-wanted-score">${x.score}</div>
    </div>`).join('');
}

// ─── SECRET GAMES ────────────────────────────────────────────────────────────
const SWYR_QUOTES=['She would destroy you and you\'d smile 🔥','Not even a debate. She wins everything.','The other one doesn\'t exist anymore','That look should come with a warning label','Your brain stopped working the second you saw her','She\'s the reason men make bad decisions','That body is genuinely not allowed','You\'re cooked. Absolutely cooked. 💀','Game over. Delete the other one.','She walked in and the temperature changed'];
const SRTF_VERDICTS=['','😴 She\'s forgettable','🤔 Could work with the lights off','😈 She\'d ruin your week','🔥 You\'d do something stupid for her','💀 ABSOLUTELY NOT LEGAL'];

let swyrPair=[],swyrL=0,swyrR=0;
function newSwyrPair(){
  if(SECRET_PHOTOS.length<2){$('swyrLeft').innerHTML='<div style="padding:20px;color:#8a3030">Add photos</div>';$('swyrRight').innerHTML='';return;}
  const s=shuffle(SECRET_PHOTOS);swyrPair=[s[0],s[1]];
  $('swyrLeft').innerHTML=`<img src="${swyrPair[0].src}" alt=""><div class="wyr-label">${swyrPair[0].name}</div>`;
  $('swyrRight').innerHTML=`<img src="${swyrPair[1].src}" alt=""><div class="wyr-label">${swyrPair[1].name}</div>`;
  $('swyrLeft').className='wyr-card';$('swyrRight').className='wyr-card';$('swyrReaction').textContent='';
}
function swyrVote(side){
  if(swyrPair.length<2)return;
  $('swyrLeft').className='wyr-card '+(side==='left'?'winner':'loser');
  $('swyrRight').className='wyr-card '+(side==='right'?'winner':'loser');
  const winner=side==='left'?swyrPair[0]:swyrPair[1];
  addDangerScore(winner.src,10); updateSDangerMeter(); updateMostWanted();
  $('swyrReaction').textContent=rand(SWYR_QUOTES);
  if(side==='left')swyrL++;else swyrR++;
  $('swyrScoreL').textContent=swyrL; $('swyrScoreR').textContent=swyrR;
}
$('swyrLeft').addEventListener('click',()=>swyrVote('left'));
$('swyrRight').addEventListener('click',()=>swyrVote('right'));
$('swyrNext').addEventListener('click',newSwyrPair);

let shonQueue=[],shonCurrent=null;
function sHonNext(){
  if(!SECRET_PHOTOS.length){$('shonImg').src='';return;}
  if(!shonQueue.length)shonQueue=shuffle(SECRET_PHOTOS);
  shonCurrent=shonQueue.pop();$('shonImg').src=shonCurrent.src;
  $('shonOverlay').className='hon-overlay';$('shonOverlay').textContent='';
}
function sHonVote(isHot){
  if(!shonCurrent)return;
  if(!state.sHotScores[shonCurrent.src])state.sHotScores[shonCurrent.src]={hot:0,not:0};
  if(isHot){state.sHotScores[shonCurrent.src].hot++;addDangerScore(shonCurrent.src,7);updateSDangerMeter();updateMostWanted();}
  else state.sHotScores[shonCurrent.src].not++;
  $('shonOverlay').className='hon-overlay '+(isHot?'hot':'not')+' show';
  $('shonOverlay').textContent=isHot?'🔥 FIRE':'❌ NAH';
  setTimeout(()=>{sHonNext();renderSHonLeaderboard();},700);
}
function renderSHonLeaderboard(){
  const scored=Object.entries(state.sHotScores).map(([key,s])=>({key,pct:s.hot/(s.hot+s.not)*100,total:s.hot+s.not})).filter(x=>x.total>0).sort((a,b)=>b.pct-a.pct).slice(0,5);
  if(!scored.length){$('shonLeaderboard').innerHTML='';return;}
  $('shonLeaderboard').innerHTML=`<div class="hon-podium-title" style="color:#ff4444">🔥 Most Lethal</div>`+scored.map((x,i)=>{
    const p=SECRET_PHOTOS.find(p=>p.src===x.key);
    return `<div class="hon-row"><div class="hon-rank" style="color:#ff4444">${i+1}</div><img class="hon-thumb" src="${x.key}" alt=""><div class="hon-info"><div class="hon-info-name" style="color:#ff6666">${p?p.name:''}</div><div class="hon-info-score">${Math.round(x.pct)}% fire · ${x.total} votes</div><div class="hon-bar" style="width:${x.pct}%;background:#ff2222"></div></div></div>`;
  }).join('');
}
$('shonHot').addEventListener('click',()=>sHonVote(true));
$('shonNot').addEventListener('click',()=>sHonVote(false));

let sRtfQueue=[],sRtfCurrent=null,sRtfSelected=0;
function sRtfNext(){
  if(!SECRET_PHOTOS.length){$('srtfImg').src='';return;}
  if(!sRtfQueue.length)sRtfQueue=shuffle(SECRET_PHOTOS);
  sRtfCurrent=sRtfQueue.pop();$('srtfImg').src=sRtfCurrent.src;
  sRtfSelected=0;$('srtfVerdict').textContent='';
  document.querySelectorAll('.vstar').forEach(s=>s.classList.remove('on'));
}
function sRtfRate(n){
  sRtfSelected=n;
  document.querySelectorAll('.vstar').forEach((s,i)=>s.classList.toggle('on',i<n));
  $('srtfVerdict').textContent=SRTF_VERDICTS[n];
  if(sRtfCurrent){addDangerScore(sRtfCurrent.src,n*3);updateSDangerMeter();updateMostWanted();setTimeout(sRtfNext,900);}
}
document.querySelectorAll('.vstar').forEach((s,i)=>{
  s.addEventListener('click',()=>sRtfRate(i+1));
  s.addEventListener('mouseenter',()=>document.querySelectorAll('.vstar').forEach((ss,j)=>ss.classList.toggle('on',j<=i)));
});
const sRtfStars=document.querySelector('#spaneRtf .rtf-stars');
if(sRtfStars)sRtfStars.addEventListener('mouseleave',()=>document.querySelectorAll('.vstar').forEach((s,i)=>s.classList.toggle('on',i<sRtfSelected)));

const SWC=['#1a0000','#2a0000','#3a0000','#1f0505','#250303','#2f0a0a','#150000','#200000'];
let S_WHEEL_PHOTOS=[];
function initSWheel(){S_WHEEL_PHOTOS=SECRET_PHOTOS.length?shuffle(SECRET_PHOTOS).slice(0,8):[];drawWheelOn('sSpinWheel',0,S_WHEEL_PHOTOS,SWC);}
$('sSpinBtn').addEventListener('click',()=>{if(!S_WHEEL_PHOTOS.length)return;doSpin('sSpinBtn','ssa','sSpinWheel','sSpinResult','sSpinResultImg','sSpinResultName',S_WHEEL_PHOTOS,SWC);});

$('sConfessionSubmit').addEventListener('click',()=>{
  addConfession($('sConfessionInput').value,'sConfessionWall',state.sConfessions,true);
  $('sConfessionInput').value='';
});

// ─── FUCK MARRY KILL ─────────────────────────────────────────────────────────
const FMK_REACTIONS = [
  'Brutal honesty. Respect. 💀','Zero hesitation on that choice','Your boys would be proud','That\'s a crime against the one you killed off','Controversial but we see you','No way you picked that. No way.','The fuck one is carrying the whole decision','Classic. Absolute classic.','She didn\'t deserve that. But here we are.','You made your bed. Now lie in it. 🔥'
];
const SFMK_REACTIONS = [
  'Fuck that\'s cold 💀','You fucked who and killed who?? Say less.','She would destroy you and you picked marry. Smart.','The kill one was the hottest one. You ruined it.','Zero remorse. Zero apologies. Respect.','That\'s genuinely illegal in 3 countries','She would ruin your life and you picked fuck. Valid.','Your therapist is going to hear about this.','Bro the one you killed is fuming rn','No shame. None. Good.'
];

function buildFmk(isVault=false) {
  const arenaId = isVault ? 'sfmkArena' : 'fmkArena';
  const reactionId = isVault ? 'sfmkReaction' : 'fmkReaction';
  const arena = $(arenaId); if(!arena) return;
  const photos = isVault ? SECRET_PHOTOS : PHOTOS;
  if(photos.length < 3) { arena.innerHTML='<div style="padding:40px;text-align:center;color:var(--muted)">Need at least 3 photos to play</div>'; return; }
  const trio = shuffle(photos).slice(0,3);
  const choices = {0:null,1:null,2:null};
  const labels = ['F**K','MARRY','KILL'];
  const classes = ['f-btn','m-btn','k-btn'];

  function render() {
    arena.innerHTML = trio.map((p,i) => `
      <div class="fmk-card" data-idx="${i}">
        <img class="fmk-img" src="${p.src}" alt="">
        <div class="fmk-name">${p.name}</div>
        <div class="fmk-btns">
          ${labels.map((l,j) => `<button class="fmk-btn ${classes[j]} ${choices[i]===j?'selected':''}" data-card="${i}" data-choice="${j}">${l}</button>`).join('')}
        </div>
      </div>`).join('');

    arena.querySelectorAll('.fmk-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = parseInt(btn.dataset.card);
        const choice = parseInt(btn.dataset.choice);
        // unset any other card with same choice
        Object.keys(choices).forEach(k => { if(choices[k]===choice && parseInt(k)!==card) choices[k]=null; });
        choices[card] = choices[card]===choice ? null : choice;
        render();
        // check if all 3 assigned
        const vals = Object.values(choices);
        if(vals.filter(v=>v!==null).length===3 && new Set(vals).size===3) {
          $(reactionId).textContent = rand(isVault?SFMK_REACTIONS:FMK_REACTIONS);
          // score
          const fuckedIdx = Object.keys(choices).find(k=>choices[k]===0);
          if(fuckedIdx!==undefined) addDangerScore(trio[fuckedIdx].src, 12);
          const marriedIdx = Object.keys(choices).find(k=>choices[k]===1);
          if(marriedIdx!==undefined) addDangerScore(trio[marriedIdx].src, 8);
        }
      });
    });
  }
  render();
}

document.getElementById('fmkNext') && document.getElementById('fmkNext').addEventListener('click', () => {
  buildFmk(false); $('fmkReaction').textContent='';
});
document.getElementById('sfmkNext') && document.getElementById('sfmkNext').addEventListener('click', () => {
  buildFmk(true); $('sfmkReaction').textContent='';
});

// ─── SLOT MACHINE ────────────────────────────────────────────────────────────
const SLOT_RESULTS = [
  ['All three? You\'re not surviving tonight 🔥', 3],
  ['Two out of three ain\'t bad. It\'s great actually.', 2],
  ['The universe is testing you right now', 1],
  ['Jackpot. Absolute jackpot. 💀', 3],
  ['Your phone is about to be a problem', 2],
  ['This combination should be illegal', 3],
  ['Bro rolled and won everything', 3],
];
let slotSpinning = false;
function spinSlots() {
  if(slotSpinning || !PHOTOS.length) return;
  slotSpinning = true;
  $('slotBtn').disabled = true;
  $('slotResult').textContent = '';
  const picks = shuffle(PHOTOS).slice(0,3);
  const reels = [$('slotReel1'), $('slotReel2'), $('slotReel3')];
  reels.forEach(r => r.classList.add('spinning'));

  let count = 0;
  picks.forEach((photo, i) => {
    setTimeout(() => {
      reels[i].classList.remove('spinning');
      reels[i].innerHTML = `<img class="slot-item" src="${photo.src}" alt="${photo.name}" style="width:100%;height:100%;object-fit:cover">`;
      count++;
      if(count === 3) {
        slotSpinning = false;
        $('slotBtn').disabled = false;
        const models = picks.map(p=>p.model);
        const unique = new Set(models).size;
        const allSame = unique === 1;
        $('slotResult').textContent = allSame ? '🎰 JACKPOT — Triple ' + picks[0].model + '!! She ran the table!' : rand(SLOT_RESULTS)[0];
        picks.forEach(p => addDangerScore(p.src, 5));
      }
    }, 400 + i * 350);
  });
}
$('slotBtn') && $('slotBtn').addEventListener('click', spinSlots);

// ─── ROAST OR TOAST ──────────────────────────────────────────────────────────
let roastCurrent = null, roastMode = null;
const roastEntries = [];
const ROAST_PROMPTS = ['Honestly? She ate.','That look does something to me.','She woke up like this. Unfair.','The smile alone should be illegal.','She\'s carrying the whole gallery on her back.','I\'m not okay after seeing this.','That body was designed to ruin lives.','She walked in and everybody else became irrelevant.'];
const TOAST_PROMPTS = ['Meh. Next.','She tried. It\'s cute.','The vibe is there but the execution is missing.','Not the one. Sorry.','I\'ve scrolled past better.','She needs to try harder.','The look is doing too much.','Not it.'];

function roastNext() {
  if(!PHOTOS.length) return;
  const q = shuffle(PHOTOS);
  roastCurrent = q[0];
  $('roastImg').src = roastCurrent.src;
  $('roastName').textContent = roastCurrent.name + ' · ' + roastCurrent.model;
  $('roastInputWrap').style.display = 'none';
  $('roastInput').value = '';
  roastMode = null;
}
function setRoastMode(mode) {
  roastMode = mode;
  $('roastInputWrap').style.display = 'block';
  $('roastInput').placeholder = mode === 'toast' ? 'Say something nice... or not.' : 'Roast her. Don\'t hold back.';
  $('roastInput').focus();
}
$('roastToast') && $('roastToast').addEventListener('click', () => setRoastMode('toast'));
$('roastRoast') && $('roastRoast').addEventListener('click', () => setRoastMode('roast'));
$('roastSubmit') && $('roastSubmit').addEventListener('click', () => {
  const text = $('roastInput').value.trim() || (roastMode==='toast' ? rand(ROAST_PROMPTS) : rand(TOAST_PROMPTS));
  if(!roastCurrent) return;
  roastEntries.unshift({text, mode:roastMode, name:roastCurrent.name, model:roastCurrent.model, src:roastCurrent.src});
  renderRoastWall();
  if(roastMode==='toast') addDangerScore(roastCurrent.src, 6);
  roastNext();
});
function renderRoastWall() {
  const wall = $('roastWall'); if(!wall) return;
  wall.innerHTML = roastEntries.slice(0,30).map(e=>`
    <div class="roast-entry ${e.mode==='roast'?'is-roast':''}">
      ${e.mode==='roast'?'🔥':'🥂'} <strong style="color:${e.mode==='roast'?'#ff4444':'var(--gold)'}">${e.name}</strong> — ${e.text}
      <div class="roast-meta">${e.mode==='roast'?'Roasted':'Toasted'}</div>
    </div>`).join('');
}

// ─── TRUTH OR DARE ────────────────────────────────────────────────────────────
let todCurrent = null;
const TOD_TRUTHS = [
  'On a scale of 1-10, how bad do you want her to text you right now?',
  'Would you leave your current situation for her? Be honest.',
  'What\'s the first thing you thought when you saw her?',
  'How long did you actually look at her pic before scrolling? Be exact.',
  'Would you wife her, or just keep her a secret?',
  'If she DM\'d you right now, what would you say back?',
  'Rate her compared to anyone you\'ve actually been with.',
  'What are you actually thinking about right now looking at her?',
  'Would your boys approve or clown you?',
  'Is she the type you bring home or the type you don\'t mention?',
];
const TOD_DARES = [
  'Screenshot her best photo and set it as your wallpaper for 24 hours.',
  'Write her a DM you\'d never actually send. Read it out loud.',
  'Rank her against the other girls in this vault, out loud, right now.',
  'Say out loud exactly what you\'d do if she texted you tonight.',
  'Describe her in one sentence to your best friend. Do it now.',
  'Pick your favorite photo of hers and explain why. In detail.',
  'Rate her body out loud, 1-10, no rounding.',
  'If you were going to shoot your shot, what\'s your opener? Say it.',
  'Name one thing about her that would make you do something stupid.',
  'Tell the room what you\'d order her on a first date. Right now.',
];

function todNext() {
  if(!SECRET_PHOTOS.length) { $('todImg').src=''; $('todPrompt').textContent='Add photos to the vault to play'; return; }
  todCurrent = rand(SECRET_PHOTOS);
  $('todImg').src = todCurrent.src;
  $('todPrompt').textContent = '';
  $('todOverlay').innerHTML = `<span style="font-size:11px;letter-spacing:2px;color:#ff4444;text-transform:uppercase">${todCurrent.name} · ${todCurrent.model}</span>`;
}
$('todTruth') && $('todTruth').addEventListener('click', () => {
  $('todPrompt').textContent = rand(TOD_TRUTHS);
  if(todCurrent) addDangerScore(todCurrent.src, 5);
});
$('todDare') && $('todDare').addEventListener('click', () => {
  $('todPrompt').textContent = rand(TOD_DARES);
  if(todCurrent) addDangerScore(todCurrent.src, 8);
});
$('todNext') && $('todNext').addEventListener('click', todNext);

// ─── FANTASY DRAFT ───────────────────────────────────────────────────────────
const DRAFT_SIZE = 5;
let draftPicks = [];
function buildDraft() {
  draftPicks = [];
  const slots = $('draftSlots'), pool = $('draftPool');
  if(!slots||!pool) return;
  renderDraftSlots();
  const photos = SECRET_PHOTOS.length ? SECRET_PHOTOS : PHOTOS;
  pool.innerHTML = shuffle(photos).map((p,i) => `
    <div class="draft-pick" data-src="${p.src}" data-name="${p.name}" data-model="${p.model}">
      <img src="${p.src}" alt="${p.name}">
      <div class="draft-pick-name">${p.name.split(' ')[0]}</div>
    </div>`).join('');
  pool.querySelectorAll('.draft-pick').forEach(el => {
    el.addEventListener('click', () => {
      if(el.classList.contains('drafted')) return;
      if(draftPicks.length >= DRAFT_SIZE) { toast('Squad is full!'); return; }
      draftPicks.push({src:el.dataset.src, name:el.dataset.name, model:el.dataset.model});
      el.classList.add('drafted');
      addDangerScore(el.dataset.src, 10);
      renderDraftSlots();
    });
  });
}
function renderDraftSlots() {
  const slots = $('draftSlots'); if(!slots) return;
  slots.innerHTML = Array.from({length:DRAFT_SIZE}, (_,i) => {
    const pick = draftPicks[i];
    return `<div class="draft-slot">
      <div class="draft-slot-num">#${i+1}</div>
      ${pick
        ? `<img class="draft-slot-img" src="${pick.src}" alt="${pick.name}"><div class="draft-slot-name">${pick.name.split(' ')[0]}</div>`
        : `<div class="draft-slot-empty">+</div><div class="draft-slot-name" style="color:#3a1010">empty</div>`}
    </div>`;
  }).join('');
}
$('draftReset') && $('draftReset').addEventListener('click', buildDraft);

// ═══════════════════════════════════════════════════════
// GLOW-UP FEATURES
// ═══════════════════════════════════════════════════════

// ─── SPARKLE PARTICLES ───────────────────────────────────────────────────────
function spawnSparkles(x, y, isVault=false) {
  const symbols = isVault ? ['🔥','💀','⚡','✦','👁️'] : ['✦','♡','★','💋','✨'];
  for(let i=0;i<6;i++){
    const el=document.createElement('div');
    el.className='sparkle';
    el.textContent=symbols[Math.floor(Math.random()*symbols.length)];
    const angle=Math.random()*Math.PI*2;
    const dist=40+Math.random()*60;
    el.style.cssText=`left:${x}px;top:${y}px;--dx:${Math.cos(angle)*dist}px;--dy:${Math.sin(angle)*dist}px;animation-delay:${Math.random()*0.2}s`;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),1000);
  }
}

// Patch toggleLike/toggleSave to spawn sparkles
const _origToggleLike=toggleLike, _origToggleSave=toggleSave;
document.addEventListener('click',e=>{
  const btn=e.target.closest('.icon-btn');
  if(btn){spawnSparkles(e.clientX,e.clientY,!!$('secretWrap').classList.contains('open'));}
});

// ─── VAULT DOOR ANIMATION ────────────────────────────────────────────────────
function openVaultWithDoor(cb) {
  const door=$('vaultDoor');
  door.classList.add('show');
  setTimeout(()=>{
    door.classList.add('opening');
    setTimeout(()=>{
      door.classList.remove('show','opening');
      cb();
    },1100);
  },600);
}

// Patch openVault to use door animation
const _origOpenVault=openVault;
function openVault() {
  state.secretUnlocked=true;
  openVaultWithDoor(()=>{
    $('secretWrap').classList.add('open');
    if(SECRET_PHOTOS.length){
      const featured=rand(SECRET_PHOTOS);
      $('spotlightImg').src=featured.src;
      $('spotlightName').textContent=featured.name;
      $('spotlightModel').textContent=featured.model;
      $('vaultSpotlight').style.display='flex';
      $('vaultMain').style.display='none';
    } else {
      $('vaultSpotlight').style.display='none';
      $('vaultMain').style.display='flex';
      initVaultContent();
    }
  });
}

// ─── HOT TAKE GENERATOR ──────────────────────────────────────────────────────
const PUBLIC_HOT_TAKES = [
  'She\'s the reason men stop responding to other girls.',
  'You\'d mute everyone else in your phone for this one.',
  'Objectively dangerous. The jury agrees.',
  'She\'s a 10 and she knows it. That\'s the problem.',
  'Your ex would have a problem with this photo. Good.',
  'She doesn\'t need to try and that\'s what makes it worse.',
  'The kind of girl your mum would hate and your boys would never shut up about.',
  'She texted first once and you never recovered.',
  'Scientists have confirmed she should come with a warning label.',
  'You\'d do something embarrassing for this girl and not even feel bad about it.',
  'She looked at the camera like she knew you\'d be staring. She was right.',
  'There are two types of men: those who have seen her, and those who haven\'t yet.',
];
const VAULT_HOT_TAKES = [
  'She\'s the kind of dangerous that makes you lie to your boys about where you were.',
  'You\'d delete every other girl in your phone for one night with her.',
  'She knows exactly what she\'s doing. That\'s the most terrifying part.',
  'Every single bad decision you\'d make for her would be worth it.',
  'She\'s not your type. She became your type the second you saw her.',
  'The way she looks should be a criminal offence. No questions.',
  'You\'d set your own life on fire just to keep her warm.',
  'She\'s the missed call you think about at 3am.',
  'Men have done stupid things for less.',
  'She looked at you once and now nothing else exists.',
  'The vault exists because some girls are too much for the general public.',
  'She\'s the reason the vault has a password.',
];

let hotTakeIsVault=false;
function showHotTake(isVault=false) {
  hotTakeIsVault=isVault;
  const photos=isVault?SECRET_PHOTOS:PHOTOS;
  if(!photos.length) return;
  const photo=rand(photos);
  const takes=isVault?VAULT_HOT_TAKES:PUBLIC_HOT_TAKES;
  $('hotTakeImg').src=photo.src;
  $('hotTakeText').textContent=rand(takes);
  $('hotTakeName').textContent=`${photo.name} · ${photo.model}`;
  $('hotTakeBox').className='hottake-box'+(isVault?' vault-take':'');
  $('hotTakeOverlay').classList.add('show');
  addDangerScore(photo.src,3);
}
$('hotTakeBtn')&&$('hotTakeBtn').addEventListener('click',()=>showHotTake(false));
$('vHotTakeBtn')&&$('vHotTakeBtn').addEventListener('click',()=>showHotTake(true));
$('hotTakeClose')&&$('hotTakeClose').addEventListener('click',()=>$('hotTakeOverlay').classList.remove('show'));
$('hotTakeAgain')&&$('hotTakeAgain').addEventListener('click',()=>showHotTake(hotTakeIsVault));
$('hotTakeOverlay')&&$('hotTakeOverlay').addEventListener('click',e=>{if(e.target===$('hotTakeOverlay'))$('hotTakeOverlay').classList.remove('show');});

// ─── SURPRISE ME ─────────────────────────────────────────────────────────────
$('surpriseBtn')&&$('surpriseBtn').addEventListener('click',()=>{
  if(!PHOTOS.length) return;
  const photo=rand(PHOTOS);
  openModal(photo);
  addDangerScore(photo.src,2);
});
$('vSurpriseBtn')&&$('vSurpriseBtn').addEventListener('click',()=>{
  if(!SECRET_PHOTOS.length) return;
  const photo=rand(SECRET_PHOTOS);
  openModal(photo,true);
  addDangerScore(photo.src,2);
});

// ─── RANDOM GIRL ─────────────────────────────────────────────────────────────
$('randomGirlBtn')&&$('randomGirlBtn').addEventListener('click',()=>{
  const models=Object.keys(MODELS).filter(m=>MODELS[m].length>0);
  if(!models.length) return;
  const model=rand(models);
  const btn=document.querySelector(`.model-tab`);
  document.querySelectorAll('.model-tab').forEach(b=>{
    if(b.textContent.trim().startsWith(model)){
      b.click();
      b.scrollIntoView({behavior:'smooth',block:'nearest'});
      b.style.boxShadow='0 0 16px rgba(244,167,185,0.6)';
      setTimeout(()=>b.style.boxShadow='',1500);
    }
  });
  toast(`✦ Showing ${model}`);
});

// ─── TONIGHT'S MOOD ──────────────────────────────────────────────────────────
const MOODS = [
  {tag:'3am energy',scenario:'You\'re both awake when you shouldn\'t be and nobody\'s asking questions.'},
  {tag:'Bad Idea',scenario:'You know you shouldn\'t. You\'re going to anyway. Twice.'},
  {tag:'Hotel Room',scenario:'Checked in at midnight. Checkout is none of your business.'},
  {tag:'Dangerous',scenario:'She\'s the kind of trouble you\'d walk into with your eyes open.'},
  {tag:'Main Character',scenario:'Everyone else in the room became a background character the second she walked in.'},
  {tag:'Soft Destruction',scenario:'Looks completely harmless. Will ruin the next 6 months of your life. Worth it.'},
  {tag:'Private Collection',scenario:'The best things never get posted. They just get remembered.'},
  {tag:'No Sleep',scenario:'You made plans for tomorrow. Those plans are cancelled now.'},
  {tag:'Your Problem Now',scenario:'She smiled once and now she lives rent-free in your head permanently.'},
  {tag:'The Last One',scenario:'The kind you don\'t get over. You already know. You go anyway.'},
];
function showTonightsMood() {
  if(!SECRET_PHOTOS.length) return;
  const photo=rand(SECRET_PHOTOS);
  const mood=rand(MOODS);
  $('moodImg').src=photo.src;
  $('moodName').textContent=photo.name;
  $('moodModel').textContent=photo.model;
  $('moodTag').textContent=mood.tag;
  $('moodScenario').textContent=mood.scenario;
  $('moodOverlay').classList.add('show');
  addDangerScore(photo.src,5);
}
$('tonightsMoodBtn')&&$('tonightsMoodBtn').addEventListener('click',showTonightsMood);
$('moodClose')&&$('moodClose').addEventListener('click',()=>$('moodOverlay').classList.remove('show'));
$('moodAgain')&&$('moodAgain').addEventListener('click',showTonightsMood);
$('moodOverlay')&&$('moodOverlay').addEventListener('click',e=>{if(e.target===$('moodOverlay'))$('moodOverlay').classList.remove('show');});

// ─── SHE'S A... ──────────────────────────────────────────────────────────────
const SHES_A_LABELS = [
  'a deleted contact you keep looking up',
  'the reason men have trust issues',
  'a court-admissible bad decision',
  'your boys\' worst nightmare',
  'six months of therapy in one photo',
  'the missed call at 2:47am',
  'a red flag in the best possible way',
  'someone\'s main character and everyone else\'s villain',
  'the reason the vault exists',
  'a classified government threat',
  'the girl your ex warned you about',
  'a lifestyle you can\'t afford but want anyway',
  'the last thing you see before everything goes sideways',
  'built different and fully aware of it',
  'not your type until she was',
];
function showShesA() {
  if(!SECRET_PHOTOS.length) return;
  const photo=rand(SECRET_PHOTOS);
  const label=rand(SHES_A_LABELS);
  $('moodImg').src=photo.src;
  $('moodName').textContent=photo.name;
  $('moodModel').textContent=photo.model;
  $('moodTag').textContent='She\'s a...';
  $('moodScenario').textContent=`"${label}"`;
  $('moodOverlay').classList.add('show');
  addDangerScore(photo.src,3);
}
$('shesABtn')&&$('shesABtn').addEventListener('click',showShesA);

// ─── STALKER MODE ─────────────────────────────────────────────────────────────
const STALKER_NICKNAMES = {
  Nya:     'Naughty Nya',
  Remi:    'Risky Remi',
  Stella:  'Sweet Stella',
  Allie:   'Angelic Allie',
  Rileigh: 'Reckless Rileigh',
  Macy:    'Mischievous Macy',
};
let stalkerTimer=null, stalkerIdx=0, stalkerPhotos=[], stalkerInterval=6000;
function startStalkerMode() {
  if(!SECRET_PHOTOS.length){toast('Add photos to the vault first');return;}
  stalkerPhotos=shuffle(SECRET_PHOTOS);
  stalkerIdx=0;
  $('stalkerOverlay').classList.add('show');
  showStalkerPhoto();
}
const STALKER_LOCATIONS = {
  Nya:     { name: 'Nya Barnard',   addr: '📍 1722 S Delaware Pl, Tulsa OK 74104', phone: null,             insta: '📸 @nya.barn' },
  Remi:    { name: 'Remi Barnard',  addr: '📍 1722 S Delaware Pl, Tulsa OK 74104', phone: '📞 918-284-8365', insta: '📸 @remibarn' },
  Stella:  { name: 'Stella Thomas', addr: '📍 6449 S Sandusky Ave, Tulsa OK 74136', phone: '📞 918-998-5774', insta: '📸 @stella_thomas08' },
  Allie:   { name: 'Allie',         addr: '📍 Tulsa, Oklahoma',                     phone: null,             insta: null },
  Rileigh: { name: 'Rileigh Sowards',addr: '📍 320 N 14th St, Sapulpa OK',          phone: '📞 918-261-6532', insta: '📸 @rileigh_l_s' },
  Macy:    { name: 'Macy Cox',      addr: '📍 Tulsa, Oklahoma',                     phone: '📞 918-805-3623', insta: '📸 @addison_and_macy' },
};
function showStalkerPhoto() {
  const photo=stalkerPhotos[stalkerIdx%stalkerPhotos.length];
  const info=STALKER_LOCATIONS[photo.model]||{name:photo.model,addr:'📍 Tulsa, Oklahoma',phone:null,insta:null};
  $('stalkerImg').src=photo.src;
  $('stalkerName').textContent=STALKER_NICKNAMES[photo.model]||photo.model;
  const details=[info.addr, info.phone, info.insta].filter(Boolean).join('   ');
  $('stalkerModel').textContent=details;
  addDangerScore(photo.src,1);
  // progress bar
  const prog=$('stalkerProgress');
  prog.style.transition='none'; prog.style.width='0%';
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      prog.style.transition=`width ${stalkerInterval}ms linear`;
      prog.style.width='100%';
    });
  });
  stalkerTimer=setTimeout(()=>{
    stalkerIdx++;
    showStalkerPhoto();
  },stalkerInterval);
}
function stopStalkerMode() {
  clearTimeout(stalkerTimer);
  $('stalkerOverlay').classList.remove('show');
}
$('stalkerBtn')&&$('stalkerBtn').addEventListener('click',startStalkerMode);
$('stalkerStop')&&$('stalkerStop').addEventListener('click',stopStalkerMode);
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&$('stalkerOverlay').classList.contains('show'))stopStalkerMode(); });

// ─── INIT ──────────────────────────────────────────────────────────────────────
buildModelTabs();
renderGrid();
renderSaved();
newWyrPair();
honNext();
rtfNext();
initWheel();
updateStats();
buildQuiz(false);
buildFmk(false);
roastNext();
renderConfessionWall('confessionWall',state.confessions,false);
showTab('moodboard');

// ─── SCROLL PROGRESS BAR ─────────────────────────────────────────────────────
const scrollBar=document.createElement('div');
scrollBar.className='scroll-progress';
document.body.prepend(scrollBar);
window.addEventListener('scroll',()=>{
  const pct=window.scrollY/(document.body.scrollHeight-window.innerHeight)*100;
  scrollBar.style.width=Math.min(pct,100)+'%';
});

// ─── VAULT CLOCK ──────────────────────────────────────────────────────────────
function updateVaultClock() {
  const el=$('vaultClock'); if(!el) return;
  el.textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'});
}
setInterval(updateVaultClock,1000);

// ─── VAULT PHOTO COUNT ────────────────────────────────────────────────────────
function updateVaultPhotoCount(){const el=$('vaultPhotoCount');if(el)el.textContent=SECRET_PHOTOS.length;}

// ─── SCROLL TO TOP ─────────────────────────────────────────────────────────────
const scrollTopBtn=document.createElement('button');
scrollTopBtn.className='scroll-top-btn';
scrollTopBtn.innerHTML='↑';
document.body.appendChild(scrollTopBtn);
window.addEventListener('scroll',()=>scrollTopBtn.classList.toggle('show',window.scrollY>400));
scrollTopBtn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));

// ─── PHOTO NAME TICKER ────────────────────────────────────────────────────────
function buildTicker() {
  const ticker=document.createElement('div');
  ticker.className='photo-ticker';
  const names=PHOTOS.map(p=>p.name).join(' ✦ ');
  ticker.innerHTML=`<span>${names} ✦ ${names}</span>`;
  const mb=$('moodboard');
  const fb=mb&&mb.querySelector('.fun-btns-bar');
  if(fb)fb.after(ticker);
}
buildTicker();

// ─── MAGNETIC CARD 3D TILT ────────────────────────────────────────────────────
document.addEventListener('mousemove',e=>{
  const card=e.target.closest('.card');
  if(!card){return;}
  const rect=card.getBoundingClientRect();
  const dx=(e.clientX-rect.left-rect.width/2)/rect.width;
  const dy=(e.clientY-rect.top-rect.height/2)/rect.height;
  card.style.transform=`translateY(-4px) scale(1.02) rotateY(${dx*6}deg) rotateX(${-dy*4}deg)`;
});
document.addEventListener('mouseleave',()=>{
  document.querySelectorAll('.card').forEach(c=>c.style.transform='');
});

// ─── FLOATING VAULT PARTICLES ─────────────────────────────────────────────────
let particleInterval=null;
const PSYMBOLS=['✦','†','◆','▸','×','⚡','◇','✕'];
function startVaultParticles(){
  if(particleInterval)return;
  particleInterval=setInterval(()=>{
    if(!$('secretWrap').classList.contains('open'))return;
    const p=document.createElement('div');
    p.className='vault-particle';
    p.textContent=PSYMBOLS[Math.floor(Math.random()*PSYMBOLS.length)];
    p.style.left=Math.random()*100+'vw';
    p.style.animationDuration=(7+Math.random()*8)+'s';
    p.style.fontSize=(7+Math.random()*7)+'px';
    document.body.appendChild(p);
    setTimeout(()=>p.remove(),15000);
  },1000);
}
function stopVaultParticles(){
  clearInterval(particleInterval);particleInterval=null;
  document.querySelectorAll('.vault-particle').forEach(p=>p.remove());
}

// ─── CURSOR TRAIL (vault) ─────────────────────────────────────────────────────
let trailActive=false,lastTrail=0;
function startCursorTrail(){
  if(trailActive)return;trailActive=true;
  document.addEventListener('mousemove',vaultTrail);
}
function stopCursorTrail(){
  trailActive=false;document.removeEventListener('mousemove',vaultTrail);
}
function vaultTrail(e){
  const now=Date.now();if(now-lastTrail<90)return;lastTrail=now;
  if(!$('secretWrap').classList.contains('open'))return;
  const dot=document.createElement('div');
  dot.style.cssText=`position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:3px;height:3px;background:#ff2222;border-radius:50%;pointer-events:none;z-index:9998;opacity:0.5;transform:translate(-50%,-50%);transition:opacity 0.5s,transform 0.5s;`;
  document.body.appendChild(dot);
  requestAnimationFrame(()=>{dot.style.opacity='0';dot.style.transform='translate(-50%,-50%) scale(4)';});
  setTimeout(()=>dot.remove(),500);
}

// ─── HON CARD TILT ────────────────────────────────────────────────────────────
$('honHot')&&$('honHot').addEventListener('mousedown',()=>{
  const img=$('honImg');img.style.transition='transform 0.2s';img.style.transform='scale(1.04) rotate(2deg)';setTimeout(()=>img.style.transform='',300);
});
$('honNot')&&$('honNot').addEventListener('mousedown',()=>{
  const img=$('honImg');img.style.transition='transform 0.2s';img.style.transform='scale(0.96) rotate(-2deg)';setTimeout(()=>img.style.transform='',300);
});

// ─── GAME PANE ANIMATION RESET ────────────────────────────────────────────────
document.querySelectorAll('.game-tab').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const pane=$(btn.dataset.pane);
    if(pane){pane.style.animation='none';void pane.offsetWidth;pane.style.animation='';}
  });
});

// ─── VAULT OPEN/CLOSE HOOKS ───────────────────────────────────────────────────
document.getElementById('secretExit').addEventListener('click',()=>{stopCursorTrail();stopVaultParticles();});
document.getElementById('spotlightEnter').addEventListener('click',()=>{startCursorTrail();startVaultParticles();updateVaultPhotoCount();});

// ─── ENHANCED SHOW TAB (smooth scroll) ────────────────────────────────────────
function showTab(id){
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('on'));
  document.querySelectorAll('nav button[data-tab]').forEach(b=>b.classList.remove('on'));
  const el=$(id);
  if(el){el.classList.add('on');void el.offsetWidth;}
  const btn=document.querySelector(`nav button[data-tab="${id}"]`);
  if(btn)btn.classList.add('on');
  window.scrollTo({top:0,behavior:'smooth'});
}

// ╔═══════════════════════════════════════════════════════╗
// ║           ALL-OUT PREMIUM EFFECTS JS                  ║
// ╚═══════════════════════════════════════════════════════╝

// ─── PAGE CURTAIN ────────────────────────────────────────
setTimeout(()=>{
  const c=$('pageCurtain');
  if(c) c.classList.add('gone');
},1400);

// ─── CUSTOM CURSOR ───────────────────────────────────────
const cDot=$('cursorDot'), cRing=$('cursorRing');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove',e=>{
  mx=e.clientX; my=e.clientY;
  cDot.style.left=mx+'px'; cDot.style.top=my+'px';
});
(function animRing(){
  rx+=(mx-rx)*0.10; ry+=(my-ry)*0.10;
  cRing.style.left=rx+'px'; cRing.style.top=ry+'px';
  requestAnimationFrame(animRing);
})();
document.addEventListener('mousedown',e=>{
  cDot.classList.add('clicking'); cRing.classList.add('clicking');
  // click ripple
  const ripple=document.createElement('div');
  ripple.className='click-ripple'+($('secretWrap').classList.contains('open')?' vault-ripple':'');
  ripple.style.left=e.clientX+'px'; ripple.style.top=e.clientY+'px';
  document.body.appendChild(ripple);
  setTimeout(()=>ripple.remove(),500);
});
document.addEventListener('mouseup',()=>{cDot.classList.remove('clicking');cRing.classList.remove('clicking');});
document.querySelectorAll('button,a,.card,.model-tab,.game-tab,.wyr-card,.fmk-card,.draft-pick').forEach(el=>{
  el.addEventListener('mouseenter',()=>{cDot.classList.add('hover');cRing.classList.add('hover');});
  el.addEventListener('mouseleave',()=>{cDot.classList.remove('hover');cRing.classList.remove('hover');});
});

// Vault mode cursor
function setVaultCursor(on){
  cDot.classList.toggle('vault',on);
  cRing.classList.toggle('vault',on);
}
document.getElementById('secretExit').addEventListener('click',()=>setVaultCursor(false));
document.getElementById('spotlightEnter').addEventListener('click',()=>setVaultCursor(true));

// ─── MAGNETIC BUTTONS ─────────────────────────────────────
document.querySelectorAll('.game-btn.primary,.vault-btn,.model-tab,.fun-btn').forEach(btn=>{
  btn.addEventListener('mousemove',e=>{
    const r=btn.getBoundingClientRect();
    const dx=e.clientX-r.left-r.width/2;
    const dy=e.clientY-r.top-r.height/2;
    btn.style.transform=`translate(${dx*0.12}px,${dy*0.12}px)`;
  });
  btn.addEventListener('mouseleave',()=>btn.style.transform='');
});

// ─── CARD HOVER CURSOR BUTTONS ───────────────────────────
document.addEventListener('mouseenter',e=>{
  if(e.target.closest('.card')){
    cRing.classList.add('hover');
  }
},true);
document.addEventListener('mouseleave',e=>{
  if(e.target.closest('.card')){
    cRing.classList.remove('hover');
  }
},true);

// ─── IMAGE LAZY LOAD FADE ─────────────────────────────────
const imgObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      const img=entry.target;
      img.style.opacity='0';
      img.style.transition='opacity 0.4s ease, transform 0.4s ease';
      img.style.transform='scale(1.02)';
      img.onload=()=>{
        img.style.opacity='1';
        img.style.transform='scale(1)';
      };
      if(img.complete) { img.style.opacity='1'; img.style.transform='scale(1)'; }
      imgObserver.unobserve(img);
    }
  });
},{threshold:0.1});

// Observe all card images
function observeImages(){
  document.querySelectorAll('.card img,.grid img,#secretGrid img').forEach(img=>{
    if(!img.dataset.observed){
      img.dataset.observed='1';
      imgObserver.observe(img);
    }
  });
}
observeImages();
// Re-observe when grid changes
new MutationObserver(()=>observeImages()).observe(document.body,{childList:true,subtree:true});

// ─── PARALLAX CARD ON SCROLL ──────────────────────────────
window.addEventListener('scroll',()=>{
  const scrolled=window.scrollY;
  document.querySelectorAll('.card img').forEach((img,i)=>{
    const offset=(i%3-1)*0.015*scrolled;
    img.style.transform=`scale(1.08) translateY(${offset}px)`;
  });
},{ passive:true });

// ─── HOVER PREVIEW GLOW ORBS ─────────────────────────────
document.addEventListener('mousemove',e=>{
  const card=e.target.closest('.card');
  if(!card)return;
  const r=card.getBoundingClientRect();
  const x=((e.clientX-r.left)/r.width*100).toFixed(1);
  const y=((e.clientY-r.top)/r.height*100).toFixed(1);
  card.style.setProperty('--mx',x+'%');
  card.style.setProperty('--my',y+'%');
});

// ─── KEYBOARD SHORTCUTS ───────────────────────────────────
// (removed nav hotkeys)

// ─── STATS BAR COUNTER ANIMATION ─────────────────────────
function animateCount(el, target, duration=800){
  const start=0, startTime=performance.now();
  function tick(now){
    const elapsed=now-startTime;
    const progress=Math.min(elapsed/duration,1);
    const ease=1-Math.pow(1-progress,3);
    el.textContent=Math.round(start+(target-start)*ease);
    if(progress<1)requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
// trigger on first scroll into view
const sbarObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      const val=entry.target.querySelector('.val');
      if(val&&!val.dataset.animated){
        val.dataset.animated='1';
        const n=parseInt(val.textContent)||0;
        animateCount(val,n);
      }
    }
  });
},{threshold:0.5});
document.querySelectorAll('.sbar .item').forEach(item=>sbarObserver.observe(item));

// ─── VAULT SECTION TRANSITION ────────────────────────────
function showSecretSection(id){
  document.querySelectorAll('.secret-section').forEach(s=>s.classList.remove('on'));
  const el=$(id);
  if(el){ el.classList.add('on'); void el.offsetWidth; }
}

// ─── DOUBLE-CLICK LIKE ────────────────────────────────────
document.addEventListener('dblclick',e=>{
  const card=e.target.closest('.card');
  if(!card)return;
  const src=card.querySelector('img')?.src;
  if(!src)return;
  if(!state.likes.has(src)){
    toggleLike(src,card);
    spawnSparkles(e.clientX,e.clientY,!!$('secretWrap').classList.contains('open'));
    // heart burst
    const heart=document.createElement('div');
    heart.textContent='♡';
    heart.style.cssText=`position:fixed;left:${e.clientX}px;top:${e.clientY}px;font-size:40px;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);animation:sparkleFly 0.8s ease-out forwards;--dx:0px;--dy:-60px;color:var(--pink);`;
    document.body.appendChild(heart);
    setTimeout(()=>heart.remove(),800);
  }
});

// ─── AMBIENT SOUND HINT ─────────────────────────────────
// subtle visual pulse on first interaction
let firstTouch=false;
document.addEventListener('click',()=>{
  if(firstTouch)return; firstTouch=true;
  // pulse the header once
  const hdr=document.querySelector('header');
  hdr.style.transition='box-shadow 0.5s';
  hdr.style.boxShadow='0 0 60px rgba(244,167,185,0.08)';
  setTimeout(()=>hdr.style.boxShadow='',800);
},{once:true});

// ─── RANDOM AMBIENT SPARKLE ──────────────────────────────
setInterval(()=>{
  if(document.hidden)return;
  const cards=document.querySelectorAll('.grid .card');
  if(!cards.length)return;
  const card=cards[Math.floor(Math.random()*cards.length)];
  const r=card.getBoundingClientRect();
  if(r.top<0||r.bottom>window.innerHeight)return;
  const glint=document.createElement('div');
  glint.style.cssText=`position:fixed;left:${r.left+Math.random()*r.width}px;top:${r.top+Math.random()*r.height}px;width:2px;height:2px;background:rgba(244,167,185,0.7);border-radius:50%;pointer-events:none;z-index:9;animation:sparkleFly 1s ease-out forwards;--dx:${(Math.random()-0.5)*20}px;--dy:${-10-Math.random()*20}px;`;
  document.body.appendChild(glint);
  setTimeout(()=>glint.remove(),1000);
},2500);

// ╔═══════════════════════════════════════════════════════╗
// ║           EPIC NEW FEATURES — v4                      ║
// ╚═══════════════════════════════════════════════════════╝

// ─── 3D CARD TILT ─────────────────────────────────────
document.addEventListener('mousemove', e => {
  const card = e.target.closest('.card');
  if (!card) return;
  const r = card.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const dx = (e.clientX - cx) / (r.width / 2);
  const dy = (e.clientY - cy) / (r.height / 2);
  card.style.transform = `translateY(-6px) scale(1.012) rotateX(${-dy * 4}deg) rotateY(${dx * 4}deg)`;
});
document.addEventListener('mouseleave', e => {
  const card = e.target.closest('.card');
  if (card) card.style.transform = '';
}, true);
document.addEventListener('mousemove', e => {
  if (!e.target.closest('.card')) {
    document.querySelectorAll('.card').forEach(c => { if (!c.matches(':hover')) c.style.transform = ''; });
  }
});

// ─── CINEMATIC PHOTO REVEAL on hover ──────────────────
document.addEventListener('mouseover', e => {
  const card = e.target.closest('.card');
  if (!card) return;
  const img = card.querySelector('img');
  if (img && !card._glowAdded) {
    card._glowAdded = true;
    img.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1), filter 0.3s, box-shadow 0.3s';
  }
});

// ─── KEYBOARD SHORTCUTS DISPLAY ───────────────────────
{
  const shortcuts = {g:'Gallery',p:'Play',q:'Quiz',c:'Confessions',s:'Saved'};
  let hintEl = null;
  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (shortcuts[k] && !$('modalOverlay').classList.contains('open') && !$('secretWrap').classList.contains('open')) {
      if (hintEl) hintEl.remove();
      hintEl = document.createElement('div');
      hintEl.style.cssText = `position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(13,5,8,0.9);border:1px solid rgba(244,167,185,0.2);padding:8px 20px;font-family:'Cormorant Garamond',serif;font-size:13px;color:var(--pink);letter-spacing:3px;text-transform:uppercase;z-index:9999;backdrop-filter:blur(8px);animation:secIn 0.3s ease;pointer-events:none;`;
      hintEl.textContent = `→ ${shortcuts[k]}`;
      document.body.appendChild(hintEl);
      setTimeout(() => { if (hintEl) { hintEl.style.opacity='0'; hintEl.style.transition='opacity 0.3s'; setTimeout(()=>hintEl&&hintEl.remove(),300); } }, 1000);
    }
  });
}

// ─── PHOTO HOVER PEEK (show prev/next ghost) ──────────
// subtle blurred neighbor preview hint on card hover — lightweight

// ─── AMBIENT TYPING REACTIONS ─────────────────────────
const AMBIENT_REACTIONS = [
  'she ate that','not fair','BRUH','😮','okay wow','literally illegal','bye','no words','main character','🔥'];
let _lastReact = 0;
document.addEventListener('click', e => {
  if (!e.target.closest('.card')) return;
  const now = Date.now();
  if (now - _lastReact < 3000) return;
  _lastReact = now;
  const r = e.target.closest('.card').getBoundingClientRect();
  const txt = document.createElement('div');
  txt.textContent = rand(AMBIENT_REACTIONS);
  txt.style.cssText = `position:fixed;left:${r.left + r.width/2}px;top:${r.top}px;font-family:'Playfair Display',serif;font-size:15px;font-style:italic;color:var(--pink);pointer-events:none;z-index:9999;transform:translate(-50%,0);animation:sparkleFly 1.2s ease-out forwards;--dx:${(Math.random()-0.5)*60}px;--dy:-80px;white-space:nowrap;text-shadow:0 0 12px rgba(244,167,185,0.5);`;
  document.body.appendChild(txt);
  setTimeout(() => txt.remove(), 1200);
});

// ─── CURSOR TRAIL SPARKS ──────────────────────────────
let _trailFrame = 0;
document.addEventListener('mousemove', e => {
  if (++_trailFrame % 6 !== 0) return;
  if (document.hidden) return;
  const spark = document.createElement('div');
  const isVault = $('secretWrap').classList.contains('open');
  const color = isVault ? 'rgba(255,34,34,0.7)' : 'rgba(244,167,185,0.6)';
  spark.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:3px;height:3px;background:${color};border-radius:50%;pointer-events:none;z-index:99990;transform:translate(-50%,-50%);animation:sparkleFly 0.6s ease-out forwards;--dx:${(Math.random()-0.5)*12}px;--dy:${-4-Math.random()*12}px;`;
  document.body.appendChild(spark);
  setTimeout(() => spark.remove(), 600);
});

// ─── PHOTO COUNTER LIVE BADGE ─────────────────────────
// Animate in the photo count when switching model tabs
const _origBuildModelTabs = buildModelTabs;
// Already initialized — just keep the count fresh

// ─── VAULT HEARTBEAT AMBIENT PARTICLES ───────────────
setInterval(() => {
  if (!$('secretWrap').classList.contains('open')) return;
  if (document.hidden) return;
  const p = document.createElement('div');
  p.style.cssText = `position:fixed;left:${Math.random()*100}vw;bottom:0;width:1px;height:${8+Math.random()*16}px;background:rgba(255,34,34,0.15);pointer-events:none;z-index:0;animation:particleFloat ${4+Math.random()*6}s linear forwards;`;
  $('secretWrap').appendChild(p);
  setTimeout(() => p.remove(), 10000);
}, 800);

// ─── SECRET WRAP ISOLATION FIX ───────────────────────
// Ensure body scroll & ambient effects don't bleed into vault
$('secretWrap').addEventListener('scroll', e => e.stopPropagation(), { passive: true });

// ─── PAGE ENTRANCE ANIMATION UPGRADE ─────────────────
// Note: CSS already handles nav entrance via keyframes, skip JS opacity trick

// ─── SBAR HOVER EASTER EGG ────────────────────────────
$('statDanger')?.parentElement?.addEventListener('click', () => {
  toast('⚡ She knows what she does to you');
});

// ─── AUTO-FOCUS SEARCH (press /) ──────────────────────
// (removed)

// ─── LIKES MILESTONE CELEBRATION ─────────────────────
// Patched via event monitoring to avoid redeclaring toggleLike
const _likeObserver = new MutationObserver(() => {
  if (state.likes.size > 0 && state.likes.size % 10 === 0) {
    spawnSparkles(window.innerWidth/2, window.innerHeight/2, false);
    toast(`♡ ${state.likes.size} likes — you have taste`);
  }
});
// Watch the saved count badge as a proxy for like/save activity
const _scEl = $('savedCount');
if (_scEl) _likeObserver.observe(_scEl, { childList: true, characterData: true, subtree: true });

// ─── IMAGE LOAD FADE IN (no brightness tint) ─────────
document.querySelectorAll('.card img').forEach(img => {
  if (!img.complete) {
    img.style.opacity = '0';
    img.addEventListener('load', () => {
      img.style.transition = 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.4,0,0.2,1)';
      img.style.opacity = '1';
    }, { once: true });
  }
});


// ═══════════════════════════════════════════════════════════════════
//  NEW FEATURES: DOSSIER · ALIBI · RANK THE FIT · SMASH OR PASS
//                LEADERBOARD · WHO'S ONLINE · ACTIVITY FEED
// ═══════════════════════════════════════════════════════════════════

// ─── GIRL DOSSIER DATA ───────────────────────────────────────────
const DOSSIER = {
  Nya: {
    nickname: 'Naughty Nya',
    fullName: 'Nya Barnard',
    status: 'Taken — but she sleeps around',
    weakness: 'Tell her she\'s the prettiest in the room. Bite her neck. She folds.',
    threat: 9,
    addr: '1722 S Delaware Pl, Tulsa OK 74104',
    insta: '@nya.barn',
    phone: 'Unknown',
    notes: 'Dangerous. Knows exactly what she\'s doing. Has a boyfriend but that hasn\'t stopped anyone.',
  },
  Remi: {
    nickname: 'Risky Remi',
    fullName: 'Remi Barnard',
    status: 'Has a BF — flirts with everyone anyway',
    weakness: 'Compliment her smile. Get her laughing. She\'s a sucker for attention she\'s not supposed to want.',
    threat: 8,
    addr: '1722 S Delaware Pl, Tulsa OK 74104',
    insta: '@remibarn',
    phone: '918-284-8365',
    notes: 'Technically off limits. Practically not. If you make her feel seen she forgets she has a boyfriend.',
  },
  Stella: {
    nickname: 'Sweet Stella',
    fullName: 'Stella Thomas',
    status: 'Single — everyone\'s been there',
    weakness: 'Touch the small of her back. Whisper. She pretends to resist for about 30 seconds.',
    threat: 10,
    addr: '6449 S Sandusky Ave, Tulsa OK 74136',
    insta: '@stella_thomas08',
    phone: '918-998-5774',
    notes: 'Town favorite for a reason. No strings attached, no drama. Just don\'t catch feelings.',
  },
  Allie: {
    nickname: 'Angelic Allie',
    fullName: 'Allie',
    status: 'Single — reserved but lowkey flirty',
    weakness: 'Be patient. She needs to feel safe first. Once she trusts you, she\'s a completely different girl.',
    threat: 7,
    addr: 'Tulsa, Oklahoma',
    insta: 'Unknown',
    phone: 'Unknown',
    notes: 'Acts innocent. Isn\'t. Takes longer to crack but once you do — worth every second.',
  },
  Rileigh: {
    nickname: 'Reckless Rileigh',
    fullName: 'Rileigh Sowards',
    status: 'Single — runs Sapulpa like she owns it',
    weakness: 'Drive out to her. Show up unexpected. She acts annoyed, she\'s not.',
    threat: 9,
    addr: '320 N 14th St, Sapulpa OK',
    insta: '@rileigh_l_s',
    phone: '918-261-6532',
    notes: 'Sapulpa\'s worst kept secret. She knows everyone and everyone knows her. Unpredictable in the best way.',
  },
  Macy: {
    nickname: 'Mischievous Macy',
    fullName: 'Macy Cox',
    status: 'Taken — dating a big guy, good luck',
    weakness: 'She likes feeling wanted even if she can\'t act on it. Make her feel like the main character.',
    threat: 8,
    addr: 'Tulsa, Oklahoma',
    insta: '@addison_and_macy',
    phone: '918-805-3623',
    notes: 'Has a man. A big one. But she still likes attention and isn\'t exactly quiet about it.',
  },
};

function buildDossier() {
  const tabs = $('dossierTabs'); if (!tabs) return;
  const card = $('dossierCard');
  const girls = Object.keys(DOSSIER);
  tabs.innerHTML = girls.map(g => `<button class="dossier-tab" data-girl="${g}">${g}</button>`).join('');
  function showDossier(girl) {
    const d = DOSSIER[girl];
    const stars = '⚡'.repeat(d.threat) + '·'.repeat(10 - d.threat);
    card.innerHTML = `
      <div class="dossier-header">
        <div class="dossier-nickname">${d.nickname}</div>
        <div class="dossier-fullname">${d.fullName}</div>
      </div>
      <div class="dossier-row"><span class="dossier-label">STATUS</span><span class="dossier-val">${d.status}</span></div>
      <div class="dossier-row"><span class="dossier-label">WEAKNESS</span><span class="dossier-val dossier-weakness">${d.weakness}</span></div>
      <div class="dossier-row"><span class="dossier-label">THREAT LEVEL</span><span class="dossier-val dossier-threat">${stars} ${d.threat}/10</span></div>
      <div class="dossier-row"><span class="dossier-label">ADDRESS</span><span class="dossier-val">📍 ${d.addr}</span></div>
      <div class="dossier-row"><span class="dossier-label">INSTAGRAM</span><span class="dossier-val">📸 ${d.insta}</span></div>
      <div class="dossier-row"><span class="dossier-label">PHONE</span><span class="dossier-val">📞 ${d.phone}</span></div>
      <div class="dossier-notes">"${d.notes}"</div>
    `;
    tabs.querySelectorAll('.dossier-tab').forEach(t => t.classList.toggle('on', t.dataset.girl === girl));
  }
  tabs.querySelectorAll('.dossier-tab').forEach(t => t.addEventListener('click', () => showDossier(t.dataset.girl)));
  showDossier(girls[0]);
}
buildDossier();

// ─── ALIBI GAME ──────────────────────────────────────────────────
const ALIBI_SCENARIOS = [
  { prompt: "It's 2:47am. Your phone lights up. Who is it?", type: 'pick1' },
  { prompt: "You got one night, no consequences, no one finds out. Who are you calling?", type: 'pick1' },
  { prompt: "You're stuck in a hotel room for 24 hours with no wifi. Who do you want in that room?", type: 'pick1' },
  { prompt: "She texts you 'come over, parents are gone.' Who do you drop everything for?", type: 'pick1' },
  { prompt: "You're driving around at midnight. Who's in the passenger seat?", type: 'pick1' },
  { prompt: "One of them is your alibi for the whole night. Who do you trust to cover for you?", type: 'pick1' },
  { prompt: "She's sending texts she shouldn't be sending. Who's in your inbox right now?", type: 'pick1' },
  { prompt: "Last person you see before everything goes sideways. Who is it?", type: 'pick1' },
  { prompt: "She wants to sneak out. You're the getaway driver. Who are you picking up?", type: 'pick1' },
  { prompt: "You wake up and she's still there. Who do you not mind seeing at 7am?", type: 'pick1' },
  { prompt: "Who's the one you'd actually delete the texts for?", type: 'pick1' },
  { prompt: "She invites you to her place when her man is out of town. Who just texted?", type: 'pick1' },
  { prompt: "You've got 30 minutes before someone gets home. Who are you with?", type: 'pick1' },
  { prompt: "Which one has you checking your phone every 5 minutes?", type: 'pick1' },
  { prompt: "She calls crying at 1am. Who do you actually get up for?", type: 'pick1' },
  { prompt: "You can only save one contact. Who stays in your phone?", type: 'pick1' },
  { prompt: "Who are you texting right now that you probably shouldn't be?", type: 'pick1' },
  { prompt: "She says 'I won't tell anyone.' Who do you believe?", type: 'pick1' },
  { prompt: "Who's the one you'd risk it all for, no questions asked?", type: 'pick1' },
  { prompt: "Last call of the night. Who picks up?", type: 'pick1' },
];

const ALIBI_REACTIONS = {
  Nya: ["bold choice, her bf is right there 💀", "naughty nya living up to the name", "you're brave fr", "she'll say yes but deny it tomorrow"],
  Remi: ["her boyfriend is gonna find out lmao", "risky remi doing what she does", "you're not the first. won't be the last.", "she flirts back every time tho ngl"],
  Stella: ["classic. everyone picks stella.", "stella season never ends", "honestly the correct answer", "no judgment. everyone already knows."],
  Allie: ["she's quieter about it but don't be fooled", "angelic allie... sure", "she's gonna make you work for it", "reserved in public, different story in private"],
  Rileigh: ["sapulpa to tulsa for this one huh", "reckless rileigh, no surprise", "she's already on her way", "she acts annoyed but she's not"],
  Macy: ["bro her man is BUILT 💀", "mischievous macy loves the attention", "she's taken but she loves feeling wanted", "bold. very bold."],
};

let alibiIdx = 0;
const alibiOrder = shuffle([...Array(ALIBI_SCENARIOS.length).keys()]);

function buildAlibi() {
  const arena = $('alibiArena'); if (!arena) return;
  const sc = ALIBI_SCENARIOS[alibiOrder[alibiIdx % alibiOrder.length]];
  $('alibiScenario').textContent = sc.prompt;
  $('alibiReaction').textContent = '';
  const girls = Object.keys(DOSSIER);
  arena.innerHTML = girls.map(g => `
    <button class="alibi-btn" data-girl="${g}">
      <div class="alibi-name">${DOSSIER[g].nickname}</div>
      <div class="alibi-sub">${g}</div>
    </button>`).join('');
  arena.querySelectorAll('.alibi-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = btn.dataset.girl;
      const reactions = ALIBI_REACTIONS[g] || ["interesting choice..."];
      $('alibiReaction').textContent = rand(reactions);
      arena.querySelectorAll('.alibi-btn').forEach(b => b.classList.remove('picked'));
      btn.classList.add('picked');
      addDangerScore(g, 2);
    });
  });
}
$('alibiNext') && $('alibiNext').addEventListener('click', () => { alibiIdx++; buildAlibi(); });
buildAlibi();

// ─── RANK THE FIT ────────────────────────────────────────────────
let rankfitCurrent = [];
function buildRankFit() {
  const pool = $('rankfitPool'); const slots = $('rankfitSlots');
  if (!pool || !slots) return;
  if (!SECRET_PHOTOS.length) { pool.innerHTML = '<p style="color:#8a3030;text-align:center">No vault photos yet</p>'; return; }
  rankfitCurrent = shuffle(SECRET_PHOTOS).slice(0, 6);
  pool.innerHTML = rankfitCurrent.map((p, i) => `
    <div class="rankfit-item" draggable="true" data-idx="${i}">
      <img src="${p.src}" alt="">
      <div class="rankfit-label">${p.model}</div>
    </div>`).join('');
  slots.innerHTML = Array.from({length: rankfitCurrent.length}, (_, i) => `
    <div class="rankfit-slot" data-rank="${i+1}">
      <div class="rankfit-rank">#${i+1}</div>
      <div class="rankfit-drop-area">Drop here</div>
    </div>`).join('');
  // drag events
  let dragging = null;
  pool.querySelectorAll('.rankfit-item').forEach(item => {
    item.addEventListener('dragstart', () => { dragging = item; item.classList.add('dragging'); });
    item.addEventListener('dragend', () => { item.classList.remove('dragging'); dragging = null; });
  });
  slots.querySelectorAll('.rankfit-slot').forEach(slot => {
    slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('over'); });
    slot.addEventListener('dragleave', () => slot.classList.remove('over'));
    slot.addEventListener('drop', e => {
      e.preventDefault(); slot.classList.remove('over');
      if (!dragging) return;
      const drop = slot.querySelector('.rankfit-drop-area');
      if (slot.querySelector('.rankfit-item')) {
        // swap back to pool
        pool.appendChild(slot.querySelector('.rankfit-item'));
      }
      drop.textContent = '';
      drop.appendChild(dragging);
    });
  });
}
$('rankfitShuffle') && $('rankfitShuffle').addEventListener('click', buildRankFit);
buildRankFit();

// ─── SMASH OR PASS ───────────────────────────────────────────────
const smpScores = {};
let smpPool = [], smpIdx = 0;
function smpInit() {
  if (!SECRET_PHOTOS.length) return;
  smpPool = shuffle(SECRET_PHOTOS);
  smpIdx = 0;
  smpNext();
}
function smpNext() {
  if (!smpPool.length) return;
  const photo = smpPool[smpIdx % smpPool.length];
  $('smpImg').src = photo.src;
  $('smpOverlay').textContent = '';
  $('smpOverlay').className = 'hon-overlay';
  renderSmpLeaderboard();
}
function smpVote(vote, photo) {
  const key = photo.model;
  if (!smpScores[key]) smpScores[key] = { smash: 0, pass: 0 };
  smpScores[key][vote]++;
  $('smpOverlay').textContent = vote === 'smash' ? '💋 SMASH' : '✗ PASS';
  $('smpOverlay').classList.add(vote === 'smash' ? 'hot' : 'not');
  addDangerScore(photo.src, vote === 'smash' ? 4 : 0);
  setTimeout(() => { smpIdx++; smpNext(); }, 700);
  renderSmpLeaderboard();
}
function renderSmpLeaderboard() {
  const lb = $('smpLeaderboard'); if (!lb) return;
  const girls = Object.keys(smpScores).sort((a, b) => (smpScores[b].smash||0) - (smpScores[a].smash||0));
  if (!girls.length) { lb.innerHTML = ''; return; }
  lb.innerHTML = '<div style="font-size:9px;letter-spacing:3px;color:#8a3030;margin-bottom:10px;text-transform:uppercase">Smash Rate</div>' +
    girls.map(g => {
      const s = smpScores[g]; const total = s.smash + s.pass;
      const pct = total ? Math.round(s.smash / total * 100) : 0;
      return `<div class="smp-row"><span class="smp-name">${g}</span><div class="smp-bar-wrap"><div class="smp-bar" style="width:${pct}%"></div></div><span class="smp-pct">${pct}%</span></div>`;
    }).join('');
}
$('smpSmash') && $('smpSmash').addEventListener('click', () => { const p = smpPool[smpIdx % smpPool.length]; if(p) smpVote('smash', p); });
$('smpPass') && $('smpPass').addEventListener('click', () => { const p = smpPool[smpIdx % smpPool.length]; if(p) smpVote('pass', p); });
smpInit();

// ─── LEADERBOARD ─────────────────────────────────────────────────
function buildLeaderboard() {
  const el = $('leaderboardList'); if (!el) return;
  // Count likes per model from state.likes (src-based)
  const counts = {};
  Object.keys(DOSSIER).forEach(g => counts[g] = 0);
  state.likes.forEach(src => {
    const photo = SECRET_PHOTOS.find(p => p.src === src);
    if (photo && counts[photo.model] !== undefined) counts[photo.model]++;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣'];
  el.innerHTML = sorted.map(([girl, count], i) => `
    <div class="lb-row">
      <span class="lb-medal">${medals[i]||'·'}</span>
      <span class="lb-name">${DOSSIER[girl]?.nickname||girl}</span>
      <div class="lb-bar-wrap"><div class="lb-bar" style="width:${count ? Math.min(count*10,100) : 2}%"></div></div>
      <span class="lb-count">${count} like${count!==1?'s':''}</span>
    </div>`).join('');
}

// ─── WHO'S ONLINE ────────────────────────────────────────────────
const ONLINE_GIRLS = ['Nya','Remi','Stella','Allie','Rileigh','Macy'];
function updateOnlineIndicator() {
  const el = $('onlineIndicator'); if (!el) return;
  const active = rand(ONLINE_GIRLS);
  el.innerHTML = `<span class="online-dot"></span><span class="online-name">● ${active} is active</span>`;
  el.title = `${active} was last seen recently`;
}
updateOnlineIndicator();
setInterval(updateOnlineIndicator, 12000);

// ─── ACTIVITY FEED ───────────────────────────────────────────────
const FEED_USERS = [
  'jackson_918','cruz_t','jaquavion','tulsaguy88','anonymous_okc','918_lurker',
  'deadass_tulsa','realmvp_ok','notabot_918','Xander_T','bro_real_talk',
  'yungbull_ok','tulsa_finest','cruisin_ok','osu_fan_real','ghost_user_918',
  'oklahoma_kid','no_cap_918','Dre_local','BigMike_T','JayFromJenks',
  'southside_ok','BradleyP','NateDogg_T','StreetLevel918',
];
const FEED_ACTIONS = [
  g => `liked ${DOSSIER[g]?.fullName||g}'s photo at ${rand(['midnight','1am','2am','3am','late last night','this morning'])}`,
  g => `saved ${g} to their private collection`,
  g => `viewed ${DOSSIER[g]?.fullName||g}'s full gallery`,
  g => `rated ${g} ${rand(['9/10','10/10','easily a 10','dangerous/10','way too high/10'])}`,
  g => `matched ${g}'s vibe on the alibi game`,
  g => `picked ${g} for the 2am scenario`,
  g => `smashed on ${DOSSIER[g]?.fullName||g} without hesitation`,
  g => `spent ${rand(['8','12','20','35','47'])} minutes on ${g}'s photos`,
  g => `put ${g} in S tier. immediately.`,
  g => `looked up ${DOSSIER[g]?.addr||'Tulsa'} after seeing ${g}'s photos`,
  g => `screenshot ${g}'s page (allegedly)`,
  g => `drafted ${g} as their #1 pick`,
  g => `said ${g} is "${rand(['untouchable','a problem','the one','dangerous','illegal','a 10 every time'])}"`,
  g => `ran stalker mode on ${g} for ${rand(['3','5','8','12','20'])} minutes straight`,
  g => `checked ${DOSSIER[g]?.insta||'her insta'} after seeing the vault`,
  g => `rewound ${g}'s gallery ${rand(['twice','three times','four times','too many times'])}`,
  g => `called ${DOSSIER[g]?.phone||'her number'} — no answer (probably for the best)`,
  g => `gave ${g} a danger score of ${rand(['47','62','89','94','100'])}`,
  g => `voted ${g} Most Wanted this session`,
  g => `debated between ${g} and ${rand(ONLINE_GIRLS.filter(x=>x!==g))} for 10 minutes`,
];

const FEED_TIMESTAMPS = [
  'just now', '1m ago', '2m ago', '3m ago', '5m ago', '7m ago',
  '9m ago', '11m ago', '14m ago', '18m ago', '22m ago', '28m ago',
  '34m ago', '41m ago', '49m ago', '58m ago', '1h ago', '1h 12m ago',
];

let feedEntries = [];
function generateFeedEntry() {
  const user = rand(FEED_USERS);
  const girl = rand(ONLINE_GIRLS);
  const action = rand(FEED_ACTIONS)(girl);
  const time = rand(FEED_TIMESTAMPS);
  return { user, action, time };
}
function buildFeed() {
  const wrap = $('feedWrap'); if (!wrap) return;
  // seed with 30 entries
  feedEntries = Array.from({length: 30}, generateFeedEntry);
  renderFeed();
}
function renderFeed() {
  const wrap = $('feedWrap'); if (!wrap) return;
  wrap.innerHTML = feedEntries.map(e => `
    <div class="feed-entry">
      <div class="feed-user">${e.user}</div>
      <div class="feed-action">${e.action}</div>
      <div class="feed-time">${e.time}</div>
    </div>`).join('');
}
function pushFeedEntry(girl, actionFn) {
  const user = rand(FEED_USERS);
  const action = actionFn ? actionFn(girl) : rand(FEED_ACTIONS)(girl);
  feedEntries.unshift({ user, action, time: 'just now' });
  if (feedEntries.length > 60) feedEntries.pop();
  // age previous entries
  feedEntries.forEach((e, i) => {
    if (i > 0) e.time = FEED_TIMESTAMPS[Math.min(i, FEED_TIMESTAMPS.length-1)];
  });
  const wrap = $('feedWrap');
  if (wrap && $('sfeed').classList.contains('on')) renderFeed();
}
// Auto-push new entries every ~15-25s when feed is open
setInterval(() => {
  if (!$('secretWrap')?.classList.contains('open')) return;
  const girl = rand(ONLINE_GIRLS);
  pushFeedEntry(girl);
}, Math.random() * 10000 + 15000);

buildFeed();

// refresh leaderboard and feed when those sections open
const _origShowSecretSection = showSecretSection;
function showSecretSection(id) {
  document.querySelectorAll('.secret-section').forEach(s => s.classList.remove('on'));
  const el = $(id);
  if (el) { el.classList.add('on'); void el.offsetWidth; }
  if (id === 'sleaderboard') buildLeaderboard();
  if (id === 'sfeed') renderFeed();
  if (id === 'sdossier') buildDossier();
  if (id === 'salibi') buildAlibi();
  if (id === 'srankfit') buildRankFit();
  if (id === 'ssmashpass') smpInit();
}


// ═══════════════════════════════════════════════════════════════
//  PHASE 2: CAUGHT SLIPPING · LAST SEEN · SECRET NOTES
//           PHOTO OF THE DAY · MATCH CALC · COMPARE · LIVE FEED
// ═══════════════════════════════════════════════════════════════

// ─── CAUGHT SLIPPING ────────────────────────────────────────────
const CAUGHT_CAPTIONS = [
  g => `caught ${DOSSIER[g]?.fullName||g} being way too fine for a Tuesday`,
  g => `${DOSSIER[g]?.fullName||g} said don't post this. posted it anyway.`,
  g => `she doesn't know this is saved`,
  g => `${DOSSIER[g]?.nickname||g} doing what she does best`,
  g => `this one lives rent free`,
  g => `the reason you can't focus`,
  g => `she looked up and this happened`,
  g => `not supposed to exist but here we are`,
  g => `${DOSSIER[g]?.fullName||g} slipping again 🔴`,
  g => `the boys are not ready`,
];
const CAUGHT_TIMES = ['2m ago','5m ago','8m ago','12m ago','just now','4m ago','6m ago'];
const CAUGHT_USERNAMES = {
  Nya: 'nya.barn', Remi: 'remibarn', Stella: 'stella_thomas08',
  Allie: 'allie__ok', Rileigh: 'rileigh_l_s', Macy: 'addison_and_macy',
};

function showCaughtSlipping() {
  if (!$('secretWrap')?.classList.contains('open')) return;
  if (!SECRET_PHOTOS.length) return;
  const photo = rand(SECRET_PHOTOS);
  const girl = photo.model;
  const d = DOSSIER[girl] || {};
  let overlay = $('caughtSlipping');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'caughtSlipping';
    overlay.className = 'caught-slipping';
    overlay.innerHTML = `
      <div class="caught-phone-frame">
        <div class="caught-status-bar">
          <span id="caughtTime"></span>
          <span>●●●●● 5G 🔋</span>
        </div>
        <div class="caught-story-bar"><div class="caught-story-progress" id="caughtProgress"></div></div>
        <div class="caught-story-header">
          <div class="caught-avatar"><img id="caughtAvatar" src="" alt=""></div>
          <div>
            <div class="caught-username" id="caughtUsername"></div>
            <div class="caught-time-ago" id="caughtTimeAgo"></div>
          </div>
        </div>
        <img class="caught-img" id="caughtImg" src="" alt="">
        <div class="caught-caption" id="caughtCaption"></div>
        <button class="caught-close" id="caughtClose">✕</button>
      </div>`;
    document.body.appendChild(overlay);
    $('caughtClose').addEventListener('click', () => overlay.classList.remove('show'));
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('show'); });
  }
  // reset progress bar
  const prog = $('caughtProgress');
  prog.style.animation = 'none';
  void prog.offsetWidth;
  prog.style.animation = 'storyProgress 6s linear forwards';
  // fill data
  const now = new Date();
  $('caughtTime').textContent = now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  $('caughtUsername').textContent = CAUGHT_USERNAMES[girl] || girl.toLowerCase();
  $('caughtTimeAgo').textContent = rand(CAUGHT_TIMES);
  $('caughtImg').src = photo.src;
  $('caughtAvatar').src = photo.src;
  $('caughtCaption').textContent = rand(CAUGHT_CAPTIONS)(girl);
  overlay.classList.add('show');
  addDangerScore(photo.src, 3);
  // auto-dismiss after 6s
  setTimeout(() => overlay?.classList.remove('show'), 6000);
}
// trigger every 60-90 seconds while vault is open
function scheduleCaughtSlipping() {
  const delay = 60000 + Math.random() * 30000;
  setTimeout(() => {
    showCaughtSlipping();
    scheduleCaughtSlipping();
  }, delay);
}
scheduleCaughtSlipping();

// ─── LAST SEEN ───────────────────────────────────────────────────
const LAST_SEEN_DATA = {
  Nya: [
    { place: 'QuikTrip on S Memorial Dr', when: '14 min ago' },
    { place: 'Brookside Starbucks', when: '32 min ago' },
    { place: 'Gathering Place parking lot', when: '1h ago' },
    { place: 'Utica Square', when: '2h ago' },
    { place: 'Home — 1722 S Delaware Pl', when: 'last night, 11:48pm' },
  ],
  Remi: [
    { place: 'Walmart on 71st', when: '8 min ago' },
    { place: 'Panera on Yale Ave', when: '45 min ago' },
    { place: 'OSU Tulsa campus', when: '2h ago' },
    { place: 'McNellie\'s Pub', when: 'last night, 1:12am' },
    { place: 'Home — 1722 S Delaware Pl', when: 'this morning, 9am' },
  ],
  Stella: [
    { place: 'Florence Park', when: '22 min ago' },
    { place: 'Cheesecake Factory on 71st', when: '1h ago' },
    { place: 'Someone\'s place on S Sandusky', when: 'last night, 12:30am' },
    { place: 'Reasor\'s on 61st', when: '3h ago' },
    { place: 'Midtown bar crawl', when: 'Friday night — all of it' },
  ],
  Allie: [
    { place: 'Tulsa Community College', when: '1h ago' },
    { place: 'Target on 71st', when: '3h ago' },
    { place: 'Route 66 area', when: 'yesterday afternoon' },
  ],
  Rileigh: [
    { place: 'Dollar General, Sapulpa', when: '6 min ago' },
    { place: 'Creek County Courthouse area', when: '1h ago' },
    { place: 'BP station off Hwy 66, Sapulpa', when: '2h ago' },
    { place: '320 N 14th St', when: 'this morning' },
    { place: 'Tulsa — someone drove her', when: 'last night, late' },
  ],
  Macy: [
    { place: 'Utica Square', when: '18 min ago' },
    { place: 'Chick-fil-A on Peoria', when: '1h ago' },
    { place: 'Her man\'s place', when: 'last night — all night' },
    { place: 'Planet Fitness on 41st', when: 'this morning, 7am' },
    { place: 'Woodland Hills Mall', when: 'yesterday' },
  ],
};

function buildLastSeen() {
  const el = $('lastSeenList'); if (!el) return;
  const girls = Object.keys(LAST_SEEN_DATA);
  el.innerHTML = girls.map(g => {
    const locs = LAST_SEEN_DATA[g];
    const current = rand(locs);
    return `
      <div class="lastseen-entry">
        <div class="lastseen-dot"></div>
        <div class="lastseen-detail">
          <div class="lastseen-name">${DOSSIER[g]?.fullName||g}</div>
          <div class="lastseen-location">📍 ${current.place}</div>
          <div class="lastseen-when">${current.when}</div>
        </div>
      </div>`;
  }).join('');
}

// ─── SECRET NOTES ────────────────────────────────────────────────
let secretNotes = [];
function buildSecretNotes() {
  const container = $('notesContainer'); if (!container) return;
  const wall = $('notesWall');
  renderNotes();
}
function renderNotes() {
  const wall = $('notesWall'); if (!wall) return;
  if (!secretNotes.length) { wall.innerHTML = '<p style="color:#5a2020;font-style:italic;text-align:center;padding:20px">No notes yet. Write something.</p>'; return; }
  wall.innerHTML = secretNotes.map((n, i) => `
    <div class="note-card">
      <button class="note-delete" onclick="deleteNote(${i})">✕</button>
      <div class="note-girl">re: ${n.girl}</div>
      <div class="note-text">${n.text}</div>
      <div class="note-time">${n.time}</div>
    </div>`).join('');
}
function deleteNote(i) { secretNotes.splice(i, 1); renderNotes(); }
function submitNote() {
  const sel = $('noteGirlSelect'); const inp = $('noteInput');
  if (!sel || !inp || !inp.value.trim()) return;
  secretNotes.unshift({ girl: sel.value, text: inp.value.trim(), time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) });
  inp.value = '';
  renderNotes();
}
// global so onclick works
window.deleteNote = deleteNote;

// ─── PHOTO OF THE DAY ────────────────────────────────────────────
function buildPhotoOfTheDay() {
  if (!PHOTOS.length) return;
  const potd = rand(PHOTOS);
  let banner = $('potdBanner');
  if (!banner) return;
  banner.innerHTML = `
    <img class="potd-img" src="${potd.src}" alt="">
    <div class="potd-overlay">
      <div class="potd-label">✦ Photo of the Day</div>
      <div class="potd-name">${potd.name}</div>
      <div class="potd-model">${potd.model}</div>
    </div>`;
  banner.classList.add('show');
}

// ─── MATCH CALCULATOR ────────────────────────────────────────────
const MATCH_QUESTIONS = [
  {
    q: "What gets your attention first?",
    opts: [
      { text: "Her eyes", scores: { Allie: 3, Rileigh: 2 } },
      { text: "Her body", scores: { Stella: 3, Macy: 2, Nya: 1 } },
      { text: "Her energy", scores: { Remi: 3, Rileigh: 2 } },
      { text: "The way she carries herself", scores: { Nya: 3, Stella: 2 } },
    ]
  },
  {
    q: "What's your vibe on a Friday night?",
    opts: [
      { text: "Out somewhere loud", scores: { Stella: 3, Rileigh: 2, Macy: 1 } },
      { text: "Someone's house, no strangers", scores: { Remi: 3, Nya: 2 } },
      { text: "Drive around, no plan", scores: { Rileigh: 3, Allie: 2 } },
      { text: "Staying in", scores: { Allie: 3, Macy: 2 } },
    ]
  },
  {
    q: "What would get you caught slipping?",
    opts: [
      { text: "A girl who knows she's hot and owns it", scores: { Stella: 3, Nya: 2 } },
      { text: "A girl who's technically taken", scores: { Remi: 3, Macy: 2 } },
      { text: "A girl from a small town", scores: { Rileigh: 3 } },
      { text: "A girl who seems innocent", scores: { Allie: 3, Remi: 1 } },
    ]
  },
  {
    q: "Red flag that you'd ignore anyway:",
    opts: [
      { text: "She has a boyfriend", scores: { Remi: 3, Macy: 3 } },
      { text: "She's been with half the city", scores: { Stella: 3, Rileigh: 2 } },
      { text: "She's unpredictable", scores: { Rileigh: 3, Nya: 2 } },
      { text: "She plays innocent but isn't", scores: { Allie: 3, Remi: 1 } },
    ]
  },
  {
    q: "She texts you at 1am. What do you want it to say?",
    opts: [
      { text: "\"come over\"", scores: { Stella: 3, Rileigh: 2 } },
      { text: "\"I can't stop thinking about you\"", scores: { Nya: 3, Allie: 2 } },
      { text: "\"don't tell anyone\"", scores: { Remi: 3, Macy: 3 } },
      { text: "\"pick me up\"", scores: { Rileigh: 3, Macy: 1 } },
    ]
  },
];

const MATCH_RESULTS = {
  Nya: "You want someone who's a little dangerous but acts sweet. You like knowing there's something underneath that no one else gets to see. Nya will have you checking your phone every 5 minutes and you'll do it gladly.",
  Remi: "You like what you can't fully have. The thrill of the situation is the whole point for you. Risky Remi fits exactly that — she's flirty, she's fun, and technically off limits. You don't care.",
  Stella: "No games, no excuses — you just want the real thing. Stella's the move for someone who knows exactly what they want and doesn't pretend otherwise. Town favorite for a reason.",
  Allie: "You're patient. You don't want something handed to you — you want to earn it. Allie takes time but once she trusts you, she's a completely different girl. You'd be into every second of that.",
  Rileigh: "You're drawn to chaos. Sapulpa's finest, unpredictable, unbothered — Rileigh is the kind of girl you drive 30 minutes for at midnight and somehow think it was a good idea every single time.",
  Macy: "You want something you technically shouldn't have and you're fine with that. Macy loves attention even when she can't act on it. You'd be the reason she's smiling at her phone. Her man doesn't need to know.",
};

let matchAnswers = {};
let matchCurrentQ = 0;

function buildMatchCalc() {
  const container = $('matchContainer'); if (!container) return;
  matchAnswers = {};
  matchCurrentQ = 0;
  renderMatchQuestion();
}
function renderMatchQuestion() {
  const container = $('matchContainer'); if (!container) return;
  if (matchCurrentQ >= MATCH_QUESTIONS.length) { showMatchResult(); return; }
  const q = MATCH_QUESTIONS[matchCurrentQ];
  const progress = Math.round((matchCurrentQ / MATCH_QUESTIONS.length) * 100);
  container.innerHTML = `
    <div style="height:2px;background:rgba(244,167,185,0.1);margin-bottom:24px;border-radius:2px">
      <div style="height:100%;width:${progress}%;background:linear-gradient(90deg,var(--pink),var(--gold));border-radius:2px;transition:width 0.4s ease"></div>
    </div>
    <div class="match-q">
      <div class="match-q-text">${q.q}</div>
      <div class="match-options">
        ${q.opts.map((o, i) => `<button class="match-opt" onclick="pickMatchOpt(${i})">${o.text}</button>`).join('')}
      </div>
    </div>`;
}
function pickMatchOpt(i) {
  const q = MATCH_QUESTIONS[matchCurrentQ];
  const opt = q.opts[i];
  Object.entries(opt.scores).forEach(([girl, pts]) => {
    matchAnswers[girl] = (matchAnswers[girl] || 0) + pts;
  });
  matchCurrentQ++;
  renderMatchQuestion();
}
function showMatchResult() {
  const container = $('matchContainer'); if (!container) return;
  const sorted = Object.entries(matchAnswers).sort((a, b) => b[1] - a[1]);
  const [topGirl, topScore] = sorted[0] || ['Stella', 5];
  const maxPossible = MATCH_QUESTIONS.reduce((sum, q) => sum + Math.max(...q.opts.map(o => o.scores[topGirl]||0)), 0) || 1;
  const pct = Math.min(Math.round((topScore / maxPossible) * 100), 99);
  const d = DOSSIER[topGirl] || {};
  container.innerHTML = `
    <div class="match-result show">
      <div style="font-size:10px;letter-spacing:4px;color:var(--muted);margin-bottom:16px;text-transform:uppercase">Your match is</div>
      <div class="match-result-name">${d.nickname || topGirl}</div>
      <div class="match-result-pct">${pct}%</div>
      <div class="match-result-why">${MATCH_RESULTS[topGirl] || 'She\'s your type. You already knew.'}</div>
      <button class="game-btn primary" onclick="buildMatchCalc()">Retake →</button>
    </div>`;
}
window.pickMatchOpt = pickMatchOpt;

// ─── COMPARE TWO GIRLS ───────────────────────────────────────────
const COMPARE_STATS = [
  { label: 'Threat Level', key: 'threat', fmt: v => `${v}/10` },
  { label: 'Status', key: 'status', fmt: v => v },
  { label: 'Weakness', key: 'weakness', fmt: v => v },
  { label: 'Location', key: 'addr', fmt: v => `📍 ${v}` },
  { label: 'Instagram', key: 'insta', fmt: v => `📸 ${v}` },
  { label: 'Phone', key: 'phone', fmt: v => `📞 ${v}` },
  { label: 'Intel', key: 'notes', fmt: v => v },
];
function buildCompare() {
  const wrap = $('compareWrap'); if (!wrap) return;
  const girls = Object.keys(DOSSIER);
  wrap.innerHTML = `
    <div class="compare-selects">
      <select class="compare-sel" id="compareA">${girls.map(g => `<option value="${g}">${g}</option>`).join('')}</select>
      <span style="color:#8a3030;align-self:center;font-size:18px">vs</span>
      <select class="compare-sel" id="compareB">${girls.map((g,i) => `<option value="${g}" ${i===1?'selected':''}>${g}</option>`).join('')}</select>
      <button class="game-btn vault-btn" onclick="renderCompare()">Compare →</button>
    </div>
    <div id="compareTable"></div>`;
}
function renderCompare() {
  const a = $('compareA')?.value; const b = $('compareB')?.value;
  if (!a || !b || a === b) { toast('Pick two different girls'); return; }
  const da = DOSSIER[a]; const db = DOSSIER[b];
  const rows = COMPARE_STATS.map(s => {
    const va = da[s.key]; const vb = db[s.key];
    const aWins = s.key === 'threat' && va > vb;
    const bWins = s.key === 'threat' && vb > va;
    return `<tr>
      <td>${s.label}</td>
      <td class="${aWins?'compare-winner':''}">${va ? s.fmt(va) : '—'}</td>
      <td class="${bWins?'compare-winner':''}">${vb ? s.fmt(vb) : '—'}</td>
    </tr>`;
  }).join('');
  $('compareTable').innerHTML = `
    <table class="compare-table">
      <thead><tr><th></th><th>${DOSSIER[a].nickname||a}</th><th>${DOSSIER[b].nickname||b}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}
window.renderCompare = renderCompare;

// ─── LIVE FEED NOTIFICATION (bottom-right) ───────────────────────
let feedNotifEl = null;
let feedNotifQueue = [];
let feedNotifRunning = false;

function initFeedNotif() {
  feedNotifEl = document.createElement('div');
  feedNotifEl.className = 'feed-notif';
  feedNotifEl.id = 'feedNotif';
  document.body.appendChild(feedNotifEl);
  // seed queue with shuffled entries
  feedNotifQueue = shuffle([...feedEntries]);
  runFeedNotif();
}

function runFeedNotif() {
  if (!feedNotifEl) return;
  if (!$('secretWrap')?.classList.contains('open')) {
    setTimeout(runFeedNotif, 3000); return;
  }
  // pick next entry
  if (!feedNotifQueue.length) feedNotifQueue = shuffle(generateFeedBatch(40));
  const entry = feedNotifQueue.shift();
  feedNotifEl.innerHTML = `
    <div class="feed-notif-user">${entry.user}</div>
    <div class="feed-notif-action">${entry.action}</div>
    <div class="feed-notif-time">just now</div>`;
  feedNotifEl.classList.remove('hide');
  feedNotifEl.classList.add('show');
  // hide after 4s, wait 20s total between notifications
  setTimeout(() => {
    feedNotifEl.classList.add('hide');
    feedNotifEl.classList.remove('show');
    setTimeout(runFeedNotif, 16000);
  }, 4000);
}

function generateFeedBatch(n) {
  return Array.from({length: n}, () => {
    const girl = rand(ONLINE_GIRLS);
    return { user: rand(FEED_USERS), action: rand(FEED_ACTIONS)(girl), time: 'just now' };
  });
}

// init feed notif after vault opens
const _origOpenVault2 = openVault;
function openVault() {
  _origOpenVault2();
  if (!feedNotifEl) setTimeout(initFeedNotif, 2000);
}

// ─── WIRE UP NEW SECTIONS ────────────────────────────────────────
// Override showSecretSection again to also init new sections
const _origSSS2 = showSecretSection;
function showSecretSection(id) {
  _origSSS2(id);
  if (id === 'slastseen') buildLastSeen();
  if (id === 'snotes') buildSecretNotes();
  if (id === 'scompare') buildCompare();
  if (id === 'smatch') buildMatchCalc();
}

// build photo of the day on main site load
buildPhotoOfTheDay();

// ═══════════════════════════════════════════════════════════════
//  SHE SAID · GROUP CHAT · POLL OF THE DAY
//  STALKER SPEED SLIDER · STALKER FILTER · SHE'S WATCHING
// ═══════════════════════════════════════════════════════════════

// ─── SHE SAID (true/false) ───────────────────────────────────────
const SHE_SAID_QUOTES = [
  { quote: "I literally cannot stop thinking about him and it's actually pissing me off", girl: 'Remi', decoy: ['Nya','Stella','Macy'] },
  { quote: "He can look. He just can't touch. Unless I say so.", girl: 'Stella', decoy: ['Rileigh','Allie','Nya'] },
  { quote: "I'm not a slut I just have a very active social life and zero regrets", girl: 'Stella', decoy: ['Rileigh','Macy','Remi'] },
  { quote: "My boyfriend thinks I'm at my cousin's house rn lmaooo", girl: 'Remi', decoy: ['Macy','Nya','Stella'] },
  { quote: "He drove 40 minutes to see me and I made him wait outside for 20. It's called power.", girl: 'Rileigh', decoy: ['Stella','Nya','Allie'] },
  { quote: "I'm in a relationship but I still want to feel wanted by everyone. Is that so bad?", girl: 'Macy', decoy: ['Remi','Allie','Nya'] },
  { quote: "The problem is I'm everyone's type and that's genuinely not my fault", girl: 'Nya', decoy: ['Stella','Rileigh','Macy'] },
  { quote: "I don't cheat. I just collect options.", girl: 'Stella', decoy: ['Rileigh','Remi','Nya'] },
  { quote: "He's big. Like actually huge. And that's all I have to say about that.", girl: 'Macy', decoy: ['Stella','Remi','Allie'] },
  { quote: "I like when guys are scared of me a little. It means they know what they're dealing with.", girl: 'Rileigh', decoy: ['Nya','Stella','Remi'] },
  { quote: "I told him I was 'kind of' seeing someone. I have a whole boyfriend lmao.", girl: 'Remi', decoy: ['Macy','Allie','Nya'] },
  { quote: "Being innocent-looking is literally a superpower. Nobody suspects me ever.", girl: 'Allie', decoy: ['Nya','Remi','Macy'] },
  { quote: "I don't do drama. I just do whatever I want and let the drama find me.", girl: 'Nya', decoy: ['Rileigh','Stella','Remi'] },
  { quote: "Sapulpa is boring and I will literally get in any car going to Tulsa after 10pm", girl: 'Rileigh', decoy: ['Allie','Macy','Nya'] },
  { quote: "He thought we were exclusive. I thought we were having fun. Miscommunication I guess.", girl: 'Stella', decoy: ['Remi','Nya','Allie'] },
  { quote: "My body count is nobody's business and also lower than you think and also higher than he thinks", girl: 'Stella', decoy: ['Rileigh','Macy','Remi'] },
  { quote: "I feel bad but not bad enough to stop lol", girl: 'Remi', decoy: ['Macy','Nya','Allie'] },
  { quote: "He's sweet. But boring. I need both and that's apparently too much to ask.", girl: 'Allie', decoy: ['Nya','Rileigh','Stella'] },
  { quote: "My man is like 6'3 240 so yeah nobody really tries anything. Sad for them honestly.", girl: 'Macy', decoy: ['Rileigh','Stella','Nya'] },
  { quote: "I don't lead guys on. I just don't correct their assumptions.", girl: 'Nya', decoy: ['Allie','Remi','Stella'] },
  { quote: "I've kissed all of my boyfriend's friends. Not at the same time. Consecutively.", girl: 'Stella', decoy: ['Remi','Rileigh','Macy'] },
  { quote: "The reserved thing is an act. I figured out it makes guys try harder.", girl: 'Allie', decoy: ['Nya','Remi','Macy'] },
  { quote: "I answered at 2am. That's not an invitation. But also it kind of is.", girl: 'Rileigh', decoy: ['Stella','Nya','Allie'] },
  { quote: "My location is always off. Not because I'm hiding. Because I'm always hiding.", girl: 'Remi', decoy: ['Nya','Macy','Stella'] },
];

let sheSaidIdx = 0;
let sheSaidOrder = [];
let sheSaidScore = { correct: 0, total: 0 };

function buildSheSaid() {
  if (!sheSaidOrder.length) sheSaidOrder = shuffle([...Array(SHE_SAID_QUOTES.length).keys()]);
  const q = SHE_SAID_QUOTES[sheSaidOrder[sheSaidIdx % sheSaidOrder.length]];
  const girls = Object.keys(DOSSIER);
  const photo = rand(SECRET_PHOTOS.filter(p => p.model === q.girl) || SECRET_PHOTOS);
  const el = $('sheSaidContainer'); if (!el) return;
  el.innerHTML = `
    <div style="font-size:10px;letter-spacing:3px;color:var(--red2);text-align:center;margin-bottom:16px;text-transform:uppercase">Who said it? · ${sheSaidScore.correct}/${sheSaidScore.total} correct</div>
    ${photo ? `<img class="shesaid-photo" src="${photo.src}" alt="" style="display:none">` : ''}
    <div class="shesaid-quote">"${q.quote}"</div>
    <div class="shesaid-options">
      ${girls.map(g => `<button class="shesaid-btn" onclick="sheSaidGuess('${g}','${q.girl}')">${DOSSIER[g].nickname||g}</button>`).join('')}
    </div>
    <div class="shesaid-result" id="sheSaidResult"></div>
    <button class="game-btn vault-btn" id="sheSaidNext" style="display:none" onclick="nextSheSaid()">Next →</button>`;
}
function sheSaidGuess(guess, correct) {
  sheSaidScore.total++;
  const right = guess === correct;
  if (right) sheSaidScore.correct++;
  // reveal photo
  const img = document.querySelector('.shesaid-photo'); if (img) img.style.display = 'block';
  // mark buttons
  document.querySelectorAll('.shesaid-btn').forEach(btn => {
    const g = btn.textContent.trim();
    const gName = Object.keys(DOSSIER).find(k => (DOSSIER[k].nickname||k) === g);
    btn.disabled = true;
    if (gName === correct) btn.classList.add('correct');
    else if (gName === guess) btn.classList.add('wrong');
  });
  const reactions = {
    true: ['Knew it.','Correct 🔴','You pay attention.','Yeah that tracks.','Nobody else could\'ve said that.'],
    false: [`Nah that was ${DOSSIER[correct]?.nickname||correct}.`,'Wrong.','You\'d know if you paid closer attention.','Not even close lmao.'],
  };
  $('sheSaidResult').textContent = rand(reactions[String(right)]);
  $('sheSaidNext').style.display = 'inline-block';
  addDangerScore(correct, 2);
}
function nextSheSaid() { sheSaidIdx++; buildSheSaid(); }
window.sheSaidGuess = sheSaidGuess;
window.nextSheSaid = nextSheSaid;

// ─── GROUP CHAT SIMULATOR ────────────────────────────────────────
const GC_NAME = '🔥 No Bitches Allowed (Ironic)';
const GC_MEMBERS = ['Jackson','Cruz','Jaquavion','Jack','You'];
const GC_MEMBER_COLORS = { Jackson:'#ff6655', Cruz:'#ff9944', Jaquavion:'#ff5577', Jack:'#ffaa33' };

const GC_SCRIPT = [
  { from:'Jackson', msg:'bro I saw Stella at the chevron on 71st last night at like 1am' },
  { from:'Cruz', msg:'by herself???' },
  { from:'Jackson', msg:'nah some dude was dropping her off' },
  { from:'Jaquavion', msg:'💀💀💀' },
  { from:'Jack', msg:'who was it' },
  { from:'Jackson', msg:'no idea never seen him. big white truck' },
  { from:'Cruz', msg:'classic stella behavior honestly' },
  { from:'Jaquavion', msg:'she texted me last week asking if I was free btw' },
  { from:'Cruz', msg:'WHAT' },
  { from:'Jack', msg:'bro you didn\'t say anything' },
  { from:'Jaquavion', msg:'I said I was busy bc I was with remi lmao' },
  { from:'Jackson', msg:'WAIT WHAT' },
  { from:'Cruz', msg:'you were with remi?? her bf is literally 6\'2"' },
  { from:'Jaquavion', msg:'she said they were "on a break"' },
  { from:'Jack', msg:'they are NOT on a break I follow him on instagram' },
  { from:'Jaquavion', msg:'not my problem bro she reached out' },
  { from:'Jackson', msg:'💀 remi really said free real estate' },
  { from:'Cruz', msg:'rileigh been posting stories at like 2am lately too' },
  { from:'Jack', msg:'she lives in sapulpa what is she even doing up at 2am' },
  { from:'Cruz', msg:'I drove out there once bro. she acts annoyed but she was waiting by the door' },
  { from:'Jaquavion', msg:'LMAOOOO' },
  { from:'Jackson', msg:'why are you driving to sapulpa for someone who "acts annoyed"' },
  { from:'Cruz', msg:'because once she stops acting annoyed it\'s worth every mile' },
  { from:'Jack', msg:'fair enough honestly' },
  { from:'Jaquavion', msg:'what about nya somebody needs to talk about nya' },
  { from:'Jackson', msg:'she has a boyfriend though' },
  { from:'Cruz', msg:'so does remi apparently and that didn\'t stop jaquavion' },
  { from:'Jaquavion', msg:'im not doing this' },
  { from:'Jack', msg:'nya keeps liking my posts from like 3 weeks ago' },
  { from:'Jackson', msg:'the casual scroll back is INTENTIONAL bro she wants you to notice' },
  { from:'Cruz', msg:'100% that\'s a sign' },
  { from:'Jack', msg:'or she was just bored' },
  { from:'Jaquavion', msg:'no guy in this chat has ever been "just bored" scrolled back 3 weeks on a girls profile without reason' },
  { from:'Jackson', msg:'he has a point' },
  { from:'Cruz', msg:'what about allie though. she\'s quiet but I feel like' },
  { from:'Jack', msg:'she\'s not as quiet as she looks trust me' },
  { from:'Jaquavion', msg:'😳 say more' },
  { from:'Jack', msg:'I\'m not saying more lmao' },
  { from:'Cruz', msg:'bro you can\'t just drop that and leave' },
  { from:'Jackson', msg:'JACK' },
  { from:'Jack', msg:'she texted me at midnight saying she "couldn\'t sleep"' },
  { from:'Jaquavion', msg:'🚨🚨🚨' },
  { from:'Cruz', msg:'and what did YOU say' },
  { from:'Jack', msg:'I went over there' },
  { from:'Jackson', msg:'respectfully what the fuck jack' },
  { from:'Cruz', msg:'legendary honestly' },
  { from:'Jaquavion', msg:'allie of all people bro I didn\'t see that coming' },
  { from:'Jackson', msg:'she always looks so innocent' },
  { from:'Jack', msg:'THAT\'S WHAT I\'M SAYING' },
  { from:'Cruz', msg:'I wonder if macy ever gets tired of her man' },
  { from:'Jaquavion', msg:'bro her man is HUGE I am not in that conversation' },
  { from:'Jackson', msg:'coward' },
  { from:'Jaquavion', msg:'I am not dying for macy cox. I like her but I like being alive more.' },
  { from:'Cruz', msg:'she does flirt a lot for someone who\'s "taken" though' },
  { from:'Jack', msg:'she flirted with me at the panera on yale like two weeks ago' },
  { from:'Jackson', msg:'she was probably bored in line' },
  { from:'Jack', msg:'she followed me on instagram immediately after' },
  { from:'Cruz', msg:'okay that\'s not bored that\'s intentional' },
  { from:'Jaquavion', msg:'y\'all are gonna get someone hurt' },
  { from:'Jackson', msg:'not me I stay away from taken women' },
  { from:'Cruz', msg:'sir you literally just described sitting outside rileigh\'s house at 2am' },
  { from:'Jackson', msg:'rileigh is single' },
  { from:'Jaquavion', msg:'barely' },
  { from:'Jack', msg:'💀💀' },
  { from:'Jackson', msg:'okay on that note who\'s free this weekend' },
  { from:'Cruz', msg:'I might hit rileigh up again ngl' },
  { from:'Jaquavion', msg:'another sapulpa trip 😂' },
  { from:'Cruz', msg:'it\'s only 25 minutes' },
  { from:'Jack', msg:'you have a problem' },
  { from:'Cruz', msg:'I have a destination' },
];

let gcIdx = 0;
let gcTimer = null;
let gcSpeed = 3000; // ms between messages
let gcPaused = false;

function buildGroupChat() {
  const el = $('groupChatWrap'); if (!el) return;
  el.innerHTML = `
    <div class="groupchat-wrap" id="gcWrap">
      <div class="groupchat-header">
        <div>
          <div class="groupchat-name">${GC_NAME}</div>
          <div class="groupchat-members">${GC_MEMBERS.slice(0,-1).join(', ')} + You</div>
        </div>
        <div class="groupchat-controls">
          <div class="gc-speed-wrap">
            <span class="gc-ctrl-label">Speed</span>
            <input type="range" class="gc-speed" id="gcSpeedSlider" min="500" max="6000" value="3000" step="500">
          </div>
          <button class="vault-btn game-btn" id="gcPauseBtn" style="padding:6px 12px;font-size:9px">⏸ Pause</button>
          <button class="vault-btn game-btn" id="gcRestartBtn" style="padding:6px 12px;font-size:9px">↺ Restart</button>
        </div>
      </div>
      <div class="groupchat-msgs" id="gcMsgs"></div>
      <div class="groupchat-input-row">
        <input class="gc-input" id="gcInput" placeholder="Say something...">
        <button class="gc-send" id="gcSendBtn">Send</button>
      </div>
    </div>`;
  gcIdx = 0;
  gcPaused = false;
  clearTimeout(gcTimer);
  const msgs = $('gcMsgs');
  // system open
  appendGcMsg({ from:'system', msg:`${GC_NAME} · ${GC_MEMBERS.length} members` });
  scheduleGcMsg();
  // speed slider
  $('gcSpeedSlider').addEventListener('input', e => { gcSpeed = parseInt(e.target.value); });
  // pause
  $('gcPauseBtn').addEventListener('click', () => {
    gcPaused = !gcPaused;
    $('gcPauseBtn').textContent = gcPaused ? '▶ Resume' : '⏸ Pause';
    if (!gcPaused) scheduleGcMsg();
    else clearTimeout(gcTimer);
  });
  // restart
  $('gcRestartBtn').addEventListener('click', () => { clearTimeout(gcTimer); buildGroupChat(); });
  // user send
  $('gcSendBtn').addEventListener('click', sendGcMsg);
  $('gcInput').addEventListener('keydown', e => { if(e.key==='Enter') sendGcMsg(); });
}

function appendGcMsg({ from, msg }) {
  const msgs = $('gcMsgs'); if (!msgs) return;
  const isSystem = from === 'system';
  const isYou = from === 'You';
  const div = document.createElement('div');
  div.className = `gc-msg ${isSystem?'system':isYou?'right':'left'}`;
  const now = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  if (isSystem) {
    div.innerHTML = `<div class="gc-bubble">${msg}</div>`;
  } else {
    const color = GC_MEMBER_COLORS[from] || '#ff9999';
    div.innerHTML = `
      ${!isYou ? `<div class="gc-sender" style="color:${color}">${from}</div>` : ''}
      <div class="gc-bubble">${msg}</div>
      <div class="gc-time">${now}</div>`;
  }
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showGcTyping(name) {
  const msgs = $('gcMsgs'); if (!msgs) return null;
  const div = document.createElement('div');
  div.className = 'gc-msg left';
  const color = GC_MEMBER_COLORS[name] || '#ff9999';
  div.innerHTML = `<div class="gc-sender" style="color:${color}">${name}</div><div class="gc-bubble gc-typing"><span class="gc-typing-dots"><span></span><span></span><span></span></span></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function scheduleGcMsg() {
  if (gcPaused || gcIdx >= GC_SCRIPT.length) return;
  const next = GC_SCRIPT[gcIdx];
  // show typing indicator
  const typingEl = showGcTyping(next.from);
  gcTimer = setTimeout(() => {
    if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
    appendGcMsg(next);
    gcIdx++;
    if (gcIdx < GC_SCRIPT.length) gcTimer = setTimeout(scheduleGcMsg, gcSpeed * 0.3);
  }, gcSpeed);
}

function sendGcMsg() {
  const inp = $('gcInput'); if (!inp || !inp.value.trim()) return;
  appendGcMsg({ from:'You', msg:inp.value.trim() });
  inp.value = '';
  // random auto-reply after delay
  const replies = [
    { from: rand(['Jackson','Cruz','Jaquavion','Jack']), msg: rand(['lmaooo','fr','💀','no way','that\'s crazy','bro what','exactly','honestly','say less','I was thinking the same thing']) },
  ];
  setTimeout(() => appendGcMsg(rand(replies)), gcSpeed * 0.5 + Math.random() * 1000);
}

// ─── POLL OF THE DAY ────────────────────────────────────────────
const POLL_MATCHUPS = [
  { q: 'Who are you actually calling at 2am?', a: 'Stella', b: 'Rileigh' },
  { q: 'Who would you risk it for?', a: 'Remi', b: 'Macy' },
  { q: 'Who\'s the better bad idea?', a: 'Nya', b: 'Stella' },
  { q: 'Who\'s more dangerous?', a: 'Rileigh', b: 'Stella' },
  { q: 'Who do you trust more? (slightly)', a: 'Allie', b: 'Remi' },
  { q: 'One night, no consequences — who?', a: 'Stella', b: 'Nya' },
  { q: 'Who would actually show up?', a: 'Rileigh', b: 'Macy' },
  { q: 'Who ruins you worse?', a: 'Nya', b: 'Remi' },
  { q: 'Who do you wife? (Hypothetically)', a: 'Allie', b: 'Macy' },
  { q: 'Sapulpa or Tulsa?', a: 'Rileigh', b: 'Stella' },
];

let pollVotes = {};
let currentPoll = null;
let pollVoted = false;

function buildPollOfDay() {
  const el = $('pollContainer'); if (!el) return;
  if (!currentPoll) currentPoll = rand(POLL_MATCHUPS);
  const p = currentPoll;
  if (!pollVotes[p.q]) pollVotes[p.q] = { a: Math.floor(Math.random()*40+10), b: Math.floor(Math.random()*40+10) };
  const votes = pollVotes[p.q];
  const total = votes.a + votes.b;
  const pctA = Math.round(votes.a/total*100);
  const pctB = 100-pctA;
  const photoA = rand(SECRET_PHOTOS.filter(ph=>ph.model===p.a)||SECRET_PHOTOS);
  const photoB = rand(SECRET_PHOTOS.filter(ph=>ph.model===p.b)||SECRET_PHOTOS);
  el.innerHTML = `
    <div class="poll-question">${p.q}</div>
    <div class="poll-options">
      <button class="poll-option ${pollVoted?'voted':''}" onclick="castVote('a')">
        ${photoA?`<img src="${photoA.src}" alt="">`:''}
        <div class="poll-option-name">${DOSSIER[p.a]?.nickname||p.a}</div>
        ${pollVoted?`<div class="poll-bar-wrap"><div class="poll-bar" style="width:${pctA}%"></div></div><div class="poll-pct">${pctA}%</div>`:''}
      </button>
      <div class="poll-vs">VS</div>
      <button class="poll-option ${pollVoted?'voted':''}" onclick="castVote('b')">
        ${photoB?`<img src="${photoB.src}" alt="">`:''}
        <div class="poll-option-name">${DOSSIER[p.b]?.nickname||p.b}</div>
        ${pollVoted?`<div class="poll-bar-wrap"><div class="poll-bar" style="width:${pctB}%"></div></div><div class="poll-pct">${pctB}%</div>`:''}
      </button>
    </div>
    ${pollVoted?`<div class="poll-result-label">${votes.a>votes.b?DOSSIER[p.a]?.nickname||p.a:DOSSIER[p.b]?.nickname||p.b} is winning</div>`:'<div style="font-size:10px;letter-spacing:2px;color:var(--red3);text-align:center">Tap to vote</div>'}
    <button class="game-btn vault-btn" style="margin-top:20px" onclick="newPoll()">New Poll →</button>`;
}
function castVote(side) {
  if (pollVoted) return;
  pollVoted = true;
  pollVotes[currentPoll.q][side]++;
  buildPollOfDay();
  addDangerScore(side==='a'?currentPoll.a:currentPoll.b, 2);
}
function newPoll() { currentPoll = rand(POLL_MATCHUPS); pollVoted = false; buildPollOfDay(); }
window.castVote = castVote;
window.newPoll = newPoll;

// ─── STALKER SPEED SLIDER ────────────────────────────────────────
// inject controls into stalker overlay
function initStalkerControls() {
  const overlay = $('stalkerOverlay'); if (!overlay) return;
  // speed controls
  if (!$('stalkerSpeedWrap')) {
    const ctrl = document.createElement('div');
    ctrl.className = 'stalker-controls';
    ctrl.id = 'stalkerSpeedWrap';
    ctrl.innerHTML = `<span class="stalker-ctrl-label">Speed</span><input type="range" class="stalker-speed-slider" id="stalkerSpeedSlider" min="2000" max="12000" value="6000" step="500">`;
    overlay.appendChild(ctrl);
    $('stalkerSpeedSlider').addEventListener('input', e => {
      stalkerInterval = parseInt(e.target.value);
    });
  }
  // girl filter buttons
  if (!$('stalkerFilterWrap')) {
    const filt = document.createElement('div');
    filt.className = 'stalker-filter';
    filt.id = 'stalkerFilterWrap';
    const girls = ['All', ...Object.keys(DOSSIER)];
    filt.innerHTML = girls.map(g => `<button class="stalker-filter-btn ${g==='All'?'on':''}" data-girl="${g}">${g}</button>`).join('');
    overlay.appendChild(filt);
    filt.querySelectorAll('.stalker-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filt.querySelectorAll('.stalker-filter-btn').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        const girl = btn.dataset.girl;
        stalkerPhotos = girl === 'All' ? shuffle(SECRET_PHOTOS) : shuffle(SECRET_PHOTOS.filter(p => p.model === girl));
        if (!stalkerPhotos.length) { toast('No photos for that girl yet'); return; }
        stalkerIdx = 0;
        clearTimeout(stalkerTimer);
        showStalkerPhoto();
      });
    });
  }
}

// ─── SHE'S WATCHING BACK ────────────────────────────────────────
function triggerShesWatching() {
  if (!$('secretWrap')?.classList.contains('open')) return;
  const el = document.createElement('div');
  el.className = 'shes-watching';
  el.innerHTML = '<div class="watching-eye">👁️</div>';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
  toast('she\'s watching back 👁️');
}
// random trigger every 3-8 minutes while in vault
function scheduleShesWatching() {
  const delay = 180000 + Math.random() * 300000;
  setTimeout(() => {
    triggerShesWatching();
    scheduleShesWatching();
  }, delay);
}
scheduleShesWatching();

// ─── NEW SECTION INIT HOOKS ──────────────────────────────────────
// Hook into sidebar button clicks to init new sections on first open
document.addEventListener('click', function(e) {
  const btn = e.target.closest('[data-ssection]');
  if (!btn) return;
  const id = btn.dataset.ssection;
  // small delay so showSecretSection runs first and section is visible
  setTimeout(() => {
    if (id === 'sshesaid') buildSheSaid();
    if (id === 'sgroupchat') { if (!$('gcWrap')) buildGroupChat(); }
    if (id === 'spollofday') buildPollOfDay();
  }, 50);
});

// ─── STALK CONTROLS ON STALKER TRIGGER ──────────────────────────
document.addEventListener('click', function(e) {
  if (e.target.closest('#stalkerBtn')) {
    setTimeout(initStalkerControls, 200);
  }
});
