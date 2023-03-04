/******************************************************************************
 * Copyright 2023 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { Check, Container, Module, Obj } from './types';

// used to tag groups and services to be eagerly evaluated
const isEager = Symbol();

// used to tag proxy properties during initialization
const isRequested = Symbol();

/**
 * Creates a container from the given modules.
 * The modules are merged and the dependencies are injected.
 * The container is a proxy that lazily creates the dependencies.
 * The dependencies are cached and reused.
 *
 * @param modules The modules to be merged and injected.
 * @returns The container.
 */
// @ts-expect-error A rest parameter must be of an array type. ts(2370)
export function inject<Modules extends Module[]>(...modules: Check<Modules>): Container<Modules> {
    const module = (modules as any).reduce(merge, {});
    const container = proxify(module);
    initializeEagerServices(module, container);
    return container;
}

function merge(target: any, source: any): any {
    Object.keys(source).forEach(key => {
        target[key] = isObj(source[key]) && isObj(target[key]) ? merge(target[key], source[key]) : source[key];
    });
    return target;
}

function isObj(t: any): t is Obj {
    return t !== null && typeof t === 'object';
}

/**
 * Marks a group or factory to be eagerly evaluated.
 * Eager groups and factories are evaluated when the container is created.
 *
 * @param val The group or factory to be eagerly evaluated.
 * @returns A new instance of the group or factory.
 */
export function init<T extends object | Function>(val: T): T {
    return (isEager in val) ? val : Object.assign(
        (typeof val === 'function') ? ((...args: any[]) => val(args)) as T : { ...val },
        { [isEager]: true }
    );
}

function initializeEagerServices(val: any, context: any, eagerGroup: boolean = false): void {
    const eagerScope = eagerGroup || isEager in val;
    (typeof val === 'function') ? eagerScope && val(context) : Object.keys(val).forEach(key => {
        initializeEagerServices(val[key], context, eagerScope);
    });
}

function proxify(module: any, container?: any, path: string = ''): any {
    const get = (obj: any, prop: PropertyKey, proxy: any) => {
        const name = path + '[' + String(prop) + ']';
        if (obj[prop] === isRequested) {
            throw new Error('Cyclic dependency ' + name + '. See https://djinject.io/#cyclic-dependencies');
        }
        const ctr = container || proxy;
        if (prop in obj) {
            return obj[prop];
        } else if (prop in module) {
            obj[prop] = isRequested;
            const val = module[prop];
            return obj[prop] = (typeof val === 'function') ? val(ctr) : proxify(val, ctr, name);
        } else {
            return undefined;
        }
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
