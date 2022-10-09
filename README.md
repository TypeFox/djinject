<div id="ginject-logo" align="center">
  <a href="https://github.com/langium/ginject">
    <img alt="Ginject Logo" width="450" src="https://user-images.githubusercontent.com/743833/193610222-cf9a7feb-b1d9-4d5c-88de-6ce9fbca8299.png">
  </a>
  <h3>
    Dependency injection done right.
  </h3>
</div>

<div id="badges" align="center">

[![npm version](https://img.shields.io/npm/v/ginject?logo=npm&style=flat-square)](https://www.npmjs.com/package/ginject/)
[![build](https://img.shields.io/github/workflow/status/langium/ginject/Build/main?logo=github&style=flat-square)](https://github.com/langium/ginject/actions/workflows/build.yml)
[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod&style=flat-square)](https://gitpod.io/#https://github.com/langium/ginject)

</div>

<br>

**Ginject** [ʤɪnject] is a non-intrusive and typesafe dependency injection library for Node.js and JavaScript, powered by TypeScript.

**Ginject** empowers developers designing decoupled applications and frameworks. **Ginject**'s main goal is increasing the developer experience by offering a tiny, yet powerful API, keeping dependencies in central module definitions and by using TypeScript's type system to restrain runtime challenges.

The concept of **ginject**'s central module definition is inspired by [Google Guice](https://github.com/google/guice). However, **ginject** is going further by lifting the API to the functional level.

Despite its simplicity, **ginject** is powerful enough to cover all features provided by [Inversify](https://github.com/inversify/InversifyJS). Direct support for classes and constructors, property injection, rebinding dependencies and dependency cycle detection are just a few of the features worth mentioning.

<br>

<div id="ginject vs inversify" align="center">

|                  |   ginject  |  inversify  |
|------------------|:----------:|:-----------:|
| minified         | [![minified size](https://img.shields.io/bundlephobia/min/ginject?label=&style=flat-square)](https://bundlephobia.com/result?p=ginject@latest) | [![minified size](https://img.shields.io/bundlephobia/min/inversify?label=&style=flat-square)](https://bundlephobia.com/result?p=inversify@latest) |
| minzipped        | [![minzipped size](https://img.shields.io/bundlephobia/minzip/ginject?label=&style=flat-square)](https://bundlephobia.com/result?p=ginject@latest) | [![minzipped size](https://img.shields.io/bundlephobia/minzip/inversify?label=&style=flat-square)](https://bundlephobia.com/result?p=inversify@latest) |
| typesafe         |      ✅    |      ❌      |
| requirements     |    none    | decorators  |
| style            | functional | imperative  |
| API surface area |    tiny    | non-trivial |

</div>

<br>

## Quickstart

The first step is to add **ginject** to your application.

```sh
npm i ginject
```

Bascially, the only thing needed is to define **modules** of **factories** and finally call **inject**. The resulting **container** provides concrete **instances**.

```ts
import { inject } from 'ginject';

// create an inversion of control container
const container = inject({
    hi: () => 'Hi',
    sayHi: () => (name: string) => `${container.hi} ${name}!`
});

// prints 'Hi Ginject!'
console.log(container.sayHi('Ginject'));
```

## API

### Terminology

The **inject** function is turning **modules** into a **container**. A **module** is a plain vanilla JS object, composed of nested **groups** and **dependency factories**. Factories may return any JS value, e.g. constants, singletons and providers. Unlike [Inversify](https://github.com/inversify/InversifyJS), there is no need to decorate classes.

```ts
import { inject, Module } from 'ginject';

// Defining a _context_ of dependencies
type Context = {
    group: {
        value: Value // any JS type, here a class
    }
}

// A _module_ contains nested _groups_ (optional) and _factories_
const module: Module<Context> = {
    group: {
        // a factory of type Factory<Context, Value>
        value: (ctx: Context) => new Value(ctx)
    }
};

// A _container_ of type Container<Module<Context>> = Context
const container = inject(module);

// Values can be obtained from the container
const value = container.group.value;
```

### Context & Multiple Modules

A **container** provides each **factory** with a parameter called **context**.

```ts
type C = {
    value: string
}

const container = inject({
    factory: (ctx: C) => () => ctx.value
});
```

The **context** of type **C** provides a **value** that can't be resolved. The **inject** call is type-checked by TS the way that the completeness of the arguments is validated.

Such **missing dependencies** need to be provided by adding additional **modules** to the **inject** call.

```ts
const container = inject({
    factory: (ctx: C) => () => ctx.value
}, {
    value: () => '🍸'
});
```

Now the compiler is satisfied and we can start using the **container**.

```ts
// prints 🍸
console.log(container.factory());
```

You might have noticed that the **container** automatically calls the **factory** and **injects** itself as the **context**. The use-site receives the **value**.

**ginject** has an internal root module of type **Module&lt;Ginject>** that is implicity the first module of the **inject** function.

```ts
type Ginject = {
    ginject: {
        context: <C>(ctx: C) => C;
        eager: (delegate: Eager) => Eager;
        inject: (delegate: Inject) => Inject;
    }
}
```

In other words, the behavior of **ginject** can be enhanced.
### Eager vs lazy initialization

A dependency **container.group.value** is **lazily** initialized when first accessed on the container. Turn a factory **eager** to initialize the dependency at the time of the **inject** call.

A use case for **eager initialization** would be to ensure that **side effects** take place during the initialization of the **container**. 

```ts
import { eager, inject, Module } from 'ginject';

type C = {
    gin: string
}

const module: Module<C> = {
    gin: eager(() => {
        const gin = '🍸';
        console.log('Gin mixed');
        return gin;
    })
}

const ctr = inject(module);

console.log('App started');

ctr.gin
```

In the **eager** case, the output is

```
Gin mixed
App started
```

In the **lazy** case, the output is

```
App started
Gin mixed
```

Please note that **eager factories** overwrite **lazy factories** vice versa when **rebinding** them.

### Rebinding dependencies

The main advantage of **dependency injection** arises from the fact that an application is able to **rebind dependencies**. That way the **structure** of a system can be fixated while the **behavior** can be changed.

The main vehicle for **rebinding dependencies** is the **inject** function which receives a variable amount of **modules**.

The behavior of an application can be enhanced by overwriting existing functionality using additional modules.

```ts
type C = {
    readonly print: () => void
    eval: (a: number, b: number) => number
}

const module_0: Module<C> = {
    print: (ctx) => () => {
        console.log(ctx.eval(1, 1));
    },
    eval: () => (a, b) => a + b
};

const ctr = inject(module_0, {
    eval: () => (a: number, b: number) => a * b
});

// = 1
ctr.print();
```

### Cyclic Dependencies

### Asynchronous Factories
