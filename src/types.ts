/******************************************************************************
 * Copyright 2023 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

/**
 * Type of an indexed structure, excluding interfaces, classes, arrays and functions.
 * Symbol keys are intentionally not supported.
 */
export type Obj = Record<string | number, unknown>;

/**
 * A Module is an Obj type consisting of nested groups and dependency factories.
 * A dependency factory is a function that creates a dependency given a context.
 * The module does not need to fully cover the context.
 */
export type Module<Context extends Obj = any, Dependencies extends Obj = {}> =
    IsUniversal<Dependencies> extends true ? Dependencies : Prettify<Merge<
        RequiredModule<Merge<Dependencies, Context>, Dependencies>,
        PartialModule<Merge<Dependencies, Context>, Context>
    >>;

// partial dependencies, the context contains dependencies that may be not yet defined
type PartialModule<Context, Dependencies> = {
    [K in keyof Dependencies]?: (
        Dependencies[K] extends Obj | undefined ? PartialModule<Context, NoUndefined<Dependencies[K]>> : never
    ) | Factory<Context, NoUndefined<Dependencies[K]>>
};

// required dependencies (with possibly optional '?:' properties)
type RequiredModule<Context, Dependencies> = {
    [K in keyof Dependencies]: (
        Dependencies[K] extends Obj | undefined ? RequiredModule<Context, NoUndefined<Dependencies[K]>> : never
    ) | Factory<Context, NoUndefined<Dependencies[K]>>
};

/**
 * A function that creates a Dependency given a Context.
 */
export type Factory<Context, Dependency> = (ctx: Context) => Dependency;

/**
 * The type of an inversion of control container has the same structure as the merged
 * Modules, but with the dependency factories replaced by the dependencies.
 */
export type Container<Modules extends Module[]> = Prettify<_Container<Modules>>;

// helper type to hide additional type parameters from the public API
type _Container<
    Modules extends Module[],
    Dependencies extends Obj = ReflectDependencies<Modules>,
    CheckResult = Check<Modules>
> = CheckResult extends DjinjectError
        ? CheckResult
        : Dependencies; // @@dd: invariant: Dependencies extends Context

/**
 * Checks the Modules for conflicts and missing dependencies.
 */
export type Check<Modules extends Module[]> = _Check<Modules>;

// helper type to hide additional type parameters from the public API
type _Check<
    Modules extends Module[],
    Context extends Obj = ReflectContext<Modules>,
    Dependencies extends Obj = ReflectDependencies<Modules>,
    ContextConflicts extends any[] = CheckContextConflicts<Context, Dependencies>,
    DependencyConflicts extends any[] = CheckDependencyConflicts<Dependencies>,
    MissingDependencies extends any[] = CheckMissingDependencies<Context, Dependencies>,
    Errors = [
        ...ContextConflicts,
        ...DependencyConflicts,
        ...MissingDependencies
    ]
> = Errors extends []
    ? Modules
    : DjinjectError<{
        context_conflicts: ContextConflicts,
        dependency_conflicts: DependencyConflicts,
        missing_dependencies: MissingDependencies
    }>;

// internal symbol, we just need the name as property key
declare const djinject_error: unique symbol;

// use T extends DjinjectError<infer Errors> to infer Errors
export type DjinjectError<Errors extends Record<string, string | string[]> = any> = Prettify<{
    [djinject_error]: FilterNot<Errors, []>;
}>;

// reflect the context type of all modules
type ReflectContext<Modules, Module = ReplaceFactories<Modules>> =
    MergeArray<UnionToTuple<InferContext<Module[keyof Module]>>>;

// reduces all modules by replacing the factories
type ReplaceFactories<Modules> = Modules extends [infer HEAD, ...infer TAIL]
    ? Replace<ReplaceFactories<TAIL>, Paths<HEAD>>
    : {};

// infers the context type of a Factory
type InferContext<F> = F extends Factory<infer Context, any>
    ? Context & {} // @@dd: intersection with {} if Context is unknown
    : never;

// reflects the dependencies of all modules
type ReflectDependencies<Modules> = Modules extends [infer HEAD, ...infer TAIL]
    ? Merge<ReflectDependencies<TAIL>, InferDependencies<HEAD>>
    : {};

// infers all dependency of a module
type InferDependencies<Module> = Module extends Factory<any, infer Dependency> ? Dependency :
    IsUniversal<Module> extends true ? Module : {
        [K in keyof Module]: InferDependencies<Module[K]>
    };

// checks if same properties in different contexts have compatible types
type CheckContextConflicts<Context, Dependencies, Props = Filter<Paths<Context> & FilterNot<Paths<Dependencies>, never>, never>> =
    IsEmpty<Props> extends true ? [] : UnionToTuple<keyof Props>;

// checks if the provided dependency types of all modules fit together
type CheckDependencyConflicts<Dependencies, Props = Filter<Paths<Dependencies>, never>> =
    IsEmpty<Props> extends true ? [] : UnionToTuple<keyof Props>;

// checks if the container provides all properties the context requires
type CheckMissingDependencies<Context, Dependencies, Props = Omit<Paths<Context>, keyof Paths<Dependencies>>> =
    true extends (IsUniversal<Context> | IsEmpty<Props>) ? [] : UnionToTuple<keyof Props>;

// flattens a nested object { a: { b: 1, c: true } } to { 'a.b': 1, 'a.c' : true }
type Paths<T> =
    true extends (IsUniversal<T> | IsNotObj<T> | IsEmpty<T>) ? T :
        Prettify<UnionToIntersection<TupledPaths<DeepRequired<T>> extends infer P // @@dd: currently all paths are required
            ? P extends [string, unknown]
                ? { [K in P[0]]: P[1] }
                : never
            : never
        >>;

// path helper, distributes the union keyof T over [path, value] pairs
type TupledPaths<T, K = keyof T> =
    K extends Exclude<keyof T, symbol>
        ? true extends (IsEmpty<T[K]> | IsUniversal<T[K]> | IsNotObj<T[K]>)
            ? [`${K}`, T[K]]
            : TupledPaths<T[K]> extends infer F
                ? F extends [string, any]
                    ? [`${K}.${F[0]}`, F[1]]
                    : never
                : never
        : never;

// makes all properties required recursively
type DeepRequired<T> = T extends Obj ? {
    [K in keyof T]-?: DeepRequired<T[K]>;
} : T;

// merges all objects in an array into one object
type MergeArray<A> = A extends [infer HEAD, ...infer TAIL]
    ? Merge<MergeArray<TAIL>, HEAD>
    : {};

// deeply merges source S into target T
type Merge<Source, Target> =
    IsUniversal<Source> extends true ? Source :
        IsUniversal<Target> extends true ? Target :
            Prettify<Omit<Target, keyof Source> & {
                [K in keyof Source]: K extends keyof Target
                    ? Source[K] extends Obj
                        ? Target[K] extends Obj
                            ? Merge<Source[K], Target[K]>
                            : never
                        : Target[K] extends Obj
                            ? never
                            : (Source[K] extends Target[K] ? Source[K] : never)
                    : Source[K]
            }>;

// like Merge, but replaces all properties in target T with properties from source S
type Replace<Source, Target> =
    IsUniversal<Source> extends true ? Source :
        IsUniversal<Target> extends true ? Target :
            Omit<Target, keyof Source> & {
                [K in keyof Source]: K extends keyof Target
                    ? Source[K] extends Obj
                        ? Target[K] extends Obj
                            ? Replace<Source[K], Target[K]>
                            : never
                        : Target[K] extends Obj
                            ? never
                            : Source[K]
                    : Source[K]
            };

// select all properties whose value extend V
type Filter<T, V> = Pick<T, { [K in keyof T]-?: [T[K]] extends [V] ? K : never }[keyof T]>;

// remove all properties whose value extend V
type FilterNot<T, V> = IsUniversal<T> extends true ? T : Omit<T, keyof Filter<T, V>>;

// checks if T is {}, used to prevent UnionToIntersection<keyof {} = never> = unknown
type IsEmpty<T> =
    T extends Obj
        ? [keyof T] extends [never] ? true : false
        : false;

// checks if T not extends Obj
type IsNotObj<T> = T extends Obj ? false : true;

// checks if T is any or never (intentionlly not checking for unknown)
type IsUniversal<T> = 0 extends 1 & T ? true : [T] extends [never] ? true : false;

// filters the undefined type
type NoUndefined<T> = T extends undefined ? never : T;

// deeply combines intersections A & B for better readability.
// it is important to use Obj, otherwise, we would descend into classes!
type Prettify<T> = T extends Obj ? { [K in keyof T]: Prettify<T[K]> } : T;

// maps a union A | B to an intersection A & B
type UnionToIntersection<U> =
    (U extends any ? (arg: U) => void : never) extends ((arg: infer I) => void)
        ? I
        : never;

// maps a union A | B to a tuple [A, B] or [B, A], without predictable order
type UnionToTuple<T> =
    [T] extends [never]
        ? []
        : [...UnionToTuple<Exclude<T, LastOf<T> >>, LastOf<T>];

// returns the last type of a union
type LastOf<T> =
    UnionToIntersection<T extends any ? () => T : never> extends () => infer R
        ? R
        : never;
