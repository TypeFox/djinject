/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

export type Module<C = any, T = C> = {
    [K in keyof T]: Module<C, T[K]> | Factory<any, T[K]>
};

export type Factory<C, T> = (ctx: C) => T;

export type Container<A extends Module[], M = MergeArray<A>, C = ReflectContainer<M>> =
    IsEmpty<M> extends true ? {} :
        M extends Module<unknown, infer T> ?
            T extends C ? T : never : never;

export type Validate<A extends Module[], M = MergeArray<A>, C = ReflectContainer<M>> =
    IsEmpty<M> extends true ? A :
        M extends Module<unknown, infer T> ?
            T extends C ? A : {
                ginject_error: {
                    message: 'Missing dependency',
                    docs: 'https://ginject.io/#context',
                    missing_dependencies: UnionToTuple<keyof Join<Omit<Paths<C>, keyof Paths<T>> & Filter<Paths<C>, never>>>
                }
            } : never;

// currently symbol keys are not supported
type Paths<T, P = Flatten<T>> =
    Join<UnionToIntersection<P extends [string, unknown]
        ? { [K in `${P[0]}`]: P[1] }
        : never
    >>;

type Flatten<T, K = keyof T> =
    T extends Obj
        ? K extends string | number
            ? Is<T[K], never> extends true
                ? [`${K}`, never]
                : T[K] extends Record<string | number, unknown>
                    ? Flatten<T[K]> extends infer F
                        ? F extends [string, unknown]
                            ? [`${K}.${F[0]}`, F[1]]
                            : never
                        : never
                    : [`${K}`, T[K]]
            : never
        : never;

export type ReflectContainer<M,
    _Functions = Filter<M, Function1>,                           // { f1: (ctx: C1) = any, f2: ... }
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
        T extends [Function1<infer C>, ...Tail<T>]
            ? Is<C, unknown> extends true ? MapFunctionsToContexts<Tail<T>> : [C, ...MapFunctionsToContexts<Tail<T>>]
            : never; // we expect only functions in array T

export type MergeArray<A> =
    A extends unknown[]
        ? A extends [Head<A>, ...Tail<A>]
            ? Tail<A> extends []
                ? Head<A>
                : Tail<A> extends unknown[]
                    ? Merge<MergeArray<Tail<A>>, Head<A>>
                    : never
            : never
        : never;

export type Merge<S, T> =
    Is<S, T> extends true ? S : // identity
        Is<T, void> extends true ? S : // if target expects nothing it is ok to provide something
            Or<Is<S, never>, Is<T, never>> extends true ? never : // Merge<X, never> = Merge<never, X> = never
                Or<Is<S, unknown>, Is<T, unknown>> extends true ? unknown : // Merge<X, unknown> = Merge<unknown, X> = unknown
                    Is<S, any> extends true ? never : Is<T, any> extends true ? S : // Merge<X, any> = X, Merge<any, X> = never
                        S extends any[] ? (T extends any[] ? MergeArrays<S, T> : (S extends T ? S : never)) :
                            S extends Fn ? (T extends Fn ? MergeFunctions<S, T> : (S extends T ? S : never)) :
                                S extends Obj ? (T extends Obj ? MergeObjects<S, T> : (S extends T ? S : never)) :
                                    S extends T ? S : never;

// Consumers of T expect a certain abount of elements.
// It is required that S has at less or equal elements as T.
// It is sufficient, if elements of S extend elements of T.
type MergeArrays<S extends any[], T extends any[]> =
    S extends [Head<S>, ...Tail<S>]
        ? T extends [Head<T>, ...Tail<T>]
            ? [Merge<Head<S>, Head<T>>, ...MergeArrays<Tail<S>, Tail<T>>]
            : [never] // T = [], users which expect T don't provide more elements required by S
        : []; // S = [], S ignores additions elements required by users of T

type MergeFunctions<S extends Fn, T extends Fn> =
    S extends (...args: infer SA) => infer SR
        ? T extends (...args: infer TA) => infer TR
            ? Merge<SA, TA> extends infer A
                ? A extends any[] ? (...args: A) => Merge<SR, TR> : never
                : never
            : never
        : never;

export type MergeObjects<S, T> =
    Join<{
        [K in keyof S | keyof T]: K extends keyof S
            ? (K extends keyof T ? Merge<S[K], T[K]> : S[K])
            : (K extends keyof T ? T[K] : never)
    }>;

type Obj = Record<PropertyKey, unknown>;

type Fn<T extends any[] = any[], R extends any = any> = (...args: T) => R;

type Function1<T = any, R = any> = (args0: T, ...args: any[]) => R;

type Head<A> = A extends [] ? never : A extends [head: infer H, ...tail: unknown[]] ? H : never;

type Tail<A> = A extends [head: unknown, ...tail: infer T] ? T : never;

type IsEmpty<T> = [keyof T] extends [never] ? true : false;

type Is<T1, T2> = (<T>() => T extends T2 ? true : false) extends <T>() => T extends T1 ? true : false ? true : false;

type Or<C1 extends boolean, C2 extends boolean> = C1 extends true ? true : C2 extends true ? true : false;

type Join<T> = T extends Obj ? { [K in keyof T]: T[K] } : T;

type Filter<T, V> = Pick<T, { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T]>;

type FilterNot<T, V> = Pick<T, { [K in keyof T]-?: T[K] extends V ? never : K }[keyof T]>;

type UnionToIntersection<U> = (U extends any ? (arg: U) => void : never) extends ((arg: infer I) => void) ? I : never;

type UnionToTuple<T, L = LastOf<T>> = [T] extends [never] ? [] : [...UnionToTuple<Exclude<T, L>>, L];

type LastOf<T> =
    UnionToIntersection<T extends any ? () => T : never> extends () => infer R
        ? R
        : never;

type Values<T> = T[keyof T];
