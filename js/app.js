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
$('secretExit').addEventListener('click', () => $('secretWrap').classList.remove('open'));

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
let stalkerTimer=null, stalkerIdx=0, stalkerPhotos=[], stalkerInterval=3500;
function startStalkerMode() {
  if(!SECRET_PHOTOS.length){toast('Add photos to the vault first');return;}
  stalkerPhotos=shuffle(SECRET_PHOTOS);
  stalkerIdx=0;
  $('stalkerOverlay').classList.add('show');
  showStalkerPhoto();
}
function showStalkerPhoto() {
  const photo=stalkerPhotos[stalkerIdx%stalkerPhotos.length];
  $('stalkerImg').src=photo.src;
  $('stalkerName').textContent=photo.name;
  $('stalkerModel').textContent=photo.model;
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
document.addEventListener('keydown',e=>{
  if($('modalOverlay').classList.contains('open')) return;
  if($('secretWrap').classList.contains('open')) return;
  if(e.key==='g'||e.key==='G') showTab('moodboard');
  if(e.key==='p'||e.key==='P') showTab('games');
  if(e.key==='q'||e.key==='Q') showTab('quiz');
  if(e.key==='c'||e.key==='C') showTab('confessions');
  if(e.key==='s'||e.key==='S') showTab('saved');
});

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
document.addEventListener('keydown', e => {
  if (e.key === '/' && !$('modalOverlay').classList.contains('open')) {
    e.preventDefault();
    // visually highlight model tabs as a 'filter hint'
    document.querySelectorAll('.model-tab').forEach((t, i) => {
      setTimeout(() => {
        t.style.borderColor = 'rgba(244,167,185,0.5)';
        setTimeout(() => t.style.borderColor = '', 600);
      }, i * 40);
    });
    toast('💡 Click a name to filter');
  }
});

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

// ─── IMAGE LOAD PROGRESS TINT ────────────────────────
document.querySelectorAll('.card img').forEach(img => {
  if (!img.complete) {
    img.style.filter = 'brightness(0.3) blur(4px)';
    img.addEventListener('load', () => {
      img.style.transition = 'filter 0.5s ease, transform 0.5s cubic-bezier(0.4,0,0.2,1)';
      img.style.filter = 'brightness(0.85)';
    }, { once: true });
  }
});
