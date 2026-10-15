import { PHOTO } from './site-assets.js?v=20261015-99';

const FIELD_PHOTOS = Object.freeze({
  'home.hero.image': { photo: 'hero' },
  'home.reviews.avatarImage': { photo: 'reviewAvatar' },
  'home.story.image': { photo: 'storyCove' },
  'home.story.sideImage': { photo: 'swimmer' },
  'home.routes.image': { photo: 'routeSea' },
  'home.offer.image': { photo: 'sunsetWoman' },
  'home.benefits.image': { photo: 'benefitCoast' },
  'deneyimler.hero.image': { photo: 'heroExperiences' },
  'deneyimler.video.image': { photo: 'fleetQuote' },
  'deneyimler.plan.image': { photo: 'boat' },
  'rotalar.hero.image': { photo: 'heroRoutes' },
  'rotalar.planning.image': { photo: 'aboutTogether' },
  'rota-gocek-fethiye.hero.image': { photo: 'heroRoutes' },
  'rota-gocek-fethiye.content.image': { photo: 'routeStory' },
  'filo.hero.image': { photo: 'heroFleet' },
  'filo.content.image': { photo: 'saloon' },
  'filo.quote.image': { photo: 'fleetQuote' },
  'eylul.hero.image': { photo: 'heroFleet' },
  'eylul.content.image': { photo: 'guletDeck' },
  'hakkimizda.hero.image': { photo: 'heroFleet' },
  'hakkimizda.content.image': { photo: 'routeStory' },
  'hakkimizda.content.sideImage': { photo: 'aboutSide' },
  'hakkimizda.values.image': { photo: 'routeSea' },
  'hakkimizda.together.image': { photo: 'aboutTogether' },
  'hakkimizda.together.insetImage': { photo: 'swimmer' },
  'rota-gocek-fethiye.content.insetImage': { photo: 'routeInset' },
  'rota-gocek-fethiye.highlights.coveImage': { photo: 'routeCove' },
  'rota-gocek-fethiye.highlights.sunsetImage': { photo: 'sunsetWoman' },
  'eylul.content.insetImage': { photo: 'routeCove' },
  'eylul.content.sideImage': { photo: 'cabin' },
  'eylul.gallery.mainImage': { photo: 'saloon' },
  'iletisim.hero.image': { photo: 'heroFleet' },
  'iletisim.content.image': { photo: 'contactSunset' },
  'iletisim.cta.image': { photo: 'contactCta' },
});

const COLLECTION_PHOTOS = Object.freeze({
  routes: {
    'bodrum-gokova': { image: { expectedValue: 'assets/route-catalog-1.jpg', photo: 'routeBodrum' }, homeImage: { expectedValue: 'assets/route-bodrum-gokova.png', photo: 'homeBodrum' }, artwork: { expectedValue: 'rotalar/assets/art-card-1.png', photo: 'routeBodrum' } },
    'marmaris-datca': { image: { expectedValue: 'assets/route-catalog-2.jpg', photo: 'routeMarmaris' }, homeImage: { expectedValue: 'assets/route-marmaris-datca.png', photo: 'homeMarmaris' }, artwork: { expectedValue: 'rotalar/assets/art-card-2.png', photo: 'routeMarmaris' } },
    'kemer-kekova': { image: { expectedValue: 'assets/route-catalog-3.jpg', photo: 'routeKekova' }, homeImage: { expectedValue: 'assets/route-kemer-kekova.png', photo: 'homeKekova' }, artwork: { expectedValue: 'rotalar/assets/art-card-3.png', photo: 'routeKekova' } },
    'marmaris-fethiye': { image: { expectedValue: 'assets/route-catalog-4.jpg', photo: 'routeMarmarisFethiye' }, artwork: { expectedValue: 'rotalar/assets/art-card-4.png', photo: 'routeMarmarisFethiye' } },
    'gocek-fethiye': { image: { expectedValue: 'assets/route-catalog-5.jpg', photo: 'routeGocek' }, homeImage: { expectedValue: 'assets/route-gocek-fethiye.png', photo: 'homeGocek' }, artwork: { expectedValue: 'rotalar/assets/art-card-5.png', photo: 'routeGocek' } },
    'bodrum-yunan-adalari': { image: { expectedValue: 'assets/route-catalog-6.jpg', photo: 'routeGreek' }, artwork: { expectedValue: 'rotalar/assets/art-card-6.png', photo: 'routeGreek' } },
  },
  gulets: {
    eylul: { image: { expectedValue: 'assets/fleet-eylul.png', photo: 'boat' }, artwork: { expectedValue: 'filo/assets/art-card-1.png', photo: 'boat' }, gallery: { expectedValue: ['filo/eylul/assets/gallery-main.png', 'filo/eylul/assets/gallery-thumb-1.png', 'filo/eylul/assets/gallery-thumb-2.png', 'filo/eylul/assets/gallery-thumb-3.png', 'filo/eylul/assets/gallery-thumb-4.png'], photos: ['cabin', 'dining', 'cabin2', 'deck'] } },
    ata: { image: { expectedValue: 'assets/fleet-ata.png', photo: 'boat2' }, artwork: { expectedValue: 'filo/assets/art-card-2.png', photo: 'boat2' } },
    'miss-2': { image: { expectedValue: 'assets/fleet-miss2.png', photo: 'boat3' }, artwork: { expectedValue: 'filo/assets/art-card-3.png', photo: 'boat3' } },
    zel: { image: { expectedValue: 'assets/fleet-zel.png', photo: 'fleetZel' }, artwork: { expectedValue: 'filo/assets/art-card-4.png', photo: 'fleetZel' } },
    getaway: { image: { expectedValue: 'assets/fleet-getaway.png', photo: 'fleetGetaway' }, artwork: { expectedValue: 'filo/assets/art-card-5.png', photo: 'fleetGetaway' } },
  },
  experiences: {
    'ailece-mavi-yolculuk': { image: { expectedValue: 'assets/device-design-assets/images/801af00a1f876234ffc4.png', photo: 'family' } },
    'size-ozel-gulet-tatili': { image: { expectedValue: 'assets/device-design-assets/images/f0fab493786f234da45a.png', photo: 'aerial' } },
    'guvertede-gun-batimi': { image: { expectedValue: 'assets/device-design-assets/images/a1b9d9776943aaa37574.png', photo: 'sunsetWine' } },
    'koylarda-yuzme': { image: { expectedValue: 'assets/device-design-assets/images/3ba42991d5da4bc676fb.png', photo: 'swimmer' } },
  },
});

const EXPERIENCE_DESCRIPTIONS = Object.freeze({
  'ailece-mavi-yolculuk': 'Sevdiklerinizle birlikte, doğanın kalbinde unutulmaz anlar biriktirin.',
  'size-ozel-gulet-tatili': 'Rotanızı, ritminizi ve deneyiminizi sizin isteklerinize göre şekillendirin.',
  'guvertede-gun-batimi': 'Denizin üzerinde, gün batımının eşsiz renklerine tanıklık edin.',
  'koylarda-yuzme': 'Turkuaz sularda yüzün, bakir doğayla buluşun.',
});
const NATIVE_CONTENT_VERSION = 80;
const LEGACY_TEXT_DEFAULTS = Object.freeze({
  'eylul.content.note': { previous: 'Mavi sonsuzlukta sizi bekliyor…', current: 'Keşfet.\nHisset.\nYaşa…' },
  'filo.hero.eyebrow': { previous: 'MAVİ YOLCULUK • FORA SAILING', current: 'EGE VE AKDENİZ’İN EN GÜZEL KOYLARINDA' },
  'hakkimizda.hero.eyebrow': { previous: ['MAVİ YOLCULUK • FORA SAILING','MAVİ YOLCULUKTA'], current: 'FORA SAILING HAKKIMIZDA' },
  'hakkimizda.values.lead': { previous: 'Her yolculuk, sizin hayallerinizden ve beklentilerinizden doğar.', current: 'Her misafirimizin hayalleri, beklentileri ve keşfetmek istediği rotalar farklıdır. Biz, sizi dinler, ihtiyaçlarınızı anlar ve mavi yolculuk deneyiminizi size özel olarak şekillendiririz.' },
  'rota-gocek-fethiye.stops.description': { previous: 'Göcek, Fethiye ve Göcek.', current: 'Göcek’ten başlayıp Fethiye’ye uzanan bu rotada, birbirinden özel koylar ve büyüleyici manzaralar sizi bekliyor.' },
  'rota-gocek-fethiye.hero.eyebrow': { previous: 'MAVİ YOLCULUK • FORA SAILING', current: 'MAVİ YOLCULUK ROTALARI' },
  'eylul.hero.eyebrow': { previous: 'MAVİ YOLCULUK • FORA SAILING', current: 'GULET FİLOMUZ' },
  'rota-gocek-fethiye.quote.title': {
    previous: 'Turkuaz Koylar ve Güvertede Gün Batımı',
    current: 'Bu Rota İçin Teklif Alın',
  },
});
// Native template fallbacks that have no field in older CMS snapshots. These
// are presentation defaults only; existing CMS values always win.
const DEFAULT_FIELD_ROWS = Object.freeze([
  { pagePath: '/', sectionId: 'offer', binding: 'home.offer.note', type: 'textarea', label: 'Kampanya fotoğrafı notu', value: 'Mavi, insana\nhep iyi gelir.' },
  { pagePath: '/filo/eylul/', sectionId: 'content', binding: 'eylul.content.insetNote', type: 'textarea', label: 'Koy fotoğrafı notu', value: 'Mavi sonsuzlukta\nsizi bekliyor…' },
  { pagePath: '/filo/eylul/', sectionId: 'content', binding: 'eylul.content.sideImage', type: 'image', label: 'Kamara görünümü', value: '' },
  { pagePath: '/hakkimizda/', sectionId: 'values', binding: 'hakkimizda.values.image', type: 'image', label: 'Değerler deniz zemini', value: '' },
  { pagePath: '/hakkimizda/', sectionId: 'together', binding: 'hakkimizda.together.insetImage', type: 'image', label: 'Birlikte yüzme fotoğrafı', value: '' },
  { pagePath: '/filo/', sectionId: 'content', binding: 'filo.cards.detailsLabel', type: 'text', label: 'Kart detay bağlantısı', value: 'Detayları İncele' },
  { pagePath: '/', sectionId: 'hero', binding: 'home.hero.eyebrow', type: 'text', label: 'Üst başlık', value: 'Türkiye’nin en güzel kıyılarında' },
  { pagePath: '/', sectionId: 'hero', binding: 'home.proof.experienceValue', type: 'text', label: 'Deneyim değeri', value: '15+' },
  { pagePath: '/', sectionId: 'hero', binding: 'home.proof.experienceLabel', type: 'text', label: 'Deneyim etiketi', value: 'Yıllık Deneyim' },
  { pagePath: '/', sectionId: 'hero', binding: 'home.proof.guestValue', type: 'text', label: 'Misafir değeri', value: '50+' },
  { pagePath: '/', sectionId: 'hero', binding: 'home.proof.guestLabel', type: 'text', label: 'Misafir etiketi', value: 'Mutlu Misafir' },
  { pagePath: '/', sectionId: 'hero', binding: 'home.proof.ratingValue', type: 'text', label: 'Memnuniyet değeri', value: '5' },
  { pagePath: '/', sectionId: 'hero', binding: 'home.proof.ratingLabel', type: 'text', label: 'Memnuniyet etiketi', value: 'Misafir Memnuniyeti' },
  { pagePath: '/', sectionId: 'hero', binding: 'home.proof.safetyValue', type: 'text', label: 'Güvenli tatil değeri', value: '%100' },
  { pagePath: '/', sectionId: 'hero', binding: 'home.proof.safetyLabel', type: 'text', label: 'Güvenli tatil etiketi', value: 'Güvenli Tatil' },
  { pagePath: '/', sectionId: 'hero', binding: 'home.hero.note', type: 'textarea', label: 'El yazısı notu', value: 'Daha Fazlası\nMavi’de Saklı…' },
  { pagePath: '/', sectionId: 'story', binding: 'home.story.eyebrow', type: 'text', label: 'Hikâye üst başlığı', value: 'Mavi yolculuk, daha fazlası' },
  { pagePath: '/', sectionId: 'story', binding: 'home.story.linkLabel', type: 'text', label: 'Hikâye bağlantı metni', value: 'Hikayemizi Keşfedin' },
  { pagePath: '/', sectionId: 'story', binding: 'home.story.sideImage', type: 'image', label: 'Yan hikâye fotoğrafı', value: '' },
  { pagePath: '/', sectionId: 'story', binding: 'home.story.note', type: 'textarea', label: 'El yazısı notu', value: 'Mavi sonsuzlukta\nsizi bekliyor' },
  { pagePath: '/', sectionId: 'routes', binding: 'home.routes.eyebrow', type: 'text', label: 'Rotalar üst başlığı', value: 'Ege ve Akdeniz kıyılarında' },
  { pagePath: '/', sectionId: 'routes', binding: 'home.routes.image', type: 'image', label: 'Rota bölümü fotoğrafı', value: '' },
  { pagePath: '/', sectionId: 'routes', binding: 'home.routes.description', type: 'textarea', label: 'Rotalar açıklaması', value: 'Her rota, yeni bir hikâye. Türkiye’nin en güzel koylarında unutulmaz bir mavi yolculuk sizi bekliyor.' },
  { pagePath: '/', sectionId: 'routes', binding: 'home.routes.linkLabel', type: 'text', label: 'Rotalar bağlantı metni', value: 'Tüm Rotaları İncele' },
  { pagePath: '/', sectionId: 'fleet', binding: 'home.fleet.eyebrow', type: 'text', label: 'Filo üst başlığı', value: 'Denizde konfor ve özgürlük' },
  { pagePath: '/', sectionId: 'fleet', binding: 'home.fleet.link', type: 'url', label: 'Filo bağlantısı', value: '/filo/' },
  { pagePath: '/', sectionId: 'fleet', binding: 'home.fleet.description', type: 'textarea', label: 'Filo açıklaması', value: 'Konfor, zarafet ve özgürlük bir arada. Size en uygun guleti keşfedin.' },
  { pagePath: '/', sectionId: 'fleet', binding: 'home.fleet.linkLabel', type: 'text', label: 'Filo bağlantı metni', value: 'Tüm Filoyu Gör' },
  { pagePath: '/', sectionId: 'offer', binding: 'home.offer.eyebrow', type: 'text', label: 'Fırsat üst başlığı', value: 'Erken rezervasyon fırsatı' },
  { pagePath: '/', sectionId: 'offer', binding: 'home.offer.description', type: 'textarea', label: 'Fırsat açıklaması', value: '2026 sezonu için erken rezervasyon yapın, hayalinizdeki mavi yolculuk daha avantajlı olsun.' },
  { pagePath: '/', sectionId: 'offer', binding: 'home.offer.linkLabel', type: 'text', label: 'Fırsat bağlantı metni', value: 'Hemen Teklif Alın' },
  { pagePath: '/', sectionId: 'offer', binding: 'home.offer.image', type: 'image', label: 'Kampanya fotoğrafı', value: '' },
  { pagePath: '/', sectionId: 'benefits', binding: 'home.benefits.item1.title', type: 'text', label: 'Avantaj 1 başlığı', value: 'Lüks Konfor' },
  { pagePath: '/', sectionId: 'benefits', binding: 'home.benefits.item1.description', type: 'textarea', label: 'Avantaj 1 açıklaması', value: 'Üst düzey donanım' },
  { pagePath: '/', sectionId: 'benefits', binding: 'home.benefits.item2.title', type: 'text', label: 'Avantaj 2 başlığı', value: 'Profesyonel Ekip' },
  { pagePath: '/', sectionId: 'benefits', binding: 'home.benefits.item2.description', type: 'textarea', label: 'Avantaj 2 açıklaması', value: 'Deneyimli kadro' },
  { pagePath: '/', sectionId: 'benefits', binding: 'home.benefits.item3.title', type: 'text', label: 'Avantaj 3 başlığı', value: 'Kişiye Özel Rotalar' },
  { pagePath: '/', sectionId: 'benefits', binding: 'home.benefits.item3.description', type: 'textarea', label: 'Avantaj 3 açıklaması', value: 'Size özel planlama' },
  { pagePath: '/', sectionId: 'benefits', binding: 'home.benefits.item4.title', type: 'text', label: 'Avantaj 4 başlığı', value: 'Doğal ve Sürdürülebilir' },
  { pagePath: '/', sectionId: 'benefits', binding: 'home.benefits.item4.description', type: 'textarea', label: 'Avantaj 4 açıklaması', value: 'Doğayı koruyan turizm' },
  { pagePath: '/', sectionId: 'benefits', binding: 'home.benefits.image', type: 'image', label: 'Kıyı fotoğrafı', value: '' },
  { pagePath: '/', sectionId: 'reviews', binding: 'home.reviews.eyebrow', type: 'text', label: 'Yorumlar üst başlığı', value: 'Gerçek deneyimler, gerçek mutluluklar' },
  { pagePath: '/', sectionId: 'reviews', binding: 'home.reviews.linkLabel', type: 'text', label: 'Yorumlar bağlantı metni', value: 'Tüm Yorumları Gör' },
  { pagePath: '/', sectionId: 'reviews', binding: 'home.reviews.link', type: 'url', label: 'Yorumlar bağlantısı', value: 'iletisim/' },
  { pagePath: '/', sectionId: 'reviews', binding: 'home.reviews.location', type: 'text', label: 'Yorum konumu', value: 'İstanbul' },
  { pagePath: '/rotalar/', sectionId: 'hero', binding: 'rotalar.hero.eyebrow', type: 'textarea', label: 'Üst başlık', value: 'EGE VE AKDENİZ’İN EN GÜZEL KOYLARINDA' },
  { pagePath: '/rotalar/', sectionId: 'hero', binding: 'rotalar.hero.title', type: 'text', label: 'Başlık', value: 'Maviye Açılan Rotalar' },
  { pagePath: '/rotalar/', sectionId: 'hero', binding: 'rotalar.hero.description', type: 'text', label: 'Açıklama', value: 'Turkuaz koylar, tarihi limanlar ve büyüleyici adalar… Fora Sailing ile Ege ve Akdeniz’in en özel rotalarında mavi bir yolculuğa çıkın.' },
  { pagePath: '/rotalar/', sectionId: 'hero', binding: 'rotalar.hero.image', type: 'image', label: 'Kapak fotoğrafı', value: '' },
  { pagePath: '/rotalar/', sectionId: 'hero', binding: 'rotalar.hero.offerUrl', type: 'url', label: 'Teklif bağlantısı', value: '/iletisim/' },
  { pagePath: '/rotalar/', sectionId: 'hero', binding: 'rotalar.hero.ctaLabel', type: 'text', label: 'Teklif düğmesi', value: 'Rotanı Planla' },
  { pagePath: '/rotalar/', sectionId: 'hero', binding: 'rotalar.hero.note', type: 'text', label: 'Kapak notu', value: 'Yeni koylar, yeni hikâyeler…' },
  { pagePath: '/rotalar/', sectionId: 'header', binding: 'rotalar.header.offerLabel', type: 'text', label: 'Teklif düğmesi', value: 'Teklif Alın' },
  { pagePath: '/rotalar/', sectionId: 'content', binding: 'rotalar.content.eyebrow', type: 'text', label: 'Üst başlık', value: 'ROTALARIMIZ' },
  { pagePath: '/rotalar/', sectionId: 'content', binding: 'rotalar.content.title', type: 'text', label: 'İçerik başlığı', value: 'Her rota, başka bir hikâye.' },
  { pagePath: '/rotalar/', sectionId: 'content', binding: 'rotalar.content.description', type: 'text', label: 'İçerik açıklaması', value: 'Türkiye’nin en güzel kıyılarında, birbirinden özel rotalarla mavi yolculuğunuzu planlayın. İster sakin koylarda huzur arayın, ister tarihi limanları keşfedin; her rota size unutulmaz bir deneyim sunar.' },
  { pagePath: '/rotalar/', sectionId: 'content', binding: 'rotalar.content.note', type: 'text', label: 'İçerik notu', value: 'Aynı deniz, farklı güzellikler…' },
  { pagePath: '/rotalar/', sectionId: 'planning', binding: 'rotalar.planning.title', type: 'text', label: 'Planlama başlığı', value: 'Sen hayal et, birlikte planlayalım.' },
  { pagePath: '/rotalar/', sectionId: 'planning', binding: 'rotalar.planning.description', type: 'text', label: 'Planlama açıklaması', value: 'Rota önerileri, gulet seçenekleri ve size özel mavi yolculuk planı için bizimle iletişime geçin.' },
  { pagePath: '/rotalar/', sectionId: 'planning', binding: 'rotalar.planning.image', type: 'image', label: 'Planlama fotoğrafı', value: '' },
  { pagePath: '/filo/', sectionId: 'hero', binding: 'filo.hero.eyebrow', type: 'textarea', label: 'Üst başlık', value: 'EGE VE AKDENİZ’İN EN GÜZEL KOYLARINDA' },
  { pagePath: '/filo/', sectionId: 'hero', binding: 'filo.hero.title', type: 'text', label: 'Başlık', value: 'Denizdeki Evinizi Keşfedin' },
  { pagePath: '/filo/', sectionId: 'hero', binding: 'filo.hero.description', type: 'text', label: 'Açıklama', value: 'Her biri özel olarak seçilmiş gulet filomuzla, mavi yolculuğu en konforlu haliyle yaşayın.' },
  { pagePath: '/filo/', sectionId: 'hero', binding: 'filo.hero.image', type: 'image', label: 'Kapak fotoğrafı', value: '' },
  { pagePath: '/filo/', sectionId: 'hero', binding: 'filo.hero.offerUrl', type: 'url', label: 'Teklif bağlantısı', value: '/iletisim/' },
  { pagePath: '/filo/', sectionId: 'hero', binding: 'filo.hero.whatsappUrl', type: 'url', label: 'WhatsApp bağlantısı', value: 'https://wa.me/905496523538' },
  { pagePath: '/filo/', sectionId: 'hero', binding: 'filo.hero.ctaLabel', type: 'text', label: 'Teklif düğmesi', value: 'Teklif Alın' },
  { pagePath: '/filo/', sectionId: 'hero', binding: 'filo.hero.whatsappLabel', type: 'text', label: 'WhatsApp düğmesi', value: 'WhatsApp ile İletişim' },
  { pagePath: '/filo/', sectionId: 'hero', binding: 'filo.hero.note', type: 'text', label: 'Kapak notu', value: 'Mavi yolculukta eviniz burada…' },
  { pagePath: '/filo/', sectionId: 'content', binding: 'filo.content.eyebrow', type: 'text', label: 'Üst başlık', value: 'GULET FİLOMUZ' },
  { pagePath: '/filo/', sectionId: 'content', binding: 'filo.content.title', type: 'text', label: 'İçerik başlığı', value: 'Tarih ve Misafir Tercihinizi Seçin' },
  { pagePath: '/filo/', sectionId: 'content', binding: 'filo.content.description', type: 'text', label: 'İçerik açıklaması', value: 'Sizin için en uygun guleti bulmamıza yardımcı olun. Tarih aralığınızı ve misafir sayınızı seçerek size özel alternatifler sunalım.' },
  { pagePath: '/filo/', sectionId: 'content', binding: 'filo.content.dateLabel', type: 'text', label: 'Tarih alanı etiketi', value: 'Tarih Seçin' },
  { pagePath: '/filo/', sectionId: 'content', binding: 'filo.content.guestsLabel', type: 'text', label: 'Misafir alanı etiketi', value: 'Misafir Sayısı' },
  { pagePath: '/filo/', sectionId: 'content', binding: 'filo.content.filterButton', type: 'text', label: 'Filtre düğmesi', value: 'Guletleri Göster' },
  { pagePath: '/filo/', sectionId: 'quote', binding: 'filo.quote.title', type: 'text', label: 'Teklif başlığı', value: 'Size Uygun Guleti Birlikte Seçelim' },
  { pagePath: '/filo/', sectionId: 'quote', binding: 'filo.quote.description', type: 'text', label: 'Teklif açıklaması', value: 'Rotanızı, beklentilerinizi ve hayallerinizi paylaşın. Uzman ekibimiz size en uygun gulet ve rotayı birlikte planlasın.' },
  { pagePath: '/filo/', sectionId: 'quote', binding: 'filo.quote.note', type: 'text', label: 'Teklif notu', value: 'Sizin için en güzel rota…' },
  { pagePath: '/filo/', sectionId: 'quote', binding: 'filo.quote.image', type: 'image', label: 'Teklif fotoğrafı', value: '' },
  { pagePath: '/filo/', sectionId: 'header', binding: 'filo.header.offerLabel', type: 'text', label: 'Teklif düğmesi', value: 'Teklif Alın' },
  { pagePath: '/deneyimler/', sectionId: 'hero', binding: 'deneyimler.hero.eyebrow', type: 'text', label: 'Üst başlık', value: 'EGE VE AKDENİZ’İN EN GÜZEL KOYLARINDA' },
  { pagePath: '/deneyimler/', sectionId: 'hero', binding: 'deneyimler.hero.title', type: 'text', label: 'Başlık', value: 'Bir Tatilden Daha Fazlası' },
  { pagePath: '/deneyimler/', sectionId: 'hero', binding: 'deneyimler.hero.description', type: 'text', label: 'Açıklama', value: 'Her rota, yeni bir hikâye. Ege ve Akdeniz’in büyüleyici koylarında, doğayla iç içe, kendinize daha yakın anlar yaşayın.' },
  { pagePath: '/deneyimler/', sectionId: 'hero', binding: 'deneyimler.hero.image', type: 'image', label: 'Kapak fotoğrafı', value: '' },
  { pagePath: '/deneyimler/', sectionId: 'hero', binding: 'deneyimler.hero.offerUrl', type: 'url', label: 'Teklif bağlantısı', value: '/iletisim/' },
  { pagePath: '/deneyimler/', sectionId: 'hero', binding: 'deneyimler.hero.whatsappUrl', type: 'url', label: 'WhatsApp bağlantısı', value: 'https://wa.me/905496523538' },
  { pagePath: '/deneyimler/', sectionId: 'hero', binding: 'deneyimler.hero.ctaLabel', type: 'text', label: 'Teklif düğmesi', value: 'Teklif Alın' },
  { pagePath: '/deneyimler/', sectionId: 'hero', binding: 'deneyimler.hero.whatsappLabel', type: 'text', label: 'WhatsApp düğmesi', value: 'WhatsApp ile İletişim' },
  { pagePath: '/deneyimler/', sectionId: 'hero', binding: 'deneyimler.hero.note', type: 'text', label: 'Kapak notu', value: 'Mavi, insana hep iyi gelir…' },
  { pagePath: '/deneyimler/', sectionId: 'content', binding: 'deneyimler.content.eyebrow', type: 'text', label: 'Üst başlık', value: 'DENEYİMLER' },
  { pagePath: '/deneyimler/', sectionId: 'content', binding: 'deneyimler.content.title', type: 'text', label: 'İçerik başlığı', value: 'Maviyi Yaşamanın Farklı Yolları' },
  { pagePath: '/deneyimler/', sectionId: 'content', binding: 'deneyimler.content.description', type: 'text', label: 'İçerik açıklaması', value: 'Fora Sailing ile her yolculuk, size özel bir deneyime dönüşür. İster ailenizle, ister sevdiklerinizle; ister sadece kendinizle… Mavi yolculuğu, hayalinizdeki şekilde yaşayın.' },
  { pagePath: '/deneyimler/', sectionId: 'content', binding: 'deneyimler.content.note', type: 'text', label: 'İçerik notu', value: 'Paylaşılan anlar, daha da anlamlı…' },
  { pagePath: '/deneyimler/', sectionId: 'video', binding: 'deneyimler.video.title', type: 'text', label: 'Deneyim başlığı', value: 'Keşfet. Hisset. Yaşa.' },
  { pagePath: '/deneyimler/', sectionId: 'video', binding: 'deneyimler.video.description', type: 'text', label: 'Deneyim açıklaması', value: 'Mavi yolculuğun büyüsünü keşfedin. Ege ve Akdeniz’in eşsiz koylarında sizi bekleyen deneyimleri yakından görün.' },
  { pagePath: '/deneyimler/', sectionId: 'video', binding: 'deneyimler.video.image', type: 'image', label: 'Deneyim fotoğrafı', value: '' },
  { pagePath: '/deneyimler/', sectionId: 'video', binding: 'deneyimler.video.linkLabel', type: 'text', label: 'Deneyim bağlantı metni', value: 'Deneyimleri keşfedin' },
  { pagePath: '/deneyimler/', sectionId: 'video', binding: 'deneyimler.video.note', type: 'text', label: 'Deneyim notu', value: 'Mavi sonsuzlukta sizi bekliyor…' },
  { pagePath: '/deneyimler/', sectionId: 'plan', binding: 'deneyimler.plan.eyebrow', type: 'text', label: 'Planlama üst başlığı', value: 'HAYALİNİZDEKİ MAVİ YOLCULUK' },
  { pagePath: '/deneyimler/', sectionId: 'header', binding: 'deneyimler.header.offerLabel', type: 'text', label: 'Teklif düğmesi', value: 'Teklif Alın' },
  { pagePath: '/deneyimler/', sectionId: 'plan', binding: 'deneyimler.plan.title', type: 'text', label: 'Planlama başlığı', value: 'Deneyiminizi Planlayın' },
  { pagePath: '/deneyimler/', sectionId: 'plan', binding: 'deneyimler.plan.description', type: 'text', label: 'Planlama açıklaması', value: 'Siz de kendinize özel bir rota oluşturun. İsteklerinizi paylaşın, Fora Sailing ekibi hayalinizdeki mavi yolculuk deneyimini planlasın.' },
  { pagePath: '/deneyimler/', sectionId: 'plan', binding: 'deneyimler.plan.image', type: 'image', label: 'Planlama fotoğrafı', value: '' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'hero', binding: 'rota-gocek-fethiye.hero.eyebrow', type: 'text', label: 'Kapak üst başlığı', value: 'MAVİ YOLCULUK ROTALARI' },
  { pagePath: '/hakkimizda/', sectionId: 'hero', binding: 'hakkimizda.hero.eyebrow', type: 'text', label: 'Kapak üst başlığı', value: 'FORA SAILING HAKKIMIZDA' },
  { pagePath: '/hakkimizda/', sectionId: 'hero', binding: 'hakkimizda.hero.ctaLabel', type: 'text', label: 'Teklif düğmesi', value: 'Teklif Alın' },
  { pagePath: '/hakkimizda/', sectionId: 'hero', binding: 'hakkimizda.hero.whatsappLabel', type: 'text', label: 'WhatsApp düğmesi', value: 'WhatsApp ile İletişim' },
  { pagePath: '/filo/eylul/', sectionId: 'hero', binding: 'eylul.hero.eyebrow', type: 'text', label: 'Kapak üst başlığı', value: 'GULET FİLOMUZ' },
  { pagePath: '/iletisim/', sectionId: 'hero', binding: 'iletisim.hero.eyebrow', type: 'text', label: 'Kapak üst başlığı', value: 'MAVİ YOLCULUK • FORA SAILING' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'content', binding: 'rota-gocek-fethiye.content.insetImage', type: 'image', label: 'Rota küçük koy görseli', value: '' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'highlights', binding: 'rota-gocek-fethiye.highlights.coveImage', type: 'image', label: 'Rota koy görseli', value: '' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'highlights', binding: 'rota-gocek-fethiye.highlights.sunsetImage', type: 'image', label: 'Gün batımı görseli', value: '' },
  { pagePath: '/hakkimizda/', sectionId: 'content', binding: 'hakkimizda.content.sideImage', type: 'image', label: 'Hikâye yan görseli', value: '' },
  { pagePath: '/hakkimizda/', sectionId: 'together', binding: 'hakkimizda.together.image', type: 'image', label: 'Birlikte hikâyesi fotoğrafı', value: '' },
  { pagePath: '/filo/eylul/', sectionId: 'content', binding: 'eylul.content.insetImage', type: 'image', label: 'Eylül koy görseli', value: '' },
  { pagePath: '/iletisim/', sectionId: 'cta', binding: 'iletisim.cta.image', type: 'image', label: 'İletişim CTA görseli', value: '' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'content', binding: 'rota-gocek-fethiye.content.eyebrow', type: 'text', label: 'Üst başlık', value: 'GÖCEK — FETHİYE — GÖCEK' },
  { pagePath: '/hakkimizda/', sectionId: 'content', binding: 'hakkimizda.content.eyebrow', type: 'text', label: 'Üst başlık', value: 'MAVİ YOLCULUK, DAHA FAZLASI' },
  { pagePath: '/hakkimizda/', sectionId: 'values', binding: 'hakkimizda.values.eyebrow', type: 'text', label: 'Değerler üst başlığı', value: 'DENİZ, DOĞA, İNSAN' },
  { pagePath: '/hakkimizda/', sectionId: 'together', binding: 'hakkimizda.together.eyebrow', type: 'text', label: 'Birlikte üst başlığı', value: 'DENİZ, DOĞA, İNSAN' },
  { pagePath: '/filo/eylul/', sectionId: 'content', binding: 'eylul.content.eyebrow', type: 'text', label: 'Üst başlık', value: 'EYLÜL GULETİ' },
  { pagePath: '/filo/eylul/', sectionId: 'gallery', binding: 'eylul.gallery.eyebrow', type: 'text', label: 'Galeri üst başlığı', value: 'EYLÜL GULETİ' },
  { pagePath: '/filo/eylul/', sectionId: 'gallery', binding: 'eylul.gallery.mainImage', type: 'image', label: 'Ana galeri fotoğrafı', value: '' },
  ...['Kamara 1','Yemek Alanı','Kamara 2','Güverte'].map((value,index)=>({ pagePath:'/filo/eylul/', sectionId:'gallery', binding:`eylul.gallery.item${index+1}Label`, type:'text', label:`Galeri ${index+1} etiketi`, value })),
  { pagePath: '/filo/eylul/', sectionId: 'related', binding: 'eylul.related.linkLabel', type: 'text', label: 'Filo bağlantı metni', value: 'Tüm Gulet Filomuz' },
  { pagePath: '/iletisim/', sectionId: 'content', binding: 'iletisim.content.eyebrow', type: 'text', label: 'Üst başlık', value: 'FORA SAILING' },
  { pagePath: '/iletisim/', sectionId: 'content', binding: 'iletisim.aside.eyebrow', type: 'text', label: 'Yan alan üst başlığı', value: 'FORA SAILING' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'content', binding: 'rota-gocek-fethiye.content.eyebrow', type: 'text', label: 'Üst başlık', value: 'GÖCEK — FETHİYE — GÖCEK' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'content', binding: 'rota-gocek-fethiye.content.linkLabel', type: 'text', label: 'Bağlantı metni', value: 'Rota Hakkında Daha Fazla Bilgi' },
  { pagePath: '/hakkimizda/', sectionId: 'content', binding: 'hakkimizda.content.eyebrow', type: 'text', label: 'Üst başlık', value: 'MAVİ YOLCULUK, DAHA FAZLASI' },
  { pagePath: '/hakkimizda/', sectionId: 'values', binding: 'hakkimizda.values.eyebrow', type: 'text', label: 'Değerler üst başlığı', value: 'DENİZ, DOĞA, İNSAN' },
  { pagePath: '/hakkimizda/', sectionId: 'together', binding: 'hakkimizda.together.eyebrow', type: 'text', label: 'Birlikte üst başlığı', value: 'DENİZ, DOĞA, İNSAN' },
  { pagePath: '/filo/eylul/', sectionId: 'content', binding: 'eylul.content.eyebrow', type: 'text', label: 'Üst başlık', value: 'EYLÜL GULETİ' },
  { pagePath: '/filo/eylul/', sectionId: 'gallery', binding: 'eylul.gallery.eyebrow', type: 'text', label: 'Galeri üst başlığı', value: 'EYLÜL GULETİ' },
  ...['Kamara 1','Yemek Alanı','Kamara 2','Güverte'].map((value,index)=>({ pagePath:'/filo/eylul/', sectionId:'gallery', binding:`eylul.gallery.item${index+1}Label`, type:'text', label:`Galeri ${index+1} etiketi`, value })),
  { pagePath: '/filo/eylul/', sectionId: 'related', binding: 'eylul.related.linkLabel', type: 'text', label: 'Filo bağlantı metni', value: 'Tüm Gulet Filomuz' },
  { pagePath: '/iletisim/', sectionId: 'content', binding: 'iletisim.content.eyebrow', type: 'text', label: 'Üst başlık', value: 'FORA SAILING' },
  { pagePath: '/iletisim/', sectionId: 'content', binding: 'iletisim.aside.eyebrow', type: 'text', label: 'Yan alan üst başlığı', value: 'FORA SAILING' },
  ...[
    ['/', 'home'], ['/rotalar/', 'rotalar'], ['/filo/', 'filo'], ['/deneyimler/', 'deneyimler'],
    ['/hakkimizda/', 'hakkimizda'], ['/rotalar/gocek-fethiye-gocek/', 'rota-gocek-fethiye'],
    ['/filo/eylul/', 'eylul'], ['/iletisim/', 'iletisim'],
  ].flatMap(([pagePath, prefix]) => [
    { pagePath, sectionId: 'header', binding: `${prefix}.header.offerLabel`, type: 'text', label: 'Üst menü teklif metni', value: 'Teklif Alın' },
    { pagePath, sectionId: 'header', binding: `${prefix}.header.offerUrl`, type: 'url', label: 'Üst menü teklif bağlantısı', value: '/iletisim/' },
    { pagePath, sectionId: 'header', binding: `${prefix}.header.whatsappLabel`, type: 'text', label: 'Üst menü WhatsApp metni', value: 'WhatsApp ile İletişim' },
    { pagePath, sectionId: 'header', binding: `${prefix}.header.whatsappUrl`, type: 'url', label: 'Üst menü WhatsApp bağlantısı', value: 'https://wa.me/905496523538' },
  ]),
  ...['instagramUrl', 'youtubeUrl', 'facebookUrl'].map(key => ({ pagePath: '/', sectionId: 'footer', binding: `home.footer.${key}`, type: 'url', label: `${key.replace('Url', '')} bağlantısı`, value: '' })),
  { pagePath: '/', sectionId: 'footer', binding: 'home.footer.note', type: 'textarea', label: 'Altbilgi notu', value: 'Mavi\nYaşatır…' },
  { pagePath: '/hakkimizda/', sectionId: 'content', binding: 'hakkimizda.content.secondDescription', type: 'textarea', label: 'İkinci açıklama', value: 'Denizin dinginliği, doğanın sadeliği ve samimi misafirperverlik anlayışımızla, her yolculuğun size özel olmasına özen gösteriyoruz.' },
  { pagePath: '/hakkimizda/', sectionId: 'values', binding: 'hakkimizda.values.lead', type: 'textarea', label: 'Değerler giriş metni', value: 'Her yolculuk, sizin hayallerinizden ve beklentilerinizden doğar.' },
  { pagePath: '/hakkimizda/', sectionId: 'values', binding: 'hakkimizda.values.item1Description', type: 'textarea', label: 'Özenli planlama açıklaması', value: 'Seyahatinizin her aşamasını, detaylarıyla birlikte düşünür; sizin için en ideal deneyimi planlarız.' },
  { pagePath: '/hakkimizda/', sectionId: 'values', binding: 'hakkimizda.values.item2Description', type: 'textarea', label: 'Size özel rotalar açıklaması', value: 'İlgi alanlarınıza, beklentilerinize ve seyahat tarzınıza uygun rotalar oluştururuz.' },
  { pagePath: '/hakkimizda/', sectionId: 'values', binding: 'hakkimizda.values.item3Description', type: 'textarea', label: 'Denizle iç içe açıklaması', value: 'Kalabalıktan uzak, doğayla uyumlu ve unutulmaz anlarla dolu bir yolculuk için yanınızdayız.' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'highlights', binding: 'rota-gocek-fethiye.highlights.coveTitle', type: 'text', label: 'Koy başlığı', value: 'Turkuaz Koylar' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'highlights', binding: 'rota-gocek-fethiye.highlights.coveDescription', type: 'textarea', label: 'Koy açıklaması', value: 'Her gün farklı bir koyda yüzmenin, berrak sularda serinlemenin ve doğanın sunduğu huzuru hissetmenin ayrıcalığını yaşayın.' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'highlights', binding: 'rota-gocek-fethiye.highlights.coveLinkLabel', type: 'text', label: 'Koy bağlantı metni', value: 'Koyları Keşfet' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'highlights', binding: 'rota-gocek-fethiye.highlights.sunsetTitle', type: 'text', label: 'Gün batımı başlığı', value: 'Güvertede Gün Batımı' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'highlights', binding: 'rota-gocek-fethiye.highlights.sunsetDescription', type: 'textarea', label: 'Gün batımı açıklaması', value: 'Günün sonunda guletinizin güvertesinde Akdeniz’in eşsiz gün batımını izleyin.' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'highlights', binding: 'rota-gocek-fethiye.highlights.sunsetLinkLabel', type: 'text', label: 'Gün batımı bağlantı metni', value: 'Deneyimleri Keşfet' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'quote', binding: 'rota-gocek-fethiye.quote.dateLabel', type: 'text', label: 'Tarih alanı etiketi', value: 'Tarih Aralığı' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'quote', binding: 'rota-gocek-fethiye.quote.guestsLabel', type: 'text', label: 'Misafir alanı etiketi', value: 'Misafir Sayısı' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'quote', binding: 'rota-gocek-fethiye.quote.title', type: 'text', label: 'Teklif başlığı', value: 'Bu Rota İçin Teklif Alın' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'quote', binding: 'rota-gocek-fethiye.quote.note', type: 'text', label: 'Teklif notu', value: 'Mavi, size çok yakışacak…' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'quote', binding: 'rota-gocek-fethiye.quote.submitLabel', type: 'text', label: 'Teklif düğmesi', value: 'Bu Rota İçin Teklif Alın' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'highlights', binding: 'rota-gocek-fethiye.highlights.eyebrow', type: 'text', label: 'Öne çıkanlar üst başlığı', value: 'KOYLAR VE KIYILAR' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'stops', binding: 'rota-gocek-fethiye.stops.linkLabel', type: 'text', label: 'Durak bağlantı metni', value: 'Rota Detaylarını İncele' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'hero', binding: 'rota-gocek-fethiye.hero.ctaLabel', type: 'text', label: 'Teklif düğmesi', value: 'Teklif Alın' },
  { pagePath: '/rotalar/gocek-fethiye-gocek/', sectionId: 'hero', binding: 'rota-gocek-fethiye.hero.whatsappLabel', type: 'text', label: 'WhatsApp düğmesi', value: 'WhatsApp ile İletişim' },
  { pagePath: '/filo/eylul/', sectionId: 'quote', binding: 'eylul.quote.dateLabel', type: 'text', label: 'Tarih alanı etiketi', value: 'Tarih Seçin' },
  { pagePath: '/filo/eylul/', sectionId: 'quote', binding: 'eylul.quote.guestsLabel', type: 'text', label: 'Kişi sayısı etiketi', value: 'Kişi Sayısı' },
  { pagePath: '/filo/eylul/', sectionId: 'quote', binding: 'eylul.quote.messageLabel', type: 'text', label: 'Mesaj alanı etiketi', value: 'Mesajınız' },
  { pagePath: '/filo/eylul/', sectionId: 'quote', binding: 'eylul.quote.submitLabel', type: 'text', label: 'Teklif düğmesi', value: 'WhatsApp ile İletişim' },
  { pagePath: '/filo/eylul/', sectionId: 'hero', binding: 'eylul.hero.ctaLabel', type: 'text', label: 'Teklif düğmesi', value: 'Teklif Alın' },
  { pagePath: '/filo/eylul/', sectionId: 'hero', binding: 'eylul.hero.whatsappLabel', type: 'text', label: 'WhatsApp düğmesi', value: 'WhatsApp ile İletişim' },
  { pagePath: '/iletisim/', sectionId: 'content', binding: 'iletisim.aside.title', type: 'textarea', label: 'İletişim yan alanı başlığı', value: 'Maviye\nİlk Adım' },
  { pagePath: '/iletisim/', sectionId: 'content', binding: 'iletisim.aside.description', type: 'textarea', label: 'İletişim yan alanı açıklaması', value: 'Sorularınız mı var? Rotalar, gulet filomuz veya deneyimlerimiz hakkında bize dilediğiniz zaman ulaşabilirsiniz.' },
  { pagePath: '/iletisim/', sectionId: 'content', binding: 'iletisim.aside.whatsappLabel', type: 'text', label: 'WhatsApp bağlantı metni', value: 'WhatsApp ile İletişim' },
  { pagePath: '/iletisim/', sectionId: 'content', binding: 'iletisim.aside.eyebrow', type: 'text', label: 'Yan alan üst başlığı', value: 'FORA SAILING' },
  { pagePath: '/iletisim/', sectionId: 'hero', binding: 'iletisim.hero.ctaLabel', type: 'text', label: 'Teklif düğmesi', value: 'Teklif Alın' },
  { pagePath: '/iletisim/', sectionId: 'hero', binding: 'iletisim.hero.whatsappLabel', type: 'text', label: 'WhatsApp düğmesi', value: 'WhatsApp ile İletişim' },
  { pagePath: '/', sectionId: 'footer', binding: 'home.footer.copyright', type: 'text', label: 'Telif hakkı metni', value: '© 2026 Fora Sailing. Tüm hakları saklıdır.' },
  {"pagePath": "/", "sectionId": "offer", "binding": "home.offer.badge", "type": "textarea", "label": "Sezon rozeti", "value": "2026\nSEZONU\nAVANTAJLI\nFİYATLAR"},
  {"pagePath": "/", "sectionId": "benefits", "binding": "home.benefits.note", "type": "textarea", "label": "El yazısı notu", "value": "Aynı deniz,\ndaha güzel bir gelecek için…"},
  {"pagePath": "/", "sectionId": "reviews", "binding": "home.reviews.avatarImage", "type": "image", "label": "Misafir portresi", "value": "assets/native-review-avatar-v1.webp"},
  {"pagePath": "/", "sectionId": "routes", "binding": "home.routes.note", "type": "textarea", "label": "El yazısı notu", "value": "Her rota,\nbaşka bir masal…"},
  {"pagePath": "/", "sectionId": "routes", "binding": "home.routes.footerNote", "type": "textarea", "label": "El yazısı notu", "value": "Her an yanınızda…"},
  {"pagePath": "/", "sectionId": "routes", "binding": "home.phone.note", "type": "textarea", "label": "El yazısı notu", "value": "Mavi, size çok yakışacak…"},
  {"pagePath": "/deneyimler/", "sectionId": "content", "binding": "deneyimler.content.sideNote", "type": "textarea", "label": "El yazısı notu", "value": "Her rota, başka bir masal…"},
  {"pagePath": "/deneyimler/", "sectionId": "plan", "binding": "deneyimler.plan.note", "type": "textarea", "label": "El yazısı notu", "value": "Güzel anılar hep ileride…"},
  {"pagePath": "/hakkimizda/", "sectionId": "hero", "binding": "hakkimizda.hero.note", "type": "textarea", "label": "El yazısı notu", "value": "Aynı deniz, daha güzel bir gün…"},
  {"pagePath": "/hakkimizda/", "sectionId": "content", "binding": "hakkimizda.content.note", "type": "textarea", "label": "El yazısı notu", "value": "Keşfet. Hisset. Yaşa…"},
  {"pagePath": "/hakkimizda/", "sectionId": "values", "binding": "hakkimizda.values.note", "type": "textarea", "label": "El yazısı notu", "value": "Her rota, başka bir masal…"},
  {"pagePath": "/hakkimizda/", "sectionId": "together", "binding": "hakkimizda.together.note", "type": "textarea", "label": "El yazısı notu", "value": "Daha fazla mavi, daha fazla siz…"},
  {"pagePath": "/hakkimizda/", "sectionId": "together", "binding": "hakkimizda.together.insetNote", "type": "textarea", "label": "El yazısı notu", "value": "Mavi insana hep iyi gelir."},
  {"pagePath": "/rotalar/gocek-fethiye-gocek/", "sectionId": "hero", "binding": "rota-gocek-fethiye.hero.note", "type": "textarea", "label": "El yazısı notu", "value": "Aynı deniz, daha güzel bir gelecek…"},
  {"pagePath": "/rotalar/gocek-fethiye-gocek/", "sectionId": "content", "binding": "rota-gocek-fethiye.content.note", "type": "textarea", "label": "El yazısı notu", "value": "Keşfet. Hisset. Yaşa…"},
  {"pagePath": "/rotalar/gocek-fethiye-gocek/", "sectionId": "content", "binding": "rota-gocek-fethiye.content.insetNote", "type": "textarea", "label": "El yazısı notu", "value": "Turkuaz sular, saklı koylar, sonsuz keşif…"},
  {"pagePath": "/rotalar/gocek-fethiye-gocek/", "sectionId": "stops", "binding": "rota-gocek-fethiye.stops.note", "type": "textarea", "label": "El yazısı notu", "value": "Her durakta yeni bir hikâye."},
  {"pagePath": "/rotalar/gocek-fethiye-gocek/", "sectionId": "highlights", "binding": "rota-gocek-fethiye.highlights.coveNote", "type": "textarea", "label": "El yazısı notu", "value": "Sadece deniz değil, bir yaşam tarzı…"},
  {"pagePath": "/filo/eylul/", "sectionId": "hero", "binding": "eylul.hero.note", "type": "textarea", "label": "El yazısı notu", "value": "Mavi içinde daha fazlası sizi bekliyor…"},
  {"pagePath": "/filo/eylul/", "sectionId": "content", "binding": "eylul.content.note", "type": "textarea", "label": "El yazısı notu", "value": "Keşfet.\nHisset.\nYaşa…"},
  {"pagePath": "/filo/eylul/", "sectionId": "related", "binding": "eylul.related.note", "type": "textarea", "label": "El yazısı notu", "value": "Her rota başka bir masal…"},
  {"pagePath": "/filo/eylul/", "sectionId": "related", "binding": "eylul.related.guletIds", "type": "textarea", "label": "Önerilen guletler (kimlikleri virgülle ayırın)", "value": "ata,getaway"},
  {"pagePath": "/iletisim/", "sectionId": "hero", "binding": "iletisim.hero.note", "type": "textarea", "label": "El yazısı notu", "value": "Mavi, hemen şimdi başlıyor…"},
  {"pagePath": "/iletisim/", "sectionId": "content", "binding": "iletisim.aside.note", "type": "textarea", "label": "El yazısı notu", "value": "Güzel planlar daima daha yakın…"},
  {"pagePath": "/iletisim/", "sectionId": "cta", "binding": "iletisim.cta.note", "type": "textarea", "label": "El yazısı notu", "value": "Aynı deniz, daha güzel bir gelecek için…"},

]);

const DEFAULT_FIELDS = Object.freeze([...new Map(DEFAULT_FIELD_ROWS.map(field => [`${field.pagePath}|${field.binding}`, field])).values()]);

const PAGE_PREFIXES = Object.freeze({
  '/': 'home', '/rotalar/': 'rotalar', '/filo/': 'filo', '/deneyimler/': 'deneyimler',
  '/hakkimizda/': 'hakkimizda', '/rotalar/gocek-fethiye-gocek/': 'rota-gocek-fethiye',
  '/filo/eylul/': 'eylul', '/iletisim/': 'iletisim',
});
const NATIVE_EXTRA_BINDINGS = Object.freeze({
  '/': [
    'hero.title','hero.description','hero.image','hero.offerLabel','hero.offerUrl','hero.whatsappLabel','hero.whatsappUrl',
    'story.title','story.description','story.link','story.image','routes.title','routes.link','fleet.title','fleet.link',
    'offer.title','offer.link','benefits.title','reviews.title','reviews.quote','reviews.author',
    ...['experienceValue','experienceLabel','guestValue','guestLabel','ratingValue','ratingLabel','safetyValue','safetyLabel'].map(key=>`proof.${key}`),
    ...[1,2,3,4].flatMap(index=>[`benefits.item${index}.title`,`benefits.item${index}.description`]),
  ],
  '/rotalar/': ['rotalar.hero.title','rotalar.hero.description','rotalar.hero.image','rotalar.hero.offerUrl','rotalar.content.title','rotalar.content.description','rotalar.planning.title','rotalar.planning.description'],
  '/filo/': ['filo.hero.title','filo.hero.description','filo.hero.image','filo.hero.offerUrl','filo.hero.whatsappUrl','filo.content.title','filo.content.description','filo.quote.title','filo.quote.description'],
  '/deneyimler/': ['deneyimler.hero.title','deneyimler.hero.description','deneyimler.hero.image','deneyimler.hero.offerUrl','deneyimler.hero.whatsappUrl','deneyimler.content.title','deneyimler.content.description','deneyimler.content.link','deneyimler.video.title','deneyimler.video.description','deneyimler.plan.title','deneyimler.plan.description'],
  '/hakkimizda/': ['hakkimizda.hero.title','hakkimizda.hero.description','hakkimizda.hero.image','hakkimizda.content.title','hakkimizda.content.description','hakkimizda.content.secondDescription','hakkimizda.content.image','hakkimizda.content.sideImage','hakkimizda.values.title','hakkimizda.values.lead','hakkimizda.together.title','hakkimizda.together.description','hakkimizda.together.image',...['item1','item2','item3'].flatMap(key=>[`hakkimizda.values.${key}`,`hakkimizda.values.${key}Description`])],
  '/rotalar/gocek-fethiye-gocek/': ['rota-gocek-fethiye.hero.title','rota-gocek-fethiye.hero.description','rota-gocek-fethiye.hero.image','rota-gocek-fethiye.content.title','rota-gocek-fethiye.content.description','rota-gocek-fethiye.content.link','rota-gocek-fethiye.content.image','rota-gocek-fethiye.content.insetImage','rota-gocek-fethiye.stops.title','rota-gocek-fethiye.stops.description','rota-gocek-fethiye.stops.linkLabel','rota-gocek-fethiye.highlights.eyebrow','rota-gocek-fethiye.highlights.coveImage','rota-gocek-fethiye.highlights.coveTitle','rota-gocek-fethiye.highlights.coveDescription','rota-gocek-fethiye.highlights.coveLinkLabel','rota-gocek-fethiye.highlights.sunsetImage','rota-gocek-fethiye.highlights.sunsetTitle','rota-gocek-fethiye.highlights.sunsetDescription','rota-gocek-fethiye.highlights.sunsetLinkLabel','rota-gocek-fethiye.quote.title','rota-gocek-fethiye.quote.note','rota-gocek-fethiye.quote.description','rota-gocek-fethiye.quote.dateLabel','rota-gocek-fethiye.quote.guestsLabel','rota-gocek-fethiye.quote.submitLabel'],
  '/filo/eylul/': ['eylul.hero.title','eylul.hero.description','eylul.hero.image','eylul.content.title','eylul.content.description','eylul.content.image','eylul.content.insetImage','eylul.gallery.title','eylul.gallery.description','eylul.quote.title','eylul.quote.description','eylul.quote.dateLabel','eylul.quote.guestsLabel','eylul.quote.messageLabel','eylul.quote.submitLabel','eylul.related.title','eylul.related.description'],
  '/iletisim/': ['iletisim.hero.title','iletisim.hero.description','iletisim.hero.image','iletisim.content.title','iletisim.content.description','iletisim.content.image','iletisim.cta.title','iletisim.cta.description','iletisim.cta.image','iletisim.aside.title','iletisim.aside.description','iletisim.aside.whatsappLabel',...['name','phone','email','date','guests','route','message','submit'].map(key=>`iletisim.form.${key}`)],
});
const HEADER_BINDINGS = Object.values(PAGE_PREFIXES).flatMap(prefix => ['offerLabel','offerUrl','whatsappLabel','whatsappUrl'].map(key => `${prefix}.header.${key}`));
const FOOTER_BINDINGS = ['copyright','tagline','note','instagramUrl','youtubeUrl','facebookUrl'].map(key => `home.footer.${key}`);
const NATIVE_BINDINGS = new Set([
  ...DEFAULT_FIELDS.map(field=>field.binding), ...HEADER_BINDINGS, ...FOOTER_BINDINGS,
  ...Object.entries(NATIVE_EXTRA_BINDINGS).flatMap(([path,bindings]) => bindings.map(binding => path === '/' && !binding.startsWith('home.') ? `home.${binding}` : binding)),
]);

export function isNativeField(pagePath, field) {
  const binding = String(field?.binding || '');
  if (!binding || binding.includes('.device.') || field?.layerOnly) return false;
  return NATIVE_BINDINGS.has(binding) && (!pagePath || PAGE_PREFIXES[pagePath] === binding.split('.')[0]);
}

function photoAsset(mapping, photos) {
  if (Array.isArray(mapping?.photos)) return mapping.photos.map(key => photos[key]).filter(Boolean);
  return mapping?.asset || photos[mapping?.photo] || '';
}

function matchesExpected(value, expected) {
  return Array.isArray(expected) ? JSON.stringify(value) === JSON.stringify(expected) : value === expected;
}

/** Deep clone CMS content and replace only values that still equal known defaults. */
export function normalizeNativeContent(content, options = {}) {
  const normalized = structuredClone(content);
  const storedVersion = Number(normalized.settings?.nativeContentVersion);
  const legacyCopyMigration = !Number.isFinite(storedVersion) || storedVersion < NATIVE_CONTENT_VERSION;
  if (!normalized.settings || typeof normalized.settings !== 'object' || Array.isArray(normalized.settings)) normalized.settings = {};
  normalized.settings.nativeContentVersion = Math.max(NATIVE_CONTENT_VERSION, Number.isFinite(storedVersion) ? storedVersion : 0);
  const photos = options.photos || PHOTO;
  const defaults = options.includeDefaultFields === false ? [] : DEFAULT_FIELDS;
  for (const page of normalized.pages || []) {
    if (page.path === '/rotalar/gocek-fethiye-gocek/' && !(page.sections || []).some(section => section.id === 'highlights')) {
      const quoteIndex = (page.sections || []).findIndex(section => section.id === 'quote');
      const section = { id: 'highlights', label: 'Öne Çıkanlar', fields: [] };
      page.sections ||= [];
      page.sections.splice(quoteIndex < 0 ? page.sections.length : quoteIndex, 0, section);
    }
    for (const fieldDefault of defaults.filter(item => item.pagePath === page.path)) {
      const section = (page.sections || []).find(item => item.id === fieldDefault.sectionId);
      if (!section || (page.sections || []).some(item => (item.fields || []).some(field => field.binding === fieldDefault.binding))) continue;
      section.fields ||= [];
      const photo = photoAsset(FIELD_PHOTOS[fieldDefault.binding], photos);
      const value = photo || fieldDefault.value;
      section.fields.push({
        id: `native-${fieldDefault.binding}`,
        label: fieldDefault.label,
        type: fieldDefault.type,
        binding: fieldDefault.binding,
        value,
        defaultValue: value,
      });
    }
    for (const section of page.sections || []) {
      for (const field of section.fields || []) {
        const textMigration = LEGACY_TEXT_DEFAULTS[field.binding];
        if (textMigration && field.canonicalEdit !== true && field.value === field.defaultValue && (Array.isArray(textMigration.previous) ? textMigration.previous.includes(field.value) : field.value === textMigration.previous)) {
          field.value = textMigration.current;
          field.defaultValue = textMigration.current;
        }
        const mapping = FIELD_PHOTOS[field.binding];
        const asset = photoAsset(mapping, photos);
        if (!asset || !['image', 'media'].includes(field.type)) continue;
        if (field.canonicalEdit === true || field.value !== field.defaultValue) continue;
        field.value = asset;
        field.defaultValue = asset;
        field.deviceOnly = false;
        delete field.deviceOverrides;
      }
    }
  }
  for (const item of normalized.experiences || []) {
    const fallbackDescription = EXPERIENCE_DESCRIPTIONS[String(item.id)];
    if (!fallbackDescription) continue;
    if (item.description == null || (legacyCopyMigration && item.description === '')) item.description = fallbackDescription;
  }
  for (const [collectionName, entries] of Object.entries(COLLECTION_PHOTOS)) {
    for (const item of normalized[collectionName] || []) {
      const propertyMappings = entries[String(item.id)];
      if (!propertyMappings) continue;
      for (const [property, mapping] of Object.entries(propertyMappings)) {
        const asset = photoAsset(mapping, photos);
        if (asset && (matchesExpected(item[property], mapping.expectedValue) || item[property] == null)) item[property] = asset;
      }
    }
  }
  return normalized;
}

export { DEFAULT_FIELDS, FIELD_PHOTOS, COLLECTION_PHOTOS };
