import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createConceptCsvTemplate,
  parseConceptCsv
} from '../src/utils/word-csv.js';

test('convierte columnas CSV en listas con el título como concepto', () => {
  const lists = parseConceptCsv('Animales,Colores\ngato,azul\nperro,\n,girasol\n');

  assert.deepEqual(lists, [
    { concept: 'Animales', words: ['gato', 'perro'] },
    { concept: 'Colores', words: ['azul', 'girasol'] }
  ]);
});

test('conserva comas y saltos de línea dentro de valores entrecomillados', () => {
  const lists = parseConceptCsv('"Cosas, varias","Frases"\n"uno, dos","línea 1\nlínea 2"');

  assert.deepEqual(lists[0], { concept: 'Cosas, varias', words: ['uno, dos'] });
  assert.deepEqual(lists[1], { concept: 'Frases', words: ['línea 1\nlínea 2'] });
});

test('genera una plantilla CSV con títulos y filas vacías', () => {
  assert.equal(createConceptCsvTemplate(['Animales', 'Colores']), 'Animales,Colores\n,\n');
});

test('rechaza CSV sin títulos válidos o sin palabras', () => {
  assert.throws(() => parseConceptCsv(',Colores\n,girasol'), /título/i);
  assert.throws(() => parseConceptCsv('Animales,Colores\n,\n'), /palabra/i);
});
