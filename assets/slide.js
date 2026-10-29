(()=>{
'use strict';
const sourceSlides=window.INTUR_SLIDES||[];
const sourceQR=sourceSlides.find(s=>s.kind==='qr');
const slides=sourceSlides.flatMap((slide,i)=>{
  const group=[slide];
  if(sourceQR&&(i+1)%7===0&&(i+1)<sourceSlides.length){
    const pause=Math.floor((i+1)/7);
    group.push({...sourceQR,sec:'PARTICIPACIÓN · PAUSA '+pause,title:'Escaneá y preguntá · pausa '+pause,kicker:'QR · PREGUNTAS EN CUALQUIER MOMENTO',note:'Pausa breve para que las personas escaneen el QR y envíen preguntas. El expositor puede continuar cuando quiera. El panel privado del expositor recibe las preguntas en tiempo real.' ,periodicQR:true});
  }
  return group;
});
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stage=document.getElementById('stage');
let idx=0;let previousBeforeQR=0;
const brand=`<div class="logo" aria-label="Instituto Nicaragüense de Turismo - Nicaragua Única... ¡Original!"><img class="brand-image" src="assets/logo-intur-nicaragua.png" alt="Instituto Nicaragüense de Turismo — Nicaragua Única... ¡Original!" /></div>`;
function makeTiles(items,cl='',numbered=false){return items.map((x,i)=>`<div class="tile ${cl}">${numbered?`<div class="num">${E(String(i+1).padStart(2,'0'))}</div>`:''}<strong>${E(x[0])}</strong><p>${E(x[1])}</p></div>`).join('')}
function bodyOf(s){let a=s.items;
switch(s.kind){
case 'cover':return `<div class="covervisual"><div class="coverstatement"><div class="coverpill">ESTELÍ · IDENTIDAD · INNOVACIÓN</div><h2>Más allá<br>del <span>viaje.</span></h2><div class="lede">Un territorio se descubre. Una experiencia se diseña. Su valor se comparte.</div></div><div class="esteli-landscape" aria-label="Ilustración artística de las montañas y el muralismo del departamento de Estelí"><img src="assets/esteli-editorial.png" alt="Interpretación artística de las montañas de Estelí y su identidad cultural" /><div class="esteli-caption">Montañas · arte · comunidad · futuro</div></div></div>`;
case 'versus':return `<div class="duo">${makeTiles(a)}</div>`;
case 'cards':case 'quadrants':case 'case':return `<div class="v-grid ${a.length>4?'cols3':'cols2'}">${makeTiles(a,'',true)}</div>`;
case 'grid8':case 'grid7':return `<div class="v-grid many">${makeTiles(a,'small',true)}</div>`;
case 'steps':return `<div class="steps ${a.length>=7?'seven':''}">${a.map(x=>`<div class="tile small"><div class="num">${E(x[0])}</div><strong>${E(x[1])}</strong><p>${E(x[2])}</p></div>`).join('')}</div>`;
case 'journey':case 'blueprint':return `<div class="journey">${makeTiles(a,'',true)}</div>`;
case 'network':return `<div class="network">${makeTiles(a,'small',false)}</div>`;
case 'geo':return `<div class="geoart" aria-label="Mapa esquemático conceptual, no geográfico"></div><div class="geolist">${makeTiles(a,'small')}</div>`;
case 'formula':return `<div class="formulaView">${a.map(x=>`<div class="tile"><strong>${E(x[0])}</strong><p>${E(x[1])}</p></div>`).join('')}</div>`;
case 'scenarios':return `<div class="scenario">${a.map(x=>`<div class="tile"><strong>${E(x[0])}</strong><p>Ingresos: ${E(x[1])}<br>Variables: ${E(x[2])}<br><span class="scenarionum">Resultado: ${E(x[3])}</span></p></div>`).join('')}</div>`;
case 'table':return `<table class="tableview" aria-label="Indicadores de gestión"><thead><tr><th>Dimensión</th><th>Qué medir</th><th>Para qué</th></tr></thead><tbody>${a.map(x=>`<tr>${x.map(v=>`<td>${E(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
case 'qr':return `<div class="qrview"><div class="instructions"><h2>Tu voz entra en la conferencia.</h2><p>1. Escaneá el QR.<br>2. Escribí tu nombre y una pregunta.<br>3. Enviá. El expositor la recibe en su panel privado.</p><p style="font-size:18px;opacity:.65">No escribas contraseñas ni datos personales sensibles.</p></div><div class="qrbox"><div class="qrTarget"><div class="qrstatus">Preparando código QR…</div></div></div></div>`;
case 'closing':return `<div class="closevisual">Un producto es excelente cuando el visitante <span>lo desea,</span> la comunidad <span>lo comparte</span> y el territorio <span>puede sostenerlo.</span></div>`;
case 'references':return `<div class="refview">${a.map(x=>`<div class="refitem"><b>${E(x[0])} · ${E(x[1])}</b><a href="${E(x[2])}" target="_blank" rel="noopener noreferrer">${E(x[2])}</a></div>`).join('')}</div>`;
default:return ''}}
function slideHTML(s,n){return `<section class="slide kind-${E(s.kind)} ${s.theme==='cream'?'cream':''}" data-index="${n}" aria-label="Diapositiva ${n+1}: ${E(s.title)}"><header class="head">${brand}<div class="head-right"><span>${E(s.sec)}</span><span>NICARAGUA · 2026</span></div></header><main class="main"><div class="kicker">${E(s.kicker)}</div><h1 class="title">${E(s.title)}</h1><p class="deck">${E(s.deck)}</p><div class="visual">${bodyOf(s)}</div>${s.focus?`<div class="focus">${E(s.focus)}</div>`:''}</main>${s.source?`<div class="source">Fuente: ${E(s.source)}</div>`:''}<footer class="foot"><span class="keys">← → Navegar · N Notas · O Índice · P Panel · Q QR · F Pantalla completa</span><div class="progress" style="--p:${((n+1)/slides.length*100).toFixed(2)}%"><div></div></div><button class="arrowBtn" data-act="prev" aria-label="Diapositiva anterior">←</button><button class="arrowBtn" data-act="next" aria-label="Diapositiva siguiente">→</button><span class="page">${String(n+1).padStart(2,'0')} / ${slides.length}</span></footer></section>`}
stage.innerHTML=slides.map(slideHTML).join('');
let active=[];const note=document.querySelector('#noteOverlay'),index=document.querySelector('#indexOverlay'),qa=document.querySelector('#qaOverlay');
function layout(){const w=1600,h=900,x=window.innerWidth,y=window.innerHeight,scale=Math.min(x/w,y/h);stage.style.transform=`scale(${scale})`;stage.style.left=`${Math.max(0,(x-w*scale)/2)}px`;stage.style.top=`${Math.max(0,(y-h*scale)/2)}px`}
function show(i){idx=Math.max(0,Math.min(slides.length-1,i));document.querySelectorAll('.slide').forEach((el,j)=>{el.classList.toggle('active',j===idx);if(j===idx)el.scrollTop=0});location.hash='s'+(idx+1);document.title=`${String(idx+1).padStart(2,'0')}/${slides.length} · INTUR | ${slides[idx].title}`;if(slides[idx].kind==='qr'){if(slides[idx].periodicQR)previousBeforeQR=idx-1;drawQR();}}
function go(d){show(idx+d)}
function closeAll(){const hadQa=qa.classList.contains('active');note.classList.remove('active');index.classList.remove('active');qa.classList.remove('active');qa.setAttribute('aria-hidden','true');if(hadQa)document.querySelector('#qaBell')?.focus()}
function toggle(p){let on=p.classList.contains('active');closeAll();if(!on){p.classList.add('active');if(p===note)document.getElementById('noteText').textContent=slides[idx].note||'Sin notas adicionales.'}}
document.addEventListener('click',e=>{let act=e.target.closest('[data-act]')?.getAttribute('data-act');if(act==='prev')go(-1);if(act==='next')go(1);if(act==='note')toggle(note);if(act==='index')toggle(index);if(act==='qa')toggle(qa);if(act==='close')closeAll();if(e.target.matches('[data-jump]')){show(Number(e.target.dataset.jump));closeAll();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(note.classList.contains('active')||index.classList.contains('active')||qa.classList.contains('active')){e.preventDefault();closeAll()}else if(window.INTUR_Presentation?.isActive()){e.preventDefault();window.INTUR_Presentation.exit()}return}if(e.target.closest('input,textarea,select,[contenteditable="true"]'))return;if(e.key===' '&&e.target.closest('button,a'))return;if(note.classList.contains('active')||index.classList.contains('active')||qa.classList.contains('active'))return;if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();go(1)}if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();go(-1)}if(e.key==='n'||e.key==='N')toggle(note);if(e.key==='o'||e.key==='O')toggle(index);if(e.key==='p'||e.key==='P'){qa.classList.add('active');qa.setAttribute('aria-hidden','false')}if(e.key==='q'||e.key==='Q'){if(slides[idx].kind==='qr')show(previousBeforeQR);else {previousBeforeQR=idx;show(slides.findIndex(x=>x.kind==='qr'))}}if(e.key==='f'||e.key==='F')window.INTUR_Presentation?.toggle()});
document.querySelector('#indexButtons').innerHTML=slides.map((s,i)=>`<button data-jump="${i}"><b>${String(i+1).padStart(2,'0')}.</b> ${E(s.title)}</button>`).join('');
function qUrl(){let cfg=window.INTUR_QA_CONFIG||{};if(cfg.publicSiteBase){try{return new URL('preguntas.html',cfg.publicSiteBase.endsWith('/')?cfg.publicSiteBase:cfg.publicSiteBase+'/').href}catch(e){return null}}if(!/^https?:$/.test(location.protocol))return null;return new URL('preguntas.html',location.href).href}
function drawQR(){let target=document.querySelector('.slide.active .qrTarget');if(!target)return;let u=qUrl();if(!u){target.innerHTML='<div class="qrstatus">El QR se habilitará cuando el sitio esté publicado en GitHub Pages. Para pruebas locales, podés configurar publicSiteBase en config.js.</div>';return}try{const qr=new QRCodeLib.QRCode(0,QRCodeLib.Level.M);qr.addData(u);qr.make();let n=qr.getModuleCount(),cv=document.createElement('canvas'),sz=284,cell=sz/n;cv.width=sz;cv.height=sz;let c=cv.getContext('2d');c.fillStyle='white';c.fillRect(0,0,sz,sz);c.fillStyle='#09283f';for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(qr.isDark(y,x))c.fillRect(Math.floor(x*cell),Math.floor(y*cell),Math.ceil((x+1)*cell)-Math.floor(x*cell),Math.ceil((y+1)*cell)-Math.floor(y*cell));target.innerHTML='';target.appendChild(cv);let txt=document.createElement('div');txt.className='qrstatus';txt.textContent=u;target.appendChild(txt)}catch(e){target.textContent='No se pudo generar el QR: '+e.message}}
window.addEventListener('resize',layout);
layout();let h=/#s(\d+)/.exec(location.hash);show(h?Number(h[1])-1:0);
})();
