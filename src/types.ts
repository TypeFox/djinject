/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

export type Module<T = unknown> = {
    [K in keyof T]: Module<T[K]> | Factory<any, T[K]>
};

export type Factory<C, T> = (ctr: C) => T;

export type Container<M> =
    M extends Module[] ? Container<MergeModules<M>> :
        M extends Module<infer T> ? T :
            never;

export type MergeModules<M extends Module[]> =
    M extends [Head<M>, ...Tail<M>] ? (
        Tail<M> extends [] ? Head<M> :
            Tail<M> extends Module[] ? Merge<MergeModules<Tail<M>>, Head<M>> :
                never
    ) : never;

export type Merge<S, T> =
    Or<Is<S, never>, Is<T, never>> extends true ? never :
        Or<Is<S, any>, Is<T, any>> extends true ? any :
            Or<Is<S, unknown>, Is<T, unknown>> extends true ? unknown :
                // TODO(@@dd): handle functions first because classes are objects and function
                S extends Record<PropertyKey, unknown>
                    ? T extends Record<PropertyKey, unknown> ? MergeObjects<S, T> : never
                    : T extends Record<PropertyKey, unknown> ? never : (S extends T ? S : never);

type MergeObjects<S extends Record<PropertyKey, unknown>, T extends Record<PropertyKey, unknown>> =
    Union<{
        [K in keyof S | keyof T]: K extends keyof S
            ? (K extends keyof T ? Merge<S[K], T[K]> : S[K])
            : (K extends keyof T ? T[K] : never)
    }>;

type Head<A extends unknown[]> = A extends [] ? never : A extends [head: infer H, ...tail: unknown[]] ? H : never;

type Tail<A extends unknown[]> = A extends [head: unknown, ...tail: infer T] ? T : never;

type Is<T1, T2> = (<T>() => T extends T2 ? true : false) extends <T>() => T extends T1 ? true : false ? true : false;

type Or<C1 extends boolean, C2 extends boolean> = C1 extends true ? true : C2 extends true ? true : false;

type Union<T> = T extends Record<PropertyKey, unknown> ? { [K in keyof T]: T[K] } : T;
