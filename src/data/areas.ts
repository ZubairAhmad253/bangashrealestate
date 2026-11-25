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
  /** Lower numbers are shown first (and larger) on the home page */
  priority: number;
}

export interface AreaGuide {
  /** Questions people actually ask about this area — written for this area only */
  faqs: { q: string; a: string }[];
  /** What to check before buying or renting here */
  checks: string[];
  /** Related guide slugs (src/content/guides) */
  guides?: string[];
}

/* To add a new area, add another object in the same format. */
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
    highlights: ['Luxury villas & designer homes', 'Apartments in commercial blocks', 'Developed & possession plots', 'Gated community with its own security'],
  },
  {
    slug: 'dha',
    name: 'DHA Islamabad–Rawalpindi',
    city: 'Rawalpindi / Islamabad',
    image: house5,
    priority: 4,
    short: 'Plots, plot files and homes in DHA — with careful verification and transfer support.',
    intro:
      'DHA Islamabad–Rawalpindi is a premium choice for buyers who want planned infrastructure and long-term value. We assist with plot files, possession plots and constructed houses, including verification and transfer paperwork.',
    highlights: ['Plot files & possession plots', 'Constructed luxury homes', 'Transfer & verification support', 'Planned roads & infrastructure'],
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

/* Area-specific advice and FAQs. Keep every answer specific to the area and free of
   prices or figures that change — current listings and prices come from the database. */
export const AREA_GUIDES: Record<string, AreaGuide> = {
  'airport-housing-society': {
    faqs: [
      { q: 'Where is your office in Airport Housing Society?', a: 'Our office is in Gulistan Plaza No. 18, B Block, Street 13-A, Sector 4, Airport Housing Society, Rawalpindi. You are welcome to visit before or after viewing properties.' },
      { q: 'Which sector of Airport Housing Society should I choose?', a: 'It depends on your budget, the house size you need and where you commute. Sectors differ in street width, how built-up they are and how close they are to main roads and markets. Tell us your priorities and we will shortlist streets that fit.' },
      { q: 'Are portions (upper or lower) available for rent?', a: 'Portions are one of the most common rentals in the society. Rent depends on the size, floor, condition and whether the portion has separate meters and a separate entrance.' },
      { q: 'Can I get a bank loan on a house here?', a: 'Bank financing is available on selected properties. Share your budget and we will tell you which listings qualify and walk you through the bank’s process.' },
    ],
    checks: ['Street width and whether the house is corner or park-facing', 'Separate electricity, gas and water meters for each portion', 'Society transfer record and any pending dues', 'Age of construction, seepage and the condition of the roof'],
    guides: ['airport-housing-society-rawalpindi-guide', '5-marla-vs-10-marla-house'],
  },
  'ghauri-town': {
    faqs: [
      { q: 'Is Ghauri Town in Rawalpindi or Islamabad?', a: 'Ghauri Town lies along the Islamabad Expressway on the Rawalpindi–Islamabad border, on the Islamabad side — which is why people search for it under both cities.' },
      { q: 'Is Ghauri Town good for first-time buyers?', a: 'Many first-time buyers look here because smaller houses, flats and plots are widely available. Check the phase, the transfer process and the condition of the street before deciding.' },
      { q: 'How do I check a property’s papers in Ghauri Town?', a: 'Ask for the ownership documents and confirm them with the relevant office before paying any token. Some properties transfer through the society and others through registry and mutation — we explain which applies to the property you choose.' },
    ],
    checks: ['Which phase the property is in and how ownership is transferred', 'Water source — society supply, boring or tankers', 'Drainage of the street after rain', 'Whether the builder of a new house gives any written warranty'],
    guides: ['ghauri-town-property-buying-guide', 'things-to-check-before-buying-a-plot'],
  },
  'bahria-town': {
    faqs: [
      { q: 'Is Bahria Town in Rawalpindi or Islamabad?', a: 'Bahria Town spreads across the Rawalpindi and Islamabad sides of the Islamabad Expressway in several phases. The phase decides the address, the facilities nearby and the price.' },
      { q: 'What should I compare between Bahria Town phases?', a: 'Possession status, how developed the phase is, distance to the main boulevard and commercial areas, and maintenance charges. Two plots of the same size can have very different values in different phases.' },
      { q: 'Do you deal in apartments in Bahria Town?', a: 'Yes — apartments in commercial blocks are common here, for sale and for rent. Check the building’s maintenance, lifts, parking and backup power before deciding.' },
      { q: 'What is the difference between a file and a possession plot?', a: 'A possession plot has been allotted and handed over on the ground; a file is a right to a plot that may not be allotted yet. Files carry more risk and need closer checking of the developer’s record.' },
    ],
    checks: ['Possession status and the society’s transfer record', 'Level of the plot compared with the road', 'Maintenance and development charges', 'Distance to the main boulevard and commercial area'],
    guides: ['bahria-town-rawalpindi-property-prices', 'property-investment-islamabad'],
  },
  dha: {
    faqs: [
      { q: 'Do you deal in DHA plot files?', a: 'Yes, along with possession plots and constructed houses. Files and plots must be verified with DHA before any payment — we help you complete the verification and the transfer.' },
      { q: 'Can I build a house on a DHA plot?', a: 'Yes, in sectors where possession has been given. DHA has its own building rules and map approval; our construction team builds to those rules and helps with the approval process.' },
      { q: 'Why do DHA prices differ so much between phases?', a: 'Development status, possession, location inside the phase, plot size and category (corner, park-facing, main boulevard). Always compare like with like.' },
    ],
    checks: ['Verification of the file or plot with DHA', 'Possession and the development status of the sector', 'DHA’s building rules before buying a plot to build on', 'Transfer charges and dues payable at transfer'],
    guides: ['things-to-check-before-buying-a-plot', 'property-investment-islamabad'],
  },
  'gulzar-e-quaid': {
    faqs: [
      { q: 'Is Gulzar-e-Quaid close to Airport Housing Society?', a: 'Yes, the two neighbourhoods are next to each other — we work in Gulzar-e-Quaid every day from our office in Airport Housing Society.' },
      { q: 'Is Gulzar-e-Quaid good for renting?', a: 'It is popular with families and working people because of its central location and access to the Expressway. Portions and houses are the most common rentals.' },
      { q: 'What should I check when renting a portion here?', a: 'Separate meters, a separate entrance, water supply, parking and the terms of the written rental agreement (advance, notice period and yearly increase).' },
    ],
    checks: ['Separate meters and entrance for each portion', 'Water supply and storage', 'Street access and parking for your car', 'A written rental or sale agreement'],
    guides: ['airport-housing-society-rawalpindi-guide', 'best-areas-to-buy-property-rawalpindi'],
  },
  'chaklala-scheme-3': {
    faqs: [
      { q: 'What kind of houses are found in Chaklala Scheme 3?', a: 'It is known for larger family houses on wide roads with green belts. Ready houses are more common than empty plots.' },
      { q: 'Is Chaklala Scheme 3 good for renting out a house?', a: 'Larger houses here attract families looking for space in a planned neighbourhood. Rent depends on the size, condition and the street.' },
      { q: 'How is ownership transferred in Chaklala Scheme 3?', a: 'The process depends on the property and the office responsible for it. We check the documents and explain each step before you pay any token.' },
    ],
    checks: ['Ownership documents and the transfer process', 'Age and structure of older houses', 'Road width and green belt location', 'Any renovation needed before moving in'],
    guides: ['best-areas-to-buy-property-rawalpindi', 'property-documents-checklist-rawalpindi-islamabad'],
  },
  'pwd-housing-society': {
    faqs: [
      { q: 'Where is PWD Housing Society?', a: 'PWD Housing Society is on the Islamabad Expressway, convenient for people who work in either Islamabad or Rawalpindi.' },
      { q: 'Can I rent a flat in PWD?', a: 'Flats and portions are commonly rented here. Check the building’s water supply, parking and maintenance arrangements.' },
    ],
    checks: ['Society transfer record and dues', 'Water supply for flats and portions', 'Access from the Expressway service road', 'Parking space'],
    guides: ['property-investment-islamabad'],
  },
  'korang-town': {
    faqs: [
      { q: 'Where is Korang Town?', a: 'Korang Town is near Koral Chowk off the Islamabad Expressway, close to the Rawalpindi side.' },
      { q: 'Is Korang Town good for building a house?', a: 'Families who want an Islamabad address on a smaller budget often consider it. Check the plot’s documents, access road and utilities before buying to build.' },
    ],
    checks: ['Approval and ownership documents', 'Access road and street width', 'Electricity, gas and water availability', 'Drainage of the plot'],
    guides: ['things-to-check-before-buying-a-plot'],
  },
  'media-town': {
    faqs: [
      { q: 'Where is Media Town?', a: 'Media Town is a residential society in Rawalpindi near Bahria Town and the Islamabad Expressway.' },
      { q: 'Who is Media Town suitable for?', a: 'Families looking for a quieter neighbourhood at a reasonable budget, close to Bahria Town’s commercial areas.' },
    ],
    checks: ['Society transfer process and dues', 'Development of the specific block', 'Water source', 'Distance to the schools and markets you need'],
    guides: ['best-areas-to-buy-property-rawalpindi'],
  },
  'soan-garden': {
    faqs: [
      { q: 'Where is Soan Garden?', a: 'Soan Garden is an established society on the Islamabad Expressway.' },
      { q: 'Are commercial units available in Soan Garden?', a: 'Besides houses and plots, the society has commercial options. Ask us what is available now and we will share the details.' },
    ],
    checks: ['Block and its development status', 'Ownership documents and dues', 'Road noise for properties facing the Expressway', 'Utilities'],
    guides: ['property-investment-islamabad'],
  },
};
