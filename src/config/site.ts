/* ==========================================================================
   BANGASH REAL ESTATE & BUILDERS — SITE SETTINGS
   --------------------------------------------------------------------------
   Phone, WhatsApp, email, address, social links, stats aur WhatsApp/Email
   ke custom messages sab yahin se edit karein. Poori website khud update
   ho jayegi.
   ========================================================================== */

export const SITE = {
  /** Google Business Profile wala poora naam (local SEO ke liye same rakhein) */
  name: 'Bangash Real Estate & Builders',
  /** Page titles ke end mein lagne wala chhota naam */
  titleName: 'Bangash Real Estate',
  shortName: 'Bangash',
  legalName: 'Bangash Real Estate & Builders',
  tagline: 'Your trusted partner in real estate & construction',
  motto: 'Your Trust, Our Commitment.',

  /** Live domain — sitemap, canonical URLs aur social previews isi se bante hain. */
  url: 'https://bangashrealestate.vercel.app',

  description:
    'Bangash Real Estate & Builders — trusted property dealers and builders in Rawalpindi & Islamabad. Buy, sell or rent houses, flats and plots in Airport Housing Society, Ghauri Town, Bahria Town, DHA and more. Bank loan available on selected properties.',

  // ---------------- CONTACT ----------------
  phone: '0332-0445759',             // Jaisa website par dikhe
  phoneLink: '+923320445759',        // tel: link ke liye (+92 ke saath)
  whatsapp: '923320445759',          // Country code ke saath, bina + aur bina 0 ke
  email: 'engrumersaeed.6899@gmail.com',

  address: {
    street: 'Gulistan Plaza No. 18, B Block, Street 13-A, Sector 4, Airport Housing Society',
    short: 'Gulistan Plaza, Sector 4, Airport Housing Society',
    city: 'Rawalpindi',
    region: 'Punjab',
    postalCode: '46000',
    country: 'PK',
  },
  geo: { lat: 33.5881869, lng: 73.1232242 },
  /** Google Maps ka share link (Directions button) */
  mapsUrl: 'https://maps.app.goo.gl/tt8GLbJy14L8CaaCA',
  /** Contact page par embedded map */
  mapEmbed:
    'https://maps.google.com/maps?q=Bangash%20real%20estate%20and%20builders%2C%20Airport%20Housing%20Society%20Sector%204%2C%20Rawalpindi&ll=33.5881869,73.1232242&z=17&output=embed',
  /** Google Search Console verification code (sirf content="..." wala hissa) */
  googleVerification: '',
  /** Google reviews */
  googleRating: 4.9,
  hours: 'Open daily: 9:00 AM – 10:00 PM',
  hoursSchema: 'Mo-Su 09:00-22:00',

  // Khali chhor dein to icon nahi dikhega
  socials: {
    facebook: '',
    instagram: '',
    youtube: '',
    tiktok: '',
  },

  // ---------------- STATS (TODO: apne asal numbers daalein) ----------------
  stats: [
    { value: 12, suffix: '+', label: 'Years of Experience' },
    { value: 1500, suffix: '+', label: 'Properties Sold & Rented' },
    { value: 900, suffix: '+', label: 'Happy Families' },
    { value: 60, suffix: '+', label: 'Homes & Projects Built' },
  ],
} as const;

/* ==========================================================================
   WHATSAPP & EMAIL — CUSTOM MESSAGES
   Visitor jab button dabata hai to ye message pehle se likha hua aata hai.
   ========================================================================== */
const HELLO = 'Assalam o Alaikum, Bangash Real Estate & Builders! 🏡';

export const MESSAGES = {
  /** General WhatsApp button (header, floating button, footer) */
  general: [
    HELLO,
    'I visited your website and I am looking for a property.',
    '',
    '🏠 Requirement (House / Flat / Plot — Buy / Rent): ',
    '📍 Preferred location: ',
    '💰 Budget: ',
  ].join('\n'),

  /** Kisi khaas property ke liye */
  property: (p: { title: string; location: string; price: string; url: string }) =>
    [HELLO, 'I am interested in this property:', '', `🏠 ${p.title}`, `📍 ${p.location}`, `💰 ${p.price}`, `🔗 ${p.url}`, '', 'Please share more details and visit timings.'].join('\n'),

  /** Construction / builder quote */
  construction: [
    HELLO,
    'I want a quote for construction.',
    '',
    '📍 Plot location: ',
    '📐 Plot size (Marla / Kanal): ',
    '🏗️ Grey structure or complete construction: ',
    '🏢 House or flats: ',
  ].join('\n'),

  /** Kisi area ke baare mein */
  area: (area: string) => [HELLO, `I am looking for a property in ${area}.`, '', '🏠 Requirement (House / Flat / Plot — Buy / Rent): ', '💰 Budget: '].join('\n'),

  /** Kisi service ke baare mein */
  service: (service: string) => [HELLO, `I need help with: ${service}.`, '', '📍 Preferred location: ', '💰 Budget: '].join('\n'),

  /** Apni property sell / rent out karni ho */
  listProperty: [HELLO, 'I want to sell / rent out my property.', '', '🏠 Property type & size: ', '📍 Location: ', '💰 Expected price / rent: '].join('\n'),

  /** Email ka default subject + body */
  emailSubject: 'Property Enquiry — Bangash Real Estate & Builders',
  emailBody: [
    'Assalam o Alaikum Bangash Real Estate & Builders,',
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
    'JazakAllah,',
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
