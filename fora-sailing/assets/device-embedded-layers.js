const SVG_NS = 'http://www.w3.org/2000/svg';
const embeddedRevealObservers = new WeakMap();

export function mergeLayerManifests(primary, sidecar) {
  const pages = new Map();
  for (const page of [...(primary?.pages || []), ...(sidecar?.pages || [])]) {
    const key = `${normalizePath(page.path)}|${page.device || ''}`;
    const current = pages.get(key);
    if (!current) pages.set(key, { ...page, layers: [...(page.layers || [])] });
    else current.layers.push(...(page.layers || []));
  }
  return { ...(primary || {}), pages: [...pages.values()] };
}

export function matchingEmbeddedLayers(manifest, path, device, designId, node, parentBinding = '') {
  const cleanPath = normalizePath(path);
  const page = (manifest?.pages || []).find(item => normalizePath(item.path) === cleanPath && item.device === device && (!designId || !item.designId || item.designId === designId));
  if (!page) return [];
  return (page.layers || []).filter(layer => {
    const source = layer.source || {};
    return (source.parentNodeId === node.id || layer.parentNodeId === node.id || (parentBinding && source.parentBinding === parentBinding))
      && source.rect && (source.localRect || source.glyphAsset || source.sourceText || source.text);
  }).sort((a, b) => Number(a.order || 0) - Number(b.order || 0) || String(a.layerId || a.id).localeCompare(String(b.layerId || b.id)));
}

export function sourceLayerState(manifest, path, device, designId, nodeId, live) {
  const page = (manifest?.pages || []).find(item => normalizePath(item.path) === normalizePath(path) && item.device === device && (!designId || !item.designId || item.designId === designId));
  const layer = (page?.layers || []).find(item => !item.source?.parentNodeId && (item.source?.nodeId === nodeId || item.source?.sourceId === nodeId));
  if (!layer) return null;
  const fields = (live?.sections || []).flatMap(section => section.fields || []);
  const field = fields.find(item => item.layerId === layer.layerId || (layer.binding && item.binding === layer.binding));
  const meta = field?.visualLayers?.find(item => item.layerId === layer.layerId) || {};
  const value = typeof field?.deviceOverrides?.[device] === 'string' ? field.deviceOverrides[device] : field?.value;
  const baseline = field?.defaultValue ?? layer.source?.sourceText ?? layer.source?.asset ?? '';
  const accessibility = typeof meta.accessibility === 'string' ? { ariaLabel: meta.accessibility } : (meta.accessibility && typeof meta.accessibility === 'object' ? meta.accessibility : {});
  const animation = typeof meta.animation === 'string' ? { class: meta.animation } : (meta.animation && typeof meta.animation === 'object' ? meta.animation : {});
  return {
    layer,
    visible: meta.visible ?? layer.visible,
    order: Number.isFinite(Number(meta.order)) ? Number(meta.order) : Number(layer.order),
    ariaLabel: Object.hasOwn(accessibility, 'ariaLabel') ? accessibility.ariaLabel : (layer.accessibility?.ariaLabel ?? layer.accessibleName),
    hasAriaLabel: Object.hasOwn(accessibility, 'ariaLabel'),
    animationClass: animation.class || '',
    animationDurationMs: animation.durationMs,
    field,
    value,
    changed: !!field && !field.layerOnly && value !== undefined && String(value ?? '') !== String(baseline ?? ''),
  };
}

export function effectiveNodeOrder(api, manifest, path, device, designId, node, live) {
  return api?.sourceLayerState?.(manifest, path, device, designId, node.id, live)?.order ?? Number(node.sourceOrder || 0);
}

export function renderEmbeddedImageGroup({ document, manifest, path, device, designId, node, parentBinding = '', baseImage, baseChanged, live, asset }) {
  const layers = matchingEmbeddedLayers(manifest, path, device, designId, node, parentBinding);
  if (!layers.length) return null;
  const NS = SVG_NS, group = document.createElementNS(NS, 'g');
  group.setAttribute('data-device-embedded-parent', node.id);
  group.append(baseImage);
  const sectionFields = (live?.sections || []).flatMap(section => section.fields || []);
  const outputs = [];
  for (const layer of layers) {
    const id = String(layer.layerId || layer.id || '');
    if (!id) continue;
    const field = sectionFields.find(item => item.layerId === id || (layer.binding && item.binding === layer.binding));
    const metadata = field?.visualLayers?.find(item => item.layerId === id) || {};
    const accessibility = typeof metadata.accessibility === 'string' ? { ariaLabel: metadata.accessibility } : (metadata.accessibility || {});
    const animationMeta = typeof metadata.animation === 'string' ? { class: metadata.animation } : (metadata.animation || {});
    const source = layer.source || {}, replacement = layer.replacement || {}, rect = normalizeRect(source.rect), localRect = normalizeRect(source.localRect);
    if (!rect) continue;
    const deviceOverride = typeof field?.deviceOverrides?.[device] === 'string' ? field.deviceOverrides[device] : undefined;
    const contentValue = deviceOverride ?? field?.value;
    const changed = !!field && !field.layerOnly && contentValue !== undefined && String(contentValue ?? '') !== String(field.defaultValue ?? source.sourceText ?? source.text ?? source.asset ?? '');
    const hasVisibilityOverride = Object.hasOwn(metadata, 'visible');
    const requestedVisible = hasVisibilityOverride ? metadata.visible !== false : layer.visible !== false;
    // When a parent image is replaced, an embedded atom with no explicit CMS
    // visibility choice must be restored as a foreground child. On the source
    // image, a baseline-hidden atom must stay dormant instead of being drawn
    // over the same pixels a second time.
    const visible = hasVisibilityOverride ? requestedVisible : (baseChanged || requestedVisible);
    const hidden = !visible;
    const order = Number.isFinite(Number(metadata.order)) ? Number(metadata.order) : Number(layer.order || 0);
    const reordered = order !== Number(layer.order || 0);
    const visibilityChanged = hasVisibilityOverride && requestedVisible !== (layer.visible !== false);
    const animationClass = animationMeta.class || '';
    const animationEdited = Object.hasOwn(metadata, 'animation') && !!animationClass;
    const accessibilityEdited = Object.hasOwn(metadata, 'accessibility') && !!(accessibility.ariaLabel || accessibility.alt);
    const edited = changed || visibilityChanged || reordered || animationEdited || accessibilityEdited;
    const cleanAsset = replacement.cleanAsset || source.cleanPatch;
    const hasCleanAsset = !!cleanAsset && layer.cleanAssetAvailable !== false;
    if (edited && !baseChanged && !hasCleanAsset) continue;
    if (hidden) {
      // The replacement parent has no source ink to erase. On the original
      // parent, clean the baked pixels only when hiding a baseline-visible atom.
      if (!baseChanged && layer.visible !== false) {
        if (!hasCleanAsset) continue;
        const patchSource = { ...source, assetViewport: replacement.cleanViewport || replacement.assetViewport || source.assetViewport };
        const patch = makeCrop(document, cleanAsset, replacement.cleanRect || localRect, rect, patchSource, node.geometry, asset, `${id}-clean`);
        if (patch) outputs.push({ order, id, node: patch });
      }
      continue;
    }
    if (!edited && !baseChanged) continue;

    let child = null;
    const value = field && !field.layerOnly ? contentValue : undefined;
    const sourceText = source.sourceText ?? layer.sourceText ?? source.text ?? layer.original?.sourceText ?? layer.original?.text ?? '';
    if (layer.type === 'text' || (layer.type === 'decor' && sourceText)) {
      const text = changed ? String(value ?? '') : sourceText;
      if (text) child = makeText(document, layer, text, rect);
    } else if (changed && value) {
      child = makeReplacementImage(document, value, rect, asset);
    } else if (source.glyphAsset) {
      child = makeReplacementImage(document, source.glyphAsset, rect, asset);
    } else if (localRect) {
      child = makeCrop(document, source.asset || node.asset, localRect, rect, source, node.geometry, asset, id);
    }
    if (child) {
      const itemGroup = document.createElementNS(NS, 'g');
      itemGroup.setAttribute('data-device-layer-id', id);
      itemGroup.setAttribute('data-device-layer-order', String(order));
      if (!baseChanged && edited) {
        const patchSource = { ...source, assetViewport: replacement.cleanViewport || replacement.assetViewport || source.assetViewport };
        const patch = makeCrop(document, cleanAsset, replacement.cleanRect || localRect, rect, patchSource, node.geometry, asset, `${id}-clean`);
        if (patch) itemGroup.append(patch);
      }
      const aria = Object.hasOwn(accessibility, 'ariaLabel') ? accessibility.ariaLabel : (layer.accessibility?.ariaLabel || layer.accessibleName);
      const alt = accessibility.alt || layer.accessibility?.alt;
      const foreground = document.createElementNS(NS, 'g');
      if (aria || alt) foreground.setAttribute('aria-label', aria || alt);
      const rotated = document.createElementNS(NS, 'g');
      const rotation = Number(source.rotationDeg ?? layer.rotationDeg ?? 0);
      if (Number.isFinite(rotation) && rotation !== 0) {
        const cx = rect.x + rect.width / 2, cy = rect.y + rect.height / 2;
        rotated.setAttribute('transform', `rotate(${rotation} ${cx} ${cy})`);
      }
      rotated.append(child);
      foreground.append(rotated);
      if (animationClass && animationClass !== 'none') {
        foreground.classList.add('fora-embedded-layer', ...safeClasses(animationClass));
        foreground.setAttribute('data-layer-animation', String(animationClass));
        if (animationMeta.durationMs || layer.animation?.durationMs) foreground.style.animationDuration = `${clamp(animationMeta.durationMs || layer.animation.durationMs, 1, 10000)}ms`;
        waitForEmbeddedLayerVisibility(document, foreground);
      }
      itemGroup.append(foreground);
      outputs.push({ order, id, node: itemGroup });
    }
  }
  outputs.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  outputs.forEach(item => group.append(item.node));
  return group;
}

function makeCrop(document, imagePath, crop, target, source, parentGeometry, asset, id) {
  if (!imagePath || !crop) return null;
  const box = normalizeRect(target), clip = normalizeRect(crop);
  if (!box || !clip) return null;
  const viewport = source.assetViewport || source.rasterViewport || source.assetSize || { width: source.assetWidth || parentGeometry?.width, height: source.assetHeight || parentGeometry?.height };
  const width = positive(viewport.assetWidth || viewport.width || source.assetWidth || box.width);
  const height = positive(viewport.assetHeight || viewport.height || source.assetHeight || box.height);
  const svg = document.createElementNS(SVG_NS, 'svg');
  set(svg, { x: box.x, y: box.y, width: box.width, height: box.height, viewBox: `${clip.x} ${clip.y} ${clip.width} ${clip.height}`, preserveAspectRatio: 'none', overflow: 'hidden', 'data-device-layer-crop': id });
  const image = document.createElementNS(SVG_NS, 'image');
  set(image, { x: 0, y: 0, width, height, href: asset(imagePath), preserveAspectRatio: 'none' });
  svg.append(image);
  return svg;
}

function makeReplacementImage(document, path, rect, asset) {
  const box = normalizeRect(rect);
  if (!box || !path) return null;
  const image = document.createElementNS(SVG_NS, 'image');
  set(image, { x: box.x, y: box.y, width: box.width, height: box.height, href: asset(path), preserveAspectRatio: 'xMidYMid meet' });
  return image;
}

function makeText(document, layer, text, rect) {
  const source = layer.source || {}, font = source.font || {}, baseline = source.baseline || {};
  const box = normalizeRect(rect);
  if (!box) return null;
  const node = document.createElementNS(SVG_NS, 'text');
  const fontSpec = typeof font === 'object' ? font : {};
  const handwritten = /script|handwritten/i.test(`${layer.semantic || ''} ${layer.original?.kind || ''}`);
  const family = handwritten ? 'Caveat, cursive' : resolveFontFamily(typeof font === 'string' ? font : fontSpec.family);
  const baseSize = positive(fontSpec.size || source.fontSize || (family.startsWith('Caveat') ? 18 : 14));
  const weight = fontSpec.weight || source.fontWeight || 400;
  const letterSpacing = Number(fontSpec.letterSpacing || source.letterSpacing || 0);
  const lineHeight = positive(fontSpec.lineHeight || source.lineHeight || baseSize * 1.15);
  const anchor = fontSpec.anchor || fontSpec.textAnchor || source.textAnchor?.anchor || 'start';
  const x = Number(baseline.x ?? source.textAnchor?.x ?? box.x);
  const y = Number(baseline.y ?? source.textAnchor?.y ?? (box.y + baseSize));
  let size = baseSize, lines = [];
  while (size >= 8) {
    const ratio = family.startsWith('Caveat') ? 0.48 : 0.56;
    lines = wrapText(text, box.width, size, ratio, letterSpacing);
    const scaledLineHeight = lineHeight * (size / baseSize);
    if (lines.length * scaledLineHeight <= box.height + 0.01) break;
    size = Math.round((size - 0.5) * 10) / 10;
  }
  const fittedLineHeight = lineHeight * (size / baseSize);
  set(node, { x, y, fill: source.fill || '#fff', 'font-family': family, 'font-size': size, 'font-weight': weight, 'font-style': fontSpec.style || source.fontStyle || 'normal', 'text-anchor': anchor, 'letter-spacing': letterSpacing, 'xml:space': 'preserve' });
  lines.forEach((line, index) => {
    const span = document.createElementNS(SVG_NS, 'tspan');
    set(span, { x, dy: index === 0 ? 0 : fittedLineHeight });
    span.textContent = line;
    node.append(span);
  });
  return node;
}

function resolveFontFamily(value) {
  const family = String(value || '').trim().toLowerCase();
  if (family.includes('script') || family.includes('handwritten') || family.includes('caveat')) return 'Caveat, cursive';
  if (family.includes('serif')) return 'Fora Serif, "Playfair Display", serif';
  if (family.includes('sans') || family.includes('inter')) return 'Fora Sans, Inter, sans-serif';
  return value ? String(value) : 'Inter, sans-serif';
}

function wrapText(text, width, fontSize, ratio, letterSpacing) {
  const maxChars = Math.max(1, Math.floor(width / Math.max(1, fontSize * ratio + letterSpacing)));
  const output = [];
  for (const paragraph of String(text).split(/\r?\n/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) { output.push(''); continue; }
    let line = '';
    for (const word of words) {
      if (word.length > maxChars) {
        if (line) { output.push(line); line = ''; }
        for (let offset = 0; offset < word.length; offset += maxChars) output.push(word.slice(offset, offset + maxChars));
        continue;
      }
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > maxChars && line) { output.push(line); line = word; }
      else line = candidate;
    }
    if (line) output.push(line);
  }
  return output.length ? output : [''];
}

function waitForEmbeddedLayerVisibility(document, element) {
  const Observer = document.defaultView?.IntersectionObserver || globalThis.IntersectionObserver;
  const Mutation = document.defaultView?.MutationObserver || globalThis.MutationObserver;
  if (!Observer || !document.documentElement || document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
  let state = embeddedRevealObservers.get(document);
  if (!state) {
    const pending = new Set();
    const observer = new Observer(entries => {
      for (const entry of entries) {
        if (entry.target.isConnected === false) {
          observer.unobserve(entry.target);
          pending.delete(entry.target);
        } else if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
          entry.target.classList.remove('fora-embedded-layer-pending');
          observer.unobserve(entry.target);
          pending.delete(entry.target);
        }
      }
      if (!pending.size) cleanupEmbeddedRevealObserver(document, state);
    }, { threshold: [0, 0.2] });
    const mutationObserver = Mutation ? new Mutation(() => {
      for (const target of pending) {
        if (target.isConnected === false) {
          observer.unobserve(target);
          target.classList.remove('fora-embedded-layer-pending');
          pending.delete(target);
        }
      }
      if (!pending.size) cleanupEmbeddedRevealObserver(document, state);
    }) : null;
    state = { observer, mutationObserver, pending };
    embeddedRevealObservers.set(document, state);
    mutationObserver?.observe(document.documentElement, { childList: true, subtree: true });
  }
  element.classList.add('fora-embedded-layer-pending');
  state.pending.add(element);
  state.observer.observe(element);
}

function cleanupEmbeddedRevealObserver(document, state) {
  state.observer.disconnect();
  state.mutationObserver?.disconnect();
  embeddedRevealObservers.delete(document);
}

function normalizePath(path) { const value = String(path || '/').trim(); return value.startsWith('/') ? value : `/${value}`; }
function normalizeRect(value) {
  if (Array.isArray(value)) value = { x: value[0], y: value[1], width: value[2], height: value[3] };
  if (!value || ![value.x, value.y, value.width, value.height].every(item => Number.isFinite(Number(item))) || Number(value.width) <= 0 || Number(value.height) <= 0) return null;
  return { x: Number(value.x), y: Number(value.y), width: Number(value.width), height: Number(value.height) };
}
function positive(value) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : 1; }
function clamp(value, min, max) { const number = Number(value); return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : min; }
function safeClasses(value) { return String(value).split(/\s+/).filter(item => /^[a-z][\w-]{0,48}$/i.test(item)); }
function set(node, attrs) { for (const [key, value] of Object.entries(attrs)) if (value !== undefined && value !== null) node.setAttribute(key, String(value)); }
