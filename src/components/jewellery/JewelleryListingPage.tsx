import { EditorialListing, type EditorialItem } from '@/components/shared/EditorialListing';

export interface JewelleryProduct {
  id:       string;
  slug:     string;
  name:     string;
  subtitle: string;
  price:    string;
  metals:   number;
  style:    string;
  image:    string;
  video?:   string;
}

export interface JewelleryConfig {
  title:        string;
  heroCopy:     string;
  heroImage:    string;   // legacy — no longer used
  basePath:     string;
  styles:       { id: string; label: string }[];
  itemLabel:    string;
  products:     JewelleryProduct[];
  collageSlots: unknown[]; // legacy — no longer used
}

interface Props { config: JewelleryConfig; }

export function JewelleryListingPage({ config }: Props) {
  const { title, heroCopy, basePath, styles, itemLabel, products } = config;

  const items: EditorialItem[] = products.map(p => ({
    id:       p.id,
    slug:     p.slug,
    name:     p.name,
    subtitle: p.subtitle,
    price:    p.price,
    image:    p.image,
    video:    p.video,
    style:    p.style,
  }));

  return (
    <EditorialListing
      categoryTitle={title}
      categoryLede={heroCopy}
      basePath={basePath}
      itemLabel={itemLabel}
      styles={styles}
      items={items}
    />
  );
}
