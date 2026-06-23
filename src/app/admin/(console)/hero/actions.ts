'use server';

import { revalidatePath } from 'next/cache';
import { requireStaffRole } from '@/lib/staff';
import {
  createHeroMedia,
  updateHeroMedia,
  deleteHeroMedia,
  type HeroPlacement,
  type CreateHeroInput,
} from '@/lib/hero/service';

export async function saveHeroAction(payload: {
  id?:          string;
  placement:    HeroPlacement;
  media_type:   'image' | 'video';
  storage_path: string;
  headline:     string | null;
  subheadline:  string | null;
  is_published: boolean;
}) {
  const user = await requireStaffRole([]);

  const input: CreateHeroInput = {
    placement:    payload.placement,
    media_type:   payload.media_type,
    storage_path: payload.storage_path,
    headline:     payload.headline,
    subheadline:  payload.subheadline,
    is_published: payload.is_published,
  };

  const record = payload.id
    ? await updateHeroMedia(user, payload.id, input)
    : await createHeroMedia(user, input);

  revalidatePath('/');
  revalidatePath('/engagement-rings');
  revalidatePath('/necklaces');
  revalidatePath('/bracelets');
  revalidatePath('/earrings');
  revalidatePath('/admin');

  return record;
}

export async function deleteHeroAction(id: string) {
  await requireStaffRole([]);
  await deleteHeroMedia(id);

  revalidatePath('/');
  revalidatePath('/engagement-rings');
  revalidatePath('/necklaces');
  revalidatePath('/bracelets');
  revalidatePath('/earrings');
  revalidatePath('/admin');
}
