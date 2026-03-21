import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import styles from './ThemeSelector.module.css'

const THEMES = [
  { id: 'default',      label: 'Paper',  colors: ['#f4f1eb', '#1a1a2e'] },
  { id: 'soft-light',   label: 'Cream',  colors: ['#fffdd0', '#3d3428'] },
  { id: 'midnight',     label: 'Night',  colors: ['#1a1a2e', '#d0d0e0'] },
  { id: 'low-stim',     label: 'Sage',   colors: ['#e8ede9', '#2d4a3e'] },
  { id: 'dyslexia',     label: 'Warm',   colors: ['#fef3e2', '#5c4a2e'] },
  { id: 'low-contrast', label: 'Mist',   colors: ['#d4d0c8', '#6a6558'] },
]

export default function ThemeSelector() {
  const [open, setOpen] = useState(false)
  const {
    theme, setTheme,
    reduceMotion, setReduceMotion,
    fontSpacing, setFontSpacing,
    monochrome, setMonochrome,
    dyslexicFont, setDyslexicFont,
  } = useTheme()

  const current = THEMES.find(t => t.id === theme) || THEMES[0]

  return (
    <div className={styles.wrapper}>
      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <div className={styles.panel}>
            <p className={styles.sectionLabel}>Appearance</p>
            <div className={styles.themeGrid}>
              {THEMES.map(t => (
                <button
                  key={t.id}
                  className={`${styles.themeBtn} ${theme === t.id ? styles.active : ''}`}
                  onClick={() => setTheme(t.id)}
                  title={t.label}
                >
                  <span
                    className={styles.swatch}
                    style={{ background: `linear-gradient(135deg, ${t.colors[0]} 50%, ${t.colors[1]} 50%)` }}
                  />
                  <span className={styles.themeName}>{t.label}</span>
                </button>
              ))}
            </div>

            <div className={styles.divider} />

            <p className={styles.sectionLabel}>Tools</p>
            <div className={styles.toggleList}>
              <label className={styles.toggle}>
                <span className={styles.toggleTrack}>
                  <input type="checkbox" checked={reduceMotion} onChange={e => setReduceMotion(e.target.checked)} />
                  <span className={styles.toggleThumb} />
                </span>
                <span className={styles.toggleLabel}>Reduce Motion</span>
              </label>
              <label className={styles.toggle}>
                <span className={styles.toggleTrack}>
                  <input type="checkbox" checked={fontSpacing} onChange={e => setFontSpacing(e.target.checked)} />
                  <span className={styles.toggleThumb} />
                </span>
                <span className={styles.toggleLabel}>Font Spacing</span>
              </label>
              <label className={styles.toggle}>
                <span className={styles.toggleTrack}>
                  <input type="checkbox" checked={monochrome} onChange={e => setMonochrome(e.target.checked)} />
                  <span className={styles.toggleThumb} />
                </span>
                <span className={styles.toggleLabel}>Monochrome</span>
              </label>
              <label className={styles.toggle}>
                <span className={styles.toggleTrack}>
                  <input type="checkbox" checked={dyslexicFont} onChange={e => setDyslexicFont(e.target.checked)} />
                  <span className={styles.toggleThumb} />
                </span>
                <span className={styles.toggleLabel}>Readable Font</span>
              </label>
            </div>
          </div>
        </>
      )}

      <button
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Appearance settings"
        aria-label="Toggle appearance settings"
      >
        <span
          className={styles.triggerSwatch}
          style={{ background: `linear-gradient(135deg, ${current.colors[0]} 50%, ${current.colors[1]} 50%)` }}
        />
      </button>
    </div>
  )
}
