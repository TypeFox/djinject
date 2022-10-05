/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

export { eager, inject } from './inject';
export { Container, Factory, Module } from './types';

import { inject } from './inject'

type Container = {
    group: {
        service: (ctr: Container) => Service
    }
}

// A service is a dependency, it may be any JS value
class Service {
    constructor(ctr: Container) {}
}

// A factory creates a dependency
const factory = (ctr: Container) => new Service(ctr);

// A module contains nested groups (optional) and service factories
const module = {
    group: {
        service: factory
    }
}

// Inject turns a module into a container
const container = inject(module);

// Services can be obtained from the container
const service = container.group.service;
