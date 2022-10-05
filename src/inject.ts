/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { keys, merge } from "./merge";
import { Module, Container, Factory } from "./types";

const isEager = Symbol();

const requested = Symbol();

export function inject<M extends Array<Module<any>>>(...modules: M): Container<M> {
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

function proxify<C, T>(module: Module<C, T>, container?: C, path?: string): T {
    const proxy: any = new Proxy({}, {
        deleteProperty: () => false,
        get: (target, prop) => resolve(target, prop, module, container || proxy, path),
        getOwnPropertyDescriptor: (target, prop) => (resolve(target, prop, module, container || proxy, path), Object.getOwnPropertyDescriptor(target, prop)), // used by for..in
        has: (_, prop) => prop in module, // used by ..in..
        ownKeys: () => Reflect.ownKeys(module)
    });
    return proxy;
}

function resolve<C, T extends Record<PropertyKey, unknown>, M extends Module<C, T>, P extends PropertyKey>(obj: T, prop: P, module: M, container: C, parentPath?: string): T[P] | undefined {
    const path = (parentPath ? '.' : '') + String(prop);
    if (prop in obj) {
        // TODO(@@dd): create an error that isn't instanceof Error (which could be a valid service)
        if (obj[prop] instanceof Error) {
            throw new Error('Construction failure: ' + path);
        }
        if (obj[prop] === requested) {
            // TODO(@@dd): list all involved dependencies? this may be misleading in the case of transitive dependencies
            throw new Error('Cycle detected. Please make ' + path + ' lazy. See https://github.com/langium/ginject#cyclic-dependencies');
        }
        return obj[prop];
    } else if (prop in module) {
        const value = (module as any)[prop];
        (obj as any)[prop] = requested;
        try {
            obj[prop] = (typeof value === 'function') ? value(container) : proxify(value, container, (path ? '.' : ''));
        } catch (error) {
            // TODO(@@dd): create an error that isn't instanceof Error (which could be a valid service)
            (obj as any)[prop] = error instanceof Error ? error : undefined;
            throw error;
        }
        return obj[prop];
    } else {
        return undefined;
    }
}
