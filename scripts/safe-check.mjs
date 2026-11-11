import { randomUUID } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const nodeImage = 'docker.io/library/node:22-bookworm-slim@sha256:c3de60bf2f9dd0ac6370e6117950ff62d6e339527e7472301c9c78a017978392'
export const applicationPaths = ['src', 'index.html', 'vite.config.js', 'package.json', 'package-lock.json', 'test', 'scripts', 'docs', 'specs']
export const developmentPaths = applicationPaths

const excludedNames = new Set(['.git', 'node_modules', 'dist', '.aws', '.ssh', '.npmrc', '.env'])

function excluded(name) {
  return excludedNames.has(name) || name.startsWith('.env.') || /\.(pem|key|p12|pfx)$/i.test(name)
}

function rejectSymlinks(path) {
  const stat = lstatSync(path)
  if (stat.isSymbolicLink()) throw new Error(`No se permiten enlaces simbólicos en el sandbox: ${path}.`)
  if (!stat.isDirectory()) {
    if (!stat.isFile()) throw new Error(`Entrada no compatible: ${path}.`)
    return
  }
  for (const name of readdirSync(path)) if (!excluded(name)) rejectSymlinks(join(path, name))
}

export function snapshotProject(from, to, paths = applicationPaths) {
  mkdirSync(to, { recursive: true })
  for (const relative of paths) {
    const source = join(from, relative)
    if (!existsSync(source)) continue
    rejectSymlinks(source)
    cpSync(source, join(to, relative), { recursive: true, filter: (path) => !excluded(path.split(/[\\/]/).at(-1)) })
  }
}

export function validateDependencies(manifest, lock) {
  if (lock.lockfileVersion !== 3 || !lock.packages?.['']) throw new Error('Se requiere package-lock.json con lockfileVersion 3.')
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    const declared = manifest[section] ?? {}
    const locked = lock.packages[''][section] ?? {}
    if (JSON.stringify(Object.entries(declared).sort()) !== JSON.stringify(Object.entries(locked).sort())) throw new Error(`package.json y package-lock.json no coinciden en ${section}.`)
    for (const [name, version] of Object.entries(declared)) {
      if (typeof version !== 'string' || !/^[\d\s.^~<>=|*+xX-]+$/.test(version)) throw new Error(`Dependencia no permitida: ${name}.`)
    }
  }
  for (const [name, entry] of Object.entries(lock.packages)) {
    if (name === '') continue
    if (!name.startsWith('node_modules/') || name.split('/').includes('..') || name.includes('\\') || entry.link) throw new Error(`Ruta de dependencia local o enlazada: ${name}.`)
    let url
    try { url = new URL(entry.resolved) } catch { throw new Error(`URL de descarga inválida: ${name}.`) }
    if (url.protocol !== 'https:' || url.hostname !== 'registry.npmjs.org' || url.port || url.username || url.password || url.search || url.hash) throw new Error(`Origen de dependencia no aprobado: ${name}.`)
    if (typeof entry.integrity !== 'string' || !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(entry.integrity)) throw new Error(`Falta integridad SHA-512: ${name}.`)
  }
}

export function commandFor(mode) {
  const commands = { check: 'node --test && node /opt/project/node_modules/vite/bin/vite.js build', test: 'node --test', build: 'node /opt/project/node_modules/vite/bin/vite.js build' }
  if (!Object.hasOwn(commands, mode)) throw new Error('Solo se permiten check, test y build; no se aceptan argumentos extra.')
  return commands[mode]
}

export function executionArguments(name, image, mode = 'check') {
  return ['create', '--name', name, '--network', 'none', '--user', '1000:1000', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--read-only', '--pids-limit', '128', '--memory', '2g', '--cpus', '2', '--tmpfs', '/tmp:rw,exec,nosuid,size=1g,mode=1777', '--workdir', '/opt/project', '--env', 'CI=true', image, 'sh', '-c', `cp -R /opt/project /tmp/project && cd /tmp/project && ${commandFor(mode)}`]
}

function docker(args, capture = false) {
  const env = { ...process.env }
  delete env.NODE_OPTIONS
  delete env.NODE_PATH
  const result = spawnSync('docker', args, { env, stdio: capture ? 'pipe' : 'inherit', encoding: 'utf8', timeout: 10 * 60 * 1000 })
  if (result.error || result.status !== 0) throw new Error(capture ? 'Docker no está instalado o no está disponible. No existe fallback al host.' : `Falló Docker (${result.status ?? result.error?.message}).`)
  return result.stdout?.trim() ?? ''
}

function requireLinuxDocker() {
  if (docker(['info', '--format', '{{.OSType}}'], true) !== 'linux') throw new Error('Docker debe estar ejecutando contenedores Linux. No existe fallback al host.')
}

export function requireLocalDocker(endpoint) {
  if (!endpoint.startsWith('unix://') && !endpoint.startsWith('npipe://')) throw new Error('Solo se permite un daemon local de Docker; los contextos remotos están bloqueados.')
}

export function installationDockerfile() { return `FROM ${nodeImage}\nWORKDIR /opt/project\nCOPY package.json package-lock.json ./\nRUN npm ci --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org/ && chown -R node:node /opt/project\nUSER node\n` }

export function main(mode = 'check') {
  commandFor(mode)
  const directory = mkdtempSync(join(tmpdir(), 'editor-mazos-safe-check-'))
  const id = randomUUID()
  const image = `editor-mazos-check:${id}`
  const runtimeImage = `${image}-runtime`
  const staging = `editor-mazos-stage-${id}`
  const container = `editor-mazos-run-${id}`
  let built = false; let staged = false; let committed = false; let created = false
  try {
    const install = join(directory, 'install'); mkdirSync(install)
    for (const name of ['package.json', 'package-lock.json']) cpSync(join(root, name), join(install, name))
    validateDependencies(JSON.parse(readFileSync(join(install, 'package.json'))), JSON.parse(readFileSync(join(install, 'package-lock.json'))))
    requireLinuxDocker()
    writeFileSync(join(install, 'Dockerfile'), installationDockerfile())
    docker(['build', '--pull', '--tag', image, install]); built = true
    const source = join(directory, 'source'); snapshotProject(root, source)
    docker(['create', '--name', staging, '--network', 'none', image]); staged = true
    docker(['cp', `${source}/.`, `${staging}:/opt/project`])
    docker(['commit', staging, runtimeImage]); committed = true
    docker(executionArguments(container, runtimeImage, mode)); created = true
    docker(['start', '--attach', container])
    const exit = docker(['inspect', '--format', '{{.State.ExitCode}}', container], true)
    if (exit !== '0') throw new Error(`Las comprobaciones fallaron dentro del sandbox (exit ${exit}).`)
  } finally {
    if (created) spawnSync('docker', ['rm', '--force', container], { stdio: 'ignore', timeout: 30000 })
    if (staged) spawnSync('docker', ['rm', '--force', staging], { stdio: 'ignore', timeout: 30000 })
    if (committed) spawnSync('docker', ['image', 'rm', runtimeImage], { stdio: 'ignore', timeout: 30000 })
    if (built) spawnSync('docker', ['image', 'rm', image], { stdio: 'ignore', timeout: 30000 })
    rmSync(directory, { recursive: true, force: true })
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { if (process.argv.length > 3) throw new Error('No se aceptan argumentos extra.'); main(process.argv[2] ?? 'check') } catch (error) { console.error(error.message); process.exitCode = 1 }
}
