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
    IsEmpty<M> extends true
        ? A
        : M extends Module<unknown, infer T>
            ? ValidationResult<A, [
                ValidateTypes<A, T>,
                ValidateContextTypes<A, C>,
                ValidateContextProperties<A, C, T>
            ]>
            : never;

type ValidationResult<A extends Module[], V extends (A | ValidationError)[], E = Filter<V, ValidationError>> =
    E extends [] ? A : {
        ginject_error: E
    };

export type ValidationError<M extends string = any, P = any, D extends `https://docs.ginject.io/#${string}` = any> = {
    message: M;
    dependencies: P;
    help: D;
};

// checks if merged module types are valid
type ValidateTypes<A, T, P = Filter<Paths<T>, never>> =
    IsEmpty<P> extends true ? A : ValidationError<'Type conflict', UnionToTuple<keyof P>, 'https://docs.ginject.io/#modules'>;

// checks if same properties in different contexts have compatible types
type ValidateContextTypes<A, C, P = Filter<Paths<C>, never>> =
    IsEmpty<P> extends true ? A : ValidationError<'Dependency conflict', UnionToTuple<keyof P>, 'https://docs.ginject.io/#context'>;

// checks if the container provides all properties the context requires
type ValidateContextProperties<A, C, T, P = Join<Omit<FilterNot<Paths<C>, never>, keyof Paths<T>>>> =
    IsEmpty<P> extends true ? A : ValidationError<'Dependency missing', UnionToTuple<keyof P>, 'https://docs.ginject.io/#context'>;

type Paths<T, P = Flatten<T>> =
    Join<UnionToIntersection<P extends [string, unknown]
        ? { [K in `${P[0]}`]: P[1] }
        : never
    >>;

// currently symbol keys are not supported
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
        T extends [Function1<infer Ctx>, ...infer Tail]
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

export type MergeObjects<S, T> =
    Join<{
        [K in keyof S | keyof T]: K extends keyof S
            ? (K extends keyof T ? Merge<S[K], T[K]> : S[K])
            : (K extends keyof T ? T[K] : never)
    }>;

type Obj = Record<PropertyKey, unknown>;

type Fn<T extends any[] = any[], R extends any = any> = (...args: T) => R;

type Function1<T = any, R = any> = (args0: T, ...args: any[]) => R;

type IsEmpty<T> = [keyof T] extends [never] ? true : false;

type Is<T1, T2> = (<T>() => T extends T2 ? true : false) extends <T>() => T extends T1 ? true : false ? true : false;

type Or<C1 extends boolean, C2 extends boolean> = C1 extends true ? true : C2 extends true ? true : false;

type Join<T> = T extends Obj ? { [K in keyof T]: T[K] } : T;

type Filter<T, V> =
    T extends any[] ? FilterArray<T, V> :
        T extends Obj ? FilterObj<T, V> :
            never;

type FilterNot<T, V> =
    T extends any[] ? FilterNotArray<T, V> :
        T extends Obj ? FilterNotObj<T, V> :
            never;

type FilterObj<T, V> = Pick<T, { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T]>;

type FilterNotObj<T, V> = Pick<T, { [K in keyof T]-?: T[K] extends V ? never : K }[keyof T]>;

type FilterArray<A extends any[], V> =
    A extends [] ? [] :
        A extends [infer H, ...infer T]
            ? H extends V
                ? [H, ...FilterArray<T, V>]
                : FilterArray<T, V>
            : [];

type FilterNotArray<A extends any[], V> =
    A extends [] ? [] :
        A extends [infer H, ...infer T]
            ? H extends V
                ? FilterNotArray<T, V>
                : [H, ...FilterNotArray<T, V>]
            : [];

type UnionToIntersection<U> = (U extends any ? (arg: U) => void : never) extends ((arg: infer I) => void) ? I : never;

type UnionToTuple<T, L = LastOf<T>> = [T] extends [never] ? [] : [...UnionToTuple<Exclude<T, L>>, L];

type LastOf<T> =
    UnionToIntersection<T extends any ? () => T : never> extends () => infer R
        ? R
        : never;

type Values<T> = T[keyof T];
