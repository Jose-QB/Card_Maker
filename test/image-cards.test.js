import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  loadImageFile,
  loadImageFiles
} from '../src/services/image-loader.js';
import {
  addCard,
  createCardFromImage,
  updateCard,
  removeCard
} from '../src/utils/cards.js';

function createReaderFactory({ result, error } = {}) {
  return () => {
    const reader = {
      result: null,
      onload: null,
      onerror: null,
      readAsDataURL() {
        if (error) {
          this.onerror?.(error);
          return;
        }

        this.result = result;
        this.onload?.();
      }
    };
    return reader;
  };
}

function createFile(name, type, result = `data:${type};base64,AAAA`) {
  return { name, type, size: 12, lastModified: 123, result };
}

test('carga imágenes válidas y conserva PNG y JPEG', async () => {
  const png = await loadImageFile(createFile('frente.png', 'image/png'), {
    readerFactory: createReaderFactory({ result: 'data:image/png;base64,PNG' })
  });
  const jpeg = await loadImageFile(createFile('reverso.jpg', 'image/jpeg'), {
    readerFactory: createReaderFactory({ result: 'data:image/jpeg;base64,JPEG' })
  });

  assert.equal(png.mimeType, 'image/png');
  assert.equal(png.dataUrl, 'data:image/png;base64,PNG');
  assert.equal(jpeg.mimeType, 'image/jpeg');
  assert.equal(jpeg.dataUrl, 'data:image/jpeg;base64,JPEG');
});

test('rechaza archivos no imagen y errores de lectura', async () => {
  await assert.rejects(
    loadImageFile(createFile('notas.txt', 'text/plain'), {
      readerFactory: () => {
        throw new Error('no debe leer un archivo inválido');
      }
    }),
    /tipo de imagen/i
  );

  await assert.rejects(
    loadImageFile(createFile('rota.png', 'image/png'), {
      readerFactory: createReaderFactory({ error: new Error('fallo de lectura') })
    }),
    /fallo de lectura/i
  );
});

test('la carga mixta conserva válidas y reporta inválidas en su posición', async () => {
  const result = await loadImageFiles([
    createFile('uno.png', 'image/png'),
    createFile('datos.csv', 'text/csv'),
    createFile('dos.jpeg', 'image/jpeg')
  ], {
    readerFactory: createReaderFactory({ result: 'data:image/test;base64,OK' })
  });

  assert.deepEqual(result.accepted.map((image) => image.fileName), ['uno.png', 'dos.jpeg']);
  assert.equal(result.rejected.length, 1);
  assert.equal(result.rejected[0].fileName, 'datos.csv');
  assert.match(result.rejected[0].message, /tipo de imagen/i);
});

test('crea una carta con identidad, nombre, cantidad e imagen local', () => {
  const image = {
    fileName: 'guerrero.png',
    name: 'guerrero',
    mimeType: 'image/png',
    dataUrl: 'data:image/png;base64,PNG'
  };
  const card = createCardFromImage(image, {
    idFactory: () => 'card-1',
    name: 'Guerrero',
    quantity: 3
  });

  assert.deepEqual(card, {
    id: 'card-1',
    name: 'Guerrero',
    quantity: 3,
    image
  });
});

test('edita nombre y cantidad sin cambiar identidad ni formato', () => {
  const image = {
    fileName: 'carta.jpg',
    name: 'carta',
    mimeType: 'image/jpeg',
    dataUrl: 'data:image/jpeg;base64,JPEG'
  };
  const cards = [createCardFromImage(image, { idFactory: () => 'card-1' })];
  const updated = updateCard(cards, 'card-1', { name: 'Maga', quantity: 4 });

  assert.equal(updated[0].id, 'card-1');
  assert.equal(updated[0].name, 'Maga');
  assert.equal(updated[0].quantity, 4);
  assert.equal(updated[0].image.mimeType, 'image/jpeg');
  assert.equal(updated[0].image.dataUrl, image.dataUrl);
  assert.notStrictEqual(updated, cards);
});

test('añade y elimina una carta sin mutar la colección original', () => {
  const image = {
    fileName: 'carta.png',
    name: 'carta',
    mimeType: 'image/png',
    dataUrl: 'data:image/png;base64,PNG'
  };
  const cards = [];
  const added = addCard(cards, image, { idFactory: () => 'card-1', quantity: 2 });
  const remaining = removeCard(added, 'card-1');

  assert.deepEqual(cards, []);
  assert.equal(added.length, 1);
  assert.equal(added[0].quantity, 2);
  assert.deepEqual(remaining, []);
});

test('rechaza cantidades que no son enteros positivos', () => {
  const image = {
    fileName: 'carta.png',
    name: 'carta',
    mimeType: 'image/png',
    dataUrl: 'data:image/png;base64,PNG'
  };

  assert.throws(
    () => createCardFromImage(image, { quantity: 0 }),
    /entero positivo/i
  );
  assert.throws(
    () => createCardFromImage(image, { quantity: 1.5 }),
    /entero positivo/i
  );
});
