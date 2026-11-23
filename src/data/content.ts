/* Home page text content — FAQs, testimonials, "Why choose us". */

export const WHY_US = [
  { icon: 'shield', title: 'Verified Properties', text: 'Every listing is checked for ownership and documents before we show it to you.' },
  { icon: 'pin', title: 'Local Area Experts', text: 'Based in Rawalpindi — we know every sector of Airport Society, Ghauri Town and beyond.' },
  { icon: 'trending', title: 'Fair Market Pricing', text: 'Honest valuations so sellers get the best price and buyers never overpay.' },
  { icon: 'file', title: 'Complete Paperwork', text: 'Token, agreement, transfer and rental documents handled end-to-end.' },
  { icon: 'hardhat', title: 'Builders Too', text: 'One team to buy your plot and build your home or apartment building on it.' },
  { icon: 'bank', title: 'Bank Loan Available', text: 'Bank financing available on selected properties — we guide you through the whole process.' },
];

/* Client reviews — managed in the admin panel (Reviews).
   While the list is empty, the website shows the Google rating (4.9★) card. */
import { remote } from '../lib/remote';
export const TESTIMONIALS: { name: string; place: string; text: string; rating: number }[] = remote.testimonials.map((t) => ({
  name: t.name,
  place: t.place,
  text: t.text,
  rating: t.rating,
}));

export const HOME_FAQS = [
  {
    q: 'Which areas does Bangash Real Estate cover?',
    a: 'We mainly work in Rawalpindi and Islamabad — especially Airport Housing Society, Ghauri Town, Gulzar-e-Quaid, Chaklala Scheme 3, Bahria Town, DHA, PWD, Korang Town, Media Town and Soan Garden.',
  },
  {
    q: 'Can you help me sell or rent out my property?',
    a: 'Yes. Send us your property details on WhatsApp. We evaluate the right price, market it to genuine buyers or tenants and handle negotiation and paperwork.',
  },
  {
    q: 'Do you also construct houses and flats?',
    a: 'Yes. Along with buying, selling and renting, we work as builders — we construct houses and apartment buildings on contract, from grey structure to complete turnkey projects.',
  },
  {
    q: 'Is bank loan / financing available?',
    a: 'Yes — bank loan facility is available on selected properties. Share your budget and we will guide you on eligible properties and the bank process.',
  },
  {
    q: 'Do you charge buyers a commission?',
    a: 'Our commission is standard and always discussed upfront — no hidden charges. Contact us for details on your specific deal.',
  },
  {
    q: 'How can I contact you quickly?',
    a: 'The fastest way is WhatsApp — tap the green button on any page, or call 0332-0445759. Our office in Gulistan Plaza, Sector 4, Airport Housing Society is open daily from 9 AM to 10 PM.',
  },
];
