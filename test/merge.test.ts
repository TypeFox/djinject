/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { describe, expect, it } from 'vitest'
import { assert as tsafeAssert, Equals } from 'tsafe';
import { merge } from '../src/merge';
import { Merge, MergeArray, MergeObjects } from '../src/types';

type Fn = (...args: any[]) => any;

describe('type Merge', () => {

    describe('universal types', () => {

        it('should honor identity', () => {

            type Id<T> = Equals<Merge<T, T>, T>;

            // universal types
            tsafeAssert<Id<any>>();
            tsafeAssert<Id<unknown>>();
            tsafeAssert<Id<never>>();

            // (non-)values
            tsafeAssert<Id<null>>();
            tsafeAssert<Id<undefined>>();
            tsafeAssert<Id<void>>();
            tsafeAssert<Id<1>>();
            tsafeAssert<Id<''>>();

            // arrays
            tsafeAssert<Id<[]>>();
            tsafeAssert<Id<[1]>>();
            tsafeAssert<Id<[1, '']>>();

            // functions
            tsafeAssert<Id<() => void>>();
            tsafeAssert<Id<(a: number) => void>>();
            tsafeAssert<Id<(a: { b: boolean }) => void>>();

            tsafeAssert<Id<() => number>>();
            tsafeAssert<Id<(a: number) => number>>();
            tsafeAssert<Id<(a: { b: boolean }) => number>>();

            tsafeAssert<Id<() => { a: number }>>();
            tsafeAssert<Id<(a: number) => { a: number }>>();
            tsafeAssert<Id<(a: { b: boolean }) => { a: number }>>();

            // objects
            tsafeAssert<Id<{}>>();
            tsafeAssert<Id<{ a: number }>>();
            tsafeAssert<Id<{ a: { b: () => number } }>>();
        })

        it('should merge any', () => {
            tsafeAssert<Equals<Merge<any, any>, any>>();
            tsafeAssert<Equals<Merge<any, { a: 1 }>, never>>();
            tsafeAssert<Equals<Merge<{ a: 1 }, any>, { a: 1 }>>();
            tsafeAssert<Equals<Merge<any, 1>, never>>();
            tsafeAssert<Equals<Merge<1, any>, 1>>();
        });

        it('should merge never', () => {
            tsafeAssert<Equals<Merge<never, never>, never>>();
            tsafeAssert<Equals<Merge<never, { a: 1 }>, never>>();
            tsafeAssert<Equals<Merge<{ a: 1 }, never>, never>>();
            tsafeAssert<Equals<Merge<never, 1>, never>>();
            tsafeAssert<Equals<Merge<1, never>, never>>();
        });

        it('should merge unknown', () => {
            tsafeAssert<Equals<Merge<unknown, unknown>, unknown>>();
            tsafeAssert<Equals<Merge<unknown, { a: 1 }>, unknown>>();
            tsafeAssert<Equals<Merge<{ a: 1 }, unknown>, unknown>>();
            tsafeAssert<Equals<Merge<unknown, 1>, unknown>>();
            tsafeAssert<Equals<Merge<1, unknown>, unknown>>();
        });

    });

    describe('empty types', () => {

        it('should merge null', () => {
            tsafeAssert<Equals<Merge<null, null>, null>>();
            tsafeAssert<Equals<Merge<null, { a: 1 }>, never>>();
            tsafeAssert<Equals<Merge<{ a: 1 }, null>, never>>();
            tsafeAssert<Equals<Merge<null, 1>, never>>();
            tsafeAssert<Equals<Merge<1, null>, never>>();
        });

        it('should merge undefined', () => {
            tsafeAssert<Equals<Merge<undefined, undefined>, undefined>>();
            tsafeAssert<Equals<Merge<undefined, { a: 1 }>, never>>();
            tsafeAssert<Equals<Merge<{ a: 1 }, undefined>, never>>();
            tsafeAssert<Equals<Merge<undefined, 1>, never>>();
            tsafeAssert<Equals<Merge<1, undefined>, never>>();
        });

        it('should merge void', () => {
            tsafeAssert<Equals<Merge<void, void>, void>>();
            tsafeAssert<Equals<Merge<void, { a: 1 }>, never>>();
            tsafeAssert<Equals<Merge<{ a: 1 }, void>, { a: 1 }>>();
            tsafeAssert<Equals<Merge<void, 1>, never>>();
            tsafeAssert<Equals<Merge<1, void>, 1>>();
        });

    });

    describe('primitive types', () => {

        it('should merge boolean', () => {
            tsafeAssert<Equals<Merge<boolean, boolean>, boolean>>();
            tsafeAssert<Equals<Merge<boolean, { a: 1 }>, never>>();
            tsafeAssert<Equals<Merge<{ a: 1 }, boolean>, never>>();
            tsafeAssert<Equals<Merge<boolean, true>, true>>(); // not never
            tsafeAssert<Equals<Merge<true, boolean>, true>>();
            tsafeAssert<Equals<Merge<boolean, 1>, never>>();
            tsafeAssert<Equals<Merge<1, boolean>, never>>();
        });

        it('should merge number', () => {
            tsafeAssert<Equals<Merge<number, number>, number>>();
            tsafeAssert<Equals<Merge<number, { a: 1 }>, never>>();
            tsafeAssert<Equals<Merge<{ a: 1 }, number>, never>>();
            tsafeAssert<Equals<Merge<number, 1>, never>>();
            tsafeAssert<Equals<Merge<1, number>, 1>>();
            tsafeAssert<Equals<Merge<number, ''>, never>>();
            tsafeAssert<Equals<Merge<'', number>, never>>();
        });

        it('should merge string', () => {
            tsafeAssert<Equals<Merge<string, string>, string>>();
            tsafeAssert<Equals<Merge<string, { a: 1 }>, never>>();
            tsafeAssert<Equals<Merge<{ a: 1 }, string>, never>>();
            tsafeAssert<Equals<Merge<string, ''>, never>>();
            tsafeAssert<Equals<Merge<'', string>, ''>>();
            tsafeAssert<Equals<Merge<string, 1>, never>>();
            tsafeAssert<Equals<Merge<1, string>, never>>();
        });

    });

    describe('array types', () => {

        it('should merge elements of type never', () => {
            tsafeAssert<Equals<Merge<[1, never], [1, '']>, [1, never]>>();
            tsafeAssert<Equals<Merge<[never, 1], ['', 1]>, [never, 1]>>();
            tsafeAssert<Equals<Merge<[1, ''], [1, never]>, [1, never]>>();
            tsafeAssert<Equals<Merge<['', 1], [never, 1]>, [never, 1]>>();
        });

        it('should merge elements of type unknown', () => {
            tsafeAssert<Equals<Merge<[1, unknown], [1, '']>, [1, unknown]>>();
            tsafeAssert<Equals<Merge<[unknown, 1], ['', 1]>, [unknown, 1]>>();
            tsafeAssert<Equals<Merge<[1, ''], [1, unknown]>, [1, unknown]>>();
            tsafeAssert<Equals<Merge<['', 1], [unknown, 1]>, [unknown, 1]>>();
        });

        it('should merge elements of type any', () => {
            tsafeAssert<Equals<Merge<[1, any], [1, '']>, [1, never]>>();
            tsafeAssert<Equals<Merge<[any, 1], ['', 1]>, [never, 1]>>();
            tsafeAssert<Equals<Merge<[1, ''], [1, any]>, [1, '']>>();
            tsafeAssert<Equals<Merge<['', 1], [any, 1]>, ['', 1]>>();
        });

        it('should merge array elements if source extends target element type', () => {
            tsafeAssert<Equals<Merge<any[], any[]>, any[]>>();
            tsafeAssert<Equals<Merge<[], []>, []>>();
            tsafeAssert<Equals<Merge<[1], [1]>, [1]>>();
            tsafeAssert<Equals<Merge<[1], [number]>, [1]>>();
            tsafeAssert<Equals<Merge<[1, ''], [number, string]>, [1, '']>>();
        });

        it('should not merge array elements if source does not extend target', () => {
            tsafeAssert<Equals<Merge<[1], [2]>, [never]>>();
            tsafeAssert<Equals<Merge<[2], [1]>, [never]>>();
            tsafeAssert<Equals<Merge<[number], [1]>, [never]>>();
            tsafeAssert<Equals<Merge<[number, string], [1, '']>, [never, never]>>();
        });

    });

    describe('function types', () => {

        it('should merge same function', () => {
            tsafeAssert<Equals<Merge<Fn, Fn>, Fn>>();
            tsafeAssert<Equals<Merge<() => void, () => void>, () => void>>();
            tsafeAssert<Equals<Merge<(a: number) => void, (a: number) => void>, (a: number) => void>>();
            tsafeAssert<Equals<Merge<(a: 1) => void, (a: 1) => void>, (a: 1) => void>>();
        });

        it('should never merge different function', () => {
            tsafeAssert<Equals<Merge<(a: number) => void, (a: string) => void>, (a: never) => void>>();
            tsafeAssert<Equals<Merge<(a: string) => void, (a: number) => void>, (a: never) => void>>();
            tsafeAssert<Equals<Merge<() => string, () => number>, () => never>>();
            tsafeAssert<Equals<Merge<() => number, () => string>, () => never>>();
        });

        it('should merge if source Fn ignores target Fn args', () => {
            tsafeAssert<Equals<Merge<() => void, (a: string) => void>, () => void>>();
        });

        it('should never merge if source Fn requires more args than target Fn', () => {
            tsafeAssert<Equals<Merge<(a: string) => void, () => void>, (a: never) => void>>();
        });

        it('should merge if source Fn returns 1 and target Fn returns void', () => {
            tsafeAssert<Equals<Merge<() => 1, () => void>, () => 1>>();
            tsafeAssert<Equals<Merge<() => any, () => void>, () => any>>();
            tsafeAssert<Equals<Merge<() => never, () => void>, () => never>>();
            tsafeAssert<Equals<Merge<() => unknown, () => void>, () => unknown>>();
        });

        it('should merge if source Fn returns void and target Fn returns any/unknown', () => {
            tsafeAssert<Equals<Merge<() => void, () => any>, () => void>>();
            tsafeAssert<Equals<Merge<() => void, () => unknown>, () => unknown>>();
        });

        it('should never merge if source Fn returns void and target Fn returns 1', () => {
            type Actual = Merge<() => void, () => 1>;
            type Expected = () => never;
            tsafeAssert<Equals<Actual, Expected>>();
        });

        it('should never merge if source Fn returns void and target Fn returns never', () => {
            type Actual = Merge<() => void, () => never>;
            type Expected = () => never;
            tsafeAssert<Equals<Actual, Expected>>();
        });

        it('should merge any function Fn with () => void', () => {
            tsafeAssert<Equals<Merge<() => void, Fn>, () => void>>();
            tsafeAssert<Equals<Merge<Fn, () => void>, () => any>>();
        });

        it('should merge functions with inconsistent arguments', () => {
            type Actual = Merge<{
                b: (ctx: { b: boolean }) => number
            }, {
                b: (ctx: { b: string }) => number,
            }>;
            type Expected = {
                b: (ctx: { b: never }) => number
            }
            tsafeAssert<Equals<Actual, Expected>>()
        });

        // TODO(@@dd): classes are functions

    });

    describe('object types', () => {

        describe('undefined properties', () => {

            it('should merge empty objects', () => {
                type Actual = Merge<{}, {}>;
                type Expected = {};
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: 1 with target: non-existing property', () => {
                type Actual = Merge<{ a: 1 }, {}>;
                type Expected = { a: 1 };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: optional prtoperty with target: non-existing property', () => {
                type Actual = Merge<{ a?: 1 }, {}>;
                type Expected = { a: 1 | undefined };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: 1 with target: optional number', () => {
                type Actual = Merge<{ a: 1 }, { a?: number }>;
                type Expected = { a: 1 };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: optional 1 with target: optional number', () => {
                type Actual = Merge<{ a?: 1 }, { a?: number }>;
                type Expected = { a: 1 | undefined };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: number with target: undefined', () => {
                type Actual = Merge<{ a: number }, { a: undefined }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: undefined with target: number', () => {
                type Actual = Merge<{ a: undefined }, { a: number }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: 1 with target: undefined', () => {
                type Actual = Merge<{ a: 1 }, { a: undefined }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: undefined with target: 1', () => {
                type Actual = Merge<{ a: undefined }, { a: 1 }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

        });

        describe('null properties', () => {

            it('should merge source: null with target: non-existing property', () => {
                type Actual = Merge<{ a: null }, {}>;
                type Expected = { a: null };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: 1 with target: null', () => {
                type Actual = Merge<{ a: 1 }, { a: null }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: null with target: 1', () => {
                type Actual = Merge<{ a: null }, { a: 1 }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: 1 with target: nullable number', () => {
                type Actual = Merge<{ a: 1 }, { a: number | null }>;
                type Expected = { a: 1 };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: nullable 1 with target: nullable number', () => {
                type Actual = Merge<{ a: 1 | null }, { a: number | null }>;
                type Expected = { a: 1 | null };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: nullable number with target: nullable 1', () => {
                type Actual = Merge<{ a: number | null }, { a: 1 | null }>;
                type Expected = { a: null }; // intersection of Source and Target because number does not extend 1
                tsafeAssert<Equals<Actual, Expected>>();
            });

        });

        describe('boolean properties', () => {

            it('should merge non-empty source with empty target', () => {
                type Actual = Merge<{ a: true }, {}>;
                type Expected = { a: true };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge empty source with non-empty target', () => {
                type Actual = Merge<{}, { a: true }>;
                type Expected = { a: true };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge non-empty types having different properties', () => {
                type Actual = Merge<{ a: true }, { b: false }>;
                type Expected = { a: true, b: false };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: true with target: boolean, in the presence of distinct properties', () => {
                type Actual = Merge<{ a: true, b: number }, { a: boolean, c: string }>;
                type Expected = { a: true, b: number, c: string };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: boolean with target: true, in the presence of distinct properties', () => {
                type Actual = Merge<{ a: boolean, b: number }, { a: true, c: string }>;
                type Expected = { a: true, b: number, c: string }; // a: true is the only source a: boolean that extends the target a: true
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: true with target: true', () => {
                type Actual = Merge<{ a: true }, { a: true }>;
                type Expected = { a: true };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: true with target: false', () => {
                type Actual = Merge<{ a: true }, { a: false }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: boolean with target: boolean', () => {
                type Actual = Merge<{ a: boolean }, { a: boolean }>;
                type Expected = { a: boolean };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: boolean with target: undefined', () => {
                type Actual = Merge<{ a: boolean }, { a: undefined }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: boolean with target: null', () => {
                type Actual = Merge<{ a: boolean }, { a: null }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: boolean with target: number', () => {
                type Actual = Merge<{ a: boolean }, { a: number }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: boolean with target: string', () => {
                type Actual = Merge<{ a: boolean }, { a: string }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: boolean with target: any[]', () => {
                type Actual = Merge<{ a: boolean }, { a: any[] }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: boolean with target: object', () => {
                type Actual = Merge<{ a: boolean }, { a: object }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: boolean with target: {}', () => {
                type Actual = Merge<{ a: boolean }, { a: {} }>;
                type Expected = { a: boolean };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: {} with target: boolean', () => {
                type Actual = Merge<{ a: {} }, { a: boolean }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

        });

        describe('number properties', () => {

            it('should merge non-empty source with empty target', () => {
                type Actual = Merge<{ a: 1 }, {}>;
                type Expected = { a: 1 };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge empty source with non-empty target', () => {
                type Actual = Merge<{}, { a: 1 }>;
                type Expected = { a: 1 };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge non-empty types having different properties', () => {
                type Actual = Merge<{ a: 1 }, { b: 2 }>;
                type Expected = { a: 1, b: 2 };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: 1 with target: number, in the presence of distinct properties', () => {
                type Actual = Merge<{ a: 1, b: boolean }, { a: number, c: string }>;
                type Expected = { a: 1, b: boolean, c: string };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: number with target: 1, in the presence of distinct properties', () => {
                type Actual = Merge<{ a: number, b: boolean }, { a: 1, c: string }>;
                type Expected = { a: never, b: boolean, c: string };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: 1 with target: 1', () => {
                type Actual = Merge<{ a: 1 }, { a: 1 }>;
                type Expected = { a: 1 };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: 1 with target: 2', () => {
                type Actual = Merge<{ a: 1 }, { a: 2 }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: number with target: number', () => {
                type Actual = Merge<{ a: number }, { a: number }>;
                type Expected = { a: number };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: number with target: undefined', () => {
                type Actual = Merge<{ a: number }, { a: undefined }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: number with target: null', () => {
                type Actual = Merge<{ a: number }, { a: null }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: number with target: boolean', () => {
                type Actual = Merge<{ a: number }, { a: boolean }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: number with target: string', () => {
                type Actual = Merge<{ a: number }, { a: string }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: number with target: any[]', () => {
                type Actual = Merge<{ a: number }, { a: any[] }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: number with target: object', () => {
                type Actual = Merge<{ a: number }, { a: object }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: number with target: {}', () => {
                type Actual = Merge<{ a: number }, { a: {} }>;
                type Expected = { a: number };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: {} with target: number', () => {
                type Actual = Merge<{ a: {} }, { a: number }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

        });

        describe('string properties', () => {

            it('should merge non-empty source with empty target', () => {
                type Actual = Merge<{ a: '' }, {}>;
                type Expected = { a: '' };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge empty source with non-empty target', () => {
                type Actual = Merge<{}, { a: '' }>;
                type Expected = { a: '' };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge non-empty types having different properties', () => {
                type Actual = Merge<{ a: 'a' }, { b: 'b' }>;
                type Expected = { a: 'a', b: 'b' };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: "a" with target: string, in the presence of distinct properties', () => {
                type Actual = Merge<{ a: "a", b: boolean }, { a: string, c: string }>;
                type Expected = { a: "a", b: boolean, c: string };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: string with target: "a", in the presence of distinct properties', () => {
                type Actual = Merge<{ a: string, b: boolean }, { a: 'a', c: string }>;
                type Expected = { a: never, b: boolean, c: string };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: "a" with target: "a"', () => {
                type Actual = Merge<{ a: 'a' }, { a: 'a' }>;
                type Expected = { a: 'a' };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: "a" with target: "b"', () => {
                type Actual = Merge<{ a: 'a' }, { a: 'b' }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: string with target: string', () => {
                type Actual = Merge<{ a: string }, { a: string }>;
                type Expected = { a: string };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: string with target: undefined', () => {
                type Actual = Merge<{ a: string }, { a: undefined }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: string with target: null', () => {
                type Actual = Merge<{ a: string }, { a: null }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: string with target: boolean', () => {
                type Actual = Merge<{ a: string }, { a: boolean }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: string with target: number', () => {
                type Actual = Merge<{ a: string }, { a: number }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: string with target: any[]', () => {
                type Actual = Merge<{ a: string }, { a: any[] }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: string with target: object', () => {
                type Actual = Merge<{ a: string }, { a: object }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: string with target: {}', () => {
                type Actual = Merge<{ a: string }, { a: {} }>;
                type Expected = { a: string };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: {} with target: string', () => {
                type Actual = Merge<{ a: {} }, { a: string }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

        });

        describe('array properties', () => {

            it('should merge non-empty source with empty target', () => {
                type Actual = Merge<{ a: [] }, {}>;
                type Expected = { a: [] };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge empty source with non-empty target', () => {
                type Actual = Merge<{}, { a: [] }>;
                type Expected = { a: [] };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge non-empty types having different properties', () => {
                type Actual = Merge<{ a: ['a'] }, { b: ['b'] }>;
                type Expected = { a: ['a'], b: ['b'] };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: ["a"] with target: [string], in the presence of distinct properties', () => {
                type Actual = Merge<{ a: ["a"], b: boolean }, { a: [string], c: string }>;
                type Expected = { a: ["a"], b: boolean, c: string };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: [string] with target: ["a"], in the presence of distinct properties', () => {
                type Actual = Merge<{ a: [string], b: boolean }, { a: ['a'], c: string }>;
                type Expected = { a: [never], b: boolean, c: string };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: ["a"] with target: ["a"]', () => {
                type Actual = Merge<{ a: ['a'] }, { a: ['a'] }>;
                type Expected = { a: ['a'] };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: ["a"] with target: ["b"]', () => {
                type Actual = Merge<{ a: ['a'] }, { a: ['b'] }>;
                type Expected = { a: [never] };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: [string] with target: [string]', () => {
                type Actual = Merge<{ a: [string] }, { a: [string] }>;
                type Expected = { a: [string] };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: [string] with target: [undefined]', () => {
                type Actual = Merge<{ a: [string] }, { a: [undefined] }>;
                type Expected = { a: [never] };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: [string] with target: [null]', () => {
                type Actual = Merge<{ a: [string] }, { a: [null] }>;
                type Expected = { a: [never] };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: [string] with target: [boolean]', () => {
                type Actual = Merge<{ a: [string] }, { a: [boolean] }>;
                type Expected = { a: [never] };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: [string] with target: [number]', () => {
                type Actual = Merge<{ a: [string] }, { a: [number] }>;
                type Expected = { a: [never] };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: [string] with target: any[]', () => {
                type Actual = Merge<{ a: [string] }, { a: any[] }>;
                type Expected = { a: [never] }; // any[] isn't [any] and could be [], so this is ok!
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: any[] with target: [string]', () => {
                type Actual = Merge<{ a: any[] }, { a: [string] }>;
                type Expected = { a: [] };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: [string] with target: object', () => {
                type Actual = Merge<{ a: [string] }, { a: object }>;
                type Expected = { a: [string] };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: [string] with target: {}', () => {
                type Actual = Merge<{ a: [string] }, { a: {} }>;
                type Expected = { a: [string] };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge source: {} with target: [string]', () => {
                type Actual = Merge<{ a: {} }, { a: [string] }>;
                type Expected = { a: never };
                tsafeAssert<Equals<Actual, Expected>>();
            });

        });

        describe('function properties', () => {

            it('should merge source: Fn with target: () => void', () => {
                type Actual = Merge<{ a: Fn }, { a: () => void }>;
                type Expected = { a: () => any };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should merge source: () => void with target: Fn', () => {
                type Actual = Merge<{ a: () => void }, { a: Fn }>;
                type Expected = { a: () => void };
                tsafeAssert<Equals<Actual, Expected>>();
            });

        });

        describe('object properties', () => {

            it('should merge deep properties that are assignable', () => {
                type Actual = Merge<{ a: { b: 1 } }, { a: { b: number } }>;
                type Expected = { a: { b: 1 } };
                tsafeAssert<Equals<Actual, Expected>>();
            });

            it('should never merge deep properties that aren\'t assignable', () => {
                type Actual = Merge<{ a: { b: number } }, { a: { b: 1 } }>;
                type Expected = { a: { b: never } };
                tsafeAssert<Equals<Actual, Expected>>();
            });

        });

    });

});

describe('type MergeArray', () => {

    it('should merge empty array', () => {
        tsafeAssert<Equals<MergeArray<[]>, never>>();
    });

    it('should merge array with one element', () => {
        tsafeAssert<Equals<MergeArray<[{ a: () => 1 }]>, { a: () => 1 }>>();
    });

    it('should merge array with two elements', () => {
        tsafeAssert<Equals<MergeArray<[{ a: () => 1 }, { b: () => true }]>, { a: () => 1, b: () => true }>>();
    });

    it('should merge array with three elements', () => {
        class A {}
        class B extends A {
            b = 1
        }
        type Input = [
            { a: () => A, b: () => boolean, c: () => number, d: () => 'a' },
            { b: () => true, d: () => string },
            { a: () => B, c: () => 1 }
        ];
        type Actual = MergeArray<Input>;
        type Expected = {
            a: () => B,
            b: () => true,
            c: () => 1,
            d: () => never
        };
        tsafeAssert<Equals<Actual, Expected>>();
    });

    it('should deep merge array with three elements', () => {
        class A {}
        class B extends A {
            b = 1
        }
        type Input = [
            { a: { b: { c: () => A }, d: Fn }, e: () => number },
            { a: { d: () => void } },
            { a: { b: { c: () => B } } },
            { e: () => 1 }
        ];
        type Expected = {
            a: {
                b: {
                    c: () => B
                },
                d: () => void
            },
            e: () => 1
        };
        tsafeAssert<Equals<MergeArray<Input>, Expected>>();
    });

    it('should not merge non-modules', () => {
        type Input = [
            { a: number }, // intentionally no factory functions!
            { b: string }
        ];
        // @ts-expect-error
        type T = MergeModules<Input>;
    });

});

describe('type MergeObjects', () => {

    it('should merge with unknown', () => {
        tsafeAssert<Equals<MergeObjects<{}, unknown>, {}>>();
        tsafeAssert<Equals<MergeObjects<{ a: 1 }, unknown>, { a: 1 }>>();
        tsafeAssert<Equals<MergeObjects<unknown, {}>, {}>>();
        tsafeAssert<Equals<MergeObjects<unknown, { a: 1 }>, { a: 1 }>>();
    });

});

describe('merge', () => {

    it('should merge two objects', () => {
        class A {}
        class B extends A {
            b = 1
        }
        const fn1 = () => {}
        const fn2 = () => {}
        const target = {
            a: A,
            b: {
                c: false,
                e: fn1,
                f: [1]
            }
        }
        const source = {
            a: B,
            b: {
                c: true,
                e: fn2,
                f: [2, 3]
            }
        }
        const expected = {
            a: B,
            b: {
                c: true,
                e: fn2,
                f: [2, 3]
            }
        }
        expect(merge(target, source)).toEqual(expected);
    });

    it('should merge source: 1 with target: undefined in a typesafe way', () => {
        const actual = merge({ a: 1 }, { a: undefined });
        const expected = { a: undefined };
        type Expected = { a: never };
        tsafeAssert<Equals<typeof actual, Expected>>();
        expect(actual).toEqual(expected);
    });

    it('should merge source: undefined with target: 1 in a typesafe way', () => {
        const actual = merge({ a: undefined }, { a: 1 });
        const expected = { a: 1 };
        type Expected = { a: never };
        tsafeAssert<Equals<typeof actual, Expected>>();
        expect(actual).toEqual(expected);
    });

});
