import { JewelleryListingPage, type JewelleryConfig } from './JewelleryListingPage';

const config: JewelleryConfig = {
  title:     'Earrings',
  basePath:  '/earrings',
  itemLabel: 'earring',
  styles: [
    { id: 'stud',       label: 'Stud Earrings' },
    { id: 'drop',       label: 'Drop Earrings' },
    { id: 'halo',       label: 'Halo Earrings' },
    { id: 'chandelier', label: 'Chandelier' },
    { id: 'hoop',       label: 'Hoop Earrings' },
  ],
  products: [
    { id: 'e1', slug: 'brilliance-studs',      name: 'Brilliance Studs',       subtitle: 'Diamond Stud Earrings in Platinum',       price: 'Starting from £3,400', metals: 3, style: 'stud',       image: '/images/earrings/earring-1.png' },
    { id: 'e2', slug: 'cascade-drops',         name: 'Cascade Drops',          subtitle: 'Diamond Drop Earrings in Platinum',        price: 'Starting from £5,800', metals: 2, style: 'drop',       image: '/images/earrings/earring-2.png' },
    { id: 'e3', slug: 'soleste-studs',         name: 'Soleste Studs',          subtitle: 'Diamond Halo Stud Earrings in Platinum',   price: 'Starting from £4,600', metals: 3, style: 'halo',       image: '/images/earrings/earring-3.png' },
    { id: 'e4', slug: 'lumiere-chandeliers',   name: 'Lumière Chandeliers',    subtitle: 'Diamond Chandelier Earrings in Yellow Gold', price: 'Starting from £9,200', metals: 2, style: 'chandelier', image: '/images/earrings/earring-4.png' },
    { id: 'e5', slug: 'full-pave-hoops',       name: 'Full Pavé Hoops',        subtitle: 'Diamond Hoop Earrings in Platinum',        price: 'Starting from £6,100', metals: 3, style: 'hoop',       image: '/images/earrings/earring-5.png' },
    { id: 'e6', slug: 'pear-elegance-drops',   name: 'Pear Elegance Drops',    subtitle: 'Pear Diamond Drop Earrings in Platinum',   price: 'Starting from £7,400', metals: 2, style: 'drop',       image: '/images/earrings/earring-6.png' },
  ],
};

export function EarringsPage() {
  return <JewelleryListingPage config={config} />;
}
