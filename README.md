# Zod Assignability

Check if one Zod schema can be safely used where another Zod schema is expected. Think of it as a runtime analogue of TypeScript’s "A extends B" (assignability) relation, applied to Zod v4 schemas.

## Assignability, Explained

In TypeScript, a type A is assignable to type B if every value that fits A is also valid for B. Common mental models:

- Literals and enums: narrower sets extend broader sets (`'a' -> string`, `'a' | 'b' -> 'a' | 'b' | 'c'`).
- Objects: a source must include at least the properties the target requires, with compatible property types; extra source properties are fine.
- Arrays: element types are covariant (`string[] -> (string | number)[]`).
- Tuples: same length, and each position must be assignable.
- Unions: a source union extends a target only if every option in the source can be assigned to the target.
- Intersections: a source intersection extends a target only if both sides do.
- Functions: arguments are contravariant, return type is covariant.
- Promises: inner type is covariant.
- Maps/Sets: invariant element types (mutable containers).
- Special types: `never` extends everything; everything extends `unknown` and `any` (conservatively).

This library brings those rules to Zod schemas at runtime.

## Installation

- `pnpm add zod-assignability zod`
- Requires `zod@^4`.

If you’re working locally in this repo, you can import from the source:

```ts
import { isAssignable } from './src/assignability';
```

Otherwise, after publishing/installing:

```ts
import { isAssignable } from 'zod-assignability';
```

## API

- `isAssignable(source: SomeType, target: SomeType): boolean`
  - Returns `true` if `source` is assignable to `target` under the conservative rules described below.
  - `SomeType` refers to Zod v4 core types (`import type { SomeType } from 'zod/v4/core'`).

## Quick Start

```ts
import { z } from 'zod';
import { isAssignable } from 'zod-assignability';

// Primitives
isAssignable(z.string(), z.string()); // true
isAssignable(z.string(), z.number()); // false

// Literals and unions
isAssignable(z.literal('a'), z.string()); // true
isAssignable(
  z.union([z.literal('a'), z.literal('b')]),
  z.union([z.literal('a'), z.literal('b'), z.literal('c')]),
); // true

// Objects
const A = z.object({ name: z.string() });
const B = z.object({ name: z.string(), age: z.number() });
isAssignable(A, B); // false (B requires age)
isAssignable(B, A); // true (extra props are okay)

// Optional target property
const C = z.object({ name: z.string(), age: z.number().optional() });
isAssignable(B, C); // true
isAssignable(A, C); // true (A is assignable because C's 'age' is optional)
```

## Detailed Rules & Examples

- Unknown, Any, Never
  - `A -> unknown`: always `true`.
  - `A -> any`: treated as `true`.
  - `any -> B`: treated as `true`.
  - `never -> B`: always `true`.
  - `unknown -> B` (when `B` is not `unknown`): `false`.

- Optional / Nullable wrappers
  - Target optional/nullable: matching the inner type or the wrapper value is allowed.
    ```ts
    isAssignable(z.string(), z.string().optional()); // true
    isAssignable(z.null(), z.string().nullable()); // true
    ```
  - Source optional/nullable: behaves like unions for variance.
    ```ts
    isAssignable(z.string().optional(), z.string()); // false (needs `string` and `undefined` -> `string`)
    isAssignable(z.string().nullable(), z.union([z.string(), z.null()])); // true
    ```

- Literals and Enums
  - Literal to literal: values must match.
  - Literal to primitive: allowed if the literal’s value is of that primitive.
  - Literal to union: literal must match at least one union member.
  - Enum to enum: source values must be a subset of target values.
  - Enum to primitive: allowed when every enum member is of that primitive.
    ```ts
    const E1 = z.enum(['A', 'B']);
    const E2 = z.enum(['A', 'B', 'C']);
    isAssignable(E1, E2); // true
    isAssignable(E1, z.string()); // true
    ```

- Primitives
  - Primitive to primitive: assignable only when types are identical.
    ```ts
    isAssignable(z.boolean(), z.boolean()); // true
    isAssignable(z.boolean(), z.string()); // false
    ```
  - `Date`: assignable to `Date` (and `unknown`/`any`).
  - `Void`: `void` and `undefined` are assignable to `void`.
  - `NaN`: `NaN` is assignable to `NaN` and `number`.

- Arrays
  - Element types are covariant.
    ```ts
    isAssignable(
      z.array(z.string()),
      z.array(z.union([z.string(), z.number()])),
    ); // true
    isAssignable(z.array(z.number()), z.array(z.string())); // false
    ```

- Tuples
  - Invariant length; element-wise assignability.
    ```ts
    isAssignable(
      z.tuple([z.string(), z.number()]),
      z.tuple([z.string(), z.number()]),
    ); // true
    isAssignable(z.tuple([z.string(), z.number()]), z.tuple([z.string()])); // false
    ```

- Objects (structural)
  - Every required key in target must exist in source.
  - If target requires a key, source must also require it.
  - Property types are covariant; extra properties in source are allowed.
    ```ts
    const S = z.object({ name: z.string(), age: z.number() });
    const T = z.object({ name: z.string() });
    isAssignable(S, T); // true
    isAssignable(T, S); // false
    ```

- Records
  - Key types and value types must be assignable (covariant).
    ```ts
    const R1 = z.record(z.string(), z.string());
    const R2 = z.record(z.string(), z.union([z.string(), z.number()]));
    isAssignable(R1, R2); // true
    ```

- Maps and Sets
  - `Set<T>`: T is invariant (must be identical/mutually assignable).
  - `Map<K, V>`: K and V are invariant.
    ```ts
    isAssignable(z.set(z.string()), z.set(z.string())); // true
    isAssignable(z.set(z.string()), z.set(z.any())); // false
    ```

- Promises
  - Covariant inner type.
    ```ts
    isAssignable(z.promise(z.string()), z.promise(z.string().or(z.number()))); // true
    ```

- Functions
  - Arguments are contravariant (target args must extend source args).
  - Return type is covariant.
    ```ts
    const F1 = z.function().args(z.string()).returns(z.number());
    const F2 = z.function().args(z.string().or(z.number())).returns(z.number());
    isAssignable(F2, F1); // true (F2 accepts everything F1 accepts and more)
    ```

- Unions
  - Source union to target: every source option must be assignable to target.
  - Target union: source is assignable if it’s assignable to at least one member of the target.
    ```ts
    const Uab = z.union([z.literal('a'), z.literal('b')]);
    const Uabc = z.union([z.literal('a'), z.literal('b'), z.literal('c')]);
    isAssignable(Uab, Uabc); // true
    isAssignable(Uabc, Uab); // false
    ```

- Intersections
  - Source intersection: assignable if the combined source (for objects) or at least one of its components is assignable to the target.
  - Target intersection: source must be assignable to both sides.

- Custom / Instanceof
  - Only identical custom schemas are considered assignable (conservative).
    ```ts
    const Dog = z.instanceof(class Dog {});
    const Animal = z.instanceof(class Animal {});
    isAssignable(Dog, Dog); // true
    isAssignable(Dog, Animal); // false
    ```

## Notes and Caveats

- This library inspects Zod v4 core internals (via `schema._zod.def`). If Zod’s internals change, helpers may need updates.
- Optional property detection in objects also treats `Union<..., undefined>` as optional.
- Nullable detection focuses on the wrapper form (`z.string().nullable()`); unions with `null` are not unwrapped as a nullable wrapper.
- Excess property checks are not enforced; extra source properties are allowed.
- Instanceof/custom schemas are treated conservatively; only identical schemas are assignable.

## Development

- Build: `pnpm build`
- Test: `pnpm test`
