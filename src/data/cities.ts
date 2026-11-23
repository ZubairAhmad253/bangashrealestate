/* City landing pages — "Real estate in Rawalpindi", "Real estate in Islamabad" searches. */
import type { ImageMetadata } from 'astro';
import house2 from '../assets/images/house-2.jpg';
import city from '../assets/images/city.jpg';

export interface City {
  slug: 'rawalpindi' | 'islamabad';
  name: 'Rawalpindi' | 'Islamabad';
  image: ImageMetadata;
  title: string;
  description: string;
  h1: string;
  lead: string;
  body: { heading: string; text: string }[];
  faqs: { q: string; a: string }[];
}

export const CITIES: City[] = [
  {
    slug: 'rawalpindi',
    name: 'Rawalpindi',
    image: house2,
    title: 'Real Estate in Rawalpindi — Houses, Plots & Flats for Sale & Rent',
    description:
      'Trusted real estate agency in Rawalpindi. Buy, sell or rent houses, plots & flats in Airport Housing Society, Gulzar-e-Quaid, Chaklala Scheme 3, Bahria Town & more.',
    h1: 'Real Estate in Rawalpindi',
    lead: 'Houses, plots and flats for sale and rent across Rawalpindi — from our office in Airport Housing Society, Sector 4.',
    body: [
      {
        heading: 'Your local real estate agency in Rawalpindi',
        text: 'Bangash Real Estate & Builders is based in Gulistan Plaza, Sector 4, Airport Housing Society — right in the heart of Rawalpindi’s most active residential belt. We help families and investors buy, sell and rent houses, upper and lower portions, flats and residential plots, and we also construct homes and apartment buildings on contract.',
      },
      {
        heading: 'Popular areas we deal in',
        text: 'Most of our Rawalpindi work is in Airport Housing Society, Gulzar-e-Quaid, Chaklala Scheme 3, Media Town and the Rawalpindi side of Bahria Town and DHA. Because we work in these societies every day, we know street widths, corner plots, rental demand and fair market prices — so you never overpay and sellers get the right value.',
      },
      {
        heading: 'Buy, rent or build — with one trusted team',
        text: 'Whether you want a 5 marla house for your family, a portion on rent, a plot for investment, or a builder to construct on your plot, we handle verification, negotiation, paperwork and construction end-to-end. Bank loan facility is also available on selected properties.',
      },
    ],
    faqs: [
      { q: 'Which is the best area to buy a house in Rawalpindi?', a: 'It depends on your budget and needs. Airport Housing Society and Gulzar-e-Quaid offer established neighbourhoods with good connectivity, Chaklala Scheme 3 offers spacious planned houses, and Bahria Town offers gated living. Tell us your budget and we will shortlist the best options.' },
      { q: 'Do you have houses for rent in Rawalpindi?', a: 'Yes. We regularly have full houses, upper and lower portions and flats for rent in Rawalpindi, especially in Airport Housing Society and nearby societies. Message us on WhatsApp with your requirements.' },
      { q: 'Where is your office in Rawalpindi?', a: 'Our office is at Gulistan Plaza No. 18, B Block, Street 13-A, Sector 4, Airport Housing Society, Rawalpindi. We are open daily from 9 AM to 10 PM.' },
    ],
  },
  {
    slug: 'islamabad',
    name: 'Islamabad',
    image: city,
    title: 'Real Estate in Islamabad — Houses, Plots & Flats for Sale & Rent',
    description:
      'Real estate in Islamabad: buy, sell or rent houses, flats & plots in Ghauri Town, PWD, Korang Town, Soan Garden, Bahria Town & DHA. Bangash Real Estate & Builders.',
    h1: 'Real Estate in Islamabad',
    lead: 'Houses, flats and plots for sale and rent in Islamabad’s Expressway societies, Bahria Town and DHA.',
    body: [
      {
        heading: 'Real estate along the Islamabad Expressway',
        text: 'Just minutes from our Rawalpindi office, the Islamabad Expressway belt — Ghauri Town, PWD Housing Society, Korang Town and Soan Garden — offers some of the best value for families and first-time buyers in Islamabad. We deal in ready houses, flats for rent and plots for construction across these societies.',
      },
      {
        heading: 'Bahria Town & DHA Islamabad',
        text: 'For buyers who want gated communities and planned infrastructure, we assist with houses, apartments and plots in Bahria Town and DHA Islamabad, including file verification, possession status and transfer paperwork.',
      },
      {
        heading: 'One partner for Islamabad & Rawalpindi',
        text: 'Many of our clients compare options across both cities. Because we cover Islamabad and Rawalpindi together, we can show you the best choices for your budget on both sides — and if you own a plot, our builders can construct your home or apartment building on it.',
      },
    ],
    faqs: [
      { q: 'Is property cheaper in Ghauri Town than other Islamabad areas?', a: 'Ghauri Town and other Expressway societies are generally more affordable than sector-based areas of Islamabad, which makes them popular with families and first-time buyers. Prices vary by phase and plot size — contact us for current rates.' },
      { q: 'Do you deal in flats for rent in Islamabad?', a: 'Yes. We have furnished and unfurnished flats for rent in Ghauri Town, Bahria Town and nearby societies. Share your budget and preferred area on WhatsApp.' },
      { q: 'Can you help me buy a plot in DHA or Bahria Town Islamabad?', a: 'Yes. We help with plot files and possession plots, including document verification and the transfer process.' },
    ],
  },
];

export const getCity = (slug: string) => CITIES.find((c) => c.slug === slug);
