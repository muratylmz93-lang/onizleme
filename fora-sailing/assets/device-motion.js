(() => {
  'use strict';

  const scriptUrl = document.currentScript?.src || location.href;
  const manifestUrl = new URL('device-designs.json', scriptUrl);
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const seen = new Set();
  let manifest = null;
  let currentStage = null;
  let observer = null;
  let documentObserver = null;
  let fixedHeader = null;
  let menuObserver = null;
  let cameraObserver = null;
  let contactObserver = null;
  let contactBar = null;
  let contactScrollHandler = null;
  let contactContentRevision = null;
  let loopAnimation = null;
  let loopTarget = null;
  let loopTimer = 0;

  const stageSelector = '#fora-device-stage';
  const smallDevice = device => device === 'mobile' || device === 'tablet';
  const viewBox = svg => svg?.viewBox?.baseVal;
  const reducedMotion = device => {
    const root = document.documentElement;
    const respectsPreference = root.dataset.cmsRespectReducedMotion !== 'false';
    const forceSmall = device === 'mobile' && root.dataset.cmsReduceMotionMobile === 'true';
    return root.dataset.cmsScrollAnimations === 'false' || forceSmall ||
      (respectsPreference && !!prefersReduced?.matches);
  };
  const getBoard = stage => manifest?.designs?.find(board => board.id === stage?.dataset.board);
  const semanticFor = (node, board) =>
    node.dataset.deviceSemantic || board?.nodes?.find(item => item.id === node.dataset.deviceNode)?.semantic || '';
  const orderFor = (node, board) => Number(node.dataset.deviceOrder ||
    board?.nodes?.find(item => item.id === node.dataset.deviceNode)?.sourceOrder || 0);

  function cancelLoop() {
    window.clearTimeout(loopTimer);
    loopTimer = 0;
    if (loopAnimation) loopAnimation.cancel();
    loopAnimation = null;
    loopTarget = null;
  }

  function clearTransient() {
    observer?.disconnect();
    observer = null;
    menuObserver?.disconnect();
    menuObserver = null;
    cameraObserver?.disconnect();
    cameraObserver = null;
    contactObserver?.disconnect();
    contactObserver = null;
    if (contactScrollHandler) window.removeEventListener('scroll', contactScrollHandler);
    contactScrollHandler = null;
    contactBar?.remove();
    contactBar = null;
    contactContentRevision = null;
    cancelLoop();
    fixedHeader?._removeScroll?.();
    fixedHeader?.remove();
    fixedHeader = null;
    currentStage = null;
  }

  function wrapperFor(node) {
    return node.closest('g') || node.closest('a') || node;
  }

  function animateOnce(element, from, duration, delay = 0, easing = 'cubic-bezier(.22,.61,.36,1)', device = 'mobile') {
    if (!element || element.dataset.fmSeen === 'true') return;
    element.dataset.fmSeen = 'true';
    const reduced = reducedMotion(device);
    const frames = reduced
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }];
    const animation = element.animate(frames, {
      duration: reduced ? 150 : duration,
      delay: reduced ? 0 : delay,
      easing,
      fill: 'both'
    });
    animation.onfinish = () => {
      element.style.opacity = '1';
      animation.cancel();
    };
  }

  function animateMenu(panel, opening) {
    const device = currentStage?.dataset.device || 'mobile';
    const duration = smallDevice(device) ? 350 : 350;
    const panelAnimation = panel.animate(
      opening
        ? [{ opacity: 0, transform: 'translateX(100%)' }, { opacity: 1, transform: 'translateX(0)' }]
        : [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(100%)' }],
      { duration: reducedMotion(device) ? 150 : duration, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'both' }
    );
    panelAnimation.onfinish = () => {
      if (!opening) panel.remove();
      else panelAnimation.cancel();
    };
    const links = [...panel.querySelectorAll('a')];
    if (opening) {
      links.forEach((link, index) => {
        const animation = link.animate(
          reducedMotion(device)
            ? [{ opacity: 0 }, { opacity: 1 }]
            : [{ opacity: 0, transform: 'translateX(15px)' }, { opacity: 1, transform: 'translateX(0)' }],
          { duration: reducedMotion(device) ? 150 : 260, delay: reducedMotion(device) ? 0 : index * 60, fill: 'both', easing: 'ease-out' }
        );
        animation.onfinish = () => {
      element.style.opacity = '1';
      animation.cancel();
    };
      });
    } else {
      links.reverse().forEach((link, index) => {
        const animation = link.animate(
          reducedMotion(device)
            ? [{ opacity: 1 }, { opacity: 0 }]
            : [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(15px)' }],
          { duration: reducedMotion(device) ? 150 : 260, delay: reducedMotion(device) ? 0 : index * 60, fill: 'both', easing: 'ease-in' }
        );
        animation.onfinish = () => {
      element.style.opacity = '1';
      animation.cancel();
    };
      });
    }
  }

  function closeMenu(panel) {
    if (!panel || panel.dataset.fmClosing === 'true') return;
    panel.dataset.fmClosing = 'true';
    animateMenu(panel, false);
    currentStage?.querySelector('[data-link-semantic="menu-toggle"]')?.setAttribute('aria-expanded', 'false');
  }

  function installMenuMotion(stage) {
    menuObserver = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement) || !node.matches('.fora-device-menu')) continue;
          node.style.zIndex = '104';
          contactBar?.classList.add('is-menu-open');
          contactBar?.setAttribute('aria-hidden', 'true');
          contactBar?.querySelectorAll('a').forEach(link => { link.tabIndex = -1; });
          animateMenu(node, true);
          stage.querySelector('[data-link-semantic="menu-toggle"]')?.setAttribute('aria-expanded', 'true');
        }
        for (const node of record.removedNodes) {
          if (!(node instanceof HTMLElement) || !node.matches('.fora-device-menu')) continue;
          contactBar?.classList.remove('is-menu-open');
          contactScrollHandler?.();
        }
      }
    });
    menuObserver.observe(stage, { childList: true });

    stage.addEventListener('click', event => {
      const closeButton = event.target.closest('.fora-device-menu button');
      if (closeButton) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeMenu(closeButton.closest('.fora-device-menu'));
        return;
      }
      const toggle = event.target.closest('[data-link-semantic="menu-toggle"]');
      const panel = stage.querySelector('.fora-device-menu');
      if (toggle && panel) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeMenu(panel);
      }
    }, true);
    stage.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu(stage.querySelector('.fora-device-menu'));
    });
  }

  function headerHeightFor(svg, board) {
    const width = Number(board?.viewport?.width || viewBox(svg)?.width || 0);
    const header = board?.nodes?.find(node => node.type === 'rect' && node.geometry?.x === 0 &&
      node.geometry?.y === 0 && node.geometry.width >= width * 0.8 &&
      node.geometry.height >= 30 && node.geometry.height <= 160);
    return Number(header?.geometry?.height || 0);
  }

  function makeFixedHeader(stage, board) {
    if (reducedMotion(stage.dataset.device || 'mobile')) return;
    const svg = stage.querySelector('svg');
    const box = viewBox(svg);
    const height = headerHeightFor(svg, board);
    if (!svg || !box || !height) return;

    const host = document.createElement('div');
    host.id = 'fora-device-fixed-header';
    host.setAttribute('aria-hidden', 'true');
    const clone = svg.cloneNode(false);
    clone.removeAttribute('role');
    clone.removeAttribute('aria-label');
    clone.setAttribute('viewBox', `0 0 ${box.width} ${height}`);
    clone.setAttribute('preserveAspectRatio', 'xMinYMin meet');

    [...svg.children].forEach(child => {
      let bounds;
      try { bounds = child.getBBox(); } catch { return; }
      if (bounds.y >= -1 && bounds.y + bounds.height <= height + 1) {
        const copy = child.cloneNode(true);
        copy.querySelectorAll?.('[id]').forEach(item => item.removeAttribute('id'));
        copy.removeAttribute?.('id');
        copy.querySelectorAll?.('[data-device-node], [data-device-glyph]').forEach(item => {
          item.removeAttribute('data-device-node');
          item.removeAttribute('data-device-glyph');
          item.removeAttribute('data-fm-seen');
        });
        copy.removeAttribute?.('data-device-node');
        clone.append(copy);
      }
    });
    host.append(clone);
    stage.append(host);
    host.addEventListener('click', event => {
      const toggle = event.target.closest('[data-link-semantic="menu-toggle"]');
      if (!toggle) return;
      event.preventDefault();
      stage.querySelector('[data-link-semantic="menu-toggle"]')?.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true, view: window })
      );
    });
    fixedHeader = host;
    installHeaderScroll();
  }

  function installHeaderScroll() {
    if (!fixedHeader) return;
    let lastY = window.scrollY || 0;
    let direction = 0;
    let accumulated = 0;
    const apply = hidden => {
      fixedHeader.style.transform = hidden ? 'translateY(-102%)' : 'translateY(0)';
      fixedHeader.style.opacity = hidden ? '0' : '1';
      fixedHeader.style.visibility = hidden ? 'hidden' : 'visible';
      fixedHeader.setAttribute('aria-hidden', hidden ? 'true' : 'false');
    };
    const onScroll = () => {
      const y = window.scrollY || 0;
      const delta = y - lastY;
      lastY = y;
      if (y <= 80) { accumulated = 0; apply(true); return; }
      const nextDirection = Math.sign(delta);
      if (!nextDirection) return;
      accumulated = nextDirection === direction ? accumulated + Math.abs(delta) : Math.abs(delta);
      direction = nextDirection;
      if (accumulated < 8) return;
      apply(direction > 0);
      accumulated = 0;
    };
    fixedHeader.style.cssText += ';transform:translateY(-102%);opacity:0;visibility:hidden';
    window.addEventListener('scroll', onScroll, { passive: true });
    fixedHeader._removeScroll = () => window.removeEventListener('scroll', onScroll);
    window.setTimeout(() => { if (window.scrollY > 80 && direction <= 0) apply(false); }, 250);
  }

  function groupKey(rect, device, board) {
    const width = Number(board?.viewport?.width || 390);
    const stride = smallDevice(device) ? width * 1.4 : width * 0.86;
    return Math.floor(Math.max(0, rect.y + rect.height / 2) / stride);
  }

  function scheduleTargets(stage, board) {
    const device = stage.dataset.device || 'mobile';
    const reduced = reducedMotion(device);
    const canAnimate = !reduced;
    const width = Number(board?.viewport?.width || viewBox(stage.querySelector('svg'))?.width || 390);
    const footerStart = Number(board?.viewport?.height || viewBox(stage.querySelector('svg'))?.height || 0) - width * 0.78;
    const nodes = [...stage.querySelectorAll('[data-device-node]')];
    const unique = new Map();

    for (const node of nodes) {
      const semantic = semanticFor(node, board);
      if (!semantic || semantic === 'background-or-control-shape') continue;
      const target = wrapperFor(node);
      if (!target || unique.has(target)) continue;
      const sourceNode = board?.nodes?.find(item => item.id === node.dataset.deviceNode);
      const rawGeometry = sourceNode?.geometry;
      let rect;
      if (rawGeometry) rect = { x: rawGeometry.x || 0, y: rawGeometry.y || 0, width: rawGeometry.width || 0, height: rawGeometry.height || 0 };
      else {
        try { const b = node.getBBox(); rect = { x: b.x, y: b.y, width: b.width, height: b.height }; }
        catch { continue; }
      }
      unique.set(target, { node, target, semantic, rect, order: orderFor(node, board) });
    }

    [...stage.querySelectorAll('.fora-device-form input, .fora-device-form textarea, .fora-device-form select, .fora-device-form .device-submit-hit')]
      .forEach((control, index) => {
        const rect = control.getBoundingClientRect();
        unique.set(control, {
          node: control,
          target: control,
          semantic: 'form-control',
          rect: { x: rect.x, y: rect.y + (window.scrollY || 0), width: rect.width, height: rect.height },
          order: index
        });
      });

    const descriptors = [...unique.values()];
    const groupCounts = new Map();
    descriptors.sort((a, b) => a.order - b.order);
    descriptors.forEach(item => {
      item.footer = item.rect.y >= footerStart;
      item.hero = item.rect.y < width * 1.2;
      item.bucket = item.footer ? 'footer' : `${groupKey(item.rect, device, board)}:${item.semantic}`;
      item.position = groupCounts.get(item.bucket) || 0;
      groupCounts.set(item.bucket, item.position + 1);
    });

    observer?.disconnect();
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const item = entry.target._foraMotionDescriptor;
        observer.unobserve(entry.target);
        if (!item) continue;
        const { target, semantic, rect, hero, footer, position } = item;
        const key = `${stage.dataset.page}:${device}:${target.dataset.deviceNode || target.firstElementChild?.dataset.deviceNode || rect.y}`;
        if (seen.has(key)) continue;
        seen.add(key);

        if (footer) {
          animateOnce(target, smallDevice(device) ? 'translateY(8px)' : 'translateY(15px)',
            smallDevice(device) ? 400 : 600, position * 80, 'cubic-bezier(.22,.61,.36,1)', device);
          continue;
        }

        if (semantic === 'photo-or-illustration') {
          target.dataset.fmPhoto = 'true';
          const delay = footer ? position * 80 : position * (smallDevice(device) ? 130 : 120);
          animateOnce(target, smallDevice(device) ? 'translateY(15px)' : 'translateY(30px) rotate(-2deg)',
            smallDevice(device) ? 500 : 800, delay, 'cubic-bezier(.22,.61,.36,1)', device);
          continue;
        }

        if (semantic === 'heading') {
          const delay = hero ? position * 120 : footer ? position * 80 : position * (smallDevice(device) ? 150 : 120);
          animateOnce(target, smallDevice(device) ? (hero ? 'translateY(20px)' : 'translateY(12px)') :
            (hero ? 'translateY(40px)' : 'translateY(25px)'),
          hero ? (smallDevice(device) ? 550 : 800) : (smallDevice(device) ? 450 : 650), delay,
          'cubic-bezier(.22,.61,.36,1)', device);
          continue;
        }

        if (semantic === 'body-copy' || semantic === 'eyebrow-or-caption' || semantic === 'action-label') {
          const delay = hero ? 200 + position * 100 : footer ? position * 80 : 100 + position * (smallDevice(device) ? 100 : 100);
          animateOnce(target, smallDevice(device) ? 'translateY(12px)' : 'translateY(15px)',
            smallDevice(device) ? 450 : 650, delay, 'cubic-bezier(.22,.61,.36,1)', device);
          continue;
        }

        if (semantic === 'form-control') {
          animateOnce(target, smallDevice(device) ? 'translateY(12px)' : 'translateY(20px)',
            smallDevice(device) ? 450 : 650, position * 120,
            'cubic-bezier(.22,.61,.36,1)', device);
          continue;
        }

        if (semantic === 'menu-toggle-label' || semantic === 'navigation-label') {
          animateOnce(target, smallDevice(device) ? 'translateY(-8px)' : 'translateY(-12px)', 500,
            position * 80, 'cubic-bezier(.22,.61,.36,1)', device);
        }
      }
    }, { threshold: 0.2, rootMargin: '0px 0px -4% 0px' });

    if (!canAnimate) {
      descriptors.forEach(item => {
        item.target.style.opacity = '1';
        item.target.style.transform = 'none';
      });
      return;
    }

    descriptors.forEach(item => {
      item.target._foraMotionDescriptor = item;
      observer.observe(item.target);
    });
    const headerItems = descriptors.filter(item => item.rect.y < width * 0.35 &&
      ['menu-toggle-label', 'navigation-label', 'body-copy'].includes(item.semantic));
    headerItems.forEach((item, index) => {
      const delay = index * 80;
      animateOnce(item.target, smallDevice(device) ? 'translateY(-8px)' : 'translateY(-12px)', 500, delay, 'ease-out', device);
    });
  }

  function installHomeCamera(stage, board) {
    if (board?.pageId !== 'home') return;
    const device = stage.dataset.device || 'mobile';
    const firstImage = [...stage.querySelectorAll('[data-device-node]')]
      .filter(node => semanticFor(node, board) === 'photo-or-illustration')
      .sort((a, b) => orderFor(a, board) - orderFor(b, board))[0];
    if (!firstImage) return;
    const target = wrapperFor(firstImage);
    let cameraVisible = false;
    const toggle = entries => {
      cameraVisible = entries.some(entry => entry.isIntersecting);
      const visible = cameraVisible;
      if (!visible || reducedMotion(device)) {
        if (loopTarget === target) cancelLoop();
        return;
      }
      if (loopTarget === target && (loopAnimation || loopTimer)) return;
      cancelLoop();
      loopTarget = target;
      loopTimer = window.setTimeout(() => {
        loopTimer = 0;
        if (!cameraVisible || reducedMotion(device) || !target.isConnected) return;
        const maxScale = smallDevice(device) ? 1.018 : 1.025;
        loopAnimation = target.animate(
          [{ transform: 'scale(1)' }, { transform: `scale(${maxScale})` }, { transform: 'scale(1)' }],
          { duration: 16000, iterations: Infinity, easing: 'ease-in-out' }
        );
      }, smallDevice(device) ? 650 : 900);
    };
    cameraObserver?.disconnect();
    cameraObserver = new IntersectionObserver(toggle, { threshold: 0.05 });
    cameraObserver.observe(target);
  }

  function installFixedContact(stage, board) {
    const cms = window.ForaCMS?.content;
    const page = cms?.pages?.find(item => item.id === stage.dataset.page || item.path === board?.pagePath) || null;
    const prefix = board?.pageId || stage.dataset.page || '';
    const fields = (page?.sections || []).flatMap(section => section.fields || []);
    const field = suffix => fields.find(item => item.binding === `${prefix}.header.${suffix}`)?.value;
    const offerLabel = String(field('offerLabel') || 'Teklif Alın').trim();
    const offerTarget = String(field('offerUrl') || 'iletisim/').trim();
    const whatsappLabel = String(field('whatsappLabel') || 'WhatsApp').trim();
    const whatsappTarget = String(field('whatsappUrl') || cms?.settings?.contact?.whatsapp || '').trim();
    if (!offerTarget || !whatsappTarget) return;

    const rootBase = new URL('../', scriptUrl);
    const resolve = raw => {
      if (/^(https?:|tel:|mailto:)/i.test(raw)) return raw;
      if (raw.startsWith('#')) return raw;
      return new URL(raw.replace(/^\/+/, ''), rootBase).href;
    };
    const nav = document.createElement('nav');
    nav.className = 'fora-device-contact-bar';
    nav.setAttribute('aria-label', 'Hızlı iletişim');
    const offer = document.createElement('a');
    offer.href = resolve(offerTarget);
    offer.textContent = offerLabel;
    offer.className = 'fora-device-contact-offer';
    const whatsapp = document.createElement('a');
    whatsapp.href = resolve(whatsappTarget);
    whatsapp.textContent = whatsappLabel;
    whatsapp.className = 'fora-device-contact-whatsapp';
    whatsapp.target = '_blank';
    whatsapp.rel = 'noopener noreferrer';
    nav.append(offer, whatsapp);
    stage.append(nav);
    contactBar = nav;
    contactContentRevision = Number(window.ForaCMS?.revision ?? window.ForaCMS?.content?.revision ?? 0);

    const firstImage = board?.nodes?.filter(node => node.type === 'image')
      .sort((a, b) => a.sourceOrder - b.sourceOrder)[0];
    const heroEnd = firstImage
      ? firstImage.geometry.y + firstImage.geometry.height
      : Number(board?.viewport?.height || 700) * 0.6;
    let contactVisible = false;
    const visibleControls = new Set();
    const update = () => {
      const shown = (window.scrollY || 0) > heroEnd && !contactVisible;
      const reduced = reducedMotion(stage.dataset.device || 'mobile');
      nav.classList.toggle('is-visible', shown);
      nav.classList.toggle('is-reduced', reduced);
      nav.setAttribute('aria-hidden', shown ? 'false' : 'true');
      nav.querySelectorAll('a').forEach(link => { link.tabIndex = shown ? 0 : -1; });
    };
    contactScrollHandler = update;
    window.addEventListener('scroll', update, { passive: true });

    const formTargets = stage.querySelectorAll('.fora-device-form input, .fora-device-form textarea, .fora-device-form select, .fora-device-form .device-submit-hit');
    if (formTargets.length) {
      contactObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) visibleControls.add(entry.target);
          else visibleControls.delete(entry.target);
        });
        contactVisible = visibleControls.size > 0;
        update();
      }, { threshold: 0.2 });
      formTargets.forEach(target => contactObserver.observe(target));
    }
    update();
  }

  function syncContactFromContent(event, attempt = 0) {
    if (!currentStage || !window.ForaCMS?.content) {
      if (attempt < 20) window.setTimeout(() => syncContactFromContent(event, attempt + 1), 50);
      return;
    }
    const revision = Number(event.detail?.revision ?? window.ForaCMS?.revision ?? 0);
    if (contactContentRevision === revision) return;
    contactObserver?.disconnect();
    contactObserver = null;
    if (contactScrollHandler) window.removeEventListener('scroll', contactScrollHandler);
    contactScrollHandler = null;
    contactBar?.remove();
    contactBar = null;
    installFixedContact(currentStage, getBoard(currentStage));
    contactContentRevision = revision;
  }

  function installHoverHooks(stage) {
    stage.querySelectorAll('[data-device-node]').forEach(node => {
      const sem = node.dataset.deviceSemantic || '';
      const target = wrapperFor(node);
      if (sem === 'photo-or-illustration') {
        target.dataset.fmPhoto = 'true';
        if (node.closest('a[data-link-semantic="route-detail"], a[data-link-semantic="gulet-detail"]')) {
          target.dataset.fmCard = 'true';
        }
      }
      if (node.closest('a[data-link-semantic="primary-cta"]')) target.dataset.fmCta = 'true';
      if (node.closest('a[href*="wa.me"]')) target.dataset.fmWhatsapp = 'true';
    });
  }

  function handleStage(event) {
    const stage = event.detail?.stage || document.querySelector(stageSelector);
    if (!stage) { clearTransient(); return; }
    clearTransient();
    currentStage = stage;
    const board = getBoard(stage);
    installMenuMotion(stage);
    installHoverHooks(stage);
    scheduleTargets(stage, board);
    installHomeCamera(stage, board);
    makeFixedHeader(stage, board);
    installFixedContact(stage, board);
    if (board) {
      const headerHeight = headerHeightFor(stage.querySelector('svg'), board) || 0;
      const brand = [...stage.querySelectorAll('a[data-link-semantic="home"]')].find(anchor => {
        try { return anchor.getBBox().y < Math.max(40, headerHeight + 1); } catch { return false; }
      });
      animateOnce(brand, reducedMotion(stage.dataset.device) ? 'none' :
        (smallDevice(stage.dataset.device) ? 'translateY(-8px)' : 'translateY(-12px)'), 500, 0, 'ease-out', stage.dataset.device);
    }
  }

  function updateMotionPreference() {
    if (!currentStage) return;
    const device = currentStage.dataset.device || 'mobile';
    if (reducedMotion(device)) {
      cancelLoop();
      fixedHeader?._removeScroll?.();
      fixedHeader?.remove();
      fixedHeader = null;
      currentStage.querySelectorAll('[data-device-node]').forEach(node => {
        const target = wrapperFor(node);
        target.getAnimations().forEach(animation => animation.cancel());
        target.style.opacity = '1';
        target.style.transform = 'none';
      });
      observer?.disconnect();
      observer = null;
      return;
    }
    scheduleTargets(currentStage, getBoard(currentStage));
    installHomeCamera(currentStage, getBoard(currentStage));
    if (!fixedHeader) makeFixedHeader(currentStage, getBoard(currentStage));
  }

  window.addEventListener('fora:device-rendered', handleStage);
  window.addEventListener('fora:cms-content', syncContactFromContent);
  window.addEventListener('fora:motion-settings', updateMotionPreference);
  prefersReduced?.addEventListener?.('change', updateMotionPreference);
  new MutationObserver(updateMotionPreference).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-cms-scroll-animations', 'data-cms-reduce-motion-mobile', 'data-cms-respect-reduced-motion']
  });
  documentObserver = new MutationObserver(() => {
    if (currentStage && !currentStage.isConnected) clearTransient();
    else if (!currentStage && document.querySelector(stageSelector)) handleStage({ detail: { stage: document.querySelector(stageSelector) } });
  });
  documentObserver.observe(document.body, { childList: true });

  fetch(manifestUrl, { credentials: 'same-origin' })
    .then(response => { if (!response.ok) throw new Error(`device manifest ${response.status}`); return response.json(); })
    .then(data => {
      manifest = data;
      const stage = document.querySelector(stageSelector);
      if (stage) handleStage({ detail: { stage } });
    })
    .catch(() => {});
})();
