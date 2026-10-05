/**
 * Schema-driven CMS editor for the admin dashboard (Phase 3: media uploads).
 */
(function () {
  'use strict';

  const UPLOAD_ACCEPT = {
    image: 'image/jpeg,image/png,image/webp,image/gif',
    poster: 'image/jpeg,image/png,image/webp,image/gif',
    icon: 'image/svg+xml,image/png,image/jpeg,image/webp,image/gif,.svg,.png,.jpg,.jpeg,.webp,.gif',
    video: 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov',
  };

  const SECTION_HINTS = {
    'Header navigation': 'Top menu links and demo button',
    Hero: 'Large banner at the top of the homepage',
    'Meet EasyVariants': 'Video section — “Meet EasyVariants”',
    'Meet EasyVariants · Media': 'Explainer video file',
    'The Problem': '“The Design Bottleneck” section intro',
    'The Problem · Cards': 'Four rotating problem cards, including icons',
    'The EasyVariants Advantage': 'Benefits section intro',
    'Advantage · Cards': 'Four benefit cards, including icons',
    'Inside EasyVariants': 'Illustrator plugin section intro',
    'Inside EasyVariants · Features & CTA': 'Feature list and button',
    'Our Solution': 'Smart Automation section intro',
    'Our Solution · Stats': 'Three stat pills',
    'Our Solution · Feature cards': 'Four feature cards, including icons',
    Workflow: 'Workflow section intro',
    'Workflow · Steps': 'Five-step workflow cards',
    'Building Blocks': 'Variable system section heading',
    'Building Blocks · Intro': 'Intro copy, tab labels, and tab icons',
    'Building Blocks · Placement Zones': 'Placement Zones tab content',
    'Building Blocks · Color Blocks': 'Color Blocks tab content',
    'Building Blocks · Embroidery Zones': 'Embroidery Zones tab content',
    'Building Blocks · Dimensions': 'Dimensions tab content',
    'Building Blocks · Text': 'Text tab content',
    'Building Blocks · Treatments & Effects': 'Treatments tab content',
    'How EasyVariants Works': 'Four steps section heading',
    'How EasyVariants Works · Steps': 'Step tabs, tab icons, and body copy',
    'Craft That Scales': 'Craft section heading',
    'Craft That Scales · Copy': 'Craft tabs, tab icons, headings, and paragraphs',
    'Demo Videos': 'Demo videos section intro',
    'Demo Videos · YouTube list': 'YouTube videos in the carousel',
    'Where It Fits': 'Product types and use cases section intro',
    'Where It Fits · Product types': 'Six product category cards',
    'Where It Fits · Use cases': 'Seasonal, evergreen, and prototype cards',
    'Final CTA': 'Bottom call-to-action banner',
    Footer: 'Site footer text and contact card icons',
    'Footer · Menu links': 'Footer navigation links',
    'Footer · Social links': 'Social media links',
    'Page header': 'Contact page title area',
    'Contact form': 'Form headings, labels, and placeholders',
    'Info cards': 'Email, response time, demo, support cards',
    'Quick stats': 'Numbers shown on the contact page',
  };

  const FIELD_HINTS = {
    eyebrow: 'Small label shown above the main heading',
    href: 'Link target — e.g. contactus.html or #demos',
    'hero.image': 'Main image next to the hero headline',
    'demos.videos': 'YouTube video IDs for the homepage demo carousel',
  };

  function isSvgSrc(src) {
    const s = String(src || '').split('?')[0].toLowerCase();
    return s.endsWith('.svg') || s.includes('image/svg');
  }

  function sectionSlug(name) {
    return `cms-section-${name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}`;
  }

  function sectionDisplayName(name) {
    return name.split(' · ')[0];
  }

  function fieldHint(field) {
    if (FIELD_HINTS[field.key]) return FIELD_HINTS[field.key];
    if (field.key.endsWith('.href')) return FIELD_HINTS.href;
    if (field.key.includes('.eyebrow')) return FIELD_HINTS.eyebrow;
    return '';
  }

  function appendFieldHint(wrap, field) {
    const hint = fieldHint(field);
    if (hint) wrap.appendChild(el('p', 'cms-field-hint', hint));
  }

  function blockText(blocks, key, fallback) {
    const b = blocks?.[key];
    if (b?.type === 'text' && b.value != null) return b.value;
    return fallback ?? '';
  }

  function blockImage(blocks, key, fallback) {
    const b = blocks?.[key];
    if (b?.type === 'image' && b.value?.src) return b.value;
    return fallback ?? { src: '', alt: '' };
  }

  function blockVideo(blocks, key, fallback) {
    const b = blocks?.[key];
    if (b?.type === 'video' && b.value?.src) return b.value;
    return fallback ?? { src: '', poster: '' };
  }

  function blockIcon(blocks, key, fallback) {
    const b = blocks?.[key];
    if (b?.type === 'icon' && b.value && (b.value.src || b.value.name)) return b.value;
    return fallback ?? { src: '', name: '', color: '' };
  }

  function blockList(blocks, key, fallback) {
    const b = blocks?.[key];
    if (b?.type === 'list' && Array.isArray(b.value)) return b.value;
    return fallback ?? [];
  }

  function fieldDefault(field) {
    if (field.default !== undefined) return field.default;
    if (field.type === 'image') return { src: '', alt: '' };
    if (field.type === 'video') return { src: '', poster: '' };
    if (field.type === 'icon') return { src: '', name: '', color: '' };
    if (field.type === 'list') return [];
    return '';
  }

  function readFieldValue(blocks, field) {
    const key = field.key;
    if (field.type === 'image') return blockImage(blocks, key, fieldDefault(field));
    if (field.type === 'video') return blockVideo(blocks, key, fieldDefault(field));
    if (field.type === 'icon') return blockIcon(blocks, key, fieldDefault(field));
    if (field.type === 'list') return blockList(blocks, key, fieldDefault(field));
    return blockText(blocks, key, fieldDefault(field));
  }

  function buildBlockFromField(field, raw) {
    if (field.type === 'image') {
      return {
        type: 'image',
        value: {
          src: String(raw.src || '').trim(),
          alt: String(raw.alt || '').trim(),
        },
      };
    }
    if (field.type === 'video') {
      return {
        type: 'video',
        value: {
          src: String(raw.src || '').trim(),
          poster: String(raw.poster || '').trim(),
        },
      };
    }
    if (field.type === 'icon') {
      return {
        type: 'icon',
        value: {
          src: String(raw.src || '').trim(),
          name: String(raw.name || '').trim(),
          color: '',
        },
      };
    }
    if (field.type === 'list') {
      return { type: 'list', value: raw };
    }
    return { type: 'text', value: String(raw || '').trim() };
  }

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
  }

  async function uploadMediaFile(file, kind) {
    const token = localStorage.getItem('ev_admin_token');
    if (!token) throw new Error('Not authenticated. Please log in again.');

    const authHeaders = { Authorization: `Bearer ${token}` };
    const meta = {
      action: 'prepare',
      kind,
      filename: file.name || 'upload',
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
    };

    const prepareRes = await fetch('/api/admin/media', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(meta),
    });
    const prepare = await prepareRes.json();
    if (!prepareRes.ok) throw new Error(prepare.error || 'Upload prepare failed.');

    // Local development without R2: proxy bytes through the API to disk.
    if (prepare.mode === 'proxy') {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('kind', kind);
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: authHeaders,
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      return data;
    }

    const putHeaders = { ...(prepare.headers || {}) };
    let putRes;
    try {
      putRes = await fetch(prepare.uploadUrl, {
        method: 'PUT',
        headers: putHeaders,
        body: file,
      });
    } catch {
      throw new Error(
        'Cloudflare R2 blocked the upload. In the R2 bucket CORS policy, allow this website origin with PUT and the Content-Type and Cache-Control headers.'
      );
    }
    if (!putRes.ok) {
      throw new Error(`Cloudflare R2 upload failed (${putRes.status}). Check bucket CORS and credentials.`);
    }

    const finalizeRes = await fetch('/api/admin/media', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'finalize',
        kind,
        filename: file.name || 'upload',
        mimeType: prepare.mime || file.type || 'application/octet-stream',
        size: file.size,
        objectKey: prepare.objectKey,
      }),
    });
    const data = await finalizeRes.json();
    if (!finalizeRes.ok) throw new Error(data.error || 'Upload finalize failed.');
    return data;
  }

  function createUploadControl({ label, accept, kind, hint, onUploaded }) {
    const row = el('div', 'cms-upload-row');
    const picker = el('div', 'cms-file-picker');

    const btn = document.createElement('label');
    btn.className = 'cms-file-picker__btn';
    btn.textContent = label || 'Choose file';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = accept;
    fileInput.className = 'cms-file-picker__input';
    btn.appendChild(fileInput);

    const nameSpan = el('span', 'cms-file-picker__name', 'No file chosen');
    const status = el('span', 'cms-upload-status', hint || '');

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) {
        nameSpan.textContent = 'No file chosen';
        return;
      }

      nameSpan.textContent = file.name;
      fileInput.value = '';
      btn.classList.add('is-disabled');
      status.textContent = 'Uploading…';
      status.classList.remove('cms-upload-status--error');

      try {
        const result = await uploadMediaFile(file, kind);
        status.textContent = `Uploaded (${Math.round(result.size / 1024)} KB)`;
        onUploaded(result);
        document.dispatchEvent(
          new CustomEvent('ez-cms-toast', {
            detail: { message: 'File uploaded successfully.', type: 'success' },
          })
        );
      } catch (err) {
        status.textContent = err.message || 'Upload failed.';
        status.classList.add('cms-upload-status--error');
        document.dispatchEvent(
          new CustomEvent('ez-cms-toast', {
            detail: { message: err.message || 'Upload failed.', type: 'error' },
          })
        );
      } finally {
        btn.classList.remove('is-disabled');
      }
    });

    picker.appendChild(btn);
    picker.appendChild(nameSpan);
    row.appendChild(picker);
    row.appendChild(status);
    return row;
  }

  function renderTextField(field, value) {
    const wrap = el('div', 'cms-field');
    const id = `cms-${field.key.replace(/[^a-z0-9]+/gi, '-')}`;
    const label = el('label', '', field.label);
    label.setAttribute('for', id);

    let input;
    if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.value = value;
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.value = value;
    }
    input.id = id;
    input.name = field.key;
    input.dataset.cmsKey = field.key;
    input.dataset.cmsType = 'text';
    input.required = true;

    wrap.appendChild(label);
    appendFieldHint(wrap, field);
    wrap.appendChild(input);
    return wrap;
  }

  function renderImageField(field, value) {
    const wrap = el('div', 'cms-field cms-field--image');
    wrap.dataset.cmsKey = field.key;
    wrap.dataset.cmsType = 'image';

    wrap.appendChild(el('label', '', field.label));

    const altId = `cms-alt-${field.key.replace(/[^a-z0-9]+/gi, '-')}`;

    const srcInput = document.createElement('input');
    srcInput.type = 'hidden';
    srcInput.value = value.src || '';
    srcInput.required = true;
    srcInput.dataset.cmsPart = 'src';

    const altLabel = el('label', 'cms-sublabel', 'Alt text');
    altLabel.setAttribute('for', altId);
    const altInput = document.createElement('input');
    altInput.type = 'text';
    altInput.id = altId;
    altInput.value = value.alt || '';
    altInput.dataset.cmsPart = 'alt';

    const preview = el('img', 'cms-preview');
    preview.alt = '';

    const syncPreview = () => {
      const src = srcInput.value.trim();
      if (!src) {
        preview.hidden = true;
        preview.removeAttribute('src');
        return;
      }
      preview.src = src;
      preview.alt = altInput.value.trim();
      preview.hidden = false;
    };

    altInput.addEventListener('input', syncPreview);
    syncPreview();

    wrap.appendChild(
      createUploadControl({
        label: 'Choose file',
        accept: UPLOAD_ACCEPT.image,
        kind: 'image',
        hint: 'JPEG, PNG, WebP, GIF · Max 5 MB',
        onUploaded: (result) => {
          srcInput.value = result.src;
          syncPreview();
        },
      })
    );

    wrap.appendChild(srcInput);
    wrap.appendChild(altLabel);
    wrap.appendChild(altInput);
    wrap.appendChild(preview);
    return wrap;
  }

  function renderVideoField(field, value) {
    const wrap = el('div', 'cms-field cms-field--video');
    wrap.dataset.cmsKey = field.key;
    wrap.dataset.cmsType = 'video';

    wrap.appendChild(el('label', '', field.label));

    const srcInput = document.createElement('input');
    srcInput.type = 'hidden';
    srcInput.value = value.src || '';
    srcInput.required = true;
    srcInput.dataset.cmsPart = 'src';

    const posterInput = document.createElement('input');
    posterInput.type = 'hidden';
    posterInput.value = value.poster || '';
    posterInput.dataset.cmsPart = 'poster';

    const videoPreview = document.createElement('video');
    videoPreview.className = 'cms-preview cms-preview--video';
    videoPreview.controls = true;
    videoPreview.muted = true;
    videoPreview.hidden = true;

    const posterPreview = el('img', 'cms-preview cms-preview--poster');
    posterPreview.alt = 'Video poster preview';
    posterPreview.hidden = true;

    const syncPreview = () => {
      const src = srcInput.value.trim();
      const poster = posterInput.value.trim();

      if (src) {
        videoPreview.src = src;
        if (poster) videoPreview.poster = poster;
        videoPreview.hidden = false;
      } else {
        videoPreview.removeAttribute('src');
        videoPreview.hidden = true;
      }

      if (poster) {
        posterPreview.src = poster;
        posterPreview.hidden = false;
      } else {
        posterPreview.hidden = true;
        posterPreview.removeAttribute('src');
      }
    };

    syncPreview();

    wrap.appendChild(el('p', 'cms-sublabel', 'Change this video'));
    wrap.appendChild(
      createUploadControl({
        label: 'Choose file',
        accept: UPLOAD_ACCEPT.video,
        kind: 'video',
        hint: 'MP4, WebM, MOV · Max 50 MB',
        onUploaded: (result) => {
          srcInput.value = result.src;
          syncPreview();
        },
      })
    );

    wrap.appendChild(el('p', 'cms-sublabel', 'Change poster image (optional)'));
    wrap.appendChild(
      createUploadControl({
        label: 'Choose file',
        accept: UPLOAD_ACCEPT.poster,
        kind: 'poster',
        hint: 'JPEG, PNG, WebP, GIF · Max 5 MB',
        onUploaded: (result) => {
          posterInput.value = result.src;
          syncPreview();
        },
      })
    );

    wrap.appendChild(srcInput);
    wrap.appendChild(posterInput);
    wrap.appendChild(videoPreview);
    wrap.appendChild(posterPreview);
    return wrap;
  }

  function renderIconField(field, value) {
    const wrap = el('div', 'cms-field cms-field--icon');
    wrap.dataset.cmsKey = field.key;
    wrap.dataset.cmsType = 'icon';

    wrap.appendChild(el('label', '', field.label));
    wrap.appendChild(
      el('p', 'cms-field-hint', 'Choose an SVG, PNG, or JPEG. The file is shown as uploaded.')
    );

    const srcInput = document.createElement('input');
    srcInput.type = 'hidden';
    srcInput.value = value.src || '';
    srcInput.dataset.cmsPart = 'src';

    const nameInput = document.createElement('input');
    nameInput.type = 'hidden';
    nameInput.dataset.cmsPart = 'name';
    nameInput.value = value.name || '';

    const fileStatus = el('p', 'cms-upload-status', value.src ? 'Custom file selected' : 'Using default icon');
    const preview = el('div', 'cms-icon-preview');

    const syncPreview = () => {
      const src = srcInput.value.trim();
      const name = nameInput.value.trim();
      fileStatus.textContent = src ? 'Custom file selected' : 'Using default icon';
      preview.innerHTML = '';
      preview.classList.remove('cms-icon-preview--raster');

      if (src) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        preview.appendChild(img);
        return;
      }

      const span = document.createElement('span');
      span.className = 'material-symbols-outlined';
      span.textContent = name || 'imagesmode';
      preview.appendChild(span);
    };

    wrap.appendChild(el('p', 'cms-sublabel', 'Change this icon'));
    wrap.appendChild(
      createUploadControl({
        label: 'Choose file',
        accept: UPLOAD_ACCEPT.icon,
        kind: 'icon',
        hint: 'SVG, PNG, JPEG, WebP, GIF · Max 5 MB',
        onUploaded: (result) => {
          srcInput.value = result.src || '';
          syncPreview();
        },
      })
    );

    const resetBtn = el('button', 'clear-filters cms-icon-reset', 'Use default icon');
    resetBtn.type = 'button';
    resetBtn.addEventListener('click', () => {
      srcInput.value = '';
      syncPreview();
    });

    wrap.appendChild(srcInput);
    wrap.appendChild(nameInput);
    wrap.appendChild(fileStatus);
    wrap.appendChild(resetBtn);
    wrap.appendChild(preview);
    syncPreview();
    return wrap;
  }

  function renderListField(field, items) {
    const wrap = el('div', 'cms-field cms-field--list');
    wrap.dataset.cmsKey = field.key;
    wrap.dataset.cmsType = 'list';

    wrap.appendChild(el('label', '', field.label));
    const listHost = el('div', 'cms-list-items');
    wrap.appendChild(listHost);

    items.forEach((item, index) => {
      const card = el('div', 'cms-list-item');
      card.appendChild(el('p', 'cms-list-item__title', `${field.listItemLabel || 'Item'} ${index + 1}`));

      field.itemFields.forEach((sub) => {
        const subWrap = el('div', 'cms-field cms-field--nested');
        const subId = `cms-${field.key}-${index}-${sub.key}`.replace(/[^a-z0-9]+/gi, '-');
        const subLabel = el('label', '', sub.label);
        subLabel.setAttribute('for', subId);
        const input = document.createElement('input');
        input.type = 'text';
        input.id = subId;
        input.value = item[sub.key] || '';
        input.required = true;
        input.dataset.listIndex = String(index);
        input.dataset.listSubKey = sub.key;
        subWrap.appendChild(subLabel);
        subWrap.appendChild(input);
        card.appendChild(subWrap);
      });

      listHost.appendChild(card);
    });

    return wrap;
  }

  function renderField(field, blocks) {
    const value = readFieldValue(blocks, field);
    if (field.type === 'image') return renderImageField(field, value);
    if (field.type === 'video') return renderVideoField(field, value);
    if (field.type === 'icon') return renderIconField(field, value);
    if (field.type === 'list') return renderListField(field, value);
    return renderTextField(field, value);
  }

  function collectBlocksFromForm(form, schemaSections) {
    const blocks = {};
    for (const section of schemaSections) {
      for (const field of section.fields) {
        if (field.type === 'image' || field.type === 'video' || field.type === 'icon') {
          const wrap = form.querySelector(`[data-cms-key="${field.key}"]`);
          if (!wrap) continue;
          const src = wrap.querySelector('[data-cms-part="src"]')?.value || '';
          const raw = { src };
          if (field.type === 'image') {
            raw.alt = wrap.querySelector('[data-cms-part="alt"]')?.value || '';
          } else if (field.type === 'video') {
            raw.poster = wrap.querySelector('[data-cms-part="poster"]')?.value || '';
          } else {
            raw.name = wrap.querySelector('[data-cms-part="name"]')?.value || '';
            raw.color = '';
          }
          blocks[field.key] = buildBlockFromField(field, raw);
        } else if (field.type === 'list') {
          const wrap = form.querySelector(`[data-cms-key="${field.key}"]`);
          if (!wrap) continue;
          const inputs = wrap.querySelectorAll('[data-list-index]');
          const map = new Map();
          inputs.forEach((input) => {
            const idx = Number(input.dataset.listIndex);
            const subKey = input.dataset.listSubKey;
            if (!map.has(idx)) map.set(idx, {});
            map.get(idx)[subKey] = input.value.trim();
          });
          blocks[field.key] = buildBlockFromField(
            field,
            Array.from(map.entries())
              .sort((a, b) => a[0] - b[0])
              .map(([, v]) => v)
          );
        } else {
          const input = form.querySelector(`[data-cms-key="${field.key}"]`);
          if (!input) continue;
          blocks[field.key] = buildBlockFromField(field, input.value);
        }
      }
    }
    return blocks;
  }

  function renderEditor(container, page, schema, blocks) {
    container.innerHTML = '';
    const form = el('form', 'cms-form');
    form.id = 'cmsEditorForm';

    const toolbar = el('div', 'cms-toolbar');
    toolbar.innerHTML = `
      <div class="cms-actions">
        <button class="refresh" type="submit" id="cmsPublishBtn">
          <span class="material-symbols-outlined" style="font-size:18px;">publish</span>
          Publish live
        </button>
        <button class="clear-filters" type="button" id="cmsDraftBtn">
          <span class="material-symbols-outlined" style="font-size:18px;">draft</span>
          Save draft
        </button>
        <a class="clear-filters" id="cmsPreviewDraftLink" href="#" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">
          <span class="material-symbols-outlined" style="font-size:18px;">visibility</span>
          Preview draft
        </a>
        <button class="clear-filters" type="button" id="cmsReloadBtn">
          <span class="material-symbols-outlined" style="font-size:18px;">refresh</span>
          Reload
        </button>
        <button class="clear-filters" type="button" id="cmsUndoPublishBtn">
          <span class="material-symbols-outlined" style="font-size:18px;">undo</span>
          Undo last publish
        </button>
        <a class="clear-filters" id="cmsViewSiteLink" href="/" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">
          <span class="material-symbols-outlined" style="font-size:18px;">open_in_new</span>
          View live site
        </a>
      </div>
      <p class="cms-meta" id="cmsMeta"></p>
    `;
    form.appendChild(toolbar);

    const sectionNav = el('div', 'cms-section-nav');
    sectionNav.id = 'cmsSectionNav';
    form.appendChild(sectionNav);

    const tools = el('div', 'cms-section-tools');
    tools.innerHTML = `
      <input type="search" class="cms-field-search" id="cmsFieldSearch" placeholder="Search fields…" aria-label="Search content fields" />
      <button type="button" id="cmsExpandAll">Expand all</button>
      <button type="button" id="cmsCollapseAll">Collapse all</button>
    `;
    form.appendChild(tools);

    const sectionsHost = el('div', 'cms-sections');
    sectionsHost.id = 'cmsSectionsHost';

    const sections = schema[page] || [];
    sections.forEach((section, index) => {
      const details = document.createElement('details');
      details.className = 'cms-section';
      details.id = sectionSlug(section.section);
      if (index === 0) details.open = true;

      const summary = document.createElement('summary');
      const hint = SECTION_HINTS[section.section] || '';
      const count = section.fields.length;
      summary.innerHTML = `
        <span class="cms-section-name">${sectionDisplayName(section.section)}</span>
        ${hint ? `<span class="cms-section-hint">${hint}</span>` : ''}
        <span class="cms-section-count">${count} field${count === 1 ? '' : 's'}</span>
      `;
      details.appendChild(summary);

      const body = el('div', 'cms-section-body');
      for (const field of section.fields) {
        body.appendChild(renderField(field, blocks));
      }
      details.appendChild(body);
      sectionsHost.appendChild(details);

      const navBtn = document.createElement('button');
      navBtn.type = 'button';
      navBtn.textContent = sectionDisplayName(section.section);
      navBtn.addEventListener('click', () => {
        details.open = true;
        details.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      sectionNav.appendChild(navBtn);
    });

    form.appendChild(sectionsHost);

    form.appendChild(el('footer', 'cms-editor-footer', ''));
    form.querySelector('.cms-editor-footer').id = 'cmsEditorFooter';

    const searchInput = form.querySelector('#cmsFieldSearch');
    searchInput?.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      form.querySelectorAll('.cms-section').forEach((section) => {
        let visible = 0;
        section.querySelectorAll('.cms-field').forEach((field) => {
          const text = field.textContent?.toLowerCase() || '';
          const match = !q || text.includes(q);
          field.classList.toggle('is-hidden', !match);
          if (match) visible += 1;
        });
        section.classList.toggle('is-hidden', q.length > 0 && visible === 0);
        if (q.length > 0 && visible > 0) section.open = true;
      });
    });

    form.querySelector('#cmsExpandAll')?.addEventListener('click', () => {
      form.querySelectorAll('.cms-section').forEach((s) => {
        s.open = true;
      });
    });

    form.querySelector('#cmsCollapseAll')?.addEventListener('click', () => {
      form.querySelectorAll('.cms-section').forEach((s) => {
        s.open = false;
      });
    });

    container.appendChild(form);
    return form;
  }

  window.EzCmsEditor = {
    renderEditor,
    collectBlocksFromForm,
    readFieldValue,
    uploadMediaFile,
  };
})();
