/** Words carried by almost every dish name; indexing them helps no one. */
const STOP_WORDS = new Set([
  'the',
  'and',
  'with',
  'in',
  'of',
  'a',
  'an',
  'for',
  'on',
  'style',
]);

const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Flattens a dish's identity into the token list stored on
 * `MenuItem.searchKeywords`.
 *
 * Denormalising at write time is what keeps search a single indexed read: the
 * category and tag names a customer is likely to type are folded in here, so
 * matching them later needs no join.
 */
export function buildSearchKeywords(input: {
  name: string;
  categoryName?: string | null;
  tagNames?: string[];
  shortDescription?: string | null;
  extraKeywords?: string[];
}): string[] {
  const sources = [
    input.name,
    input.categoryName ?? '',
    ...(input.tagNames ?? []),
    input.shortDescription ?? '',
    ...(input.extraKeywords ?? []),
  ];

  const tokens = new Set<string>();

  for (const source of sources) {
    for (const token of tokenize(source)) {
      tokens.add(token);
    }
  }

  // The full slugified name is kept as one token so an exact-phrase lookup
  // stays possible alongside the individual words.
  const phrase = tokenize(input.name).join('-');
  if (phrase.length > 0) tokens.add(phrase);

  return [...tokens].sort();
}

export function tokenize(value: string): string[] {
  return value
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

/** Normalises a raw query the same way keywords were built, so both agree. */
export function normalizeSearchQuery(query: string): string[] {
  return tokenize(query);
}
