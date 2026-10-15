(() => {
  'use strict';

  const PAGE_PATH = '/rotalar/gocek-fethiye-gocek/';
  const ROUTE_ID = 'gocek-fethiye';
  const SOURCE_NAMES = ['Göcek', 'Fethiye', 'Göcek'];
  const SOURCE_LABELS = [
    { rect: [351, 119, 431, 145], pin: [387, 103], sample: [430, 120] },
    { rect: [574, 59, 651, 90], pin: [610, 96], sample: [430, 118] },
    { rect: [797, 118, 884, 146], pin: [837, 103], sample: [430, 119] }
  ];
  const DEVICE_STOP_SUMMARY_IDS = {
    mobile: ['rota-gocek-fethiye-mobile-text-15', 'rota-gocek-fethiye-mobile-text-16', 'rota-gocek-fethiye-mobile-text-17'],
    tablet: ['rota-gocek-fethiye-tablet-text-15', 'rota-gocek-fethiye-tablet-text-16', 'rota-gocek-fethiye-tablet-text-17'],
    tv: ['rota-gocek-fethiye-tv-text-14', 'rota-gocek-fethiye-tv-text-15']
  };
  let latestContent = null;
  let currentRoute = null;
  let stops = [];
  let canvas = null;
  let layer = null;
  let dialog = null;
  let focusedBeforeDialog = null;
  let stopImages = [];
  let renderQueued = false;
  let scriptAssetRoot = null;
  const mobileLineOriginals = new WeakMap();
  const deviceBoards = new Map();

  const norm = (value) => String(value ?? '').trim().toLocaleLowerCase('tr-TR');
  const routeList = (content) => Array.isArray(content?.routes) ? content.routes : [];

  function pathOf(value) {
    return String(value || '').replace(/\/+$/, '').toLocaleLowerCase('tr-TR');
  }

  function resolveRoute(content) {
    const pathname = pathOf(location.pathname);
    const configuredPath = document.querySelector('meta[name="fora-cms-page-path"]')?.content
      || document.querySelector('meta[name="fora-cms-template-path"]')?.content || PAGE_PATH;
    const page = content?.pages?.find((item) => pathOf(item.path) === pathname)
      || content?.pages?.find((item) => pathOf(item.path) === pathOf(configuredPath))
      || content?.pages?.find((item) => item.cmsEntityContext?.family === 'routes');
    const routeContext = page?.cmsEntityContext;
    const routeFamily = routeContext?.family === 'routes';
    if (pathname !== pathOf(PAGE_PATH) && !routeFamily && !document.querySelector('meta[name="fora-cms-template-path"]')) return null;
    const contextId = String(routeContext?.id || '').toLowerCase();
    const queryId = new URLSearchParams(location.search).get('rota') || '';
    const records = routeList(content);
    return records.find((item) => String(item.id || item.slug || '').toLowerCase() === queryId.toLowerCase())
      || records.find((item) => String(item.id || item.slug || '').toLowerCase() === contextId)
      || records.find((item) => pathOf(item.path) === pathname || String(item.id || item.slug || '').toLowerCase() === ROUTE_ID)
      || null;
  }

  function resolveImage(value) {
    if (!value || typeof value !== 'string') return '';
    if (/^(https?:|blob:)/i.test(value)) return value;
    if (value.startsWith('/media/')) return new URL(value, location.origin).href;
    const siteRoot = scriptAssetRoot || new URL('../', document.currentScript?.src || location.href);
    if (value.startsWith('/site/')) return new URL(value.slice('/site/'.length), siteRoot).href;
    if (value.startsWith('/')) return new URL(value.slice(1), siteRoot).href;
    if (/^assets\/(?:device-design-assets|brand)\//.test(value)) return new URL(value, siteRoot).href;
    if (/^(?:\.\.\/)*assets\//.test(value)) {
      const pageBase = new URL(configuredDetailPath().replace(/^\/+/, ''), siteRoot);
      return new URL(value, pageBase).href;
    }
    return new URL(value.replace(/^(?:\.\.\/)+/, ''), siteRoot).href;
  }

  function configuredDetailPath() {
    const configured = document.querySelector('meta[name="fora-cms-template-path"]')?.content
      || document.querySelector('meta[name="fora-cms-page-path"]')?.content || PAGE_PATH;
    return configured.endsWith('/') ? configured : `${configured}/`;
  }

  function routeStopImage(stop) {
    const own = typeof stop?.image === 'string' ? stop.image.trim() : '';
    if (own) return resolveImage(own);
    return '';
  }

  function normalizedStops(route) {
    const source = Array.isArray(route?.stops) ? route.stops : [];
    return source.map((stop, index) => ({
      id: String(stop?.id || `stop-${index + 1}`),
      name: String(stop?.name || `Durak ${index + 1}`).trim(),
      description: String(stop?.description || '').trim(),
      image: String(stop?.image || '').trim(),
      index
    }));
  }

  function hasSourceNames(list) {
    return list.length === SOURCE_NAMES.length && list.every((stop, index) => norm(stop.name) === norm(SOURCE_NAMES[index]));
  }

  function ensureDialog() {
    if (dialog?.isConnected) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 'route-detail-stop-dialog';
    dialog.setAttribute('aria-labelledby', 'route-stop-dialog-title');
    const close = document.createElement('button');
    close.className = 'route-stop-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Pencereyi kapat');
    close.textContent = '×';
    close.addEventListener('click', () => dialog.close());
    const title = document.createElement('h2');
    title.id = 'route-stop-dialog-title';
    const description = document.createElement('p');
    description.className = 'route-stop-dialog-description';
    const image = document.createElement('img');
    image.className = 'route-stop-dialog-image';
    image.alt = '';
    image.hidden = true;
    const content = document.createElement('div');
    content.className = 'route-stop-dialog-content';
    dialog.append(close, title, description, image, content);
    dialog.addEventListener('close', () => {
      const target = focusedBeforeDialog;
      requestAnimationFrame(() => {
        if (target?.isConnected) target.focus({ preventScroll: true });
      });
    });
    document.body.append(dialog);
    return dialog;
  }

  function showStop(stop, trigger, fromList = false) {
    const node = ensureDialog();
    if (!node.open) focusedBeforeDialog = trigger || document.activeElement;
    node.querySelector('h2').textContent = stop.name || `Durak ${stop.index + 1}`;
    node.querySelector('.route-stop-dialog-description').textContent = stop.description || '';
    const img = node.querySelector('.route-stop-dialog-image');
    const src = stopImages[stop.index] || '';
    if (src) {
      img.src = src;
      img.alt = `${stop.name} durağından rota fotoğrafı`;
      img.hidden = false;
    } else {
      img.removeAttribute('src');
      img.alt = '';
      img.hidden = true;
    }
    const body = node.querySelector('.route-stop-dialog-content');
    body.replaceChildren();
    if (fromList) {
      body.dataset.returnToList = 'true';
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'route-stop-list-back';
      back.textContent = 'Durak listesine dön';
      back.addEventListener('click', () => showStopsList(stops, back));
      body.append(back);
    } else delete body.dataset.returnToList;
    if (!node.open) node.showModal();
  }

  function showStopsList(list, trigger) {
    const node = ensureDialog();
    if (!node.open) focusedBeforeDialog = trigger || document.activeElement;
    node.querySelector('h2').textContent = 'Rota Durakları';
    node.querySelector('.route-stop-dialog-description').textContent = '';
    const image = node.querySelector('.route-stop-dialog-image');
    image.removeAttribute('src');
    image.alt = '';
    image.hidden = true;
    const body = node.querySelector('.route-stop-dialog-content');
    body.dataset.returnToList = 'true';
    body.replaceChildren();
    list.forEach((stop) => {
      const item = document.createElement('article');
      item.className = 'route-stop-list-item';
      const title = document.createElement('h3');
      title.textContent = stop.name;
      item.append(title);
      if (stop.description) {
        const description = document.createElement('p');
        description.textContent = stop.description;
        item.append(description);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Detayı aç';
      button.setAttribute('aria-label', `${stop.name} durağının detayını aç`);
      button.addEventListener('click', () => showStop(stop, button, true));
      item.append(button);
      body.append(item);
    });
    if (!node.open) node.showModal();
  }

  function bindSourceMarkers(list) {
    const markers = [...document.querySelectorAll('.canvas a.hotspot.marker')];
    markers.forEach((marker, index) => {
      const stop = list[index];
      marker.setAttribute('aria-label', stop ? `${stop.name} durağı hakkında bilgi` : 'Kullanılmayan rota durağı');
      marker.setAttribute('aria-haspopup', 'dialog');
      if (!marker.hasAttribute('tabindex')) marker.setAttribute('tabindex', '0');
      if (marker.dataset.routeStopBound === 'true') return;
      marker.dataset.routeStopBound = 'true';
      marker.addEventListener('click', (event) => {
        const item = stops[index];
        if (!item) return;
        event.preventDefault();
        showStop(item, marker);
      });
      marker.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        const item = stops[index];
        if (item) showStop(item, marker);
      });
    });
  }

  function makeSectionLayer(image) {
    if (!canvas || !image) return null;
    const canvasRect = canvas.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    const layerNode = document.createElement('div');
    layerNode.className = 'route-detail-stops-layer';
    layerNode.setAttribute('aria-label', 'Düzenlenmiş rota durakları');
    layerNode.style.left = `${((imageRect.left - canvasRect.left) / canvasRect.width) * 100}%`;
    layerNode.style.top = `${((imageRect.top - canvasRect.top) / canvasRect.height) * 100}%`;
    layerNode.style.width = `${(imageRect.width / canvasRect.width) * 100}%`;
    layerNode.style.height = `${(imageRect.height / canvasRect.height) * 100}%`;
    layerNode.style.setProperty('--route-stop-scale', String(imageRect.width / 1024));
    canvas.append(layerNode);
    return layerNode;
  }

  function addTexturePatch(parent, rect, sample, imageUrl) {
    const [x1, y1, x2, y2] = rect;
    const patch = document.createElement('span');
    patch.className = 'route-detail-stop-label-patch';
    patch.setAttribute('aria-hidden', 'true');
    patch.style.left = `${x1 / 1024 * 100}%`;
    patch.style.top = `${y1 / 185 * 100}%`;
    patch.style.width = `${(x2 - x1) / 1024 * 100}%`;
    patch.style.height = `${(y2 - y1) / 185 * 100}%`;
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = '';
    img.draggable = false;
    img.style.width = `${1024 / (x2 - x1) * 100}%`;
    img.style.height = `${185 / (y2 - y1) * 100}%`;
    img.style.left = `${-sample[0] / (x2 - x1) * 100}%`;
    img.style.top = `${-sample[1] / (y2 - y1) * 100}%`;
    patch.append(img);
    parent.append(patch);
  }

  function placeLabel(parent, text, rect) {
    const [x1, y1, x2, y2] = rect;
    const label = document.createElement('span');
    label.className = 'route-detail-stop-label';
    label.textContent = text;
    label.setAttribute('aria-hidden', 'true');
    label.style.left = `${x1 / 1024 * 100}%`;
    label.style.top = `${y1 / 185 * 100}%`;
    label.style.width = `${(x2 - x1) / 1024 * 100}%`;
    label.style.height = `${(y2 - y1) / 185 * 100}%`;
    parent.append(label);
  }

  function dynamicPositions(list) {
    const left = 387;
    const right = 837;
    return list.map((_, index) => {
      const t = list.length <= 1 ? 0.5 : index / (list.length - 1);
      return { x: left + (right - left) * t, y: 83 + Math.sin(t * Math.PI * 2) * 15 };
    });
  }

  function renderChangedMap(list, image) {
    layer?.remove();
    layer = null;
    const markers = [...document.querySelectorAll('.canvas a.hotspot.marker')];
    if (hasSourceNames(list) || !image) {
      markers.forEach((marker) => { marker.hidden = false; });
      return;
    }
    layer = makeSectionLayer(image);
    if (!layer) return;
    const imageUrl = image.currentSrc || image.src;
    const positions = list.length === SOURCE_NAMES.length
      ? SOURCE_LABELS.map((item) => ({ x: item.pin[0], y: item.pin[1] }))
      : dynamicPositions(list);

    SOURCE_LABELS.forEach((source, index) => {
      addTexturePatch(layer, source.rect, source.sample, imageUrl);
      if (list.length !== SOURCE_NAMES.length) {
        const pinRect = [source.pin[0] - 17, source.pin[1] - 20, source.pin[0] + 17, source.pin[1] + 18];
        addTexturePatch(layer, pinRect, [430, 120], imageUrl);
      }
    });

    if (list.length !== SOURCE_NAMES.length) {
      markers.forEach((marker) => { marker.hidden = true; });
      const routeLine = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      routeLine.setAttribute('viewBox', '0 0 1024 185');
      routeLine.setAttribute('preserveAspectRatio', 'none');
      routeLine.classList.add('route-detail-dynamic-line');
      routeLine.setAttribute('aria-hidden', 'true');
      routeLine.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none';
      const oldPathCover = document.createElementNS(routeLine.namespaceURI, 'path');
      oldPathCover.setAttribute('d', 'M 405 79 C 443 56 474 67 505 82 S 565 107 610 105 S 690 121 744 125 S 806 100 838 102');
      oldPathCover.setAttribute('fill', 'none');
      oldPathCover.setAttribute('stroke', '#07364c');
      oldPathCover.setAttribute('stroke-width', '8');
      oldPathCover.setAttribute('stroke-linecap', 'round');
      oldPathCover.setAttribute('opacity', '.96');
      routeLine.append(oldPathCover);
      if (positions.length > 1) {
        const path = document.createElementNS(routeLine.namespaceURI, 'path');
        const pathData = positions.map((point, index) => {
          if (index === 0) return `M ${point.x} ${point.y}`;
          const previous = positions[index - 1];
          const midpoint = (previous.x + point.x) / 2;
          return `Q ${midpoint} ${previous.y} ${midpoint} ${(previous.y + point.y) / 2} T ${point.x} ${point.y}`;
        }).join(' ');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#f7f3e9');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-dasharray', '5 5');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('opacity', '.92');
        routeLine.append(path);
      }
      layer.append(routeLine);
    } else {
      markers.forEach((marker, index) => { marker.hidden = index >= list.length; });
    }

    list.forEach((stop, index) => {
      const sourceRect = list.length === SOURCE_NAMES.length
        ? SOURCE_LABELS[index].rect
        : [Math.max(8, positions[index].x - 55), positions[index].y + 20, Math.min(1016, positions[index].x + 55), positions[index].y + 45];
      if (list.length !== SOURCE_NAMES.length) addTexturePatch(layer, sourceRect, [430, 130], imageUrl);
      placeLabel(layer, stop.name, sourceRect);
      if (list.length !== SOURCE_NAMES.length) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'route-detail-map-pin';
        button.style.left = `${positions[index].x / 1024 * 100}%`;
        button.style.top = `${positions[index].y / 185 * 100}%`;
        button.setAttribute('aria-label', `${stop.name} durağı hakkında bilgi`);
        button.setAttribute('aria-haspopup', 'dialog');
        button.addEventListener('click', () => showStop(stop, button));
        layer.append(button);
      }
    });
  }

  function updateDeviceBoard(list, content, event) {
    const detail = event?.detail || {};
    const device = detail.device;
    const svg = detail.svg;
    if (detail.pageId !== 'rota-gocek-fethiye' || !svg || !['mobile', 'tablet', 'tv'].includes(device)) return;
    deviceBoards.set(device, event);
    const summaryNodes = (DEVICE_STOP_SUMMARY_IDS[device] || [])
      .map((id) => svg.querySelector(`[data-device-node="${id}"]`)).filter(Boolean);
    if (!summaryNodes.length) return;
    let bounds = null;
    try {
      for (const node of summaryNodes) {
        const box = node.getBBox();
        if (!(box.width > 0 && box.height > 0)) continue;
        if (!bounds) bounds = { x: box.x, y: box.y, width: box.width, height: box.height };
        else {
          const right = Math.max(bounds.x + bounds.width, box.x + box.width);
          const bottom = Math.max(bounds.y + bounds.height, box.y + box.height);
          bounds.x = Math.min(bounds.x, box.x);
          bounds.y = Math.min(bounds.y, box.y);
          bounds.width = right - bounds.x;
          bounds.height = bottom - bounds.y;
        }
      }
    } catch { return; }
    if (!bounds || !Number.isFinite(bounds.x) || !bounds.width || !bounds.height) return;
    let hit = svg.querySelector('.route-detail-stop-summary-hitarea');
    if (!hit) {
      hit = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      hit.classList.add('route-detail-stop-summary-hitarea');
      hit.setAttribute('fill', 'transparent');
      hit.setAttribute('pointer-events', 'all');
      hit.setAttribute('role', 'button');
      hit.setAttribute('tabindex', '0');
      hit.setAttribute('aria-haspopup', 'dialog');
      hit.setAttribute('aria-label', 'Rota duraklarının adlarını ve bilgilerini aç');
      const open = (eventObject) => {
        eventObject.preventDefault?.();
        showStopsList(stops, hit);
      };
      hit.addEventListener('click', open);
      hit.addEventListener('keydown', (eventObject) => {
        if (eventObject.key === 'Enter' || eventObject.key === ' ') open(eventObject);
      });
      svg.append(hit);
    }
    for (const [key, value] of Object.entries(bounds)) hit.setAttribute(key, String(value));
  }

  function refresh(content, deviceEvent) {
    latestContent = content || latestContent;
    currentRoute = resolveRoute(latestContent);
    if (!currentRoute) return;
    stops = normalizedStops(currentRoute);
    stopImages = stops.map((stop) => routeStopImage(stop));
    canvas = document.querySelector('.canvas');
    const mapImage = canvas?.querySelector('#stops');
    bindSourceMarkers(stops);
    renderChangedMap(stops, mapImage);
    if (deviceEvent) updateDeviceBoard(stops, latestContent, deviceEvent);
    else for (const event of deviceBoards.values()) updateDeviceBoard(stops, latestContent, event);
    document.querySelectorAll('.mobile-route-stops .stop-line').forEach((line) => {
      if (!mobileLineOriginals.has(line)) {
        mobileLineOriginals.set(line, {
          children: [...line.childNodes].map((node) => node.cloneNode(true)),
          ariaLabel: line.getAttribute('aria-label')
        });
      }
      const original = mobileLineOriginals.get(line);
      if (hasSourceNames(stops)) {
        line.replaceChildren(...original.children.map((node) => node.cloneNode(true)));
        if (original.ariaLabel == null) line.removeAttribute('aria-label');
        else line.setAttribute('aria-label', original.ariaLabel);
        return;
      }
      line.replaceChildren();
      stops.forEach((stop, index) => {
        if (index) { const separator = document.createElement('i'); separator.setAttribute('aria-hidden', 'true'); line.append(separator); }
        const label = document.createElement('span'); label.textContent = stop.name; line.append(label);
      });
      line.setAttribute('aria-label', stops.map((stop) => `${stop.name}${stop.description ? `, ${stop.description}` : ''}`).join('. '));
    });
  }

  function queueRefresh(content, deviceEvent) {
    latestContent = content || latestContent;
    if (deviceEvent) { refresh(latestContent, deviceEvent); return; }
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      refresh(latestContent);
    });
  }

  function init() {
    const scriptUrl = document.querySelector('script[src*="route-detail-stops.js"]')?.src;
    if (scriptUrl) scriptAssetRoot = new URL('../', scriptUrl);
    const templatePath = document.querySelector('meta[name="fora-cms-template-path"]')?.content || '';
    if (!location.pathname.includes('/rotalar/') && !templatePath.includes('/rotalar/')) return;
    latestContent = window.ForaCMS?.content || null;
    if (latestContent) queueRefresh(latestContent);
    window.addEventListener('fora:cms-content', (event) => queueRefresh(event.detail?.content));
    window.addEventListener('fora:device-rendered', (event) => queueRefresh(window.ForaCMS?.content || latestContent, event));
    window.addEventListener('resize', () => queueRefresh(window.ForaCMS?.content || latestContent), { passive: true });
    window.addEventListener('pageshow', () => queueRefresh(window.ForaCMS?.content || latestContent));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
