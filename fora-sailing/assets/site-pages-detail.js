import { PHOTO, media, escapeHTML } from './site-assets.js';
import { renderRouteMap, initRouteMaps } from './site-route-map.js';

const esc = escapeHTML;
const get = (ctx, key, fallback = '') => {
  const value = ctx?.get?.(key, fallback);
  return value == null ? fallback : String(value);
};
const href = (ctx, path) => /^(?:https?:|mailto:|tel:|#)/i.test(String(path || '')) ? String(path) : (ctx?.url?.(path || '/iletisim/') || path || '/iletisim/');
const bind = key => key ? ` data-cms-binding="${esc(key)}"` : '';
const text = (ctx, key, fallback, tag = 'p', className = '') => `<${tag}${bind(key)}${className ? ` class="${esc(className)}"` : ''}>${esc(get(ctx, key, fallback)).replace(/\n/g, '<br>')}</${tag}>`;
const section = (id, cls, content) => `<section class="detail-section ${esc(cls)}" data-section-id="${esc(id)}">${content}</section>`;
const button = (ctx, path, label, binding, className = 'btn btn-gold') => `<a class="${esc(className)}" href="${esc(href(ctx, path))}"${binding ? ` data-cms-href-binding="${esc(binding)}"` : ''}><span>${esc(label)}</span><span class="detail-arrow" aria-hidden="true">→</span></a>`;
const icon = (ctx, name, className = '') => {
  const path = name.startsWith('local:') ? `assets/icons/${name.slice(6)}.svg` : `assets/icons/bootstrap/${name}.svg`;
  return `<img class="detail-icon ${esc(className)}" src="${esc(ctx?.asset?.(path) || path)}" alt="" aria-hidden="true">`;
};

function hero(ctx, prefix, titleFallback, descriptionFallback, photo, routeCta = false, options = {}) {
  const titleKey = `${prefix}.hero.title`;
  const offerKey = `${prefix}.hero.offerUrl`;
  const whatsappKey = `${prefix}.hero.whatsappUrl`;
  const offerLabel = get(ctx, `${prefix}.hero.ctaLabel`, routeCta ? 'Bu Rota İçin Teklif Alın' : 'Teklif Alın');
  const description = get(ctx, `${prefix}.hero.description`, descriptionFallback);
  const actionClasses = [options.hideActionsDesktop && 'detail-actions--desktop-hidden', options.hideWhatsappDesktop && 'detail-actions--hide-whatsapp-desktop'].filter(Boolean).join(' ');
  const actions = `<div class="detail-actions ${actionClasses}">${button(ctx, get(ctx, offerKey, '/iletisim/'), offerLabel, offerKey, 'btn btn-gold detail-action-primary').replace('<span>', `<span${bind(`${prefix}.hero.ctaLabel`)}>`)}${button(ctx, get(ctx, whatsappKey, 'https://wa.me/905496523538'), get(ctx, `${prefix}.hero.whatsappLabel`, 'WhatsApp ile İletişim'), whatsappKey, 'btn btn-whatsapp detail-action-secondary').replace('<span>', `<span${bind(`${prefix}.hero.whatsappLabel`)}>` )}</div>`;
  return section('hero', 'detail-hero', `<div class="detail-hero-media">${media(ctx, `${prefix}.hero.image`, photo, 'detail-hero-image', titleFallback)}<span class="detail-hero-shade" aria-hidden="true"></span></div><div class="detail-hero-copy container"><p class="detail-eyebrow"${bind(`${prefix}.hero.eyebrow`)}>${esc(get(ctx, `${prefix}.hero.eyebrow`, 'MAVİ YOLCULUK • FORA SAILING'))}</p><h1${bind(titleKey)}>${esc(get(ctx, titleKey, titleFallback)).replace(/\n/g, '<br>')}</h1><p class="detail-hero-description"${bind(`${prefix}.hero.description`)}>${esc(description)}</p>${actions}</div>`);
}

function mediaCard(ctx, binding, photo, alt, cls = '', dataAttrs = '') {
  return `<div class="detail-photo-frame ${esc(cls)}"${dataAttrs}>${media(ctx, binding, photo, 'detail-photo', alt)}</div>`;
}

function routeStops(ctx) {
  const routes = ctx?.collections?.routes || [];
  const route = ctx?.detailEntity || routes.find(item => /gocek-fethiye|göcek.*fethiye/i.test(`${item.id} ${item.name}`)) || {};
  const entityStops = Array.isArray(route.stops) ? route.stops.map(stop => typeof stop === 'string' ? stop : stop?.name).filter(Boolean) : [];
  const cmsStops = String(get(ctx, 'rota-gocek-fethiye.stops.description', '')).split(/[,.·]/).map(x => x.trim()).filter(Boolean);
  const names = entityStops.length >= 3 ? entityStops : (cmsStops.length >= 3 ? cmsStops : ['Göcek', 'Fethiye', 'Göcek']);
  const map = renderRouteMap(ctx, { id: `${route.id || 'gocek-fethiye'}-detail`, stops: names, duration: 1800, showBoat: true });
  return section('stops', 'detail-stops section-sea', `<div class="container detail-stops-inner"><div class="detail-stops-copy">${text(ctx, 'rota-gocek-fethiye.stops.title', 'Rota Üzerindeki Öne Çıkan Duraklar', 'h2')}${text(ctx, 'rota-gocek-fethiye.stops.description', names.join(' · '), 'p')}<a class="detail-inline-link" href="${esc(href(ctx, route.path || '/rotalar/'))}"><span${bind('rota-gocek-fethiye.stops.linkLabel')}>${esc(get(ctx,'rota-gocek-fethiye.stops.linkLabel','Rota Detaylarını İncele'))}</span><span aria-hidden="true">→</span></a></div>${map}</div>`);
}

function routeDetail(ctx) {
  const prefix = 'rota-gocek-fethiye';
  return `<main class="fora-detail fora-detail--route" aria-label="${esc(ctx?.detailEntity?.name||'Göcek Fethiye')} rotası" data-cms-collection="routes" data-entity-id="${esc(ctx?.detailEntity?.id||'gocek-fethiye')}">
    ${hero(ctx, prefix, 'Göcek – Fethiye – Göcek', 'Eşsiz koylar, turkuaz sular ve Akdeniz’in büyüleyici doğasında unutulmaz bir mavi yolculuk rotası.', 'heroRoutes', true)}
    ${section('content', 'detail-intro detail-intro--route', `<div class="container detail-intro-grid"><div class="detail-intro-copy"><p class="detail-eyebrow detail-eyebrow--ink"${bind(`${prefix}.content.eyebrow`)}>${esc(get(ctx, `${prefix}.content.eyebrow`, 'GÖCEK — FETHİYE — GÖCEK'))}</p>${text(ctx, `${prefix}.content.title`, 'Koyların Ritminde Bir Yolculuk', 'h2')}${text(ctx, `${prefix}.content.description`, 'Göcek’in sakin koylarından Fethiye’nin eşsiz manzaralarına uzanan bu rota, her gün yeni bir koy, yeni bir manzara ve daha derin bir mavi sunar. Doğanın ritmine uyum sağlayarak, denizin, güneşin ve özgürlüğün keyfini yaşayın.')}${button(ctx, get(ctx, `${prefix}.content.link`, '/iletisim/'), get(ctx, `${prefix}.content.linkLabel`, 'Rota Hakkında Daha Fazla Bilgi'), `${prefix}.content.link`, 'detail-text-link')}</div><div class="detail-intro-art">${mediaCard(ctx, `${prefix}.content.image`, 'aerial', 'Göcek koylarında gulet', 'detail-photo-main')}${media(ctx, `${prefix}.content.insetImage`, 'cove', 'detail-photo-inset', 'Göcek kıyısında turkuaz koy')}<span class="detail-photo-play" aria-hidden="true">▶</span></div></div>`)}
    ${routeStops(ctx)}
    ${section('highlights', 'detail-highlights', `<div class="container detail-highlights-grid">${mediaCard(ctx, `${prefix}.highlights.coveImage`, 'cove', 'Kayalık kıyıda turkuaz koy', 'detail-highlight-photo')}<div class="detail-highlight-copy"><p class="detail-eyebrow detail-eyebrow--ink"${bind(`${prefix}.highlights.eyebrow`)}>${esc(get(ctx,`${prefix}.highlights.eyebrow`,'KOYLAR VE KIYILAR'))}</p>${text(ctx,`${prefix}.highlights.coveTitle`,'Turkuaz Koylar','h2')}${text(ctx,`${prefix}.highlights.coveDescription`,'Her gün farklı bir koyda yüzmenin, berrak sularda serinlemenin ve doğanın sunduğu huzuru hissetmenin ayrıcalığını yaşayın.') }<a class="detail-text-link" href="${esc(href(ctx, '/deneyimler/'))}"><span${bind(`${prefix}.highlights.coveLinkLabel`)}>${esc(get(ctx,`${prefix}.highlights.coveLinkLabel`,'Koyları Keşfet'))}</span><span aria-hidden="true">→</span></a></div>${mediaCard(ctx, `${prefix}.highlights.sunsetImage`, 'sunsetWoman', 'Güvertede gün batımı', 'detail-highlight-sunset')}<div class="detail-highlight-copy detail-highlight-copy--last">${text(ctx,`${prefix}.highlights.sunsetTitle`,'Güvertede Gün Batımı','h2')}${text(ctx,`${prefix}.highlights.sunsetDescription`,'Günün sonunda guletinizin güvertesinde Akdeniz’in eşsiz gün batımını izleyin.')}<a class="detail-text-link" href="${esc(href(ctx, '/deneyimler/'))}"><span${bind(`${prefix}.highlights.sunsetLinkLabel`)}>${esc(get(ctx,`${prefix}.highlights.sunsetLinkLabel`,'Deneyimleri Keşfet'))}</span><span aria-hidden="true">→</span></a></div></div>`)}
    ${section('quote', 'detail-quote section-sea', `<div class="container detail-quote-grid"><div>${text(ctx, `${prefix}.quote.title`, 'Bu Rota İçin Teklif Alın', 'h2')}<p class="detail-quote-note"${bind(`${prefix}.quote.note`)}>${esc(get(ctx,`${prefix}.quote.note`,'Mavi, size çok yakışacak…'))}</p>${text(ctx, `${prefix}.quote.description`, 'Sizin için en uygun tarih ve detaylarla özel bir mavi yolculuk planlayalım.')}</div><form class="detail-quick-form" data-form="route-quote"><input type="hidden" name="routeId" value="${esc(ctx?.detailEntity?.id || 'gocek-fethiye')}"><label><span${bind(`${prefix}.quote.dateLabel`)}>${esc(get(ctx,`${prefix}.quote.dateLabel`,'Tarih Aralığı'))}</span><div class="detail-date-pair"><input type="date" name="startDate" aria-label="Başlangıç tarihi"><input type="date" name="endDate" aria-label="Bitiş tarihi"></div></label><label><span${bind(`${prefix}.quote.guestsLabel`)}>${esc(get(ctx,`${prefix}.quote.guestsLabel`,'Misafir Sayısı'))}</span><select name="guests"><option value="">${esc(get(ctx,`${prefix}.quote.guestsLabel`,'Misafir Sayısı'))}</option>${[2,4,6,8,10,12].map(n => `<option value="${n}">${n} kişi</option>`).join('')}</select></label><button class="btn btn-gold" type="submit"><span${bind(`${prefix}.quote.submitLabel`)}>${esc(get(ctx,`${prefix}.quote.submitLabel`,'Bu Rota İçin Teklif Alın'))}</span><span aria-hidden="true">→</span></button></form></div>`)}
  </main>`;
}

function about(ctx) {
  const p = 'hakkimizda';
  return `<main class="fora-detail fora-detail--about" aria-label="Fora Sailing hakkında">
    ${hero(ctx, p, 'Bizim Hikâyemiz Mavide Başlar', 'Ege ve Akdeniz’in eşsiz koylarında, denizle, doğayla ve insanla kurulan derin bir bağın peşindeyiz.', 'heroFleet')}
    ${section('content', 'detail-intro detail-intro--about', `<div class="container detail-intro-grid"><div class="detail-intro-copy"><p class="detail-eyebrow detail-eyebrow--ink"${bind(`${p}.content.eyebrow`)}>${esc(get(ctx, `${p}.content.eyebrow`, 'MAVİ YOLCULUK, DAHA FAZLASI'))}</p>${text(ctx, `${p}.content.title`, 'Yaşam Tarzı Bir Yolculuk', 'h2')}${text(ctx, `${p}.content.description`, 'Fora Sailing, Ege ve Akdeniz’in benzersiz doğasında daha yavaş, daha anlamlı ve özgür bir yaşamı keşfetmeniz için var.')}${text(ctx, `${p}.content.secondDescription`, 'Denizin dinginliği, doğanın sadeliği ve samimi misafirperverlik anlayışımızla, her yolculuğun size özel olmasına özen gösteriyoruz.')}${button(ctx, get(ctx, `${p}.content.link`, '/iletisim/'), get(ctx, `${p}.content.linkLabel`, 'Hikâyemizi Keşfedin'), `${p}.content.link`, 'detail-text-link')}</div><div class="detail-intro-art">${mediaCard(ctx, `${p}.content.image`, 'aerial', 'Turkuaz koyda gulet', 'detail-photo-main')}${media(ctx, `${p}.content.sideImage`, 'swimmer', 'detail-photo-inset', 'Denizde yüzen misafir')}</div></div>`)}
    ${section('values', 'detail-values section-sea', `<div class="container"><p class="detail-eyebrow"${bind(`${p}.values.eyebrow`)}>${esc(get(ctx, `${p}.values.eyebrow`, 'DENİZ, DOĞA, İNSAN'))}</p>${text(ctx, `${p}.values.title`, 'Sizi Dinler, Yolculuğunuzu Şekillendiririz', 'h2')}${text(ctx,`${p}.values.lead`,'Her yolculuk, sizin hayallerinizden ve beklentilerinizden doğar.','p','detail-values-lead')}<ul class="detail-values-list">${[1,2,3].map((n,i)=>`<li>${icon(ctx,['local:sailboat','geo-alt-fill','local:waves'][i])}<div>${text(ctx,`${p}.values.item${n}`,['Özenli Planlama','Size Özel Rotalar','Denizle İç İçe'][i],'h3')}${text(ctx,`${p}.values.item${n}Description`,['Seyahatinizin her aşamasını, detaylarıyla birlikte düşünür; sizin için en ideal deneyimi planlarız.','İlgi alanlarınıza, beklentilerinize ve seyahat tarzınıza uygun rotalar oluştururuz.','Kalabalıktan uzak, doğayla uyumlu ve unutulmaz anlarla dolu bir yolculuk için yanınızdayız.'][i])}</div></li>`).join('')}</ul></div>`)}
    ${section('together', 'detail-together', `<div class="container detail-together-grid">${mediaCard(ctx, `${p}.together.image`, 'family', 'Güvertede birlikte vakit geçiren aile', 'detail-together-photo')}<div><p class="detail-eyebrow detail-eyebrow--ink"${bind(`${p}.together.eyebrow`)}>${esc(get(ctx, `${p}.together.eyebrow`, 'DENİZ, DOĞA, İNSAN'))}</p>${text(ctx, `${p}.together.title`, 'Bizim İçin Mavi Bir Araya Getirir', 'h2')}${text(ctx, `${p}.together.description`, 'Yeni yerler keşfetmek, farklı kültürlerle tanışmak, doğayla yeniden bağ kurmak ve sevdiklerinizle kaliteli zaman geçirmek… Fora Sailing ile her yolculuk, bu değerleri bir araya getirir.')}${button(ctx, '/iletisim/', get(ctx, `${p}.together.ctaLabel`, 'Teklif Alın'), 'hakkimizda.header.offerUrl')}</div></div>`)}
  </main>`;
}

function gallery(ctx) {
  const gulet = ctx?.detailEntity || (ctx?.collections?.gulets || []).find(item => item.id === 'eylul') || {};
  const sourceSet = Array.isArray(gulet.gallery) && gulet.gallery.length ? [...gulet.gallery] : [PHOTO.saloon, PHOTO.cabin, PHOTO.deck, PHOTO.boat];
  const sources = sourceSet.slice(0,4);
  const labels = [
    get(ctx, 'eylul.gallery.item1Label', 'Salon'),
    get(ctx, 'eylul.gallery.item2Label', 'Kamaralar'),
    get(ctx, 'eylul.gallery.item3Label', 'Güverte'),
    get(ctx, 'eylul.gallery.item4Label', 'Yaşam Alanı')
  ];
  const defaultEntity = gulet.id === 'eylul';
  const mainField=(ctx.content?.pages||[]).flatMap(page=>page.sections||[]).flatMap(section=>section.fields||[]).find(field=>field.binding==='eylul.gallery.mainImage');
  const customMain=mainField && (mainField.canonicalEdit===true || mainField.value!==mainField.defaultValue);
  const main = defaultEntity && customMain ? get(ctx,'eylul.gallery.mainImage',sources[0]) : sources[0];
  const collectionAttrs = defaultEntity ? '' : ` data-cms-collection="gulets" data-entity-id="${esc(gulet.id)}" data-cms-property="gallery"`;
  return `<div class="detail-gallery" data-gallery${collectionAttrs}><div class="detail-gallery-main">${media(ctx, defaultEntity ? 'eylul.gallery.mainImage' : '', main, 'detail-gallery-current', labels[0])}</div><div class="detail-gallery-thumbs" role="tablist" aria-label="${esc(gulet.name||'Eylül')} guleti fotoğrafları">${sources.map((src,i)=>`<button type="button" role="tab" aria-selected="${ctx.asset(src)===ctx.asset(main)?'true':'false'}" data-gallery-src="${esc(ctx.asset(src))}" data-gallery-alt="${esc(labels[i]||gulet.name||'Eylül guleti')}"><img src="${esc(ctx.asset(src))}" alt="" loading="lazy"><span${defaultEntity?bind(`eylul.gallery.item${i+1}Label`):''}>${esc(labels[i]||'Galeri')}</span></button>`).join('')}</div></div>`;
}

function gulet(ctx) {
  const p='eylul';
  const item=ctx?.detailEntity||(ctx?.collections?.gulets||[]).find(row=>row.id==='eylul')||{};
  const activeGuletId=item.id||'eylul';
  const defaultEntity=activeGuletId==='eylul';
  const introImage=defaultEntity?get(ctx,`${p}.content.image`,item.image||PHOTO.saloon):(item.image||PHOTO.saloon);
  const capacity=item.guestCapacity??item.capacity??8;
  const cabins=item.cabins??item.cabinCount??4;
  return `<main class="fora-detail fora-detail--gulet" aria-label="${esc(item.name||'Eylül')} guleti" data-cms-collection="gulets" data-entity-id="${esc(activeGuletId)}">
    ${hero(ctx,p,'Eylül','Maviyle iç içe, özgür ve huzurlu bir yolculuk. Eylül, Akdeniz’in en özel koylarında size ait bir yaşam sunuyor.','boat',false,{hideWhatsappDesktop:true})}
    ${section('content','detail-intro detail-intro--gulet',`<div class="container detail-intro-grid"><div class="detail-intro-copy"><p class="detail-eyebrow detail-eyebrow--ink"${bind(`${p}.content.eyebrow`)}>${esc(get(ctx,`${p}.content.eyebrow`,'EYLÜL GULETİ'))}</p>${text(ctx,`${p}.content.title`,'Mavide Size Ait Bir Yaşam','h2')}${text(ctx,`${p}.content.description`,'Geniş güvertesi, zarif tasarımı ve sıcak atmosferiyle Eylül, denizin ritminde sakin ve konforlu bir yolculuk sunar. Güneşin, rüzgârın ve masmavi koyların eşlik ettiği bu özel deneyim, size Akdeniz’in gerçek ruhunu hissettirir.') }<ul class="detail-specs"><li>${icon(ctx,'people-fill')}<span data-cms-collection="gulets" data-entity-id="${esc(activeGuletId)}" data-cms-property="guestCapacity">${esc(capacity)} misafir</span></li><li>${icon(ctx,'gem')}<span data-cms-collection="gulets" data-entity-id="${esc(activeGuletId)}" data-cms-property="cabins">${esc(cabins)} kabin</span></li></ul></div><div class="detail-intro-art">${mediaCard(ctx,defaultEntity?`${p}.content.image`:'',introImage,`${item.name||'Eylül'} guletinin salonu`,'detail-photo-main',defaultEntity?'':` data-cms-collection="gulets" data-entity-id="${esc(activeGuletId)}" data-cms-property="image"`)}${media(ctx,defaultEntity?`${p}.content.insetImage`:'',defaultEntity?'cabin':(item.gallery?.[1]||item.image||PHOTO.cabin),'detail-photo-inset',`${item.name||'Eylül'} guletinin kamarası`)}</div></div>`)}
    ${section('gallery','detail-gallery-section',`<div class="container detail-gallery-grid"><div class="detail-gallery-column"><header class="detail-gallery-heading"><p class="detail-eyebrow detail-eyebrow--ink"${bind(`${p}.gallery.eyebrow`)}>${esc(get(ctx,`${p}.gallery.eyebrow`,'EYLÜL GULETİ'))}</p>${text(ctx,`${p}.gallery.title`,'Yaşam Alanları, Güverte ve Galeri','h2')}${text(ctx,`${p}.gallery.description`,'Eylül guletinin yaşam alanı fotoğrafları.')}</header>${gallery(ctx)}</div><aside class="detail-gulet-quote section-sea" data-section-id="quote">${text(ctx,`${p}.quote.title`,'Eylül İçin Teklif Alın','h2')}${text(ctx,`${p}.quote.description`,'Hayalinizdeki mavi yolculuk bir adım uzağınızda.')}<form class="detail-gulet-form" data-form="gulet-quote"><input type="hidden" name="guletId" value="${esc(activeGuletId)}"><label><span${bind(`${p}.quote.dateLabel`)}>${esc(get(ctx,`${p}.quote.dateLabel`,'Tarih Seçin'))}</span><input type="date" name="startDate"></label><label><span${bind(`${p}.quote.guestsLabel`)}>${esc(get(ctx,`${p}.quote.guestsLabel`,'Kişi Sayısı'))}</span><select name="guests"><option value="">${esc(get(ctx,`${p}.quote.guestsLabel`,'Misafir Sayısı'))}</option>${[2,4,6,8,10,12].map(n=>`<option value="${n}">${n} kişi</option>`).join('')}</select></label><label><span${bind(`${p}.quote.messageLabel`)}>${esc(get(ctx,`${p}.quote.messageLabel`,'Mesajınız'))}</span><textarea name="message" rows="2" placeholder="İsteğe bağlı"></textarea></label><button class="btn btn-gold" type="submit"><span${bind(`${p}.quote.submitLabel`)}>${esc(get(ctx,`${p}.quote.submitLabel`,'WhatsApp ile İletişim'))}</span></button></form></aside></div>`)}
    ${section('related','detail-related section-sea',`<div class="container detail-related-grid"><div>${text(ctx,`${p}.related.title`,'Diğer Guletlerimizi Keşfedin','h2')}${text(ctx,`${p}.related.description`,'Her gulet, yeni bir hikâye. Türkiye’nin en güzel koylarında sizi bekleyen diğer guletlerimizi inceleyin.') }<a class="detail-text-link detail-text-link--light" href="${esc(href(ctx,'/filo/'))}"><span${bind(`${p}.related.linkLabel`)}>${esc(get(ctx,`${p}.related.linkLabel`,'Tüm Gulet Filomuz'))}</span><span aria-hidden="true">→</span></a></div>${(ctx?.collections?.gulets||[]).filter(x=>x.id!==activeGuletId).slice(0,2).map(row=>`<a class="detail-related-card" data-cms-collection="gulets" data-entity-id="${esc(row.id)}" href="${esc(href(ctx,(row.path && row.path !== '/filo/' ? row.path : row.inquiryUrl)||'/filo/'))}">${media(ctx,'',row.image||PHOTO.boat,'detail-related-image',row.name||'Gulet fotoğrafı')}<span data-cms-property="name">${esc(row.name||'Gulet')}</span></a>`).join('')}</div>`)}
  </main>`;
}

function contact(ctx) {
  const p='iletisim';
  const routes=(ctx?.collections?.routes||[]);
  return `<main class="fora-detail fora-detail--contact" aria-label="Fora Sailing ile iletişim">
    ${hero(ctx,p,'Hayalinizdeki Tatili Birlikte Planlayalım','Ege ve Akdeniz’in en özel koylarında, sizin için unutulmaz bir mavi yolculuk deneyimi tasarlayalım.','heroFleet',false,{hideActionsDesktop:true})}
    ${section('content','detail-contact-section',`<div class="container detail-contact-grid"><div class="detail-contact-form-wrap" data-section-id="form"><p class="detail-eyebrow detail-eyebrow--ink"${bind(`${p}.content.eyebrow`)}>${esc(get(ctx,`${p}.content.eyebrow`,'FORA SAILING'))}</p>${text(ctx,`${p}.content.title`,'Tatil Planınız İçin Bilgilerinizi Paylaşın','h2')}${text(ctx,`${p}.content.description`,'Hayalinizdeki mavi yolculuğu birlikte planlayabilmemiz için aşağıdaki formu doldurun. Ekibimiz en kısa sürede sizinle iletişime geçsin.')}<form class="detail-contact-form" data-form="contact"><input type="hidden" name="guletId"><input type="hidden" name="endDate"><label><span${bind(`${p}.form.name`)}>${esc(get(ctx,`${p}.form.name`,'Adınız Soyadınız'))}</span><input name="name" autocomplete="name" required></label><label><span${bind(`${p}.form.phone`)}>${esc(get(ctx,`${p}.form.phone`,'Telefon Numaranız'))}</span><input name="phone" type="tel" autocomplete="tel" required></label><label><span${bind(`${p}.form.email`)}>${esc(get(ctx,`${p}.form.email`,'E-posta Adresiniz'))}</span><input name="email" type="email" autocomplete="email" required></label><div class="detail-form-row"><label><span${bind(`${p}.form.date`)}>${esc(get(ctx,`${p}.form.date`,'Tarih Aralığı'))}</span><input name="startDate" type="date" aria-label="Başlangıç tarihi"></label><label><span${bind(`${p}.form.guests`)}>${esc(get(ctx,`${p}.form.guests`,'Misafir Sayısı'))}</span><select name="guests"><option value="">${esc(get(ctx,`${p}.form.guests`,'Misafir Sayısı'))}</option>${[2,4,6,8,10,12].map(n=>`<option value="${n}">${n} kişi</option>`).join('')}</select></label></div><label><span${bind(`${p}.form.route`)}>${esc(get(ctx,`${p}.form.route`,'Tercih Edilen Rota'))}</span><select name="routeId"><option value="">${esc(get(ctx,`${p}.form.route`,'Rota seçin'))}</option>${routes.map(row=>`<option value="${esc(row.id)}">${esc(row.name||row.title||row.id)}</option>`).join('')}</select></label><label><span${bind(`${p}.form.message`)}>${esc(get(ctx,`${p}.form.message`,'Mesajınız'))}</span><textarea name="message" rows="4"></textarea></label><button class="btn btn-gold" type="submit"><span${bind(`${p}.form.submit`)}>${esc(get(ctx,`${p}.form.submit`,'Teklif Talebi Gönder'))}</span><span aria-hidden="true">→</span></button></form></div><aside class="detail-contact-aside section-sea"><div class="detail-contact-aside-copy"><p class="detail-eyebrow"${bind(`${p}.aside.eyebrow`)}>${esc(get(ctx,`${p}.aside.eyebrow`,'FORA SAILING'))}</p><h2${bind(`${p}.aside.title`)}>${esc(get(ctx,`${p}.aside.title`,'Maviye\nİlk Adım')).replace(/\n/g,'<br>')}</h2><p${bind(`${p}.aside.description`)}>${esc(get(ctx,`${p}.aside.description`,'Sorularınız mı var? Rotalar, gulet filomuz veya deneyimlerimiz hakkında bize dilediğiniz zaman ulaşabilirsiniz.'))}</p><a class="btn btn-whatsapp" href="${esc(ctx.content.settings?.contact?.whatsapp||'https://wa.me/905496523538')}">${icon(ctx,'whatsapp')} <span${bind(`${p}.aside.whatsappLabel`)}>${esc(get(ctx,`${p}.aside.whatsappLabel`,'WhatsApp ile İletişim'))}</span></a></div>${media(ctx,`${p}.content.image`,'sunset','detail-contact-photo','Gün batımında gulet güvertesi')}</aside></div>`)}
    ${section('cta','detail-contact-cta',`<div class="container detail-contact-cta-copy">${text(ctx,`${p}.cta.title`,'Hayallerinize Yelken Açın','h2')}${text(ctx,`${p}.cta.description`,'Sizi dinliyor, hayallerinizi anlıyor ve size özel bir mavi yolculuk deneyimi için yanınızda oluyoruz.')}</div>${media(ctx,`${p}.cta.image`,'cove','detail-cta-photo','Turkuaz koyda gulet ve kıyı')}`)}
  </main>`;
}

const renderers = { about, 'route-detail': routeDetail, 'gulet-detail': gulet, contact };
export function renderDetail(pageKey, ctx = {}) { return (renderers[pageKey] || about)(ctx); }

export function initDetail(root) {
  if (!root) return () => {};
  const cleanups=[];
  const routeObserver=initRouteMaps(root);
  if(routeObserver) cleanups.push(()=>routeObserver.disconnect());
  root.querySelectorAll('[data-gallery]').forEach(galleryRoot => {
    const main=galleryRoot.querySelector('.detail-gallery-current');
    const buttons=[...galleryRoot.querySelectorAll('[data-gallery-src]')];
    const select=button=>{
      main.src=button.dataset.gallerySrc;
      main.alt=button.dataset.galleryAlt||'Eylül guleti';
      buttons.forEach(item=>item.setAttribute('aria-selected',String(item===button)));
    };
    const listeners=buttons.map(button=>{const click=()=>select(button);button.addEventListener('click',click);return()=>button.removeEventListener('click',click);});
    cleanups.push(()=>listeners.forEach(remove=>remove()));
  });
  return ()=>cleanups.forEach(fn=>fn());
}
