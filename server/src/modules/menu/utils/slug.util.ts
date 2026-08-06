import { SLUG_PATTERN } from '../constants';

/** Unicode combining marks, left behind by NFD decomposition. */
const COMBINING_MARKS = /[̀-ͯ]/g;

/** Straight and typographic apostrophes. */
const APOSTROPHES = /['’]/g;

/**
 * `Chicken Kebab Biryani` → `chicken-kebab-biryani`.
 *
 * Diacritics are decomposed and stripped rather than dropped whole, so
 * `Crème Brûlée` becomes `creme-brulee` instead of losing letters. Ampersands
 * become `and` because `Tandoor & Kebabs` should not collapse to
 * `tandoor-kebabs` and read as a different dish.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(APOSTROPHES, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

/**
 * Slugifies, then disambiguates against names already taken.
 *
 * Two genuinely different dishes can normalise to the same string
 * (`Chicken 65` and `Chicken-65`); the loser gets `-2`, `-3` and so on rather
 * than silently overwriting. `taken` is mutated so a caller can feed the same
 * set through a whole import and stay consistent.
 */
export function uniqueSlug(value: string, taken: Set<string>): string {
  const base = slugify(value);
  if (!taken.has(base)) {
    taken.add(base);
    return base;
  }

  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (taken.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  taken.add(candidate);
  return candidate;
}

/** Truncates on a hyphen boundary so a clipped slug never ends mid-word. */
export function truncateSlug(slug: string, maxLength: number): string {
  if (slug.length <= maxLength) return slug;

  const clipped = slug.slice(0, maxLength);
  const lastBoundary = clipped.lastIndexOf('-');

  return lastBoundary > 0 ? clipped.slice(0, lastBoundary) : clipped;
}
