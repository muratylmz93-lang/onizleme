import { escapeHTML } from './site-assets.js?v=20261016-246';

const esc = escapeHTML;
const view = { width: 760, height: 220 };
const mapLayouts = {
  home: {
    path: 'M 45 100 C 90 8 180 12 190 78 C 200 146 270 112 305 155 C 350 206 385 127 430 146 C 482 163 472 198 535 194 C 590 190 655 181 700 208',
    points: [{ x: 253, y: 62 }, { x: 485, y: 129 }, { x: 700, y: 218 }],
  },
  detail: {
    path: 'M 38 136 C 100 32 160 61 220 111 S 328 174 392 139 S 463 171 520 162 S 595 102 655 120 S 694 149 722 137',
    points: [{ x: 38, y: 136 }, { x: 392, y: 139 }, { x: 722, y: 137 }],
  },
};
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

/** Render a small native route diagram; labels remain real HTML text. */
export function renderRouteMap(ctx = {}, { id, stops, duration = 1600, showBoat = false, variant = '', background = '' } = {}) {
  const cleanStops = normalizeStops(stops);
  if (!cleanStops.length) return '';

  const mapId = safeId(id);
  const layout = mapLayouts[mapId.startsWith('home-') ? 'home' : 'detail'];
  const routePath = layout.path;
  const pathId = `route-path-${mapId}`;
  const durationMs = Math.max(1, Number(duration) || 1600);
  const assetUrl = (path) => esc(typeof ctx?.asset === 'function' ? ctx.asset(path) : path);
  const mapVariant = variant === 'detail' ? 'detail' : 'default';
  const backgroundStyle = mapVariant === 'detail' && background
    ? ` style="--route-map-background:url(&quot;${assetUrl(background)}&quot;)"`
    : '';
  const pins = cleanStops.map((stop, index) => {
    const point = layout.points[Math.min(index, layout.points.length - 1)];
    const x = (point.x / view.width) * 100;
    const y = (point.y / view.height) * 100;
    return `<li class="fora-route-map__stop" style="--stop-x:${x.toFixed(2)}%;--stop-y:${y.toFixed(2)}%;--stop-delay:${index * 250}ms"><svg class="fora-route-map__pin" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M12 2.5c-4.5 0-7.5 3.1-7.5 7.2 0 5.1 7.5 11.8 7.5 11.8s7.5-6.7 7.5-11.8c0-4.1-3-7.2-7.5-7.2zm0 4.3a3.1 3.1 0 1 1 0 6.2 3.1 3.1 0 0 1 0-6.2z"></path></svg><span class="fora-route-map__label">${esc(stop.label)}</span></li>`;
  }).join('');
  const boat = showBoat ? `<g class="fora-route-map__boat" aria-hidden="true"><animateMotion class="fora-route-map__boat-motion" begin="indefinite" dur="1800ms" fill="freeze" rotate="auto"><mpath href="#${pathId}"></mpath></animateMotion><g class="fora-route-map__boat-glyph" transform="scale(.8)"><path d="M5-68 27-17 5-19ZM-2-62-24-19-3-21ZM-32-8 0-12 32-8 24-2-22-2Z"></path><path class="fora-route-map__mast" d="M2-74V-13"></path></g></g>` : '';
  const departure = mapId.startsWith('home-') ? '<path class="fora-route-map__departure" transform="translate(33 108)" fill-rule="evenodd" d="M12 2.5c-4.5 0-7.5 3.1-7.5 7.2 0 5.1 7.5 11.8 7.5 11.8s7.5-6.7 7.5-11.8c0-4.1-3-7.2-7.5-7.2zm0 4.3a3.1 3.1 0 1 1 0 6.2 3.1 3.1 0 0 1 0-6.2z"></path>' : '';

  return `<div class="fora-route-map" data-route-map data-route-map-variant="${mapVariant}"${backgroundStyle} data-route-map-id="${esc(mapId)}" data-motion-duration="${durationMs}" data-show-boat="${showBoat ? 'true' : 'false'}" role="group" aria-label="Rota: ${esc(cleanStops.map((stop) => stop.label).join(' → '))}"><svg class="fora-route-map__drawing" viewBox="0 0 ${view.width} ${view.height}" preserveAspectRatio="none" aria-hidden="true"><path class="fora-route-map__track" d="${routePath}"></path><path id="${pathId}" class="fora-route-map__path" d="${routePath}"></path>${departure}${boat}</svg><ol class="fora-route-map__stops">${pins}</ol></div>`;
}

/** Animate each route once when at least 20% of it enters the viewport. */
export function initRouteMaps(root = document, { shouldReduceMotion, subscribeMotionChange } = {}) {
  const descendants = root.querySelectorAll ? [...root.querySelectorAll('[data-route-map]')] : [];
  const maps = [...(root.matches?.('[data-route-map]') ? [root] : []), ...descendants];
  if (!maps.length) return null;

  const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const reduce = () => (preference?.matches ?? false) || shouldReduceMotion?.() === true;
  const parkBoat = (map) => {
    const path = map.querySelector('.fora-route-map__path');
    const boat = map.querySelector('.fora-route-map__boat');
    if (!path || !boat || map.dataset.showBoat !== 'true') return;
    if (boat.classList.contains('is-moving')) {
      const motion = boat.querySelector('animateMotion');
      motion?.setAttribute('fill', 'remove'); motion?.endElement?.();
    }
    boat.classList.remove('is-moving');
    const mobile = window.matchMedia?.('(max-width: 760px)').matches ?? false;
    const point = path.getPointAtLength(!mobile && !reduce() && startedMapIds.has(map.dataset.routeMapId) ? path.getTotalLength() : 0);
    boat.setAttribute('transform', `translate(${point.x} ${point.y})`);
    boat.classList.add('is-parked');
  };

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
    parkBoat(map);
  };

  const reduced = reduce();
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
      if (reduce()) { makeStatic(map); return; }
      const mapId = map.dataset.routeMapId;
      if ((mapId && startedMapIds.has(mapId)) || map.dataset.routeMapStarted === 'true') {
        makeStatic(map);
        return;
      }
      if (mapId) startedMapIds.add(mapId);
      map.dataset.routeMapStarted = 'true';

      const path = map.querySelector('.fora-route-map__path');
      const mobile = window.matchMedia?.('(max-width: 760px)').matches ?? false;
      const configured = Number(map.dataset.motionDuration) || 1600;
      const drawDuration = mobile ? Math.min(configured, 950) : configured;
      if (path) {
        const length = path.getTotalLength();
        path.style.setProperty('--path-length', `${length}px`);
        path.style.setProperty('--draw-duration', `${drawDuration}ms`);
        requestAnimationFrame(() => path.classList.add('is-drawn'));
      }

      const stops = [...map.querySelectorAll('.fora-route-map__stop')];
      stops.forEach((stop, index) => {
        stop.style.setProperty('--stop-delay', `${Math.round(index * drawDuration / Math.max(1, stops.length - 1))}ms`);
        stop.classList.add('is-visible');
      });
      const boatMotion = map.querySelector('.fora-route-map__boat-motion');
      if (mobile) parkBoat(map);
      if (!mobile && map.dataset.showBoat === 'true' && boatMotion?.beginElement) {
        const boat = map.querySelector('.fora-route-map__boat');
        boat?.removeAttribute('transform'); boat?.classList.remove('is-parked');
        boatMotion.setAttribute('fill', 'freeze');
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
  const reduceChanged = () => { if (reduce()) maps.forEach(makeStatic); };
  preference?.addEventListener?.('change', reduceChanged);
  const unsubscribeMotion = subscribeMotionChange?.(reduceChanged);
  observer.disconnect = () => {
    completionTimers.forEach((timer) => window.clearTimeout(timer));
    completionTimers.clear();
    preference?.removeEventListener?.('change', reduceChanged);
    unsubscribeMotion?.();
    nativeDisconnect();
  };

  pendingMaps.forEach((map) => {
    observer.observe(map);
  });
  return observer;
}
