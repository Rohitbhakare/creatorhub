#!/usr/bin/env -S pnpm tsx
/**
 * OpenAPI drift checker — best-effort listing.
 *
 * Walks every `apps/api/src/routes/*.ts` and `apps/api/src/index.ts`, pulls
 * out Hono route registrations (`router.<method>('/<path>', ...)`), and
 * compares them against the paths declared in `docs/engineering/openapi.yaml`.
 *
 * Limitations:
 *   - Hono prefixes resolved via `app.route('/v1/foo', fooRoutes)` are
 *     reconstructed by reading the `index.ts` route() calls.
 *   - Path-param syntax differs (Hono `:id` vs OpenAPI `{id}`); normalised.
 *   - Method + path only, not request/response bodies.
 *
 * Usage:  cd apps/api && pnpm tsx scripts/check-openapi-drift.ts
 */
import { readFile } from 'node:fs/promises'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('../', import.meta.url).pathname
const ROUTES_DIR = join(ROOT, 'src/routes')
const INDEX_TS = join(ROOT, 'src/index.ts')
const OPENAPI = join(ROOT, '../../docs/engineering/openapi.yaml')

interface Endpoint { method: string; path: string }

const HONO_RE = /\b\w+\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g
const ROUTE_MOUNT_RE = /\bapp\.route\(\s*['"`]([^'"`]+)['"`]\s*,\s*(\w+)/g

async function readPrefixMap(): Promise<Map<string, string>> {
  const src = await readFile(INDEX_TS, 'utf8')
  const map = new Map<string, string>()
  for (const m of src.matchAll(ROUTE_MOUNT_RE)) {
    map.set(m[2]!, m[1]!)
  }
  return map
}

async function endpointsFromFile(path: string, prefixMap: Map<string, string>): Promise<Endpoint[]> {
  const src = await readFile(path, 'utf8')
  const decl = /\b(?:const|let)\s+(\w+)\s*=\s*new\s+Hono/.exec(src)
  const routerVar = decl?.[1]
  const prefix = routerVar ? prefixMap.get(routerVar) ?? '' : ''
  const out: Endpoint[] = []
  for (const m of src.matchAll(HONO_RE)) {
    const method = m[1]!.toUpperCase()
    const sub = m[2]!
    // Hono accepts middleware as positional args before the handler; the
    // first string literal isn't always the path. Filter to anything that
    // looks like a route (must start with `/` or be the empty-segment `''`).
    if (!sub.startsWith('/')) continue
    const full = (prefix + (sub === '/' ? '' : sub)) || '/'
    out.push({ method, path: normalise(full) })
  }
  return out
}

function normalise(p: string): string {
  return p.replace(/:([A-Za-z0-9_]+)/g, '{$1}')
}

async function collectHandlers(): Promise<Endpoint[]> {
  const map = await readPrefixMap()
  const files = readdirSync(ROUTES_DIR).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
  const all: Endpoint[] = []
  for (const f of files) all.push(...(await endpointsFromFile(join(ROUTES_DIR, f), map)))
  all.push(...(await endpointsFromFile(INDEX_TS, map)))
  return all
}

async function collectSpec(): Promise<Endpoint[]> {
  const text = await readFile(OPENAPI, 'utf8')
  const out: Endpoint[] = []
  let cur: string | null = null
  for (const line of text.split('\n')) {
    const p = /^ {2}(\/[^:]+):\s*$/.exec(line)
    if (p) { cur = p[1]!; continue }
    if (cur) {
      const m = /^ {4}(get|post|put|patch|delete):\s*$/.exec(line)
      if (m) out.push({ method: m[1]!.toUpperCase(), path: cur })
    }
    if (/^[A-Za-z]/.test(line)) cur = null
  }
  return out
}

const key = (e: Endpoint): string => `${e.method} ${e.path}`

async function main(): Promise<void> {
  const handlers = await collectHandlers()
  const spec = await collectSpec()
  const handlerKeys = new Set(handlers.map(key))
  const specKeys = new Set(spec.map(key))

  const missingFromSpec = handlers.filter((e) => !specKeys.has(key(e))).sort((a, b) => key(a).localeCompare(key(b)))
  const missingFromCode = spec.filter((e) => !handlerKeys.has(key(e))).sort((a, b) => key(a).localeCompare(key(b)))

  console.log(`\nHandler endpoints: ${String(handlers.length)}`)
  console.log(`OpenAPI endpoints: ${String(spec.length)}\n`)

  if (missingFromSpec.length) {
    console.log(`-- In code, missing from openapi.yaml (${String(missingFromSpec.length)})`)
    for (const e of missingFromSpec) console.log(`   ${e.method.padEnd(6)} ${e.path}`)
    console.log('')
  }
  if (missingFromCode.length) {
    console.log(`-- In openapi.yaml, missing from code (${String(missingFromCode.length)})`)
    for (const e of missingFromCode) console.log(`   ${e.method.padEnd(6)} ${e.path}`)
    console.log('')
  }
  if (!missingFromSpec.length && !missingFromCode.length) {
    console.log('No drift detected (best-effort match).')
  } else {
    console.log('Drift found. Some entries may be false positives — prefix resolution is best-effort.')
  }
}

main().catch((err: unknown) => {
  console.error('Drift checker failed:', err)
})
