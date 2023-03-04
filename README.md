<div id="djinject-logo" align="center">
  <a href="https://github.com/langium/djinject">
    <img alt="Djinject Logo" width="450" src="https://user-images.githubusercontent.com/743833/197622552-e613a4cc-bfd7-4757-b8ef-7679249e109f.png">
  </a>
  <h3>
    Dependency injection done right.
  </h3>
</div>

<div id="badges" align="center">

[![npm version](https://img.shields.io/npm/v/djinject?logo=npm&style=flat-square)](https://www.npmjs.com/package/djinject/)
[![build](https://img.shields.io/github/actions/workflow/status/langium/djinject/build.yml?branch=main&logo=github&style=flat-square)](https://github.com/langium/djinject/actions/workflows/build.yml)
[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod&style=flat-square)](https://gitpod.io/#https://github.com/langium/djinject)

</div>

<br>

**Djinject** empowers developers designing decoupled applications and frameworks. **Djinject**'s main goal is increasing the developer experience by offering a tiny, yet powerful API, keeping dependencies in central module definitions and by using TypeScript's type system to restrain runtime challenges.

<div id="djinject vs inversify" align="center">

|                  |   djinject  |  inversify  |
|------------------|:----------:|:-----------:|
| minified         | [![minified size](https://img.shields.io/bundlephobia/min/djinject?label=&style=flat-square)](https://bundlephobia.com/result?p=djinject@latest) | [![minified size](https://img.shields.io/bundlephobia/min/inversify?label=&style=flat-square)](https://bundlephobia.com/result?p=inversify@latest) |
| minzipped        | [![minzipped size](https://img.shields.io/bundlephobia/minzip/djinject?label=&style=flat-square)](https://bundlephobia.com/result?p=djinject@latest) | [![minzipped size](https://img.shields.io/bundlephobia/minzip/inversify?label=&style=flat-square)](https://bundlephobia.com/result?p=inversify@latest) |
| typesafe         |      ✅    |      ❌      |
| requirements     |    none    | decorators  |
| style            | functional | imperative  |
| API surface area |    tiny    | non-trivial |

</div>

## Features

* type-safe
* tiny footprint
* property injection
* rebinding dependencies
* dependency cycle detection
* lazy and eager initialization
* no magic, no global state
* no decorators
* no dependencies
* no configuration
* no boilerplate

## Quickstart

The first step is to add **djinject** to your application.

```sh
npm i djinject
```

Bascially, the only thing needed is to define **modules** of **factories** and finally call **inject**. The resulting **container** provides concrete **instances**.

```ts
import { inject } from 'djinject';

// create an inversion of control container
const container = inject({
    hi: () => 'Hi',
    sayHi: () => (name: string) => `${container.hi} ${name}!`
});

// prints 'Hi Djinject!'
console.log(container.sayHi('Djinject'));
```

## API

### Terminology

The **inject** function is turning **modules** into a **container**. A **module** is a plain vanilla JS object, composed of nested **groups** and **dependency factories**. Factories may return any JS value, e.g. constants, singletons and providers. Unlike [Inversify](https://github.com/inversify/InversifyJS), there is no need to decorate classes.

```ts
import { inject, Module } from 'djinject';

// Defining a _context_ of dependencies
type Context = {
    group: {
        value: Value // any JS type, here a class
    }
}

// A _module_ contains nested _groups_ (optional) and _factories_
const module = {
    group: {
        // a factory of type Factory<Context, Value>
        value: (ctx: Context) => new Value(ctx)
    }
} satisfies Module<Context>;

// A _container_ of type Container<[Module<Context>]> = Context
const container = inject(module);

// Values can be obtained from the container
const value = container.group.value;
```

### Context

A **container** provides each **factory** with a parameter called **context**.

```ts
type C = {
    value: string
}

// ❌ compiler error: value is missing
const container = inject({
    factory: (ctx: C) => () => ctx.value
});
```

The **context** of type **C** provides a **value** that can't be resolved. The **inject** call is type-checked by TS the way that the completeness of the arguments is checked.

Such **missing dependencies** need to be provided by adding additional **modules** to the **inject** call.

```ts
// ✅ fixed, value is defined
const container = inject({
    createValue: (ctx: C) => () => ctx.value
}, {
    value: () => '🧞‍♀️'
});
```

Now the compiler is satisfied and we can start using the **container**.

```ts
// prints 🧞‍♀️
console.log(container.createValue());
```

You might have noticed that the **container** automatically **injects** itself as the **context** when calling the **createValue** function.

### Eager vs lazy initialization

A dependency **container.group.value** is **lazily** initialized when first accessed on the container. Initialize a factory **eagerly** at the time of the **inject** call by wrapping it in an **init** call. Hint: groups can be eagerly initialized as well.

A use case for **eager initialization** would be to ensure that **side effects** take place during the initialization of the **container**.

```ts
import { init, inject, Module } from 'djinject';

type C = {
    logger: string
}

const module = {
    service: init(() => {
        console.log('Service initialized');
    })
} satisfies Module<C>;

const ctr = inject(module);

console.log('App started');

ctr.service
```

In the **eager** case, the output is

```plain
Service initialized
App started
```

In the **lazy** case, the output is

```plain
App started
Service initialized
```

Please note that **eager factories** overwrite **lazy factories** vice versa when **rebinding** them using **additional modules** in the **inject** call.

### Rebinding dependencies

The main advantage of **dependency injection** arises from the fact that an application is able to **rebind dependencies**. That way the **structure** of a system can be fixated while the **behavior** can be changed.

The main vehicle for **rebinding dependencies** is the **inject** function which receives a variable amount of **modules**.

The behavior of an application can be enhanced by overwriting existing functionality using additional modules.

```ts
type C = {
    test: () => void
    eval: (a: number, b: number) => number
}

const m1 = {
    test: (ctx) => () => {
        console.log(ctx.eval(1, 1));
    },
    eval: () => (a, b) => a + b
} satisfies Module<C, C>; // requires C

const m2 = {
    eval: () => (a, b) => a * b
} satisfies Module<C>; // partial C

const ctr = inject(m1, m2);

// = 1
ctr.test();
```
