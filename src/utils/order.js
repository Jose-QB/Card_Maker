const ORDER_MODES = new Set(['normal', 'interleaved']);

function getOrderMode(options) {
  const order = typeof options === 'string' ? options : options?.order;
  const mode = order ?? 'normal';

  if (!ORDER_MODES.has(mode)) {
    throw new RangeError('El orden debe ser normal o interleaved.');
  }

  return mode;
}

function getQuantity(card) {
  const quantity = card?.quantity ?? 0;

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new RangeError('La cantidad de cada carta debe ser un entero no negativo.');
  }

  return quantity;
}

function createCopy(card, copyNumber) {
  return {
    ...card,
    copyNumber
  };
}

function expandNormally(cards) {
  return cards.flatMap((card) => {
    const quantity = getQuantity(card);
    return Array.from({ length: quantity }, (_, index) => createCopy(card, index + 1));
  });
}

function expandInterleaved(cards) {
  const quantities = cards.map(getQuantity);
  const maximumQuantity = Math.max(0, ...quantities);
  const expanded = [];

  for (let round = 0; round < maximumQuantity; round += 1) {
    cards.forEach((card, cardIndex) => {
      if (round < quantities[cardIndex]) {
        expanded.push(createCopy(card, round + 1));
      }
    });
  }

  return expanded;
}

export function expandCards(cards = [], options = {}) {
  if (!Array.isArray(cards)) {
    throw new TypeError('La lista de cartas debe ser un arreglo.');
  }

  const order = getOrderMode(options);
  return order === 'interleaved'
    ? expandInterleaved(cards)
    : expandNormally(cards);
}

export { ORDER_MODES };
