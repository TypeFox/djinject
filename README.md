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
import { inject } from '.'

// create an inversion of control container
const ctr = inject({
    hi: () => 'Hi!'
});

// prints "Hi!"
console.log(ctr.hi);
```

## Cyclic Dependencies

## Type Safety
