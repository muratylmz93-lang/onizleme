(() => {
  'use strict';

  const script = document.currentScript;
  const assetsUrl = new URL('.', script?.src || location.href);
  const bindingsUrl = new URL('cms-bindings.json', assetsUrl);
  const fallbackUrl = new URL('cms-public.json', assetsUrl);
  const previewRequested = new URLSearchParams(location.search).get('cmsPreview') === '1';
  const apiEndpoint = document.querySelector('meta[name="fora-cms-api"]')?.content || script?.dataset.api;
  let apiUrl = apiEndpoint ? new URL(apiEndpoint, location.href) : null;
  const configuredSiteBase = document.querySelector('meta[name="fora-cms-site-base"]')?.content;
  const configuredPagePath = document.querySelector('meta[name="fora-cms-page-path"]')?.content || '';
  const configuredTemplatePath = document.querySelector('meta[name="fora-cms-template-path"]')?.content || '';
  let previewPagePath = '';
  let previewTemplatePath = '';
  let draftPreviewActive = false;
  let appliedContentFingerprint = '';
  const siteBase = configuredSiteBase || (() => {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    const match = path.match(/\/(?:rotalar|filo|deneyimler|hakkimizda|iletisim)(?:\/|$)/);
    return match ? `${path.slice(0, match.index) || ''}/` : new URL('.', location.href).pathname;
  })();
  const normalizePath = (value) => {
    const rawPath = new URL(value, location.href).pathname.replace(/\\/g, '/');
    const mountPath = new URL(siteBase, location.origin).pathname.replace(/\/+$/, '');
    const path = mountPath && rawPath.startsWith(`${mountPath}/`) ? rawPath.slice(mountPath.length) : rawPath;
    const withoutBase = path.replace(/\/+$/, '') || '/';
    const known = ['/rotalar/gocek-fethiye-gocek', '/rotalar', '/filo/eylul', '/filo', '/deneyimler', '/hakkimizda', '/iletisim'];
    const matched = known.find((suffix) => withoutBase === suffix || withoutBase.endsWith(suffix));
    return matched ? `${matched}/` : (withoutBase === '/' ? '/' : `${withoutBase}/`);
  };
  const currentPagePath = () => previewPagePath || normalizePath(configuredPagePath || location.pathname);
  const currentTemplatePath = () => configuredTemplatePath || previewTemplatePath || currentPagePath();
  const safeHref = (value) => {
    if (typeof value !== 'string') return null;
    try {
      const url = new URL(value, location.href);
      return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? value : null;
    } catch { return null; }
  };
  const siteHref = (value) => {
    if (typeof value !== 'string') return null;
    if (value.startsWith('#')) return value;
    if (value.startsWith('/') && !value.startsWith('//')) return safeHref(new URL(value.replace(/^\/+/, ''), new URL(siteBase, location.href)).href);
    if (/^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(value)) {
      return safeHref(value);
    }
    const normalized = value.replace(/^(?:\.\.\/)+/, '');
    return safeHref(new URL(normalized, new URL(siteBase, location.href)).href);
  };
  const safeImage = (value) => {
    if (typeof value !== 'string') return null;
    const base = value.startsWith('/media/') && apiUrl ? apiUrl.origin : new URL('../', assetsUrl);
    const href = safeHref(new URL(value, base).href);
    return href && !/^(javascript|data):/i.test(value) ? href : null;
  };
  let bindingConfig = { pages: [] };
  let currentRevision = -1;
  let appliedContentSource = '';
  let currentContent = null;
  let currentRenderedContent = null;
  let baselineContent = null;
  let analyticsLoadedId = '';
  let overlayLayer;
  const activeOverlays = new Map();
  const sourceCopyEntered = new WeakSet();
  let sourceCopyObserver = null;
  let appliedSectionSignature = '';
  let appliedSectionState = null;
  let reducedMotionQuery;

  const pageConfigFor = (path) => {
    const pages = bindingConfig.pages || [];
    return pages.find((page) => page.path === path) || (path === currentPagePath() ? pages.find((page) => page.path === currentTemplatePath()) : null);
  };
  const findPage = (content, path) => {
    const direct = content?.pages?.find((page) => {
      const candidate = page.path.startsWith('/') ? page.path : `/${page.path}`;
      return normalizePath(candidate) === path;
    });
    if (direct) return direct;
    const templatePath = currentTemplatePath();
    if (path === currentPagePath() && templatePath && templatePath !== path) {
      return content?.pages?.find((page) => normalizePath(page.path) === templatePath);
    }
    return undefined;
  };
  const fieldsForPage = (contentPage) => (contentPage?.sections || []).flatMap((section) => section.fields || []);
  const fieldMap = (page) => new Map(fieldsForPage(page).map((field) => [field.binding, field]));
  const defaultMatches = (field) => JSON.stringify(field.value) === JSON.stringify(field.defaultValue);

  function contentWithDetailEntityFields(content, page, pageConfig, path) {
    const family = path.startsWith('/filo/') ? 'gulets' : path.startsWith('/rotalar/') ? 'routes' : '';
    if (!family || path === '/filo/' || path === '/rotalar/' || !page || !pageConfig) return content;
    const slug = path.slice(family === 'gulets' ? '/filo/'.length : '/rotalar/'.length).replace(/\/$/, '').toLowerCase();
    const collection = pageConfig.collections?.find((spec) => spec.key === family);
    const query = new URLSearchParams(location.search);
    const requestedId = query.get(family === 'gulets' ? 'gulet' : 'rota');
    const allEntities = Array.isArray(content[family]) ? content[family] : [];
    const entities = draftPreviewActive ? allEntities : allEntities.filter((item) => item.published !== false && item.status !== 'draft');
    const idOf = (item) => String(item.id || item.slug || '').toLowerCase();
    const pathOf = (item) => String(item.path || '').replace(/\/$/, '').toLowerCase();
    const requested = requestedId ? entities.find((item) => idOf(item) === requestedId.toLowerCase() || pathOf(item).endsWith(`/${requestedId.toLowerCase()}`)) : null;
    const byPath = entities.find((item) => pathOf(item) === path.replace(/\/$/, '').toLowerCase() || idOf(item) === slug || pathOf(item).endsWith(`/${slug}`));
    const detailFallback = path === pageConfig.path && collection?.detailId ? entities.find((item) => idOf(item) === String(collection.detailId).toLowerCase()) : null;
    const entity = requested || byPath || detailFallback;
    if (!entity) return content;
    const baselineEntities = Array.isArray(baselineContent?.[family]) ? baselineContent[family] : [];
    const baseEntity = baselineEntities.find((item) => String(item.id || item.slug || '').toLowerCase() === String(entity.id || entity.slug || '').toLowerCase());
    const templateId = String(collection?.detailId || '').toLowerCase();
    const selectedId = idOf(entity);
    const isDifferentTemplateEntity = Boolean(templateId && selectedId !== templateId);
    const templateEntity = isDifferentTemplateEntity ? baselineEntities.find((item) => idOf(item) === templateId) : null;
    const comparisonEntity = templateEntity || baseEntity;
    const isEntityChange = (key, value) => isDifferentTemplateEntity || !baseEntity || JSON.stringify(value) !== JSON.stringify(baseEntity[key]);

    const fields = fieldsForPage(page);
    const prefix = String(pageConfig.fields?.find((mapping) => mapping.binding)?.binding || '').split('.')[0];
    if (!prefix) return content;
    const nameField = entity.title && isEntityChange('title', entity.title)
      ? entity.title
      : entity.name && isEntityChange('name', entity.name) ? entity.name : entity.name || entity.title;
    const nameChanged = Boolean(nameField) && String(nameField) !== String(comparisonEntity?.name || comparisonEntity?.title || '');
    const heroDescription = entity.shortDescription || entity.description;
    const heroDescriptionChanged = heroDescription != null && (
      isDifferentTemplateEntity || !comparisonEntity || JSON.stringify(heroDescription) !== JSON.stringify(comparisonEntity.shortDescription || comparisonEntity.description)
    );
    const detailCopy = entity.storyDescription || entity.longDescription || entity.content?.description || entity.description;
    const descriptionChanged = detailCopy != null && (
      isDifferentTemplateEntity || !comparisonEntity || JSON.stringify(detailCopy) !== JSON.stringify(comparisonEntity.storyDescription || comparisonEntity.longDescription || comparisonEntity.content?.description || comparisonEntity.description)
    );
    const imageValue = entity.heroImage || entity.coverImage || entity.image || entity.artwork;
    const imageChanged = Boolean(imageValue) && (
      isDifferentTemplateEntity || !comparisonEntity || JSON.stringify(imageValue) !== JSON.stringify(comparisonEntity.heroImage || comparisonEntity.coverImage || comparisonEntity.image || comparisonEntity.artwork)
    );
    const entityId = String(entity.id || entity.slug || slug);
    const inquiryValue = entity.inquiryUrl || `/iletisim/?${family === 'gulets' ? 'gulet' : 'rota'}=${encodeURIComponent(entityId)}`;
    const offerField = fields.find((field) => field.binding === `${prefix}.hero.offerUrl`);
    const inquiryChanged = Boolean(inquiryValue) && String(offerField?.value || '') !== inquiryValue;
    const galleryChanged = isDifferentTemplateEntity || !comparisonEntity || JSON.stringify(entity.gallery || []) !== JSON.stringify(comparisonEntity.gallery || []);
    const capacityChanged = JSON.stringify(entity.guestCapacity) !== JSON.stringify(comparisonEntity?.guestCapacity);
    const cabinsChanged = JSON.stringify(entity.cabins) !== JSON.stringify(comparisonEntity?.cabins);
    const stopNames = family === 'routes' && Array.isArray(entity.stops)
      ? entity.stops.map((stop, index) => String(stop?.name || `Durak ${index + 1}`).trim()) : [];
    const sourceStopNames = family === 'routes' && Array.isArray(comparisonEntity?.stops)
      ? comparisonEntity.stops.map((stop, index) => String(stop?.name || `Durak ${index + 1}`).trim()) : [];
    const stopNamesChanged = family === 'routes' && JSON.stringify(stopNames) !== JSON.stringify(sourceStopNames);
    const overrides = new Map([
      [`${prefix}.hero.title`, nameChanged ? nameField : null],
      [`${prefix}.hero.description`, heroDescriptionChanged ? heroDescription : null],
      [`${prefix}.hero.image`, imageChanged ? imageValue : null],
      [`${prefix}.hero.offerUrl`, inquiryChanged ? inquiryValue : null],
      [`${prefix}.content.description`, descriptionChanged ? detailCopy : null],
      [`${prefix}.stops.description`, stopNamesChanged ? (stopNames.length ? `${stopNames.join(' → ')}.` : '') : null]
    ]);
    if (family === 'gulets' && galleryChanged && Array.isArray(entity.gallery)) {
      for (let index = 0; index < 6; index += 1) {
        const image = entity.gallery[index];
        const resolved = typeof image === 'string' && image.trim() ? safeImage(image) : '';
        overrides.set(`${prefix}.device.gallery${index + 1}Image`, resolved || '');
      }
    }
    let changed = false;
    const nextFields = fields.map((field) => {
      if (!overrides.has(field.binding) || !defaultMatches(field)) return field;
      const value = overrides.get(field.binding);
      const galleryImageField = /\.device\.gallery\d+Image$/.test(field.binding || '');
      const stopsSummaryField = field.binding === `${prefix}.stops.description` && stopNamesChanged;
      if (value == null || (value === '' && !galleryImageField && !stopsSummaryField)) return field;
      changed = true;
      const nextField = { ...field, value, cmsEntityDerived: true };
      if (field.deviceOverrides && Object.keys(field.deviceOverrides).length) {
        nextField.deviceOverrides = Object.fromEntries(Object.entries(field.deviceOverrides || {}).map(([device, original]) => {
          if (!stopsSummaryField) return [device, value];
          // Keep the source weather/itinerary note after the itinerary sentence.
          const source = String(original || '');
          const fullStop = source.indexOf('.');
          const tail = fullStop >= 0 ? source.slice(fullStop + 1) : '';
          return [device, `${value}${tail}`];
        }));
      }
      return nextField;
    });
    if (nameChanged) {
      const previousName = String(comparisonEntity?.name || comparisonEntity?.title || (family === 'gulets' ? 'Eylül' : 'Göcek–Fethiye')).trim();
      if (previousName) {
        const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const replaceName = (value) => {
          if (typeof value !== 'string' || !value.toLocaleLowerCase('tr-TR').includes(previousName.toLocaleLowerCase('tr-TR'))) return value;
          const pattern = new RegExp(escapeRegExp(previousName), 'giu');
          return value.replace(pattern, (match) => match === match.toLocaleUpperCase('tr-TR') ? String(nameField).toLocaleUpperCase('tr-TR') : String(nameField));
        };
        let fieldIndex = 0;
        const renamedFields = nextFields.map((field) => {
          const original = fields[fieldIndex++];
          if (!field || !original || !defaultMatches(original) || typeof original.value !== 'string') return field;
          // Explicit entity values already contain the chosen name. Replacing
          // the source name inside them would duplicate suffixes such as
          // "Eylül Yayın Kontrolü Yayın Kontrolü".
          if (field.cmsEntityDerived) return field;
          const value = replaceName(field.value);
          if (value === field.value) return field;
          changed = true;
          const deviceOverrides = Object.fromEntries(Object.entries(field.deviceOverrides || {}).map(([device, deviceValue]) => [device, replaceName(deviceValue)]));
          return { ...field, value, deviceOverrides, cmsEntityDerived: true };
        });
        nextFields.splice(0, nextFields.length, ...renamedFields);
      }
    }
    // Always attach entity context so restoring canonical content clears any prior gallery/capacity override.

    let fieldIndex = 0;
    const sections = (page.sections || []).map((section) => {
      const nextSectionFields = (section.fields || []).map(() => nextFields[fieldIndex++]);
      return { ...section, fields: nextSectionFields };
    });
    const nextPage = { ...page, sections };
    nextPage.cmsEntityContext = {
      family,
      id: entity.id || entity.slug || slug,
      name: nameField || entity.name || entity.title || '',
      gallery: Array.isArray(entity.gallery) ? entity.gallery : [],
      galleryChanged,
      galleryUnderlay: collection?.galleryUnderlay || null,
      guestCapacity: entity.guestCapacity,
      capacityChanged,
      cabins: entity.cabins,
      cabinsChanged
    };
    if (nameChanged || descriptionChanged) {
      if (nameChanged) nextPage.title = `${nameField} | Fora Sailing`;
      nextPage.seo = {
        ...(page.seo || {}),
        title: nameChanged ? `${nameField} | Fora Sailing` : (page.seo?.title || ''),
        description: descriptionChanged ? entity.description : (page.seo?.description || ''),
        canonical: path
      };
    }
    return { ...content, pages: content.pages.map((candidate) => candidate === page ? nextPage : candidate) };
  }

  function applyDetailEntityContext(page) {
    const context = page?.cmsEntityContext;
    if (!context || context.family !== 'gulets') return;
    const priorGalleryCover = document.querySelector('.cms-detail-gallery-underlay');
    const galleryUnderlay = context.galleryChanged ? context.galleryUnderlay : null;
    if (galleryUnderlay?.path && Array.isArray(galleryUnderlay.rect)) {
      const host = document.querySelector(galleryUnderlay.selector || '.canvas');
      const sourceWidth = Number(galleryUnderlay.sourceDimensions?.[0]) || 1024;
      const sourceHeight = Number(galleryUnderlay.sourceDimensions?.[1]) || 1536;
      const [left, top, right, bottom] = galleryUnderlay.rect.map(Number);
      if (host && [left, top, right, bottom].every(Number.isFinite) && right > left && bottom > top) {
        const cover = priorGalleryCover || document.createElement('img');
        cover.className = 'cms-detail-gallery-underlay';
        cover.dataset.cmsGalleryUnderlay = 'true';
        cover.src = safeImage(galleryUnderlay.path) || '';
        cover.alt = '';
        cover.setAttribute('aria-hidden', 'true');
        Object.assign(cover.style, {
          position: 'absolute', left: `${left / sourceWidth * 100}%`, top: `${top / sourceHeight * 100}%`,
          width: `${(right - left) / sourceWidth * 100}%`, height: `${(bottom - top) / sourceHeight * 100}%`,
          maxWidth: 'none', objectFit: 'fill', pointerEvents: 'none',
          zIndex: String(Number(galleryUnderlay.zIndex) || 3)
        });
        if (!priorGalleryCover) host.append(cover);
      } else priorGalleryCover?.remove();
    } else priorGalleryCover?.remove();
    document.querySelectorAll('input[name="guests"]').forEach((input) => {
      if (input.dataset.cmsOriginalMaxSaved !== 'true') {
        input.dataset.cmsOriginalMax = input.getAttribute('max') || '';
        input.dataset.cmsOriginalMaxSaved = 'true';
      }
      if (context.capacityChanged && Number.isFinite(Number(context.guestCapacity)) && Number(context.guestCapacity) > 0) {
        input.max = String(context.guestCapacity);
      } else if (input.getAttribute('max') !== input.dataset.cmsOriginalMax) {
        if (input.dataset.cmsOriginalMax) input.max = input.dataset.cmsOriginalMax;
        else input.removeAttribute('max');
      }
    });
    const main = document.querySelector('#galleryMain');
    const buttons = [...document.querySelectorAll('.thumb-hit[data-gallery-image]')];
    const mobileImages = [...document.querySelectorAll('.mobile-gallery-row img')];
    const setGalleryVisible = (node, visible) => {
      if (!node) return;
      if (node.dataset.cmsGalleryVisibilitySaved !== 'true') {
        node.dataset.cmsGalleryVisibility = node.style.visibility;
        node.dataset.cmsGalleryPointerEvents = node.style.pointerEvents;
        if (node instanceof HTMLButtonElement) node.dataset.cmsGalleryDisabled = String(node.disabled);
        node.dataset.cmsGalleryVisibilitySaved = 'true';
      }
      if (!visible) {
        node.style.visibility = 'hidden';
        node.style.pointerEvents = 'none';
        if (node instanceof HTMLButtonElement) node.disabled = true;
      } else {
        node.style.visibility = node.dataset.cmsGalleryVisibility || '';
        node.style.pointerEvents = node.dataset.cmsGalleryPointerEvents || '';
        if (node instanceof HTMLButtonElement) node.disabled = node.dataset.cmsGalleryDisabled === 'true';
      }
    };
    if (main) {
      if (main.dataset.cmsOriginalSrcSaved !== 'true') {
        main.dataset.cmsOriginalSrc = main.getAttribute('src') || '';
        main.dataset.cmsOriginalSrcSaved = 'true';
      }
      if (context.galleryChanged && context.gallery.length) {
        const next = safeImage(context.gallery[0]);
        if (next) main.src = next;
        setGalleryVisible(main, Boolean(next));
      } else if (context.galleryChanged) {
        setGalleryVisible(main, false);
      } else {
        // The page's gallery listener may have painted a new image before
        // this runtime captured the original DOM URL. Use the canonical
        // collection value when returning a published gallery to its source.
        const canonicalSrc = safeImage(context.gallery[0]) || main.dataset.cmsOriginalSrc;
        if (main.getAttribute('src') !== canonicalSrc) main.src = canonicalSrc;
        setGalleryVisible(main, true);
      }
    }
    buttons.forEach((button, index) => {
      if (button.dataset.cmsOriginalGalleryImageSaved !== 'true') {
        button.dataset.cmsOriginalGalleryImage = button.dataset.galleryImage || '';
        button.dataset.cmsOriginalGalleryImageSaved = 'true';
      }
      const value = context.gallery[index + 1];
      const next = context.galleryChanged && value ? safeImage(value) : null;
      if (next) {
        button.dataset.galleryImage = next;
        button.style.backgroundImage = `url("${next}")`;
        button.style.backgroundSize = 'cover';
        button.style.backgroundPosition = 'center';
        button.style.backgroundRepeat = 'no-repeat';
        setGalleryVisible(button, true);
      } else if (context.galleryChanged) {
        button.dataset.galleryImage = button.dataset.cmsOriginalGalleryImage;
        button.style.removeProperty('background-image');
        button.style.removeProperty('background-size');
        button.style.removeProperty('background-position');
        button.style.removeProperty('background-repeat');
        setGalleryVisible(button, false);
      } else {
        button.dataset.galleryImage = button.dataset.cmsOriginalGalleryImage;
        button.style.removeProperty('background-image');
        button.style.removeProperty('background-size');
        button.style.removeProperty('background-position');
        button.style.removeProperty('background-repeat');
        setGalleryVisible(button, true);
      }
    });
    mobileImages.forEach((image, index) => {
      if (image.dataset.cmsOriginalSrcSaved !== 'true') {
        image.dataset.cmsOriginalSrc = image.getAttribute('src') || '';
        image.dataset.cmsOriginalSrcSaved = 'true';
      }
      const next = context.galleryChanged ? safeImage(context.gallery[index]) : null;
      if (next) image.src = next;
      else if (context.galleryChanged) image.src = image.dataset.cmsOriginalSrc;
      else if (image.getAttribute('src') !== image.dataset.cmsOriginalSrc) image.src = image.dataset.cmsOriginalSrc;
      setGalleryVisible(image, !context.galleryChanged || Boolean(next));
    });
  }

  function setText(target, value) {
    target.textContent = value == null ? '' : String(value);
    target.classList.add('cms-content-value');
  }
  function setValue(target, field) {
    const value = field.value;
    if (field.type === 'image') {
      const src = safeImage(value);
      if (src && target instanceof HTMLImageElement) {
        target.src = src;
        if (target.classList.contains('hero-clean-base')) {
          const overlay = document.querySelector('.hero-photo-overlay');
          if (overlay) overlay.style.visibility = String(value) === String(field.defaultValue) ? '' : 'hidden';
        }
      }
      return;
    }
    if (field.type === 'link' || target instanceof HTMLAnchorElement && field.type === 'url') {
      const href = siteHref(value);
      if (href && target instanceof HTMLAnchorElement) target.href = href;
      return;
    }
    if (field.type === 'animation' && value && typeof value === 'object') {
      const allowed = ['duration', 'delay', 'distance', 'once'];
      allowed.forEach((name) => {
        if (!(name in value)) return;
        const val = value[name];
        if (name === 'once') target.dataset.cmsAnimationOnce = String(Boolean(val));
        else if (Number.isFinite(Number(val))) {
          target.style.setProperty(`--cms-${name}`, `${Number(val)}${name === 'distance' ? 'px' : 'ms'}`);
          if (name === 'duration') target.style.animationDuration = `${Number(val)}ms`;
        }
      });
      return;
    }
    setText(target, value);
  }

  function setMeta(selector, attribute, value) {
    let node = document.head.querySelector(selector);
    if (!value) { node?.remove(); return; }
    if (!node) {
      node = document.createElement('meta');
      if (selector.startsWith('meta[name=')) node.name = selector.match(/name="([^"]+)/)?.[1] || '';
      if (selector.startsWith('meta[property=')) node.setAttribute('property', selector.match(/property="([^"]+)/)?.[1] || '');
      document.head.append(node);
    }
    node.setAttribute(attribute, String(value));
  }

  function applySeo(page, settings) {
    const seo = page?.seo || {};
    const globalSeo = settings?.seo || {};
    if (seo.title) document.title = seo.title;
    setMeta('meta[name="description"]', 'content', seo.description || '');
    const previewOnly = previewRequested || /(?:^|\/)site(?:\/|$)/.test(location.pathname) || /localhost|127\.0\.0\.1|onizleme/i.test(location.hostname);
    let canonicalValue = seo.canonical || '';
    if (!canonicalValue && globalSeo.siteUrl && seo.title) {
      try { canonicalValue = new URL(currentPagePath().replace(/^\//, ''), globalSeo.siteUrl.endsWith('/') ? globalSeo.siteUrl : `${globalSeo.siteUrl}/`).href; } catch { canonicalValue = ''; }
    }
    const canonical = canonicalValue ? safeHref(canonicalValue) : null;
    let canonicalNode = document.head.querySelector('link[rel="canonical"]');
    if (canonical) {
      if (!canonicalNode) { canonicalNode = document.createElement('link'); canonicalNode.rel = 'canonical'; document.head.append(canonicalNode); }
      canonicalNode.href = canonical;
    } else canonicalNode?.remove();
    const mayIndex = !previewOnly && globalSeo.indexable === true && seo.robots !== 'noindex,nofollow';
    setMeta('meta[name="robots"]', 'content', previewOnly ? 'noindex,nofollow' : (seo.robots || (mayIndex ? 'index,follow' : 'noindex,nofollow')));
    const ogTitle = seo.title || document.title;
    setMeta('meta[property="og:title"]', 'content', ogTitle || '');
    setMeta('meta[property="og:description"]', 'content', seo.description || '');
    const ogImage = safeImage(seo.ogImage);
    setMeta('meta[property="og:image"]', 'content', ogImage || '');
    const code = String(globalSeo.verificationCode || '').trim();
    setMeta('meta[name="google-site-verification"]', 'content', /^[A-Za-z0-9_-]{1,128}$/.test(code) ? code : '');
    maybeEnableAnalytics(globalSeo, previewOnly);
  }

  function applyMotionSettings(settings) {
    const motion = settings?.motion || {};
    const scrollAnimations = motion.scrollAnimations !== false;
    const respectReducedMotion = motion.respectReducedMotion !== false;
    const root = document.documentElement;
    root.dataset.cmsScrollAnimations = String(scrollAnimations);
    root.dataset.cmsRespectReducedMotion = String(respectReducedMotion);
    root.dataset.cmsReduceMotionMobile = String(motion.reduceMotionMobile === true);
    root.dataset.cmsUserReducedMotion = String(respectReducedMotion && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
    if (!reducedMotionQuery && window.matchMedia) {
      reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      reducedMotionQuery.addEventListener?.('change', (event) => {
        root.dataset.cmsUserReducedMotion = String(root.dataset.cmsRespectReducedMotion === 'true' && event.matches);
        syncSourceCopyMotion({
          scrollAnimations: root.dataset.cmsScrollAnimations !== 'false',
          respectReducedMotion: root.dataset.cmsRespectReducedMotion === 'true'
        });
      });
    }
    let style = document.getElementById('fora-cms-motion-overrides');
    if (!style) {
      style = document.createElement('style');
      style.id = 'fora-cms-motion-overrides';
      document.head.append(style);
    }
    style.textContent = `
      html[data-cms-scroll-animations="false"] .hero-camera,
      html[data-cms-scroll-animations="false"] .hero-camera-inner,
      html[data-cms-scroll-animations="false"] [data-parallax],
      html[data-cms-scroll-animations="false"] [data-scroll-motion] {
        animation: none !important;
        transform: none !important;
        translate: none !important;
        scroll-behavior: auto !important;
      }
      html[data-cms-scroll-animations="false"] {
        --hero-scroll-y: 0px;
        --hero-scroll-scale: 1;
        --story-y: 0px;
        --story-side-y: 0px;
        --offer-scroll-y: 0px;
      }
      html[data-cms-scroll-animations="false"] .masthead.is-hidden,
      html[data-cms-scroll-animations="false"] .source-header.is-hidden,
      html[data-cms-scroll-animations="false"] .quick-contact {
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
        translate: none !important;
      }
      html[data-cms-scroll-animations="false"] .hero-line,
      html[data-cms-scroll-animations="false"] .source-title-glyph,
      html[data-cms-scroll-animations="false"] .art-card,
      html[data-cms-scroll-animations="false"] .photo-art-group,
      html[data-cms-scroll-animations="false"] .story-main,
      html[data-cms-scroll-animations="false"] .story-side {
        animation: none !important;
        opacity: 1 !important;
        visibility: visible !important;
        clip-path: none !important;
        transform: none !important;
        translate: none !important;
      }
      html[data-cms-scroll-animations="false"] .source-copy-motion,
      html[data-cms-user-reduced-motion="true"] .source-copy-motion {
        opacity: 0 !important;
        visibility: hidden !important;
        animation: none !important;
        transform: none !important;
        translate: none !important;
        transition: none !important;
      }
      @media (min-width: 651px) and (max-width: 1799px) {
        html[data-cms-home-artwork-collections="true"] .route-cards,
        html[data-cms-home-artwork-collections="true"] .fleet-cards {
          visibility: hidden !important;
          pointer-events: none !important;
        }
      }
      html[data-cms-scroll-animations="false"] *,
      html[data-cms-scroll-animations="false"] *::before,
      html[data-cms-scroll-animations="false"] *::after {
        scroll-behavior: auto !important;
      }
      html[data-cms-user-reduced-motion="true"] .hero-camera,
      html[data-cms-user-reduced-motion="true"] .hero-camera-inner,
      html[data-cms-user-reduced-motion="true"] [data-parallax],
      html[data-cms-user-reduced-motion="true"] [data-scroll-motion] {
        animation: none !important; transform: none !important; translate: none !important;
      }
      html[data-cms-user-reduced-motion="true"] [data-reveal],
      html[data-cms-user-reduced-motion="true"] .hero-line,
      html[data-cms-user-reduced-motion="true"] .source-title-glyph,
      html[data-cms-user-reduced-motion="true"] .art-card,
      html[data-cms-user-reduced-motion="true"] .photo-art-group,
      html[data-cms-user-reduced-motion="true"] .story-main,
      html[data-cms-user-reduced-motion="true"] .story-side {
        animation: none !important; opacity: 1 !important; visibility: visible !important;
        clip-path: none !important; transform: none !important; translate: none !important;
        transition-duration: 150ms !important; transition-delay: 0ms !important;
      }
      html[data-cms-scroll-animations="false"] .source-copy-motion,
      html[data-cms-user-reduced-motion="true"] .source-copy-motion {
        opacity: 0 !important;
        visibility: hidden !important;
        animation: none !important;
        transform: none !important;
        translate: none !important;
        transition: none !important;
      }
      @media (prefers-reduced-motion: reduce) {
        html[data-cms-respect-reduced-motion="true"] .hero-camera,
        html[data-cms-respect-reduced-motion="true"] .hero-camera-inner,
        html[data-cms-respect-reduced-motion="true"] [data-parallax] {
          animation: none !important;
          transform: none !important;
          translate: none !important;
        }
      }
    `;
    window.dispatchEvent(new CustomEvent('fora:motion-settings', {
      detail: { ...motion, scrollAnimations, respectReducedMotion }
    }));
    syncSourceCopyMotion({ scrollAnimations, respectReducedMotion });
  }

  function syncSourceCopyMotion({ scrollAnimations, respectReducedMotion }) {
    const nodes = [...document.querySelectorAll('.source-copy-motion[data-reveal]')];
    if (!nodes.length) return;
    const reduced = respectReducedMotion && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    if (!scrollAnimations || reduced) {
      nodes.forEach((node) => node.classList.remove('is-visible'));
      return;
    }
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => { node.classList.add('is-visible'); sourceCopyEntered.add(node); });
      return;
    }
    if (!sourceCopyObserver) {
      sourceCopyObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          sourceCopyEntered.add(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.2 });
    }
    nodes.forEach((node) => {
      if (sourceCopyEntered.has(node)) node.classList.add('is-visible');
      else sourceCopyObserver.observe(node);
    });
  }

  function applyTypography(settings) {
    const allowedFonts = new Map([
      ['Playfair Display', '"Playfair Display", Georgia, serif'],
      ['Inter', 'Inter, Arial, sans-serif'],
      ['Caveat', 'Caveat, cursive']
    ]);
    const typography = settings?.typography || {};
    const heading = allowedFonts.get(typography.headingFont) || allowedFonts.get('Playfair Display');
    const body = allowedFonts.get(typography.bodyFont) || allowedFonts.get('Inter');
    const root = document.documentElement;
    root.style.setProperty('--font-display', heading);
    root.style.setProperty('--font-body', body);
    root.dataset.cmsHeadingFont = typography.headingFont in Object.fromEntries(allowedFonts) ? typography.headingFont : 'Playfair Display';
    root.dataset.cmsBodyFont = typography.bodyFont in Object.fromEntries(allowedFonts) ? typography.bodyFont : 'Inter';
  }

  function applyFavicon(value) {
    if (typeof value !== 'string') return;
    const isRelativeAsset = !/^(?:[a-z][a-z0-9+.-]*:|\/|\/\/)/i.test(value);
    const href = isRelativeAsset ? safeHref(new URL(value, assetsUrl).href) : safeImage(value);
    if (!href) return;
    let link = document.querySelector('link[rel~="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.append(link);
    }
    if (link.href !== href) link.href = href;
  }

  function maybeEnableAnalytics(seo, previewOnly) {
    const productionHost = !previewOnly && !['localhost','127.0.0.1'].includes(location.hostname) && !/onizleme|preview/i.test(location.hostname);
    const id = String(seo.measurementId || '').trim();
    if (!productionHost || seo.analyticsConsent !== true || window.ForaAnalyticsConsent !== true || !/^G-[A-Z0-9]+$/i.test(id) || analyticsLoadedId === id) return;
    analyticsLoadedId = id;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'denied' });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', id, { send_page_view: true });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.append(script);
    if (!document.documentElement.dataset.foraAnalyticsListener) {
      document.documentElement.dataset.foraAnalyticsListener = 'true';
      document.addEventListener('click', (event) => {
        const target = event.target.closest('a,button');
        if (!target || typeof window.gtag !== 'function') return;
        const cta = target.matches('.pill,.hero-offer,.hero-whatsapp,.nav-offer,.nav-wa,[data-cms-cta]');
        if (!cta) return;
        window.gtag('event', 'cta_click', { page_path: location.pathname, cta_id: target.dataset.cmsCta || target.className || target.getAttribute('aria-label') || 'cta' });
      }, { passive: true });
    }
  }

  function makeOverlay(binding, mapping, field) {
    if (!mapping.overlay) return;
    const bindingPrefix = String(binding || '').split('.')[0];
    const heroFields = fieldMap(findPage(currentRenderedContent, currentPagePath()));
    const heroImageField = heroFields.get(`${bindingPrefix}.hero.image`);
    const entityPhotoChanged = Boolean((/\.hero\.(?:title|description|eyebrow)$/.test(binding) || mapping.overlay.forceWhenHeroPhotoReplaced === true)
      && heroImageField && !defaultMatches(heroImageField));
    const heroPhotoReplaced = Boolean(heroImageField && !defaultMatches(heroImageField));
    const sourceTextNeedsOverlay = heroPhotoReplaced && (/\.(?:hero\.(?:title|description|eyebrow)|header\.offerLabel)$/.test(binding) || mapping.overlay.forceWhenHeroPhotoReplaced === true);
    if (defaultMatches(field) && !sourceTextNeedsOverlay) {
      activeOverlays.delete(binding);
      overlayLayer?.querySelector(`[data-cms-group="${CSS.escape(binding)}"]`)?.remove();
      return;
    }
    activeOverlays.set(binding, { mapping, field });
    const spec = mapping.overlay;
    let group = overlayLayer.querySelector(`[data-cms-group="${CSS.escape(binding)}"]`);
    if (!group) {
      group = document.createElement('div');
      group.className = 'cms-live-group';
      group.dataset.cmsGroup = binding;
      const patch = document.createElement('span');
      patch.className = 'cms-live-patch';
      patch.setAttribute('aria-hidden', 'true');
      group.append(patch);
      const node = document.createElement(spec.tag || 'div');
      node.className = 'cms-live-overlay';
      node.dataset.cmsOverlay = binding;
      node.setAttribute('aria-hidden', 'true');
      group.append(node);
      overlayLayer.append(group);
    }
    const anchors = (spec.reference?.length
      ? spec.reference.flatMap((selector) => [...document.querySelectorAll(selector)])
      : spec.copyId ? [...document.querySelectorAll(`[data-copy-id=\"${CSS.escape(spec.copyId)}\"]`)] : []);
    const boundsForAnchor = (element) => {
      const live = element.getBoundingClientRect();
      if (live.width > 0 && live.height > 0) {
        // Source copy can be measured while an entry animation still has a
        // translate transform. Remove the current transform displacement so
        // the CMS overlay stays on the authored source box after the motion.
        let dx = 0, dy = 0;
        for (let current = element; current && current !== overlayLayer; current = current.parentElement) {
          const transform = getComputedStyle(current).transform;
          if (!transform || transform === 'none') continue;
          try { const matrix = new DOMMatrixReadOnly(transform); dx += matrix.m41; dy += matrix.m42; } catch { /* non-matrix transform */ }
        }
        return { left: live.left - dx, top: live.top - dy, right: live.right - dx, bottom: live.bottom - dy, width: live.width, height: live.height };
      }
      // Reduced-motion styles may set an original artwork anchor to
      // display:none. Its inline source percentages still define the exact
      // canvas rectangle needed to position the CMS replacement copy.
      const canvas = element.closest('.canvas') || document.querySelector('.canvas');
      const base = canvas?.getBoundingClientRect();
      if (!base?.width || !base?.height) return null;
      const dimension = (value, basis) => {
        const raw = String(value || '').trim();
        if (raw.endsWith('%')) return basis * parseFloat(raw) / 100;
        if (raw.endsWith('px')) return parseFloat(raw);
        return 0;
      };
      const style = element.style;
      const left = dimension(style.left, base.width);
      const top = dimension(style.top, base.height);
      const width = dimension(style.width, base.width);
      const height = dimension(style.height, base.height);
      if (!(width > 0 && height > 0)) return null;
      return { left: base.left + left, top: base.top + top, right: base.left + left + width, bottom: base.top + top + height, width, height };
    };
    const positionedAnchors = anchors.map((element) => ({ element, bounds: boundsForAnchor(element) })).filter((entry) => entry.bounds);
    const visibleAnchors = positionedAnchors.map((entry) => entry.element);
    if (visibleAnchors.length) {
      const rects = positionedAnchors.map(({ bounds }) => {
        const crop = spec.referenceRect;
        return crop ? {
          left: bounds.left + bounds.width * crop.left,
          top: bounds.top + bounds.height * crop.top,
          right: bounds.left + bounds.width * (crop.left + crop.width),
          bottom: bounds.top + bounds.height * (crop.top + crop.height)
        } : bounds;
      });
      const left = Math.min(...rects.map((rect) => rect.left));
      const top = Math.min(...rects.map((rect) => rect.top));
      const right = Math.max(...rects.map((rect) => rect.right));
      const bottom = Math.max(...rects.map((rect) => rect.bottom));
      const host = document.querySelector(spec.hostSelector || 'section') || visibleAnchors[0].closest('section') || document.body;
      const layerBounds = overlayLayer.getBoundingClientRect();
      group.style.left = `${left - layerBounds.left}px`;
      group.style.top = `${top - layerBounds.top}px`;
      group.style.width = `${right - left}px`;
      group.style.height = `${bottom - top}px`;
      const patch = group.querySelector('.cms-live-patch');
      const node = group.querySelector('.cms-live-overlay');
      patch.style.display = entityPhotoChanged ? 'none' : '';
      if (entityPhotoChanged) patch.style.backgroundImage = 'none';
      patch.style.inset = '0';
      patch.style.width = '100%';
      patch.style.height = '100%';
      const source = host.querySelector(spec.sourceSelector || 'img');
      if (!entityPhotoChanged && patch && !patch.dataset.ready && !patch.dataset.loading) {
        const clean = spec.patchSelector && anchors[0] ? anchors[0].querySelector(spec.patchSelector) : null;
        if (clean instanceof HTMLImageElement) {
          const setClean = () => {
            patch.style.backgroundImage = `url("${clean.currentSrc || clean.src}")`;
            patch.style.backgroundSize = '100% 100%';
            patch.dataset.ready = 'true';
          };
          if (clean.complete && clean.naturalWidth) setClean();
          else {
            patch.dataset.loading = 'true';
            clean.addEventListener('load', () => { setClean(); delete patch.dataset.loading; }, { once: true });
          }
        } else if (spec.patchAsset) {
          patch.dataset.loading = 'true';
          const cleanPatch = new Image();
          cleanPatch.onload = () => {
            patch.style.backgroundImage = `url("${cleanPatch.src}")`;
            patch.dataset.ready = 'true';
            delete patch.dataset.loading;
          };
          cleanPatch.onerror = () => { delete patch.dataset.loading; };
          cleanPatch.src = new URL(spec.patchAsset, assetsUrl).href;
        } else if (source?.complete && source.naturalWidth) {
          const sourceRect = source.getBoundingClientRect();
          const crop = {
            left: Math.max(0, (left - sourceRect.left) / sourceRect.width),
            top: Math.max(0, (top - sourceRect.top) / sourceRect.height),
            width: Math.min(1, (right - left) / sourceRect.width),
            height: Math.min(1, (bottom - top) / sourceRect.height)
          };
          const patchUrl = makeBackgroundPatch(source, crop);
          if (patchUrl) { patch.style.backgroundImage = `url("${patchUrl}")`; patch.dataset.ready = 'true'; }
        }
      }
      node.style.left = '0'; node.style.top = '0'; node.style.width = '100%'; node.style.height = '100%';
      let fontSize = spec.fontSize || '1rem';
      if (/^\d+(?:\.\d+)?px$/.test(fontSize)) {
        const sourceCanvas = document.querySelector('.canvas') || document.querySelector('.desktop-source-art');
        const canvasWidth = sourceCanvas?.getBoundingClientRect().width || window.innerWidth;
        const sourceWidth = currentTemplatePath() === '/' ? 809 : 1024;
        fontSize = `${parseFloat(fontSize) * canvasWidth / sourceWidth}px`;
      }
      node.style.setProperty('--cms-font-size', fontSize);
      node.style.setProperty('--cms-color', spec.color || 'inherit');
      node.style.setProperty('--cms-align', spec.align || 'left');
      node.style.setProperty('--cms-line-height', spec.lineHeight || '1.2');
      const headingField = /(?:^|\.)(?:title|heading|name)$/.test(binding);
      const typographyFont = headingField
        ? getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim()
        : getComputedStyle(document.documentElement).getPropertyValue('--font-body').trim();
      node.style.setProperty('--cms-font-family', spec.font || typographyFont || 'inherit');
      // Fit against the final font metrics; a transition would return an
      // intermediate font size and leave long replacement lines clipped.
      node.style.transition = 'none';
      node.style.whiteSpace = spec.whiteSpace || 'pre-line';
      if (spec.background) node.style.background = spec.background;
      if (spec.border) { node.style.border = spec.border; node.style.boxSizing = 'border-box'; }
      if (spec.radius) node.style.borderRadius = spec.radius;
      if (spec.display) node.style.display = spec.display;
      if (spec.alignItems) node.style.alignItems = spec.alignItems;
      if (spec.justifyContent) node.style.justifyContent = spec.justifyContent;
      if (spec.fontWeight) node.style.fontWeight = spec.fontWeight;
      if (spec.padding) node.style.padding = spec.padding;
      setText(node, field.value);
      if (spec.trailingArrow) node.textContent = `${String(field.value ?? '')}  →`;
      if (field.type === 'text' || field.type === 'textarea') {
        let fontSize = parseFloat(getComputedStyle(node).fontSize);
        const fitCanvas = document.querySelector('.canvas') || document.querySelector('.desktop-source-art');
        const fitScale = (fitCanvas?.getBoundingClientRect().width || window.innerWidth) / (currentTemplatePath() === '/' ? 809 : 1024);
        const minimum = Math.max(12, Number(spec.minFontSize) ? Number(spec.minFontSize) * fitScale : (spec.maxLines ? 12 : fontSize * .65));
        const maxLines = Number(spec.maxLines) || Math.max(1, Math.floor((node.clientHeight + 1) / Math.max(1, fontSize * (parseFloat(spec.lineHeight || '1.2') || 1.2))));
        const lineCount = () => {
          const range = document.createRange(); range.selectNodeContents(node);
          return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
        };
        while ((node.scrollHeight > node.clientHeight + 1 || lineCount() > maxLines) && fontSize > minimum) {
          fontSize *= .96;
          node.style.setProperty('--cms-font-size', `${fontSize}px`);
        }
      }
      return;
    }

    const patch = group.querySelector('.cms-live-patch');
    const node = group.querySelector('.cms-live-overlay');
    group.style.left = `${spec.left}%`;
    group.style.top = `${spec.top}%`;
    group.style.width = `${spec.width}%`;
    group.style.height = `${spec.height}%`;
    [patch, node].forEach((element) => {
      element.style.left = '0';
      element.style.top = '0';
      element.style.width = '100%';
      element.style.height = '100%';
    });
    if (spec.source && spec.sourceRect && !patch.dataset.ready) {
      const image = new Image();
      image.onload = () => {
        const patchUrl = makeBackgroundPatch(image, spec.sourceRect);
        if (patchUrl) {
          patch.style.backgroundImage = `url("${patchUrl}")`;
          patch.dataset.ready = 'true';
        }
      };
      image.src = new URL(spec.source, assetsUrl).href;
    }
    node.style.setProperty('--cms-font-size', spec.fontSize || '1rem');
    node.style.setProperty('--cms-color', spec.color || 'inherit');
    node.style.setProperty('--cms-align', spec.align || 'left');
    node.style.setProperty('--cms-line-height', spec.lineHeight || '1.2');
    node.style.setProperty('--cms-font-family', spec.font || 'inherit');
    node.style.whiteSpace = spec.whiteSpace || 'pre-line';
    setText(node, field.value);
  }

  function applyContent(envelope, source = 'published') {
    const content = envelope?.content || envelope;
    if (!content || !Array.isArray(content.pages)) return false;
    const revision = Number(envelope?.revision ?? content.revision ?? 0);
    if (currentContent && source === appliedContentSource && revision < currentRevision) return false;
    const incomingFingerprint = JSON.stringify(content);
    if (currentContent && source === appliedContentSource && revision === currentRevision && incomingFingerprint === appliedContentFingerprint) return true;
    const applied = () => {
      appliedContentFingerprint = incomingFingerprint;
      appliedContentSource = source;
      return true;
    };
    currentContent = content;
    currentRevision = revision;
    document.documentElement.dataset.cmsRevision = String(revision);
    const path = currentPagePath();
    const page = findPage(content, path);
    const pageConfig = pageConfigFor(path);
    currentRenderedContent = contentWithDetailEntityFields(content, page, pageConfig, path);
    window.dispatchEvent(new CustomEvent('fora:cms-content', { detail: { content: currentRenderedContent, revision } }));
    const settings = content.settings || {};
    applyMotionSettings(settings);
    applyTypography(settings);
    if (settings.brand?.favicon) applyFavicon(settings.brand.favicon);
    if (!page) return applied();
    const renderPage = findPage(currentRenderedContent, path) || page;
    applyDetailEntityContext(renderPage);
    if (path === '/') {
      const heroSection = page.sections?.find(section => (section.sourceSectionId || section.id) === 'hero');
      document.documentElement.dataset.cmsHomeHeroSourceDefault = String(!heroSection || (heroSection.fields || []).every(defaultMatches));
    }
    applySeo(renderPage, content.settings || {});
    if (!pageConfig) return applied();
    const fields = fieldMap(renderPage);
    const entityHeroImageChanged = pageConfig.fields?.some((mapping) => /\.hero\.image$/.test(mapping.binding)
      && fields.get(mapping.binding)?.cmsEntityDerived === true) || false;
    const heroImageField = pageConfig.fields?.map((mapping) => fields.get(mapping.binding))
      .find((field) => field && /\.hero\.image$/.test(field.binding || ''));
    const heroPhotoReplaced = Boolean(heroImageField && !defaultMatches(heroImageField));
    document.documentElement.dataset.cmsHeroPhotoReplaced = String(heroPhotoReplaced);
    pageConfig.fields?.forEach((mapping) => {
      if (!mapping.heroPhotoOverlayBase || !mapping.heroPhotoOverlaySpecial) return;
      mapping.overlay = heroPhotoReplaced
        ? { ...mapping.heroPhotoOverlayBase, ...mapping.heroPhotoOverlaySpecial }
        : { ...mapping.heroPhotoOverlayBase };
    });
    if (path === '/filo/eylul/') {
      document.querySelectorAll('img.hero-edge').forEach((image) => {
        if (!image.dataset.cmsHeroEdgeOriginalSrc) {
          image.dataset.cmsHeroEdgeOriginalSrc = new URL(image.getAttribute('src') || '', location.href).href;
        }
        const nextSrc = heroPhotoReplaced
          ? safeImage('filo/eylul/assets/hero-edge-cms-clean.png')
          : image.dataset.cmsHeroEdgeOriginalSrc;
        if (nextSrc && image.src !== nextSrc) image.src = nextSrc;
      });
    }
    pageConfig.fields?.forEach((mapping) => {
      const field = fields.get(mapping.binding);
      if (!field) return;
      const entityHeroImage = field.cmsEntityDerived === true && /\.hero\.image$/.test(mapping.binding);
      const selectors = entityHeroImage ? ['img.hero-art'] : mapping.selectors;
      const targets = selectors?.flatMap((selector) => {
        if (mapping.all === true || entityHeroImage) return [...document.querySelectorAll(selector)];
        const first = document.querySelector(selector);
        return first ? [first] : [];
      }) || [];
      const uniqueTargets = [...new Set(targets)];
      uniqueTargets.forEach((target) => {
        if (mapping.overlay && ['text','textarea'].includes(field.type) && target instanceof HTMLAnchorElement) {
          target.setAttribute('aria-label', String(field.value ?? ''));
          if (/\.header\.(?:offerLabel|whatsappLabel)$/.test(mapping.binding)) {
            // Header labels are baked into the source art. Keep the hit target accessible without painting duplicate text.
            target.textContent = '';
            return;
          }
        }
        // Keep semantic text synchronized when its visible counterpart is
        // drawn as a source-art overlay.
        setValue(target, field);
      });
      const replaceHeroSourceCopy = heroPhotoReplaced && (/\.(?:hero\.(?:title|description|eyebrow)|header\.offerLabel)$/.test(mapping.binding) || mapping.overlay?.forceWhenHeroPhotoReplaced === true);
      if (mapping.overlay?.copyId) {
        const sourceCopy = document.querySelector(`[data-copy-id="${CSS.escape(mapping.overlay.copyId)}"]`);
        const replaceSourceCopy = replaceHeroSourceCopy || !defaultMatches(field);
        if (sourceCopy) sourceCopy.style.setProperty('visibility', replaceSourceCopy ? 'hidden' : '', replaceSourceCopy ? 'important' : '');
      }
      mapping.hideSelectors?.forEach((selector) => document.querySelectorAll(selector).forEach((element) => {
        element.style.visibility = defaultMatches(field) && !replaceHeroSourceCopy ? '' : 'hidden';
      }));
      makeOverlay(mapping.binding, mapping, field);
    });

    if (heroPhotoReplaced) {
      (pageConfig.motionStaticLayers || []).forEach((layer) => {
        const id = `eylul.__source-copy.${layer.id}`;
        const selector = `[data-copy-id="${CSS.escape(layer.id)}"]`;
        document.querySelectorAll(`${selector} .copy-clean,${selector} .copy-glyph`).forEach((element) => { element.style.visibility = 'hidden'; });
        const dims = layer.sourceDimensions || [1024,1536];
        const rect = layer.canvasRect || (layer.sourceBBox && {
          left: layer.sourceBBox[0]/dims[0], top: layer.sourceBBox[1]/dims[1],
          width:(layer.sourceBBox[2]-layer.sourceBBox[0])/dims[0], height:(layer.sourceBBox[3]-layer.sourceBBox[1])/dims[1]
        });
        if (!rect) return;
        const mapping = { overlay: { reference:['.canvas'], hostSelector:'.canvas', referenceRect:rect,
          forceWhenHeroPhotoReplaced:true, font:'var(--font-script, Caveat, cursive)',
          fontSize:'24px', lineHeight:'1.05', maxLines:5, color:layer.ink==='light'?'#f7f2e8':'#17384a',
          whiteSpace:'pre-line', align:'center' }};
        makeOverlay(id, mapping, {value:layer.sourceText,defaultValue:layer.sourceText,type:'textarea'});
      });
    } else {
      (pageConfig.motionStaticLayers || []).forEach((layer) => {
        const selector = `[data-copy-id="${CSS.escape(layer.id)}"]`;
        document.querySelectorAll(`${selector} .copy-clean,${selector} .copy-glyph`).forEach((element) => { element.style.visibility = ''; });
        const id = `eylul.__source-copy.${layer.id}`;
        overlayLayer?.querySelector(`[data-cms-group="${CSS.escape(id)}"]`)?.remove();
        activeOverlays.delete(id);
      });
    }

    document.querySelectorAll('[data-cms-binding]').forEach((target) => {
      const field = fields.get(target.dataset.cmsBinding);
      if (field) setValue(target, field);
    });
    const sectionRenderer = window.ForaDesktopSections;
    const customSections = !document.documentElement.classList.contains('fora-device-active')
      && sectionRenderer?.apply({ content, page, path, pageConfig, baselineContent });
    if (!customSections) applySectionOrder(content, path, pageConfig);
    applyMenus(content.menus);
    document.querySelectorAll('[data-cms-setting]').forEach((target) => {
      const key = target.dataset.cmsSetting.split('.').reduce((value, part) => value?.[part], settings);
      if (typeof key === 'string') {
        if (target instanceof HTMLImageElement) target.src = safeImage(key) || target.src;
        else if (target instanceof HTMLAnchorElement) target.href = safeHref(key) || target.href;
        else setText(target, key);
      }
    });
    const brand = settings.brand || {};
    const resolveBrandImage = (value) => typeof value === 'string' && !/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(value) ? new URL(value, assetsUrl).href : safeImage(value);
    const headerLogo = resolveBrandImage(brand.headerLogo);
    const footerLogo = resolveBrandImage(brand.footerLogo || brand.headerLogo);
    const creditLogo = resolveBrandImage(brand.creditLogo);
    const creditUrl = safeHref(brand.creditUrl);
    if (headerLogo) document.querySelectorAll('.cms-header-image img').forEach((img) => { img.src = headerLogo; });
    if (footerLogo) document.querySelectorAll('.cms-footer-image img').forEach((img) => { img.src = footerLogo; });
    if (creditLogo) document.querySelectorAll('.cms-brand-signature img').forEach((img) => { img.src = creditLogo; });
    if (creditUrl) document.querySelectorAll('.cms-brand-signature').forEach((link) => { link.href = creditUrl; });
    const whatsapp = safeHref(settings.contact?.whatsapp) || 'https://wa.me/905496523538';
    document.querySelectorAll('a[href*="wa.me"],a[data-cms-whatsapp]').forEach((link) => {
      link.dataset.cmsWhatsapp = 'true';
      link.href = whatsapp;
    });
    renderCollections(content, pageConfig);
    // A couple of legacy detail hotspots still carry page-relative art paths
    // copied from the list template. Resolve those against their real source
    // folder so lazy artwork does not request /filo/<slug>/assets/art-card-N.
    if (path === '/filo/eylul/') {
      document.querySelectorAll('.mobile-related img[src*="art-card-"]').forEach((image) => {
        const match = (image.getAttribute('src') || '').match(/art-card-(\d+)\.png/i);
        if (match) image.src = safeImage(`filo/assets/art-card-${match[1]}.png`) || image.src;
      });
      document.querySelectorAll('.canvas .art-card[data-art-index]').forEach((card) => {
        const index = card.dataset.artIndex;
        if (/^\d+$/.test(index || '')) card.style.setProperty('--art-src', `url("${safeImage(`filo/assets/art-card-${index}.png`)}")`);
      });
    }
    return applied();
  }

  function applySectionOrder(content, path, pageConfig) {
    const livePage = findPage(content, path);
    const basePage = findPage(baselineContent, pageConfig?.templatePath || currentTemplatePath() || path);
    if (!livePage || !basePage) return;
    const liveOrder = (livePage.sections || []).map((section) => section.id);
    const baseOrder = (basePage.sections || []).map((section) => section.id);
    const signature = JSON.stringify([path, liveOrder]);
    if (signature === appliedSectionSignature) return;
    if (appliedSectionState) {
      appliedSectionState.elements.forEach((element) => element.style.removeProperty('translate'));
      if (appliedSectionState.main && appliedSectionState.children.every((element) => element.parentElement === appliedSectionState.main)) {
        appliedSectionState.children.forEach((element) => appliedSectionState.main.append(element));
      }
      appliedSectionState = null;
      appliedSectionSignature = '';
    }
    if (JSON.stringify(liveOrder) === JSON.stringify(baseOrder)) return;
    const baseSet = new Set(baseOrder);
    // New/deleted section schemas need a supplied visual template; only reorder
    // known source bands so a draft cannot silently invent default artwork.
    if (liveOrder.some((id) => !baseSet.has(id)) || baseOrder.some((id) => !liveOrder.includes(id))) return;
    const layoutPath = pageConfig?.templatePath || currentTemplatePath() || path;
    const pageName = layoutPath === '/' ? 'home' : layoutPath.replace(/^\//,'').replace(/\/$/,'').replaceAll('/','-');
    const artSectionLayouts = {
      deneyimler: { visual:['hero','content','video','plan','footer'], aliases:{experiences:'content'} },
      hakkimizda: { visual:['hero','content','values','together','footer'], aliases:{story:'content'} },
      iletisim: { visual:['hero','content','cta','footer'], aliases:{inquiry:'content',form:'content'} }
    };
    const artLayout = artSectionLayouts[pageName];
    if (artLayout) {
      const main = document.querySelector('main');
      const children = main ? [...main.children] : [];
      const visuals = [...(main?.querySelectorAll(':scope > .art-section') || [])];
      const actualIds = visuals.map((element) => artLayout.visual.find((id) => element.classList.contains(id)) || '');
      if (main && visuals.length === artLayout.visual.length && actualIds.every(Boolean)) {
        const requested = liveOrder.map((id) => artLayout.aliases[id] || id).filter((id) => artLayout.visual.includes(id));
        const deduped = [...new Set(requested)];
        if (deduped.length === visuals.length) {
          const targetElements = deduped.map((id) => visuals[actualIds.indexOf(id)]);
          targetElements.forEach((element) => main.append(element));
          appliedSectionState = { elements: [], main, children };
          appliedSectionSignature = signature;
          return;
        }
      }
    }
    if (pageName === 'home') {
      const starts = { hero:0, story:443, routes:680, fleet:1040, offer:1260, benefits:1480, reviews:1600, footer:1765 };
      const heights = { hero:443, story:237, routes:360, fleet:220, offer:220, benefits:120, reviews:165, footer:177 };
      const ids = ['hero','story','routes','fleet','offer','benefits','reviews','footer'];
      const contentIds = liveOrder.filter((id) => ids.includes(id));
      if (contentIds.length !== ids.length) return;
      const scale = document.body.clientWidth / 809;
      let cursor = 0; const deltas = new Map();
      contentIds.forEach((id) => { deltas.set(id, (cursor - starts[id]) * scale); cursor += heights[id]; });
      const groups = {
        hero: ['.hero'], story: ['.home-art-story-','.hotspot-story-'], routes: ['.home-art-route-','.home-art-routes-','.home-art-route-map','.home-art-phone','.hotspot-routes-','.hotspot-route-'],
        fleet: ['.home-art-fleet-','.hotspot-fleet-'], offer: ['.home-art-offer-','.hotspot-offer-'], benefits: ['.home-art-benefits-'], reviews: ['.home-art-review-','.home-art-reviews-','.hotspot-review-'], footer: ['.home-art-footer-']
      };
      const backgroundBySection = {story:2,routes:3,fleet:4,offer:5,benefits:6,reviews:7,footer:8};
      const applyShift = (element, delta) => { element.style.translate = `0 ${delta}px`; };
      const shifted = [];
      for (const [id, selectors] of Object.entries(groups)) {
        const delta = deltas.get(id) || 0;
        selectors.forEach((selector) => document.querySelectorAll(selector).forEach((element) => {
          if (element.matches('.hero')) return;
          applyShift(element, delta); shifted.push(element);
        }));
        const index = backgroundBySection[id];
        const background = document.querySelector(`.desktop-source-art img:nth-child(${index})`);
        if (background) { applyShift(background, delta); shifted.push(background); }
      }
      const main = document.querySelector('main');
      const children = main ? [...main.children] : [];
      if (main) {
        const sectionById = new Map(ids.map((id) => [id, main.querySelector(`.${id === 'hero' ? 'hero' : id}`)]));
        for (const id of contentIds) { const element = sectionById.get(id); if (element?.parentElement === main) main.append(element); }
      }
      appliedSectionState = { elements: [...new Set(shifted)], main, children };
      appliedSectionSignature = signature;
      requestAnimationFrame(() => { window.dispatchEvent(new Event('resize')); updateOverlayPositions(); });
      return;
    }

    const canvas = document.querySelector('.canvas');
    if (!canvas) return;
    const pageIds = new Set(liveOrder);
    const backgrounds = [];
    [...canvas.querySelectorAll('img.art')].filter((image) => !image.classList.contains('hero-edge')).forEach((image) => {
      const filename = (image.getAttribute('src') || '').split('/').at(-1).replace(/\.png$/,'').toLowerCase();
      let id = filename === 'hero-motion' ? 'hero' : filename === 'footer' ? 'footer' : filename;
      const aliases = {catalog:'content',fleet:'content',story:'content','other-boats':'gallery','gallery-offer':'gallery',experiences:pageIds.has('stops')?'stops':'content',cta:pageIds.has('planning')?'planning':pageIds.has('cta')?'cta':'quote'};
      id = aliases[id] || id;
      if (!pageIds.has(id)) {
        if (filename === 'quote' && pageIds.has('quote')) id = 'quote';
        else if (filename === 'stops' && pageIds.has('stops')) id = 'stops';
        else id = liveOrder.find((candidate) => !['header','footer'].includes(candidate) && !backgrounds.some((entry) => entry.id === candidate)) || id;
      }
      const box = image.getBoundingClientRect(); const canvasBox = canvas.getBoundingClientRect();
      backgrounds.push({ image, id, start: box.top - canvasBox.top + window.scrollY, top: box.top - canvasBox.top, height: box.height });
    });
    backgrounds.sort((a,b) => a.top - b.top);
    if (!backgrounds.length) return;
    const sectionIds = [...new Set(backgrounds.map((band) => band.id))];
    const orderedIds = liveOrder.filter((id) => sectionIds.includes(id));
    if (orderedIds.length !== sectionIds.length || JSON.stringify(sectionIds) === JSON.stringify(orderedIds)) return;
    const starts = new Map(sectionIds.map((id) => [id, Math.min(...backgrounds.filter((band) => band.id === id).map((band) => band.top))]));
    const sortedBands = [...sectionIds].sort((a,b) => starts.get(a) - starts.get(b));
    const heights = new Map(sortedBands.map((id,index) => [id, (starts.get(sortedBands[index+1]) ?? canvas.clientHeight) - starts.get(id)]));
    let cursor = starts.get(sortedBands[0]); const deltaById = new Map();
    orderedIds.forEach((id) => { deltaById.set(id, cursor - starts.get(id)); cursor += heights.get(id) || 0; });
    const shift = (element, delta) => { element.style.translate = `0 ${delta}px`; };
    backgrounds.forEach((band) => shift(band.image, deltaById.get(band.id) || 0));
    const canvasTop = canvas.getBoundingClientRect().top;
    [...canvas.children].filter((element) => !element.matches('img.art:not(.hero-edge)')).forEach((element) => {
      const rect = element.getBoundingClientRect(); const center = rect.top - canvasTop + rect.height / 2;
      const band = [...backgrounds].filter((candidate) => center >= candidate.top).sort((a,b) => b.top - a.top)[0] || backgrounds[0];
      shift(element, deltaById.get(band.id) || 0);
    });
    appliedSectionState = { elements: [...canvas.children] };
    appliedSectionSignature = signature;
    requestAnimationFrame(() => { window.dispatchEvent(new Event('resize')); updateOverlayPositions(); });
  }

  function renderArtworkSlotCollection(content, spec, layout) {
    const root = document.querySelector(layout.section?.selector || '.canvas');
    if (!root) return;
    const rootRect = root.getBoundingClientRect();
    const sourceW = Number(layout.sourceDimensions?.[0] || 1024);
    const sourceH = Number(layout.sourceDimensions?.[1] || 1536);
    if (!rootRect.width || !rootRect.height) return;
    const sx = rootRect.width / sourceW, sy = rootRect.height / sourceH;
    if(!document.getElementById('cms-artwork-slot-style')){const style=document.createElement('style');style.id='cms-artwork-slot-style';style.textContent='.art-card.cms-art-artwork-active::after{opacity:1!important;animation:none!important;transform:none!important}';document.head.append(style);}
    root.querySelectorAll('.cms-art-slot-overlay,.cms-art-slot-mask,.cms-art-slot-photo,.cms-art-shared-underlay').forEach((node) => node.remove());
    const sourceItems = Array.isArray(content[spec.key]) ? content[spec.key] : [];
    const originalItems = Array.isArray(baselineContent?.[spec.key]) ? baselineContent[spec.key] : [];
    const eligible = sourceItems.filter((item) => String(item.status || 'published').toLowerCase() === 'published' && item.isActive !== false)
      .slice().sort((a,b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
    const slots = (layout.slots || []).slice().sort((a,b) => Number(a.defaultEntity?.sortOrder || a.order || 0) - Number(b.defaultEntity?.sortOrder || b.order || 0));
    const sourceSlotByEntity=new Map(slots.map((slot)=>[String(slot.entityId||slot.defaultEntity?.id||''),slot]));
    const assetFor = (value) => {
      if (!value) return '';
      if (/^(?:https?:|data:|blob:|\/media\/)/i.test(value)) return safeImage(value) || '';
      const pageBase = new URL(currentPagePath().replace(/^\/+/, ''), new URL(siteBase, location.href));
      return new URL(String(value).replace(/^\.?\//, ''), pageBase).href;
    };
    const box = (rect) => {
      if (!Array.isArray(rect) || rect.length < 4) return null;
      const [x0,y0,x1,y1] = rect.map(Number);
      return {left:x0*sx,top:y0*sy,width:Math.max(0,x1-x0)*sx,height:Math.max(0,y1-y0)*sy};
    };
    const localBox = (slot, rect, referenceSlot=slot) => {
      const card=box(slot.cardRect); if(!card||!Array.isArray(rect)||rect.length<4)return null;
      const [x0,y0,x1,y1]=rect.map(Number), dims=referenceSlot.sourceArtworkDimensions||referenceSlot.artworkDimensions||[Number(referenceSlot.cardRect?.[2])-Number(referenceSlot.cardRect?.[0]),Number(referenceSlot.cardRect?.[3])-Number(referenceSlot.cardRect?.[1])];
      const iw=Math.max(1,Number(dims[0])||1), ih=Math.max(1,Number(dims[1])||1);
      return {left:card.left+x0/iw*card.width,top:card.top+y0/ih*card.height,width:Math.max(0,x1-x0)/iw*card.width,height:Math.max(0,y1-y0)/ih*card.height};
    };
    const addImagePatch = (cls, path, rect, z=18) => {
      const r=rect&&typeof rect==='object'&&!Array.isArray(rect)?rect:box(rect); if(!r||!path)return null;
      const node=document.createElement('img'); node.className=cls;node.alt='';node.setAttribute('aria-hidden','true');node.src=assetFor(path);
      Object.assign(node.style,{position:'absolute',zIndex:String(z),pointerEvents:'none',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',maxWidth:'none',objectFit:'fill'});
      root.append(node); return node;
    };
    const addCardMask = (slot, index, z=6) => {
      const rect=slot.maskRect||slot.cardRect;const r=box(rect);if(!r)return;
      const mask=document.createElement('img');mask.className='cms-art-slot-mask';mask.alt='';mask.setAttribute('aria-hidden','true');
      if(slot.maskArtwork)mask.src=assetFor(slot.maskArtwork);
      Object.assign(mask.style,{position:'absolute',zIndex:String(z),pointerEvents:'none',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',maxWidth:'none',objectFit:'fill'});
      const polygon=slot.maskPolygon||slot.maskArtworkPolygon;
      if(Array.isArray(polygon)&&polygon.length>=3)mask.style.clipPath=`polygon(${polygon.map((p)=>`${Number(p[0])/Math.max(1,Number(rect[2])-Number(rect[0]))*100}% ${Number(p[1])/Math.max(1,Number(rect[3])-Number(rect[1]))*100}%`).join(',')})`;
      mask.dataset.cmsArtSlot=slot.slotId||String(index);root.append(mask);
    };
    const changed = (item, original) => !original || ['name','title','description','image','artwork','path','sortOrder','status'].some((key)=>item[key]!==original[key]);
    const idKey = (value) => String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const originalIds = new Set(originalItems.map((item) => String(item.id)));
    const currentIds = new Set(sourceItems.map((item) => String(item.id)));
    const orderWasEdited = originalItems.some((item) => !currentIds.has(String(item.id)))
      || sourceItems.some((item) => !originalIds.has(String(item.id))
        || Number(originalItems.find((entry) => String(entry.id) === String(item.id))?.sortOrder || 0) !== Number(item.sortOrder || 0));
    const conditionalUnderlays=(layout.conditionalUnderlays||[]).filter((underlay)=>{
      const missing=new Set(underlay.whenAnyMissing||[]);
      return missing.size>0&&slots.some((slot)=>missing.has(String(slot.slotId||''))&&!eligible.some((item)=>String(item.id)===String(slot.entityId||slot.defaultEntity?.id||'')));
    });
    const underlayCoveredSlots=new Set(conditionalUnderlays.flatMap((underlay)=>underlay.coversSlots||underlay.whenAnyMissing||[]).map(String));
    conditionalUnderlays.forEach((underlay)=>{
      const rect=box(underlay.rect);if(!rect||!underlay.path)return;
      const image=document.createElement('img');image.className='cms-art-shared-underlay';image.alt='';image.setAttribute('aria-hidden','true');image.dataset.cmsArtUnderlay=underlay.id||'';image.src=assetFor(underlay.path);
      Object.assign(image.style,{position:'absolute',zIndex:String(Number.isFinite(Number(underlay.zIndex))?Number(underlay.zIndex):4),pointerEvents:'none',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',maxWidth:'none',objectFit:'fill'});
      root.append(image);
    });
    slots.forEach((slot,index)=>{
      const anchor=root.querySelector(slot.selector||`.art-card[data-art-index="${index+1}"]`);
      const artNode=root.querySelector(slot.artworkSelector||slot.selector||`.art-card[data-art-index="${index+1}"]`);
      if(!anchor||!artNode)return;
      anchor.classList.remove('cms-art-artwork-active');
      if(!anchor.dataset.cmsArtworkHref)anchor.dataset.cmsArtworkHref=anchor.getAttribute('href')||'';
      if(!artNode.dataset.cmsArtworkSource)artNode.dataset.cmsArtworkSource=artNode.style.getPropertyValue('--art-src')||getComputedStyle(artNode,'::after').backgroundImage||'';
      if(!anchor.dataset.cmsArtworkStyle)anchor.dataset.cmsArtworkStyle=anchor.getAttribute('style')||'';
      const item=orderWasEdited ? (eligible[index]||null) : (eligible.find((entry)=>String(entry.id)===String(slot.entityId))||null);
      const sourceId=String(slot.entityId||slot.defaultEntity?.id||'');
      const moved=!!item&&(orderWasEdited||String(item.id)!==sourceId);
      const original=originalItems.find((entry)=>String(entry.id)===String(item?.id))||slot.defaultEntity||null;
      const artSlot=item?sourceSlotByEntity.get(String(item.id))||slot:slot;
      const isChanged=!!item&&changed(item,original);
      if(!item){
        anchor.style.setProperty('visibility','hidden','important');anchor.style.setProperty('pointer-events','none');
        if(!underlayCoveredSlots.has(String(slot.slotId||''))&&(slot.maskArtwork||slot.maskRect))addCardMask(slot,index);
        return;
      }
      anchor.style.removeProperty('visibility');anchor.style.removeProperty('pointer-events');
      const needsArtwork=moved||isChanged;
      if(!needsArtwork){
        if(anchor.dataset.cmsArtworkStyle)anchor.setAttribute('style',anchor.dataset.cmsArtworkStyle);
        anchor.href=anchor.dataset.cmsArtworkHref;
        return;
      }
      // The source section raster still contains the original card underneath
      // the interactive hotspot. Clear its exact tilted footprint, then reveal
      // the replacement artwork in the foreground pseudo-element.
      if(!underlayCoveredSlots.has(String(slot.slotId||'')))addCardMask(slot,index,4);
      anchor.classList.add('cms-art-artwork-active');
      const artwork=String(item.artwork||slot.sourceArtwork||'');
      if(artwork){
        const resolved=(item.artwork&&safeImage(item.artwork))||assetFor(artwork);
        artNode.style.setProperty('--art-src',`url(${JSON.stringify(resolved)})`);
      }
      const r=box(slot.cardRect);
      if(r){Object.assign(anchor.style,{position:'absolute',left:(r.left/rootRect.width*100)+'%',top:(r.top/rootRect.height*100)+'%',width:(r.width/rootRect.width*100)+'%',height:(r.height/rootRect.height*100)+'%'});}
      const title=String(item.title||item.name||'');
      const originalTitle=String(original?.title||original?.name||'');
      if(title!==originalTitle){
        addImagePatch('cms-art-slot-overlay',artSlot.titleCleanPatch,localBox(slot,artSlot.titleRect,artSlot)||artSlot.titleRect,18);
        const tr=localBox(slot,artSlot.titleRect,artSlot)||box(artSlot.titleRect);
        if(tr){const text=document.createElement('span');text.className='cms-art-slot-overlay';text.textContent=title;const baseSize=Math.max(12,Math.min(22*sx,tr.height*.82));Object.assign(text.style,{position:'absolute',zIndex:'19',left:tr.left+'px',top:tr.top+'px',width:tr.width+'px',height:tr.height+'px',overflow:'hidden',display:'block',whiteSpace:'nowrap',pointerEvents:'none',color:artSlot.titleColor||'#102c4a',fontFamily:artSlot.titleFont||'var(--cms-heading-font,"Playfair Display",Georgia,serif)',fontSize:baseSize+'px',lineHeight:'1.08',fontWeight:'600'});root.append(text);const measured=text.scrollWidth;if(measured>tr.width&&measured>0)text.style.fontSize=Math.max(10,baseSize*tr.width/measured)+'px';}
      }
      if(String(item.description||'')!==String(original?.description||'')){
        addImagePatch('cms-art-slot-overlay',artSlot.descriptionCleanPatch,localBox(slot,artSlot.descriptionRect,artSlot)||artSlot.descriptionRect,18);
        const dr=localBox(slot,artSlot.descriptionRect,artSlot)||box(artSlot.descriptionRect);
        if(dr){const text=document.createElement('span');text.className='cms-art-slot-overlay';text.textContent=String(item.description||'');Object.assign(text.style,{position:'absolute',zIndex:'19',left:dr.left+'px',top:dr.top+'px',width:dr.width+'px',height:dr.height+'px',overflow:'hidden',pointerEvents:'none',whiteSpace:'pre-line',color:artSlot.descriptionColor||'#102c4a',fontFamily:artSlot.descriptionFont||'var(--cms-body-font,"Inter",Arial,sans-serif)',fontSize:Math.max(10,12*sx)+'px',lineHeight:'1.18'});root.append(text);}
      }
      if(String(item.image||'')!==String(original?.image||'')&&slot.photoViewportPolygon){
        const dims=artSlot.sourceArtworkDimensions||artSlot.artworkDimensions||[1,1];
        const card=box(slot.cardRect), photoRect=artSlot.photoRect||[0,0,Number(dims[0]),Number(dims[1])], pr=localBox(slot,photoRect,artSlot), src=safeImage(item.image);
        if(card&&pr&&src){const layer=document.createElement('span');layer.className='cms-art-slot-photo';layer.setAttribute('aria-hidden','true');const points=artSlot.photoViewportPolygon.map((p)=>`${Number(p[0])/Math.max(1,Number(dims[0]))*100}% ${Number(p[1])/Math.max(1,Number(dims[1]))*100}%`).join(',');Object.assign(layer.style,{position:'absolute',zIndex:'17',left:card.left+'px',top:card.top+'px',width:card.width+'px',height:card.height+'px',overflow:'hidden',pointerEvents:'none'});const photo=document.createElement('img');photo.src=src;photo.alt='';Object.assign(photo.style,{position:'absolute',left:(pr.left-card.left)+'px',top:(pr.top-card.top)+'px',width:pr.width+'px',height:pr.height+'px',maxWidth:'none',objectFit:'cover'});layer.append(photo);root.append(layer);if(artSlot.photoFrameOverlay)addImagePatch('cms-art-slot-overlay',artSlot.photoFrameOverlay,card,19);}
      }
      const listPath=spec.key==='routes'?'/rotalar/':'/filo/';
      const destination=item.homeUrl||item.inquiryUrl||(item.path&&item.path!==listPath?item.path:'')||anchor.dataset.cmsArtworkHref;
      if(destination)anchor.href=siteHref(destination)||safeHref(destination)||anchor.href;
      anchor.setAttribute('aria-label',`${title||'Kayıt'} için bilgi alın`);
    });
    const extras=eligible.slice(slots.length);
    root.parentElement?.querySelectorAll(`.cms-art-extra-collection[data-cms-collection="${CSS.escape(spec.key)}"]`).forEach((node)=>node.remove());
    if(extras.length){
      const extra=document.createElement('section');extra.className='cms-art-extra-collection';extra.dataset.cmsCollection=spec.key;extra.setAttribute('aria-label',spec.key==='routes'?'Ek rotalar':'Ek guletler');
      Object.assign(extra.style,{position:'relative',zIndex:'2',width:'min(100%,1440px)',margin:'0 auto',padding:'28px clamp(18px,4vw,56px)',display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:'20px',background:'#f7f3e9'});
      extras.forEach((item)=>{const card=document.createElement('a');card.href=siteHref(item.homeUrl||item.inquiryUrl||item.path)||'#';card.setAttribute('aria-label',`${item.title||item.name||'Kayıt'} için bilgi alın`);Object.assign(card.style,{display:'block',color:'#102c4a',textDecoration:'none',background:'#fffdf8',padding:'8px',boxShadow:'0 8px 24px #102c4a18'});const img=document.createElement('img');img.src=safeImage(item.image||item.artwork)||'';img.alt=item.title||item.name||'';Object.assign(img.style,{display:'block',width:'100%',aspectRatio:'1.45',objectFit:'cover'});const title=document.createElement('strong');title.textContent=item.title||item.name||'';Object.assign(title.style,{display:'block',padding:'10px 8px 4px',fontFamily:'Georgia,"Times New Roman",serif',fontSize:'18px'});card.append(img,title);if(item.description){const description=document.createElement('span');description.textContent=item.description;Object.assign(description.style,{display:'block',padding:'0 8px 10px',font:'13px/1.4 Inter,Arial,sans-serif'});card.append(description);}extra.append(card);});
      root.insertAdjacentElement('afterend',extra);
    }
  }

  const sourceSlotLayouts = new Map();
  function renderSourceSlotCollection(content, spec) {
    const pagePath = currentPagePath();
    let layout = sourceSlotLayouts.get(pagePath);
    if (!layout) {
      let pending = sourceSlotLayouts.get(pagePath + ':pending');
      if (!pending) {
        const configured = spec.layoutManifest || '/assets/experience-desktop-collections.json';
        const pageBase = new URL(currentPagePath().replace(/^\/+/, ''), new URL(siteBase, location.href));
        const layoutUrl = configured.startsWith('/') ? new URL(configured.replace(/^\/+/, ''), new URL(siteBase, location.href)) : new URL(configured, pageBase);
        pending = fetch(layoutUrl).then((response) => {
          if (!response.ok) throw new Error('Experience layout unavailable');
          return response.json();
        }).then((value) => {
          sourceSlotLayouts.set(pagePath, value);
          if (currentPagePath() === pagePath && currentContent) renderSourceSlotCollection(currentContent, spec);
          return value;
        }).catch(() => null);
        sourceSlotLayouts.set(pagePath + ':pending', pending);
      }
      return;
    }
    if (layout.collectionKey !== spec.key) return;
    if (layout.renderMode === 'source-art-slots' || layout.slots?.some((slot) => slot.artworkSelector)) {
      renderArtworkSlotCollection(content, spec, layout);
      return;
    }
    if (layout.renderMode !== 'source-slot-overlays') return;
    const root = document.querySelector(layout.section?.selector || '.art-section.experiences');
    if (!root) return;
    const sectionRect = root.getBoundingClientRect();
    if (!sectionRect.width || !sectionRect.height) return;
    const sourceBaseHeight = Number(root.dataset.cmsExperienceBaseHeight) || sectionRect.height;
    const sourceSection = layout.section?.sourceRect || [0, 0, layout.sourceDimensions?.[0] || 1024, 0];
    const sourceW = Number(layout.sourceDimensions?.[0] || 1024);
    const sectionSourceH = Math.max(1, Number(sourceSection[3]) - Number(sourceSection[1]));
    const sx = sectionRect.width / sourceW, sy = sourceBaseHeight / sectionSourceH;
    root.querySelectorAll('.cms-experience-slot-overlay,.cms-experience-extra-row,.cms-experience-card-mask,.cms-experience-photo-composite,.cms-experience-photo-frame,.cms-experience-shared-underlay').forEach((node) => node.remove());
    const sourceItems = Array.isArray(content[spec.key]) ? content[spec.key] : [];
    const originalItems = Array.isArray(baselineContent?.[spec.key]) ? baselineContent[spec.key] : [];
    const eligible = sourceItems.filter((item) => String(item.status || 'published').toLowerCase() === 'published' && item.isActive !== false)
      .slice().sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
    const slots = (layout.slots || []).slice().sort((a, b) => Number(a.defaultEntity?.sortOrder || 0) - Number(b.defaultEntity?.sortOrder || 0));
    const topSourceLayerOrder = Math.max(0, ...slots.map((slot) => Number(slot.sourceLayerOrder) || 0));
    const originalIds = new Set(originalItems.map((item) => String(item.id)));
    const currentIds = new Set(sourceItems.map((item) => String(item.id)));
    const orderWasEdited = originalItems.some((item) => !currentIds.has(String(item.id)))
      || sourceItems.some((item) => !originalIds.has(String(item.id))
        || Number(originalItems.find((entry) => String(entry.id) === String(item.id))?.sortOrder || 0) !== Number(item.sortOrder || 0));    const box = (rect, sectionRelative) => {
      const x0=Number(rect?.[0]||0), y0=Number(rect?.[1]||0), x1=Number(rect?.[2]||0), y1=Number(rect?.[3]||0);
      return {left:x0*sx,top:(sectionRelative?y0:y0-Number(sourceSection[1]))*sy,width:Math.max(0,x1-x0)*sx,height:Math.max(0,y1-y0)*sy};
    };
    const assetFor = (value) => {
      if (!value) return '';
      if (/^(?:https?:|data:|blob:|\/media\/)/i.test(value)) return safeImage(value) || '';
      const pageBase = new URL(currentPagePath().replace(/^\/+/, ''), new URL(siteBase, location.href));
      return new URL(String(value).replace(/^\.?\//, ''), pageBase).href;
    };
    const slotLayerZ = (slot, offset=0) => 10 + Math.max(1, Number(slot?.sourceLayerOrder) || 1) * 10 + offset;
    const addExperienceImagePatch = (path, rect, z=18, slot=null) => {
      if (!path || !Array.isArray(rect)) return null;
      const r=box(rect,false);
      const image=document.createElement('img');
      image.className='cms-experience-photo-composite';
      image.alt=''; image.setAttribute('aria-hidden','true');
      if (slot) image.dataset.cmsExperienceSlot=slot.slotId;
      const imageUrl=new URL(assetFor(path));
      imageUrl.searchParams.set('v','20261014-10');
      image.src=imageUrl.href;
      Object.assign(image.style,{position:'absolute',zIndex:String(z),pointerEvents:'none',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',maxWidth:'none',objectFit:'fill'});
      root.append(image);
      return image;
    };
    const eligibleIds = new Set(eligible.map((item) => String(item.id)));
    const conditionalUnderlays = (layout.conditionalUnderlays || []).filter((underlay) =>
      (underlay.whenAnyMissing || []).some((slotId) => {
        const slot = slots.find((entry) => String(entry.slotId) === String(slotId));
        return slot && !eligibleIds.has(String(slot.entityId));
      })
    );
    if (!root.dataset.cmsSourceIsolationSaved) {
      root.dataset.cmsSourceIsolationSaved = '1';
      root.dataset.cmsSourceIsolation = root.style.isolation || '';
    }
    root.style.isolation = conditionalUnderlays.length ? 'isolate' : root.dataset.cmsSourceIsolation;
    const underlayCoveredSlots = new Set(conditionalUnderlays.flatMap((underlay) => underlay.coversSlots || underlay.whenAnyMissing || []).map(String));
    conditionalUnderlays.forEach((underlay) => {
      const rect = box(underlay.rect, false);
      const image = document.createElement('img');
      image.className = 'cms-experience-shared-underlay';
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      image.dataset.cmsExperienceUnderlay = underlay.id || '';
      image.src = assetFor(underlay.path);
      Object.assign(image.style, {position:'absolute',zIndex:String(Math.max(Number(underlay.zIndex ?? 1),3)),pointerEvents:'none',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',maxWidth:'none',objectFit:'fill'});
      root.append(image);
    });
    const addCopy = (slot, type, value, cleanSource = true) => {
      const rect = slot[type === 'title' ? 'titleRectSection' : 'descriptionRectSection'];
      const patchPath = slot[type === 'title' ? 'titleCleanPatch' : 'descriptionCleanPatch'];
      const r=box(rect,true);
      if (patchPath && cleanSource) {
        const patch=document.createElement('img');
        patch.className='cms-experience-slot-overlay'; patch.alt=''; patch.setAttribute('aria-hidden','true'); patch.src=assetFor(patchPath);
        Object.assign(patch.style,{position:'absolute',zIndex:String(slotLayerZ(slot,2)),pointerEvents:'none',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',maxWidth:'none'});
        root.append(patch);
      }
      if (!value) return;
      const text=document.createElement('span'); text.className='cms-experience-slot-overlay'; text.textContent=String(value);
      text.setAttribute('data-cms-live-copy','experiences.'+slot.slotId+'.'+type);
      Object.assign(text.style,{position:'absolute',zIndex:String(slotLayerZ(slot,3)),pointerEvents:'none',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',overflow:'hidden',display:'block',whiteSpace:'pre-line',color:'#15394c',fontFamily:type==='title'?'var(--cms-heading-font,"Playfair Display",Georgia,serif)':'var(--cms-body-font,"Inter",Arial,sans-serif)',fontSize:(type==='title'?Math.max(12,16*sx):Math.max(10,12*sx))+'px',fontWeight:type==='title'?'600':'400',lineHeight:type==='title'?'1.1':'1.25'});
      root.append(text);
    };
    const addSourceGlyph = (slot, type) => {
      const glyphPath = slot[type === 'title' ? 'titleGlyph' : 'descriptionGlyph'];
      const rect = slot[type === 'title' ? 'titleRectSection' : 'descriptionRectSection'];
      if (!glyphPath || !rect) return;
      const r=box(rect,true);
      const glyph=document.createElement('img');
      glyph.className='cms-experience-slot-overlay cms-experience-source-glyph';
      glyph.alt=''; glyph.setAttribute('aria-hidden','true');
      const glyphUrl=new URL(assetFor(glyphPath));
      glyphUrl.searchParams.set('v','20261014-9');
      glyph.src=glyphUrl.href;
      Object.assign(glyph.style,{position:'absolute',zIndex:String(slotLayerZ(slot,3)),pointerEvents:'none',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',maxWidth:'none',objectFit:'fill'});
      root.append(glyph);
    };
    const addFullCardBacking = (slot) => {
      if (!slot.fullCardBackingOverlay || !slot.fullCardBackingRect) return;
      const rect = box(slot.fullCardBackingRect, false);
      const backing = document.createElement('img');
      backing.className = 'cms-experience-photo-frame';
      backing.alt = '';
      backing.setAttribute('aria-hidden', 'true');
      backing.dataset.cmsExperienceSlot = slot.slotId;
      const backingUrl = new URL(assetFor(slot.fullCardBackingOverlay));
      backingUrl.searchParams.set('v', '20261014-11');
      backing.src = backingUrl.href;
      Object.assign(backing.style, {position:'absolute',zIndex:String(slotLayerZ(slot)),pointerEvents:'none',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',maxWidth:'none',objectFit:'fill'});
      const polygon = slot.fullCardBackingPolygon;
      const dims = slot.fullCardBackingOverlayDimensions || [Number(slot.fullCardBackingRect[2])-Number(slot.fullCardBackingRect[0]), Number(slot.fullCardBackingRect[3])-Number(slot.fullCardBackingRect[1])];
      if (Array.isArray(polygon) && polygon.length >= 3) {
        backing.style.clipPath = `polygon(${polygon.map((point)=>`${(Number(point[0])/Math.max(1,Number(dims[0]))*100).toFixed(4)}% ${(Number(point[1])/Math.max(1,Number(dims[1]))*100).toFixed(4)}%`).join(',')})`;
      }
      root.append(backing);
    };
    const addSourceFrame = (slot, sourceImage) => {
      if (!slot.photoFrameOverlay || !sourceImage) return;
      const frame=sourceImage.cloneNode(false);
      frame.classList.add('cms-experience-photo-frame');
      frame.removeAttribute('data-reveal'); frame.removeAttribute('data-copy-id');
      frame.dataset.cmsExperienceSlot=slot.slotId;
      frame.src=assetFor(slot.photoFrameOverlay); frame.alt=''; frame.setAttribute('aria-hidden','true');
      frame.style.setProperty('pointer-events','none','important');
      frame.style.setProperty('z-index',String((Number.parseInt(getComputedStyle(sourceImage).zIndex,10)||2)+1),'important');
      sourceImage.insertAdjacentElement('afterend',frame);
    };
    const addCardMask = (slot) => {
      if (!slot.fullCardMask || !slot.fullCardMaskRect) return;
      const r=slot.fullCardMaskRectSection?box(slot.fullCardMaskRectSection,true):box(slot.fullCardMaskRect,false);
      const mask=document.createElement('img');
      mask.className='cms-experience-card-mask'; mask.alt=''; mask.setAttribute('aria-hidden','true');
      const maskUrl=new URL(assetFor(slot.fullCardMask));
      maskUrl.searchParams.set('v','20261014-9');
      mask.src=maskUrl.href;
      Object.assign(mask.style,{position:'absolute',zIndex:String(slotLayerZ(slot)),pointerEvents:'none',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',maxWidth:'none',objectFit:'fill'});
      if(Array.isArray(slot.fullCardMaskPolygon)&&slot.fullCardMaskPolygon.length>=3){
        const rect=slot.fullCardMaskRectSection||slot.fullCardMaskRect;
        const polygon=slot.fullCardMaskPolygon.map((point)=>`${(Number(point[0])/Math.max(1,Number(rect[2])-Number(rect[0]))*100).toFixed(4)}% ${(Number(point[1])/Math.max(1,Number(rect[3])-Number(rect[1]))*100).toFixed(4)}%`).join(',');
        mask.style.clipPath=`polygon(${polygon})`;
      }
      mask.dataset.cmsExperienceSlot=slot.slotId;
      root.append(mask);
    };
    const addPhotoComposite = (slot, sourceImage, src, rect, aboveUnderlay = false) => {
      const framePath=slot.photoFrameOverlay;
      const polygon=slot.photoViewportPolygon;
      if(!framePath||!Array.isArray(polygon)||!polygon.length||!src)return false;
      const layer=document.createElement('span');
      layer.className=`foreground exp-card cms-experience-photo-composite ${[...sourceImage.classList].filter((name)=>/^card-[a-d]$/.test(name)).join(' ')}`;
      layer.dataset.cmsExperienceSlot=slot.slotId;
      layer.setAttribute('aria-hidden','true');
      Object.assign(layer.style,{position:'absolute',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',zIndex:aboveUnderlay?String(slotLayerZ(slot,1)):(getComputedStyle(sourceImage).zIndex||'2'),maxWidth:'none',overflow:'hidden',pointerEvents:'none',transform:'none'});
      const photo=document.createElement('img');
      photo.className='cms-experience-replacement-photo';photo.alt='';photo.src=src;
      const sourceDims=slot.photoFrameOverlayDimensions||[Math.round(rect.width/sx),Math.round(rect.height/sy)];
      const points=polygon.map((point)=>`${(Number(point[0])/Math.max(1,Number(sourceDims[0]))*100).toFixed(4)}% ${(Number(point[1])/Math.max(1,Number(sourceDims[1]))*100).toFixed(4)}%`).join(',');
      Object.assign(photo.style,{position:'absolute',inset:'0',display:'block',width:'100%',height:'100%',maxWidth:'none',objectFit:'cover'});
      const corners=slot.photoPerspectiveCorners;
      if(Array.isArray(corners)&&corners.length===4){
        const q=corners.map((point)=>({x:Number(point[0])*sx,y:Number(point[1])*sy}));
        const [p0,p1,p2,p3]=q;
        const dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x;
        const dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y;
        const den=dx1*dy2-dx2*dy1;
        if(Math.abs(den)>1e-6){
          const g=(dx3*dy2-dx2*dy3)/den,h=(dx1*dy3-dx3*dy1)/den;
          const a=p1.x-p0.x+g*p1.x,c=p3.x-p0.x+h*p3.x,e=p0.x;
          const b=p1.y-p0.y+g*p1.y,d=p3.y-p0.y+h*p3.y,f=p0.y;
          photo.style.transformOrigin='0 0';
          photo.style.transform=`matrix3d(${a/rect.width},${b/rect.width},0,${g/rect.width},${c/rect.height},${d/rect.height},0,${h/rect.height},0,0,1,0,${e},${f},0,1)`;
        }
      }
      layer.append(photo);
      if (!aboveUnderlay) {
        const frame=document.createElement('img');frame.className='cms-experience-photo-frame';frame.alt='';frame.src=assetFor(framePath);
        Object.assign(frame.style,{position:'absolute',inset:'0',display:'block',width:'100%',height:'100%',maxWidth:'none',objectFit:'fill',pointerEvents:'none'});
        layer.append(frame);
      }
      sourceImage.insertAdjacentElement('afterend',layer);
      sourceImage.style.setProperty('visibility','hidden','important');sourceImage.style.setProperty('display','none','important');
      return true;
    };
    const defaultOrder = !orderWasEdited && eligible.length === slots.length && eligible.every((item,index)=>String(item.id)===String(slots[index]?.entityId));
    const originalImageById = new Map();
    slots.forEach((slot)=>{const image=root.querySelector(slot.imageSelector);if(image){if(!image.dataset.cmsSourceSrc)image.dataset.cmsSourceSrc=image.getAttribute('src')||'';originalImageById.set(String(slot.entityId),image.dataset.cmsSourceSrc);}});
    slots.forEach((slot,index)=>{
      const item=orderWasEdited ? (eligible[index]||null) : (eligible.find((entry)=>String(entry.id)===String(slot.entityId))||null);
      const original=originalItems.find((entry)=>String(entry.id)===String(item?.id))||slot.defaultEntity||{};
      const anchor=root.querySelector(slot.selector),image=root.querySelector(slot.imageSelector);
      if(!anchor||!image)return;
      if(!image.dataset.cmsSourceSrc)image.dataset.cmsSourceSrc=image.getAttribute('src')||'';
      if(!image.dataset.cmsSourceStyle)image.dataset.cmsSourceStyle=image.getAttribute('style')||'';
      if(!anchor.dataset.cmsSourceStyle)anchor.dataset.cmsSourceStyle=anchor.getAttribute('style')||'';
      const isDefaultSlot=!!item&&String(item.id)===String(slot.entityId);
      const moved=!!item&&(orderWasEdited||!isDefaultSlot);
      const targetPhoto=box(slot.photoRectSection,true), targetCard=box(slot.cardRect,false);
      if(moved){
        Object.assign(image.style,{position:'absolute',left:targetPhoto.left+'px',top:targetPhoto.top+'px',width:targetPhoto.width+'px',height:targetPhoto.height+'px',maxWidth:'none',objectFit:'cover'});
        Object.assign(anchor.style,{position:'absolute',left:targetCard.left+'px',top:targetCard.top+'px',width:targetCard.width+'px',height:targetCard.height+'px'});
      }else{
        if(image.dataset.cmsSourceStyle)image.setAttribute('style',image.dataset.cmsSourceStyle);else image.removeAttribute('style');
        if(anchor.dataset.cmsSourceStyle)anchor.setAttribute('style',anchor.dataset.cmsSourceStyle);else anchor.removeAttribute('style');
      }
      if(!item){
        image.style.setProperty('visibility','hidden','important');
        image.style.setProperty('display','none','important');
        anchor.style.setProperty('visibility','hidden','important');
        // If the top collage card is removed, clean its silhouette above every
        // preceding card photo that could otherwise show through its overlap.
        if (!underlayCoveredSlots.has(String(slot.slotId)) || Number(slot.sourceLayerOrder) === topSourceLayerOrder) addCardMask(slot);
        // Source title/body are baked into the section artwork. Clear just their
        // exact text ROIs after masking the angled card, preserving nearby script.
        if (!underlayCoveredSlots.has(String(slot.slotId))) {
          addCopy(slot,'title','');
          addCopy(slot,'description','');
        }
        return;
      }
      image.style.removeProperty('visibility');image.style.removeProperty('display');anchor.style.visibility='';
      const sourceCrop=originalImageById.get(String(item.id));
      const imageChanged=String(item.image||'')!==String(original.image||'');
      const sourceImage=sourceCrop||image.dataset.cmsSourceSrc||'';
      image.setAttribute('src',sourceImage);
      const useSectionUnderlay = underlayCoveredSlots.has(String(slot.slotId));
      if(imageChanged || moved || useSectionUnderlay){
        const compositeRect=box(slot.photoRectSection,true);
        if (useSectionUnderlay && !imageChanged && !moved && slot.originalPhotoOverlay) {
          addExperienceImagePatch(slot.originalPhotoOverlay,slot.originalPhotoOverlayRect||slot.photoRect,slotLayerZ(slot,1),slot);
        } else {
          addPhotoComposite(slot,image,safeImage(item.image)||'',compositeRect,useSectionUnderlay);
        }
        if (useSectionUnderlay) addFullCardBacking(slot);
      }
      image.alt=item.title||item.name||slot.name||'';
      const title=String(item.title||item.name||'');
      const titleChanged=moved||title!==String(original.title||original.name||'');
      const description=String(item.description||'');
      const descriptionChanged=moved||description!==String(original.description||'');
      if(titleChanged)addCopy(slot,'title',title,!underlayCoveredSlots.has(String(slot.slotId)));
      else if(underlayCoveredSlots.has(String(slot.slotId)))addSourceGlyph(slot,'title');
      if(descriptionChanged)addCopy(slot,'description',description,!underlayCoveredSlots.has(String(slot.slotId)));
      else if(underlayCoveredSlots.has(String(slot.slotId)))addSourceGlyph(slot,'description');
      const destination=item.path||slot.defaultEntity?.path;
      if(destination){anchor.href=siteHref(destination)||safeHref(destination)||anchor.href;anchor.setAttribute('aria-label',(title||'Deneyim')+' için bilgi alın');}
    });

    // Extra records use the final source card as their visual template and extend
    // the section flow, keeping the existing four source slots untouched.
    const extras=eligible.slice(slots.length);
    if(extras.length && slots.length){
      if(!root.dataset.cmsExperienceBaseHeight)root.dataset.cmsExperienceBaseHeight=String(root.getBoundingClientRect().height);
      const baseHeight=Number(root.dataset.cmsExperienceBaseHeight)||root.getBoundingClientRect().height;
      const rowHeight=320*sx, rows=Math.ceil(extras.length/3);
      root.style.height=(baseHeight+rows*rowHeight+16*sx)+'px';
      const bg=root.querySelector(layout.section?.backgroundSelector||'.art-section.experiences>img:not(.foreground)');
      if(bg)bg.style.height=baseHeight+'px';
      extras.forEach((item,index)=>{
        const card=document.createElement('a');card.className='cms-experience-extra-row';card.href=siteHref(item.path)||siteHref('/iletisim/?deneyim='+encodeURIComponent(item.id))||safeHref(item.path)||'#';
        card.setAttribute('aria-label',(item.title||item.name||'Deneyim')+' için bilgi alın');
        const col=index%3,row=Math.floor(index/3), gap=18*sx, margin=20*sx, cardW=(sectionRect.width-2*margin-2*gap)/3, top=baseHeight+8*sx+row*rowHeight;
        Object.assign(card.style,{position:'absolute',zIndex:'12',left:(margin+col*(cardW+gap))+'px',top:top+'px',width:cardW+'px',height:(rowHeight-12*sx)+'px',display:'flex',flexDirection:'column',color:'#15394c',textDecoration:'none'});
        const photo=document.createElement('img');photo.src=safeImage(item.image)||'';photo.alt=item.title||item.name||'';Object.assign(photo.style,{width:'100%',height:'68%',objectFit:'cover'});
        const title=document.createElement('strong');title.textContent=item.title||item.name||'';Object.assign(title.style,{fontFamily:'var(--cms-heading-font,"Playfair Display",Georgia,serif)',fontSize:Math.max(13,17*sx)+'px',marginTop:8*sx+'px'});
        const description=document.createElement('span');description.textContent=item.description||'';Object.assign(description.style,{fontFamily:'var(--cms-body-font,"Inter",Arial,sans-serif)',fontSize:Math.max(11,12*sx)+'px',lineHeight:'1.3',marginTop:4*sx+'px'});
        card.append(photo,title,description);root.append(card);
      });
    } else if(root.dataset.cmsExperienceBaseHeight){
      root.style.height=''; delete root.dataset.cmsExperienceBaseHeight;
      const bg=root.querySelector(layout.section?.backgroundSelector||'.art-section.experiences>img:not(.foreground)'); if(bg)bg.style.height='';
    }
  }

  function renderCollections(content, pageConfig) {
    document.documentElement.dataset.cmsHomeArtworkCollections = String(
      currentPagePath() === '/' && (pageConfig.collections || []).some((spec) =>
        spec.homeFeatured && document.querySelector(spec.selector || '')
      )
    );
    (pageConfig.collections || []).forEach((spec) => {
      if (spec.renderMode === 'source-slot-overlays' || spec.layoutManifest) { renderSourceSlotCollection(content, spec); return; }
      const sourceItems = Array.isArray(content[spec.key]) ? content[spec.key] : [];
      const path = currentPagePath();
      const detailPrefix = spec.key === 'gulets' ? '/filo/' : spec.key === 'routes' ? '/rotalar/' : '';
      const isDetail = detailPrefix && path.startsWith(detailPrefix) && path !== detailPrefix;
      const detailSlug = isDetail ? path.slice(detailPrefix.length).replace(/\/$/, '') : '';
      const detailRecord = isDetail ? sourceItems.find((item) => {
        const id = String(item.id || item.slug || '').toLowerCase();
        const itemPath = String(item.path || '').toLowerCase();
        return id === detailSlug.toLowerCase() || itemPath.includes('/' + detailSlug.toLowerCase() + '/') || itemPath.endsWith('/' + detailSlug.toLowerCase());
      }) : null;
      let entities = sourceItems
        .filter((item) => (!spec.homeFeatured || item.featuredHome !== false) && String(item.status || 'published').toLowerCase() === 'published' && item.isActive !== false)
        .slice()
        .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
      const originalItems = baselineContent?.[spec.key] || [];
      const selector = spec.selector || (spec.homeFeatured ? '' : '.canvas .art-card');
      const selectedAnchors = selector ? [...document.querySelectorAll(selector)] : [];
      // Home collection hotspots share a class prefix with the collection-level
      // CTA (for example `.hotspot-fleet-link`). The CTA is not a card slot; if
      // it enters the slot map every source card is treated as moved and gets a
      // duplicate CMS card layered over the original artwork.
      const anchors = spec.homeFeatured
        ? selectedAnchors.filter((anchor) => !anchor.matches('.hotspot-routes-link,.hotspot-fleet-link'))
        : selectedAnchors;
      if (!anchors.length) return;
      const canvas = document.querySelector('.canvas');
      const imageNodes = spec.imageSelector ? [...document.querySelectorAll(spec.imageSelector)] : [];
      imageNodes.forEach((node) => {
        if (!node.dataset.cmsOriginalSrc) node.dataset.cmsOriginalSrc = node.getAttribute('src') || '';
      });
      const changed = (item) => {
        const original = originalItems.find((entry) => entry.id === item.id);
        return !original || ['name','title','description','image','artwork','homeImage','homeUrl','path','inquiryUrl','status','sortOrder','guestCapacity','cabins']
          .some((key) => item[key] !== original[key]);
      };
      const keyOf = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      const collectionCardHref = (item, fallbackHref = '') => {
        if (!['gulets', 'routes'].includes(spec.key)) return siteHref(item.homeUrl || item.path || item.inquiryUrl || fallbackHref) || safeHref(item.homeUrl || item.path || item.inquiryUrl || fallbackHref) || '#';
        const prefix = spec.key === 'gulets' ? '/filo/' : '/rotalar/';
        const template = spec.key === 'gulets' ? '/filo/eylul/' : '/rotalar/gocek-fethiye-gocek/';
        const parameter = spec.key === 'gulets' ? 'gulet' : 'rota';
        const candidates = [item.detailPath, item.path, item.homeUrl, item.url].filter((value) => typeof value === 'string' && value.trim());
        const detailPath = candidates.find((value) => {
          const normalized = normalizePath(value);
          return normalized.startsWith(prefix) && normalized !== prefix;
        });
        if (detailPath) return siteHref(detailPath) || '#';
        const id = String(item.id || item.slug || '').trim();
        if (id) return siteHref(`${template}?${parameter}=${encodeURIComponent(id)}`) || '#';
        const explicit = item.inquiryUrl || item.homeUrl || item.path || fallbackHref;
        return siteHref(explicit) || safeHref(explicit) || '#';
      };
      const recordKeys = (item) => new Set([
        keyOf(item.id || item.slug),
        keyOf(String(item.path || '').split('/').filter(Boolean).pop())
      ].filter(Boolean));
      const slotIds = anchors.map((anchor) => {
        try {
          const href = new URL(anchor.dataset.cmsOriginalHref || anchor.getAttribute('href') || '', location.href);
          const queryId = href.searchParams.get(spec.key === 'gulets' ? 'gulet' : spec.key === 'routes' ? 'rota' : 'deneyim')
            || href.searchParams.get('route') || href.searchParams.get('boat');
          return keyOf(queryId || href.pathname.split('/').filter(Boolean).pop());
        } catch { return ''; }
      });
      const orderWasEdited = sourceItems.some((item) => {
        const original = originalItems.find((entry) => entry.id === item.id);
        return original && Number(original.sortOrder || 0) !== Number(item.sortOrder || 0);
      });
      const slotMappedBySource = !orderWasEdited && slotIds.every((id) => id && entities.some((item) => recordKeys(item).has(id)));
      let slotEntities;
      if (slotMappedBySource) {
        slotEntities = slotIds.map((id) => entities.find((item) => recordKeys(item).has(id)) || null);
      } else {
        slotEntities = entities.slice(0, anchors.length);
      }
      if (spec.homeFeatured && spec.key === 'gulets') {
        const foreground = document.querySelector('.home-foreground-art');
        const sourceSize = spec.sourceDimensions || [809, 1942];
        const foregroundRect = foreground?.getBoundingClientRect();
        const sourceScale = foregroundRect ? foregroundRect.width / Math.max(1, Number(sourceSize[0]) || 809) : 1;
        (spec.conditionalUnderlays || []).forEach((underlay) => {
          const targetIds = new Set((underlay.whenAnyMissing || []).map(keyOf));
          const emptySlots = new Set((underlay.whenSlotsEmpty || []).map(Number));
          const vacancyExists = (targetIds.size > 0 && slotIds.some((slotId, index) =>
            targetIds.has(slotId) && (!slotEntities[index] || !recordKeys(slotEntities[index]).has(slotId))
          )) || [...emptySlots].some((index) => Number.isInteger(index) && index >= 0 && index < slotEntities.length && !slotEntities[index]);
          const old = foreground?.querySelector(`[data-cms-home-underlay="${CSS.escape(String(underlay.id || ''))}"]`);
          if (!vacancyExists) { old?.remove(); return; }
          if (!foreground || !Array.isArray(underlay.rect) || !underlay.path) return;
          const [x0, y0, x1, y1] = underlay.rect.map(Number);
          if (![x0, y0, x1, y1].every(Number.isFinite) || x1 <= x0 || y1 <= y0) return;
          const image = old || document.createElement('img');
          image.className = 'cms-home-collection-underlay';
          image.dataset.cmsHomeUnderlay = String(underlay.id || '');
          image.alt = '';
          image.setAttribute('aria-hidden', 'true');
          image.src = safeImage(underlay.path) || '';
          Object.assign(image.style, {
            position: 'absolute', zIndex: String(Number.isFinite(Number(underlay.zIndex)) ? Number(underlay.zIndex) : 3),
            pointerEvents: 'none', left: `${x0 * sourceScale}px`, top: `${y0 * sourceScale}px`,
            width: `${(x1 - x0) * sourceScale}px`, height: `${(y1 - y0) * sourceScale}px`,
            maxWidth: 'none', objectFit: 'fill'
          });
          if (!old) foreground.append(image);
        });
      }
      const assignedIds = new Set(slotEntities.filter(Boolean).map((item) => String(item.id)));
      // Detail pages have a small, hand-picked related-card strip. Its source
      // anchors identify the eligible records; the rest of the catalog must
      // never be appended as a second row to that detail page.
      const extraEntities = isDetail ? [] : entities.filter((item) => !assignedIds.has(String(item.id)));
      if (spec.homeFeatured && spec.key === 'gulets') {
        document.querySelectorAll('.cms-home-fleet-extra-card,.cms-home-fleet-extra-hotspot').forEach((node) => node.remove());
      }
      const clearVisual = (anchor) => anchor.querySelectorAll(':scope > .cms-entity-visual, :scope > .cms-home-card-name').forEach((node) => node.remove());
      const setCollectionVisibility = (node, visible) => {
        if (!node) return;
        if (!visible) {
          if (node.dataset.cmsDisplaySaved !== '1') {
            node.dataset.cmsDisplaySaved = '1';
            node.dataset.cmsInlineDisplay = node.style.getPropertyValue('display');
            node.dataset.cmsInlineDisplayPriority = node.style.getPropertyPriority('display');
          }
          node.hidden = true;
          node.style.setProperty('display', 'none', 'important');
          return;
        }
        node.hidden = false;
        if (node.dataset.cmsDisplaySaved === '1') {
          if (node.dataset.cmsInlineDisplay) node.style.setProperty('display', node.dataset.cmsInlineDisplay, node.dataset.cmsInlineDisplayPriority || '');
          else node.style.removeProperty('display');
          delete node.dataset.cmsDisplaySaved;
          delete node.dataset.cmsInlineDisplay;
          delete node.dataset.cmsInlineDisplayPriority;
        }
      };
      if (spec.homeFeatured && spec.key === 'gulets') {
        const hasSlotChange = orderWasEdited || slotEntities.some((item, index) => !item || String(item.id) !== String(slotIds[index]));
        setCollectionVisibility(document.querySelector('.home-art-fleet-note'), !hasSlotChange);
      }
      const addPhotoOnlyVisual = (anchor, item) => {
        clearVisual(anchor);
        const image = document.createElement('img');
        image.className = 'cms-entity-photo-only';
        image.src = safeImage(item.image || item.homeImage) || '';
        image.alt = '';
        Object.assign(image.style, {
          position: 'absolute', zIndex: '8', left: '4%', top: '4%', width: '92%', height: '58%',
          display: 'block', objectFit: 'cover', borderRadius: '7px', pointerEvents: 'none'
        });
        anchor.append(image);
      };
      const addVisual = (anchor, item, home = false, photoOverride = '') => {
        clearVisual(anchor);
        const visual = document.createElement('span');
        visual.className = 'cms-entity-visual';
        Object.assign(visual.style, {
          position: 'absolute', inset: '3%', zIndex: '8', display: 'block',
          overflow: 'hidden', border: '0', borderRadius: '0',
          background: 'transparent', boxShadow: 'none',
          pointerEvents: 'none', containerType: 'inline-size'
        });
        const image = document.createElement('img');
        image.src = photoOverride || safeImage(item.image || item.homeImage || item.artwork) || '';
        image.alt = '';
        Object.assign(image.style, { display: 'block', position: 'absolute', left: '0', top: '0', width: '100%', height: '62%', objectFit: 'cover', borderRadius: '7px 7px 2px 2px' });
        const caption = document.createElement('span');
        caption.className = 'cms-entity-caption';
        Object.assign(caption.style, {
          position: 'absolute', left: '0', right: '0', bottom: '0', height: '38%',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2% 5%',
          background: '#f7f3e9', color: '#123347', font: '600 6cqi Georgia,serif',
          lineHeight: '1.12', textAlign: 'left'
        });
        if (home && spec.key === 'gulets') {
          const name = document.createElement('strong');
          name.textContent = item.name || item.title || '';
          Object.assign(name.style, {display:'block',font:'600 7.2cqi Georgia,serif',lineHeight:'1.05',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'});
          const capacity = Number(item.guestCapacity);
          const cabins = Number(item.cabins);
          const facts = document.createElement('small');
          facts.textContent = `${Number.isFinite(capacity) && capacity > 0 ? `${capacity} misafir` : ''}${Number.isFinite(capacity) && capacity > 0 && Number.isFinite(cabins) && cabins > 0 ? ' | ' : ''}${Number.isFinite(cabins) && cabins > 0 ? `${cabins} kabin` : ''}`;
          Object.assign(facts.style, {display:'block',marginTop:'2px',font:'400 4.8cqi Inter,Arial,sans-serif',lineHeight:'1.05',whiteSpace:'nowrap'});
          const arrow = document.createElement('span');
          arrow.textContent = '›';
          Object.assign(arrow.style, {position:'absolute',right:'4%',bottom:'8%',width:'13%',aspectRatio:'1',display:'grid',placeItems:'center',border:'1px solid #b8b3a8',borderRadius:'50%',font:'400 9px Georgia,serif',lineHeight:'1'});
          caption.style.padding = '2% 5%';
          caption.append(name, facts, arrow);
        } else if (item.name || item.title) {
          caption.textContent = item.name || item.title;
        }
        if (item.description && !(home && spec.key === 'gulets')) {
          const detail = document.createElement('small');
          detail.textContent = item.description;
          Object.assign(detail.style, { display: 'block', marginTop: '2px', font: '4.8cqi Inter,Arial,sans-serif', lineHeight: '1.15', fontWeight: '400' });
          caption.append(detail);
        }
        visual.append(image, caption);
        anchor.append(visual);
        if (home) visual.style.inset = '8% 4% 6%';
      };
      const addDeletedMask = (anchor, index) => {
        if (!canvas) return;
        const box = anchor.getBoundingClientRect();
        const base = canvas.getBoundingClientRect();
        const mask = document.createElement('span');
        mask.className = `cms-deleted-card-mask cms-deleted-${spec.key}`;
        mask.dataset.cmsDeletedCard = `${spec.key}-${index}`;
        Object.assign(mask.style, {
          position: 'absolute', left: `${box.left - base.left + canvas.scrollLeft}px`,
          top: `${box.top - base.top + canvas.scrollTop}px`, width: `${box.width}px`, height: `${box.height}px`,
          zIndex: '4', display: 'block', background: '#f7f3e9', borderRadius: '12px', pointerEvents: 'none'
        });
        canvas.append(mask);
      };
      const placeNewCard = (clone, newIndex) => {
        if (!canvas || !anchors.length) return;
        const canvasRect = canvas.getBoundingClientRect();
        const rects = anchors.map((node) => node.getBoundingClientRect());
        const firstRowTop = Math.min(...rects.map((rect) => rect.top));
        const firstRow = rects.filter((rect) => Math.abs(rect.top - firstRowTop) < 12).sort((a, b) => a.left - b.left);
        const rowBottom = Math.max(...rects.map((rect) => rect.bottom));
        const cardWidth = firstRow[0]?.width || rects[0].width;
        const cardHeight = firstRow[0]?.height || rects[0].height;
        const gap = Math.max(12, canvasRect.width * 0.025);
        const row = Math.floor((newIndex - anchors.length) / Math.max(1, firstRow.length));
        const col = (newIndex - anchors.length) % Math.max(1, firstRow.length);
        const left = (firstRow[col]?.left ?? (firstRow[0]?.left || rects[0].left) + col * (cardWidth + gap)) - canvasRect.left;
        const top = rowBottom - canvasRect.top + gap + row * (cardHeight + gap);
        clone.style.left = `${left / canvasRect.width * 100}%`;
        clone.style.top = `${top / canvasRect.height * 100}%`;
        clone.style.width = `${cardWidth / canvasRect.width * 100}%`;
        clone.style.height = `${cardHeight / canvasRect.height * 100}%`;
      };

      anchors.forEach((anchor, index) => {
        const item = slotEntities[index] || null;
        if (!item) {
          if (!anchor.hidden && !spec.homeFeatured) addDeletedMask(anchor, index);
          setCollectionVisibility(anchor, false);
          if (spec.homeFeatured) {
            const prefix = spec.key === 'routes' ? 'home-art-route-card-' : 'home-art-fleet-card-';
            setCollectionVisibility(document.querySelector(`.${prefix}${index + 1}`), false);
            setCollectionVisibility(imageNodes[index], false);
          }
          return;
        }
        setCollectionVisibility(anchor, true);
        if (spec.homeFeatured) {
          const prefix = spec.key === 'routes' ? 'home-art-route-card-' : 'home-art-fleet-card-';
          setCollectionVisibility(document.querySelector(`.${prefix}${index + 1}`), true);
          setCollectionVisibility(imageNodes[index], true);
        }
        canvas?.querySelector(`[data-cms-deleted-card=\"${CSS.escape(`${spec.key}-${index}`)}\"]`)?.remove();
        const oldHref = anchor.dataset.cmsOriginalHref || anchor.getAttribute('href') || '#';
        if (!anchor.dataset.cmsOriginalHref) anchor.dataset.cmsOriginalHref = oldHref;
        const href = collectionCardHref(item, oldHref);
        anchor.href = href;
        anchor.setAttribute('aria-label', `${item.name || item.title || ''} — ${spec.key === 'routes' ? 'rota' : 'gulet'}`);
        const original = originalItems.find((entry) => entry.id === item.id);
        const sourceId = slotIds[index];
        const movedFromSource = Boolean(sourceId && !recordKeys(item).has(sourceId));
        const photoOnlyChange = Boolean(original)
          && (item.image !== original.image || item.homeImage !== original.homeImage)
          && ['name','title','description','artwork','path','homeUrl','inquiryUrl','sortOrder','guestCapacity','cabins'].every((key) => item[key] === original[key])
          && !movedFromSource;
        const isChanged = changed(item);
        if (photoOnlyChange && spec.homeFeatured) {
          clearVisual(anchor);
          const photo = imageNodes[index];
          if (photo) { photo.removeAttribute('hidden'); photo.src = safeImage(item.homeImage || item.image) || photo.src; }
          return;
        }
        if (photoOnlyChange && !spec.homeFeatured) {
          addPhotoOnlyVisual(anchor, item);
          return;
        }
        if (!isChanged && !movedFromSource) {
          clearVisual(anchor);
          if (spec.homeFeatured) {
            document.querySelector(`.${spec.key === 'routes' ? 'home-art-route-card-' : 'home-art-fleet-card-'}${index + 1}`)?.removeAttribute('hidden');
            const photo = imageNodes[index];
            if (photo) { photo.removeAttribute('hidden'); photo.src = safeImage(item.homeImage || item.image) || photo.src; }
          }
          return;
        }
        if (changed(item) || movedFromSource) {
          const sourceIndex = slotIds.findIndex((id) => recordKeys(item).has(id));
          const sourcePhotoNode = sourceIndex >= 0 ? imageNodes[sourceIndex] : null;
          const samePhoto = original && item.image === original.image && item.homeImage === original.homeImage;
          const photoOverride = spec.homeFeatured && samePhoto && sourcePhotoNode
            ? safeImage(sourcePhotoNode.dataset.cmsOriginalSrc || sourcePhotoNode.getAttribute('src') || '') || ''
            : '';
          addVisual(anchor, item, Boolean(spec.homeFeatured), photoOverride);
        }
        else clearVisual(anchor);
        if (spec.homeFeatured) {
          const photo = imageNodes[index];
          if (photo) {
            if (!photo.dataset.cmsOriginalSrc) photo.dataset.cmsOriginalSrc = photo.getAttribute('src') || '';
            if (changed(item) || movedFromSource) photo.src = safeImage(item.homeImage || item.image) || photo.src;
            else photo.src = photo.dataset.cmsOriginalSrc;
            photo.removeAttribute('hidden');
          }
        }
      });

      if (spec.homeFeatured && spec.key === 'gulets') {
        const canvasRoot = document.querySelector('.home-foreground-art');
        const hotspotRoot = document.querySelector('.home-art-hotspots');
        const sourceCard = document.querySelector('.home-art-fleet-card-5');
        const sourcePhoto = sourceCard?.getBoundingClientRect();
        const rootRect = canvasRoot?.getBoundingClientRect();
        const width = Number(spec.sourceDimensions?.[0]) || 809;
        const height = Number(spec.sourceDimensions?.[1]) || 1942;
        const pitch = Number(spec.homeExtraSlotPitch) || 141;
        const extras = extraEntities.filter((item) => item);
        document.documentElement.dataset.homeFleetExtraCount = String(extras.length);
        document.documentElement.dataset.homeFleetExtraPitchSource = String(pitch);
        document.documentElement.dataset.homeFleetPitchSource = String(pitch);
        document.dispatchEvent(new CustomEvent('fora:home-fleet-collection', {
          detail: { extrasCount: extras.length, pitchSource: pitch }
        }));
        if (canvasRoot && hotspotRoot && sourceCard && sourcePhoto && rootRect?.width) {
          const relative = {
            left: (sourcePhoto.left - rootRect.left) / rootRect.width * width,
            top: (sourcePhoto.top - rootRect.top) / rootRect.width * width,
            width: sourcePhoto.width / rootRect.width * width,
            height: sourcePhoto.height / rootRect.width * width
          };
          extras.forEach((item, extraIndex) => {
            const left = relative.left + pitch * (extraIndex + 1);
            const group = document.createElement('div');
            group.className = 'cms-home-fleet-extra-card fleet-drag-card';
            group.dataset.cmsHomeFleetExtraId = String(item.id || item.slug || extraIndex + 1);
            Object.assign(group.style, {
              position: 'absolute', left: `${left / width * 100}%`, top: `${relative.top / height * 100}%`,
              width: `${relative.width / width * 100}%`, height: `${relative.height / height * 100}%`,
              overflow: 'visible', zIndex: '8', pointerEvents: 'none'
            });
            const frame = document.createElement('img');
            frame.className = 'cms-home-fleet-extra-frame';
            frame.src = sourceCard.getAttribute('src') || sourceCard.src;
            frame.alt = '';
            frame.setAttribute('aria-hidden', 'true');
            Object.assign(frame.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'fill', zIndex: '1', pointerEvents: 'none' });
            group.append(frame);
            addVisual(group, item, true);
            canvasRoot.append(group);

            const hotspot = document.createElement('a');
            hotspot.className = 'cms-home-fleet-extra-hotspot';
            hotspot.dataset.cmsHomeFleetExtraId = String(item.id || item.slug || extraIndex + 1);
            hotspot.href = collectionCardHref(item, item.path || item.inquiryUrl || '#');
            hotspot.setAttribute('aria-label', `${item.name || item.title || 'Gulet'} — gulet`);
            Object.assign(hotspot.style, {
              position: 'absolute', left: `${left / width * 100}%`, top: `${relative.top / height * 100}%`,
              width: `${relative.width / width * 100}%`, height: `${relative.height / height * 100}%`,
              display: 'block', zIndex: '30', opacity: '0', transform: 'translateX(var(--fleet-shift,0px))',
              transition: 'transform 400ms ease', pointerEvents: 'auto'
            });
            hotspotRoot.append(hotspot);
          });
        }
      }

      for (let index = anchors.length; index < anchors.length + extraEntities.length; index += 1) {
        const template = anchors[0];
        const clone = template.cloneNode(false);
        clone.removeAttribute('hidden');
        clone.dataset.cmsGeneratedCollectionCard = spec.key;
        placeNewCard(clone, index);
        if (spec.homeFeatured) continue;
        canvas?.append(clone);
        const item = extraEntities[index - anchors.length] || null;
        if (!item) continue;
        const original = originalItems.find((entry) => entry.id === item.id);
        if (!original || changed(item)) addVisual(clone, item);
        clone.href = collectionCardHref(item, item.path || item.inquiryUrl || '#');
        clone.setAttribute('aria-label', `${item.name || item.title || ''} — ${spec.key === 'routes' ? 'rota' : 'gulet'}`);
      }
      document.querySelectorAll(`[data-cms-generated-collection-card="${CSS.escape(spec.key)}"]`).forEach((card, offset) => {
        const item = entities[anchors.length + offset];
        if (!item) card.remove();
      });
    });
  }

  async function readJson(url) {
    const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) throw new Error(`CMS request failed (${response.status})`);
    return response.json();
  }

  async function loadCopyLayerMappings() {
    const pageFolders = {
      '/': '',
      '/deneyimler/': 'deneyimler',
      '/hakkimizda/': 'hakkimizda',
      '/iletisim/': 'iletisim',
      '/rotalar/': 'rotalar',
      '/rotalar/gocek-fethiye-gocek/': 'rotalar/gocek-fethiye-gocek',
      '/filo/': 'filo',
      '/filo/eylul/': 'filo/eylul'
    };
    for (const pageConfig of bindingConfig.pages || []) {
      const folder = pageFolders[pageConfig.path];
      if (!Object.prototype.hasOwnProperty.call(pageFolders, pageConfig.path)) continue;
      try {
        const manifestUrl = new URL(folder ? `../${folder}/assets/motion-copy/manifest.json` : 'motion-copy/manifest.json', assetsUrl);
        const manifest = await readJson(manifestUrl);
        for (const layer of manifest.layers || []) {
          let binding = layer.binding || (pageConfig.path === '/filo/eylul/' && layer.id === 'hero-kicker' ? 'eylul.hero.eyebrow' : null);
          if (!binding && layer.id === 'hero-whatsapp-label') {
            const offerBinding = pageConfig.fields?.find((field) => field.binding?.endsWith('.header.offerLabel'))?.binding;
            const whatsappBinding = offerBinding?.replace(/\.offerLabel$/, '.whatsappLabel');
            if (whatsappBinding && pageConfig.fields?.some((field) => field.binding === whatsappBinding)) binding = whatsappBinding;
          }
          if (!binding) {
            if (pageConfig.path === '/filo/eylul/' && layer.id === 'hero-script') {
              pageConfig.motionStaticLayers ||= [];
              pageConfig.motionStaticLayers.push({...layer, sourceDimensions:layer.sourceDimensions||manifest.sourceDimensions});
            }
            continue;
          }
          let mapping = pageConfig.fields?.find((field) => field.binding === binding);
          if (!mapping) {
            mapping = { binding, selectors: [] };
            pageConfig.fields ||= [];
            pageConfig.fields.push(mapping);
          }
          const semantic = layer.semantic || 'paragraph';
          const heading = ['heading', 'eyebrow'].includes(semantic);
          const fontSize = semantic === 'heading' ? '44px'
            : semantic === 'eyebrow' ? '11px'
            : semantic.includes('button') ? '12px'
            : semantic.includes('footer') ? '10px' : '18px';
          const offerHotspot = binding.endsWith('.header.offerLabel')
            ? '.canvas a.hotspot[aria-label*="teklif" i]'
            : null;
          const hasOfferHotspot = Boolean(offerHotspot && document.querySelector(offerHotspot));
          const whatsappHotspot = binding.endsWith('.header.whatsappLabel') ? '.canvas a.hotspot[aria-label*="WhatsApp" i]' : null;
          const hasWhatsappHotspot = Boolean(whatsappHotspot && document.querySelector(whatsappHotspot));
          const selector = layer.anchor || layer.reference || (layer.canvasRect && pageConfig.path === '/' ? '.desktop-source-art' : layer.canvasRect ? '.canvas' : `[data-copy-id="${layer.id}"]`);
          const cmsPatch = layer.cmsCleanPatch || layer.cleanPatch;
          if (!mapping.overlay && !cmsPatch) continue;
          const patchAsset = cmsPatch
            ? (folder || !cmsPatch.startsWith('assets/') ? new URL(cmsPatch, manifestUrl) : new URL(`../${cmsPatch}`, assetsUrl)).href
            : '';
          const sourceRect = layer.referenceRect || layer.canvasRect || (layer.sourceBBox && (layer.sourceDimensions || manifest.sourceDimensions) ? { left: layer.sourceBBox[0] / (layer.sourceDimensions || manifest.sourceDimensions)[0], top: layer.sourceBBox[1] / (layer.sourceDimensions || manifest.sourceDimensions)[1], width: (layer.sourceBBox[2] - layer.sourceBBox[0]) / (layer.sourceDimensions || manifest.sourceDimensions)[0], height: (layer.sourceBBox[3] - layer.sourceBBox[1]) / (layer.sourceDimensions || manifest.sourceDimensions)[1] } : null);
          if (mapping.overlay) {
            mapping.overlay.copyId = layer.id;
            if (layer.anchor || layer.reference || layer.canvasRect || sourceRect) mapping.overlay.reference = [selector];
            if (sourceRect) mapping.overlay.referenceRect = sourceRect;
            if (patchAsset) mapping.overlay.patchAsset = patchAsset;
          } else {
            mapping.overlay = {
              copyId: layer.id,
              reference: [selector],
              hostSelector: 'main',
              ...(sourceRect ? { referenceRect: sourceRect } : {}),
              ...(patchAsset ? { patchAsset } : {}),
              font: heading ? 'var(--font-display)' : 'var(--font-body)',
              fontSize,
              lineHeight: '1.18',
              color: layer.ink === 'light' ? '#f7f2e8' : '#17384a',
              whiteSpace: 'pre-line',
              align: 'left'
            };
          }
          if (pageConfig.path === '/filo/eylul/' && layer.id === 'quote-heading') { mapping.overlay.maxLines = 2; mapping.overlay.minFontSize = 17; }
          if (layer.id.startsWith('hero-') || binding === 'eylul.header.offerLabel') mapping.overlay.forceWhenHeroPhotoReplaced = true;
          if (hasOfferHotspot || hasWhatsappHotspot) {
            mapping.heroPhotoOverlayBase ||= { ...mapping.overlay };
            mapping.heroPhotoOverlaySpecial = hasOfferHotspot
              ? { reference:[offerHotspot], referenceRect:null, background:'#efd09a', radius:'999px', display:'flex', alignItems:'center', justifyContent:'center', font:'var(--font-body, Inter, Arial, sans-serif)', fontSize:'12px', fontWeight:'600', color:'#17384c', padding:'0 10px', align:'center', trailingArrow:true }
              : { reference:[whatsappHotspot], referenceRect:null, background:'transparent', border:'1px solid #f7f2e8', radius:'999px', display:'flex', alignItems:'center', justifyContent:'center', font:'var(--font-body, Inter, Arial, sans-serif)', fontSize:'12px', fontWeight:'500', color:'#f7f2e8', padding:'0 10px', align:'center' };
            mapping.overlay = { ...mapping.heroPhotoOverlayBase };
          }
          const hides = [...(mapping.hideSelectors || [])];
          if (layer.hideSelector) hides.push(layer.hideSelector);
          else hides.push(`[data-copy-id="${CSS.escape(layer.id)}"] .copy-glyph`);
          mapping.hideSelectors = [...new Set(hides)];
        }
      } catch { /* Pages without generated text layers retain their source art. */ }
    }
  }

  async function refresh() {
    if (draftPreviewActive) return;
    if (apiUrl) {
      try {
        const live = await readJson(apiUrl);
        if (draftPreviewActive) return;
        if (applyContent(live, 'published')) {
          document.documentElement.dataset.cmsSource = 'published';
          return;
        }
      } catch { /* A static preview can run without the CMS service. */ }
    }
    if (draftPreviewActive) return;
    // Once a published response has been applied, a temporary API outage must
    // not roll the page back to an older bundled snapshot.
    if (appliedContentSource === 'published') return;
    try {
      const local = await readJson(fallbackUrl);
      if (applyContent(local, 'static')) document.documentElement.dataset.cmsSource = 'static';
    } catch {
      document.documentElement.dataset.cmsSource = 'unavailable';
    }
  }

  function makeBackgroundPatch(sourceImage, normalizedRect) {
    try {
      if (!sourceImage?.complete || !sourceImage.naturalWidth) return null;
      const width = Math.max(1, Math.round(sourceImage.naturalWidth * normalizedRect.width));
      const height = Math.max(1, Math.round(sourceImage.naturalHeight * normalizedRect.height));
      const x0 = Math.round(sourceImage.naturalWidth * normalizedRect.left);
      const y0 = Math.round(sourceImage.naturalHeight * normalizedRect.top);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(sourceImage, x0, y0, width, height, 0, 0, width, height);
      const pixels = context.getImageData(0, 0, width, height);
      const data = pixels.data;
      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = sourceImage.naturalWidth;
      sourceCanvas.height = sourceImage.naturalHeight;
      const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
      sourceContext.drawImage(sourceImage, 0, 0);
      const sourcePixels = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;
      // Sample an area outside the removed text. A single border pixel can
      // contain a glyph or a sharp wave and would smear it across a whole row.
      const sampleBorder = (edge, row, channel) => {
        const samples = [];
        const direction = edge === 'left' ? -1 : 1;
        const origin = edge === 'left' ? x0 : x0 + width;
        for (let dy = -9; dy <= 9; dy += 3) {
          const sy = Math.max(0, Math.min(sourceCanvas.height - 1, row + dy));
          for (let dx = 5; dx <= 23; dx += 3) {
            const sx = Math.max(0, Math.min(sourceCanvas.width - 1, origin + direction * dx));
            samples.push(sourcePixels[(sy * sourceCanvas.width + sx) * 4 + channel]);
          }
        }
        samples.sort((a, b) => a - b);
        return samples[Math.floor(samples.length / 2)];
      };
      for (let y = 0; y < height; y += 1) {
        const left = [0, 1, 2].map((channel) => sampleBorder('left', y0 + y, channel));
        const right = [0, 1, 2].map((channel) => sampleBorder('right', y0 + y, channel));
        for (let x = 0; x < width; x += 1) {
          const t = (x + 1) / (width + 1);
          const offset = (y * width + x) * 4;
          for (let channel = 0; channel < 3; channel += 1) {
            data[offset + channel] = Math.round(left[channel] * (1 - t) + right[channel] * t);
          }
          data[offset + 3] = 255;
        }
      }
      context.putImageData(pixels, 0, 0);
      return canvas.toDataURL('image/png');
    } catch { return null; }
  }

  function applyMenus(menus) {
    if (!Array.isArray(menus)) return;
    const defaults = new Map([['/rotalar/','Rotalar'],['/filo/','Gulet Filosu'],['/deneyimler/','Deneyimler'],['/hakkimizda/','Hakkımızda'],['/iletisim/','İletişim']]);
    const pageBase = new URL(siteBase, location.href).pathname.replace(/\/+$/, '');
    const links = [...document.querySelectorAll('.main-nav a, .source-header nav a')].filter((link) => !link.closest('.mobile-panel'));
    for (const item of menus) {
      if (!item || typeof item.label !== 'string' || typeof item.url !== 'string') continue;
      let targetPath;
      try { targetPath = new URL(item.url, location.href).pathname; } catch { continue; }
      if (pageBase && targetPath.startsWith(`${pageBase}/`)) targetPath = targetPath.slice(pageBase.length);
      if (!targetPath.endsWith('/')) targetPath += '/';
      const anchor = links.find((candidate) => {
        let pathname = new URL(candidate.href, location.href).pathname;
        if (pageBase && pathname.startsWith(`${pageBase}/`)) pathname = pathname.slice(pageBase.length);
        if (!pathname.endsWith('/')) pathname += '/';
        return pathname === targetPath || candidate.textContent.trim() === defaults.get(targetPath);
      });
      if (!anchor) continue;
      const defaultLabel = defaults.get(targetPath);
      const sourceLabelIsVisible = Boolean(anchor.textContent.trim());
      anchor.href = siteHref(item.url) || anchor.href;
      anchor.setAttribute('aria-label', item.label);
      const id = `menu-${item.id || targetPath.replace(/\W+/g,'-')}`;
      if (item.label === defaultLabel) { overlayLayer.querySelector(`[data-cms-group="${CSS.escape(id)}"]`)?.remove(); continue; }
      let group = overlayLayer.querySelector(`[data-cms-group="${CSS.escape(id)}"]`);
      if (!group) {
        group = document.createElement('div'); group.className = 'cms-live-group'; group.dataset.cmsGroup = id;
        group.append(document.createElement('span'), document.createElement('span'));
        group.children[0].className = 'cms-live-patch'; group.children[0].setAttribute('aria-hidden','true');
        group.children[1].className = 'cms-live-overlay'; group.children[1].setAttribute('aria-hidden','true'); overlayLayer.append(group);
      }
      const bounds = anchor.getBoundingClientRect();
      const layerBounds = overlayLayer.getBoundingClientRect();
      group.style.left = `${bounds.left - layerBounds.left}px`; group.style.top = `${bounds.top - layerBounds.top}px`;
      group.style.width = `${bounds.width}px`; group.style.height = `${bounds.height}px`;
      const source = document.querySelector('.source-header img, .desktop-source-art img[src*="desktop-art-header"]');
      const patch = group.querySelector('.cms-live-patch');
      if (source?.complete && source.naturalWidth && !patch.dataset.ready) {
        const r = source.getBoundingClientRect(); const crop = {left:(bounds.left-r.left)/r.width,top:(bounds.top-r.top)/r.height,width:bounds.width/r.width,height:bounds.height/r.height};
        const image = makeBackgroundPatch(source,crop); if(image){patch.style.backgroundImage=`url("${image}")`;patch.dataset.ready='true';}
      }
      const text = group.querySelector('.cms-live-overlay'); text.textContent=item.label; text.style.left='0';text.style.top='0';text.style.width='100%';text.style.height='100%';
      text.style.display='flex';text.style.alignItems='center';text.style.justifyContent='center';text.style.whiteSpace='nowrap';
      text.style.setProperty('--cms-font-size','11px');text.style.setProperty('--cms-line-height','1');text.style.setProperty('--cms-font-family','Inter,Arial,sans-serif');text.style.setProperty('--cms-color','#f7f2e8');
    }
  }

  function updateOverlayPositions() {
    activeOverlays.forEach(({ mapping, field }, binding) => makeOverlay(binding, mapping, field));
    if (currentContent?.menus) applyMenus(currentContent.menus);
  }

  // Source anchors can be measured mid-entry. Reflow overlays after motion and
  // font loading so their final positions match the source art coordinates.
  document.addEventListener('animationend', () => requestAnimationFrame(updateOverlayPositions), true);
  document.addEventListener('transitionend', () => requestAnimationFrame(updateOverlayPositions), true);
  if (document.fonts?.ready) document.fonts.ready.then(() => requestAnimationFrame(updateOverlayPositions));

  function positionedNode(parent, element, className, sourceImage, rect, patchRect) {
    const node = document.createElement(element);
    node.className = className;
    if (element !== 'a') node.setAttribute('aria-hidden', 'true');
    const update = () => {
      if (!sourceImage?.isConnected) return;
      const bounds = sourceImage.getBoundingClientRect();
      const parentBounds = parent.getBoundingClientRect();
      node.style.left = `${bounds.left + bounds.width * rect.left - parentBounds.left}px`;
      node.style.top = `${bounds.top + bounds.height * rect.top - parentBounds.top}px`;
      node.style.width = `${bounds.width * rect.width}px`;
      node.style.height = `${bounds.height * rect.height}px`;
      if (patchRect && !node.dataset.patchReady) {
        const background = makeBackgroundPatch(sourceImage, patchRect);
        if (background) {
          node.style.backgroundImage = `url("${background}")`;
          node.dataset.patchReady = 'true';
        }
      }
    };
    parent.append(node);
    update();
    sourceImage?.addEventListener('load', update, { once: true });
    return { node, update, setSource(nextSource, nextRect = rect) { sourceImage = nextSource; rect = nextRect; update(); } };
  }

  function setupBrandLayer() {
    if (document.querySelector('.cms-brand-patch-layer')) return;
    const layer = document.createElement('div');
    layer.className = 'cms-brand-patch-layer';
    layer.setAttribute('aria-hidden', 'false');
    document.body.append(layer);
    const logo = new URL('brand/fora-sailing.png', assetsUrl).href;
    const myLogo = new URL('brand/mydijital.png', assetsUrl).href;
    const home = new URL('../', assetsUrl).href;
    const sourceImages = [...document.querySelectorAll('.desktop-source-art img, header.source-header img, footer img')];
    const headerSource = document.querySelector('header.masthead > img.header-art')
      || sourceImages.find((img) => img.closest('.desktop-source-art') && img === img.closest('.desktop-source-art').querySelector('img:first-child'))
      || document.querySelector('header.source-header img.header-art, header.source-header > img, header .header-art');
    const homeFooterSource = [...document.querySelectorAll('.desktop-source-art img')].at(-1);
    const footerLogoLayer = document.querySelector('img.footer-logo-layer');
    const footerBackgroundSource = [...document.querySelectorAll('footer img')].find((img) => /(^|[\\/])footer\.png(?:$|[?#])/i.test(img.currentSrc || img.src));
    const footerSource = homeFooterSource || footerLogoLayer || footerBackgroundSource
      || [...document.querySelectorAll('img')].find((img) => /(^|[\\/])footer\.png(?:$|[?#])/i.test(img.currentSrc || img.src));
    const positioned = [];
    const patchRect = { left: 0.0469, top: 0.145, width: 0.1644, height: 0.782 };
    if (headerSource) {
      // Keep the brand inside the moving header. A body overlay records an
      // intermediate transform and can lag behind its menu after entry/scroll.
      const headerParent = headerSource.closest('header') || layer;
      const patch = positionedNode(headerParent, 'span', 'cms-brand-background cms-header-background', headerSource, patchRect, patchRect);
      const brand = positionedNode(headerParent, 'a', 'cms-brand-image cms-header-image', headerSource, patchRect);
      patch.node.style.zIndex = '3';
      brand.node.style.zIndex = '4';
      brand.node.href = home;
      brand.node.setAttribute('aria-label', 'Fora Sailing ana sayfa');
      const img = document.createElement('img');
      img.src = logo;
      img.alt = 'Fora Sailing';
      brand.node.append(img);
      positioned.push(patch.update, brand.update);
    }
    if (footerSource) {
      // Several reference wordmarks cross a source band boundary. Anchor their
      // replacement to the complete source canvas, rather than the extracted
      // sprite whose CSS position can differ from the baked wordmark.
      const sourceWidth = currentTemplatePath() === '/' ? 809 : 1024;
      const sourceHeight = sourceWidth === 809 ? 1942 : 1536;
      const footerBoxes = {
        '/': [36,1813,184,1861],
        '/rotalar/': [48,1400,221,1452],
        '/rotalar/gocek-fethiye-gocek/': [49,1393,225,1447],
        '/filo/': [47,1400,239,1460],
        '/filo/eylul/': [39,1428,208,1478],
        '/deneyimler/': [45,1430,234,1487],
        '/hakkimizda/': [44,1412,237,1468],
        '/iletisim/': [33,1382,236,1447]
      };
      const footerPath = currentTemplatePath() === '/' ? '/' : currentTemplatePath().replace(/\/$/,'') + '/';
      const box = footerBoxes[footerPath] || footerBoxes['/rotalar/'];
      const footerRect = { left:box[0]/sourceWidth, top:box[1]/sourceHeight,
        width:(box[2]-box[0])/sourceWidth, height:(box[3]-box[1])/sourceHeight };
      const patch = positionedNode(layer, 'span', 'cms-brand-background cms-footer-background', document.body, footerRect);
      if (footerLogoLayer) footerLogoLayer.style.setProperty('visibility', 'hidden', 'important');
      const brand = positionedNode(layer, 'a', 'cms-brand-image cms-footer-image', document.body, footerRect);
      const paintFooterBackground = () => {
        const bounds = patch.node.getBoundingClientRect();
        const centerX = bounds.left + bounds.width/2, centerY = bounds.top + bounds.height/2;
        const source = [...document.querySelectorAll('.desktop-cms-section-stage img:not(.foreground), .desktop-source-art img, .canvas img.art, main > .art-section > img:not(.foreground)')]
          .find(img => { const r=img.getBoundingClientRect();return getComputedStyle(img).visibility !== 'hidden' && img.complete && img.naturalWidth && centerX>=r.left && centerX<r.right && centerY>=r.top && centerY<r.bottom; });
        if (!source || !bounds.width || !bounds.height) return;
        const r=source.getBoundingClientRect();
        const background = makeBackgroundPatch(source,{left:(bounds.left-r.left)/r.width,
          top:(bounds.top-r.top)/r.height,width:bounds.width/r.width,height:bounds.height/r.height});
        if (background) patch.node.style.backgroundImage=`url("${background}")`;
      };
      brand.node.href = home;
      brand.node.setAttribute('aria-label', 'Fora Sailing ana sayfa');
      const img = document.createElement('img');
      img.src = logo;
      img.alt = 'Fora Sailing';
      brand.node.append(img);
      const signatureRect = homeFooterSource
        ? { left: 0.80, top: 0.75, width: 0.17, height: 0.16 }
        : { left: 0.80, top: 0.76, width: 0.17, height: 0.19 };
      const signatureSource = homeFooterSource || footerBackgroundSource || footerSource;
      const signature = positionedNode(layer, 'a', 'cms-brand-signature', signatureSource, signatureRect);
      signature.node.href = 'https://mydijital.com.tr/';
      signature.node.target = '_blank';
      signature.node.rel = 'noopener noreferrer';
      signature.node.setAttribute('aria-label', 'MY Dijital');
      const signatureImage = document.createElement('img');
      signatureImage.src = myLogo;
      signatureImage.alt = 'MY Dijital';
      signature.node.append(signatureImage);
      positioned.push(patch.update, brand.update, paintFooterBackground, signature.update);
      window.addEventListener('fora:desktop-sections-stage', (event) => {
        const active = event.detail?.active === true;
        const anchor = event.detail?.footerAnchor;
        const visible = !active || Boolean(anchor);
        [patch.node, brand.node, signature.node].forEach(node => { node.style.display = visible ? '' : 'none'; });
        if (active && anchor) {
          const original = (homeFooterSource || footerBackgroundSource || footerSource).getBoundingClientRect();
          const bodyBounds = document.body.getBoundingClientRect();
          const footerStart = Number.isFinite(event.detail?.footerSourceRect?.y)
            ? event.detail.footerSourceRect.y
            : (original.top - bodyBounds.top) * sourceWidth / bodyBounds.width;
          const anchorBounds = anchor.getBoundingClientRect();
          const logicalHeight = anchorBounds.height * sourceWidth / anchorBounds.width;
          const localRect = { left:box[0]/sourceWidth, top:(box[1]-footerStart)/logicalHeight,
            width:(box[2]-box[0])/sourceWidth, height:(box[3]-box[1])/logicalHeight };
          patch.setSource(anchor, localRect);
          brand.setSource(anchor, localRect);
          const art = anchor.querySelector('img[src*="desktop-art-footer"],img[src$="/footer.png"]') || anchor;
          signature.setSource(art, signatureRect);
        } else if (!active) {
          patch.setSource(document.body, footerRect);
          brand.setSource(document.body, footerRect);
          signature.setSource(signatureSource, signatureRect);
        }
        paintFooterBackground();
      });
    }
    let updateFrame = 0;
    const updatePositions = () => {
      if (updateFrame) cancelAnimationFrame(updateFrame);
      updateFrame = requestAnimationFrame(() => {
        updateFrame = requestAnimationFrame(() => {
          updateFrame = 0;
          positioned.forEach((update) => update());
        });
      });
    };
    window.addEventListener('resize', updatePositions, { passive: true });
    window.addEventListener('scroll', updatePositions, { passive: true });
    sourceImages.forEach((img) => img.addEventListener('load', updatePositions, { once: true }));
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(updatePositions);
      observer.observe(document.body);
      [...new Set([headerSource, homeFooterSource, footerLogoLayer, footerBackgroundSource].filter(Boolean))].forEach((img) => observer.observe(img));
    }
    document.fonts?.ready.then(updatePositions);
    Promise.all(sourceImages.map((img) => typeof img.decode === 'function' ? img.decode().catch(() => undefined) : undefined)).then(updatePositions);
    window.addEventListener('load', updatePositions, { once: true });
    updatePositions();
  }

  function setupInquiryForms() {
    const dialog = document.createElement('dialog');
    dialog.className = 'cms-inquiry-dialog';
    dialog.setAttribute('aria-labelledby', 'cms-inquiry-title');
    const title = document.createElement('h2');
    title.id = 'cms-inquiry-title';
    title.textContent = 'Teklif talebinizi tamamlayın';
    const note = document.createElement('p');
    note.textContent = 'Talebinizi iletmek için ad, e-posta ve mesaj bilgilerinizi ekleyin.';
    const form = document.createElement('form');
    form.method = 'dialog';
    const controls = {};
    [['name','Adınız Soyadınız','text'],['email','E-posta adresiniz','email'],['phone','Telefon numaranız','tel'],['message','Mesajınız','textarea']].forEach(([name,label,type]) => {
      const wrapper = document.createElement('label');
      wrapper.textContent = label;
      const input = type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
      if (type !== 'textarea') input.type = type;
      input.name = name;
      input.required = ['name','email','message'].includes(name);
      input.autocomplete = name === 'name' ? 'name' : name === 'email' ? 'email' : name === 'phone' ? 'tel' : 'off';
      wrapper.append(input); form.append(wrapper); controls[name] = input;
    });
    const status = document.createElement('p');
    status.setAttribute('role','status');
    const actions = document.createElement('div');
    const submit = document.createElement('button'); submit.type = 'submit'; submit.textContent = 'Talebi gönder';
    const whatsapp = document.createElement('a'); whatsapp.hidden = true; whatsapp.target = '_blank'; whatsapp.rel = 'noopener noreferrer'; whatsapp.textContent = 'WhatsApp ile devam et';
    const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Kapat'; cancel.addEventListener('click', () => dialog.close());
    actions.append(submit, whatsapp, cancel); form.append(status, actions); dialog.append(title,note,form); document.body.append(dialog);

    const makePayload = (sourceForm) => {
      const source = new FormData(sourceForm);
      const detail = [...source.entries()].filter(([key,value]) => value !== '' && value instanceof File === false).map(([key,value]) => `${key}: ${String(value)}`).join('\n');
      return {
        name: controls.name.value.trim(), email: controls.email.value.trim(), phone: controls.phone.value.trim(),
        message: [controls.message.value.trim(), detail].filter(Boolean).join('\n\n'),
        startDate: source.get('start') || source.get('date') || source.get('startDate') || '',
        endDate: source.get('end') || source.get('endDate') || '',
        guests: source.get('guests') || source.get('guestCount') || '',
        routeId: source.get('routeId') || source.get('rota') || new URLSearchParams(location.search).get('rota') || '',
        guletId: source.get('guletId') || source.get('gulet') || new URLSearchParams(location.search).get('gulet') || ''
      };
    };
    let pendingForm = null;
    const nativePayload = (sourceForm) => {
      const values = new FormData(sourceForm);
      const get = (...names) => names.map((name) => values.get(name)).find((value) => typeof value === 'string' && value.trim())?.trim() || '';
      const key = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      const resolveEntity = (items, value) => (items || []).find(item => item.id === value
        || key(item.name || item.title || item.label) === key(value))?.id || value;
      const routeId = resolveEntity(currentContent?.routes, get('routeId','rota','route') || new URLSearchParams(location.search).get('rota') || '');
      const guletId = resolveEntity(currentContent?.gulets, get('guletId','gulet','boat') || new URLSearchParams(location.search).get('gulet') || '');
      return {name:get('name'),email:get('email'),phone:get('phone'),message:get('message') || 'Mavi yolculuk için teklif talebi.',routeId,guletId,startDate:get('start','date','startDate'),endDate:get('end','endDate'),guests:get('guests','guestCount')};
    };
    const sendNativeForm = async (sourceForm) => {
      if (!sourceForm.reportValidity()) return;
      const payload = nativePayload(sourceForm);
      let result = sourceForm.querySelector('[role="status"], .form-status, .form-note');
      if (!result) {
        result = document.createElement('p'); result.className = 'cms-form-result';
        result.setAttribute('role','status'); sourceForm.append(result);
      }
      result.classList.add('cms-form-result');result.setAttribute('role','status');
      const button = sourceForm.querySelector('[type="submit"]');
      const fallback = () => {
        const link = document.createElement('a');link.textContent = 'WhatsApp ile iletin';
        link.href = `https://wa.me/905496523538?text=${encodeURIComponent([payload.name,payload.email,payload.phone,payload.message,payload.routeId,payload.guletId].filter(Boolean).join('\n'))}`;
        link.target = '_blank';link.rel = 'noopener noreferrer';result.append(' ',link);
      };
      if (!apiUrl) { result.textContent = 'Talebinizi WhatsApp üzerinden iletebilirsiniz.';fallback();return; }
      if (sourceForm.dataset.cmsSending === 'true') return;
      sourceForm.dataset.cmsSending = 'true';
      if (button) {button.disabled = true;button.setAttribute('aria-busy','true');button.classList.add('cms-form-pending');}
      result.textContent = 'Talebiniz gönderiliyor…';
      try {
        const response = await fetch(new URL('/api/public/inquiries',apiUrl.origin),{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        if (response.status !== 201) throw new Error('inquiry failed');
        result.textContent = 'Talebiniz alındı. Ekibimiz sizinle iletişime geçecek.';
        result.dataset.state = 'success';
        if (typeof window.gtag === 'function') window.gtag('event','inquiry_success',{page_path:location.pathname});
      } catch { result.textContent = 'Talep iletilemedi. Lütfen yeniden deneyin veya WhatsApp üzerinden ulaşın.';result.dataset.state = 'error';fallback(); }
      finally {sourceForm.dataset.cmsSending = 'false';if(button){button.disabled = false;button.removeAttribute('aria-busy');button.classList.remove('cms-form-pending');}}
    };
    document.querySelectorAll('form').forEach((sourceForm) => {
      if (sourceForm === form || sourceForm.closest('dialog')) return;
      sourceForm.addEventListener('submit', (event) => {
        event.preventDefault(); event.stopImmediatePropagation();
        if (sourceForm.querySelector('[name="name"]') && sourceForm.querySelector('[name="email"]')) {
          void sendNativeForm(sourceForm);return;
        }
        pendingForm = sourceForm;
        const supplied = nativePayload(sourceForm);
        controls.name.value = supplied.name;controls.email.value = supplied.email;controls.phone.value = supplied.phone;
        controls.message.value = sourceForm.querySelector('[name="message"]')?.value || sourceForm.getAttribute('aria-label') || '';
        status.textContent = '';
        whatsapp.hidden = true;
        dialog.showModal();
      }, true);
    });
    const query = new URLSearchParams(location.search);
    const routeId = query.get('rota') || query.get('route');
    const guletId = query.get('gulet') || query.get('boat');
    const slug = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    [...document.querySelectorAll('form')].filter((sourceForm) => !sourceForm.closest('dialog')).forEach((sourceForm) => {
      const routeSelect = sourceForm.querySelector('select[name="route"],select[name="rota"]');
      if (routeSelect && routeId) {
        const match = [...routeSelect.options].find((option) => {
          const candidate = slug(option.value || option.textContent);
          const requested = slug(routeId);
          return candidate && option.value && candidate === requested || candidate && requested.startsWith(candidate) || requested && candidate.startsWith(requested);
        });
        if (match) { match.selected = true; routeSelect.dispatchEvent(new Event('change', { bubbles:true })); }
      }
      if (guletId && !sourceForm.querySelector('input[name="guletId"]')) {
        const boat = document.createElement('input'); boat.type = 'hidden'; boat.name = 'guletId'; boat.value = guletId; sourceForm.append(boat);
      }
      if (routeId && !sourceForm.querySelector('input[name="routeId"]')) {
        const route = document.createElement('input'); route.type = 'hidden'; route.name = 'routeId'; route.value = routeId; sourceForm.append(route);
      }
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!pendingForm || !form.reportValidity()) return;
      const payload = makePayload(pendingForm);
      if (apiUrl) {
        submit.disabled = true;
        status.textContent = 'Talebiniz gönderiliyor…';
        try {
          const response = await fetch(new URL('/api/public/inquiries', apiUrl.origin), {
            method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
          });
          if (response.status !== 201) throw new Error('inquiry failed');
          status.textContent = 'Talebiniz alındı. Ekibimiz sizinle iletişime geçecek.';
          submit.hidden = true;
          if (typeof window.gtag === 'function') window.gtag('event', 'inquiry_success', { page_path: location.pathname });
          return;
        } catch { status.textContent = 'Talep sunucuya iletilemedi. WhatsApp üzerinden devam edebilirsiniz.'; }
        finally { submit.disabled = false; }
      } else {
        status.textContent = 'Statik önizlemede form gönderimi etkin değil. Talebinizi WhatsApp üzerinden iletebilirsiniz.';
      }
      const message = [payload.name, payload.email, payload.phone, payload.message].filter(Boolean).join('\n');
      whatsapp.href = `https://wa.me/905496523538?text=${encodeURIComponent(message)}`;
      whatsapp.hidden = false;
    });
    dialog.addEventListener('close', () => { pendingForm = null; submit.hidden = false; });
  }

  function setupLocalImageRetry() {
    const attempted = new WeakSet();
    const retry = (node) => {
      if (!(node instanceof HTMLImageElement) || attempted.has(node) || !node.getAttribute('src')) return;
      const source = new URL(node.currentSrc || node.src, location.href);
      if (source.origin !== location.origin || !/^https?:$/.test(source.protocol)) return;
      attempted.add(node);
      source.searchParams.set('fora-retry', '20261014');
      node.src = source.href;
    };
    document.addEventListener('error', (event) => retry(event.target), true);
    document.querySelectorAll('img').forEach(node => {
      if (node.complete && !node.naturalWidth) retry(node);
    });
  }

  async function boot() {
    setupLocalImageRetry();
    overlayLayer = document.createElement('div');
    overlayLayer.className = 'cms-overlay-layer';
    overlayLayer.setAttribute('aria-hidden', 'true');
    document.body.append(overlayLayer);
    setupBrandLayer();
    setupInquiryForms();
    try { bindingConfig = await readJson(bindingsUrl); } catch { /* Semantic direct bindings still work. */ }
    await loadCopyLayerMappings();
    try {
      const snapshot = await readJson(fallbackUrl);
      baselineContent = snapshot?.content || snapshot;
    } catch { baselineContent = null; }
    if (bindingConfig.apiEndpoint) apiUrl = new URL(bindingConfig.apiEndpoint, location.href);
    // The CMS-hosted /site/ path is a live public view. Static previews outside
    // that mount keep using the bundled snapshot and make no failing API calls.
    if (!apiUrl && /(?:^|\/)site(?:\/|$)/.test(location.pathname)) {
      apiUrl = new URL('/api/public/content', location.origin);
    }
    if (previewRequested && window.parent !== window && apiUrl) {
      try {
        const session = await readJson(new URL('/api/admin/session', location.origin));
        if (session.authenticated === true) {
          const requestedPage = new URLSearchParams(location.search).get('cmsPage');
          if (requestedPage) {
            previewTemplatePath = normalizePath(location.pathname);
            try {
              const requestedUrl = new URL(requestedPage, new URL(siteBase, location.origin));
              if (requestedUrl.origin === location.origin) previewPagePath = normalizePath(requestedUrl.pathname);
            } catch { /* Ignore invalid editor-selected routes. */ }
          }
          if (!apiUrl) apiUrl = new URL('/api/public/content', location.origin);
          window.addEventListener('message', (event) => {
            if (event.origin !== location.origin || event.source !== window.parent || !event.data) return;
            if (event.data.type === 'FORA_CMS_PREVIEW') {
              if (applyContent({ content: event.data.content, revision: event.data.revision }, 'draft-preview')) {
                draftPreviewActive = true;
                document.documentElement.dataset.cmsSource = 'draft-preview';
              }
            } else if (event.data.type === 'FORA_CMS_PREVIEW_CLEAR') {
              draftPreviewActive = false;
              refresh();
            }
          });
          window.parent.postMessage({ type: 'FORA_CMS_PREVIEW_READY' }, location.origin);
        }
      } catch { /* Unauthenticated preview requests stay on published/static content. */ }
    }
    await window.ForaDesktopSections?.ready;
    await refresh();
    let layoutFrame = 0;
    const scheduleLayout = () => {
      if (layoutFrame) return;
      layoutFrame = requestAnimationFrame(() => { layoutFrame = 0; updateOverlayPositions(); });
    };
    window.addEventListener('scroll', scheduleLayout, { passive: true });
    window.addEventListener('resize', scheduleLayout, { passive: true });
    document.fonts?.ready.then(scheduleLayout);
    window.addEventListener('resize', (event) => {
      if (!event.isTrusted || !currentContent) return;
      appliedSectionSignature = '';
      applySectionOrder(currentContent, currentPagePath(), pageConfigFor(currentPagePath()));
    }, { passive: true });
    window.ForaCMS = Object.freeze({ refresh, get revision() { return currentRevision; }, get content() { return currentRenderedContent || currentContent; } });
    if (apiUrl) {
      window.setInterval(() => { if (!document.hidden) refresh(); }, 5000);
      window.addEventListener('focus', refresh);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
