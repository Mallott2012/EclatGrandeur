'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireStaffRole } from '@/lib/staff';
import {
  createPair,
  deletePair,
  publishPairValidated,
  unpublishPair,
} from '@/lib/pairs/service';
import type { CreatePairInput } from '@/lib/pairs/types';

const BACK = '/admin/diamond-pairs';

export async function createPairAction(input: CreatePairInput): Promise<{ id: string } | { error: string }> {
  await requireStaffRole([]);
  try {
    const pair = await createPair(input);
    revalidatePath(BACK);
    return { id: pair.id };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function publishPairAction(pairId: string): Promise<{ errors: string[] }> {
  await requireStaffRole([]);
  const errors = await publishPairValidated(pairId);
  if (errors.length === 0) {
    revalidatePath(BACK);
    revalidatePath(`${BACK}/${pairId}`);
  }
  return { errors };
}

export async function unpublishPairAction(pairId: string): Promise<{ error?: string }> {
  await requireStaffRole([]);
  try {
    await unpublishPair(pairId);
    revalidatePath(BACK);
    revalidatePath(`${BACK}/${pairId}`);
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deletePairAction(pairId: string): Promise<void> {
  await requireStaffRole([]);
  await deletePair(pairId);
  revalidatePath(BACK);
  redirect(BACK);
}
