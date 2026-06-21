import type { Category } from '@/types/common';

export const siteConfig = {
  name: 'Éclat Grandeur',
  shortName: 'Éclat Grandeur',
  tagline: 'The Art of the Extraordinary Diamond',
  description:
    'Éclat Grandeur — rare diamonds and master-crafted fine jewellery. Engagement rings, necklaces, bracelets and earrings, created around the world’s most beautiful stones.',
  url: 'https://eclatgrandeur.com',
  defaultCurrency: 'GBP' as const,
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
  /** Category landing links shown in the mega-menu column. */
  children?: { label: string; href: string }[];
}

const categoryHref = (c: Category) => `/jewellery/${c}`;

export const primaryNav: NavItem[] = [
  {
    label: 'Engagement',
    href: '/engagement-rings',
    children: [
      { label: 'Engagement Rings', href: '/engagement-rings' },
      { label: 'Create Your Own', href: '/engagement-rings/builder' },
      { label: 'Wedding Bands', href: categoryHref('wedding-bands') },
    ],
  },
  {
    label: 'Jewellery',
    href: '/jewellery/necklaces',
    children: [
      { label: 'Necklaces', href: categoryHref('necklaces') },
      { label: 'Bracelets', href: categoryHref('bracelets') },
      { label: 'Earrings', href: categoryHref('earrings') },
    ],
  },
  {
    label: 'High Jewellery',
    href: categoryHref('high-jewellery'),
  },
  {
    label: 'Collections',
    href: '/collections',
  },
  {
    label: 'The Diamond Guide',
    href: '/education',
    children: [
      { label: 'The 4Cs', href: '/education/4cs' },
      { label: 'Certification', href: '/education/diamond-certification' },
      { label: 'Ethical Sourcing', href: '/ethical-sourcing' },
    ],
  },
  {
    label: 'Maison',
    href: '/about',
    children: [
      { label: 'Our Story', href: '/about' },
      { label: 'Ethical Sourcing', href: '/ethical-sourcing' },
      { label: 'Book an Appointment', href: '/appointments' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

export const footerNav = [
  {
    title: 'Discover',
    links: [
      { label: 'Engagement Rings', href: '/engagement-rings' },
      { label: 'Create Your Own', href: '/engagement-rings/builder' },
      { label: 'Necklaces', href: categoryHref('necklaces') },
      { label: 'Bracelets', href: categoryHref('bracelets') },
      { label: 'Earrings', href: categoryHref('earrings') },
      { label: 'High Jewellery', href: categoryHref('high-jewellery') },
    ],
  },
  {
    title: 'The Maison',
    links: [
      { label: 'Our Story', href: '/about' },
      { label: 'Ethical Sourcing', href: '/ethical-sourcing' },
      { label: 'The Diamond Guide', href: '/education' },
      { label: 'Collections', href: '/collections' },
    ],
  },
  {
    title: 'Client Services',
    links: [
      { label: 'Book an Appointment', href: '/appointments' },
      { label: 'Request a Quote', href: '/enquiry' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

/** Threshold (minor units) under which a built ring may be bought online. */
export const BUYABLE_THRESHOLD = 1_500_000; // £15,000
