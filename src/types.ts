/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { Filter, FilterNot, Flatten, Fn1, Is, IsEmpty, MergeArray, MergeObjects, Obj, Paths, UnionToIntersection, UnionToTuple, ValidationError, ValidationResult, Values } from 'typescript-typelevel';

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
            ], 'ginject_error'>
            : never;

// checks if merged module types are valid
type ValidateTypes<A, T, P = Filter<Paths<T>, never>> =
    IsEmpty<P> extends true ? A : ValidationError<'Type conflict', UnionToTuple<keyof P>, 'https://docs.ginject.io/#modules'>;

// checks if same properties in different contexts have compatible types
type ValidateContextTypes<A, C, P = Filter<Paths<C>, never>> =
    IsEmpty<P> extends true ? A : ValidationError<'Dependency conflict', UnionToTuple<keyof P>, 'https://docs.ginject.io/#context'>;

// checks if the container provides all properties the context requires
type ValidateContextProperties<A, C, T, P = Flatten<Omit<FilterNot<Paths<C>, never>, keyof Paths<T>>>> =
    IsEmpty<P> extends true ? A : ValidationError<'Dependency missing', UnionToTuple<keyof P>, 'https://docs.ginject.io/#context'>;

// TODO(@@dd): remove the recursion by first getting all paths in M and then Mapping all Fn1 to their Ctx. Then switch from MergeObject to Merge.
export type ReflectContainer<M,
    _Functions = Filter<M, Fn1>,                                 // { f1: (ctx: C1) = any, f2: ... }
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
        T extends [Fn1<infer Ctx>, ...infer Tail]
            ? Is<Ctx, unknown> extends true ? MapFunctionsToContexts<Tail> : [Ctx, ...MapFunctionsToContexts<Tail>]
            : never; // we expect only functions in array T
