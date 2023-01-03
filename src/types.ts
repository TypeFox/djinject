/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { CheckError, CheckResult, Combine, Filter, Fn, Is, IsEmpty, Keys, Obj, Or, Paths, UnionToIntersection, UnionToTuple, Values } from 'typescript-typelevel';

export type Module<C = any, T = C> = {
    [K in keyof T]: T[K] extends Fn
        ? Factory<C, T[K]>
        : (Module<C, T[K]> | Factory<C, T[K]>);
};

export type PartialModule<C = any, T = C> = Module<C, DeepPartial<T>>;

type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
};

export type Factory<C, T> = (ctx: C) => T;

export type Container<A extends Module | Module[]> =
    [A] extends [Module[]] ? _Container<A> :
        [A] extends [Module] ? _Container<[A]> : never

type _Container<A extends Module[], M = MergeArray<A>, C = ReflectContext<M>> =
    IsEmpty<M> extends true ? {} :
        M extends Module<any, infer T> ?
            T extends C ? T : never : never;

export type Check<A extends Module[]> = _Check<A>;

type _Check<A extends Module[], M = MergeArray<A>, C = ReflectContext<M>> =
    IsEmpty<M> extends true
        ? A
        : M extends Module<any, infer T>
            ? CheckResult<A, [
                CheckTypeConflict<A, T>,
                CheckDependencyConflict<A, C, T>,
                CheckDependencyMissing<A, C, T>
            ], 'djinject_error'>
            : never;

// checks if merged module types are valid
type CheckTypeConflict<A, T, P = Filter<Combine<Paths<T>>, never>> =
    IsEmpty<P> extends true ? A : CheckError<'Type conflict', UnionToTuple<Keys<P>>, 'https://docs.djinject.io/#type-conflict'>;

// checks if same properties in different contexts have compatible types
type CheckDependencyConflict<A, C, T, P = Filter<Combine<Paths<MergeObjects<C, Filter<T, never, {Cond: false}>>>>, never>> =
    IsEmpty<P> extends true ? A : CheckError<'Dependency conflict', UnionToTuple<Keys<P>>, 'https://docs.djinject.io/#dependency-conflict'>;

// checks if the container provides all properties the context requires
type CheckDependencyMissing<A, C, T, P = Combine<Omit<Combine<Paths<C>>, keyof Combine<Paths<T>>>>> =
    IsEmpty<P> extends true ? A : CheckError<'Dependency missing', UnionToTuple<Keys<P>>, 'https://docs.djinject.io/#dependency-missing'>;

export type ReflectContext<M,
    _Functions = Filter<M, Fn>,                                      // { f1: (ctx: C1) = any, f2: ... }
    _FunctionArray = UnionToTuple<_Functions[keyof _Functions]>,     // ((ctx: C) => any)[]
    _ContextArray = MapFunctionsToContexts<_FunctionArray>,          // C[]
    Ctx = MergeArray<_ContextArray>,                                 // C | never
    _SubModules = Filter<M, Obj>,                                    // {} | {}
    SubModule = UnionToIntersection<Values<_SubModules>>             // {}
> =
    Or<Is<M, any>, Is<Ctx, never>> extends true
        ? unknown
        : M extends Obj
            ? MergeObjects<ReflectContext<SubModule>, Ctx>
            : unknown;

type MapFunctionsToContexts<T> =
    T extends [] ? [] :
        T extends [Fn<[infer Ctx, ...any[]]>, ...infer Tail]
            ? Or<Is<Ctx, any>, Is<Ctx, unknown>> extends true
                ? MapFunctionsToContexts<Tail>
                : Ctx extends object
                    ? [Ctx, ...MapFunctionsToContexts<Tail>]
                    : never
            : never; // we expect only functions in array T

type MergeArray<A> =
    A extends unknown[]
        ? A extends [infer Head, ...infer Tail]
            ? Tail extends []
                ? Head
                : Tail extends unknown[]
                    ? Merge<MergeArray<Tail>, Head>
                    : never
            : {}
        : never;

export type Merge<S, T> =
    Is<S, T> extends true ? S : // identity
        Is<T, void> extends true ? S : // if target expects nothing it is ok to provide something
            Or<Is<S, never>, Is<T, never>> extends true ? never :
                Is<S, unknown> extends true ? unknown : Is<T, unknown> extends true ? S :
                    Is<S, any> extends true ? any : Is<T, any> extends true ? S :
                        S extends any[] ? (T extends any[] ? MergeArrays<S, T> : (S extends T ? S : never)) :
                            S extends Fn ? (T extends Fn ? MergeFunctions<S, T> : (S extends T ? S : never)) :
                                S extends Obj ? (T extends Obj ? MergeObjects<S, T> : (S extends T ? S : never)) :
                                    S extends T ? S : never;

// Consumers of T expect a certain abount of elements.
// It is required that S has at less or equal elements as T.
// It is sufficient, if elements of S extend elements of T.
type MergeArrays<S extends any[], T extends any[]> =
    S extends [infer HeadS, ...infer TailS]
        ? T extends [infer HeadT, ...infer TailT]
            ? [Merge<HeadS, HeadT>, ...MergeArrays<TailS, TailT>]
            : S
        : T;

// by definition the context of S overwrites the context of T
type MergeFunctions<S extends Fn, T extends Fn> =
    S extends Fn<infer ArgsS, infer ResS>
        ? T extends Fn<any[], infer ResT>
            ? (...args: ArgsS) => Merge<ResS, ResT>
            : never
        : never;

type MergeObjects<S, T> =
    Combine<{
        [K in keyof S | keyof T]: K extends keyof S
            ? (K extends keyof T ? Merge<S[K], T[K]> : S[K])
            : (K extends keyof T ? T[K] : never)
    }>;
