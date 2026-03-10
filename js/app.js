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
const WYR_QUOTES=['Bold choice 👑','She\'s eating 🔥','That drip hits different','No contest tbh','Main character','The girlies agree','Zero competition','She ate and left no crumbs','Era-defining','Iconic ✦'];
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
const RTF_VERDICTS=['','💀 Brutal','😬 Meh','✨ Cute','🔥 Fire','👑 ICONIC'];
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
function addConfession(text, wall, arr, isVault=false) {
  if(!text.trim()) return;
  const now = new Date();
  const time = now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  arr.unshift({text, time});
  renderConfessionWall(wall, arr, isVault);
}
function renderConfessionWall(wallId, arr, isVault=false) {
  const wall=$(wallId);
  if(!arr.length){wall.innerHTML=`<div style="text-align:center;padding:40px;font-family:'Cormorant Garamond',serif;font-size:18px;font-style:italic;color:${isVault?'#8a3030':'var(--muted)'}">No confessions yet. Be the first.</div>`;return;}
  wall.innerHTML=arr.slice(0,50).map(c=>`
    <div class="confession-card ${isVault?'vault-confession':''}">
      ${c.text}
      <div class="confession-time">Anonymous · ${c.time}</div>
    </div>`).join('');
}
$('confessionSubmit').addEventListener('click',()=>{
  const input=$('confessionInput');
  addConfession(input.value,$('confessionWall'),state.confessions,false);
  input.value='';
});
$('confessionInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.ctrlKey){const input=$('confessionInput');addConfession(input.value,$('confessionWall'),state.confessions,false);input.value='';}});
function renderSConfessions(){renderConfessionWall('sConfessionWall',state.sConfessions,true);}

// ─── QUIZ ─────────────────────────────────────────────────────────────────────
const PUBLIC_QUIZ = [
  {q:"Your ideal vibe is:", opts:[["soft girl energy","soft"],["city baddie","baddie"],["beach babe","beach"],["cozy luxe","cozy"]]},
  {q:"Perfect Saturday looks like:", opts:[["brunch and sundresses","soft"],["rooftop with the girls","baddie"],["beach all day","beach"],["staying in looking cute","cozy"]]},
  {q:"Your go-to color palette:", opts:[["pinks and creams","soft"],["black and gold","baddie"],["ocean blues and whites","beach"],["neutrals and earth tones","cozy"]]},
  {q:"Dream photoshoot location:", opts:[["flower field","soft"],["high rise rooftop","baddie"],["yacht at sunset","beach"],["cozy bedroom","cozy"]]},
];
const PUBLIC_RESULTS = {
  soft:{name:"Soft Girl",desc:"Sweet, dreamy, and effortlessly pretty. You match with the softest looks in the collection.",models:PHOTOS},
  baddie:{name:"City Baddie",desc:"You're all edge and elegance. The night out looks were made for you.",models:PHOTOS},
  beach:{name:"Beach Babe",desc:"Sun-kissed and carefree. The swimwear collection is your whole personality.",models:PHOTOS},
  cozy:{name:"Cozy Luxe",desc:"Effortlessly chic at all times. The loungewear and matching sets speak your language.",models:PHOTOS},
};
const VAULT_QUIZ = [
  {q:"What gets your attention first:", opts:[["the eyes","eye"],["the smile","smile"],["the body","body"],["the whole vibe","vibe"]]},
  {q:"Pick a setting:", opts:[["hotel room","hotel"],["pool at night","pool"],["rooftop","roof"],["bedroom","bed"]]},
  {q:"Your type in one word:", opts:[["innocent","soft"],["dangerous","danger"],["wild","wild"],["mysterious","mystery"]]},
  {q:"They walk in wearing:", opts:[["white lingerie","soft"],["red bikini","danger"],["nothing but confidence","wild"],["all black everything","mystery"]]},
];
const VAULT_RESULTS = {
  eye:{name:"Eye Contact Killer",desc:"You want someone who holds the room with just a look. That energy is lethal and you know it."},
  smile:{name:"Sweet Menace",desc:"They look innocent. They're not. That smile is the last thing you see before everything goes wrong."},
  body:{name:"No Pretense",desc:"You know what you want. You don't apologize for it. Respect."},
  vibe:{name:"Vibe Chaser",desc:"It's not one thing — it's everything working together at once. You're the hardest one to impress."},
  hotel:{name:"Luxury Threat",desc:"Silk sheets, golden hour, and someone who makes the room feel smaller. That's your environment."},
  pool:{name:"Midnight Energy",desc:"When everyone else has gone to bed, you're just getting started. Night swim, dangerous conversation."},
  roof:{name:"Above It All",desc:"You like to see everything from the top. The city below, and the right person beside you."},
  bed:{name:"Private Collection",desc:"The best things never leave the room. That's your energy and you wear it well."},
  soft:{name:"Soft Destruction",desc:"The most dangerous kind — looks completely harmless. You don't know what hit you until it's too late."},
  danger:{name:"Red Flag Connoisseur",desc:"You know it's a bad idea. You do it anyway. Twice. No regrets."},
  wild:{name:"Chaos Appreciator",desc:"Unpredictable. Unforgettable. The kind of person who makes every night a story."},
  mystery:{name:"Dark Obsession",desc:"You want what you can't quite read. The ones who give nothing away and take everything."},
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
const SWYR_QUOTES=['Absolutely not surviving this 🔥','She ended careers with that one','Zero competition, zero mercy','The damage is irreversible','She didn\'t come to play','That\'s a crime in 12 states','Everyone else go home','That look should be illegal','She ate. Left no crumbs. Burned the kitchen. 💀','Game over. Pack it up.'];
const SRTF_VERDICTS=['','😴 Mid','🤔 She\'s trying','😈 Dangerous','🔥 Lethal','💀 ILLEGAL'];

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
  const input=$('sConfessionInput');
  addConfession(input.value,'sConfessionWall',state.sConfessions,true);
  input.value='';
});

// ─── INIT ────────────────────────────────────────────────────────────────────
buildModelTabs();
renderGrid();
renderSaved();
newWyrPair();
honNext();
rtfNext();
initWheel();
updateStats();
buildQuiz(false);
renderConfessionWall('confessionWall',state.confessions,false);
showTab('moodboard');
