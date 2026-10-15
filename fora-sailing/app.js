(() => {
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const heroArt = document.querySelector('.hero-camera');
  const heroCameraInner = document.querySelector('.hero-camera-inner');
  const visibleHero = () => document.querySelector('.desktop-cms-section-stage .hero') || hero;
  const masthead = document.querySelector('.masthead');
  const quickContact = document.querySelector('.quick-contact');
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  let canAnimate = !motionQuery.matches;

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const open = menuToggle.getAttribute('aria-expanded') !== 'true';
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
      mainNav.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
    });
    mainNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Menüyü aç');
      mainNav.classList.remove('open');
      document.body.classList.remove('menu-open');
    }));
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || menuToggle.getAttribute('aria-expanded') !== 'true') return;
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Menüyü aç');
      mainNav.classList.remove('open');
      document.body.classList.remove('menu-open');
      menuToggle.focus();
    });
  }

  const enteredOnce = new WeakSet();
  const observedOnce = new Set();
  const visibleOnce = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      enteredOnce.add(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2 });
  const observeOnce = (node) => {
    observedOnce.add(node);
    visibleOnce.observe(node);
  };

  const revealTargets = [
    '.story-main', '.story-side', '.story-copy', '.compass', '.story-note',
    '.light-heading', '.route-map-art', '.fleet-title', '.fleet-note',
    '.offer-copy', '.season-badge', '.benefits h2', '.benefit-coast',
    '.reviews-copy', '.review-card', '.review-collage', '.footer-brand', '.footer nav', '.social-links'
  ];
  const mobileLayout = window.matchMedia('(max-width: 650px)');
  const syncResponsiveMotionTargets = () => {
    visibleOnce.disconnect();
    observedOnce.clear();
    const addTarget = (node) => {
      observedOnce.add(node);
      if (canAnimate && !enteredOnce.has(node)) {
        node.classList.remove('is-visible');
        visibleOnce.observe(node);
      } else node.classList.add('is-visible');
    };
    if (mobileLayout.matches) {
      document.querySelectorAll(revealTargets.join(',')).forEach((node) => {
        node.classList.add('reveal');
        addTarget(node);
      });
      document.querySelectorAll('.route-cards, .fleet-cards, .benefit-list').forEach((list) => {
        list.classList.add('stagger-list');
        list.querySelectorAll(':scope > *').forEach((item) => item.classList.add('stagger-item'));
        addTarget(list);
      });
    } else {
      document.querySelectorAll('.home-foreground-art .motion-art').forEach((node) => {
        node.classList.add('reveal');
        addTarget(node);
      });
    }
  };
  syncResponsiveMotionTargets();
  mobileLayout.addEventListener?.('change', syncResponsiveMotionTargets);

  const heroReady = () => document.body.classList.add('hero-ready');
  const heroPhoto = new Image();
  heroPhoto.onload = heroReady;
  heroPhoto.onerror = heroReady;
  heroPhoto.src = 'assets/hero-clean-base.png';
  if (heroPhoto.complete) heroReady();

  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => entry.target.classList.toggle('camera-active', canAnimate && entry.isIntersecting));
  }, { threshold: 0.01 });
  if (hero) heroObserver.observe(hero);
  heroCameraInner?.addEventListener('animationend', (event) => {
    if (event.animationName === 'hero-camera-arrive' || event.animationName === 'hero-camera-arrive-mobile') {
      heroCameraInner.classList.add('camera-entered');
    }
  });
  document.addEventListener('animationend', (event) => {
    if (event.target.matches?.('.desktop-cms-section-stage .hero-camera-inner') &&
        ['hero-camera-arrive','hero-camera-arrive-mobile'].includes(event.animationName)) {
      event.target.classList.add('camera-entered');
    }
  });
  const fleetCards = document.querySelectorAll('.fleet-drag-card');
  const artCanvas = document.querySelector('.home-foreground-art');
  const artHotspots = document.querySelector('.home-art-hotspots');
  const cardArtStates = {
    'hotspot-route-1': ['home-art-route-card-1', 'home-art-route-photo-1'],
    'hotspot-route-2': ['home-art-route-card-2', 'home-art-route-photo-2'],
    'hotspot-route-3': ['home-art-route-card-3', 'home-art-route-photo-3'],
    'hotspot-route-4': ['home-art-route-card-4', 'home-art-route-photo-4'],
    'hotspot-fleet-1': ['home-art-fleet-card-1', 'home-art-fleet-photo-1'],
    'hotspot-fleet-2': ['home-art-fleet-card-2', 'home-art-fleet-photo-2'],
    'hotspot-fleet-3': ['home-art-fleet-card-3', 'home-art-fleet-photo-3'],
    'hotspot-fleet-4': ['home-art-fleet-card-4', 'home-art-fleet-photo-4'],
    'hotspot-fleet-5': ['home-art-fleet-card-5', 'home-art-fleet-photo-5']
  };
  const setCardHover = (event, active) => {
    const link = event.target.closest('a');
    const classes = link && [...link.classList].find((name) => cardArtStates[name]);
    if (!classes) return;
    cardArtStates[classes].forEach((name) => document.querySelector(`.${name}`)?.classList.toggle('is-hovered', active));
  };
  artHotspots?.addEventListener('pointerover', (event) => setCardHover(event, true));
  artHotspots?.addEventListener('pointerout', (event) => {
    if (event.relatedTarget && event.target.closest('a')?.contains(event.relatedTarget)) return;
    setCardHover(event, false);
  });
  let fleetDrag = null;
  let fleetShift = 0;
  let fleetDragUnderlay = null;
  const fleetLimits = () => {
    const extras = Number(document.documentElement.dataset.homeFleetExtraCount || 0);
    const pitch = Number(document.documentElement.dataset.homeFleetPitchSource || 141);
    return { min: -Math.max(50, Math.max(0, extras) * pitch), max: 50 };
  };
  const updateFleetShift = (value) => {
    const limits = fleetLimits();
    fleetShift = Math.max(limits.min, Math.min(limits.max, value));
    const shiftLength = `${fleetShift / 809 * 100}cqw`;
    artCanvas?.style.setProperty('--fleet-shift', shiftLength);
    artHotspots?.style.setProperty('--fleet-shift', shiftLength);
    artCanvas?.classList.toggle('has-fleet-shift', Math.abs(fleetShift) > 0.01);
    document.documentElement.style.setProperty('--cms-home-fleet-shift', shiftLength);
    if (Math.abs(fleetShift) > 0.01 && !fleetDragUnderlay && artCanvas) {
      fleetDragUnderlay = document.createElement('img');
      fleetDragUnderlay.className = 'home-fleet-drag-underlay';
      fleetDragUnderlay.alt = '';
      fleetDragUnderlay.setAttribute('aria-hidden', 'true');
      fleetDragUnderlay.src = 'assets/home-fleet-drag-underlay-v3.png';
      artCanvas.prepend(fleetDragUnderlay);
    }
    if (fleetDragUnderlay) fleetDragUnderlay.style.display = Math.abs(fleetShift) > 0.01 ? 'block' : 'none';
  };
  window.addEventListener('fora:home-fleet-collection', () => updateFleetShift(fleetShift));
  if (artCanvas && artHotspots && fleetCards.length) {
    artHotspots.addEventListener('pointerdown', (event) => {
      const rect = artCanvas.getBoundingClientRect();
      const localY = (event.clientY - rect.top) * 809 / rect.width;
      if (localY < 1105 || localY > 1320) return;
      fleetDrag = { pointerId: event.pointerId, x: event.clientX, origin: fleetShift, moved: false, captured: false };
    });
    artHotspots.addEventListener('pointermove', (event) => {
      if (!fleetDrag || fleetDrag.pointerId !== event.pointerId) return;
      const delta = (event.clientX - fleetDrag.x) * 809 / artCanvas.getBoundingClientRect().width;
      if (Math.abs(delta) > 4) {
        fleetDrag.moved = true;
        artCanvas.classList.add('is-fleet-dragging');
        if (!fleetDrag.captured) {
          artHotspots.setPointerCapture(event.pointerId);
          fleetDrag.captured = true;
        }
      }
      updateFleetShift(fleetDrag.origin + delta);
    });
    const endFleetDrag = (event) => {
      if (!fleetDrag || fleetDrag.pointerId !== event.pointerId) return;
      if (fleetDrag.moved) {
        const suppress = (click) => { click.preventDefault(); click.stopPropagation(); artHotspots.removeEventListener('click', suppress, true); };
        artHotspots.addEventListener('click', suppress, true);
      }
      fleetDrag = null;
      artCanvas.classList.remove('is-fleet-dragging');
    };
    artHotspots.addEventListener('pointerup', endFleetDrag);
    artHotspots.addEventListener('pointercancel', endFleetDrag);
  }
  // Reordered CMS bands contain cloned links, so they need delegated pointer
  // handling after the original artwork has been hidden.
  let stagedFleetDrag = null;
  const paintStagedFleet = (band, value) => {
    const limits = fleetLimits();
    const shift = Math.max(limits.min, Math.min(limits.max, value));
    const length = `${shift / 809 * 100}cqw`;
    band.dataset.fleetShift = String(shift);
    band.style.setProperty('--fleet-shift', length);
    const stage = band.closest('.desktop-cms-section-stage');
    stage?.classList.toggle('has-fleet-shift', Math.abs(shift) > .01);
    band.querySelectorAll('.fleet-drag-card,[class*="home-art-fleet-photo-"],a[class*="hotspot-fleet-"]').forEach(node => {
      if (node.classList.contains('hotspot-fleet-link')) return;
      if (!node.hasAttribute('data-fleet-base-transform')) node.dataset.fleetBaseTransform = node.style.transform === 'none' ? '' : node.style.transform;
      node.style.transform = `translateX(${length}) ${node.dataset.fleetBaseTransform || ''}`.trim();
    });
    let plate = band.querySelector('.home-fleet-drag-underlay');
    if (!plate && Math.abs(shift) > .01) {
      plate = document.createElement('img');
      plate.className = 'home-fleet-drag-underlay'; plate.alt = ''; plate.setAttribute('aria-hidden','true');
      plate.src = 'assets/home-fleet-drag-underlay-v3.png';
      Object.assign(plate.style,{position:'absolute',left:'20.27194067cqw',top:'6.18046972cqw',width:'79.72805933cqw',height:'28.43016069cqw',zIndex:'1',pointerEvents:'none',transform:'none',clipPath:'polygon(16.81087763cqw 0,100% 0,100% 100%,0 100%,0 7.41656366cqw,16.81087763cqw 7.41656366cqw)'});
      band.prepend(plate);
    }
    if (plate) plate.style.display = Math.abs(shift) > .01 ? 'block' : 'none';
    return shift;
  };
  document.addEventListener('pointerdown', event => {
    const band = event.target.closest?.('.desktop-cms-section-band[data-cms-section-id="fleet"]');
    if (!band || !event.target.closest('a[class*="hotspot-fleet-"]') || event.target.closest('.hotspot-fleet-link')) return;
    stagedFleetDrag = {band,id:event.pointerId,x:event.clientX,origin:Number(band.dataset.fleetShift || 0),moved:false};
  });
  document.addEventListener('pointermove', event => {
    if (!stagedFleetDrag || event.pointerId !== stagedFleetDrag.id) return;
    const drag = stagedFleetDrag;
    const delta = (event.clientX - drag.x) * 809 / drag.band.getBoundingClientRect().width;
    if (Math.abs(delta) > 4) {drag.moved = true; drag.band.setPointerCapture(event.pointerId);}
    if (drag.moved) paintStagedFleet(drag.band,drag.origin + delta);
  });
  const endStagedFleet = event => {
    if (!stagedFleetDrag || event.pointerId !== stagedFleetDrag.id) return;
    if (stagedFleetDrag.moved) {
      const band = stagedFleetDrag.band;
      const suppress = click => {click.preventDefault();click.stopPropagation();band.removeEventListener('click',suppress,true);};
      band.addEventListener('click',suppress,true);
    }
    stagedFleetDrag = null;
  };
  document.addEventListener('pointerup',endStagedFleet);
  document.addEventListener('pointercancel',endStagedFleet);
  masthead?.addEventListener('animationend', (event) => {
    if (event.animationName !== 'header-arrive' && event.animationName !== 'header-arrive-mobile') return;
    masthead.classList.add('header-arrived');
    masthead.style.animation = 'none';
    masthead.style.removeProperty('transform');
    masthead.style.removeProperty('opacity');
  });

  const contact = document.querySelector('#iletisim');
  let contactObserver = null;
  if (contact && quickContact) {
    contactObserver = new IntersectionObserver(([entry]) => {
      quickContact.classList.toggle('is-contact-visible', entry.isIntersecting);
    }, { threshold: 0.2 });
    contactObserver.observe(contact);
  }
  window.addEventListener('fora:desktop-sections-stage', (event) => {
    heroObserver.disconnect();
    const currentHero = event.detail?.active ? event.detail.stage?.querySelector('.hero') : hero;
    if (currentHero) heroObserver.observe(currentHero);
    contactObserver?.disconnect();
    const currentContact = event.detail?.active ? event.detail.footerAnchor : contact;
    if (currentContact) contactObserver?.observe(currentContact);
    window.dispatchEvent(new Event('scroll'));
  });

  const applyMotionPreference = () => {
    canAnimate = !motionQuery.matches;
    if (canAnimate) {
      document.documentElement.classList.add('motion-ready');
      observedOnce.forEach((node) => {
        if (enteredOnce.has(node)) node.classList.add('is-visible');
        else {
          node.classList.remove('is-visible');
          visibleOnce.observe(node);
        }
      });
      const currentHero = visibleHero();
      if (currentHero && currentHero.getBoundingClientRect().bottom > 0 && currentHero.getBoundingClientRect().top < window.innerHeight) {
        currentHero.classList.add('camera-active');
      }
      return;
    }
    document.documentElement.classList.remove('motion-ready');
    visibleOnce.disconnect();
    document.body.classList.add('hero-ready');
    document.querySelectorAll('.hero').forEach(node => node.classList.remove('camera-active'));
    if (heroArt) heroArt.style.removeProperty('--hero-scroll-scale');
    if (heroArt) heroArt.style.removeProperty('--hero-scroll-y');
    document.querySelectorAll('.hero h1, .hero .hero-copy').forEach((node) => {
      node.style.removeProperty('--hero-title-shift');
      node.style.removeProperty('--hero-title-opacity');
      node.style.removeProperty('--hero-shift');
    });
    document.querySelectorAll('.story-main, .story-side').forEach((node) => {
      node.style.removeProperty('--story-y');
      node.style.removeProperty('--story-side-y');
    });
    observedOnce.forEach((node) => node.classList.add('is-visible'));
  };
  applyMotionPreference();
  motionQuery.addEventListener?.('change', applyMotionPreference);

  let previousY = window.scrollY;
  let directionTravel = 0;
  let direction = 0;
  let scrollFrame = 0;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const paintScrollState = () => {
    const y = window.scrollY;
    const currentHero = visibleHero();
    const currentHeroArt = currentHero?.querySelector('.hero-camera') || heroArt;
    const heroRect = currentHero?.getBoundingClientRect();
    const heroTop = heroRect ? heroRect.top + y : 0;
    const heroBottom = heroRect ? heroRect.bottom + y : 0;
    const pastHero = y >= heroBottom && y > 80;
    const afterHero = y >= heroBottom && y > 80;
    if (y > 0) document.body.classList.add('has-scrolled');
    const delta = y - previousY;
    if (Math.sign(delta) === direction) directionTravel += Math.abs(delta);
    else { direction = Math.sign(delta); directionTravel = Math.abs(delta); }
    if (masthead) {
      masthead.classList.toggle('is-past-hero', pastHero);
      if (y < 80) masthead.classList.remove('is-hidden');
      else if (directionTravel >= 12) masthead.classList.toggle('is-hidden', direction > 0);
    }
    if (quickContact) quickContact.classList.toggle('is-visible', afterHero);
    if (canAnimate && !window.matchMedia('(max-width: 650px)').matches && currentHero) {
      const progress = clamp((y - heroTop) / 500);
      const title = currentHero.querySelector('.source-title-glyphs') || currentHero.querySelector('h1');
      if (title) {
        title.style.setProperty('--hero-title-shift', `${-progress * 60}px`);
        title.style.setProperty('--hero-title-opacity', String(1 - progress));
      }
      if (currentHeroArt) currentHeroArt.style.setProperty('--hero-scroll-y', `${-progress * 45}px`);
      const story = document.querySelector('.story');
      if (story) {
        const storyProgress = clamp((window.innerHeight - story.getBoundingClientRect().top) / (window.innerHeight + story.offsetHeight));
        const eased = storyProgress * storyProgress * (3 - 2 * storyProgress);
        const main = document.querySelector('.home-art-story-main');
        const side = document.querySelector('.home-art-story-side');
        if (main) main.style.setProperty('--story-y', `${-25 * eased}px`);
        if (side) side.style.setProperty('--story-side-y', `${-45 * eased}px`);
      }
      const offerPhoto = document.querySelector('.home-art-offer-photo');
      const offer = document.querySelector('.offer');
      if (offerPhoto && offer) {
        const offerProgress = clamp((window.innerHeight - offer.getBoundingClientRect().top) / (window.innerHeight + offer.offsetHeight));
        offerPhoto.style.setProperty('--offer-scroll-y', `${-25 * offerProgress}px`);
      }
    } else {
      if (heroArt) {
        heroArt.style.removeProperty('--hero-scroll-scale');
        heroArt.style.removeProperty('--hero-scroll-y');
      }
    }
    previousY = y;
    scrollFrame = 0;
  };
  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(paintScrollState);
  }, { passive: true });
  window.addEventListener('resize', paintScrollState, { passive: true });
  const photoPreview = document.querySelector('#home-photo-preview');
  let photoPreviewTrigger = null;
  let photoPreviewCloseTimer = null;
  const closePhotoPreview = () => {
    if (!photoPreview?.open || photoPreviewCloseTimer) return;
    photoPreview.classList.add('is-closing');
    photoPreviewCloseTimer = setTimeout(() => {
      photoPreview.close();
      photoPreview.classList.remove('is-closing');
      photoPreviewCloseTimer = null;
    }, motionQuery.matches ? 150 : 300);
  };
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest?.('.hotspot-story-play, .story-collage .play');
    if (!trigger || !photoPreview) return;
    event.preventDefault();
    photoPreviewTrigger = trigger;
    photoPreview.showModal();
  });
  photoPreview?.querySelector('.home-photo-preview-close')?.addEventListener('click', closePhotoPreview);
  photoPreview?.addEventListener('cancel', (event) => { event.preventDefault(); closePhotoPreview(); });
  photoPreview?.addEventListener('click', (event) => { if (event.target === photoPreview) closePhotoPreview(); });
  photoPreview?.addEventListener('close', () => { photoPreviewTrigger?.focus({ preventScroll: true }); });
  document.querySelectorAll('.hotspot-story-play,.story-collage .play').forEach((trigger) => {
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', 'home-photo-preview');
    trigger.setAttribute('aria-label', 'Mavi yolculuk önizlemesini aç');
  });
  paintScrollState();
})();
