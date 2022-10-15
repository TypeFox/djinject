/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { describe, it } from 'vitest'
import { assert as tsafeAssert, Equals } from 'tsafe';
import { ReflectContainer, Validate } from '../src/types';

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

    it('should declare a plain property of type never as missing', () => {
        type Actual = Validate<[{
            f: (ctx: { b: never }) => 1
        },]>;
        type Expected = {
            ginject_error: {
                message: "Missing dependency";
                docs: "https://ginject.io/#context";
                missing_dependencies: ['b'];
            }
        };
        tsafeAssert<Equals<Actual, Expected>>();
    });

    it('should declare a deep property of type never as missing', () => {
        type Actual = Validate<[{
            f: (ctx: {
                b: {
                    c: {
                        d: never
                    }
                }
            }) => 1
        },]>;
        type Expected = {
            ginject_error: {
                message: "Missing dependency";
                docs: "https://ginject.io/#context";
                missing_dependencies: ['b.c.d'];
            }
        };
        tsafeAssert<Equals<Actual, Expected>>();
    });

    it('should declare two deep properties of type never as missing', () => {
        type Actual = Validate<[{
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
        },]>;
        type Expected = {
            ginject_error: {
                message: "Missing dependency";
                docs: "https://ginject.io/#context";
                missing_dependencies: ['b.c.d', 'b.e.f'];
            }
        };
        tsafeAssert<Equals<Actual, Expected>>();
    });

    it('should identify a merged property of type never as missing', () => {
        // { b: boolean } and { b: string} = { b: never }
        type Actual = Validate<[{
            f: (ctx: { b: boolean }) => 1
        }, {
            g: (ctx: { b: string }) => 1
        }]>;
        type Expected = {
            ginject_error: {
                message: "Missing dependency";
                docs: "https://ginject.io/#context";
                missing_dependencies: ['b'];
            }
        };
        tsafeAssert<Equals<Actual, Expected>>();
    });

    it('should error if two factories require different types of the same dependency', () => {
        type Actual = Validate<[{
            a: (ctx: { b: boolean }) => boolean
        }, {
            b: (ctx: { b: string }) => string
        }]>;
        type Expected = {
            ginject_error: {
                message: "Missing dependency";
                docs: "https://ginject.io/#context";
                missing_dependencies: ['b'];
            }
        };
        tsafeAssert<Equals<Actual, Expected>>();
    });

    it('should identify missing container property required by a context', () => {
        type Actual = Validate<[{
            f: (ctx: { b: boolean }) => 1
        }]>;
        type Expected = {
            ginject_error: {
                message: "Missing dependency";
                docs: "https://ginject.io/#context";
                missing_dependencies: ['b'];
            }
        };
        tsafeAssert<Equals<Actual, Expected>>();
    });

    it('should provide a missing dependency by adding another module', () => {
        // no missing dependency because the new f does not need { b: boolean } anymore
        type Actual = Validate<[{
            f: (ctx: { b: boolean }) => 1
        }, {
            f: () => 1
        }]>;
        type Expected = [{
            f: (ctx: {
                b: boolean;
            }) => 1;
        }, {
            f: () => 1;
        }];
        tsafeAssert<Equals<Actual, Expected>>();
    });

    // TODO(@@dd): feature request: return validation error in this case
    it('should not validate factory return types', () => {
        // { f: () => number } and { f: () => string } = { f: () => never }
        type Actual = Validate<[{
            f: () => 1
        }, {
            f: () => ''
        }]>;
        type Expected = [{
            f: () => 1;
        }, {
            f: () => '';
        }];
        tsafeAssert<Equals<Actual, Expected>>();
    });

    // TODO(@@dd): deeply validate properties

});
