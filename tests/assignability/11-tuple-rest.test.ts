import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { isAssignable } from '../../src/index';

describe('Tuple rest elements', () => {
  test('fixed tuple extends variadic target of compatible rest', () => {
    // [string, number] extends [string, ...number[]]
    const fixed = z.tuple([z.string(), z.number()]);
    const variadic = z.tuple([z.string()], z.number());
    expect(isAssignable(fixed, variadic)).toBe(true);
  });

  test('too-short source does not match target fixed prefix', () => {
    const fixed = z.tuple([z.string()]);
    const variadic = z.tuple([z.string(), z.number()], z.boolean());
    expect(isAssignable(fixed, variadic)).toBe(false);
  });

  test('extra source fixed items must match target rest', () => {
    const fixed = z.tuple([z.string(), z.number(), z.string()]);
    const variadic = z.tuple([z.string()], z.number());
    expect(isAssignable(fixed, variadic)).toBe(false); // extra string not assignable to number
  });

  test('variadic-to-variadic covariant rest', () => {
    const narrow = z.tuple([z.string()], z.number());
    const wide = z.tuple([z.string()], z.union([z.number(), z.string()]));
    expect(isAssignable(narrow, wide)).toBe(true);
    expect(isAssignable(wide, narrow)).toBe(false);
  });

  test('variadic source does not fit fixed-length target', () => {
    const variadic = z.tuple([z.string()], z.number());
    const fixed = z.tuple([z.string(), z.number()]);
    expect(isAssignable(variadic, fixed)).toBe(false);
  });
});

describe('Intersection deep merge', () => {
  test('overlapping keys are intersected structurally', () => {
    // ({ x: { a: string } } & { x: { b: number } }) extends { x: { a: string; b: number } }
    const L = z.object({ x: z.object({ a: z.string() }) });
    const R = z.object({ x: z.object({ b: z.number() }) });
    const src = z.intersection(L, R);
    const tgt = z.object({ x: z.object({ a: z.string(), b: z.number() }) });
    expect(isAssignable(src, tgt)).toBe(true);
  });
});
