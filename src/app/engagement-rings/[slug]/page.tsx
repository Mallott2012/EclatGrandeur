export const dynamic = 'force-dynamic';

import { RingDetailPage }                             from '@/components/engagement/RingDetailPage';
import { getRingSettingBySlug }                       from '@/lib/ring-settings/service';
import { METAL_LABELS }                               from '@/lib/ring-settings/types';
import { parseGalleryConfig, parseMetalVariants, buildDefaultVariants } from '@/lib/gallery/types';
import { getCompatibleDiamondById, type CompatibilitySetting } from '@/lib/diamonds/compatibility';
import type { MetalKey }      from '@/lib/gallery/types';
import type { PublicDiamond } from '@/components/engagement/DiamondSelector';

interface Props {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<{ metal?: string; diamond?: string; size?: string }>;
}

export default async function EngagementRingDetailRoute({ params, searchParams }: Props) {
  const [{ slug }, { metal: metalParam, diamond: diamondParam, size: sizeParam }] = await Promise.all([
    params,
    searchParams,
  ]);

  let dbRing         = null;
  let ringSettingId: string | null = null;
  let galleryConfig  = null;
  let metalVariants  = null;
  let compatibleShapes: string[]   = [];
  let minCarat:         number | null = null;
  let maxCarat:         number | null = null;
  let ringSizes:        string[] = [];
  let requiresRingSize = true;

  try {
    const setting = await getRingSettingBySlug(slug);
    if (setting) {
      ringSettingId = setting.id;
      galleryConfig = parseGalleryConfig(setting.gallery_config);
      metalVariants = parseMetalVariants(setting.metal_variants) ?? buildDefaultVariants(galleryConfig);
      const sorted = [...setting.media].sort((a, b) => a.display_order - b.display_order);
      dbRing = {
        name:        setting.name,
        subtitle:    setting.collection ?? 'Engagement Ring',
        basePrice:   setting.base_price_gbp ? parseFloat(setting.base_price_gbp) : 4800,
        description: setting.description ?? '',
        media:       sorted.map(m => ({ url: m.storage_path, metal: m.metal ?? null })),
        materials:   setting.metals.map((m) => METAL_LABELS[m]),
      };
      compatibleShapes = (setting.diamond_shapes as string[]) ?? [];
      minCarat         = setting.min_carat != null ? parseFloat(String(setting.min_carat)) : null;
      maxCarat         = setting.max_carat != null ? parseFloat(String(setting.max_carat)) : null;
      ringSizes        = setting.ring_sizes ?? [];
      requiresRingSize = setting.requires_ring_size_selection ?? true;
    }
  } catch (err) {
    console.error('[engagement-rings] failed to load ring from DB:', err);
  }

  // Validate ?metal=
  const VALID_METALS = ['platinum', 'white-gold-18k', 'yellow-gold-18k', 'rose-gold-14k'];
  const initialMetal: MetalKey | null = (
    metalParam && VALID_METALS.includes(metalParam) ? metalParam as MetalKey : null
  );

  // Validate ?size= against configured ring sizes
  const initialSize: string | null = (
    sizeParam && ringSizes.includes(sizeParam) ? sizeParam : null
  );

  // Server-validate ?diamond=
  let initialSelectedDiamond: PublicDiamond | null = null;
  if (diamondParam && ringSettingId && compatibleShapes.length > 0) {
    try {
      const compatSetting: CompatibilitySetting = {
        diamond_shapes: compatibleShapes,
        min_carat:      minCarat,
        max_carat:      maxCarat,
      };
      const d = await getCompatibleDiamondById(diamondParam, compatSetting);
      if (d) {
        initialSelectedDiamond = {
          id:                d.id,
          sku:               d.sku,
          carat:             d.carat,
          shape:             d.cut,
          color:             d.colour,
          clarity:           d.clarity,
          fluorescence:      d.fluorescence,
          price:             d.price_gbp,
          diamond_category:  d.diamond_category,
          colour_family:     d.colour_family,
          colour_intensity:  d.colour_intensity,
          colour_description: d.colour_description,
          gia_report_url:    d.gia_report_url,
          cut_grade:         d.cut_grade,
          polish:            d.polish,
          symmetry:          d.symmetry,
        };
      }
    } catch {
      // Silently ignore — invalid diamond renders page unconfigured
    }
  }

  return (
    <RingDetailPage
      slug={slug}
      dbRing={dbRing}
      ringSettingId={ringSettingId}
      galleryConfig={galleryConfig}
      metalVariants={metalVariants}
      compatibleShapes={compatibleShapes}
      minCarat={minCarat}
      maxCarat={maxCarat}
      initialSelectedDiamond={initialSelectedDiamond}
      initialMetal={initialMetal}
      ringSizes={ringSizes}
      requiresRingSize={requiresRingSize}
      initialSize={initialSize}
    />
  );
}
