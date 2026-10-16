// Independent photographs supplied with the design package. No page artwork is used as UI.
const photo = name => `assets/device-design-assets/images/${name}.png`;
export const PHOTO = Object.freeze({
  hero: 'assets/hero-clean-base.png',
  heroAbout: 'assets/native-hero-about-v113.webp',
  heroContact: 'assets/native-hero-contact-v113.webp',
  aboutSide: 'assets/native-about-side-v2.webp',
  aboutTogether: 'assets/native-about-together-v2.webp',
  guletDeck: 'assets/native-gulet-deck-v2.webp',
  guletCove: 'assets/native-gulet-cove-source140.webp',
  guletCabin: 'assets/native-gulet-cabin-source140.webp',
  contactCta: 'assets/native-contact-cta-v2.webp',
  contactSunset: 'assets/native-contact-sunset-v2.webp',
  homeBodrum: 'assets/native-home-route-bodrum-v3.webp',
  homeMarmaris: 'assets/native-home-route-marmaris-v3.webp',
  homeKekova: 'assets/native-home-route-kekova-v3.webp',
  homeGocek: 'assets/native-home-route-gocek-v3.webp',
  routeStory: 'assets/native-route-story-v2.webp',
  routeInset: 'assets/native-route-inset-v2.webp',
  routeCove: 'assets/native-route-cove-v2.webp',
  routeHighlightCove: 'assets/native-route-cove-source140.webp',
  routeSunset: 'assets/native-route-sunset-source140.webp',
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
  heroRouteDetail: 'assets/native-hero-route-source146.webp',
  heroGuletDetail: 'assets/native-hero-gulet-source146.webp',
  experiencesPlan: 'assets/native-experience-plan-source146.webp',
  experiencesStory: 'assets/native-experience-story-source147.webp',
  experiencesWine: 'assets/native-experience-wine-web-source148.webp',
  experiencesFamily: 'assets/native-experience-family-web-source148.webp',
  experiencesPrivate: 'assets/native-experience-private-web-source148.webp',
  experiencesSwimmer: 'assets/native-experience-swimmer-web-source148.webp',
  homeStorySwimmer: 'assets/native-home-story-swimmer-source148.webp',
  routesPlanning: 'assets/native-routes-planning-source147.webp',
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

// Supplied desktop crops and the wide mobile crops show the same default boats.
// A CMS replacement bypasses these defaults, so one image edit updates every view.
const fleetDesktopCrops = Object.freeze({
  'assets/native-fleet-eylul-v3.webp': 'assets/native-fleet-eylul-source.webp',
  'assets/native-fleet-ata-v3.webp': 'assets/native-fleet-ata-source.webp',
  'assets/native-fleet-miss-2-v3.webp': 'assets/native-fleet-miss-2-source.webp',
});
const fleetMobileCrops = Object.freeze({
  'assets/native-fleet-eylul-v3.webp': 'assets/native-fleet-eylul-mobile-source121.webp',
  'assets/native-fleet-ata-v3.webp': 'assets/native-fleet-ata-mobile-source121.webp',
  'assets/native-fleet-miss-2-v3.webp': 'assets/native-fleet-miss-2-mobile-source121.webp',
  'assets/native-fleet-zel-v3.webp': 'assets/native-fleet-zel-mobile-source121.webp',
  'assets/native-fleet-getaway-v3.webp': 'assets/native-fleet-getaway-mobile-source121.webp',
});
export function fleetArtwork(ctx, value, markup, { mobile = false, canonicalEdit = false } = {}) {
  if (canonicalEdit) return markup;
  const desktop = fleetDesktopCrops[value];
  const phone = mobile ? fleetMobileCrops[value] : '';
  if (!desktop && !phone) return markup;
  const sources = (desktop ? `<source media="(min-width: 761px)" srcset="${escapeHTML(ctx.asset(desktop))}">` : '')
    + (phone ? `<source media="(max-width: 760px)" srcset="${escapeHTML(ctx.asset(phone))}">` : '');
  return `<picture style="display:contents">${sources}${markup}</picture>`;
}

// Home uses its own supplied photo angles. A canonical CMS image replaces both
// these presentation crops and the fleet-page photo through one shared field.
const homeFleetCrops = Object.freeze({
  [PHOTO.boat]: ['assets/native-home-fleet-eylul-web-source161.webp', 'assets/native-home-fleet-eylul-mobile-source161.webp'],
  [PHOTO.boat2]: ['assets/native-home-fleet-ata-web-source161.webp', 'assets/native-home-fleet-ata-mobile-source161.webp'],
  [PHOTO.boat3]: ['assets/native-home-fleet-miss-2-web-source161.webp'],
  [PHOTO.fleetZel]: ['assets/native-home-fleet-zel-web-source161.webp'],
  [PHOTO.fleetGetaway]: ['assets/native-home-fleet-getaway-web-source161.webp'],
});
export function homeFleetArtwork(ctx, value, markup, { canonicalEdit = false } = {}) {
  if (canonicalEdit) return markup;
  const crops = homeFleetCrops[value];
  if (!crops) return markup;
  return `<picture style="display:contents"><source media="(min-width:761px)" srcset="${escapeHTML(ctx.asset(crops[0]))}"><source media="(max-width:760px)" srcset="${escapeHTML(ctx.asset(crops[1] || crops[0]))}">${markup}</picture>`;
}

// These photo-only bands preserve the corrected mobile source pixels. A custom
// CMS image uses the same new source on desktop and mobile without another field.
const routeMobileCrops = Object.freeze({
  'assets/native-route-bodrum-gokova-v2.webp': 'assets/native-route-bodrum-gokova-mobile-source115.webp',
  'assets/native-route-marmaris-datca-v2.webp': 'assets/native-route-marmaris-datca-mobile-source115.webp',
  'assets/native-route-kemer-kekova-v2.webp': 'assets/native-route-kemer-kekova-mobile-source115.webp',
  'assets/native-route-marmaris-fethiye-v2.webp': 'assets/native-route-marmaris-fethiye-mobile-source115.webp',
  'assets/native-route-gocek-fethiye-v2.webp': 'assets/native-route-gocek-fethiye-mobile-source115.webp',
  'assets/native-route-bodrum-yunan-adalari-v2.webp': 'assets/native-route-bodrum-yunan-adalari-mobile-source115.webp',
});
export function routeArtwork(ctx, value, markup, { canonicalEdit = false } = {}) {
  if (canonicalEdit) return markup;
  const mobile = routeMobileCrops[value];
  if (!mobile) return markup;
  return `<picture style="display:contents"><source media="(max-width: 760px)" srcset="${escapeHTML(ctx.asset(mobile))}">${markup}</picture>`;
}

// Photo-only crops from the supplied home design. A CMS replacement remains
// a single shared value and bypasses the default presentation crops.
const homeRouteCrops = Object.freeze({
  'assets/native-home-route-bodrum-v3.webp': ['assets/native-home-route-bodrum-gokova-web-source128.webp', 'assets/native-home-route-bodrum-gokova-mobile-source128.webp'],
  'assets/native-home-route-marmaris-v3.webp': ['assets/native-home-route-marmaris-datca-web-source128.webp', ''],
  'assets/native-home-route-kekova-v3.webp': ['assets/native-home-route-kemer-kekova-web-source128.webp', ''],
  'assets/native-home-route-gocek-v3.webp': ['assets/native-home-route-gocek-fethiye-web-source128.webp', ''],
});
export function homeRouteArtwork(ctx, value, markup, { canonicalEdit = false } = {}) {
  if (canonicalEdit) return markup;
  const crops = homeRouteCrops[value];
  if (!crops) return markup;
  const sources = `<source media="(min-width: 761px)" srcset="${escapeHTML(ctx.asset(crops[0]))}">`
    + (crops[1] ? `<source media="(max-width: 760px)" srcset="${escapeHTML(ctx.asset(crops[1]))}">` : '');
  return `<picture style="display:contents">${sources}${markup}</picture>`;
}

const experienceMobileCrops = Object.freeze({
  'assets/native-experience-family-web-source148.webp':'assets/native-experience-family-mobile-source148.webp',
  'assets/native-experience-private-web-source148.webp':'assets/native-experience-private-mobile-source148.webp',
  'assets/native-experience-wine-web-source148.webp':'assets/native-experience-wine-mobile-source148.webp',
  'assets/native-experience-swimmer-web-source148.webp':'assets/native-experience-swimmer-mobile-source148.webp',
});
export function experienceArtwork(ctx, value, markup, { canonicalEdit = false } = {}) {
  if (canonicalEdit) return markup;
  const crop = experienceMobileCrops[value];
  if (!crop) return markup;
  return `<picture style="display:contents"><source media="(max-width: 760px)" srcset="${escapeHTML(ctx.asset(crop))}">${markup}</picture>`;
}

export function media(ctx, binding, key = 'hero', className = '', alt = '') {
  const fallback = key === '' ? '' : PHOTO[key] || key || PHOTO.hero;
  const value = binding ? ctx.get(binding, fallback) : fallback;
  if (value === '') return `<span hidden class="${escapeHTML(className)}"${binding ? ` data-cms-binding="${escapeHTML(binding)}"` : ''} aria-hidden="true"></span>`;
  const src = ctx.asset(value ?? fallback);
  return `<img class="${escapeHTML(className)}"${binding ? ` data-cms-binding="${escapeHTML(binding)}"` : ''} src="${escapeHTML(src)}" alt="${escapeHTML(alt)}" loading="lazy" decoding="async">`;
}
