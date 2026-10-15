(() => {
  'use strict';

  const scriptUrl = document.currentScript?.src || location.href;
  const assetBaseUrl = new URL('.', scriptUrl);
  const siteBaseUrl = new URL('../', assetBaseUrl);
  const manifestUrl = new URL('desktop-sections.json', scriptUrl);
  const hiddenAttr = 'data-desktop-section-source-hidden';
  const state = { manifest: null, stage: null, host: null, hostStyle: null, observer: null, signature: '', livePage: null, baselinePage: null };

  const ready = fetch(manifestUrl, { cache: 'no-store' }).then(response => {
    if (!response.ok) throw new Error(`Desktop section manifest HTTP ${response.status}`);
    return response.json();
  }).then(manifest => (state.manifest = manifest)).catch(error => {
    document.documentElement.dataset.desktopSectionsError = String(error?.message || error);
    return null;
  });

  function cleanPath(path) {
    let value = String(path || location.pathname).replace(/^\/site(?=\/|$)/, '');
    if (!value.startsWith('/')) value = `/${value}`;
    if (!value.endsWith('/')) value += '/';
    return value;
  }

  function pageAt(content, path) {
    const pages = Array.isArray(content?.pages) ? content.pages : [];
    return pages.find(page => cleanPath(page.path) === path) || null;
  }

  function pageTemplate(path) {
    return state.manifest?.pages?.find(page => cleanPath(page.path) === path) || null;
  }

  function originId(section) {
    return section?.sourceSectionId || section?.id || '';
  }

  function isClone(section) {
    return !!(section?.instanceId || section?.sourceSectionId);
  }

  function compactVisualSections(page, template) {
    const byId = new Map((template?.bands || []).map(band => [band.sourceSectionId, band]));
    const output = [];
    const originalGroups = new Map();
    for (const section of page?.sections || []) {
      const sourceId = originId(section);
      const band = byId.get(sourceId);
      if (!band) continue; // Header chrome is outside the reorderable content stage.
      const alias = band.aliasOf || band.sourceSectionId;
      const clone = isClone(section);
      if (!clone && originalGroups.has(alias)) {
        originalGroups.get(alias).sections.push(section);
        continue;
      }
      const row = { section, sourceId, band, alias, clone, sections: [section] };
      output.push(row);
      if (!clone) originalGroups.set(alias, row);
    }
    return output;
  }

  function fingerprint(content, page, path, template) {
    const live = compactVisualSections(page, template).map(row => ({
      id: row.section.id,
      source: row.sourceId,
      instance: row.section.instanceId || '',
      label: row.section.label || '',
      fields: row.sections.flatMap(item => item.fields || []).map(field => [field.id, field.sourceFieldId || '', field.binding || '', field.value, field.deviceOverrides || null])
    }));
    return JSON.stringify([path, live]);
  }

  function baselineVisualIds(basePage, template) {
    return compactVisualSections(basePage, template).map(row => row.alias);
  }

  function liveVisualIds(page, template) {
    return compactVisualSections(page, template).map(row => row.clone ? `${row.alias}#${row.section.instanceId || row.section.id}` : row.alias);
  }

  function needsCustomSections(page, baselinePage, template) {
    const baseline = baselineVisualIds(baselinePage, template);
    const live = liveVisualIds(page, template);
    if (JSON.stringify(baseline) !== JSON.stringify(live)) return true;
    return (page?.sections || []).some(isClone);
  }

  function removePriorStage() {
    if (state.stage) window.dispatchEvent(new CustomEvent('fora:desktop-sections-stage', { detail: { active: false, stage: state.stage, footerAnchor: null } }));
    state.observer?.disconnect();
    state.observer = null;
    state.stage?.remove();
    state.stage = null;
    // Home page source bands live beside <main>, so restore module-owned masks
    // document-wide when the CMS returns to the unmodified section order.
    document.querySelectorAll(`[${hiddenAttr}]`).forEach(element => element.removeAttribute(hiddenAttr));
    document.body.removeAttribute('data-desktop-sections-active');
    if (state.host && state.hostStyle) state.host.setAttribute('style', state.hostStyle);
    else if (state.host) state.host.removeAttribute('style');
    state.host = null;
    state.hostStyle = null;
    state.signature = '';
    state.livePage = null;
    state.baselinePage = null;
  }

  function hideSource(element) {
    if (!element || element === state.stage || element.hasAttribute(hiddenAttr)) return;
    element.setAttribute(hiddenAttr, '');
  }

  function uniqueNodes(selectors, root = document) {
    const seen = new Set();
    const nodes = [];
    for (const selector of selectors || []) {
      try {
        for (const node of root.querySelectorAll(selector)) {
          if (!seen.has(node)) { seen.add(node); nodes.push(node); }
        }
      } catch { /* Ignore a stale selector; the next valid selector can still provide the source band. */ }
    }
    return nodes;
  }

  function copySourceIdentity(source, clone) {
    if (source.id) clone.dataset.desktopSourceId = source.id;
    if (source.dataset.copyId) clone.dataset.desktopSourceCopyId = source.dataset.copyId;
    if (source.hasAttribute('for')) clone.dataset.desktopSourceFor = source.getAttribute('for');
    const oldId = source.id;
    if (oldId) clone.id = `${oldId}-section-${crypto.randomUUID()}`;
    clone.querySelectorAll?.('[id]').forEach(node => {
      const id = node.id;
      node.dataset.desktopSourceId = id;
      node.id = `${id}-section-${crypto.randomUUID()}`;
    });
    clone.querySelectorAll?.('[for]').forEach(node => { node.dataset.desktopSourceFor = node.getAttribute('for'); });
    clone.querySelectorAll?.('a[href^="#"],label[for]').forEach(node => {
      const attr = node.hasAttribute('href') ? 'href' : 'for';
      const value = node.getAttribute(attr);
      const replacement = clone.querySelector(`[data-desktop-source-id="${CSS.escape(value.replace(/^#/, ''))}"]`);
      if (replacement) node.setAttribute(attr, `${attr === 'href' ? '#' : ''}${replacement.id}`);
    });
  }

  function normalizeClonedImageURLs(root) {
    const routeParts = cleanPath(location.pathname).split('/').filter(Boolean);
    if (!routeParts.length) return;
    const images = root.matches?.('img') ? [root, ...root.querySelectorAll('img')] : [...root.querySelectorAll('img')];
    for (const image of images) {
      const raw = image.getAttribute('src') || image.src;
      if (!raw) continue;
      try {
        const url = new URL(raw, location.href);
        const parts = url.pathname.split('/').filter(Boolean);
        const siteIndex = parts.indexOf('site');
        if (siteIndex < 0) continue;
        const start = siteIndex + 1;
        const isRoutePrefix = routeParts.every((part, index) => parts[start + index] === part);
        if (!isRoutePrefix) continue;
        let duplicateStart = start + routeParts.length;
        while (routeParts.every((part, index) => parts[duplicateStart + index] === part)) {
          parts.splice(duplicateStart, routeParts.length);
        }
        url.pathname = `/${parts.join('/')}`;
        // The live source layer may have acquired this retry marker after its
        // first request failed under the reordered containing block. Clones
        // resolve from the normalized original asset URL and retry cleanly.
        url.searchParams.delete('fora-retry');
        image.setAttribute('src', url.href);
      } catch { /* Keep data/blob URLs and malformed optional art unchanged. */ }
    }
  }

  function createStage(host, mode) {
    const stage = document.createElement('div');
    stage.className = `desktop-cms-section-stage desktop-cms-section-stage-${mode}`;
    stage.dataset.desktopSectionsStage = mode;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.append(stage);
    state.host = host;
   state.stage = stage;
    document.body.setAttribute('data-desktop-sections-active', 'true');
    return stage;
  }

  function box(element) { return element.getBoundingClientRect(); }

  function setScaledAbsolute(clone, source, rootRect, scaleWidth) {
    const rect = box(source);
    const left = rect.left - rootRect.left;
    const top = rect.top - rootRect.top;
    const width = rect.width;
    const height = rect.height;
    clone.style.position = 'absolute';
    clone.style.left = `${left / scaleWidth * 100}%`;
    clone.style.top = `calc(${top / scaleWidth * 100}cqw)`;
    clone.style.width = `${width / scaleWidth * 100}%`;
    clone.style.height = `calc(${height / scaleWidth * 100}cqw)`;
    clone.style.margin = '0';
    clone.style.maxWidth = 'none';
    clone.style.transform = getComputedStyle(source).transform === 'none' ? 'none' : getComputedStyle(source).transform;
    clone.style.zIndex = getComputedStyle(source).zIndex;
  }

  function copyElement(source, wrapper, sourceRootRect, sourceWidth, options = {}) {
    const clone = source.cloneNode(true);
    // Hover classes are transient pointer state, not part of the source art.
    // The original interaction handler does not own these cloned nodes, so a
    // class left on a photo when the CMS stage is built would freeze the
    // faded-neighbour artwork into the reordered preview.
    if (clone.classList.contains('is-hovered')) clone.classList.remove('is-hovered');
    clone.querySelectorAll('.is-hovered').forEach(node => node.classList.remove('is-hovered'));
    // Originals are hidden while the reordered stack is active. cloneNode()
    // also copies the marker onto every matching descendant, which would hide
    // the cloned artwork and leave the placeholder band showing through.
    clone.removeAttribute(hiddenAttr);
    clone.querySelectorAll(`[${hiddenAttr}]`).forEach(node => node.removeAttribute(hiddenAttr));
    normalizeClonedImageURLs(clone);
    // The page observer only watches source DOM. Clones are already in their
    // final source position, so mark reveal-driven art as settled immediately.
    const motionTargets = [clone, ...clone.querySelectorAll('.motion-art,.reveal,[data-reveal],.source-copy-motion,.art-card,.photo-art-group')];
    motionTargets.forEach(node => {
      node.classList.add('is-visible');
      node.style.opacity = '1';
    });
    copySourceIdentity(source, clone);
    if (options.sectionRoot) {
      clone.style.position = 'relative';
      clone.style.inset = 'auto';
      clone.style.left = '0';
      clone.style.top = '0';
      clone.style.width = '100%';
      clone.style.maxWidth = 'none';
      clone.style.height = `calc(${options.logicalHeight / sourceWidth * 100}cqw)`;
      clone.style.margin = '0';
    } else setScaledAbsolute(clone, source, sourceRootRect, sourceWidth);
    clone.dataset.desktopSectionSourceNode = source.dataset.deviceNode || source.id || source.className || source.tagName.toLowerCase();
    wrapper.append(clone);
    return clone;
  }

  function canvasBandSource(host, band, sourceWidth) {
    const sourceRect = band.renderSourceRect || band.sourceRect;
    const rootRect = box(host);
    const scale = rootRect.width / sourceWidth;
    const start = sourceRect.y * scale;
    const end = start + sourceRect.height * scale;
    const nodes = [...host.children].filter(node => {
      if (node.classList.contains('sr-only') || node.matches('[data-desktop-sections-stage]')) return false;
      const rect = box(node);
      const middle = ((rect.top + rect.bottom) / 2) - rootRect.top;
      return rect.width > 1 && rect.height > 1 && rect.bottom > rootRect.top + start && rect.top < rootRect.top + end;
    });
    return { rootRect, start, end, nodes };
  }

  function addLiveOverlays(wrapper, host, entry, sourceWidth) {
    // Global live overlays are positioned for the original page, so copying
    // them into reordered or cloned bands can leave text over a neighboring
    // section. The section-local overlay is created later by applyFields(),
    // using that field instance's own visual anchor and patch asset.
    document.querySelectorAll('.cms-overlay-layer > .cms-live-group').forEach(hideSource);
  }
  function addCanvasBand(stage, host, entry, sourceWidth) {
    const band = { ...entry.band, renderSourceRect: entry.renderSourceRect || entry.band.sourceRect };
    const source = canvasBandSource(host, band, sourceWidth);
    if (!source.nodes.length) return false;
    const wrapper = document.createElement('section');
    wrapper.className = 'desktop-cms-section-band';
    wrapper.dataset.cmsSectionId = entry.sourceId;
    wrapper.dataset.cmsSectionInstance = entry.section.instanceId || entry.section.id || entry.sourceId;
    wrapper.dataset.cmsSectionOrder = String(entry.order);
    wrapper.style.position = 'absolute';
    wrapper.style.left = '0';
    wrapper.style.top = `calc(${entry.displayY / sourceWidth * 100}cqw)`;
    wrapper.style.width = '100%';
    wrapper.style.height = `calc(${entry.visualHeight / sourceWidth * 100}cqw)`;
    // Recreate each band from every source layer that intersects it, then
    // clip to the semantic band. This preserves tall backplates and artwork
    // crossing a boundary without assigning a whole-page layer to one band.
    wrapper.style.overflow = 'hidden';
    const segment = { left: source.rootRect.left, top: source.rootRect.top + source.start, right: source.rootRect.right, bottom: source.rootRect.top + source.end };
    const segmentRect = { left: segment.left, top: segment.top, right: segment.right, bottom: segment.bottom, width: segment.right-segment.left, height: segment.bottom-segment.top };
    for (const node of source.nodes) copyElement(node, wrapper, segmentRect, source.rootRect.width);
    addLiveOverlays(wrapper, state.host, entry, sourceWidth);
    stage.append(wrapper);
    entry.root = wrapper;
    return true;
  }

  function addNativeBand(stage, entry, template, sourceWidth) {
    const band = entry.band;
    const visualHeight = Number(entry.visualHeight || band.sourceRect.height || 0);
    const wrapper = document.createElement('section');
    wrapper.className = 'desktop-cms-section-band';
    wrapper.dataset.cmsSectionId = entry.sourceId;
    wrapper.dataset.cmsSectionInstance = entry.section.instanceId || entry.section.id || entry.sourceId;
    wrapper.dataset.cmsSectionOrder = String(entry.order);
    const root = template.mode === 'homeBands' ? document.querySelector(band.sectionSelector) : document.querySelector(band.selector);
    const nodes = template.mode === 'homeBands' ? uniqueNodes([...(band.selectors || []), ...(band.backgroundSelector ? [band.backgroundSelector] : [])]) : (root ? [root] : []);
    if (!nodes.length) return false;
    const hostRect = box(state.host);
    const start = band.sourceRect.y * hostRect.width / sourceWidth;
    const groupRect = { left:hostRect.left,top:hostRect.top+start,right:hostRect.right,bottom:hostRect.top+start+visualHeight*hostRect.width/sourceWidth,width:hostRect.width,height:visualHeight*hostRect.width/sourceWidth };
    wrapper.style.position = 'relative';
    wrapper.style.display = 'block';
    wrapper.style.width = '100%';
    wrapper.style.height = `calc(${visualHeight / sourceWidth * 100}cqw)`;
    wrapper.style.minHeight = '1px';
    wrapper.style.overflow = 'visible';
    const rootSet = new Set(nodes.filter(node => node.matches(band.sectionSelector || band.selector)));
    const sorted = nodes.filter(node => !nodes.some(parent => parent !== node && parent.contains(node)
      && !(template.mode === 'homeBands' && rootSet.has(parent) && (!band.backgroundSelector || !node.matches(band.backgroundSelector))))).sort((a,b) => {
      const ar=box(a),br=box(b); return (ar.top-br.top)||(ar.left-br.left);
    });
    for (const node of sorted) {
      const isBackground = !!band.backgroundSelector && node.matches(band.backgroundSelector);
      if (isBackground) hideSource(node);
      const copied = copyElement(node, wrapper, groupRect, hostRect.width, { sectionRoot:rootSet.has(node), logicalHeight:visualHeight });
      // The shared runtime samples the image under its footer patch rectangle.
      // This source sprite contains the old wordmark and menu artwork, so it
      // must not be mistaken for the footer background when the official logo
      // is placed over the reordered footer.
      if (template.mode === 'homeBands' && entry.sourceId === 'footer'
          && copied.matches('img.home-art-footer-brand')) copied.classList.add('foreground');
      // The homepage visual art and hotspot anchors provide the visible/interactive
      // desktop source. The semantic section copy is only a duplicate text layer here.
      if (template.mode === 'homeBands' && rootSet.has(node)) {
        copied.style.height = `calc(${band.sourceRect.height / sourceWidth * 100}cqw)`;
        copied.setAttribute('aria-hidden', 'true');
        copied.style.pointerEvents = 'none';
        if (band.sourceSectionId === 'hero') {
          // The hero photo and its source glyph layers are part of the visual
          // artwork. Hide only the semantic copy so a reordered page keeps the
          // original hero while accessible text remains in the source DOM.
          copied.style.visibility = 'visible';
          copied.querySelectorAll('.hero-copy').forEach(copy => { copy.style.visibility = 'hidden'; });
          // The cleaned photo is the exact resting source. These derived
          // overlays contain rectangular cleanup tiles exposed by reordering.
          copied.querySelectorAll('.hero-photo-overlay,.hero-cream-edge').forEach(layer => { layer.style.display = 'none'; });
          // The full-frame proof composite carries baked navigation; it is normally zero-sized.
          // A cloned hero gets a new containing block, so keep that duplicate out.
          copied.querySelectorAll('.hero-static-reference').forEach(image => { image.style.display = 'none'; });
        } else {
          copied.style.visibility = 'hidden';
        }
      } else if (template.mode === 'homeBands') {
        // Source art shares a global stacking context. Keep its foreground
        // above later background bands when artwork extends past its section.
        copied.style.zIndex = isBackground ? '0' : (copied.matches('.source-copy-motion') ? '40' : '20');
      }
    }
    // The source story plate includes a gray phone-shadow placeholder where
    // the overlapping phone art starts. Once sections are staged, the phone
    // belongs to the routes band, so restore a small patch of the same-source
    // sea photo behind that seam. The default, unmodified page never uses this.
    if (template.mode === 'homeBands' && entry.sourceId === 'story') {
      const patch = document.createElement('span');
      patch.className = 'desktop-cms-story-sea-patch';
      patch.setAttribute('aria-hidden', 'true');
      wrapper.append(patch);
    }
    addLiveOverlays(wrapper, state.host, entry, sourceWidth);
    stage.append(wrapper);
    entry.root = wrapper;
    return true;
  }

  function addArtSection(stage, entry, sourceWidth) {
    const source = document.querySelector(entry.band.selector);
    if (!source) return false;
    const wrapper = document.createElement('div');
    wrapper.className = 'desktop-cms-native-section';
    wrapper.dataset.cmsSectionId = entry.sourceId;
    wrapper.dataset.cmsSectionInstance = entry.section.instanceId || entry.section.id || entry.sourceId;
    wrapper.dataset.cmsSectionOrder = String(entry.order);
    wrapper.style.width = '100%';
    wrapper.style.height = `calc(${entry.band.sourceRect.height / sourceWidth * 100}cqw)`;
    wrapper.style.position = 'relative';
    const clone = source.cloneNode(true);
    clone.removeAttribute(hiddenAttr);
    copySourceIdentity(source, clone);
    clone.style.width = '100%';
    clone.style.height = '100%';
    clone.style.position = 'relative';
    clone.style.inset = 'auto';
    clone.style.left = '0';
    clone.style.top = '0';
    clone.style.margin = '0';
    clone.dataset.cmsSectionId = entry.sourceId;
    clone.dataset.cmsSectionInstance = wrapper.dataset.cmsSectionInstance;
    wrapper.append(clone);
    addLiveOverlays(wrapper, state.host, entry, sourceWidth);
    stage.append(wrapper);
    entry.root = wrapper;
    entry.fieldRoot = clone;
    return true;
  }

  function targetSelector(selector) {
    return String(selector || '').replace(/#([A-Za-z_][\w-]*)/g, '[data-desktop-source-id="$1"]');
  }

  function findMapped(root, selector) {
    if (!root || !selector) return [];
    const rewritten = targetSelector(selector);
    try { return [...root.querySelectorAll(rewritten)]; } catch { return []; }
  }

  function allFields(sections) { return (sections || []).flatMap(section => section.fields || []); }

  function sourceFieldFor(field, pageSection, baselinePage) {
    const sourceSectionId = pageSection?.sourceSectionId || pageSection?.id;
    const sourceSections = (baselinePage?.sections || []).filter(section =>
      section.id === sourceSectionId || section.id === pageSection?.id || section.sourceSectionId === sourceSectionId
    );
    const sourceId = field.sourceFieldId || field.id;
    const scoped = allFields(sourceSections);
    return scoped.find(source => source.id === sourceId)
      || scoped.find(source => source.binding && source.binding === field.binding)
      || scoped.find(source => source.id === field.id)
      || allFields(baselinePage?.sections).find(source => source.binding && source.binding === field.binding)
      || allFields(baselinePage?.sections).find(source => source.id === sourceId)
      || null;
  }

  function setText(element, value) {
    if (element.matches('input,textarea,select')) { element.value = value; return; }
    const textNodes = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE);
    if (textNodes.length) { textNodes[0].nodeValue = value; textNodes.slice(1).forEach(node => node.remove()); }
    else element.insertBefore(document.createTextNode(value), element.firstChild);
  }

  function safeUrl(value) {
    const text = String(value || '').trim();
    if (!text || /[\u0000-\u001f\u007f]/.test(text)) return '';
    try {
      if (text.startsWith('#')) return text;
      const rootMedia = text.match(/^\/?media\//i);
      const url = rootMedia
        ? new URL(text.replace(/^\/+/, ''), `${location.origin}/`)
        : /^\/site(?:\/|$)/i.test(text)
          ? new URL(text, location.origin)
          : new URL(text.replace(/^\/+/, ''), siteBaseUrl);
      return ['http:','https:','mailto:','tel:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
  }

  function valueFor(field) {
    return field?.value == null ? '' : String(field.value);
  }

  function addCloneOverlay(entry, field, mapping, root) {
    const spec = mapping?.overlay;
    if (!spec) return;
    // Visual copy anchors can be siblings of the semantic field root.
    const overlayRoot = entry.root || root;
    // Anchor the replacement to the source art inside this section. A global
    // `.cms-live-group` is laid out in the canonical full-page coordinate
    // system; copying its box into a reordered band can stretch a small copy
    // patch across neighbouring sections. The manifest's `reference` and
    // `referenceRect` describe the tight source glyph region and remain valid
    // after the band moves.
    const selectorList = spec.copyId ? [`[data-desktop-source-copy-id="${CSS.escape(spec.copyId)}"]`] : (spec.reference || mapping.selectors || []);
    const anchors = selectorList.flatMap(selector => findMapped(overlayRoot, selector)).filter(element => element.getClientRects().length);
    if (!anchors.length) return;
    const rects = anchors.map(element => {
      const rect = element.getBoundingClientRect();
      const crop = spec.referenceRect;
      return crop ? { left:rect.left+rect.width*crop.left, top:rect.top+rect.height*crop.top, right:rect.left+rect.width*(crop.left+crop.width), bottom:rect.top+rect.height*(crop.top+crop.height) } : {left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom};
    });
    const left = Math.min(...rects.map(rect=>rect.left)), top = Math.min(...rects.map(rect=>rect.top));
    const right = Math.max(...rects.map(rect=>rect.right)), bottom = Math.max(...rects.map(rect=>rect.bottom));
    const hostRect = overlayRoot.getBoundingClientRect();
    const group = document.createElement('span');
    group.className = 'desktop-section-field-overlay';
    group.setAttribute('aria-hidden','true');
    Object.assign(group.style, { left:`${left-hostRect.left}px`,top:`${top-hostRect.top}px`,width:`${right-left}px`,height:`${bottom-top}px` });
    if (spec.patchAsset) {
      const patch = document.createElement('span');
      patch.className = 'desktop-section-field-patch';
      patch.style.backgroundImage = `url("${new URL(spec.patchAsset, assetBaseUrl).href}")`;
      group.append(patch);
    }
    const text = document.createElement('span');
    text.className = 'desktop-section-field-text';
    text.textContent = valueFor(field);
    Object.assign(text.style, { fontFamily:spec.font||'inherit', lineHeight:spec.lineHeight||'1.18', color:spec.color||'inherit', whiteSpace:spec.whiteSpace||'pre-line', textAlign:spec.textAlign||'left' });
    const size = Number.parseFloat(spec.fontSize);
    if (Number.isFinite(size)) text.style.fontSize = `${size * (hostRect.width / Number(entry.sourceWidth||1024))}px`;
    group.append(text);
    overlayRoot.append(group);
    const catalog = window.ForaVisualLayerCatalog;
    const layerPath = location.pathname.endsWith('/index.html') ? location.pathname.slice(0, -10) : location.pathname;
    const layer = catalog?.layerForMapping(layerPath || '/', mapping);
    if (layer) catalog.bindOverlayAnimation(group, layer, anchors[0], catalog.fieldLayerState(field, layer));
  }

  function applyFields(entry, baselinePage, pageConfig) {
    const root = entry.fieldRoot || entry.root;
    if (!root) return;
    for (const section of entry.sections) {
      for (const field of section.fields || []) {
        const mapping = pageConfig?.fields?.find(item => item.binding === field.binding);
        if (!mapping) continue;
        const sourceField = sourceFieldFor(field, section, baselinePage);
        const value = valueFor(field);
        const isChanged = sourceField && value !== valueFor(sourceField);
        for (const selector of mapping.selectors || []) {
          const targets = findMapped(root, selector);
          for (const target of targets) {
            if (['image','media','video'].includes(String(field.type).toLowerCase())) {
              if (!isChanged) continue;
              const url = safeUrl(value);
              if (url && target.matches('img,source')) target.setAttribute('src', url);
            } else if (['url','link'].includes(String(field.type).toLowerCase())) {
              if (!isChanged) continue;
              const url = safeUrl(value);
              if (url && target.matches('a,area')) target.setAttribute('href', url);
            } else if (!mapping.overlay && isChanged) setText(target, value);
          }
        }
        if (isChanged) {
          for (const selector of mapping.hideSelectors || []) findMapped(root, selector).forEach(element => { element.style.visibility = 'hidden'; });
          const overlaySelector = `[data-cms-group="${CSS.escape(field.binding || '')}"]`;
          const liveOverlay = entry.root?.querySelector(overlaySelector);
          if (liveOverlay && mapping.overlay) {
            // The runtime live group is sized for the original page's global
            // overlay and can extend across neighboring bands. Replace it in a
            // clone with an overlay anchored to this section's own art copy.
            liveOverlay.remove();
            addCloneOverlay(entry, field, mapping, root);
          } else if (!liveOverlay) addCloneOverlay(entry, field, mapping, root);
        }
      }
    }
  }

  function markOriginalsHidden(template) {
    const selectors = [];
    if (template.mode === 'canvasBands') selectors.push(`${template.hostSelector} > *`);
    if (template.mode === 'homeBands') {
      selectors.push('.home-foreground-art', '.home-art-hotspots');
      for (const band of template.bands || []) selectors.push(...(band.selectors || []), ...(band.backgroundSelector ? [band.backgroundSelector] : []));
    }
    if (template.mode === 'artSections') for (const band of template.bands || []) selectors.push(band.selector);
    uniqueNodes(['.cms-overlay-layer > .cms-live-group']).forEach(hideSource);
    uniqueNodes(selectors).forEach(hideSource);
    // CMS brand/footer overlays are positioned outside the page host. Keep them
    // visible: the shared runtime owns their placement and they are not source art.
  }

  function stageCanvas(host, stage, entries, template) {
    const sourceWidth = Number(template.sourceWidth || 1024);
    const pinnedHeader = entries[0]?.sourceId !== 'hero';
    const clearance = pinnedHeader ? Number(template.pinnedHeaderHeight || 80) : 0;
    entries.forEach(entry => {
      const trimTop = pinnedHeader && entry.sourceId === 'hero' ? Number(template.pinnedHeaderHeight || 80) : 0;
      entry.renderSourceRect = {
        ...entry.band.sourceRect,
        y: Number(entry.band.sourceRect.y || 0) + trimTop,
        height: Math.max(0, Number(entry.band.sourceRect.height || 0) - trimTop)
      };
      entry.visualHeight = entry.renderSourceRect.height;
    });
    const contentHeight = entries.reduce((sum,entry)=>sum+Number(entry.visualHeight||0),0);
    const total = clearance + contentHeight;
    const setSize = () => {
      const width = host.getBoundingClientRect().width;
      const height = total / sourceWidth * width;
      stage.style.height = `${height}px`;
      stage.style.top = `calc(${clearance / sourceWidth * 100}cqw)`;
      host.style.height = `${height}px`;
      host.style.aspectRatio = 'auto';
    };
    setSize();
    if ('ResizeObserver' in window) { state.observer = new ResizeObserver(setSize); state.observer.observe(host); }
    let cursor = 0;
    entries.forEach(entry => {
      entry.order = cursor;
      entry.displayY = cursor;
      cursor += Number(entry.visualHeight || 0);
      addCanvasBand(stage,host,entry,sourceWidth);
    });
    normalizeClonedImageURLs(stage);
  }

  function stageNative(host, stage, entries, template) {
    const sourceWidth = Number(template.sourceWidth || 1024);
    const total = entries.reduce((sum, entry) => sum + Number(entry.band.sourceRect.height || 0), 0);
    const setSize = () => { host.style.height = `${total / sourceWidth * host.getBoundingClientRect().width}px`; };
    setSize();
    if ('ResizeObserver' in window) { state.observer = new ResizeObserver(setSize); state.observer.observe(host); }
    entries.forEach((entry,index) => { entry.order=index; entry.sourceWidth=sourceWidth; addArtSection(stage,entry,sourceWidth); });
  }

  function stageHome(host, stage, entries, template) {
    const sourceWidth = 809;
    const clearance = entries[0]?.sourceId === 'hero' ? 0 : 55;
    entries.forEach(entry => { entry.visualHeight = entry.sourceId === 'story' ? Math.max(0, Number(entry.band.sourceRect.height || 0) - 15) : Number(entry.band.sourceRect.height || 0); });
    const contentHeight = entries.reduce((sum, entry) => sum + entry.visualHeight, 0);
    const total = contentHeight + clearance;
    const setSize = () => {
      const width = host.getBoundingClientRect().width;
      host.style.height = `${total / sourceWidth * width}px`;
      stage.style.top = `calc(${clearance / sourceWidth * 100}cqw)`;
      stage.style.height = `${contentHeight / sourceWidth * width}px`;
    };
    setSize();
    if ('ResizeObserver' in window) { state.observer = new ResizeObserver(setSize); state.observer.observe(host); }
    entries.forEach((entry,index) => { entry.order=index; entry.sourceWidth=sourceWidth; addNativeBand(stage,entry,template,sourceWidth); });
  }

  function apply({ content, page, path, pageConfig, baselineContent } = {}) {
    if (!state.manifest) return false;
    const normalizedPath = cleanPath(path || page?.path || location.pathname);
    const template = pageTemplate(normalizedPath) || pageTemplate(cleanPath(page?.templatePath));
    const livePage = page || pageAt(content, normalizedPath);
    const basePath = cleanPath(pageConfig?.templatePath || livePage?.templatePath || normalizedPath);
    const baselinePage = pageAt(baselineContent || window.ForaCMS?.baselineContent, basePath) || pageAt(baselineContent || window.ForaCMS?.baselineContent, normalizedPath);
    if (!template || !livePage || !baselinePage || !needsCustomSections(livePage,baselinePage,template)) {
      if (state.stage) removePriorStage();
      return false;
    }
    const signature = fingerprint(content,livePage,normalizedPath,template);
    if (signature === state.signature && state.stage) return true;
    if (state.stage) removePriorStage();
    state.livePage = livePage;
    state.baselinePage = baselinePage;

    const host = document.querySelector(template.hostSelector);
    if (!host) return false;
    state.hostStyle = host.getAttribute('style') || '';
    const entries = compactVisualSections(livePage,template);
    if (entries.some(entry => !entry.band || !(entry.band.selector || entry.band.sectionSelector || entry.band.sourceRect))) return false;
    const stage = createStage(host,template.mode);
    markOriginalsHidden(template);
    if (template.mode === 'canvasBands') stageCanvas(host,stage,entries,template);
    else if (template.mode === 'homeBands') stageHome(host,stage,entries,template);
    else if (template.mode === 'artSections') stageNative(host,stage,entries,template);
    else { removePriorStage(); return false; }
    if (entries.some(entry => !entry.root)) { removePriorStage(); return false; }
    for (const entry of entries) { entry.sections=entry.sections||[entry.section]; }
    entries.forEach(entry => applyFields(entry,baselinePage,pageConfig));
    state.signature = signature;
    const stageDetail = {
      active: true,
      path: normalizedPath,
      stage,
      footerAnchor: stage.querySelector('[data-cms-section-id="footer"]') || null,
      footerSourceRect: (() => {
        const footer = entries.find(entry => entry.sourceId === 'footer');
        return footer ? { ...footer.band.sourceRect, sourceWidth: footer.sourceWidth } : null;
      })()
    };
    const announceStage = () => {
      if (stage.isConnected && document.querySelector('.desktop-cms-section-stage') === stage) {
        window.dispatchEvent(new CustomEvent('fora:desktop-sections-stage', { detail: stageDetail }));
      }
    };
    announceStage();
    // The CMS runtime installs its brand-layer bridge while initializing. A
    // staged preview can be applied during the same boot turn, before that
    // listener exists; repeat after layout is committed so the official logo
    // follows the actual reordered footer anchor instead of the old page box.
    requestAnimationFrame(() => requestAnimationFrame(announceStage));
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    return true;
  }

  window.ForaDesktopSections = { ready, apply, reset: removePriorStage };
})();
