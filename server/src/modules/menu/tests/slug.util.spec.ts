import { describe, expect, it } from 'vitest';
import {
  isValidSlug,
  slugify,
  truncateSlug,
  uniqueSlug,
} from '../utils';

describe('slug engine', () => {
  describe('slugify', () => {
    it('should slugify a dish name', () => {
      expect(slugify('Chicken Kebab Biryani')).toBe('chicken-kebab-biryani');
    });

    it('should lowercase', () => {
      expect(slugify('PANEER TIKKA')).toBe('paneer-tikka');
    });

    it('should collapse runs of separators', () => {
      expect(slugify('Chicken   ---   Roll')).toBe('chicken-roll');
    });

    it('should trim leading and trailing separators', () => {
      expect(slugify('  --Veg Roll--  ')).toBe('veg-roll');
    });

    it('should spell out ampersands so meaning survives', () => {
      expect(slugify('Tandoor & Kebabs')).toBe('tandoor-and-kebabs');
    });

    it('should strip apostrophes rather than split on them', () => {
      expect(slugify("Chef's Special")).toBe('chefs-special');
      expect(slugify('Chef’s Special')).toBe('chefs-special');
    });

    it('should fold diacritics to their base letters', () => {
      expect(slugify('Crème Brûlée')).toBe('creme-brulee');
    });

    it('should keep digits', () => {
      expect(slugify('Chicken 65')).toBe('chicken-65');
    });

    it('should drop punctuation', () => {
      expect(slugify('Paneer Tikka (Dry), Spicy!')).toBe('paneer-tikka-dry-spicy');
    });

    it('should return empty for input with nothing slugifiable', () => {
      expect(slugify('!!!')).toBe('');
    });

    it('should produce slugs that satisfy the slug pattern', () => {
      for (const name of ['Veg Manchurian', 'Mutton Rogan Josh', 'Chicken 65']) {
        expect(isValidSlug(slugify(name))).toBe(true);
      }
    });
  });

  describe('uniqueSlug', () => {
    it('should return the plain slug when free', () => {
      expect(uniqueSlug('Veg Roll', new Set())).toBe('veg-roll');
    });

    it('should suffix a collision rather than overwrite', () => {
      const taken = new Set<string>();

      expect(uniqueSlug('Chicken 65', taken)).toBe('chicken-65');
      expect(uniqueSlug('Chicken-65', taken)).toBe('chicken-65-2');
      expect(uniqueSlug('chicken 65', taken)).toBe('chicken-65-3');
    });

    it('should record what it issued so later calls stay consistent', () => {
      const taken = new Set<string>();
      uniqueSlug('Veg Roll', taken);

      expect(taken.has('veg-roll')).toBe(true);
    });

    it('should skip past a pre-claimed suffix', () => {
      const taken = new Set(['veg-roll', 'veg-roll-2']);

      expect(uniqueSlug('Veg Roll', taken)).toBe('veg-roll-3');
    });
  });

  describe('truncateSlug', () => {
    it('should leave a short slug alone', () => {
      expect(truncateSlug('veg-roll', 40)).toBe('veg-roll');
    });

    it('should cut on a word boundary', () => {
      expect(truncateSlug('chicken-kebab-biryani-special', 20)).toBe(
        'chicken-kebab',
      );
    });

    it('should hard-cut when there is no boundary', () => {
      expect(truncateSlug('supercalifragilistic', 10)).toBe('supercalif');
    });
  });
});
