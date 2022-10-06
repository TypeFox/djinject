/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { describe, expect, it } from 'vitest'
import { assert as tsafeAssert, Equals } from 'tsafe';
import { merge } from '../src/merge';
import { Merge, MergeModules } from '../src/types';

type Fn = (...args: any[]) => any;

describe('type Merge', () => {

    describe('universal types', () => {

        it('should merge any', () => {
            tsafeAssert<Equals<Merge<any, any>, any>>();
            tsafeAssert<Equals<Merge<any, { a: 1 }>, any>>();
            tsafeAssert<Equals<Merge<{ a: 1 }, any>, any>>();
            tsafeAssert<Equals<Merge<any, 1>, any>>();
            tsafeAssert<Equals<Merge<1, any>, any>>();
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
            tsafeAssert<Equals<Merge<{ a: 1 }, void>, never>>();
            tsafeAssert<Equals<Merge<void, 1>, never>>();
            tsafeAssert<Equals<Merge<1, void>, never>>();
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

        it('should merge array', () => {
            tsafeAssert<Equals<Merge<any[], any[]>, any[]>>();
            tsafeAssert<Equals<Merge<[], []>, []>>();
            tsafeAssert<Equals<Merge<[1], [1]>, [1]>>();
            tsafeAssert<Equals<Merge<[1], [2]>, never>>();
            tsafeAssert<Equals<Merge<[2], [1]>, never>>();
            tsafeAssert<Equals<Merge<[2], [1]>, never>>();
            tsafeAssert<Equals<Merge<[1], [number]>, [1]>>();
            tsafeAssert<Equals<Merge<[number], [1]>, never>>();
            tsafeAssert<Equals<Merge<[1, ''], [number, string]>, [1, '']>>();
            tsafeAssert<Equals<Merge<[number, string], [1, '']>, never>>();
            tsafeAssert<Equals<Merge<[1, any], [1, '']>, [1, any]>>();
            tsafeAssert<Equals<Merge<[1, ''], [1, any]>, [1, '']>>();
            tsafeAssert<Equals<Merge<[1, never], [1, '']>, [1, never]>>();
            tsafeAssert<Equals<Merge<[1, ''], [1, never]>, never>>();
            tsafeAssert<Equals<Merge<[1, unknown], [1, '']>, never>>();
            tsafeAssert<Equals<Merge<[1, ''], [1, unknown]>, [1, '']>>();
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
            tsafeAssert<Equals<Merge<(a: number) => void, (a: string) => void>, never>>();
            tsafeAssert<Equals<Merge<(a: string) => void, (a: number) => void>, never>>();
            tsafeAssert<Equals<Merge<() => string, () => number>, never>>();
            tsafeAssert<Equals<Merge<() => number, () => string>, never>>();
        });

        it('should merge if source Fn ignores target Fn args', () => {
            tsafeAssert<Equals<Merge<() => void, (a: string) => void>, () => void>>();
        });

        it('should never merge if source Fn requires more args than target Fn', () => {
            tsafeAssert<Equals<Merge<(a: string) => void, () => void>, never>>();
        });

        it('should merge if source Fn returns 1 and target Fn returns void', () => {
            tsafeAssert<Equals<Merge<() => 1, () => void>, () => 1>>();
            tsafeAssert<Equals<Merge<() => any, () => void>, () => any>>();
            tsafeAssert<Equals<Merge<() => never, () => void>, () => never>>();
            tsafeAssert<Equals<Merge<() => unknown, () => void>, () => unknown>>();
        });

        it('should merge if source Fn returns void and target Fn returns any/unknown', () => {
            tsafeAssert<Equals<Merge<() => void, () => any>, () => void>>();
            tsafeAssert<Equals<Merge<() => void, () => unknown>, () => void>>();
        });

        it('should never merge if source Fn returns void and target Fn returns 1/never', () => {
            tsafeAssert<Equals<Merge<() => void, () => 1>, never>>();
            tsafeAssert<Equals<Merge<() => void, () => never>, never>>();
        });

        it('should merge any function Fn with () => void', () => {
            tsafeAssert<Equals<Merge<() => void, Fn>, () => void>>();
            tsafeAssert<Equals<Merge<Fn, () => void>, Fn>>();
        });

        // TODO(@@dd): classes are functions

    });

    describe('object types', () => {

        describe('undefined properties', () => {

            it('should merge empty objects', () => {
                type Source = {};
                type Target = {};
                type Expected = {};
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: 1 with target: non-existing property', () => {
                type Source = { a: 1 };
                type Target = {};
                type Expected = { a: 1 };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: optional prtoperty with target: non-existing property', () => {
                type Source = { a?: 1 };
                type Target = {};
                type Expected = { a: 1 | undefined };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: 1 with target: optional number', () => {
                type Source = { a: 1 };
                type Target = { a?: number };
                type Expected = { a: 1 };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: optional 1 with target: optional number', () => {
                type Source = { a?: 1 };
                type Target = { a?: number };
                type Expected = { a: 1 | undefined };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: number with target: undefined', () => {
                type Source = { a: number };
                type Target = { a: undefined };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: undefined with target: number', () => {
                type Source = { a: undefined };
                type Target = { a: number };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: 1 with target: undefined', () => {
                type Source = { a: 1 };
                type Target = { a: undefined };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: undefined with target: 1', () => {
                type Source = { a: undefined };
                type Target = { a: 1 };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

        });

        describe('null properties', () => {

            it('should merge source: null with target: non-existing property', () => {
                type Source = { a: null };
                type Target = {};
                type Expected = { a: null };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: 1 with target: null', () => {
                type Source = { a: 1 };
                type Target = { a: null };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: null with target: 1', () => {
                type Source = { a: null };
                type Target = { a: 1 };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: 1 with target: nullable number', () => {
                type Source = { a: 1 };
                type Target = { a: number | null };
                type Expected = { a: 1 };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: nullable 1 with target: nullable number', () => {
                type Source = { a: 1 | null };
                type Target = { a: number | null };
                type Expected = { a: 1 | null };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: nullable number with target: nullable 1', () => {
                type Source = { a: number | null };
                type Target = { a: 1 | null };
                type Expected = { a: null }; // intersection of Source and Target because number does not extend 1
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

        });

        describe('boolean properties', () => {

            it('should merge non-empty source with empty target', () => {
                type Source = { a: true };
                type Target = {};
                type Expected = { a: true };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge empty source with non-empty target', () => {
                type Source = {};
                type Target = { a: true };
                type Expected = { a: true };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge non-empty types having different properties', () => {
                type Source = { a: true };
                type Target = { b: false };
                type Expected = { a: true, b: false };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: true with target: boolean, in the presence of distinct properties', () => {
                type Source = { a: true, b: number };
                type Target = { a: boolean, c: string };
                type Expected = { a: true, b: number, c: string };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: boolean with target: true, in the presence of distinct properties', () => {
                type Source = { a: boolean, b: number };
                type Target = { a: true, c: string };
                type Expected = { a: true, b: number, c: string }; // a: true is the only source a: boolean that extends the target a: true
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: true with target: true', () => {
                type Source = { a: true };
                type Target = { a: true };
                type Expected = { a: true };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: true with target: false', () => {
                type Source = { a: true };
                type Target = { a: false };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: boolean with target: boolean', () => {
                type Source = { a: boolean };
                type Target = { a: boolean };
                type Expected = { a: boolean };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: boolean with target: undefined', () => {
                type Source = { a: boolean };
                type Target = { a: undefined };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: boolean with target: null', () => {
                type Source = { a: boolean };
                type Target = { a: null };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: boolean with target: number', () => {
                type Source = { a: boolean };
                type Target = { a: number };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: boolean with target: string', () => {
                type Source = { a: boolean };
                type Target = { a: string };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: boolean with target: any[]', () => {
                type Source = { a: boolean };
                type Target = { a: any[] };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: boolean with target: object', () => {
                type Source = { a: boolean };
                type Target = { a: object };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: boolean with target: {}', () => {
                type Source = { a: boolean };
                type Target = { a: {} };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: {} with target: boolean', () => {
                type Source = { a: {} };
                type Target = { a: boolean };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

        });

        describe('number properties', () => {

            it('should merge non-empty source with empty target', () => {
                type Source = { a: 1 };
                type Target = {};
                type Expected = { a: 1 };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge empty source with non-empty target', () => {
                type Source = {};
                type Target = { a: 1 };
                type Expected = { a: 1 };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge non-empty types having different properties', () => {
                type Source = { a: 1 };
                type Target = { b: 2 };
                type Expected = { a: 1, b: 2 };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: 1 with target: number, in the presence of distinct properties', () => {
                type Source = { a: 1, b: boolean };
                type Target = { a: number, c: string };
                type Expected = { a: 1, b: boolean, c: string };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: number with target: 1, in the presence of distinct properties', () => {
                type Source = { a: number, b: boolean };
                type Target = { a: 1, c: string };
                type Expected = { a: never, b: boolean, c: string };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: 1 with target: 1', () => {
                type Source = { a: 1 };
                type Target = { a: 1 };
                type Expected = { a: 1 };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: 1 with target: 2', () => {
                type Source = { a: 1 };
                type Target = { a: 2 };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: number with target: number', () => {
                type Source = { a: number };
                type Target = { a: number };
                type Expected = { a: number };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: number with target: undefined', () => {
                type Source = { a: number };
                type Target = { a: undefined };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: number with target: null', () => {
                type Source = { a: number };
                type Target = { a: null };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: number with target: boolean', () => {
                type Source = { a: number };
                type Target = { a: boolean };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: number with target: string', () => {
                type Source = { a: number };
                type Target = { a: string };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: number with target: any[]', () => {
                type Source = { a: number };
                type Target = { a: any[] };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: number with target: object', () => {
                type Source = { a: number };
                type Target = { a: object };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: number with target: {}', () => {
                type Source = { a: number };
                type Target = { a: {} };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: {} with target: number', () => {
                type Source = { a: {} };
                type Target = { a: number };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

        });

        describe('string properties', () => {

            it('should merge non-empty source with empty target', () => {
                type Source = { a: '' };
                type Target = {};
                type Expected = { a: '' };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge empty source with non-empty target', () => {
                type Source = {};
                type Target = { a: '' };
                type Expected = { a: '' };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge non-empty types having different properties', () => {
                type Source = { a: 'a' };
                type Target = { b: 'b' };
                type Expected = { a: 'a', b: 'b' };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: "a" with target: string, in the presence of distinct properties', () => {
                type Source = { a: "a", b: boolean };
                type Target = { a: string, c: string };
                type Expected = { a: "a", b: boolean, c: string };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: string with target: "a", in the presence of distinct properties', () => {
                type Source = { a: string, b: boolean };
                type Target = { a: 'a', c: string };
                type Expected = { a: never, b: boolean, c: string };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: "a" with target: "a"', () => {
                type Source = { a: 'a' };
                type Target = { a: 'a' };
                type Expected = { a: 'a' };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: "a" with target: "b"', () => {
                type Source = { a: 'a' };
                type Target = { a: 'b' };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: string with target: string', () => {
                type Source = { a: string };
                type Target = { a: string };
                type Expected = { a: string };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: string with target: undefined', () => {
                type Source = { a: string };
                type Target = { a: undefined };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: string with target: null', () => {
                type Source = { a: string };
                type Target = { a: null };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: string with target: boolean', () => {
                type Source = { a: string };
                type Target = { a: boolean };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: string with target: number', () => {
                type Source = { a: string };
                type Target = { a: number };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: string with target: any[]', () => {
                type Source = { a: string };
                type Target = { a: any[] };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: string with target: object', () => {
                type Source = { a: string };
                type Target = { a: object };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: string with target: {}', () => {
                type Source = { a: string };
                type Target = { a: {} };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: {} with target: string', () => {
                type Source = { a: {} };
                type Target = { a: string };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

        });

        describe('array properties', () => {

            it('should merge non-empty source with empty target', () => {
                type Source = { a: [] };
                type Target = {};
                type Expected = { a: [] };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge empty source with non-empty target', () => {
                type Source = {};
                type Target = { a: [] };
                type Expected = { a: [] };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge non-empty types having different properties', () => {
                type Source = { a: ['a'] };
                type Target = { b: ['b'] };
                type Expected = { a: ['a'], b: ['b'] };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: ["a"] with target: [string], in the presence of distinct properties', () => {
                type Source = { a: ["a"], b: boolean };
                type Target = { a: [string], c: string };
                type Expected = { a: ["a"], b: boolean, c: string };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: [string] with target: ["a"], in the presence of distinct properties', () => {
                type Source = { a: [string], b: boolean };
                type Target = { a: ['a'], c: string };
                type Expected = { a: never, b: boolean, c: string };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: ["a"] with target: ["a"]', () => {
                type Source = { a: ['a'] };
                type Target = { a: ['a'] };
                type Expected = { a: ['a'] };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: ["a"] with target: ["b"]', () => {
                type Source = { a: ['a'] };
                type Target = { a: ['b'] };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: [string] with target: [string]', () => {
                type Source = { a: [string] };
                type Target = { a: [string] };
                type Expected = { a: [string] };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: [string] with target: [undefined]', () => {
                type Source = { a: [string] };
                type Target = { a: [undefined] };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: [string] with target: [null]', () => {
                type Source = { a: [string] };
                type Target = { a: [null] };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: [string] with target: [boolean]', () => {
                type Source = { a: [string] };
                type Target = { a: [boolean] };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: [string] with target: [number]', () => {
                type Source = { a: [string] };
                type Target = { a: [number] };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: [string] with target: any[]', () => {
                type Source = { a: [string] };
                type Target = { a: any[] };
                type Expected = { a: [string] };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: any[] with target: [string]', () => {
                type Source = { a: any[] };
                type Target = { a: [string] };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: [string] with target: object', () => {
                type Source = { a: [string] };
                type Target = { a: object };
                type Expected = { a: [string] };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: [string] with target: {}', () => {
                type Source = { a: [string] };
                type Target = { a: {} };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge source: {} with target: [string]', () => {
                type Source = { a: {} };
                type Target = { a: [string] };
                type Expected = { a: never };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

        });

        describe('function properties', () => {

            it('should merge source: Fn with target: () => void', () => {
                type Source = { a: Fn };
                type Target = { a: () => void };
                type Expected = { a: Fn };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should merge source: () => void with target: Fn', () => {
                type Source = { a: () => void };
                type Target = { a: Fn };
                type Expected = { a: () => void };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

        });

        describe('object properties', () => {

            it('should merge deep properties that are assignable', () => {
                type Source = { a: { b: 1 } };
                type Target = { a: { b: number } };
                type Expected = { a: { b: 1 } };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

            it('should never merge deep properties that aren\'t assignable', () => {
                type Source = { a: { b: number } };
                type Target = { a: { b: 1 } };
                type Expected = { a: { b: never } };
                tsafeAssert<Equals<Merge<Source, Target>, Expected>>();
            });

        });

    });

});

describe('type MergeArray', () => {

    it('should merge empty array', () => {
        tsafeAssert<Equals<MergeModules<[]>, never>>();
    });

    it('should merge array with one element', () => {
        tsafeAssert<Equals<MergeModules<[{ a: 1 }]>, { a: 1 }>>();
    });

    it('should merge array with two elements', () => {
        tsafeAssert<Equals<MergeModules<[{ a: 1 }, { b: true }]>, { a: 1, b: true }>>();
    });

    it('should merge array with three elements', () => {
        class A {}
        class B extends A {
            b = 1
        }
        type Input = [
            { a: A, b: boolean, c: number, d: 'a' },
            { b: true, d: string },
            { a: B, c: 1 }
        ];
        type Expected = {
            a: B,
            b: true,
            c: 1,
            d: never
        };
        tsafeAssert<Equals<MergeModules<Input>, Expected>>();
    });

    it('should deep merge array with three elements', () => {
        class A {}
        class B extends A {
            b = 1
        }
        type Input = [
            { a: { b: { c: A }, d: Fn }, e: number },
            { a: { d: () => void } },
            { a: { b: { c: B } } },
            { e: 1 }
        ];
        type Expected = {
            a: {
                b: {
                    c: B
                },
                d: () => void
            },
            e: 1
        };
        tsafeAssert<Equals<MergeModules<Input>, Expected>>();
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
