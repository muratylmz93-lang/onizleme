const FILTERS = [
  { key: 'rotalar', label: 'Rotalar' },
  { key: 'gulet-tatili', label: 'Gulet Tatili' },
  { key: 'tatil-planlama', label: 'Tatil Planlama' },
  { key: 'deniz-yasami', label: 'Deniz Yaşamı' },
];
const TOPICS = [
  ...FILTERS,
  { key: 'ailece-seyahat', label: 'İpuçları ve Öneriler' },
];
const ROUTES = [
  ['Göcek', '/rotalar/gocek-fethiye-gocek/'],
  ['Bodrum', '/rotalar/'],
  ['Marmaris', '/rotalar/'],
  ['Datça', '/rotalar/'],
  ['Fethiye', '/rotalar/'],
  ['Kemer ve Kekova', '/rotalar/'],
];
const ICONS = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.7"/><path d="m16 16 4.2 4.2"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>',
  compass: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11.5"/><path d="m20.5 11.5-3.2 6.8-6.8 3.2 3.2-6.8zM16 2v3m0 22v3M2 16h3m22 0h3"/></svg>',
  pin: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M25 13c0 7-9 16-9 16S7 20 7 13a9 9 0 1 1 18 0Z"/><circle cx="16" cy="13" r="3"/></svg>',
  map: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m3 7 8-4 10 4 8-4v22l-8 4-10-4-8 4zM11 3v22m10-18v22"/></svg>',
  anchor: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="7" r="3"/><path d="M16 10v17m-7-10a8 8 0 0 0 14 0M3 20c3 6 7 9 13 9s10-3 13-9M11 13h10"/></svg>',
  sail: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3v23M14 6 5 23h9zm4 4v13h9L18 10zM4 27h24l-3 3H7z"/></svg>',
};
const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const get = (ctx, key, fallback) => {
  const value = ctx && typeof ctx.get === 'function' ? ctx.get(key) : undefined;
  return value == null ? fallback : value;
};
const asset = (ctx, path) => ctx && typeof ctx.asset === 'function' ? ctx.asset(path) : path;
const url = (ctx, path) => ctx && typeof ctx.url === 'function' ? ctx.url(path) : path;
const prop = name => ' data-cms-property="' + esc(name) + '"';
const imageFor = (ctx, post) => {
  const raw = ctx && typeof ctx.getBlogImage236 === 'function' ? ctx.getBlogImage236(post, 'card') : post.image;
  return raw ? asset(ctx, raw) : '';
};
function photoMarkup(ctx, post, loading) {
  const image = imageFor(ctx, post);
  if (!image) return '';
  const rawMobile = ctx && typeof ctx.getBlogMobileImage236 === 'function' ? ctx.getBlogMobileImage236(post) : '';
  const mobile = rawMobile ? asset(ctx, rawMobile) : '';
  const img = '<img src="' + esc(image) + '" alt="' + esc(post.title || '') + '" loading="' + loading + '"' + prop('image') + '>';
  return mobile && mobile !== image ? '<picture><source media="(max-width:760px)" srcset="' + esc(mobile) + '">' + img + '</picture>' : img;
}
const postPath = post => post.path || '/blog/' + (post.slug || '') + '/';
const entityAttrs = post => ' data-cms-collection="blog" data-entity-id="' + esc(post.id || post.slug || '') + '" data-blog-post data-category-key="' + esc(post.categoryKey || '') + '" data-title="' + esc(post.title || '') + '" data-excerpt="' + esc(post.excerpt || '') + '"';
const dateText = (post, field = 'publishedAt') => {
  const raw = post[field] || '';
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  try { return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date); }
  catch (_) { return raw; }
};
const multiline = value => esc(value).replace(/\r?\n/g, '<br>');
const category = post => post.category || (TOPICS.find(item => item.key === post.categoryKey)?.label || '');

function renderFeature(ctx, post) {
  if (!post) return '';
  const href = esc(url(ctx, postPath(post)));
  return '<article class="bl236-feature" data-reveal' + entityAttrs(post) + '>' +
    '<a class="bl236-feature__photo" href="' + href + '">' +
    photoMarkup(ctx, post, 'eager') + '</a>' +
    '<div class="bl236-feature__copy"><p class="bl236-overline"' + prop('category') + '>' + esc(category(post)) + '</p>' +
    '<h2' + prop('title') + '><a href="' + href + '">' + esc(post.title) + '</a></h2><p class="bl236-feature__excerpt"' + prop('excerpt') + '>' + esc(post.excerpt) + '</p>' +
    '<p class="bl236-feature__meta"><span' + prop('author') + '>' + esc(post.author || '') + '</span><span>·</span><span>Güncellendi: ' + esc(dateText(post, 'updatedAt') || dateText(post)) + '</span><span>·</span><span>' + esc(post.readMinutes || '') + ' dk</span></p>' +
    '<a class="bl236-button bl236-button--gold bl236-feature__button" href="' + href + '">' + esc(get(ctx, 'blog.list.readLabel', 'Rehberi Oku')) + ' ' + ICONS.arrow + '</a></div></article>';
}

function renderCard(ctx, post) {
  const href = esc(url(ctx, postPath(post)));
  return '<article class="bl236-card" data-reveal' + entityAttrs(post) + '><a class="bl236-card__photo" href="' + href + '">' +
    photoMarkup(ctx, post, 'lazy') + '</a>' +
    '<div class="bl236-card__copy"><p class="bl236-overline"' + prop('category') + '>' + esc(category(post)) + '</p>' +
    '<h3' + prop('title') + '><a href="' + href + '">' + esc(post.title) + '</a></h3><p class="bl236-card__excerpt"' + prop('excerpt') + '>' + esc(post.excerpt) + '</p>' +
    '<p class="bl236-card__meta"><time>' + esc(dateText(post)) + '</time><span>·</span><span>' + esc(post.readMinutes || '') + ' dk</span></p>' +
    '<a class="bl236-card__arrow" aria-label="' + esc(post.title) + ' — rehberi oku" href="' + href + '">' + ICONS.arrow + '</a></div></article>';
}

function renderSidebar(ctx) {
  const topics = TOPICS.map(item => '<button type="button" data-blog-category="' + esc(item.key) + '">' + (item.key === 'rotalar' ? ICONS.map : item.key === 'gulet-tatili' ? ICONS.sail : item.key === 'ailece-seyahat' ? ICONS.compass : ICONS.anchor) + '<span>' + esc(item.label) + '</span>' + ICONS.arrow + '</button>').join('');
  const routes = ROUTES.map(([label, path]) => '<a href="' + esc(url(ctx, path)) + '">' + ICONS.pin + '<span>' + esc(label) + '</span>' + ICONS.arrow + '</a>').join('');
  const prepared = '<p>' + esc(get(ctx, 'blog.list.editorialDescription', '')) + '</p><a href="' + esc(url(ctx, '/hakkimizda/')) + '">' + ICONS.anchor + '<span>Editör ekibimiz</span></a><a href="' + esc(url(ctx, '/hakkimizda/')) + '">' + ICONS.compass + '<span>Kaynak ve güncellik</span></a><a href="' + esc(url(ctx, '/hakkimizda/')) + '">' + ICONS.plus + '<span>Hakkımızda</span>' + ICONS.arrow + '</a>';
  const groups = [
    ['topics', get(ctx, 'blog.list.topicsTitle', 'Konulara Göre Keşfet'), ICONS.compass, topics],
    ['routes', get(ctx, 'blog.list.routesTitle', 'Rota Rehberleri'), ICONS.pin, routes],
    ['editorial', get(ctx, 'blog.list.editorialTitle', 'İçeriklerimiz Nasıl Hazırlanır?'), ICONS.map, prepared],
  ].map(([id, title, icon, body]) => '<details class="bl236-panel" data-mobile-accordion data-panel="' + id + '"><summary>' + icon + '<span>' + esc(title) + '</span><i>' + ICONS.arrow + '</i></summary><div class="bl236-panel__body">' + body + '</div></details>').join('');
  const offerImage = get(ctx, 'blog.list.offerImage', '');
  return '<aside class="bl236-sidebar" aria-label="Blog yardımcı içerikleri"><div class="bl236-panels">' + groups + '</div>' +
    '<a class="bl236-side-offer" href="' + esc(url(ctx, '/iletisim/')) + '">' +
    (offerImage ? '<img src="' + esc(asset(ctx, offerImage)) + '" alt="" loading="lazy">' : '') +
    '<strong data-cms-binding="blog.list.offerTitle"' + prop('title') + '>' + multiline(get(ctx, 'blog.list.offerTitle', '')) + '</strong><span class="bl236-side-offer__button">Teklif Alın ' + ICONS.arrow + '</span></a></aside>';
}

function renderAnswers(ctx) {
  const rows = [
    ['answer1Title','answer1Text', 'Mavi yolculuk nedir?', 'Guletle koylar arasında konaklamalı yapılan, doğayla iç içe bir deniz tatilidir.', ICONS.anchor],
    ['answer2Title','answer2Text', 'Gulet seçerken neye bakılmalı?', 'Kişi sayısı, kabin sayısı, konfor seviyesi ve planlanan rota ile uyumu dikkate alınmalıdır.', ICONS.sail],
    ['answer3Title','answer3Text', 'Rota nasıl belirlenir?', 'Başlangıç limanı, süre, ilgi alanları ve hava koşulları göz önünde bulundurularak belirlenir.', ICONS.compass],
  ];
  return '<section class="bl236-answers" id="kisa-cevaplar" data-reveal><h2 data-cms-binding="blog.list.answersTitle">' + esc(get(ctx, 'blog.list.answersTitle', 'Mavi Yolculuk Hakkında Kısa Cevaplar')) + '</h2><div class="bl236-answer-grid">' +
    rows.map(([titleKey,textKey,title,text,icon]) => '<article class="bl236-answer">' + icon + '<div><h3 data-cms-binding="blog.list.' + titleKey + '">' + esc(get(ctx, 'blog.list.' + titleKey, title)) + '</h3><p data-cms-binding="blog.list.' + textKey + '">' + esc(get(ctx, 'blog.list.' + textKey, text)) + '</p></div></article>').join('') + '</div></section>';
}

function renderPagination(ctx, total, page, pageSize) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageCountShown = Math.max(3, pages);
  const buttons = Array.from({ length: pageCountShown }, (_, index) => {
    const number = index + 1;
    const disabled = number > pages;
    return '<button type="button" data-page="' + number + '"' + (number === page ? ' aria-current="page"' : '') + (disabled ? ' disabled aria-disabled="true"' : '') + '>' + number + '</button>';
  }).join('');
  return '<nav class="bl236-pagination" aria-label="Rehber sayfaları"><button type="button" data-page="' + Math.max(1, page - 1) + '" aria-label="Önceki sayfa"' + (page <= 1 ? ' disabled' : '') + '>←</button>' +
    buttons + '<button type="button" class="bl236-pagination__next" data-page="' + Math.min(pages, page + 1) + '"' + (page >= pages ? ' disabled aria-disabled="true"' : '') + '><span>' + esc(get(ctx, 'blog.list.nextLabel', 'Sonraki')) + '</span>' + ICONS.arrow + '</button></nav>';
}

export function renderBlogList(ctx = {}) {
  const posts = Array.isArray(ctx.collections && ctx.collections.blog) ? ctx.collections.blog : [];
  const featured = posts.find(post => post.featured) || posts[0] || null;
  const cards = posts.filter(post => post !== featured);
  const heroTitle = get(ctx, 'blog.hero.title', 'Mavi Yolculuk Rehberi');
  const heroDescription = get(ctx, 'blog.hero.description', 'Gulet tatili, Ege ve Akdeniz rotaları için planlama rehberleri.');
  const heroNote = get(ctx, 'blog.hero.note', 'Yola\nçıkmadan\nönce…');
  const heroImage = get(ctx, 'blog.hero.image', 'assets/blog236/blog-hero.webp');
  const pageSize = 6;
  const ctaImage = get(ctx, 'blog.cta.image', '');
  return '<main class="bl236">' +
    '<section class="bl236-hero" data-section-id="hero" style="--bl236-hero-image:' + (heroImage ? 'url(&quot;' + esc(asset(ctx, heroImage)) + '&quot;)' : 'none') + '">' +
    (heroImage ? '<img class="bl236-hero__photo blog-hero-photo" src="' + esc(asset(ctx, heroImage)) + '" alt="" loading="eager" decoding="async" data-cms-binding="blog.hero.image">' : '') +
    '<div class="bl236-hero__inner"><nav class="bl236-breadcrumb" aria-label="Gezinme yolu"><a href="' + esc(url(ctx, '/')) + '">Ana Sayfa</a><span>/</span><span>Blog</span></nav>' +
    '<h1 data-cms-binding="blog.hero.title">' + esc(heroTitle) + '</h1><p class="bl236-hero__description" data-cms-binding="blog.hero.description">' + esc(heroDescription) + '</p>' +
    '<span class="bl236-hero__note" data-cms-binding="blog.hero.note">' + multiline(heroNote) + '</span></div></section>' +
    '<section class="bl236-list" data-section-id="list"><div class="bl236-container">' +
    '<div class="bl236-filterbar"><label class="bl236-search">' + ICONS.search + '<input type="search" data-blog-search placeholder="' + esc(get(ctx, 'blog.list.searchPlaceholder', 'Rehberlerde ara')) + '" aria-label="Rehberlerde ara"><button type="button" data-blog-search-submit aria-label="Ara">' + ICONS.arrow + '</button></label>' +
    '<div class="bl236-chips" role="group" aria-label="Kategori filtresi"><button type="button" data-blog-category="all" class="is-active">Tümü</button>' +
    FILTERS.map(item => '<button type="button" data-blog-category="' + esc(item.key) + '">' + esc(item.label) + '</button>').join('') + '</div></div>' +
    '<div class="bl236-content"><div class="bl236-primary">' +
    renderFeature(ctx, featured) +
    '<div class="bl236-guides-heading"><h2 data-cms-binding="blog.list.title"' + prop('title') + '>' + esc(get(ctx, 'blog.list.title', 'Son Rehberler')) + '</h2><button type="button" data-blog-category="all">' + esc(get(ctx, 'blog.list.allLabel', 'Tüm Rehberleri Gör')) + ' ' + ICONS.arrow + '</button></div>' +
    '<div class="bl236-cards" data-blog-cards>' + cards.map(post => renderCard(ctx, post)).join('') + '</div>' +
    '<p class="bl236-empty" data-blog-empty hidden>Bu aramayla eşleşen rehber bulunamadı.</p></div>' +
    renderSidebar(ctx) + '</div>' +
    renderAnswers(ctx) +
    '<div class="bl236-pagination-wrap" data-blog-pagination>' + renderPagination(ctx, cards.length, 1, pageSize) + '</div></div></section>' +
    '<section class="bl236-cta" data-section-id="cta" data-reveal style="--bl236-cta-image:' + (ctaImage ? 'url(&quot;' + esc(asset(ctx, ctaImage)) + '&quot;)' : 'none') + '">' +
    '<div class="bl236-cta__inner"><h2 data-cms-binding="blog.cta.title">' + multiline(get(ctx, 'blog.cta.title', '')) + '</h2><p data-cms-binding="blog.cta.description">' + esc(get(ctx, 'blog.cta.description', '')) + '</p>' +
    '<div class="bl236-cta__actions"><a class="bl236-button bl236-button--gold" data-cms-binding="blog.cta.offerLabel" href="' + esc(url(ctx, get(ctx, 'blog.cta.offerUrl', '/iletisim/'))) + '">' + esc(get(ctx, 'blog.cta.offerLabel', 'Teklif Alın')) + ' ' + ICONS.arrow + '</a>' +
    '<a class="bl236-button bl236-button--outline" data-cms-binding="blog.cta.routesLabel" href="' + esc(url(ctx, get(ctx, 'blog.cta.routesUrl', '/rotalar/'))) + '">' + esc(get(ctx, 'blog.cta.routesLabel', 'Rotaları Keşfet')) + ' ' + ICONS.arrow + '</a></div></div>' +
    '<span class="bl236-cta__note" data-cms-binding="blog.cta.note">' + multiline(get(ctx, 'blog.cta.note', '')) + '</span></section></main>';
}

export function initBlogList(root, ctx = {}) {
  if (!root) return () => {};
  const section = root.matches && root.matches('.bl236') ? root : root.querySelector('.bl236');
  if (!section) return () => {};
  const featured = section.querySelector('.bl236-feature');
  const cards = Array.from(section.querySelectorAll('.bl236-card'));
  const search = section.querySelector('[data-blog-search]');
  const empty = section.querySelector('[data-blog-empty]');
  const pagination = section.querySelector('[data-blog-pagination]');
  const pageSize = 6;
  let selected = 'all';
  let query = '';
  let page = 1;
  const cleanups = [];
  const listen = (node, type, fn) => { if (node) { node.addEventListener(type, fn); cleanups.push(() => node.removeEventListener(type, fn)); } };
  const setAccordionMode = () => {
    const isMobile = window.matchMedia('(max-width: 760px)').matches;
    section.querySelectorAll('[data-mobile-accordion]').forEach(panel => { panel.open = !isMobile; });
  };
  const update = () => {
    const matches = cards.filter(card => {
      const categoryMatch = selected === 'all' || card.dataset.categoryKey === selected;
      const text = (card.dataset.title + ' ' + card.dataset.excerpt).toLocaleLowerCase('tr-TR');
      return categoryMatch && (!query || text.includes(query));
    });
    const featureMatches = featured && (selected === 'all' || featured.dataset.categoryKey === selected) && (!query || (featured.dataset.title + ' ' + featured.dataset.excerpt).toLocaleLowerCase('tr-TR').includes(query));
    if (featured) featured.hidden = !featureMatches;
    const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
    page = Math.min(page, pageCount);
    cards.forEach((card, index) => { card.hidden = !matches.includes(card) || matches.indexOf(card) < (page - 1) * pageSize || matches.indexOf(card) >= page * pageSize; });
    if (empty) empty.hidden = matches.length !== 0 || Boolean(featureMatches);
    if (pagination) pagination.innerHTML = renderPagination(ctx, matches.length, page, pageSize);
    section.querySelectorAll('[data-blog-category]').forEach(button => button.classList.toggle('is-active', button.dataset.blogCategory === selected));
  };
  listen(search, 'input', () => { query = search.value.trim().toLocaleLowerCase('tr-TR'); page = 1; update(); });
  listen(section.querySelector('[data-blog-search-submit]'), 'click', () => { query = (search?.value || '').trim().toLocaleLowerCase('tr-TR'); page = 1; update(); });
  listen(section.querySelector('.bl236-filterbar'), 'click', event => {
    const button = event.target.closest('[data-blog-category]');
    if (!button) return;
    selected = button.dataset.blogCategory; page = 1; update();
  });
  listen(section.querySelector('.bl236-guides-heading'), 'click', event => {
    const button = event.target.closest('[data-blog-category]');
    if (!button) return;
    selected = button.dataset.blogCategory; query = ''; page = 1; if (search) search.value = ''; update();
  });
  listen(section.querySelector('.bl236-sidebar'), 'click', event => {
    const button = event.target.closest('[data-blog-category]');
    if (!button) return;
    selected = button.dataset.blogCategory; page = 1; update();
  });
  listen(pagination, 'click', event => {
    const button = event.target.closest('[data-page]');
    if (!button || button.disabled) return;
    page = Number(button.dataset.page); update();
    section.querySelector('[data-blog-cards]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  const media = window.matchMedia('(max-width: 760px)');
  setAccordionMode();
  if (media.addEventListener) listen(media, 'change', setAccordionMode);
  else if (media.addListener) { media.addListener(setAccordionMode); cleanups.push(() => media.removeListener(setAccordionMode)); }
  update();
  return () => cleanups.splice(0).forEach(cleanup => cleanup());
}