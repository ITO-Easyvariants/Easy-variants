# CMS Content Keys

Canonical list of editable content keys. Schema source: `api/_lib/cmsSchema.js`.  
HTML markers: `data-cms-key="…"` on `index.html` / `contactus.html` (`data-cms-page` on `<body>`).

**Link keys:** keys ending in `.href` are placed on `<a>` elements; the loader sets the `href` attribute (not text content). Pair with a `.label` key on a child `<span>` where needed.

**Demo videos list:** `demos.videos` has no `data-cms-key` in HTML. The homepage demo glider reads `window.__EZ_CMS__.blocks['demos.videos']` via `getDemoVideosFromCms()` in `index.html` (list type: `[{ youtubeId, title, label }]`).

## Draft & preview

- **Save draft** — stores edits in `draftBlocks` (not visible to visitors).
- **Publish live** — copies edits to `blocks`, clears the draft, and saves a version snapshot.
- **Preview draft** — open `/?preview=draft` or `/contactus.html?preview=draft` while logged into admin.
- **Restore** — admin Content tab → Version history → Restore (saves current live copy first).

## Inline edit (admin on public site)

When logged in, a floating **Edit content** button appears on `index.html` / `contactus.html`. Toggle edit mode to show pencil icons on each CMS field; quick-edit text/images inline or open the full admin editor.

---

## Home (`page=home`, `index.html`)

### Header navigation
| Key | Type | Where it appears |
|-----|------|------------------|
| `header.cta.label` | text | Desktop + mobile nav “Get Your Demo Today” button |
| `header.cta.href` | text (link) | Nav demo button URL (`<a href>`) |

### Hero (`#hero`)
| Key | Type | Where it appears |
|-----|------|------------------|
| `hero.eyebrow` | text | Hero badge above headline |
| `hero.title.line1` | text | Hero headline line 1 |
| `hero.title.line2` | text | Hero headline line 2 (accent) |
| `hero.description` | text | Hero supporting paragraph |
| `hero.cta.primary.label` | text | Primary CTA button label |
| `hero.cta.primary.href` | text (link) | Primary CTA button URL |
| `hero.cta.secondary.label` | text | Secondary CTA button label |
| `hero.cta.secondary.href` | text (link) | Secondary CTA button URL |
| `hero.image` | image | Hero product screenshot (`src`, `alt`) |

### Meet EasyVariants (`#meet`)
| Key | Type | Where it appears |
|-----|------|------------------|
| `meet.eyebrow` | text | Section eyebrow |
| `meet.title` | text | Section heading |
| `meet.description` | text | Section description |
| `meet.video` | video | Looping explainer `<video>` (`src`, optional `poster`) |

### The Problem (`#problem`)
| Key | Type | Where it appears |
|-----|------|------------------|
| `problem.eyebrow` | text | Section eyebrow |
| `problem.title` | text | Section heading |
| `problem.description` | text | Section description |
| `problem.cards.0.title` | text | Carousel card 1 title |
| `problem.cards.0.description` | text | Carousel card 1 body |
| `problem.cards.1.title` | text | Carousel card 2 title |
| `problem.cards.1.description` | text | Carousel card 2 body |
| `problem.cards.2.title` | text | Carousel card 3 title |
| `problem.cards.2.description` | text | Carousel card 3 body |
| `problem.cards.3.title` | text | Carousel card 4 title |
| `problem.cards.3.description` | text | Carousel card 4 body |

### Advantage (`#advantage`)
| Key | Type | Where it appears |
|-----|------|------------------|
| `advantage.eyebrow` | text | Section eyebrow |
| `advantage.title` | text | Section heading |
| `advantage.description` | text | Section description |
| `advantage.cards.0.title` | text | Card 1 title |
| `advantage.cards.0.description` | text | Card 1 body |
| `advantage.cards.1.title` | text | Card 2 title |
| `advantage.cards.1.description` | text | Card 2 body |
| `advantage.cards.2.title` | text | Card 3 title |
| `advantage.cards.2.description` | text | Card 3 body |
| `advantage.cards.3.title` | text | Card 4 title |
| `advantage.cards.3.description` | text | Card 4 body |

### Inside EasyVariants (`#inside`)
| Key | Type | Where it appears |
|-----|------|------------------|
| `inside.eyebrow` | text | Section eyebrow |
| `inside.title` | text | Section heading |
| `inside.description` | text | Section description |
| `inside.features.0` | text | Feature list item 1 |
| `inside.features.1` | text | Feature list item 2 |
| `inside.features.2` | text | Feature list item 3 |
| `inside.features.3` | text | Feature list item 4 |
| `inside.features.4` | text | Feature list item 5 |
| `inside.features.5` | text | Feature list item 6 |
| `inside.cta.label` | text | “Explore Workflow” button label |
| `inside.cta.href` | text (link) | “Explore Workflow” button URL |
| `inside.image.main` | image | Primary plugin screenshot |
| `inside.image.overlap` | image | Overlapping application screenshot |

### Our Solution (`#solution`)
| Key | Type | Where it appears |
|-----|------|------------------|
| `solution.eyebrow` | text | Section eyebrow |
| `solution.title` | text | Section heading |
| `solution.description` | text | Section description |
| `solution.stats.0.value` | text | Stat pill 1 value |
| `solution.stats.0.label` | text | Stat pill 1 label |
| `solution.stats.1.value` | text | Stat pill 2 value |
| `solution.stats.1.label` | text | Stat pill 2 label |
| `solution.stats.2.value` | text | Stat pill 3 value |
| `solution.stats.2.label` | text | Stat pill 3 label |
| `solution.cards.0.title` | text | Feature card 1 title |
| `solution.cards.0.description` | text | Feature card 1 body |
| `solution.cards.1.title` | text | Feature card 2 title |
| `solution.cards.1.description` | text | Feature card 2 body |
| `solution.cards.2.title` | text | Feature card 3 title |
| `solution.cards.2.description` | text | Feature card 3 body |
| `solution.cards.3.title` | text | Feature card 4 title (Export Anywhere) |
| `solution.cards.3.description` | text | Feature card 4 body |

### Workflow (`#workflow`)
| Key | Type | Where it appears |
|-----|------|------------------|
| `workflow.eyebrow` | text | Section eyebrow |
| `workflow.title` | text | Section heading |
| `workflow.description` | text | Section description |
| `workflow.steps.0.title` | text | Step 1 title |
| `workflow.steps.0.description` | text | Step 1 body |
| `workflow.steps.1.title` | text | Step 2 title |
| `workflow.steps.1.description` | text | Step 2 body |
| `workflow.steps.2.title` | text | Step 3 title |
| `workflow.steps.2.description` | text | Step 3 body |
| `workflow.steps.3.title` | text | Step 4 title |
| `workflow.steps.3.description` | text | Step 4 body |
| `workflow.steps.4.title` | text | Step 5 title |
| `workflow.steps.4.description` | text | Step 5 body |

### Demo Videos (`#demos`)
| Key | Type | Where it appears |
|-----|------|------------------|
| `demos.eyebrow` | text | Section eyebrow |
| `demos.title` | text | Section heading |
| `demos.description` | text | Section description |
| `demos.videos` | list | YouTube demo glider — **JS-driven** (see note above); admin list `[{ youtubeId, title, label }]` |

### Final CTA (`#cta`)
| Key | Type | Where it appears |
|-----|------|------------------|
| `cta.title` | text | CTA section heading |
| `cta.description` | text | CTA supporting text |
| `cta.button.label` | text | CTA button label |
| `cta.button.href` | text (link) | CTA button URL |
| `cta.footer` | text | Small footer line under button |

### Footer
| Key | Type | Where it appears |
|-----|------|------------------|
| `footer.brand.description` | text | Brand blurb in footer column |
| `footer.support.title` | text | Support mini-card title |
| `footer.support.text` | text | Support mini-card text |
| `footer.copyright` | text | Copyright line |
| `footer.disclaimer` | text | Legal disclaimer line |
| `footer.menu.0.label` | text | Footer menu link 1 label (Home) |
| `footer.menu.0.href` | text (link) | Footer menu link 1 URL |
| `footer.menu.1.label` | text | Footer menu link 2 label |
| `footer.menu.1.href` | text (link) | Footer menu link 2 URL |
| `footer.menu.2.label` | text | Footer menu link 3 label |
| `footer.menu.2.href` | text (link) | Footer menu link 3 URL |
| `footer.menu.3.label` | text | Footer menu link 4 label |
| `footer.menu.3.href` | text (link) | Footer menu link 4 URL |
| `footer.social.0.label` | text | Social link 1 label (Instagram) |
| `footer.social.0.href` | text (link) | Social link 1 URL |
| `footer.social.1.label` | text | Social link 2 label (Youtube) |
| `footer.social.1.href` | text (link) | Social link 2 URL |
| `footer.social.2.label` | text | Social link 3 label (facebook) |
| `footer.social.2.href` | text (link) | Social link 3 URL |
| `footer.social.3.label` | text | Social link 4 label (Twitter) |
| `footer.social.3.href` | text (link) | Social link 4 URL |

---

## Contact (`page=contact`, `contactus.html`)

| Key | Type | Where it appears |
|-----|------|------------------|
| `contact.badge` | text | Page badge above title |
| `contact.title.line1` | text | Hero title line 1 |
| `contact.title.line2` | text | Hero title line 2 (accent) |
| `contact.description` | text | Intro paragraph under title |
| `contact.form.title` | text | Form section heading |
| `contact.form.subtitle` | text | Form section subtitle |
| `contact.info.0.title` | text | Info card 1 title (Email) |
| `contact.info.0.description` | text | Info card 1 body |
| `contact.info.1.title` | text | Info card 2 title (Response time) |
| `contact.info.1.description` | text | Info card 2 body |
| `contact.info.2.title` | text | Info card 3 title (Live demo) |
| `contact.info.2.description` | text | Info card 3 body |
| `contact.info.3.title` | text | Info card 4 title (Support) |
| `contact.info.3.description` | text | Info card 4 body |
| `contact.stats.0.value` | text | Stat 1 value |
| `contact.stats.0.label` | text | Stat 1 label |
| `contact.stats.1.value` | text | Stat 2 value |
| `contact.stats.1.label` | text | Stat 2 label |

---

## Admin usage

1. Log in at `/admin/login.html`
2. Open **Content** tab
3. Select **Homepage** or **Contact**
4. Edit fields → use **Upload image** / **Upload video** / **Upload poster** where available
5. **Save draft** to store work-in-progress, **Preview draft** to review on the public page
6. **Publish live** when ready (clears draft and updates the live site)
7. **Version history** — restore a previous published snapshot if needed
8. Allow up to ~60s for CDN cache on the live site

### Media uploads

- **Images:** max 5 MB (JPEG, PNG, WebP, GIF)
- **Videos:** max 50 MB (MP4, WebM, MOV)
- **Posters:** max 5 MB (optional thumbnail for `<video>`)
- **Production:** set Cloudflare R2 env vars in Vercel (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`). Browser uploads go directly to R2 (original bytes preserved).
- **R2 CORS:** allow `PUT`/`GET`/`HEAD` from your production origin and `http://localhost:5173` (dev).
- **Local dev:** without R2 env vars, files save to `public/uploads/cms/` and are served at `/uploads/cms/…`
