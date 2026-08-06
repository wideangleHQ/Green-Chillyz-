import { describe, expect, it } from 'vitest';
import { FoodType } from '@prisma/client';
import { checkImageUrl, isValidImageUrl } from '../validators';
import { parseFoodType, validateSourceShape } from '../validators';
import { buildSearchKeywords, normalizeSearchQuery, tokenize } from '../utils';

describe('image URL validator', () => {
  it.each([
    'https://cdn.greenchillyz.com/menu/biryani.jpg',
    'http://localhost:9000/bucket/item.png',
    'https://res.cloudinary.com/demo/image/upload/v1/x.webp',
    'https://project.supabase.co/storage/v1/object/public/menu/a.jpg',
  ])('should accept %s', (url) => {
    expect(isValidImageUrl(url)).toBe(true);
  });

  it('should stay host-agnostic so a CDN swap needs no code change', () => {
    expect(isValidImageUrl('https://some-future-cdn.example/a.jpg')).toBe(true);
  });

  it('should reject a relative path', () => {
    const result = checkImageUrl('/images/biryani.jpg');

    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/absolute/i);
  });

  it('should reject a non-http protocol', () => {
    const result = checkImageUrl('ftp://cdn.example.com/a.jpg');

    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/protocol/i);
  });

  it('should reject a data URI, since binary is never stored', () => {
    expect(isValidImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(false);
  });

  it.each([null, undefined, 42, '', '   '])('should reject %s', (value) => {
    expect(isValidImageUrl(value)).toBe(false);
  });
});

describe('food type parser', () => {
  it.each([
    ['VEG', FoodType.VEG],
    ['veg', FoodType.VEG],
    ['Vegetarian', FoodType.VEG],
    ['NON_VEG', FoodType.NON_VEG],
    ['non-veg', FoodType.NON_VEG],
    ['Non Veg', FoodType.NON_VEG],
    ['EGG', FoodType.EGG],
  ])('should map %s', (input, expected) => {
    expect(parseFoodType(input)).toBe(expected);
  });

  it.each(['', 'MEAT', null, undefined, 7])('should reject %s', (value) => {
    expect(parseFoodType(value)).toBeNull();
  });
});

describe('source shape validator', () => {
  it('should accept a well-formed document', () => {
    const errors = validateSourceShape({
      stores: [{ store: { code: 'A' }, categories: [{ name: 'Soups', items: [] }] }],
    });

    expect(errors).toHaveLength(0);
  });

  it.each([null, 'a string', 42, []])('should reject %s at the root', (value) => {
    expect(validateSourceShape(value).length).toBeGreaterThan(0);
  });

  it('should require a stores array', () => {
    const errors = validateSourceShape({ version: '1' });

    expect(errors[0].code).toBe('MALFORMED_JSON');
    expect(errors[0].path).toBe('$.stores');
  });

  it('should reject an empty stores array', () => {
    const errors = validateSourceShape({ stores: [] });

    expect(errors[0].code).toBe('EMPTY_SOURCE');
  });

  it('should report the path of a malformed category', () => {
    const errors = validateSourceShape({
      stores: [{ categories: [{ name: 'Soups', items: 'nope' }] }],
    });

    expect(errors[0].path).toBe('$.stores[0].categories[0].items');
  });

  it('should report a store without categories', () => {
    const errors = validateSourceShape({ stores: [{ store: { code: 'A' } }] });

    expect(errors[0].path).toBe('$.stores[0].categories');
  });
});

describe('search keywords', () => {
  it('should fold name, category and tags into one token list', () => {
    const keywords = buildSearchKeywords({
      name: 'Chicken Kebab Biryani',
      categoryName: 'Biryani',
      tagNames: ['popular'],
    });

    expect(keywords).toContain('chicken');
    expect(keywords).toContain('kebab');
    expect(keywords).toContain('biryani');
    expect(keywords).toContain('popular');
  });

  it('should keep the full phrase as one token', () => {
    const keywords = buildSearchKeywords({ name: 'Chicken Kebab Biryani' });

    expect(keywords).toContain('chicken-kebab-biryani');
  });

  it('should drop stop words and single characters', () => {
    const keywords = buildSearchKeywords({ name: 'Chicken in the Style of A' });

    expect(keywords).not.toContain('the');
    expect(keywords).not.toContain('in');
    expect(keywords).not.toContain('a');
  });

  it('should deduplicate', () => {
    const keywords = buildSearchKeywords({
      name: 'Biryani',
      categoryName: 'Biryani',
      tagNames: ['biryani'],
    });

    expect(keywords.filter((k) => k === 'biryani')).toHaveLength(1);
  });

  it('should be sorted so stored arrays compare cleanly', () => {
    const keywords = buildSearchKeywords({ name: 'Zesty Apple Mango' });

    expect(keywords).toEqual([...keywords].sort());
  });

  it('should tokenize a query the same way it built keywords', () => {
    expect(normalizeSearchQuery('Chicken Biryani!')).toEqual(
      tokenize('chicken biryani'),
    );
  });
});
