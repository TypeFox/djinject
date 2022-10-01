/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

// ✅ represents an object, i.e. an associative array with possbily no properties
export type Obj<T> =
    T extends Record<PropertyKey, any> ? (
        T extends (...args: any[]) => any ? never : // eslint-disable-line no-unused-vars
            T extends any[] ? never : T
    ) : never;

// ✅ tests if a value is an object
export function isObj<T>(t: T): t is Obj<T> {
    return t !== null && typeof t === 'object' && !Array.isArray(t);
}

// ✅ returns the keys of an object
export function keys<T extends Record<PropertyKey, unknown>>(obj: T): PropertyKey[] {
    return [...Object.keys(obj), ...Object.getOwnPropertySymbols(obj)];
}
