/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { describe, it } from 'vitest'
import { assert as tsafeAssert, Equals } from 'tsafe';
import { ReflectContainer } from '../src/types';

describe('ReflectContainer', () => {

    it('should reflect any', () => {
        type Actual = ReflectContainer<any>;
        type Expected = unknown;
        tsafeAssert<Equals<Actual, Expected>>();
    });

    it('should reflect unknown', () => {
        type Actual = ReflectContainer<unknown>;
        type Expected = unknown;
        tsafeAssert<Equals<Actual, Expected>>();
    });

    it('should reflect never', () => {
        type Actual = ReflectContainer<never>;
        type Expected = never;
        tsafeAssert<Equals<Actual, Expected>>();
    });

    it('should reflect null', () => {
        type Actual = ReflectContainer<null>;
        type Expected = unknown;
        tsafeAssert<Equals<Actual, Expected>>();
    });

    it('should reflect undefined', () => {
        type Actual = ReflectContainer<undefined>;
        type Expected = unknown;
        tsafeAssert<Equals<Actual, Expected>>();
    });

    it('should reflect module with one factory and no context', () => {
        const module = {
            f: () => 1
        };
        type Actual = ReflectContainer<typeof module>;
        type Expected = {};
        tsafeAssert<Equals<Actual, Expected>>();
    });

    it('should reflect module with one factory and a context = container', () => {
        const module = {
            f: (ctx: { f: number }) => 1
        };
        type Actual = ReflectContainer<typeof module>;
        type Expected = {
            f: number
        };
        tsafeAssert<Equals<Actual, Expected>>();
    });

    it('should reflect module with one factory and a context ∩ container = ∅', () => {
        const module = {
            f: (ctx: { g: number }) => 1
        };
        type Actual = ReflectContainer<typeof module>;
        type Expected = {
            g: number
        };
        tsafeAssert<Equals<Actual, Expected>>();
    });

    it('should deep reflect module', () => {
        const module = {
            a: (ctx: { x: boolean }) => 1,
            b: {
                c: (ctx: {
                    y: {
                        yy: string
                    }
                }) => 1
            },
            c: {
                d: {
                    z: (ctx: {
                        z: number
                    }) => 1
                }
            }
        };
        type Actual = ReflectContainer<typeof module>;
        type Expected = {
            x: boolean
            y: {
                yy: string
            }
            z: number
        };
        tsafeAssert<Equals<Actual, Expected>>();
    });

    it('should reflect module with a property that is never satisfied', () => {
        type M = {
            b: (ctx: { b: never }) => number
        };
        type Actual = ReflectContainer<M>;
        type Expected = {
            b: never
        };
        tsafeAssert<Equals<Actual, Expected>>();
    });

});

describe('Validate', () => {

    it('should declare a property of type never as missing', () => {
        type Actual = Validate<[
            { f: (ctx: { b: boolean }) => 1 },
            { g: (ctx: { b: string }) => 1 }
        ]>;
        type Expected = {
            ginject_error: {
                message: "Missing dependency";
                docs: "https://ginject.io/#context";
                missing_dependencies: ['b'];
            }
        };
        tsafeAssert<Equals<Actual, Expected>>();
    });

    it('should resolve values to never if modules are incompatible', () => {
        const { a } = inject({ a: () => 1 }, { a: () => ''});
        tsafeAssert<Equals<typeof a, unknown>>();
        expect(a).toBe('');
    });

    it('should now accept an invalid module', () => {
        // @ts-expect-error: Argument of type '{ a: number; }' is not assignable to parameter of type 'never'.
        // cause: inject expects arguments [Module, ...Module]
        inject({ a: 1 })
    });

    // TODO(@@dd): validation should recognize that 1 & 'a' resolve to never
    it('should merge to incompatible values', () => {
        // no validation error but results in { a: never }
        // cause: { a: 1 & 'a' } resolves to { a: never }
        const ctr = inject({ a: () => 1 }, { a: () => 'a' });
        tsafeAssert<Equals<typeof ctr, { a: unknown }>>();
    });

    it('should return validation error, if the container is missing a value required by a context', () => {
        inject(
            // @ts-expect-error The resulting container is missing { b: boolean }
            { f: (ctx: { b: boolean }) => 1 }
        );
    });

    it('should provide a missing dependency by adding another module', () => {
        // compiles, because the new f does not need { b: boolean } anymore
        const ctr = inject(
            { f: (ctx: { b: boolean }) => 1 },
            { f: () => 1 },
        );
        tsafeAssert<Equals<typeof ctr, { f: number }>>();
    });

    // TODO(@@dd): resolve to never instead of unknown? maybe not and improve validation instead!
    it('should resolve to unknown if two modules are incompatible', () => {
        // compiles, because the new f does not need { b: boolean } anymore
        const ctr = inject(
            { f: (ctx: { b: boolean }) => 1 },
            { f: () => '' },
        );
        tsafeAssert<Equals<typeof ctr, { f: unknown }>>();
    });

    it('should not compile, if two factories require different types for the same dependency', () => {
        const ctr = inject(
            // @ts-expect-error ctx: { b: boolean & string } is invalid
            { f: (ctx: { b: boolean }) => 1 },
            { g: (ctx: { b: string }) => 1 },
            { b: () => '' }
        );
        tsafeAssert<Equals<typeof ctr, never>>();
    });

});
