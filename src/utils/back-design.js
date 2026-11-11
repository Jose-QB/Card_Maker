export function createBackDesign() {
  return { global: null, bySize: {}, byCard: {} };
}

export function hasBackDesign(design = createBackDesign()) {
  return Boolean(design.global)
    || Object.values(design.bySize ?? {}).some(Boolean)
    || Object.values(design.byCard ?? {}).some(Boolean);
}

export function resolveBackImage(position, design = createBackDesign()) {
  const cardId = position?.item?.id;
  const specific = cardId ? design.byCard?.[cardId] : null;
  if (specific) return { image: specific, source: 'specific' };
  const bySize = position?.sizeKey ? design.bySize?.[position.sizeKey] : null;
  if (bySize) return { image: bySize, source: 'size' };
  if (design.global) return { image: design.global, source: 'global' };
  return { image: null, source: 'none' };
}
