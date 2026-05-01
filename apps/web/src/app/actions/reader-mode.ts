'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { READER_MODE_COOKIE, type ReaderMode } from '@/lib/reader-mode'

const ALLOWED: readonly ReaderMode[] = ['magazine', 'compact']

/**
 * Server Action — toggles the reader mode cookie + revalidates the current
 * content page so SSR re-renders with the new mode.
 *
 * Called by the Aa button in <ReaderChrome>. The button passes its current
 * pathname so we can revalidate just that page (cheaper than revalidating
 * the whole `/content` segment).
 */
export async function toggleReaderModeAction(
  pathname: string,
): Promise<{ mode: ReaderMode }> {
  const store = await cookies()
  const current = store.get(READER_MODE_COOKIE)?.value
  const currentMode: ReaderMode =
    current && (ALLOWED as readonly string[]).includes(current)
      ? (current as ReaderMode)
      : 'magazine'
  const nextMode: ReaderMode = currentMode === 'magazine' ? 'compact' : 'magazine'
  store.set(READER_MODE_COOKIE, nextMode, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })
  // Only revalidate the path the user is on; defensive against an
  // attacker passing an arbitrary pathname.
  if (pathname.startsWith('/content/')) {
    revalidatePath(pathname)
  }
  return { mode: nextMode }
}
