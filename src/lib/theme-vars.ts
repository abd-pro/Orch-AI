export type Theme = 'dark' | 'light'

const THEME_VARS: Record<Theme, Record<string, string>> = {
  dark:  { '--bg': '#111113', '--bg-alt': '#0d0d0f', '--surface': '#18181b', '--sur2': '#27272a', '--bdr': '#3f3f46', '--mu3': '#52525b', '--mu2': '#71717a', '--mu1': '#a1a1aa', '--tx2': '#d4d4d8', '--tx1': '#e4e4e7', '--fg': '#f4f4f5' },
  light: { '--bg': '#ffffff', '--bg-alt': '#f4f4f5', '--surface': '#ececee', '--sur2': '#e4e4e7', '--bdr': '#d4d4d8', '--mu3': '#a1a1aa', '--mu2': '#71717a', '--mu1': '#52525b', '--tx2': '#3f3f46', '--tx1': '#27272a', '--fg': '#09090b' },
}

export function getThemeVars(theme: Theme): Record<string, string> {
  return THEME_VARS[theme] ?? THEME_VARS.dark
}
