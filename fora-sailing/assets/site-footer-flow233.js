/* Keep edited footer notes inside a naturally growing footer. */
export function initFooterFlow233(root) {
  const footer=root?.querySelector?.('.site-footer');
  const note=footer?.querySelector('.footer-note');
  if(!footer||!note)return ()=>{};
  const previous=footer.getAttribute('data-footer-note-flow');
  let active=true,frame=0;
  const rects=element=>{
    const result=[];
    const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const text=walker.currentNode;
      if(!text.textContent.trim())continue;
      const range=document.createRange();range.selectNodeContents(text);
      result.push(...Array.from(range.getClientRects()).filter(r=>r.width&&r.height));
      range.detach();
    }
    for(const img of element.querySelectorAll('img')){
      const r=img.getBoundingClientRect();if(r.width&&r.height)result.push(r);
    }
    return result;
  };
  const intersects=(a,b)=>a.left<b.right-.75&&a.right>b.left+.75&&a.top<b.bottom-.75&&a.bottom>b.top+.75;
  // Entrance transforms are temporary. Test only the settled design geometry;
  // otherwise an invisible note shifted below the footer looks like long copy.
  const entrancePending=()=>Array.from(footer.querySelectorAll('[data-reveal]')).some(element=>{
    const box=element.getBoundingClientRect();
    if(!box.width||!box.height)return false;
    if(!element.classList.contains('is-revealed'))return true;
    if(Number.parseFloat(getComputedStyle(element).opacity)<.999)return true;
    return element.getAnimations?.().some(animation=>animation.pending||animation.playState==='running');
  });
  const update=()=>{
    frame=0;if(!active||!footer.isConnected||entrancePending())return;
    // Measure the original absolute layout every time, not the expanded flow result.
    // Removing and restoring the attribute in one task avoids a feedback threshold.
    footer.removeAttribute('data-footer-note-flow');
    const box=footer.getBoundingClientRect();
    if(!box.width||!note.textContent.trim())return;
    const glyphs=rects(note),bounds=root.getBoundingClientRect();
    const occupied=Array.from(footer.querySelectorAll('.footer-brand,.footer-nav,.footer-socials,.footer-bottom')).flatMap(rects);
    const unsafe=glyphs.some(r=>r.left<bounds.left-.5||r.right>bounds.right+.5||r.top<box.top-.5||r.bottom>box.bottom+2||occupied.some(other=>intersects(r,other)));
    if(unsafe)footer.setAttribute('data-footer-note-flow','true');
  };
  const schedule=()=>{if(active&&!frame)frame=requestAnimationFrame(update);};
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(schedule):null;
  observer?.observe(footer);observer?.observe(note);
  const mutation=new MutationObserver(schedule);mutation.observe(footer,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['class']});
  const motionEvents=['transitionend','transitioncancel','animationend','animationcancel'];
  motionEvents.forEach(name=>footer.addEventListener(name,schedule));
  window.addEventListener('resize',schedule,{passive:true});
  document.fonts?.ready.then(schedule);schedule();
  return ()=>{
    if(!active)return;active=false;cancelAnimationFrame(frame);observer?.disconnect();mutation.disconnect();motionEvents.forEach(name=>footer.removeEventListener(name,schedule));window.removeEventListener('resize',schedule);
    if(previous===null)footer.removeAttribute('data-footer-note-flow');else footer.setAttribute('data-footer-note-flow',previous);
  };
}
