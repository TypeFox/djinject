<div id="ginject-logo" align="center">
  <a href="https://github.com/langium/ginject">
    <img alt="Ginject Logo" width="450" src="https://user-images.githubusercontent.com/743833/193610222-cf9a7feb-b1d9-4d5c-88de-6ce9fbca8299.png">
  </a>
  <h3>
    Featherweight and typesafe dependency injection
  </h3>
</div>

<div id="badges" align="center">

[![npm version](https://img.shields.io/npm/v/ginject?logo=npm&style=flat-square)](https://www.npmjs.com/package/ginject/)
[![build](https://img.shields.io/github/workflow/status/langium/ginject/Build/main?logo=github&style=flat-square)](https://github.com/langium/ginject/actions/workflows/build.yml)
[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod&style=flat-square)](https://gitpod.io/#https://github.com/langium/ginject)

</div>

<br><br>

<div id="ginject vs inversify" align="center">

|                  |    ginject   |            inversify          |
|------------------|:------------:|:-----------------------------:|
| minified         | [![minified size](https://img.shields.io/bundlephobia/min/ginject?label=&style=flat-square)](https://bundlephobia.com/result?p=ginject@latest) | [![minified size](https://img.shields.io/bundlephobia/min/inversify?label=&style=flat-square)](https://bundlephobia.com/result?p=inversify@latest) |
| minzipped          | [![minzipped size](https://img.shields.io/bundlephobia/minzip/ginject?label=&style=flat-square)](https://bundlephobia.com/result?p=ginject@latest) | [![minzipped size](https://img.shields.io/bundlephobia/minzip/inversify?label=&style=flat-square)](https://bundlephobia.com/result?p=inversify@latest) |
| typesafe         |      ✅      |               ❌               |
| requirements     |     none     | decorators / reflect-metadata |
| style            |  functional  |           imperative          |
| API surface area | one function |           non-trivial         |

</div>

<br><br>

<hr>

<br><br>

Ginject is a TODO(@@dd): short description

## Quickstart

Add _ginject_ to your project

```sh
npm i ginject
```

Start to decouple your application

```ts
import { inject } from 'ginject';

// create an inversion of control container
const ctr = inject({
    hi: () => 'Hi',
    sayHi: () => (name: string) => `${ctr.hi} ${name}!`
});

// prints 'Hi Ginject!'
console.log(ctr.sayHi('Ginject'));
```

## API

### Terminology

```ts
import { inject, Module } from 'ginject';

// Defining a context of dependencies
type Context = {
    group: {
        service: Service // any JS type, e.g. a class
    }
}

// A module contains nested groups (optional) and service factories
const module: Module<Context> = {
    group: {
        // a service factory of type Factory<Context, Service>
        service: (ctx: Context) => new Service(ctr)
    }
}

// A container of type Container<Module<Context>>
const container = inject(module);

// Services can be obtained from the container
const service = container.group.service;
```

Factories may return

* constants/singletons (primitive values, functions, arrays, classes)
* providers `() => T`, where `T` may be any type

### Eager vs lazy initialization

```diff
- import { inject, Module } from 'ginject';
+ import { eager, inject, Module } from 'ginject';

const module: Module<Context> = {
    group: {
-        service: (ctx: Context) => new Service(ctr)
+        service: eager((ctx: Context) => new Service(ctr))
    }
}
```

A dependency `container.group.service` is _lazily_ initialized on the first access.
When a factory is turned _eager_, the dependency is initialized on the `inject` call.

### Rebinding dependencies

TODO(@@dd): rebinding dependencies

### Partial modules

TODO(@@dd): partial modules

### Action handlers

```diff
const module: Module<Context> = {
    group: {
        service: (ctx: Context) => {
+            console.log('Before');
            const service = new Service(ctr);
+            console.log('After');
            return service;
        }
    }
}
```

### Cyclic Dependencies

### Asynchronous Factories
