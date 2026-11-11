import assert from 'node:assert/strict'
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { commandFor, executionArguments, installationDockerfile, nodeImage, snapshotProject, validateDependencies } from '../scripts/safe-check.mjs'
import { runtimeArguments, serverCommand } from '../scripts/safe-dev.mjs'

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)))

test('los comandos públicos del editor pasan por lanzadores aislados', () => {
  assert.equal(manifest.scripts.test, 'node scripts/safe-check.mjs test')
  assert.equal(manifest.scripts.build, 'vite build')
  assert.equal(manifest.scripts.check, 'node scripts/safe-check.mjs check')
  assert.equal(manifest.scripts.dev, 'node scripts/safe-dev.mjs dev')
  assert.equal(manifest.scripts.preview, 'node scripts/safe-dev.mjs preview')
  for (const mode of ['check', 'test', 'build']) assert.doesNotThrow(() => commandFor(mode))
  for (const mode of ['lint', 'dev', 'check && curl example.com', '__proto__']) assert.throws(() => commandFor(mode))
})

test('el contenedor de comprobación fija Node y endurece la ejecución', () => {
  assert.ok(existsSync(new URL('../Dockerfile', import.meta.url)))
  assert.match(installationDockerfile(), new RegExp(`^FROM ${nodeImage.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}`))
  const args = executionArguments('editor-mazos-test', 'editor-mazos-image', 'check')
  assert.equal(args[args.indexOf('--network') + 1], 'none')
  assert.equal(args[args.indexOf('--user') + 1], '1000:1000')
  assert.equal(args[args.indexOf('--security-opt') + 1], 'no-new-privileges')
  for (const flag of ['--read-only', '--cap-drop', '--pids-limit', '--memory', '--cpus', '--tmpfs']) assert.ok(args.includes(flag))
  for (const flag of ['--mount', '--volume', '-v', '--publish', '-p', '--privileged']) assert.equal(args.includes(flag), false)
  assert.match(args.at(-1), /node --test/)
})

test('dev y preview usan solo comandos fijos dentro del contenedor', () => {
  assert.match(serverCommand('dev'), /--host 127\.0\.0\.1 --port 5173 --strictPort$/)
  assert.match(serverCommand('preview'), /vite\.js build &&/)
  assert.throws(() => serverCommand('dev --host 0.0.0.0'))
  const args = runtimeArguments('editor-mazos-dev', 'editor-mazos-runtime', 'dev')
  assert.equal(args[args.indexOf('--network') + 1], 'none')
  assert.equal(args.includes('--publish'), false)
})

test('la instantánea excluye secretos, dependencias y artefactos generados', () => {
  const base = mkdtempSync(join(tmpdir(), 'editor-mazos-t8-'))
  try {
    const source = join(base, 'source'); const output = join(base, 'output')
    mkdirSync(join(source, 'src'), { recursive: true }); mkdirSync(join(source, 'node_modules'))
    writeFileSync(join(source, 'src', 'app.js'), 'export const value = 1')
    writeFileSync(join(source, '.env.local'), 'TOKEN=secreto')
    writeFileSync(join(source, '.npmrc'), 'token=secreto')
    snapshotProject(source, output, ['src', '.env.local', '.npmrc', 'node_modules'])
    assert.equal(readFileSync(join(output, 'src', 'app.js'), 'utf8'), 'export const value = 1')
    assert.equal(existsSync(join(output, '.env.local')), false)
    assert.equal(existsSync(join(output, '.npmrc')), false)
    assert.equal(existsSync(join(output, 'node_modules')), false)
  } finally { rmSync(base, { recursive: true, force: true }) }
})

test('las dependencias deben coincidir con lockfile y provenir del registro HTTPS', () => {
  const cleanManifest = { dependencies: { example: '^1.0.0' } }
  const cleanLock = { lockfileVersion: 3, packages: { '': { dependencies: { example: '^1.0.0' } }, 'node_modules/example': { resolved: 'https://registry.npmjs.org/example/-/example-1.0.0.tgz', integrity: 'sha512-YWJjZA==' } } }
  assert.doesNotThrow(() => validateDependencies(cleanManifest, cleanLock))
  for (const resolved of ['http://registry.npmjs.org/example.tgz', 'https://evil.example/example.tgz', 'https://user:secret@registry.npmjs.org/example.tgz', 'file:../example']) {
    assert.throws(() => validateDependencies(cleanManifest, { ...cleanLock, packages: { ...cleanLock.packages, 'node_modules/example': { ...cleanLock.packages['node_modules/example'], resolved } } }))
  }
})
