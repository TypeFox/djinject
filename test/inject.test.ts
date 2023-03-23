/******************************************************************************
 * Copyright 2023 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { assertType, Equals, Extends, Is } from 'typelevel-assert';
import { describe, expect, it } from 'vitest';
import { init, inject } from '../src/inject';
import { Container, DjinjectError, Module } from '../src/types';

describe('A module', () => {

    it('may be empty', () => {
        const ctr = inject({});
        assertType<Is<typeof ctr, {}>>();
        expect(ctr).toEqual({});
    });

    it('may contain an optional dependency', () => {
        type Ctx = {
            group: {
                dep?: number
            }
        };
        const module: Module<Ctx, Ctx> = {
            group: {
            }
        };
        const ctr = inject(module);
        const { dep } = ctr.group;
        assertType<Is<typeof dep, number | undefined>>();
        expect(dep).toBeUndefined();
    });

    it('may contain an optional group', () => {
        type Ctx = {
            group?: {
                dep: number
            }
        };
        const module: Module<Ctx, Ctx> = {};
        const ctr = inject(module);
        const { group } = ctr;
        assertType<Is<typeof group, { dep: number } | undefined>>();
        expect(group).toBeUndefined();
    });

    it('may contain an empty group', () => {
        const module = {
            group: {
            }
        } satisfies Module;
        const ctr = inject(module);
        type Actual = typeof ctr;
        type Expected = {
            group: {}
        };
        assertType<Is<Actual, Expected>>();
        expect(ctr.group).toEqual({});
    });

    it('may contain a mixture of optional groups and dependencies', () => {
        type Ctx = {
            group1: {
                dep1?: number
            }
            group2?: {
                dep2: number
            }
            group3: {
                dep3: number
            }
        };
        const module = {
            group1: {
            },
            group3: {
                dep3: () => 1
            }
        } satisfies Module<Ctx, Ctx>;
        const ctr = inject(module);
        assertType<Equals<typeof ctr, Ctx>>();
        expect(ctr).toEqual({
            group1: {
            },
            group3: {
                dep3: 1
            }
        });
    });

    it('may contain a function provider', () => {
        type A = {
            f: (a: number) => void
        };
        const ma = {
            f: () => (a: number) => {}
        } satisfies Module<A>;
        const ctr = inject(ma);
        expect(ctr.f(1)).toBeUndefined();
    });

    it('should disallow provider of different shape', () => {
        type A = {
            f: (a: number) => number
        };
        const ma: Module<A> = {
            // @ts-expect-error Type '() => (a: number) => () => number' is not assignable to type 'Factory<A, (a: number) => number>'.
            f: () => (a: number) => () => 0
        };
    });

    it('should overwrite a function dependency if it is assignable', () => {
        type C1 = {
            f: (s: '') => string
        }
        type C2 = {
            f: (s: string) => ''
        }
        const m1 = {
            f: () => (s: '') => 'test'
        } satisfies Module<C1, C1>;
        const m2 = {
            f: () => (s: string) => ''
        } satisfies Module<C2, C2>;
        const ctr = inject(m1, m2);
        type Actual = typeof ctr;
        type Expected = {
            f: (s: string) => ''
        }
        assertType<Is<Actual, Expected>>();
        expect(ctr.f('test')).toEqual('');
    });

    it('should not rebind a function dependency if it is not assignable', () => {
        type C1 = {
            f: (s: string) => ''
        }
        type C2 = {
            f: (s: '') => string
        }
        const m1 = {
            f: () => (s: string) => ''
        } satisfies Module<C1, C1>;
        const m2 = {
            f: () => (s: '') => 'test'
        } satisfies Module<C2, C2>;
        // @ts-expect-error
        const ctr = inject(m1, m2);
        type Actual = typeof ctr;
        type Expected = DjinjectError<{
            dependency_conflicts: ['f']
        }>;
        assertType<Is<Actual, Expected>>();
        // however, at runtime, the function dependency gets merged
        expect((ctr as any).f('')).toEqual('test');
    });

    it('should overwrite a class dependency if it is assignable', () => {
        class A {
            a: number = 1;
        }
        class B extends A {
            b: string = ''
        }
        type C1 = {
            _: A
        }
        type C2 = {
            _: B
        }
        const m1 = {
            _: () => new A()
        } satisfies Module<C1, C1>;
        const m2 = {
            _: () => new B()
        } satisfies Module<C2, C2>;
        const ctr = inject(m1, m2);
        type Actual = typeof ctr;
        type Expected = {
            _: B
        }
        assertType<Is<Actual, Expected>>();
        expect(ctr._).toEqual(new B());
        expect(ctr._).not.toEqual(new A());
    });

    it('should not rebind a class dependency if it is not assignable', () => {
        class A {
            a: number = 1;
        }
        class B extends A {
            b: string = ''
        }
        type C1 = {
            _: B
        }
        type C2 = {
            _: A
        }
        const m1 = {
            _: () => new B()
        } satisfies Module<C1, C1>;
        const m2 = {
            _: () => new A()
        } satisfies Module<C2, C2>;
        // @ts-expect-error
        const ctr = inject(m1, m2);
        type Actual = typeof ctr;
        type Expected = DjinjectError<{
            dependency_conflicts: ['_'];
        }>;
        assertType<Is<Actual, Expected>>();
        // however, at runtime, the class dependency gets merged
        expect((ctr as any)._).toEqual(new A());
        expect((ctr as any)._).not.toEqual(new B());
    });

    it('may be partially defined given one type parameter', () => {
        type Ctx = { a: number, b: number };
        const module1 = { a: () => 1 } satisfies Module<Ctx>;
        const module2 = { b: () => 1 } satisfies Module<Ctx>;
        const ctr = inject(module1, module2);
        assertType<Is<typeof ctr, Ctx>>();
        expect(ctr).toEqual({ a: 1, b: 1 });
    });

    it('should be totally defined given two type parameters', () => {
        type Ctx = { a: number, b: number };
        // @ts-expect-error Property 'b' is missing in type '{ a: () => number; }' but required in type '{ a: Factory<{ a: number; b: number; }, number>; b: Factory<{ a: number; b: number; }, number>; }'.ts(1360)
        const module1 = { a: () => 1 } satisfies Module<Ctx, Ctx>;
        const module2 = { a: () => 1, b: () => 1 } satisfies Module<Ctx, Ctx>;
        const ctr = inject(module2);
        assertType<Is<typeof ctr, Ctx>>();
        expect(ctr).toEqual({ a: 1, b: 1 });
    });

    it('should augment the context type if additional dependencies are provided given one type parameter', () => {
        type Ctx = { a: number };
        const module1 = { a: () => 1 } satisfies Module<Ctx>;
        const module2 = { a: () => 2 } satisfies Module<Ctx>;
        const ctr = inject(module1, module2);
        assertType<Is<typeof ctr, Ctx>>();
        expect(ctr).toEqual({ a: 2 });
    });

    it('should prevent providing additional dependencies given two type parameters', () => {
        type Ctx = { a: number };
        // @ts-expect-error Object literal may only specify known properties, and 'b' does not exist in type '{ a: Factory<{ a: number; }, number>; }'.ts(1360)
        const module = { a: () => 1, b: () => 1 } satisfies Module<Ctx, Ctx>;
        const ctr = inject(module);
        assertType<Is<typeof ctr, { a: number, b: number }>>();
        expect(ctr).toEqual({ a: 1, b: 1 });
    });

});

describe('The inject result', () => {

    it('is possible to add a property to a container and it does not affect the module', () => {
        type M = { a: () => number, b?: () => number };
        const module: M = { a: () => 1 };
        const ctr = inject(module);
        ctr.b = 1
        expect(ctr.b).toBe(1);
        expect(module.b).toBeUndefined()
    });

    it('is possible to add a property to a module and it does not affect the container', () => {
        type M = { a: () => number, b?: () => number };
        const module: M = { a: () => 1 };
        const ctr = inject(module);
        module.b = () => 1;
        expect(module.b()).toBe(1);
        expect(ctr.b).toBeUndefined();
    });

    it('is not possible to delete a property of a container', () => {
        type M = { a?: () => number };
        const module: M = { a: () => 1 };
        const ctr = inject(module);
        expect(() => delete ctr.a).toThrowError("'deleteProperty' on proxy: trap returned falsish for property 'a'");
        expect(ctr.a).toBe(1);
        expect(module.a!()).toBe(1);
    });

    it('is possible to delete a property of a module and it does not affect the container', () => {
        type M = { a?: () => number };
        const module: M = { a: () => 1 };
        const ctr = inject(module);
        delete module.a;
        expect(ctr.a).toBe(1);
        expect(module.a).toBeUndefined();
    });

    it('is possible to modify a property of a container and it does not affect the module', () => {
        const module = { a: () => 1 };
        const ctr = inject(module);
        ctr.a = 2;
        expect(ctr.a).toBe(2);
        expect(module.a()).toBe(1);
    });

    it('is possible to modify a property of a module and it does not affect the container', () => {
        const module = { a: () => 1 };
        const ctr = inject(module);
        module.a = () => 2;
        expect(module.a()).toBe(2);
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

    it('should not contain an undefined dependency', () => {
        const ctr = inject({
            a: () => true,
            b: () => 1
        });
        expect(ctr.a).toBe(true);
        expect(ctr.b).toBe(1);
        expect((ctr as any).c).toBeUndefined();
    });

});

describe('The inject function', () => {

    it('should handle a module of type any', () => {
        const module: any = null;
        expect(() => inject(module)).toThrowError('Cannot convert undefined or null to object');
    });

    it('should handle a modules array of type any', () => {
        const modules: any = null;
        expect(() => inject(...modules)).toThrowError('modules is not iterable (cannot read property null)');
    });

    it('should not accept a module of type unknown', () => {
        const module: unknown = null;
        // @ts-expect-error
        expect(() => inject(module)).toThrowError('Cannot convert undefined or null to object');
    });

    it('should not accept a module of type never', () => {
        const module: never = null as unknown as never;
        expect(() => inject(module)).toThrowError('Cannot convert undefined or null to object');
    });

    it('should not accept undefined', () => {
        // @ts-expect-error
        expect(() => inject(undefined)).toThrowError();
    });

    it('should not accept null', () => {
        // @ts-expect-error
        expect(() => inject(null)).toThrowError();
    });

    it('should not accept boolean true', () => {
        // @ts-expect-error
        expect(inject(true)).toEqual({});
    });

    it('should not accept number 1', () => {
        // @ts-expect-error
        expect(inject(1)).toEqual({});
    });

    it('should not accept empty string', () => {
        // @ts-expect-error
        expect(inject('')).toEqual({});
    });

    it('should not accept an object without a factory', () => {
        // @ts-expect-error
        expect(() => inject({ a: 1 })).toThrowError();
    });

    it('should not accept an object with a symbol key', () => {
        // @ts-expect-error
        expect(inject({ [Symbol()]: 1 })).toEqual({});
    });

    it('should rebind 1 to undefined', () => {
        // @ts-expect-error
        const actual = inject({ a: () => undefined }, { a: () => 1 });
        assertType<Is<typeof actual, DjinjectError<{ dependency_conflicts: ['a'] }>>>();
        expect(actual).toEqual({ a: 1 });
    });

    it('should rebind undefined to 1', () => {
        // @ts-expect-error
        const actual = inject({ a: () => 1 }, { a: () => undefined });
        assertType<Is<typeof actual, DjinjectError<{ dependency_conflicts: ['a'] }>>>();
        expect(actual).toEqual({ a: undefined });
    });

    it('should rebind a required string to an optional string', () => {
        type OptionalString = { s?: string };
        type RequiredString = { s: string };
        const module1 = { } satisfies Module<OptionalString>;
        const module2 = { s: () => '' } satisfies Module<RequiredString>;
        const actual = inject(module1, module2);
        const expected = { s: '' };
        assertType<Is<typeof actual, typeof expected>>();
        expect(actual).toEqual(expected);
    });

    it('should consider inheritance when rebinding dependencies', () => {

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

        type C1 = {
            groupA: {
                service1: A
            }
        }

        type C2 = {
            groupB: {
                groupC: {
                    service2: A
                }
            }
        }

        const m1 = {
            groupA: {
                service1: () => new A()
            }
        } satisfies Module<C1>;

        const m2 = {
            groupB: {
                groupC: {
                    service2: () => new A()
                }
            }
        } satisfies Module<C2>;

        const m3 = { // intentionally not declared as Module<C3>
            groupB: {
                groupC: {
                    service2: (ctx: C1) => new B(ctx.groupA.service1)
                }
            },
            x: () => 1
        };

        const ctr = inject(m1, m2, m3);

        assertType<Is<typeof ctr.groupA.service1, A>>();
        assertType<Is<typeof ctr.groupB.groupC.service2, B>>();
        assertType<Is<typeof ctr.x, number>>();

        expect(ctr.groupA.service1).toBeInstanceOf(A);
        expect(ctr.groupB.groupC.service2).toBeInstanceOf(B);
        expect(ctr.x).toBe(1);

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
        const module = {
            hi: () => 'Hi!',
            sayHi: (ctx) => () => ctx.hi
        } satisfies Module<Services>;
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

    it('should infer the type of factories of mergable modules', () => {
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

    it('should infer the general string type when merging string factories', () => {
        const ctr = inject({ a: { b: () => '' as string } }, { a: { b: () => '' }});
        type Actual = typeof ctr;
        type Expected = { a: { b: string } };
        assertType<Is<Actual, Expected>>();
    });

    it('should infer the special string type when merging () => string factories because functions return types are covariant', () => {
        const ctr = inject({ a: { b: () => () => '' } }, { a: { b: () => () => '' }});
        type Actual = typeof ctr;
        type Expected = { a: { b: () => string } };
        assertType<Is<Actual, Expected>>();
    });

    it('should infer the type of curried factories of non-mergable modules', () => {
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
                c: () => () => 'salut'
            }
        });
        assertType<Is<typeof container.a, number>>();
        assertType<Is<typeof container.b.c, () => string>>();
        assertType<Is<typeof container.d.e, B>>();
    });

    it('should detect type conflicts when merging curried functions', () => {
        type A = {
            f: (a: number) => number
            g: (a: A) => number
        };
        type B = {
            f: (a: string) => string
            g: (a: B) => string
        };
        const ma = {
            f: () => (a: number) => a,
            g: () => (a: A) => a.f(0)
        } satisfies Module<A>;
        const mb = {
            f: () => (a: string) => a,
            g: () => (b: B) => b.f('')
        } satisfies Module<B>;
        // @ts-expect-error
        const ctr = inject(ma, mb);
        type Actual = typeof ctr;
        type Expected = DjinjectError<{
            dependency_conflicts: ['f', 'g']
        }>
        assertType<Is<Actual, Expected>>();
    });

    it('should rebind dependencies using a partial module', () => {
        type A = {
            a: {
                b: number
                c: number
            }
        };
        const module = {
            a: {
                b: () => 1,
                c: () => 1
            }
        } satisfies Module<A>;
        const partialModule = {
            a: {
                c: () => 2
            }
        } satisfies Module<A>;
        const ctr: A = inject(module, partialModule);
        expect(ctr.a.b).toBe(1);
        expect(ctr.a.c).toBe(2);
    });

    it('should inject dependencies using partial modules only', () => {
        type A = {
            a: {
                b: number
                c: number
            }
        };
        const partialModule1 = {
            a: {
                b: () => 1
            }
        } satisfies Module<A>;
        const partialModule2 = {
            a: {
                c: (ctx) => ctx.a.b + 1
            }
        } satisfies Module<A>;
        const ctr: A = inject(partialModule1, partialModule2);
        expect(ctr.a.b).toBe(1);
        expect(ctr.a.c).toBe(2);
    });

    it('should detect incomplete partial modules', () => {
        type A = {
            a: {
                b: number
                c: number
            }
        };
        const partialModule = {
            a: {
                c: () => 1
            }
        } satisfies Module<A>;
        // @ts-expect-error Property 'b' is missing in type '{ c: number; }' but required in type '{ b: number; c: number; }'.
        const ctr: A = inject(partialModule);
    });

});

describe('Check inject function arguments', () => {

    it('should allow a context of type any', () => {
        type Actual = Container<[{
            f: (ctx: any) => 1
        }]>;
        type Expected = { f: 1 };
        assertType<Is<Actual, Expected>>();
    });

    it('should identify a context property as missing', () => {
        type Actual = Container<[{
            f: (ctx: { b: 1 }) => 1
        }]>;
        type Expected = DjinjectError<{
            missing_dependencies: ['b'];
        }>;
        assertType<Is<Actual, Expected>>();
    });

    it('should identify a plain property of type never as conflicting', () => {
        type Actual = Container<[{
            f: (ctx: { b: never }) => 1
        }]>;
        type Expected = DjinjectError<{
            context_conflicts: ['b']
            missing_dependencies: ['b']
        }>;
        assertType<Is<Actual, Expected>>();
    });

    it('should identify a deep property of type never as missing', () => {
        type Actual = Container<[{
            f: (ctx: {
                b: {
                    c: {
                        d: never
                    }
                }
            }) => 1
        },]>;
        type Expected = DjinjectError<{
            context_conflicts: ['b.c.d']
            missing_dependencies: ['b.c.d']
        }>;
        assertType<Is<Actual, Expected>>();
    });

    it('should identify a deep property of type string as missing', () => {
        type Actual = Container<[{
            f: (ctx: {
                b: {
                    c: {
                        d: string
                    }
                }
            }) => 1
        },]>;
        type Expected = DjinjectError<{
            missing_dependencies: ['b.c.d']
        }>;
        assertType<Is<Actual, Expected>>();
    });

    it('should identify two deep properties of type never as missing', () => {
        type Actual = Container<[{
            f: (ctx: {
                b: {
                    c: {
                        d: never
                    }
                    e: {
                        f: never
                    }
                }
            }) => 1
        }]>;
        type Expected = DjinjectError<{
            context_conflicts: ['b.c.d', 'b.e.f']
            missing_dependencies: ['b.c.d', 'b.e.f']
        }>;
        assertType<Is<Actual, Expected>>();
    });

    it('should identify a merged property of type never as missing', () => {
        // { b: boolean } and { b: string} = { b: never }
        type Actual = Container<[{
            f: (ctx: { b: boolean }) => 1
        }, {
            g: (ctx: { b: string }) => 1
        }]>;
        type Expected = DjinjectError<{
                context_conflicts: ['b']
                missing_dependencies: ['b']
        }>;
        assertType<Is<Actual, Expected>>();
    });

    it('should error if two factories require different types of the same dependency', () => {
        type Actual = Container<[{
            a: (ctx: { b: boolean }) => boolean
        }, {
            b: (ctx: { b: string }) => string
        }]>;
        type Expected = DjinjectError<{
            context_conflicts: ['b']
        }>;
        assertType<Is<Actual, Expected>>();
    });

    it('should identify missing container property required by a context', () => {
        type Actual = Container<[{
            f: (ctx: { b: boolean }) => 1
        }]>;
        type Expected = DjinjectError<{
            missing_dependencies: ['b']
        }>;
        assertType<Is<Actual, Expected>>();
    });

    it('should remove a missing dependency by adding another module', () => {
        // no missing dependency because the new f does not need { b: boolean } anymore
        type Actual = Container<[{
            f: (ctx: { b: boolean }) => 1
        }, {
            f: () => 1
        }]>;
        type Expected = {
            f: 1
        };
        assertType<Is<Actual, Expected>>();
    });

    it('should not check factory return types', () => {
        // { f: () => number } and { f: () => string } = { f: () => never }
        type Actual = Container<[{
            f: () => 1
        }, {
            f: () => ''
        }]>;
        type Expected = DjinjectError<{
            dependency_conflicts: ['f']
        }>;
        assertType<Is<Actual, Expected>>();
    });

    it('should show multiple check errors', () => {
        type Actual = Container<[{
            f: (ctx: { b: boolean }) => 1
        }, {
            f: (ctx: { a: number, b: string }) => ''
        }]>;
        // especially, the different types of b are irrelevant
        // because the second module overwrites the context used by f
        type Expected = DjinjectError<{
            dependency_conflicts: ['f'],
            missing_dependencies: ['a', 'b']
        }>;
        assertType<Is<Actual, Expected>>();
    });

    it('should recognize dependency type conflict between 1) container and 2) context when using two modules', () => {
        type Actual = Container<[{
            a: () => number // 1) a is a number in the container
        }, {
            f: (ctx: { a: string }) => void // 2) a is a string in the context
        }]>;
        type Expected = DjinjectError<{
            context_conflicts: ['a']
        }>;
        assertType<Is<Actual, Expected>>();
    });

    it('should recognize dependency type conflict between 1) context and 2) container when using two modules', () => {
        type Actual = Container<[{
            f: (ctx: { a: string }) => void // 1) a is a string in the context
        }, {
            a: () => number // 2) a is a number in the container
        }]>;
        type Expected = DjinjectError<{
            context_conflicts: ['a']
        }>;
        assertType<Is<Actual, Expected>>();
    });

    it('should check generic type parameters', () => {
        type Testee<T> = Container<[{ _: () => T }]>;
        type Actual= Testee<1>;
        type Expected = { _: 1 };
        assertType<Is<Actual, Expected>>();
    });

    it('should check factory returning any', () => {
        type Actual= Container<[{ _: () => any }]>;
        type Expected = { _: any };
        assertType<Is<Actual, Expected>>();
    });

    it('should check factory returning unknown', () => {
        type Actual= Container<[{ _: () => unknown }]>;
        type Expected = { _: unknown };
        assertType<Is<Actual, Expected>>();
    });

    it('should check factory returning never', () => {
        type Actual= Container<[{ _: () => never }]>;
        type Expected = DjinjectError<{
            dependency_conflicts: ['_']
        }>;
        assertType<Is<Actual, Expected>>();
    });

});

describe('The dependency initialization', () => {

    it('should be lazy by default', () => {
        let actual = false;
        inject({ p: () => { actual = true; }});
        expect(actual).toBeFalsy();
    });

    it('should eagerly initialize a value', () => {
        let actual = false;
        inject({ p: init(() => { actual = true; })});
        expect(actual).toBeTruthy();
    });

    it('should eagerly initialize a group', () => {
        let actual = false;
        inject({ g1: init({
            p: () => { actual = true; }
        })});
        expect(actual).toBeTruthy();
    });

    it('should not eagerly initialize a module', () => {
        let actual = false;
        const module = { p: () => { actual = true; }};
        inject(init(module));
        expect(actual).toBeFalsy();
    });

    it('should not eagerly initialize the whole container', () => {
        let actual = false;
        const modules = [{ p: () => { actual = true; }}];
        expect(() => inject(...init(modules))).toThrowError();
        expect(actual).toBeFalsy();
    });

    it('should not affect lazy initializers if eager', () => {
        let actual1 = false;
        let actual2 = false;
        inject({
            p1: init(() => { actual1 = true; }),
            p2: () => { actual2 = true }
        });
        expect(actual1).toBeTruthy();
        expect(actual2).toBeFalsy();
    });

    it('should be idempotent when calling init twice', () => {
        const f = () => {};
        const g = init(f);
        expect(g).not.toEqual(f);
        expect(init(g)).toBe(g);
    });

});

describe('A generic dependency type', () => {

    it('does not work with jdinject', () => {
        function provide<T>(t: T): void {
            const module = { _: () => t };
            // @ts-expect-error
            const ctr = inject(module);
            // @ts-expect-error Type 'boolean' is not assignable to type 'true'. ts(2344)
            assertType<Extends<typeof ctr, any>>;
        }
    });

});

describe('A non-cyclic dependency', () => {

    it('should be callable', () => {
        expect(
            inject({ dep: () => () => true }).dep()
        ).toBe(true);
    });

    it('should be constructable', () => {
        class A {}
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
        constructor(ctx: API<T>) {
            this.a = () => ctx.a;
        }
    }

    function createCycle<T>(testee: T): API<T> {
        return inject({
            a: ({ b }: API<T>) => new A(b, testee),
            b: (ctx: API<T>) => new B(ctx)
        });
    }

    function createA<T>(testee: T): A<T> {
        const ctx = createCycle(testee);
        ctx.a; // initializes cycle
        return ctx.b.a();
    }

});

describe('The cycle detection', () => {

    it('should allow cycles in class constructors', () => {
        interface API { a: A, b: B }
        class A {
            b: B;
            constructor({ b }: API) { this.b = b; }
        }
        class B {
            a: () => A;
            constructor(ctx: API) { this.a = () => ctx.a; }
        }
        expect(() =>
            inject({ a: (ctx: API) => new A(ctx), b: (ctx: API) => new B(ctx) }).a
        ).not.toThrow();
    });

    it('should allow cycles in functions', () => {
        type API = { a: A, b: B }
        type A = { b: B }
        type B = { a: () => A }
        const createA = ({ b }: API) => ({ b });
        const createB = (ctx: API) => ({ a: () => ctx.a });
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
        ).toThrowError('Cyclic dependency [a]. See https://djinject.io/#cyclic-dependencies');
    });

    it('should throw when cyclic dependency is accessed during factory function call', () => {
        interface API { a: { a: boolean }, b: { b: boolean } }
        const createA = ({ b }: API) => ({ a: b.b });
        const createB = ({ a }: API) => ({ b: a.a });
        expect(() =>
            inject({ a: createA, b: createB }).a
        ).toThrowError('Cyclic dependency [a]. See https://djinject.io/#cyclic-dependencies');
    });

});

describe('Internal module merging', () => {

    describe('special types', () => {

        it('should merge generic types', () => {
            type Id<T extends Module> = Is<Container<[T, T]>, Container<[T]>>;
            assertType<Id<{}>>();
            assertType<Id<{ a: () => number }>>();
            assertType<Id<{ a: { b: () => () => number } }>>();
        });

        it('should merge modules in the presence of any', () => {
            assertType<Is<Container<[any, any]>, any>>();
            assertType<Is<Container<[any, { a: () => 1 }]>, any>>();
            assertType<Is<Container<[{ a: () => 1 }, any]>, any>>();
        });

        it('CAUTION: is merging non-modules in the presence of any', () => {
            assertType<Is<Container<[any, () => 1]>, any>>();
            assertType<Is<Container<[() => 1, any]>, any>>();
        });

        it('should merge modules in the presence of never', () => {
            assertType<Is<Container<[never, never]>, never>>();
            assertType<Is<Container<[never, { a: () => 1 }]>, never>>();
            assertType<Is<Container<[{ a: () => 1 }, never]>, never>>();
        });

    });

    describe('object types', () => {

        describe('undefined properties', () => {

            it('should merge empty objects', () => {
                type Actual = Container<[{}, {}]>;
                type Expected = {};
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: 1 with target: non-existing property', () => {
                type Actual = Container<[{ a: () => 1 }, {}]>;
                type Expected = { a: 1 };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: optional prtoperty with target: non-existing property', () => {
                type Actual = Container<[{ a?: () => 1 }, {}]>;
                type Expected = { a?: 1 | undefined };
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: number with target: optional number', () => {
                type Actual = Container<[{ a: () => number }, { a?: () => number }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: optional number with target: optional number', () => {
                type Actual = Container<[{ a?: () => number }, { a?: () => number }]>;
                type Expected = { a?: number };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: optional number with target: number', () => {
                type Actual = Container<[{ a?: () => number }, { a: () => number }]>;
                type Expected = { a: number };
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: 1 with target: optional number', () => {
                type Actual = Container<[{ a: () => 1 }, { a?: () => number }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: optional 1 with target: optional number', () => {
                type Actual = Container<[{ a?: () => 1 }, { a?: () => number }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: number with target: undefined', () => {
                type Actual = Container<[{ a: () => number }, { a: () => undefined }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: undefined with target: number', () => {
                type Actual = Container<[{ a: () => undefined }, { a: () => number }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: 1 with target: undefined', () => {
                type Actual = Container<[{ a: () => 1 }, { a: () => undefined }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: undefined with target: 1', () => {
                type Actual = Container<[{ a: () => undefined }, { a: () => 1 }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

        });

        describe('null properties', () => {

            it('should merge source: null with target: non-existing property', () => {
                type Actual = Container<[{ a: () => null }, {}]>;
                type Expected = { a: null };
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: 1 with target: null', () => {
                type Actual = Container<[{ a: () => 1 }, { a: () => null }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: null with target: 1', () => {
                type Actual = Container<[{ a: () => null }, { a: () => 1 }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: 1 with target: nullable number', () => {
                type Actual = Container<[{ a: () => 1 }, { a: () => number | null }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: nullable 1 with target: nullable number', () => {
                type Actual = Container<[{ a: () => 1 | null }, { a: () => number | null }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: nullable number with target: nullable 1', () => {
                type Actual = Container<[{ a: () => number | null }, { a: () => 1 | null }]>;
                type Expected = { a: 1 | null }; // intersection of Source and Target because number does not extend 1
                assertType<Is<Actual, Expected>>();
            });

        });

        describe('boolean properties', () => {

            it('should merge non-empty source with empty target', () => {
                type Actual = Container<[{ a: () => true }, {}]>;
                type Expected = { a: true };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge empty source with non-empty target', () => {
                type Actual = Container<[{}, { a: () => true }]>;
                type Expected = { a: true };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge non-empty types having different properties', () => {
                type Actual = Container<[{ a: () => true }, { b: () => false }]>;
                type Expected = { a: true, b: false };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: true with target: boolean, in the presence of distinct properties', () => {
                type Actual = Container<[{ a: () => true, b: () => number }, { a: () => boolean, c: () => string }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: boolean with target: true, in the presence of distinct properties', () => {
                type Actual = Container<[{ a: () => boolean, b: () => number }, { a: () => true, c: () => string }]>;
                type Expected = { a: true, b: number, c: string }; // a: true is the only source a: boolean that extends the target a: true
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: true with target: true', () => {
                type Actual = Container<[{ a: () => true }, { a: () => true }]>;
                type Expected = { a: true };
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: true with target: false', () => {
                type Actual = Container<[{ a: () => true }, { a: () => false }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: boolean with target: boolean', () => {
                type Actual = Container<[{ a: () => boolean }, { a: () => boolean }]>;
                type Expected = { a: boolean };
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: boolean with target: undefined', () => {
                type Actual = Container<[{ a: () => boolean }, { a: () => undefined }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: boolean with target: null', () => {
                type Actual = Container<[{ a: () => boolean }, { a: () => null }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: boolean with target: number', () => {
                type Actual = Container<[{ a: () => boolean }, { a: () => number }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: boolean with target: string', () => {
                type Actual = Container<[{ a: () => boolean }, { a: () => string }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: boolean with target: any[]', () => {
                type Actual = Container<[{ a: () => boolean }, { a: () => any[] }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: boolean with target: object', () => {
                type Actual = Container<[{ a: () => boolean }, { a: () => object }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: boolean with target: {}', () => {
                type Actual = Container<[{ a: () => boolean }, { a: () => ({}) }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: {} with target: boolean', () => {
                type Actual = Container<[{ a: () => {} }, { a: () => boolean }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

        });

        describe('number properties', () => {

            it('should merge non-empty source with empty target', () => {
                type Actual = Container<[{ a: () => 1 }, {}]>;
                type Expected = { a: 1 };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge empty source with non-empty target', () => {
                type Actual = Container<[{}, { a: () => 1 }]>;
                type Expected = { a: 1 };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge non-empty types having different properties', () => {
                type Actual = Container<[{ a: () => 1 }, { b: () => 2 }]>;
                type Expected = { a: 1, b: 2 };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: 1 with target: number, in the presence of distinct properties', () => {
                type Actual = Container<[{ a: () => 1, b: () => boolean }, { a: () => number, c: () => string }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: number with target: 1, in the presence of distinct properties', () => {
                type Actual = Container<[{ a: () => number, b: () => boolean }, { a: () => 1, c: () => string }]>;
                type Expected = { a: 1, b: boolean, c: string };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: 1 with target: 1', () => {
                type Actual = Container<[{ a: () => 1 }, { a: () => 1 }]>;
                type Expected = { a: 1 };
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: 1 with target: 2', () => {
                type Actual = Container<[{ a: () => 1 }, { a: () => 2 }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: number with target: number', () => {
                type Actual = Container<[{ a: () => number }, { a: () => number }]>;
                type Expected = { a: number };
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: number with target: undefined', () => {
                type Actual = Container<[{ a: () => number }, { a: () => undefined }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: number with target: null', () => {
                type Actual = Container<[{ a: () => number }, { a: () => null }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: number with target: boolean', () => {
                type Actual = Container<[{ a: () => number }, { a: () => boolean }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: number with target: string', () => {
                type Actual = Container<[{ a: () => number }, { a: () => string }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: number with target: any[]', () => {
                type Actual = Container<[{ a: () => number }, { a: () => any[] }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: number with target: object', () => {
                type Actual = Container<[{ a: () => number }, { a: () => object }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: number with target: {}', () => {
                type Actual = Container<[{ a: () => number }, { a: () => ({}) }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: {} with target: number', () => {
                type Actual = Container<[{ a: () => {} }, { a: () => number }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

        });

        describe('string properties', () => {

            it('should merge non-empty source with empty target', () => {
                type Actual = Container<[{ a: () => '' }, {}]>;
                type Expected = { a: '' };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge empty source with non-empty target', () => {
                type Actual = Container<[{}, { a: () => '' }]>;
                type Expected = { a: '' };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge non-empty types having different properties', () => {
                type Actual = Container<[{ a: () => 'a' }, { b: () => 'b' }]>;
                type Expected = { a: 'a', b: 'b' };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: "a" with target: string, in the presence of distinct properties', () => {
                type Actual = Container<[{ a: () => 'a', b: () => boolean }, { a: () => string, c: () => string }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: string with target: "a", in the presence of distinct properties', () => {
                type Actual = Container<[{ a: () => string, b: () => boolean }, { a: () => 'a', c: () => string }]>;
                type Expected = { a: 'a', b: boolean, c: string };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: "a" with target: "a"', () => {
                type Actual = Container<[{ a: () => 'a' }, { a: () => 'a' }]>;
                type Expected = { a: 'a' };
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: "a" with target: "b"', () => {
                type Actual = Container<[{ a: () => 'a' }, { a: () => 'b' }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: string with target: string', () => {
                type Actual = Container<[{ a: () => string }, { a: () => string }]>;
                type Expected = { a: string };
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: string with target: undefined', () => {
                type Actual = Container<[{ a: () => string }, { a: () => undefined }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: string with target: null', () => {
                type Actual = Container<[{ a: () => string }, { a: () => null }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: string with target: boolean', () => {
                type Actual = Container<[{ a: () => string }, { a: () => boolean }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: string with target: number', () => {
                type Actual = Container<[{ a: () => string }, { a: () => number }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: string with target: any[]', () => {
                type Actual = Container<[{ a: () => string }, { a: () => any[] }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: string with target: object', () => {
                type Actual = Container<[{ a: () => string }, { a: () => object }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: string with target: {}', () => {
                type Actual = Container<[{ a: () => string }, { a: () => ({}) }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: {} with target: string', () => {
                type Actual = Container<[{ a: () => ({}) }, { a: () => string }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

        });

        describe('array properties', () => {

            it('should merge non-empty source with empty target', () => {
                type Actual = Container<[{ a: () => [] }, {}]>;
                type Expected = { a: [] };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge empty source with non-empty target', () => {
                type Actual = Container<[{}, { a: () => [] }]>;
                type Expected = { a: [] };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge non-empty types having different properties', () => {
                type Actual = Container<[{ a: () => ['a'] }, { b: () => ['b'] }]>;
                type Expected = { a: ['a'], b: ['b'] };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: ["a"] with target: [string], in the presence of distinct properties', () => {
                type Actual = Container<[{ a: () => ['a'], b: () => boolean }, { a: () => [string], c: () => string }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: [string] with target: ["a"], in the presence of distinct properties', () => {
                type Actual = Container<[{ a: () => [string], b: () => boolean }, { a: () => ['a'], c: () => string }]>;
                type Expected = { a: ['a'], b: boolean, c: string };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: ["a"] with target: ["a"]', () => {
                type Actual = Container<[{ a: () => ['a'] }, { a: () => ['a'] }]>;
                type Expected = { a: ['a'] };
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: ["a"] with target: ["b"]', () => {
                type Actual = Container<[{ a: () => ['a'] }, { a: () => ['b'] }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: [string] with target: [string]', () => {
                type Actual = Container<[{ a: () => [string] }, { a: () => [string] }]>;
                type Expected = { a: [string] };
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: [string] with target: [undefined]', () => {
                type Actual = Container<[{ a: () => [string] }, { a: () => [undefined] }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: [string] with target: [null]', () => {
                type Actual = Container<[{ a: () => [string] }, { a: () => [null] }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: [string] with target: [boolean]', () => {
                type Actual = Container<[{ a: () => [string] }, { a: () => [boolean] }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: [string] with target: [number]', () => {
                type Actual = Container<[{ a: () => [string] }, { a: () => [number] }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: [string] with target: any[]', () => {
                type Actual = Container<[{ a: () => [string] }, { a: () => any[] }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: any[] with target: [string]', () => {
                type Actual = Container<[{ a: () => any[] }, { a: () => [string] }]>;
                type Expected = { a: [string] };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: [string] with target: object', () => {
                type Actual = Container<[{ a: () => [string] }, { a: () => object }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: [string] with target: {}', () => {
                type Actual = Container<[{ a: () => [string] }, { a: () => ({}) }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge source: {} with target: [string]', () => {
                type Actual = Container<[{ a: () => ({}) }, { a: () => [string] }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a'];
                }>;
                assertType<Is<Actual, Expected>>();
            });

        });

        describe('function properties', () => {

            it('should merge source: Fn with target: () => void', () => {
                type Actual = Container<[{ a: () => (...args: any[]) => any }, { a: () => () => void }]>;
                type Expected = { a: () => void };
                assertType<Is<Actual, Expected>>();
            });

            it('should merge source: () => void with target: Fn', () => {
                type Actual = Container<[{ a: () => () => void }, { a: () => (...args: any[]) => any }]>;
                type Expected = { a: (...args: any[]) => any };
                assertType<Is<Actual, Expected>>();
            });

        });

        describe('object properties', () => {

            it('should merge deep properties that are assignable', () => {
                type Actual = Container<[{ a: () => { b: 1 } }, { a: () => { b: number } }]>;
                type Expected = DjinjectError<{
                    dependency_conflicts: ['a.b']
                }>;
                assertType<Is<Actual, Expected>>();
            });

            it('should not merge deep properties that aren\'t assignable', () => {
                type Actual = Container<[{ a: () => { b: number } }, { a: () => { b: 1 } }]>;
                type Expected = { a: { b: 1 } };
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
                const module1 = {
                    a: () => A,
                    b: {
                        c: () => false,
                        e: () => fn1,
                        f: () => [1]
                    }
                };
                const module2 = {
                    a: () => B,
                    b: {
                        c: () => true,
                        e: () => fn2,
                        f: () => [2, 3]
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
                type Actual = Container<[typeof module1, typeof module2]>;
                type Expected = typeof expected;
                assertType<Is<Actual, Expected>>();
                expect(inject(module1, module2)).toEqual(expected);
            });

        });

    });

});
