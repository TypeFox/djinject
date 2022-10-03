/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

export type MergeArray<M extends unknown[]> =
    M extends [] ? {} :
        M extends [Head<M>, ...Tail<M>] ? (
            Tail<M> extends [] ? Head<M> : Merge<MergeArray<Tail<M>>, Head<M>>
        ) : never;

// ✅ merge two arbitrary values
// Rule 1: mergining something with never resolves to never
// Rule 2: mergining something with any resolves to any
// Rule 3: mergining something with unknown resolves to unknown
export type Merge<S, T> =
    Or<Is<S, never>, Is<T, never>> extends true ? never :
        Or<Is<S, any>, Is<T, any>> extends true ? any :
            Or<Is<S, unknown>, Is<T, unknown>> extends true ? unknown :
                S extends Record<PropertyKey, unknown>
                    ? T extends Record<PropertyKey, unknown> ? MergeObjects<S, T> : never
                    : T extends Record<PropertyKey, unknown> ? never : (S extends T ? S : never)

// ✅ merge two objects
type MergeObjects<S extends Record<PropertyKey, unknown>, T extends Record<PropertyKey, unknown>> = {
    [K in keyof S | keyof T]: K extends keyof S
        ? (K extends keyof T ? Merge<S[K], T[K]> : S[K])
        : (K extends keyof T ? T[K] : never)
};

// ✅ head of a list
type Head<A extends unknown[]> =
    A extends [] ? never :
        A extends [head: infer H, ...tail: unknown[]] ? H : never;

// ✅ tail of a list
type Tail<A extends unknown[]> =
    A extends [head: unknown, ...tail: infer T] ? T : never;

// ✅ is checks if type T1 strictly equals type T2
type Is<T1, T2> = (<T>() => T extends T2 ? true : false) extends <T>() => T extends T1 ? true : false ? true : false;

// ✅ logical or tests if condition C1 or condition C2 is true
type Or<C1 extends boolean, C2 extends boolean> = C1 extends true ? true : C2 extends true ? true : false;

// ✅ represents a function
export type Fn = (...args: any[]) => any;

// ✅ represents an object, i.e. an associative array with possbily no properties
export type Obj<T> =
    T extends Record<PropertyKey, unknown> ? (
        T extends Fn ? never :
            T extends unknown[] ? never : T
    ) : never;

// ✅ tests if a value is an object
function isObj<T>(t: T): t is Obj<T> {
    return t !== null && typeof t === 'object' && !Array.isArray(t);
}

// ✅ merge two objects, the signature is compatible with the reducer callback of Array.prototype.reduce
export function merge<S, T>(target: Obj<T>, source: Obj<S>): Merge<S, T> {
    keys(source).forEach(key => {
        const sourceValue = source[key];
        const targetValue = target[key];
        (target as any)[key] = isObj(sourceValue) && isObj(targetValue) ? merge(targetValue, sourceValue) : sourceValue;
    });
    return target as Merge<S, T>;
}

// ✅ returns object keys and symbols
export function keys<T>(t: T): Array<keyof T> {
    // TODO(@@dd): remove type cast
    return [...Object.keys(t as Obj<T>), ...Object.getOwnPropertySymbols(t)] as Array<keyof T>;
}
