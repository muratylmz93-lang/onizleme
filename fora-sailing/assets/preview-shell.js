(() => {
  'use strict';

  const pages = [
    { path: '/', label: 'Ana Sayfa' },
    { path: '/rotalar/', label: 'Rotalar' },
    { path: '/rotalar/gocek-fethiye-gocek/', label: 'Göcek–Fethiye–Göcek' },
    { path: '/filo/', label: 'Gulet Filosu' },
    { path: '/filo/eylul/', label: 'Eylül Guleti' },
    { path: '/deneyimler/', label: 'Deneyimler' },
    { path: '/hakkimizda/', label: 'Hakkımızda' },
    { path: '/iletisim/', label: 'İletişim' }
  ];
  const body = document.body;
  const stage = document.querySelector('[data-preview-stage]');
  const frame = document.querySelector('[data-preview-frame]');
  const picker = document.querySelector('[data-preview-page]');
  const script = document.currentScript;
  if (!body || !stage || !frame || !picker || !script?.src) return;

  const mode = body.dataset.previewMode === 'mobil' ? 'mobil' : 'web';
  const siteBase = new URL('../', script.src);
  const release = new URL(script.src).searchParams.get('v') || '20261015-110';
  const query = new URLSearchParams(location.search);
  const requestedPath = query.get('page') || '/';
  let currentPage = pages.find(page => page.path === requestedPath) || pages[0];

  for (const page of pages) {
    const option = document.createElement('option');
    option.value = page.path;
    option.textContent = page.label;
    option.selected = page === currentPage;
    picker.append(option);
  }

  function updateShareLinks() {
    for (const link of document.querySelectorAll('[data-preview-mode-link]')) {
      const targetMode = link.dataset.previewModeLink;
      const target = new URL(targetMode === 'mobil' ? '../mobil/' : '../web/', location.href);
      if (currentPage.path !== '/') target.searchParams.set('page', currentPage.path);
      target.searchParams.set('v', release);
      link.href = `${target.pathname}${target.search}`;
    }
  }

  function updateFrame(page) {
    const path = page.path.replace(/^\/+/, '');
    const url = new URL(path, siteBase);
    url.searchParams.set('designViewport', mode === 'mobil' ? 'mobile' : 'desktop');
    url.searchParams.set('v', release);
    frame.src = `${url.pathname}${url.search}`;
    frame.title = `Fora Sailing ${mode === 'mobil' ? 'mobil' : 'web'} önizlemesi: ${page.label}`;
  }

  function updateAddress() {
    const next = new URL(location.href);
    if (currentPage.path === '/') next.searchParams.delete('page');
    else next.searchParams.set('page', currentPage.path);
    history.replaceState(null, '', `${next.pathname}${next.search}${next.hash}`);
  }

  function setCurrentPage(page) {
    currentPage = page;
    picker.value = page.path;
    updateAddress();
    updateShareLinks();
  }

  function syncFromFrame() {
    try {
      const child = new URL(frame.contentWindow.location.href);
      if (child.origin !== siteBase.origin || !child.pathname.startsWith(siteBase.pathname)) return;
      let relative = child.pathname.slice(siteBase.pathname.length);
      if (relative.endsWith('index.html')) relative = relative.slice(0, -'index.html'.length);
      const path = relative ? `/${relative.replace(/^\/+/, '').replace(/\/?$/, '/')}` : '/';
      const page = pages.find(candidate => candidate.path === path);
      if (page) setCurrentPage(page);
    } catch {
      // Cross-origin or malformed child locations do not affect the shell route.
    }
  }

  stage.dataset.mode = mode;
  picker.value = currentPage.path;
  frame.addEventListener('load', syncFromFrame);
  updateShareLinks();
  updateFrame(currentPage);

  picker.addEventListener('change', () => {
    const page = pages.find(candidate => candidate.path === picker.value) || pages[0];
    setCurrentPage(page);
    updateFrame(page);
  });
})();
