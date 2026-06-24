// ── Base gallery types (four fixed named slots) ────────────────────────────────

export type GallerySlot = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export interface TileData {
  id?:        string;               // stable ID, kept in sync with ProductMediaItem.id
  url:        string;
  alt:        string;
  scale:      number;
  offsetX:    number;               // percent, e.g. 5 = 5%
  offsetY:    number;
  type?:      'image' | 'video';    // absent = image
  posterUrl?: string;               // video poster frame
}

export type GalleryData = { [K in GallerySlot]: TileData };

export const EMPTY_TILE: TileData = { url: '', alt: '', scale: 1, offsetX: 0, offsetY: 0 };

export const EMPTY_GALLERY: GalleryData = {
  topLeft:     { ...EMPTY_TILE },
  topRight:    { ...EMPTY_TILE },
  bottomLeft:  { ...EMPTY_TILE },
  bottomRight: { ...EMPTY_TILE },
};

export const SLOT_ORDER: GallerySlot[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

export function parseGalleryConfig(raw: unknown): GalleryData {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_GALLERY };
  const r = raw as Record<string, unknown>;

  function parseSlot(v: unknown): TileData {
    if (!v || typeof v !== 'object') return { ...EMPTY_TILE };
    const s = v as Record<string, unknown>;
    return {
      id:       typeof s.id       === 'string'  ? s.id       : undefined,
      url:      typeof s.url      === 'string'  ? s.url      : '',
      alt:      typeof s.alt      === 'string'  ? s.alt      : '',
      scale:    typeof s.scale    === 'number'  ? s.scale    : 1,
      offsetX:  typeof s.offsetX  === 'number'  ? s.offsetX  : 0,
      offsetY:  typeof s.offsetY  === 'number'  ? s.offsetY  : 0,
      type:     s.type === 'video' ? 'video' : s.type === 'image' ? 'image' : undefined,
      posterUrl: typeof s.posterUrl === 'string' ? s.posterUrl : undefined,
    };
  }

  return {
    topLeft:     parseSlot(r.topLeft),
    topRight:    parseSlot(r.topRight),
    bottomLeft:  parseSlot(r.bottomLeft),
    bottomRight: parseSlot(r.bottomRight),
  };
}

// ── Metal-variant types ─────────────────────────────────────────────────────────

export type MetalKey = 'platinum' | 'yellow-gold' | 'rose-gold';

export const METAL_KEYS: MetalKey[] = ['platinum', 'yellow-gold', 'rose-gold'];

export const METAL_DISPLAY: Record<MetalKey, string> = {
  'platinum':    'Platinum',
  'yellow-gold': 'Yellow Gold',
  'rose-gold':   'Rose Gold',
};

export interface ProductMediaItem {
  id:         string;
  type:       'image' | 'video';
  url:        string;
  posterUrl?: string;
  alt?:       string;
  scale:      number;
  offsetX:    number;
  offsetY:    number;
}

export interface VariantGallery {
  items:             ProductMediaItem[];   // array order = display order; max 4
  cardMainMediaId:   string | null;
  cardHoverMediaId:  string | null;
  hoverMediaEnabled: boolean;
}

export interface MetalVariant {
  id:      string;
  metal:   MetalKey;
  enabled: boolean;
  price?:  number;
  sku?:    string;
  gallery: VariantGallery;
}

export const EMPTY_VARIANT_GALLERY: VariantGallery = {
  items:             [],
  cardMainMediaId:   null,
  cardHoverMediaId:  null,
  hoverMediaEnabled: false,
};

export function emptyMetalVariant(metal: MetalKey): MetalVariant {
  return {
    id:      `variant-${metal}`,
    metal,
    enabled: false,
    gallery: { ...EMPTY_VARIANT_GALLERY, items: [] },
  };
}

// ── Parsing ─────────────────────────────────────────────────────────────────────

function parseItem(v: unknown): ProductMediaItem | null {
  if (!v || typeof v !== 'object') return null;
  const s = v as Record<string, unknown>;
  if (typeof s.id !== 'string' || !s.id) return null;
  if (typeof s.url !== 'string' || !s.url) return null;
  return {
    id:       s.id,
    type:     s.type === 'video' ? 'video' : 'image',
    url:      s.url,
    posterUrl: typeof s.posterUrl === 'string' ? s.posterUrl : undefined,
    alt:      typeof s.alt    === 'string' ? s.alt    : '',
    scale:    typeof s.scale  === 'number' ? s.scale  : 1,
    offsetX:  typeof s.offsetX === 'number' ? s.offsetX : 0,
    offsetY:  typeof s.offsetY === 'number' ? s.offsetY : 0,
  };
}

function parseVariantGallery(v: unknown): VariantGallery {
  if (!v || typeof v !== 'object') return { ...EMPTY_VARIANT_GALLERY };
  const g = v as Record<string, unknown>;
  return {
    items:             Array.isArray(g.items) ? g.items.map(parseItem).filter((x): x is ProductMediaItem => x !== null) : [],
    cardMainMediaId:   typeof g.cardMainMediaId  === 'string' ? g.cardMainMediaId  : null,
    cardHoverMediaId:  typeof g.cardHoverMediaId === 'string' ? g.cardHoverMediaId : null,
    hoverMediaEnabled: Boolean(g.hoverMediaEnabled),
  };
}

export function parseMetalVariants(raw: unknown): MetalVariant[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const result = raw
    .map((v): MetalVariant | null => {
      if (!v || typeof v !== 'object') return null;
      const mv = v as Record<string, unknown>;
      const metal = mv.metal as MetalKey;
      if (!METAL_KEYS.includes(metal)) return null;
      return {
        id:      typeof mv.id === 'string' ? mv.id : `variant-${metal}`,
        metal,
        enabled: Boolean(mv.enabled),
        price:   typeof mv.price === 'number' ? mv.price : undefined,
        sku:     typeof mv.sku   === 'string' ? mv.sku   : undefined,
        gallery: parseVariantGallery(mv.gallery),
      };
    })
    .filter((x): x is MetalVariant => x !== null);
  return result.length > 0 ? result : null;
}

// Build default three-variant array; migrate legacy gallery_config into platinum
export function buildDefaultVariants(galleryConfig?: GalleryData | null): MetalVariant[] {
  const platinum = emptyMetalVariant('platinum');
  platinum.enabled = true;

  if (galleryConfig) {
    platinum.gallery.items = SLOT_ORDER
      .map((slot): ProductMediaItem | null => {
        const td = galleryConfig[slot];
        if (!td.url) return null;
        return {
          id:       td.id ?? `legacy-${slot}`,
          type:     td.type === 'video' ? 'video' : 'image',
          url:      td.url,
          posterUrl: td.posterUrl,
          alt:      td.alt,
          scale:    td.scale,
          offsetX:  td.offsetX,
          offsetY:  td.offsetY,
        };
      })
      .filter((x): x is ProductMediaItem => x !== null);

    if (platinum.gallery.items.length > 0) {
      platinum.gallery.cardMainMediaId = platinum.gallery.items[0].id;
    }
  }

  return [platinum, emptyMetalVariant('yellow-gold'), emptyMetalVariant('rose-gold')];
}

// ── Conversion: MetalVariant ↔ GalleryData ─────────────────────────────────────

export function variantToGalleryData(variant: MetalVariant): GalleryData {
  const result: GalleryData = {
    topLeft:     { ...EMPTY_TILE },
    topRight:    { ...EMPTY_TILE },
    bottomLeft:  { ...EMPTY_TILE },
    bottomRight: { ...EMPTY_TILE },
  };
  variant.gallery.items.slice(0, 4).forEach((item, i) => {
    const slot = SLOT_ORDER[i];
    result[slot] = {
      id:       item.id,
      url:      item.url,
      alt:      item.alt ?? '',
      scale:    item.scale,
      offsetX:  item.offsetX,
      offsetY:  item.offsetY,
      type:     item.type,
      posterUrl: item.posterUrl,
    };
  });
  return result;
}

// Convert GalleryData → ProductMediaItem[], preserving stable IDs
export function galleryDataToItems(gd: GalleryData, existing: ProductMediaItem[]): ProductMediaItem[] {
  return SLOT_ORDER
    .map((slot): ProductMediaItem | null => {
      const td = gd[slot];
      if (!td.url) return null;
      const byId  = td.id ? existing.find(it => it.id === td.id) : null;
      const byUrl = existing.find(it => it.url === td.url);
      const id    = td.id ?? byId?.id ?? byUrl?.id ?? `item-${slot}-${Date.now()}`;
      return {
        id,
        type:     td.type ?? 'image',
        url:      td.url,
        posterUrl: td.posterUrl,
        alt:      td.alt,
        scale:    td.scale,
        offsetX:  td.offsetX,
        offsetY:  td.offsetY,
      };
    })
    .filter((x): x is ProductMediaItem => x !== null);
}
