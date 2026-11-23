/* ==========================================================================
   BANGASH REAL ESTATE — SITE SETTINGS
   --------------------------------------------------------------------------
   Phone, WhatsApp, email, address, social links aur stats sab yahin se
   edit karein. Poori website khud update ho jayegi.
   ========================================================================== */

export const SITE = {
  name: 'Bangash Real Estate',
  shortName: 'Bangash',
  legalName: 'Bangash Real Estate & Builders',
  tagline: 'Plots, Houses & Flats in Rawalpindi & Islamabad',

  /** Live domain — sitemap, canonical URLs aur social previews isi se bante hain. */
  url: 'https://bangashrealestate.vercel.app',

  description:
    'Bangash Real Estate — trusted property dealers in Rawalpindi & Islamabad. Buy, sell or rent plots, houses and flats in Airport Housing Society, Ghauri Town, Bahria Town, DHA and more. We also build homes and apartments on contract.',

  // ---------------- CONTACT (TODO: apni asal details daalein) ----------------
  phone: '+92 300 0000000',          // Jaisa website par dikhe
  phoneLink: '+923000000000',        // Sirf digits, + ke saath (tel: link ke liye)
  whatsapp: '923000000000',          // Country code ke saath, bina + aur bina 0 ke
  whatsappMessage: 'Assalam o Alaikum! I found you on your website and I am interested in a property.',
  email: 'info@bangashrealestate.com',

  address: {
    street: 'Main Boulevard, Airport Housing Society',
    city: 'Rawalpindi',
    region: 'Punjab',
    postalCode: '46000',
    country: 'PK',
  },
  /** Google Maps embed ke liye search text (ya baad mein apna exact embed URL lagayein). */
  mapQuery: 'Airport Housing Society, Rawalpindi',
  hours: 'Mon – Sat: 10:00 AM – 8:00 PM',
  hoursSchema: 'Mo-Sa 10:00-20:00',

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

/** Ready-made WhatsApp link (optional custom message). */
export function whatsappLink(message: string = SITE.whatsappMessage): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Properties', href: '/properties/' },
  { label: 'Services', href: '/services/', children: true },
  { label: 'Areas', href: '/areas/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
] as const;
