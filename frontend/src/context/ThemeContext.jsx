import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

const STORAGE_KEY = 'socialscript-prefs'

function loadPrefs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch { return {} }
}

export function ThemeProvider({ children }) {
  const saved = loadPrefs()
  const [theme, setTheme] = useState(saved.theme || 'default')
  const [reduceMotion, setReduceMotion] = useState(saved.reduceMotion ?? false)
  const [fontSpacing, setFontSpacing] = useState(saved.fontSpacing ?? false)
  const [monochrome, setMonochrome] = useState(saved.monochrome ?? false)

  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-theme', theme)
    html.classList.toggle('reduce-motion', reduceMotion)
    html.classList.toggle('font-spacing', fontSpacing)
    html.classList.toggle('monochrome', monochrome)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, reduceMotion, fontSpacing, monochrome }))
    } catch {}
  }, [theme, reduceMotion, fontSpacing, monochrome])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, reduceMotion, setReduceMotion, fontSpacing, setFontSpacing, monochrome, setMonochrome }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
