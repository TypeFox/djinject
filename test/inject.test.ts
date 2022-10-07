/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { describe, expect, it } from 'vitest'
import { assert as tsafeAssert, Equals } from 'tsafe';
import { eager, inject } from '../src/inject';
import { Module } from '../src/types';

describe('A dependency type', () => {

    it('should be undefined', () => checkType(undefined));
    it('should be null', () => checkType(null));
    it('should be false', () => checkType(false));
    it('should be true', () => checkType(true));
    it('should be 0', () => checkType(0));
    it('should be 1', () => checkType(1));
    it('should be empty string', () => checkType(''));
    it('should be non empty string', () => checkType('a'));
    it('should be empty array', () => checkType([]));
    it('should be non-empty array', () => checkType([1]));
    it('should be empty object', () => checkType({}));
    it('should be non-empty object', () => checkType({ _: 1 }));
    it('should be class', () => checkType(class { }));
    it('should be class instance', () => checkType(new (class { })()));
    it('should be function', () => checkType(function a() { }));
    it('should be lambda', () => checkType(() => { }));

    function checkType(value: unknown): void {
        const ctr = inject({ _: () => value });
        expect(typeof ctr._).toBe(typeof value);
        expect(ctr._).toBe(value);
    }

});

describe('A non-cyclic dependency', () => {

    it('should be callable', () => {
        expect(
            inject({ dep: () => () => true }).dep()
        ).toBe(true);
    });

    it('should be constructable', () => {
        class A { }
        expect(
            new (inject({ dep: () => A }).dep)()
        ).toBeInstanceOf(A);
    });

    it('should be getable', () => {
        expect(
            inject({ dep: () => ({ a: true }) }).dep.a
        ).toBe(true);
    });

    it('should be idempotent', () => {
        const ctr = inject({ dep: () => ({}) });
        expect(ctr.dep).toBe(ctr.dep);
    });

});

describe('A cyclic dependency', () => {

    // this is a requirement for the following tests
    it('should be injected lazily', () => {
        const ctr = createCycle(undefined);
        expect(ctr.a).not.toBeUndefined();
        expect(ctr.b).not.toBeUndefined();
        expect(ctr.a.b).toBe(ctr.b);
        expect(ctr.b.a()).toBe(ctr.a);
    });

    it('should be idempotent', () => {
        const ctr = createA({});
        expect(ctr.testee).not.toBeUndefined();
        expect(ctr.testee).toBe(ctr.testee);
    });

    it('should be callable', () => {
        expect(
            createA(() => true).testee()
        ).toBe(true);
    });

    it('should be constructable', () => {
        class A { }
        expect(
            new (createA(A).testee)()
        ).toBeInstanceOf(A);
    });

    it('should be getable', () => {
        expect(
            createA({ c: true }).testee.c
        ).toBe(true);
    });

    it('should work with for..in', () => {
        const obj = createA(1);
        const res: string[] = [];
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                res.push(key);
            }
        }
        expect(res).toEqual(['b', 'testee']);
    });

    interface API<T> {
        a: A<T>
        b: B<T>
    }

    class A<T> {
        b: B<T>;
        testee: T;
        constructor(b: B<T>, testee: T) {
            this.b = b;
            this.testee = testee;
        }
    }

    class B<T> {
        a: () => A<T>;
        constructor(ctr: API<T>) {
            this.a = () => ctr.a;
        }
    }

    function createCycle<T>(testee: T): API<T> {
        return inject({
            a: ({ b }: API<T>) => new A(b, testee),
            b: (ctr: API<T>) => new B(ctr)
        });
    }

    function createA<T>(testee: T): A<T> {
        const ctr = createCycle(testee);
        ctr.a; // initializes cycle
        return ctr.b.a();
    }

});

describe('The dependency initialization', () => {

    it('should not inject null', () => {
        expect(() => {
            // @ts-expect-error
            inject(null);
        }).toThrow();
    });

    it('should not inject true', () => {
        // @ts-expect-error
        inject(true);
    });

    it('should not inject object without factory', () => {
        // @ts-expect-error
        inject({ a: 1 });
    });

    it('should be lazy by default', () => {
        let actual = false;
        inject({ p: () => { actual = true; }});
        expect(actual).toBeFalsy();
    });

    it('should be eager if needed', () => {
        let actual = false;
        inject({ p: eager(() => { actual = true; })});
        expect(actual).toBeTruthy();
    });

    it('should not affect lazy initializers if eager', () => {
        let actual1 = false;
        let actual2 = false;
        inject({
            p1: eager(() => { actual1 = true; }),
            p2: () => { actual2 = true }
        });
        expect(actual1).toBeTruthy();
        expect(actual2).toBeFalsy();
    });

    it('should be idempotent when calling eager twice', () => {
        const f = () => {};
        const g = eager(f);
        const h = eager(g);
        expect(g).not.toEqual(f);
        expect(eager(g)).toEqual(g);
    });

});

describe('The inject function', () => {

    it('should forward construction error', () => {
        interface API { first: { a: boolean }, second: { b: boolean } }
        const createFirst = () => { throw new Error('construction error'); };
        const createSecond = ({ first }: API) => ({ b: first.a });
        expect(() =>
            inject({ first: createFirst, second: createSecond }).second
        ).toThrowError('construction error');
    });

    it('should properly forward past construction errors when building multiple times', () => {
        //before fixing issue #463 a second attempt was leading to a cycle detection error (wrong direction for debugging people)
        interface API { first: { a: boolean }, second: { b: boolean }, third: { c: boolean } }
        const createFirst = () => { throw new Error('construction error'); };
        const createSecond = ({ first }: API) => ({ b: first.a });
        const createThird = ({ first }: API) => ({ c: first.a });
        const result = inject({ first: createFirst, second: createSecond, third: createThird });
        expect(() =>
            result.second
        ).toThrowError('construction error');
    });

    it('should work with objects', () => {
        const ctr = inject({
            a: () => true,
            b: () => 1
        });
        expect(ctr.a).toBe(true);
        expect(ctr.b).toBe(1);
        expect((ctr as any).c).toBeUndefined();
    });

    it('should allow cycles in class constructors', () => {
        interface API { a: A, b: B }
        class A {
            b: B;
            constructor({ b }: API) { this.b = b; }
        }
        class B {
            a: () => A;
            constructor(ctr: API) { this.a = () => ctr.a; }
        }
        expect(() =>
            inject({ a: (ctr: API) => new A(ctr), b: (ctr: API) => new B(ctr) }).a
        ).not.toThrow();
    });

    it('should allow cycles in functions', () => {
        type API = { a: A, b: B }
        type A = { b: B }
        type B = { a: () => A }
        const createA = ({ b }: API) => ({ b });
        const createB = (ctr: API) => ({ a: () => ctr.a });
        expect(() =>
            inject({ a: createA, b: createB }).a
        ).not.toThrow();
    });

    it('should throw when cyclic dependency is accessed during class construction', () => {
        interface API { a: A, b: B }
        class A {
            a: boolean;
            constructor({ b }: API) { this.a = b.b; }
        }
        class B {
            b: boolean;
            constructor({ a }: API) { this.b = a.a; }
        }
        expect(() =>
            inject({ a: (ctx: API) => new A(ctx), b: (ctx: API) => new B(ctx) }).a
        ).toThrowError('Cyclic dependency [a]. See https://github.com/langium/ginject#cyclic-dependencies');
    });

    it('should throw when cyclic dependency is accessed during factory function call', () => {
        interface API { a: { a: boolean }, b: { b: boolean } }
        const createA = ({ b }: API) => ({ a: b.b });
        const createB = ({ a }: API) => ({ b: a.a });
        expect(() =>
            inject({ a: createA, b: createB }).a
        ).toThrowError('Cyclic dependency [a]. See https://github.com/langium/ginject#cyclic-dependencies');
    });

    it('should merge groups', () => {

        class A {
            a = 1
        }

        class B extends A {
            constructor(a: A) {
                super();
            }
            b = 1;
        }

        interface C1 {
            groupA: {
                service1: A
            }
        }

        interface C2 {
            groupB: {
                groupC: {
                    service2: A
                }
            }
        }

        const m1: Module<C1> = {
            groupA: {
                service1: () => new A()
            }
        };

        const m2: Module<C2> = {
            groupB: {
                groupC: {
                    service2: () => new A()
                }
            }
        };

        const m3 = { // intentionally not declared as Module<C3>
            groupB: {
                groupC: {
                    service2: (ctx: C1) => new B(ctx.groupA.service1)
                }
            },
            x: () => 1
        };

        const ctr = inject(m1, m2, m3);

        tsafeAssert<Equals<typeof ctr.groupA.service1, A>>();
        tsafeAssert<Equals<typeof ctr.groupB.groupC.service2, B>>();
        tsafeAssert<Equals<typeof ctr.x, number>>();

        expect(ctr.groupA.service1).toBeInstanceOf(A);
        expect(ctr.groupB.groupC.service2).toBeInstanceOf(B);
        expect(ctr.x).toBe(1);
    });

    it('should infer right container type given an ad-hoc module', () => {
        const ctr = inject({
            hi: () => 'Hi!',
            sayHi: (ctx: { hi: string }) => () => ctr.hi
        });
        tsafeAssert<Equals<typeof ctr.hi, string>>();
        expect(ctr.sayHi()).toBe('Hi!');
    });

    it('should infer right container type given an explicit module', () => {
        type Services = {
            hi: string,
            sayHi: () => string
        };
        const module: Module<Services> = {
            hi: () => 'Hi!',
            sayHi: (ctr) => () => ctr.hi
        };
        const ctr = inject(module);
        tsafeAssert<Equals<typeof ctr.hi, string>>();
        expect(ctr.sayHi()).toBe('Hi!');
    });

    it('should overwrite a particular service', () => {
        type C = {
            hi: string,
            sayHi: (ctx: C) => () => string
        };
        const ctr = inject({
            hi: () => 'Hi!',
            sayHi: (ctx: C) => () => ctx.hi
        }, {
            hi: () => '¡Hola!'
        });
        tsafeAssert<Equals<typeof ctr.hi, string>>();
        expect(ctr.sayHi()).toBe('¡Hola!');
    });

    it('sould infer the type of factories of mergable modules', () => {
        class A {
            a = 'a'
        }
        class B extends A {
            b = 'b'
        }
        const container = inject({
            a: () => 1,
            b: {
                c: () => ''
            },
            d: {
                e: () => new A()
            }
        }, {
            a: () => 2,
            b: {
                c: () => 'hallo'
            },
            d: {
                e: () => new B()
            }
        });
        tsafeAssert<Equals<typeof container.a, number>>();
        tsafeAssert<Equals<typeof container.b.c, string>>();
        tsafeAssert<Equals<typeof container.d.e, B>>();
    });

    it('sould infer the type of curried factories of non-mergable modules', () => {
        class A {
            a = 'a'
        }
        class B extends A {
            b = 'b'
        }
        const container = inject({
            a: () => 1,
            b: {
                c: () => () => '' as string
            },
            d: {
                e: () => new A()
            }
        }, {
            a: () => 2,
            b: {
                c: () => () => 'hallo' as string
            },
            d: {
                e: () => new B()
            }
        }, {
            b: {
                c: () => () => 'salut' as string
            }
        });
        tsafeAssert<Equals<typeof container.a, number>>();
        tsafeAssert<Equals<typeof container.b.c, () => string>>();
        tsafeAssert<Equals<typeof container.d.e, B>>();
    });

    it('should disallow to use wrong containers types', () => {
        inject({
            // @ts-expect-error
            hi: (ctr: false) => 'Hi!'
        });
    });

});

describe('The inject result', () => {

    it('should be immutable', () => {
        const ctr: any = inject({ a: () => 1 });
        expect(() => delete ctr.a).toThrowError('\'deleteProperty\' on proxy: trap returned falsish for property \'a\'');
        expect(ctr.a).toBe(1);
    });

    it('should work with for..in', () => {
        const obj = inject({ a: () => 1, b: () => 2 });
        const res: string[] = [];
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                res.push(key);
            }
        }
        expect(res).toEqual(['a', 'b']);
    });

    it('should work with ..in.. for object', () => {
        const obj = inject({ a: () => 1 });
        expect('a' in obj).toBe(true);
        expect('b' in obj).toBe(false);
    });

    it('should be extensible', () => {
        const obj: any = inject({});
        expect(Object.isExtensible(obj)).toBe(true);
        expect(obj.a).toBeUndefined();
        expect(() => obj.a = 1).not.toThrow();
        expect(obj.a).toBe(1);
    });

    it('should be sealable', () => {
        const obj: any = Object.seal(inject({}));
        expect(Object.isExtensible(obj)).toBe(false);
        expect(() => (obj.a = 1)).toThrowError('Cannot define property a, object is not extensible');
    });

});
