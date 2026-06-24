export type GallerySlot = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export interface TileData {
  url:     string;
  alt:     string;
  scale:   number;
  offsetX: number; // percent, e.g. 5 = 5%
  offsetY: number; // percent
}

export type GalleryData = { [K in GallerySlot]: TileData };

export const EMPTY_TILE: TileData = { url: '', alt: '', scale: 1, offsetX: 0, offsetY: 0 };

export const EMPTY_GALLERY: GalleryData = {
  topLeft:     { ...EMPTY_TILE },
  topRight:    { ...EMPTY_TILE },
  bottomLeft:  { ...EMPTY_TILE },
  bottomRight: { ...EMPTY_TILE },
};

export function parseGalleryConfig(raw: unknown): GalleryData {
  const fallback = EMPTY_GALLERY;
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Record<string, unknown>;

  function parseSlot(v: unknown): TileData {
    if (!v || typeof v !== 'object') return { ...EMPTY_TILE };
    const s = v as Record<string, unknown>;
    return {
      url:     typeof s.url     === 'string' ? s.url     : '',
      alt:     typeof s.alt     === 'string' ? s.alt     : '',
      scale:   typeof s.scale   === 'number' ? s.scale   : 1,
      offsetX: typeof s.offsetX === 'number' ? s.offsetX : 0,
      offsetY: typeof s.offsetY === 'number' ? s.offsetY : 0,
    };
  }

  return {
    topLeft:     parseSlot(r.topLeft),
    topRight:    parseSlot(r.topRight),
    bottomLeft:  parseSlot(r.bottomLeft),
    bottomRight: parseSlot(r.bottomRight),
  };
}
