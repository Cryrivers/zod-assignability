import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { isAssignable } from '../../src/index.js';

describe('Extended types', () => {
  describe('Date', () => {
    test('Date assignability', () => {
      expect(isAssignable(z.date(), z.date())).toBe(true);
      expect(isAssignable(z.date(), z.string())).toBe(false);
      expect(isAssignable(z.string(), z.date())).toBe(false);
    });
  });

  describe('Promise', () => {
    test('Promise covariance', () => {
      // Promise<string> extends Promise<string | number>
      const p1 = z.promise(z.string());
      const p2 = z.promise(z.union([z.string(), z.number()]));
      expect(isAssignable(p1, p2)).toBe(true);
      
      // Promise<string | number> !extends Promise<string>
      expect(isAssignable(p2, p1)).toBe(false);
    });
  });

  describe('Set', () => {
    test('Set invariance', () => {
      const s1 = z.set(z.string());
      const s2 = z.set(z.union([z.string(), z.number()]));
      
      // Invariant: Set<A> extends Set<B> iff A === B
      expect(isAssignable(s1, s1)).toBe(true);
      expect(isAssignable(s1, s2)).toBe(false);
      expect(isAssignable(s2, s1)).toBe(false);
    });
  });

  describe('Map', () => {
    test('Map invariance', () => {
      const m1 = z.map(z.string(), z.number());
      const m2 = z.map(z.string(), z.union([z.number(), z.string()]));
      
      expect(isAssignable(m1, m1)).toBe(true);
      // Value invariance
      expect(isAssignable(m1, m2)).toBe(false);
      
      const m3 = z.map(z.union([z.string(), z.number()]), z.number());
      // Key invariance
      expect(isAssignable(m1, m3)).toBe(false);
    });
  });

  describe('Function', () => {
    test('Function covariance/contravariance', () => {
      // (a: string) => number
      const f1 = z.function().input(z.tuple([z.string()])).output(z.number());
      // (a: string | number) => number
      const f2 = z.function().input(z.tuple([z.union([z.string(), z.number()])])).output(z.number());
      
      // f2 extends f1 ? (params contravariant)
      expect(isAssignable(f2, f1)).toBe(true);
      expect(isAssignable(f1, f2)).toBe(false);
      
      // Return type covariance
      // (a: string) => string
      const f3 = z.function().input(z.tuple([z.string()])).output(z.string());
      // (a: string) => string | number
      const f4 = z.function().input(z.tuple([z.string()])).output(z.union([z.string(), z.number()]));
      
      // f3 extends f4? Yes.
      expect(isAssignable(f3, f4)).toBe(true);
      expect(isAssignable(f4, f3)).toBe(false);
    });
  });

  describe('Void', () => {
    test('Void assignability', () => {
      expect(isAssignable(z.void(), z.void())).toBe(true);
      expect(isAssignable(z.undefined(), z.void())).toBe(true); // undefined extends void
      // void extends undefined? Not strictly in TS, but Zod void accepts undefined.
      // Let's check current implementation: isVoid(B) -> isUndefined(A) || isVoid(A).
      expect(isAssignable(z.void(), z.undefined())).toBe(false); 
    });
  });

  describe('NaN', () => {
    test('NaN assignability', () => {
      expect(isAssignable(z.nan(), z.nan())).toBe(true);
      expect(isAssignable(z.nan(), z.number())).toBe(true); // NaN is number
      expect(isAssignable(z.number(), z.nan())).toBe(false);
    });
  });
});
