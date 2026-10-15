(() => {
  'use strict';

  const wrapper = document.querySelector('[data-home-route-motion]');
  const poster = wrapper?.querySelector('.home-route-map-poster');
  if (!wrapper || !poster) return;

  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const smallQuery = window.matchMedia('(max-width: 650px)');
  const pinRegions = [
    [[125, 55, 140, 75], [183, 38, 220, 49]],
    [[227, 60, 243, 80], [244, 62, 285, 78]],
    [[279, 106, 285, 131], [257, 113, 285, 132]]
  ];

  let observer = null;
  let finishTimer = 0;
  let started = false;
  let settled = false;
  let layers = null;

  function motionAllowed() {
    const root = document.documentElement.dataset;
    if (root.cmsScrollAnimations === 'false') return false;
    if (smallQuery.matches && root.cmsReduceMotionMobile === 'true') return false;
    return !(root.cmsRespectReducedMotion !== 'false' && reduceQuery.matches);
  }

  function makeMask(imageData, width, height, regions, predicate) {
    const mask = new Uint8Array(width * height);
    for (const [x0, y0, x1, y1] of regions) {
      const left = Math.max(0, Math.floor(x0));
      const top = Math.max(0, Math.floor(y0));
      const right = Math.min(width, Math.ceil(x1));
      const bottom = Math.min(height, Math.ceil(y1));
      for (let y = top; y < bottom; y += 1) {
        for (let x = left; x < right; x += 1) {
          const index = (y * width + x) * 4;
          const r = imageData.data[index];
          const g = imageData.data[index + 1];
          const b = imageData.data[index + 2];
          if (predicate(r, g, b, x, y)) mask[y * width + x] = 1;
        }
      }
    }
    return mask;
  }

  function buildLayers(image) {
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (width !== 285 || height !== 163) return null;

    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = width;
    sourceCanvas.height = height;
    const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
    sourceContext.drawImage(image, 0, 0);
    const source = sourceContext.getImageData(0, 0, width, height);

    const pinMasks = pinRegions.map(rects => makeMask(source, width, height, rects, (r, g, b) => {
      const luminance = r * 0.299 + g * 0.587 + b * 0.114;
      return luminance > 75 && r + g > b * 1.05;
    }));
    const pinRectangles = pinRegions.flat();
    const sourceTrace = [
      [137, 54], [142, 39], [150, 31], [170, 31], [178, 37], [180, 48], [180, 59],
      [188, 69], [204, 78], [223, 84], [241, 84], [252, 89], [260, 98], [266, 105], [282, 109]
    ];
    const withinSourceTrace = (x, y) => {
      let shortest = Infinity;
      for (let i = 0; i < sourceTrace.length - 1; i += 1) {
        const [ax, ay] = sourceTrace[i];
        const [bx, by] = sourceTrace[i + 1];
        const dx = bx - ax;
        const dy = by - ay;
        const t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (y + 0.5 - ay) * dy) / (dx * dx + dy * dy)));
        shortest = Math.min(shortest, Math.hypot(x + 0.5 - (ax + t * dx), y + 0.5 - (ay + t * dy)));
      }
      return shortest <= 2.35;
    };
    const lineMask = makeMask(source, width, height, [[130, 27, 285, 115]], (r, g, b, x, y) => {
      const inPinRegion = pinRectangles.some(([x0, y0, x1, y1]) => x >= x0 && x < x1 && y >= y0 && y < y1);
      if (inPinRegion) return false;
      if (!withinSourceTrace(x, y)) return false;
      const high = Math.max(r, g, b);
      const low = Math.min(r, g, b);
      const luminance = r * 0.299 + g * 0.587 + b * 0.114;
      return high > 68 && low > 22 && high - low < 125 && luminance > 66;
    });

    const removed = new Uint8Array(width * height);
    for (let i = 0; i < removed.length; i += 1) {
      if (lineMask[i] || pinMasks.some(mask => mask[i])) removed[i] = 1;
    }

    const base = new ImageData(new Uint8ClampedArray(source.data), width, height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (!removed[y * width + x]) continue;
        // Interpolate from a stable neighborhood outside the erased glyph/pin
        // boxes. Averaging the first ring only can reproduce a faint letter
        // shape in the temporary background during the reveal.
        let weightTotal = 0;
        const sums = [0, 0, 0];
        const radius = 6;
        for (let dy = -radius; dy <= radius; dy += 1) {
          for (let dx = -radius; dx <= radius; dx += 1) {
            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared === 0 || distanceSquared > radius * radius) continue;
            const sx = x + dx;
            const sy = y + dy;
            if (sx < 0 || sy < 0 || sx >= width || sy >= height || removed[sy * width + sx]) continue;
            const weight = 1 / distanceSquared;
            const sample = (sy * width + sx) * 4;
            for (let channel = 0; channel < 3; channel += 1) sums[channel] += source.data[sample + channel] * weight;
            weightTotal += weight;
          }
        }
        if (!weightTotal) continue;
        const target = (y * width + x) * 4;
        for (let channel = 0; channel < 3; channel += 1) {
          base.data[target + channel] = sums[channel] / weightTotal;
        }
        base.data[target + 3] = 255;
      }
    }

    const makeLayer = mask => {
      const data = new ImageData(width, height);
      for (let i = 0; i < mask.length; i += 1) {
        if (!mask[i]) continue;
        const index = i * 4;
        data.data[index] = source.data[index];
        data.data[index + 1] = source.data[index + 1];
        data.data[index + 2] = source.data[index + 2];
        data.data[index + 3] = 255;
      }
      return data;
    };

    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = width;
    baseCanvas.height = height;
    baseCanvas.className = 'home-route-motion-layer home-route-base-layer';
    baseCanvas.setAttribute('aria-hidden', 'true');
    baseCanvas.getContext('2d').putImageData(base, 0, 0);

    const lineCanvas = document.createElement('canvas');
    lineCanvas.width = width;
    lineCanvas.height = height;
    lineCanvas.className = 'home-route-motion-layer home-route-line-layer';
    lineCanvas.setAttribute('aria-hidden', 'true');
    lineCanvas.getContext('2d').putImageData(makeLayer(lineMask), 0, 0);

    const pins = pinMasks.map((mask, index) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.className = `home-route-motion-layer home-route-pin-layer home-route-pin-${index + 1}`;
      canvas.style.setProperty('--home-route-pin-delay', `${index * 250}ms`);
      canvas.setAttribute('aria-hidden', 'true');
      canvas.getContext('2d').putImageData(makeLayer(mask), 0, 0);
      return canvas;
    });

    let diffPixels = 0;
    const composed = new Uint8ClampedArray(base.data);
    [lineMask, ...pinMasks].forEach(mask => {
      for (let i = 0; i < mask.length; i += 1) {
        if (!mask[i]) continue;
        const index = i * 4;
        composed[index] = source.data[index];
        composed[index + 1] = source.data[index + 1];
        composed[index + 2] = source.data[index + 2];
        composed[index + 3] = 255;
      }
    });
    for (let i = 0; i < composed.length; i += 4) {
      if (composed[i] !== source.data[i] || composed[i + 1] !== source.data[i + 1] ||
          composed[i + 2] !== source.data[i + 2] || composed[i + 3] !== source.data[i + 3]) diffPixels += 1;
    }

    return { baseCanvas, lineCanvas, pins, diffPixels, linePixels: lineMask.reduce((sum, bit) => sum + bit, 0),
      pinPixels: pinMasks.map(mask => mask.reduce((sum, bit) => sum + bit, 0)) };
  }

  function settleToSource() {
    window.clearTimeout(finishTimer);
    finishTimer = 0;
    wrapper.classList.remove('is-playing', 'is-line-open');
    wrapper.classList.add('is-settled');
    settled = true;
  }

  async function playOnce() {
    if (started || settled || !motionAllowed() || wrapper.getBoundingClientRect().width === 0) return;
    started = true;
    try {
      if (!poster.complete || !poster.naturalWidth) await poster.decode();
      layers = buildLayers(poster);
      if (!layers || layers.diffPixels !== 0 || layers.linePixels < 20 || layers.pinPixels.some(count => count < 3)) {
        started = false;
        return;
      }
      wrapper.append(layers.baseCanvas, layers.lineCanvas, ...layers.pins);
      wrapper.dataset.staticDiffPixels = String(layers.diffPixels);
      wrapper.dataset.routeSourcePixels = String(layers.linePixels);
      wrapper.dataset.routePinPixelGroups = layers.pinPixels.map(String).join(',');
      wrapper.style.setProperty('--home-route-duration', smallQuery.matches ? '900ms' : '1600ms');
      wrapper.classList.add('is-playing');
      requestAnimationFrame(() => requestAnimationFrame(() => wrapper.classList.add('is-line-open')));
      const duration = smallQuery.matches ? 900 : 1600;
      finishTimer = window.setTimeout(settleToSource, duration + 250 * 3 + 80);
    } catch {
      started = false;
      wrapper.classList.remove('is-playing', 'is-line-open');
    }
  }

  if (poster.complete && poster.naturalWidth) {
    // Browser cache may have the source ready before this deferred module executes.
  } else {
    poster.addEventListener('load', () => {}, { once: true });
  }

  observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    observer = null;
    playOnce();
  }, { threshold: 0.2 });
  observer.observe(wrapper);

  const syncPreference = () => {
    if (motionAllowed() || settled) return;
    if (started) settleToSource();
  };
  reduceQuery.addEventListener?.('change', syncPreference);
  window.addEventListener('fora:motion-settings', syncPreference);
  new MutationObserver(syncPreference).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-cms-scroll-animations', 'data-cms-reduce-motion-mobile', 'data-cms-respect-reduced-motion']
  });
})();
