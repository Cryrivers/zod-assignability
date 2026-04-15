import {
  $ZodArray,
  $ZodEnum,
  $ZodIntersection,
  $ZodLiteral,
  $ZodNullable,
  $ZodObject,
  $ZodRecord,
  $ZodTuple,
  $ZodUnion,
  $ZodMap,
  $ZodSet,
  $ZodPromise,
  $ZodFunction,
  $ZodLazy,
  SomeType,
  util as coreUtil,
} from 'zod/v4/core';
import {
  isOptional,
  isNullable,
  isLazy,
  isDefault,
  isCatch,
  isReadonly,
  isNonOptional,
  isPrefault,
  isPipe,
} from './type-guard';

export function getType(schema: SomeType) {
  return schema._zod.def.type;
}

export function getRecordKeyValue(schema: $ZodRecord): {
  key?: SomeType;
  value?: SomeType;
} {
  const def = schema._zod.def;
  return {
    key: def.keyType,
    value: def.valueType,
  };
}

export function getMapKeyValue(schema: $ZodMap): {
  key?: SomeType;
  value?: SomeType;
} {
  const def = schema._zod.def;
  return {
    key: def.keyType,
    value: def.valueType,
  };
}

export function getSetValue(schema: $ZodSet) {
  return schema._zod.def.valueType;
}

export function getPromiseInner(schema: $ZodPromise) {
  return schema._zod.def.innerType;
}

export function getFunctionArgsReturns(schema: $ZodFunction) {
  const def = schema._zod.def;
  return {
    args: def.input,
    returns: def.output,
  };
}

export function getLiteralValues(schema: $ZodLiteral) {
  return schema._zod.def.values;
}

export function getArrayElement(schema: $ZodArray) {
  return schema._zod.def.element;
}

export function getTupleItems(schema: $ZodTuple) {
  return schema._zod.def.items;
}

export function getObjectShape(schema: $ZodObject) {
  return schema._zod.def.shape;
}

export function getEnumValues(schema: $ZodEnum) {
  const def = schema._zod.def;
  return coreUtil.getEnumValues(def.entries);
}

export function unwrapOptional(schema: SomeType) {
  if (isOptional(schema)) {
    const def = schema._zod.def;
    return def.innerType ?? schema;
  }
  return schema;
}

export function getUnionOptions(schema: $ZodUnion) {
  return schema._zod.def.options;
}

export function getIntersectionSides(schema: $ZodIntersection) {
  const def = schema._zod.def;
  return { left: def.left, right: def.right };
}

export function unwrapNullable(schema: $ZodNullable): SomeType {
  if (isNullable(schema)) {
    const def = schema._zod.def;
    return def.innerType ?? schema;
  }
  return schema;
}

export function unwrapLazy(schema: $ZodLazy): SomeType {
  return schema._zod.def.getter();
}

// Transparent wrappers: the TS output type is identical to the inner type,
// so for assignability we normalize by unwrapping them before dispatching.
// `optional` / `nullable` are intentionally NOT unwrapped here — they carry
// the `undefined` / `null` semantics that dispatcher handles explicitly.
export function normalize(schema: SomeType): SomeType {
  let current = schema;
  // bounded loop: these wrappers cannot recursively nest indefinitely in a
  // well-formed schema, but `lazy` can — we still terminate because lazy's
  // getter must eventually produce a non-lazy node in any usable schema,
  // and the visited-pair guard in check() catches structural recursion.
  for (let i = 0; i < 32; i++) {
    if (isLazy(current)) {
      current = unwrapLazy(current);
      continue;
    }
    if (isNonOptional(current)) {
      // nonoptional strips `undefined` from its inner type. Unwrap the inner
      // optional too, otherwise the dispatcher still sees an Optional and
      // demands `undefined` be assignable to the target.
      let inner = current._zod.def.innerType;
      while (inner && isOptional(inner)) {
        inner = inner._zod.def.innerType;
      }
      if (!inner) {
        return current;
      }
      current = inner;
      continue;
    }
    if (
      isDefault(current) ||
      isCatch(current) ||
      isReadonly(current) ||
      isPrefault(current)
    ) {
      const inner = current._zod.def.innerType;
      if (!inner) {
        return current;
      }
      current = inner;
      continue;
    }
    if (isPipe(current)) {
      // TS output type of a pipe is the `out` schema.
      current = current._zod.def.out;
      continue;
    }
    return current;
  }
  return current;
}
