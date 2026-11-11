import { createConnection } from 'node:net'
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export function safePath(name) {
  if (typeof name !== 'string' || !name || name.startsWith('/') || name.includes('\\') || name.split('/').some((part) => !part || part === '.' || part === '..') || name.split('/').includes('node_modules')) throw new Error('Ruta de sincronización inválida.')
  const target = join('/tmp/project', name)
  for (let path = target; path !== '/tmp'; path = dirname(path)) if (existsSync(path) && lstatSync(path).isSymbolicLink()) throw new Error('Enlace simbólico en el destino de sincronización.')
  return target
}

export function synchronize(files) {
  const state = '/tmp/source-files.json'
  const previous = existsSync(state) ? JSON.parse(readFileSync(state, 'utf8')) : []
  const names = files.map(([name]) => name)
  for (const name of previous) if (!names.includes(name)) rmSync(safePath(name), { force: true })
  for (const [name, data] of files) { const path = safePath(name); const bytes = Buffer.from(data, 'base64'); if (existsSync(path) && readFileSync(path).equals(bytes)) continue; mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, bytes) }
  writeFileSync(state, JSON.stringify(names))
}

if (process.argv[2] === 'connect') { const socket = createConnection({ host: '127.0.0.1', port: 5173 }); socket.on('error', () => process.exit(1)); process.stdin.pipe(socket); socket.pipe(process.stdout); process.stdin.on('end', () => socket.end()); socket.on('close', () => process.exit()) }
else if (process.argv[2] === 'sync') { const chunks = []; let size = 0; for await (const chunk of process.stdin) { size += chunk.length; if (size > 128 * 1024 * 1024) throw new Error('El snapshot supera 128 MiB.'); chunks.push(chunk) } synchronize(JSON.parse(Buffer.concat(chunks).toString())) }
else if (process.argv[2] === 'wait') setInterval(() => {}, 60000)
