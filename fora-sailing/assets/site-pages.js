import { renderCatalog, initCatalog } from './site-pages-catalog.js?v=20261015-99';
const CATALOG = new Set(['routes', 'fleet', 'experiences']);
let details;
export async function renderPage(pageKey, ctx) {
  if (CATALOG.has(pageKey)) return renderCatalog(pageKey, ctx);
  details ||= await import('./site-pages-detail.js?v=20261015-99');
  return details.renderDetail(pageKey, ctx);
}
export function initPage(root, ctx, pageKey) {
  return CATALOG.has(pageKey) ? initCatalog(root, ctx, pageKey) : details?.initDetail(root, ctx, pageKey);
}