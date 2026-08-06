import { SKU_PATTERN } from '../constants';

const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * A SKU is a permanent business key, not a derived value.
 *
 * Nothing here regenerates one for an existing item: renaming a dish or moving
 * it between categories must not change how the business refers to it. These
 * helpers only mint codes for items that arrive without one, and validate what
 * already exists.
 */

export function isValidSku(sku: string): boolean {
  return SKU_PATTERN.test(sku.trim().toUpperCase());
}

export function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase();
}

/** `Tandoor & Kebabs` → `TK`; `Biryani` → `BRY`. */
export function categoryMnemonic(categoryName: string): string {
  const letters = categoryName
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, ' ')
    .trim();

  const words = letters.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'GEN';

  // Multi-word categories take one initial per word (up to three).
  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((word) => word[0])
      .join('');
  }

  const word = words[0];
  const consonants = word.replace(/[AEIOU]/g, '');

  return (consonants.length >= 3 ? consonants : word).slice(0, 3).padEnd(3, 'X');
}

/**
 * Mints the next SKU in a category's series.
 *
 * `used` carries every SKU already claimed — including ones seen earlier in
 * the same import — so a batch cannot mint the same code twice.
 */
export function generateSku(
  brandPrefix: string,
  categoryName: string,
  used: Set<string>,
  sequenceWidth = 3,
): string {
  const prefix = brandPrefix.trim().toUpperCase().slice(0, 4) || 'GC';
  const mnemonic = categoryMnemonic(categoryName);

  let sequence = 1;
  let candidate = buildSku(prefix, mnemonic, sequence, sequenceWidth);

  while (used.has(candidate)) {
    sequence += 1;
    candidate = buildSku(prefix, mnemonic, sequence, sequenceWidth);
  }

  used.add(candidate);
  return candidate;
}

function buildSku(
  prefix: string,
  mnemonic: string,
  sequence: number,
  width: number,
): string {
  return `${prefix}-${mnemonic}-${String(sequence).padStart(width, '0')}`;
}
