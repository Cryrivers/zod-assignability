import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { isAssignable } from '../../src/index.js';

describe('Transparent wrappers', () => {
  test('default unwraps to inner type', () => {
    expect(isAssignable(z.string().default('x'), z.string())).toBe(true);
    expect(isAssignable(z.string(), z.string().default('x'))).toBe(true);
    expect(isAssignable(z.string().default('x'), z.number())).toBe(false);
  });

  test('catch unwraps to inner type', () => {
    expect(isAssignable(z.string().catch('x'), z.string())).toBe(true);
    expect(isAssignable(z.string(), z.string().catch('x'))).toBe(true);
  });

  test('readonly unwraps to inner type', () => {
    expect(
      isAssignable(z.array(z.string()).readonly(), z.array(z.string())),
    ).toBe(true);
    expect(
      isAssignable(z.array(z.string()), z.array(z.string()).readonly()),
    ).toBe(true);
  });

  test('pipe uses output side', () => {
    const pipe = z.string().pipe(z.string());
    expect(isAssignable(pipe, z.string())).toBe(true);
    expect(isAssignable(z.string(), pipe)).toBe(true);
  });

  test('nonoptional unwraps', () => {
    expect(isAssignable(z.string().optional().nonoptional(), z.string())).toBe(
      true,
    );
  });
});

describe('Lazy / recursive schemas', () => {
  test('lazy unwraps', () => {
    const lazy = z.lazy(() => z.string());
    expect(isAssignable(lazy, z.string())).toBe(true);
    expect(isAssignable(z.string(), lazy)).toBe(true);
  });

  test('self-referential recursive schema does not overflow', () => {
    type Tree = { value: string; children: Tree[] };
    const Tree: z.ZodType<Tree> = z.lazy(() =>
      z.object({ value: z.string(), children: z.array(Tree) }),
    );
    expect(isAssignable(Tree, Tree)).toBe(true);
  });
});

describe('Optional/nullable symmetry with unions', () => {
  test('union-with-undefined is assignable to optional', () => {
    const u = z.union([z.string(), z.undefined()]);
    const o = z.string().optional();
    expect(isAssignable(u, o)).toBe(true);
    expect(isAssignable(o, u)).toBe(true);
  });

  test('union-with-null is assignable to nullable', () => {
    const u = z.union([z.string(), z.null()]);
    const n = z.string().nullable();
    expect(isAssignable(u, n)).toBe(true);
    expect(isAssignable(n, u)).toBe(true);
  });
});
