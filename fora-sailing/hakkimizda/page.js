(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.source-header');
  let previousY = scrollY, direction = 0, directionDistance = 0, headerTimer = 0;
  addEventListener('scroll', () => {
    const y = scrollY, delta = y - previousY, nextDirection = Math.sign(delta);
    if (nextDirection && nextDirection !== direction) { direction = nextDirection; directionDistance = 0; }
    directionDistance += Math.abs(delta);
    if (y < 80) header?.classList.remove('is-hidden');
    else if (directionDistance >= 16) {
      clearTimeout(headerTimer);
      headerTimer = setTimeout(() => header?.classList.toggle('is-hidden', direction > 0), 250);
    }
    previousY = y;
  }, { passive: true });

  const menu = document.querySelector('.mobile-panel');
  const toggle = document.querySelector('.menu-toggle');
  const close = document.querySelector('.panel-close');
  const setMenu = (open) => {
    if (!menu || !toggle) return;
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.toggle('open', open));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    if (!open) setTimeout(() => { menu.hidden = true; }, 350);
  };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  close?.addEventListener('click', () => setMenu(false));
  menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

  document.querySelectorAll('.inquiry-form input,.inquiry-form textarea').forEach((field) => { const sync=()=>field.classList.toggle('has-value',Boolean(field.value));field.addEventListener('input',sync);field.addEventListener('change',sync);sync(); });
  document.querySelectorAll('.inquiry-form select').forEach((select) => {
    const sync = () => select.classList.toggle('has-value', Boolean(select.value));
    select.addEventListener('change', sync);
    sync();
  });
  const form = document.querySelector('#inquiry-form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const message = [
      'Merhaba, mavi yolculuk için teklif almak istiyorum.',
      `Ad Soyad: ${data.get('name')}`, `Telefon: ${data.get('phone')}`,
      `E-posta: ${data.get('email')}`, `Tarih: ${data.get('date')}`,
      `Misafir: ${data.get('guests')}`, `Tercih edilen rota: ${data.get('route')}`,
      `Mesaj: ${data.get('message')}`
    ].join('\n');
    const opened = window.open(`https://wa.me/905496523538?text=${encodeURIComponent(message)}`, '_blank');
    const note = form.querySelector('.form-note');
    if (opened) {
      opened.opener = null;
      note.textContent = 'WhatsApp taslağı hazır. Gönderimi WhatsApp’ta siz tamamlarsınız.';
    } else note.textContent = 'WhatsApp taslağı açılamadı. Lütfen WhatsApp bağlantısını kullanın.';
  });

  let revealObserver;
  const applyMotionPreference = () => {
    revealObserver?.disconnect();
    const nodes = document.querySelectorAll('[data-reveal]');
    if (reduced.matches) {
      document.documentElement.classList.remove('motion-ready');
      nodes.forEach((node) => node.classList.add('is-visible'));
    } else {
      document.documentElement.classList.add('motion-ready');
      revealObserver = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      }), { threshold: 0.2 });
      nodes.forEach((node) => { if (!node.classList.contains('is-visible')) revealObserver.observe(node); });
    }
  };
  applyMotionPreference();
  reduced.addEventListener?.('change', applyMotionPreference);

  const hero = document.querySelector('.hero');
  const heroPhoto = hero?.querySelector('.hero-photo-layer');
  if (hero && heroPhoto) {
    const startPhoto = () => requestAnimationFrame(() => hero.classList.add('photo-ready'));
    if (reduced.matches) hero.classList.add('photo-ready');
    else if (heroPhoto.complete) startPhoto();
    else heroPhoto.addEventListener('load', startPhoto, { once: true });
  }
  const parallaxNodes = [...document.querySelectorAll('[data-parallax]')];
  let parallaxFrame = 0;
  const applyParallax = () => {
    parallaxFrame = 0;
    if (reduced.matches || matchMedia('(max-width: 650px)').matches) {
      parallaxNodes.forEach((node) => node.style.removeProperty('translate'));
      return;
    }
    parallaxNodes.forEach((node) => {
      const rect = node.parentElement.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
      const distance = Number(node.dataset.parallax) || 25;
      node.style.translate = `0 ${(-distance * progress).toFixed(1)}px`;
    });
  };
  const scheduleParallax = () => { if (!parallaxFrame) parallaxFrame = requestAnimationFrame(applyParallax); };
  addEventListener('scroll', scheduleParallax, { passive: true });
  addEventListener('resize', scheduleParallax, { passive: true });
  reduced.addEventListener?.('change', scheduleParallax);
  scheduleParallax();
})();
