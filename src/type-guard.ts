import {
  SomeType,
  $ZodOptional,
  $ZodNullable,
  $ZodIntersection,
  $ZodAny,
  $ZodBoolean,
  $ZodNever,
  $ZodNull,
  $ZodNumber,
  $ZodString,
  $ZodSymbol,
  $ZodUndefined,
  $ZodUnknown,
  $ZodBigInt,
  $ZodArray,
  $ZodObject,
  $ZodTuple,
  $ZodCustom,
  $ZodEnum,
  $ZodLiteral,
  $ZodRecord,
  $ZodUnion,
  $ZodDate,
  $ZodPromise,
  $ZodMap,
  $ZodSet,
  $ZodFunction,
  $ZodVoid,
  $ZodNaN,
} from 'zod/v4/core';

import { getType } from './utils.js';

// Wrapper guards
export function isOptional(schema: SomeType): schema is $ZodOptional {
  return getType(schema) === 'optional';
}

export function isNullable(schema: SomeType): schema is $ZodNullable {
  return getType(schema) === 'nullable';
}

// Primitive/base type guards
export function isString(schema: SomeType): schema is $ZodString {
  return getType(schema) === 'string';
}

export function isNumber(schema: SomeType): schema is $ZodNumber {
  return getType(schema) === 'number';
}

export function isBoolean(schema: SomeType): schema is $ZodBoolean {
  return getType(schema) === 'boolean';
}

export function isBigint(schema: SomeType): schema is $ZodBigInt {
  return getType(schema) === 'bigint';
}

export function isSymbol(schema: SomeType): schema is $ZodSymbol {
  return getType(schema) === 'symbol';
}

export function isUndefined(schema: SomeType): schema is $ZodUndefined {
  return getType(schema) === 'undefined';
}

export function isNull(schema: SomeType): schema is $ZodNull {
  return getType(schema) === 'null';
}

export function isAny(schema: SomeType): schema is $ZodAny {
  return getType(schema) === 'any';
}

export function isUnknown(schema: SomeType): schema is $ZodUnknown {
  return getType(schema) === 'unknown';
}

export function isNever(schema: SomeType): schema is $ZodNever {
  return getType(schema) === 'never';
}

export function isVoid(schema: SomeType): schema is $ZodVoid {
  return getType(schema) === 'void';
}

export function isZodNaN(schema: SomeType): schema is $ZodNaN {
  return getType(schema) === 'nan';
}

export function isDate(schema: SomeType): schema is $ZodDate {
  return getType(schema) === 'date';
}

// Compound type guards
export function isArray(schema: SomeType): schema is $ZodArray {
  return getType(schema) === 'array';
}

export function isTuple(schema: SomeType): schema is $ZodTuple {
  return getType(schema) === 'tuple';
}

export function isObject(schema: SomeType): schema is $ZodObject {
  return getType(schema) === 'object';
}

export function isRecord(schema: SomeType): schema is $ZodRecord {
  return getType(schema) === 'record';
}

export function isMap(schema: SomeType): schema is $ZodMap {
  return getType(schema) === 'map';
}

export function isSet(schema: SomeType): schema is $ZodSet {
  return getType(schema) === 'set';
}

export function isPromise(schema: SomeType): schema is $ZodPromise {
  return getType(schema) === 'promise';
}

export function isFunction(schema: SomeType): schema is $ZodFunction {
  return getType(schema) === 'function';
}

export function isUnion(schema: SomeType): schema is $ZodUnion {
  return getType(schema) === 'union';
}

export function isIntersection(schema: SomeType): schema is $ZodIntersection {
  return getType(schema) === 'intersection';
}

export function isLiteral(schema: SomeType): schema is $ZodLiteral {
  return getType(schema) === 'literal';
}

export function isEnum(schema: SomeType): schema is $ZodEnum {
  return getType(schema) === 'enum';
}

// Custom/instanceof guard
export function isCustom(schema: SomeType): schema is $ZodCustom {
  return getType(schema) === 'custom';
}
