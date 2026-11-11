const IMAGE_TYPE_PATTERN = /^image\/[a-z0-9.+-]+$/i;

function createImageError(message, cause) {
  const error = new Error(message, cause ? { cause } : undefined);
  error.name = 'ImageLoadError';
  return error;
}

function getFileName(file) {
  return typeof file?.name === 'string' && file.name.trim()
    ? file.name.trim()
    : 'imagen sin nombre';
}

function getMimeType(file) {
  return typeof file?.type === 'string' ? file.type.trim().toLowerCase() : '';
}

function getDisplayName(fileName) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  return withoutExtension.trim() || 'Carta sin nombre';
}

function validateImageFile(file) {
  if (!file || typeof file !== 'object') {
    throw createImageError('El archivo de imagen no es válido.');
  }

  const mimeType = getMimeType(file);
  if (!IMAGE_TYPE_PATTERN.test(mimeType)) {
    throw createImageError(`El archivo ${getFileName(file)} no tiene un tipo de imagen válido.`);
  }

  return { fileName: getFileName(file), mimeType };
}

function defaultReaderFactory() {
  if (typeof globalThis.FileReader !== 'function') {
    throw createImageError('El navegador no proporciona FileReader para leer imágenes localmente.');
  }

  return new globalThis.FileReader();
}

export function readFileAsDataUrl(file, { readerFactory = defaultReaderFactory } = {}) {
  validateImageFile(file);

  return new Promise((resolve, reject) => {
    let reader;
    try {
      reader = readerFactory();
    } catch (error) {
      reject(error instanceof Error ? error : createImageError('No se pudo preparar la lectura.', error));
      return;
    }

    reader.onload = () => {
      if (typeof reader.result !== 'string' || !reader.result) {
        reject(createImageError(`No se pudo leer ${getFileName(file)} como imagen.`));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = (event) => {
      const cause = event instanceof Error ? event : undefined;
      const detail = cause?.message ? ` ${cause.message}` : '';
      reject(createImageError(`No se pudo leer ${getFileName(file)}.${detail}`, cause));
    };
    reader.onabort = () => {
      reject(createImageError(`La lectura de ${getFileName(file)} fue cancelada.`));
    };

    try {
      reader.readAsDataURL(file);
    } catch (error) {
      reject(createImageError(`No se pudo leer ${getFileName(file)}.`, error));
    }
  });
}

export async function loadImageFile(file, options = {}) {
  const { fileName, mimeType } = validateImageFile(file);
  const dataUrl = await readFileAsDataUrl(file, options);

  return {
    fileName,
    name: getDisplayName(fileName),
    mimeType,
    dataUrl,
    size: Number.isFinite(file.size) ? file.size : null,
    lastModified: Number.isFinite(file.lastModified) ? file.lastModified : null
  };
}

export async function loadImageFiles(files = [], options = {}) {
  if (!files || typeof files[Symbol.iterator] !== 'function') {
    throw new TypeError('La selección de archivos debe ser iterable.');
  }

  const entries = Array.from(files);
  const results = await Promise.all(entries.map(async (file, index) => {
    try {
      return { index, status: 'accepted', image: await loadImageFile(file, options) };
    } catch (error) {
      return {
        index,
        status: 'rejected',
        rejected: {
          fileName: getFileName(file),
          message: error instanceof Error ? error.message : 'No se pudo leer la imagen.'
        }
      };
    }
  }));

  return {
    accepted: results.filter((result) => result.status === 'accepted').map((result) => result.image),
    rejected: results.filter((result) => result.status === 'rejected').map((result) => result.rejected)
  };
}

export { IMAGE_TYPE_PATTERN, validateImageFile };
