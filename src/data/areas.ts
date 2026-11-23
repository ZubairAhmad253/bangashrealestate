import type { ImageMetadata } from 'astro';
import house2 from '../assets/images/house-2.jpg';
import house3 from '../assets/images/house-3.jpg';
import house5 from '../assets/images/house-5.jpg';
import house7 from '../assets/images/house-7.jpg';
import house9 from '../assets/images/house-9.jpg';
import villa from '../assets/images/villa-pool.jpg';
import plot2 from '../assets/images/plot-2.jpg';
import flatBuilding1 from '../assets/images/flat-building-1.jpg';
import flatBuilding2 from '../assets/images/flat-building-2.jpg';
import city from '../assets/images/city.jpg';

export interface Area {
  slug: string;
  name: string;
  city: 'Rawalpindi' | 'Islamabad' | 'Rawalpindi / Islamabad';
  image: ImageMetadata;
  short: string;
  intro: string;
  highlights: string[];
  /** Pehle wale areas home page par bade dikhte hain */
  priority: number;
}

/* Naya area add karna ho to isi format mein ek object aur daal dein. */
export const AREAS: Area[] = [
  {
    slug: 'airport-housing-society',
    name: 'Airport Housing Society',
    city: 'Rawalpindi',
    image: house2,
    priority: 1,
    short: 'Our home ground — houses, plots and portions across all sectors of Airport Housing Society.',
    intro:
      'Airport Housing Society is one of Rawalpindi’s most established family neighbourhoods, with paved streets, mosques, schools, markets and easy access to the Islamabad Expressway and Gulzar-e-Quaid. Our office works in this society every day, so we know the sectors, street widths, corner plots and fair market prices first-hand.',
    highlights: [
      'Houses & upper/lower portions for sale and rent',
      'Residential plots in multiple sectors',
      'Close to Islamabad Expressway & Gulzar-e-Quaid',
      'Schools, markets & mosques within walking distance',
    ],
  },
  {
    slug: 'ghauri-town',
    name: 'Ghauri Town',
    city: 'Islamabad',
    image: house3,
    priority: 2,
    short: 'Affordable plots, houses and flats along the Islamabad Expressway, minutes from Rawalpindi.',
    intro:
      'Ghauri Town sits along the Islamabad Expressway on the Rawalpindi–Islamabad border and is popular with families looking for value. With multiple phases, ready houses, apartments and a wide range of plot sizes, it is one of the best areas for first-time buyers and investors.',
    highlights: [
      'Budget-friendly 3 to 10 marla houses',
      'Flats & apartments for rent',
      'Plots for investment and construction',
      'Direct access from Islamabad Expressway',
    ],
  },
  {
    slug: 'bahria-town',
    name: 'Bahria Town',
    city: 'Rawalpindi / Islamabad',
    image: villa,
    priority: 3,
    short: 'Gated living with modern villas, apartments and plots across Bahria Town phases.',
    intro:
      'Bahria Town Rawalpindi/Islamabad offers gated community living with parks, commercial areas and 24/7 security. We deal in houses, apartments and plots across its phases and help clients compare locations, possession status and payment plans.',
    highlights: ['Luxury villas & designer homes', 'Apartments in commercial blocks', 'Developed & possession plots', 'Gated security & amenities'],
  },
  {
    slug: 'dha',
    name: 'DHA Islamabad–Rawalpindi',
    city: 'Rawalpindi / Islamabad',
    image: house5,
    priority: 4,
    short: 'Premium plots and homes in DHA with verified files and transparent dealing.',
    intro:
      'DHA Islamabad–Rawalpindi is a premium choice for buyers who want planned infrastructure and long-term value. We assist with plot files, possession plots and constructed houses, including verification and transfer paperwork.',
    highlights: ['Plot files & possession plots', 'Constructed luxury homes', 'Transfer & verification support', 'Strong long-term investment'],
  },
  {
    slug: 'gulzar-e-quaid',
    name: 'Gulzar-e-Quaid',
    city: 'Rawalpindi',
    image: house9,
    priority: 5,
    short: 'Central, well-connected neighbourhood ideal for houses and rental portions.',
    intro:
      'Gulzar-e-Quaid is a central, well-connected Rawalpindi neighbourhood next to Airport Housing Society. It is ideal for families and working professionals who want quick access to the Expressway and the city.',
    highlights: ['Houses & portions for rent', 'Quick Expressway access', 'Established community', 'Good rental demand'],
  },
  {
    slug: 'chaklala-scheme-3',
    name: 'Chaklala Scheme 3',
    city: 'Rawalpindi',
    image: house7,
    priority: 6,
    short: 'Wide roads, green belts and spacious houses in one of Rawalpindi’s planned schemes.',
    intro:
      'Chaklala Scheme 3 is a planned Rawalpindi neighbourhood known for wide roads, green belts and spacious family homes. It stays in demand for both buyers and tenants.',
    highlights: ['Spacious 10 marla to 1 kanal houses', 'Planned layout & green belts', 'High rental demand', 'Commercial areas nearby'],
  },
  {
    slug: 'pwd-housing-society',
    name: 'PWD Housing Society',
    city: 'Islamabad',
    image: plot2,
    priority: 7,
    short: 'Developed society on the Expressway with ready houses, flats and plots.',
    intro:
      'PWD Housing Society on the Islamabad Expressway is a developed community offering houses, flats and plots at practical prices, with easy access to both Islamabad and Rawalpindi.',
    highlights: ['Ready houses & portions', 'Flats for rent', 'Plots for construction', 'Expressway location'],
  },
  {
    slug: 'korang-town',
    name: 'Korang Town',
    city: 'Islamabad',
    image: flatBuilding2,
    priority: 8,
    short: 'Value-for-money homes and plots near Koral Chowk and the Expressway.',
    intro:
      'Korang Town near Koral Chowk offers value-for-money houses and plots, making it a smart pick for families and investors who want an Islamabad address close to Rawalpindi.',
    highlights: ['Affordable houses', 'Residential plots', 'Near Koral Chowk', 'Growing community'],
  },
  {
    slug: 'media-town',
    name: 'Media Town',
    city: 'Rawalpindi',
    image: flatBuilding1,
    priority: 9,
    short: 'Quiet residential society close to Bahria Town and the Expressway.',
    intro:
      'Media Town is a quiet residential society in Rawalpindi close to Bahria Town and the Islamabad Expressway, popular with families who want calm surroundings at a reasonable price.',
    highlights: ['Family houses', 'Plots for construction', 'Peaceful environment', 'Close to Bahria Town'],
  },
  {
    slug: 'soan-garden',
    name: 'Soan Garden',
    city: 'Islamabad',
    image: city,
    priority: 10,
    short: 'Established Expressway society with houses, plots and commercial options.',
    intro:
      'Soan Garden on the Islamabad Expressway is an established society with houses, plots and commercial options, offering a balance of price and location.',
    highlights: ['Houses for sale & rent', 'Plots & commercial units', 'Expressway frontage', 'Established infrastructure'],
  },
];

export const getArea = (slug: string) => AREAS.find((a) => a.slug === slug);
