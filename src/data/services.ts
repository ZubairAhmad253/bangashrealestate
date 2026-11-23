import type { ImageMetadata } from 'astro';
import plot1 from '../assets/images/plot-1.jpg';
import house1 from '../assets/images/house-1.jpg';
import flat1 from '../assets/images/flat-1.jpg';
import construction2 from '../assets/images/construction-2.jpg';

export type IconName = string;

export interface Service {
  slug: 'plots' | 'houses' | 'flats' | 'construction';
  /** Property type filter jo is service se match karta hai */
  propertyType?: 'plot' | 'house' | 'flat';
  name: string;
  menuLabel: string;
  icon: IconName;
  image: ImageMetadata;
  short: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  intro: string;
  offerings: string[];
  steps: { title: string; text: string }[];
  faqs: { q: string; a: string }[];
  tags: string[];
}

export const SERVICES: Service[] = [
  {
    slug: 'construction',
    name: 'Construction & Builders',
    menuLabel: 'Construction',
    icon: 'hardhat',
    image: construction2,
    short:
      'Have a plot? We design and build your house or apartment building from foundation to handover — grey structure or complete turnkey.',
    seoTitle: 'Construction Company & Home Builders in Rawalpindi & Islamabad',
    seoDescription:
      'Bangash Builders constructs houses and flats in Rawalpindi & Islamabad — grey structure, complete turnkey construction, renovation and design with transparent costing.',
    h1: 'House & Flat Construction in Rawalpindi & Islamabad',
    intro:
      'Give us your plot and your vision — we handle the rest. From architectural design and society approvals to grey structure, finishing and handover, our builder team delivers homes and apartment buildings with quality materials, clear costing and on-time completion.',
    offerings: [
      'Architectural & structural design',
      'Society map approval assistance',
      'Grey structure construction',
      'Complete turnkey construction',
      'Renovation & extensions',
      'Flats / apartment buildings on contract',
      'Quality materials with transparent BOQ',
      'Regular site updates with photos',
    ],
    steps: [
      { title: 'Free consultation', text: 'Site visit, requirement discussion and a rough budget for your plot.' },
      { title: 'Design & approvals', text: '2D/3D plans, elevation and help with society map approval.' },
      { title: 'Construction', text: 'Grey structure and finishing by experienced teams with quality checks.' },
      { title: 'Handover', text: 'Final inspection, snag fixing and keys handed over to your family.' },
    ],
    faqs: [
      { q: 'Do you offer both grey structure and complete construction?', a: 'Yes. You can hire us for grey structure only, or for complete turnkey construction including finishing, electrical, plumbing, woodwork and paint.' },
      { q: 'How long does it take to build a 5 or 10 marla house?', a: 'Timelines depend on design and finishing, but a typical 5–10 marla double-storey house takes about 8–12 months. We share a schedule before starting.' },
      { q: 'Can you build flats or an apartment building on my plot?', a: 'Yes. We build multi-unit residential buildings and flats on contract, including planning for rental or resale.' },
    ],
    tags: ['Grey Structure', 'Turnkey', 'Renovation', 'Apartments'],
  },
  {
    slug: 'plots',
    propertyType: 'plot',
    name: 'Plots for Sale',
    menuLabel: 'Plots',
    icon: 'map',
    image: plot1,
    short: 'Residential & commercial plots with verified documents in top societies.',
    seoTitle: 'Plots for Sale in Rawalpindi & Islamabad — Airport Society, Ghauri Town',
    seoDescription:
      'Buy or sell residential and commercial plots in Rawalpindi & Islamabad — Airport Housing Society, Ghauri Town, Bahria Town, DHA and more. Verified documents & fair prices.',
    h1: 'Plots for Sale in Rawalpindi & Islamabad',
    intro:
      'Whether you want to build your dream home or invest for the future, we help you buy and sell residential and commercial plots in Rawalpindi and Islamabad’s most trusted societies — with document verification, fair pricing and smooth transfer.',
    offerings: [
      '3, 5, 7, 10 marla & 1 kanal plots',
      'Corner, park-facing & boulevard plots',
      'Commercial plots',
      'Document & NOC verification',
      'Transfer process assistance',
      'Best price for sellers',
    ],
    steps: [
      { title: 'Share your budget', text: 'Tell us the area, size and budget you have in mind.' },
      { title: 'Shortlist & visit', text: 'We shortlist verified plots and arrange site visits.' },
      { title: 'Verify & negotiate', text: 'Documents are checked and we negotiate the best price.' },
      { title: 'Transfer', text: 'Token, payment and transfer completed with full support.' },
    ],
    faqs: [
      { q: 'Do you verify plot documents before sale?', a: 'Yes. We check ownership, society records and NOCs before any token is paid, so you buy with confidence.' },
      { q: 'Can you sell my plot for me?', a: 'Absolutely. Share the plot details and we will market it to our network of genuine buyers and get you the best price.' },
    ],
    tags: ['Residential', 'Commercial', 'Corner', 'Investment'],
  },
  {
    slug: 'houses',
    propertyType: 'house',
    name: 'Houses for Sale & Rent',
    menuLabel: 'Houses',
    icon: 'home',
    image: house1,
    short: 'Brand-new and resale houses, upper & lower portions — buy, sell or rent.',
    seoTitle: 'Houses for Sale & Rent in Rawalpindi & Islamabad',
    seoDescription:
      'Find houses for sale and rent in Rawalpindi & Islamabad — 5 marla, 10 marla, 1 kanal houses and portions in Airport Housing Society, Ghauri Town, Bahria Town & more.',
    h1: 'Houses for Sale & Rent in Rawalpindi & Islamabad',
    intro:
      'From compact 5 marla homes to 1 kanal luxury houses, we help families buy, sell and rent houses and portions across Rawalpindi and Islamabad. Every listing is checked, and we stay with you from the first visit to the final key.',
    offerings: [
      'Brand-new & resale houses',
      'Upper & lower portions for rent',
      'Single & double-storey homes',
      'Luxury designer houses',
      'Tenant verification for owners',
      'Rental agreements & paperwork',
    ],
    steps: [
      { title: 'Tell us what you need', text: 'Area, size, budget and whether you want to buy or rent.' },
      { title: 'Visit homes', text: 'We arrange visits to matching houses at your convenience.' },
      { title: 'Negotiate', text: 'We negotiate price and terms in your favour.' },
      { title: 'Move in', text: 'Agreement, payment and handover — done smoothly.' },
    ],
    faqs: [
      { q: 'Do you deal in houses for rent as well as sale?', a: 'Yes. We handle both sale and rental of full houses and portions, including tenant verification and rental agreements.' },
      { q: 'I want to sell my house. How do you help?', a: 'We evaluate the right price, photograph and list your house, bring serious buyers and handle negotiation and paperwork.' },
    ],
    tags: ['For Sale', 'For Rent', 'Portions', 'Luxury'],
  },
  {
    slug: 'flats',
    propertyType: 'flat',
    name: 'Flats & Apartments',
    menuLabel: 'Flats',
    icon: 'building',
    image: flat1,
    short: 'Studio, 1, 2 & 3-bed apartments for sale and rent in prime locations.',
    seoTitle: 'Flats & Apartments for Sale & Rent in Rawalpindi & Islamabad',
    seoDescription:
      'Studio, 1, 2 and 3 bedroom flats and apartments for sale and rent in Rawalpindi & Islamabad — Bahria Town, Ghauri Town, Gulberg and more. Call Bangash Real Estate.',
    h1: 'Flats & Apartments for Sale & Rent',
    intro:
      'Looking for a modern apartment to live in or a flat that earns steady rent? We list studio, 1, 2 and 3-bedroom flats in secure buildings across Rawalpindi and Islamabad — for sale and for rent.',
    offerings: [
      'Studio, 1, 2 & 3-bed apartments',
      'Furnished & semi-furnished flats',
      'Flats for rental income',
      'Apartments in gated communities',
      'Installment-plan projects',
      'Tenant & owner verification',
    ],
    steps: [
      { title: 'Share preferences', text: 'Bedrooms, budget, furnished or not, and preferred area.' },
      { title: 'Shortlist', text: 'We send verified options with photos and details.' },
      { title: 'Visit & decide', text: 'Visit apartments with our team and finalise.' },
      { title: 'Paperwork', text: 'Agreement, payment and possession handled for you.' },
    ],
    faqs: [
      { q: 'Do you have furnished flats for rent?', a: 'Yes, we regularly have furnished and semi-furnished apartments for rent. Message us on WhatsApp with your requirements.' },
      { q: 'Are flats a good investment in Rawalpindi & Islamabad?', a: 'Flats in good locations offer steady rental income and lower entry cost than houses. We can guide you to buildings with strong rental demand.' },
    ],
    tags: ['Studio', '1–3 Bed', 'Furnished', 'Rental Income'],
  },
];

export const getService = (slug: string) => SERVICES.find((s) => s.slug === slug);
