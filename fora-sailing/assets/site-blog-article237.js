const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const val = (ctx, key, fallback = '') => {
  const value = ctx?.get?.(key, fallback);
  return value == null ? fallback : String(value);
};
const url = (ctx, value) => {
  const raw = String(value || '#');
  return /^(?:https?:|mailto:|tel:|#)/i.test(raw) ? raw : (ctx?.url?.(raw) || raw);
};
const bind = (key) => key ? ` data-cms-binding="${esc(key)}"` : '';
const ICONS = 'assets/icons/fora-icons.svg';
const icon = (ctx, name, cls = '') => ['sun','shirt','bag','bulb','sailboat'].includes(name) ? `<img class="blog-icon ${esc(cls)}" src="${esc(ctx?.asset?.((name==='sailboat'?'assets/icons/source-sailboat193.svg':`assets/blog237/${name==='bag'?'paper-bag':name}.svg`)) || (name==='sailboat'?'assets/icons/source-sailboat193.svg':`assets/blog237/${name==='bag'?'paper-bag':name}.svg`))}" alt="" aria-hidden="true">` : `<svg class="blog-icon ${esc(cls)}" aria-hidden="true"><use href="${esc(ctx?.asset?.(ICONS) || ICONS)}#fora-${esc(name)}"></use></svg>`;
const image = (ctx, source, alt, cls, loading = 'lazy') => source
  ? `<img class="${esc(cls)}" src="${esc(ctx?.asset?.(source) || source)}" alt="${esc(alt)}" loading="${loading}" decoding="async">` : '';

function article(ctx) { return ctx?.blogPost && typeof ctx.blogPost === 'object' ? ctx.blogPost : null; }
function formatDate(value) {
  const raw = String(value || '');
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return raw;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}
function toc(ctx, sections, faqs) {
  const items = sections.filter((section) => section?.id && section.type !== 'summary' && section.title)
    .map((section) => ({ id: `blog-section-${section.id}`, title: section.tocTitle || section.title }));
  if (faqs.length) items.push({ id: 'blog-faq', title: val(ctx, 'blog-article.article.faqTitle', 'Sık Sorulan Sorular') });
  if (!items.length) return '';
  return `<details class="blog-toc" data-blog-toc open><summary>${icon(ctx, 'list')}<span${bind('blog-article.article.tocTitle')}>${esc(val(ctx, 'blog-article.article.tocTitle', 'İçindekiler'))}</span>${icon(ctx, 'chevron-down', 'blog-toc-chevron')}</summary><ol>${items.map((item, index) => `<li><a href="#${esc(item.id)}"><span>${index + 1}</span>${esc(item.title)}</a></li>`).join('')}</ol></details>`;
}
function sectionMarkup(ctx, section, index) {
  const id = section.id || `section-${index + 1}`;
  const anchor = `blog-section-${id}`;
  const key = `blog-article.article.sections.${id}`;
  const title = section.title ? `<h2${bind(`${key}.title`)}>${esc(val(ctx, `${key}.title`, section.title))}</h2>` : '';
  if (section.type === 'summary') {
    const items = Array.isArray(section.items) ? section.items : [];
    return `<section class="blog-summary" data-reveal id="${esc(anchor)}"><div class="blog-summary-heading">${icon(ctx, 'bulb')}<h2 id="blog-summary-title"${bind(`${key}.title`)}>${esc(val(ctx, `${key}.title`, section.title ?? 'Kısaca'))}</h2></div>${section.text ? `<p${bind(`${key}.text`)}>${esc(val(ctx, `${key}.text`, section.text))}</p>` : ''}${items.length ? `<ul>${items.map((item, i) => `<li>${icon(ctx, 'check-circle')}<span><strong${bind(`${key}.items.${i}.title`)}>${esc(val(ctx, `${key}.items.${i}.title`, item.title || ''))}</strong>${item.text ? `<span${bind(`${key}.items.${i}.text`)}>${esc(val(ctx, `${key}.items.${i}.text`, item.text))}</span>` : ''}</span></li>`).join('')}</ul>` : ''}</section>`;
  }
  if (section.type === 'table') {
    const columns = Array.isArray(section.columns) ? section.columns : [];
    const rows = Array.isArray(section.rows) ? section.rows : [];
    const columnLabel = (column) => typeof column === 'string' ? column : column?.label || '';
    const cell = (row, column, i) => Array.isArray(row) ? row[i] : row?.[column?.key || column?.id] ?? row?.[i] ?? '';
    return `<section class="blog-section blog-table-section" data-reveal id="${esc(anchor)}">${title}<div class="blog-table-wrap"><table><thead><tr>${columns.map((column, i) => `<th scope="col"${bind(`${key}.columns.${i}`)}>${esc(val(ctx, `${key}.columns.${i}`, columnLabel(column)))}</th>`).join('')}</tr></thead><tbody>${rows.map((row, ri) => `<tr>${columns.map((column, ci) => `<td${bind(`${key}.rows.${ri}.${column?.key || ci}`)}>${esc(val(ctx, `${key}.rows.${ri}.${column?.key || ci}`, cell(row, column, ci)))}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
  }
  if (section.type === 'image') return `<figure class="blog-section blog-feature-figure" data-reveal id="${esc(anchor)}">${image(ctx, section.image, section.caption || section.title || '', 'blog-deck-photo').replace('<img ',`<img data-cms-property="sections.${index}.image" `)}${section.caption ? `<figcaption${bind(`${key}.caption`)}>${esc(val(ctx, `${key}.caption`, section.caption))}</figcaption>` : ''}</figure>`;
  if (section.type === 'essentials') {
    const items = Array.isArray(section.items) ? section.items : [];
    const itemIcons = ['sun', 'shirt', 'bag'];
    return `<section class="blog-section blog-essentials" data-reveal id="${esc(anchor)}">${title}${section.text ? `<p class="blog-section-intro"${bind(`${key}.text`)}>${esc(val(ctx, `${key}.text`, section.text))}</p>` : ''}<ul>${items.map((item, i) => `<li>${icon(ctx, itemIcons[i % itemIcons.length])}<span><strong${bind(`${key}.items.${i}.title`)}>${esc(val(ctx, `${key}.items.${i}.title`, item.title || ''))}</strong><span${bind(`${key}.items.${i}.text`)}>${esc(val(ctx, `${key}.items.${i}.text`, item.text || ''))}</span></span></li>`).join('')}</ul></section>`;
  }
  const paragraph = val(ctx, `${key}.text`, section.text || '');
  const paragraphs = paragraph.split(/\n{2,}/).filter(Boolean);
  return `<section class="blog-section blog-prose" data-reveal id="${esc(anchor)}">${title}${paragraphs.map((part, i) => `<p${i === 0 ? bind(`${key}.text`) : ''}>${esc(part)}</p>`).join('')}${section.link && section.linkLabel ? `<a class="blog-text-link" href="${esc(url(ctx, section.link))}"${bind(`${key}.linkLabel`)}>${esc(val(ctx, `${key}.linkLabel`, section.linkLabel))}${icon(ctx, 'arrow-right')}</a>` : ''}${Array.isArray(section.items) && section.items.length ? `<ul>${section.items.map((item, i) => `<li><strong${bind(`${key}.items.${i}.title`)}>${esc(val(ctx, `${key}.items.${i}.title`, item.title || ''))}</strong> <span${bind(`${key}.items.${i}.text`)}>${esc(val(ctx, `${key}.items.${i}.text`, item.text || ''))}</span></li>`).join('')}</ul>` : ''}</section>`;
}
function faqsMarkup(ctx, faqs) {
  if (!faqs.length) return '';
  return `<section class="blog-faq blog-section" data-reveal id="blog-faq"><h2${bind('blog-article.article.faqTitle')}>${esc(val(ctx, 'blog-article.article.faqTitle', 'Sık Sorulan Sorular'))}</h2><div class="blog-faq-list">${faqs.map((faq, i) => {
    const key = `blog-article.article.faqs.${faq.id || i}`;
    return `<details class="blog-faq-item"><summary><span${bind(`${key}.question`)}>${esc(val(ctx, `${key}.question`, faq.question || ''))}</span>${icon(ctx, 'chevron-down')}</summary><div class="blog-faq-answer"${bind(`${key}.answer`)}>${esc(val(ctx, `${key}.answer`, faq.answer || ''))}</div></details>`;
  }).join('')}</div></section>`;
}
function trustMarkup(ctx, post) {
  const sources = Array.isArray(post.sources) ? post.sources : [];
  const author = post.author ?? 'Fora Sailing Editör Ekibi';
  const bio = post.authorBio || '';
  if (!bio && !sources.length) return '';
  return `<div class="blog-trust-panels">${bio ? `<section class="blog-author-card">${icon(ctx, 'sailboat')}<div><h2${bind('blog-article.article.aboutTitle')}>${esc(val(ctx, 'blog-article.article.aboutTitle', 'Bu rehber hakkında'))}</h2><strong data-cms-property="author"${bind('blog-article.article.author')}>${esc(val(ctx, 'blog-article.article.author', author))}</strong><p data-cms-property="authorBio"${bind('blog-article.article.authorBio')}>${esc(val(ctx, 'blog-article.article.authorBio', bio))}</p></div></section>` : ''}${sources.length ? `<section class="blog-sources-card"><div class="blog-source-mark">${icon(ctx, 'blog')}</div><div><h2${bind('blog-article.article.sourcesTitle')}>${esc(val(ctx, 'blog-article.article.sourcesTitle', 'Kaynaklar ve Güncellik'))}</h2><p${bind('blog-article.article.sourcesDescription')}>${esc(val(ctx, 'blog-article.article.sourcesDescription', 'Rota bilgileri, rezervasyon öncesinde ekiple teyit edilmelidir.'))}</p><ul>${sources.map((source, i) => `<li><a href="${esc(url(ctx, source.url || '#'))}" target="_blank" rel="noopener noreferrer" data-cms-property="sources.${i}.label">${esc(val(ctx, `blog-article.article.sources.${i}.label`, source.label || 'Kaynak'))}${icon(ctx, 'external-link')}</a></li>`).join('')}</ul></div></section>` : ''}</div>`;
}
function relatedMarkup(ctx, post) {
  const posts = Array.isArray(ctx?.collections?.blog) ? ctx.collections.blog : [];
  const related = (Array.isArray(post.relatedIds) ? post.relatedIds : []).map((id) => posts.find((item) => item.id === id || item.slug === id)).filter((item) => item && item.published !== false && item.status !== 'draft').slice(0, 3);
  if (!related.length) return '';
  return `<section class="blog-related blog-section" data-reveal><div class="blog-related-head"><h2${bind('blog-article.article.relatedTitle')}>${esc(val(ctx, 'blog-article.article.relatedTitle', 'İlgili Rehberler'))}</h2><a href="${esc(url(ctx, '/blog/'))}">${esc(val(ctx, 'blog-article.article.allGuidesLabel', 'Tüm Rehberleri Gör'))}${icon(ctx, 'arrow-right')}</a></div><div class="blog-related-grid">${related.map((item) => {
    const source = ctx?.getBlogImage236?.(item, 'card') ?? item.image ?? '';
    const destination = item.path || (item.slug ? `/blog/${item.slug}/` : '/blog/');
    return `<a class="blog-related-card" href="${esc(url(ctx, destination))}" data-cms-collection="blog" data-entity-id="${esc(item.id || '')}">${image(ctx, source, item.title || '', 'blog-related-photo')}<span class="blog-related-copy"><strong data-cms-property="title">${esc(item.title || '')}</strong>${item.excerpt ? `<span data-cms-property="excerpt">${esc(item.excerpt)}</span>` : ''}<small>${esc(formatDate(item.updatedAt || item.publishedAt || ''))}${item.readMinutes ? ` · ${esc(item.readMinutes)} dk` : ''}</small></span>${icon(ctx,'arrow-right','blog-related-arrow')}</a>`;
  }).join('')}</div></section>`;
}
function inlineCta(ctx) {
  const key = 'blog-article.article';
  return `<aside class="blog-inline-cta" data-reveal><div><h2${bind(`${key}.routeTitle`)}>${esc(val(ctx, `${key}.routeTitle`, 'Göcek rotanızı birlikte planlayalım.'))}</h2><p${bind(`${key}.routeDescription`)}>${esc(val(ctx, `${key}.routeDescription`, 'Tatil sürenize ve tercihlerinize göre size en uygun rotayı oluşturalım.'))}</p></div><a class="blog-inline-cta-link" href="${esc(url(ctx, val(ctx, `${key}.routeUrl`, '/iletisim/?rota=gocek-fethiye')))}" data-cms-href-binding="${key}.routeUrl">${icon(ctx, 'sailboat')}<span${bind(`${key}.routeLabel`)}>${esc(val(ctx, `${key}.routeLabel`, 'Rota İçin Bilgi Alın'))}</span>${icon(ctx, 'arrow-right')}</a></aside>`;
}
function shareLinks(ctx) {
  const current=encodeURIComponent(globalThis.location?.href || 'https://forasailing.com/blog/gocekte-mavi-yolculuk/');
  return [
    ['Facebook','https://www.facebook.com/sharer/sharer.php?u='+current,'assets/icons/bootstrap/facebook.svg'],
    ['X','https://twitter.com/intent/tweet?url='+current,'assets/blog237/twitter-x.svg'],
    ['WhatsApp','https://wa.me/?text='+current,'assets/icons/bootstrap/whatsapp.svg'],
  ].map(([label,href,source])=>`<a class="blog-share-link" href="${esc(href)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(label)} ile paylaş">${image(ctx,source,'','blog-share-icon','eager')}</a>`).join('');
}

function breadcrumb(ctx, post) {
  const category = val(ctx, 'blog-article.article.category', post.category || post.categoryKey || 'Rota Rehberi');
  return `<nav class="blog-breadcrumb" aria-label="Sayfa yolu"><a href="${esc(url(ctx, '/'))}">${esc(val(ctx, 'blog-article.article.homeLabel', 'Ana Sayfa'))}</a><span>/</span><a href="${esc(url(ctx, '/blog/'))}">${esc(val(ctx, 'blog-article.article.blogLabel', 'Blog'))}</a><span>/</span><span aria-current="page">${esc(category)}</span></nav>`;
}

export function renderBlogArticle(ctx = {}) {
 const post=article(ctx); if(!post)return `<main class="blog-article-page blog-empty" aria-live="polite"><p>${esc(val(ctx,'blog-article.article.notFound','Bu rehber şu anda görüntülenemiyor.'))}</p><a href="${esc(url(ctx,'/blog/'))}">${esc(val(ctx,'blog-article.article.backToBlog','Blog rehberlerine dön'))}</a></main>`;
 const sections=Array.isArray(post.sections)?post.sections:[],faqs=Array.isArray(post.faqs)?post.faqs:[];
 const body=sections.map((section,i)=>sectionMarkup(ctx,section,i).replace(/data-cms-binding="blog-article\.article\.sections\.[^.]+\.([^"]+)"/g,(_,path)=>`data-cms-property="sections.${i}.${path}"`)),summary=body.findIndex((markup,i)=>sections[i]?.type==='summary');
 const summaryMarkup=summary>=0?body.splice(summary,1)[0]:'',cover=ctx?.getBlogImage236?.(post,'article')??post.image??'';
 const heroImage=val(ctx,'blog-article.hero.image',cover),heroNote=val(ctx,'blog-article.hero.note','Yola\\nçıkmadan\\nönce…');
 const title=val(ctx,'blog-article.article.title',post.title||''),intro=post.introduction||'',updated=formatDate(post.updatedAt||post.publishedAt||''),hasBody=sections.length>0||faqs.length>0;
 const ctaImage=val(ctx,'blog-article.cta.image','assets/blog236/cta-deck.webp'),offerUrl=val(ctx,'blog-article.cta.offerUrl','/iletisim/'),routesUrl=val(ctx,'blog-article.cta.routesUrl','/rotalar/');
 const closingCta=`<section class="blog-closing-cta" data-section-id="cta" data-reveal><div class="blog-closing-visual">${image(ctx,ctaImage,'','blog-closing-photo')}</div><div class="blog-closing-copy"><h2 data-cms-binding="blog-article.cta.title">${esc(val(ctx,'blog-article.cta.title','Hayalinizdeki Rotayı\\nBirlikte Planlayalım.'))}</h2><p data-cms-binding="blog-article.cta.description">${esc(val(ctx,'blog-article.cta.description','Göcek ve çevresindeki özel rotalar için size özel plan yapalım.'))}</p><div class="blog-closing-actions"><a href="${esc(url(ctx,offerUrl))}" data-cms-href-binding="blog-article.cta.offerUrl">${esc(val(ctx,'blog-article.cta.offerLabel','Teklif Alın'))}${icon(ctx,'arrow-right')}</a><a href="${esc(url(ctx,routesUrl))}" data-cms-href-binding="blog-article.cta.routesUrl">${esc(val(ctx,'blog-article.cta.routesLabel','Rotaları Keşfet'))}</a></div></div><p class="blog-closing-note" data-cms-binding="blog-article.cta.note">${esc(val(ctx,'blog-article.cta.note','Mavi,\nyaşatır…'))}</p></section>`;
 return `<main class="blog-article-page" data-cms-collection="blog" data-entity-id="${esc(post.id||'')}">
 <section class="blog-hero-band" data-section-id="hero" aria-label="${esc(title)}">${image(ctx,heroImage,title,'blog-hero-photo','eager')}<p class="blog-hero-note" data-cms-binding="blog-article.hero.note">${esc(heroNote)}</p></section>
 <section class="blog-article-section" data-section-id="content"><div class="blog-article-shell"><article class="blog-article-column">
 ${breadcrumb(ctx,post)}<header class="blog-article-intro"><div class="blog-category" data-cms-property="category"${bind('blog-article.article.category')}>${esc(val(ctx,'blog-article.article.category',post.category||post.categoryKey||'Rota Rehberi'))}</div><h1 data-cms-property="title"${bind('blog-article.article.title')}>${title==='Göcek’te Mavi Yolculuk: Koylar ve Rota Planlama'?esc(title).replace(/: /,':<br>'):esc(title)}</h1>${intro?`<p class="blog-excerpt" data-cms-property="introduction"${bind('blog-article.article.introduction')}>${esc(val(ctx,'blog-article.article.introduction',intro))}</p>`:''}<div class="blog-article-meta"><span class="blog-meta-author">${icon(ctx,'sailboat')}<span data-cms-property="author"${bind('blog-article.article.author')}>${esc(val(ctx,'blog-article.article.author',post.author ?? 'Fora Sailing Editör Ekibi'))}</span></span>${updated?`<span>${icon(ctx,'calendar')}<span data-cms-property="updatedAt"${bind('blog-article.article.updatedAt')}>Güncellendi: ${esc(updated)}</span></span>`:''}${post.readMinutes?`<span>${icon(ctx,'blog')}<span data-cms-property="readMinutes"${bind('blog-article.article.readMinutes')}>${esc(val(ctx,'blog-article.article.readMinutes',post.readMinutes))} dk okuma</span></span>`:''}<div class="blog-share"><button type="button" data-blog-copy aria-label="Bağlantıyı kopyala">${icon(ctx,'link')}</button>${shareLinks(ctx)}<span class="blog-copy-status" aria-live="polite"></span></div></div></header>
 ${cover?`<figure class="blog-cover-figure">${image(ctx,cover,post.imageCaption||title,'blog-cover-photo','eager').replace('<img ','<img data-cms-property="image" ')}${post.imageCaption?`<figcaption data-cms-property="imageCaption">${esc(post.imageCaption)}</figcaption>`:''}</figure>`:''}${toc(ctx,sections,faqs)}${summaryMarkup}${hasBody?`<div class="blog-article-body">${body.join('')}${inlineCta(ctx)}${faqsMarkup(ctx,faqs).replace(/data-cms-binding="blog-article\.article\.faqs\.([^.]*)\.([^"]+)"/g,(_,id,path)=>`data-cms-property="faqs.${faqs.findIndex((faq,i)=>String(faq.id??i)===id)}.${path}"`)}${trustMarkup(ctx,post)}${relatedMarkup(ctx,post)}</div>`:`<div class="blog-article-teaser">${post.excerpt?`<p>${esc(post.excerpt)}</p>`:''}</div>`}
 </article></div></section>${closingCta}</main>`;
}

export function initBlogArticle(root, ctx = {}) {
  const controller = new AbortController();
  const signal = controller.signal;
  const tocDetails = root.querySelector('[data-blog-toc]');
  if (tocDetails) {
    const media = matchMedia('(min-width: 761px)');
    const keepDesktopOpen = () => { if (media.matches) tocDetails.open = true; };
    keepDesktopOpen();
    media.addEventListener?.('change', keepDesktopOpen, { signal });
  }
  root.querySelector('[data-blog-copy]')?.addEventListener('click', async (event) => {
    const status = root.querySelector('.blog-copy-status');
    try {
      await navigator.clipboard.writeText(location.href);
      if (status) status.textContent = val(ctx, 'blog-article.article.copySuccess', 'Bağlantı kopyalandı');
    } catch {
      if (status) status.textContent = val(ctx, 'blog-article.article.copyError', 'Bağlantı kopyalanamadı');
    }
    event.currentTarget.setAttribute('aria-label', status?.textContent || 'Bağlantıyı kopyala');
  }, { signal });
  return () => controller.abort();
}
