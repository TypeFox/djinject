/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

export type Module<C, T = C> = {
    [K in keyof T]: Module<C, T[K]> | Factory<C, T[K]>
};

export type Factory<C, T> = (ctr: C) => T;

// TODO(@@dd): whether to infer container type C of Module<C, T> or not?
export type Container<M> =
    M extends Module<unknown>[] ? Container<MergeModules<M>> :
        M extends EmptyObject ? EmptyObject :
            // TODO(@@dd): handle functions first because classes are objects and function
            M extends Module<infer C, infer T> ? Validate<C, T> :
                never;

type Validate<C, T> = T; // TODO(@@dd): validate factory arguments

type EmptyObject = {
    [key: PropertyKey]: never
};

export type MergeModules<M extends Module<unknown>[]> =
 M extends [] ? EmptyObject:
     M extends [Head<M>, ...Tail<M>] ? (
         Tail<M> extends [] ? Head<M> :
             Tail<M> extends Module<unknown>[] ? Merge<MergeModules<Tail<M>>, Head<M>> :
                 never
     ) : never;

export type Merge<S, T> =
    Or<Is<S, never>, Is<T, never>> extends true ? never :
        Or<Is<S, any>, Is<T, any>> extends true ? any :
            Or<Is<S, unknown>, Is<T, unknown>> extends true ? unknown :
                // TODO(@@dd): handle functions first because classes are objects and function
                S extends Record<PropertyKey, unknown>
                    ? T extends Record<PropertyKey, unknown> ? MergeObjects<S, T> : never
                    : T extends Record<PropertyKey, unknown> ? never : Extends<S, T>;

type MergeObjects<S extends Record<PropertyKey, unknown>, T extends Record<PropertyKey, unknown>> =
    Union<{
        [K in keyof S | keyof T]: K extends keyof S
            ? (K extends keyof T ? Merge<S[K], T[K]> : S[K])
            : (K extends keyof T ? T[K] : never)
    }>;

type Extends<T1, T2> =
    T1 extends T2 ? T1 :
        T1 extends Obj<T1> ? T2 extends Obj<T2> ? never : never :
            T1 extends unknown[] ? T2 extends unknown[] ? T1 extends T2 ? T1 : [Extends<Head<T1>, Head<T2>>, ...Extends<Tail<T1>, Tail<T2>>] : never :
                T1 extends ((...args: any[]) => infer R1) ? T2 extends ((...args: any[]) => infer R2) ? () => Extends<R1, R2> : never : // TODO(@@dd): consider argument types
                    T1 extends boolean ? T2 extends boolean ? boolean : never :
                        T1 extends number ? T2 extends number ? number : never :
                            T1 extends string ? T2 extends string ? string : never :
                                never;

type Obj<T> =
    T extends Record<PropertyKey, unknown> ? (
        T extends (...args: any[]) => any ? never :
            T extends unknown[] ? never : T
    ) : never;

type Head<A extends unknown[]> = A extends [] ? never : A extends [head: infer H, ...tail: unknown[]] ? H : never;

type Tail<A extends unknown[]> = A extends [head: unknown, ...tail: infer T] ? T : never;

type Is<T1, T2> = (<T>() => T extends T2 ? true : false) extends <T>() => T extends T1 ? true : false ? true : false;

type Or<C1 extends boolean, C2 extends boolean> = C1 extends true ? true : C2 extends true ? true : false;

type Union<T> = T extends Record<PropertyKey, unknown> ? { [K in keyof T]: T[K] } : T;
