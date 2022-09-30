/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { isObj, keys, Obj } from "./object";
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
const isRequested = Symbol();

// ✅ a module that can be passed to the inject function
export type Module<C = Obj<any>, T = C> =
    T extends Obj<T> ? { // ensure C and T are real ojects { ... }
        [K in keyof T]: Module<C, T[K]> | Factory<C, T[K]> // it is up to the user to define the factories within the object hierarchy
    } : never;

// ✅ transforms a list of modules to an IoC container
export type Container<M extends Module[]> = InverseModule<MergeModules<M>>;

// ✅ a factory which receives the IoC container and returns a value/service (which may be a singleton value or a provider)
export type Factory<C = any, T = any> = (ctr?: C) => T;

/**
 * An internal type that reflects that an {@link Injector} will be eagerly initialized.
 * See {@link eager}.
 */
type InternalFactory<C = any, T = any> = Factory<C, T> & { [isEager]?: boolean };

// ✅ Internal. InverseModule<Module<any, T>> := T
type InverseModule<M> = Union<{
    [K in keyof M]:
        M[K] extends (...args: any[]) => any ? ReturnType<M[K]> :
        M[K] extends Module ? InverseModule<M[K]> :
        never
}>;

// TODO(@@dd): DELME -->
{
    class A {}

    type M = { dep: () => A }
    type I = InverseModule<M>
    type C = Container<[M]>

    type _MA = MergeArray<[M]>
    type _IMA = InverseModule<_MA>
    type _CMA = Container<[_MA]>

    type _MM = MergeModules<[M]>
    type _IMM = InverseModule<_MM>
    type _CMM = Container<[_MM]>

    const m = { dep: () => A }
    const x = inject(m);
    const y = x.dep;

    const mm: Module = { dep: () => A } // TODO(@@dd): use `satisfies Module` in TS 4.9
    const xx = inject(m);
    const yy = x.dep;
}
// <-- DELME


type Union<T> = T extends Obj<T> ? {
    [key in keyof T]: T[key]
} : T;

// ✅ merges N modules by merging them pair-wise from right to left
type MergeModules<M extends any[]> = MergeArray<M>;

/**
 * Decorates an {@link Injector} for eager initialization with {@link inject}.
 * 
 * @param factory
 */
 export function eager<C, T>(factory: Factory<C, T>): Factory<C, T> {
    return (factory as InternalFactory<C, T>)[isEager]
        ? factory
        : Object.assign((ctr: C) => factory(ctr), { [isEager]: true } ) as InternalFactory<C, T>;
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
export function inject<M extends [Module, ...Module[]]>(...modules: M): Container<MergeModules<M>> {
    const module = modules.reduce(merge, {});
    return createContainer(module) as Container<MergeModules<M>>;
}

function createContainer<M extends Module>(module: M): Container<M> {
    const eagerServices = [];
    const container = proxify(module/*TODO(@@dd):, eagerServices*/);
    // TODO(@@dd): create eager services
    return container as Container<M>;
}

function proxify<M extends Record<PropertyKey, unknown>, C>(module: M, container?: C): InverseModule<M> {
    const obj: any = {};
    keys(module).forEach(key => {
        const value = module[key];
        if (isObj(value)) {
            obj[key] = proxify(value, container ?? obj);
        } else if (typeof value === 'function') {
            obj[key] = new Proxy({}, {
                deleteProperty: () => false,
                get: (obj, prop) => _resolve(obj, prop, module, injector || proxy),
                getOwnPropertyDescriptor: (obj, prop) => (_resolve(obj, prop, module, injector || proxy), Object.getOwnPropertyDescriptor(obj, prop)), // used by for..in
                has: (_, prop) => prop in module, // used by ..in..
                ownKeys: () => Reflect.ownKeys(module) // used by for..in
            });
        } else {
            throw new Error(); // TODO(@@dd): error message
        }
    });
    return obj;
}

/**
 * Returns the value `obj[prop]`. If the value does not exist, yet, it is resolved from
 * the module description. The result of service factories is cached. Groups are
 * recursively proxied.
 *
 * @param obj an object holding all group proxies and services
 * @param prop the key of a value within obj
 * @param module an object containing groups and service factories
 * @param injector the first level proxy that provides access to all values
 * @returns the requested value `obj[prop]`
 * @throws Error if a dependency cycle is detected
 */
function _resolve<I, T>(obj: any, prop: PropertyKey, module: Module<I, T>, factory: I): T[keyof T] | undefined {
    if (prop in obj) {
        if (obj[prop] instanceof Error) {
            throw new Error('Construction failure. Please make sure that your dependencies are constructable.', { cause: obj[prop] });
        }
        if (obj[prop] === isRequested) {
            throw new Error('Cycle detected. Please make "' + String(prop) + '" lazy. See https://langium.org/docs/di/cyclic-dependencies');
        }
        return obj[prop];
    } else if (prop in module) {
        const value: Module<I, T[keyof T]> | ((factory: I) => T[keyof T]) = module[prop as keyof T];
        obj[prop] = isRequested;
        try {
            obj[prop] = (typeof value === 'function') ? value(factory) : _inject(value, factory);
        } catch (error) {
            obj[prop] = error instanceof Error ? error : undefined;
            throw error;
        }
        return obj[prop];
    } else {
        return undefined;
    }
}
