import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('au_theme')
    if (saved === 'bright' || saved === 'dark') return saved
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'bright'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('au_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'bright' ? 'dark' : 'bright'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    return {
      theme: 'bright',
      toggleTheme: () => {},
      isDark: false
    }
  }
  return context
}
