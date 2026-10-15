// Independent photographs supplied with the design package. No page artwork is used as UI.
const photo = name => `assets/device-design-assets/images/${name}.png`;
export const PHOTO = Object.freeze({
  hero: 'assets/hero-clean-base.png',
  heroRoutes: 'assets/native-hero-rotalar-v1.png',
  heroFleet: 'assets/native-hero-filo-v1.png',
  heroExperiences: 'assets/native-hero-deneyimler-v1.png',
  cove: photo('ca40e141031e3cf8010f'),
  boat: photo('339c8a1e8198842fcc7f'),
  boat2: photo('98dc79c0fee4fdb9b14d'),
  boat3: photo('c99b655f9f324400f984'),
  cabin: photo('91b716151f45e7c3d92a'),
  saloon: photo('2f526deddee5006eccf3'),
  deck: photo('a0e7ca86c29121f2f4e7'),
  family: photo('801af00a1f876234ffc4'),
  swimmer: photo('3ba42991d5da4bc676fb'),
  sunset: photo('1108a6975deea6b4dfee'),
  sunsetWine: photo('a1b9d9776943aaa37574'),
  sunsetWoman: 'assets/native-sunset-woman-v1.png',
  kekova: photo('511585c00a0bd5f5873e'),
  greek: photo('8312360b16906574fada'),
  marmaris: photo('b49f059dfe5bd8955a8a'),
  aerial: photo('f0fab493786f234da45a'),
});

export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

export function media(ctx, binding, key = 'hero', className = '', alt = '') {
  const fallback = PHOTO[key] || key || PHOTO.hero;
  const value = binding ? ctx.get(binding, fallback) : fallback;
  const src = ctx.asset(value || fallback);
  return `<img class="${escapeHTML(className)}"${binding ? ` data-cms-binding="${escapeHTML(binding)}"` : ''} src="${escapeHTML(src)}" alt="${escapeHTML(alt)}" loading="lazy" decoding="async">`;
}
