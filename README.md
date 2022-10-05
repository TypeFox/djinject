<div id="ginject-logo" align="center">
  <a href="https://github.com/langium/ginject">
    <img alt="Ginject Logo" width="450" src="https://user-images.githubusercontent.com/743833/193610222-cf9a7feb-b1d9-4d5c-88de-6ce9fbca8299.png">
  </a>
  <h3>
    Featherweight and typesafe dependency injection
  </h3>
</div>

<div id="badges" align="center">

  [![npm](https://img.shields.io/npm/v/ginject)](https://www.npmjs.com/package/ginject)
  [![Build](https://github.com/langium/ginject/actions/workflows/build.yml/badge.svg)](https://github.com/langium/ginject/actions/workflows/build.yml)
  [![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/langium/ginject)

</div>

<hr>

Ginject is a ...

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

```ts
class Service {}                     // A service is a dependency.
const factory = () => new Service(); // Lazily creates a dependency.
const module = {                     // A module contains
  group: { service: factory }        //   1. nested groups (optional)
}                                    //   2. service factories (required)
const container = inject(module);    // Inject turns a module into a container.
```

TODO(@@dd): use terminology of [Google Juice](https://github.com/google/guice) and [Inversify](https://inversify.io)

## Module Definitions

### Factories

* constants
* singletons
* providers
* action handlers

```ts
const ctr = inject({
    hi: () => 'Hi',
    sayHi: () => (name: string) => {
      console.log(`Starting: ${new Date().getTime()}`);
      const greet = `${ctr.hi} ${name}!`;
      console.log(`Finished: ${new Date().getTime()}`);
      return greet;
    }
});
```

### Lazy vs Eager Initialization

## Rebinding Dependencies

### Cyclic Dependencies

### Asynchronous Factories

### Ad-Hoc Modules

### Factoring out Modules

## Type Safety

### Validation

## Ginject vs Inversify

|                  |    ginject   |            inversify          |
|------------------|:------------:|:-----------------------------:|
| minified         |     1 KB     |             45 KB             |
| gzipped          |    0.5 KB    |             11 KB             |
| typesafe         |      ✅      |               ❌               |
| requirements     |     none     | decorators / reflect-metadata |
| style            |  functional  |           imperative          |
| API surface area | one function |           non-trivial         |

* Size / Zero Dependencies
* API Surface Area
* Non-Intrusive / Self Contained
* Typesafe
