/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { assertType } from 'typelevel-assert';
import { Is } from 'typescript-typelevel';
import { describe, expect, it } from 'vitest';
import { eager, inject } from '../src/inject';
import { Module, Check } from '../src/types';

describe('A generic dependency type', () => {

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

    function checkType<T>(t: T): void {
        // TODO(@@dd): remove the need for ts-expect-error, a naked type parameter T can be seen as 'any' or 'unknown'
        // @ts-expect-error ts(2345)
        const ctr = inject({ _: () => t });
        expect(typeof ctr._).toBe(typeof t);
        expect(ctr._).toBe(t);
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
        const ctx = createCycle(undefined);
        expect(ctx.a).not.toBeUndefined();
        expect(ctx.b).not.toBeUndefined();
        expect(ctx.a.b).toBe(ctx.b);
        expect(ctx.b.a()).toBe(ctx.a);
    });

    it('should be idempotent', () => {
        const ctx = createA({});
        expect(ctx.testee).not.toBeUndefined();
        expect(ctx.testee).toBe(ctx.testee);
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
        const ctx = createCycle(testee);
        ctx.a; // initializes cycle
        return ctx.b.a();
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
            // @ts-expect-error
            inject({ first: createFirst, second: createSecond }).second
        ).toThrowError('construction error');
    });

    it('should properly forward past construction errors when building multiple times', () => {
        interface API { first: { a: boolean }, second: { b: boolean }, third: { c: boolean } }
        const createFirst = () => { throw new Error('construction error'); };
        const createSecond = ({ first }: API) => ({ b: first.a });
        const createThird = ({ first }: API) => ({ c: first.a });
        // @ts-expect-error
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
        ).toThrowError('Cyclic dependency [a]. See https://ginject.io/#cyclic-dependencies');
    });

    it('should throw when cyclic dependency is accessed during factory function call', () => {
        interface API { a: { a: boolean }, b: { b: boolean } }
        const createA = ({ b }: API) => ({ a: b.b });
        const createB = ({ a }: API) => ({ b: a.a });
        expect(() =>
            inject({ a: createA, b: createB }).a
        ).toThrowError('Cyclic dependency [a]. See https://ginject.io/#cyclic-dependencies');
    });

    describe('should merge groups', () => {

        // setup

        class A {
            a = 1
        }

        class B extends A {
            b;
            constructor(a: A) {
                super();
                this.b = a.a
            }
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

        it('should check module 1', () => {

            type Actual1 = Check<[typeof m1]>
            type Expected1 = [Module<C1, C1>];
            assertType<Is<Actual1, Expected1>>();
            const ctr1 = inject(m1);
            const expected1 = {
                groupA: {
                    service1: new A()
                }
            }
            assertType<Is<typeof ctr1, C1>>();
            expect(ctr1).toStrictEqual(expected1);

        });

        it('should check module 2', () => {

            type Actual2 = Check<[typeof m2]>
            type Expected2 = [Module<C2, C2>];
            assertType<Is<Actual2, Expected2>>();
            const ctr2 = inject(m2);
            const expected2 = {
                groupB: {
                    groupC: {
                        service2: new A()
                    }
                }
            }
            assertType<Is<typeof ctr2, C2>>();
            expect(ctr2).toStrictEqual(expected2);

        });

        it('should check module 3', () => {

            type Actual2 = Check<[typeof m2]>
            type Expected2 = [Module<C2, C2>];
            assertType<Is<Actual2, Expected2>>();
            const ctr2 = inject(m2);
            const expected2 = {
                groupB: {
                    groupC: {
                        service2: new A()
                    }
                }
            }
            assertType<Is<typeof ctr2, C2>>();
            expect(ctr2).toStrictEqual(expected2);

        });

        it('should check complete container of all injected modules', () => {

            const ctr = inject(m1, m2, m3);

            assertType<Is<typeof ctr.groupA.service1, A>>();
            assertType<Is<typeof ctr.groupB.groupC.service2, B>>();
            assertType<Is<typeof ctr.x, number>>();

            expect(ctr.groupA.service1).toBeInstanceOf(A);
            expect(ctr.groupB.groupC.service2).toBeInstanceOf(B);
            expect(ctr.x).toBe(1);

        });

    });

    it('should infer right container type given an ad-hoc module', () => {
        const ctr = inject({
            hi: () => 'Hi!',
            sayHi: (ctx: { hi: string }) => () => ctx.hi
        });
        assertType<Is<typeof ctr.hi, string>>();
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
        assertType<Is<typeof ctr.hi, string>>();
        expect(ctr.sayHi()).toBe('Hi!');
    });

    it('should overwrite a particular service', () => {
        type C = {
            hi: string,
            sayHi: () => string
        };
        const ctr = inject({
            hi: () => 'Hi!',
            sayHi: (ctx: C) => () => ctx.hi
        }, {
            hi: () => '¡Hola!'
        });
        assertType<Is<typeof ctr.hi, string>>();
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
        assertType<Is<typeof container.a, number>>();
        assertType<Is<typeof container.b.c, string>>();
        assertType<Is<typeof container.d.e, B>>();
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
        assertType<Is<typeof container.a, number>>();
        assertType<Is<typeof container.b.c, () => string>>();
        assertType<Is<typeof container.d.e, B>>();
    });

    it('should disallow to use wrong module types', () => {
        // @ts-expect-error
        inject({
            hi: (ctx: false) => 'Hi!'
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
        const ctr = inject({ a: () => 1 });
        expect('a' in ctr).toBe(true);
        expect('b' in ctr).toBe(false);
    });

    it('should be empty if module is empty', () => {
        const ctr = inject({});
        assertType<Is<typeof ctr, {}>>();
        expect(ctr).toEqual({});
    });

    it('should be extensible', () => {
        const ctr: any = inject({});
        expect(Object.isExtensible(ctr)).toBe(true);
        expect(ctr.a).toBeUndefined();
        expect(() => ctr.a = 1).not.toThrow();
        expect(ctr.a).toBe(1);
    });

    it('should be sealable', () => {
        const ctr: any = Object.seal(inject({}));
        expect(Object.isExtensible(ctr)).toBe(false);
        expect(() => (ctr.a = 1)).toThrowError('Cannot define property a, object is not extensible');
    });

    it('should return a class type ', () => {
        class A {
            a = 1
        }
        const ctr = inject({ a: () => A })
        assertType<Is<typeof ctr, { a: typeof A }>>()
        expect(new ctr.a().a).toBe(1);
    });

});
