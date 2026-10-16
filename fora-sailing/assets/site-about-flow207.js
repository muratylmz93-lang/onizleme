/* Keep the handwritten Source note clear of expanded mobile CMS descriptions. */
export function initAboutFlow207(mount) {
  const about=mount.querySelector('.fora-detail--about');
  const container=about?.querySelector('.detail-values>.container');
  const list=container?.querySelector('.detail-values-list');
  const note=container?.querySelector('.detail-hand-note--values');
  if(!container||!list||!note)return()=>{};
  const mobile=matchMedia('(max-width:760px)');
  let frame=0,active=true;
  const clear=()=>container.style.removeProperty('--about-note-clearance207');
  const update=()=>{
    frame=0;
    if(!active||!container.isConnected)return;
    if(!mobile.matches){clear();return;}
    const width=mount.getBoundingClientRect().width;
    const expanded=list.getBoundingClientRect().height>width*.4+1;
    if(!expanded){clear();return;}
    const reserve=parseFloat(container.style.getPropertyValue('--about-note-clearance207'))||0;
    const n=note.getBoundingClientRect();
    const base={left:n.left,right:n.right,top:n.top-reserve,bottom:n.bottom-reserve};
    let lastBottom=-Infinity,intersects=false;
    for(const p of list.querySelectorAll('p')){
      const range=document.createRange();range.selectNodeContents(p);
      for(const r of range.getClientRects()){
        if(!r.width||!r.height||r.right<=base.left||r.left>=base.right)continue;
        lastBottom=Math.max(lastBottom,r.bottom);
        if(r.bottom>base.top&&r.top<base.bottom)intersects=true;
      }
    }
    const next=intersects?Math.max(0,Math.ceil(lastBottom+3-base.top)):0;
    if(Math.abs(next-reserve)>.5){
      if(next)container.style.setProperty('--about-note-clearance207',`${next}px`);
      else clear();
    }
  };
  const schedule=()=>{if(active&&!frame)frame=requestAnimationFrame(update);};
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(schedule):null;
  observer?.observe(list);observer?.observe(note);
  mobile.addEventListener?.('change',schedule);
  window.addEventListener('resize',schedule,{passive:true});
  document.fonts?.addEventListener?.('loadingdone',schedule);
  document.fonts?.ready.then(schedule);
  schedule();
  return()=>{
    active=false;cancelAnimationFrame(frame);observer?.disconnect();
    mobile.removeEventListener?.('change',schedule);
    window.removeEventListener('resize',schedule);
    document.fonts?.removeEventListener?.('loadingdone',schedule);
    clear();
  };
}
