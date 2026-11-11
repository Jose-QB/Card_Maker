import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('el bootstrap declara un proyecto ESM con comandos públicos mínimos', () => {
  assert.equal(packageJson.type, 'module');
  assert.deepEqual(Object.keys(packageJson.scripts).sort(), [
    'build',
    'check',
    'dev',
    'preview',
    'test'
  ]);
});

test('el punto de entrada del proyecto existe sin importar lógica de producto', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<!DOCTYPE html>/i);
  assert.match(html, /<html\b/i);
  assert.match(html, /<main\b/i);
  assert.match(html, /<script[^>]+type=["']module["'][^>]+src=["']\/src\/app\.js["']/i);
  assert.doesNotMatch(html, /<script[^>]+src=["']https?:/i);
  assert.doesNotMatch(html, /<button[^>]*>[^<]*(?:Generar PDF|Actualizar Vista Previa)/i);
});

test('el shell declara regiones accesibles para controles, cartas, diagnósticos y acciones futuras', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id=["']app["']/i);
  assert.match(html, /aria-live=["']polite["']/i);
  assert.match(html, /aria-live=["']assertive["']/i);
});

test('la composición de UI está separada del shell y expone componentes T4', async () => {
  const files = await Promise.all([
    readFile(new URL('../src/app.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/controls.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/card-list.js', import.meta.url), 'utf8')
  ]);
  assert.match(files[0], /createInitialState/);
  assert.match(files[0], /calculateLayout/);
  assert.match(files[1], /renderControls/);
  assert.match(files[2], /renderCardList/);
});
