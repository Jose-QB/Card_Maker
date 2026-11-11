import { expandCards } from './order.js';

const SIZE_PRECISION = 10;

function roundSize(value) {
  return Math.round((value + Number.EPSILON) * SIZE_PRECISION) / SIZE_PRECISION;
}

function normalizeSize(size) {
  return { width: roundSize(size.width), height: roundSize(size.height) };
}

export function sizeKey(size) {
  return `${roundSize(size.width).toFixed(1)}x${roundSize(size.height).toFixed(1)}`;
}

export function resolveCardSize(card, config) {
  if (config.dimensionsMode !== 'perType') {
    return normalizeSize(config.sharedCardSize);
  }

  const cardType = config.cardTypes.find(({ id }) => id === card.id);
  if (!cardType?.size) {
    throw new RangeError(`La carta ${card.id ?? 'sin identidad'} no tiene dimensiones configuradas.`);
  }
  return normalizeSize(cardType.size);
}

export function groupCardsBySize(cards = [], config, order = 'normal') {
  const expanded = expandCards(cards, { order });
  const groups = [];
  const groupsByKey = new Map();

  for (const item of expanded) {
    const cardSize = resolveCardSize(item, config);
    const key = sizeKey(cardSize);
    let group = groupsByKey.get(key);
    if (!group) {
      group = { key, cardSize, items: [] };
      groupsByKey.set(key, group);
      groups.push(group);
    }
    group.items.push(item);
  }

  return groups;
}

export { SIZE_PRECISION };
