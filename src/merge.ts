/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { Merge } from "./types";

export function merge<S extends Record<PropertyKey, unknown>, T extends Record<PropertyKey, unknown>>(target: T, source: S): Merge<S, T> {
    keys(source).forEach(key => {
        const sourceValue = source[key];
        const targetValue = target[key];
        (target as any)[key] = isObj(sourceValue) && isObj(targetValue) ? merge(targetValue, sourceValue) : sourceValue;
    });
    return target as Merge<S, T>;
}

function isObj(t: any): t is Record<PropertyKey, unknown> {
    return t !== null && typeof t === 'object' && !Array.isArray(t);
}

export function keys<T extends Record<PropertyKey, unknown>>(t: T): (keyof T)[] {
    return [...Object.keys(t), ...Object.getOwnPropertySymbols(t)];
}
