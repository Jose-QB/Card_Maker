import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createInitialState,
  deriveAppModel,
  updateAppState
} from '../src/app.js';

test('el estado inicial tiene una sola fuente de configuración y layout derivado', () => {
  const state = createInitialState();
  const model = deriveAppModel(state);

  assert.deepEqual(state.cards, []);
  assert.equal(state.order, 'normal');
  assert.equal(state.currentPage, 1);
  assert.equal(state.selectedCardId, null);
  assert.equal(model.layout.valid, true);
  assert.equal(model.layout.capacity, 9);
  assert.equal(model.stats.totalCards, 0);
  assert.equal(model.stats.totalPages, 0);
});

test('la selección de carta se conserva al editar y se inicializa al agregar', () => {
  const card = {
    id: 'a', name: 'Carta A', quantity: 1,
    image: { dataUrl: 'data:image/png;base64,AA==', mimeType: 'image/png' }
  };
  const state = updateAppState(createInitialState(), { type: 'replace-cards', cards: [card] });
  const next = updateAppState(state, { type: 'update-card', id: 'a', changes: { quantity: 4 } });

  assert.equal(state.selectedCardId, 'a');
  assert.equal(next.selectedCardId, 'a');
  assert.equal(next.cards[0].quantity, 4);
});

test('eliminar la carta seleccionada elige la siguiente o la anterior disponible', () => {
  const cards = [
    { id: 'a', name: 'A', quantity: 1, image: { dataUrl: 'data:image/png;base64,AA==', mimeType: 'image/png' } },
    { id: 'b', name: 'B', quantity: 1, image: { dataUrl: 'data:image/png;base64,AA==', mimeType: 'image/png' } },
    { id: 'c', name: 'C', quantity: 1, image: { dataUrl: 'data:image/png;base64,AA==', mimeType: 'image/png' } }
  ];
  const state = updateAppState(createInitialState(), { type: 'replace-cards', cards });
  const selected = updateAppState(state, { type: 'set-selected-card', id: 'b' });
  const next = updateAppState(selected, { type: 'remove-card', id: 'b' });
  const last = updateAppState(next, { type: 'set-selected-card', id: 'c' });
  const final = updateAppState(last, { type: 'remove-card', id: 'c' });

  assert.equal(next.selectedCardId, 'c');
  assert.equal(final.selectedCardId, 'a');
});

test('seleccionar otra carta conserva el scroll horizontal del carrusel', () => {
  const cards = [
    { id: 'a', name: 'A', quantity: 1, image: { dataUrl: 'data:image/png;base64,AA==', mimeType: 'image/png' } },
    { id: 'b', name: 'B', quantity: 1, image: { dataUrl: 'data:image/png;base64,AA==', mimeType: 'image/png' } }
  ];
  const state = updateAppState(createInitialState(), { type: 'replace-cards', cards });
  const next = updateAppState(state, {
    type: 'set-selected-card',
    id: 'b',
    carouselScrollLeft: 512
  });

  assert.equal(next.selectedCardId, 'b');
  assert.equal(next.cardCarouselScrollLeft, 512);
});

test('cambiar la configuración recalcula capacidad y conserva el estado inmutable', () => {
  const state = createInitialState();
  const next = updateAppState(state, {
    type: 'set-config',
    changes: { card: { width: 100, height: 100 } }
  });
  const model = deriveAppModel(next);

  assert.notEqual(next, state);
  assert.equal(state.configInput.card.width, 63);
  assert.equal(next.configInput.card.width, 100);
  assert.equal(model.layout.valid, true);
  assert.equal(model.stats.capacity, 4);
});

test('un preset actualiza dimensiones, capacidad y conserva el último preset para personalización', () => {
  const state = updateAppState(createInitialState(), {
    type: 'set-config',
    changes: {
      cardPreset: 'tarot',
      lastCardPreset: 'tarot',
      customCardEnabled: false,
      card: { width: 69.9, height: 120.7 }
    }
  });
  const model = deriveAppModel(state);

  assert.equal(state.configInput.cardPreset, 'tarot');
  assert.equal(state.configInput.customCardEnabled, false);
  assert.deepEqual(state.configInput.card, { width: 69.9, height: 120.7 });
  assert.equal(state.configInput.lastCardPreset, 'tarot');
  assert.equal(model.stats.capacity, 6);
});

test('una configuración imposible produce diagnóstico y bloquea las acciones de salida', () => {
  const state = updateAppState(createInitialState(), {
    type: 'set-config',
    changes: { card: { width: 300, height: 300 } }
  });
  const model = deriveAppModel(state);

  assert.equal(model.layout.valid, false);
  assert.ok(model.diagnostics.length > 0);
  assert.equal(model.actions.canPreview, false);
  assert.equal(model.actions.canExport, false);
});

test('la gestión de cartas actualiza estadísticas, layout y orden', () => {
  const card = {
    id: 'a',
    name: 'Carta A',
    quantity: 2,
    image: { dataUrl: 'data:image/png;base64,AA==', mimeType: 'image/png' }
  };
  const state = updateAppState(createInitialState(), { type: 'replace-cards', cards: [card] });
  const interleaved = updateAppState(state, { type: 'set-order', order: 'interleaved' });
  const model = deriveAppModel(interleaved);

  assert.equal(model.stats.totalCards, 2);
  assert.equal(model.layout.items[0].copyNumber, 1);
  assert.equal(model.layout.items[1].copyNumber, 2);
  assert.equal(model.actions.canPreview, true);
});

test('editar una carta conserva la posición horizontal del carrusel', () => {
  const card = {
    id: 'a',
    name: 'Carta A',
    quantity: 1,
    image: { dataUrl: 'data:image/png;base64,AA==', mimeType: 'image/png' }
  };
  const state = updateAppState(createInitialState(), { type: 'replace-cards', cards: [card] });
  const next = updateAppState(state, {
    type: 'update-card',
    id: 'a',
    changes: { quantity: 3 },
    carouselScrollLeft: 384
  });

  assert.equal(next.cards[0].quantity, 3);
  assert.equal(next.cardCarouselScrollLeft, 384);
});

test('las estadísticas indican cuando la capacidad varía entre grupos de tamaño', () => {
  const state = updateAppState(createInitialState(), {
    type: 'set-config',
    changes: {
      dimensionsMode: 'perType',
      cardTypes: {
        small: { width: 20, height: 20 },
        large: { width: 40, height: 40 }
      }
    }
  });
  const withCards = updateAppState(state, {
    type: 'replace-cards',
    cards: [
      { id: 'small', name: 'Pequeña', quantity: 1, image: { dataUrl: 'data:image/png;base64,AA==', mimeType: 'image/png' } },
      { id: 'large', name: 'Grande', quantity: 1, image: { dataUrl: 'data:image/png;base64,AA==', mimeType: 'image/png' } }
    ]
  });
  const model = deriveAppModel(withCards);

  assert.equal(model.stats.capacityLabel, 'Varía por tamaño');
  assert.equal(model.stats.distributionLabel, 'Varía por tamaño');
});

test('avisa que los tamaños independientes requieren hojas separadas', () => {
  const state = updateAppState(createInitialState(), {
    type: 'set-config',
    changes: {
      dimensionsMode: 'perType',
      cardTypes: {
        small: { width: 20, height: 20 },
        large: { width: 40, height: 40 }
      }
    }
  });
  const withCards = updateAppState(state, {
    type: 'replace-cards',
    cards: [
      { id: 'small', name: 'Pequeña', quantity: 2, image: { dataUrl: 'data:image/png;base64,AA==', mimeType: 'image/png' } },
      { id: 'large', name: 'Grande', quantity: 2, image: { dataUrl: 'data:image/png;base64,AA==', mimeType: 'image/png' } }
    ]
  });
  const model = deriveAppModel(updateAppState(withCards, { type: 'set-order', order: 'interleaved' }));

  assert.ok(model.diagnostics.some((message) => /tamaños independientes.*hojas separadas/i.test(message)));
  assert.ok(model.diagnostics.some((message) => /intercalado.*grupo de tamaño/i.test(message)));
});

test('la activación del respaldo específico se conserva por carta', () => {
  const state = createInitialState();
  const next = updateAppState(state, { type: 'set-back-specific-enabled', id: 'card-1', enabled: true });

  assert.equal(state.backSpecificEnabled['card-1'], undefined);
  assert.equal(next.backSpecificEnabled['card-1'], true);
  assert.notEqual(next, state);
});
