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
                    missing_dependencies: Keys<Omit<Expand<C>, Paths<T>>>
                }
            } : never;

type ReflectContainer<M,
    _Functions = Filter<M, Function1>,                           // { f1: (ctx: C1) = any, f2: ... }
    _FunctionArray = UnionToTuple<_Functions[keyof _Functions]>, // ((ctx: C) => any)[]
    _ContextArray = FunctionArrayToContext<_FunctionArray>,      // C[]
    Ctx = MergeArray<_ContextArray>,                             // C
    _SubModules = Filter<M, Record<PropertyKey, unknown>>,       // {} | {}
    SubModule = UnionToIntersection<Values<_SubModules>>         // {}
> = M extends Record<PropertyKey, unknown> ? (
    Is<Ctx, any> extends true ? (IsEmpty<SubModule> extends true ? unknown : ReflectContainer<SubModule>) :
        Is<Ctx, never> extends true ? (IsEmpty<SubModule> extends true ? unknown : ReflectContainer<SubModule>) :
            MergeObjects<Ctx, ReflectContainer<SubModule>>
) : unknown;

type FunctionArrayToContext<T> =
    T extends [] ? [] :
        T extends [Function1<infer Ctx>, ...Tail<T>]
            ? [Ctx, ...FunctionArrayToContext<Tail<T>>]
            : never;

type Function1<T = any, R = any> = (args0: T, ...args: any[]) => R;

export type MergeArray<M> =
    M extends unknown[] ?
        M extends [Head<M>, ...Tail<M>] ? (
            Tail<M> extends [] ? Head<M> :
                Tail<M> extends unknown[] ? Merge<MergeArray<Tail<M>>, Head<M>> :
                    never
        ) : never : never;

export type Merge<S, T> =
    Or<Is<S, never>, Is<T, never>> extends true ? never :
        Or<Is<S, any>, Is<T, any>> extends true ? any :
            Or<Is<S, unknown>, Is<T, unknown>> extends true ? unknown :
                S extends Record<PropertyKey, unknown>
                    ? T extends Record<PropertyKey, unknown> ? MergeObjects<S, T> : never
                    : T extends Record<PropertyKey, unknown> ? never : (S extends T ? S : never);

type MergeObjects<S, T> =
    Join<{
        [K in keyof S | keyof T]: K extends keyof S
            ? (K extends keyof T ? Merge<S[K], T[K]> : S[K])
            : (K extends keyof T ? T[K] : never)
    }>;

type Head<A> = A extends [] ? never : A extends [head: infer H, ...tail: unknown[]] ? H : never;

type Tail<A> = A extends [head: unknown, ...tail: infer T] ? T : never;

type IsEmpty<T> = [keyof T] extends [never] ? true : false;

type Is<T1, T2> = (<T>() => T extends T2 ? true : false) extends <T>() => T extends T1 ? true : false ? true : false;

type Or<C1 extends boolean, C2 extends boolean> = C1 extends true ? true : C2 extends true ? true : false;

type Join<T> = T extends Record<PropertyKey, unknown> ? { [K in keyof T]: T[K] } : T;

type Filter<T, V> = Pick<T, { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T]>;

type UnionToIntersection<U> = (U extends any ? (arg: U) => void : never) extends ((arg: infer I) => void) ? I : never;

type UnionToTuple<T, L = LastOf<T>> = [T] extends [never] ? [] : [...UnionToTuple<Exclude<T, L>>, L];

type LastOf<T> =
    UnionToIntersection<T extends any ? () => T : never> extends () => infer R
        ? R
        : never;

type Keys<T> = IsEmpty<T> extends true ? [] : [keyof T];

type Values<T> = T[keyof T];

type Expand<T, P = Paths<T>> = { [K in P & string]: true };

// currently symbol keys are not supported
type Paths<M, P extends string = '', X extends string = `${P}${P extends '' ? '' : '.'}`> =
    M extends Record<PropertyKey, unknown> ? {
        [K in keyof M & (string | number)]: (
            M[K] extends Record<PropertyKey, unknown>
                ? `${P}${X}${K}` | (Is<Paths<M[K], P>, never> extends true ? `${P}${X}${Paths<M[K], P>}` : never)
                : `${P}${X}${K}`
        )
    }[keyof M & (string | number)] : never;
