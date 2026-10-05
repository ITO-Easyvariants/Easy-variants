/**
 * EasyVariants CMS loader
 * Hydrates [data-cms-key] from GET /api/content?page=
 * Draft preview: ?preview=draft (admin login required)
 */
(function () {
  'use strict';

  function isDraftPreview() {
    return new URLSearchParams(window.location.search).get('preview') === 'draft';
  }

  function isEditMode() {
    return new URLSearchParams(window.location.search).get('cms-edit') === '1';
  }

  function injectPreviewStyles() {
    if (document.getElementById('ez-cms-preview-styles')) return;
    const style = document.createElement('style');
    style.id = 'ez-cms-preview-styles';
    style.textContent = `
      #ez-cms-preview-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
        padding: 10px 16px;
        background: #3525cd;
        color: #fff;
        font-family: Manrope, Inter, system-ui, sans-serif;
        font-size: 0.875rem;
        font-weight: 600;
        box-shadow: 0 -4px 24px rgba(53, 37, 205, 0.25);
      }
      #ez-cms-preview-banner a {
        color: #fff;
        text-decoration: underline;
        font-weight: 700;
      }
      body.ez-cms-preview-active { padding-bottom: 48px; }
    `;
    document.head.appendChild(style);
  }

  function showPreviewBanner(isDraftPreview) {
    injectPreviewStyles();
    document.body.classList.add('ez-cms-preview-active');
    if (document.getElementById('ez-cms-preview-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'ez-cms-preview-banner';
    banner.setAttribute('role', 'status');

    const exitUrl = new URL(window.location.href);
    exitUrl.searchParams.delete('preview');

    const statusText = isDraftPreview
      ? 'Draft preview — not visible to visitors'
      : 'Preview mode — no draft saved (showing live content)';

    banner.innerHTML = `
      <span>${statusText}</span>
      <a href="${exitUrl.pathname}${exitUrl.search}${exitUrl.hash}">View live site</a>
      <a href="/admin/dashboard.html">Back to admin</a>
    `;
    document.body.appendChild(banner);
  }

  function applyText(el, value, key) {
    if (value == null) return;
    if (el.tagName === 'A' && key && key.endsWith('.href')) {
      el.setAttribute('href', String(value));
      return;
    }
    if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && key && key.includes('placeholder')) {
      el.setAttribute('placeholder', String(value));
      return;
    }
    el.textContent = String(value);
  }

  function applyImage(el, value) {
    if (!value || typeof value !== 'object') return;
    if (value.src) el.src = value.src;
    if (value.alt != null) el.alt = String(value.alt);
  }

  function isSvgSrc(src) {
    const s = String(src || '').split('?')[0].toLowerCase();
    return s.endsWith('.svg') || s.includes('image/svg');
  }

  function injectIconStyles() {
    if (document.getElementById('ez-cms-icon-styles')) return;
    const style = document.createElement('style');
    style.id = 'ez-cms-icon-styles';
    style.textContent = `
      .cms-icon-img {
        width: 1.5rem;
        height: 1.5rem;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        display: block;
        border: 0 !important;
        outline: none !important;
        box-shadow: none !important;
        background: transparent;
        transform: none !important;
        backface-visibility: visible;
        -webkit-backface-visibility: visible;
      }
      .cms-icon-img--glyph {
        width: 1.5rem;
        height: 1.5rem;
      }
      .cms-icon-svg {
        width: 1.5rem;
        height: 1.5rem;
        display: block;
        background-color: currentColor;
        -webkit-mask-repeat: no-repeat;
        mask-repeat: no-repeat;
        -webkit-mask-position: center;
        mask-position: center;
        -webkit-mask-size: contain;
        mask-size: contain;
      }
    `;
    document.head.appendChild(style);
  }

  function rememberIconDefaults(el) {
    if (el.dataset.cmsIconReady === '1') return;
    const ms = el.querySelector('.material-symbols-outlined');
    if (ms) {
      if (!el.dataset.cmsIconName) el.dataset.cmsIconName = ms.textContent.trim();
      if (!el.dataset.cmsIconClass) el.dataset.cmsIconClass = ms.className;
    }
    el.dataset.cmsIconReady = '1';
  }

  function cssMaskUrl(src) {
    const s = String(src || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `url("${s}")`;
  }

  function applyIcon(el, value) {
    if (!el || !value || typeof value !== 'object') return;
    injectIconStyles();
    rememberIconDefaults(el);

    const src = String(value.src || '').trim();
    const name = String(value.name || el.dataset.cmsIconName || '').trim();
    const spanClass = el.dataset.cmsIconClass || 'material-symbols-outlined';
    const uploadedSvg = Boolean(src) && isSvgSrc(src);
    const tintWithCurrentColor = el.hasAttribute('data-cms-icon-tint');

    el.classList.remove('cms-icon-host--raster');
    el.innerHTML = '';

    if (src) {
      if (uploadedSvg && tintWithCurrentColor) {
        const glyph = document.createElement('span');
        glyph.className = 'cms-icon-svg';
        glyph.setAttribute('aria-hidden', 'true');
        const mask = cssMaskUrl(src);
        glyph.style.webkitMaskImage = mask;
        glyph.style.maskImage = mask;
        el.appendChild(glyph);
        return;
      }
      const img = document.createElement('img');
      img.className = uploadedSvg ? 'cms-icon-img cms-icon-img--glyph' : 'cms-icon-img';
      img.src = src;
      img.alt = '';
      el.appendChild(img);
      return;
    }

    const span = document.createElement('span');
    span.className = spanClass;
    span.setAttribute('aria-hidden', 'true');
    span.textContent = name || 'imagesmode';
    el.appendChild(span);
  }

  function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  function applyVideo(container, value) {
    if (!value || typeof value !== 'object') return;
    const el = container.tagName === 'DIV' ? container.querySelector('video, iframe') : container;
    if (!el) return;
    const ytId = getYouTubeId(value.src);
    if (ytId) {
      if (el.tagName === 'IFRAME') {
        const expectedSrc = `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`;
        if (el.src !== expectedSrc) el.src = expectedSrc;
      } else {
        const iframe = document.createElement('iframe');
        iframe.className = el.className;
        iframe.id = el.id;
        iframe.src = `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`;
        iframe.title = 'Explainer video';
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.style.cssText = el.style.cssText;
        for (const attr of el.attributes) {
          if (attr.name.startsWith('data-')) {
            iframe.setAttribute(attr.name, attr.value);
          }
        }
        el.parentNode.replaceChild(iframe, el);
      }
    } else {
      if (el.tagName === 'IFRAME') {
        const video = document.createElement('video');
        video.className = el.className;
        video.id = el.id;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.setAttribute('playsinline', 'true');
        video.style.cssText = el.style.cssText;
        for (const attr of el.attributes) {
          if (attr.name.startsWith('data-')) {
            video.setAttribute(attr.name, attr.value);
          }
        }
        video.src = value.src;
        if (value.poster) video.poster = value.poster;
        el.parentNode.replaceChild(video, el);
        if (typeof video.load === 'function') video.load();
      } else {
        if (value.src) {
          el.src = value.src;
          if (typeof el.load === 'function') el.load();
        }
        if (value.poster) el.poster = value.poster;
        else el.removeAttribute('poster');
      }
    }
  }

  function applyBlock(el, block, key) {
    if (!block || !block.type) return;

    if (block.type === 'text') {
      applyText(el, block.value, key);
      return;
    }

    if (block.type === 'image' && el.tagName === 'IMG') {
      applyImage(el, block.value);
      return;
    }

    if (block.type === 'icon') {
      applyIcon(el, block.value);
      return;
    }

    if (block.type === 'video' && (el.tagName === 'VIDEO' || el.tagName === 'IFRAME' || el.tagName === 'DIV')) {
      applyVideo(el, block.value);
    }
  }

  function applyList(host, block, templateId) {
    if (!block || block.type !== 'list' || !Array.isArray(block.value)) return;
    const tpl = document.getElementById(templateId);
    if (!tpl || !('content' in tpl)) return;

    host.innerHTML = '';
    block.value.forEach((item) => {
      const node = tpl.content.cloneNode(true);
      node.querySelectorAll('[data-cms-field]').forEach((fieldEl) => {
        const field = fieldEl.getAttribute('data-cms-field');
        if (item && item[field] != null) {
          const val = item[field];
          if (fieldEl.tagName === 'IMG' && typeof val === 'object') applyImage(fieldEl, val);
          else fieldEl.textContent = String(val);
        }
      });
      host.appendChild(node);
    });
  }

  function applyBlocks(page, blocks) {
    if (!blocks || typeof blocks !== 'object') return;

    document.querySelectorAll('[data-cms-key]').forEach((el) => {
      const scope = el.getAttribute('data-cms-page') || page;
      if (scope !== page) return;

      const key = el.getAttribute('data-cms-key');
      if (!key) return;

      applyBlock(el, blocks[key], key);
    });

    document.querySelectorAll('[data-cms-list]').forEach((host) => {
      const scope = host.getAttribute('data-cms-page') || page;
      if (scope !== page) return;

      const key = host.getAttribute('data-cms-list');
      const templateId = host.getAttribute('data-cms-template');
      if (!key || !templateId) return;

      applyList(host, blocks[key], templateId);
    });
  }

  function sanitizeBlockKeys(blocks) {
    const out = {};
    for (const [key, block] of Object.entries(blocks || {})) {
      out[String(key).replace(/\uE000/g, '.')] = block;
    }
    return out;
  }

  async function fetchPageContent(page) {
    const preview = isDraftPreview();
    const edit = isEditMode();
    const token = localStorage.getItem('ev_admin_token');

    if ((preview || edit) && !token) return null;

    const useAdmin = preview || edit;
    const url = useAdmin
      ? `/api/admin/content?page=${encodeURIComponent(page)}&source=draft`
      : `/api/content?page=${encodeURIComponent(page)}`;

    const headers = {};
    if (useAdmin && token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { credentials: 'same-origin', headers });
    if (!res.ok) return null;
    return res.json();
  }

  async function loadCmsContent(page) {
    const preview = isDraftPreview();
    const edit = isEditMode();
    const token = localStorage.getItem('ev_admin_token');

    if ((preview || edit) && !token) {
      if (preview) {
        injectPreviewStyles();
        const banner = document.createElement('div');
        banner.id = 'ez-cms-preview-banner';
        banner.innerHTML =
          'Draft preview requires admin login. <a href="/admin/login.html">Log in</a> then reload this page.';
        document.body.appendChild(banner);
      }
      return null;
    }

    try {
      const extraPages = new Set();
      document.querySelectorAll('[data-cms-page]').forEach((el) => {
        const scope = el.getAttribute('data-cms-page');
        if (scope && scope !== page) extraPages.add(scope);
      });

      const data = await fetchPageContent(page);
      if (!data?.blocks) return null;

      const blocksByPage = { [page]: sanitizeBlockKeys(data.blocks) };
      applyBlocks(page, blocksByPage[page]);

      for (const extra of extraPages) {
        const extraData = await fetchPageContent(extra);
        if (extraData?.blocks) {
          blocksByPage[extra] = sanitizeBlockKeys(extraData.blocks);
          applyBlocks(extra, blocksByPage[extra]);
        }
      }

      if (preview && !edit) showPreviewBanner(Boolean(data.isDraftPreview));

      window.__EZ_CMS__ = {
        page,
        blocks: blocksByPage[page],
        blocksByPage,
        updatedAt: data.updatedAt || null,
        preview,
        edit,
        isDraftPreview: Boolean(data.isDraftPreview),
        hasDraft: Boolean(data.hasDraft),
      };
      document.dispatchEvent(new CustomEvent('ez-cms-loaded', { detail: window.__EZ_CMS__ }));
      return data;
    } catch {
      return null;
    }
  }

  window.__EZ_CMS_ICON__ = { apply: applyIcon, isSvg: isSvgSrc };

  function boot() {
    const page = document.body?.dataset?.cmsPage;
    if (page) loadCmsContent(page);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
