import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { explainAssignability } from '../../src/index.js';

describe('explainAssignability', () => {
  test('success returns ok: true', () => {
    expect(explainAssignability(z.string(), z.string())).toEqual({ ok: true });
  });

  test('primitive mismatch reports types', () => {
    const r = explainAssignability(z.number(), z.string());
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toMatch(/number.*string/);
    }
  });

  test('object property path is reported', () => {
    const S = z.object({ user: z.object({ age: z.string() }) });
    const T = z.object({ user: z.object({ age: z.number() }) });
    const r = explainAssignability(S, T);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.path).toBe('user.age');
    }
  });

  test('missing required property is reported', () => {
    const S = z.object({ name: z.string() });
    const T = z.object({ name: z.string(), age: z.number() });
    const r = explainAssignability(S, T);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toMatch(/age/);
    }
  });
});
