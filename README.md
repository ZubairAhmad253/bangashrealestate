# Bangash Real Estate

Official website of **Bangash Real Estate** — plots, houses & flats for sale and rent, plus house & apartment construction in Rawalpindi & Islamabad (Airport Housing Society, Ghauri Town, Bahria Town, DHA and more).

Built with [Astro](https://astro.build) — static HTML, near-zero JavaScript, optimized images and full SEO (sitemap, schema.org, Open Graph, canonical URLs).

## Run locally

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # production build → dist/
npm run preview   # preview the production build
```

## Kya kahan edit karein (Where to edit)

| Cheez | File |
|---|---|
| Phone, WhatsApp, email, address, map, social links, stats, domain | `src/config/site.ts` |
| **WhatsApp & email ke custom messages** | `src/config/site.ts` → `MESSAGES` |
| Google reviews (testimonials) | `src/data/content.ts` → `TESTIMONIALS` |
| Logo (gold) | `src/assets/brand/logo-gold.jpg` · header logo: `src/components/Logo.astro` |
| **Colors / gradients / fonts** (poora color scheme) | `src/styles/theme.css` |
| Layout & component styles, animations | `src/styles/global.css` |
| Property listings (add / remove / prices) | `src/data/properties.ts` |
| Areas / societies pages | `src/data/areas.ts` |
| Services (plots, houses, flats, construction) | `src/data/services.ts` |
| FAQs, testimonials, "Why choose us" | `src/data/content.ts` |
| Photos | `src/assets/images/` |

### Nayi property add karna
1. Photo `src/assets/images/` mein daalein.
2. `src/data/properties.ts` mein upar `import` karein.
3. `PROPERTIES` list mein ek naya object add karein — page, sitemap aur SEO khud ban jayenge.

### Color scheme change karna
`src/styles/theme.css` mein sirf `--brand-primary`, `--brand-primary-strong`, `--brand-secondary`, `--brand-accent` aur `--brand-accent-light` badlein. Saare tints, gradients aur shadows khud update ho jayenge. Abhi ka theme signboard ke navy/blue aur logo ke gold se bana hai.

## Deploy

Static site hai — `npm run build` ke baad `dist/` folder kisi bhi host par upload karein, ya repo ko **Netlify / Vercel / Cloudflare Pages** se connect karein (build command: `npm run build`, output: `dist`).

Deploy ke baad `src/config/site.ts` mein `url` apne asal domain par set karein aur Google Search Console mein `/sitemap-index.xml` submit karein.
