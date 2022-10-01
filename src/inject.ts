/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { Obj } from "./object";
import { merge, MergeArray } from "./merge";

/**
 * Internally used by {@link eager} to tag an injector.
 * When {@link inject} is called, all eager injectors of the merged module arguments will be called.
 */
const isEager = Symbol();

/**
 * Internally used by {@link _resolve} to tag a requested dependency, directly before calling the factory.
 * This allows us to find cycles during instance creation.
 */
const requested = Symbol();

// ✅ a module that can be passed to the inject function
export type Module<C extends Obj<any> = any, T = C> =
    T extends Obj<T> ? { // ensure C and T are real ojects { ... }
        [K in keyof T]: Module<C, T[K]> | Factory<C, T[K]> // it is up to the user to define the factories within the object hierarchy
    } : never;

// ✅ Internal. InverseModule<Module<any, T>> := T
type InverseModule<M> =
    M extends () => any ? ReturnType<M> :
        M extends Obj<M> ? {
            [K in keyof M]: InverseModule<M[K]>
        } : never;

// ✅ transforms a list of modules to an IoC container
export type Container<M extends Module[]> = InverseModule<MergeArray<M>>;

// ✅ a factory which receives the IoC container and returns a value/service (which may be a singleton value or a provider)
// eslint-disable-next-line no-unused-vars
export type Factory<C, T> = (ctr: C) => T;

/**
 * An internal type that reflects that an {@link Injector} will be eagerly initialized.
 * See {@link eager}.
 */
type InternalFactory<C = unknown, T = unknown> = Factory<C, T> & { [isEager]?: boolean };

/**
 * Decorates an {@link Injector} for eager initialization with {@link inject}.
 *
 * @param factory
 */
export function eager<C, T>(factory: Factory<C, T>): Factory<C, T> {
    return (isEager in factory) ? factory : Object.assign((ctr: C) => factory(ctr), { [isEager]: true } );
}

/**
 * Given a set of modules, the inject function returns a lazily evaluted injector
 * that injects dependencies into the requested service when it is requested the
 * first time. Subsequent requests will return the same service.
 *
 * In the case of cyclic dependencies, an Error will be thrown. This can be fixed
 * by injecting a provider `() => T` instead of a `T`.
 *
 * Please note that the arguments may be objects or arrays. However, the result will
 * be an object. Using it with for..of will have no effect.
 *
 * @param module1 first Module
 * @param module2 (optional) second Module
 * @param module3 (optional) third Module
 * @param module4 (optional) fourth Module
 * @returns a new object of type I
 */
// ✅ inject takes modules (= dependency factories) and returns an IoC container (aka DI container) that is ready to use
export function inject<M extends [Module, ...Module[]]>(...modules: M): Container<M> {
    const module = modules.reduce(merge, {}) as MergeArray<M>;
    return createContainer(module);
}

function createContainer<M extends Module[]>(module: MergeArray<M>): Container<M> {
    const eagerServices = [];
    const container = proxify(module/*TODO(@@dd):, eagerServices*/);
    // TODO(@@dd): create eager services
    return container;
}

function proxify(module: any, container?: any): any {
    const proxy: any = new Proxy({} as any, {
        deleteProperty: () => false,
        get: (target, prop) => resolve(target, prop, module, container || proxy),
        getOwnPropertyDescriptor: (target, prop) => (resolve(target, prop, module, container || proxy), Object.getOwnPropertyDescriptor(target, prop)), // used by for..in
        has: (_, prop) => prop in module, // used by ..in..
        ownKeys: () => Reflect.ownKeys(module)
    });
    return proxy;
}

/**
 * Returns the value `obj[prop]`. If the value does not exist, yet, it is resolved from
 * the module description. The result of service factories is cached. Groups are
 * recursively proxied.
 *
 * @param obj an object holding all group proxies and services
 * @param prop the key of a value within obj
 * @param module an object containing groups and service factories
 * @param container the first level proxy that provides access to all values
 * @returns the requested value `obj[prop]`
 * @throws Error if a dependency cycle is detected
 */
function resolve<T>(obj: any, prop: PropertyKey, module: any, container: any): T[keyof T] | undefined {
    if (prop in obj) {
        if (obj[prop] instanceof Error) {
            throw new Error('Construction failure. Please make sure that your dependencies are constructable.', { cause: obj[prop] });
        }
        if (obj[prop] === requested) {
            // TODO(@@dd): refer to the GitHub readme of ginject instead of langium docs
            throw new Error('Cycle detected. Please make "' + String(prop) + '" lazy. See https://langium.org/docs/di/cyclic-dependencies');
        }
        return obj[prop];
    } else if (prop in module) {
        const value = module[prop];
        obj[prop] = requested;
        try {
            obj[prop] = (typeof value === 'function') ? value(container) : proxify(value, container);
        } catch (error) {
            // TODO(@@dd): create an error that isn't instanceof Error (which could be a valid service)
            obj[prop] = error instanceof Error ? error : undefined;
            throw error;
        }
        return obj[prop];
    } else {
        return undefined;
    }
}
