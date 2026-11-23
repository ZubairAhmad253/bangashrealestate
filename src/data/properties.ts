/* ==========================================================================
   PROPERTY LISTINGS
   --------------------------------------------------------------------------
   ⚠️ Ye SAMPLE listings hain — apni asal properties, prices aur photos se
   replace karein. Nayi property add karne ke liye bas ek object copy karke
   values badal dein. Photos `src/assets/images/` mein rakhein aur upar
   import karein. Har property ka apna SEO-friendly page khud ban jata hai.
   ========================================================================== */
import type { ImageMetadata } from 'astro';
import house1 from '../assets/images/house-1.jpg';
import house3 from '../assets/images/house-3.jpg';
import house4 from '../assets/images/house-4.jpg';
import house6 from '../assets/images/house-6.jpg';
import house8 from '../assets/images/house-8.jpg';
import house9 from '../assets/images/house-9.jpg';
import villa from '../assets/images/villa-pool.jpg';
import flat1 from '../assets/images/flat-1.jpg';
import flat2 from '../assets/images/flat-2.jpg';
import flat3 from '../assets/images/flat-3.jpg';
import flatBuilding1 from '../assets/images/flat-building-1.jpg';
import plot1 from '../assets/images/plot-1.jpg';
import plot2 from '../assets/images/plot-2.jpg';
import interior1 from '../assets/images/interior-1.jpg';
import interior2 from '../assets/images/interior-2.jpg';

export type Purpose = 'sale' | 'rent';
export type PropertyType = 'plot' | 'house' | 'flat';

export interface Property {
  slug: string;
  title: string;
  purpose: Purpose;
  type: PropertyType;
  /** Price in PKR (rent = per month) */
  price: number;
  /** Area slug — src/data/areas.ts se */
  area: string;
  /** Sector / phase / block */
  location: string;
  size: string;
  beds?: number;
  baths?: number;
  image: ImageMetadata;
  gallery?: ImageMetadata[];
  featured?: boolean;
  hot?: boolean;
  description: string;
  features: string[];
}

export const PROPERTIES: Property[] = [
  {
    slug: '10-marla-brand-new-house-airport-housing-society',
    title: '10 Marla Brand New Double Storey House',
    purpose: 'sale',
    type: 'house',
    price: 42_500_000,
    area: 'airport-housing-society',
    location: 'Sector 4, Airport Housing Society',
    size: '10 Marla',
    beds: 5,
    baths: 6,
    image: house1,
    gallery: [interior1, interior2],
    featured: true,
    hot: true,
    description:
      'A brand-new, designer double-storey house on a wide street in Airport Housing Society. Open-plan living, modern kitchen, spacious bedrooms with attached baths and premium finishes throughout. Close to the main boulevard, mosque, park and markets.',
    features: ['Brand new construction', 'Modern kitchen with cabinets', 'Attached baths', 'Car porch for 2 cars', 'Servant quarter', 'Near park & mosque'],
  },
  {
    slug: '1-kanal-luxury-villa-bahria-town',
    title: '1 Kanal Luxury Villa with Pool',
    purpose: 'sale',
    type: 'house',
    price: 95_000_000,
    area: 'bahria-town',
    location: 'Phase 8, Bahria Town',
    size: '1 Kanal',
    beds: 6,
    baths: 7,
    image: villa,
    gallery: [interior2, interior1],
    featured: true,
    description:
      'An architect-designed luxury villa with a private swimming pool, double-height lounge, home theatre and landscaped lawn. Ideal for families who want space, privacy and style in a gated community.',
    features: ['Private swimming pool', 'Double-height lounge', 'Home theatre', 'Landscaped lawn', 'Solar-ready', 'Gated security'],
  },
  {
    slug: '5-marla-residential-plot-airport-housing-society',
    title: '5 Marla Residential Plot — Ideal Location',
    purpose: 'sale',
    type: 'plot',
    price: 5_500_000,
    area: 'airport-housing-society',
    location: 'Sector 5, Airport Housing Society',
    size: '5 Marla',
    image: plot1,
    featured: true,
    description:
      'Level 5 marla residential plot in a developed sector with all utilities available. A great opportunity to build your own home or hold for investment.',
    features: ['Clear documents', 'Utilities available', 'Developed sector', 'Ready for construction'],
  },
  {
    slug: '2-bed-apartment-bahria-town',
    title: '2 Bed Modern Apartment',
    purpose: 'sale',
    type: 'flat',
    price: 11_500_000,
    area: 'bahria-town',
    location: 'Civic Centre, Bahria Town',
    size: '1,050 sq ft',
    beds: 2,
    baths: 2,
    image: flat1,
    gallery: [flat3, flat2],
    featured: true,
    description:
      'A bright, modern 2-bedroom apartment in a secure building with lift, backup power and parking — perfect to live in or rent out.',
    features: ['Lift & backup power', 'Dedicated parking', 'Open kitchen', 'Balcony', '24/7 security'],
  },
  {
    slug: '12-marla-corner-house-chaklala-scheme-3',
    title: '12 Marla Corner House',
    purpose: 'sale',
    type: 'house',
    price: 54_000_000,
    area: 'chaklala-scheme-3',
    location: 'Chaklala Scheme 3',
    size: '12 Marla',
    beds: 5,
    baths: 5,
    image: house4,
    gallery: [interior1, interior2],
    featured: true,
    description:
      'Well-maintained corner house on a wide road in Chaklala Scheme 3 with a lawn, spacious rooms and excellent natural light.',
    features: ['Corner plot', 'Front lawn', 'Wide road', 'Separate drawing & dining', 'Store room'],
  },
  {
    slug: '5-marla-house-ghauri-town',
    title: '5 Marla Double Storey House',
    purpose: 'sale',
    type: 'house',
    price: 16_500_000,
    area: 'ghauri-town',
    location: 'Phase 4A, Ghauri Town',
    size: '5 Marla',
    beds: 4,
    baths: 4,
    image: house3,
    gallery: [interior2, interior1],
    featured: true,
    description:
      'Affordable, well-built double-storey family house in Ghauri Town with easy access to the Islamabad Expressway.',
    features: ['Double storey', 'Tiled flooring', 'Gas & electricity', 'Near Expressway'],
  },
  {
    slug: '8-marla-house-for-rent-airport-housing-society',
    title: '8 Marla Full House for Rent',
    purpose: 'rent',
    type: 'house',
    price: 95_000,
    area: 'airport-housing-society',
    location: 'Sector 2, Airport Housing Society',
    size: '8 Marla',
    beds: 4,
    baths: 4,
    image: house6,
    gallery: [interior1, interior2],
    hot: true,
    description: 'Neat and clean full house for rent for a small family. Close to schools, markets and the main road.',
    features: ['Family preferred', 'Car parking', 'Separate meters', 'Near schools'],
  },
  {
    slug: '1-bed-flat-for-rent-ghauri-town',
    title: '1 Bed Furnished Flat for Rent',
    purpose: 'rent',
    type: 'flat',
    price: 38_000,
    area: 'ghauri-town',
    location: 'Phase 5, Ghauri Town',
    size: '550 sq ft',
    beds: 1,
    baths: 1,
    image: flat2,
    gallery: [flat1, flat3],
    description: 'Fully furnished 1-bedroom apartment, ideal for working professionals or small families.',
    features: ['Fully furnished', 'Backup power', 'Secure building', 'Near Expressway'],
  },
  {
    slug: '3-bed-apartment-for-rent-bahria-town',
    title: '3 Bed Luxury Apartment for Rent',
    purpose: 'rent',
    type: 'flat',
    price: 120_000,
    area: 'bahria-town',
    location: 'Phase 7, Bahria Town',
    size: '1,800 sq ft',
    beds: 3,
    baths: 3,
    image: flat3,
    gallery: [flat1, flatBuilding1],
    description: 'Spacious 3-bedroom luxury apartment with lift, gym and covered parking in a prime commercial location.',
    features: ['Lift & gym', 'Covered parking', 'Semi-furnished', 'Prime location'],
  },
  {
    slug: '10-marla-plot-ghauri-town',
    title: '10 Marla Plot near Main Boulevard',
    purpose: 'sale',
    type: 'plot',
    price: 9_500_000,
    area: 'ghauri-town',
    location: 'Phase 5, Ghauri Town',
    size: '10 Marla',
    image: plot2,
    description: 'Well-located 10 marla residential plot close to the main boulevard — build now or invest.',
    features: ['Near main boulevard', 'Possession available', 'Clear title', 'Investment opportunity'],
  },
  {
    slug: '7-marla-upper-portion-for-rent-gulzar-e-quaid',
    title: '7 Marla Upper Portion for Rent',
    purpose: 'rent',
    type: 'house',
    price: 45_000,
    area: 'gulzar-e-quaid',
    location: 'Gulzar-e-Quaid',
    size: '7 Marla',
    beds: 3,
    baths: 2,
    image: house9,
    gallery: [interior2, interior1],
    description: 'Upper portion with separate entrance, 3 bedrooms and TV lounge — ideal for a small family.',
    features: ['Separate entrance', 'Separate meters', 'TV lounge', 'Family only'],
  },
  {
    slug: '1-kanal-plot-dha',
    title: '1 Kanal Residential Plot',
    purpose: 'sale',
    type: 'plot',
    price: 31_000_000,
    area: 'dha',
    location: 'Phase 2, DHA',
    size: '1 Kanal',
    image: plot1,
    description: '1 kanal residential plot in a developed DHA sector — a premium address for your future home.',
    features: ['Developed sector', 'Possession plot', 'Verified file', 'Premium location'],
  },
  {
    slug: '6-marla-house-pwd-housing-society',
    title: '6 Marla Modern House',
    purpose: 'sale',
    type: 'house',
    price: 21_000_000,
    area: 'pwd-housing-society',
    location: 'Block C, PWD Housing Society',
    size: '6 Marla',
    beds: 4,
    baths: 4,
    image: house8,
    gallery: [interior1, interior2],
    description: 'Modern-design house with contemporary elevation, open kitchen and quality fittings.',
    features: ['Modern elevation', 'Open kitchen', 'Quality fittings', 'Car porch'],
  },
];

/* ---------------- Helpers ---------------- */

/** PKR ko Crore / Lakh mein dikhata hai: 42,500,000 → "4.25 Crore" */
export function formatPrice(price: number): string {
  if (price >= 10_000_000) return `${trim(price / 10_000_000)} Crore`;
  if (price >= 100_000) return `${trim(price / 100_000)} Lakh`;
  return price.toLocaleString('en-PK');
}
const trim = (n: number) => Number(n.toFixed(2)).toString();

export const typeLabel: Record<PropertyType, string> = { plot: 'Plot', house: 'House', flat: 'Flat' };
export const purposeLabel: Record<Purpose, string> = { sale: 'For Sale', rent: 'For Rent' };

export const getProperty = (slug: string) => PROPERTIES.find((p) => p.slug === slug);
export const featuredProperties = () => PROPERTIES.filter((p) => p.featured);
export const propertiesInArea = (area: string) => PROPERTIES.filter((p) => p.area === area);
