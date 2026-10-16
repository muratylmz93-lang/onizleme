/** Native motion preferences. OS reduction is mandatory, including legacy false values. */
export function createMotionPreferences231(motion = {}) {
  const os = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  const listeners = new Set();
  let alive = true;
  const reduced = () => os.matches || motion?.scrollAnimations === false || (mobile.matches && motion?.reduceMotionMobile === true);
  const update = () => {
    if (!alive) return;
    document.documentElement.dataset.nativeReducedMotion = String(reduced());
    listeners.forEach(listener => listener());
  };
  os.addEventListener('change', update);
  mobile.addEventListener('change', update);
  update();
  return {
    reduced,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      alive = false;
      os.removeEventListener('change', update);
      mobile.removeEventListener('change', update);
      listeners.clear();
      delete document.documentElement.dataset.nativeReducedMotion;
    },
  };
}
