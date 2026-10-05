/**
 * EasyVariants visual edit mode.
 * Activated by ?cms-edit=1 on a public page when the admin is logged in.
 * Lets admins click text/images on the real site, edit, then Save draft / Publish live.
 */
(function () {
  'use strict';

  const TOKEN_KEY = 'ev_admin_token';

  const SECTION_LABELS = {
    header: 'Top navigation',
    hero: 'Hero',
    meet: 'Meet EasyVariants',
    problem: 'The Problem',
    advantage: 'Advantage',
    inside: 'Inside EasyVariants',
    solution: 'Our Solution',
    workflow: 'Workflow',
    craft: 'Craft That Scales',
    buildingblocks: 'Building Blocks',
    deepdive: 'Platform Deep Dive',
    demos: 'Demo Videos',
    fits: 'Where It Fits',
    cta: 'Final CTA',
    footer: 'Footer',
    contact: 'Contact page',
  };

  const KEY_LABELS = {
    'header.cta.label': 'Nav demo button',
    'header.cta.href': 'Nav demo button link',
    'hero.eyebrow': 'Hero eyebrow',
    'hero.title.line1': 'Hero headline (line 1)',
    'hero.title.line2': 'Hero headline (line 2)',
    'hero.description': 'Hero description',
    'hero.cta.primary.label': 'Hero primary button',
    'hero.cta.primary.href': 'Hero primary button link',
    'hero.cta.secondary.label': 'Hero secondary button',
    'hero.cta.secondary.href': 'Hero secondary button link',
    'hero.image': 'Hero image',
  };

  function hasAdminToken() {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  }

  function isEditModeUrl() {
    return new URLSearchParams(window.location.search).get('cms-edit') === '1';
  }

  function buildEditUrl(page) {
    const url = page === 'contact' ? '/contactus.html' : '/';
    return `${url}?cms-edit=1`;
  }

  function buildPreviewUrl(page) {
    const url = page === 'contact' ? '/contactus.html' : '/';
    return `${url}?preview=draft`;
  }

  function buildExitUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete('cms-edit');
    return url.pathname + (url.search || '') + (url.hash || '');
  }

  function humanLabel(key, page) {
    const p = page || state.page;
    const fromSchema = state.fieldLabels[p]?.[key];
    if (fromSchema) return fromSchema;
    if (KEY_LABELS[key]) return KEY_LABELS[key];
    const [root] = key.split('.');
    const section = SECTION_LABELS[root] || root;
    const rest = key
      .split('.')
      .slice(1)
      .map((part) => part.replace(/-/g, ' '))
      .join(' · ');
    return rest ? `${section} · ${rest}` : section;
  }

  function injectStyles() {
    if (document.getElementById('ez-cms-edit-styles')) return;
    const style = document.createElement('style');
    style.id = 'ez-cms-edit-styles';
    style.textContent = `
      body.ez-cms-edit-mode { padding-top: 48px; }
      body.ez-cms-edit-mode nav.fixed { top: 48px !important; }

      #ez-cms-edit-bar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 10px 20px;
        background: linear-gradient(180deg, #1a1259 0%, #3525cd 100%);
        color: #fff;
        font-family: Manrope, Inter, system-ui, sans-serif;
        font-size: 0.875rem;
        box-shadow: 0 4px 24px rgba(15, 12, 41, 0.25);
        flex-wrap: wrap;
      }
      #ez-cms-edit-bar .ez-edit-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 700;
      }
      #ez-cms-edit-bar .ez-edit-page-picker {
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 999px;
        color: #fff;
        font: inherit;
        font-weight: 600;
        padding: 4px 10px;
        cursor: pointer;
      }
      #ez-cms-edit-bar .ez-edit-page-picker option { color: #1a1259; }
      #ez-cms-edit-bar .ez-edit-status {
        font-size: 0.8125rem;
        color: rgba(255, 255, 255, 0.85);
      }
      #ez-cms-edit-bar .ez-edit-status strong { color: #ffd966; }
      #ez-cms-edit-bar .ez-edit-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .ez-edit-btn {
        border: none;
        border-radius: 999px;
        padding: 7px 14px;
        font: inherit;
        font-weight: 700;
        font-size: 0.8125rem;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        line-height: 1;
      }
      .ez-edit-btn--primary { background: #ffd966; color: #1a1259; }
      .ez-edit-btn--primary:disabled { background: rgba(255, 217, 102, 0.4); cursor: not-allowed; }
      .ez-edit-btn--ghost {
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.25);
      }
      .ez-edit-btn--ghost:hover { background: rgba(255, 255, 255, 0.25); }
      .ez-edit-btn--exit {
        background: transparent;
        color: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.35);
      }

      body.ez-cms-edit-mode [data-cms-key] {
        position: relative;
        outline: 1px dashed rgba(53, 37, 205, 0.0);
        outline-offset: 4px;
        transition: outline-color 0.15s ease;
        cursor: pointer;
      }
      body.ez-cms-edit-mode [data-cms-key]:hover {
        outline-color: rgba(53, 37, 205, 0.55);
      }
      body.ez-cms-edit-mode [data-cms-key][data-ez-dirty="1"] {
        outline: 2px solid #ffd966;
        outline-offset: 4px;
      }
      body.ez-cms-edit-mode [data-cms-icon],
      body.ez-cms-edit-mode [data-cms-icon]:hover,
      body.ez-cms-edit-mode [data-cms-icon][data-ez-dirty="1"],
      body.ez-cms-edit-mode [data-cms-icon][data-ez-editing="1"] {
        outline: none !important;
        outline-offset: 0;
      }
      body.ez-cms-edit-mode [data-cms-icon]:hover {
        box-shadow: 0 0 0 2px rgba(53, 37, 205, 0.28);
        border-radius: 0.5rem;
      }
      body.ez-cms-edit-mode [data-cms-key][data-ez-editing="1"] {
        outline: 2px solid #3525cd;
        outline-offset: 4px;
        cursor: text;
      }
      body.ez-cms-edit-mode [contenteditable="true"] {
        cursor: text;
        outline: none;
        caret-color: currentColor;
      }
      body.ez-cms-edit-mode [data-cms-key][data-cms-label]:hover::before,
      body.ez-cms-edit-mode [data-cms-key][data-ez-editing="1"][data-cms-label]::before {
        content: attr(data-cms-label);
        position: absolute;
        left: 0;
        top: -1.35rem;
        z-index: 20;
        background: #3525cd;
        color: #fff;
        font-family: Manrope, Inter, system-ui, sans-serif;
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        line-height: 1;
        padding: 0.28rem 0.45rem;
        border-radius: 999px;
        white-space: nowrap;
        pointer-events: none;
        max-width: min(70vw, 280px);
        overflow: hidden;
        text-overflow: ellipsis;
      }
      body.ez-cms-edit-mode a[data-cms-key]:not([data-ez-editing="1"]) {
        pointer-events: auto;
      }

      .ez-edit-popover {
        position: fixed;
        z-index: 100000;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 16px 48px rgba(15, 12, 41, 0.25);
        padding: 14px;
        min-width: 320px;
        max-width: 360px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        font-family: Manrope, Inter, system-ui, sans-serif;
        font-size: 0.875rem;
        color: #1a1c1d;
      }
      .ez-edit-popover h4 {
        margin: 0 0 10px;
        font-size: 0.8125rem;
        color: #3525cd;
        font-weight: 700;
      }
      .ez-edit-popover label:not(.ez-file-picker__btn) {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        color: #464555;
        margin: 8px 0 4px;
      }
      .ez-edit-popover input:not([type="file"]):not([type="hidden"]):not([type="color"]),
      .ez-edit-popover textarea {
        width: 100%;
        font: inherit;
        padding: 8px 10px;
        border: 1px solid rgba(199, 196, 216, 0.6);
        border-radius: 8px;
        color: #1a1c1d;
      }
      .ez-edit-popover textarea { min-height: 80px; resize: vertical; }

      .ez-file-picker {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        margin: 4px 0 10px;
      }
      .ez-edit-popover label.ez-file-picker__btn,
      .ez-file-picker__btn {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
        padding: 8px 16px;
        border-radius: 999px;
        border: 1px solid #3525cd;
        background: #3525cd;
        color: #fff;
        -webkit-text-fill-color: #fff;
        font-size: 0.8125rem;
        font-weight: 700;
        cursor: pointer;
        overflow: hidden;
        margin: 0;
      }
      .ez-file-picker input[type="file"] {
        position: absolute;
        inset: 0;
        opacity: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        border: 0;
        cursor: pointer;
        font-size: 0;
        background: transparent;
      }
      .ez-file-picker input[type="file"]::file-selector-button {
        display: none;
      }
      .ez-file-picker__name {
        font-size: 0.8125rem;
        color: #6b7280;
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ez-edit-popover .ez-edit-popover-actions {
        display: flex;
        gap: 6px;
        margin-top: auto;
        padding-top: 8px;
        border-top: 1px solid rgba(199, 196, 216, 0.3);
        flex-wrap: wrap;
        flex-shrink: 0;
      }
      .ez-edit-popover .ez-edit-popover-actions button {
        border: none;
        padding: 6px 12px;
        border-radius: 999px;
        font: inherit;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
      }
      .ez-edit-popover .primary { background: #3525cd; color: #fff; }
      .ez-edit-popover .ghost { background: #f3f2f8; color: #464555; }

      .ez-edit-popover-scroll-body {
        max-height: 45vh;
        overflow-y: auto;
        padding-right: 4px;
        margin-bottom: 8px;
      }
      .ez-list-item-edit-card {
        border: 1px solid rgba(199, 196, 216, 0.4);
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 8px;
        background: #fcfbfe;
      }
      .ez-list-item-edit-card-title {
        font-weight: 700;
        font-size: 0.75rem;
        color: #3525cd;
        margin: 0 0 6px;
      }

      body.ez-cms-edit-mode [data-cms-key="meet.video"]::after,
      body.ez-cms-edit-mode [data-cms-key="demos.videos"]::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 99;
        background: rgba(53, 37, 205, 0.03);
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      body.ez-cms-edit-mode [data-cms-key="meet.video"]:hover::after,
      body.ez-cms-edit-mode [data-cms-key="demos.videos"]:hover::after {
        background: rgba(53, 37, 205, 0.08);
      }

      .ez-icon-hint {
        margin: 0 0 8px;
        color: #6b7280;
        font-size: 0.75rem;
        line-height: 1.4;
      }

      .ez-edit-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: #1a1259;
        color: #fff;
        padding: 12px 18px;
        border-radius: 12px;
        font-family: Manrope, Inter, system-ui, sans-serif;
        font-size: 0.875rem;
        font-weight: 600;
        box-shadow: 0 12px 32px rgba(15, 12, 41, 0.3);
        z-index: 100001;
        opacity: 0;
        transform: translateY(8px);
        transition: opacity 0.2s ease, transform 0.2s ease;
        max-width: 360px;
      }
      .ez-edit-toast.show { opacity: 1; transform: translateY(0); }
      .ez-edit-toast--error { background: #b91c1c; }
      .ez-edit-toast--success { background: #15803d; }

      #ez-cms-edit-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 12, 41, 0.45);
        z-index: 99998;
        display: none;
      }
      #ez-cms-edit-overlay.is-open { display: block; }

      @media (max-width: 768px) {
        #ez-cms-edit-bar { font-size: 0.8125rem; padding: 8px 12px; }
        .ez-edit-btn { padding: 6px 10px; font-size: 0.75rem; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ─── State ─── */
  const state = {
    page: null,
    publishedBlocks: {},
    blocksByPage: {},
    fieldLabels: {},
    dirty: new Map(), // `${page}\t${key}` → { page, key, block }
    hasDraft: false,
  };

  function elementPage(el) {
    return el?.getAttribute?.('data-cms-page') || state.page;
  }

  function markDirty(key, block, page) {
    const p = page || state.page;
    state.dirty.set(`${p}\t${key}`, { page: p, key, block });
    document
      .querySelectorAll(`[data-cms-key="${cssEscape(key)}"]`)
      .forEach((el) => {
        if (elementPage(el) === p) el.setAttribute('data-ez-dirty', '1');
      });
    updateStatus();
  }

  function clearDirty() {
    state.dirty.clear();
    document
      .querySelectorAll('[data-ez-dirty="1"]')
      .forEach((el) => el.removeAttribute('data-ez-dirty'));
    updateStatus();
  }

  function cssEscape(s) {
    return String(s).replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);
  }

  /** Normalize block keys to logical CMS form (hero.title.line1, not storage-encoded). */
  function sanitizeBlocks(blocks) {
    const out = {};
    for (const [key, block] of Object.entries(blocks || {})) {
      const logical = String(key).replace(/\uE000/g, '.');
      out[logical] = block;
    }
    return out;
  }

  function updateStatus() {
    const status = document.getElementById('ez-cms-edit-status');
    if (!status) return;
    const n = state.dirty.size;
    if (n > 0) {
      status.innerHTML = `<strong>${n}</strong> unsaved change${n === 1 ? '' : 's'}`;
    } else if (state.hasDraft) {
      status.innerHTML = 'Draft saved — ready to publish';
    } else {
      status.innerHTML = 'All changes saved';
    }
    // Buttons stay enabled so clicks always give feedback; save() will toast
    // "Nothing to save yet" if there's no work to do.
    const saveBtn = document.getElementById('ez-cms-save-draft');
    const pubBtn = document.getElementById('ez-cms-publish');
    const discardBtn = document.getElementById('ez-cms-discard');
    if (saveBtn) saveBtn.disabled = false;
    if (pubBtn) pubBtn.disabled = false;
    if (discardBtn) discardBtn.disabled = false;
  }

  /* ─── Toast ─── */
  let toastTimer = null;
  function toast(message, type = 'success') {
    let t = document.getElementById('ez-cms-edit-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'ez-cms-edit-toast';
      t.className = 'ez-edit-toast';
      document.body.appendChild(t);
    }
    t.textContent = message;
    t.className = `ez-edit-toast ez-edit-toast--${type} show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
  }

  /* ─── Top bar ─── */
  function buildBar(page) {
    if (document.getElementById('ez-cms-edit-bar')) return;

    const bar = document.createElement('div');
    bar.id = 'ez-cms-edit-bar';
    bar.innerHTML = `
      <div class="ez-edit-brand">
        <span class="material-symbols-outlined" aria-hidden="true" style="font-size:20px;">edit_note</span>
        <span>Editing:</span>
        <select class="ez-edit-page-picker" id="ez-cms-page-picker" aria-label="Switch page">
          <option value="home"${page === 'home' ? ' selected' : ''}>Homepage</option>
          <option value="contact"${page === 'contact' ? ' selected' : ''}>Contact page</option>
        </select>
        <span class="ez-edit-status" id="ez-cms-edit-status">All changes saved</span>
      </div>
      <div class="ez-edit-actions">
        <button class="ez-edit-btn ez-edit-btn--ghost" id="ez-cms-discard" type="button">Discard</button>
        <button class="ez-edit-btn ez-edit-btn--ghost" id="ez-cms-save-draft" type="button">Save draft</button>
        <button class="ez-edit-btn ez-edit-btn--primary" id="ez-cms-publish" type="button">Publish live</button>
        <a class="ez-edit-btn ez-edit-btn--ghost" id="ez-cms-preview" href="${buildPreviewUrl(page)}" target="_blank" rel="noopener noreferrer">Preview draft</a>
        <a class="ez-edit-btn ez-edit-btn--exit" href="/admin/dashboard.html">Back to admin</a>
        <a class="ez-edit-btn ez-edit-btn--exit" href="${buildExitUrl()}">Exit</a>
      </div>
    `;
    document.body.appendChild(bar);

    document.getElementById('ez-cms-page-picker').addEventListener('change', (e) => {
      const next = e.target.value;
      if (state.dirty.size && !confirm('You have unsaved changes. Discard and switch page?')) {
        e.target.value = state.page;
        return;
      }
      window.location.href = buildEditUrl(next);
    });

    document.getElementById('ez-cms-discard').addEventListener('click', () => {
      window.location.reload();
    });

    document.getElementById('ez-cms-save-draft').addEventListener('click', () => save('draft'));
    document.getElementById('ez-cms-publish').addEventListener('click', () => save('publish'));

    window.addEventListener('beforeunload', (e) => {
      if (state.dirty.size === 0) return;
      e.preventDefault();
      e.returnValue = '';
    });
  }

  /* ─── Inline editing of text ─── */
  function cleanText(el) {
    // Only capture top-level text nodes — ignore any injected helper elements.
    let out = '';
    el.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        out += node.nodeValue;
      } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        !node.classList?.contains('ez-edit-tag') &&
        !node.hasAttribute?.('data-cms-key')
      ) {
        out += node.textContent || '';
      }
    });
    return out.trim();
  }

  function makeTextEditable(el, key) {
    if (el.getAttribute('data-ez-editing') === '1') return;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      editPlainValue(el, key, el.getAttribute('placeholder') || '', 'Placeholder text');
      return;
    }
    el.setAttribute('data-ez-editing', '1');
    el.setAttribute('contenteditable', 'true');
    el.focus();

    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    const originalHtml = el.innerHTML;
    const originalText = cleanText(el);

    const finish = (commit) => {
      el.removeEventListener('blur', onBlur);
      el.removeEventListener('keydown', onKey);
      el.removeEventListener('paste', onPaste);
      el.removeAttribute('contenteditable');
      el.removeAttribute('data-ez-editing');
      const next = cleanText(el);
      if (commit && next !== originalText) {
        el.textContent = next;
        markDirty(key, { type: 'text', value: next }, elementPage(el));
      } else {
        el.innerHTML = originalHtml;
      }
    };

    const onBlur = () => finish(true);
    const onPaste = (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData)?.getData('text/plain') || '';
      document.execCommand('insertText', false, text);
    };
    const onKey = (e) => {
      if (e.key === 'Enter' && !e.shiftKey && el.tagName !== 'TEXTAREA') {
        e.preventDefault();
        el.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finish(false);
      }
    };

    el.addEventListener('blur', onBlur);
    el.addEventListener('keydown', onKey);
    el.addEventListener('paste', onPaste);
  }

  function editPlainValue(el, key, current, fieldTitle) {
    openPopover({
      anchorEl: el,
      html: `
        <h4>${humanLabel(key, elementPage(el))}</h4>
        <label>${fieldTitle}</label>
        <input data-field="value" type="text" value="${escapeAttr(current)}" />
        <div class="ez-edit-popover-actions">
          <button class="primary" data-action="confirm" type="button">Apply</button>
          <button class="ghost" data-action="cancel" type="button">Cancel</button>
        </div>
      `,
      onConfirm: (pop) => {
        const next = pop.querySelector('[data-field="value"]').value.trim();
        if (next && next !== current) {
          el.setAttribute('placeholder', next);
          markDirty(key, { type: 'text', value: next }, elementPage(el));
        }
        closePopover();
      },
    });
  }

  /* ─── Popover (links + images) ─── */
  let activePopover = null;

  function closePopover() {
    if (activePopover) {
      activePopover.remove();
      activePopover = null;
    }
    const overlay = document.getElementById('ez-cms-edit-overlay');
    if (overlay) overlay.classList.remove('is-open');
  }

  function openPopover({ anchorEl, html, onConfirm, onReady }) {
    closePopover();

    let overlay = document.getElementById('ez-cms-edit-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'ez-cms-edit-overlay';
      overlay.addEventListener('click', closePopover);
      document.body.appendChild(overlay);
    }
    overlay.classList.add('is-open');

    const pop = document.createElement('div');
    pop.className = 'ez-edit-popover';
    pop.innerHTML = html;
    document.body.appendChild(pop);
    activePopover = pop;

    const rect = anchorEl.getBoundingClientRect();
    const popHeight = pop.offsetHeight;
    const popWidth = pop.offsetWidth;

    let top = rect.bottom + 8;
    if (top + popHeight > window.innerHeight - 16) {
      top = rect.top - popHeight - 8;
    }
    if (top < 16) {
      top = Math.max(16, window.innerHeight - popHeight - 16);
    }

    let left = rect.left;
    if (left + popWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - popWidth - 16);
    }

    pop.style.top = `${top}px`;
    pop.style.left = `${left}px`;

    pop.querySelector('[data-action="cancel"]')?.addEventListener('click', closePopover);
    pop.querySelector('[data-action="confirm"]')?.addEventListener('click', () => {
      onConfirm(pop);
    });
    onReady?.(pop);

    setTimeout(() => {
      const first = pop.querySelector('input:not([type="file"]):not([type="hidden"]), textarea');
      first?.focus();
    }, 50);
  }

  function editLink(el, key) {
    const labelKey = key.replace(/\.href$/, '.label');
    const currentHref = el.getAttribute('href') || '';
    const currentLabel = (() => {
      const labelEl = el.querySelector(`[data-cms-key="${cssEscape(labelKey)}"]`);
      return labelEl ? labelEl.textContent.trim() : el.textContent.trim();
    })();

    openPopover({
      anchorEl: el,
      html: `
        <h4>${humanLabel(key)}</h4>
        <label>Button label</label>
        <input data-field="label" type="text" value="${escapeAttr(currentLabel)}" />
        <label>Link URL or path</label>
        <input data-field="href" type="text" value="${escapeAttr(currentHref)}" placeholder="/contactus.html or #demos" />
        <div class="ez-edit-popover-actions">
          <button class="primary" data-action="confirm" type="button">Apply</button>
          <button class="ghost" data-action="cancel" type="button">Cancel</button>
        </div>
      `,
      onConfirm: (pop) => {
        const newHref = pop.querySelector('[data-field="href"]').value.trim();
        const newLabel = pop.querySelector('[data-field="label"]').value.trim();
        if (newHref && newHref !== currentHref) {
          el.setAttribute('href', newHref);
          markDirty(key, { type: 'text', value: newHref }, elementPage(el));
        }
        if (newLabel && newLabel !== currentLabel) {
          const labelEl = el.querySelector(`[data-cms-key="${cssEscape(labelKey)}"]`);
          if (labelEl) {
            labelEl.textContent = newLabel;
            markDirty(labelKey, { type: 'text', value: newLabel }, elementPage(labelEl));
          }
        }
        closePopover();
      },
    });
  }

  async function uploadFile(file, kind) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) throw new Error('Not authenticated. Please log in again.');

    const authHeaders = { Authorization: `Bearer ${token}` };
    const prepareRes = await fetch('/api/admin/media', {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'prepare',
        kind,
        filename: file.name || 'upload',
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
      }),
    });
    const prepare = await prepareRes.json();
    if (!prepareRes.ok) throw new Error(prepare.error || 'Upload prepare failed.');

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

    let putRes;
    try {
      putRes = await fetch(prepare.uploadUrl, {
        method: 'PUT',
        headers: { ...(prepare.headers || {}) },
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

  function filePickerMarkup(field, accept, buttonLabel) {
    return `
      <div class="ez-file-picker">
        <label class="ez-file-picker__btn">
          ${buttonLabel || 'Choose file'}
          <input data-field="${field}" type="file" accept="${accept}" />
        </label>
        <span class="ez-file-picker__name" data-field="${field}-name">No file chosen</span>
      </div>
    `;
  }

  function bindFilePickerName(pop, field) {
    const input = pop.querySelector(`[data-field="${field}"]`);
    const name = pop.querySelector(`[data-field="${field}-name"]`);
    if (!input || !name) return;
    input.addEventListener('change', () => {
      name.textContent = input.files?.[0]?.name || 'No file chosen';
    });
  }

  function isSvgSrc(src) {
    if (window.__EZ_CMS_ICON__?.isSvg) return window.__EZ_CMS_ICON__.isSvg(src);
    const s = String(src || '').split('?')[0].toLowerCase();
    return s.endsWith('.svg') || s.includes('image/svg');
  }

  function applyIconLocal(el, value) {
    if (window.__EZ_CMS_ICON__?.apply) {
      window.__EZ_CMS_ICON__.apply(el, value);
      return;
    }
    const src = String(value?.src || '').trim();
    if (src) {
      el.innerHTML = `<img class="cms-icon-img" src="${escapeAttr(src)}" alt="">`;
    }
  }

  function readIconValue(el, key) {
    const fromCms = state.publishedBlocks[key]?.type === 'icon' ? state.publishedBlocks[key].value : null;
    const dirty = state.dirty.get(`${elementPage(el)}\t${key}`);
    const fromDirty = dirty?.block?.type === 'icon' ? dirty.block.value : null;
    const value = fromDirty || fromCms || {};
    return {
      src: String(value.src || '').trim(),
      name: String(value.name || el.getAttribute('data-cms-icon-name') || '').trim(),
    };
  }

  function editIcon(el, key) {
    const current = readIconValue(el, key);

    openPopover({
      anchorEl: el,
      html: `
        <h4>Change this icon</h4>
        <p class="ez-icon-hint">Choose an SVG, PNG, or JPEG. The file is shown as uploaded.</p>
        ${filePickerMarkup('file', 'image/svg+xml,image/png,image/jpeg,image/webp,image/gif,.svg,.png,.jpg,.jpeg,.webp,.gif', 'Choose file')}
        <input data-field="src" type="hidden" value="${escapeAttr(current.src)}" />
        <input data-field="name" type="hidden" value="${escapeAttr(current.name)}" />
        <p class="ez-icon-hint" data-field="status">${current.src ? 'Custom file selected' : 'Using default icon'}</p>
        <div class="ez-edit-popover-actions">
          <button class="primary" data-action="confirm" type="button">Apply</button>
          <button class="ghost" data-action="reset" type="button">Use default</button>
          <button class="ghost" data-action="cancel" type="button">Cancel</button>
        </div>
      `,
      onConfirm: async (pop) => {
        const fileInput = pop.querySelector('[data-field="file"]');
        const srcInput = pop.querySelector('[data-field="src"]');
        const nameInput = pop.querySelector('[data-field="name"]');
        const file = fileInput.files?.[0];

        if (file && file.size > 5 * 1024 * 1024) {
          toast('Icon exceeds the 5 MB limit. Please use a smaller file.', 'error');
          return;
        }

        try {
          if (file) {
            toast('Uploading icon…', 'success');
            const up = await uploadFile(file, 'icon');
            srcInput.value = up.src;
          }
          const next = {
            src: srcInput.value.trim(),
            name: nameInput.value.trim(),
            color: '',
          };
          applyIconLocal(el, next);
          markDirty(key, { type: 'icon', value: next }, elementPage(el));
          closePopover();
        } catch (err) {
          toast(err.message || 'Upload failed.', 'error');
        }
      },
      onReady: (pop) => {
        bindFilePickerName(pop, 'file');
        const fileInput = pop.querySelector('[data-field="file"]');
        const srcInput = pop.querySelector('[data-field="src"]');
        const status = pop.querySelector('[data-field="status"]');
        const resetBtn = pop.querySelector('[data-action="reset"]');
        const fileName = pop.querySelector('[data-field="file-name"]');

        fileInput?.addEventListener('change', () => {
          if (status) status.textContent = fileInput.files?.[0] ? 'Custom file selected' : 'Using default icon';
        });
        resetBtn?.addEventListener('click', (e) => {
          e.preventDefault();
          if (srcInput) srcInput.value = '';
          if (fileInput) fileInput.value = '';
          if (fileName) fileName.textContent = 'No file chosen';
          if (status) status.textContent = 'Using default icon';
        });
      },
    });
  }

  function editImage(el, key) {
    const current = {
      src: el.getAttribute('src') || '',
      alt: el.getAttribute('alt') || '',
    };

    openPopover({
      anchorEl: el,
      html: `
        <h4>${humanLabel(key)}</h4>
        <label>Change this image</label>
        ${filePickerMarkup('file', 'image/jpeg,image/png,image/webp,image/gif', 'Choose file')}
        <input data-field="src" type="hidden" value="${escapeAttr(current.src)}" />
        <label>Alt text (describe the image)</label>
        <input data-field="alt" type="text" value="${escapeAttr(current.alt)}" />
        <div class="ez-edit-popover-actions">
          <button class="primary" data-action="confirm" type="button">Apply</button>
          <button class="ghost" data-action="cancel" type="button">Cancel</button>
        </div>
      `,
      onConfirm: async (pop) => {
        const fileInput = pop.querySelector('[data-field="file"]');
        const srcInput = pop.querySelector('[data-field="src"]');
        const altInput = pop.querySelector('[data-field="alt"]');
        const file = fileInput.files?.[0];

        if (file) {
          const maxMB = 5;
          if (file.size > maxMB * 1024 * 1024) {
            toast(`Image exceeds the ${maxMB} MB limit. Please use a smaller file.`, 'error');
            return;
          }
        }

        try {
          if (file) {
            toast('Uploading image…', 'success');
            const up = await uploadFile(file, 'image');
            srcInput.value = up.src;
          }
          const next = {
            src: srcInput.value.trim(),
            alt: altInput.value.trim(),
          };
          if (next.src !== current.src) el.setAttribute('src', next.src);
          if (next.alt !== current.alt) el.setAttribute('alt', next.alt);
          if (next.src !== current.src || next.alt !== current.alt) {
            markDirty(key, { type: 'image', value: next }, elementPage(el));
          }
          closePopover();
        } catch (err) {
          toast(err.message || 'Upload failed.', 'error');
        }
      },
      onReady: (pop) => bindFilePickerName(pop, 'file'),
    });
  }

  function editVideo(container, key) {
    const defaultVal = {
      src: '/images/YTDown_YouTube_EasyVariants-Explainer-Video_Media_2Zl_BkN9L6w_002_720p.mp4',
      poster: ''
    };
    const current = (state.publishedBlocks[key]?.value && state.publishedBlocks[key]?.value.src)
      ? state.publishedBlocks[key].value
      : defaultVal;

    openPopover({
      anchorEl: container,
      html: `
        <h4>${humanLabel(key)}</h4>
        <div class="ez-edit-popover-scroll-body">
          <label>Change this video</label>
          ${filePickerMarkup('file', 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov', 'Choose file')}
          <input data-field="src" type="hidden" value="${escapeAttr(current.src || '')}" />
          
          <label>Change poster image (optional)</label>
          ${filePickerMarkup('poster-file', 'image/jpeg,image/png,image/webp,image/gif', 'Choose file')}
          <input data-field="poster" type="hidden" value="${escapeAttr(current.poster || '')}" />
        </div>
        <div class="ez-edit-popover-actions">
          <button class="primary" data-action="confirm" type="button">Apply</button>
          <button class="ghost" data-action="cancel" type="button">Cancel</button>
        </div>
      `,
      onConfirm: async (pop) => {
        const fileInput = pop.querySelector('[data-field="file"]');
        const srcInput = pop.querySelector('[data-field="src"]');
        const posterFileInput = pop.querySelector('[data-field="poster-file"]');
        const posterInput = pop.querySelector('[data-field="poster"]');

        const file = fileInput.files?.[0];
        const posterFile = posterFileInput.files?.[0];

        if (file && file.size > 50 * 1024 * 1024) {
          toast('Video exceeds the 50 MB limit. Please use a smaller file.', 'error');
          return;
        }
        if (posterFile && posterFile.size > 5 * 1024 * 1024) {
          toast('Poster exceeds the 5 MB limit. Please optimize the image.', 'error');
          return;
        }

        try {
          if (file) {
            toast('Uploading video…', 'success');
            const up = await uploadFile(file, 'video');
            srcInput.value = up.src;
          }
          if (posterFile) {
            toast('Uploading poster…', 'success');
            const up = await uploadFile(posterFile, 'poster');
            posterInput.value = up.src;
          }

          const next = {
            src: srcInput.value.trim(),
            poster: posterInput.value.trim(),
          };

          if (next.src !== current.src || next.poster !== current.poster) {
            let el = container.tagName === 'DIV' ? container.querySelector('video, iframe') : container;
            if (el) {
              const ytId = getYouTubeId(next.src);
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
                  video.src = next.src;
                  if (next.poster) video.poster = next.poster;
                  el.parentNode.replaceChild(video, el);
                  if (typeof video.load === 'function') video.load();
                } else {
                  if (next.src) el.src = next.src;
                  if (next.poster) el.poster = next.poster;
                  else el.removeAttribute('poster');
                  if (typeof el.load === 'function') el.load();
                }
              }
            }

            markDirty(key, { type: 'video', value: next }, elementPage(container));
          }
          closePopover();
        } catch (err) {
          toast(err.message || 'Upload failed.', 'error');
        }
      },
      onReady: (pop) => {
        bindFilePickerName(pop, 'file');
        bindFilePickerName(pop, 'poster-file');
      },
    });
  }

  function getYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  function editVideoList(el, key) {
    const defaultDemos = [
      { youtubeId: 'Mrj4YI_RQzA', title: 'EasyVariants Demo  Product Variants', label: 'Product Variants' },
      { youtubeId: 'Kd0Olg1cE-s', title: 'EasyVariants Demo  Cap Variants', label: 'Cap Variants' },
      { youtubeId: '2Zl_BkN9L6w', title: 'EasyVariants Explainer Video', label: 'Explainer Video' },
      { youtubeId: 'ETiWWJaoaZM', title: 'EasyVariants Demo  Sweatshirt Variants', label: 'Sweatshirt Variants' },
      { youtubeId: 'l5tyQAdNiEY', title: 'EasyVariants Demo  Shoe Variants', label: 'Shoe Variants' },
    ];
    const listBlock = state.publishedBlocks[key];
    const items = (listBlock && Array.isArray(listBlock.value) && listBlock.value.length > 0)
      ? listBlock.value
      : defaultDemos;

    let listHtml = '';
    items.forEach((item, index) => {
      listHtml += `
        <div class="ez-list-item-edit-card" data-index="${index}">
          <p class="ez-list-item-edit-card-title">Video ${index + 1}</p>
          <label>Title</label>
          <input data-field="title" type="text" value="${escapeAttr(item.title || '')}" />
          <label>YouTube video ID or URL</label>
          <input data-field="youtubeId" type="text" value="${escapeAttr(item.youtubeId || '')}" />
          <label>Short label</label>
          <input data-field="label" type="text" value="${escapeAttr(item.label || '')}" />
        </div>
      `;
    });

    openPopover({
      anchorEl: el,
      html: `
        <h4>${humanLabel(key)}</h4>
        <div class="ez-edit-popover-scroll-body" style="max-height: 45vh;">
          ${listHtml}
        </div>
        <div class="ez-edit-popover-actions">
          <button class="primary" data-action="confirm" type="button">Apply</button>
          <button class="ghost" data-action="cancel" type="button">Cancel</button>
        </div>
      `,
      onConfirm: (pop) => {
        const itemCards = pop.querySelectorAll('.ez-list-item-edit-card');
        const nextValue = [];

        itemCards.forEach((card) => {
          const index = Number(card.dataset.index);
          const title = card.querySelector('[data-field="title"]').value.trim();
          let youtubeId = card.querySelector('[data-field="youtubeId"]').value.trim();
          const label = card.querySelector('[data-field="label"]').value.trim();

          const parsedId = getYouTubeId(youtubeId);
          if (parsedId) {
            youtubeId = parsedId;
          }

          nextValue.push({ title, youtubeId, label });
        });

        let changed = false;
        if (nextValue.length !== items.length) {
          changed = true;
        } else {
          for (let i = 0; i < items.length; i++) {
            if (
              nextValue[i].title !== items[i].title ||
              nextValue[i].youtubeId !== items[i].youtubeId ||
              nextValue[i].label !== items[i].label
            ) {
              changed = true;
              break;
            }
          }
        }

        if (changed) {
          if (window.__EZ_CMS__?.blocks) {
            window.__EZ_CMS__.blocks[key] = { type: 'list', value: nextValue };
          }
          markDirty(key, { type: 'list', value: nextValue }, elementPage(el));
          document.dispatchEvent(new CustomEvent('ez-cms-loaded', { detail: window.__EZ_CMS__ }));
        }

        closePopover();
      },
    });
  }

  function editComplex(el, key) {
    openPopover({
      anchorEl: el,
      html: `
        <h4>${humanLabel(key)}</h4>
        <p style="margin:0 0 8px;color:#6b7280;font-size:.8125rem;">
          This field type is best edited in the admin form (videos, lists, etc.).
        </p>
        <div class="ez-edit-popover-actions">
          <a class="primary" href="/admin/dashboard.html?tab=content&page=${encodeURIComponent(state.page)}&key=${encodeURIComponent(key)}" style="text-decoration:none;display:inline-block;padding:6px 12px;">Open in admin</a>
          <button class="ghost" data-action="cancel" type="button">Cancel</button>
        </div>
      `,
      onConfirm: () => {},
    });
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  /* ─── Click bindings ─── */
  function bindElements() {
    document.querySelectorAll('[data-cms-key]').forEach((el) => {
      if (el.dataset.ezBound === '1') return;
      el.dataset.ezBound = '1';

      const key = el.getAttribute('data-cms-key');
      if (!key) return;

      el.setAttribute('data-cms-label', humanLabel(key, elementPage(el)));

      el.addEventListener('click', (e) => {
        if (el.getAttribute('data-ez-editing') === '1') return;

        const innerEditable = e.target.closest('[data-cms-key]');
        if (innerEditable && innerEditable !== el) return;

        e.preventDefault();
        e.stopPropagation();

        if (el.tagName === 'A') {
          if (key.endsWith('.href')) {
            editLink(el, key);
          } else {
            makeTextEditable(el, key);
          }
          return;
        }

        if (el.tagName === 'IMG') {
          editImage(el, key);
          return;
        }

        if (el.hasAttribute('data-cms-icon') || key.endsWith('.icon')) {
          editIcon(el, key);
          return;
        }

        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          makeTextEditable(el, key);
          return;
        }

        if (key === 'meet.video') {
          editVideo(el, key);
          return;
        }

        if (key === 'demos.videos') {
          editVideoList(el, key);
          return;
        }

        makeTextEditable(el, key);
      });
    });

    document.querySelectorAll('a:not([data-cms-key])').forEach((a) => {
      if (a.dataset.ezNavBound === '1') return;
      a.dataset.ezNavBound = '1';
      a.addEventListener('click', (e) => {
        if (a.closest('#ez-cms-edit-bar')) return;
        const href = a.getAttribute('href') || '';
        if (href.startsWith('#')) return;
        if (a.querySelector('[data-cms-key]')) return;
        e.preventDefault();
        toast('Navigation is disabled in edit mode. Use the top bar to exit.', 'success');
      });
    });
  }

  /* ─── Save ─── */
  async function savePage(page, blocks, mode, token) {
    const res = await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ page, blocks, mode }),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Server returned ${res.status} (no JSON). Is the dev server restarted?`);
    }
    if (!res.ok) throw new Error(data.error || `Save failed (HTTP ${res.status}).`);
    return data;
  }

  async function save(mode) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      toast('Session expired. Log in again.', 'error');
      setTimeout(() => (window.location.href = '/admin/login.html'), 1500);
      return;
    }

    const dirtyByPage = new Map();
    state.dirty.forEach((entry) => {
      const page = entry.page || state.page;
      if (!dirtyByPage.has(page)) dirtyByPage.set(page, {});
      dirtyByPage.get(page)[entry.key] = entry.block;
    });

    if (dirtyByPage.size === 0) {
      dirtyByPage.set(state.page, {});
    }

    const pages = [...dirtyByPage.keys()];
    const hasWork = pages.some((p) => {
      const existing = state.blocksByPage[p] || (p === state.page ? state.publishedBlocks : {});
      const merged = { ...existing, ...dirtyByPage.get(p) };
      return Object.keys(merged).length > 0;
    });

    if (!hasWork) {
      toast('Nothing to save yet — edit some text first.', 'error');
      return;
    }

    const saveBtn = document.getElementById('ez-cms-save-draft');
    const pubBtn = document.getElementById('ez-cms-publish');
    if (saveBtn) saveBtn.disabled = true;
    if (pubBtn) pubBtn.disabled = true;
    toast(mode === 'draft' ? 'Saving draft…' : 'Publishing…', 'success');

    try {
      let anyDraft = false;
      for (const page of pages) {
        let existing = state.blocksByPage[page] || {};
        if (page === state.page && Object.keys(existing).length === 0) {
          existing = state.publishedBlocks || {};
        }
        if (Object.keys(existing).length === 0) {
          const loaded = await fetch('/api/admin/content?page=' + encodeURIComponent(page) + '&source=draft', {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json());
          existing = sanitizeBlocks(loaded.blocks || {});
          state.blocksByPage[page] = existing;
        }
        const merged = sanitizeBlocks({
          ...existing,
          ...dirtyByPage.get(page),
        });
        if (Object.keys(merged).length === 0) continue;

        const data = await savePage(page, merged, mode, token);
        state.blocksByPage[page] = sanitizeBlocks({
          ...(data.blocks || {}),
          ...(data.draftBlocks || {}),
        });
        if (page === state.page) {
          state.publishedBlocks = state.blocksByPage[page];
          anyDraft = Boolean(data.hasDraft);
        }
      }

      state.hasDraft = mode === 'draft' ? true : anyDraft;
      clearDirty();
      toast(
        mode === 'draft'
          ? 'Draft saved. Click Publish live to push to visitors.'
          : 'Published live. Refresh the public site to verify.',
        'success'
      );
    } catch (err) {
      console.error('[cms] save failed', err);
      toast(err.message || 'Save failed.', 'error');
    } finally {
      updateStatus();
    }
  }

  /* ─── Init ─── */
  function labelsFromSchema(schema) {
    const out = {};
    Object.entries(schema || {}).forEach(([page, sections]) => {
      out[page] = {};
      (sections || []).forEach((section) => {
        (section.fields || []).forEach((field) => {
          out[page][field.key] = field.label;
        });
      });
    });
    return out;
  }

  async function loadFieldLabels() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const res = await fetch('/api/admin/content-schema', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.schema) state.fieldLabels = labelsFromSchema(data.schema);
    } catch {
      /* keep fallback labels */
    }
  }

  async function activate(detail) {
    if (document.body.classList.contains('ez-cms-edit-mode')) return;

    state.page = detail.page;
    state.publishedBlocks = sanitizeBlocks(detail.blocks || {});
    state.blocksByPage = {};
    Object.entries(detail.blocksByPage || { [detail.page]: detail.blocks }).forEach(([page, blocks]) => {
      state.blocksByPage[page] = sanitizeBlocks(blocks);
    });
    state.hasDraft = Boolean(detail.hasDraft);

    await loadFieldLabels();
    injectStyles();
    document.body.classList.add('ez-cms-edit-mode');
    buildBar(state.page);
    bindElements();
    updateStatus();

    document.addEventListener('ez-cms-loaded', (e) => {
      state.publishedBlocks = sanitizeBlocks(e.detail?.blocks || state.publishedBlocks);
      if (e.detail?.blocksByPage) {
        Object.entries(e.detail.blocksByPage).forEach(([page, blocks]) => {
          state.blocksByPage[page] = sanitizeBlocks(blocks);
        });
      }
      bindElements();
    });
  }

  function init() {
    if (!isEditModeUrl()) return;
    if (!hasAdminToken()) {
      // Not logged in — bounce to admin login with return path
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace(`/admin/login.html?next=${next}`);
      return;
    }

    // If the loader already announced data, activate now; else wait.
    if (window.__EZ_CMS__) {
      activate(window.__EZ_CMS__);
    } else {
      document.addEventListener('ez-cms-loaded', function once(e) {
        document.removeEventListener('ez-cms-loaded', once);
        activate(e.detail);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
