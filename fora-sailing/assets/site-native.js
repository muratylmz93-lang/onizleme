import { renderHome, initHome } from './site-home.js?v=20261016-160';
import { subscribeContent, createContentContext, setupSEO, submitInquiry, trackEvent } from './site-content-runtime.js?v=20261016-160';
import { PHOTO, escapeHTML as esc } from './site-assets.js?v=20261016-160';
import { detailContent } from './site-detail-context.js?v=20261016-160';

const PAGES = {
  home: { id:'ana-sayfa', path:'/', prefix:'home' },
  routes: { id:'rotalar', path:'/rotalar/', prefix:'rotalar' },
  fleet: { id:'filo', path:'/filo/', prefix:'filo' },
  experiences: { id:'deneyimler', path:'/deneyimler/', prefix:'deneyimler' },
  about: { id:'hakkimizda', path:'/hakkimizda/', prefix:'hakkimizda' },
  'route-detail': { id:'rota-gocek-fethiye', path:'/rotalar/gocek-fethiye-gocek/', prefix:'rota-gocek-fethiye' },
  'gulet-detail': { id:'eylul', path:'/filo/eylul/', prefix:'eylul' },
  contact: { id:'iletisim', path:'/iletisim/', prefix:'iletisim' },
};
const config = document.querySelector('meta[name="fora-cms-site-base"]')?.content || new URL('../',import.meta.url).pathname;
const params = new URLSearchParams(location.search);
const preview = location.pathname.includes('/native-preview/');
const pageKey = preview ? (PAGES[params.get('page')] ? params.get('page') : 'home') : (document.body.dataset.page || 'home');
const pageInfo = PAGES[pageKey];
const mount = document.querySelector('#site-app');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const mobilePreference = matchMedia('(max-width: 760px)');
const seen = new Set();
const counted = new Set();
let dispose = () => {};
let renderCount = 0;
let renderSequence = 0;
let baselinePromise;

function icon(ctx, name, extraClass = '') {
  return `<svg class="icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true"><use href="${esc(ctx.asset('assets/icons/fora-icons.svg'))}#fora-${name}"></use></svg>`;
}
function routeUrl(ctx, route) {
  return ctx.url(route);
}
function previewRoute(basePath,route) {
  if(!preview || typeof route!=='string' || /^(?:https?:|mailto:|tel:|#)/.test(route))return null;
  const input=new URL(route.startsWith('/')?route:`/${route}`,location.origin);
  const item=Object.entries(PAGES).find(([,page])=>page.path===input.pathname);
  if(!item)return null;
  const output=new URL(`${basePath}native-preview/`,location.origin);
  output.searchParams.set('page',item[0]);
  if(params.get('cmsPreview')==='1')output.searchParams.set('cmsPreview','1');
  input.searchParams.forEach((value,key)=>{if(key!=='page')output.searchParams.set(key,value);});
  output.hash=input.hash;
  return output.pathname+output.search+output.hash;
}
function brandUrl(ctx, path, fallback) {
  const value = path || fallback;
  return ctx.asset(value.startsWith('brand/') ? `assets/${value}` : value);
}
function navigation(ctx, mobile = false) {
  const fallback=[{label:'Rotalar',url:'/rotalar/'},{label:'Gulet Filosu',url:'/filo/'},{label:'Deneyimler',url:'/deneyimler/'},{label:'Hakkımızda',url:'/hakkimizda/'},{label:'İletişim',url:'/iletisim/'}];
  const links=(Array.isArray(ctx.content.menus)?ctx.content.menus:fallback).filter(item=>item.visible!==false).slice().sort((a,b)=>Number(a.sortOrder??a.order??0)-Number(b.sortOrder??b.order??0));
  return links.map((item,index) => `<a href="${esc(routeUrl(ctx,item.url||'/'))}" data-cms-menu-id="${esc(item.id||'')}" style="--i:${index}"${pageInfo.path===item.url?' aria-current="page"':''}>${esc(item.label)}</a>`).join('');
}
function button(ctx, href, label, className='btn-gold', binding='') {
  return `<a class="btn ${className}" href="${esc(href)}"${binding?` data-cms-binding="${esc(binding)}"`:''}>${esc(label)}${icon(ctx,'arrow-right','button-arrow')}</a>`;
}
function header(ctx) {
  const brand = ctx.content.settings?.brand || {};
  const offerLabel = ctx.get(`${pageInfo.prefix}.header.offerLabel`,ctx.get('home.header.offerLabel','Teklif Alın'));
  const offerUrl = routeUrl(ctx,ctx.get(`${pageInfo.prefix}.header.offerUrl`,'/iletisim/'));
  const whatsapp = ctx.url(ctx.get(`${pageInfo.prefix}.header.whatsappUrl`,ctx.content.settings?.contact?.whatsapp || ctx.get('home.header.whatsappUrl','https://wa.me/905496523538')));
  const logo = `<a class="site-brand" href="${esc(routeUrl(ctx,'/'))}" aria-label="Fora Sailing ana sayfa"><img src="${esc(brandUrl(ctx,brand.headerLogo,'assets/brand/fora-sailing.png'))}" alt="Fora Sailing" width="240" height="96"></a>`;
  return `<header class="site-header" data-section-id="header"><div class="site-header-inner">${logo}<nav class="site-nav" aria-label="Ana menü">${navigation(ctx)}</nav><div class="site-header-actions">${button(ctx,offerUrl,offerLabel,'btn-gold',`${pageInfo.prefix}.header.offerLabel`).replace('<a ',`<a data-cms-href-binding="${pageInfo.prefix}.header.offerUrl" `)}<a class="btn btn-whatsapp site-header-whatsapp" data-cms-href-binding="${pageInfo.prefix}.header.whatsappUrl" href="${esc(whatsapp)}">${icon(ctx,'message')}<span data-cms-binding="${pageInfo.prefix}.header.whatsappLabel">${esc(ctx.get(`${pageInfo.prefix}.header.whatsappLabel`,'WhatsApp'))}</span></a><button type="button" class="menu-toggle" aria-label="Menüyü aç" aria-expanded="false" aria-controls="site-mobile-menu">${icon(ctx,'menu')}</button></div></div></header><div class="menu-backdrop"></div><aside class="site-mobile-menu" id="site-mobile-menu" aria-label="Gezinme" inert><button type="button" class="menu-close" aria-label="Menüyü kapat">${icon(ctx,'close')}</button>${logo}<nav>${navigation(ctx,true)}</nav>${button(ctx,offerUrl,offerLabel)}<a class="btn btn-whatsapp" href="${esc(whatsapp)}">${icon(ctx,'message')}WhatsApp ile İletişim</a></aside>`;
}
function footer(ctx) {
  const brand = ctx.content.settings?.brand || {};
  const copyright = ctx.get('home.footer.copyright','© 2026 Fora Sailing. Tüm hakları saklıdır.');
  const whatsapp = ctx.url(ctx.content.settings?.contact?.whatsapp || 'https://wa.me/905496523538');
  const social = ['instagram','youtube','facebook','whatsapp'].map(name=>{
    const target=name==='whatsapp'?whatsapp:ctx.get(`home.footer.${name}Url`,'');
    const image=`<img class="icon-source" src="${esc(ctx.asset(`assets/icons/bootstrap/${name}.svg`))}" alt="" width="20" height="20">`;
    return target?`<a href="${esc(ctx.url(target))}" aria-label="${esc(name==='whatsapp'?'WhatsApp ile iletişim':name)}">${image}</a>`:`<span aria-hidden="true">${image}</span>`;
  }).join('');
  return `<footer class="site-footer" data-section-id="footer"><img class="footer-water" src="${esc(ctx.asset('assets/native-footer-sea-v1.webp'))}" alt="" loading="lazy"><div class="footer-top" data-reveal><a class="footer-brand" href="${esc(routeUrl(ctx,'/'))}"><img src="${esc(brandUrl(ctx,brand.footerLogo,'assets/brand/fora-sailing.png'))}" alt="Fora Sailing" loading="lazy" width="240" height="96"></a><nav class="footer-nav" aria-label="Alt menü">${navigation(ctx)}</nav><div class="footer-socials">${social}</div></div><p class="footer-note script-note" data-reveal data-cms-binding="home.footer.note">${esc(ctx.get('home.footer.note','Mavi\nYaşatır…')).replace(/\n/g,'<br>')}</p><div class="footer-bottom" data-reveal><small data-cms-binding="home.footer.copyright">${esc(copyright)}</small><small class="footer-tagline" data-cms-binding="home.footer.tagline">${esc(ctx.get('home.footer.tagline','Daha güzel bir dünya için, daha fazla mavi…'))}</small><a class="footer-credit" href="${esc(ctx.url(brand.creditUrl || 'https://mydijital.com.tr/'))}" target="_blank" rel="noopener" aria-label="Web tasarım MY Dijital"><span>Web Tasarım</span><img src="${esc(brandUrl(ctx,brand.creditLogo,'assets/brand/mydijital.png'))}" alt="MY Dijital" loading="lazy"></a></div></footer><aside class="site-contact-dock" aria-label="Hızlı iletişim">${button(ctx,routeUrl(ctx,'/iletisim/'),'Teklif Alın')}<a class="btn btn-whatsapp" href="${esc(whatsapp)}">${icon(ctx,'message')}WhatsApp</a></aside>`;
}

function applySectionState(ctx) {
  const page = ctx.content.pages.find(item => item.id===pageInfo.id);
  const main = mount.querySelector('main');
  if (!page || !main) return;
  const sections = Array.from(main.children).filter(element => element.hasAttribute('data-section-id'));
  const order = new Map(page.sections.map((section,index) => [section.id,index]));
  sections.sort((a,b)=>(order.get(a.dataset.sectionId)??100)-(order.get(b.dataset.sectionId)??100));
  for (const section of sections) {
    const definition = page.sections.find(item => item.id===section.dataset.sectionId);
    section.hidden = definition?.hidden === true || definition?.enabled === false;
    main.append(section);
  }
  main.querySelectorAll('[data-section-id]').forEach(element=>{
    const definition=page.sections.find(item=>item.id===element.dataset.sectionId);
    if(definition)element.hidden=definition.hidden===true||definition.enabled===false;
  });
  for (const region of ['header','footer']) {
    const definition = page.sections.find(item=>item.id===region);
    const element = mount.querySelector(`.site-${region}`);
    if (element) element.hidden = definition?.hidden===true;
  }
}

function initMenu() {
  const menu = mount.querySelector('.site-mobile-menu');
  const toggle = mount.querySelector('.menu-toggle');
  const backdrop = mount.querySelector('.menu-backdrop');
  let previousFocus = null;
  const setOpen = open => {
    if(open) previousFocus = document.activeElement;
    menu.classList.toggle('is-open',open);
    backdrop.classList.toggle('is-open',open);
    menu.inert = !open;
    toggle.setAttribute('aria-expanded',String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if(open) menu.querySelector('button').focus(); else previousFocus?.focus();
  };
  toggle.addEventListener('click',()=>setOpen(!menu.classList.contains('is-open')));
  backdrop.addEventListener('click',()=>setOpen(false));
  menu.querySelector('.menu-close').addEventListener('click',()=>setOpen(false));
  const keydown = event => {
    if(!menu.classList.contains('is-open')) return;
    if(event.key==='Escape') setOpen(false);
    if(event.key==='Tab') {
      const focusable = [...menu.querySelectorAll('a,button')];
      const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
    }
  };
  document.addEventListener('keydown',keydown);
  return ()=>{document.removeEventListener('keydown',keydown);document.body.style.overflow='';};
}

function initIcons(ctx) {
  mount.querySelectorAll('a.btn:not(.btn-whatsapp)').forEach(button=>{
    const existing=button.querySelector('.home-link-icon');
    if(existing){existing.classList.add('button-arrow');return;}
    const arrow=button.querySelector('.detail-arrow');
    if(arrow){arrow.innerHTML=icon(ctx,'arrow-right','button-arrow');return;}
    if(!button.querySelector('.button-arrow'))button.insertAdjacentHTML('beforeend',icon(ctx,'arrow-right','button-arrow'));
  });
  mount.querySelectorAll('.btn-whatsapp').forEach(button=>{
    button.querySelector('.detail-arrow')?.remove();
    if(button.querySelector('img[src*="whatsapp.svg"]'))return;
    button.querySelector('svg.icon')?.remove();
    button.insertAdjacentHTML('afterbegin',`<img class="icon-source whatsapp-mark" src="${esc(ctx.asset('assets/icons/bootstrap/whatsapp.svg'))}" alt="" width="20" height="20">`);
  });
  mount.querySelectorAll('.home-route-card,.home-fleet-card').forEach(card=>{
    card.insertAdjacentHTML('beforeend',`<span class="home-card-arrow" aria-hidden="true">${icon(ctx,'arrow-right')}</span>`);
  });
  mount.querySelectorAll('.catalog-card__arrow').forEach(arrow=>arrow.innerHTML=icon(ctx,'arrow-right'));
  const contactForm=mount.querySelector('.detail-contact-form');
  mount.querySelectorAll('.detail-contact-aside h2 br').forEach(br=>br.before(document.createTextNode(' ')));
  for(const [name,mark] of [['name','user'],['phone','phone'],['email','mail'],['startDate','calendar'],['guests','users'],['routeId','location'],['message','message']]){
    const field=contactForm?.elements.namedItem(name),label=field?.closest('label');
    if(!label)continue;
    label.classList.add('has-field-icon');
    label.insertAdjacentHTML('afterbegin',`<span class="form-field-icon" aria-hidden="true">${icon(ctx,mark)}</span>`);
  }
}

function initMotion(ctx) {
  const main = mount.querySelector('main');
  const hero = main.querySelector('[data-section-id=hero]');
  const heroImage = hero?.querySelector('img');
  const title = hero?.querySelector('h1');
  const header = mount.querySelector('.site-header');
  const dock = mount.querySelector('.site-contact-dock');
  const reduce = () => motionPreference.matches || ctx.content.settings?.motion?.scrollAnimations===false;
  main.querySelector('.home-story-photos')?.removeAttribute('data-reveal');
  for(const [selector,direction,distance,delay] of [
    ['.home-story-main','right',30,0],['.home-story-side','',65,150],
    ['.detail-photo-main','right',25,0],['.detail-photo-inset','',45,150],
    ['.catalog-plan__photo','right',0,0],['.detail-together-photo','',25,0],
    ['.detail-photo-cove','left',25,120],['.detail-highlight-photo','',0,0],['.detail-highlight-sunset','',0,120],['.detail-related-card','',0,120],['.detail-gallery-current','',0,0],
    ['.detail-contact-photo','',0,120],['.detail-cta-photo','',25,0]
  ])main.querySelectorAll(selector).forEach(el=>{el.dataset.reveal=direction;el.style.setProperty('--reveal-duration','800ms');el.style.setProperty('--reveal-delay',`${delay}ms`);if(distance)el.dataset.parallax=distance;});
  for(const rail of main.querySelectorAll('.home-route-rail,.home-fleet-rail,.catalog-card-grid,.home-benefit-list,.detail-values-list')) [...rail.children].forEach((el,index)=>{if(el.matches('a,article,li')){el.setAttribute('data-reveal','');el.style.setProperty('--reveal-delay',`${index*100}ms`);}});
  main.querySelectorAll('.detail-gallery-thumbs>button').forEach((el,index)=>{el.setAttribute('data-reveal','');el.style.setProperty('--reveal-duration','800ms');el.style.setProperty('--reveal-delay',`${index*120}ms`);});
  const description=hero?.querySelector('.home-hero-description,.catalog-hero__description,.detail-hero-description');
  if(description){description.setAttribute('data-reveal','');description.style.setProperty('--reveal-x',mobilePreference.matches?'0px':'25px');description.style.setProperty('--reveal-distance',mobilePreference.matches?'12px':'0px');description.style.setProperty('--reveal-duration',mobilePreference.matches?'450ms':'650ms');}
  hero?.querySelectorAll('.home-hero-actions,.catalog-hero__actions,.detail-actions').forEach(el=>{el.setAttribute('data-reveal','');el.style.setProperty('--reveal-distance','15px');el.style.setProperty('--reveal-duration','500ms');});

  main.querySelectorAll('h1,h2,p,.catalog-plan__photo,.photo-frame').forEach(el=>{
    if(!el.closest('[data-reveal]') && !el.closest('form')) el.setAttribute('data-reveal','');
  });
  mount.querySelectorAll('.script-note,[class$="__note"],.home-hand').forEach(el=>{
    el.setAttribute('data-reveal','note');
  });
  const observer = new IntersectionObserver(entries=>{
    for(const entry of entries) {
      if(!entry.isIntersecting) continue;
      const el=entry.target;
      el.classList.add('is-revealed');
      seen.add(el.dataset.revealKey);
      observer.unobserve(el);
    }
  },{threshold:.2});
  document.documentElement.classList.add('motion-ready');
  const heroEntrances=[];
  const countFrames = new Set();
  const countObserver = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      const el=entry.target,key=el.dataset.cmsBinding;
      countObserver.unobserve(el);
      if(counted.has(key)||reduce())return;
      counted.add(key);
      const target=el.textContent,match=target.match(/\d+(?:[.,]\d+)?/);
      if(!match)return;
      const value=Number(match[0].replace(',','.')),start=performance.now();
      const tick=now=>{
        const t=Math.min(1,(now-start)/1200);
        el.textContent=t===1?target:target.replace(match[0],String(Math.round(value*(1-(1-t)**3))));
        if(t<1){const frame=requestAnimationFrame(tick);countFrames.add(frame);}
      };
      const frame=requestAnimationFrame(tick);countFrames.add(frame);
    });
  },{threshold:.5});
  main.querySelectorAll('.home-proof strong[data-cms-binding]').forEach(el=>countObserver.observe(el));
  mount.querySelectorAll('[data-reveal]').forEach((el,index)=>{
    const section=el.closest('[data-section-id]')?.dataset.sectionId||'shell';
    el.dataset.revealKey=`${pageKey}:${section}:${el.dataset.cmsBinding||index}`;
    if(reduce() || seen.has(el.dataset.revealKey)) el.classList.add('is-revealed');
    else if(hero?.contains(el)) heroEntrances.push(el);
    else observer.observe(el);
  });
  const makeTitleLines=()=>{
    if(!title || renderCount!==1 || reduce())return;
    const lines=[];
    const walker=document.createTreeWalker(title,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())) {
      for(const word of node.textContent.matchAll(/\S+/g)) {
        const range=document.createRange();range.setStart(node,word.index);range.setEnd(node,word.index+word[0].length);
        const rect=range.getBoundingClientRect();
        let line=lines.at(-1);
        if(!line || Math.abs(line.top-rect.top)>3){line={top:rect.top,words:[]};lines.push(line);}
        line.words.push(word[0]);
      }
    }
    if(!lines.length)return;
    title.removeAttribute('data-reveal');title.classList.add('is-revealed');
    title.innerHTML=lines.map((line,index)=>`<span class="hero-title-line" style="--line-index:${index}"><span>${esc(line.words.join(' '))}</span></span>`).join('');
  };
  if(heroImage && pageKey==='home') heroImage.classList.add('camera-drift');
  if(heroImage && pageKey!=='home' && renderCount===1) heroImage.classList.add('photo-settle');
  if(heroImage){heroImage.loading='eager';heroImage.fetchPriority='high';}
  let alive=true;
  const ready=()=>{
    if(!alive)return;
    makeTitleLines();
    hero?.classList.add('hero-ready');
    heroEntrances.forEach((el,index)=>{
      el.style.setProperty('--reveal-delay',`${Math.min(index,4)*100}ms`);
      el.classList.add('is-revealed');seen.add(el.dataset.revealKey);
    });
  };
  Promise.allSettled([document.fonts.ready,heroImage?.decode?.()]).then(ready);
  let heroVisible = false;
  const updateCamera=()=>heroImage?.classList.toggle('is-playing',heroVisible && !reduce() && document.visibilityState==='visible');
  const heroObserver = new IntersectionObserver(entries=>{
    const visible=entries[0]?.isIntersecting;
    heroVisible=visible;updateCamera();
    for(const video of hero?.querySelectorAll('video')||[]) {
      if(visible && !reduce() && document.visibilityState==='visible') video.play().catch(()=>{});else video.pause();
    }
  },{threshold:0});
  if(hero) heroObserver.observe(hero);
  let lastY=scrollY,directionAnchor=scrollY,frame=0;
  const scrollUpdate = ()=>{
    frame=0;const y=scrollY, delta=y-lastY;
    const heroHeight=hero?.offsetHeight||innerHeight;
    header.classList.toggle('is-past-hero',y>heroHeight-80);
    if(y<80) header.classList.remove('is-hidden');
    else if(Math.abs(y-directionAnchor)>12) {header.classList.toggle('is-hidden',delta>0);directionAnchor=y;}
    if(y>5) document.body.classList.add('has-scrolled');
    const form = main.querySelector('form[data-form],form[data-inquiry-form]');
    const formRect = form?.getBoundingClientRect();
    const contactVisible = formRect && formRect.top<innerHeight && formRect.bottom>0;
    const footerRect = mount.querySelector('.site-footer')?.getBoundingClientRect();
    const footerVisible = footerRect && footerRect.top<innerHeight && footerRect.bottom>0;
    dock.classList.toggle('is-visible',y>heroHeight && !contactVisible && !footerVisible);
    if(!mobilePreference.matches && !reduce()) {
      const progress=Math.min(1,Math.max(0,y/500));
      if(title){title.style.translate=`0 ${-60*progress}px`;title.style.opacity=String(1-progress);}
      if(heroImage && pageKey!=='home') heroImage.style.translate=`0 ${-45*progress}px`;
      if(heroImage && pageKey==='home') heroImage.style.scale=String(1+.08*progress);
      main.querySelectorAll('[data-parallax]').forEach(el=>{
        const rect=el.getBoundingClientRect();
        const progress=Math.min(1,Math.max(0,(innerHeight-rect.top)/(innerHeight+rect.height)));
        if(el.hasAttribute('data-reveal') && !el.classList.contains('is-revealed'))return;
        const distance=Number(el.dataset.parallax)||25;
        el.style.translate=`0 ${-distance*progress}px`;
      });
    } else {
      if(title){title.style.translate='';title.style.opacity='';}
      if(heroImage){heroImage.style.translate='';heroImage.style.scale='';}
      main.querySelectorAll('[data-parallax]').forEach(el=>el.style.translate='');
    }
    lastY=y;
  };
  const onScroll=()=>{if(!frame)frame=requestAnimationFrame(scrollUpdate);};
  addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);
  motionPreference.addEventListener('change',onScroll);
  document.addEventListener('visibilitychange',updateCamera);
  scrollUpdate();
  return ()=>{alive=false;observer.disconnect();countObserver.disconnect();countFrames.forEach(cancelAnimationFrame);heroObserver.disconnect();removeEventListener('scroll',onScroll);removeEventListener('resize',onScroll);motionPreference.removeEventListener('change',onScroll);document.removeEventListener('visibilitychange',updateCamera);if(frame)cancelAnimationFrame(frame);};
}

function initForms(ctx) {
  for(const form of mount.querySelectorAll('form[data-form],form[data-inquiry-form]')) {
    for(const [name,query] of [['routeId','rota'],['guletId','gulet'],['startDate','startDate'],['endDate','endDate'],['guests','guests']]) {
      const value=params.get(query);const input=form.elements.namedItem(name);
      if(renderCount===1 && value && input){input.value=value;if(input.type==='date')input.dispatchEvent(new Event('input',{bubbles:true}));}
    }
    const dateLabels = [...form.querySelectorAll('.detail-date-label')];
    const syncDateLabels = () => dateLabels.forEach(label => {
      label.dataset.empty = String(!label.querySelector('input[type="date"]')?.value);
    });
    for (const label of dateLabels) {
      label.addEventListener('input', syncDateLabels);
      label.addEventListener('change', syncDateLabels);
    }
    form.addEventListener('reset', () => queueMicrotask(syncDateLabels));
    syncDateLabels();
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(!form.reportValidity()) return;
      const button=form.querySelector('[type=submit]');
      const fields=Object.fromEntries(new FormData(form));
      if(fields.website) return;
      if(form.dataset.form==='route-quote') {
        const query=new URLSearchParams();
        for(const [name,key] of [['routeId','rota'],['startDate','startDate'],['endDate','endDate'],['guests','guests']]) if(fields[name])query.set(key,fields[name]);
        location.assign(ctx.url(`/iletisim/?${query}`));return;
      }
      if(form.dataset.form==='gulet-quote') {
        const parts=[`Merhaba, ${ctx.detailEntity?.name||'Eylül'} guleti için bilgi almak istiyorum.`];
        if(fields.startDate)parts.push(`Tercih ettiğim tarih: ${fields.startDate}`);
        if(fields.guests)parts.push(`Misafir sayısı: ${fields.guests}`);
        if(fields.message)parts.push(fields.message);
        const target=new URL(ctx.content.settings?.contact?.whatsapp||'https://wa.me/905496523538');
        target.searchParams.set('text',parts.join('\n'));
        window.open(target.href,'_blank','noopener,noreferrer');return;
      }
      const payload={};
      for(const key of ['name','email','phone','message','routeId','guletId','startDate','endDate','guests']) if(fields[key]) payload[key]=fields[key];
      if(!payload.message) payload.message='Mavi yolculuk için teklif almak istiyorum.';
      const oldLabel=button?.innerHTML;
      let message=form.querySelector('.form-message');
      if(!message){message=document.createElement('p');message.className='form-message';message.setAttribute('role','status');message.setAttribute('aria-live','polite');form.append(message);}
      message.textContent='';
      if(button){button.disabled=true;button.innerHTML='<span class="form-spinner" aria-hidden="true"></span> Gönderiliyor…';}
      try {
        const result=await submitInquiry(payload);
        if(!result.id) throw new Error('Talebiniz kaydedilemedi. Lütfen WhatsApp ile iletişime geçin.');
        trackEvent('inquiry_success',{page_path:location.pathname});
        message.dataset.status='success';message.textContent='Talebiniz alındı. Ekibimiz sizinle iletişime geçecek.';form.reset();
      } catch(error) {
        message.dataset.status='error';message.textContent=error.status===404 || !error.status?'Talep şu anda gönderilemedi. Lütfen WhatsApp üzerinden bizimle iletişime geçin.':error.message;
      } finally {if(button){button.disabled=false;button.innerHTML=oldLabel;}}
    });
  }
}

function initVideo(ctx) {
  let dialog=null, previousFocus=null, previousOverflow='';
  for(const item of mount.querySelectorAll('.home-story-play,.detail-photo-play')) {
    const artwork=item.closest('.home-story-art,.detail-intro-art');
    const photo=artwork?.querySelector('.home-story-main-photo,.detail-photo-main img') || item.parentElement.querySelector('.home-story-main-photo,img:not(.detail-compass-stamp):not(.home-link-icon)');
    if(!photo)continue;
    const button=document.createElement('button');button.type='button';button.className=item.className;
    button.innerHTML=icon(ctx,'play');button.dataset.imageSrc=photo.currentSrc||photo.src;button.setAttribute('aria-label','Fotoğrafı görüntüle');item.replaceWith(button);
  }
  for(const story of mount.querySelectorAll('.catalog-story')) {
    const photo=story.querySelector('.catalog-story__image');if(!photo)continue;
    const button=document.createElement('button');button.type='button';button.className='catalog-story__play';button.dataset.imageSrc=photo.currentSrc||photo.src;button.setAttribute('aria-label','Fotoğrafı görüntüle');button.innerHTML=icon(ctx,'play');story.append(button);
  }
  const close=()=>{
    if(!dialog)return;const element=dialog;dialog=null;element.classList.remove('is-open');element.querySelector('video')?.pause();
    setTimeout(()=>element.remove(),300);document.body.style.overflow=previousOverflow;previousFocus?.focus();
  };
  const click=event=>{
    const trigger=event.target.closest('[data-video-src],[data-image-src]');if(!trigger)return;
    event.preventDefault();const video=trigger.dataset.videoSrc;const source=video||trigger.dataset.imageSrc;if(!source)return;
    if(dialog)close();previousFocus=trigger;previousOverflow=document.body.style.overflow;
    dialog=document.createElement('div');dialog.className='video-modal';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label',video?'Fora Sailing video':'Fora Sailing fotoğraf');
    dialog.innerHTML=`<button type="button" aria-label="Önizlemeyi kapat">${icon(ctx,'close')}</button>${video?`<video src="${esc(ctx.asset(source))}" controls playsinline autoplay></video>`:`<div class="scene-preview"><img class="camera-drift is-playing" src="${esc(source)}" alt="Mavi yolculuk manzarası"></div>`}`;
    document.body.append(dialog);document.body.style.overflow='hidden';requestAnimationFrame(()=>dialog?.classList.add('is-open'));
    dialog.querySelector('button').focus();dialog.querySelector('button').addEventListener('click',close);dialog.addEventListener('click',ev=>{if(ev.target===dialog)close();});
  };
  const keydown=event=>{if(event.key==='Escape')close();if(event.key==='Tab'&&dialog){const controls=[...dialog.querySelectorAll('button,video[controls]')];if(controls.length===1){event.preventDefault();controls[0].focus();}}};
  mount.addEventListener('click',click);document.addEventListener('keydown',keydown);
  return ()=>{mount.removeEventListener('click',click);document.removeEventListener('keydown',keydown);close();};
}

function initPreviewSelection(ctx) {
  if(parent===window || params.get('cmsPreview')!=='1')return()=>{};
  const click=event=>{
    if(event.target.closest('input,select,textarea,.menu-toggle,.menu-close,.site-nav,.site-mobile-menu nav,[data-gallery] button'))return;
    const target=event.target.closest('[data-cms-binding],[data-cms-property],[data-section-id]');
    if(!target)return;
    event.preventDefault();event.stopPropagation();
    const entity=target.closest('[data-cms-collection]');
    const isPhoto=target.tagName==='IMG';
    parent.postMessage({type:'FORA_CMS_SELECT',pageId:pageInfo.id,sectionId:target.closest('[data-section-id]')?.dataset.sectionId,binding:target.dataset.cmsBinding,collection:entity?.dataset.cmsCollection,entityId:entity?.dataset.entityId,property:target.dataset.cmsProperty,propertyType:isPhoto?'image':'text',currentValue:isPhoto?target.getAttribute('src'):target.innerText,label:isPhoto?target.alt:target.innerText?.slice(0,80)},location.origin);
  };
  mount.addEventListener('click',click,true);return()=>mount.removeEventListener('click',click,true);
}

async function render(context,meta) {
  const sequence=++renderSequence;
  let ctx=context;
  const defaults=await import('./site-native-content.js?v=20261016-160');
  const normalized=defaults.normalizeNativeContent(context.content);
  baselinePromise ||= fetch(`${config}assets/cms-public.json`,{cache:'no-cache'}).then(response=>response.json()).then(data=>defaults.normalizeNativeContent(data.content||data)).catch(()=>normalized);
  const currentPath=document.querySelector('meta[name="fora-cms-page-path"]')?.content||(preview?pageInfo.path:`/${location.pathname.slice(config.length)}`);
  const detail=detailContent(normalized,{pageKey,path:currentPath,query:params,baseline:await baselinePromise,includeDraft:params.get('cmsPreview')==='1'});
  ctx=createContentContext(detail.content,{basePath:config,includeDraft:params.get('cmsPreview')==='1'});
  ctx.detailEntity=detail.entity;ctx.detailCollection=detail.family;
  if(preview){const originalUrl=ctx.url;ctx.url=route=>previewRoute(ctx.basePath,route)||originalUrl(route);}
  const templates=pageKey==='home'?null:await import('./site-pages.js?v=20261016-160');
  const markup=pageKey==='home'?renderHome(ctx):await templates.renderPage(pageKey,ctx);
  if(sequence!==renderSequence)return;
  const y=scrollY;
  const values=[...mount.querySelectorAll('form')].map(form=>({key:form.dataset.form||form.dataset.inquiryForm,values:[...form.querySelectorAll('input,select,textarea')].map(input=>({name:input.name,value:input.value,checked:input.checked}))}));
  dispose();renderCount++;
  mount.toggleAttribute('data-rerender',renderCount>1);
  mount.innerHTML=`${header(ctx)}${markup}${footer(ctx)}`;
  applySectionState(ctx);
  initIcons(ctx);
  mount.dataset.revision=meta.revision;mount.dataset.renderer='native';mount.dataset.page=pageKey;
  document.body.dataset.cmsRevision=meta.revision;
  let seoContent=ctx.content;
  if(detail.dynamic&&detail.entity){
    seoContent=structuredClone(ctx.content);
    const page=seoContent.pages.find(page=>page.id===pageInfo.id);
    if(page){page.path=detail.entity.path||currentPath;page.title=detail.entity.name||detail.entity.title;page.seo={...page.seo,...detail.entity.seo,title:detail.entity.seo?.title||page.title,description:detail.entity.seo?.description||detail.entity.shortDescription||detail.entity.description||''};}
  }
  setupSEO(seoContent,pageInfo.id,{basePath:config});
  for(const saved of values) {
    const form=[...mount.querySelectorAll('form')].find(form=>(form.dataset.form||form.dataset.inquiryForm)===saved.key);
    for(const savedInput of saved.values){const input=[...form?.elements||[]].find(input=>input.name===savedInput.name);if(input){input.value=savedInput.value;input.checked=savedInput.checked;}}
  }
  const cleanupTemplate=pageKey==='home'?initHome(mount,ctx):templates.initPage?.(mount,ctx,pageKey);
  initForms(ctx);
  const cleanups=[cleanupTemplate,initMenu(),initMotion(ctx),initVideo(ctx),initPreviewSelection(ctx)];
  dispose=()=>cleanups.forEach(fn=>typeof fn==='function'&&fn());
  if(renderCount>1) scrollTo({top:y,behavior:'instant'});
  document.dispatchEvent(new CustomEvent('fora:rendered',{detail:{pageKey,revision:meta.revision,source:meta.source}}));
}

subscribeContent((ctx,meta)=>{void render(ctx,meta).catch(showError);},{basePath:config,staticUrl:`${config}assets/cms-public.json`,onError:showError});
function showError(error) {
  console.error('Fora site:',error.message);
  if(renderCount>0)return;
  mount.innerHTML='<main class="site-status"><h1>Fora Sailing</h1><p>Sayfa şu anda yüklenemedi. Lütfen yeniden deneyin.</p><button type="button" id="retry-site">Yeniden yükle</button></main>';
  mount.querySelector('#retry-site').addEventListener('click',()=>location.reload());
}
