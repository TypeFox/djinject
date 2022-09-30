/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

// ✅ represents a function, i.e. a possible empty list of arguments and a return type
export type Fn<A extends any[] = any[], R = any> = (...args: A) => R;

// ✅ represents an object, i.e. an associative array with possbily no properties
export type Obj<T> =
    T extends Record<PropertyKey, any> ? (
        T extends Fn ? never :
        T extends any[] ? never :
        T
    ) : never;

/* TODO(@@dd): DELME -->
// ✅ If T is an intersection A & B, the union of all properties of A and B is returned, otherwise T is returned
// TODO(@@dd): better name? Unify or Unite?
export type Union<T> = T extends Obj<T> ? {
    [K in keyof T]: T[K];
} : T;
<-- DELME */

// ✅ tests if a value is an object   
export function isObj<T>(t: T): t is Obj<T> {
    return t !== null && typeof t === 'object' && !Array.isArray(t);
}

export function keys<T extends Record<PropertyKey, unknown>>(obj: T): PropertyKey[] {
    return [...Object.keys(obj), ...Object.getOwnPropertySymbols(obj)];
}
