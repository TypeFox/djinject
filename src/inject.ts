/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { keys, merge } from "./merge";
import { Module, Container, Factory } from "./types";

const isEager = Symbol();

const isRequested = Symbol();

export function inject<M extends Module<any>[]>(...modules: M): Container<M> {
    const module = modules.reduce(merge, {});
    const container = proxify(module);
    initializeEagerServices(module, container);
    return container;
}

export function eager<C, T>(factory: Factory<C, T>): Factory<C, T> {
    return (isEager in factory) ? factory : Object.assign((ctr: C) => factory(ctr), { [isEager]: true } );
}

function initializeEagerServices<C, T, M extends Module<C, T>>(module: M, container: C): void {
    keys(module).forEach(key => {
        const value = module[key];
        if (typeof value === 'function') {
            (isEager in value) && value(container);
        } else {
            initializeEagerServices(value, container);
        }
    });
}

function proxify<C, T>(module: Module<C,T>, container?: C, path: string = ''): T {
    const resolve = (obj: any, prop: PropertyKey, proxy: T) => {
        const name = path + '[' + String(prop) + ']';
        if (obj[prop] === isRequested) {
            throw new Error('Cyclic dependency ' + name + '. See https://github.com/langium/ginject#cyclic-dependencies');
        }
        const ctx = container || proxy;
        const val = (module as any)[prop];
        return (prop in obj) ? obj[prop] : (prop in module) ? (
            obj[prop] = isRequested,
            obj[prop] = (typeof val === 'function') ? val(ctx) : proxify(val, ctx, name)
        ) : undefined;
    };
    const proxy: any = new Proxy({}, {
        deleteProperty: () => false,
        get: resolve,
        getOwnPropertyDescriptor: (target, prop) => (resolve(target, prop, proxy), Object.getOwnPropertyDescriptor(target, prop)), // used by for..in
        has: (_, prop) => prop in module, // used by ..in..
        ownKeys: () => Reflect.ownKeys(module)
    });
    return proxy;
}
