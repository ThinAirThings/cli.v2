#!/usr/bin/env node
import Pastel from 'pastel';
import { enableMapSet } from 'immer';

enableMapSet()

const app = new Pastel({
    importMeta: import.meta,
    name: 'Thin Air CLI',
    description: 'CLI for Thin Air Framework',
    version: '0.0.1',
});

await app.run();