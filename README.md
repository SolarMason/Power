# POWER · NEPA-PRO Live Tracker

Production-ready PWA for tracking US power outages in real time.  
Target deployment: **https://power.nepa-pro.com**

---

## What's included

| File | Purpose |
|---|---|
| `index.html` | Single-file app — all CSS + JS inline, no build step |
| `manifest.json` | PWA manifest (installable on iOS/Android/desktop) |
| `sw.js` | Service worker — network-first for API, cache-first for shell |
| `robots.txt` | Allow-all + explicit allow for AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.) |
| `sitemap.xml` | 6 URLs with lastmod + OG image reference |
| `favicon.svg` | Vector favicon (amber bolt) |
| `og-card.png` | 1200×630 Open Graph / Twitter card |
| `icon-32.png` | Browser tab favicon fallback |
| `icon-180.png` | iOS apple-touch-icon |
| `icon-192.png` / `icon-512.png` | PWA standard icons |
| `icon-192-maskable.png` / `icon-512-maskable.png` | PWA maskable icons (Android adaptive) |

Generator scripts (`_gen_icons.py`, `_gen_og.py`) are optional — only needed if you want to tweak the artwork.

---

## Deploy

### 1. DNS

Point `power.nepa-pro.com` (CNAME or A record) at your host. PWA installation **requires HTTPS** — Cloudflare Pages, GitHub Pages, Netlify, Vercel, or any host with a valid cert will work.

### 2. Upload

Drop every file in the table above at the **site root** (so the service worker scope `/` and the manifest `start_url: /` resolve correctly). No build step. No bundler.

```
/
├── index.html
├── manifest.json
├── sw.js
├── robots.txt
├── sitemap.xml
├── favicon.svg
├── og-card.png
├── icon-32.png
├── icon-180.png
├── icon-192.png
├── icon-512.png
├── icon-192-maskable.png
└── icon-512-maskable.png
```

### 3. Verify

- Open `https://power.nepa-pro.com` on iOS Safari → Share → "Add to Home Screen" should show the amber bolt icon
- Lighthouse PWA audit → installable + service worker registered
- View source → all OG tags + 3 JSON-LD blocks (WebApplication, Organization, FAQPage) present
- `/robots.txt` and `/sitemap.xml` accessible

---

## Data sources

| Source | URL | Notes |
|---|---|---|
| **ODIN** (Outage Data Initiative Nationwide) | `ornl.opendatasoft.com` | DOE / Oak Ridge National Lab. County-level customer-out counts. No API key. Public. |
| **NOAA NWS** | `api.weather.gov` | Active weather alerts. No API key. Public. |
| **US Census TIGER** | `cdn.jsdelivr.net/npm/us-atlas@3` | State boundary topojson for the choropleth. |

The app pulls these directly from the browser (CORS-enabled on all three). No backend, no proxy, no credentials.

Auto-refresh: every **5 minutes** while the tab is visible, plus on `visibilitychange` when you return to the tab.

---

## SEO + AI search optimization

- 3 JSON-LD blocks: `WebApplication`, `Organization`, `FAQPage`
- Full Open Graph + Twitter card tags pointing at `og-card.png`
- `ai-content-declaration`, `ai-summary`, and `purpose` meta tags for LLM crawlers
- Canonical link set to `https://power.nepa-pro.com/`
- `robots.txt` explicitly allows: GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, Claude-Web, anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, Bingbot, DuckDuckBot, YouBot, Bytespider, CCBot, cohere-ai, Meta-ExternalAgent, MistralAI-User
- 7-item FAQ section is both human-readable and schema-marked-up for rich results
- Preconnects to all third-party origins (ORNL, NWS, jsdelivr, fonts.gstatic.com)
- Single-file shell → fast TTFB → strong CWV

---

## Mobile UX

- Bottom tab bar (Map / Stats / Weather / FAQ) — iOS-style, fixed
- Mega menu only renders on viewports ≥ 980px
- Safe-area insets respected for notch + home indicator
- Tap targets ≥ 44×44
- Install prompt with separate iOS instructions ("Tap Share → Add to Home Screen")

---

## Updating the data feed

The ODIN endpoint occasionally adds/renames fields. The app uses `pickField()` with multiple candidate keys (`customers_out`, `customers_affected`, `numberofcustomersaffected`, etc.) so it survives minor schema drift. If a hard rename happens, edit the candidate arrays inside `fetchOdin()` in `index.html`.
