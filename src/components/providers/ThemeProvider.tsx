'use client'

import { createContext, useContext, useState } from 'react'
import { getThemeVars } from '@/lib/theme-vars'
import type { Theme } from '@/lib/theme-vars'

function applyVars(vars: Record<string, string>) {
  Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v))
}

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'dark', toggle: () => {} })

interface Props {
  children: React.ReactNode
  initialTheme?: Theme
}

export function ThemeProvider({ children, initialTheme = 'dark' }: Props) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyVars(getThemeVars(next))
    localStorage.setItem('theme', next)
    document.cookie = `theme=${next}; path=/; max-age=${365 * 24 * 3600}`
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
