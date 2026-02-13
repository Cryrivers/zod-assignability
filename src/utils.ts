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
  SomeType,
  util as coreUtil,
} from 'zod/v4/core';
import { isOptional, isNullable } from './type-guard.js';

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
