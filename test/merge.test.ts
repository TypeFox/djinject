/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { assertType } from 'typelevel-assert';
import { Fn, Is } from 'typescript-typelevel';
import { describe, expect, it } from 'vitest'
import { merge } from '../src/merge';
import { Merge } from '../src/types';

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
        };
        const source = {
            a: B,
            b: {
                c: true,
                e: fn2,
                f: [2, 3]
            }
        };
        const expected = {
            a: B,
            b: {
                c: true,
                e: fn2,
                f: [2, 3]
            }
        };
        type Expected = typeof expected;
        type Actual = Merge<typeof source, typeof target>;
        assertType<Is<Actual, Expected>>();
    });

    it('should merge source: 1 with target: undefined in a typesafe way', () => {
        const actual = merge({ a: 1 }, { a: undefined });
        const expected = { a: undefined };
        type Expected = { a: never };
        assertType<Is<typeof actual, Expected>>();
        expect(actual).toEqual(expected);
    });

    it('should merge source: undefined with target: 1 in a typesafe way', () => {
        const actual = merge({ a: undefined }, { a: 1 });
        const expected = { a: 1 };
        type Expected = { a: never };
        assertType<Is<typeof actual, Expected>>();
        expect(actual).toEqual(expected);
    });

    it('should allow to merge an optional value with a required value', () => {
        type Source = { s: string };
        type Target = { s?: string };
        const source: Source = { s: '' };
        const target: Target = { };
        const actual = merge(target, source);
        const expected = { s: '' };
        assertType<Is<typeof actual, typeof expected>>();
        expect(actual).toEqual(expected);
    });

});

describe('type Merge', () => {

    describe('universal types', () => {

        it('should honor identity', () => {

            type Id<T> = Is<Merge<T, T>, T>;

            // universal types
            assertType<Id<any>>();
            assertType<Id<unknown>>();
            assertType<Id<never>>();

            // (non-)values
            assertType<Id<null>>();
            assertType<Id<undefined>>();
            assertType<Id<void>>();
            assertType<Id<1>>();
            assertType<Id<''>>();

            // arrays
            assertType<Id<[]>>();
            assertType<Id<[1]>>();
            assertType<Id<[1, '']>>();

            // functions
            assertType<Id<() => void>>();
            assertType<Id<(a: number) => void>>();
            assertType<Id<(a: { b: boolean }) => void>>();

            assertType<Id<() => number>>();
            assertType<Id<(a: number) => number>>();
            assertType<Id<(a: { b: boolean }) => number>>();

            assertType<Id<() => { a: number }>>();
            assertType<Id<(a: number) => { a: number }>>();
            assertType<Id<(a: { b: boolean }) => { a: number }>>();

            // objects
            assertType<Id<{}>>();
            assertType<Id<{ a: number }>>();
            assertType<Id<{ a: { b: () => number } }>>();
        })

        it('should merge any', () => {
            assertType<Is<Merge<any, any>, any>>();
            assertType<Is<Merge<any, { a: 1 }>, any>>();
            assertType<Is<Merge<{ a: 1 }, any>, { a: 1 }>>();
            assertType<Is<Merge<any, 1>, any>>();
            assertType<Is<Merge<1, any>, 1>>();
        });

        it('should merge never', () => {
            assertType<Is<Merge<never, never>, never>>();
            assertType<Is<Merge<never, { a: 1 }>, never>>();
            assertType<Is<Merge<{ a: 1 }, never>, never>>();
            assertType<Is<Merge<never, 1>, never>>();
            assertType<Is<Merge<1, never>, never>>();
        });

        it('should merge unknown', () => {
            assertType<Is<Merge<unknown, unknown>, unknown>>();
            assertType<Is<Merge<unknown, { a: 1 }>, unknown>>();
            assertType<Is<Merge<{ a: 1 }, unknown>, { a: 1 }>>();
            assertType<Is<Merge<unknown, 1>, unknown>>();
            assertType<Is<Merge<1, unknown>, 1>>();
        });

    });

    describe('empty types', () => {

        it('should merge null', () => {
            assertType<Is<Merge<null, null>, null>>();
            assertType<Is<Merge<null, { a: 1 }>, never>>();
            assertType<Is<Merge<{ a: 1 }, null>, never>>();
            assertType<Is<Merge<null, 1>, never>>();
            assertType<Is<Merge<1, null>, never>>();
        });

        it('should merge undefined', () => {
            assertType<Is<Merge<undefined, undefined>, undefined>>();
            assertType<Is<Merge<undefined, { a: 1 }>, never>>();
            assertType<Is<Merge<{ a: 1 }, undefined>, never>>();
            assertType<Is<Merge<undefined, 1>, never>>();
            assertType<Is<Merge<1, undefined>, never>>();
        });

        it('should merge void', () => {
            assertType<Is<Merge<void, void>, void>>();
            assertType<Is<Merge<void, { a: 1 }>, never>>();
            assertType<Is<Merge<{ a: 1 }, void>, { a: 1 }>>();
            assertType<Is<Merge<void, 1>, never>>();
            assertType<Is<Merge<1, void>, 1>>();
        });

    });

    describe('primitive types', () => {

        it('should merge boolean', () => {
            assertType<Is<Merge<boolean, boolean>, boolean>>();
            assertType<Is<Merge<boolean, { a: 1 }>, never>>();
            assertType<Is<Merge<{ a: 1 }, boolean>, never>>();
            assertType<Is<Merge<boolean, true>, true>>(); // not never
            assertType<Is<Merge<true, boolean>, true>>();
            assertType<Is<Merge<boolean, 1>, never>>();
            assertType<Is<Merge<1, boolean>, never>>();
        });

        it('should merge number', () => {
            assertType<Is<Merge<number, number>, number>>();
            assertType<Is<Merge<number, { a: 1 }>, never>>();
            assertType<Is<Merge<{ a: 1 }, number>, never>>();
            assertType<Is<Merge<number, 1>, never>>();
            assertType<Is<Merge<1, number>, 1>>();
            assertType<Is<Merge<number, ''>, never>>();
            assertType<Is<Merge<'', number>, never>>();
        });

        it('should merge string', () => {
            assertType<Is<Merge<string, string>, string>>();
            assertType<Is<Merge<string, { a: 1 }>, never>>();
            assertType<Is<Merge<{ a: 1 }, string>, never>>();
            assertType<Is<Merge<string, ''>, never>>();
            assertType<Is<Merge<'', string>, ''>>();
            assertType<Is<Merge<string, 1>, never>>();
            assertType<Is<Merge<1, string>, never>>();
        });

    });

    describe('array types', () => {

        it('should merge elements of type never', () => {
            assertType<Is<Merge<[1, never], [1, '']>, [1, never]>>();
            assertType<Is<Merge<[never, 1], ['', 1]>, [never, 1]>>();
            assertType<Is<Merge<[1, ''], [1, never]>, [1, never]>>();
            assertType<Is<Merge<['', 1], [never, 1]>, [never, 1]>>();
        });

        it('should merge elements of type unknown', () => {
            assertType<Is<Merge<[1, unknown], [1, '']>, [1, unknown]>>();
            assertType<Is<Merge<[unknown, 1], ['', 1]>, [unknown, 1]>>();
            assertType<Is<Merge<[1, ''], [1, unknown]>, [1, '']>>();
            assertType<Is<Merge<['', 1], [unknown, 1]>, ['', 1]>>();
        });

        it('should merge elements of type any', () => {
            assertType<Is<Merge<[1, any], [1, '']>, [1, any]>>();
            assertType<Is<Merge<[any, 1], ['', 1]>, [any, 1]>>();
            assertType<Is<Merge<[1, ''], [1, any]>, [1, '']>>();
            assertType<Is<Merge<['', 1], [any, 1]>, ['', 1]>>();
        });

        it('should merge array elements if source extends target element type', () => {
            assertType<Is<Merge<any[], any[]>, any[]>>();
            assertType<Is<Merge<[], []>, []>>();
            assertType<Is<Merge<[1], [1]>, [1]>>();
            assertType<Is<Merge<[1], [number]>, [1]>>();
            assertType<Is<Merge<[1, ''], [number, string]>, [1, '']>>();
        });

        it('should not merge array elements if source does not extend target', () => {
            assertType<Is<Merge<[1], [2]>, [never]>>();
            assertType<Is<Merge<[2], [1]>, [never]>>();
            assertType<Is<Merge<[number], [1]>, [never]>>();
            assertType<Is<Merge<[number, string], [1, '']>, [never, never]>>();
        });

    });

    describe('function types', () => {

        it('should merge same function', () => {
            assertType<Is<Merge<Fn, Fn>, Fn>>();
            assertType<Is<Merge<() => void, () => void>, () => void>>();
            assertType<Is<Merge<(a: number) => void, (a: number) => void>, (a: number) => void>>();
            assertType<Is<Merge<(a: 1) => void, (a: 1) => void>, (a: 1) => void>>();
        });

        it('should never merge different function', () => {
            assertType<Is<Merge<(a: number) => void, (a: string) => void>, (a: never) => void>>();
            assertType<Is<Merge<(a: string) => void, (a: number) => void>, (a: never) => void>>();
            assertType<Is<Merge<() => string, () => number>, () => never>>();
            assertType<Is<Merge<() => number, () => string>, () => never>>();
        });

        it('should merge if source Fn ignores target Fn args', () => {
            assertType<Is<Merge<() => void, (a: string) => void>, () => void>>();
        });

        it('should never merge if source Fn requires more args than target Fn', () => {
            assertType<Is<Merge<(a: string) => void, () => void>, (a: never) => void>>();
        });

        it('should merge if source Fn returns 1 and target Fn returns void', () => {
            assertType<Is<Merge<() => 1, () => void>, () => 1>>();
            assertType<Is<Merge<() => any, () => void>, () => any>>();
            assertType<Is<Merge<() => never, () => void>, () => never>>();
            assertType<Is<Merge<() => unknown, () => void>, () => unknown>>();
        });

        it('should merge if source Fn returns void and target Fn returns any/unknown', () => {
            assertType<Is<Merge<() => void, () => any>, () => void>>();
            assertType<Is<Merge<() => void, () => unknown>, () => void>>();
        });

        it('should never merge if source Fn returns void and target Fn returns 1', () => {
            type Actual = Merge<() => void, () => 1>;
            type Expected = () => never;
            assertType<Is<Actual, Expected>>();
        });

        it('should never merge if source Fn returns void and target Fn returns never', () => {
            type Actual = Merge<() => void, () => never>;
            type Expected = () => never;
            assertType<Is<Actual, Expected>>();
        });

        it('should merge any function Fn with () => void', () => {
            assertType<Is<Merge<() => void, Fn>, () => void>>();
            assertType<Is<Merge<Fn, () => void>, () => any>>();
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
            assertType<Is<Actual, Expected>>()
        });

    });

    describe('object types', () => {

        describe('undefined properties', () => {

            it('should merge empty objects', () => {
                type Actual = Merge<{}, {}>;
                type Expected = {};
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: 1 with target: non-existing property', () => {
                type Actual = Merge<{ a: 1 }, {}>;
                type Expected = { a: 1 };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: optional prtoperty with target: non-existing property', () => {
                type Actual = Merge<{ a?: 1 }, {}>;
                type Expected = { a: 1 | undefined };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: 1 with target: optional number', () => {
                type Actual = Merge<{ a: 1 }, { a?: number }>;
                type Expected = { a: 1 };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: optional 1 with target: optional number', () => {
                type Actual = Merge<{ a?: 1 }, { a?: number }>;
                type Expected = { a: 1 | undefined };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: number with target: undefined', () => {
                type Actual = Merge<{ a: number }, { a: undefined }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: undefined with target: number', () => {
                type Actual = Merge<{ a: undefined }, { a: number }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: 1 with target: undefined', () => {
                type Actual = Merge<{ a: 1 }, { a: undefined }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: undefined with target: 1', () => {
                type Actual = Merge<{ a: undefined }, { a: 1 }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

        });

        describe('null properties', () => {

            it('should merge source: null with target: non-existing property', () => {
                type Actual = Merge<{ a: null }, {}>;
                type Expected = { a: null };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: 1 with target: null', () => {
                type Actual = Merge<{ a: 1 }, { a: null }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: null with target: 1', () => {
                type Actual = Merge<{ a: null }, { a: 1 }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: 1 with target: nullable number', () => {
                type Actual = Merge<{ a: 1 }, { a: number | null }>;
                type Expected = { a: 1 };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: nullable 1 with target: nullable number', () => {
                type Actual = Merge<{ a: 1 | null }, { a: number | null }>;
                type Expected = { a: 1 | null };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: nullable number with target: nullable 1', () => {
                type Actual = Merge<{ a: number | null }, { a: 1 | null }>;
                type Expected = { a: null }; // intersection of Source and Target because number does not extend 1
                assertType<Is<Actual, Expected>>();
            });

        });

        describe('boolean properties', () => {

            it('should merge non-empty source with empty target', () => {
                type Actual = Merge<{ a: true }, {}>;
                type Expected = { a: true };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge empty source with non-empty target', () => {
                type Actual = Merge<{}, { a: true }>;
                type Expected = { a: true };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge non-empty types having different properties', () => {
                type Actual = Merge<{ a: true }, { b: false }>;
                type Expected = { a: true, b: false };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: true with target: boolean, in the presence of distinct properties', () => {
                type Actual = Merge<{ a: true, b: number }, { a: boolean, c: string }>;
                type Expected = { a: true, b: number, c: string };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: boolean with target: true, in the presence of distinct properties', () => {
                type Actual = Merge<{ a: boolean, b: number }, { a: true, c: string }>;
                type Expected = { a: true, b: number, c: string }; // a: true is the only source a: boolean that extends the target a: true
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: true with target: true', () => {
                type Actual = Merge<{ a: true }, { a: true }>;
                type Expected = { a: true };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: true with target: false', () => {
                type Actual = Merge<{ a: true }, { a: false }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: boolean with target: boolean', () => {
                type Actual = Merge<{ a: boolean }, { a: boolean }>;
                type Expected = { a: boolean };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: boolean with target: undefined', () => {
                type Actual = Merge<{ a: boolean }, { a: undefined }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: boolean with target: null', () => {
                type Actual = Merge<{ a: boolean }, { a: null }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: boolean with target: number', () => {
                type Actual = Merge<{ a: boolean }, { a: number }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: boolean with target: string', () => {
                type Actual = Merge<{ a: boolean }, { a: string }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: boolean with target: any[]', () => {
                type Actual = Merge<{ a: boolean }, { a: any[] }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: boolean with target: object', () => {
                type Actual = Merge<{ a: boolean }, { a: object }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: boolean with target: {}', () => {
                type Actual = Merge<{ a: boolean }, { a: {} }>;
                type Expected = { a: boolean };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: {} with target: boolean', () => {
                type Actual = Merge<{ a: {} }, { a: boolean }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

        });

        describe('number properties', () => {

            it('should merge non-empty source with empty target', () => {
                type Actual = Merge<{ a: 1 }, {}>;
                type Expected = { a: 1 };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge empty source with non-empty target', () => {
                type Actual = Merge<{}, { a: 1 }>;
                type Expected = { a: 1 };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge non-empty types having different properties', () => {
                type Actual = Merge<{ a: 1 }, { b: 2 }>;
                type Expected = { a: 1, b: 2 };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: 1 with target: number, in the presence of distinct properties', () => {
                type Actual = Merge<{ a: 1, b: boolean }, { a: number, c: string }>;
                type Expected = { a: 1, b: boolean, c: string };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: number with target: 1, in the presence of distinct properties', () => {
                type Actual = Merge<{ a: number, b: boolean }, { a: 1, c: string }>;
                type Expected = { a: never, b: boolean, c: string };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: 1 with target: 1', () => {
                type Actual = Merge<{ a: 1 }, { a: 1 }>;
                type Expected = { a: 1 };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: 1 with target: 2', () => {
                type Actual = Merge<{ a: 1 }, { a: 2 }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: number with target: number', () => {
                type Actual = Merge<{ a: number }, { a: number }>;
                type Expected = { a: number };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: number with target: undefined', () => {
                type Actual = Merge<{ a: number }, { a: undefined }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: number with target: null', () => {
                type Actual = Merge<{ a: number }, { a: null }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: number with target: boolean', () => {
                type Actual = Merge<{ a: number }, { a: boolean }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: number with target: string', () => {
                type Actual = Merge<{ a: number }, { a: string }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: number with target: any[]', () => {
                type Actual = Merge<{ a: number }, { a: any[] }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: number with target: object', () => {
                type Actual = Merge<{ a: number }, { a: object }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: number with target: {}', () => {
                type Actual = Merge<{ a: number }, { a: {} }>;
                type Expected = { a: number };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: {} with target: number', () => {
                type Actual = Merge<{ a: {} }, { a: number }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

        });

        describe('string properties', () => {

            it('should merge non-empty source with empty target', () => {
                type Actual = Merge<{ a: '' }, {}>;
                type Expected = { a: '' };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge empty source with non-empty target', () => {
                type Actual = Merge<{}, { a: '' }>;
                type Expected = { a: '' };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge non-empty types having different properties', () => {
                type Actual = Merge<{ a: 'a' }, { b: 'b' }>;
                type Expected = { a: 'a', b: 'b' };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: "a" with target: string, in the presence of distinct properties', () => {
                type Actual = Merge<{ a: "a", b: boolean }, { a: string, c: string }>;
                type Expected = { a: "a", b: boolean, c: string };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: string with target: "a", in the presence of distinct properties', () => {
                type Actual = Merge<{ a: string, b: boolean }, { a: 'a', c: string }>;
                type Expected = { a: never, b: boolean, c: string };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: "a" with target: "a"', () => {
                type Actual = Merge<{ a: 'a' }, { a: 'a' }>;
                type Expected = { a: 'a' };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: "a" with target: "b"', () => {
                type Actual = Merge<{ a: 'a' }, { a: 'b' }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: string with target: string', () => {
                type Actual = Merge<{ a: string }, { a: string }>;
                type Expected = { a: string };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: string with target: undefined', () => {
                type Actual = Merge<{ a: string }, { a: undefined }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: string with target: null', () => {
                type Actual = Merge<{ a: string }, { a: null }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: string with target: boolean', () => {
                type Actual = Merge<{ a: string }, { a: boolean }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: string with target: number', () => {
                type Actual = Merge<{ a: string }, { a: number }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: string with target: any[]', () => {
                type Actual = Merge<{ a: string }, { a: any[] }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: string with target: object', () => {
                type Actual = Merge<{ a: string }, { a: object }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: string with target: {}', () => {
                type Actual = Merge<{ a: string }, { a: {} }>;
                type Expected = { a: string };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: {} with target: string', () => {
                type Actual = Merge<{ a: {} }, { a: string }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

        });

        describe('array properties', () => {

            it('should merge non-empty source with empty target', () => {
                type Actual = Merge<{ a: [] }, {}>;
                type Expected = { a: [] };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge empty source with non-empty target', () => {
                type Actual = Merge<{}, { a: [] }>;
                type Expected = { a: [] };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge non-empty types having different properties', () => {
                type Actual = Merge<{ a: ['a'] }, { b: ['b'] }>;
                type Expected = { a: ['a'], b: ['b'] };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: ["a"] with target: [string], in the presence of distinct properties', () => {
                type Actual = Merge<{ a: ["a"], b: boolean }, { a: [string], c: string }>;
                type Expected = { a: ["a"], b: boolean, c: string };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: [string] with target: ["a"], in the presence of distinct properties', () => {
                type Actual = Merge<{ a: [string], b: boolean }, { a: ['a'], c: string }>;
                type Expected = { a: [never], b: boolean, c: string };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: ["a"] with target: ["a"]', () => {
                type Actual = Merge<{ a: ['a'] }, { a: ['a'] }>;
                type Expected = { a: ['a'] };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: ["a"] with target: ["b"]', () => {
                type Actual = Merge<{ a: ['a'] }, { a: ['b'] }>;
                type Expected = { a: [never] };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: [string] with target: [string]', () => {
                type Actual = Merge<{ a: [string] }, { a: [string] }>;
                type Expected = { a: [string] };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: [string] with target: [undefined]', () => {
                type Actual = Merge<{ a: [string] }, { a: [undefined] }>;
                type Expected = { a: [never] };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: [string] with target: [null]', () => {
                type Actual = Merge<{ a: [string] }, { a: [null] }>;
                type Expected = { a: [never] };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: [string] with target: [boolean]', () => {
                type Actual = Merge<{ a: [string] }, { a: [boolean] }>;
                type Expected = { a: [never] };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: [string] with target: [number]', () => {
                type Actual = Merge<{ a: [string] }, { a: [number] }>;
                type Expected = { a: [never] };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: [string] with target: any[]', () => {
                type Actual = Merge<{ a: [string] }, { a: any[] }>;
                type Expected = { a: [never] }; // any[] isn't [any] and could be [], so this is ok!
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: any[] with target: [string]', () => {
                type Actual = Merge<{ a: any[] }, { a: [string] }>;
                type Expected = { a: [] };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: [string] with target: object', () => {
                type Actual = Merge<{ a: [string] }, { a: object }>;
                type Expected = { a: [string] };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: [string] with target: {}', () => {
                type Actual = Merge<{ a: [string] }, { a: {} }>;
                type Expected = { a: [string] };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge source: {} with target: [string]', () => {
                type Actual = Merge<{ a: {} }, { a: [string] }>;
                type Expected = { a: never };
                assertType<Is<Actual, Expected>>();
            });

        });

        describe('function properties', () => {

            it('should merge source: Fn with target: () => void', () => {
                type Actual = Merge<{ a: Fn }, { a: () => void }>;
                type Expected = { a: () => any };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: () => void with target: Fn', () => {
                type Actual = Merge<{ a: () => void }, { a: Fn }>;
                type Expected = { a: () => void };
                assertType<Is<Actual, Expected>>();
            });

        });

        describe('object properties', () => {

            it('should merge deep properties that are assignable', () => {
                type Actual = Merge<{ a: { b: 1 } }, { a: { b: number } }>;
                type Expected = { a: { b: 1 } };
                assertType<Is<Actual, Expected>>();
            });

            it('should never merge deep properties that aren\'t assignable', () => {
                type Actual = Merge<{ a: { b: number } }, { a: { b: 1 } }>;
                type Expected = { a: { b: never } };
                assertType<Is<Actual, Expected>>();
            });

        });

        describe('objects', () => {

            it('should merge two objects', () => {
                class A { }
                class B extends A {
                    b = 1
                }
                const fn1 = () => { }
                const fn2 = () => { }
                const target = {
                    a: A,
                    b: {
                        c: false,
                        e: fn1,
                        f: [1]
                    }
                };
                const source = {
                    a: B,
                    b: {
                        c: true,
                        e: fn2,
                        f: [2, 3]
                    }
                };
                const expected = {
                    a: B,
                    b: {
                        c: true,
                        e: fn2,
                        f: [2, 3]
                    }
                };
                type Expected = typeof expected;
                type Actual = Merge<typeof source, typeof target>;
                assertType<Is<Actual, Expected>>();
            });

        });

    });

});
