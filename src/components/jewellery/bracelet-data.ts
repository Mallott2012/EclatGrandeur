import type { JewelleryDetailProduct } from './JewelleryDetailPage';

export const BRACELET_PRODUCTS: Record<string, JewelleryDetailProduct> = {
  'eternelle-tennis': {
    name: 'Éternelle Tennis',
    subtitle: 'Diamond Tennis Bracelet',
    basePrice: 8200,
    materials: ['Platinum', '18k White Gold'],
    images: ['/images/bracelets/bracelet-1.png', '/images/bracelets/bracelet-5.png', '/images/bracelets/bracelet-2.png'],
    description: 'Forty-two matched brilliant-cut diamonds set in individual four-claw settings, articulated for fluid movement at the wrist. The Éternelle Tennis is the defining diamond bracelet.',
  },
  'arc-bangle': {
    name: 'Arc Bangle',
    subtitle: 'Diamond Bangle',
    basePrice: 5600,
    materials: ['Platinum', '18k White Gold', '18k Yellow Gold'],
    images: ['/images/bracelets/bracelet-2.png', '/images/bracelets/bracelet-4.png', '/images/bracelets/bracelet-6.png'],
    description: 'A rigid oval bangle set with a continuous row of brilliant-cut diamonds in a channel setting. Sculptural and wearable, the Arc Bangle is designed to be worn alone or stacked.',
  },
  'maille-link': {
    name: 'Maille Link',
    subtitle: 'Diamond Link Bracelet',
    basePrice: 4800,
    materials: ['18k Yellow Gold', 'Platinum'],
    images: ['/images/bracelets/bracelet-3.png', '/images/bracelets/bracelet-1.png', '/images/bracelets/bracelet-5.png'],
    description: 'Alternating diamond-set and polished gold links create a bracelet of exceptional rhythm and movement. Each diamond link is pavé-set with hand-picked brilliant-cut stones.',
  },
  'lumiere-pave': {
    name: 'Lumière Pavé',
    subtitle: 'Pavé Diamond Bracelet',
    basePrice: 3900,
    materials: ['18k Rose Gold', 'Platinum', '18k White Gold'],
    images: ['/images/bracelets/bracelet-4.png', '/images/bracelets/bracelet-3.png', '/images/bracelets/bracelet-2.png'],
    description: 'A flexible pavé-set bracelet in rose gold that moulds to the wrist. Each diamond is hand-set to create a seamless surface of continuous brilliance.',
  },
  'eternity-line': {
    name: 'Eternity Line',
    subtitle: 'Full Eternity Bracelet',
    basePrice: 6400,
    materials: ['Platinum', '18k White Gold'],
    images: ['/images/bracelets/bracelet-5.png', '/images/bracelets/bracelet-1.png', '/images/bracelets/bracelet-3.png'],
    description: 'A slender bracelet set with a full eternity row of channel-set brilliant-cut diamonds. Refined and precise, the Eternity Line works equally as a standalone piece or layered with others.',
  },
  'trois-rangs-tennis': {
    name: 'Trois Rangs Tennis',
    subtitle: 'Three-Row Tennis Bracelet',
    basePrice: 14200,
    materials: ['18k White Gold'],
    images: ['/images/bracelets/bracelet-6.png', '/images/bracelets/bracelet-2.png', '/images/bracelets/bracelet-4.png'],
    description: 'Three parallel rows of matched brilliant-cut diamonds set in white gold create a bracelet of exceptional width and presence. A statement piece of the highest order.',
  },
};

export const BRACELET_FALLBACK = BRACELET_PRODUCTS['eternelle-tennis'];
