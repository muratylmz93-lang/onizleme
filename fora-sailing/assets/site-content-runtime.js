import { normalizeNativeContent } from './site-native-content.js?v=20261016-160';

const DEFAULT_API_URL = '/api/public/content';
const DEFAULT_STATIC_URL = '/assets/cms-public.json';
const POLL_INTERVAL_MS = 5000;
const CONTENT_PREVIEW_MESSAGE = 'FORA_CMS_PREVIEW';
const CONTENT_PREVIEW_CLEAR_MESSAGE = 'FORA_CMS_PREVIEW_CLEAR';
let analyticsLoadedId = '';

function isPreviewEnvironment(options = {}) {
  if (options.previewOnly === true) return true;
  const win = options.window || (typeof window !== 'undefined' ? window : null);
  const loc = options.location || win?.location || (typeof location !== 'undefined' ? location : null);
  if (!loc) return true;
  const query = new URLSearchParams(loc.search || '');
  return query.get('cmsPreview') === '1' || /(?:^|\/)site(?:\/|$)/.test(loc.pathname || '') || /localhost|127\.0\.0\.1|preview|onizleme/i.test(loc.hostname || '');
}

function maybeEnableAnalytics(content, options = {}) {
  const win = options.window || (typeof window !== 'undefined' ? window : null);
  const doc = options.document || win?.document || (typeof document !== 'undefined' ? document : null);
  const loc = options.location || win?.location || (typeof location !== 'undefined' ? location : null);
  if (!win || !doc || !loc || isPreviewEnvironment({ ...options, window: win, location: loc })) return false;
  const hostname = String(loc.hostname || '').toLowerCase();
  if (hostname !== 'forasailing.com' && !hostname.endsWith('.forasailing.com')) return false;
  const seo = content?.settings?.seo || {};
  const id = String(seo.measurementId || '').trim();
  if (seo.analyticsConsent !== true || win.ForaAnalyticsConsent !== true || !/^G-[A-Z0-9]+$/i.test(id) || analyticsLoadedId === id) return false;
  analyticsLoadedId = id;
  win.dataLayer = win.dataLayer || [];
  win.gtag = win.gtag || function(){ win.dataLayer.push(arguments); };
  win.gtag('consent', 'default', { analytics_storage: 'denied' });
  win.gtag('consent', 'update', { analytics_storage: 'granted' });
  win.gtag('js', new Date());
  win.gtag('config', id, { send_page_view: true });
  if (!doc.querySelector(`script[data-fora-analytics="${id}"]`)) {
    const script = doc.createElement('script');
    script.async = true;
    script.dataset.foraAnalytics = id;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    doc.head.append(script);
  }
  if (!doc.documentElement.dataset.foraAnalyticsListener) {
    doc.documentElement.dataset.foraAnalyticsListener = 'true';
    doc.addEventListener('click', event => {
      const target = event.target?.closest?.('a,button');
      if (!target || typeof win.gtag !== 'function') return;
      if (!target.matches('.pill,.hero-offer,.hero-whatsapp,.nav-offer,.nav-wa,[data-cms-cta]')) return;
      win.gtag('event', 'cta_click', { page_path: loc.pathname, cta_id: target.dataset.cmsCta || target.className || target.getAttribute('aria-label') || 'cta' });
    }, { passive: true });
  }
  return true;
}

export function trackEvent(eventName, parameters = {}, options = {}) {
  const win = options.window || (typeof window !== 'undefined' ? window : null);
  if (!win || typeof win.gtag !== 'function' || !/^[a-z][a-z0-9_]{0,39}$/i.test(String(eventName || ''))) return false;
  win.gtag('event', String(eventName), { page_path: win.location?.pathname || '/', ...parameters });
  return true;
}

function asContentRecord(payload, source) {
  const content = payload?.content && typeof payload.content === 'object' ? payload.content : payload;
  if (!content || typeof content !== 'object' || !Array.isArray(content.pages)) {
    throw new Error('CMS içeriği geçerli değil.');
  }
  return {
    content,
    revision: Number.isFinite(Number(payload?.revision)) ? Number(payload.revision) : Number(content.revision) || 0,
    publishedAt: typeof payload?.publishedAt === 'string' ? payload.publishedAt : null,
    source,
  };
}

function findPage(content, key) {
  if (!key) return null;
  const normalized = String(key).replace(/\/+$/, '') || '/';
  return (content?.pages || []).find(page => {
    const path = String(page.path || '/').replace(/\/+$/, '') || '/';
    return path === normalized || page.id === key;
  }) || null;
}

function collectBindings(content) {
  const bindings = new Map();
  for (const page of content?.pages || []) {
    for (const section of page.sections || []) {
      for (const field of section.fields || []) {
        if (!field?.binding || field.layerOnly || String(field.binding).includes('.device.') || bindings.has(field.binding)) continue;
        // Device overrides are legacy input only. New site rendering always reads value.
        bindings.set(field.binding, field.value);
      }
    }
  }
  return bindings;
}

function normalizeBasePath(value) {
  const base = String(value || '/').trim();
  if (!base.startsWith('/') || base.startsWith('//')) return '/';
  const clean = base.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  return clean.endsWith('/') ? clean : `${clean}/`;
}

function inferBasePath(options = {}) {
  if (options.basePath) return normalizeBasePath(options.basePath);
  if (typeof document !== 'undefined') {
    const configured = document.querySelector('meta[name="fora-cms-site-base"]')?.content;
    if (configured) return normalizeBasePath(configured);
  }
  const path = typeof location !== 'undefined' ? location.pathname : '/';
  const marker = path.search(/\/(?:rotalar|filo|deneyimler|hakkimizda|iletisim)(?:\/|$)/);
  if (marker > 0) return normalizeBasePath(path.slice(0, marker));
  return '/';
}

function resolveSiteUrl(value, basePath, origin) {
  const input = String(value ?? '').trim();
  if (!input) return '';
  if (/^(?:https?:|mailto:|tel:|data:|blob:|#)/i.test(input)) return input;
  if (input.startsWith('//') || input.startsWith('\\')) return '#';
  const safe = input.replace(/\\/g, '/').replace(/^\/+/, '');
  const result = new URL(safe, `${origin}${basePath}`);
  if (result.origin !== origin || !result.pathname.startsWith(basePath)) return '#';
  return `${result.pathname}${result.search}${result.hash}`;
}

export function createContentContext(content, options = {}) {
  const normalizedContent = options.normalizeNative === false ? content : normalizeNativeContent(content);
  const bindings = collectBindings(normalizedContent);
  const basePath = inferBasePath(options);
  const origin = options.origin || (typeof location !== 'undefined' ? location.origin : 'http://localhost');
  const loc = options.location || options.window?.location || (typeof location !== 'undefined' ? location : null);
  const includeDraft = options.includeDraft === true || options.previewFrame === true || new URLSearchParams(loc?.search || '').get('cmsPreview') === '1';
  const collections = {
    routes: sortedCollection(normalizedContent?.routes, includeDraft),
    gulets: sortedCollection(normalizedContent?.gulets, includeDraft),
    experiences: sortedCollection(normalizedContent?.experiences, includeDraft),
  };

  return {
    content: normalizedContent,
    collections,
    basePath,
    get(binding, fallback = '') {
      if (!binding || !bindings.has(binding)) return fallback;
      const value = bindings.get(binding);
      return value === undefined || value === null ? fallback : value;
    },
    asset(path) {
      const input = String(path ?? '').trim();
      if (!input) return '';
      if (/^(?:https?:|data:|blob:)/i.test(input)) return input;
      if (input.startsWith('//') || input.startsWith('\\')) return '';
      if (input.startsWith('/media/')) return input;
      if (input.startsWith('/')) {
        const absolute = new URL(input, origin);
        if (absolute.origin === origin && absolute.pathname.startsWith(basePath)) return absolute.pathname + absolute.search + absolute.hash;
      }
      const normalized = input.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^(?:\.\/)+/, '');
      const result = new URL(normalized, `${origin}${basePath}`);
      if (result.origin !== origin || !result.pathname.startsWith(basePath)) return '';
      return `${result.pathname}${result.search}${result.hash}`;
    },
    url(route) {
      return resolveSiteUrl(route, basePath, origin);
    },
  };
}

function sortedCollection(items, includeDraft = false) {
  if (!Array.isArray(items)) return [];
  const visible = includeDraft ? items : items.filter(item => item?.published !== false && item?.isPublished !== false && item?.isDraft !== true && String(item?.status || '').toLowerCase() !== 'draft');
  return [...visible].sort((a, b) => Number(a?.sortOrder ?? a?.order ?? 0) - Number(b?.sortOrder ?? b?.order ?? 0));
}

async function fetchRecord(url, source, fetcher) {
  const response = await fetcher(url, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  if (!response?.ok) throw new Error(`${source} HTTP ${response?.status ?? 'failed'}`);
  return asContentRecord(await response.json(), source);
}

export async function loadContent(options = {}) {
  const fetcher = options.fetcher || globalThis.fetch;
  if (typeof fetcher !== 'function') throw new Error('Fetch API kullanılamıyor.');
  const apiUrl = options.apiUrl || DEFAULT_API_URL;
  const staticUrl = options.staticUrl || DEFAULT_STATIC_URL;
  try {
    return await fetchRecord(apiUrl, 'api', fetcher);
  } catch (apiError) {
    try {
      return await fetchRecord(staticUrl, 'static', fetcher);
    } catch (staticError) {
      staticError.cause = apiError;
      throw staticError;
    }
  }
}

export function subscribeContent(callback, options = {}) {
  if (typeof callback !== 'function') throw new TypeError('İçerik callback fonksiyonu gerekli.');
  const win = options.window || (typeof window !== 'undefined' ? window : null);
  const fetcher = options.fetcher || globalThis.fetch;
  const intervalMs = Math.max(1000, Number(options.intervalMs) || POLL_INTERVAL_MS);
  const previewFrame = options.previewFrame ?? Boolean(win && win.parent !== win && new URLSearchParams(win.location.search).get('cmsPreview') === '1');
  let stopped = false;
  let context = null;
  let lastSignature = '';
  let pollHandle = null;

  const emit = (record, source = record.source) => {
    if (stopped || !record?.content) return;
    const signature = `${record.revision}|${record.publishedAt || ''}|${JSON.stringify(record.content)}`;
    if (signature === lastSignature) return;
    lastSignature = signature;
    context = createContentContext(record.content, options);
    try { callback(context, { revision: record.revision, publishedAt: record.publishedAt, source }); }
    catch (error) { options.onError?.(error); }
  };

  const refresh = async () => {
    if (stopped || previewFrame) return null;
    try {
      const record = await loadContent({ ...options, fetcher });
      emit(record);
      return context;
    } catch (error) {
      options.onError?.(error);
      return context;
    }
  };

  const onMessage = event => {
    if (!win || event.origin !== win.location.origin || event.source !== win.parent) return;
    if (event.data?.type === CONTENT_PREVIEW_MESSAGE && event.data.content) {
      emit(asContentRecord({ content: event.data.content, revision: event.data.revision }, 'preview'), 'preview');
    } else if (event.data?.type === CONTENT_PREVIEW_CLEAR_MESSAGE) {
      lastSignature = '';
      if (previewFrame) void refreshPreviewSource();
      else void refresh();
    }
  };

  const refreshPreviewSource = async () => {
    try {
      const record = await loadContent({ ...options, fetcher });
      emit(record, 'api');
    } catch (error) { options.onError?.(error); }
  };

  win?.addEventListener('message', onMessage);
  const ready = refresh();
  if (win && previewFrame) {
    try { win.parent.postMessage({ type: 'FORA_CMS_PREVIEW_READY' }, win.location.origin); } catch {}
  }
  if (!previewFrame && options.poll !== false) pollHandle = setInterval(() => void refresh(), intervalMs);

  return {
    ready,
    refresh,
    getContext: () => context,
    unsubscribe() {
      stopped = true;
      if (pollHandle !== null) clearInterval(pollHandle);
      win?.removeEventListener('message', onMessage);
    },
  };
}

export function startContentRuntime(callback, options = {}) {
  return subscribeContent(callback, options);
}

export function setupSEO(content, pageKey, options = {}) {
  const doc = options.document || (typeof document !== 'undefined' ? document : null);
  if (!doc) return null;
  const page = findPage(content, pageKey);
  if (!page) return null;
  const seo = page.seo || {};
  const upsert = (selector, create, attribute, value) => {
    let element = doc.head.querySelector(selector);
    if (!element) {
      element = doc.createElement(create);
      const metaIdentity = selector.match(/^meta\[(name|property)="([^"]+)"\]$/);
      if (metaIdentity) element.setAttribute(metaIdentity[1], metaIdentity[2]);
      doc.head.append(element);
    }
    if (value) element.setAttribute(attribute, value);
    else element.removeAttribute(attribute);
    return element;
  };
  const title = seo.title || page.title || doc.title;
  doc.title = title;
  upsert('meta[name="description"]', 'meta', 'content', seo.description || '');
  const previewOnly = isPreviewEnvironment(options);
  const globalSeo = content.settings?.seo || {};
  const mayIndex = !previewOnly && globalSeo.indexable === true && seo.robots !== 'noindex,nofollow';
  const robots = !mayIndex ? 'noindex,nofollow' : (seo.robots || 'index,follow');
  upsert('meta[name="robots"]', 'meta', 'content', robots);
  upsert('meta[property="og:title"]', 'meta', 'content', title);
  upsert('meta[property="og:description"]', 'meta', 'content', seo.description || '');
  upsert('meta[property="og:image"]', 'meta', 'content', seo.ogImage ? createContentContext(content, options).asset(seo.ogImage) : '');
  upsert('meta[name="twitter:card"]', 'meta', 'content', seo.ogImage ? 'summary_large_image' : 'summary');
  const configuredCanonical = seo.canonical || (content.settings?.seo?.siteUrl && page.path ? new URL(page.path, content.settings.seo.siteUrl).href : '');
  let canonical = doc.head.querySelector('link[rel="canonical"]');
  if (configuredCanonical) {
    if (!canonical) { canonical = doc.createElement('link'); canonical.rel = 'canonical'; doc.head.append(canonical); }
    canonical.href = configuredCanonical;
  } else canonical?.remove();
  const verificationCode = String(globalSeo.verificationCode || '').trim();
  upsert('meta[name="google-site-verification"]', 'meta', 'content', /^[A-Za-z0-9_-]{1,128}$/.test(verificationCode) ? verificationCode : '');
  maybeEnableAnalytics(content, options);
  return { page, title, description: seo.description || '', canonical: configuredCanonical, robots };
}

export async function submitInquiry(payload, options = {}) {
  const fetcher = options.fetcher || globalThis.fetch;
  if (typeof fetcher !== 'function') throw new Error('İstek gönderilemiyor.');
  const endpoint = options.endpoint || '/api/public/inquiries';
  const response = await fetcher(endpoint, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  let body = {};
  try { body = await response.json(); } catch {}
  if (!response.ok) {
    const error = new Error(body.message || body.error || `Gönderim başarısız (${response.status}).`);
    error.status = response.status;
    error.code = body.error || null;
    throw error;
  }
  return { ok: true, id: body.id || null, createdAt: body.createdAt || null };
}
