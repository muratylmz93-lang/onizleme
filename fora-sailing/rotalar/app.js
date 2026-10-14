(() => {
  const header = document.getElementById('sourceHeader');
  const trigger = document.getElementById('menuTrigger');
  const panel = document.getElementById('menuPanel');
  let lastY = window.scrollY, upSince = 0, direction = 'up', timer;
  window.addEventListener('scroll', () => {
    const y = window.scrollY; const hero=document.querySelector(".hero-art"); const heroBottom=hero ? hero.getBoundingClientRect().bottom+y : 440; header.classList.toggle("is-scrolled", y>heroBottom);
    if (y > lastY + 12) { direction = 'down'; upSince = 0; }
    else if (y < lastY - 12) { if (direction !== 'up') upSince = performance.now(); direction = 'up'; }
    if (y <= 80) header.classList.remove('is-hidden');
    else if (direction === 'down') header.classList.add('is-hidden');
    else if (direction === 'up') {
      clearTimeout(timer);
      timer = setTimeout(() => { if (performance.now() - upSince >= 250) header.classList.remove('is-hidden'); }, 250);
    }
    lastY = y;
  }, { passive: true });
  trigger.addEventListener('click', () => {
    const open = trigger.getAttribute('aria-expanded') !== 'true';
    trigger.setAttribute('aria-expanded', String(open));
    trigger.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    if(open){panel.hidden=false;requestAnimationFrame(()=>panel.classList.add('is-open'));}else{panel.classList.remove('is-open');setTimeout(()=>{panel.hidden=true;},350);}
  });
  const revealTargets=[...document.querySelectorAll('.art-card,.photo-art-group,[data-copy-motion]:not(.hero-copy)')];
 const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
 if('IntersectionObserver' in window){
  const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target)}}),{threshold:.2});
  const syncRevealMotion=()=>{if(reduceMotion.matches){revealObserver.disconnect();revealTargets.forEach(el=>el.classList.add('is-visible'))}else{revealTargets.forEach(el=>el.classList.remove('is-visible'));revealTargets.forEach(el=>revealObserver.observe(el))}};
  syncRevealMotion();reduceMotion.addEventListener('change',syncRevealMotion);
 }else revealTargets.forEach(el=>el.classList.add('is-visible'));
 document.addEventListener('keydown', e => { if(e.key==='Escape' && !panel.hidden){panel.hidden=true;panel.classList.remove('is-open');trigger.setAttribute('aria-expanded','false');document.querySelector('.mobile-menu-trigger')?.setAttribute('aria-expanded','false');trigger.focus();} });
})();
