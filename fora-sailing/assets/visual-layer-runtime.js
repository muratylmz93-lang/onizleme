(() => {
  'use strict';

  const runtimeScript = document.currentScript;
  const assetsUrl = new URL('.', runtimeScript?.src || location.href);
  const manifestUrl = new URL('visual-layers.json', assetsUrl);
  const cssUrl = new URL('visual-layer-runtime.css', assetsUrl);
  const validTypes = new Set(['text', 'image', 'decor']);
  const validStatuses = new Set(['ready', 'source-layer-needed', 'composite-source', 'review-required']);
  let applySeparatedInkMask = null;

  function validateManifest(manifest) {
    if (!manifest || manifest.schemaVersion !== 1 || !Array.isArray(manifest.pages)) throw new Error('Unsupported visual layer manifest');
    const ids = new Set();
    for (const page of manifest.pages) {
      if (!page.path || !Array.isArray(page.layers)) throw new Error('Invalid visual layer page');
      const device = page.device || 'web';
      for (const layer of page.layers) {
        const key = `${page.path}:${device}:${layer.id}`;
        if (!layer.id || ids.has(key)) throw new Error(`Duplicate visual layer id: ${key}`);
        ids.add(key);
        if (!validTypes.has(layer.type) || !validStatuses.has(layer.status)) throw new Error(`Invalid visual layer type/status: ${key}`);
        if (!Number.isFinite(Number(layer.order)) || typeof layer.visible !== 'boolean') throw new Error(`Invalid visual layer order/visibility: ${key}`);
        const rect = layer.source?.rect;
        if (rect && !['x', 'y', 'width', 'height'].every(k => Number.isFinite(Number(rect[k])))) throw new Error(`Invalid visual source rect: ${key}`);
        if (layer.status === 'ready' && layer.editable !== true) throw new Error(`Ready layer must be editable: ${key}`);
        if (layer.type === 'text' && layer.status === 'ready' && !layer.binding) throw new Error(`Ready text layer needs a binding: ${key}`);
        if (layer.type === 'image' && layer.status === 'ready' && !layer.binding) throw new Error(`Ready image layer needs a binding: ${key}`);
      }
    }
    return manifest;
  }

  function activeDevice() {
    const root = document.documentElement;
    if (root.classList?.contains('fora-device-active') && root.dataset.foraDevice) return root.dataset.foraDevice;
    const query = new URL(location.href).searchParams.get('designViewport');
    if (query === 'mobile' || query === 'tablet' || query === 'tv') return query;
    return 'web';
  }

  function createCatalog(manifest, baseUrl = assetsUrl) {
    validateManifest(manifest);
    const pageVariants = new Map();
    const bindings = new Map();
    for (const page of manifest.pages) {
      const device = page.device || 'web';
      const key = `${page.path}|${device}`;
      if (pageVariants.has(key)) throw new Error(`Duplicate visual layer page variant: ${key}`);
      pageVariants.set(key, page);
      for (const layer of page.layers) {
        if (!layer.binding || layer.status !== 'ready' || layer.editable !== true) continue;
        const bkey = `${page.path}|${device}|${layer.binding}`;
        const rows = bindings.get(bkey) || [];
        rows.push(layer);
        bindings.set(bkey, rows);
      }
    }
    function selectedDevice(device) { return device || activeDevice(); }
    function pageVariant(path, device) {
      const active = selectedDevice(device);
      return pageVariants.get(`${path}|${active}`)
        || pageVariants.get(`${path}|${active === 'desktop' ? 'web' : 'web'}`)
        || pageVariants.get(`${path}|web`)
        || null;
    }
    function layersForPage(path, device) { return pageVariant(path, device)?.layers || []; }
    function layersForBinding(path, binding, device) { return bindings.get(`${path}|${selectedDevice(device)}|${binding}`) || []; }
    function findLayer(id, path, device) {
      const pages = path ? [pageVariant(path, device)].filter(Boolean) : [...pageVariants.values()];
      for (const page of pages) {
        const found = page.layers.find(layer => layer.id === id || layer.layerId === id);
        if (found) return found;
      }
      return null;
    }
    function attachMappings(config) {
      const device = activeDevice();
      for (const page of config?.pages || []) {
        for (const layer of layersForPage(page.path, device)) {
          if (!layer.binding || layer.status !== 'ready' || layer.editable !== true) continue;
          let mapping = page.fields?.find(item => item.binding === layer.binding);
          const created = !mapping;
          if (!mapping) {
            mapping = { binding: layer.binding, selectors: [], visualLayerOnly: true };
            page.fields ||= [];
            page.fields.push(mapping);
          }
          mapping.visualLayerIds ||= [];
          if (!mapping.visualLayerIds.includes(layer.id)) mapping.visualLayerIds.push(layer.id);
          mapping.visualLayerDevice = device;
          mapping.visualLayerStatus = layer.status;
          const source = layer.source || {};
          // Page-reference art is a source asset, not a default hero crop.
          // Keep the pre-existing semantic image value passive until the user changes it.
          if (device === 'web' && layer.sectionId === 'hero' && layer.type === 'image' && source.pageReference && !source.asset && !source.rect) {
            mapping.visualLayerOnly = true;
            mapping.visualLayerDefaultGuard = true;
          }
          if (source.separatedInk) {
            // These bindings must run even at their default value so a later
            // CMS revert can remove its ink mask and restore the source glyph.
            mapping.visualLayerOnly = false;
            mapping.selectors = [];
            delete mapping.all;
          }
          if (source.passiveUntilEdited && layer.type === 'image') {
            mapping.visualLayerOnly = true;
            mapping.visualLayerDefaultGuard = true;
          }
          const responsiveTargets = Array.isArray(source.responsiveTargets) ? source.responsiveTargets : null;
          const scopedTargets = responsiveTargets
            ? responsiveTargets.filter(target => target.device === device || target.device === 'shared')
            : null;
          const selectors = [...new Set((scopedTargets?.length
            ? scopedTargets.map(target => target.selector)
            : (source.selectors || (source.selector ? [source.selector] : []))).filter(Boolean))];
          if (device !== 'web' && selectors.length) mapping.selectors = selectors;
          if (layer.type === 'image' && selectors.length) {
            mapping.selectors = selectors;
            if (mapping.selectors.length > 1) mapping.all = true;
            else delete mapping.all;
          }
          if (layer.type === 'text' && source.independentSource && selectors.length) {
            mapping.selectors = selectors;
            if (mapping.selectors.length > 1) mapping.all = true;
            else delete mapping.all;
          }
          if (layer.type === 'text' && layer.original?.glyph && layer.replacement?.cleanPatch) {
            mapping.overlay ||= {};
            mapping.overlay.copyId ||= layer.id;
            if (!mapping.overlay.reference?.length && source.selector) mapping.overlay.reference = [source.selector];
            if (!mapping.overlay.patchAsset) mapping.overlay.patchAsset = new URL(layer.replacement.cleanPatch, baseUrl).href;
            mapping.hideSelectors ||= [];
            const hide = layer.original.hideSelector || source.selector;
            if (hide && !mapping.hideSelectors.includes(hide)) mapping.hideSelectors.push(hide);
          }
        }
      }
      return config;
    }
    function layerForMapping(path, mapping) {
      const device = mapping?.visualLayerDevice || activeDevice();
      const rows = layersForPage(path, device);
      return (mapping?.visualLayerIds || []).map(id => rows.find(layer => layer.id === id || layer.layerId === id)).find(Boolean) || null;
    }
    function layerForField(path, field, mapping) {
      const device = mapping?.visualLayerDevice || activeDevice();
      const rows = layersForPage(path, device);
      const stateLayerId = (mapping?.visualLayerIds || []).find(id => {
        const candidate = rows.find(layer => layer.id === id || layer.layerId === id);
        return candidate && fieldLayerState(field, candidate);
      });
      const requested = field?.layerId || stateLayerId || mapping?.visualLayerIds?.[0];
      return rows.find(layer => layer.id === requested || layer.layerId === requested) || layerForMapping(path, mapping) || null;
    }
    function fieldLayerState(field, layer) {
      const rows = Array.isArray(field?.visualLayers) ? field.visualLayers : [];
      const state = rows.find(item => (item.layerId || item.id) === layer?.layerId || (item.layerId || item.id) === layer?.id);
      if (state) return state;
      if (field?.layerOnly && (field.layerId === layer?.layerId || field.layerId === layer?.id)) return field;
      return null;
    }
    function fieldHasExplicitLayerEdit(path, field, mapping) {
      if (field?.layerOnly) return false;
      if (field?.layerId) return true;
      const layer = layerForField(path, field, mapping);
      if (layer && fieldLayerState(field, layer)) return true;
      if (mapping?.visualLayerDefaultGuard && field?.type === 'image') {
        return field.value != null && String(field.value) !== String(field.defaultValue ?? '');
      }
      return false;
    }
    function separatedInkReplacement(path, field, layer, state, root = document) {
      const source = layer.source;
      const spec = source.separatedInk;
      const rect = source.rect;
      const viewport = source.viewport || pageVariant(path)?.sourceViewport;
      if (!spec?.selector || !rect || !viewport?.width || !viewport?.height) return;
      const visible = typeof state?.visible === 'boolean' ? state.visible : layer.visible !== false;
      const initial = sourceTextForLayer(layer, field);
      const value = field?.value;
      const edited = !field?.layerOnly && value != null && String(value) !== String(initial);
      const sourceImage = root.querySelector(spec.selector);
      if (applySeparatedInkMask) applySeparatedInkMask(sourceImage || root, spec, layer.id, spec.parentRect || source.rect, !visible || edited);
      const parent = root.querySelector(source.parentSelector || 'body') || root.body;
      if (!parent) return;
      const existing = [...parent.querySelectorAll('[data-visual-layer-replacement]')].find(node => node.dataset.visualLayerReplacement === layer.id);
      if (!edited && visible) { existing?.remove(); return; }
      if (existing) existing.remove();
      const wrapper = document.createElement('div');
      wrapper.className = 'fora-visual-raster-replacement';
      wrapper.dataset.visualLayerReplacement = layer.id;
      wrapper.setAttribute('aria-hidden', 'true');
      const scale = 100 / viewport.width;
      Object.assign(wrapper.style, {position:'absolute',overflow:'hidden',pointerEvents:'none',left:'calc('+rect.x*scale+'vw)',top:'calc('+rect.y*scale+'vw)',width:'calc('+rect.width*scale+'vw)',height:'calc('+rect.height*scale+'vw)',zIndex:String(500 + Number(state?.order ?? layer.order ?? 0))});
      if (edited && visible) {
        const foreground = document.createElement('div');
        foreground.className = 'fora-visual-raster-foreground';
        Object.assign(foreground.style,{position:'absolute',inset:'0',pointerEvents:'none'});
        if (layer.type === 'text') {
          const text=document.createElement('span'); text.className='fora-visual-raster-text'; text.textContent=String(value);
          const font=source.font||{}; const fontSize=Number(font.size);
          Object.assign(text.style,{position:'absolute',inset:'0',fontFamily:font.family||'inherit',fontWeight:String(font.weight||400),fontStyle:font.style||'normal',fontSize:Number.isFinite(fontSize)?'calc('+fontSize*scale+'vw)':'inherit',lineHeight:font.lineHeight||'1.1',letterSpacing:font.letterSpacing||'normal',color:source.fill||'inherit',textAlign:font.textAnchor==='middle'?'center':(font.textAnchor==='end'?'right':'left'),whiteSpace:'pre-line',pointerEvents:'none'});
          const rotation=Number(source.rotationDeg); if(Number.isFinite(rotation)){text.style.transform='rotate('+rotation+'deg)';text.style.transformOrigin='center'} foreground.append(text);
        } else if (layer.type === 'image' || layer.type === 'decor') {
          const image=document.createElement('img'); image.alt=field?.accessibleName||layer.accessibleName||'';
          const imageUrl=resolveReplacementImage(value); if(imageUrl) image.src=imageUrl;
          Object.assign(image.style,{position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:source.objectFit||'cover',pointerEvents:'none'}); foreground.append(image);
        }
        wrapper.append(foreground);
        const anchorSelector = source.animationAnchorSelector || source.selector;
        const anchor = anchorSelector ? root.querySelector(anchorSelector) : null;
        bindOverlayAnimation(foreground, layer, anchor, state);
      }
      parent.append(wrapper);
    }
    function sourceTextForLayer(layer, field) {
      return layer.source?.sourceText ?? layer.source?.defaultValue ?? layer.defaultValue ?? field?.defaultValue ?? '';
    }
    function resolveReplacementImage(value) {
      if (typeof value !== 'string' || !value.trim()) return null;
      try {
        const base = value.startsWith('/media/') ? location.origin : new URL('../', assetsUrl);
        const url = new URL(value, base);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
      } catch { return null; }
    }
    function rasterReplacement(path, field, layer, state, root = document) {
      if (layer?.source?.separatedInk) { separatedInkReplacement(path, field, layer, state, root); return; }
      if (!layer?.source?.rasterFallback || !layer.source.rect || !layer.replacement?.cleanAsset || layer.device !== 'web') return;
      const rect = layer.source.rect;
      const viewport = layer.source.viewport || pageVariant(path)?.sourceViewport;
      if (!viewport?.width || !viewport?.height) return;
      const visible = typeof state?.visible === 'boolean' ? state.visible : layer.visible !== false;
      const initial = sourceTextForLayer(layer, field);
      const value = field?.value;
      const passiveSemanticDefault = value != null && field?.defaultValue != null
        && String(value) === String(field.defaultValue)
        && !fieldHasExplicitLayerEdit(path, field, null);
      const edited = !field?.layerOnly && !passiveSemanticDefault && value != null && String(value) !== String(initial);
      const parent = root.querySelector(layer.source.parentSelector || 'body') || root.body;
      if (!parent) return;
      const existing = [...parent.querySelectorAll('[data-visual-layer-replacement]')].find(node => node.dataset.visualLayerReplacement === layer.id);
      if (!edited && visible) { existing?.remove(); return; }
      if (existing) existing.remove();
      const wrapper = document.createElement('div');
      wrapper.className = 'fora-visual-raster-replacement';
      wrapper.dataset.visualLayerReplacement = layer.id;
      wrapper.setAttribute('aria-hidden', 'true');
      const scale = 100 / viewport.width;
      Object.assign(wrapper.style, {position:'absolute',overflow:'hidden',pointerEvents:'none',left:'calc('+rect.x*scale+'vw)',top:'calc('+rect.y*scale+'vw)',width:'calc('+rect.width*scale+'vw)',height:'calc('+rect.height*scale+'vw)',zIndex:String(500 + Number(state?.order ?? layer.order ?? 0))});
      const crop = document.createElement('img');
      crop.alt=''; crop.draggable=false; crop.src=new URL(layer.replacement.cleanAsset, assetsUrl).href;
      Object.assign(crop.style,{position:'absolute',maxWidth:'none',width:'100vw',height:'calc('+viewport.height*scale+'vw)',left:'calc(-'+rect.x*scale+'vw)',top:'calc(-'+rect.y*scale+'vw)',objectFit:'fill',pointerEvents:'none'});
      wrapper.append(crop);
      let foreground = null;
      if (edited && visible) {
        foreground = document.createElement('div');
        foreground.className = 'fora-visual-raster-foreground';
        Object.assign(foreground.style,{position:'absolute',inset:'0',pointerEvents:'none'});
        wrapper.append(foreground);
        if (layer.type === 'text') {
          const text=document.createElement('span'); text.className='fora-visual-raster-text'; text.textContent=String(value);
          const font=layer.source.font||{}; const fontSize=Number(font.size);
          Object.assign(text.style,{position:'absolute',inset:'0',fontFamily:font.family||'inherit',fontWeight:String(font.weight||400),fontStyle:font.style||'normal',fontSize:Number.isFinite(fontSize)?'calc('+fontSize*scale+'vw)':'inherit',lineHeight:font.lineHeight||'1.1',letterSpacing:font.letterSpacing||'normal',color:layer.source.fill||'inherit',textAlign:font.textAnchor==='middle'?'center':(font.textAnchor==='end'?'right':'left'),whiteSpace:'pre-line',pointerEvents:'none'}); const rotation=Number(layer.source.rotationDeg); if(Number.isFinite(rotation)){text.style.transform='rotate('+rotation+'deg)';text.style.transformOrigin='center'} foreground.append(text);
          if (layer.source.textSegments) {
            const labels = String(value).split('|').map(part => part.trim());
            text.textContent = '';
            Object.assign(text.style,{display:'flex',alignItems:'center',justifyContent:'space-between',whiteSpace:'nowrap'});
            labels.forEach(label => { const item=document.createElement('span'); item.textContent=label; item.style.whiteSpace='nowrap'; text.append(item); });
          }
        } else if (layer.type === 'image' || layer.type === 'decor') {
          const image=document.createElement('img'); image.alt=field?.accessibleName||layer.accessibleName||'';
          const imageUrl=resolveReplacementImage(value); if(imageUrl) image.src=imageUrl;
          Object.assign(image.style,{position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:layer.source.objectFit||'cover',pointerEvents:'none'}); foreground.append(image);
        }
      }
      parent.append(wrapper);
      if (foreground) {
        const anchorSelector = layer.source.animationAnchorSelector || layer.source.selector;
        const anchor = anchorSelector ? root.querySelector(anchorSelector) : null;
        bindOverlayAnimation(foreground, layer, anchor, state);
      }
    }

    function presentation(path, field, mapping, root = document) {
      const layer = layerForField(path, field, mapping);
      const state = fieldLayerState(field, layer);
      if (!layer) return;
      rasterReplacement(path, field, layer, state, root);
      if (!state) return;
      const variant = pageVariant(path, mapping?.visualLayerDevice || layer.device);
      const canonicalId = layer.layerId || layer.id;
      const groupLayers = (variant?.layers || [layer]).filter(candidate => (candidate.layerId || candidate.id) === canonicalId);
      const layerSelectors = [...new Set(groupLayers.flatMap(candidate => candidate.source?.selectors || (candidate.source?.selector ? [candidate.source.selector] : [])))];
      const selectors = layerSelectors.length ? layerSelectors : (mapping?.selectors?.length ? mapping.selectors : []);
      const targets = [...new Set(selectors.flatMap(selector => {
        try { return [...root.querySelectorAll(selector)]; } catch { return []; }
      }))];
      for (const target of targets) {
        // Separated alpha ink is hidden by the mask helper. Clearing visibility
        // here would reveal a full-glyph source again after an edited value.
        const separatedInkTarget = Boolean(layer?.source?.separatedInk?.selector && target.matches(layer.source.separatedInk.selector));
        if (!separatedInkTarget && typeof state.visible === 'boolean') target.style.visibility = state.visible ? '' : 'hidden';
        const order = Number(state.order);
        if (Number.isFinite(order)) target.style.zIndex = String(order);
        const accessibility = typeof state.accessibility === 'string' ? { ariaLabel: state.accessibility } : (state.accessibility || {});
        const label = accessibility.alt ?? field.accessibleName ?? layer.accessibleName;
        if (typeof label === 'string' && target instanceof HTMLImageElement) target.alt = label;
        const ariaLabel = accessibility.ariaLabel ?? (typeof state.accessibility === 'string' ? state.accessibility : null);
        if (typeof ariaLabel === 'string') target.setAttribute('aria-label', ariaLabel);
        const animation = typeof state.animation === 'string' ? { mode: state.animation, class: state.animation } : (state.animation || {});
        const animationClass = animation.class || animation.className;
        if (typeof animationClass === 'string' && animationClass.trim()) target.classList.add(...animationClass.trim().split(/\s+/));
        if (animation.mode || animation.trigger || animation.class) target.dataset.visualLayerAnimation = animation.mode || animation.trigger || animation.class;
        const duration = Number(animation.durationMs);
        const distance = Number(animation.distancePx);
        if (Number.isFinite(duration) && duration >= 0) target.style.setProperty('--visual-layer-duration', duration + 'ms');
        if (Number.isFinite(distance) && distance >= 0) target.style.setProperty('--visual-layer-distance', distance + 'px');
      }
      // Keep the animated wrapper available, but never reveal stale raster
      // glyphs above an edited or hidden replacement layer.
      const sourceGlyphSelector = layer.original?.hideSelector;
      if (sourceGlyphSelector) {
        const hideSourceGlyph = state.visible === false || fieldHasExplicitLayerEdit(path, field, mapping);
        root.querySelectorAll(sourceGlyphSelector).forEach(node => { node.style.visibility = hideSourceGlyph ? 'hidden' : ''; });
      }
    }
    function applyLayerOnly(path, field, root = document) {
      const page = pageVariant(path);
      const layerId = field?.layerId;
      const matching = page?.layers.filter(layer => layer.id === layerId || layer.layerId === layerId) || [];
      if (!matching.length) return;
      const first = matching[0];
      const selectors = [...new Set(matching.flatMap(layer => layer.source?.selectors || (layer.source?.selector ? [layer.source.selector] : [])))];
      presentation(path, field, { visualLayerIds: matching.map(layer => layer.id), visualLayerDevice: first.device, selectors }, root);
    }
    function bindOverlayAnimation(group, layer, anchor, state = null) {
      const raw = state?.animation ?? layer?.animation;
      const animation = typeof raw === 'string' ? { mode: raw } : (raw || {});
      const mode = animation.mode || animation.trigger || layer?.animation?.trigger;
      if (!group || !mode || mode === 'none' || mode === 'static-visible') return;
      group.dataset.visualLayerId = layer.id;
      group.dataset.visualLayerAnimation = mode === 'intersection-once' ? 'once' : mode;
      const duration = Number(animation.durationMs ?? layer.animation?.durationMs);
      const distance = Number(animation.distancePx ?? layer.animation?.distancePx);
      group.style.setProperty('--visual-layer-duration', `${Math.max(0, Number.isFinite(duration) ? duration : 650)}ms`);
      group.style.setProperty('--visual-layer-distance', `${Math.max(0, Number.isFinite(distance) ? distance : 12)}px`);
      if (state?.visible === false) group.style.visibility = 'hidden'; else group.style.visibility = '';
      const markVisible = () => { if (anchor?.classList.contains('is-visible')) group.classList.add('is-visible'); };
      markVisible();
      if (anchor && typeof MutationObserver === 'function' && !group.__foraVisualObserver) {
        const observer = new MutationObserver(() => { markVisible(); if (!group.isConnected) observer.disconnect(); });
        observer.observe(anchor, { attributes: true, attributeFilter: ['class'] });
        group.__foraVisualObserver = observer;
      }
    }
    return Object.freeze({manifest, activeDevice, layersForPage, layersForBinding, findLayer, attachMappings, layerForMapping, layerForField, fieldLayerState, fieldHasExplicitLayerEdit, applyFieldPresentation: presentation, applyLayerOnly, bindOverlayAnimation});
  }

  function mergeManifests(primary, embedded) {
    if (!embedded) return primary;
    if (!embedded || embedded.schemaVersion !== primary.schemaVersion || !Array.isArray(embedded.pages)) throw new Error('Unsupported embedded visual layer manifest');
    const pages = new Map(primary.pages.map(page => [`${page.path}|${page.device || 'web'}`, page]));
    for (const incoming of embedded.pages) {
      const key = `${incoming.path}|${incoming.device || 'web'}`;
      let target = pages.get(key);
      if (!target) { target = {...incoming, layers: []}; pages.set(key, target); }
      const known = new Set(target.layers.map(layer => layer.id));
      for (const layer of incoming.layers || []) if (!known.has(layer.id)) { target.layers.push(layer); known.add(layer.id); }
    }
    return {...primary, source:{...primary.source, embeddedVisualLayers:'embedded-visual-layers.json'}, pages:[...pages.values()]};
  }

  const fetchManifest = url => fetch(url, {cache:'no-store'}).then(response => {
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Visual layer manifest HTTP ${response.status}`);
    return response.json();
  });
  const ready = Promise.all([
    fetchManifest(manifestUrl),
    fetchManifest(new URL('embedded-visual-layers.json', assetsUrl)),
    import(new URL('separated-ink.js', assetsUrl).href)
  ])
    .then(([primary, embedded, separatedInk]) => {
      if (!primary) throw new Error('Visual layer manifest is missing');
      applySeparatedInkMask = separatedInk.applySeparatedInkMask;
      const catalog = createCatalog(mergeManifests(primary, embedded), assetsUrl);
      if (!document.querySelector(`link[data-fora-visual-layer-css="${cssUrl.href}"]`)) {
        const link = document.createElement('link'); link.rel='stylesheet'; link.href=cssUrl.href; link.dataset.foraVisualLayerCss=cssUrl.href; document.head.append(link);
      }
      return catalog;
    });
  window.ForaVisualLayers = Object.freeze({ready, validateManifest, createCatalog, mergeManifests});
})();
