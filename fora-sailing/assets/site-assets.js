// Independent photographs supplied with the design package. No page artwork is used as UI.
const photo = name => `assets/device-design-assets/images/${name}.png`;
export const PHOTO = Object.freeze({
  hero: 'assets/hero-clean-base.png',
  aboutSide: 'assets/native-about-side-v2.webp',
  aboutTogether: 'assets/native-about-together-v2.webp',
  guletDeck: 'assets/native-gulet-deck-v2.webp',
  contactCta: 'assets/native-contact-cta-v2.webp',
  contactSunset: 'assets/native-contact-sunset-v2.webp',
  homeBodrum: 'assets/native-home-route-bodrum-v3.webp',
  homeMarmaris: 'assets/native-home-route-marmaris-v3.webp',
  homeKekova: 'assets/native-home-route-kekova-v3.webp',
  homeGocek: 'assets/native-home-route-gocek-v3.webp',
  routeStory: 'assets/native-route-story-v2.webp',
  routeInset: 'assets/native-route-inset-v2.webp',
  routeCove: 'assets/native-route-cove-v2.webp',
  fleetQuote: 'assets/native-fleet-quote-v2.webp',
  storyCove: 'assets/native-story-cove-v2.webp',
  routeSea: 'assets/native-route-sea-v2.webp',
  benefitCoast: 'assets/native-benefit-coast-v2.webp',
  reviewAvatar: 'assets/native-review-avatar-v1.webp',
  reviewCoast: 'assets/native-review-coast-v2.webp',
  reviewLunch: 'assets/native-review-lunch-v2.webp',
  reviewCove: 'assets/native-review-cove-v2.webp',
  fleetZel: 'assets/native-fleet-zel-v3.webp',
  fleetGetaway: 'assets/native-fleet-getaway-v3.webp',
  routeBodrum: 'assets/native-route-bodrum-gokova-v2.webp',
  routeMarmaris: 'assets/native-route-marmaris-datca-v2.webp',
  routeKekova: 'assets/native-route-kemer-kekova-v2.webp',
  routeMarmarisFethiye: 'assets/native-route-marmaris-fethiye-v2.webp',
  routeGocek: 'assets/native-route-gocek-fethiye-v2.webp',
  routeGreek: 'assets/native-route-bodrum-yunan-adalari-v2.webp',
  heroRoutes: 'assets/native-hero-rotalar-v1.webp',
  heroFleet: 'assets/native-hero-filo-v1.webp',
  heroExperiences: 'assets/native-hero-deneyimler-v1.webp',
  cove: photo('ca40e141031e3cf8010f'),
  boat: 'assets/native-fleet-eylul-v3.webp',
  boat2: 'assets/native-fleet-ata-v3.webp',
  boat3: 'assets/native-fleet-miss-2-v3.webp',
  cabin: 'assets/native-gallery-cabin-v2.webp',
  cabin2: 'assets/native-gallery-cabin2-v2.webp',
  dining: 'assets/native-gallery-dining-v2.webp',
  saloon: 'assets/native-gallery-saloon-v2.webp',
  deck: 'assets/native-gallery-deck-v2.webp',
  family: photo('801af00a1f876234ffc4'),
  swimmer: photo('3ba42991d5da4bc676fb'),
  sunset: photo('1108a6975deea6b4dfee'),
  sunsetWine: photo('a1b9d9776943aaa37574'),
  sunsetWoman: 'assets/native-sunset-woman-v1.webp',
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
