(()=>{
  'use strict';

  const time=document.getElementById('elapsedTime');
  const stateLabel=document.getElementById('timeState');
  const primary=document.getElementById('timePrimary');
  const reset=document.getElementById('timeReset');
  const confirmBox=document.getElementById('timeConfirm');
  const present=document.getElementById('presentToggle');
  let elapsed=0;
  let startedAt=0;
  let state='idle';
  let immersive=false;
  let nativeFullscreen=false;

  function elapsedMs(){return elapsed+(state==='running'?Math.max(0,Date.now()-startedAt):0)}
  function format(ms){
    const total=Math.floor(ms/1000);
    const seconds=String(total%60).padStart(2,'0');
    const minutes=String(Math.floor(total/60)%60).padStart(2,'0');
    const hours=Math.floor(total/3600);
    return hours?`${String(hours).padStart(2,'0')}:${minutes}:${seconds}`:`${minutes}:${seconds}`;
  }
  function render(){
    const value=format(elapsedMs());
    if(time.textContent!==value)time.textContent=value;
    stateLabel.textContent=state==='running'?'En curso':state==='paused'?'En pausa':'Listo';
    primary.textContent=state==='running'?'Pausar':state==='paused'?'Continuar':'Iniciar tiempo';
    reset.hidden=state==='idle';
  }
  function start(){elapsed=0;startedAt=Date.now();state='running';render()}
  function pause(){elapsed=elapsedMs();startedAt=0;state='paused';render()}
  function resume(){startedAt=Date.now();state='running';render()}
  function clearConfirmation(){confirmBox.hidden=true;reset.setAttribute('aria-expanded','false')}
  primary.addEventListener('click',()=>{
    clearConfirmation();
    if(state==='idle')start();else if(state==='running')pause();else resume();
  });
  reset.addEventListener('click',()=>{
    if(state==='running'){
      confirmBox.hidden=false;
      reset.setAttribute('aria-expanded','true');
      document.getElementById('timeConfirmNo').focus();
    }else{
      elapsed=0;startedAt=0;state='idle';clearConfirmation();render();
    }
  });
  document.getElementById('timeConfirmYes').addEventListener('click',()=>{
    elapsed=0;startedAt=0;state='idle';clearConfirmation();render();primary.focus();
  });
  document.getElementById('timeConfirmNo').addEventListener('click',()=>{clearConfirmation();reset.focus()});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!confirmBox.hidden){e.preventDefault();e.stopImmediatePropagation();clearConfirmation();reset.focus()}
  },true);
  const tick=setInterval(render,400);
  window.addEventListener('pagehide',()=>clearInterval(tick),{once:true});

  function updatePresentation(){
    document.body.classList.toggle('presentation-mode',immersive);
    present.setAttribute('aria-pressed',String(immersive));
    present.innerHTML=immersive?'<span aria-hidden="true">⤡</span> SALIR':'<span aria-hidden="true">⛶</span> PRESENTAR';
    present.setAttribute('aria-label',immersive?'Salir del modo presentación':'Entrar en modo presentación');
  }
  async function enter(){
    if(immersive)return;
    immersive=true;updatePresentation();
    if(document.documentElement.requestFullscreen){
      try{await document.documentElement.requestFullscreen();nativeFullscreen=true}
      catch(_){nativeFullscreen=false} // El modo inmersivo CSS sigue disponible.
    }
  }
  async function exit(){
    if(!immersive)return;
    immersive=false;updatePresentation();
    if(nativeFullscreen&&document.fullscreenElement){
      try{await document.exitFullscreen()}catch(_){/* Conserva la diapositiva actual. */}
    }
    nativeFullscreen=false;
  }
  function toggle(){return immersive?exit():enter()}
  present.addEventListener('click',toggle);
  document.addEventListener('fullscreenchange',()=>{
    if(!document.fullscreenElement&&nativeFullscreen){
      nativeFullscreen=false;immersive=false;updatePresentation();
    }
  });
  window.INTUR_Presentation={toggle,exit,isActive:()=>immersive};
  render();updatePresentation();
})();
