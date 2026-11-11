const DEFAULT_QUANTITY = 1;

function createCardError(message) {
  const error = new Error(message);
  error.name = 'CardValidationError';
  return error;
}

function defaultIdFactory() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return `card-${Math.random().toString(36).slice(2)}`;
}

function normalizeName(name, fallback = 'Carta sin nombre') {
  const normalized = typeof name === 'string' ? name.trim() : '';
  return normalized || fallback;
}

function normalizeQuantity(quantity = DEFAULT_QUANTITY) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw createCardError('La cantidad debe ser un entero positivo.');
  }

  return quantity;
}

function normalizeImage(image) {
  if (!image || typeof image !== 'object') {
    throw createCardError('La carta debe conservar una imagen local válida.');
  }

  if (typeof image.dataUrl !== 'string' || !image.dataUrl) {
    throw createCardError('La imagen de la carta debe tener datos locales legibles.');
  }

  if (typeof image.mimeType !== 'string' || !/^image\//i.test(image.mimeType)) {
    throw createCardError('La imagen de la carta debe conservar un formato de imagen.');
  }

  return { ...image };
}

export function createCardFromImage(image, options = {}) {
  const idFactory = options.idFactory ?? defaultIdFactory;
  const id = options.id ?? idFactory();
  if (typeof id !== 'string' || !id.trim()) {
    throw createCardError('La carta debe tener una identidad no vacía.');
  }

  const normalizedImage = normalizeImage(image);
  return {
    id,
    name: normalizeName(options.name, normalizedImage.name),
    quantity: normalizeQuantity(options.quantity),
    image: normalizedImage
  };
}

function assertCards(cards) {
  if (!Array.isArray(cards)) {
    throw new TypeError('La colección de cartas debe ser un arreglo.');
  }
}

function findCardIndex(cards, id) {
  return cards.findIndex((card) => card.id === id);
}

export function addCard(cards, image, options = {}) {
  assertCards(cards);
  return [...cards, createCardFromImage(image, options)];
}

export function updateCard(cards, id, changes = {}) {
  assertCards(cards);
  const index = findCardIndex(cards, id);
  if (index === -1) {
    throw createCardError(`No existe una carta con identidad ${id}.`);
  }

  const current = cards[index];
  const next = {
    ...current,
    ...changes,
    id: current.id,
    name: normalizeName(changes.name ?? current.name),
    quantity: normalizeQuantity(changes.quantity ?? current.quantity),
    image: changes.image === undefined ? current.image : normalizeImage(changes.image)
  };

  return cards.map((card, cardIndex) => (cardIndex === index ? next : card));
}

export function removeCard(cards, id) {
  assertCards(cards);
  return cards.filter((card) => card.id !== id);
}

export { normalizeName, normalizeQuantity };
