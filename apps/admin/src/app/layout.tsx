import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { DarkModeShell } from '../components/DarkModeShell'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'CreatorHub Admin',
    template: '%s · CreatorHub Admin',
  },
  description: 'Internal operations console for CreatorHub.',
  robots: { index: false, follow: false },
}

// Static literal — runs before React hydrates so dark-mode users
// don't see a light flash. Reads the same `admin-dark` key as
// DarkModeShell and adds the `.dark` class to <html>. Not user
// input, safe from XSS.
const themeBootScript =
  "(function(){try{if(localStorage.getItem('admin-dark')==='1')document.documentElement.classList.add('dark')}catch(e){}})()"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <DarkModeShell>{children}</DarkModeShell>
      </body>
    </html>
  )
}
