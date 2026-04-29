import { redirect } from 'next/navigation'

/**
 * /feed is now an alias for the home feed at /.
 * Preserve query params so deep links keep working.
 */
interface Props {
  searchParams: Promise<Record<string, string>>
}

export default async function FeedAlias({ searchParams }: Props) {
  const sp = await searchParams
  const qs = new URLSearchParams(sp).toString()
  redirect(qs ? `/?${qs}` : '/')
}
