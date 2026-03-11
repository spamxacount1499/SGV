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
  document.body.style.overflow = 'hidden';
  document.body.classList.add('vault-open');
  // door animation then spotlight
  const door = $('vaultDoor');
  if (door) {
    door.classList.add('show');
    setTimeout(() => {
      door.classList.add('opening');
      setTimeout(() => {
        door.classList.remove('show', 'opening');
        _showVaultSpotlight();
      }, 1100);
    }, 600);
  } else {
    _showVaultSpotlight();
  }
  // init feed notif
  if (!feedNotifEl) setTimeout(initFeedNotif, 2000);
}
function _showVaultSpotlight() {
  $('secretWrap').classList.add('open');
  updateVaultPhotoCount();
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
  startCursorTrail();
  startVaultParticles();
  setVaultCursor(true);
  startAutoVaultConfessions();
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
  initLastSeen();
  initVaultGames();
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
  const isVault = colors === SWC;
  let vel=0.18+Math.random()*0.25,ang=0,animId=null;
  $(velId)&&($(velId).disabled=true);
  if($(resultId)) $(resultId).classList.remove('show');
  function frame(){
    ang+=vel;vel*=0.988;drawWheelOn(canvasId,ang,photos,colors);
    if(vel>0.002){animId=requestAnimationFrame(frame);}
    else{
      $(velId)&&($(velId).disabled=false);
      const n=photos.length,arc=(2*Math.PI)/n,norm=((Math.PI-ang)%(2*Math.PI)+2*Math.PI)%(2*Math.PI),photo=photos[Math.floor(norm/arc)%n];
      showSpinModal(photo, isVault);
    }
  }
  animId=requestAnimationFrame(frame);
}

function showSpinModal(photo, isVault) {
  let modal = $('spinModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'spinModal';
    modal.className = 'spin-modal-overlay';
    modal.innerHTML = `
      <div class="spin-modal-box" id="spinModalBox">
        <button class="spin-modal-close" id="spinModalClose">✕</button>
        <div class="spin-modal-label" id="spinModalLabel"></div>
        <img class="spin-modal-img" id="spinModalImg" src="" alt="">
        <div class="spin-modal-name" id="spinModalName"></div>
        <div class="spin-modal-model" id="spinModalModel"></div>
        <button class="spin-modal-again" id="spinModalAgain">Spin Again</button>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if(e.target===modal) closeSpinModal(); });
    $('spinModalClose').addEventListener('click', closeSpinModal);
    document.addEventListener('keydown', e => { if(e.key==='Escape') closeSpinModal(); });
  }
  $('spinModalLabel').textContent = isVault ? "TONIGHT'S PICK" : "TODAY'S PICK";
  $('spinModalLabel').style.color = isVault ? 'var(--red)' : 'var(--gold)';
  $('spinModalImg').src = photo.src;
  $('spinModalName').textContent = photo.name;
  $('spinModalModel').textContent = photo.model;
  $('spinModalAgain').style.borderColor = isVault ? 'var(--red)' : 'var(--gold)';
  $('spinModalAgain').style.color = isVault ? 'var(--red)' : 'var(--gold)';
  $('spinModalAgain').onclick = () => {
    closeSpinModal();
    // re-trigger the right spin button
    const btn = isVault ? $('sSpinBtn') : $('spinBtn');
    if (btn) btn.click();
  };
  modal.classList.add('open');
  // stagger image fade in
  $('spinModalImg').style.opacity = '0';
  setTimeout(() => { $('spinModalImg').style.opacity = '1'; }, 50);
}

function closeSpinModal() {
  const modal = $('spinModal');
  if (modal) modal.classList.remove('open');
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
const AUTO_CONFESSIONS_PUBLIC = [
  "I saved every photo of Sophie on my phone. My girlfriend doesn't know. Sophie doesn't know. Nobody knows.",
  "Breckie Hill ruined my attention span. I haven't been able to focus on anything else for three weeks.",
  "I told myself I was just browsing. That was 45 minutes ago.",
  "She smiled at me once at a party and I still think about it before I fall asleep.",
  "I don't have a type anymore. This site is my type.",
  "I drove past her place twice. Didn't stop. Couldn't explain why if you asked me.",
  "The way she looked in that one photo should come with a warning label.",
  "I follow all her socials on a finsta. She has no idea I exist. I'm fine with that.",
  "My ex used to look at me the way she looks at the camera in that photo. I miss that.",
  "I've voted her Hot in Hot or Not like 40 times today. Zero regrets.",
  "She's literally the reason I opened this site for the fourth time today.",
  "I'm in a whole relationship and I'm on here confessing. Don't ask.",
  "I matched with her on Tinder once and panicked and unmatched. Biggest mistake of my life.",
  "This site is dangerous. I've been here for 2 hours. Send help.",
  "She posted a story at 2am and I watched it within 30 seconds. That's a problem.",
];
const AUTO_CONFESSIONS_VAULT = [
  "I know her schedule. I'm not proud of that but I do.",
  "Rileigh responded to my Instagram story once and I've been thinking about it for a month.",
  "I drove to Sapulpa at midnight. I'm not telling you for who. You can guess.",
  "Stella texted me 'come over' once. I didn't go. I regret it every day.",
  "I saw Macy at Utica Square and just stood there. Her man was right there. I didn't care.",
  "I know her address. I've never shown up. But I know it.",
  "Nya acts like she doesn't know what she's doing. She knows exactly what she's doing.",
  "Remi is the reason I don't trust myself around taken girls anymore.",
  "I would do something genuinely stupid for Stella and I'm at peace with that.",
  "She posted at 2am and I was awake. We both know what that means.",
  "Allie said she 'couldn't sleep' in a text at midnight. I know what that means.",
  "I've rated every one of these photos and I'm starting to think I have a problem.",
  "Rileigh came to Tulsa once and I found out and I just kind of showed up nearby. Yeah.",
  "She changed her profile pic and my heart did something it's not supposed to do.",
  "I thought about her during a work meeting. For 20 minutes. Didn't retain a single thing said.",
  "I saved her number even though she never actually gave it to me. I'm not explaining that.",
  "Macy followed me back and I panicked for 10 minutes before calming down.",
  "The dossier on Stella is too accurate. Someone's been watching. It might be me.",
];
let autoConfTimer = null;
let autoConfVaultTimer = null;

function startAutoConfessions() {
  if (autoConfTimer) return;
  const pool = shuffle([...AUTO_CONFESSIONS_PUBLIC]);
  let idx = 0;
  function drop() {
    if (idx < pool.length) {
      const time = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
      state.confessions.push({ text: pool[idx++], time });
      renderConfessionWall('confessionWall', state.confessions, false);
    }
    autoConfTimer = setTimeout(drop, 25000 + Math.random() * 35000);
  }
  autoConfTimer = setTimeout(drop, 8000);
}

function startAutoVaultConfessions() {
  if (autoConfVaultTimer) return;
  const pool = shuffle([...AUTO_CONFESSIONS_VAULT]);
  let idx = 0;
  function drop() {
    if (idx < pool.length) {
      const time = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
      state.sConfessions.push({ text: pool[idx++], time });
      renderConfessionWall('sConfessionWall', state.sConfessions, true);
    }
    autoConfVaultTimer = setTimeout(drop, 20000 + Math.random() * 25000);
  }
  autoConfVaultTimer = setTimeout(drop, 5000);
}

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
  wall.innerHTML=arr.slice(0,60).map(c=>`
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

// kick off auto confessions on page load
startAutoConfessions();

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

// ─── JOI MODE ────────────────────────────────────────────────────────────────
let joiTimer=null, joiIdx=0, joiPhotos=[], joiSpeed=3;
let joiCucAnim=null, joiCucPos=0, joiCucDir=1;

// speed → interval ms and BPM
const JOI_SPEEDS = [
  null,                              // idx 0 unused
  {ms:8000, bpm:15,  label:'1'},    // 1 — glacial
  {ms:6000, bpm:20,  label:'2'},
  {ms:4500, bpm:30,  label:'3'},
  {ms:3000, bpm:45,  label:'4'},
  {ms:2200, bpm:60,  label:'5'},
  {ms:1600, bpm:80,  label:'6'},
  {ms:1100, bpm:100, label:'7'},
  {ms:800,  bpm:130, label:'8'},
  {ms:500,  bpm:160, label:'9'},
  {ms:280,  bpm:220, label:'10 🔥'}, // 10 — unhinged
];

function startJoi() {
  joiPhotos = shuffle([...PHOTOS]);
  joiIdx = 0;
  $('joiOverlay').classList.add('show');
  document.body.classList.add('joi-open');
  joiSpeed = parseInt($('joiSpeedSlider')?.value || 3);
  updateJoiSpeed();
  showJoiPhoto();
  startCucumber();
}

function stopJoi() {
  clearTimeout(joiTimer);
  cancelAnimationFrame(joiCucAnim);
  $('joiOverlay').classList.remove('show');
  document.body.classList.remove('joi-open');
}

function showJoiPhoto() {
  const photo = joiPhotos[joiIdx % joiPhotos.length];
  const img = $('joiImg');
  // quick fade
  img.style.opacity = '0';
  img.src = photo.src;
  img.onload = () => { img.style.opacity = '1'; };
  $('joiName').textContent = photo.name;
  $('joiModel').textContent = photo.model;
  // progress bar
  const prog = $('joiProgress');
  if (prog) {
    prog.style.transition = 'none';
    prog.style.width = '0%';
    const spd = JOI_SPEEDS[joiSpeed];
    setTimeout(() => {
      prog.style.transition = `width ${spd.ms}ms linear`;
      prog.style.width = '100%';
    }, 30);
  }
  joiIdx++;
  clearTimeout(joiTimer);
  joiTimer = setTimeout(showJoiPhoto, JOI_SPEEDS[joiSpeed].ms);
}

function updateJoiSpeed() {
  joiSpeed = parseInt($('joiSpeedSlider')?.value || 3);
  const spd = JOI_SPEEDS[joiSpeed];
  if ($('joiBpm')) $('joiBpm').textContent = `♩ ${spd.bpm} BPM`;
  if ($('joiSpeedVal')) $('joiSpeedVal').textContent = spd.label;
  // restart cucumber at new BPM
  cancelAnimationFrame(joiCucAnim);
  startCucumber();
}

function startCucumber() {
  cancelAnimationFrame(joiCucAnim);
  const cuc = $('joiCucumber');
  if (!cuc) return;
  const spd = JOI_SPEEDS[joiSpeed];
  // ms per full stroke (up+down) synced to BPM
  const strokeMs = (60000 / spd.bpm);
  let start = null;
  const TRAVEL = 120; // px travel distance

  function animCuc(ts) {
    if (!start) start = ts;
    const elapsed = (ts - start) % strokeMs;
    // sine wave: 0→1→0 over one stroke
    const t = elapsed / strokeMs;
    const y = Math.sin(t * Math.PI * 2) * TRAVEL * 0.5;
    cuc.style.transform = `translateY(${y}px) rotate(${-15 + y * 0.15}deg)`;
    joiCucAnim = requestAnimationFrame(animCuc);
  }
  joiCucAnim = requestAnimationFrame(animCuc);
}

// wire up
$('joiBtn') && $('joiBtn').addEventListener('click', startJoi);
$('joiStop') && $('joiStop').addEventListener('click', stopJoi);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('joiOverlay')?.classList.contains('show')) stopJoi();
});
$('joiSpeedSlider') && $('joiSpeedSlider').addEventListener('input', () => {
  updateJoiSpeed();
  // restart photo timer at new speed
  clearTimeout(joiTimer);
  joiTimer = setTimeout(showJoiPhoto, JOI_SPEEDS[joiSpeed].ms);
});

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
    age: '20',
    school: 'TU / Tulsa Community College',
    car: 'Dark grey Honda Civic',
    hangout: 'Brookside, Gathering Place, QT on S Memorial',
    schedule: 'Usually free after 8pm. Boyfriend works nights on weekdays.',
    flag: 'Acts sweet but has eyes on everyone in the room. Always positioned near the exit.',
    intel: 'Was seen leaving McNellie\'s with someone who wasn\'t her boyfriend. He doesn\'t know. Responds to DMs after 11pm.',
    type: 'The dangerous kind. Knows she\'s attractive and uses it precisely.',
    lastActive: '14 min ago',
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
    age: '19',
    school: 'OSU Tulsa',
    car: 'White Jeep Wrangler',
    hangout: 'Panera on Yale, OSU Tulsa campus, Walmart on 71st late nights',
    schedule: 'Classes Mon/Wed/Fri. "On a break" status unclear. Boyfriend out of town most weekends.',
    flag: 'Texts back immediately then goes quiet for 3 hours. Playing games or playing innocent, unclear.',
    intel: 'Same address as Nya — sisters. Can confirm Remi was at McNellie\'s Pub past 1am last Thursday. Her location was off.',
    type: 'The taken-but-available type. Needs to feel like she\'s the exception, not the rule.',
    lastActive: '8 min ago',
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
    age: '20',
    school: 'University of Tulsa',
    car: 'White Toyota Camry, 2021',
    hangout: 'Cheesecake Factory 71st, Florence Park, midtown bar crawl every other Friday',
    schedule: 'Lives alone on S Sandusky. Parents are in Broken Arrow. Basically unsupervised 24/7.',
    flag: 'Has her location shared with 3 different guys simultaneously. None of them know about each other.',
    intel: 'Was seen leaving a house on S Sandusky that isn\'t hers at 12:30am. Someone drove her. Plate unknown.',
    type: 'The main character. No games, no strings, just chaos and confidence.',
    lastActive: '22 min ago',
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
    age: '19',
    school: 'Tulsa Community College',
    car: 'Unknown — gets rides or drives a silver car seen around midtown',
    hangout: 'TCC campus, Target on 71st, Route 66 area, coffee shops in midtown',
    schedule: 'Morning classes. Usually free by noon. Posts stories between 9-11pm.',
    flag: 'The quiet ones always have a secret. She knows more than she lets on and she likes it that way.',
    intel: 'Someone confirmed she texted them at midnight saying she "couldn\'t sleep." They went over. She answered the door. Draw your own conclusions.',
    type: 'The sleeper agent. Looks like the good girl. Operates like anything but.',
    lastActive: '1h ago',
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
    age: '20',
    school: 'Part-time TCC, mostly just vibes',
    car: 'Beat-up silver Hyundai Elantra. Recognizable.',
    hangout: 'BP off Hwy 66, Dollar General Sapulpa, anyone\'s house in Tulsa if you drive for her',
    schedule: 'No real schedule. Posts at 2am regularly. Always "bored" in Sapulpa. Extremely available if you put in the drive.',
    flag: 'She knows the entire zip code. Nothing stays private in a town that small. But she doesn\'t care.',
    intel: 'At least two people in this chat have driven to Sapulpa after midnight. Both said it was worth it. Neither will elaborate.',
    type: 'The wild card. You never know if you\'re the only one or one of many. Probably both.',
    lastActive: '6 min ago',
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
    age: '20',
    school: 'University of Tulsa',
    car: 'Black Nissan Rogue (his) or her own white Corolla',
    hangout: 'Utica Square, Chick-fil-A Peoria, Woodland Hills Mall, Planet Fitness 41st',
    schedule: 'Gym every morning 7am. Classes afternoons. Her man works construction, gone 7am-5pm weekdays.',
    flag: 'Follows back everyone who slides into her DMs. Doesn\'t mean anything. Might mean something.',
    intel: 'Flirted with someone at Panera on Yale and immediately followed them on Instagram. Her man doesn\'t follow her stories that closely.',
    type: 'The taken-but-curious type. Has a man, wants attention, won\'t act on it. Probably.',
    lastActive: '18 min ago',
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
        <div style="font-size:9px;letter-spacing:3px;color:#ff4444;margin-top:4px;text-transform:uppercase">● Active ${d.lastActive||'recently'}</div>
      </div>
      <div class="dossier-row"><span class="dossier-label">STATUS</span><span class="dossier-val">${d.status}</span></div>
      <div class="dossier-row"><span class="dossier-label">AGE</span><span class="dossier-val">${d.age||'Unknown'}</span></div>
      <div class="dossier-row"><span class="dossier-label">SCHOOL</span><span class="dossier-val">${d.school||'Unknown'}</span></div>
      <div class="dossier-row"><span class="dossier-label">ADDRESS</span><span class="dossier-val">📍 ${d.addr}</span></div>
      <div class="dossier-row"><span class="dossier-label">PHONE</span><span class="dossier-val">📞 ${d.phone}</span></div>
      <div class="dossier-row"><span class="dossier-label">INSTAGRAM</span><span class="dossier-val">📸 ${d.insta}</span></div>
      <div class="dossier-row"><span class="dossier-label">CAR</span><span class="dossier-val">🚗 ${d.car||'Unknown'}</span></div>
      <div class="dossier-row"><span class="dossier-label">HANGOUTS</span><span class="dossier-val">${d.hangout||'Unknown'}</span></div>
      <div class="dossier-row"><span class="dossier-label">SCHEDULE</span><span class="dossier-val dossier-weakness">${d.schedule||'Unknown'}</span></div>
      <div class="dossier-row"><span class="dossier-label">WEAKNESS</span><span class="dossier-val dossier-weakness">${d.weakness}</span></div>
      <div class="dossier-row"><span class="dossier-label">THREAT LEVEL</span><span class="dossier-val dossier-threat">${stars} ${d.threat}/10</span></div>
      <div class="dossier-row"><span class="dossier-label">TYPE</span><span class="dossier-val" style="color:#ff8888;font-style:italic">${d.type||''}</span></div>
      <div class="dossier-row"><span class="dossier-label">⚑ RED FLAG</span><span class="dossier-val" style="color:#ff4444">${d.flag||''}</span></div>
      <div class="dossier-notes">📡 INTEL: "${d.intel||d.notes}"</div>
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
  // generic engagement
  g => `liked ${DOSSIER[g]?.fullName||g}'s photo at ${rand(['midnight','1am','2am','3am','4am','late last night'])}`,
  g => `saved ${DOSSIER[g]?.fullName||g} to their private collection`,
  g => `viewed ${DOSSIER[g]?.fullName||g}'s full gallery ${rand(['twice','3 times','back to back','again'])}`,
  g => `rated ${g} ${rand(['9/10','10/10','easily a 10','dangerous/10','too high/10','11/10 not fair'])}`,
  g => `put ${g} in S tier. no hesitation.`,
  g => `spent ${rand(['8','12','20','35','47','an hour'])} minutes on ${DOSSIER[g]?.fullName||g}'s photos`,
  g => `rewound ${g}'s gallery ${rand(['twice','three times','four times','too many times to count'])}`,
  g => `drafted ${DOSSIER[g]?.fullName||g} as their #1 pick`,
  g => `voted ${g} Most Wanted this session`,
  g => `said ${g} is "${rand(['untouchable','a problem','the one','dangerous','illegal','a 10 every time','too real'])}"`,
  // stalker/address specific
  g => `looked up ${DOSSIER[g]?.addr||'her address'} on Google Maps`,
  g => `searched "${DOSSIER[g]?.addr||'Tulsa OK'}" after seeing ${g}'s vault photos`,
  g => `dropped a pin at ${DOSSIER[g]?.addr||'her place'} and saved it`,
  g => `drove past ${DOSSIER[g]?.addr?.split(',')[0]||'her street'} twice tonight`,
  g => `screenshotted ${g}'s address from the dossier`,
  g => `typed "${DOSSIER[g]?.addr||'her address'}" into their GPS at ${rand(['11pm','midnight','1am','2am'])}`,
  g => `saved ${DOSSIER[g]?.addr?.split(',')[0]||'her block'} in their contacts as "don't do it"`,
  g => `ran stalker mode on ${g} for ${rand(['3','5','8','12','20','30'])} minutes straight`,
  g => `checked if ${g}'s house has a driveway (it does)`,
  // phone number specific
  g => `called ${DOSSIER[g]?.phone||'her number'} — no answer`,
  g => `texted ${DOSSIER[g]?.phone||'her number'} "u up" at 2am. no reply.`,
  g => `saved ${DOSSIER[g]?.phone||'her digits'} as "${rand(['don\'t','bad idea','maybe','her 🔥','do not call'])}"`,
  g => `called ${DOSSIER[g]?.phone||'her number'} blocked. hung up after one ring.`,
  g => `copy-pasted ${DOSSIER[g]?.phone||'her number'} into their phone ${rand(['twice','three times','four times'])} before saving it`,
  g => `texted ${DOSSIER[g]?.phone||'her'} "hey" at ${rand(['12:47am','1:13am','2:06am','11:58pm'])}. read receipt. no reply.`,
  g => `has ${DOSSIER[g]?.phone||'her number'} memorized now. didn't mean to.`,
  g => `almost called ${DOSSIER[g]?.phone||'the number'} three times. closed the app each time.`,
  // instagram specific
  g => `checked ${DOSSIER[g]?.insta||'her insta'} after the vault`,
  g => `followed then unfollowed ${DOSSIER[g]?.insta||'her'} three times tonight`,
  g => `screen-recorded ${DOSSIER[g]?.insta||'her instagram'} stories`,
  g => `liked something on ${DOSSIER[g]?.insta||'her page'} from 47 weeks ago. panicked. unliked.`,
  g => `went through every photo on ${DOSSIER[g]?.insta||'her profile'} in one sitting`,
  g => `dm'd ${DOSSIER[g]?.insta||'her'} "hey" then deleted it 4 seconds later`,
  g => `screenshot ${DOSSIER[g]?.insta||'her page'} — "for research"`,
  g => `followed ${DOSSIER[g]?.insta||'her'} on a burner. she hasn't accepted yet.`,
  // relationship status exploits
  g => `picked ${g} because "${rand(['she has a boyfriend so it\'s fine','taken girls hit different','her man doesn\'t deserve her anyway','she said she\'s on a break'])}"`,
  g => `messaged ${g} knowing she's taken. said "just being friendly"`,
  g => `said ${g}'s situationship is "basically single"`,
  g => `texted ${g} while her boyfriend was literally in her stories`,
  g => `said "${g} picks up regardless" — based on experience apparently`,
  // very personal per-girl
  g => g==='Remi' ? `texted Remi (${DOSSIER.Remi.phone}) at 1am. her bf posted a story 10 min later. she never replied.` : `hit up ${g} at 1am knowing she's taken`,
  g => g==='Stella' ? `drove down Sandusky Ave just to slow down in front of her house` : `drove past her street at ${rand(['11pm','midnight','1am'])}`,
  g => g==='Rileigh' ? `made the drive to Sapulpa at midnight. worth it apparently.` : `made a 25 minute drive for her at midnight`,
  g => g==='Macy' ? `messaged Macy knowing her man is 6'4" 240. said "I'll take those odds"` : `slid in knowing she's taken`,
  g => g==='Nya' ? `found Nya on ${DOSSIER.Nya.insta} through the vault. following from a burner now.` : `found her insta from the dossier info`,
  g => g==='Rileigh' ? `called ${DOSSIER.Rileigh.phone} — she picked up. conversation lasted 2 hours.` : `called her — she actually picked up`,
  g => g==='Stella' ? `texted ${DOSSIER.Stella.phone} "you free tonight" at 11pm` : `texted her asking if she's free tonight`,
  g => g==='Macy' ? `called ${DOSSIER.Macy.phone} from a blocked number just to hear her voice` : `called blocked just to hear her voice`,
  g => g==='Remi' ? `looked up ${DOSSIER.Remi.addr} on street view. spent 12 minutes on that block.` : `looked up her address on street view`,
  g => g==='Nya' ? `went to 1722 S Delaware and sat outside for 20 minutes` : `drove to her address and just... sat there`,
  // alibi/game-based
  g => `matched ${g} in the alibi game and didn't even feel bad`,
  g => `picked ${g} for every scenario in the alibi game. every. single. one.`,
  g => `smashed on ${DOSSIER[g]?.fullName||g} without hesitating`,
  g => `gave ${g} a danger score of ${rand(['87','94','97','100','103 (broken the scale)'])}`,
  g => `picked ${g} for the 2am scenario. twice.`,
  g => `chose ${g} in F/M/K for all three options somehow`,
  // late night energy
  g => `opened the vault at ${rand(['2:14am','3:07am','12:53am','1:41am','4:02am'])} specifically for ${g}`,
  g => `set ${g} as their phone wallpaper. changed it back before morning.`,
  g => `told themselves "just 5 more minutes" looking at ${g}'s photos. 40 minutes ago.`,
  g => `fell asleep with ${g}'s gallery open`,
  g => `said "${g} could ruin my whole life and I'd thank her"`,
  g => `said they're not obsessed with ${g}, just "very attentive"`,
  g => `opened the vault just to look at ${g}. not even going to pretend otherwise.`,
  // degenerate
  g => `asked if ${g}'s address is accurate. (it is)`,
  g => `said they'd drive to ${DOSSIER[g]?.addr?.split(',')[0]||'her street'} right now if asked`,
  g => `voted ${g} "most likely to destroy me" for the third session in a row`,
  g => `admitted they have ${g}'s schedule figured out`,
  g => `said ${g} looks better every time they open the vault`,
  g => `spent the last hour in ${g}'s section. no regrets stated.`,
  g => `bookmarked ${DOSSIER[g]?.insta||'her instagram'} on three different devices`,
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
// Per-girl story captions — written FROM her POV like she posted the story
const CAUGHT_STORY_CONTENT = {
  Nya: {
    captions: [
      '💛',
      'don\'t mind me',
      'lol whatever',
      'this is fine',
      'hi 🙂',
      'not me posting again',
      'tell me something good',
      'bored 🙃',
      'okay fine one more',
      'no thoughts head empty',
      'it\'s giving "I know what I\'m doing"',
      'okay I look good today bye',
      '🫶',
      'someone come get me I\'m bored',
      'doing this for no reason',
    ],
    musicLine: ['year 3! 💛', 'summer playlist 🎵', 'this song 😭', '🎵✨'],
  },
  Remi: {
    captions: [
      'hi',
      'bored again',
      '🤍',
      'lol okay',
      'fine I\'ll post',
      'it\'s giving something idk',
      'don\'t ask',
      'my bf is asleep lmaooo',
      'vibes only rn',
      'I look cute so',
      'okay moving on',
      'someone text me something good',
      '🫠',
      'no context',
      'this is what 11pm looks like I guess',
    ],
    musicLine: ['late night 🌙', '🎵 this song has me feeling things', 'for no reason 🤍'],
  },
  Stella: {
    captions: [
      'hi 🙂',
      'okay I\'m here',
      '🤍',
      'it\'s giving',
      'lol whatever',
      'hi sorry I disappeared',
      'just vibes',
      'okay fine',
      'I\'m back',
      'no explanation needed',
      'they can\'t handle it 🙄',
      'doing too much as usual',
      'don\'t look at me',
      '✨okay✨',
      'for the girls',
    ],
    musicLine: ['♡ good day', 'this song 🎵', '✨vibes✨', 'girl dinner energy'],
  },
  Rileigh: {
    captions: [
      'bored af',
      'sapulpa nightlife (there isn\'t any)',
      'someone come get me',
      'I look cute and nobody is here to see it',
      'lol hi',
      '😐',
      'okay I\'m going out',
      'nothing to do but post I guess',
      'it\'s 2am and I\'m still up who\'s surprised',
      'this town is so boring I swear',
      'fine one story',
      'drive out here then 🙄',
      'hi from the middle of nowhere',
      '🤙',
      'y\'all are missing out just saying',
    ],
    musicLine: ['late night 🌙', 'bored in Sapulpa 🎵', 'someone come thru 🔥'],
  },
  Macy: {
    captions: [
      'hi 🤍',
      'okay I look cute',
      'for my girls',
      'don\'t mind me',
      'just me being me',
      '🫶',
      'my man took this and sent it to himself lol',
      'okay fine one story',
      'I\'m that girl today apparently',
      'doing it for the story',
      'just saying hi',
      '💕',
      'okay I\'m going back to watching tv',
      'he doesn\'t know I posted this',
      'hi from Utica Square',
    ],
    musicLine: ['🤍 good day', '♡ for no reason', 'she\'s that girl 🎵'],
  },
  Allie: {
    captions: [
      'hi 🤍',
      'can\'t sleep',
      'okay one story then bed',
      '🌙',
      'idk why I\'m posting this',
      'it\'s fine',
      'hi for no reason',
      'nothing to say just wanted to post',
      'late night thoughts',
      '🫶',
      'okay moving on',
      'no thoughts just vibes',
      'fine you can look',
      'bored and it shows',
      'this is what midnight looks like',
    ],
    musicLine: ['can\'t sleep 🌙', '🎵 late night', 'no thoughts ✨'],
  },
};

const CAUGHT_USERNAMES = {
  Nya: 'nya.barn', Remi: 'remibarn', Stella: 'stella_thomas08',
  Allie: 'allie__ok', Rileigh: 'rileigh_l_s', Macy: 'addison_and_macy',
};

const CAUGHT_COMMENTS = {
  Nya: [
    { user: 'jackson_918', txt: 'bro I am NOT okay right now 😭' },
    { user: 'cruz_t', txt: 'she knows EXACTLY what she\'s doing and that\'s the most dangerous part' },
    { user: 'jaquavion', txt: 'Lord take the wheel because I cannot handle this' },
    { user: 'tulsaguy88', txt: 'she\'s so fine it should be federally illegal' },
    { user: 'jack_ok', txt: 'her bf is COOKED and he has no idea. rest in peace to him.' },
    { user: 'anonymous', txt: 'I would blow up my entire life for one text back and I\'m at peace with that' },
    { user: 'okstate_bro', txt: 'she posted this on purpose at this exact time because she knows who\'s awake. it\'s me. I\'m awake.' },
    { user: '918native', txt: 'seeing her in person left me permanently different. this only makes it worse.' },
    { user: 'midtown_mike', txt: 'she smiled at me once at a party and I literally haven\'t been the same since' },
    { user: 'tulsa_anonymous', txt: 'she\'s taken and posting THIS. her man is a walking tragedy and doesn\'t know.' },
    { user: 'j_sooners', txt: 'the audacity to look like this and have a boyfriend. genuinely unfair.' },
    { user: 'kdog_918', txt: 'I have to stop opening these stories. I cannot stop opening these stories.' },
    { user: 'anonymous2', txt: 'she knows there are at least 12 guys saving this right now. she\'s fine with it.' },
    { user: 'brody_t', txt: 'the way she looks at the camera like she already knows what it\'s going to do to people' },
  ],
  Remi: [
    { user: 'jackson_918', txt: 'she has a BOYFRIEND and is posting THIS?? her man is not okay. I am not okay.' },
    { user: 'cruz_t', txt: 'her man really thinks she\'s loyal right now. bless his heart.' },
    { user: 'jaquavion', txt: 'I was literally just with her and now I see this and I am in crisis' },
    { user: 'tulsaguy88', txt: 'she\'s taken and still posting like this at this hour. shameless. iconic.' },
    { user: 'jack_ok', txt: 'that smile is a weapon and she knows how to use it 💀' },
    { user: 'anonymous', txt: 'I would wreck my entire relationship for one text back from risky remi' },
    { user: '918native', txt: 'remi barnard is a menace to this city and I mean that in the most respectful way possible' },
    { user: 'tulsa_anonymous', txt: '"on a break" energy. I can feel it from here.' },
    { user: 'midtown_mike', txt: 'she texted me at midnight last week and now this. my brain is broken.' },
    { user: 'kdog_918', txt: 'her boyfriend follows her on instagram. he has seen this. he is not doing well.' },
    { user: 'brody_t', txt: 'posting at this hour with no caption except vibes. that\'s a deliberate choice.' },
    { user: 'anonymous2', txt: 'technically off limits. practically the most dangerous girl in Tulsa.' },
  ],
  Stella: [
    { user: 'jackson_918', txt: 'she\'s SINGLE and posting THIS at midnight. someone call 911.' },
    { user: 'cruz_t', txt: 'town favorite for a reason holy shit she genuinely cannot be real' },
    { user: 'jaquavion', txt: 'she\'s dangerous bro. legitimately a public safety concern.' },
    { user: 'tulsaguy88', txt: 'I would drive from literally anywhere. no questions. no hesitation. immediately.' },
    { user: 'jack_ok', txt: 'SINGLE?? HOW. how is that allowed. I have questions for the universe.' },
    { user: 'anonymous', txt: 'stella thomas will ruin your life and you will get in line to let her do it again' },
    { user: 'midtown_chad', txt: 'saw her at cheesecake factory last week. forgot how to speak like a person.' },
    { user: 'okstate_bro', txt: 'she has my undivided attention every hour of every day and she doesn\'t even know my name' },
    { user: 'tulsa_anonymous', txt: 'no strings attached energy. the most terrifying four words in the english language.' },
    { user: 'kdog_918', txt: 'she\'s been my home screen for 6 months and I\'m not ashamed anymore' },
    { user: 'brody_t', txt: 'the way she carries herself like she knows there are 40 guys in shambles right now. because there are.' },
    { user: 'j_sooners', txt: 'stella thomas said "single" and half of Tulsa stopped functioning. rightfully.' },
    { user: 'anonymous2', txt: 'I would make genuinely terrible decisions for her and I\'m being transparent about that' },
  ],
  Rileigh: [
    { user: 'jackson_918', txt: 'it\'s 2am in Sapulpa and she\'s posting this. I am already in my car.' },
    { user: 'cruz_t', txt: 'that\'s MY girl 😤 (she doesn\'t know I exist and I\'m fine with that)' },
    { user: 'jaquavion', txt: 'rileigh sowards will have you making the worst decisions of your life with a smile on your face' },
    { user: 'tulsaguy88', txt: 'she acts annoyed when you show up but SHE WAITS BY THE DOOR. confirmed. twice.' },
    { user: 'jack_ok', txt: 'posting at this hour again I see 👀 I see you. I\'m awake. obviously.' },
    { user: 'anonymous', txt: 'the green dress from last month is still in my head. this isn\'t helping.' },
    { user: 'sapulpa_local', txt: 'I live 10 minutes away and I am genuinely not handling this well at all' },
    { user: 'kdog_918', txt: 'she runs Sapulpa like she owns it and she\'s right to. nobody is disputing this.' },
    { user: 'tulsa_anonymous', txt: 'the "bored in Sapulpa at 2am" era is a menace to every guy within 30 miles' },
    { user: 'brody_t', txt: 'drove out there once. she was waiting by the door. I will never recover from that.' },
    { user: 'midtown_mike', txt: 'she posted "drive out here then" once as a caption and I took it literally. I don\'t regret it.' },
    { user: 'anonymous2', txt: 'she knows exactly who\'s going to see this at 2am and she posted it anyway. respect.' },
  ],
  Macy: [
    { user: 'jackson_918', txt: 'her man is enormous so I will admire from a VERY safe distance 😭' },
    { user: 'cruz_t', txt: 'macy really said look but don\'t touch and I hate that rule so much' },
    { user: 'jaquavion', txt: 'she follows everyone back bro. make of that what you will 👀 I\'m making something of it.' },
    { user: 'tulsaguy88', txt: 'she flirted with me at panera on yale and I think about it every single day. she forgot 5 minutes later.' },
    { user: 'jack_ok', txt: 'macy cox is a beautiful, terrible, gorgeous problem' },
    { user: 'anonymous', txt: 'her man said "mine" and she said "...technically" and that entire sentence is its own story' },
    { user: 'midtown_mike', txt: 'I would catch these hands from her boyfriend for one real conversation with her. worth it.' },
    { user: 'kdog_918', txt: 'she\'s taken and posting this at midnight. her man is either very secure or very unaware.' },
    { user: 'tulsa_anonymous', txt: 'she followed me back after I liked one post and I haven\'t slept right since' },
    { user: 'brody_t', txt: 'the "he doesn\'t know I posted this" energy is radiating off this story' },
    { user: 'j_sooners', txt: 'taken but curious is genuinely the most dangerous status a girl can have' },
  ],
  Allie: [
    { user: 'jackson_918', txt: 'she LOOKS innocent. she is categorically NOT innocent. I have witnesses.' },
    { user: 'cruz_t', txt: 'allie texted someone "can\'t sleep" at midnight and it was absolutely not about sleep' },
    { user: 'jaquavion', txt: 'she\'s quiet until she\'s not and when she\'s not it\'s completely over for you' },
    { user: 'tulsaguy88', txt: 'the reserved ones are always always ALWAYS the most dangerous. every time. no exceptions ever.' },
    { user: 'jack_ok', txt: 'I have no statement at this time for legal and personal reasons 😭' },
    { user: 'anonymous', txt: 'allie is the final boss and everyone underestimates her and that\'s exactly what she wants' },
    { user: 'okstate_bro', txt: 'silk robe at midnight was not an accident. nothing about allie is an accident.' },
    { user: 'kdog_918', txt: '"can\'t sleep" at 12:17am. sure. absolutely. that\'s what that was.' },
    { user: 'tulsa_anonymous', txt: 'she looks like the good girl in every group. she is not the good girl. source: someone I know.' },
    { user: 'brody_t', txt: 'posting at midnight with the "just wanted to post" energy. I know what that is. we all know.' },
    { user: 'midtown_mike', txt: 'she\'s been operating in stealth mode this whole time and I only just figured it out' },
  ],
};

let caughtDismissed = false;

function showCaughtSlipping() {
  if (!$('secretWrap')?.classList.contains('open')) return;
  if (!SECRET_PHOTOS.length) return;
  const photo = rand(SECRET_PHOTOS);
  const girl = photo.model;
  const storyData = CAUGHT_STORY_CONTENT[girl] || CAUGHT_STORY_CONTENT.Stella;
  const caption = rand(storyData.captions);
  const musicLine = rand(storyData.musicLine);
  const username = CAUGHT_USERNAMES[girl] || girl.toLowerCase();

  let overlay = $('caughtSlipping');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'caughtSlipping';
    overlay.className = 'caught-slipping';
    document.body.appendChild(overlay);
  }

  const allComments = shuffle([...(CAUGHT_COMMENTS[girl] || CAUGHT_COMMENTS.Stella)]);
  const initComments = allComments.slice(0, rand([3,4,4,5]));
  const commentsHtml = initComments.map((c,i) => `
    <div class="caught-comment" style="animation-delay:${1.0 + i*0.55}s">
      <span class="caught-comment-user">${c.user}</span>
      <span class="caught-comment-txt">${c.txt}</span>
    </div>`).join('');

  const now = new Date();
  overlay.innerHTML = `
    <div class="caught-phone-frame" id="caughtFrame">
      <div class="caught-status-bar">
        <span>${now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
        <span>●●●●● 5G 🔋</span>
      </div>
      <div class="caught-story-bar"><div class="caught-story-progress" id="caughtProgress" style="width:0%"></div></div>
      <div class="caught-story-header">
        <div class="caught-avatar"><img src="${photo.src}" alt=""></div>
        <div style="flex:1;min-width:0">
          <div class="caught-username">${username}</div>
          <div class="caught-time-ago">${rand(['2m ago','4m ago','just now','1m ago','6m ago','8m ago'])}</div>
        </div>
        <button class="caught-close" id="caughtClose">✕</button>
      </div>
      <div style="position:relative;flex:1;min-height:0;overflow:hidden">
        <img class="caught-img" src="${photo.src}" alt="">
        <div class="caught-story-overlay">
          <div class="caught-music-pill">🎵 ${musicLine}</div>
          <div class="caught-story-caption">${caption}</div>
          <div class="caught-story-actions">
            <span class="caught-action-btn">❤️ ${Math.floor(Math.random()*80+20)}</span>
            <span class="caught-action-btn">💬 ${Math.floor(Math.random()*30+8)}</span>
            <span class="caught-action-btn">➡️</span>
          </div>
        </div>
      </div>
      <div class="caught-comments-scroll" id="caughtComments">
        ${commentsHtml}
      </div>
      <div class="caught-input-row">
        <input class="caught-input" id="caughtInput" placeholder="Reply to ${username}..." maxlength="120">
        <button class="caught-send" id="caughtSend">↑</button>
      </div>
    </div>`;

  overlay.querySelector('#caughtClose').addEventListener('click', () => overlay.classList.remove('show'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('show'); });

  const inp = overlay.querySelector('#caughtInput');
  const sendBtn = overlay.querySelector('#caughtSend');
  const commentsList = overlay.querySelector('#caughtComments');
  const pool = allComments.filter(c => !initComments.includes(c));
  let poolIdx = 0;
  let autoDropTimer = null;

  // auto-drip more comments every 8-15s while open
  function dripComment() {
    if (poolIdx < pool.length) {
      const c = pool[poolIdx++];
      const div = document.createElement('div');
      div.className = 'caught-comment';
      div.style.animationDelay = '0s';
      div.innerHTML = `<span class="caught-comment-user">${c.user}</span><span class="caught-comment-txt">${c.txt}</span>`;
      commentsList.appendChild(div);
      commentsList.scrollTop = commentsList.scrollHeight;
      autoDropTimer = setTimeout(dripComment, 8000 + Math.random() * 7000);
    }
  }
  autoDropTimer = setTimeout(dripComment, 4000 + Math.random() * 4000);

  function submitCaughtComment() {
    const txt = inp.value.trim();
    if (!txt) return;
    inp.value = '';
    const userDiv = document.createElement('div');
    userDiv.className = 'caught-comment caught-comment-you';
    userDiv.innerHTML = `<span class="caught-comment-user" style="color:#ff9999">you</span><span class="caught-comment-txt">${txt}</span>`;
    commentsList.appendChild(userDiv);
    commentsList.scrollTop = commentsList.scrollHeight;
    // someone else also responds
    if (poolIdx < pool.length) {
      setTimeout(() => {
        const reply = pool[poolIdx++];
        const replyDiv = document.createElement('div');
        replyDiv.className = 'caught-comment';
        replyDiv.innerHTML = `<span class="caught-comment-user">${reply.user}</span><span class="caught-comment-txt">${reply.txt}</span>`;
        commentsList.appendChild(replyDiv);
        commentsList.scrollTop = commentsList.scrollHeight;
      }, 700 + Math.random() * 1000);
    }
  }

  // cleanup auto-drip on close
  overlay.querySelector('#caughtClose').addEventListener('click', () => { clearTimeout(autoDropTimer); });

  sendBtn.addEventListener('click', submitCaughtComment);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') submitCaughtComment(); });

  overlay.classList.add('show');
  addDangerScore(photo.src, 3);
}
// trigger every 60-90 seconds while vault is open
function scheduleCaughtSlipping() {
  const delay = 210000 + Math.random() * 150000; // 3.5–6 min
  setTimeout(() => {
    showCaughtSlipping();
    scheduleCaughtSlipping();
  }, delay);
}
scheduleCaughtSlipping();

// ─── LAST SEEN ───────────────────────────────────────────────────
const LAST_SEEN_DATA = {
  Nya: [
    { place: 'QuikTrip on S Memorial Dr', when: '14 min ago', note: 'alone, on her phone' },
    { place: 'Brookside Starbucks', when: '32 min ago', note: 'with another girl, laughing' },
    { place: 'Gathering Place parking lot', when: '1h ago', note: 'sitting on someone\'s car hood. not hers.' },
    { place: 'Utica Square', when: '2h ago', note: 'shopping. ignored three guys.' },
    { place: 'Home — 1722 S Delaware Pl', when: 'last night, 11:48pm', note: 'lights off by midnight. or so they thought.' },
    { place: 'McNellie\'s Pub', when: 'Thursday, 1:20am', note: 'left with someone. boyfriend wasn\'t there.' },
    { place: 'Snap Map — somewhere on S Peoria', when: 'this morning 10am', note: 'ghost mode turned off for exactly 4 minutes' },
  ],
  Remi: [
    { place: 'Walmart on 71st', when: '8 min ago', note: 'self-checkout. white Jeep outside.' },
    { place: 'Panera on Yale Ave', when: '45 min ago', note: 'sat alone with AirPods in. responded to texts.' },
    { place: 'OSU Tulsa campus', when: '2h ago', note: 'between classes. someone walked her out.' },
    { place: 'McNellie\'s Pub', when: 'last night, 1:12am', note: 'boyfriend was not present. confirmed.' },
    { place: 'Home — 1722 S Delaware Pl', when: 'this morning, 9am', note: 'Jeep wasn\'t there until 9. somewhere overnight.' },
    { place: 'Target on 71st', when: 'Sunday', note: 'with Nya. both on their phones constantly.' },
    { place: 'Unknown — location off', when: 'Friday 11pm–2am', note: 'three hour gap. location deliberately hidden.' },
  ],
  Stella: [
    { place: 'Florence Park', when: '22 min ago', note: 'walking alone. earbuds in. unapproachable energy.' },
    { place: 'Cheesecake Factory on 71st', when: '1h ago', note: 'dinner. two guys, one bill.' },
    { place: 'Someone\'s place on S Sandusky', when: 'last night, 12:30am', note: 'walked out at 12:30. Uber home.' },
    { place: 'Reasor\'s on 61st', when: '3h ago', note: 'wine and snacks. that\'s a tell.' },
    { place: 'Midtown bar crawl', when: 'Friday night — all of it', note: 'four locations. closed down at least two of them.' },
    { place: 'University of Tulsa campus', when: 'yesterday, 2pm', note: 'left campus with someone in a black truck.' },
    { place: 'Home — 6449 S Sandusky', when: 'this morning', note: 'Camry in driveway by 8am. Was out until 1.' },
  ],
  Allie: [
    { place: 'Tulsa Community College', when: '1h ago', note: 'morning classes. quietly on her laptop.' },
    { place: 'Target on 71st', when: '3h ago', note: 'alone. picked up things she definitely doesn\'t need.' },
    { place: 'Route 66 area', when: 'yesterday afternoon', note: 'with friends. untagged photos later.' },
    { place: 'Coffee shop — Chimera Cafe', when: 'this morning 8am', note: 'by herself. journaling or texting nonstop, unclear.' },
    { place: 'Unknown — midtown Tulsa', when: 'last Wednesday midnight', note: 'snap map disappeared. back home by 2am.' },
    { place: 'TCC parking lot', when: 'Monday 12:10pm', note: 'sat in car for 20 min before driving. thinking something through.' },
  ],
  Rileigh: [
    { place: 'Dollar General, Sapulpa', when: '6 min ago', note: 'Hyundai Elantra out front. usual.' },
    { place: 'Creek County Courthouse area', when: '1h ago', note: 'unclear reason. didn\'t stay long.' },
    { place: 'BP station off Hwy 66, Sapulpa', when: '2h ago', note: 'fueling up. posted a story from the pump.' },
    { place: '320 N 14th St', when: 'this morning', note: 'lights on until midnight. someone else\'s car parked outside earlier.' },
    { place: 'Tulsa — someone drove her', when: 'last night, late', note: 'posted a story from midtown at 2:12am. posted from home at 8am. the math is something.' },
    { place: 'Panera on Yale', when: 'last Saturday', note: 'wasn\'t alone. the other person left fast when we walked in.' },
    { place: 'QuikTrip on Peoria, Tulsa', when: 'Friday 11:45pm', note: 'someone picked her up here. plate not captured.' },
  ],
  Macy: [
    { place: 'Utica Square', when: '18 min ago', note: 'shopping. answered a call and laughed for 10 minutes straight.' },
    { place: 'Chick-fil-A on Peoria', when: '1h ago', note: 'drive-through. white Corolla.' },
    { place: 'Her man\'s place', when: 'last night — all night', note: 'his truck was there. she was too. good for him, I guess.' },
    { place: 'Planet Fitness on 41st', when: 'this morning, 7am', note: 'gym every single morning. white Corolla in same spot each time.' },
    { place: 'Woodland Hills Mall', when: 'yesterday', note: 'with a group. one of them wasn\'t her boyfriend.' },
    { place: 'Panera on Yale', when: 'two weeks ago', note: 'flirted with someone in line. followed them on Instagram immediately after. noted.' },
    { place: 'QuikTrip on 51st', when: 'Sunday night 10pm', note: 'alone. her man\'s truck wasn\'t with her.' },
  ],
};

const LASTSEEN_NOTES_STYLES = [
  'color:#ff6666;font-size:10px;font-style:italic;',
  'color:#cc8888;font-size:10px;font-style:italic;',
  'color:#ff4444;font-size:10px;font-style:italic;',
];

function buildLastSeen() {
  const el = $('lastSeenList'); if (!el) return;
  const girls = Object.keys(LAST_SEEN_DATA);
  // pick weighted-random entry per girl (bias toward recent)
  el.innerHTML = girls.map(g => {
    const locs = LAST_SEEN_DATA[g];
    // pick from first 3 entries (most recent) 70% of the time
    const pool = Math.random() < 0.7 ? locs.slice(0,3) : locs;
    const current = rand(pool);
    const noteStyle = LASTSEEN_NOTES_STYLES[Math.floor(Math.random()*LASTSEEN_NOTES_STYLES.length)];
    return `
      <div class="lastseen-entry">
        <div class="lastseen-dot"></div>
        <div class="lastseen-detail">
          <div class="lastseen-name">${DOSSIER[g]?.fullName||g} <span style="font-size:9px;letter-spacing:2px;color:#8a3030;text-transform:uppercase">${DOSSIER[g]?.nickname||''}</span></div>
          <div class="lastseen-location">📍 ${current.place}</div>
          <div class="lastseen-when">${current.when}</div>
          ${current.note ? `<div style="${noteStyle}">↳ ${current.note}</div>` : ''}
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
  { label: 'Threat Level', key: 'threat', fmt: v => `⚡${v}/10` },
  { label: 'Status', key: 'status', fmt: v => v },
  { label: 'Age', key: 'age', fmt: v => v },
  { label: 'School', key: 'school', fmt: v => v },
  { label: 'Location', key: 'addr', fmt: v => `📍 ${v}` },
  { label: 'Instagram', key: 'insta', fmt: v => `📸 ${v}` },
  { label: 'Phone', key: 'phone', fmt: v => `📞 ${v}` },
  { label: 'Car', key: 'car', fmt: v => `🚗 ${v}` },
  { label: 'Hangouts', key: 'hangout', fmt: v => v },
  { label: 'Weakness', key: 'weakness', fmt: v => v },
  { label: 'Type', key: 'type', fmt: v => v },
  { label: 'Red Flag', key: 'flag', fmt: v => v },
  { label: 'Intel', key: 'intel', fmt: v => v },
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
  // hide after 8s, gap 5s, then next
  setTimeout(() => {
    feedNotifEl.classList.add('hide');
    feedNotifEl.classList.remove('show');
    setTimeout(runFeedNotif, 5000);
  }, 8000);
}

function generateFeedBatch(n) {
  return Array.from({length: n}, () => {
    const girl = rand(ONLINE_GIRLS);
    return { user: rand(FEED_USERS), action: rand(FEED_ACTIONS)(girl), time: 'just now' };
  });
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

// build ticker on main site load

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
  { quote: "I texted him 'can't sleep' at midnight. I could sleep. I just didn't want to.", girl: 'Allie', decoy: ['Remi','Nya','Macy'] },
  { quote: "He keeps asking if we're a thing. I keep changing the subject. He keeps coming back. System works.", girl: 'Nya', decoy: ['Stella','Rileigh','Remi'] },
  { quote: "I have his location. He doesn't have mine. That's how it should be.", girl: 'Rileigh', decoy: ['Stella','Macy','Allie'] },
  { quote: "I wore that on purpose and I will not be apologizing for what happened next.", girl: 'Stella', decoy: ['Rileigh','Nya','Remi'] },
  { quote: "I'm literally so loyal. To whoever I'm with at that exact moment.", girl: 'Stella', decoy: ['Remi','Macy','Rileigh'] },
  { quote: "He drove to Sapulpa for me. I made him wait in the driveway for 15 minutes. He waited.", girl: 'Rileigh', decoy: ['Allie','Nya','Stella'] },
  { quote: "My boyfriend follows all my friends. He doesn't follow the accounts I'm on.", girl: 'Macy', decoy: ['Remi','Allie','Stella'] },
  { quote: "I smiled at him twice and now he's fully down bad. Not my problem but also kind of my favorite thing.", girl: 'Nya', decoy: ['Stella','Allie','Remi'] },
  { quote: "I have a type and it's 'emotionally available enough to be useful but not so much that he gets attached'", girl: 'Stella', decoy: ['Nya','Rileigh','Macy'] },
  { quote: "I told him nothing was going on. Nothing was going on yet. Technically true.", girl: 'Remi', decoy: ['Macy','Stella','Allie'] },
  { quote: "I got into his car. I did not tell anyone I got into his car.", girl: 'Allie', decoy: ['Remi','Nya','Rileigh'] },
  { quote: "He's been texting for three weeks. I respond every fourth text. He tries harder every time.", girl: 'Nya', decoy: ['Rileigh','Stella','Macy'] },
  { quote: "My man would literally fight someone for me. I find that hot. And occasionally useful.", girl: 'Macy', decoy: ['Stella','Remi','Allie'] },
  { quote: "I'm not flirting I'm just friendly. To everyone. Constantly. In a way that is indistinguishable from flirting.", girl: 'Remi', decoy: ['Nya','Allie','Macy'] },
  { quote: "Two of his friends have my number. He gave it to them. He thought that was fine. It was not fine.", girl: 'Stella', decoy: ['Rileigh','Remi','Nya'] },
  { quote: "I know exactly who's driving through Sapulpa hoping to 'run into' me. I just don't say anything.", girl: 'Rileigh', decoy: ['Allie','Macy','Remi'] },
  { quote: "He asked if I liked him. I said 'obviously' and then walked away. That's enough for now.", girl: 'Allie', decoy: ['Nya','Stella','Rileigh'] },
  { quote: "I went to his house. His roommates now have a nickname for me. I've heard it. I'm fine with it.", girl: 'Stella', decoy: ['Macy','Rileigh','Nya'] },
  { quote: "I only post at night because I know exactly who's still up and checking.", girl: 'Rileigh', decoy: ['Nya','Remi','Allie'] },
  { quote: "He said he wasn't like other guys. He was exactly like other guys but in a way I was okay with.", girl: 'Nya', decoy: ['Stella','Macy','Remi'] },
  { quote: "My ex still watches all my stories within 30 seconds. My boyfriend takes three days. Read into that.", girl: 'Macy', decoy: ['Remi','Stella','Allie'] },
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
  { from:'Jackson', msg:'okay real talk though. ranking time. go.' },
  { from:'Cruz', msg:'1 stella 2 rileigh 3 nya. locked in.' },
  { from:'Jaquavion', msg:'1 nya 2 stella 3 macy. final answer.' },
  { from:'Jack', msg:'1 allie 2 rileigh 3 stella' },
  { from:'Jackson', msg:'JACK putting allie first is sending me' },
  { from:'Jack', msg:'she texted me at midnight and showed up to the door in a silk robe. I stand by my ranking.' },
  { from:'Cruz', msg:'WHAT' },
  { from:'Jaquavion', msg:'BRO SAY MORE' },
  { from:'Jack', msg:'I said what I said' },
  { from:'Jackson', msg:'allie has been so slept on this entire time. I feel robbed.' },
  { from:'Cruz', msg:'okay changing my ranking. allie is top 2 now.' },
  { from:'Jaquavion', msg:'same honestly. quiet ones really are built different.' },
  { from:'Jackson', msg:'switching topics. has anyone actually tried to talk to macy or is her man too scary' },
  { from:'Cruz', msg:'I accidentally made eye contact with him at walmart once and apologized for no reason' },
  { from:'Jaquavion', msg:'💀💀 coward behavior' },
  { from:'Cruz', msg:'he\'s built like a small truck. I\'m not dying for macy cox.' },
  { from:'Jack', msg:'she keeps liking my stuff though. like consistently.' },
  { from:'Jackson', msg:'that\'s not an accident. she\'s bored or she\'s curious.' },
  { from:'Jaquavion', msg:'probably both. taken girls get bored.' },
  { from:'Cruz', msg:'I\'m not getting involved. I want to live.' },
  { from:'Jackson', msg:'what about nya though. for real.' },
  { from:'Jaquavion', msg:'she has a boyfriend' },
  { from:'Jackson', msg:'remi also has a boyfriend and you were with her' },
  { from:'Jaquavion', msg:'okay we\'re not doing this again' },
  { from:'Jack', msg:'nya is a trap bro. she knows she\'s attractive. she uses it.' },
  { from:'Cruz', msg:'that\'s literally all of them' },
  { from:'Jack', msg:'nya does it on purpose with a smile on her face. different level.' },
  { from:'Jackson', msg:'I saw her at QT last week. she looked up from her phone, met my eyes, then went back to her phone.' },
  { from:'Jaquavion', msg:'classic. she clocked you and decided what to do in one second.' },
  { from:'Cruz', msg:'she lives rent free in your head and she doesn\'t even know your name bro' },
  { from:'Jackson', msg:'correct. and I\'m fine with it.' },
  { from:'Jack', msg:'remi update: she texted me again last night' },
  { from:'Cruz', msg:'BRO.' },
  { from:'Jaquavion', msg:'what did she say' },
  { from:'Jack', msg:'"hey what are you up to" at 11:30pm' },
  { from:'Jackson', msg:'that is NOT a casual text. that is a deliberate text.' },
  { from:'Cruz', msg:'what did you say back' },
  { from:'Jack', msg:'"not much, you?" like a normal person' },
  { from:'Jaquavion', msg:'you are not a normal person that is a power move' },
  { from:'Jack', msg:'she said "bored lol" and I said "same" and then she went quiet for 40 minutes' },
  { from:'Cruz', msg:'she was deciding how far to take it' },
  { from:'Jackson', msg:'and then?' },
  { from:'Jack', msg:'sent a selfie at midnight with no caption' },
  { from:'Jaquavion', msg:'I\'M SORRY WHAT' },
  { from:'Cruz', msg:'THAT IS NOT A CASUAL SELFIE' },
  { from:'Jackson', msg:'remi barnard is not okay and I mean that in the best way' },
  { from:'Jack', msg:'I didn\'t respond until morning. she sent a "lol nm" at 1am.' },
  { from:'Jaquavion', msg:'you played her perfectly by accident' },
  { from:'Cruz', msg:'what\'s her boyfriend doing in all this' },
  { from:'Jack', msg:'apparently they\'re on a break again. third time this year.' },
  { from:'Jackson', msg:'"on a break" is the most dangerous phrase in the english language' },
  { from:'Jaquavion', msg:'because it means anything could happen and nothing counts' },
  { from:'Cruz', msg:'I think about stella and this conversation will not help' },
  { from:'Jackson', msg:'she posted at 2am again. the video with the song in the background.' },
  { from:'Jaquavion', msg:'bro that song is what she plays when she\'s in her feelings' },
  { from:'Cruz', msg:'or when she wants someone to notice she\'s in her feelings' },
  { from:'Jack', msg:'the difference is irrelevant. both require action.' },
  { from:'Jackson', msg:'rileigh also posted at 2am by the way. this is a pattern.' },
  { from:'Cruz', msg:'they coordinate. I\'m convinced.' },
  { from:'Jaquavion', msg:'imagine if rileigh and stella were in the same place at the same time' },
  { from:'Jack', msg:'that would be genuinely dangerous for everyone involved' },
  { from:'Jackson', msg:'I need to not be alive for that event because I would make bad decisions' },
  { from:'Cruz', msg:'you\'re already making bad decisions and they\'re not even here' },
  { from:'Jaquavion', msg:'on that note I\'m going to bed. gonna think about nya. goodnight.' },
  { from:'Jackson', msg:'💀 same. night.' },
  { from:'Jack', msg:'night. remi texted again btw.' },
  { from:'Cruz', msg:'JACK' },
  { from:'Jack', msg:'I\'m handling it. goodnight.' },
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

function appendGcMsg({ from, msg, photo }) {
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
    const photoHtml = photo ? `<img class="gc-photo" src="${photo}" alt="" onclick="this.classList.toggle('gc-photo-expanded')">` : '';
    div.innerHTML = `
      ${!isYou ? `<div class="gc-sender" style="color:${color}">${from}</div>` : ''}
      ${photoHtml}
      ${msg ? `<div class="gc-bubble">${msg}</div>` : ''}
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

// ─── GC SMART REPLY ENGINE ───────────────────────────────────────
const GC_CONTEXT_REPLIES = {
  stella: [
    { from:'Cruz', msg:'stella thomas is the reason I have trust issues and I mean that as a compliment' },
    { from:'Jackson', msg:'she\'s town property at this point. everyone knows. nobody\'s mad.' },
    { from:'Jaquavion', msg:'I saw her at florence park last week bro. almost crashed.' },
    { from:'Jack', msg:'she texted me once and I\'ve been different ever since. won\'t elaborate.' },
    { from:'Cruz', msg:'stella is top tier no debate. single, gorgeous, zero strings. dangerous combo.' },
  ],
  rileigh: [
    { from:'Cruz', msg:'sapulpa to tulsa is 25 minutes and I\'ve made that drive more times than I\'ll admit' },
    { from:'Jackson', msg:'she acts annoyed but bro she WAITS. she waits by the door. confirmed firsthand.' },
    { from:'Jaquavion', msg:'rileigh sowards posting at 2am is literally a summoning spell' },
    { from:'Jack', msg:'she\'s unhinged in the exact right way. I respect it fully.' },
    { from:'Cruz', msg:'I drove to sapulpa on a wednesday night. for reasons. worth every mile.' },
  ],
  nya: [
    { from:'Jackson', msg:'nya has a boyfriend but her eyes say something completely different when you talk to her' },
    { from:'Jaquavion', msg:'she\'s the type where you KNOW it\'s a bad idea and you do it anyway' },
    { from:'Cruz', msg:'nya barnard is dangerous. she knows it. she likes knowing it.' },
    { from:'Jack', msg:'she liked my post from 3 weeks ago. that\'s not an accident bro.' },
    { from:'Jackson', msg:'the way she looks at you like she\'s deciding something. that\'s the whole problem.' },
  ],
  remi: [
    { from:'Jaquavion', msg:'remi is technically off limits. emphasis on technically.' },
    { from:'Jackson', msg:'she has a bf but she texted ME at midnight so the math isn\'t mathing for HIM' },
    { from:'Jack', msg:'risky remi didn\'t get that name for nothing. I\'m just saying.' },
    { from:'Cruz', msg:'her boyfriend thinks she\'s loyal. she texted like four different people this week.' },
    { from:'Jaquavion', msg:'she sent a selfie at 1am with NO caption. no caption bro. that\'s worse somehow.' },
  ],
  macy: [
    { from:'Cruz', msg:'I am not in the macy conversation. her man is 6\'2" and has nothing to lose.' },
    { from:'Jackson', msg:'she followed me back after panera. that\'s information I\'m storing.' },
    { from:'Jack', msg:'macy flirts with everyone and means it every time. that\'s just her personality apparently' },
    { from:'Jaquavion', msg:'taken but bored is somehow more dangerous than just single. every time.' },
    { from:'Cruz', msg:'the white corolla parks at planet fitness every morning at 7am. I\'m not watching. I just know.' },
  ],
  allie: [
    { from:'Jack', msg:'allie is the quiet girl from every movie who turns out to be the most interesting one. correct.' },
    { from:'Jackson', msg:'she texted "can\'t sleep" at midnight. bro. that\'s not insomnia that\'s a move.' },
    { from:'Jaquavion', msg:'everyone sleeping on allie and she\'s fully operating in stealth mode this whole time' },
    { from:'Cruz', msg:'she answered the door at midnight in a silk robe. I was not there but I was told. twice.' },
    { from:'Jack', msg:'...no further comment from me on the allie situation. I\'ve said too much.' },
  ],
  rank: [
    { from:'Cruz', msg:'1 stella 2 rileigh 3 nya. I\'ve been consistent about this for months.' },
    { from:'Jaquavion', msg:'nya stella allie. that\'s my final answer and I\'m not changing it.' },
    { from:'Jackson', msg:'impossible to rank honestly. context dependent. time of day factors in.' },
    { from:'Jack', msg:'allie top 2 minimum. I will die on this hill. I have receipts.' },
  ],
  drive: [
    { from:'Cruz', msg:'I\'ve made that drive. I understand completely.' },
    { from:'Jackson', msg:'no shame in the drive. we\'ve all been there or we will be.' },
    { from:'Jaquavion', msg:'the drive is always worth it bro. every single time.' },
  ],
  hot: [
    { from:'Jaquavion', msg:'there is literally no wrong answer here. all of the above.' },
    { from:'Cruz', msg:'all of them. the answer is always all of them.' },
    { from:'Jackson', msg:'this is not a debate that can be won bro. only survived.' },
  ],
  lol: [
    { from:'Jackson', msg:'💀💀' },
    { from:'Cruz', msg:'bro said it 😭' },
    { from:'Jaquavion', msg:'fr fr' },
  ],
  fr: [
    { from:'Cruz', msg:'exactly what I said' },
    { from:'Jackson', msg:'on god no cap' },
    { from:'Jaquavion', msg:'every time' },
  ],
  who: [
    { from:'Jackson', msg:'you already know who' },
    { from:'Cruz', msg:'don\'t pretend you don\'t know bro' },
    { from:'Jack', msg:'we all know. we all know.' },
  ],
};

const GC_GENERIC_REPLIES = [
  { from:'Jackson', msg:'bro 💀' },
  { from:'Cruz', msg:'fr tho' },
  { from:'Jaquavion', msg:'no way' },
  { from:'Jack', msg:'I was literally just thinking this' },
  { from:'Jackson', msg:'say less' },
  { from:'Cruz', msg:'honestly though' },
  { from:'Jaquavion', msg:'exactly what I said' },
  { from:'Jack', msg:'lmaooooo' },
  { from:'Jackson', msg:'this chat is genuinely something else 😭' },
  { from:'Cruz', msg:'bro you can\'t just say that and move on' },
  { from:'Jaquavion', msg:'I mean... he\'s not wrong though' },
  { from:'Jack', msg:'I have no response. I have no words.' },
  { from:'Jackson', msg:'okay but real talk' },
  { from:'Cruz', msg:'facts. unfortunately.' },
  { from:'Jaquavion', msg:'this is exactly why we have this gc' },
  { from:'Jackson', msg:'💀💀💀 bro I\'m done' },
  { from:'Cruz', msg:'someone had to say it' },
];

const GC_PHOTO_SHARE_CAPTIONS = [
  (g) => `bro look at this one of ${g} 😭 I saved this weeks ago`,
  (g) => `found this on my camera roll. ${g}. you're welcome.`,
  (g) => `why does ${g} look like this. why. explain this to me.`,
  (g) => `she posted this and deleted it. I was fast.`,
  (g) => `${g} said she'd kill me if I shared this. living dangerously.`,
  (g) => `context: she didn't know I screenshotted. outcome: irrelevant.`,
  (g) => `${g} sent THIS to someone and they showed me. I will not name names.`,
  (g) => `okay who had ${g} looking like this today. you win.`,
];

function getGcSmartReply(userMsg) {
  const lower = userMsg.toLowerCase();
  for (const [key, replies] of Object.entries(GC_CONTEXT_REPLIES)) {
    if (lower.includes(key)) return rand(replies);
  }
  return rand(GC_GENERIC_REPLIES);
}

// ─── GC AI REPLY ENGINE ─────────────────────────────────────────
// Full chat history for context window
let gcAiHistory = [];
const GC_MEMBERS_LIST = ['Jackson', 'Cruz', 'Jaquavion', 'Jack'];
const GC_MEMBER_PERSONALITIES = {
  Jackson: "Jackson is the observer of the group. Notices everything, always watching, shares intel about where girls were spotted. Dry humor. Uses 'bro' a lot. Often the first to react to news.",
  Cruz:    "Cruz is the action guy. He's actually driven to Sapulpa at midnight for Rileigh. Talks about it proudly. Has made bold moves and doesn't regret them. Competitive about who's made more moves.",
  Jaquavion: "Jaquavion is the one who was actually with Remi while she had a boyfriend. Bold, shameless, often drops bombshell information casually. Uses 'bro' and the skull emoji constantly. Reacts loudly to everything.",
  Jack:    "Jack is the quiet one who then drops the most insane info. Has been to Allie's house at midnight. Deflects with 'no comment' but gives just enough detail to drive everyone crazy. Uses '...' a lot.",
};

const GC_SYSTEM_PROMPT = [
  "You are simulating a group chat called '🔥 No Bitches Allowed (Ironic)' with four guys: Jackson, Cruz, Jaquavion, and Jack. The user has joined the chat.",
  "",
  "The chat is about these real girls they all know in Tulsa/Sapulpa Oklahoma:",
  "- Nya Barnard (@nya.barn) - has a boyfriend but sleeps around, lives at 1722 S Delaware Pl Tulsa",
  "- Remi Barnard (@remibarn) - sisters with Nya, same address, has a BF but flirts constantly, Jaquavion has been with her",
  "- Stella Thomas (@stella_thomas08) - single, 6449 S Sandusky Ave Tulsa, everyone's been with her, town favorite",
  "- Rileigh Sowards (@rileigh_l_s) - single, 320 N 14th St Sapulpa, Cruz drove out there at midnight, she waited by the door",
  "- Macy Cox (@addison_and_macy) - has a big boyfriend, still flirts constantly, follows everyone back",
  "- Allie (unknown last name) - looks innocent, texted Jack 'can't sleep' at midnight, he went over, she answered in a silk robe",
  "",
  "Jackson: observer of the group, notices everything, shares intel about where girls were spotted, dry humor, uses 'bro' a lot.",
  "Cruz: action guy, actually drove to Sapulpa at midnight for Rileigh, talks about it proudly, competitive about who's made more moves.",
  "Jaquavion: was actually with Remi while she had a boyfriend, bold, shameless, drops bombshell info casually, reacts loudly to everything.",
  "Jack: quiet one who drops the most insane info, has been to Allie's house at midnight, deflects with 'no comment' but hints enough to drive everyone crazy.",
  "",
  "Rules:",
  "- Reply as 1-2 of the guys responding DIRECTLY to what the user said",
  "- Actually read the user's message carefully and respond to the SPECIFIC content or question",
  "- If user mentions a girl by name, talk specifically about that girl with real personal details",
  "- If user asks a question, ANSWER IT in character",
  "- Stay in character for each person",
  "- Keep replies SHORT (1-2 sentences max per person, like real texts)",
  "- Use casual texting style: mostly lowercase, occasional caps for emphasis, 'bro', emojis",
  "- Be vulgar, crude, funny — this is a private guys group chat, no filter",
  "- Sometimes one guy replies, sometimes two, never three at once",
  "- Return ONLY a JSON array like: [{\"from\":\"Jackson\",\"msg\":\"...\"},{\"from\":\"Cruz\",\"msg\":\"...\"}]",
  "- No markdown, no explanation, ONLY the raw JSON array"
].join("\n");

async function getAiGcReplies(userMsg) {
  gcAiHistory.push({ role: 'user', content: userMsg });
  // keep history trimmed to last 12 exchanges
  if (gcAiHistory.length > 24) gcAiHistory = gcAiHistory.slice(-24);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: GC_SYSTEM_PROMPT,
        messages: gcAiHistory,
      }),
    });
    const data = await res.json();
    const text = data.content?.map(b => b.text || '').join('').trim();
    // strip any markdown fences
    const clean = text.replace(/```json|```/gi, '').trim();
    const replies = JSON.parse(clean);
    // add assistant turn to history
    gcAiHistory.push({ role: 'assistant', content: text });
    return Array.isArray(replies) ? replies.slice(0, 2) : [];
  } catch(e) {
    // fallback to static reply on error
    return [getGcSmartReply(userMsg)];
  }
}

async function sendGcMsg() {
  const inp = $('gcInput'); if (!inp || !inp.value.trim()) return;
  const userText = inp.value.trim();
  appendGcMsg({ from:'You', msg: userText });
  inp.value = '';

  // disable input while waiting
  inp.disabled = true;
  const sendBtn = $('gcSendBtn');
  if (sendBtn) sendBtn.disabled = true;

  // pick 1-2 responders, show typing immediately
  const numReply = Math.random() < 0.45 ? 2 : 1;
  const responders = shuffle([...GC_MEMBERS_LIST]).slice(0, numReply);
  const typingEls = responders.map(name => showGcTyping(name));

  const replies = await getAiGcReplies(userText);

  // stagger showing replies
  replies.forEach((reply, i) => {
    setTimeout(() => {
      // remove corresponding typing indicator
      if (typingEls[i]) typingEls[i].parentNode?.removeChild(typingEls[i]);
      // make sure the from name is valid
      const validFrom = GC_MEMBERS_LIST.includes(reply.from) ? reply.from : responders[i] || rand(GC_MEMBERS_LIST);
      appendGcMsg({ from: validFrom, msg: reply.msg });
      if (i === replies.length - 1) {
        inp.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        inp.focus();
      }
    }, 400 + i * 800);
  });

  // clear any leftover typing indicators after replies land
  setTimeout(() => {
    typingEls.forEach(el => el?.parentNode?.removeChild(el));
    inp.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
  }, 400 + replies.length * 800 + 500);

  // ~10% chance someone drops a photo a bit later
  if (Math.random() < 0.10 && SECRET_PHOTOS.length) {
    setTimeout(() => {
      const girl = rand(Object.keys(DOSSIER));
      const girlPhotos = SECRET_PHOTOS.filter(p => p.model === girl);
      const photo = rand(girlPhotos.length ? girlPhotos : SECRET_PHOTOS);
      const sender = rand(GC_MEMBERS_LIST);
      const caption = rand(GC_PHOTO_SHARE_CAPTIONS)(girl);
      const typingEl = showGcTyping(sender);
      setTimeout(() => {
        typingEl?.parentNode?.removeChild(typingEl);
        appendGcMsg({ from: sender, msg: caption, photo: photo.src });
        setTimeout(() => {
          const reactor = rand(GC_MEMBERS_LIST.filter(s => s !== sender));
          appendGcMsg({ from: reactor, msg: rand(["😭😭😭","bro WHY","I cannot 💀","she\'s gonna find this gc","I\'m saving this","delete this. do not delete this.","okay I\'m different now","who gave you permission to share this"]) });
        }, 2000 + Math.random() * 2000);
      }, 800);
    }, 4000 + Math.random() * 3000);
  }
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

// ─── SIDEBAR DROPDOWN GROUPS ────────────────────────────────────
window.toggleSbGroup = function(id) {
  const grp = document.getElementById(id); if (!grp) return;
  const isOpen = grp.classList.contains('open');
  grp.classList.toggle('open', !isOpen);
  const arrow = grp.querySelector('.sb-arrow');
  if (arrow) arrow.textContent = !isOpen ? '▾' : '▸';
};

// ─── SESSION TRACKER (Rate My Night) ────────────────────────────
// ═══════════════════════════════════════════════════════════════════
const sessionLog = {
  girlTime: { Nya:0, Remi:0, Stella:0, Allie:0, Rileigh:0, Macy:0 },
  girlClicks: { Nya:0, Remi:0, Stella:0, Allie:0, Rileigh:0, Macy:0 },
  gamesPlayed: 0,
  stalkerSessions: 0,
  addressChecks: 0,
  phoneChecks: 0,
  photosLiked: 0,
  alibiRuns: 0,
  smashVotes: 0,
  startTime: Date.now(),
};
function logGirl(girl) {
  if (sessionLog.girlClicks[girl] !== undefined) sessionLog.girlClicks[girl]++;
}
function logEvent(type) {
  if (type === 'game') sessionLog.gamesPlayed++;
  if (type === 'stalker') sessionLog.stalkerSessions++;
  if (type === 'address') sessionLog.addressChecks++;
  if (type === 'phone') sessionLog.phoneChecks++;
  if (type === 'like') sessionLog.photosLiked++;
  if (type === 'alibi') sessionLog.alibiRuns++;
  if (type === 'smash') sessionLog.smashVotes++;
}
// hook into existing events passively
const _origToggleLikeRMN = toggleLike;
window.toggleLike = function(photo) { logEvent('like'); _origToggleLikeRMN(photo); };

// ═══════════════════════════════════════════════════════════════════
// ─── PHONE HACK ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
const PHONE_DATA = {
  Nya: {
    contacts: { bf: 'Tyler ❤️🔥', dad: 'Dad 👨' },
    threads: {
      bf: [
        { from: 'bf', msg: 'you free tonight' },
        { from: 'me', msg: 'my parents are literally home' },
        { from: 'bf', msg: 'sneak me in. back door.' },
        { from: 'me', msg: 'last time you were so loud omg' },
        { from: 'bf', msg: 'that was YOUR fault' },
        { from: 'me', msg: 'how was that MY fault' },
        { from: 'bf', msg: 'you know exactly why' },
        { from: 'me', msg: 'okay fine. come at 11. park down the street' },
        { from: 'bf', msg: 'what are you wearing rn' },
        { from: 'me', msg: 'literally nothing i just got out of the shower 😭' },
        { from: 'bf', msg: 'stay like that' },
        { from: 'me', msg: 'tyler 😭😭' },
        { from: 'bf', msg: 'i\'m serious. door unlocked?' },
        { from: 'me', msg: 'yes. be quiet on the stairs. second door on the left.' },
        { from: 'bf', msg: 'send a pic so i have something to look at on the drive' },
        { from: 'me', msg: '📷 [Photo]', isPhoto: true, photoGirl: 'Nya' },
        { from: 'bf', msg: 'i\'m gonna crash this car' },
        { from: 'me', msg: 'drive SAFE omg' },
        { from: 'bf', msg: 'you can\'t send me something like that and expect me to drive normal' },
        { from: 'me', msg: 'just get here. i\'ll make it worth the drive 😇' },
        { from: 'bf', msg: 'omw. 8 minutes.' },
        { from: 'me', msg: 'i\'m already in bed' },
        { from: 'bf', msg: '💀 don\'t move' },
      ],
      dad: [
        { from: 'dad', msg: 'Where are you? It\'s 11pm' },
        { from: 'me', msg: 'at home dad im in my room' },
        { from: 'dad', msg: 'Lights are on in your room but you weren\'t at dinner' },
        { from: 'me', msg: 'i ate earlier' },
        { from: 'dad', msg: 'You have someone over?' },
        { from: 'me', msg: 'NO dad oh my god' },
        { from: 'dad', msg: 'Nya.' },
        { from: 'me', msg: 'what' },
        { from: 'dad', msg: 'I can hear voices. Keep your door open.' },
        { from: 'me', msg: 'it\'s my phone. i\'m watching a video' },
        { from: 'dad', msg: 'Door. Open. Now.' },
        { from: 'me', msg: 'fine it\'s open god' },
        { from: 'dad', msg: 'Good. Night.' },
        { from: 'me', msg: 'night 🙄' },
      ],
    }
  },
  Remi: {
    contacts: { bf: 'Jake 💙', dad: 'Daddy 🏠' },
    threads: {
      bf: [
        { from: 'me', msg: 'are you awake' },
        { from: 'bf', msg: 'now i am. it\'s 1am remi' },
        { from: 'me', msg: 'i know i know i\'m sorry. i can\'t sleep.' },
        { from: 'bf', msg: 'thinking about what' },
        { from: 'me', msg: 'you. mostly.' },
        { from: 'bf', msg: 'yeah?' },
        { from: 'me', msg: 'i keep thinking about last weekend' },
        { from: 'bf', msg: 'which part' },
        { from: 'me', msg: 'you know which part' },
        { from: 'bf', msg: 'say it' },
        { from: 'me', msg: 'jake 😭' },
        { from: 'bf', msg: 'say it or i\'m going back to sleep' },
        { from: 'me', msg: 'i can\'t stop thinking about when you had me against the wall' },
        { from: 'bf', msg: 'there it is' },
        { from: 'me', msg: 'shut up 😭 come over' },
        { from: 'bf', msg: 'send me something first' },
        { from: 'me', msg: '📷 [Photo]', isPhoto: true, photoGirl: 'Remi' },
        { from: 'bf', msg: 'getting in the car' },
        { from: 'me', msg: 'door\'s unlocked. wear the cologne.' },
        { from: 'bf', msg: 'you have a problem' },
        { from: 'me', msg: 'i know. hurry up.' },
      ],
      dad: [
        { from: 'dad', msg: 'Remi are you coming home tonight' },
        { from: 'me', msg: 'probably not, staying at Jake\'s' },
        { from: 'dad', msg: 'This is the third time this week' },
        { from: 'me', msg: 'dad we\'ve been together for a year he\'s not a stranger' },
        { from: 'dad', msg: 'You were supposed to be home by 10' },
        { from: 'me', msg: 'we lost track of time' },
        { from: 'dad', msg: 'Doing what exactly' },
        { from: 'me', msg: 'oh my god dad WATCHING MOVIES' },
        { from: 'dad', msg: 'Be home by 9am.' },
        { from: 'me', msg: 'fine' },
        { from: 'dad', msg: 'Love you. Be safe.' },
        { from: 'me', msg: 'love you too 🙄' },
      ],
    }
  },
  Stella: {
    contacts: { bf: 'Marcus 🖤', dad: 'Pop ⭐' },
    threads: {
      bf: [
        { from: 'me', msg: 'when are you getting here' },
        { from: 'bf', msg: '20 mins. why' },
        { from: 'me', msg: 'because i\'ve been getting ready for two hours and i want you to see it' },
        { from: 'bf', msg: 'send a preview' },
        { from: 'me', msg: '📷 [Photo]', isPhoto: true, photoGirl: 'Stella' },
        { from: 'bf', msg: 'okay i\'m running' },
        { from: 'me', msg: '😂 don\'t get a ticket' },
        { from: 'bf', msg: 'too late. worth it.' },
        { from: 'me', msg: 'you\'re insane' },
        { from: 'bf', msg: 'you look incredible.' },
        { from: 'me', msg: 'i know 💅' },
        { from: 'bf', msg: 'leave the lights low when i get there' },
        { from: 'me', msg: 'already did 😇' },
        { from: 'bf', msg: 'doing 80 rn' },
        { from: 'me', msg: 'MARCUS' },
        { from: 'bf', msg: 'worth it' },
      ],
      dad: [
        { from: 'dad', msg: 'Hey baby, you eaten today?' },
        { from: 'me', msg: 'yes pop stop worrying' },
        { from: 'dad', msg: 'Who was that boy picking you up last night' },
        { from: 'me', msg: 'just a friend dad' },
        { from: 'dad', msg: 'He was out front until 2am Stella.' },
        { from: 'me', msg: 'we were just talking' },
        { from: 'dad', msg: 'Is this Marcus?' },
        { from: 'me', msg: 'maybe' },
        { from: 'dad', msg: 'Sunday dinner. Bring him.' },
        { from: 'me', msg: 'i hate you sometimes ❤️' },
        { from: 'dad', msg: '6pm Sunday. No excuses.' },
      ],
    }
  },
  Allie: {
    contacts: { bf: 'Connor 🤍', dad: 'Dad 🏡' },
    threads: {
      bf: [
        { from: 'bf', msg: 'i can\'t stop thinking about last night' },
        { from: 'me', msg: 'me neither honestly' },
        { from: 'bf', msg: 'you were so different' },
        { from: 'me', msg: 'good different or bad different' },
        { from: 'bf', msg: 'allie. good. obviously.' },
        { from: 'me', msg: 'okay good because i was nervous' },
        { from: 'bf', msg: 'you didn\'t seem nervous' },
        { from: 'me', msg: 'i was hiding it' },
        { from: 'bf', msg: 'can we do that again tonight' },
        { from: 'me', msg: 'send me something to think about and i\'ll think about tonight' },
        { from: 'bf', msg: 'you first' },
        { from: 'me', msg: '📷 [Photo]', isPhoto: true, photoGirl: 'Allie' },
        { from: 'bf', msg: 'i am literally leaving work right now' },
        { from: 'me', msg: 'you have three hours left' },
        { from: 'bf', msg: 'i don\'t care' },
        { from: 'me', msg: 'stay. i\'ll be worth the wait.' },
        { from: 'bf', msg: 'you\'re going to be the death of me' },
        { from: 'me', msg: 'good 😇' },
      ],
      dad: [
        { from: 'me', msg: 'dad can i borrow the car saturday' },
        { from: 'dad', msg: 'Connor going?' },
        { from: 'me', msg: 'he\'s my boyfriend dad' },
        { from: 'dad', msg: 'Since when?!' },
        { from: 'me', msg: 'since like a month ago? i thought i told you' },
        { from: 'dad', msg: 'You did NOT tell me that.' },
        { from: 'me', msg: 'i\'m sorry omg' },
        { from: 'dad', msg: 'Bring him for dinner.' },
        { from: 'me', msg: 'don\'t make it weird' },
        { from: 'dad', msg: 'Car keys are on the hook. 12:30 curfew.' },
        { from: 'me', msg: 'deal ❤️' },
      ],
    }
  },
  Rileigh: {
    contacts: { bf: 'Devin 🏹', dad: 'Pop 🤠' },
    threads: {
      bf: [
        { from: 'bf', msg: 'i\'m still thinking about this morning' },
        { from: 'me', msg: 'lmaooo you\'re obsessed with me' },
        { from: 'bf', msg: 'obviously. you don\'t even try and you still—' },
        { from: 'me', msg: 'still what 👀' },
        { from: 'bf', msg: 'you drive me absolutely insane in the best way' },
        { from: 'me', msg: 'that\'s sweet. come pick me up after work' },
        { from: 'bf', msg: 'and then?' },
        { from: 'me', msg: '📷 [Photo]', isPhoto: true, photoGirl: 'Rileigh' },
        { from: 'bf', msg: 'you cannot just send me that while i\'m at work' },
        { from: 'me', msg: 'then work faster 😇' },
        { from: 'bf', msg: 'i\'m clocking out at 5 sharp' },
        { from: 'me', msg: 'i\'ll be ready 💋' },
        { from: 'bf', msg: 'already on 44' },
        { from: 'me', msg: 'it\'s 3pm devin' },
        { from: 'bf', msg: 'i know. i\'ll wait outside.' },
        { from: 'me', msg: 'you\'re insane' },
        { from: 'bf', msg: '❤️' },
      ],
      dad: [
        { from: 'dad', msg: 'You coming to thanksgiving or what' },
        { from: 'me', msg: 'of course pop' },
        { from: 'dad', msg: 'Is Devin coming?' },
        { from: 'me', msg: 'he doesn\'t have family here so yeah probably' },
        { from: 'dad', msg: 'As long as he\'s on time and respectful.' },
        { from: 'me', msg: 'he\'s very respectful pop you\'ll like him' },
        { from: 'dad', msg: 'Mhmm. We\'ll see.' },
        { from: 'me', msg: 'bring that potato salad. noon.' },
        { from: 'dad', msg: 'That\'s my line.' },
        { from: 'me', msg: 'love you 🤠' },
        { from: 'dad', msg: 'Love you baby girl.' },
      ],
    }
  },
  Macy: {
    contacts: { bf: 'Dre 🖤👑', dad: 'Daddy 🏠' },
    threads: {
      bf: [
        { from: 'bf', msg: 'where you at' },
        { from: 'me', msg: 'taking a bath. why' },
        { from: 'bf', msg: 'send a pic' },
        { from: 'me', msg: 'dre 😭 i\'m literally in the bath' },
        { from: 'bf', msg: 'i know' },
        { from: 'me', msg: '📷 [Photo]', isPhoto: true, photoGirl: 'Macy' },
        { from: 'bf', msg: 'i\'m coming home right now' },
        { from: 'me', msg: 'you have a meeting in 20 minutes' },
        { from: 'bf', msg: 'rescheduled' },
        { from: 'me', msg: 'stay in the bath. i\'ll be there in 10.' },
        { from: 'bf', msg: 'you have responsibilities dre' },
        { from: 'me', msg: 'you\'re my responsibility' },
        { from: 'bf', msg: 'okay that was smooth. come home.' },
        { from: 'me', msg: '🏃' },
      ],
      dad: [
        { from: 'me', msg: 'daddy can i borrow like $200' },
        { from: 'dad', msg: 'For what' },
        { from: 'me', msg: 'registration. Dre\'s been weird about money lately' },
        { from: 'dad', msg: 'What does weird about money mean' },
        { from: 'me', msg: 'just controlling. it\'s fine.' },
        { from: 'dad', msg: 'Macy.' },
        { from: 'me', msg: 'daddy it\'s fine please just the $200' },
        { from: 'dad', msg: 'Sending it now. He treats you right?' },
        { from: 'me', msg: 'yes. he just gets possessive sometimes.' },
        { from: 'dad', msg: 'Call me if that becomes more than sometimes.' },
        { from: 'me', msg: 'i will. love you 🫶' },
        { from: 'dad', msg: 'Love you more. You come first. Always.' },
      ],
    }
  }
};

let phoneHackGirl = null;
let phoneHackThread = null;

function buildPhoneHack() {
  const wrap = $('phoneHackWrap'); if (!wrap) return;
  logEvent('phone');
  wrap.innerHTML = `
    <div class="phone-hack-girls">
      ${Object.keys(PHONE_DATA).map(g => `
        <button class="phone-girl-btn ${phoneHackGirl===g?'on':''}" onclick="selectPhoneGirl('${g}')">${g}</button>
      `).join('')}
    </div>
    <div class="phone-device" id="phoneDevice">
      <div class="phone-notch"></div>
      <div class="phone-statusbar"><span>9:41</span><span>📶 🔋</span></div>
      <div class="phone-screen" id="phoneScreen">
        <div class="phone-locked">
          <div class="phone-lock-icon">🔓</div>
          <div class="phone-lock-text">Select a target above</div>
        </div>
      </div>
    </div>`;
}

window.selectPhoneGirl = function(girl) {
  phoneHackGirl = girl;
  phoneHackThread = 'bf';
  logGirl(girl);
  logEvent('address');
  renderPhoneDevice();
  buildPhoneHack(); // re-render to update active button
  renderPhoneDevice();
};

function renderPhoneDevice() {
  const screen = $('phoneScreen'); if (!screen || !phoneHackGirl) return;
  const data = PHONE_DATA[phoneHackGirl];
  const thread = data.threads[phoneHackThread];
  const contactName = data.contacts[phoneHackThread];
  screen.innerHTML = `
    <div class="phone-header">
      <button class="phone-back" onclick="renderPhoneContactList()">‹</button>
      <div class="phone-contact-name">${contactName}</div>
      <div class="phone-contact-dot">●</div>
    </div>
    <div class="phone-messages" id="phoneMessages">
      ${thread.map(m => {
        if (m.isPhoto) {
          const girl = m.photoGirl;
          const photos = SECRET_PHOTOS.filter(p=>p.model===girl);
          const photo = photos.length ? rand(photos) : null;
          const bubble = photo
            ? `<img src="${photo.src}" class="phone-photo-bubble" onclick="openModal(${JSON.stringify(photo).replace(/"/g,'&quot;')},true)" alt="">`
            : `<div class="phone-bubble phone-bubble-photo">📷 [Photo]</div>`;
          return `<div class="phone-msg ${m.from==='me'?'out':'in'}">${bubble}</div>`;
        }
        return `<div class="phone-msg ${m.from==='me'?'out':'in'}">
          <div class="phone-bubble">${m.msg}</div>
        </div>`;
      }).join('')}
    </div>`;
  setTimeout(() => {
    const msgs = $('phoneMessages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }, 50);
}

function renderPhoneContactList() {
  const screen = $('phoneScreen'); if (!screen || !phoneHackGirl) return;
  const data = PHONE_DATA[phoneHackGirl];
  screen.innerHTML = `
    <div class="phone-contacts-header">Messages</div>
    <div class="phone-contacts-list">
      ${Object.entries(data.contacts).map(([key, name]) => `
        <div class="phone-contact-row" onclick="selectThread('${key}')">
          <div class="phone-contact-avatar">${name[0]}</div>
          <div class="phone-contact-info">
            <div class="phone-contact-nm">${name}</div>
            <div class="phone-contact-preview">${data.threads[key].slice(-1)[0].msg.slice(0,40)}...</div>
          </div>
          <div class="phone-contact-time">now</div>
        </div>`).join('')}
    </div>`;
}

window.selectThread = function(thread) {
  phoneHackThread = thread;
  renderPhoneDevice();
};

// ═══════════════════════════════════════════════════════════════════
// ─── FAKE VOICEMAIL ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
const VOICEMAILS = {
  Nya: [
    { from: 'nya.barn', label: 'Nya', duration: '1:04', time: 'Today 2:17 AM', transcript: "Hey. It's me. Nya. Obviously. Okay so I've had a little bit to drink and I've been thinking about you for like three hours and I can't make it stop so I'm just calling. Don't read into it. Or do. I don't care. I keep thinking about what it would be like if Tyler wasn't a thing. Like genuinely. You'd be in so much trouble. I'd make sure of it. Okay I need to stop talking. Call me back if you want. Or come over. My parents are asleep. I'm not wearing much. Okay. Bye." },
    { from: 'nya.barn', label: 'Nya', duration: '0:42', time: 'Yesterday 11:44 PM', transcript: "I need you to delete the photo I sent earlier. Not because I regret it. I definitely don't regret it. I regret sending it to you specifically because now you have it and I have no control over that and it's driving me crazy. Don't show anyone. Actually I know you won't. That's why I sent it to you. God. Call me." },
    { from: 'nya.barn', label: 'Nya', duration: '1:18', time: 'Last week', transcript: "Okay I'm just going to say it. That night at the party when we were alone for like 20 minutes and nothing happened — I've been thinking about that for two weeks. Nothing happened and I still can't stop thinking about it. What does that mean. Don't answer that. Actually answer it. I want to know what would have happened if you had just kissed me. I was waiting for it. I'm just going to go ahead and say I was waiting for it. Tyler would lose his mind. Which is part of the appeal honestly. I'm a terrible person. Okay. Call me back. Or don't. Either way I'm thinking about you." },
    { from: 'nya.barn', label: 'Nya', duration: '0:22', time: '3 days ago', transcript: "You were outside my street tonight. I saw the car. I'm not mad. I want you to know I'm not mad. I'm the opposite of mad. Come back." },
    { from: 'Unknown', label: 'Unknown #', duration: '0:06', time: '5 days ago', transcript: "...I can still smell your cologne in my room. I don't hate it." },
  ],
  Remi: [
    { from: 'remibarn', label: 'Remi', duration: '1:10', time: 'Today 1:03 AM', transcript: "Jake is asleep. He's literally right next to me and I'm in the bathroom calling you and I don't even know what that says about me but here we are. I've been thinking about you since Tuesday and it's Friday and it hasn't stopped. I don't know what to do with that. I know what I want to do with it. I just can't. Or I won't. There's a difference. If things were different — if Jake wasn't here — I would have been at your place so fast. Like embarrassingly fast. You'd have to pretend not to notice how fast. Okay. I'm going back to bed. Delete this. Don't delete this." },
    { from: 'remibarn', label: 'Remi', duration: '0:55', time: 'Yesterday 10:30 PM', transcript: "I don't know if you know this but when you look at me the way you do in public I can feel it. Like physically. And then I have to go home to Jake and pretend I'm fully present and I'm not. I'm still thinking about the way you looked at me. That's on you. That is entirely on you. I want to see you. I know I shouldn't. I want to anyway. Text me back if you're up." },
    { from: 'remibarn', label: 'Remi', duration: '0:18', time: '2 days ago', transcript: "I sent you something. It was an accident. It was not an accident. Okay it was not an accident. Don't bring it up in front of Jake. Do bring it up when we're alone." },
    { from: 'remibarn', label: 'Remi', duration: '0:48', time: 'Last week', transcript: "The thing about you is that you make me want to be stupid and I'm not stupid. I've never been stupid. And then you exist and I'm suddenly willing to blow up everything I have for one night and that's insane. I know that's insane. Call me back so I can make the insane decision." },
    { from: 'remibarn', label: 'Remi', duration: '0:10', time: '10 days ago', transcript: "If you ever tell anyone I called you this many times I will deny it to my grave." },
  ],
  Stella: [
    { from: 'stella_thomas08', label: 'Stella', duration: '1:05', time: 'Tonight 12:58 AM', transcript: "Okay so Marcus and I got into it again and I'm in my car outside on Sandusky and I'm calling you because you're the person I want to talk to right now. Not him. You. Make of that what you will. I've been thinking about what it would be like to just let something happen between us and stop pretending like I don't want it to. I want it to. I've wanted it to for months. I'm single in every way that matters and I know that sounds like something a messy girl would say but I don't think I'm that messy. I just want you. Is that okay to say? Call me back." },
    { from: 'stella_thomas08', label: 'Stella', duration: '0:44', time: 'Yesterday 9:15 PM', transcript: "I just got out of the shower and I'm lying in bed thinking about you and I figured I'd just call and say that out loud. You make me feel things I haven't felt in a while. Like since before Marcus. That dangerous feeling. Like something could actually happen. I miss that feeling. I think you give me that feeling. Come over if you want. I'm alone. I'll leave the light on." },
    { from: 'stella_thomas08', label: 'Stella', duration: '0:09', time: '4 days ago', transcript: "Your car was on my street. I noticed. I didn't mind." },
    { from: 'stella_thomas08', label: 'Stella', duration: '1:00', time: 'Last week', transcript: "I'm going to be honest with you because I think you can handle it. I think about you when I'm with Marcus. Not always. But enough that I feel guilty about it. And the guilt means something, right? Like you don't feel guilty about people you don't actually want. I actually want you. There. Said it. If you want to come to 6449 Sandusky tonight I'll make sure Marcus isn't around. It's your call." },
  ],
  Allie: [
    { from: 'Unknown', label: 'Allie', duration: '0:52', time: 'Today 11:22 PM', transcript: "I know this is going to sound weird but I've been getting calls from this number and I finally just want to know who it is. I'm not scared, I'm honestly a little curious. I don't know. There's something about the fact that you keep calling and not saying anything that's kind of — this is embarrassing — kind of exciting? I don't know what that says about me. Text me. Or just say something next time you call. I'll pick up." },
    { from: 'Unknown', label: 'Allie', duration: '1:02', time: '2 days ago', transcript: "Okay so I asked around and I think I know who this is. And if I'm right — hi. I've noticed you too. I just don't make the first move. Clearly you do, even if it's in the weirdest possible way. I'm in Tulsa. You can figure out the rest. If you actually want to talk to me, say something. I'm more interesting than you'd expect." },
    { from: 'Unknown', label: 'Allie', duration: '0:30', time: '5 days ago', transcript: "I had a dream about you last night. I know that's unhinged to say on a voicemail to someone I've never officially met. I'm saying it anyway. Call me back. Or come find me. Either one." },
    { from: 'Unknown', label: 'Allie', duration: '0:14', time: 'Last week', transcript: "I'm not wearing anything I'd want my dad to see me in right now and I thought about calling you. So I did. Bye." },
  ],
  Rileigh: [
    { from: 'rileigh_l_s', label: 'Rileigh', duration: '1:08', time: 'Tonight 2:44 AM', transcript: "I just got home and I'm still kind of keyed up and I had such a good time tonight and I don't want it to be over. I keep replaying the part where you had your hand on my waist when we were walking and you probably didn't even think about it and I haven't stopped thinking about it. Come back to Sapulpa. I know it's a drive. I know it's late. I am worth the drive and we both know that. My address is 320 N 14th. I'll leave the porch light on. If you get here I'll make sure you don't regret it." },
    { from: 'rileigh_l_s', label: 'Rileigh', duration: '0:50', time: 'Yesterday 8:00 PM', transcript: "You know what's funny? Guys drive from Tulsa for me all the time and I never really feel anything. And then there's you. And I feel everything. That's annoying. I didn't ask to feel everything. I'd like to feel it a little more though. Come over. Bring food. Stay late. My number is 918-261-6532 if you somehow lost it." },
    { from: 'rileigh_l_s', label: 'Rileigh', duration: '0:58', time: '3 days ago', transcript: "Okay real talk. I want you to come here and I want to do things that are not appropriate to leave in a voicemail and I figure if I just say that plainly then we can stop dancing around it. I've been thinking about it for a while. I want to do all of it. You know where I live. Make the drive." },
    { from: 'rileigh_l_s', label: 'Rileigh', duration: '0:11', time: 'Last week', transcript: "I drove past your place. Not on purpose. Three times." },
  ],
  Macy: [
    { from: 'addison_and_macy', label: 'Macy', duration: '1:02', time: 'Today 11:01 PM', transcript: "Dre's out. He's going to be gone until at least 1. I'm just going to say that and let you do whatever you want with that information. I've been thinking about you more than I should be. Way more. Like it's a problem. I get why girls go stupid for guys like you. I'm going stupid for you and I'm not usually stupid. I know what I'm doing. I'm choosing to do it anyway. My number is 918-805-3623. Text me if you want to come over. I'll make it very worth your time." },
    { from: 'addison_and_macy', label: 'Macy', duration: '0:48', time: '2 days ago', transcript: "I sent you something earlier and I've been nervous about it ever since and Dre is sitting right next to me and has no idea and that should bother me more than it does. You make me want to be reckless. I'm not usually reckless. I'm being reckless. Text me back. Don't save my name in your phone." },
    { from: 'addison_and_macy', label: 'Macy', duration: '0:20', time: '5 days ago', transcript: "If Dre ever saw these messages I'd have a real problem. He's big. You know he's big. I'm still calling you. That should tell you something about how bad I want to." },
    { from: 'addison_and_macy', label: 'Macy', duration: '0:55', time: 'Last week', transcript: "I'm in the bath right now and I'm calling you because I'm bored and Dre's asleep and I have your number and I've been saying I wouldn't use it for two months. Guess I'm using it. I'm not going to pretend I don't know exactly what I'm doing. I know exactly what I'm doing. Come get me before I talk myself out of it. 918-805-3623. I'll pick up." },
  ],
};

let vmGirl = null;
let vmPlaying = null;

function buildVoicemail() {
  const wrap = $('voicemailWrap'); if (!wrap) return;
  wrap.innerHTML = `
    <div class="vm-girl-select">
      ${Object.keys(VOICEMAILS).map(g => `
        <button class="vm-girl-btn ${vmGirl===g?'on':''}" onclick="selectVMGirl('${g}')">${g}</button>
      `).join('')}
    </div>
    <div id="vmListWrap">
      ${!vmGirl ? '<div class="vm-empty">Select a girl to access her voicemails.</div>' : renderVMList(vmGirl)}
    </div>`;
}

function renderVMList(girl) {
  const vms = VOICEMAILS[girl];
  return vms.map((vm, i) => `
    <div class="vm-item ${vmPlaying===`${girl}-${i}`?'playing':''}" id="vm-${girl}-${i}">
      <div class="vm-avatar">${vm.label[0]}</div>
      <div class="vm-meta">
        <div class="vm-from">${vm.label} — <span class="vm-number">${vm.from}</span></div>
        <div class="vm-time">${vm.time}</div>
      </div>
      <div class="vm-duration">${vm.duration}</div>
      <button class="vm-play-btn" onclick="playVoicemail('${girl}',${i})">
        ${vmPlaying===`${girl}-${i}` ? '⏸' : '▶'}
      </button>
    </div>
    <div class="vm-transcript-wrap ${vmPlaying===`${girl}-${i}`?'open':''}" id="vmtr-${girl}-${i}">
      <div class="vm-scrubber-wrap">
        <div class="vm-scrubber-bg"><div class="vm-scrubber-fill" id="vmfill-${girl}-${i}"></div></div>
      </div>
      <div class="vm-transcript" id="vmt-${girl}-${i}"></div>
    </div>`).join('');
}

let vmTimers = [];
window.selectVMGirl = function(girl) {
  vmGirl = girl;
  vmPlaying = null;
  vmTimers.forEach(clearTimeout);
  buildVoicemail();
};

window.playVoicemail = function(girl, idx) {
  const key = `${girl}-${idx}`;
  vmTimers.forEach(clearTimeout);
  vmTimers = [];
  // if already playing, stop (but keep transcript open)
  if (vmPlaying === key) {
    vmPlaying = null;
    // just re-render play button state, keep transcript visible
    const playBtn = document.querySelector(`#vm-${girl}-${idx} .vm-play-btn`);
    if (playBtn) playBtn.textContent = '▶';
    const fill = $(`vmfill-${girl}-${idx}`);
    if (fill) { fill.style.transition='none'; fill.style.width='0%'; }
    return;
  }
  vmPlaying = key;
  // update all play buttons
  document.querySelectorAll('.vm-play-btn').forEach(b => b.textContent = '▶');
  const playBtn = document.querySelector(`#vm-${girl}-${idx} .vm-play-btn`);
  if (playBtn) playBtn.textContent = '⏸';
  // open transcript panel
  document.querySelectorAll('.vm-transcript-wrap').forEach(el => el.classList.remove('open'));
  const trWrap = $(`vmtr-${girl}-${idx}`);
  if (trWrap) trWrap.classList.add('open');
  // animate scrubber
  const fill = $(`vmfill-${girl}-${idx}`);
  if (fill) { fill.style.transition='none'; fill.style.width='0%'; setTimeout(()=>{ fill.style.transition='width 8s linear'; fill.style.width='100%'; },50); }
  // type out transcript — stays on screen when done, no auto-close
  const vm = VOICEMAILS[girl][idx];
  const tEl = $(`vmt-${girl}-${idx}`);
  if (tEl) {
    tEl.textContent = '';
    const chars = vm.transcript.split('');
    chars.forEach((ch, i) => {
      vmTimers.push(setTimeout(() => { tEl.textContent += ch; }, i * 22));
    });
    // when done typing, just change play button back — transcript stays
    vmTimers.push(setTimeout(() => {
      vmPlaying = null;
      if (playBtn) playBtn.textContent = '▶';
    }, chars.length * 22 + 200));
  }
};

// ═══════════════════════════════════════════════════════════════════
// ─── WANTED POSTER ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
const WANTED_CHARGES = {
  Nya:     ['Extreme attractiveness in a public area','Known to be armed with a smile that ends relationships','Last seen breaking hearts on S Delaware Pl','Considered emotionally dangerous','Approach only if you accept the consequences'],
  Remi:    ['Unlawful possession of a boyfriend while being this fine','Flirting in the first degree','Known associate of bad decisions','Fled the scene of multiple situationships','Last seen at 1722 S Delaware — consider yourself warned'],
  Stella:  ['Aggravated hotness — premeditated','Known to make men drive to Sandusky Ave uninvited','Operating as the town favorite without a license','Charges pending: being single while looking like that','Last seen making poor decisions on purpose'],
  Allie:   ['Conspiracy to be suspiciously hot','Identity unknown — considered extremely dangerous','Operating in the Tulsa area under the radar','Charges: reserved exterior, unhinged interior','Whereabouts often unconfirmed'],
  Rileigh: ['Fleeing the scene of multiple Sapulpa incidents','Unlawful operation as a small-town heartbreaker','Known to receive calls at 2am — accepts collect','Last known address: 320 N 14th St, Sapulpa','Approach only if you have a full tank of gas'],
  Macy:    ['Reckless endangerment of a taken woman','Known to call strangers from blocked numbers','Operating outside approved relationship boundaries','Fugitive from the 918-805-3623 jurisdiction','Last seen dating someone much larger than you'],
};

function buildWanted() {
  const wrap = $('wantedWrap'); if (!wrap) return;
  const girls = Object.keys(DOSSIER);
  wrap.innerHTML = `
    <div class="wanted-select">
      ${girls.map(g=>`<button class="wanted-girl-btn" onclick="generateWanted('${g}')">${g}</button>`).join('')}
    </div>
    <canvas id="wantedCanvas" class="wanted-canvas"></canvas>
    <button class="wanted-dl" id="wantedDL" style="display:none" onclick="downloadWanted()">⬇ Save Poster</button>`;
}

window.generateWanted = function(girl) {
  const photos = SECRET_PHOTOS.filter(p=>p.model===girl);
  if (!photos.length) { toast('No photos for ' + girl + ' yet'); return; }
  const photo = rand(photos);
  const canvas = $('wantedCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 500; canvas.height = 750;
  canvas.style.display = 'block';
  // load image then draw
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => drawWantedPoster(ctx, canvas, img, girl);
  img.onerror = () => drawWantedPoster(ctx, canvas, null, girl);
  img.src = photo.src;
};

function drawWantedPoster(ctx, canvas, img, girl) {
  const W = canvas.width, H = canvas.height;
  const d = DOSSIER[girl];
  const charges = WANTED_CHARGES[girl] || [];
  // aged paper bg
  ctx.fillStyle = '#c9a96e';
  ctx.fillRect(0,0,W,H);
  // texture — horizontal lines
  ctx.strokeStyle = 'rgba(100,60,10,0.08)';
  for(let y=0;y<H;y+=3){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  // border double
  ctx.strokeStyle = '#5a2d00'; ctx.lineWidth = 8;
  ctx.strokeRect(12,12,W-24,H-24);
  ctx.strokeStyle = '#5a2d00'; ctx.lineWidth = 2;
  ctx.strokeRect(20,20,W-40,H-40);
  // WANTED text
  ctx.fillStyle = '#1a0000';
  ctx.font = 'bold 72px serif';
  ctx.textAlign = 'center';
  ctx.fillText('WANTED', W/2, 80);
  // dead or alive
  ctx.font = 'italic 22px serif';
  ctx.fillText('Dead or Alive', W/2, 108);
  // divider
  ctx.fillStyle = '#5a2d00'; ctx.fillRect(40,118,W-80,2);
  // photo
  if (img) {
    const ph=260,pw=200,px=(W-pw)/2,py=126;
    ctx.save();
    ctx.shadowColor='rgba(0,0,0,0.4)'; ctx.shadowBlur=10;
    ctx.drawImage(img,px,py,pw,ph);
    ctx.restore();
    // photo border
    ctx.strokeStyle='#5a2d00';ctx.lineWidth=3;ctx.strokeRect(px,py,pw,ph);
  }
  // name banner
  ctx.fillStyle='#1a0000';
  ctx.font='bold 32px serif'; ctx.textAlign='center';
  ctx.fillText(d?.fullName||girl, W/2, 420);
  ctx.font='italic 15px serif';
  ctx.fillStyle='#3a1500';
  ctx.fillText(d?.nickname||'', W/2, 442);
  // divider
  ctx.fillStyle='#5a2d00'; ctx.fillRect(40,452,W-80,2);
  // charges
  ctx.font='bold 13px serif'; ctx.fillStyle='#1a0000'; ctx.textAlign='center';
  ctx.fillText('KNOWN CRIMES & VIOLATIONS:', W/2, 474);
  ctx.font='12px serif'; ctx.fillStyle='#2a0d00';
  charges.forEach((c,i)=>{
    ctx.fillText(`• ${c}`, W/2, 494+i*20);
  });
  // reward
  ctx.fillStyle='#5a2d00'; ctx.fillRect(40,600,W-80,2);
  ctx.font='bold 16px serif'; ctx.fillStyle='#1a0000'; ctx.textAlign='center';
  ctx.fillText('REWARD: YOUR ENTIRE WELLBEING', W/2, 625);
  ctx.font='11px serif'; ctx.fillStyle='#4a2000';
  ctx.fillText(`Last seen: ${d?.addr||'Tulsa, OK'} · ${d?.insta||''}`, W/2, 648);
  ctx.font='bold 10px serif'; ctx.fillStyle='#8a5020';
  ctx.fillText('TULSA COUNTY SHERIFF\'S DEPARTMENT — SGG DIVISION', W/2, 680);
  ctx.fillText('IF SEEN: DO NOT APPROACH ALONE', W/2, 698);
  // show DL button
  const dl = $('wantedDL'); if(dl) dl.style.display='inline-block';
}

window.downloadWanted = function() {
  const canvas = $('wantedCanvas'); if(!canvas) return;
  const a = document.createElement('a');
  a.download = 'wanted-poster.png';
  a.href = canvas.toDataURL();
  a.click();
};

// ═══════════════════════════════════════════════════════════════════
// ─── THE DROP ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
let dropTimer = null;
let dropUnlocked = false;
let dropEndTime = null;

function buildDrop() {
  const wrap = $('dropWrap'); if (!wrap) return;
  if (!dropEndTime) {
    // random 8–18 min from now
    dropEndTime = Date.now() + (8 + Math.random()*10) * 60000;
  }
  if (dropUnlocked) {
    renderDropUnlocked();
    return;
  }
  wrap.innerHTML = `
    <div class="drop-container">
      <div class="drop-eye">👁️</div>
      <div class="drop-title">SOMETHING'S COMING</div>
      <div class="drop-sub">Classified content drops when the timer hits zero.</div>
      <div class="drop-timer" id="dropTimer">--:--</div>
      <div class="drop-hint">Be here when it drops.</div>
      <div class="drop-bars">
        <div class="drop-bar"></div><div class="drop-bar"></div><div class="drop-bar"></div>
        <div class="drop-bar"></div><div class="drop-bar"></div>
      </div>
    </div>`;
  tickDrop();
}

function tickDrop() {
  clearTimeout(dropTimer);
  const el = $('dropTimer'); if (!el) return;
  const remaining = Math.max(0, dropEndTime - Date.now());
  if (remaining <= 0) {
    triggerDrop();
    return;
  }
  const m = Math.floor(remaining/60000);
  const s = Math.floor((remaining%60000)/1000);
  el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  dropTimer = setTimeout(tickDrop, 1000);
}

function triggerDrop() {
  dropUnlocked = true;
  // dramatic flash
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;background:#ff0000;z-index:99998;pointer-events:none;animation:dropFlash .8s ease forwards';
  document.body.appendChild(flash);
  setTimeout(()=>flash.remove(), 800);
  // alert sound via oscillator if available
  try {
    const ac = new AudioContext();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.frequency.setValueAtTime(880, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ac.currentTime+0.5);
    gain.gain.setValueAtTime(0.3, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime+0.5);
    osc.start(); osc.stop(ac.currentTime+0.5);
  } catch(e){}
  setTimeout(renderDropUnlocked, 900);
}

function renderDropUnlocked() {
  const wrap = $('dropWrap'); if (!wrap) return;
  const exclusivePhotos = shuffle([...SECRET_PHOTOS]).slice(0,6);
  wrap.innerHTML = `
    <div class="drop-unlocked">
      <div class="drop-unlocked-header">
        <div class="drop-unlocked-title">🔴 LIVE — THE DROP</div>
        <div class="drop-unlocked-sub">You were here. Others weren't.</div>
      </div>
      <div class="drop-tabs">
        <button class="drop-tab on" onclick="showDropTab('photos',this)">📸 Exclusive Gallery</button>
        <button class="drop-tab" onclick="showDropTab('chat',this)">💬 Leaked Chat</button>
        <button class="drop-tab" onclick="showDropTab('intel',this)">📁 Intel Drop</button>
      </div>
      <div id="dropTabContent">
        ${renderDropPhotos(exclusivePhotos)}
      </div>
    </div>`;
}

function renderDropPhotos(photos) {
  return `<div class="drop-gallery">${photos.map(p=>`
    <div class="drop-photo-card">
      <img src="${p.src}" alt="" onclick="openModal(${JSON.stringify(p).replace(/"/g,'&quot;')},true)">
      <div class="drop-photo-label">${p.model} — EXCLUSIVE</div>
    </div>`).join('')}</div>`;
}

window.showDropTab = function(tab, btn) {
  document.querySelectorAll('.drop-tab').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  const cont = $('dropTabContent'); if (!cont) return;
  if (tab === 'photos') {
    cont.innerHTML = renderDropPhotos(shuffle([...SECRET_PHOTOS]).slice(0,6));
  } else if (tab === 'chat') {
    const leaked = [
      { from: 'Jaquavion', msg: 'bro did you see she posted that at 2am' },
      { from: 'Cruz', msg: 'which one' },
      { from: 'Jaquavion', msg: 'the one from sandusky. she was outside at night bro' },
      { from: 'Jackson', msg: 'she does that every week' },
      { from: 'Cruz', msg: 'how do you know that' },
      { from: 'Jackson', msg: '...' },
      { from: 'Jaquavion', msg: '💀💀💀 bro how long have you been watching her page' },
      { from: 'Jackson', msg: 'that\'s not what this is' },
      { from: 'Cruz', msg: 'it\'s literally exactly what this is' },
      { from: 'Jack', msg: 'she texted me last thursday btw' },
      { from: 'Jaquavion', msg: 'WHO DID' },
      { from: 'Jack', msg: 'won\'t say' },
      { from: 'Cruz', msg: 'jack i will drive to your house' },
      { from: 'Jackson', msg: 'this is the drop content. this is what we waited for.' },
      { from: 'Jaquavion', msg: 'JACK SAY THE NAME' },
    ];
    cont.innerHTML = `<div class="drop-chat">${leaked.map(m=>`
      <div class="gc-msg">
        <span class="gc-sender" style="color:${GC_MEMBER_COLORS[m.from]||'#ff9944'}">${m.from}</span>
        <span class="gc-text">${m.msg}</span>
      </div>`).join('')}</div>`;
  } else if (tab === 'intel') {
    const girl = rand(Object.keys(DOSSIER));
    const d = DOSSIER[girl];
    cont.innerHTML = `
      <div class="drop-intel">
        <div class="drop-intel-banner">🔴 LEAKED — ${girl.toUpperCase()} DOSSIER</div>
        <div class="drop-intel-field"><span>Full Name</span>${d.fullName||girl}</div>
        <div class="drop-intel-field"><span>Address</span>${d.addr||'Unknown'}</div>
        <div class="drop-intel-field"><span>Phone</span>${d.phone||'Unknown'}</div>
        <div class="drop-intel-field"><span>Instagram</span>${d.insta||'Unknown'}</div>
        <div class="drop-intel-field"><span>Status</span>${d.status||'Unknown'}</div>
        <div class="drop-intel-field"><span>Threat Level</span>${d.threat||'?'}/10</div>
        <div class="drop-intel-field"><span>Weakness</span>${d.weakness||'Unknown'}</div>
        <div class="drop-intel-field"><span>Intel</span>${d.intel||d.notes||'Classified'}</div>
      </div>`;
  }
};

// ═══════════════════════════════════════════════════════════════════
// ─── RATE MY NIGHT ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
const DIAGNOSES = [
  { min:0,  max:15,  title:'Casual Observer',       color:'#7a9a7a', desc:'You barely committed. You were here for like 10 minutes. Respectable. Healthy even.' },
  { min:16, max:30,  title:'Interested Party',       color:'#a0a07a', desc:'You engaged. You looked. You didn\'t go too deep. Mostly fine.' },
  { min:31, max:50,  title:'Dedicated Viewer',       color:'#c0946a', desc:'You were here a while. You played games, you lingered. This is the beginning of a pattern.' },
  { min:51, max:70,  title:'Certified Lurker',       color:'#c06a3a', desc:'Multiple girls. Multiple sections. You checked the phone numbers section. You know what you are.' },
  { min:71, max:90,  title:'Menace to Society',      color:'#c04444', desc:'You\'ve done things tonight that would concern people who care about you. They\'d be right to be concerned.' },
  { min:91, max:120, title:'Unhinged. Full Send.',   color:'#ff2222', desc:'There is no coming back from this session. You ran stalker mode, you looked up addresses, you called numbers in the alibi game. You\'re different now.' },
];

function buildRateMyNight() {
  const wrap = $('rateNightWrap'); if (!wrap) return;
  const mins = Math.floor((Date.now() - sessionLog.startTime)/60000);
  const topGirl = Object.entries(sessionLog.girlClicks).sort((a,b)=>b[1]-a[1])[0];
  const score = Math.min(
    mins * 0.5 +
    sessionLog.gamesPlayed * 3 +
    sessionLog.stalkerSessions * 8 +
    sessionLog.addressChecks * 5 +
    sessionLog.phoneChecks * 4 +
    sessionLog.photosLiked * 1 +
    sessionLog.alibiRuns * 4 +
    sessionLog.smashVotes * 2 +
    (topGirl[1] * 2),
    120
  );
  const diag = DIAGNOSES.find(d=>score>=d.min&&score<=d.max) || DIAGNOSES[DIAGNOSES.length-1];
  const topGirlName = topGirl[1] > 0 ? topGirl[0] : null;
  wrap.innerHTML = `
    <div class="rmn-container">
      <div class="rmn-score-ring" style="border-color:${diag.color}">
        <div class="rmn-score-num" style="color:${diag.color}">${Math.round(score)}</div>
        <div class="rmn-score-label">/ 120</div>
      </div>
      <div class="rmn-title" style="color:${diag.color}">${diag.title}</div>
      <div class="rmn-desc">${diag.desc}</div>
      <div class="rmn-stats">
        <div class="rmn-stat"><span>${mins}m</span>Time In Vault</div>
        <div class="rmn-stat"><span>${sessionLog.gamesPlayed}</span>Games Played</div>
        <div class="rmn-stat"><span>${sessionLog.photosLiked}</span>Photos Liked</div>
        <div class="rmn-stat"><span>${sessionLog.stalkerSessions}</span>Stalker Sessions</div>
        <div class="rmn-stat"><span>${sessionLog.addressChecks}</span>Address Checks</div>
        <div class="rmn-stat"><span>${sessionLog.alibiRuns}</span>Alibi Runs</div>
      </div>
      ${topGirlName ? `<div class="rmn-top-girl">Primary target this session: <strong>${topGirlName}</strong> — ${DOSSIER[topGirlName]?.nickname||topGirlName}</div>` : ''}
      <button class="rmn-refresh vault-btn" onclick="buildRateMyNight()">↻ Recalculate</button>
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════
// ─── STALKER COMMENTARY ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
const STALKER_COMMENTARY = {
  Nya: [
    'posted this at 2:14am — no caption',
    'location off, but you know where she is',
    'she posted this the night Tyler was at work',
    '47 likes in the first 10 minutes',
    'she knows exactly what she\'s doing',
    'this was taken 3 blocks from home',
    '1722 S Delaware. she\'s probably still up.',
    '@nya.barn — she hasn\'t posted in 4 days. then this.',
  ],
  Remi: [
    'jake saw this. didn\'t say anything.',
    'posted then deleted then reposted',
    'her phone says 918-284-8365. she answers.',
    'this was a tuesday night. at 11pm.',
    'she was at Jake\'s two days before this',
    'look at her eyes. she\'s bored at home.',
    'she posted this story for someone specific.',
    'this is what showing off looks like.',
  ],
  Stella: [
    'Sandusky Ave at golden hour. she knew.',
    'look at this and tell me she doesn\'t know',
    'her phone: 918-998-5774. call it.',
    '6449 S Sandusky — you could be there in 12 minutes',
    'she posted this at exactly midnight',
    'marcus hasn\'t liked this. noted.',
    '@stella_thomas08 — 847 followers and climbing',
    'this is what single in Tulsa looks like',
  ],
  Allie: [
    'she doesn\'t post often. this meant something.',
    'no location. no context. just this.',
    'somewhere in Tulsa. you\'d recognize the area.',
    'she\'s quieter than the others. watch closer.',
    'no phone number on file yet. working on it.',
    'reserved exterior. something else underneath.',
    'allie doesn\'t give you much. what she gives is enough.',
    'she knows you\'re looking.',
  ],
  Rileigh: [
    '320 N 14th St, Sapulpa. 25 minutes from Tulsa.',
    'she made that drive worth it.',
    'this was posted at 1:47am from Sapulpa',
    'her number: 918-261-6532. she picks up late.',
    '@rileigh_l_s — she posts when she wants you to see',
    'she runs Sapulpa. everyone there knows her.',
    'this is what small town looks like when it\'s dangerous',
    'you\'d drive 25 minutes. don\'t lie.',
  ],
  Macy: [
    'Dre doesn\'t know you\'re watching this.',
    'she posted this while he was asleep.',
    '918-805-3623 — she has it on do not disturb at night',
    '@addison_and_macy — she\'s the reason for the account',
    'he\'s big. you\'re watching anyway.',
    'this is why Dre checks her phone.',
    'she\'s taken. this photo knows that and doesn\'t care.',
    'she posted this and then texted someone who isn\'t him.',
  ],
};

// inject commentary into stalker mode
const _origShowStalkerPhoto = showStalkerPhoto;
window.showStalkerPhoto = function() {
  _origShowStalkerPhoto();
  logEvent('stalker');
  // add commentary overlay after a short delay
  clearTimeout(window._stalkerCommentaryTimer);
  window._stalkerCommentaryTimer = setTimeout(() => {
    let el = $('stalkerCommentary');
    if (!el) {
      el = document.createElement('div');
      el.id = 'stalkerCommentary';
      el.className = 'stalker-commentary';
      $('stalkerOverlay')?.appendChild(el);
    }
    const overlay = $('stalkerOverlay');
    if (!overlay?.classList.contains('show')) return;
    // get current photo model
    const photo = stalkerPhotos[stalkerIdx % stalkerPhotos.length];
    const model = photo?.model;
    const lines = STALKER_COMMENTARY[model] || Object.values(STALKER_COMMENTARY).flat();
    el.textContent = rand(lines);
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), stalkerInterval - 600);
  }, 800);
};

// ═══════════════════════════════════════════════════════════════════
// ─── WIRE UP NEW SECTIONS ───────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
const _origNewSectionClick = null;
document.addEventListener('click', function(e) {
  const btn = e.target.closest('[data-ssection]');
  if (!btn) return;
  const id = btn.dataset.ssection;
  setTimeout(() => {
    if (id === 'sphonehack') buildPhoneHack();
    if (id === 'svoicemail') buildVoicemail();
    if (id === 'swanted') buildWanted();
    if (id === 'sdrop') buildDrop();
    if (id === 'sratemynight') buildRateMyNight();
  }, 50);
});
// ═══════════════════════════════════════════════════════
// ADD THIS TO THE END OF app.js
// ═══════════════════════════════════════════════════════

// ─── THE ROSTER ──────────────────────────────────────────────────────────────
const rosterState = {
  face: null,
  tits: null,
  ass: null,
  legs: null,
  feet: null
};

function initRoster() {
  // Click handlers for each slot
  ['face', 'tits', 'ass', 'legs', 'feet'].forEach(part => {
    const slot = $(`roster${part.charAt(0).toUpperCase() + part.slice(1)}`);
    if (slot) {
      slot.addEventListener('click', () => selectForRoster(part));
    }
  });

  // Random build button
  const randomBtn = $('rosterRandom');
  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      ['face', 'tits', 'ass', 'legs', 'feet'].forEach(part => {
        const randomPhoto = rand(PHOTOS);
        rosterState[part] = randomPhoto;
        updateRosterSlot(part, randomPhoto);
      });
      toast('Random build complete! 🔥');
    });
  }

  // Clear button
  const clearBtn = $('rosterClear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      ['face', 'tits', 'ass', 'legs', 'feet'].forEach(part => {
        rosterState[part] = null;
        const slot = $(`roster${part.charAt(0).toUpperCase() + part.slice(1)}`);
        if (slot) {
          slot.style.backgroundImage = '';
          slot.innerHTML = 'Click to select';
          slot.classList.remove('filled');
        }
      });
      toast('Roster cleared');
    });
  }
}

function selectForRoster(part) {
  // Show modal to pick a photo from gallery
  const photos = PHOTOS;
  if (!photos.length) return;

  // Create selection overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.background = 'rgba(0,0,0,0.95)';
  
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
  grid.style.gap = '8px';
  grid.style.maxWidth = '90%';
  grid.style.maxHeight = '80vh';
  grid.style.overflow = 'auto';
  grid.style.padding = '20px';

  photos.forEach(photo => {
    const img = document.createElement('img');
    img.src = photo.src;
    img.style.width = '100%';
    img.style.height = '150px';
    img.style.objectFit = 'cover';
    img.style.cursor = 'pointer';
    img.style.border = '2px solid var(--border)';
    img.style.transition = 'all 0.3s';
    
    img.addEventListener('mouseenter', () => {
      img.style.borderColor = 'var(--pink)';
      img.style.transform = 'scale(1.05)';
    });
    img.addEventListener('mouseleave', () => {
      img.style.borderColor = 'var(--border)';
      img.style.transform = 'scale(1)';
    });
    
    img.addEventListener('click', () => {
      rosterState[part] = photo;
      updateRosterSlot(part, photo);
      document.body.removeChild(overlay);
      toast(`${part.toUpperCase()} selected: ${photo.model}`);
    });
    
    grid.appendChild(img);
  });

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.position = 'fixed';
  closeBtn.style.top = '20px';
  closeBtn.style.right = '20px';
  closeBtn.style.background = 'var(--bg)';
  closeBtn.style.border = '1px solid var(--pink)';
  closeBtn.style.color = 'var(--pink)';
  closeBtn.style.padding = '10px 20px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontSize = '20px';
  closeBtn.addEventListener('click', () => document.body.removeChild(overlay));

  overlay.appendChild(grid);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
}

function updateRosterSlot(part, photo) {
  const slot = $(`roster${part.charAt(0).toUpperCase() + part.slice(1)}`);
  if (!slot) return;
  
  slot.style.backgroundImage = `url(${photo.src})`;
  slot.innerHTML = `<div class="roster-model-name">${photo.model}</div>`;
  slot.classList.add('filled');
}

// Initialize roster when game tab is opened
document.querySelector('[data-pane="paneRoster"]')?.addEventListener('click', () => {
  setTimeout(initRoster, 100);
});

// ─── BINGO ───────────────────────────────────────────────────────────────────
const BINGO_OBJECTIVES = [
  'Mirror Selfie', 'Red Bikini', 'White Dress', 'Feet Pic', 'Pool/Beach',
  'Bedroom Shot', 'Black Outfit', 'Lingerie', 'Outdoor', 'Tight Dress',
  'Bikini Top', 'Shorts', 'Night Out', 'Casual Fit', 'Gym/Athletic',
  'Heels', 'Sunglasses', 'Car Selfie', 'Bathroom Mirror', 'Group Pic',
  'Close-Up Face', 'Full Body', 'Side Pose', 'Back View', 'Selfie Angle'
];

let bingoCard = [];
let bingoMarked = new Set();

function initBingo() {
  bingoMarked.clear();
  createBingoCard();
  renderBingoBoard();
}

function createBingoCard() {
  const shuffled = shuffle([...BINGO_OBJECTIVES]);
  bingoCard = shuffled.slice(0, 25);
  // Make center square "FREE"
  bingoCard[12] = 'FREE';
  bingoMarked.add(12);
}

function renderBingoBoard() {
  const board = $('bingoBoard');
  if (!board) return;
  
  board.innerHTML = '';
  bingoCard.forEach((obj, idx) => {
    const cell = document.createElement('div');
    cell.className = 'bingo-cell';
    if (obj === 'FREE') cell.classList.add('free');
    if (bingoMarked.has(idx)) cell.classList.add('marked');
    cell.textContent = obj;
    cell.style.position = 'relative';
    
    if (obj !== 'FREE') {
      cell.addEventListener('click', () => {
        if (bingoMarked.has(idx)) {
          bingoMarked.delete(idx);
          cell.classList.remove('marked');
        } else {
          bingoMarked.add(idx);
          cell.classList.add('marked');
        }
        checkBingo();
      });
    }
    
    board.appendChild(cell);
  });
}

function checkBingo() {
  const status = $('bingoStatus');
  if (!status) return;
  
  // Check rows
  for (let row = 0; row < 5; row++) {
    let win = true;
    for (let col = 0; col < 5; col++) {
      if (!bingoMarked.has(row * 5 + col)) {
        win = false;
        break;
      }
    }
    if (win) {
      status.textContent = '🎉 BINGO! ROW ' + (row + 1) + '! 🎉';
      status.classList.add('bingo-win');
      return;
    }
  }
  
  // Check columns
  for (let col = 0; col < 5; col++) {
    let win = true;
    for (let row = 0; row < 5; row++) {
      if (!bingoMarked.has(row * 5 + col)) {
        win = false;
        break;
      }
    }
    if (win) {
      status.textContent = '🎉 BINGO! COLUMN ' + (col + 1) + '! 🎉';
      status.classList.add('bingo-win');
      return;
    }
  }
  
  // Check diagonals
  let diag1 = true, diag2 = true;
  for (let i = 0; i < 5; i++) {
    if (!bingoMarked.has(i * 5 + i)) diag1 = false;
    if (!bingoMarked.has(i * 5 + (4 - i))) diag2 = false;
  }
  if (diag1) {
    status.textContent = '🎉 BINGO! DIAGONAL! 🎉';
    status.classList.add('bingo-win');
    return;
  }
  if (diag2) {
    status.textContent = '🎉 BINGO! DIAGONAL! 🎉';
    status.classList.add('bingo-win');
    return;
  }
  
  // No bingo
  status.textContent = `${bingoMarked.size - 1} / 24 marked`;
  status.classList.remove('bingo-win');
}

// New card button
$('bingoNew')?.addEventListener('click', initBingo);

// Initialize when tab opened
document.querySelector('[data-pane="paneBingo"]')?.addEventListener('click', () => {
  if (bingoCard.length === 0) initBingo();
});

// ─── LAST SEEN ───────────────────────────────────────────────────────────────
const LAST_SEEN_MODELS = ['Nya', 'Remi', 'Stella', 'Allie', 'Rileigh', 'Macy'];

const SIGHTING_TEMPLATES = [
  '{model} spotted at Utica Square, wearing {outfit}. 2:47 PM.',
  'Confirmed sighting: {model} at Brookside. {outfit}. Just now.',
  '{model} seen leaving Whole Foods. {outfit}. 30 mins ago.',
  'URGENT: {model} downtown on Cherry Street. {outfit}.',
  '{model} at Starbucks 71st & Yale. {outfit}. She looked back.',
  'Eyes on {model} - TU campus area. {outfit}. Moving north.',
  '{model} confirmed at Gathering Place. {outfit}. Still there.',
  '{model} spotted at Target. {outfit}. Aisle 7. Go now.',
  'Update: {model} seen at Woodland Hills Mall. {outfit}.',
  '{model} leaving LA Fitness. {outfit}. Heading to parking lot.',
];

const OUTFIT_DESC = [
  'tight black dress',
  'white crop top and jeans',
  'red bikini top visible under tank',
  'oversized hoodie, leggings',
  'sundress, looks incredible',
  'all black everything',
  'gym fit, sports bra showing',
  'barely-there shorts',
  'designer bag, heels',
  'casual but dangerous',
];

const INSTA_STATUSES = [
  'Active now',
  'Active 3m ago',
  'Active 15m ago',
  'Active 1h ago',
  'Last seen today at 2:47 AM',
  'Last seen yesterday at 11:32 PM',
  'Active 2h ago',
];

function updateLastSeen() {
  const instaEl = $('lastSeenInsta');
  if (!instaEl) return;
  
  instaEl.innerHTML = LAST_SEEN_MODELS.map(model => {
    const isOnline = Math.random() > 0.7;
    const status = isOnline ? 'Active now' : rand(INSTA_STATUSES);
    
    return `
      <div class="insta-girl">
        <div class="insta-avatar ${isOnline ? 'online' : ''}"></div>
        <div class="insta-info">
          <div class="insta-name">@${model.toLowerCase()}</div>
          <div class="insta-status ${isOnline ? 'online' : ''}">${status}</div>
        </div>
      </div>
    `;
  }).join('');
}

function addSighting() {
  const board = $('sightingBoard');
  if (!board) return;
  
  const model = rand(LAST_SEEN_MODELS);
  const outfit = rand(OUTFIT_DESC);
  const template = rand(SIGHTING_TEMPLATES);
  const text = template.replace('{model}', model).replace('{outfit}', outfit);
  const time = Math.floor(Math.random() * 60) + ' mins ago';
  
  const pin = document.createElement('div');
  pin.className = 'sighting-pin';
  pin.style.animation = 'fadeInUp 0.4s ease';
  pin.innerHTML = `
    <div class="sighting-header">
      <div class="sighting-model">${model}</div>
      <div class="sighting-time">${time}</div>
    </div>
    <div class="sighting-text">"${text}"</div>
    <div class="sighting-location">📍 Tulsa, OK</div>
  `;
  
  board.insertBefore(pin, board.firstChild);
  
  // Keep only last 20 sightings
  while (board.children.length > 20) {
    board.removeChild(board.lastChild);
  }
}

// Initialize Last Seen when vault opens
function initLastSeen() {
  updateLastSeen();
  
  // Add initial sightings
  for (let i = 0; i < 8; i++) {
    setTimeout(() => addSighting(), i * 200);
  }
  
  // Update Instagram statuses every 30 seconds
  setInterval(updateLastSeen, 30000);
  
  // Add new sighting every 20-40 seconds
  setInterval(() => {
    if (Math.random() > 0.3) { // 70% chance
      addSighting();
    }
  }, 20000 + Math.random() * 20000);
}

// Call this when vault content is initialized
// Add to your existing initVaultContent() function:
// initLastSeen();

// ═══════════════════════════════════════════════════════
// ADD THIS LINE TO YOUR EXISTING initVaultContent() FUNCTION
// (around line 141 in your original app.js)
// ═══════════════════════════════════════════════════════
// initLastSeen();

// ─── VAULT ROSTER ────────────────────────────────────────────────────────────
const vaultRosterState = {
  face: null,
  tits: null,
  ass: null,
  legs: null,
  feet: null
};

function initVaultRoster() {
  // Click handlers for each vault slot
  ['face', 'tits', 'ass', 'legs', 'feet'].forEach(part => {
    const slot = $(`vaultRoster${part.charAt(0).toUpperCase() + part.slice(1)}`);
    if (slot) {
      slot.addEventListener('click', () => selectForVaultRoster(part));
    }
  });

  // Random build button
  const randomBtn = $('vaultRosterRandom');
  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      ['face', 'tits', 'ass', 'legs', 'feet'].forEach(part => {
        const randomPhoto = rand(SECRET_PHOTOS);
        vaultRosterState[part] = randomPhoto;
        updateVaultRosterSlot(part, randomPhoto);
      });
      toast('Perfect build complete! 💀');
    });
  }

  // Clear button
  const clearBtn = $('vaultRosterClear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      ['face', 'tits', 'ass', 'legs', 'feet'].forEach(part => {
        vaultRosterState[part] = null;
        const slot = $(`vaultRoster${part.charAt(0).toUpperCase() + part.slice(1)}`);
        if (slot) {
          slot.style.backgroundImage = '';
          slot.innerHTML = 'Click to select';
          slot.classList.remove('filled');
        }
      });
      toast('Roster cleared');
    });
  }
}

function selectForVaultRoster(part) {
  const photos = SECRET_PHOTOS;
  if (!photos.length) return;

  // Create selection overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.background = 'rgba(0,0,0,0.95)';
  
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
  grid.style.gap = '8px';
  grid.style.maxWidth = '90%';
  grid.style.maxHeight = '80vh';
  grid.style.overflow = 'auto';
  grid.style.padding = '20px';

  photos.forEach(photo => {
    const img = document.createElement('img');
    img.src = photo.src;
    img.style.width = '100%';
    img.style.height = '150px';
    img.style.objectFit = 'cover';
    img.style.cursor = 'pointer';
    img.style.border = '2px solid var(--red2)';
    img.style.transition = 'all 0.3s';
    
    img.addEventListener('mouseenter', () => {
      img.style.borderColor = 'var(--red)';
      img.style.transform = 'scale(1.05)';
      img.style.boxShadow = '0 0 20px rgba(255, 34, 34, 0.5)';
    });
    img.addEventListener('mouseleave', () => {
      img.style.borderColor = 'var(--red2)';
      img.style.transform = 'scale(1)';
      img.style.boxShadow = 'none';
    });
    
    img.addEventListener('click', () => {
      vaultRosterState[part] = photo;
      updateVaultRosterSlot(part, photo);
      document.body.removeChild(overlay);
      toast(`${part.toUpperCase()} selected: ${photo.model}`);
    });
    
    grid.appendChild(img);
  });

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.position = 'fixed';
  closeBtn.style.top = '20px';
  closeBtn.style.right = '20px';
  closeBtn.style.background = 'var(--bg)';
  closeBtn.style.border = '1px solid var(--red)';
  closeBtn.style.color = 'var(--red)';
  closeBtn.style.padding = '10px 20px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontSize = '20px';
  closeBtn.addEventListener('click', () => document.body.removeChild(overlay));

  overlay.appendChild(grid);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
}

function updateVaultRosterSlot(part, photo) {
  const slot = $(`vaultRoster${part.charAt(0).toUpperCase() + part.slice(1)}`);
  if (!slot) return;
  
  slot.style.backgroundImage = `url(${photo.src})`;
  slot.innerHTML = `<div class="roster-model-name">${photo.model}</div>`;
  slot.classList.add('filled');
}

// ─── VAULT BINGO ─────────────────────────────────────────────────────────────
const VAULT_BINGO_OBJECTIVES = [
  'Feet Focus', 'Lace Lingerie', 'Bedroom Eyes', 'Upskirt Angle', 'Shower Shot',
  'Cleavage Close-Up', 'Thigh Highs', 'Wet Look', 'See-Through', 'Bent Over',
  'Back Arch', 'Legs Spread', 'Hands Covered', 'Oil/Lotion', 'In Bed',
  'POV Angle', 'Side Boob', 'Underboob', 'Biting Lip', 'Touching Self',
  'Mirror Tease', 'Stockings', 'Straps Down', 'Ass Focus', 'Secret Revealed'
];

let vaultBingoCard = [];
let vaultBingoMarked = new Set();

function initVaultBingo() {
  vaultBingoMarked.clear();
  createVaultBingoCard();
  renderVaultBingoBoard();
}

function createVaultBingoCard() {
  const shuffled = shuffle([...VAULT_BINGO_OBJECTIVES]);
  vaultBingoCard = shuffled.slice(0, 25);
  vaultBingoCard[12] = 'FREE';
  vaultBingoMarked.add(12);
}

function renderVaultBingoBoard() {
  const board = $('vaultBingoBoard');
  if (!board) return;
  
  board.innerHTML = '';
  vaultBingoCard.forEach((obj, idx) => {
    const cell = document.createElement('div');
    cell.className = 'bingo-cell';
    if (obj === 'FREE') cell.classList.add('free');
    if (vaultBingoMarked.has(idx)) cell.classList.add('marked');
    cell.textContent = obj;
    cell.style.position = 'relative';
    
    if (obj !== 'FREE') {
      cell.addEventListener('click', () => {
        if (vaultBingoMarked.has(idx)) {
          vaultBingoMarked.delete(idx);
          cell.classList.remove('marked');
        } else {
          vaultBingoMarked.add(idx);
          cell.classList.add('marked');
        }
        checkVaultBingo();
      });
    }
    
    board.appendChild(cell);
  });
}

function checkVaultBingo() {
  const status = $('vaultBingoStatus');
  if (!status) return;
  
  // Check rows
  for (let row = 0; row < 5; row++) {
    let win = true;
    for (let col = 0; col < 5; col++) {
      if (!vaultBingoMarked.has(row * 5 + col)) {
        win = false;
        break;
      }
    }
    if (win) {
      status.textContent = '🔥 BINGO! You\'ve seen it all. 🔥';
      status.classList.add('bingo-win');
      return;
    }
  }
  
  // Check columns
  for (let col = 0; col < 5; col++) {
    let win = true;
    for (let row = 0; row < 5; row++) {
      if (!vaultBingoMarked.has(row * 5 + col)) {
        win = false;
        break;
      }
    }
    if (win) {
      status.textContent = '🔥 BINGO! You\'ve seen it all. 🔥';
      status.classList.add('bingo-win');
      return;
    }
  }
  
  // Check diagonals
  let diag1 = true, diag2 = true;
  for (let i = 0; i < 5; i++) {
    if (!vaultBingoMarked.has(i * 5 + i)) diag1 = false;
    if (!vaultBingoMarked.has(i * 5 + (4 - i))) diag2 = false;
  }
  if (diag1 || diag2) {
    status.textContent = '🔥 BINGO! You\'ve seen it all. 🔥';
    status.classList.add('bingo-win');
    return;
  }
  
  // No bingo
  status.textContent = `${vaultBingoMarked.size - 1} / 24 marked`;
  status.classList.remove('bingo-win');
}

// New card button
$('vaultBingoNew')?.addEventListener('click', initVaultBingo);

// Initialize vault roster and bingo when needed
function initVaultGames() {
  initVaultRoster();
  initVaultBingo();
}
