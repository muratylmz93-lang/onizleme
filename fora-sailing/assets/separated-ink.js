const targetStates = new WeakMap();
const MASK_PROPERTIES = ['mask-image', 'mask-mode', 'mask-size', 'mask-repeat'];
const WEBKIT_MASK_PROPERTIES = ['-webkit-mask-image', '-webkit-mask-size', '-webkit-mask-repeat'];

/**
 * Hide one separated source-ink rectangle on each matched target.
 * For `full` glyphs, hide/restore the whole glyph target instead of cutting a hole.
 * `targetRect` is the parent artwork rectangle in the same source coordinate
 * space as `spec.rect`; the result is clamped to a normalized 1000×1000 mask.
 */
export function applySeparatedInkMask(root, spec, layerId, targetRect, hidden) {
  const selector = String(spec?.selector || '').trim();
  const id = String(layerId || '').trim();
  if (!root || !selector || !id) return 0;

  const targets = [];
  try {
    if (root.matches?.(selector)) targets.push(root);
    for (const target of root.querySelectorAll?.(selector) || []) if (!targets.includes(target)) targets.push(target);
  } catch {
    return 0;
  }

  for (const target of targets) {
    const state = stateFor(target);
    if (spec.full === true) {
      if (hidden) state.fullHidden.add(id);
      else state.fullHidden.delete(id);
      applyFullVisibility(target, state);
      continue;
    }

    if (hidden) {
      const rect = localMaskRect(spec.rect, targetRect);
      if (rect) state.holes.set(id, rect);
      else state.holes.delete(id);
    } else {
      state.holes.delete(id);
    }
    applyMask(target, state);
  }
  return targets.length;
}

function stateFor(target) {
  let state = targetStates.get(target);
  if (state) return state;
  const style = target.style;
  const originalMask = Object.fromEntries([...MASK_PROPERTIES, ...WEBKIT_MASK_PROPERTIES].map(property => [property, readStyle(style, property)]));
  state = {
    holes: new Map(),
    fullHidden: new Set(),
    originalMask,
    originalVisibilityAttribute: target.getAttribute?.('visibility'),
    originalVisibilityStyle: readStyle(style, 'visibility'),
  };
  targetStates.set(target, state);
  return state;
}

function localMaskRect(sourceRect, targetRect) {
  const source = rect(sourceRect), target = rect(targetRect);
  if (!source || !target) return null;
  const left = clamp((source.x - target.x) / target.width * 1000, 0, 1000);
  const top = clamp((source.y - target.y) / target.height * 1000, 0, 1000);
  const right = clamp((source.x + source.width - target.x) / target.width * 1000, 0, 1000);
  const bottom = clamp((source.y + source.height - target.y) / target.height * 1000, 0, 1000);
  if (right <= left || bottom <= top) return null;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function rect(value) {
  if (Array.isArray(value)) value = { x: value[0], y: value[1], width: value[2], height: value[3] };
  if (!value || ![value.x, value.y, value.width, value.height].every(item => Number.isFinite(Number(item)))) return null;
  const result = { x: Number(value.x), y: Number(value.y), width: Number(value.width), height: Number(value.height) };
  return result.width > 0 && result.height > 0 ? result : null;
}

function applyMask(target, state) {
  const style = target.style;
  if (!state.holes.size) {
    restoreMask(style, state.originalMask);
    return;
  }
  const holes = [...state.holes.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, hole]) =>
    `<rect x="${fmt(hole.x)}" y="${fmt(hole.y)}" width="${fmt(hole.width)}" height="${fmt(hole.height)}" fill="black"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000" preserveAspectRatio="none"><rect width="1000" height="1000" fill="white"/>${holes}</svg>`;
  const uri = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  writeStyle(style, 'mask-image', uri);
  writeStyle(style, 'mask-mode', 'luminance');
  writeStyle(style, 'mask-size', '100% 100%');
  writeStyle(style, 'mask-repeat', 'no-repeat');
  writeStyle(style, '-webkit-mask-image', uri);
  writeStyle(style, '-webkit-mask-size', '100% 100%');
  writeStyle(style, '-webkit-mask-repeat', 'no-repeat');
}

function applyFullVisibility(target, state) {
  if (state.fullHidden.size) {
    target.setAttribute?.('visibility', 'hidden');
    writeStyle(target.style, 'visibility', 'hidden');
    return;
  }
  if (state.originalVisibilityAttribute === null || state.originalVisibilityAttribute === undefined) target.removeAttribute?.('visibility');
  else target.setAttribute?.('visibility', state.originalVisibilityAttribute);
  restoreStyle(target.style, 'visibility', state.originalVisibilityStyle);
}

function restoreMask(style, snapshot) {
  for (const property of [...MASK_PROPERTIES, ...WEBKIT_MASK_PROPERTIES]) restoreStyle(style, property, snapshot[property]);
}

function readStyle(style, property) {
  if (!style) return { value: '', priority: '' };
  return { value: style.getPropertyValue?.(property) ?? style[property] ?? '', priority: style.getPropertyPriority?.(property) || '' };
}

function writeStyle(style, property, value) {
  if (!style) return;
  if (style.setProperty) style.setProperty(property, value);
  else style[property] = value;
}

function restoreStyle(style, property, previous) {
  if (!style) return;
  const value = previous?.value ?? '';
  if (style.setProperty) {
    if (value) style.setProperty(property, value, previous?.priority || '');
    else style.removeProperty(property);
  } else style[property] = value;
}

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function fmt(value) { return Number(value.toFixed(4)).toString(); }
