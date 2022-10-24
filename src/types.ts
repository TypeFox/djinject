/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { CheckError, CheckResult, Combine, Filter, Fn, Is, IsEmpty, Keys, Obj, Or, Paths, UnionToIntersection, UnionToTuple, Values } from 'typescript-typelevel';

export type Module<C = any, T = C> = {
    [K in keyof T]: Module<C, T[K]> | Factory<any, T[K]>
};

export type Factory<C, T> = (ctx: C) => T;

export type Container<A extends Module[], M = MergeArray<A>, C = ReflectContainer<M>> =
    IsEmpty<M> extends true ? {} :
        M extends Module<unknown, infer T> ?
            T extends C ? T : never : never;

export type Check<A extends Module[], M = MergeArray<A>, C = ReflectContainer<M>> =
    IsEmpty<M> extends true
        ? A
        : M extends Module<unknown, infer T>
            ? CheckResult<A, [
                CheckTypes<A, T>,
                CheckContextTypes<A, C>,
                CheckContextProperties<A, C, T>
            ], 'ginject_error'>
            : never;

// checks if merged module types are valid
type CheckTypes<A, T, P = Filter<Combine<Paths<T>>, never>> =
    IsEmpty<P> extends true ? A : CheckError<'Type conflict', UnionToTuple<keyof P>, 'https://docs.ginject.io/#modules'>;

// checks if same properties in different contexts have compatible types
type CheckContextTypes<A, C, P = Filter<Combine<Paths<C>>, never>> =
    IsEmpty<P> extends true ? A : CheckError<'Dependency conflict', UnionToTuple<Keys<P>>, 'https://docs.ginject.io/#context'>;

// checks if the container provides all properties the context requires
type CheckContextProperties<A, C, T, P = Combine<Omit<Filter<Combine<Paths<C>>, never, false>, keyof Combine<Paths<T>>>>> =
    IsEmpty<P> extends true ? A : CheckError<'Dependency missing', UnionToTuple<Keys<P>>, 'https://docs.ginject.io/#context'>;

// TODO(@@dd): remove the recursion by first getting all paths in M and then Mapping all Fn1 to their Ctx. Then switch from MergeObject to Merge.
export type ReflectContainer<M,
    _Functions = Filter<M, Fn<[any]>>,                           // { f1: (ctx: C1) = any, f2: ... }
    _FunctionArray = UnionToTuple<_Functions[keyof _Functions]>, // ((ctx: C) => any)[]
    _ContextArray = MapFunctionsToContexts<_FunctionArray>,      // C[]
    _Ctx = MergeArray<_ContextArray>,                            // C | never
    Ctx = Is<_Ctx, never> extends true ? {} : _Ctx,              // C
    _SubModules = Filter<M, Obj>,                                // {} | {}
    SubModule = UnionToIntersection<Values<_SubModules>>         // {}
> =
    Is<M, any> extends true ? unknown :
        M extends Obj
            ? MergeObjects<ReflectContainer<SubModule>, Ctx> // TODO(@@dd): I would like to use Merge instead of MergeObjects
            : unknown;

type MapFunctionsToContexts<T> =
    T extends [] ? [] :
        T extends [Fn<[infer Ctx, ...any[]]>, ...infer Tail]
            ? Is<Ctx, unknown> extends true ? MapFunctionsToContexts<Tail> : [Ctx, ...MapFunctionsToContexts<Tail>]
            : never; // we expect only functions in array T

export type MergeArray<A> =
    A extends unknown[]
        ? A extends [infer Head, ...infer Tail]
            ? Tail extends []
                ? Head
                : Tail extends unknown[]
                    ? Merge<MergeArray<Tail>, Head>
                    : never
            : never
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
            : [never] // T = [], users which expect T don't provide more elements required by S
        : []; // S = [], S ignores additions elements required by users of T

type MergeFunctions<S extends Fn, T extends Fn> =
    S extends (...args: infer ArgsS) => infer ResS
        ? T extends (...args: infer ArgsT) => infer ResT
            ? Merge<ArgsS, ArgsT> extends infer A
                ? A extends any[] ? (...args: A) => Merge<ResS, ResT> : never
                : never
            : never
        : never;

// TODO(@@dd): Workaround for infinite deep type error when calling Merge. Remove `export` and use Merge instead.
export type MergeObjects<S, T> =
    Combine<{
        [K in keyof S | keyof T]: K extends keyof S
            ? (K extends keyof T ? Merge<S[K], T[K]> : S[K])
            : (K extends keyof T ? T[K] : never)
    }>;
