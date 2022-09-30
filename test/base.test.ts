/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { describe, expect, it } from 'vitest'
import {assert as tsafeAssert, Equals, Extends, Not } from 'tsafe';
import { Fn, Obj, isObj } from '../src/base';

describe('type Fn', () => {

    it('should cover () => any', () => {
        tsafeAssert<Extends<() => any, Fn>>();
    });

    it('should cover () => void', () => {
        tsafeAssert<Extends<() => void, Fn>>();
    });

    it('should cover (...args: any[]) => any', () => {
        tsafeAssert<Extends<(...args: any[]) => any, Fn>>();
    });

    it('should cover typeof fn', () => {
        tsafeAssert<Extends<typeof fn, Fn>>();
    });

    it('should not cover undefined', () => {
        tsafeAssert<Not<Extends<undefined, Fn>>>();
    });

    it('should not cover null', () => {
        tsafeAssert<Not<Extends<null, Fn>>>();
    });

    it('should not cover boolean', () => {
        tsafeAssert<Not<Extends<boolean, Fn>>>();
    });

    it('should not cover number', () => {
        tsafeAssert<Not<Extends<number, Fn>>>();
    });

    it('should not cover string', () => {
        tsafeAssert<Not<Extends<string, Fn>>>();
    });

    it('should not cover array', () => {
        tsafeAssert<Not<Extends<any[], Fn>>>();
    });

    it('should not cover object', () => {
        tsafeAssert<Not<Extends<object, Fn>>>();
    });

    it('should not cover class', () => {
        tsafeAssert<Not<Extends<A, Fn>>>();
    });

});

describe('type Obj', () => {

    it('should be {}', () => {
        tsafeAssert<Equals<Obj<{}>, {}>>();
    });

    it('should be { a: 1 } & { b: 2 }', () => {
        tsafeAssert<Equals<Obj<{ a: 1 } & { b: 2 }>, { a: 1, b: 2 }>>();
    });

    it('should cover superset', () => {
        tsafeAssert<Extends<Obj<{ a: 1 }>, {}>>();
    });

    it('should cover interfaces', () => {
        tsafeAssert<Equals<Obj<InterfaceA>, { a: number }>>();
    });

    it('should cover classes (because a class can be used as supertype of an interface)', () => {
        tsafeAssert<Equals<Obj<A>, A>>();
    });

    it('should cover object', () => {
        tsafeAssert<Equals<Obj<object>, object>>();
    });

    it('should never be undefined', () => {
        tsafeAssert<Equals<Obj<undefined>, never>>();
    });

    it('should never be null', () => {
        tsafeAssert<Equals<Obj<null>, never>>();
    });

    it('should never be boolean', () => {
        tsafeAssert<Equals<Obj<boolean>, never>>();
    });

    it('should never be number', () => {
        tsafeAssert<Equals<Obj<number>, never>>();
    });

    it('should never be string', () => {
        tsafeAssert<Equals<Obj<string>, never>>();
    });

    it('should never be any[]', () => {
        tsafeAssert<Equals<Obj<any[]>, never>>();
    });

    it('should never be () => any', () => {
        tsafeAssert<Equals<Obj<() => any>, never>>();
    });

    it('should never be () => void', () => {
        tsafeAssert<Equals<Obj<() => void>, never>>();
    });

    it('should never be (...args: any[]) => any', () => {
        tsafeAssert<Equals<Obj<(...args: any[]) => any>, never>>();
    });

    it('should never be typeof fn', () => {
        tsafeAssert<Equals<Obj<typeof fn>, never>>();
    });

});

describe('isObj', () => {

    it('should accept {}', () => {
        expect(isObj({})).toBeTruthy();
    });

    it('should accept { a: 1 } & { b: 2 }', () => {
        expect(isObj({ a: 1, b: 2 })).toBeTruthy();
    });

    it('should not accept undefined', () => {
        expect(isObj(undefined)).toBeFalsy();
    });
    
    it('should not accept null', () => {
        expect(isObj(null)).toBeFalsy();
    });

    it('should not accept true', () => {
        expect(isObj(true)).toBeFalsy();
    });

    it('should not accept false', () => {
        expect(isObj(false)).toBeFalsy();
    });

    it('should not accept 0', () => {
        expect(isObj(0)).toBeFalsy();
    });

    it('should not accept 1', () => {
        expect(isObj(1)).toBeFalsy();
    });

    it('should not accept empty string', () => {
        expect(isObj('')).toBeFalsy();
    });

    it('should not accept non-empty string', () => {
        expect(isObj('a')).toBeFalsy();
    });

    it('should not accept empty array', () => {
        expect(isObj([])).toBeFalsy();
    });

    it('should not accept non-empty array', () => {
        expect(isObj([1])).toBeFalsy();
    });

    it('should not accept a class', () => {
        expect(isObj(A)).toBeFalsy();
    });

    it('should not accept () => 1', () => {
        expect(isObj(() => 1)).toBeFalsy();
    });

    it('should not accept fn', () => {
        expect(isObj(fn)).toBeFalsy();
    });

});

function fn() {}

class A {}

interface InterfaceA {
    a: number
}
