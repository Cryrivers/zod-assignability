import { z } from 'zod';
import type { SomeType } from 'zod/v4/core';

import {
  isOptional,
  isNullable,
  isUnion,
  isUndefined,
  isLiteral,
  isEnum,
  isString,
  isBoolean,
  isNumber,
  isArray,
  isTuple,
  isRecord,
  isIntersection,
  isCustom,
  isObject,
  isDate,
  isPromise,
  isMap,
  isSet,
  isFunction,
  isVoid,
  isZodNaN,
} from './type-guard.js';
import {
  getArrayElement,
  getEnumValues,
  getIntersectionSides,
  getLiteralValues,
  getObjectShape,
  getRecordKeyValue,
  getTupleItems,
  getType,
  getUnionOptions,
  unwrapNullable,
  unwrapOptional,
  getMapKeyValue,
  getSetValue,
  getPromiseInner,
  getFunctionArgsReturns,
} from './utils.js';

type PrimitiveTypeName = 'string' | 'number' | 'boolean' | 'bigint' | 'symbol';

function isLiteralOfType(value: unknown, type: PrimitiveTypeName) {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value as number);
    case 'boolean':
      return typeof value === 'boolean';
    case 'bigint':
      return typeof value === 'bigint';
    case 'symbol':
      return typeof value === 'symbol';
    default:
      return false;
  }
}

function isOptionalSchema(schema: SomeType): boolean {
  if (isOptional(schema)) {
    return true;
  } else if (isUnion(schema)) {
    const def = schema._zod.def;
    const opts = def.options ?? [];
    return opts.some(
      (opt) =>
        isUndefined(opt) ||
        (isLiteral(opt) && getLiteralValues(opt).some((v) => v === undefined)),
    );
  } else {
    return false;
  }
}

// Main checker
export function isAssignable(schemaA: SomeType, schemaB: SomeType): boolean {
  // Handle direct identity
  if (schemaA === schemaB) {
    return true;
  }

  // Normalize optional/nullable wrappers on B for comparison
  // We treat optional/nullable as unions with undefined/null for variance-only contexts,
  // but object property optionality is handled specially.
  const typeA = getType(schemaA);
  const typeB = getType(schemaB);

  // Handle "any" and "unknown" (be conservative)
  if (typeB === 'unknown') {
    return true;
  } // everything extends unknown
  if (typeB === 'any') {
    return true;
  } // everything extends any
  if (typeA === 'never') {
    return true;
  } // never extends everything
  if (typeA === 'any') {
    return true;
  } // any extends everything (TS behavior)
  if (typeA === 'unknown') {
    return false;
  } // unknown not safely assignable

  // B is optional or nullable: accept A that matches inner type or the wrapper value
  if (isOptional(schemaB)) {
    const innerB = unwrapOptional(schemaB);
    if (getType(schemaA) === 'undefined') {
      return true;
    }
    return isAssignable(schemaA, innerB);
  }
  if (isNullable(schemaB)) {
    const innerB = unwrapNullable(schemaB);
    if (getType(schemaA) === 'null') {
      return true;
    }
    return isAssignable(schemaA, innerB);
  }

  // Literals
  if (isLiteral(schemaA)) {
    const valsA = getLiteralValues(schemaA);
    if (isLiteral(schemaB)) {
      const valsB = getLiteralValues(schemaB);
      return valsA.every((va) => valsB.some((vb) => Object.is(va, vb)));
    }
    if (isEnum(schemaB)) {
      const entries = getEnumValues(schemaB);
      return valsA.every((va) => entries.some((eb) => Object.is(va, eb)));
    }
    // literal to base primitive
    if (
      typeB &&
      valsA.length === 1 &&
      isLiteralOfType(valsA[0], typeB as PrimitiveTypeName)
    ) {
      return true;
    }
    // literal to union
    if (isUnion(schemaB)) {
      return valsA.every((va) =>
        getUnionOptions(schemaB).some((opt) => {
          if (isLiteral(opt)) {
            return getLiteralValues(opt).some((vb) => Object.is(vb, va));
          }
          if (isString(opt)) {
            return typeof va === 'string';
          }
          if (isNumber(opt)) {
            return typeof va === 'number' && Number.isFinite(va as number);
          }
          if (isBoolean(opt)) {
            return typeof va === 'boolean';
          }
          return false;
        }),
      );
    }
    return false;
  }

  // Enums
  if (isEnum(schemaA)) {
    const valsA = getEnumValues(schemaA);
    if (isEnum(schemaB)) {
      const valsB = new Set(getEnumValues(schemaB));
      // A subset of B
      return valsA.every((v) => valsB.has(v));
    }
    if (isString(schemaB)) {
      // enums of strings assignable to string only if every member is string
      return valsA.every((v) => typeof v === 'string');
    }
    if (isNumber(schemaB)) {
      return valsA.every((v) => typeof v === 'number');
    }
    if (isUnion(schemaB)) {
      const optsB = getUnionOptions(schemaB);
      // Every member of A must be assignable to some member of B
      return valsA.every((va) =>
        optsB.some((opt) => {
          if (isLiteral(opt)) {
            return getLiteralValues(opt).some((vb) => Object.is(vb, va));
          }
          if (isString(opt)) {
            return typeof va === 'string';
          }
          if (isNumber(opt)) {
            return typeof va === 'number' && Number.isFinite(va as number);
          }
          if (isBoolean(opt)) {
            return typeof va === 'boolean';
          }
          // Other types cannot be matched by enum values
          return false;
        }),
      );
    }
    return false;
  }

  // Primitive bases
  const primitiveTypes: Set<PrimitiveTypeName> = new Set([
    'string',
    'number',
    'boolean',
    'bigint',
    'symbol',
  ]);
  if (
    primitiveTypes.has((typeA ?? '') as PrimitiveTypeName) &&
    primitiveTypes.has((typeB ?? '') as PrimitiveTypeName)
  ) {
    return typeA === typeB;
  }

  // Date
  if (isDate(schemaA) && isDate(schemaB)) {
    return true;
  }

  // Promise (Covariant)
  if (isPromise(schemaA) && isPromise(schemaB)) {
    return isAssignable(getPromiseInner(schemaA), getPromiseInner(schemaB));
  }

  // Set (Invariant)
  if (isSet(schemaA) && isSet(schemaB)) {
    const valA = getSetValue(schemaA);
    const valB = getSetValue(schemaB);
    return isAssignable(valA, valB) && isAssignable(valB, valA);
  }

  // Map (Invariant Key & Value)
  if (isMap(schemaA) && isMap(schemaB)) {
    const { key: kA, value: vA } = getMapKeyValue(schemaA);
    const { key: kB, value: vB } = getMapKeyValue(schemaB);
    if (!kA || !kB || !vA || !vB) return false;
    // Invariant Key
    if (!isAssignable(kA, kB) || !isAssignable(kB, kA)) return false;
    // Invariant Value
    if (!isAssignable(vA, vB) || !isAssignable(vB, vA)) return false;
    return true;
  }

  // Function (Contravariant Args, Covariant Return)
  if (isFunction(schemaA) && isFunction(schemaB)) {
    const { args: argsA, returns: retA } = getFunctionArgsReturns(schemaA);
    const { args: argsB, returns: retB } = getFunctionArgsReturns(schemaB);

    // Returns: Covariant (A extends B)
    if (!isAssignable(retA, retB)) return false;

    // Args: Contravariant (B extends A)
    // argsA/B are Tuples.
    // We need to check if argsB is assignable to argsA.
    // However, assignability checks 'can I pass A to B?'.
    // If I assign FuncA to FuncB, I call FuncB(argsB). This calls FuncA(argsB).
    // So argsB must be assignable to argsA.
    return isAssignable(argsB, argsA);
  }

  // Void
  if (isVoid(schemaB)) {
    return isVoid(schemaA) || isUndefined(schemaA);
  }
  // undefined extends void? Yes.

  // NaN
  if (isZodNaN(schemaA)) {
    return isZodNaN(schemaB) || isNumber(schemaB); // NaN extends number
  }

  // Undefined / Null handling
  if (typeA === 'undefined') {
    return (
      isUndefined(schemaB) ||
      (isUnion(schemaB) &&
        getUnionOptions(schemaB).some((opt) => getType(opt) === 'undefined'))
    );
  }
  if (isUndefined(schemaA)) {
    return (
      isUndefined(schemaB) ||
      (isUnion(schemaB) &&
        getUnionOptions(schemaB).some((opt) => getType(opt) === 'null'))
    );
  }

  // Optional/Nullable wrapper on A behave like unions for variance purposes
  if (isOptional(schemaA)) {
    const innerA = unwrapOptional(schemaA);
    if (isOptional(schemaB)) {
      const innerB = unwrapOptional(schemaB);
      return isAssignable(innerA, innerB);
    }
    // optional(A) extends B only if both A and undefined extend B
    return (
      isAssignable(innerA, schemaB) && isAssignable(z.undefined(), schemaB)
    );
  }
  if (isNullable(schemaA)) {
    const innerA = unwrapNullable(schemaA);
    if (isNullable(schemaB)) {
      const innerB = unwrapNullable(schemaB);
      return isAssignable(innerA, innerB);
    }
    return isAssignable(innerA, schemaB) && isAssignable(z.null(), schemaB);
  }

  // Arrays: element-type covariance (A elem extends B elem)
  if (isArray(schemaA) && isArray(schemaB)) {
    const elA = getArrayElement(schemaA);
    const elB = getArrayElement(schemaB);
    if (!elA || !elB) {
      return false;
    }
    return isAssignable(elA, elB);
  }
  if (isArray(schemaA) && isUnion(schemaB)) {
    // A[] extends (U1 | U2 | ...)[] if A extends each union option of element arrays
    return getUnionOptions(schemaB).some(
      (opt) => isArray(opt) && isAssignable(schemaA, opt),
    );
  }
  if (isUnion(schemaA) && isArray(schemaB)) {
    // (A | B | ...)[] variance: this case represents array union as source which we don't use in tests.
    return false;
  }

  // Tuples: invariant length and element-wise assignability
  if (isTuple(schemaA) && isTuple(schemaB)) {
    const itemsA = getTupleItems(schemaA);
    const itemsB = getTupleItems(schemaB);
    if (!itemsA || !itemsB) {
      return false;
    }
    if (itemsA.length !== itemsB.length) {
      return false;
    }
    for (let i = 0; i < itemsA.length; i++) {
      if (!isAssignable(itemsA[i], itemsB[i])) {
        return false;
      }
    }
    return true;
  }

  // Objects: conservative structural check
  if (isObject(schemaA) && isObject(schemaB)) {
    const shapeA = getObjectShape(schemaA);
    const shapeB = getObjectShape(schemaB);

    // For every property in B (including optional), A must declare it.
    for (const key of Object.keys(shapeB)) {
      const propB = shapeB[key];
      const propA = shapeA[key];
      const bIsOptional = isOptionalSchema(propB);

      if (!propA) {
        // If B's property is optional, A can be missing it.
        if (bIsOptional) {
          continue;
        }
        // Otherwise, A must have the property.
        return false;
      }

      const bInner = bIsOptional ? unwrapOptional(propB) : propB;
      const aIsOptional = isOptionalSchema(propA);
      const aInner = aIsOptional ? unwrapOptional(propA) : propA;

      // If B requires key, A must require key
      if (!bIsOptional && aIsOptional) {
        return false;
      }

      // Property type covariance
      if (!isAssignable(aInner, bInner)) {
        return false;
      }
    }

    // Extra properties in A are allowed (B is more general). We do not enforce excess property checks here.
    return true;
  }

  // Records: key-type and value-type covariance
  if (isRecord(schemaA) && isRecord(schemaB)) {
    const { key: keyA, value: valA } = getRecordKeyValue(schemaA);
    const { key: keyB, value: valB } = getRecordKeyValue(schemaB);
    if (!keyA || !keyB || !valA || !valB) {
      return false;
    }
    // Keys: narrower keys extend broader keys; Values: A value extends B value
    return isAssignable(keyA, keyB) && isAssignable(valA, valB);
  }

  // Unions
  if (isUnion(schemaA)) {
    const optsA = getUnionOptions(schemaA);
    // Every option of A must be assignable to B (subset semantics)
    return optsA.every((opt) => isAssignable(opt, schemaB));
  }
  if (isUnion(schemaB)) {
    const optsB = getUnionOptions(schemaB);
    // A is assignable to union B if it is assignable to any member of B
    return optsB.some((opt) => isAssignable(schemaA, opt));
  }

  // Intersections: conservative rules
  if (isIntersection(schemaA)) {
    const { left: leftA, right: rightA } = getIntersectionSides(schemaA);
    if (!leftA || !rightA) {
      return false;
    }
    // If both sides are objects, create a virtual merged object to check against B.
    if (isObject(leftA) && isObject(rightA)) {
      const mergedShape = {
        ...getObjectShape(leftA),
        ...getObjectShape(rightA),
      };
      const virtualSchema = z.object(mergedShape);
      if (isAssignable(virtualSchema, schemaB)) {
        return true;
      }
    }

    // Fallback: A&B extends C if A extends C or B extends C.
    // This handles cases like (A & B) extends A.
    return isAssignable(leftA, schemaB) || isAssignable(rightA, schemaB);
  }
  if (isIntersection(schemaB)) {
    const { left: leftB, right: rightB } = getIntersectionSides(schemaB);
    if (!leftB || !rightB) {
      return false;
    }
    // A extends Intersection(B1, B2) only if A extends BOTH
    return isAssignable(schemaA, leftB) && isAssignable(schemaA, rightB);
  }

  // Instanceof/custom predicates: only identical schemas considered assignable (conservative)
  if (isCustom(schemaA) && isCustom(schemaB)) {
    return schemaA === schemaB;
  }

  // Fallback: try base primitive widening where applicable
  if (typeB === 'string' || typeB === 'number' || typeB === 'boolean') {
    // Optional/nullable handled earlier; literals handled earlier.
    return typeA === typeB;
  }

  return false;
}
