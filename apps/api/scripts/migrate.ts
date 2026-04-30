#!/usr/bin/env -S pnpm tsx
/**
 * apps/api/scripts/migrate.ts
 *
 * Walks `apps/api/src/db/migrations/*.sql`, applies anything not yet
 * recorded in the `_migrations` tracking table, in numeric filename order.
 * Each file applies inside its own transaction — a failure rolls back
 * just that file and stops the run.
 *
 * Connection: requires `DATABASE_URL` in the environment. Use the
 * "Direct connection" string from Supabase dashboard → Settings → Database
 * → Connection string. The transaction-mode pooler (port 6543) is NOT
 * safe for DDL; use the direct connection (port 5432) or session pooler.
 *   postgres://postgres:<password>@db.<ref>.supabase.co:5432/postgres
 *
 * Usage:
 *   pnpm --filter api migrate                        run pending
 *   pnpm --filter api migrate -- --dry-run           preview
 *   pnpm --filter api migrate -- --status            list applied vs pending
 *   pnpm --filter api migrate -- --from 024          only consider files numbered ≥ 024
 *   pnpm --filter api migrate -- --mark-applied 023  record ≤ 023 as applied without
 *                                                    running. First-time bootstrap.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import pg from 'pg'

const { Client } = pg

interface Args {
  dryRun: boolean
  status: boolean
  from: number | null
  markApplied: number | null
}

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false, status: false, from: null, markApplied: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') args.dryRun = true
    else if (a === '--status') args.status = true
    else if (a === '--from') args.from = parseNumber(argv[++i])
    else if (a === '--mark-applied') args.markApplied = parseNumber(argv[++i])
    else if (a?.startsWith('--from=')) args.from = parseNumber(a.slice(7))
    else if (a?.startsWith('--mark-applied=')) args.markApplied = parseNumber(a.slice(15))
  }
  return args
}

function parseNumber(raw: string | undefined): number {
  if (!raw) {
    console.error('--from / --mark-applied requires a numeric value')
    process.exit(2)
  }
  const n = parseInt(raw.replace(/^0+/, '') || '0', 10)
  if (Number.isNaN(n)) {
    console.error(`Not a number: ${raw}`)
    process.exit(2)
  }
  return n
}

interface MigrationFile {
  filename: string
  number: number
  body: string
  checksum: string
}

const MIGRATIONS_DIR = new URL('../src/db/migrations/', import.meta.url).pathname

function loadMigrations(): MigrationFile[] {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b))
  return files.map((filename) => {
    const m = /^(\d+)_/.exec(filename)
    if (!m) throw new Error(`Migration ${filename} has no leading number`)
    const body = readFileSync(join(MIGRATIONS_DIR, filename), 'utf8')
    return {
      filename,
      number: parseInt(m[1]!, 10),
      body,
      checksum: createHash('sha256').update(body).digest('hex'),
    }
  })
}

const TRACKING_DDL = `
  CREATE TABLE IF NOT EXISTS public._migrations (
    filename    text PRIMARY KEY,
    checksum    text NOT NULL,
    applied_at  timestamptz NOT NULL DEFAULT now()
  );
`

async function loadApplied(client: pg.Client): Promise<Map<string, string>> {
  const { rows } = await client.query<{ filename: string; checksum: string }>(
    'SELECT filename, checksum FROM public._migrations',
  )
  return new Map(rows.map((r) => [r.filename, r.checksum]))
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set.')
    console.error('Add it to apps/api/.env. Format:')
    console.error('  DATABASE_URL=postgres://postgres:<password>@db.<ref>.supabase.co:5432/postgres')
    console.error('From Supabase dashboard → Settings → Database → Connection string → Direct.')
    process.exit(2)
  }

  const all = loadMigrations()
  const client = new Client({ connectionString: url, statement_timeout: 0 })
  await client.connect()
  try {
    await client.query(TRACKING_DDL)
    const applied = await loadApplied(client)

    for (const f of all) {
      const prev = applied.get(f.filename)
      if (prev && prev !== f.checksum) {
        console.warn(
          `⚠ ${f.filename} is recorded with a different checksum than the file on disk. Edits to applied migrations are dangerous.`,
        )
      }
    }

    if (args.markApplied != null) {
      const target = args.markApplied
      let marked = 0
      for (const f of all) {
        if (f.number > target) continue
        if (applied.has(f.filename)) continue
        await client.query(
          'INSERT INTO public._migrations (filename, checksum) VALUES ($1, $2)',
          [f.filename, f.checksum],
        )
        marked += 1
        console.log(`✓ marked ${f.filename}`)
      }
      console.log(`\nDone. Marked ${String(marked)} migration(s) as applied.`)
      return
    }

    if (args.status) {
      console.log('Applied:')
      for (const f of all) {
        if (applied.has(f.filename)) console.log(`  ✓ ${f.filename}`)
      }
      console.log('\nPending:')
      let pending = 0
      for (const f of all) {
        if (!applied.has(f.filename) && (args.from == null || f.number >= args.from)) {
          console.log(`  · ${f.filename}`)
          pending += 1
        }
      }
      if (pending === 0) console.log('  (none)')
      return
    }

    const pending = all.filter(
      (f) => !applied.has(f.filename) && (args.from == null || f.number >= args.from),
    )
    if (pending.length === 0) {
      console.log('No pending migrations.')
      return
    }

    if (args.dryRun) {
      console.log(`Would apply ${String(pending.length)} migration(s):`)
      for (const f of pending) console.log(`  · ${f.filename}`)
      return
    }

    console.log(`Applying ${String(pending.length)} migration(s)...`)
    for (const f of pending) {
      const start = Date.now()
      try {
        await client.query('BEGIN')
        await client.query(f.body)
        await client.query(
          'INSERT INTO public._migrations (filename, checksum) VALUES ($1, $2)',
          [f.filename, f.checksum],
        )
        await client.query('COMMIT')
        const ms = Date.now() - start
        console.log(`✓ ${f.filename} (${String(ms)}ms)`)
      } catch (err: unknown) {
        await client.query('ROLLBACK')
        console.error(`✗ ${f.filename} — rolled back`)
        console.error(err instanceof Error ? err.message : String(err))
        process.exitCode = 1
        return
      }
    }
    console.log(`\nDone.`)
  } finally {
    await client.end()
  }
}

main().catch((err: unknown) => {
  console.error('Migration runner crashed:', err)
  process.exit(1)
})
