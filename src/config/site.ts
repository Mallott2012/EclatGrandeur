export const siteConfig = {
  name: 'Blue Nile',
  tagline: 'The Original Online Jeweler',
  description:
    'Blue Nile — the world’s leading diamond jeweler online. Build your own engagement ring, search thousands of certified loose diamonds by the 4Cs, and shop fine jewelry with free shipping and free returns.',
  url: 'https://bluenile.example.com',
  defaultCurrency: 'USD' as const,
  founded: 1999,
  contact: {
    email: 'service@bluenile.example.com',
    phone: '1-800-242-2728',
    address: '411 First Avenue S, Seattle, WA 98104',
  },
  social: {
    instagram: 'https://instagram.com/bluenile',
    pinterest: 'https://pinterest.com/bluenile',
  },
};

export interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string; note?: string }[];
}

/** Blue Nile-style top navigation. */
export const primaryNav: NavItem[] = [
  {
    label: 'Engagement Rings',
    href: '/engagement-rings',
    children: [
      { label: 'Build Your Own Ring', href: '/build-a-ring', note: 'In three steps' },
      { label: 'Shop Engagement Rings', href: '/engagement-rings' },
      { label: 'Solitaire Rings', href: '/engagement-rings' },
      { label: 'Halo Rings', href: '/engagement-rings' },
      { label: 'Three-Stone Rings', href: '/engagement-rings' },
      { label: 'Ring Settings', href: '/build-a-ring?start=setting' },
    ],
  },
  {
    label: 'Wedding Rings',
    href: '/wedding-bands',
    children: [
      { label: "Women's Wedding Rings", href: '/wedding-bands' },
      { label: "Men's Wedding Rings", href: '/wedding-bands' },
      { label: 'Anniversary Rings', href: '/wedding-bands' },
      { label: 'Eternity Rings', href: '/wedding-bands' },
    ],
  },
  {
    label: 'Diamonds',
    href: '/diamonds',
    children: [
      { label: 'Search Loose Diamonds', href: '/diamonds', note: 'The 4Cs' },
      { label: 'Build Your Own Ring', href: '/build-a-ring' },
      { label: 'Round Cut', href: '/diamonds?shape=round' },
      { label: 'Oval Cut', href: '/diamonds?shape=oval' },
      { label: 'Emerald Cut', href: '/diamonds?shape=emerald' },
      { label: 'The Diamond Guide', href: '/diamond-guide' },
    ],
  },
  {
    label: 'Jewelry',
    href: '/jewelry',
    children: [
      { label: 'Earrings', href: '/earrings' },
      { label: 'Necklaces & Pendants', href: '/necklaces' },
      { label: 'Bracelets', href: '/bracelets' },
      { label: 'Tennis Bracelets', href: '/bracelets' },
      { label: 'High Jewelry', href: '/high-jewellery' },
    ],
  },
  {
    label: 'Gifts',
    href: '/collections',
    children: [
      { label: 'Gifts Under $500', href: '/collections' },
      { label: 'Gifts Under $1,000', href: '/collections' },
      { label: 'Diamond Studs', href: '/earrings' },
      { label: 'Featured Collections', href: '/collections' },
    ],
  },
];

export const utilityNav = [
  { label: 'Diamond Guide', href: '/diamond-guide' },
  { label: 'Book an Appointment', href: '/appointments' },
];

export const footerNav = [
  {
    title: 'Shop',
    links: [
      { label: 'Engagement Rings', href: '/engagement-rings' },
      { label: 'Build Your Own Ring', href: '/build-a-ring' },
      { label: 'Loose Diamonds', href: '/diamonds' },
      { label: 'Wedding Rings', href: '/wedding-bands' },
      { label: 'Earrings', href: '/earrings' },
      { label: 'Necklaces', href: '/necklaces' },
      { label: 'Bracelets', href: '/bracelets' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'The Diamond Guide', href: '/diamond-guide' },
      { label: 'The 4Cs of Diamonds', href: '/diamond-guide' },
      { label: 'Diamond Shapes', href: '/diamond-guide' },
      { label: 'Ring Size Guide', href: '/diamond-guide' },
      { label: 'Education & Buying Tips', href: '/diamond-guide' },
    ],
  },
  {
    title: 'Customer Service',
    links: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'Book an Appointment', href: '/appointments' },
      { label: 'Shipping & Returns', href: '/contact' },
      { label: 'Order Status', href: '/contact' },
      { label: 'Our Story', href: '/maison' },
    ],
  },
];

/** Value-prop pillars shown across the site (trust signals). */
export const servicePillars = [
  {
    title: 'Free Shipping & Returns',
    copy: 'Free insured shipping both ways, plus a 30-day return policy on every order.',
    icon: 'truck',
  },
  {
    title: 'Certified Diamonds',
    copy: 'Every loose diamond is independently graded for cut, color, clarity and carat.',
    icon: 'gem',
  },
  {
    title: 'Conflict-Free Sourcing',
    copy: 'Fully traceable diamonds sourced under the Kimberley Process and beyond.',
    icon: 'leaf',
  },
  {
    title: 'Lifetime Warranty',
    copy: 'Manufacturing warranty for life, with free cleaning and inspections.',
    icon: 'shield',
  },
];

export const pressQuotes = [
  'The New York Times',
  'Forbes',
  'Vogue',
  'The Knot',
  'Brides',
  'WSJ',
  'CNBC',
];

export const testimonials = [
  {
    quote:
      'I found a more beautiful diamond for thousands less than the mall jewelers, and the build-your-own ring tool made it effortless.',
    author: 'James H.',
    detail: 'Built a round solitaire',
  },
  {
    quote:
      'Being able to see every diamond’s details and full GIA report before buying made me completely confident online.',
    author: 'Amara O.',
    detail: '1.5ct oval halo',
  },
  {
    quote:
      'From search to delivery in a signature blue box, the whole experience felt premium and easy.',
    author: 'Sofia & Marc',
    detail: 'Three-stone engagement ring',
  },
];

/** Threshold (minor units) under which a built ring may be bought online. */
export const BUYABLE_THRESHOLD = 5_000_000; // $50,000
