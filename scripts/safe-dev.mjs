import { randomUUID, createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { applicationPaths, developmentPaths, executionArguments, installationDockerfile, nodeImage, requireLocalDocker, snapshotProject, validateDependencies } from './safe-check.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export { applicationPaths, developmentPaths, nodeImage, requireLocalDocker }

export function serverCommand(mode) {
  if (!['dev', 'preview'].includes(mode)) throw new Error('Solo se permiten dev y preview; no se aceptan argumentos extra.')
  const vite = 'node /opt/project/node_modules/vite/bin/vite.js'
  const serve = `${vite}${mode === 'preview' ? ' preview' : ''} --host 127.0.0.1 --port 5173 --strictPort`
  return mode === 'preview' ? `${vite} build && ${serve}` : serve
}

export function runtimeArguments(name, image, mode) {
  const args = executionArguments(name, image, 'build')
  args[args.length - 1] = 'cp -R /opt/project /tmp/project && touch /tmp/project-ready && node /opt/container-bridge.mjs wait'
  return args
}

export function sourcePayload(directory) {
  const files = []
  function visit(relative) {
    for (const entry of readdirSync(join(directory, relative), { withFileTypes: true })) {
      const path = join(relative, entry.name)
      if (entry.isDirectory()) visit(path)
      else if (entry.isFile()) files.push([path.split('\\').join('/'), readFileSync(join(directory, path)).toString('base64')])
      else throw new Error('Snapshot no compatible.')
    }
  }
  visit('')
  const payload = JSON.stringify(files)
  if (Buffer.byteLength(payload) > 128 * 1024 * 1024) throw new Error('El snapshot supera 128 MiB.')
  return payload
}

function docker(args, input) {
  return new Promise((resolveResult, reject) => {
    const child = spawn('docker', args, { env: cleanEnv(), stdio: ['pipe', 'pipe', 'pipe'] })
    let output = ''; let errors = ''
    const timeout = setTimeout(() => { child.kill(); reject(new Error('Docker agotó el tiempo de espera. No existe fallback al host.')) }, 10 * 60 * 1000)
    child.stdout.on('data', (chunk) => { output += chunk })
    child.stderr.on('data', (chunk) => { errors = (errors + chunk).slice(-4000) })
    child.on('error', (error) => { clearTimeout(timeout); reject(new Error(`Docker no está instalado o disponible: ${error.message}. No existe fallback al host.`)) })
    child.on('close', (code) => { clearTimeout(timeout); code === 0 ? resolveResult(output.trim()) : reject(new Error(`Falló Docker: ${errors || code}. No existe fallback al host.`)) })
    child.stdin.on('error', () => {}); if (input) child.stdin.end(input); else child.stdin.end()
  })
}

function cleanEnv() { const env = { ...process.env }; delete env.NODE_OPTIONS; delete env.NODE_PATH; return env }

export async function main(mode) {
  const command = serverCommand(mode)
  const directory = mkdtempSync(join(tmpdir(), 'editor-mazos-safe-dev-'))
  const id = randomUUID(); const name = `editor-mazos-${mode}-${id}`; const image = `${name}:dependencies`; const runtime = `${name}:runtime`; const staging = `${name}-stage`
  const children = new Set(); const sockets = new Set(); let stopping = false; let timer; let dockerReady = false
  let rejectStop; const stopped = new Promise((_, reject) => { rejectStop = reject }); stopped.catch(() => {})
  const stop = (error) => { if (stopping) return; stopping = true; rejectStop(error); for (const child of children) child.kill('SIGTERM') }
  const interrupt = () => stop(new Error('Desarrollo detenido; recursos eliminados.'))
  process.on('SIGINT', interrupt); process.on('SIGTERM', interrupt)
  const launch = (args, options = {}) => { if (stopping) throw new Error('Launcher detenido.'); const child = spawn('docker', args, { env: cleanEnv(), ...options }); children.add(child); child.on('close', () => children.delete(child)); return child }
  const relay = createServer((socket) => {
    if (stopping || sockets.size >= 32) return socket.destroy()
    sockets.add(socket)
    const child = launch(['exec', '-i', name, 'node', '/opt/container-bridge.mjs', 'connect'])
    socket.pipe(child.stdin); child.stdout.pipe(socket); child.stderr.resume()
    socket.on('error', () => {}); socket.on('close', () => { sockets.delete(socket); child.kill() }); child.on('error', () => socket.destroy()); child.on('close', () => socket.destroy())
  })
  try {
    await new Promise((resolveListen, reject) => { relay.once('error', reject); relay.listen(5173, '127.0.0.1', resolveListen) })
    const endpoint = process.env.DOCKER_HOST && !process.env.DOCKER_CONTEXT ? process.env.DOCKER_HOST : await docker(['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}'])
    requireLocalDocker(endpoint)
    if (await docker(['info', '--format', '{{.OSType}}']) !== 'linux') throw new Error('Docker debe usar contenedores Linux. No existe fallback al host.')
    dockerReady = true
    const install = join(directory, 'install'); snapshotProject(root, install, ['package.json', 'package-lock.json']); validateDependencies(JSON.parse(readFileSync(join(install, 'package.json'))), JSON.parse(readFileSync(join(install, 'package-lock.json')))); writeFileSync(join(install, 'Dockerfile'), installationDockerfile())
    await docker(['build', '--pull', '--tag', image, install]); await docker(['create', '--name', staging, '--network', 'none', image])
    const helper = join(directory, 'helper'); snapshotProject(root, helper, ['scripts/container-bridge.mjs']); await docker(['cp', join(helper, 'scripts/container-bridge.mjs'), `${staging}:/opt/container-bridge.mjs`])
    const initial = join(directory, 'initial'); snapshotProject(root, initial, developmentPaths); await docker(['cp', `${initial}/.`, `${staging}:/opt/project`]); await docker(['commit', staging, runtime]); await docker(runtimeArguments(name, runtime, mode)); await docker(['start', name]); await docker(['exec', name, 'sh', '-c', 'for i in $(seq 1 100); do [ -f /tmp/project-ready ] && exit 0; sleep 0.1; done; exit 1'])
    const source = join(directory, 'source'); let previousHash
    const sync = async () => { rmSync(source, { recursive: true, force: true }); snapshotProject(root, source, developmentPaths); const payload = sourcePayload(source); const hash = createHash('sha256').update(payload).digest('hex'); if (hash !== previousHash) { await docker(['exec', '-i', name, 'node', '/opt/container-bridge.mjs', 'sync'], payload); previousHash = hash } }
    await sync()
    const vite = launch(['exec', '--workdir', '/tmp/project', name, 'sh', '-c', command], { stdio: 'inherit' }); vite.on('close', (code) => stop(new Error(`Vite terminó (${code}).`)))
    if (mode === 'dev') { const poll = async () => { try { await sync(); if (!stopping) timer = setTimeout(poll, 1000) } catch (error) { stop(error) } }; timer = setTimeout(poll, 1000) }
    console.log(`${mode}: http://127.0.0.1:5173 (contenedor offline, sin montajes). Ctrl+C detiene y limpia.`)
    await stopped
  } finally {
    stopping = true; clearTimeout(timer); for (const socket of sockets) socket.destroy(); relay.close(); for (const child of children) child.kill('SIGTERM')
    if (dockerReady) { await Promise.all([docker(['rm', '--force', name, staging]).catch(() => {}), docker(['image', 'rm', runtime, image]).catch(() => {})]) }
    rmSync(directory, { recursive: true, force: true }); process.off('SIGINT', interrupt); process.off('SIGTERM', interrupt)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { try { if (process.argv.length !== 3) throw new Error('Se requiere exactamente dev o preview.'); await main(process.argv[2]) } catch (error) { console.error(error.message); process.exitCode = 1 } }
