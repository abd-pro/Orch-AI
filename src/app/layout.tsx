import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { getThemeVars } from '@/lib/theme-vars'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'orch.AI — Orchestrez vos IA',
  description: 'Interrogez plusieurs IA simultanément et obtenez la meilleure réponse synthétisée.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies()
  const theme = (jar.get('theme')?.value ?? 'dark') as 'dark' | 'light'
  const themeStyle = getThemeVars(theme) as React.CSSProperties

  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full`}
          style={themeStyle} data-theme={theme} suppressHydrationWarning>
      <body className="h-full antialiased">
        <ThemeProvider initialTheme={theme}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
