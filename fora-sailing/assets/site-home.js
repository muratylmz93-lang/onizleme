import { PHOTO, media, fleetArtwork } from './site-assets.js?v=20261015-110';
import { renderRouteMap, initRouteMaps } from './site-route-map.js?v=20261015-110';

const text = (ctx, binding, fallback) => {
  const value = ctx?.get?.(binding, fallback);
  return value == null ? fallback : String(value);
};

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const url = (ctx, value) => {
  const raw = String(value || '#');
  return /^(?:https?:|mailto:|tel:|#)/i.test(raw) ? raw : (ctx?.url?.(raw) || raw);
};

const bindingAttr = (binding) => binding ? ` data-cms-binding="${esc(binding)}"` : '';
const img = (ctx, src, alt, className = '', binding = '', property = '') => {
  const resolved = ctx?.asset?.(src || PHOTO.hero) || src || PHOTO.hero;
  return `<img class="${esc(className)}"${bindingAttr(binding)}${property ? ` data-cms-property="${esc(property)}"` : ''} src="${esc(resolved)}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
};
const link = (ctx, href, label, className = '', binding = '', hrefBinding = '', iconName = '') => {
  const icon = iconName ? `<img class="home-link-icon" src="${esc(ctx?.asset?.(`assets/icons/${iconName}.svg`) || `assets/icons/${iconName}.svg`)}" alt="" aria-hidden="true">` : '';
  return `<a class="${esc(className)}"${hrefBinding ? ` data-cms-href-binding="${esc(hrefBinding)}"` : ''} href="${esc(url(ctx, href))}"><span${bindingAttr(binding)}>${esc(label)}</span>${icon}</a>`;
};

function collectionRows(items, fallback) {
  return Array.isArray(items) && items.length ? items : fallback;
}

function renderRouteCards(ctx) {
  const fallback = [
    { id: 'bodrum-gokova', name: 'Bodrum – Gökova', description: 'Sakin koylar, berrak sular.', homeImage: PHOTO.cove, homeUrl: '/iletisim/?rota=bodrum-gokova' },
    { id: 'marmaris-datca', name: 'Marmaris – Datça', description: 'Doğal güzelliklerin buluşma noktası.', homeImage: PHOTO.marmaris, homeUrl: '/iletisim/?rota=marmaris-datca' },
    { id: 'kemer-kekova', name: 'Kemer – Kekova', description: 'Tarihi dokularla eşsiz bir yolculuk.', homeImage: PHOTO.kekova, homeUrl: '/iletisim/?rota=kemer-kekova' },
    { id: 'gocek-fethiye-gocek', name: 'Göcek – Fethiye', description: 'Turkuazın bin tonu sizi bekliyor.', homeImage: PHOTO.boat, homeUrl: '/rotalar/gocek-fethiye-gocek/' },
  ];
  const rows = collectionRows(ctx?.collections?.routes?.filter?.((item) => item?.featuredHome !== false), fallback).slice(0, 4);
  return rows.map((item, index) => {
    const name = item.name || item.title || fallback[index % fallback.length].name;
    const sourceProperty = item.homeImage ? 'homeImage' : 'image';
    const source = item.homeImage || item.image || fallback[index % fallback.length].homeImage;
    const destination = item.homeUrl || item.inquiryUrl || item.path || fallback[index % fallback.length].homeUrl;
    return `<a class="home-route-card" href="${esc(url(ctx, destination))}" data-reveal data-cms-collection="routes" data-entity-id="${esc(item.id || '')}">
      ${img(ctx, source, `${name} kıyıları`, 'home-route-photo', '', sourceProperty)}
      <span class="home-card-copy"><strong data-cms-property="name">${esc(name)}</strong><span data-cms-property="description">${esc(item.shortDescription || item.description || 'Koylarda size özel bir mavi yolculuk.')}</span></span>

    </a>`;
  }).join('');
}

function renderFleetCards(ctx) {
  const fallback = [
    { id: 'eylul', name: 'Eylül', image: PHOTO.boat, guestCapacity: 8, cabins: 4, path: '/filo/eylul/' },
    { id: 'ata', name: 'Ata', image: PHOTO.boat2, guestCapacity: 10, cabins: 5, inquiryUrl: '/iletisim/?gulet=ata' },
    { id: 'miss-2', name: 'Miss 2', image: PHOTO.boat3, guestCapacity: 8, cabins: 4, inquiryUrl: '/iletisim/?gulet=miss-2' },
    { id: 'zel', name: 'Zel', image: PHOTO.aerial, guestCapacity: 10, cabins: 5, inquiryUrl: '/iletisim/?gulet=zel' },
    { id: 'getaway', name: 'Getaway', image: PHOTO.deck, guestCapacity: 12, cabins: 6, inquiryUrl: '/iletisim/?gulet=getaway' },
  ];
  const rows = collectionRows(ctx?.collections?.gulets?.filter?.((item) => item?.featuredHome !== false), fallback).slice(0, 5);
  return rows.map((item, index) => {
    const name = item.name || fallback[index % fallback.length].name;
    const destination = item.homeUrl || (item.path && item.path !== '/filo/' ? item.path : item.inquiryUrl) || '/iletisim/';
    const capacity = item.guestCapacity ?? item.capacity ?? fallback[index % fallback.length].guestCapacity;
    const cabins = item.cabins ?? item.cabinCount ?? fallback[index % fallback.length].cabins;
    return `<a class="home-fleet-card" href="${esc(url(ctx, destination))}" data-reveal data-cms-collection="gulets" data-entity-id="${esc(item.id || '')}">
      ${fleetArtwork(ctx, item.image || fallback[index % fallback.length].image, img(ctx, item.image || fallback[index % fallback.length].image, `${name} guleti`, 'home-fleet-photo', '', 'image'))}
      <span class="home-card-copy"><strong data-cms-property="name">${esc(name)}</strong><span><span data-cms-property="guestCapacity">${esc(capacity)}</span> misafir <i aria-hidden="true"></i> <span data-cms-property="cabins">${esc(cabins)}</span> kabin</span></span>

    </a>`;
  }).join('');
}

function renderExperiencePhotos(ctx) {
  const fallback = [
    { title: 'Turkuaz kıyı manzarası', image: PHOTO.reviewCoast },
    { title: 'Gulette açık havada yemek', image: PHOTO.reviewLunch },
    { title: 'Ege kıyılarında bir koy', image: PHOTO.reviewCove },
  ];
  const sourceDefaults = [
    'assets/device-design-assets/images/801af00a1f876234ffc4.png',
    'assets/device-design-assets/images/f0fab493786f234da45a.png',
    'assets/device-design-assets/images/a1b9d9776943aaa37574.png',
  ];
  const rows = collectionRows(ctx?.collections?.experiences?.filter?.((item) => item?.featuredHome !== false), fallback).slice(0, 3);
  return rows.map((item, index) => {
    const originalImage = String(item.image || '').replaceAll('\\', '/').split('?')[0];
    const originalFilename = originalImage.slice(originalImage.lastIndexOf('/') + 1);
    const defaultFilename = sourceDefaults[index].slice(sourceDefaults[index].lastIndexOf('/') + 1);
    const selectedImage = !originalImage || originalFilename === defaultFilename
      ? fallback[index % fallback.length].image
      : item.image;
    return img(ctx, selectedImage, item.title || item.name || fallback[index % fallback.length].title, '', '', 'image');
  }).join('');
}

export function renderHome(ctx = {}) {
  const heroTitle = esc(text(ctx, 'home.hero.title', 'Hayallerin\nRotası\nMavi Yolculuk')).replace(/\r?\n/g, '<br>');
  const phoneTitle = esc(text(ctx, 'home.hero.title', 'Hayallerin\nRotası\nMavi Yolculuk')).replace(/\r?\n/g, '<br>');
  const configuredBrandLogo = typeof ctx?.content?.settings?.brand?.headerLogo === 'string'
    ? ctx.content.settings.brand.headerLogo.trim()
    : '';
  const phoneBrandLogoPath = configuredBrandLogo
    ? (configuredBrandLogo.startsWith('brand/') ? `assets/${configuredBrandLogo}` : configuredBrandLogo)
    : 'assets/brand/fora-sailing.png';
  const phoneBrandLogo = ctx?.asset?.(phoneBrandLogoPath) || ctx?.asset?.('assets/brand/fora-sailing.png') || 'assets/brand/fora-sailing.png';
  const routeRows = collectionRows(ctx?.collections?.routes?.filter?.((item) => item?.featuredHome !== false), []);
  const routeCards = renderRouteCards(ctx);
  const fleetCards = renderFleetCards(ctx);
  const benefits = [1, 2, 3, 4].map((index) => `<li data-reveal><img class="home-benefit-icon icon-source" src="${esc(ctx?.asset?.(`assets/icons/bootstrap/${['gem','people-fill','heart','leaf'][index - 1]}.svg`) || `assets/icons/bootstrap/${['gem','people-fill','heart','leaf'][index - 1]}.svg`)}" alt="" aria-hidden="true"><strong${bindingAttr(`home.benefits.item${index}.title`)}>${esc(text(ctx, `home.benefits.item${index}.title`, ['Lüks Konfor', 'Profesyonel Ekip', 'Kişiye Özel Rotalar', 'Doğal ve Sürdürülebilir'][index - 1]))}</strong><span${bindingAttr(`home.benefits.item${index}.description`)}>${esc(text(ctx, `home.benefits.item${index}.description`, ['Üst düzey donanım', 'Deneyimli kadro', 'Size özel planlama', 'Doğayı koruyan turizm'][index - 1]))}</span></li>`).join('');

  return `<main class="fora-home" aria-label="Fora Sailing ana sayfa">
    <section class="home-hero" data-section-id="hero" aria-labelledby="home-hero-title">
      ${media(ctx, 'home.hero.image', 'hero', 'home-hero-photo', 'Ege kıyılarında yelken açan gulet')}
      <div class="home-hero-shade" aria-hidden="true"></div>
      <div class="home-hero-content">
        <p class="home-eyebrow home-light" data-reveal${bindingAttr('home.hero.eyebrow')}>${esc(text(ctx, 'home.hero.eyebrow', 'Türkiye’nin en güzel kıyılarında'))}</p>
        <h1 id="home-hero-title" data-reveal data-cms-binding="home.hero.title">${heroTitle}</h1>
        <p class="home-hero-description" data-reveal${bindingAttr('home.hero.description')}>${esc(text(ctx, 'home.hero.description', 'Eşsiz koylar, turkuaz sular, unutulmaz anlar. Size özel gulet kiralama deneyimi.'))}</p>
        <div class="home-hero-actions" data-reveal>
          ${link(ctx, text(ctx, 'home.hero.offerUrl', '/iletisim/'), text(ctx, 'home.hero.offerLabel', 'Teklif Alın'), 'home-button btn btn-gold home-button-gold', 'home.hero.offerLabel', 'home.hero.offerUrl', 'arrow-right')}
          ${link(ctx, text(ctx, 'home.hero.whatsappUrl', 'https://wa.me/905496523538'), text(ctx, 'home.hero.whatsappLabel', 'WhatsApp ile İletişim'), 'home-button btn btn-whatsapp home-button-outline', 'home.hero.whatsappLabel', 'home.hero.whatsappUrl', 'bootstrap/whatsapp')}
        </div>
        <ul class="home-proof" aria-label="Fora Sailing hakkında">
          <li><div class="home-proof-stat"><img class="home-proof-icon icon-source" src="${esc(ctx?.asset?.('assets/icons/sailboat.svg') || 'assets/icons/sailboat.svg')}" alt="" aria-hidden="true"><strong${bindingAttr('home.proof.experienceValue')}>${esc(text(ctx, 'home.proof.experienceValue', '15+'))}</strong></div><span${bindingAttr('home.proof.experienceLabel')}>${esc(text(ctx, 'home.proof.experienceLabel', 'Yıllık Deneyim'))}</span></li>
          <li><div class="home-proof-stat"><img class="home-proof-icon icon-source" src="${esc(ctx?.asset?.('assets/icons/bootstrap/people-fill.svg') || 'assets/icons/bootstrap/people-fill.svg')}" alt="" aria-hidden="true"><strong${bindingAttr('home.proof.guestValue')}>${esc(text(ctx, 'home.proof.guestValue', '50+'))}</strong></div><span${bindingAttr('home.proof.guestLabel')}>${esc(text(ctx, 'home.proof.guestLabel', 'Mutlu Misafir'))}</span></li>
          <li><div class="home-proof-stat"><img class="home-proof-icon icon-source" src="${esc(ctx?.asset?.('assets/icons/bootstrap/star-fill.svg') || 'assets/icons/bootstrap/star-fill.svg')}" alt="" aria-hidden="true"><strong${bindingAttr('home.proof.ratingValue')}>${esc(text(ctx, 'home.proof.ratingValue', '5'))}</strong></div><span${bindingAttr('home.proof.ratingLabel')}>${esc(text(ctx, 'home.proof.ratingLabel', 'Misafir Memnuniyeti'))}</span></li>
          <li><div class="home-proof-stat"><img class="home-proof-icon icon-source" src="${esc(ctx?.asset?.('assets/icons/bootstrap/geo-alt-fill.svg') || 'assets/icons/bootstrap/geo-alt-fill.svg')}" alt="" aria-hidden="true"><strong${bindingAttr('home.proof.safetyValue')}>${esc(text(ctx, 'home.proof.safetyValue', '%100'))}</strong></div><span${bindingAttr('home.proof.safetyLabel')}>${esc(text(ctx, 'home.proof.safetyLabel', 'Güvenli Tatil'))}</span></li>
        </ul>
      </div>
      <p class="home-hand home-hero-note script-note" data-reveal${bindingAttr('home.hero.note')}>${esc(text(ctx, 'home.hero.note', 'Daha Fazlası\nMavi’de Saklı…'))}</p>
      <a class="home-discover" href="#home-story"><span>Keşfet</span><img class="icon-source" src="${esc(ctx?.asset?.('assets/icons/bootstrap/arrow-down.svg') || 'assets/icons/bootstrap/arrow-down.svg')}" alt="" aria-hidden="true"></a>
    </section>

    <section class="home-story section-paper" id="home-story" data-section-id="story" aria-labelledby="home-story-title">
      <div class="home-story-copy" data-reveal>
        <p class="home-eyebrow" data-cms-binding="home.story.eyebrow">${esc(text(ctx, 'home.story.eyebrow', 'Mavi yolculuk, daha fazlası'))}</p>
        <h2 id="home-story-title" data-cms-binding="home.story.title">${esc(text(ctx, 'home.story.title', 'Yaşam Tarzı\nBir Yolculuk')).replace(/\r?\n/g, '<br>')}</h2>
        <p data-cms-binding="home.story.description">${esc(text(ctx, 'home.story.description', 'Fora Sailing ile Ege ve Akdeniz’in en özel koylarında, size özel rotalarla özgürlüğü keşfedin. Bu bir tatilden çok daha fazlası, bu bir yaşam tarzı.'))}</p>
        ${link(ctx, text(ctx, 'home.story.link', '/hakkimizda/'), text(ctx, 'home.story.linkLabel', 'Hikayemizi Keşfedin'), 'home-text-link', 'home.story.linkLabel', 'home.story.link', 'arrow-right')}
      </div>
        <img class="home-story-compass" src="${esc(ctx?.asset?.('assets/compass-stamp.png') || 'assets/compass-stamp.png')}" alt="" aria-hidden="true">
        <img class="home-story-compass home-story-compass-alt" src="${esc(ctx?.asset?.('assets/compass-stamp.png') || 'assets/compass-stamp.png')}" alt="" aria-hidden="true">
      <div class="home-story-photos" data-reveal>
      ${media(ctx, 'home.story.image', 'cove', 'home-story-main photo-frame', 'Turkuaz koy ve kayalık kıyılar')}
        ${media(ctx, 'home.story.sideImage', 'swimmer', 'home-story-side photo-frame', 'Turkuaz koyda yüzen misafir')}
        <a class="home-story-play" href="${esc(url(ctx, '/deneyimler/'))}" aria-label="Deneyimleri keşfet"><img src="${esc(ctx?.asset?.('assets/icons/play.svg') || 'assets/icons/play.svg')}" alt="" aria-hidden="true"></a>
      </div>
      <p class="home-hand home-story-note script-note" data-reveal${bindingAttr('home.story.note')}>${esc(text(ctx, 'home.story.note', 'Mavi sonsuzlukta\nsizi bekliyor'))}</p>
    </section>

    <section class="home-routes section-sea" id="home-routes" data-section-id="routes" aria-labelledby="home-routes-title">
      <div class="home-routes-scene" aria-hidden="true">${media(ctx, 'home.routes.image', 'cove', 'home-routes-water', '')}</div>
      <div class="home-section-heading home-light" data-reveal>
        <p class="home-eyebrow" data-cms-binding="home.routes.eyebrow">${esc(text(ctx, 'home.routes.eyebrow', 'Ege ve Akdeniz kıyılarında'))}</p>
        <h2 id="home-routes-title" data-cms-binding="home.routes.title">${esc(text(ctx, 'home.routes.title', 'Özel Rotalar\nKeşfedilmeyi Bekliyor')).replace(/\r?\n/g, '<br>')}</h2>
        <p data-cms-binding="home.routes.description">${esc(text(ctx, 'home.routes.description', 'Her rota, yeni bir hikâye. Türkiye’nin en güzel koylarında unutulmaz bir mavi yolculuk sizi bekliyor.'))}</p>
        ${link(ctx, text(ctx, 'home.routes.link', '/rotalar/'), text(ctx, 'home.routes.linkLabel', 'Tüm Rotaları İncele'), 'home-text-link home-light-link', 'home.routes.linkLabel', 'home.routes.link', 'arrow-right')}
      </div>
      ${renderRouteMap(ctx, { id: 'home-featured-routes', stops: ['Bodrum', 'Marmaris', 'Fethiye'], duration: 1600, showBoat: true })}
      <div class="home-route-rail" data-drag-rail aria-label="Öne çıkan rotalar">${routeCards}</div>
      <aside class="home-phone" aria-label="Mobil site önizlemesi">
        <div class="home-phone-bezel">
          <div class="home-phone-screen">
            <div class="home-phone-status"><span>9:41</span><span aria-hidden="true">● ● ●</span></div>
            <div class="home-phone-hero">
              ${media(ctx, 'home.hero.image', 'hero', 'home-phone-photo', 'Fora Sailing ana sayfa görseli')}
              <div class="home-phone-shade" aria-hidden="true"></div>
              <img class="home-phone-brand" src="${esc(phoneBrandLogo)}" alt="" aria-hidden="true">
              <h3 data-cms-binding="home.hero.title">${phoneTitle}</h3>
              <p data-cms-binding="home.hero.description">${esc(text(ctx, 'home.hero.description', 'Eşsiz koylar, turkuaz sular, unutulmaz anlar. Size özel gulet kiralama deneyimi.'))}</p>
              <a href="${esc(url(ctx, text(ctx, 'home.hero.offerUrl', '/iletisim/')))}" data-cms-href-binding="home.hero.offerUrl"><span data-cms-binding="home.hero.offerLabel">${esc(text(ctx, 'home.hero.offerLabel', 'Teklif Alın'))}</span></a>
            </div>
            <div class="home-phone-story">
              ${media(ctx, 'home.story.image', 'cove', 'home-phone-story-photo', 'Turkuaz koy')}
              <p data-cms-binding="home.phone.note">${esc(text(ctx, 'home.phone.note', 'Mavi, size çok yakışacak…'))}</p>
            </div>
            <div class="home-phone-nav" aria-hidden="true"><span>Rotalar</span><span>Filomuz</span><span>İletişim</span></div>
          </div>
        </div>
      </aside>
      <p class="home-hand home-route-note script-note" data-reveal data-cms-binding="home.routes.note">${esc(text(ctx, 'home.routes.note', 'Her rota,\nbaşka bir masal…'))}</p>
      <p class="home-hand home-route-footer-note script-note" data-reveal data-cms-binding="home.routes.footerNote">${esc(text(ctx, 'home.routes.footerNote', 'Her an yanınızda…'))}</p>
    </section>

    <section class="home-fleet section-paper" id="home-fleet" data-section-id="fleet" aria-labelledby="home-fleet-title">
      <div class="home-section-heading" data-reveal>
        <p class="home-eyebrow" data-cms-binding="home.fleet.eyebrow">${esc(text(ctx, 'home.fleet.eyebrow', 'Denizde konfor ve özgürlük'))}</p>
        <h2 id="home-fleet-title" data-cms-binding="home.fleet.title">${esc(text(ctx, 'home.fleet.title', 'Gulet Filomuz'))}</h2>
        <p data-cms-binding="home.fleet.description">${esc(text(ctx, 'home.fleet.description', 'Konfor, zarafet ve özgürlük bir arada. Size en uygun guleti keşfedin.'))}</p>
        ${link(ctx, text(ctx, 'home.fleet.link', '/filo/'), text(ctx, 'home.fleet.linkLabel', 'Tüm Filoyu Gör'), 'home-text-link', 'home.fleet.linkLabel', 'home.fleet.link', 'arrow-right')}
      </div>
      <div class="home-fleet-rail" data-drag-rail aria-label="Öne çıkan guletler">${fleetCards}</div>
    </section>

    <section class="home-offer" data-section-id="offer" aria-labelledby="home-offer-title">
      ${media(ctx, 'home.offer.image', 'sunsetWoman', 'home-offer-photo', 'Gün batımında güvertede denizi izleyen misafir')}
      <div class="home-offer-copy home-light" data-reveal>
        <p class="home-eyebrow" data-cms-binding="home.offer.eyebrow">${esc(text(ctx, 'home.offer.eyebrow', 'Erken rezervasyon fırsatı'))}</p>
        <h2 id="home-offer-title" data-cms-binding="home.offer.title">${esc(text(ctx, 'home.offer.title', '%50’ye Varan İndirim'))}</h2>
        <p data-cms-binding="home.offer.description">${esc(text(ctx, 'home.offer.description', '2026 sezonu için erken rezervasyon yapın, hayalinizdeki mavi yolculuk daha avantajlı olsun.'))}</p>
        ${link(ctx, text(ctx, 'home.offer.link', '/iletisim/?kampanya=erken-rezervasyon'), text(ctx, 'home.offer.linkLabel', 'Hemen Teklif Alın'), 'home-button btn btn-gold home-button-gold', 'home.offer.linkLabel', 'home.offer.link', 'arrow-right')}
      </div>
      <p class="home-offer-badge" data-reveal data-cms-binding="home.offer.badge">${esc(text(ctx, 'home.offer.badge', '2026\nSEZONU\nAVANTAJLI\nFİYATLAR'))}</p>
      <p class="home-hand home-offer-note script-note" data-reveal data-cms-binding="home.offer.note">${esc(text(ctx, 'home.offer.note', 'Mavi, insana\nhep iyi gelir.'))}</p>
    </section>

    <section class="home-benefits section-sea" id="home-benefits" data-section-id="benefits" aria-labelledby="home-benefits-title">
      ${media(ctx, 'home.benefits.image', 'aerial', 'home-benefit-photo', 'Ege kıyısında turkuaz deniz')}
      <h2 id="home-benefits-title" data-reveal data-cms-binding="home.benefits.title">${esc(text(ctx, 'home.benefits.title', 'Neden Fora Sailing?'))}</h2>
      <ul class="home-benefit-list">${benefits}</ul>
      <p class="home-hand home-benefits-note script-note" data-reveal data-cms-binding="home.benefits.note">${esc(text(ctx, 'home.benefits.note', 'Aynı deniz,\ndaha güzel bir gelecek için…'))}</p>
    </section>

    <section class="home-reviews section-paper" data-section-id="reviews" aria-labelledby="home-reviews-title">
      <div class="home-reviews-copy" data-reveal>
        <p class="home-eyebrow" data-cms-binding="home.reviews.eyebrow">${esc(text(ctx, 'home.reviews.eyebrow', 'Gerçek deneyimler, gerçek mutluluklar'))}</p>
        <h2 id="home-reviews-title" data-cms-binding="home.reviews.title">${esc(text(ctx, 'home.reviews.title', 'Misafirlerimizin\nGözünden')).replace(/\r?\n/g, '<br>')}</h2>
        ${link(ctx, text(ctx, 'home.reviews.link', '/iletisim/'), text(ctx, 'home.reviews.linkLabel', 'Tüm Yorumları Gör'), 'home-text-link', 'home.reviews.linkLabel', 'home.reviews.link', 'arrow-right')}
      </div>
      <figure class="home-review-quote" data-reveal>
        ${media(ctx, 'home.reviews.avatarImage', 'reviewAvatar', 'home-review-avatar', 'Misafir yorumu avatarı')}
        <div class="home-review-rating" aria-label="5 üzerinden 5 yıldız"><span aria-hidden="true">★★★★★</span></div>
        <blockquote data-cms-binding="home.reviews.quote">“${esc(text(ctx, 'home.reviews.quote', 'Hayatımızın en güzel tatiliydi. Fora Sailing ekibine teşekkür ederiz. Her şey mükemmeldi.'))}”</blockquote>
        <figcaption data-cms-binding="home.reviews.author">${esc(text(ctx, 'home.reviews.author', 'Ayşe K.'))}<span data-cms-binding="home.reviews.location">${esc(text(ctx, 'home.reviews.location', 'İstanbul'))}</span></figcaption>
      </figure>
      <div class="home-review-photos" data-drag-rail aria-label="Mavi yolculuktan fotoğraflar">
        ${renderExperiencePhotos(ctx)}
      </div>
      <div class="home-review-controls" aria-label="Yorum fotoğrafları kontrolleri">
        <button type="button" data-review-shift="-1" aria-label="Önceki fotoğraflar">‹</button>
        <button type="button" data-review-shift="1" aria-label="Sonraki fotoğraflar">›</button>
      </div>
    </section>
  </main>`;
}

export function initHome(root) {
  if (!root) return () => {};
  const cleanups = [];
  const routeObserver = initRouteMaps(root);
  if (routeObserver) cleanups.push(() => routeObserver.disconnect());
  const reviewRail = root.querySelector('.home-review-photos');
  if (reviewRail) {
    root.querySelectorAll('[data-review-shift]').forEach((button) => {
      const click = () => {
        const direction = Number(button.getAttribute('data-review-shift')) || 1;
        const behavior = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        reviewRail.scrollBy({ left: direction * Math.max(reviewRail.clientWidth * 0.72, 120), behavior });
      };
      button.addEventListener('click', click);
      cleanups.push(() => button.removeEventListener('click', click));
    });
  }
  root.querySelectorAll('[data-drag-rail]').forEach((rail) => {
    let startX = 0, startScroll = 0, dragging = false;
    let pointerId = null, suppressClick = false, suppressTimer = 0;
    const down = (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      startX = event.clientX;
      startScroll = rail.scrollLeft;
      dragging = false;
      pointerId = event.pointerId;
    };
    const move = (event) => {
      if (pointerId !== event.pointerId) return;
      const delta = event.clientX - startX;
      if (!dragging && Math.abs(delta) > 6) {
        dragging = true;
        rail.classList.add('is-dragging');
        rail.setPointerCapture?.(event.pointerId);
      }
      if (dragging) rail.scrollLeft = startScroll - delta;
    };
    const up = () => {
      if (dragging) {
        suppressClick = true;
        clearTimeout(suppressTimer);
        suppressTimer = setTimeout(() => { suppressClick = false; }, 120);
      }
      dragging = false;
      pointerId = null;
      rail.classList.remove('is-dragging');
    };
    const click = (event) => {
      if (!suppressClick) return;
      suppressClick = false;
      clearTimeout(suppressTimer);
      event.preventDefault();
      event.stopPropagation();
    };
    rail.addEventListener('pointerdown', down);
    rail.addEventListener('pointermove', move);
    rail.addEventListener('pointerup', up);
    rail.addEventListener('pointercancel', up);
    rail.addEventListener('click', click, true);
    cleanups.push(() => {
      rail.removeEventListener('pointerdown', down);
      rail.removeEventListener('pointermove', move);
      rail.removeEventListener('pointerup', up);
      rail.removeEventListener('pointercancel', up);
      rail.removeEventListener('click', click, true);
      clearTimeout(suppressTimer);
    });
  });
  return () => cleanups.forEach((cleanup) => cleanup());
}
