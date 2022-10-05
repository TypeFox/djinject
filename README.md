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

**Ginject** [ʤɪnject] is a typesafe and functional dependency injection library for Node.js and JavaScript, powered by TypeScript. **Ginject**'s main goal is to increase the developer experience by keeping dependencies in central module definitions and by using TypeScript's type system to remove runtime errors.

The concept of a central module definition is inspired by [Google Guice](https://github.com/google/guice). However, **Ginject** is going further by lifting the API to the functional level, it is relying on plain vanilla JS functions instead of an internal DSL.

Despite its simplicity, **ginject** is powerful enough to cover all features provided by [Inversify](https://github.com/inversify/InversifyJS). Direct support for classes and constructors, property injection, rebinding dependencies and dependency cycle detection are only a few features to mention.

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

The **inject** function is turning **modules** into a **container**. A module is a plain vanilla JS object, composed of nested **groups** and **dependency factories**. Factories may return any JS value, e.g. constants, singletons and providers. Unlike [Inversify](https://github.com/inversify/InversifyJS), there is no need to decorate classes.

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
}

// A _container_ of type Container<Module<Context>> = Context
const container = inject(module);

// Values can be obtained from the container
const value = container.group.value;
```

### Eager vs lazy initialization

A dependency `container.group.value` is _lazily_ initialized when first accessed on the container. Turn a factory _eager_ to initialize the dependency at the time of the `inject` call.

```diff
- import { inject, Module } from 'ginject';
+ import { eager, inject, Module } from 'ginject';

const module: Module<Context> = {
    group: {
-        value: (ctx: Context) => new Value(ctx)
+        value: eager((ctx: Context) => new Value(ctx))
    }
}
```

### Rebinding dependencies

TODO(@@dd): rebinding dependencies

### Partial modules

TODO(@@dd): partial modules

### Action handlers

```diff
const module: Module<Context> = {
    group: {
        value: (ctx) => {
+            console.log('Before');
            const value = new Value(ctx);
+            console.log('After');
            return value;
        }
    }
}
```

### Cyclic Dependencies

### Asynchronous Factories
