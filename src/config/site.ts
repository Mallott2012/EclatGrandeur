export const siteConfig = {
  name: 'Éclat Grandeur',
  tagline: 'The Art of the Extraordinary Diamond',
  description:
    'Éclat Grandeur — rare diamonds and master-crafted fine jewellery. Engagement rings, earrings, necklaces, bracelets and bespoke creations, built around the world’s most beautiful stones.',
  url: 'https://eclatgrandeur.com',
  defaultCurrency: 'GBP' as const,
  founded: 1924,
  contact: {
    email: 'concierge@eclatgrandeur.com',
    phone: '+44 20 7000 0000',
    address: '1 Mayfair Place, London W1J 8AJ',
  },
  social: {
    instagram: 'https://instagram.com/eclatgrandeur',
    pinterest: 'https://pinterest.com/eclatgrandeur',
  },
};

export interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string; note?: string }[];
}

/** The five pillars, plus the maison/education columns. */
export const primaryNav: NavItem[] = [
  {
    label: 'Engagement',
    href: '/engagement-rings',
    children: [
      { label: 'All Engagement Rings', href: '/engagement-rings' },
      { label: 'Design Your Own', href: '/builder', note: 'In three steps' },
      { label: 'Wedding Bands', href: '/wedding-bands' },
      { label: 'The Diamond Guide', href: '/diamond-guide' },
    ],
  },
  {
    label: 'Earrings',
    href: '/earrings',
    children: [
      { label: 'All Earrings', href: '/earrings' },
      { label: 'Diamond Studs', href: '/earrings' },
      { label: 'Drops & Chandeliers', href: '/earrings' },
      { label: 'Hoops', href: '/earrings' },
    ],
  },
  {
    label: 'Necklaces',
    href: '/necklaces',
    children: [
      { label: 'All Necklaces', href: '/necklaces' },
      { label: 'Pendants', href: '/necklaces' },
      { label: 'Rivière Necklaces', href: '/necklaces' },
      { label: 'High Jewellery', href: '/high-jewellery' },
    ],
  },
  {
    label: 'Bracelets',
    href: '/bracelets',
    children: [
      { label: 'All Bracelets', href: '/bracelets' },
      { label: 'Tennis Bracelets', href: '/bracelets' },
      { label: 'Bangles', href: '/bracelets' },
      { label: 'Chain Bracelets', href: '/bracelets' },
    ],
  },
  {
    label: 'Bespoke',
    href: '/bespoke',
    children: [
      { label: 'The Bespoke Atelier', href: '/bespoke' },
      { label: 'Design Your Own Ring', href: '/builder' },
      { label: 'Book a Consultation', href: '/appointments' },
      { label: 'High Jewellery', href: '/high-jewellery' },
    ],
  },
];

export const utilityNav = [
  { label: 'The Maison', href: '/maison' },
  { label: 'Diamond Guide', href: '/diamond-guide' },
  { label: 'Book an Appointment', href: '/appointments' },
];

export const footerNav = [
  {
    title: 'Discover',
    links: [
      { label: 'Engagement Rings', href: '/engagement-rings' },
      { label: 'Earrings', href: '/earrings' },
      { label: 'Necklaces', href: '/necklaces' },
      { label: 'Bracelets', href: '/bracelets' },
      { label: 'Bespoke', href: '/bespoke' },
      { label: 'High Jewellery', href: '/high-jewellery' },
    ],
  },
  {
    title: 'The Maison',
    links: [
      { label: 'Our Story', href: '/maison' },
      { label: 'Ethical Sourcing', href: '/maison#provenance' },
      { label: 'The Diamond Guide', href: '/diamond-guide' },
      { label: 'Collections', href: '/collections' },
    ],
  },
  {
    title: 'Client Services',
    links: [
      { label: 'Design Your Own', href: '/builder' },
      { label: 'Book an Appointment', href: '/appointments' },
      { label: 'Contact the Concierge', href: '/contact' },
      { label: 'Shipping & Returns', href: '/contact' },
    ],
  },
];

/** Service pillars shown beneath the hero and on PDPs (trust signals). */
export const servicePillars = [
  {
    title: 'Lifetime Guarantee',
    copy: 'Every creation is warranted for life, with complimentary cleaning and care.',
    icon: 'shield',
  },
  {
    title: 'GIA-Certified Diamonds',
    copy: 'Independently graded for cut, colour, clarity and carat. No compromise.',
    icon: 'gem',
  },
  {
    title: 'Ethically Sourced',
    copy: 'Fully traceable, conflict-free stones from responsible origins.',
    icon: 'leaf',
  },
  {
    title: 'Complimentary Delivery',
    copy: 'Insured, signature delivery worldwide, presented in our signature case.',
    icon: 'truck',
  },
];

export const pressQuotes = [
  'Vogue',
  'Financial Times',
  'Harper’s Bazaar',
  'Tatler',
  'Robb Report',
  'The Telegraph',
  'Town & Country',
];

export const testimonials = [
  {
    quote:
      'They found a stone more beautiful than anything I had seen in Bond Street, and built a ring around it that my wife has not taken off since.',
    author: 'James H.',
    detail: 'Bespoke engagement ring',
  },
  {
    quote:
      'The 360° viewer let me see every facet before I committed. It felt less like shopping and more like being let into a secret.',
    author: 'Amara O.',
    detail: 'Aurora Solitaire',
  },
  {
    quote:
      'From the first appointment to the final reveal, every detail was considered. This is how luxury should feel.',
    author: 'Sofia & Marc',
    detail: 'Bespoke commission',
  },
];

/** Threshold (minor units) under which a built ring may be bought online. */
export const BUYABLE_THRESHOLD = 1_500_000; // £15,000
