export function initHomeVideo217(root, { shouldReduceMotion = () => false, subscribeMotionChange } = {}) {
  const video = root?.querySelector('.home-hero-video[data-video-src]');
  if (!video) return () => {};

  const hero = video.closest('.home-hero');
  const image = hero?.querySelector('img.home-hero-photo');
  const maskSource = image?.closest('picture') || image;
  if (maskSource && typeof getComputedStyle === 'function') {
    const mask = getComputedStyle(maskSource);
    for (const [property, value] of [
      ['mask-image', mask.maskImage], ['mask-size', mask.maskSize], ['mask-position', mask.maskPosition], ['mask-repeat', mask.maskRepeat],
      ['-webkit-mask-image', mask.webkitMaskImage], ['-webkit-mask-size', mask.webkitMaskSize], ['-webkit-mask-position', mask.webkitMaskPosition], ['-webkit-mask-repeat', mask.webkitMaskRepeat],
    ]) if (value && value !== 'none') video.style.setProperty(property, value);
  }

  let visible = false;
  let alive = true;
  let failed = false;
  const reduced = () => {
    try { return shouldReduceMotion() === true; } catch { return false; }
  };
  const reveal = () => {
    const motionAllowed = alive && !failed && !reduced();
    if (motionAllowed && visible && source && !video.hasAttribute('src')) {
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('src', source);
      video.load();
    }
    const allowed = motionAllowed && visible && document.visibilityState === 'visible' && hero?.classList.contains('hero-ready') && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
    video.classList.toggle('is-ready', allowed);
    if (image && failed) {
      image.classList.add('camera-drift');
      image.classList.toggle('is-playing', visible && !reduced() && document.visibilityState === 'visible');
    } else if (image) {
      image.classList.remove('camera-drift', 'is-playing');
    }
    if (allowed) video.play().catch((error) => {
      if (error?.name === 'AbortError') return;
      fail();
    });
    else video.pause();
  };
  const fail = () => {
    failed = true;
    video.dataset.failed = 'true';
    video.classList.remove('is-ready');
    video.pause();
    reveal();
  };
  const loaded = () => reveal();
  const error = () => fail();
  const heroReady = () => reveal();
  video.addEventListener('loadeddata', loaded);
  video.addEventListener('error', error);
  hero?.addEventListener('fora:hero-ready', heroReady);

  const source = String(video.dataset.videoSrc || '').trim();
  const applyMotionPreference = () => {
    if (!alive) return;
    if (reduced()) {
      video.pause();
      video.classList.remove('is-ready');
      if (video.hasAttribute('src')) {
        video.removeAttribute('src');
        video.load();
      }
      if (image) image.classList.remove('is-playing');
      return;
    }
    reveal();
  };

  const observer = new IntersectionObserver((entries) => {
    visible = Boolean(entries[0]?.isIntersecting);
    reveal();
  }, { threshold: 0 });
  if (hero) observer.observe(hero);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  motion.addEventListener('change', applyMotionPreference);
  const unsubscribeMotion = subscribeMotionChange?.(applyMotionPreference);
  document.addEventListener('visibilitychange', reveal);
  applyMotionPreference();

  return () => {
    alive = false;
    observer.disconnect();
    motion.removeEventListener('change', applyMotionPreference);
    unsubscribeMotion?.();
    document.removeEventListener('visibilitychange', reveal);
    video.removeEventListener('loadeddata', loaded);
    video.removeEventListener('error', error);
    hero?.removeEventListener('fora:hero-ready', heroReady);
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.classList.remove('is-ready');
    if (image) image.classList.remove('camera-drift', 'is-playing');
  };
}
