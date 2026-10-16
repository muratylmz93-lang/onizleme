import { renderCatalog, initCatalog } from './site-pages-catalog.js?v=20261016-246';
const CATALOG = new Set(['routes', 'fleet', 'experiences']);
let details,blogList,blogArticle;
export async function renderPage(pageKey, ctx) {
  if(pageKey==='blog'){blogList ||= await import('./site-blog-list236.js?v=20261016-246');return blogList.renderBlogList(ctx);}
  if(pageKey==='blog-detail'){blogArticle ||= await import('./site-blog-article237.js?v=20261016-246');return blogArticle.renderBlogArticle(ctx);}
  if (CATALOG.has(pageKey)) return renderCatalog(pageKey, ctx);
  details ||= await import('./site-pages-detail.js?v=20261016-246');
  return details.renderDetail(pageKey, ctx);
}
export function initPage(root, ctx, pageKey) {
  if(pageKey==='blog')return blogList?.initBlogList(root,ctx);
  if(pageKey==='blog-detail')return blogArticle?.initBlogArticle(root,ctx);
  return CATALOG.has(pageKey) ? initCatalog(root, ctx, pageKey) : details?.initDetail(root, ctx, pageKey);
}
