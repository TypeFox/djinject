/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { keys, merge } from "./merge";
import { Container, Factory, Module, Check } from "./types";

const isEager = Symbol();

const isRequested = Symbol();

// @ts-expect-error ts(2370)
export function inject<M extends [Module, ...Module[]]>(...modules: Check<M>): Container<M> {
    const module = (modules as Module[]).reduce(merge, {});
    const container = proxify(module);
    initializeEagerServices(module, container);
    return container;
}

export function eager<C, T, F extends Factory<C, T>>(factory: F): F {
    return (isEager in factory) ? factory : Object.assign(((ctr: any) => factory(ctr)) as F, { [isEager]: true });
}

function initializeEagerServices<C, T, M extends Module<T>>(module: M, context: C): void {
    keys(module).forEach(key => {
        const t = module[key];
        (typeof t === 'function') ? ((isEager in t) && t(context)) : initializeEagerServices(t, context);
    });
}

function proxify<C, T>(module: Module<T>, container?: C, path: string = ''): T {
    const get = (obj: Record<PropertyKey, unknown>, prop: PropertyKey, proxy: T) => {
        const name = path + '[' + String(prop) + ']';
        if (obj[prop] === isRequested) {
            throw new Error('Cyclic dependency ' + name + '. See https://djinject.io/#cyclic-dependencies');
        }
        const ctr = container || (proxy as any);
        const val = (module as any)[prop];
        return (prop in obj) ? obj[prop] : (prop in module) ? (
            obj[prop] = isRequested,
            obj[prop] = (typeof val === 'function') ? val(ctr) : proxify(val, ctr, name)
        ) : undefined;
    };
    const proxy: any = new Proxy({}, {
        deleteProperty: () => false,
        get,
        getOwnPropertyDescriptor: (target, prop) => (get(target, prop, proxy), Object.getOwnPropertyDescriptor(target, prop)), // used by for..in
        has: (_, prop) => prop in module, // used by ..in..
        ownKeys: () => Reflect.ownKeys(module)
    });
    return proxy;
}
