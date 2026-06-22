import { JewelleryListingPage, type JewelleryConfig } from './JewelleryListingPage';

const config: JewelleryConfig = {
  title:     'Bracelets',
  basePath:  '/bracelets',
  itemLabel: 'bracelet',
  styles: [
    { id: 'tennis',  label: 'Tennis Bracelet' },
    { id: 'bangle',  label: 'Bangle' },
    { id: 'link',    label: 'Link Bracelet' },
    { id: 'pave',    label: 'Pavé Bracelet' },
    { id: 'eternity', label: 'Eternity Bracelet' },
  ],
  products: [
    { id: 'b1', slug: 'eternelle-tennis',    name: 'Éternelle Tennis',      subtitle: 'Diamond Tennis Bracelet in Platinum',     price: 'Starting from £8,200',  metals: 2, style: 'tennis',   image: '/images/bracelets/bracelet-1.png' },
    { id: 'b2', slug: 'arc-bangle',          name: 'Arc Bangle',            subtitle: 'Diamond Bangle in Platinum',              price: 'Starting from £5,600',  metals: 3, style: 'bangle',   image: '/images/bracelets/bracelet-2.png' },
    { id: 'b3', slug: 'maille-link',         name: 'Maille Link',           subtitle: 'Diamond Link Bracelet in Yellow Gold',    price: 'Starting from £4,800',  metals: 2, style: 'link',     image: '/images/bracelets/bracelet-3.png' },
    { id: 'b4', slug: 'lumiere-pave',        name: 'Lumière Pavé',          subtitle: 'Pavé Diamond Bracelet in Rose Gold',      price: 'Starting from £3,900',  metals: 3, style: 'pave',     image: '/images/bracelets/bracelet-4.png' },
    { id: 'b5', slug: 'eternity-line',       name: 'Eternity Line',         subtitle: 'Full Eternity Bracelet in Platinum',      price: 'Starting from £6,400',  metals: 2, style: 'eternity', image: '/images/bracelets/bracelet-5.png' },
    { id: 'b6', slug: 'trois-rangs-tennis',  name: 'Trois Rangs Tennis',    subtitle: 'Three-Row Tennis Bracelet in White Gold', price: 'Starting from £14,200', metals: 1, style: 'tennis',   image: '/images/bracelets/bracelet-6.png' },
  ],
};

export function BraceletsPage() {
  return <JewelleryListingPage config={config} />;
}
