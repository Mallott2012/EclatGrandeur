// Shared catalogue vocabulary for the D2C product categories (necklaces,
// bracelets, earrings). Mirrors the Postgres enums created in migration 0015.
// The rings module predates this and keeps its own copy; new categories import
// from here so the vocabulary stays consistent in one place.

// ── Metals (public.ring_metal) ────────────────────────────────────────────────
export type RingMetal =
  | 'platinum'
  | 'white_gold_18ct' | 'white_gold_9ct'
  | 'yellow_gold_18ct' | 'yellow_gold_9ct'
  | 'rose_gold_18ct' | 'rose_gold_9ct'

export const ALL_METALS: RingMetal[] = [
  'platinum',
  'white_gold_18ct', 'white_gold_9ct',
  'yellow_gold_18ct', 'yellow_gold_9ct',
  'rose_gold_18ct', 'rose_gold_9ct',
]

export const METAL_LABELS: Record<RingMetal, string> = {
  platinum:         'Platinum',
  white_gold_18ct:  '18ct White Gold',
  white_gold_9ct:   '9ct White Gold',
  yellow_gold_18ct: '18ct Yellow Gold',
  yellow_gold_9ct:  '9ct Yellow Gold',
  rose_gold_18ct:   '18ct Rose Gold',
  rose_gold_9ct:    '9ct Rose Gold',
}

// ── Product status (public.product_status) ────────────────────────────────────
export type ProductStatus = 'available' | 'reserved' | 'sold' | 'discontinued'

export const ALL_PRODUCT_STATUSES: ProductStatus[] = ['available', 'reserved', 'sold', 'discontinued']

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  available:    'Available',
  reserved:     'Reserved',
  sold:         'Sold',
  discontinued: 'Discontinued',
}

// ── Media (public.media_type) ─────────────────────────────────────────────────
export type MediaType = 'image' | 'video_360' | 'model_video' | 'certificate_pdf'

// ── Gemstone type (public.gemstone_type) ──────────────────────────────────────
export type GemstoneType =
  | 'diamond' | 'ruby' | 'sapphire' | 'emerald' | 'pearl'
  | 'morganite' | 'aquamarine' | 'tanzanite' | 'opal' | 'other'

export const ALL_GEMSTONE_TYPES: GemstoneType[] = [
  'diamond', 'ruby', 'sapphire', 'emerald', 'pearl',
  'morganite', 'aquamarine', 'tanzanite', 'opal', 'other',
]

export const GEMSTONE_TYPE_LABELS: Record<GemstoneType, string> = {
  diamond: 'Diamond', ruby: 'Ruby', sapphire: 'Sapphire', emerald: 'Emerald',
  pearl: 'Pearl', morganite: 'Morganite', aquamarine: 'Aquamarine',
  tanzanite: 'Tanzanite', opal: 'Opal', other: 'Other',
}

// ── Gem shape (public.gem_shape — the spec's "cut") ───────────────────────────
export type GemShape =
  | 'round_brilliant' | 'princess' | 'oval' | 'cushion' | 'emerald'
  | 'pear' | 'marquise' | 'radiant' | 'asscher' | 'heart' | 'trillion'

export const ALL_GEM_SHAPES: GemShape[] = [
  'round_brilliant', 'princess', 'oval', 'cushion', 'emerald',
  'pear', 'marquise', 'radiant', 'asscher', 'heart', 'trillion',
]

export const GEM_SHAPE_LABELS: Record<GemShape, string> = {
  round_brilliant: 'Round Brilliant', princess: 'Princess', oval: 'Oval',
  cushion: 'Cushion', emerald: 'Emerald', pear: 'Pear', marquise: 'Marquise',
  radiant: 'Radiant', asscher: 'Asscher', heart: 'Heart', trillion: 'Trillion',
}

// ── Gem colour (public.gem_colour) ────────────────────────────────────────────
export type GemColour = 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M'
export const ALL_GEM_COLOURS: GemColour[] = ['D','E','F','G','H','I','J','K','L','M']

// ── Gem clarity (public.gem_clarity) ──────────────────────────────────────────
export type GemClarity =
  | 'FL' | 'IF' | 'VVS1' | 'VVS2' | 'VS1' | 'VS2' | 'SI1' | 'SI2' | 'I1' | 'I2' | 'I3'
export const ALL_GEM_CLARITIES: GemClarity[] = ['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2','I1','I2','I3']

// ── Gem grade (public.gem_grade — cut/polish/symmetry) ────────────────────────
export type GemGrade = 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor'
export const ALL_GEM_GRADES: GemGrade[] = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor']

// ── Gem fluorescence (public.gem_fluorescence) ────────────────────────────────
export type GemFluorescence = 'none' | 'faint' | 'medium' | 'strong' | 'very_strong'
export const ALL_GEM_FLUORESCENCE: GemFluorescence[] = ['none', 'faint', 'medium', 'strong', 'very_strong']

export const GEM_FLUORESCENCE_LABELS: Record<GemFluorescence, string> = {
  none: 'None', faint: 'Faint', medium: 'Medium', strong: 'Strong', very_strong: 'Very Strong',
}
