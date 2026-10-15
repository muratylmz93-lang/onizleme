(() => {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const requestedMode = params.get('designViewport');
  const mode = requestedMode === 'web' ? 'desktop' : requestedMode;
  if (!['mobile', 'tablet', 'tv', 'desktop'].includes(mode)) return;

  const mountMeta = document.querySelector('meta[name="fora-cms-site-base"]')?.content;
  const siteBase = (() => {
    if (mountMeta) return mountMeta.endsWith('/') ? mountMeta : `${mountMeta}/`;
    const pathname = window.location.pathname;
    const siteMount = pathname.indexOf('/site/');
    if (siteMount >= 0) return pathname.slice(0, siteMount + 6);
    const route = pathname.match(/^(.*?)(?:rotalar|filo|deneyimler|hakkimizda|iletisim)(?:\/|$)/);
    if (route) return `${route[1] || '/'}`.replace(/\/*$/, '/');
    if (pathname.endsWith('/')) return pathname;
    return new URL('.', window.location.href).pathname;
  })();

  function preserveMode(anchor) {
    if (!anchor?.hasAttribute('href') || anchor.hasAttribute('download')) return;
    const raw = anchor.getAttribute('href')?.trim();
    if (!raw || raw.startsWith('#') || /^(?:mailto:|tel:|javascript:|data:|blob:)/i.test(raw)) return;

    let url;
    try { url = new URL(raw, window.location.href); } catch { return; }
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== window.location.origin) return;
    const base = siteBase.endsWith('/') ? siteBase : `${siteBase}/`;
    if (!(url.pathname === base.slice(0, -1) || url.pathname.startsWith(base))) return;
    if (url.hash && url.pathname === window.location.pathname) return;
    const lastSegment = url.pathname.split('/').pop() || '';
    if (lastSegment.includes('.') && lastSegment.toLowerCase() !== 'index.html') return;
    if (url.searchParams.get('designViewport') === mode) return;

    url.searchParams.set('designViewport', mode);
    anchor.setAttribute('href', `${url.pathname}${url.search}${url.hash}`);
  }

  function scan(node) {
    if (!(node instanceof Element)) return;
    if (node.matches('a[href]')) preserveMode(node);
    node.querySelectorAll?.('a[href]').forEach(preserveMode);
  }

  scan(document.documentElement);
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') scan(record.target);
      else record.addedNodes.forEach(scan);
    }
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['href']
  });
})();
