// Shared initial content transcribed from the user's BLOG TASARIMI PNGs.
// A persisted version marker keeps intentionally emptied collections empty.
const ARTICLE_PATH = '/blog/gocekte-mavi-yolculuk/';
const field = (binding, label, value, type = 'text') => ({ id:`native-${binding}`, binding, label, type, value, defaultValue:value });
const section = (id,label,fields) => ({id,label,visible:true,fields});
export const BLOG_DEFAULT_PAGES = [
  {id:'blog',path:'/blog/',title:'Mavi Yolculuk Rehberi',visible:true,status:'published',seo:{title:'Mavi Yolculuk Rehberi | Fora Sailing',description:'Gulet tatili, Ege ve Akdeniz rotaları için planlama rehberleri.'},sections:[
    section('hero','Blog kapağı',[
      field('blog.hero.title','Başlık','Mavi Yolculuk Rehberi'),
      field('blog.hero.description','Açıklama','Gulet tatili, Ege ve Akdeniz rotaları için planlama rehberleri.'),
      field('blog.hero.image','Kapak fotoğrafı','assets/blog236/blog-hero.webp','image'),
      field('blog.hero.note','El yazısı not','Yola\nçıkmadan\nönce…'),
      field('blog.hero.breadcrumb','Gezinme yolu','Ana Sayfa / Blog'),
    ]),
    section('list','Rehber listesi',[
      field('blog.list.searchPlaceholder','Arama alanı','Rehberlerde ara'),
      field('blog.list.title','Liste başlığı','Son Rehberler'),
      field('blog.list.allLabel','Tüm rehberler bağlantısı','Tüm Rehberleri Gör'),
      field('blog.list.readLabel','Okuma düğmesi','Rehberi Oku'),
      field('blog.list.nextLabel','Sonraki sayfa','Sonraki'),
      field('blog.list.topicsTitle','Konu başlığı','Konulara Göre Keşfet'),
      field('blog.list.routesTitle','Rota başlığı','Rota Rehberleri'),
      field('blog.list.editorialTitle','Editör başlığı','İçeriklerimiz Nasıl Hazırlanır?'),
      field('blog.list.editorialDescription','Editör açıklaması','Rehberlerimiz, bölge deneyimimiz, saha bilgimiz ve güncel kaynaklar ışığında hazırlanır.'),
      field('blog.list.offerTitle','Yan teklif başlığı','Hayalinizdeki rota için\nsize özel bir plan hazırlayalım.'),
      field('blog.list.offerImage','Yan teklif fotoğrafı','assets/blog236/gocek-feature.webp','image'),
      field('blog.list.answersTitle','Kısa cevaplar başlığı','Mavi Yolculuk Hakkında Kısa Cevaplar'),
      field('blog.list.answer1Title','Birinci soru','Mavi yolculuk nedir?'),
      field('blog.list.answer1Text','Birinci cevap','Guletle koylar arasında konaklamalı yapılan, doğayla iç içe bir deniz tatilidir.'),
      field('blog.list.answer2Title','İkinci soru','Gulet seçerken neye bakılmalı?'),
      field('blog.list.answer2Text','İkinci cevap','Kişi sayısı, kabin sayısı, konfor seviyesi ve planlanan rota ile uyumu dikkate alınmalıdır.'),
      field('blog.list.answer3Title','Üçüncü soru','Rota nasıl belirlenir?'),
      field('blog.list.answer3Text','Üçüncü cevap','Başlangıç limanı, süre, ilgi alanları ve hava koşulları göz önünde bulundurularak belirlenir.'),
    ]),
    section('cta','Kapanış teklifi',[
      field('blog.cta.title','Başlık','Okuduklarınızı\nBir Yolculuğa Dönüştürün.'),
      field('blog.cta.description','Açıklama','Hayalinizdeki mavi yolculuk için şimdi plan yapın.'),
      field('blog.cta.image','Fotoğraf','assets/blog236/cta-deck.webp','image'),
      field('blog.cta.offerLabel','Teklif düğmesi','Teklif Alın'),
      field('blog.cta.offerUrl','Teklif bağlantısı','/iletisim/','url'),
      field('blog.cta.routesLabel','Rotalar düğmesi','Rotaları Keşfet'),
      field('blog.cta.routesUrl','Rotalar bağlantısı','/rotalar/','url'),
      field('blog.cta.note','El yazısı not','Mavi,\nyaşatır…'),
    ]),
  ]},
  {id:'blog-makale',path:ARTICLE_PATH,title:'Göcek’te Mavi Yolculuk: Koylar ve Rota Planlama',visible:true,status:'published',seo:{title:'Göcek’te Mavi Yolculuk | Fora Sailing'},sections:[
    section('hero','Makale kapağı',[
      field('blog-article.hero.image','Üst kapak fotoğrafı','assets/blog236/blog-hero.webp','image'),
      field('blog-article.hero.note','El yazısı not','Yola\nçıkmadan\nönce…'),
    ]),
    section('content','Makale ortak alanları',[
      field('blog-article.article.tocTitle','İçindekiler başlığı','İçindekiler'),
      field('blog-article.article.faqTitle','Sorular başlığı','Sık Sorulan Sorular'),
      field('blog-article.article.aboutTitle','Yazar başlığı','Bu rehber hakkında'),
      field('blog-article.article.sourcesTitle','Kaynaklar başlığı','Kaynaklar ve Güncellik'),
      field('blog-article.article.sourcesDescription','Kaynaklar açıklaması','Rota bilgileri, rezervasyon öncesinde ekiple teyit edilmelidir.'),
      field('blog-article.article.relatedTitle','İlgili yazılar başlığı','İlgili Rehberler'),
      field('blog-article.article.routeTitle','Rota teklifi başlığı','Göcek rotanızı birlikte planlayalım.'),
      field('blog-article.article.routeDescription','Rota teklifi açıklaması','Tatil sürenize ve tercihlerinize göre size en uygun rotayı oluşturalım.'),
      field('blog-article.article.routeLabel','Rota teklifi düğmesi','Rota İçin Bilgi Alın'),
      field('blog-article.article.routeUrl','Rota teklifi bağlantısı','/iletisim/?rota=gocek-fethiye','url'),
    ]),
    section('cta','Makale kapanış teklifi',[
      field('blog-article.cta.title','Başlık','Hayalinizdeki Rotayı\nBirlikte Planlayalım.'),
      field('blog-article.cta.description','Açıklama','Göcek ve çevresindeki özel rotalar için size özel plan yapalım.'),
      field('blog-article.cta.image','Fotoğraf','assets/blog236/cta-deck.webp','image'),
      field('blog-article.cta.offerLabel','Teklif düğmesi','Teklif Alın'),
      field('blog-article.cta.offerUrl','Teklif bağlantısı','/iletisim/','url'),
      field('blog-article.cta.routesLabel','Rotalar düğmesi','Rotaları Keşfet'),
      field('blog-article.cta.routesUrl','Rotalar bağlantısı','/rotalar/','url'),
      field('blog-article.cta.note','El yazısı not','Mavi,\nyaşatır…'),
    ]),
  ]},
];
const teaser = (id,title,category,categoryKey,excerpt,date,minutes,photo,order) => ({id,slug:id,path:`/blog/${id}/`,title,category,categoryKey,excerpt,image:`assets/blog236/${photo}.webp`,author:'Fora Sailing Editör Ekibi',authorBio:'Mavi yolculuk, rota planlama ve gulet tatili hakkında güncel bilgiler paylaşır.',updatedAt:date,publishedAt:date,readMinutes:minutes,featured:false,published:true,status:'published',sortOrder:order,sections:[],faqs:[],sources:[],relatedIds:[],seo:{title:`${title} | Fora Sailing`,description:excerpt}});
export const BLOG_DEFAULT_POSTS = [
  {
    ...teaser('gocekte-mavi-yolculuk','Göcek’te Mavi Yolculuk: Koylar ve Rota Planlama','Rota Rehberi','rotalar','Turkuaz koyları, sakin limanları ve doğal güzellikleriyle Göcek’te unutulmaz bir rota için bilmeniz gerekenler.','2026-10-16',7,'gocek-feature',0),
    image:'assets/blog237/gocek-cover.webp',featured:true,
    introduction:'Göcek çıkışlı gulet tatilinizi planlarken rota, koy ve tekne seçimi için bilmeniz gerekenler.',
    imageCaption:'Göcek koylarında mavi yolculuk — temsili görsel',
    sections:[
      {id:'kisaca',type:'summary',title:'Kısaca',text:'Göcek’te rota, seyahat süresi, misafir tercihleri ve hava koşulları birlikte değerlendirilerek planlanır. Gulet seçimi de kabin sayısı ve yaşam alanları dikkate alınarak yapılır.',items:[{title:'Rotayı süreye göre belirleyin.',text:'Kaç gününüz olduğuna göre en uygun rota planını yapın.'},{title:'Tekne ve misafir ihtiyaçlarını eşleştirin.',text:'Kabin düzeni, konfor ve beklentilerinize uygun guleti seçin.'},{title:'Hava koşullarına göre esnek plan yapın.',text:'Mevsim ve rüzgar durumunu göz önünde bulundurun.'}]},
      {id:'gocekte-mavi-yolculuk',tocTitle:'Göcek’te mavi yolculuk',type:'text',title:'Göcek’te Mavi Yolculuk Nasıldır?',text:'Göcek, sakin koyları, berrak denizi ve doğal güzellikleriyle mavi yolculuk için özel bir başlangıç noktasıdır. Kısa mesafelerde birbirinden güzel koylara ulaşarak, deniz, doğa ve huzur dolu bir tatil deneyimi yaşanır. Rota, misafirlerin ilgi alanlarına göre esnek şekilde planlanabilir.'},
      {id:'rota-nasil-planlanir',tocTitle:'Rota nasıl planlanır?',type:'text',title:'Rota Nasıl Planlanır?',text:'Göcek çıkışlı rotalar, tatil süresi, misafirlerin beklentileri ve hava koşulları birlikte değerlendirilerek oluşturulur. Kısa süreli rotalarda yakın koylar, daha uzun tatillerde ise çevredeki popüler destinasyonlar dahil edilebilir.'},
      {id:'planlama-tablosu',type:'table',columns:['Planlama Başlığı','Dikkat Edilecekler'],rows:[['Süre','Başlangıç ve dönüş planı, tatil süresi'],['Misafirler','İlgi alanları, yaş grubu, konfor beklentileri'],['Koylar','Hava ve deniz durumu, popülerlik'],['Esneklik','Hava koşullarına göre alternatif rotalar']]},
      {id:'guvertede-mola',type:'image',image:'assets/blog237/gocek-deck.webp',caption:'Gulet ile Göcek koylarında huzurlu bir mola — temsili görsel'},
      {id:'gulet-secimi',tocTitle:'Gulet seçimi',type:'text',title:'Gulet Seçerken Nelere Bakmalı?',text:'Gulet seçiminde kişi sayısı, kabin düzeni, yaşam alanlarının konforu ve seyahat beklentileriniz önemlidir. Doğru gulet seçimi, mavi yolculuk deneyiminizin daha keyifli ve konforlu geçmesini sağlar.',link:'/filo/',linkLabel:'Rota için gulet seçeneklerini inceleyin'},
      {id:'yaniniza-alacaklariniz',tocTitle:'Yanınıza alacaklarınız',type:'essentials',title:'Yanınıza Alacaklarınız',text:'Mavi yolculukta yanınıza alacağınız temel eşyalar, tatilinizi daha konforlu hale getirir.',items:[{icon:'sun',title:'Güneş koruması',text:'Şapka, güneş gözlüğü ve güneş kremi'},{icon:'shirt',title:'Rahat kıyafet',text:'Denize ve tekne yaşamına uygun, hafif giysiler'},{icon:'bag',title:'Kişisel ihtiyaçlar',text:'Düzenli kullandığınız ilaçlar ve kişisel eşyalar'}]},
    ],
    faqs:[{id:'rota',question:'Rota önceden kesinleşir mi?',answer:'Rota; tatil süresi, misafir tercihleri ve hava koşulları birlikte değerlendirilerek planlanır. Rota bilgilerini rezervasyon öncesinde ekibimizle teyit edin.'},{id:'gulet',question:'Gulet seçimi nasıl yapılır?',answer:'Kişi sayısı, kabin düzeni, yaşam alanlarının konforu ve seyahat beklentileri birlikte değerlendirilir.'},{id:'bilgiler',question:'Tatil öncesinde hangi bilgiler paylaşılmalı?',answer:'Tatil sürenizi, misafir sayısını ve tercihlerinizi paylaşarak size uygun rota ve guleti birlikte planlayabilirsiniz.'}],
    sources:[{label:'İlgili rota bilgileri',url:'/rotalar/gocek-fethiye-gocek/'},{label:'Meteoroloji Genel Müdürlüğü',url:'https://www.mgm.gov.tr/'}],
    relatedIds:['gulet-tatiline-giderken-yaniniza-ne-almalisiniz','ailece-mavi-yolculuk-nasil-planlanir','gulet-secerken-nelere-dikkat-etmelisiniz'],
  },
  teaser('gulet-tatiline-giderken-yaniniza-ne-almalisiniz','Gulet Tatiline Giderken Yanınıza Ne Almalısınız?','Tatil Planlama','tatil-planlama','Mavi yolculukta daha konforlu bir deneyim için yanınıza almanız gerekenler.','2026-10-12',5,'card-01',1),
  teaser('bodrum-gokova-rotasinda-sizi-neler-bekliyor','Bodrum–Gökova Rotasında Sizi Neler Bekliyor?','Rota Rehberi','rotalar','Sakin koylar, tarihi duraklar ve eşsiz doğasıyla Bodrum–Gökova rotasının öne çıkanları.','2026-10-08',6,'card-02',2),
  teaser('ailece-mavi-yolculuk-nasil-planlanir','Ailece Mavi Yolculuk Nasıl Planlanır?','Ailece Seyahat','ailece-seyahat','Çocuklarla gulet tatili için pratik öneriler, uygun rotalar ve dikkat edilmesi gerekenler.','2026-10-04',6,'card-03',3),
  teaser('gulet-secerken-nelere-dikkat-etmelisiniz','Gulet Seçerken Nelere Dikkat Etmelisiniz?','Gulet Rehberi','gulet-tatili','Kabin, konfor, rota uyumu ve tekne özellikleri hakkında bilmeniz gerekenler.','2026-09-28',7,'card-04',4),
  teaser('marmaris-datca-ilk-yolculugunuz-icin-rota-rehberi','Marmaris–Datça: İlk Yolculuğunuz İçin Rota Rehberi','Rota Rehberi','rotalar','İlk mavi yolculuğunuz için ideal duraklar, koylar ve pratik bilgiler.','2026-09-20',6,'card-05',5),
  teaser('mavi-yolculuk-icin-hangi-donemi-secmelisiniz','Mavi Yolculuk İçin Hangi Dönemi Seçmelisiniz?','Deniz Yaşamı','deniz-yasami','Mevsimlere göre hava, deniz koşulları ve rotalar hakkında kapsamlı rehber.','2026-09-14',5,'card-06',6),
];

export function applyBlogDefaults236(content) {
  content.settings ||= {};
  content.pages ||= [];
  const first = Number(content.settings.blogContentVersion || 0) < 1;
  if (first) {
    for (const page of BLOG_DEFAULT_PAGES) if (!content.pages.some(existing=>existing.path===page.path)) content.pages.push(structuredClone(page));
    if (!Array.isArray(content.blog) || !content.blog.length) content.blog=structuredClone(BLOG_DEFAULT_POSTS);
    if (Array.isArray(content.menus) && !content.menus.some(item=>String(item.url||'').replace(/\/$/,'')==='/blog')) {
      const contact=content.menus.find(item=>String(item.url||'').includes('/iletisim'));
      const order=Number(contact?.sortOrder??contact?.order??content.menus.length);
      content.menus.push({id:'blog',label:'Blog',url:'/blog/',visible:true,sortOrder:order-.5});
    }
    content.settings.blogContentVersion=1;
  }
  for (const source of BLOG_DEFAULT_PAGES) {
    const page=content.pages.find(item=>item.path===source.path);
    if (!page) continue;
    page.sections ||= [];
    for (const defaultSection of source.sections) {
      let current=page.sections.find(item=>item.id===defaultSection.id);
      if (!current) {current=structuredClone(defaultSection);page.sections.push(current);continue;}
      current.fields ||= [];
      for(const defaultField of defaultSection.fields) if(!page.sections.some(item=>(item.fields||[]).some(existing=>existing.binding===defaultField.binding)))current.fields.push(structuredClone(defaultField));
    }
  }
  return content;
}

export function getBlogImage236(post, usage='article') {
  if (!post) return '';
  if (post.image === '') return '';
  if (usage==='card' && post.id==='gocekte-mavi-yolculuk' && post._canonicalEdits?.image!==true && post.image==='assets/blog237/gocek-cover.webp') return 'assets/blog236/gocek-feature.webp';
  return String(post.image ?? '');
}


// These are device-specific crops of the same supplied photographs. A saved
// media edit always uses the one canonical image on both device layouts.
const BLOG_MOBILE_IMAGES_243 = {
  'gocekte-mavi-yolculuk': 'assets/blog243/gocek-feature-mobile.webp',
  'gulet-tatiline-giderken-yaniniza-ne-almalisiniz': 'assets/blog243/card-01-mobile.webp',
  'bodrum-gokova-rotasinda-sizi-neler-bekliyor': 'assets/blog243/card-02-mobile.webp',
  'ailece-mavi-yolculuk-nasil-planlanir': 'assets/blog243/card-03-mobile.webp',
  'gulet-secerken-nelere-dikkat-etmelisiniz': 'assets/blog243/card-04-mobile.webp',
  'marmaris-datca-ilk-yolculugunuz-icin-rota-rehberi': 'assets/blog243/card-05-mobile.webp',
  'mavi-yolculuk-icin-hangi-donemi-secmelisiniz': 'assets/blog243/card-06-mobile.webp',
};
export function getBlogMobileImage236(post) {
  const image = getBlogImage236(post, 'card');
  if (!post || post._canonicalEdits?.image === true) return image;
  const source = BLOG_DEFAULT_POSTS.find(item => item.id === post.id);
  return source && source.image === post.image ? BLOG_MOBILE_IMAGES_243[post.id] || image : image;
}
