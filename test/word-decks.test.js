import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import {
  calculateWordCardCount,
  chooseConceptColor,
  CONCEPT_COLORS,
  createWordDeckConfig,
  createWordEntries,
  distributeWordEntries,
  validateWordDeckConfig
} from '../src/utils/word-decks.js';

test('el editor comunica actualización automática y no expone botón manual', async () => {
  const source = await readFile(new URL('../src/components/word-controls.js', import.meta.url), 'utf8');

  assert.match(source, /actualizan automáticamente/);
  assert.doesNotMatch(source, /data-generate-word-deck/);
});

test('crea una configuración de mazo de palabras con dimensiones y listas', () => {
  const config = createWordDeckConfig({
    card: { width: 63.5, height: 88.9 },
    lists: [
      { concept: 'Animales', words: ['gato', 'perro'] },
      { concept: 'Colores', words: ['azul'] }
    ],
    wordsPerCard: 2
  });

  assert.deepEqual(config.card, { width: 63.5, height: 88.9 });
  assert.deepEqual(config.lists, [
    { id: 'list-1', concept: 'Animales', color: '#f39b48', words: ['gato', 'perro'] },
    { id: 'list-2', concept: 'Colores', color: '#4f9fc4', words: ['azul'] }
  ]);
  assert.equal(config.wordsPerCard, 2);
  assert.equal(config.totalWords, 3);
});

test('acepta palabras repetidas porque se resaltan en una fase posterior', () => {
  const result = validateWordDeckConfig({
    card: { width: 63, height: 88 },
    lists: [{ concept: 'Animales', words: ['gato', 'gato'] }],
    wordsPerCard: 2
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.config.lists[0].words, ['gato', 'gato']);
});

test('conserva el color del concepto en cada entrada', () => {
  const config = createWordDeckConfig({
    card: { width: 63, height: 88 },
    lists: [{ concept: 'Animales', color: '#336699', words: ['gato'] }],
    wordsPerCard: 1
  });

  assert.equal(config.lists[0].color, '#336699');
  assert.equal(createWordEntries(config)[0].color, '#336699');
});

test('ofrece veinte colores y evita los usados al elegir uno nuevo', () => {
  assert.equal(CONCEPT_COLORS.length, 20);
  assert.equal(chooseConceptColor(CONCEPT_COLORS.slice(0, 19), () => 0), CONCEPT_COLORS[19]);
});

test('rechaza dimensiones, listas y cantidad por carta inválidas', () => {
  const result = validateWordDeckConfig({
    card: { width: 0, height: -1 },
    lists: [
      { concept: ' ', words: ['válida'] },
      { concept: 'Vacía', words: [] }
    ],
    wordsPerCard: 0
  });

  assert.equal(result.valid, false);
  assert.equal(result.config, null);
  assert.ok(result.errors.some((error) => /ancho.*mayor que cero/i.test(error)));
  assert.ok(result.errors.some((error) => /alto.*mayor que cero/i.test(error)));
  assert.ok(result.errors.some((error) => /concepto/i.test(error)));
  assert.ok(result.errors.some((error) => /palabra/i.test(error)));
  assert.ok(result.errors.some((error) => /palabras por carta/i.test(error)));
});

test('rechaza una configuración sin listas', () => {
  const result = validateWordDeckConfig({
    card: { width: 63, height: 88 },
    lists: [],
    wordsPerCard: 1
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /al menos una lista/i.test(error)));
});

test('resalta todas las ocurrencias de una palabra repetida sin perder su concepto', () => {
  const config = createWordDeckConfig({
    card: { width: 63, height: 88 },
    lists: [
      { concept: 'Animales', words: ['Gato', 'perro'] },
      { concept: 'Mascotas', words: [' gato '] }
    ],
    wordsPerCard: 2
  });

  const entries = createWordEntries(config);

  assert.deepEqual(entries.map(({ word, concept, isRepeated }) => ({ word, concept, isRepeated })), [
    { word: 'Gato', concept: 'Animales', isRepeated: true },
    { word: 'perro', concept: 'Animales', isRepeated: false },
    { word: 'gato', concept: 'Mascotas', isRepeated: true }
  ]);
});

test('calcula cartas y combina conceptos distintos cuando hay alternativas', () => {
  const entries = [
    { id: 'a-1', concept: 'Animales', word: 'gato' },
    { id: 'a-2', concept: 'Animales', word: 'perro' },
    { id: 'c-1', concept: 'Colores', word: 'azul' },
    { id: 'l-1', concept: 'Lugares', word: 'parque' }
  ];

  assert.equal(calculateWordCardCount(entries.length, 3), 2);
  const cards = distributeWordEntries(entries, 3, () => 0);

  assert.equal(cards.length, 2);
  assert.equal(cards[0].length, 3);
  assert.equal(cards[1].length, 3);
  assert.equal(new Set(cards[0].map((entry) => entry.concept)).size, 3);
  assert.equal(cards[1].filter((entry) => entry.isFillRepeat).length, 2);
});

test('rechaza cantidades imposibles al calcular o distribuir cartas', () => {
  assert.throws(() => calculateWordCardCount(0, 1), /palabras/i);
  assert.throws(() => calculateWordCardCount(2, 0), /palabras por carta/i);
  assert.throws(() => distributeWordEntries([], 1), /palabras/i);
});
