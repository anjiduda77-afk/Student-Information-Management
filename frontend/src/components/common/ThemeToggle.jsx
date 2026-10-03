import { useTheme } from '../../context/ThemeContext'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle({ className = '', style = {} }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`au-theme-toggle ${className}`}
      style={style}
      aria-label={`Switch to ${isDark ? 'Bright' : 'Dark'} mode`}
      title={`Switch to ${isDark ? 'Bright Mode' : 'Dark Mode'}`}
    >
      {isDark ? (
        <Sun size={18} className="theme-toggle-icon sun-icon" />
      ) : (
        <Moon size={18} className="theme-toggle-icon moon-icon" />
      )}
      <span className="theme-toggle-indicator" aria-hidden="true" />
    </button>
  )
}
