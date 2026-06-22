import { JewelleryListingPage, type JewelleryConfig } from './JewelleryListingPage';

const config: JewelleryConfig = {
  title:     'Necklaces',
  basePath:  '/necklaces',
  itemLabel: 'necklace',
  styles: [
    { id: 'solitaire', label: 'Solitaire Pendant' },
    { id: 'riviere',   label: 'Rivière' },
    { id: 'halo',      label: 'Halo Pendant' },
    { id: 'drop',      label: 'Drop Pendant' },
    { id: 'bar',       label: 'Bar Necklace' },
  ],
  products: [
    { id: 'n1', slug: 'lumiere-solitaire',   name: 'Lumière Solitaire',     subtitle: 'Diamond Pendant in Platinum',        price: 'Starting from £2,800', metals: 3, style: 'solitaire', image: '/images/necklaces/necklace-1.png' },
    { id: 'n2', slug: 'riviere-classique',   name: 'Rivière Classique',     subtitle: 'Diamond Rivière Necklace',           price: 'Starting from £9,400', metals: 2, style: 'riviere',   image: '/images/necklaces/necklace-2.png' },
    { id: 'n3', slug: 'soleste-pendant',     name: 'Soleste Pendant',       subtitle: 'Halo Diamond Pendant in Platinum',   price: 'Starting from £3,600', metals: 3, style: 'halo',      image: '/images/necklaces/necklace-3.png' },
    { id: 'n4', slug: 'pear-drop',           name: 'Pear Drop',             subtitle: 'Diamond Drop Pendant in Yellow Gold', price: 'Starting from £4,100', metals: 2, style: 'drop',      image: '/images/necklaces/necklace-4.png' },
    { id: 'n5', slug: 'trilogy-bar',         name: 'Trilogy Bar',           subtitle: 'Three Diamond Bar Necklace',         price: 'Starting from £3,200', metals: 3, style: 'bar',       image: '/images/necklaces/necklace-5.png' },
    { id: 'n6', slug: 'oval-solitaire-neck', name: 'Oval Solitaire',        subtitle: 'Oval Diamond Pendant in Platinum',   price: 'Starting from £3,900', metals: 2, style: 'solitaire', image: '/images/necklaces/necklace-6.png' },
  ],
};

export function NecklacesPage() {
  return <JewelleryListingPage config={config} />;
}
