// Search query logging hook (E4.1, T10 · ADM-FR-010).
//
// Fire-and-forget writer for the `search_queries` table. Any search
// handler (content/place/event) should call `logSearchQuery` on every
// query — the admin analytics endpoints aggregate over this table.
//
// Writes are intentionally non-blocking: a logging failure must never
// break a user-facing search call. Callers invoke with `void` so the
// promise isn't awaited.

import { supabase } from '../lib/supabase.js'

const MAX_QUERY_LEN = 200

export interface LogSearchQueryInput {
  query: string
  userId?: string | null
  sessionId?: string | null
  resultCount: number
}

/**
 * Write a single search event. Returns the inserted row id (for the
 * caller to stash on the response so a subsequent click can be
 * attributed back via `recordSearchClick`). Returns `null` on failure
 * — never throws.
 */
export async function logSearchQuery(
  input: LogSearchQueryInput,
): Promise<string | null> {
  const trimmed = input.query.trim()
  if (trimmed.length === 0) return null

  const truncated = trimmed.slice(0, MAX_QUERY_LEN)
  const normalized = truncated.toLowerCase()

  try {
    const { data, error } = await supabase
      .from('search_queries')
      .insert({
        query: truncated,
        normalized_query: normalized,
        result_count: input.resultCount,
        user_id: input.userId ?? null,
        session_id: input.sessionId ?? null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[search-log] insert failed:', error.message)
      return null
    }
    return (data as { id: string } | null)?.id ?? null
  } catch (err) {
    console.error('[search-log] threw:', err)
    return null
  }
}

export interface RecordSearchClickInput {
  searchId: string
  resultId: string
  resultType: string
}

/**
 * Attach a click to a previously-logged search. Used for CTR
 * analytics. Like `logSearchQuery`, failures are swallowed.
 */
export async function recordSearchClick(
  input: RecordSearchClickInput,
): Promise<void> {
  try {
    const { error } = await supabase
      .from('search_queries')
      .update({
        clicked_result_id: input.resultId,
        clicked_result_type: input.resultType,
        clicked_at: new Date().toISOString(),
      })
      .eq('id', input.searchId)

    if (error) {
      console.error('[search-log] click update failed:', error.message)
    }
  } catch (err) {
    console.error('[search-log] click threw:', err)
  }
}
