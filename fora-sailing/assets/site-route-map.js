import { escapeHTML } from './site-assets.js';

const esc = escapeHTML;
const sprite = 'assets/icons/fora-icons.svg';
const view = { width: 760, height: 220 };
const routePath = 'M 40 158 C 190 20, 520 20, 720 145';
const startedMapIds = new Set();

function safeId(value) {
  return String(value || 'route').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'route';
}

function normalizeStops(stops) {
  return (Array.isArray(stops) ? stops : []).map((stop, index) => {
    const label = typeof stop === 'string' ? stop : stop?.label ?? stop?.name ?? stop?.title ?? '';
    return { label: String(label).trim(), index };
  }).filter((stop) => stop.label);
}

function cubicPoint(t) {
  const u = 1 - t;
  const x = (u ** 3 * 40) + (3 * u ** 2 * t * 190) + (3 * u * t ** 2 * 520) + (t ** 3 * 720);
  const y = (u ** 3 * 158) + (3 * u ** 2 * t * 20) + (3 * u * t ** 2 * 20) + (t ** 3 * 145);
  return { x, y };
}

/** Render a small native route diagram; labels remain real HTML text. */
export function renderRouteMap(ctx = {}, { id, stops, duration = 1600, showBoat = false } = {}) {
  const cleanStops = normalizeStops(stops);
  if (!cleanStops.length) return '';

  const mapId = safeId(id);
  const pathId = `route-path-${mapId}`;
  const durationMs = Math.max(1, Number(duration) || 1600);
  const assetUrl = (path) => esc(typeof ctx?.asset === 'function' ? ctx.asset(path) : path);
  const pins = cleanStops.map((stop, index) => {
    const t = cleanStops.length === 1 ? 0.5 : 0.12 + (0.76 * index) / (cleanStops.length - 1);
    const point = cubicPoint(t);
    const x = (point.x / view.width) * 100;
    const y = (point.y / view.height) * 100;
    return `<li class="fora-route-map__stop" style="--stop-x:${x.toFixed(2)}%;--stop-y:${y.toFixed(2)}%;--stop-delay:${index * 250}ms"><svg class="fora-route-map__pin" viewBox="0 0 24 24" aria-hidden="true"><use href="${assetUrl(sprite)}#fora-location"></use></svg><span class="fora-route-map__label">${esc(stop.label)}</span></li>`;
  }).join('');
  const boat = showBoat ? `<g class="fora-route-map__boat" aria-hidden="true"><animateMotion class="fora-route-map__boat-motion" begin="indefinite" dur="1800ms" fill="freeze" rotate="auto"><mpath href="#${pathId}"></mpath></animateMotion><use href="${assetUrl(sprite)}#fora-sailboat" x="-12" y="-12" width="24" height="24"></use></g>` : '';

  return `<div class="fora-route-map" data-route-map data-route-map-id="${esc(mapId)}" data-motion-duration="${durationMs}" data-show-boat="${showBoat ? 'true' : 'false'}" role="group" aria-label="Rota: ${esc(cleanStops.map((stop) => stop.label).join(' → '))}"><svg class="fora-route-map__drawing" viewBox="0 0 ${view.width} ${view.height}" preserveAspectRatio="none" aria-hidden="true"><path class="fora-route-map__track" d="${routePath}"></path><path id="${pathId}" class="fora-route-map__path" d="${routePath}"></path>${boat}</svg><ol class="fora-route-map__stops">${pins}</ol></div>`;
}

/** Animate each route once when at least 20% of it enters the viewport. */
export function initRouteMaps(root = document) {
  const descendants = root.querySelectorAll ? [...root.querySelectorAll('[data-route-map]')] : [];
  const maps = [...(root.matches?.('[data-route-map]') ? [root] : []), ...descendants];
  if (!maps.length) return null;

  const makeStatic = (map) => {
    const mapId = map.dataset.routeMapId;
    if (mapId) startedMapIds.add(mapId);
    map.dataset.routeMapStarted = 'true';
    map.classList.remove('is-pending');
    const path = map.querySelector('.fora-route-map__path');
    if (path) {
      const length = path.getTotalLength?.();
      if (Number.isFinite(length)) path.style.setProperty('--path-length', `${length}px`);
      path.classList.add('is-drawn');
    }
    map.classList.add('is-static', 'is-complete');
    map.querySelectorAll('.fora-route-map__stop').forEach((stop) => stop.classList.add('is-visible'));
  };

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  if (reduced) {
    maps.forEach(makeStatic);
    return null;
  }

  if (typeof IntersectionObserver !== 'function') {
    maps.forEach(makeStatic);
    return null;
  }

  const pendingMaps = [];
  maps.forEach((map) => {
    const mapId = map.dataset.routeMapId;
    if (mapId && startedMapIds.has(mapId)) {
      makeStatic(map);
      return;
    }
    if (map.dataset.routeMapStarted === 'true') {
      makeStatic(map);
      return;
    }
    map.classList.remove('is-static', 'is-complete');
    map.classList.add('is-pending');
    pendingMaps.push(map);
  });
  if (!pendingMaps.length) return null;

  const completionTimers = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.2) return;
      const map = entry.target;
      observer.unobserve(map);
      const mapId = map.dataset.routeMapId;
      if ((mapId && startedMapIds.has(mapId)) || map.dataset.routeMapStarted === 'true') {
        makeStatic(map);
        return;
      }
      if (mapId) startedMapIds.add(mapId);
      map.dataset.routeMapStarted = 'true';

      const path = map.querySelector('.fora-route-map__path');
      const mobile = window.matchMedia?.('(max-width: 700px)').matches ?? false;
      const configured = Number(map.dataset.motionDuration) || 1600;
      const drawDuration = mobile ? Math.min(configured, 950) : configured;
      if (path) {
        const length = path.getTotalLength();
        path.style.setProperty('--path-length', `${length}px`);
        path.style.setProperty('--draw-duration', `${drawDuration}ms`);
        requestAnimationFrame(() => path.classList.add('is-drawn'));
      }

      map.querySelectorAll('.fora-route-map__stop').forEach((stop) => stop.classList.add('is-visible'));
      const boatMotion = map.querySelector('.fora-route-map__boat-motion');
      if (!mobile && map.dataset.showBoat === 'true' && boatMotion?.beginElement) {
        const boat = map.querySelector('.fora-route-map__boat');
        boat?.classList.add('is-moving');
        boatMotion.beginElement();
      }
      const timer = window.setTimeout(() => {
        completionTimers.delete(timer);
        map.classList.add('is-complete');
      }, drawDuration);
      completionTimers.add(timer);
    });
  }, { threshold: [0, 0.2, 0.5, 1] });

  const nativeDisconnect = observer.disconnect.bind(observer);
  observer.disconnect = () => {
    completionTimers.forEach((timer) => window.clearTimeout(timer));
    completionTimers.clear();
    nativeDisconnect();
  };

  pendingMaps.forEach((map) => {
    observer.observe(map);
  });
  return observer;
}
