function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function getPaper(layout) {
  return layout?.config?.paper ?? { width: 0, height: 0 };
}

export function createPreviewViewModel({ layout, totalCards, stats, backPages = [], viewMode = 'front' } = {}) {
  const resolvedTotalCards = totalCards ?? stats?.totalCards ?? 0;

  if (!layout?.valid) {
    return {
      kind: 'invalid',
      message: layout?.errors?.[0] ?? 'La configuración no permite previsualizar la hoja.',
      showSheet: false,
      page: 0,
      totalPages: 0,
      capacity: 0,
      totalCards: resolvedTotalCards,
      paper: getPaper(layout),
      positions: []
    };
  }

  if (resolvedTotalCards <= 0 || layout.totalPages <= 0) {
    return {
      kind: 'empty',
      message: 'Puedes cargar una carta para previsualizar la hoja.',
      showSheet: false,
      page: 0,
      totalPages: 0,
      capacity: layout.capacity ?? 0,
      totalCards: resolvedTotalCards,
      paper: getPaper(layout),
      positions: []
    };
  }

  const showingBacks = viewMode === 'back';
  const frontPages = Array.isArray(layout.pages) && layout.pages.length > 0
    ? layout.pages
    : [layout.currentPositions ?? []];
  const pages = showingBacks ? backPages : frontPages;
  if (showingBacks && pages.length === 0) {
    return {
      kind: 'empty',
      message: 'Añade un respaldo para previsualizar la segunda vista.',
      showSheet: false,
      page: 0,
      totalPages: 0,
      capacity: layout.capacity,
      totalCards: resolvedTotalCards,
      paper: getPaper(layout),
      positions: []
    };
  }
  const totalPages = showingBacks ? pages.length : (layout.totalPages || pages.length);
  const currentPage = Math.min(layout.currentPage || 1, totalPages);
  const page = showingBacks
    ? pages[currentPage - 1] ?? []
    : layout.pages?.length ? pages[currentPage - 1] ?? [] : layout.currentPositions ?? [];
  const view = {
    kind: 'ready',
    message: '',
    showSheet: true,
    page: currentPage,
    totalPages,
    capacity: layout.capacity,
    totalCards: resolvedTotalCards,
    paper: getPaper(layout),
    positions: page
  };
  if (showingBacks || backPages.length > 0) {
    view.background = page.background ?? null;
    view.viewMode = showingBacks ? 'back' : 'front';
  }
  return view;
}

function renderEmptyState(view) {
  return `<p class="preview-message" role="status">${escapeHtml(view.message)}</p>`;
}

function renderCard(position, paper, viewMode) {
  const item = position.item ?? {};
  const image = viewMode === 'back' ? position.backImage?.dataUrl : item.image?.dataUrl;
  const left = (position.x / paper.width) * 100;
  const top = (position.y / paper.height) * 100;
  const width = (position.width / paper.width) * 100;
  const height = (position.height / paper.height) * 100;
  const contentLeft = viewMode === 'back' ? 0 : ((position.contentX - position.x) / position.width) * 100;
  const contentTop = viewMode === 'back' ? 0 : ((position.contentY - position.y) / position.height) * 100;
  const contentWidth = viewMode === 'back' ? 100 : (position.contentWidth / position.width) * 100;
  const contentHeight = viewMode === 'back' ? 100 : (position.contentHeight / position.height) * 100;

  return `
    <div class="preview-card" style="left:${left}%;top:${top}%;width:${width}%;height:${height}%" aria-label="${escapeHtml(item.name ?? 'Carta')}" data-card-id="${escapeHtml(item.id)}">
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(viewMode === 'back' ? `Respaldo de ${item.name ?? 'carta'}` : item.name ?? 'Carta')}" style="left:${contentLeft}%;top:${contentTop}%;width:${contentWidth}%;height:${contentHeight}%">` : '<span class="preview-card-placeholder">Sin imagen</span>'}
    </div>`;
}

export function renderPreview(root, model) {
  if (!root) return;
  const view = createPreviewViewModel(model);

  if (!view.showSheet) {
    root.innerHTML = renderEmptyState(view);
    return;
  }

  const paper = view.paper;
  root.innerHTML = `
    <div class="preview-sheet" style="aspect-ratio:${paper.width} / ${paper.height}" aria-label="${view.viewMode === 'back' ? 'Respaldo' : 'Frente'}: hoja ${view.page} de ${view.totalPages}">
      ${view.background ? `<img class="preview-sheet-background" src="${escapeHtml(view.background.dataUrl)}" alt="" aria-hidden="true">` : ''}
      ${view.positions.map((position) => renderCard(position, paper, view.viewMode)).join('')}
    </div>`;
}
