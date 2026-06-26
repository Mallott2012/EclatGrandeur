'use client';

import { useState, useTransition } from 'react';
import type { EarringType } from '@/lib/jewellery/types';
import type { JewelleryStoneSlot } from '@/lib/pairs/types';
import type { EarringConfigurationAvailability } from '@/lib/earrings/types';
import type { CreateSlotInput, UpdateSlotInput, StoneSlotRole, SlotSelectionMode, SlotPriceMode } from '@/lib/pairs/types';
import { validateSlotConfig, validateSlotsForProduct } from '@/lib/pairs/validation';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

const EARRING_TYPES: { value: EarringType; label: string }[] = [
  { value: 'classic_studs',      label: 'Classic Studs'              },
  { value: 'halo_studs',         label: 'Halo Studs'                 },
  { value: 'drop_earrings',      label: 'Drop Earrings'              },
  { value: 'pave_hoops',         label: 'Pavé Hoops'                 },
  { value: 'fixed_composition',  label: 'Fixed-Composition Earrings' },
  { value: 'other',              label: 'Other'                      },
];

const ROLES: StoneSlotRole[] = [
  'centre_pair', 'top_pair', 'drop_pair', 'accent_pair', 'centre_single', 'fixed_accent',
];
const SELECTION_MODES: SlotSelectionMode[] = ['matched_pair', 'single', 'fixed'];
const PRICE_MODES: SlotPriceMode[]         = ['selected_inventory', 'included_in_setting'];

const SHAPES = ['round','oval','cushion','emerald','pear','radiant','princess','marquise','asscher','heart'];

interface Props {
  productId:          string;
  earringType:        EarringType | null;
  slots:              JewelleryStoneSlot[];
  pairCounts:         (number | null)[];  // parallel to slots; null for non-matched_pair slots
  configAvailability: EarringConfigurationAvailability | null;
  saveTypeAction:     (productId: string, type: EarringType | null) => Promise<void>;
  createSlotAction:   (input: CreateSlotInput) => Promise<{ error?: string }>;
  updateSlotAction:   (slotId: string, patch: UpdateSlotInput) => Promise<{ error?: string }>;
  deleteSlotAction:   (slotId: string) => Promise<void>;
}

type SlotFormState = {
  slot_key:                   string;
  label:                      string;
  display_order:              string;
  role:                       StoneSlotRole;
  selection_mode:             SlotSelectionMode;
  required:                   boolean;
  quantity:                   string;
  compatible_shapes:          string[];
  min_carat:                  string;
  max_carat:                  string;
  allowed_diamond_categories: string[];
  allowed_colour_families:    string[];
  price_mode:                 SlotPriceMode;
  fixed_stone_description:    string;
};

function emptySlotForm(displayOrder: number): SlotFormState {
  return {
    slot_key: '',
    label: '',
    display_order: displayOrder.toString(),
    role: 'centre_pair',
    selection_mode: 'matched_pair',
    required: true,
    quantity: '1',
    compatible_shapes: [],
    min_carat: '',
    max_carat: '',
    allowed_diamond_categories: ['white', 'coloured'],
    allowed_colour_families: [],
    price_mode: 'selected_inventory',
    fixed_stone_description: '',
  };
}

function slotToFormState(slot: JewelleryStoneSlot): SlotFormState {
  return {
    slot_key:                   slot.slot_key,
    label:                      slot.label,
    display_order:              slot.display_order.toString(),
    role:                       slot.role,
    selection_mode:             slot.selection_mode,
    required:                   slot.required,
    quantity:                   slot.quantity.toString(),
    compatible_shapes:          slot.compatible_shapes,
    min_carat:                  slot.min_carat?.toString() ?? '',
    max_carat:                  slot.max_carat?.toString() ?? '',
    allowed_diamond_categories: slot.allowed_diamond_categories,
    allowed_colour_families:    slot.allowed_colour_families ?? [],
    price_mode:                 slot.price_mode,
    fixed_stone_description:    slot.fixed_stone_description ?? '',
  };
}

function formStateToInput(f: SlotFormState, productId: string): CreateSlotInput {
  return {
    jewellery_product_id:       productId,
    slot_key:                   f.slot_key,
    label:                      f.label,
    display_order:              parseInt(f.display_order, 10) || 0,
    role:                       f.role,
    selection_mode:             f.selection_mode,
    required:                   f.required,
    quantity:                   parseInt(f.quantity, 10) || 1,
    compatible_shapes:          f.compatible_shapes,
    min_carat:                  f.min_carat ? parseFloat(f.min_carat) : null,
    max_carat:                  f.max_carat ? parseFloat(f.max_carat) : null,
    allowed_diamond_categories: f.allowed_diamond_categories as ('white' | 'coloured')[],
    allowed_colour_families:    f.allowed_colour_families.length > 0
      ? f.allowed_colour_families as ('yellow' | 'pink')[]
      : null,
    price_mode:                 f.price_mode,
    fixed_stone_description:    f.fixed_stone_description || null,
  };
}

export function EarringConfigSection({
  productId,
  earringType,
  slots,
  pairCounts,
  configAvailability,
  saveTypeAction,
  createSlotAction,
  updateSlotAction,
  deleteSlotAction,
}: Props) {
  const [pending, startTransition]       = useTransition();
  const [currentType, setCurrentType]    = useState<EarringType | null>(earringType);
  const [typeSaved, setTypeSaved]        = useState(false);
  const [addingSlot, setAddingSlot]      = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [slotForm, setSlotForm]          = useState<SlotFormState>(emptySlotForm(slots.length));
  const [slotErrors, setSlotErrors]      = useState<string[]>([]);
  const [globalErr, setGlobalErr]        = useState<string | null>(null);

  function handleSaveType() {
    startTransition(async () => {
      await saveTypeAction(productId, currentType);
      setTypeSaved(true);
      setTimeout(() => setTypeSaved(false), 2500);
    });
  }

  function startAddSlot() {
    setSlotForm(emptySlotForm(slots.length));
    setSlotErrors([]);
    setAddingSlot(true);
    setEditingSlotId(null);
  }

  function startEditSlot(slot: JewelleryStoneSlot) {
    setSlotForm(slotToFormState(slot));
    setSlotErrors([]);
    setEditingSlotId(slot.id);
    setAddingSlot(false);
  }

  function cancelSlotForm() {
    setAddingSlot(false);
    setEditingSlotId(null);
    setSlotErrors([]);
  }

  function validateForm(): boolean {
    const slotErrors = validateSlotConfig({
      selection_mode: slotForm.selection_mode,
      price_mode: slotForm.price_mode,
      compatible_shapes: slotForm.compatible_shapes,
      allowed_diamond_categories: slotForm.allowed_diamond_categories,
      min_carat: slotForm.min_carat ? parseFloat(slotForm.min_carat) : null,
      max_carat: slotForm.max_carat ? parseFloat(slotForm.max_carat) : null,
    });

    if (!slotForm.slot_key) slotErrors.unshift('Slot key is required');
    if (!slotForm.label) slotErrors.unshift('Label is required');

    // Cross-slot duplicate check (excluding slot being edited)
    const otherSlots = editingSlotId
      ? slots.filter(s => s.id !== editingSlotId).map(s => ({ slot_key: s.slot_key, display_order: s.display_order }))
      : slots.map(s => ({ slot_key: s.slot_key, display_order: s.display_order }));

    const crossErrors = validateSlotsForProduct([
      ...otherSlots,
      { slot_key: slotForm.slot_key, display_order: parseInt(slotForm.display_order, 10) || 0 },
    ]);
    slotErrors.push(...crossErrors);

    setSlotErrors(slotErrors);
    return slotErrors.length === 0;
  }

  function handleSubmitSlot() {
    if (!validateForm()) return;
    setGlobalErr(null);

    startTransition(async () => {
      if (addingSlot) {
        const input = formStateToInput(slotForm, productId);
        const result = await createSlotAction(input);
        if (result.error) { setGlobalErr(result.error); return; }
      } else if (editingSlotId) {
        const patch: UpdateSlotInput = {
          slot_key:                   slotForm.slot_key,
          label:                      slotForm.label,
          display_order:              parseInt(slotForm.display_order, 10) || 0,
          role:                       slotForm.role,
          selection_mode:             slotForm.selection_mode,
          required:                   slotForm.required,
          quantity:                   parseInt(slotForm.quantity, 10) || 1,
          compatible_shapes:          slotForm.compatible_shapes,
          min_carat:                  slotForm.min_carat ? parseFloat(slotForm.min_carat) : null,
          max_carat:                  slotForm.max_carat ? parseFloat(slotForm.max_carat) : null,
          allowed_diamond_categories: slotForm.allowed_diamond_categories as ('white' | 'coloured')[],
          allowed_colour_families:    slotForm.allowed_colour_families.length > 0
            ? slotForm.allowed_colour_families as ('yellow' | 'pink')[]
            : null,
          price_mode:                 slotForm.price_mode,
          fixed_stone_description:    slotForm.fixed_stone_description || null,
        };
        const result = await updateSlotAction(editingSlotId, patch);
        if (result.error) { setGlobalErr(result.error); return; }
      }
      setAddingSlot(false);
      setEditingSlotId(null);
    });
  }

  function handleDeleteSlot(slot: JewelleryStoneSlot) {
    if (!confirm(`Delete slot "${slot.label}" (${slot.slot_key})? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteSlotAction(slot.id);
    });
  }

  function toggleShape(shape: string) {
    setSlotForm(f => ({
      ...f,
      compatible_shapes: f.compatible_shapes.includes(shape)
        ? f.compatible_shapes.filter(s => s !== shape)
        : [...f.compatible_shapes, shape],
    }));
  }

  function toggleCategory(cat: string) {
    setSlotForm(f => ({
      ...f,
      allowed_diamond_categories: f.allowed_diamond_categories.includes(cat)
        ? f.allowed_diamond_categories.filter(c => c !== cat)
        : [...f.allowed_diamond_categories, cat],
    }));
  }

  function toggleFamily(fam: string) {
    setSlotForm(f => ({
      ...f,
      allowed_colour_families: f.allowed_colour_families.includes(fam)
        ? f.allowed_colour_families.filter(x => x !== fam)
        : [...f.allowed_colour_families, fam],
    }));
  }

  return (
    <div className="mt-10">
      {/* Section heading */}
      <div className="px-6 lg:px-14 py-5" style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <p className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.3em', color: '#bbb' }}>
          Earring Configuration
        </p>
      </div>

      <div className="px-6 lg:px-14 py-8 space-y-8">

        {/* Earring Type */}
        <ConfigBlock title="Earring Type">
          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <select
                value={currentType ?? ''}
                onChange={e => { setCurrentType((e.target.value as EarringType) || null); setTypeSaved(false); }}
                className="w-full font-sans"
                style={{ fontSize: 12, border: `1px solid ${BORDER}`, padding: '8px 10px', color: G }}
              >
                <option value="">— Not configured —</option>
                {EARRING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <button
              type="button"
              onClick={handleSaveType}
              disabled={pending}
              className="font-sans uppercase transition-opacity disabled:opacity-40"
              style={{ fontSize: 9, letterSpacing: '0.22em', color: 'white', background: G, padding: '9px 18px', border: 'none' }}
            >
              {typeSaved ? 'Saved ✓' : 'Save'}
            </button>
          </div>
          <p className="font-sans mt-2" style={{ fontSize: 10, color: '#bbb' }}>
            Internal only. Guides slot configuration — not displayed to customers.
          </p>
        </ConfigBlock>

        {/* Stone Slots */}
        <ConfigBlock title="Stone Selection Slots">

          {/* Slot list */}
          {slots.length === 0 ? (
            <p className="font-sans mb-4" style={{ fontSize: 12, color: '#ccc' }}>
              No stone slots configured for this product.
            </p>
          ) : (
            <div className="mb-4 overflow-x-auto">
              <table className="w-full font-sans" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['#', 'Key', 'Label', 'Role', 'Mode', 'Req', 'Price Mode', 'Compatible Pairs', ''].map(h => (
                      <th key={h} className="text-left pb-2 pr-4" style={{ fontSize: 9, letterSpacing: '0.22em', color: '#bbb', textTransform: 'uppercase' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot, idx) => (
                    <tr key={slot.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td className="py-3 pr-4 font-mono" style={{ fontSize: 11, color: '#bbb' }}>{slot.display_order}</td>
                      <td className="py-3 pr-4 font-mono" style={{ fontSize: 11, color: '#888' }}>{slot.slot_key}</td>
                      <td className="py-3 pr-4" style={{ fontSize: 12, color: G }}>{slot.label}</td>
                      <td className="py-3 pr-4 font-mono" style={{ fontSize: 10, color: '#666' }}>{slot.role}</td>
                      <td className="py-3 pr-4 font-mono" style={{ fontSize: 10, color: '#666' }}>{slot.selection_mode}</td>
                      <td className="py-3 pr-4" style={{ fontSize: 11, color: slot.required ? G : '#ccc' }}>
                        {slot.required ? 'Yes' : 'No'}
                      </td>
                      <td className="py-3 pr-4 font-mono" style={{ fontSize: 10, color: '#888' }}>
                        {slot.price_mode === 'selected_inventory' ? 'inventory' : 'included'}
                      </td>
                      <td className="py-3 pr-4" style={{ fontSize: 11 }}>
                        <PairCountDisplay count={pairCounts[idx]} mode={slot.selection_mode} />
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => startEditSlot(slot)}
                          className="font-sans uppercase mr-3"
                          style={{ fontSize: 9, letterSpacing: '0.2em', color: '#aaa' }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(slot)}
                          className="font-sans uppercase"
                          style={{ fontSize: 9, letterSpacing: '0.2em', color: '#c9a84c' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!addingSlot && !editingSlotId && (
            <button
              type="button"
              onClick={startAddSlot}
              className="font-sans uppercase"
              style={{ fontSize: 9, letterSpacing: '0.22em', color: G, border: `1px solid ${G}`, padding: '8px 16px' }}
            >
              + Add Slot
            </button>
          )}

          {/* Configuration completability (Part D) */}
          {configAvailability && configAvailability.requiredSlotCount > 0 && (
            <p className="font-sans mt-3 pt-3" style={{ fontSize: 10, borderTop: `1px solid ${BORDER}`, color: configAvailability.isCompletable ? '#4a9e6b' : '#c9a84c' }}>
              {configAvailability.isCompletable
                ? 'Complete configuration currently possible'
                : 'No complete configuration currently available'}
            </p>
          )}

          {/* Slot form */}
          {(addingSlot || editingSlotId) && (
            <div className="mt-4 p-5 rounded" style={{ border: `1px solid ${BORDER}`, background: '#fafafa' }}>
              <p className="font-sans uppercase mb-4" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>
                {addingSlot ? 'New Slot' : 'Edit Slot'}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <SF label="Slot Key *">
                  <TextInput value={slotForm.slot_key} onChange={v => setSlotForm(f => ({ ...f, slot_key: v }))} placeholder="e.g. centre_pair" />
                </SF>
                <SF label="Label *">
                  <TextInput value={slotForm.label} onChange={v => setSlotForm(f => ({ ...f, label: v }))} placeholder="e.g. Centre Diamond Pair" />
                </SF>
                <SF label="Display Order">
                  <TextInput value={slotForm.display_order} onChange={v => setSlotForm(f => ({ ...f, display_order: v }))} type="number" />
                </SF>
                <SF label="Quantity">
                  <TextInput value={slotForm.quantity} onChange={v => setSlotForm(f => ({ ...f, quantity: v }))} type="number" />
                </SF>

                <SF label="Role">
                  <select
                    value={slotForm.role}
                    onChange={e => setSlotForm(f => ({ ...f, role: e.target.value as StoneSlotRole }))}
                    className="w-full font-sans"
                    style={{ fontSize: 12, border: `1px solid ${BORDER}`, padding: '8px 10px', color: G }}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </SF>

                <SF label="Selection Mode">
                  <select
                    value={slotForm.selection_mode}
                    onChange={e => setSlotForm(f => ({ ...f, selection_mode: e.target.value as SlotSelectionMode }))}
                    className="w-full font-sans"
                    style={{ fontSize: 12, border: `1px solid ${BORDER}`, padding: '8px 10px', color: G }}
                  >
                    {SELECTION_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </SF>

                <SF label="Price Mode">
                  <select
                    value={slotForm.price_mode}
                    onChange={e => setSlotForm(f => ({ ...f, price_mode: e.target.value as SlotPriceMode }))}
                    className="w-full font-sans"
                    style={{ fontSize: 12, border: `1px solid ${BORDER}`, padding: '8px 10px', color: G }}
                  >
                    {PRICE_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </SF>

                <SF label="Required">
                  <select
                    value={slotForm.required ? 'yes' : 'no'}
                    onChange={e => setSlotForm(f => ({ ...f, required: e.target.value === 'yes' }))}
                    className="w-full font-sans"
                    style={{ fontSize: 12, border: `1px solid ${BORDER}`, padding: '8px 10px', color: G }}
                  >
                    <option value="yes">Required</option>
                    <option value="no">Optional</option>
                  </select>
                </SF>

                <SF label="Min Carat">
                  <TextInput value={slotForm.min_carat} onChange={v => setSlotForm(f => ({ ...f, min_carat: v }))} type="number" step="0.01" placeholder="No minimum" />
                </SF>
                <SF label="Max Carat">
                  <TextInput value={slotForm.max_carat} onChange={v => setSlotForm(f => ({ ...f, max_carat: v }))} type="number" step="0.01" placeholder="No maximum" />
                </SF>
              </div>

              {/* Compatible Shapes */}
              <SF label="Compatible Shapes" className="mt-4">
                <div className="flex flex-wrap gap-2 mt-1">
                  {SHAPES.map(s => (
                    <label key={s} className="flex items-center gap-1.5 cursor-pointer font-sans" style={{ fontSize: 11 }}>
                      <input
                        type="checkbox"
                        checked={slotForm.compatible_shapes.includes(s)}
                        onChange={() => toggleShape(s)}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </SF>

              {/* Diamond Categories */}
              <SF label="Allowed Diamond Categories" className="mt-4">
                <div className="flex gap-4 mt-1">
                  {['white', 'coloured'].map(cat => (
                    <label key={cat} className="flex items-center gap-1.5 cursor-pointer font-sans" style={{ fontSize: 11 }}>
                      <input
                        type="checkbox"
                        checked={slotForm.allowed_diamond_categories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              </SF>

              {/* Colour Families */}
              <SF label="Allowed Colour Families (leave blank for all)" className="mt-4">
                <div className="flex gap-4 mt-1">
                  {['yellow', 'pink'].map(fam => (
                    <label key={fam} className="flex items-center gap-1.5 cursor-pointer font-sans" style={{ fontSize: 11 }}>
                      <input
                        type="checkbox"
                        checked={slotForm.allowed_colour_families.includes(fam)}
                        onChange={() => toggleFamily(fam)}
                      />
                      {fam}
                    </label>
                  ))}
                </div>
              </SF>

              {/* Fixed stone description */}
              <SF label="Fixed Stone Description (fixed slots only)" className="mt-4">
                <textarea
                  value={slotForm.fixed_stone_description}
                  onChange={e => setSlotForm(f => ({ ...f, fixed_stone_description: e.target.value }))}
                  rows={2}
                  className="w-full font-sans resize-none mt-1"
                  style={{ fontSize: 11, border: `1px solid ${BORDER}`, padding: '6px 10px', color: G }}
                />
              </SF>

              {/* Validation errors */}
              {slotErrors.length > 0 && (
                <div className="mt-4" style={{ background: '#fff5f5', border: '1px solid #fcc', padding: '10px 12px' }}>
                  {slotErrors.map((e, i) => <p key={i} className="font-sans" style={{ fontSize: 11, color: '#c00' }}>{e}</p>)}
                </div>
              )}

              {globalErr && (
                <p className="font-sans mt-2" style={{ fontSize: 11, color: '#c00' }}>{globalErr}</p>
              )}

              <div className="flex items-center gap-3 mt-5">
                <button
                  type="button"
                  onClick={handleSubmitSlot}
                  disabled={pending}
                  className="font-sans uppercase disabled:opacity-40"
                  style={{ fontSize: 9, letterSpacing: '0.22em', color: 'white', background: G, padding: '9px 18px', border: 'none' }}
                >
                  {pending ? 'Saving…' : addingSlot ? 'Add Slot' : 'Save Slot'}
                </button>
                <button
                  type="button"
                  onClick={cancelSlotForm}
                  className="font-sans uppercase"
                  style={{ fontSize: 9, letterSpacing: '0.18em', color: '#aaa' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </ConfigBlock>
      </div>
    </div>
  );
}

// ── Internal components ───────────────────────────────────────────────────────

function ConfigBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded" style={{ border: `1px solid ${BORDER}` }}>
      <p className="font-sans px-4 py-2 border-b" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb', textTransform: 'uppercase', borderColor: BORDER }}>
        {title}
      </p>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SF({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="font-sans uppercase block mb-1" style={{ fontSize: 9, letterSpacing: '0.2em', color: '#aaa' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder = '', type = 'text', step,
}: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; step?: string }) {
  return (
    <input
      type={type}
      step={step}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full font-sans"
      style={{ fontSize: 11, border: `1px solid ${BORDER}`, padding: '7px 10px', color: G, outline: 'none' }}
    />
  );
}

function PairCountDisplay({ count, mode }: { count: number | null; mode: string }) {
  if (mode === 'fixed') {
    return <span className="font-sans" style={{ fontSize: 10, color: '#ccc' }}>No inventory selection required</span>;
  }
  if (count === null) return null;
  if (count === 0) {
    return <span className="font-sans" style={{ fontSize: 10, color: '#c9a84c' }}>No compatible pairs</span>;
  }
  return (
    <span className="font-sans" style={{ fontSize: 10, color: '#4a9e6b' }}>
      {count} compatible pair{count !== 1 ? 's' : ''}
    </span>
  );
}
