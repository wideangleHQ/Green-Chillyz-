import { describe, expect, it } from 'vitest';
import {
  categoryMnemonic,
  generateSku,
  isValidSku,
  normalizeSku,
} from '../utils';

describe('SKU engine', () => {
  describe('isValidSku', () => {
    it.each(['GC-BIR-001', 'GC-NDL-001', 'GC-RLL-001', 'GC-TDR-001'])(
      'should accept %s',
      (sku) => {
        expect(isValidSku(sku)).toBe(true);
      },
    );

    it('should accept a longer sequence', () => {
      expect(isValidSku('GC-BIR-00123')).toBe(true);
    });

    it.each([
      ['GCBIR001', 'no separators'],
      ['G-BIR-001', 'prefix too short'],
      ['GC-BIR-1', 'sequence too short'],
      ['GC--001', 'empty mnemonic'],
      ['', 'empty string'],
    ])('should reject %s (%s)', (sku) => {
      expect(isValidSku(sku)).toBe(false);
    });

    it('should accept lowercase, since validation normalizes first', () => {
      expect(isValidSku('gc-bir-001')).toBe(true);
      expect(normalizeSku(' gc-bir-001 ')).toBe('GC-BIR-001');
    });
  });

  describe('categoryMnemonic', () => {
    it('should take initials from a multi-word category', () => {
      expect(categoryMnemonic('Tandoor & Kebabs')).toBe('TK');
      expect(categoryMnemonic('Chicken Specials')).toBe('CS');
    });

    it('should cap initials at three words', () => {
      expect(categoryMnemonic('Veg Main Course Curry Style')).toBe('VMC');
    });

    it('should use consonants for a single word', () => {
      expect(categoryMnemonic('Biryani')).toBe('BRY');
      expect(categoryMnemonic('Noodles')).toBe('NDL');
    });

    it('should pad a short single word', () => {
      expect(categoryMnemonic('Ice')).toHaveLength(3);
    });

    it('should fall back for an unusable name', () => {
      expect(categoryMnemonic('!!!')).toBe('GEN');
      expect(categoryMnemonic('')).toBe('GEN');
    });
  });

  describe('generateSku', () => {
    it('should mint a valid SKU', () => {
      const sku = generateSku('GC', 'Biryani', new Set());

      expect(sku).toBe('GC-BRY-001');
      expect(isValidSku(sku)).toBe(true);
    });

    it('should advance the sequence past codes already used', () => {
      const used = new Set(['GC-BRY-001', 'GC-BRY-002']);

      expect(generateSku('GC', 'Biryani', used)).toBe('GC-BRY-003');
    });

    it('should never mint the same code twice in one batch', () => {
      const used = new Set<string>();
      const minted = [
        generateSku('GC', 'Biryani', used),
        generateSku('GC', 'Biryani', used),
        generateSku('GC', 'Biryani', used),
      ];

      expect(new Set(minted).size).toBe(3);
    });

    it('should keep separate series per category', () => {
      const used = new Set<string>();

      expect(generateSku('GC', 'Biryani', used)).toBe('GC-BRY-001');
      expect(generateSku('GC', 'Noodles', used)).toBe('GC-NDL-001');
    });

    it('should honour the brand prefix', () => {
      expect(generateSku('GoldenChillyz', 'Biryani', new Set())).toBe(
        'GOLD-BRY-001',
      );
    });

    it('should fall back to GC for a blank prefix', () => {
      expect(generateSku('  ', 'Biryani', new Set())).toBe('GC-BRY-001');
    });

    it('should record what it minted', () => {
      const used = new Set<string>();
      generateSku('GC', 'Biryani', used);

      expect(used.has('GC-BRY-001')).toBe(true);
    });
  });
});
