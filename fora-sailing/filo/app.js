(() => {
 const header=document.getElementById('sourceHeader'),trigger=document.getElementById('menuTrigger'),panel=document.getElementById('menuPanel');let lastY=scrollY,upSince=0,dir='up',timer;
 addEventListener('scroll',()=>{const y=scrollY;const hero=document.querySelector(".hero-art");const heroBottom=hero?hero.getBoundingClientRect().bottom+y:440;header.classList.toggle("is-scrolled",y>heroBottom);if(y>lastY+12){dir='down';upSince=0}else if(y<lastY-12){if(dir!=='up')upSince=performance.now();dir='up'}if(y<=80)header.classList.remove('is-hidden');else if(dir==='down')header.classList.add('is-hidden');else{clearTimeout(timer);timer=setTimeout(()=>{if(performance.now()-upSince>=250)header.classList.remove('is-hidden')},250)}lastY=y},{passive:true});
 trigger.addEventListener('click',()=>{const open=trigger.getAttribute('aria-expanded')!=='true';trigger.setAttribute('aria-expanded',String(open));trigger.setAttribute('aria-label',open?'Menüyü kapat':'Menüyü aç');if(open){panel.hidden=false;requestAnimationFrame(()=>panel.classList.add('is-open'))}else{panel.classList.remove('is-open');setTimeout(()=>{panel.hidden=true},350)}});const mobileTrigger=document.querySelector('.mobile-menu-trigger');if(mobileTrigger)mobileTrigger.addEventListener('click',()=>{const open=panel.hidden;mobileTrigger.setAttribute('aria-expanded',String(open));mobileTrigger.setAttribute('aria-label',open?'Menüyü kapat':'Menüyü aç');trigger.setAttribute('aria-expanded',String(open));trigger.setAttribute('aria-label',open?'Menüyü kapat':'Menüyü aç');if(open){panel.hidden=false;requestAnimationFrame(()=>panel.classList.add('is-open'))}else{panel.classList.remove('is-open');setTimeout(()=>{panel.hidden=true},350)}});
 const revealTargets=[...document.querySelectorAll('.art-card,.photo-art-group,[data-copy-motion]:not(.hero-copy)')];
 const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
 if('IntersectionObserver' in window){
  const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target)}}),{threshold:.2});
  const syncRevealMotion=()=>{if(reduceMotion.matches){revealObserver.disconnect();revealTargets.forEach(el=>el.classList.add('is-visible'))}else{revealTargets.forEach(el=>el.classList.remove('is-visible'));revealTargets.forEach(el=>revealObserver.observe(el))}};
  syncRevealMotion();reduceMotion.addEventListener('change',syncRevealMotion);
 }else revealTargets.forEach(el=>el.classList.add('is-visible'));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){panel.hidden=true;panel.classList.remove('is-open');trigger.setAttribute('aria-expanded','false');document.querySelector('.mobile-menu-trigger')?.setAttribute('aria-expanded','false');trigger.focus()}});
 const dialog=document.getElementById('requestDialog'),link=document.getElementById('requestLink');document.querySelectorAll('#fleetSearch,#fleetSearchMobile').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const date=form.elements.date.value,guests=form.elements.guests.value;const message=`Gulet filosu için bilgi rica ediyorum. Tarih: ${date}. Misafir sayısı: ${guests}. Uygunluk teyidi rica ederim.`;link.href=`https://wa.me/905496523538?text=${encodeURIComponent(message)}`;dialog.showModal()}));
  // Normal-motion hero: build CSS background windows from verified source ROI SVG metadata.
  // Keep the original hero bitmap underneath; the generated photo is visible only inside text/illustration ROIs.
  const heroCanvas=document.querySelector('.canvas');
  const heroSource=heroCanvas?.querySelector('.hero-static');
  const prefersReduced=matchMedia('(prefers-reduced-motion: reduce)');
  const motionRoot=document.documentElement;
  const canRunHeroEntry=()=>!prefersReduced.matches&&motionRoot.dataset.cmsScrollAnimations!=='false'&&motionRoot.dataset.cmsUserReducedMotion!=='true'&&motionRoot.dataset.cmsHeroPhotoReplaced!=='true'&&innerWidth>700;
  if(heroCanvas&&heroSource){
    heroCanvas.classList.add('hero-window-container');
    const motionBase=new URL('assets/motion-copy/',document.baseURI);
    const getPatch=async file=>{
      const svgUrl=new URL(file,motionBase);
      const response=await fetch(svgUrl,{credentials:'same-origin'});
      if(!response.ok)throw new Error(`Hero ROI unavailable: ${response.status}`);
      const source=await response.text();
      const svg=new DOMParser().parseFromString(source,'image/svg+xml');
      const image=svg.querySelector('image');
      if(svg.querySelector('parsererror')||!image)throw new Error('Invalid hero ROI metadata');
      const href=image.getAttribute('href')||image.getAttributeNS('http://www.w3.org/1999/xlink','href');
      if(!href)throw new Error('Missing hero photo href');
      return {x:Number(image.getAttribute('x')||0),y:Number(image.getAttribute('y')||0),photo:new URL(href,svgUrl).href};
    };
    const applyWindow=(node,patch,className,group)=>{
      node.classList.add(className);
      node.style.backgroundImage=`url("${patch.photo.replaceAll('"','%22')}")`;
      node.style.backgroundSize='100cqw auto';
      node.style.backgroundPosition=`${patch.x*100/1024}cqw ${patch.y*100/1024}cqw`;
      node.style.backgroundRepeat='no-repeat';
      // The generated photo only covers the source hero image, not decorative
      // copy that extends into the next art strip. Clip at the original hero
      // image bounds so the generated file's letterbox cannot leak below it.
      const canvasHeight=heroCanvas.clientHeight;
      const px=(value)=>value.endsWith('%')?parseFloat(value)*canvasHeight/100:parseFloat(value)||0;
      const top=px(group.style.top), groupHeight=px(group.style.height), bottom=top+groupHeight;
      const heroTop=parseFloat(getComputedStyle(heroSource).top)||0;
      const heroBottom=heroTop+(parseFloat(getComputedStyle(heroSource).height)||0);
      const clipTop=Math.max(0,heroTop-top),clipBottom=Math.max(0,bottom-heroBottom);
      if(groupHeight<=0||clipTop+clipBottom>=groupHeight){node.remove();return;}
      if(clipTop||clipBottom)node.style.clipPath=`inset(${clipTop}px 0 ${clipBottom}px 0)`;
      node.dataset.heroWindowReady='true';
    };
    const buildHeroWindows=async()=>{
      const jobs=[];
      heroCanvas.querySelectorAll('.copy-motion.hero-copy[data-copy-id]').forEach(group=>{
        const id=group.dataset.copyId;
        if(!['hero-kicker','hero-copy'].includes(id))return;
        const clean=group.querySelector('.copy-clean');
        if(!clean)return;
        const windowNode=document.createElement('span');
        windowNode.className='hero-motion-window';
        windowNode.setAttribute('aria-hidden','true');
        group.insertBefore(windowNode,clean.nextSibling);
        jobs.push(getPatch(`${id}-motion-clean.svg`).then(patch=>applyWindow(windowNode,patch,'hero-photo-roi',group)).catch(()=>windowNode.remove()));
      });
      heroCanvas.querySelectorAll('.hero-title-line').forEach((title,index)=>{
        const windowNode=document.createElement('span');
        windowNode.className='hero-title-clean-window';
        windowNode.setAttribute('aria-hidden','true');
        for(const prop of ['left','top','width','height'])windowNode.style[prop]=title.style[prop];
        heroCanvas.insertBefore(windowNode,title);
        jobs.push(getPatch(`hero-title-${index+1}-motion-clean.svg`).then(patch=>applyWindow(windowNode,patch,'hero-photo-roi',title)).catch(()=>windowNode.remove()));
      });
      await Promise.all(jobs);
      const photos=[...heroCanvas.querySelectorAll('.hero-photo-roi')];
            const loaded=await Promise.all(photos.map(node=>new Promise(resolve=>{
        const url=node.style.backgroundImage.match(/^url\(["'']?(.*?)["'']?\)$/)?.[1];
        if(!url)return resolve(false);
        const image=new Image();image.onload=()=>resolve(true);image.onerror=()=>resolve(false);image.src=url;
      })));
      return photos.length>0&&loaded.every(Boolean)&&photos.every(node=>node.dataset.heroWindowReady==='true');
    };
    let windowsReady=false,heroInView=false,entryTimer=0,entryStarted=false;
    const stopHeroEntry=()=>{clearTimeout(entryTimer);heroCanvas.classList.remove('hero-entry-active');};
    const startHeroEntry=()=>{
      if(!windowsReady||!heroInView||!canRunHeroEntry()||window.scrollY>0||entryStarted)return;
      stopHeroEntry();
      requestAnimationFrame(()=>{
        if(!heroInView||!canRunHeroEntry())return;
        entryStarted=true;
        heroCanvas.classList.add('hero-entry-active');
        entryTimer=setTimeout(()=>heroCanvas.classList.remove('hero-entry-active'),1900);
      });
    };
    const heroObserver=('IntersectionObserver'in window)?new IntersectionObserver(entries=>{
      const entry=entries[0];heroInView=!!entry?.isIntersecting;
      if(heroInView)startHeroEntry();else stopHeroEntry();
    },{threshold:.12}):null;
    if(heroObserver)heroObserver.observe(heroSource);
    else heroInView=true;
    buildHeroWindows().then(ready=>{windowsReady=ready;if(ready)startHeroEntry();});
    const updateHeroScroll=()=>{
      if(!canRunHeroEntry()){stopHeroEntry();clearHeroScroll();return;}
      const progress=Math.max(0,Math.min(1,window.scrollY/500));
      if(progress===0){clearHeroScroll();return;}
      stopHeroEntry();
      heroCanvas.classList.add('hero-scroll-active');
      const scale=1+0.16*progress,canvasScale=heroCanvas.clientWidth/1024;
      const targets=[...heroCanvas.querySelectorAll('.hero-static,.hero-title-line,.hero-title-clean-window,.copy-motion.hero-copy')];
      targets.forEach(node=>{
        const x=node.offsetLeft/canvasScale,y=node.offsetTop/canvasScale;
        const dx=(x-512)*(scale-1)*canvasScale,dy=(y-360)*(scale-1)*canvasScale;
        const isTitle=node.classList.contains('hero-title-line')||node.classList.contains('hero-title-clean-window');
        node.style.transformOrigin='top left';
        node.style.transform=`translate(${dx}px,${isTitle?-60*progress*canvasScale:dy}px) scale(${scale})`;
        if(node.classList.contains('hero-title-line'))node.style.opacity=String(1-progress);
      });
    };
    function clearHeroScroll(){
      heroCanvas.classList.remove('hero-scroll-active');
      heroCanvas.querySelectorAll('.hero-static,.hero-title-line,.hero-title-clean-window,.copy-motion.hero-copy').forEach(node=>{
        node.style.removeProperty('transform');node.style.removeProperty('transform-origin');node.style.removeProperty('opacity');
      });
    }
    window.addEventListener('scroll',updateHeroScroll,{passive:true});
    updateHeroScroll();
    const syncHeroMotion=()=>{if(!canRunHeroEntry()){stopHeroEntry();if(heroObserver)heroObserver.disconnect();}else if(heroObserver){heroObserver.observe(heroSource);}else startHeroEntry();};
    prefersReduced.addEventListener('change',syncHeroMotion);
    window.addEventListener('fora:cms-content',syncHeroMotion);
  }
})();
