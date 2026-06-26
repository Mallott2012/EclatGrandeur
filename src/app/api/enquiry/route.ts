import { NextResponse }     from 'next/server';
import { enquirySchema }    from '@/lib/validation';
import { notifyConcierge }  from '@/lib/notify';
import { createEnquiry }    from '@/lib/enquiries/service';
import { createAdminClient } from '@/lib/supabase/admin';
import { isEclatEligible }  from '@/lib/diamonds/eligibility';
import { parseMetalVariants } from '@/lib/gallery/types';
import { validateEarringConfiguration, calculateEarringConfigurationPrice } from '@/lib/earrings/configuration';

export async function POST(req: Request) {
  const body   = await req.json().catch(() => null);
  const parsed = enquirySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // ── Phase 6: 8-point revalidation for configured rings ──────────────────────

  if (data.ringConfig && data.cartToken) {
    const rc    = data.ringConfig;
    const admin = createAdminClient();

    // 1–4. Diamond must exist, be published, reserved by this token, and hold valid
    const { data: diamond } = await admin
      .from('diamonds')
      .select('id, is_published, status, held_until, held_by_cart, cut, carat, colour, clarity, cut_grade, polish, symmetry, fluorescence, eclat_approved, diamond_category, colour_family, price_gbp')
      .eq('id', rc.diamondId)
      .maybeSingle();

    if (!diamond || !diamond.is_published) {
      return NextResponse.json({ ok: false, error: 'Diamond is no longer available.' }, { status: 409 });
    }
    if (diamond.status !== 'reserved') {
      return NextResponse.json({ ok: false, error: 'Diamond reservation has expired. Please start over.' }, { status: 409 });
    }
    if (diamond.held_by_cart !== data.cartToken) {
      return NextResponse.json({ ok: false, error: 'Diamond reservation not found.' }, { status: 409 });
    }
    if (!diamond.held_until || new Date(diamond.held_until) < new Date()) {
      return NextResponse.json({ ok: false, error: 'Diamond reservation has expired. Please start over.' }, { status: 409 });
    }

    // 5. Eligibility re-check
    if (!isEclatEligible({
      cut:            diamond.cut,
      cut_grade:      diamond.cut_grade,
      polish:         diamond.polish,
      symmetry:       diamond.symmetry,
      fluorescence:   diamond.fluorescence,
      eclat_approved: diamond.eclat_approved,
    })) {
      return NextResponse.json({ ok: false, error: 'Diamond no longer meets eligibility criteria.' }, { status: 409 });
    }

    // 6. Ring setting must exist, be published, shape + carat still valid
    const { data: setting } = await admin
      .from('ring_settings')
      .select('id, is_published, diamond_shapes, min_carat, max_carat, base_price_gbp, metal_variants')
      .eq('id', rc.settingId)
      .maybeSingle();

    if (!setting || !setting.is_published) {
      return NextResponse.json({ ok: false, error: 'Ring setting is no longer available.' }, { status: 409 });
    }

    // 7. Shape + carat range
    const compatShapes = (setting.diamond_shapes as string[]) ?? [];
    if (!compatShapes.includes(diamond.cut)) {
      return NextResponse.json({ ok: false, error: 'Configuration is no longer valid.' }, { status: 409 });
    }
    const minCarat = setting.min_carat != null ? parseFloat(String(setting.min_carat)) : null;
    const maxCarat = setting.max_carat != null ? parseFloat(String(setting.max_carat)) : null;
    if (minCarat !== null && diamond.carat < minCarat) {
      return NextResponse.json({ ok: false, error: 'Configuration is no longer valid.' }, { status: 409 });
    }
    if (maxCarat !== null && diamond.carat > maxCarat) {
      return NextResponse.json({ ok: false, error: 'Configuration is no longer valid.' }, { status: 409 });
    }

    // 8. Price integrity — server-computed total must match locked price
    const variants         = parseMetalVariants(setting.metal_variants) ?? [];
    const variant          = variants.find(v => v.id === rc.metalVariantId);
    const settingPriceGBP  = variant?.price ?? (setting.base_price_gbp ? parseFloat(String(setting.base_price_gbp)) : 0);
    const settingPricePence = Math.round(settingPriceGBP * 100);
    const diamondPricePence = Math.round((diamond.price_gbp as number) * 100);
    const expectedTotal    = settingPricePence + diamondPricePence;

    if (rc.totalPrice !== expectedTotal) {
      return NextResponse.json(
        { ok: false, error: 'The price has changed since your session started. Please refresh and try again.' },
        { status: 409 }
      );
    }
  }

  // ── Phase E5: revalidation for configured earrings ─────────────────────────

  if (data.earringConfig && data.cartToken) {
    const ec    = data.earringConfig;
    const admin = createAdminClient();
    const now   = new Date().toISOString();

    // 1–2. All selected pairs must be reserved by this cart token with a valid hold
    const pairIds = ec.selectedSlots.map(s => s.pairId);
    const { data: pairRows } = await admin
      .from('diamond_pairs')
      .select('id, status, held_by_cart, held_until')
      .in('id', pairIds);

    if (!pairRows || pairRows.length !== pairIds.length) {
      return NextResponse.json(
        { ok: false, error: 'One or more selected diamond pairs are no longer available.' },
        { status: 409 },
      );
    }

    for (const pair of pairRows) {
      if (pair.status !== 'reserved' || pair.held_by_cart !== data.cartToken) {
        return NextResponse.json(
          { ok: false, error: 'Your diamond pair reservation has expired. Please review your selection.' },
          { status: 409 },
        );
      }
      if (!pair.held_until || pair.held_until <= now) {
        return NextResponse.json(
          { ok: false, error: 'Your diamond pair reservation has expired. Please review your selection.' },
          { status: 409 },
        );
      }
    }

    // 3. Configuration still valid (slot compatibility, product published, etc.)
    const earringValidation = await validateEarringConfiguration({
      jewelleryProductId: ec.productId,
      metalVariantId:     ec.metalVariantId ?? undefined,
      selectedPairs:      ec.selectedSlots.map(s => ({ slotKey: s.slotKey, pairId: s.pairId })),
    });

    if (!earringValidation.valid) {
      return NextResponse.json(
        { ok: false, error: 'Your earring configuration is no longer valid.' },
        { status: 409 },
      );
    }

    // 4. Price integrity — recalculate server-side and compare (pence)
    const recalc = await calculateEarringConfigurationPrice({
      jewelleryProductId: ec.productId,
      metalVariantId:     ec.metalVariantId ?? undefined,
      selectedPairs:      ec.selectedSlots.map(s => ({ slotKey: s.slotKey, pairId: s.pairId })),
    });

    const expectedPence = Math.round(recalc.totalPrice * 100);
    if (ec.totalPrice !== expectedPence) {
      return NextResponse.json(
        { ok: false, error: 'The price has changed since your session started. Please refresh and try again.' },
        { status: 409 },
      );
    }
  }

  // ── Persist enquiry ────────────────────────────────────────────────────────

  const { name, email, phone, subject, message, context, ringConfig, earringConfig } = data;

  try {
    await createEnquiry({
      customer_name:        name,
      customer_email:       email,
      customer_phone:       phone ?? null,
      subject:              subject ?? context ?? null,
      message,
      ring_setting_id:      ringConfig?.settingId ?? null,
      diamond_id:           ringConfig?.diamondId ?? null,
      jewellery_product_id: earringConfig?.productId ?? null,
      metal:                ringConfig?.metal ?? earringConfig?.metalLabel ?? null,
      configuration:        ringConfig
        ? (ringConfig as unknown as Record<string, unknown>)
        : earringConfig
          ? { type: 'earring', ...(earringConfig as unknown as Record<string, unknown>) }
          : null,
    });
  } catch (err) {
    console.error('[enquiry] DB persist failed:', err);
    return NextResponse.json(
      { ok: false, error: 'We were unable to save your enquiry. Please try again.' },
      { status: 503 }
    );
  }

  // Notification failure does not fail the request — enquiry is already saved.
  notifyConcierge(`New enquiry from ${name}`, data).catch((err) => {
    console.error('[enquiry] Concierge notification failed:', err);
  });

  return NextResponse.json({ ok: true });
}
