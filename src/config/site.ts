/* ==========================================================================
   BANGASH REAL ESTATE & BUILDERS — SITE SETTINGS
   --------------------------------------------------------------------------
   Edit the phone, WhatsApp, email, address, social links, stats and the
   custom WhatsApp/email messages here — the whole website updates
   automatically. (Phone, WhatsApp, email, hours, rating and stats can
   also be changed in the admin panel → Settings.)
   ========================================================================== */

/* Values that can also be set in Vercel → Project → Settings → Environment Variables
   (no code change needed — just redeploy):
     PUBLIC_SITE_URL                   e.g. https://www.bangashrealestate.com  (when the custom domain is live)
     PUBLIC_GOOGLE_SITE_VERIFICATION   Google Search Console HTML-tag code
     PUBLIC_GA4_ID                     Google Analytics 4 measurement ID, e.g. G-XXXXXXXXXX */
const env = (key: string): string => {
  const vite = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.[key];
  const node = typeof process !== 'undefined' ? process.env?.[key] : undefined;
  return (vite || node || '').trim();
};

export const SITE = {
  /** Full name exactly as on the Google Business Profile (keep the same for local SEO) */
  name: 'Bangash Real Estate & Builders',
  /** Short name added to the end of page titles */
  titleName: 'Bangash Real Estate',
  shortName: 'Bangash',
  legalName: 'Bangash Real Estate & Builders',
  tagline: 'Your trusted partner in real estate & construction',
  motto: 'Your Trust, Our Commitment.',

  /** Live domain — used for the sitemap, canonical URLs, robots.txt and social previews.
      When the custom domain is ready, set PUBLIC_SITE_URL in Vercel (or change the fallback here). */
  url: (env('PUBLIC_SITE_URL') || 'https://bangashrealestate.vercel.app').replace(/\/+$/, ''),

  description:
    'Bangash Real Estate & Builders — trusted property dealers and builders in Rawalpindi & Islamabad. Buy, sell or rent houses, flats and plots in Airport Housing Society, Ghauri Town, Bahria Town, DHA and more. Bank loan available on selected properties.',

  // ---------------- CONTACT ----------------
  phone: '0332-0445759',             // As displayed on the website
  phoneLink: '+923320445759',        // For tel: links (with +92)
  whatsapp: '923320445759',          // With country code, no + and no leading 0
  email: 'engrumersaeed.6899@gmail.com',

  /** The website contact form posts here (FormSubmit — free). The first submission sends an
      "Activate" email to this address — it must be confirmed once. */
  formEndpoint: 'https://formsubmit.co/engrumersaeed.6899@gmail.com',

  address: {
    street: 'Gulistan Plaza No. 18, B Block, Street 13-A, Sector 4, Airport Housing Society',
    short: 'Gulistan Plaza, Sector 4, Airport Housing Society',
    city: 'Rawalpindi',
    region: 'Punjab',
    postalCode: '46000',
    country: 'PK',
  },
  geo: { lat: 33.5881869, lng: 73.1232242 },
  /** Google Maps share link (Directions button) */
  mapsUrl: 'https://maps.app.goo.gl/tt8GLbJy14L8CaaCA',
  /** Embedded map on the contact page */
  mapEmbed:
    'https://maps.google.com/maps?q=Bangash%20real%20estate%20and%20builders%2C%20Airport%20Housing%20Society%20Sector%204%2C%20Rawalpindi&ll=33.5881869,73.1232242&z=17&output=embed',
  /** Google Search Console verification code (only the content="..." value) */
  googleVerification: env('PUBLIC_GOOGLE_SITE_VERIFICATION') || '',
  /** Google Analytics 4 measurement ID (G-…). Empty = GA4 off. WhatsApp / call / form clicks are sent as events. */
  ga4Id: env('PUBLIC_GA4_ID') || '',
  /** Google rating */
  googleRating: 4.9,
  hours: 'Open daily: 9:00 AM – 10:00 PM',
  hoursSchema: 'Mo-Su 09:00-22:00',

  // Leave empty to hide the icon
  socials: {
    facebook: 'https://www.facebook.com/profile.php?id=61591095865560',
    instagram: '',
    youtube: '',
    tiktok: 'https://www.tiktok.com/@umersaeed_68',
  },

  // ---------------- STATS (defaults — can be changed in admin → Settings) ----------------
  stats: [
    { value: 4, suffix: '+', label: 'Years of Experience' },
    { value: 70, suffix: '+', label: 'Properties Sold & Rented' },
    { value: 70, suffix: '+', label: 'Happy Families' },
    { value: 10, suffix: '+', label: 'Homes & Projects Built' },
  ],
} as const;

/* ==========================================================================
   SUPABASE (backend) — both values are public and safe in the browser.
   ⚠️ NEVER put the secret key (sb_secret_...) here.
   ========================================================================== */
export const SUPABASE = {
  url: 'https://tgqqhzunbkyifcesfndd.supabase.co',
  publishableKey: 'sb_publishable_Xa7aSCfk7V3jKSEFDwfeiQ_uv0au2ub',
  bucket: 'media',
};

/* ==========================================================================
   WHATSAPP & EMAIL — CUSTOM MESSAGES
   These messages are pre-filled when a visitor taps a WhatsApp / email button.
   Each button sends a message that fits where it was tapped. Plain text only —
   emojis in WhatsApp links turn into "�" on some phones.
   ========================================================================== */
const HELLO = 'Hello Bangash Real Estate & Builders!';

export const MESSAGES = {
  /** Every general WhatsApp button (header, floating button, footer, contact page) — short and friendly */
  general: `${HELLO} I found you through your website and would like to discuss a property with you.`,

  /** "Enquire" on a listing — with the details, so the agent knows exactly which property */
  property: (p: { title: string; location: string; price: string; url: string }) =>
    [`${HELLO} I'm interested in this property on your website:`, '', p.title, `Location: ${p.location}`, `Price: ${p.price}`, p.url, '', 'Please share more details and when I can visit.'].join('\n'),

  /** A listing that has been sold or rented out → something similar */
  similar: (p: { title: string; status: string; area: string }) =>
    `${HELLO} I saw "${p.title}" on your website, but it has been ${p.status}. Do you have something similar in ${p.area}?`,

  /** Construction / builder quote */
  construction: `${HELLO} I have a plot and would like a quote for building a house or flats on it.`,

  /** About an area or a city */
  area: (area: string) => `${HELLO} I'm looking for a property in ${area}. What do you have available at the moment?`,

  /** About a service (plots / houses / flats) */
  service: (service: string) => `${HELLO} I'm interested in ${service.toLowerCase()} and would like to discuss my options.`,

  /** Visitor wants to sell / rent out their property */
  listProperty: `${HELLO} I'd like to sell or rent out my property through you.`,

  /** From a property guide */
  guide: (title: string) => `${HELLO} I read your guide "${title}" and have a question.`,

  /** Properties page when nothing matches the search */
  notFound: `${HELLO} I couldn't find what I'm looking for on your website. Could you help me find a property?`,

  /** AUTO-REPLY email sent to whoever submits the website form */
  autoReply: [
    'Hello,',
    '',
    'Thank you for contacting Bangash Real Estate & Builders. We have received your enquiry and our agent will contact you shortly.',
    '',
    'For a faster response, WhatsApp or call us: 0332-0445759',
    'Office: Gulistan Plaza No. 18, B Block, Street 13-A, Sector 4, Airport Housing Society, Rawalpindi (open daily 9 AM – 10 PM)',
    '',
    'Bangash Real Estate & Builders — Your Trust, Our Commitment.',
  ].join('\n'),

  /** Subject of the lead email you receive */
  leadSubject: 'New property enquiry from website — Bangash Real Estate',

  /** Default email subject + body */
  emailSubject: 'Property Enquiry — Bangash Real Estate & Builders',
  emailBody: [
    'Dear Bangash Real Estate & Builders team,',
    '',
    'I found you on your website and would like some help with a property.',
    '',
    'Name: ',
    'Phone / WhatsApp: ',
    'I want to (Buy / Rent / Sell / Construction): ',
    'Property type (House / Flat / Plot): ',
    'Preferred location: ',
    'Budget: ',
    '',
    'Details: ',
    '',
    'Thank you,',
  ].join('\n'),
};

/** Ready-made WhatsApp link (optional custom message). */
export function whatsappLink(message: string = MESSAGES.general): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}

/** Ready-made email link with custom subject & body. */
export function emailLink(subject: string = MESSAGES.emailSubject, body: string = MESSAGES.emailBody): string {
  return `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Properties', href: '/properties/' },
  { label: 'Services', href: '/services/', children: true },
  { label: 'Areas', href: '/areas/' },
  { label: 'Guides', href: '/guides/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
] as const;
