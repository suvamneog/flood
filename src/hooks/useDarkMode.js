import { useEffect, useState, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

export function useDarkMode() {
  const [theme, setTheme] = useLocalStorage('fa-theme', 'light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme, mounted])

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [setTheme])

  return { theme, toggle, isDark: theme === 'dark', mounted }
}
