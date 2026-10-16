// Collection detail pages share the same content across every viewport.
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const cleanPath=value=>`/${String(value||'').replace(/^\/+|\/+$/g,'')}/`.replace(/^\/\/$/,'/');
export function detailContent(content,options={}) {
  const family=options.pageKey==='gulet-detail'?'gulets':options.pageKey==='route-detail'?'routes':null;
  if(!family)return {content,entity:null,family:null};
  const prefix=family==='gulets'?'eylul':'rota-gocek-fethiye';
  const defaultId=family==='gulets'?'eylul':'gocek-fethiye';
  const query=options.query||new URLSearchParams();
  const requested=query.get(family==='gulets'?'gulet':'rota');
  const rows=(content[family]||[]).filter(row=>options.includeDraft||(row.published!==false&&row.isPublished!==false&&row.visible!==false&&row.isDraft!==true&&String(row.status||'').toLowerCase()!=='draft'));
  const entity=rows.find(row=>requested&&(row.id===requested||row.slug===requested))
    ||rows.find(row=>cleanPath(row.path)===cleanPath(options.path))
    ||rows.find(row=>row.id===defaultId);
  if(!entity)return {content,entity:null,family};
  const baseline=(options.baseline?.[family]||[]).find(row=>row.id===entity.id);
  const dynamic=entity.id!==defaultId;
  const changed=key=>dynamic||!baseline||!equal(entity[key],baseline[key]);
  const next=structuredClone(content);
  const page=next.pages.find(page=>page.id===prefix);
  if(!page)return {content,entity,family};
  const fields=page.sections.flatMap(section=>section.fields||[]);
  const put=(suffix,value,canonicalEdit=false)=>{
    if(value===undefined||value===null)return;
    const field=fields.find(field=>field.binding===`${prefix}.${suffix}`);
    if(field){field.value=value;if(canonicalEdit)field.canonicalEdit=true;}
  };
  if(changed('name')||changed('title'))put('hero.title',entity.name||entity.title);
  if(changed('shortDescription')||changed('description'))put('hero.description',entity.shortDescription||entity.description);
  if(changed('storyDescription')||changed('longDescription')||changed('description'))put('content.description',entity.storyDescription||entity.longDescription||entity.description);
  const canonicalImageKey=['image','coverImage','heroImage'].find(key=>entity._canonicalEdits?.[key]===true);
  if(canonicalImageKey)put('hero.image',entity[canonicalImageKey]??'',true);
  else if(changed('heroImage')||changed('coverImage')||changed('image'))put('hero.image',entity.heroImage||entity.coverImage||entity.image);
  put('hero.offerUrl',entity.inquiryUrl||`/iletisim/?${family==='gulets'?'gulet':'rota'}=${encodeURIComponent(entity.id)}`);
  if(family==='routes'&&changed('stops')&&Array.isArray(entity.stops)&&entity.stops.length) {
    put('stops.description',entity.stops.map(stop=>typeof stop==='string'?stop:stop.name).filter(Boolean).join(' · '));
  }
  return {content:next,entity,family,dynamic};
}
