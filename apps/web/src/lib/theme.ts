import 'server-only'
import { cookies } from 'next/headers'

export type ThemeName = 'paper' | 'snow' | 'bone' | 'ink'
export type CoralHue = 'coral' | 'terracotta' | 'saffron'

const VALID_THEMES = new Set<ThemeName>(['paper', 'snow', 'bone', 'ink'])
const VALID_CORALS = new Set<CoralHue>(['coral', 'terracotta', 'saffron'])

export async function getTheme(): Promise<ThemeName> {
  const jar = await cookies()
  const v = jar.get('ch_theme')?.value as ThemeName | undefined
  return v && VALID_THEMES.has(v) ? v : 'paper'
}

export async function getCoralHue(): Promise<CoralHue> {
  const jar = await cookies()
  const v = jar.get('ch_coral')?.value as CoralHue | undefined
  return v && VALID_CORALS.has(v) ? v : 'coral'
}
