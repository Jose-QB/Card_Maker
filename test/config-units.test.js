import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isFiniteNumber,
  normalizeMillimeters,
  normalizeNonNegativeMillimeters
} from '../src/utils/units.js';
import {
  CARD_PRESETS,
  PAPER_SIZES,
  createConfig,
  validateConfig
} from '../src/utils/config.js';

test('las dimensiones válidas se normalizan a milímetros', () => {
  assert.equal(normalizeMillimeters('63.5', { name: 'ancho' }), 63.5);
  assert.equal(normalizeMillimeters(88, { name: 'alto' }), 88);
  assert.equal(normalizeNonNegativeMillimeters('0', { name: 'padding' }), 0);
  assert.equal(isFiniteNumber(12.5), true);
  assert.equal(isFiniteNumber('12.5'), false);
});

test('cero se rechaza en dimensiones estrictamente positivas', () => {
  assert.throws(
    () => normalizeMillimeters(0, { name: 'ancho' }),
    /ancho.*mayor que cero/i
  );
});

test('los negativos se rechazan en dimensiones y padding', () => {
  assert.throws(
    () => normalizeMillimeters(-1, { name: 'alto' }),
    /alto.*mayor que cero/i
  );
  assert.throws(
    () => normalizeNonNegativeMillimeters(-0.1, { name: 'padding' }),
    /padding.*no negativo/i
  );
});

test('los valores no numéricos se rechazan sin coerción silenciosa', () => {
  for (const value of ['', 'abc', NaN, Infinity, null, undefined]) {
    assert.throws(
      () => normalizeMillimeters(value, { name: 'dimensión' }),
      /dimensión.*número finito/i
    );
  }
});

test('se exponen tamaños de papel físicos conocidos en milímetros', () => {
  assert.deepEqual(PAPER_SIZES.a4, { width: 210, height: 297 });
  assert.deepEqual(PAPER_SIZES.letter, { width: 215.9, height: 279.4 });
});

test('se exponen tamaños de carta predefinidos en milímetros', () => {
  assert.deepEqual(CARD_PRESETS.poker, {
    label: 'Poker / Standard', width: 63.5, height: 88.9
  });
  assert.deepEqual(CARD_PRESETS.bridge, {
    label: 'Bridge', width: 57.1, height: 88.9
  });
  assert.deepEqual(CARD_PRESETS.miniEuropean, {
    label: 'Mini European', width: 44.5, height: 69.9
  });
  assert.deepEqual(CARD_PRESETS.tarot, {
    label: 'Tarot', width: 69.9, height: 120.7
  });
  assert.ok(Object.keys(CARD_PRESETS).length >= 8);
});

test('la configuración válida representa papel, carta, márgenes y padding', () => {
  const config = createConfig({
    paper: 'a4',
    orientation: 'landscape',
    card: { width: 63, height: 88 },
    margins: { top: 10, right: 12, bottom: 10, left: 12 },
    padding: 5,
    visualMode: 'normal'
  });

  assert.deepEqual(config.paper, { width: 297, height: 210 });
  assert.deepEqual(config.card, { width: 63, height: 88 });
  assert.deepEqual(config.margins, { top: 10, right: 12, bottom: 10, left: 12 });
  assert.deepEqual(config.padding, { top: 5, right: 5, bottom: 5, left: 5 });
  assert.equal(config.visualMode, 'normal');
  assert.deepEqual(config.printableArea, { width: 273, height: 190 });
  assert.equal(config.isPrintable, true);
});

test('la orientación vertical conserva el tamaño físico y cambia la representación', () => {
  const portrait = createConfig({ paper: 'letter', orientation: 'portrait' });
  const landscape = createConfig({ paper: 'letter', orientation: 'landscape' });

  assert.deepEqual(portrait.paper, { width: 215.9, height: 279.4 });
  assert.deepEqual(landscape.paper, { width: 279.4, height: 215.9 });
});

test('el modo a sangre desactiva el inset visual sin alterar la geometría de papel', () => {
  const config = createConfig({ visualMode: 'bleed', padding: 7 });

  assert.equal(config.visualMode, 'bleed');
  assert.deepEqual(config.padding, { top: 0, right: 0, bottom: 0, left: 0 });
  assert.deepEqual(config.printableArea, { width: 210, height: 297 });
});

test('los márgenes que agotan el papel producen un diagnóstico inválido', () => {
  const result = validateConfig({
    paper: 'a4',
    margins: { top: 148.5, right: 105, bottom: 148.5, left: 105 }
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /área imprimible.*positiva/i.test(error)));
});

test('una carta mayor que el área imprimible produce un diagnóstico inválido', () => {
  const result = validateConfig({
    paper: 'a4',
    card: { width: 211, height: 88 }
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => /carta.*cabe/i.test(error)));
});

test('la configuración inválida no lanza desde validateConfig y conserva todos sus errores', () => {
  const result = validateConfig({
    paper: 'unknown',
    orientation: 'diagonal',
    card: { width: -1, height: 'no' },
    padding: -2,
    visualMode: 'other'
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 5);
  assert.equal(result.config, null);
});
