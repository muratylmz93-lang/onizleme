// Four mobile detail heroes only. A longer shared CMS title/description can
// enlarge the hero beyond the default photograph's short sea extension.
export function initHeroOverflow226(root) {
  if (!root) return () => {};
  const mobile = matchMedia('(max-width:760px)');
  const media = [...root.querySelectorAll(
    '.fora-detail--about .detail-hero-media,.fora-detail--route .detail-hero-media,' +
    '.fora-detail--gulet .detail-hero-media,.fora-detail--contact .detail-hero-media'
  )].map(parent => ({parent,image:parent.querySelector(':scope > img[data-source-hero-fit="true"]')}))
    .filter(row => row.image);
  if (!media.length) return () => {};
  let alive = true, frame = 0;
  const update = () => {
    frame = 0;
    if (!alive) return;
    for (const {parent,image} of media) {
      const width = parent.getBoundingClientRect().width;
      const percent = parseFloat(getComputedStyle(parent).getPropertyValue('--hero216-width'));
      // Never read the rendered image height: the cover override changes it.
      // Intrinsic dimensions + the original216 percentage keep this stable.
      const naturalHeight = width * percent / 100 * image.naturalHeight / image.naturalWidth;
      const overflow = mobile.matches && image.dataset.sourceHeroFit === 'true'
        && width > 0 && Number.isFinite(naturalHeight)
        && parent.getBoundingClientRect().height > naturalHeight + width * .15;
      if (overflow) parent.dataset.sourceHeroOverflow = 'true';
      else parent.removeAttribute('data-source-hero-overflow');
    }
  };
  const schedule = () => { if (alive && !frame) frame = requestAnimationFrame(update); };
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
  observer?.observe(root);
  for (const {parent,image} of media) {
    observer?.observe(parent);
    image.addEventListener('load',schedule);
  }
  mobile.addEventListener('change',schedule);
  window.addEventListener('resize',schedule);
  schedule();
  return () => {
    alive = false;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    mobile.removeEventListener('change',schedule);
    window.removeEventListener('resize',schedule);
    for (const {parent,image} of media) {
      image.removeEventListener('load',schedule);
      parent.removeAttribute('data-source-hero-overflow');
    }
  };
}
