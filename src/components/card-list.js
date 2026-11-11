import { loadImageFiles } from '../services/image-loader.js';
import { loadImageFile } from '../services/image-loader.js';
import { renderSpecificBackControl } from './back-controls.js';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function findCardError(diagnostics, cardId, pattern) {
  return diagnostics.find((message) => message.includes(cardId) && pattern.test(message))
    ?? diagnostics.find((message) => pattern.test(message))
    ?? '';
}

function renderFieldError(id, message) {
  return `<span id="${id}" class="field-error" role="alert">${escapeHtml(message)}</span>`;
}

export function renderCardList(root, model, dispatch) {
  const diagnostics = model.diagnostics ?? [];
  const uploadStatus = model.state.uploadStatus;
  const selectedCard = model.state.cards.find((card) => card.id === model.state.selectedCardId) ?? null;
  root.innerHTML = `
    <div class="upload-control" id="image-dropzone" role="button" tabindex="0" aria-describedby="image-input-help image-drop-status" aria-label="Cargar imágenes locales arrastrando archivos o usando el selector">
      <label for="image-input">
      <span>Cargar imágenes locales</span>
      <input id="image-input" type="file" accept="image/*" multiple>
      </label>
    </div>
    <p id="image-input-help" class="help-text">Las imágenes se procesan en este dispositivo; no se suben a ningún servidor.</p>
    <p id="image-drop-status" class="drop-status ${uploadStatus?.kind === 'error' ? 'status-error' : ''}" role="${uploadStatus?.kind === 'error' ? 'alert' : 'status'}" aria-live="polite">${escapeHtml(uploadStatus?.message ?? 'También puedes arrastrar y soltar imágenes aquí.')}</p>
    <div class="card-editor-layout">
      <section class="selected-card-editor" aria-labelledby="selected-card-title">
        <div class="selected-card-heading">
          <div>
            <p class="eyebrow eyebrow-dark">Edición</p>
            <h3 id="selected-card-title">Carta seleccionada</h3>
          </div>
          ${selectedCard ? `<span class="selected-card-name">${escapeHtml(selectedCard.name)}</span>` : ''}
        </div>
        ${selectedCard ? `
          <article class="card-row" data-card-id="${escapeHtml(selectedCard.id)}" aria-labelledby="selected-card-title">
            <div class="card-row-header">
              <img src="${escapeHtml(selectedCard.image.dataUrl)}" alt="Previsualización de ${escapeHtml(selectedCard.name)}" width="112" height="156" loading="lazy">
              <div class="card-row-identity">
                <div class="field-group"><label for="name-${escapeHtml(selectedCard.id)}">Nombre
                  <input id="name-${escapeHtml(selectedCard.id)}" data-role="name" value="${escapeHtml(selectedCard.name)}" required aria-describedby="name-error-${escapeHtml(selectedCard.id)}" aria-invalid="${findCardError(diagnostics, selectedCard.id, /nombre/i) ? 'true' : 'false'}">
                </label>${renderFieldError(`name-error-${escapeHtml(selectedCard.id)}`, findCardError(diagnostics, selectedCard.id, /nombre/i))}</div>
                <div class="field-group"><label for="quantity-${escapeHtml(selectedCard.id)}">Cantidad de copias
                  <input id="quantity-${escapeHtml(selectedCard.id)}" data-role="quantity" type="number" min="1" max="10000" step="1" value="${selectedCard.quantity}" required aria-describedby="quantity-error-${escapeHtml(selectedCard.id)}" aria-invalid="${findCardError(diagnostics, selectedCard.id, /cantidad/i) ? 'true' : 'false'}">
                </label>${renderFieldError(`quantity-error-${escapeHtml(selectedCard.id)}`, findCardError(diagnostics, selectedCard.id, /cantidad/i))}</div>
              </div>
              <button type="button" data-action="remove" aria-label="Eliminar ${escapeHtml(selectedCard.name)}">Eliminar</button>
            </div>
            ${model.state.configInput.dimensionsMode === 'perType' ? (() => {
              const size = model.state.configInput.cardTypes?.[selectedCard.id] ?? model.state.configInput.card;
              const dimensionError = findCardError(diagnostics, selectedCard.id, /dimensiones|ancho|alto|carta no cabe/i);
              return `<div class="card-dimensions" aria-label="Dimensiones de ${escapeHtml(selectedCard.name)}">
                <div class="field-group"><label for="width-${escapeHtml(selectedCard.id)}">Ancho (mm)
                  <input id="width-${escapeHtml(selectedCard.id)}" data-role="width" type="number" min="0.1" max="1000" step="0.1" value="${size.width}" aria-describedby="dimensions-error-${escapeHtml(selectedCard.id)}" aria-invalid="${dimensionError ? 'true' : 'false'}">
                </label></div>
                <div class="field-group"><label for="height-${escapeHtml(selectedCard.id)}">Alto (mm)
                  <input id="height-${escapeHtml(selectedCard.id)}" data-role="height" type="number" min="0.1" max="1000" step="0.1" value="${size.height}" aria-describedby="dimensions-error-${escapeHtml(selectedCard.id)}" aria-invalid="${dimensionError ? 'true' : 'false'}">
                </label></div>
                ${renderFieldError(`dimensions-error-${escapeHtml(selectedCard.id)}`, findCardError(diagnostics, selectedCard.id, /dimensiones|ancho|alto|carta no cabe/i))}
              </div>`;
            })() : ''}
            <label class="specific-back-toggle" for="back-specific-enabled-${escapeHtml(selectedCard.id)}">
              <input id="back-specific-enabled-${escapeHtml(selectedCard.id)}" data-back-specific-toggle="true" type="checkbox" ${model.state.backSpecificEnabled?.[selectedCard.id] ? 'checked' : ''}>
              Usar respaldo específico para esta carta y sus copias
            </label>
            ${model.state.backSpecificEnabled?.[selectedCard.id] ? renderSpecificBackControl(selectedCard, model.backDesign?.byCard?.[selectedCard.id], model.state.backErrors?.[`back-card-${selectedCard.id}`]) : ''}
          </article>` : '<p class="empty-state">Agrega una carta para comenzar a editarla.</p>'}
      </section>
      <section class="card-carousel compact-card-carousel" aria-labelledby="compact-cards-title">
        <div class="selected-card-heading">
          <div>
            <p class="eyebrow eyebrow-dark">Navegación</p>
            <h3 id="compact-cards-title">Tus cartas</h3>
          </div>
          <span class="help-text">${model.state.cards.length} carta${model.state.cards.length === 1 ? '' : 's'}</span>
        </div>
      <button class="carousel-nav" type="button" data-carousel-action="previous" aria-controls="cards-carousel" aria-label="Carta anterior" disabled>
        <span aria-hidden="true">←</span><span class="visually-hidden">Carta anterior</span>
      </button>
      <div id="cards-carousel" class="card-list compact-card-list" role="region" aria-roledescription="carrusel" aria-label="Carrusel compacto de cartas" tabindex="0" aria-live="polite">
        ${model.state.cards.length === 0
          ? '<p class="empty-state">No hay cartas cargadas todavía.</p>'
          : model.state.cards.map((card) => `<button type="button" class="compact-card ${card.id === model.state.selectedCardId ? 'is-selected' : ''}" data-action="select-card" data-card-id="${escapeHtml(card.id)}" aria-pressed="${card.id === model.state.selectedCardId}" aria-label="${card.id === model.state.selectedCardId ? 'Carta seleccionada: ' : 'Seleccionar carta: '}${escapeHtml(card.name)}">
              <img src="${escapeHtml(card.image.dataUrl)}" alt="" width="48" height="68" loading="lazy">
              <span class="compact-card-copy"><strong>${escapeHtml(card.name)}</strong><small>${card.quantity} copia${card.quantity === 1 ? '' : 's'}</small></span>
            </button>`).join('')}
      </div>
      <button class="carousel-nav" type="button" data-carousel-action="next" aria-controls="cards-carousel" aria-label="Carta siguiente" disabled>
        <span aria-hidden="true">→</span><span class="visually-hidden">Carta siguiente</span>
      </button>
      </section>
    </div>`;

  const dropzone = root.querySelector('#image-dropzone');
  const fileInput = root.querySelector('#image-input');
  const carousel = root.querySelector('#cards-carousel');
  const carouselButtons = root.querySelectorAll('[data-carousel-action]');
  const preservedScrollLeft = Number.isFinite(model.state.cardCarouselScrollLeft)
    ? model.state.cardCarouselScrollLeft
    : 0;
  carousel.scrollLeft = preservedScrollLeft;

  const updateCarouselButtons = () => {
    const hasOverflow = carousel.scrollWidth > carousel.clientWidth + 1;
    const atStart = carousel.scrollLeft <= 1;
    const atEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 1;
    root.querySelector('[data-carousel-action="previous"]').disabled = !hasOverflow || atStart;
    root.querySelector('[data-carousel-action="next"]').disabled = !hasOverflow || atEnd;
  };

  const scrollCarousel = (direction) => {
    const card = carousel.querySelector('.compact-card');
    const styles = getComputedStyle(carousel);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    const amount = card ? card.getBoundingClientRect().width + gap : carousel.clientWidth;
    carousel.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  carouselButtons.forEach((button) => {
    button.addEventListener('click', () => scrollCarousel(button.dataset.carouselAction === 'next' ? 1 : -1));
  });
  carousel.addEventListener('scroll', updateCarouselButtons, { passive: true });
  carousel.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    if (carousel.scrollWidth <= carousel.clientWidth + 1) return;
    const movingForward = event.deltaY > 0;
    const canScroll = movingForward
      ? carousel.scrollLeft + carousel.clientWidth < carousel.scrollWidth - 1
      : carousel.scrollLeft > 1;
    if (!canScroll) return;
    event.preventDefault();
    carousel.scrollBy({ left: event.deltaY, behavior: 'auto' });
  }, { passive: false });
  carousel.addEventListener('keydown', (event) => {
    if (event.target !== carousel) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      scrollCarousel(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(updateCarouselButtons).observe(carousel);
  }
  requestAnimationFrame(() => {
    updateCarouselButtons();
  });

  const preserveCarouselPosition = () => ({ carouselScrollLeft: carousel.scrollLeft });

  root.querySelectorAll('[data-action="select-card"]').forEach((button) => {
    button.addEventListener('click', () => dispatch({
      type: 'set-selected-card',
      id: button.dataset.cardId,
      carouselScrollLeft: carousel.scrollLeft
    }));
  });

  const processFiles = async (files) => {
    if (!files || files.length === 0) {
      dispatch({ type: 'set-upload-status', status: { kind: 'error', message: 'No se encontraron archivos para cargar.' } });
      return;
    }
    dispatch({ type: 'set-upload-status', status: { kind: 'status', message: 'Procesando imágenes localmente…' } });
    const result = await loadImageFiles(files);
    const cards = [...model.state.cards];
    for (const image of result.accepted) {
      cards.push({ id: `card-${Date.now()}-${cards.length}`, name: image.name, quantity: 1, image });
    }
    dispatch({ type: 'replace-cards', cards });
    if (result.rejected.length > 0) {
      dispatch({ type: 'set-diagnostics', messages: result.rejected.map((item) => item.message) });
    }
    const acceptedMessage = result.accepted.length === 1 ? '1 imagen cargada.' : `${result.accepted.length} imágenes cargadas.`;
    const rejectedMessage = result.rejected.length === 0 ? '' : ` ${result.rejected.length === 1 ? '1 archivo rechazado.' : `${result.rejected.length} archivos rechazados.`}`;
    dispatch({ type: 'set-upload-status', status: {
      kind: result.rejected.length > 0 ? 'error' : 'success',
      message: `${acceptedMessage}${rejectedMessage}`
    } });
  };

  fileInput.addEventListener('change', async (event) => {
    await processFiles(event.target.files);
    event.target.value = '';
  });

  root.addEventListener('dragover', (event) => event.preventDefault());
  root.addEventListener('drop', (event) => event.preventDefault());
  dropzone.addEventListener('dragenter', (event) => {
    event.preventDefault();
    dropzone.classList.add('is-dragging');
  });
  dropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropzone.classList.add('is-dragging');
  });
  dropzone.addEventListener('dragleave', (event) => {
    event.preventDefault();
    dropzone.classList.remove('is-dragging');
  });
  dropzone.addEventListener('drop', async (event) => {
    event.preventDefault();
    dropzone.classList.remove('is-dragging');
    await processFiles(event.dataTransfer?.files);
  });
  dropzone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInput.click();
    }
  });
  root.querySelectorAll('[data-action="remove"]').forEach((button) => {
    button.addEventListener('click', () => dispatch({
      type: 'remove-card',
      id: button.closest('[data-card-id]').dataset.cardId
    }));
  });
  root.querySelectorAll('[data-role="name"]').forEach((field) => {
    field.addEventListener('change', () => {
      const value = field.value.trim();
      const id = field.closest('[data-card-id]').dataset.cardId;
      if (!value) {
        dispatch({ type: 'set-diagnostics', messages: [`El nombre de la carta ${id} no puede estar vacío.`] });
        return;
      }
      dispatch({ type: 'update-card', id, changes: { name: value }, ...preserveCarouselPosition() });
    });
  });
  root.querySelectorAll('[data-role="quantity"]').forEach((field) => {
    field.addEventListener('change', () => {
      const id = field.closest('[data-card-id]').dataset.cardId;
      const rawValue = field.value.trim();
      const quantity = Number(rawValue);
      if (!rawValue || !Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
        dispatch({ type: 'set-diagnostics', messages: [`La cantidad de la carta ${id} debe ser un entero entre 1 y 10000.`] });
        return;
      }
      dispatch({ type: 'update-card', id, changes: { quantity }, ...preserveCarouselPosition() });
    });
  });
  root.querySelectorAll('[data-role="width"], [data-role="height"]').forEach((field) => {
    field.addEventListener('change', () => {
      const row = field.closest('[data-card-id]');
      const id = row.dataset.cardId;
      const widthField = row.querySelector('[data-role="width"]');
      const heightField = row.querySelector('[data-role="height"]');
      const width = Number(widthField.value.trim());
      const height = Number(heightField.value.trim());
      if (!Number.isFinite(width) || !Number.isFinite(height) || width < 0.1 || height < 0.1 || width > 1000 || height > 1000) {
        dispatch({ type: 'set-diagnostics', messages: [`Las dimensiones de la carta ${id} deben ser números entre 0.1 y 1000 mm.`] });
        return;
      }
      dispatch({ type: 'set-config', changes: { cardTypes: { [id]: { width, height } } } });
    });
  });
  root.querySelectorAll('[data-back-specific="true"]').forEach((input) => {
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      const cardId = input.id.slice('back-card-'.length);
      try {
        const image = await loadImageFile(file);
        dispatch({ type: 'set-back-design', changes: { byCard: { [cardId]: image } } });
        dispatch({ type: 'set-back-specific-enabled', id: cardId, enabled: true });
        dispatch({ type: 'set-back-error', errors: { [input.id]: '' } });
      } catch (error) {
        dispatch({ type: 'set-back-error', errors: { [input.id]: error instanceof Error ? error.message : 'No se pudo cargar el respaldo.' } });
      } finally {
        input.value = '';
      }
    });
  });
  root.querySelectorAll('[data-back-specific-toggle="true"]').forEach((input) => {
    input.addEventListener('change', () => dispatch({
      type: 'set-back-specific-enabled',
      id: input.id.slice('back-specific-enabled-'.length),
      enabled: input.checked
    }));
  });
  root.querySelectorAll('[data-back-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.backRemove;
      if (!id.startsWith('back-card-')) return;
      dispatch({ type: 'set-back-design', changes: { byCard: { [id.slice(10)]: null } } });
      dispatch({ type: 'set-back-error', errors: { [id]: '' } });
    });
  });
}
