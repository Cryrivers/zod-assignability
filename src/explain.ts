import type { SomeType } from 'zod/v4/core';
import { check, type TraceStep } from './assignability';

export interface ExplainSuccess {
  ok: true;
}

export interface ExplainFailure {
  ok: false;
  reason: string;
  path: string;
  trace: TraceStep[];
}

export type ExplainResult = ExplainSuccess | ExplainFailure;

// Same semantics as `isAssignable` but returns a structured failure reason
// (first failing path + accumulated trace) when the answer is `false`.
export function explainAssignability(
  source: SomeType,
  target: SomeType,
): ExplainResult {
  const trace: TraceStep[] = [];
  const ok = check(source, target, {
    visited: new Map(),
    trace,
    path: [],
  });
  if (ok) {
    return { ok: true };
  }
  const first = trace[0] ?? {
    path: '<root>',
    reason: 'not assignable',
  };
  return { ok: false, reason: first.reason, path: first.path, trace };
}
