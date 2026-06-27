'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireStaffRole } from '@/lib/staff';
import {
  updatePair,
  deletePair,
  publishPairValidated,
  unpublishPair,
} from '@/lib/pairs/service';

const BACK = '/admin/diamond-pairs';

export async function updatePairAction(
  id: string,
  patch: Record<string, unknown>,
): Promise<{ error?: string }> {
  await requireStaffRole([]);
  try {
    await updatePair(id, patch as Parameters<typeof updatePair>[1]);
    revalidatePath(BACK);
    revalidatePath(`${BACK}/${id}`);
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function publishPairAction(id: string): Promise<{ errors: string[] }> {
  await requireStaffRole([]);
  const errors = await publishPairValidated(id);
  if (errors.length === 0) {
    revalidatePath(BACK);
    revalidatePath(`${BACK}/${id}`);
  }
  return { errors };
}

export async function unpublishPairAction(id: string): Promise<{ error?: string }> {
  await requireStaffRole([]);
  try {
    await unpublishPair(id);
    revalidatePath(BACK);
    revalidatePath(`${BACK}/${id}`);
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deletePairAction(id: string): Promise<void> {
  await requireStaffRole([]);
  await deletePair(id);
  revalidatePath(BACK);
  redirect(BACK);
}
