export const siteConfig = {
  name: 'Éclat Grandeur',
  tagline: 'Fine Jewellery, Est. 1974',
  description:
    'Éclat Grandeur — London\'s finest bespoke jeweller. Individually certified diamonds, handcrafted engagement rings, necklaces, bracelets and earrings with complimentary consultations.',
  url: 'https://eclatgrandeur.com',
  defaultCurrency: 'GBP' as const,
  founded: 1974,
  contact: {
    email: 'hello@eclatgrandeur.com',
    phone: '+44 20 7946 0123',
    address: '14 New Bond Street, London W1S 3PP',
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

/** Éclat Grandeur top navigation. */
export const primaryNav: NavItem[] = [
  {
    label: 'Engagement Rings',
    href: '/engagement-rings',
  },
  {
    label: 'Earrings',
    href: '/earrings',
  },
  {
    label: 'Necklaces',
    href: '/necklaces',
  },
  {
    label: 'Bracelets',
    href: '/bracelets',
  },
];

export const utilityNav: { label: string; href: string }[] = [];

export const footerNav = [
  {
    title: 'Shop',
    links: [
      { label: 'Engagement Rings', href: '/engagement-rings' },
      { label: 'Create Your Ring', href: '/build-a-ring' },
      { label: 'Loose Diamonds', href: '/diamonds' },
      { label: 'Wedding Rings', href: '/wedding-bands' },
      { label: 'Earrings', href: '/earrings' },
      { label: 'Necklaces', href: '/necklaces' },
      { label: 'Bracelets', href: '/bracelets' },
    ],
  },
  {
    title: 'Discover',
    links: [
      { label: 'The Diamond Guide', href: '/diamond-guide' },
      { label: 'The 4Cs', href: '/diamond-guide' },
      { label: 'Diamond Shapes', href: '/diamond-guide' },
      { label: 'Ring Size Guide', href: '/diamond-guide' },
      { label: 'The Maison', href: '/maison' },
    ],
  },
  {
    title: 'Client Services',
    links: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'Book a Consultation', href: '/appointments' },
      { label: 'Delivery & Returns', href: '/contact' },
      { label: 'Order Status', href: '/contact' },
      { label: 'Our Ateliers', href: '/maison' },
    ],
  },
];

/** Value-prop pillars shown across the site (trust signals). */
export const servicePillars = [
  {
    title: 'Complimentary Delivery',
    copy: 'Fully insured, complimentary delivery and returns on every order, nationwide.',
    icon: 'truck',
  },
  {
    title: 'GIA Certified Diamonds',
    copy: 'Every diamond individually graded by the Gemological Institute of America.',
    icon: 'gem',
  },
  {
    title: 'Ethically Sourced',
    copy: 'Fully traceable, conflict-free diamonds sourced beyond the Kimberley Process.',
    icon: 'leaf',
  },
  {
    title: 'Lifetime Guarantee',
    copy: 'Lifetime craftsmanship guarantee with complimentary annual cleaning and inspection.',
    icon: 'shield',
  },
];

export const pressQuotes = [
  'Vogue',
  'Harper\'s Bazaar',
  'The Times',
  'Financial Times',
  'Tatler',
  'Town & Country',
  'The Telegraph',
];

export const testimonials = [
  {
    quote:
      'The most beautiful ring I have ever seen. The team took every detail into account and delivered something truly extraordinary.',
    author: 'Charlotte W.',
    detail: 'Bespoke oval halo ring',
  },
  {
    quote:
      'Seeing every diamond\'s full GIA report and being guided by their experts gave us complete confidence. Exceptional service.',
    author: 'Edward & Priya',
    detail: '1.8ct round brilliant solitaire',
  },
  {
    quote:
      'From consultation to delivery, the entire experience was seamless, personal, and utterly luxurious.',
    author: 'Isabelle M.',
    detail: 'Diamond tennis bracelet',
  },
];

/** Threshold (minor units) under which a built ring may be bought online. */
export const BUYABLE_THRESHOLD = 5_000_000;
