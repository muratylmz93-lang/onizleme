import { PHOTO, media, escapeHTML, fleetArtwork, routeArtwork, experienceArtwork } from './site-assets.js?v=20261016-160';

const esc = escapeHTML;
const get = (ctx, key, fallback = '') => {
  const result = ctx?.get?.(key, fallback);
  return result == null ? fallback : String(result);
};
const href = (ctx, path) => {
  const raw = String(path || '/iletisim/');
  return /^(https?:|mailto:|tel:|#)/i.test(raw) ? raw : (ctx?.url?.(raw) || raw);
};
const attr = (key) => key ? ` data-cms-binding="${esc(key)}"` : '';
const section = (id, name, html) => `<section class="catalog-section ${esc(name)}" data-section-id="${esc(id)}">${html}</section>`;
const fieldText = (ctx, key, fallback, tag = 'p', cls = '') => `<${tag}${attr(key)}${cls ? ` class="${esc(cls)}"` : ''}>${/^h[1-6]$/.test(tag) ? sourceLines(get(ctx, key, fallback)) : esc(get(ctx, key, fallback)).replace(/\r?\n/g, '<br>')}</${tag}>`;
const link = (ctx, path, label, cls = 'btn btn-gold', key = '', labelKey = '', imageSrc = '') => `<a class="${esc(cls)}"${key ? ` data-cms-href-binding="${esc(key)}"` : ''}${imageSrc ? ` data-image-src="${esc(imageSrc)}"` : ''} href="${esc(href(ctx, path))}"><span${attr(labelKey)}>${esc(label)}</span></a>`;
const cta = (ctx, path, label = 'Teklif Alın', key = '', labelKey = '') => link(ctx, path, label, 'btn btn-gold', key, labelKey);
const rows = (ctx, key) => Array.isArray(ctx?.collections?.[key]) ? ctx.collections[key] : [];
const sourceLines = value => {
  const defaults = {
    'Maviye Açılan Rotalar': 'Maviye\nAçılan Rotalar',
    'Her rota, başka bir hikâye.': 'Her rota,\nbaşka bir hikâye.',
    'Her rota, başka bir hikâye': 'Her rota,\nbaşka bir hikâye',
    'Denizdeki Evinizi Keşfedin': 'Denizdeki\nEvinizi Keşfedin',
    'Bir Tatilden Daha Fazlası': 'Bir Tatilden\nDaha Fazlası',
    'Keşfet. Hisset. Yaşa.': 'Keşfet.\nHisset.\nYaşa.',
    'Size Uygun Guleti Birlikte Seçelim': 'Size Uygun\nGuleti Birlikte Seçelim',
    'Sen hayal et, birlikte planlayalım.': 'Sen hayal et,\nbirlikte planlayalım.',
    'Sakin koylar, berrak sular.': 'Sakin koylar,\nberrak sular.',
    'Doğal güzelliklerin buluşma noktası.': 'Doğal güzelliklerin\nbuluşma noktası.',
    'Tarihi dokularla eşsiz bir yolculuk.': 'Tarihi dokularla\neşsiz bir yolculuk.',
    'Maviyle yeşilin en güzel tonları.': 'Maviyle yeşilin\nen güzel tonları.',
    'Turkuazın bin tonu sizi bekliyor.': 'Turkuazın bin tonu\nsizi bekliyor.',
    'Farklı kültürler, yeni rotalar.': 'Farklı kültürler,\nyeni rotalar.',
  };
  return esc(defaults[value] ?? value).replace(/\r?\n/g, '<br>');
};

function hero(ctx, prefix, title, description, photo, oneButton = false) {
  const offerBinding = `${prefix}.hero.offerUrl`;
  const whatsappBinding = `${prefix}.hero.whatsappUrl`;
  const offer = get(ctx, offerBinding, '/iletisim/');
  const whatsapp = get(ctx, whatsappBinding, 'https://wa.me/905496523538');
  return `<section class="catalog-hero" data-section-id="hero"><div class="catalog-hero__photo">${media(ctx, `${prefix}.hero.image`, photo, 'catalog-hero__image', title)}<span class="catalog-hero__shade" aria-hidden="true"></span></div><div class="catalog-hero__inner container"><div class="catalog-hero__copy">${fieldText(ctx, `${prefix}.hero.eyebrow`, 'EGE VE AKDENİZ’İN EN GÜZEL KOYLARINDA', 'p', 'catalog-eyebrow')}<h1${attr(`${prefix}.hero.title`)}>${sourceLines(get(ctx, `${prefix}.hero.title`, title))}</h1>${fieldText(ctx, `${prefix}.hero.description`, description, 'p', 'catalog-hero__description')}<div class="catalog-hero__actions">${cta(ctx, offer, get(ctx, `${prefix}.hero.ctaLabel`, prefix === 'rotalar' ? 'Rotanı Planla' : 'Teklif Alın'), offerBinding, `${prefix}.hero.ctaLabel`)}${!oneButton ? link(ctx, whatsapp, get(ctx, `${prefix}.hero.whatsappLabel`, 'WhatsApp ile İletişim'), 'btn btn-whatsapp', whatsappBinding, `${prefix}.hero.whatsappLabel`) : ''}</div></div>${fieldText(ctx, `${prefix}.hero.note`, prefix === 'rotalar' ? 'Yeni koylar, yeni hikâyeler…' : prefix === 'filo' ? 'Mavi yolculukta eviniz burada…' : 'Mavi, insana hep iyi gelir…', 'p', 'catalog-hero__note')}</div></section>`;
}

function card(ctx, type, item, i, fallbackPhoto, fallbackPath, kicker = '') {
  const name = item.name ?? item.title ?? `Keşfedin ${i + 1}`;
  const description = item.description ?? item.shortDescription ?? '';
  const catalogPath = type === 'routes' ? '/rotalar/' : type === 'gulets' ? '/filo/' : '';
  const destination = (item.path && item.path !== catalogPath ? item.path : item.inquiryUrl) || fallbackPath;
  const image = item.image ?? fallbackPhoto;
  const rawImg = media(ctx, '', image, 'catalog-card__image', name).replace('<img ', '<img data-cms-property="image" ');
  const artworkOptions = { canonicalEdit: item._canonicalEdits?.image === true };
  const img = type === 'gulets' ? fleetArtwork(ctx, image, rawImg, { ...artworkOptions, mobile: true }) : type === 'routes' ? routeArtwork(ctx, image, rawImg, artworkOptions) : type === 'experiences' ? experienceArtwork(ctx, image, rawImg, artworkOptions) : rawImg;
  return `<article class="catalog-card" data-reveal data-cms-collection="${esc(type)}" data-entity-id="${esc(item.id || '')}"><a class="catalog-card__link" href="${esc(href(ctx, destination))}"><div class="catalog-card__photo">${img}</div><div class="catalog-card__copy">${kicker ? `<span class="catalog-card__kicker">${esc(kicker)}</span>` : ''}<h3 data-cms-property="${type === 'experiences' ? 'title' : 'name'}">${esc(name)}</h3>${description ? `<p data-cms-property="description">${type === 'routes' ? sourceLines(description) : esc(description)}</p>` : ''}${type === 'gulets' ? `<span class="catalog-card__details" data-cms-binding="filo.cards.detailsLabel">${esc(get(ctx, 'filo.cards.detailsLabel', 'Detayları İncele'))}</span>` : ''}<span class="catalog-card__arrow" aria-label="Detayları incele">↗</span></div></a></article>`;
}
function routeFallbacks() { return [
  { id: 'bodrum-gokova', name: 'Bodrum – Gökova', description: 'Sakin koylar, berrak sular.', image: PHOTO.cove, path: '/iletisim/?rota=bodrum-gokova' },
  { id: 'marmaris-datca', name: 'Marmaris – Datça', description: 'Doğal güzelliklerin buluşma noktası.', image: PHOTO.marmaris, path: '/iletisim/?rota=marmaris-datca' },
  { id: 'kemer-kekova', name: 'Kemer – Kekova', description: 'Tarihi dokularla eşsiz bir yolculuk.', image: PHOTO.kekova, path: '/iletisim/?rota=kemer-kekova' },
  { id: 'marmaris-fethiye', name: 'Marmaris – Fethiye', description: 'Maviyle yeşilin en güzel tonları.', image: PHOTO.aerial, path: '/iletisim/?rota=marmaris-fethiye' },
  { id: 'gocek-fethiye', name: 'Göcek – Fethiye', description: 'Turkuazın bin tonu sizi bekliyor.', image: PHOTO.boat, path: '/rotalar/gocek-fethiye-gocek/' },
  { id: 'bodrum-yunan-adalari', name: 'Bodrum – Yunan Adaları', description: 'Farklı kültürler, yeni rotalar.', image: PHOTO.greek, path: '/iletisim/?rota=bodrum-yunan-adalari' },
]; }
function guletFallbacks() { return [
  { id: 'eylul', name: 'Eylül', description: 'Detayları incele', image: PHOTO.boat, capacity: 8, cabins: 4, path: '/filo/eylul/' },
  { id: 'ata', name: 'Ata', description: 'Detayları incele', image: PHOTO.boat2, capacity: 10, cabins: 5, path: '/iletisim/?gulet=ata' },
  { id: 'miss-2', name: 'Miss 2', description: 'Detayları incele', image: PHOTO.boat3, capacity: 8, cabins: 4, path: '/iletisim/?gulet=miss-2' },
  { id: 'zel', name: 'Zel', description: 'Detayları incele', image: PHOTO.aerial, capacity: 10, cabins: 5, path: '/iletisim/?gulet=zel' },
  { id: 'getaway', name: 'Getaway', description: 'Detayları incele', image: PHOTO.deck, capacity: 12, cabins: 6, path: '/iletisim/?gulet=getaway' },
]; }
function experienceFallbacks() { return [
  { id: 'family', title: 'Ailece Mavi Yolculuk', description: 'Sevdiklerinizle birlikte, doğanın kalbinde unutulmaz anlar biriktirin.', image: PHOTO.family, path: '/iletisim/' },
  { id: 'gulet', title: 'Size Özel Gulet Tatili', description: 'Rotanızı, ritminizi ve deneyiminizi sizin isteklerinize göre şekillendirin.', image: PHOTO.boat, path: '/iletisim/' },
  { id: 'sunset', title: 'Güvertede Gün Batımı', description: 'Denizin üzerinde, gün batımının eşsiz renklerine tanıklık edin.', image: PHOTO.sunsetWine, path: '/iletisim/' },
  { id: 'swim', title: 'Koylarda Yüzme Molası', description: 'Turkuaz sularda yüzün, bakir doğayla buluşun.', image: PHOTO.swimmer, path: '/iletisim/' },
]; }

function contentIntro(ctx, prefix, eyebrow, title, description) {
  return `<div class="catalog-intro container"><div class="catalog-intro__copy">${fieldText(ctx, `${prefix}.content.eyebrow`, eyebrow, 'p', 'catalog-eyebrow catalog-eyebrow--ink')}${fieldText(ctx, `${prefix}.content.title`, title, 'h2', 'catalog-title')}${fieldText(ctx, `${prefix}.content.description`, description, 'p', 'catalog-copy')}</div><div class="catalog-intro__art catalog-routes__stamp"><img class="catalog-routes__stamp-image" src="${esc(ctx.asset('assets/compass-stamp.png'))}" alt="" aria-hidden="true">${fieldText(ctx, `${prefix}.content.note`, 'Aynı deniz, farklı güzellikler…', 'p', 'catalog-intro__note')}</div></div>`;
}

function renderRoutes(ctx) {
  const defaults = routeFallbacks();
  const routes = Array.isArray(ctx?.collections?.routes) ? rows(ctx, 'routes') : defaults;
  const cards = routes.map((item, i) => card(ctx, 'routes', item, i, defaults[i % defaults.length].image, '/iletisim/', 'Rota')).join('');
  return `<main class="catalog-routes">${hero(ctx, 'rotalar', 'Maviye Açılan Rotalar', 'Turkuaz koylar, tarihi limanlar ve büyüleyici adalar… Fora Sailing ile Ege ve Akdeniz’in en özel rotalarında mavi bir yolculuğa çıkın.', 'heroRoutes', true)}<section class="catalog-section catalog-routes__intro" data-section-id="content">${contentIntro(ctx, 'rotalar', 'ROTALARIMIZ', 'Her rota, başka bir hikâye.', 'Türkiye’nin en güzel kıyılarında, birbirinden özel rotalarla mavi yolculuğunuzu planlayın. İster sakin koylarda huzur arayın, ister tarihi limanları keşfedin; her rota size unutulmaz bir deneyim sunar.')}<div class="container"><div class="catalog-card-grid catalog-card-grid--routes">${cards}</div></div></section>${section('planning', 'catalog-routes__planning', `${fieldText(ctx, 'rotalar.content.cardsNote', 'Rotalar sizi çağırıyor…', 'p', 'catalog-routes__cards-note')}<div class="catalog-planning"><div class="catalog-planning__photo" aria-hidden="true">${media(ctx, 'rotalar.planning.image', 'sunset', 'catalog-planning__image', 'Mavi yolculukta gün batımı')}</div><div class="catalog-planning__shade" aria-hidden="true"></div><div class="container catalog-planning__inner"><div>${fieldText(ctx, 'rotalar.planning.title', 'Sen hayal et, birlikte planlayalım.', 'h2', 'catalog-planning__title')}${fieldText(ctx, 'rotalar.planning.description', 'Rota önerileri, gulet seçenekleri ve size özel mavi yolculuk planı için bizimle iletişime geçin.', 'p', 'catalog-planning__copy')}${cta(ctx, '/iletisim/', get(ctx, 'rotalar.header.offerLabel', 'Teklif Alın'), '', 'rotalar.header.offerLabel')} ${link(ctx, get(ctx, 'rotalar.header.whatsappUrl', ctx.content.settings?.contact?.whatsapp || 'https://wa.me/905496523538'), get(ctx, 'rotalar.header.whatsappLabel', 'WhatsApp ile İletişim'), 'btn btn-whatsapp', 'rotalar.header.whatsappUrl', 'rotalar.header.whatsappLabel')}</div></div>${fieldText(ctx, 'rotalar.planning.note', 'Mavi yolculuk sizi bekliyor…', 'p', 'catalog-routes__planning-note')}</div>`)}</main>`;
}

function renderFleet(ctx) {
  const defaults = guletFallbacks();
  const gulets = Array.isArray(ctx?.collections?.gulets) ? rows(ctx, 'gulets') : defaults;
  const cards = gulets.map((item, i) => {
    const output = card(ctx, 'gulets', item, i, defaults[i % defaults.length].image, '/iletisim/', 'Gulet');
    const capacity = item.capacity ?? item.guestCapacity ?? defaults[i % defaults.length].capacity;
    const cabins = item.cabins ?? item.cabinCount ?? defaults[i % defaults.length].cabins;
    return output.replace('<span class="catalog-card__arrow"', `<span class="catalog-card__spec" data-cms-property="guestCapacity">${esc(capacity)} misafir</span><span class="catalog-card__cabins" data-cms-property="cabins">${esc(cabins)} kabin</span><span class="catalog-card__arrow"`);
  }).join('');
  return `<main class="catalog-fleet">${hero(ctx, 'filo', 'Denizdeki Evinizi Keşfedin', 'Her biri özel olarak seçilmiş gulet filomuzla, mavi yolculuğu en konforlu haliyle yaşayın.', 'heroFleet')}${section('content', 'catalog-fleet__intro', `<img class="catalog-fleet__compass" src="${esc(ctx.asset('assets/compass-stamp.png'))}" alt="" aria-hidden="true"><div class="container catalog-fleet__intro-grid"><div class="catalog-intro__copy">${fieldText(ctx, 'filo.content.eyebrow', 'GULET FİLOMUZ', 'p', 'catalog-eyebrow catalog-eyebrow--ink')}${fieldText(ctx, 'filo.content.title', 'Tarih ve Misafir Tercihinizi Seçin', 'h2', 'catalog-title')}${fieldText(ctx, 'filo.content.description', 'Sizin için en uygun guleti bulmamıza yardımcı olun. Tarih aralığınızı ve misafir sayınızı seçerek size özel alternatifler sunalım.', 'p', 'catalog-copy')}</div><form class="catalog-fleet-filter" data-fleet-filter-form><label class="catalog-fleet-filter__date" data-empty="true"><svg class="catalog-filter-icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><use href="${esc(ctx.asset('assets/icons/fora-icons.svg'))}#fora-calendar"></use></svg>${fieldText(ctx, 'filo.content.dateLabel', 'Tarih Seçin', 'span', 'catalog-filter-label')}<input class="catalog-filter-date" name="date" type="date" aria-label="${esc(get(ctx, 'filo.content.dateLabel', 'Tarih Seçin'))}"></label><label class="catalog-fleet-filter__guests" data-empty="true"><svg class="catalog-filter-icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><use href="${esc(ctx.asset('assets/icons/fora-icons.svg'))}#fora-users"></use></svg>${fieldText(ctx, 'filo.content.guestsLabel', 'Misafir Sayısı', 'span', 'catalog-filter-label')}<select name="guests" aria-label="${esc(get(ctx, 'filo.content.guestsLabel', 'Misafir Sayısı'))}"><option value=""></option>${[2,4,6,8,10,12,14].map(n => `<option value="${n}">${n} kişi</option>`).join('')}</select></label><button class="btn btn-gold" type="submit"><span data-cms-binding="filo.content.filterButton">${esc(get(ctx, 'filo.content.filterButton', 'Guletleri Göster'))}</span><span aria-hidden="true">→</span></button></form></div><div class="container catalog-card-grid catalog-card-grid--fleet" data-fleet-results>${cards}<p class="catalog-filter-empty" data-filter-empty role="status" hidden>Bu misafir sayısı için listede uygun gulet bulunamadı. <a href="${esc(href(ctx,'/iletisim/'))}">Size özel teklif isteyin.</a></p></div>`)}${section('quote', 'catalog-fleet__quote', `<div class="catalog-fleet-quote"><div class="catalog-fleet-quote__photo">${media(ctx, 'filo.quote.image', 'cove', 'catalog-fleet-quote__image', 'Ege kıyısında gulet')}</div><div class="catalog-fleet-quote__shade" aria-hidden="true"></div><div class="container catalog-fleet-quote__inner">${fieldText(ctx, 'filo.quote.title', 'Size Uygun Guleti Birlikte Seçelim', 'h2', 'catalog-planning__title')}${fieldText(ctx, 'filo.quote.description', 'Rotanızı, beklentilerinizi ve hayallerinizi paylaşın. Uzman ekibimiz size en uygun gulet ve rotayı birlikte planlasın.', 'p', 'catalog-planning__copy')}${cta(ctx, '/iletisim/', get(ctx, 'filo.header.offerLabel', 'Teklif Alın'), '', 'filo.header.offerLabel')}${fieldText(ctx, 'filo.quote.note', 'Sizin için en güzel rota…', 'p', 'catalog-fleet-quote__note')}</div></div>`)}</main>`;
}

function renderExperiences(ctx) {
  const defaults = experienceFallbacks();
  const experiences = Array.isArray(ctx?.collections?.experiences) ? rows(ctx, 'experiences') : defaults;
  const cards = experiences.map((item, i) => card(ctx, 'experiences', item, i, defaults[i % defaults.length].image, '/iletisim/')).join('');
  const storyImageValue = get(ctx, 'deneyimler.video.image', PHOTO.cove) || PHOTO.cove;
  const storyPreviewSrc = ctx.asset(storyImageValue);
  const storyHref = get(ctx, 'deneyimler.content.link', '/iletisim/');
  const defaultStoryHref = href(ctx, '/iletisim/');
  const isDefaultStoryHref = ['/iletisim/', 'iletisim/', './iletisim/', '../iletisim/', defaultStoryHref].includes(storyHref);
  const storyPreviewHref = isDefaultStoryHref ? storyPreviewSrc : '';
  return `<main class="catalog-experiences">${hero(ctx, 'deneyimler', 'Bir Tatilden Daha Fazlası', 'Her rota, yeni bir hikâye. Ege ve Akdeniz’in büyüleyici koylarında, doğayla iç içe, kendinize daha yakın anlar yaşayın.', 'heroExperiences')}${section('content', 'catalog-experiences__intro', `<div class="container catalog-experiences__intro-wrap"><img class="catalog-experiences__compass" src="${esc(ctx.asset('assets/compass-stamp.png'))}" alt="" aria-hidden="true"><div class="catalog-intro__copy">${fieldText(ctx, 'deneyimler.content.eyebrow', 'DENEYİMLER', 'p', 'catalog-eyebrow catalog-eyebrow--ink')}${fieldText(ctx, 'deneyimler.content.title', 'Maviyi Yaşamanın Farklı Yolları', 'h2', 'catalog-title')}${fieldText(ctx, 'deneyimler.content.description', 'Fora Sailing ile her yolculuk, size özel bir deneyime dönüşür. İster ailenizle, ister sevdiklerinizle; ister sadece kendinizle… Mavi yolculuğu, hayalinizdeki şekilde yaşayın.', 'p', 'catalog-copy')}</div>${fieldText(ctx, 'deneyimler.content.sideNote', 'Her rota, başka bir masal…', 'p', 'catalog-experiences__side-note')}</div><div class="container catalog-card-grid catalog-card-grid--experiences" data-section-id="experiences">${cards}</div>${fieldText(ctx, 'deneyimler.content.note', 'Paylaşılan anlar, daha da anlamlı…', 'p', 'catalog-experiences__note')}${fieldText(ctx, 'deneyimler.content.seaNote', 'Mavi sensizlikte hiç bu kadar güzel olmamıştı…', 'p', 'catalog-experiences__sea-note')}`)}${section('video', 'catalog-experiences__story', `<div class="catalog-story"><div class="catalog-story__photo">${media(ctx, 'deneyimler.video.image', 'cove', 'catalog-story__image', 'Turkuaz koyda mavi yolculuk')}</div><div class="container catalog-story__copy">${fieldText(ctx, 'deneyimler.video.title', 'Keşfet. Hisset. Yaşa.', 'h2', 'catalog-story__title')}${fieldText(ctx, 'deneyimler.video.description', 'Mavi yolculuğun büyüsünü videomuzla keşfedin. Ege ve Akdeniz’in eşsiz koylarında, sizi bekleyen deneyimleri yakından görün.', 'p', 'catalog-story__description')}${link(ctx, storyHref, get(ctx, 'deneyimler.video.linkLabel', 'Deneyimleri İzleyin'), 'catalog-story__link', 'deneyimler.content.link', 'deneyimler.video.linkLabel', storyPreviewHref)}</div>${fieldText(ctx, 'deneyimler.video.note', 'Mavi sonsuzlukta sizi bekliyor…', 'p', 'catalog-story__note')}</div>`)}${section('plan', 'catalog-experiences__plan', `<div class="container catalog-plan"><div class="catalog-plan__copy">${fieldText(ctx, 'deneyimler.plan.eyebrow', 'HAYALİNİZDEKİ MAVİ YOLCULUK', 'p', 'catalog-eyebrow catalog-eyebrow--ink')}${fieldText(ctx, 'deneyimler.plan.title', 'Deneyiminizi Planlayın', 'h2', 'catalog-title')}${fieldText(ctx, 'deneyimler.plan.description', 'Siz de kendinize özel bir rota oluşturun. İsteklerinizi paylaşın, Fora Sailing ekibi hayalinizdeki mavi yolculuk deneyimini planlasın.', 'p', 'catalog-copy')}${cta(ctx, '/iletisim/', get(ctx, 'deneyimler.header.offerLabel', 'Teklif Alın'), '', 'deneyimler.header.offerLabel')} ${link(ctx, get(ctx, 'deneyimler.hero.whatsappUrl', 'https://wa.me/905496523538'), get(ctx, 'deneyimler.hero.whatsappLabel', 'WhatsApp ile İletişim'), 'btn btn-whatsapp', 'deneyimler.hero.whatsappUrl', 'deneyimler.hero.whatsappLabel')}</div><div class="catalog-plan__photo">${media(ctx, 'deneyimler.plan.image', 'boat', 'catalog-plan__image', 'Gulet ve kıyı manzarası')}${fieldText(ctx, 'deneyimler.plan.note', 'Güzel anılar hep ileride…', 'p', 'catalog-plan__note')}</div></div>`)}</main>`;
}

const renderer = { routes: renderRoutes, fleet: renderFleet, experiences: renderExperiences };
export function renderCatalog(pageKey, ctx = {}) { return (renderer[pageKey] || renderRoutes)(ctx); }

export function initCatalog(root, ctx = {}, pageKey = '') {
  if (!root || pageKey !== 'fleet') return;
  const form = root.querySelector('[data-fleet-filter-form]');
  const results = root.querySelector('[data-fleet-results]');
  const dateInput = form?.elements?.date;
  const guestsSelect = form?.elements?.guests;
  const syncFilterLabels = () => {
    const dateLabel = dateInput?.closest('.catalog-fleet-filter__date');
    const guestsLabel = guestsSelect?.closest('.catalog-fleet-filter__guests');
    if (dateLabel) dateLabel.dataset.empty = String(!dateInput.value);
    if (guestsLabel) guestsLabel.dataset.empty = String(!guestsSelect.value);
  };
  syncFilterLabels();
  dateInput?.addEventListener('input', syncFilterLabels);
  dateInput?.addEventListener('change', syncFilterLabels);
  guestsSelect?.addEventListener('change', syncFilterLabels);
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const guests = Number(data.get('guests') || 0);
    results?.querySelectorAll('[data-cms-collection="gulets"]').forEach((item) => {
      const capacity = Number(item.querySelector('[data-cms-property="guestCapacity"]')?.textContent.match(/\d+/)?.[0] || 0);
      item.hidden = Boolean(guests && capacity && capacity < guests);
    });
    const empty=results?.querySelector('[data-filter-empty]');
    if(empty)empty.hidden=Boolean(results?.querySelector('[data-cms-collection="gulets"]:not([hidden])'));
    const date = data.get('date');
    results?.querySelectorAll('.catalog-card__link').forEach((anchor) => {
      const url = new URL(anchor.href, window.location.href);
      if (date) url.searchParams.set('startDate', date); else url.searchParams.delete('startDate');
      if(guests)url.searchParams.set('guests',String(guests));else url.searchParams.delete('guests');
      anchor.href = url.toString();
    });
  });
}
