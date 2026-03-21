import { useRef, useCallback, useEffect, useState } from 'react'
import styles from './Landing.module.css'

export default function Landing({ navigate }) {
  return (
    <div className={styles.page}>
      <div className={styles.topRule} />

      <header className={styles.header}>
        <span className={styles.logoType}>SocialScript</span>
        <nav className={styles.nav}>
          <button className={styles.navLink} onClick={() => navigate('help')}>About</button>
          <span className={styles.navDivider}>·</span>
          <button className={styles.navLink} onClick={() => navigate('library')}>Library</button>
          <span className={styles.navDivider}>·</span>
          <button className={styles.navLink} onClick={() => navigate('map')}>Practice</button>
        </nav>
      </header>

      <div className={styles.headerRule} />

      <main className={styles.hero}>
        <div className={styles.heroInner}>
          <TypewriterHeadline />
          <p className={styles.subline}>No scores. No judgment.</p>
          <div className={styles.ctaRow}>
            <TapeButton
              label="Browse"
              width={220}
              onClick={() => navigate('library')}
              cls={styles.ctaSecondary}
            />
            <TapeButton
              label="Open the Workplace"
              width={255}
              onClick={() => navigate('map')}
              cls={styles.ctaPrimary}
            />
          </div>
        </div>
      </main>

      <div className={styles.bottomRule} />

      <footer className={styles.footer}>
        <span>SocialScript</span>
        <span className={styles.footerSep}>·</span>
        <em>Stories can change the world.</em>
      </footer>
    </div>
  )
}

function TypewriterHeadline() {
  const text = 'Practice the conversations that matter.'

  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
  let i = 0

  const interval = setInterval(() => {
    if (i >= text.length) {
      clearInterval(interval)
      return
    }

    setDisplayed(text.slice(0, i + 1))
    i++
  }, 35)

  return () => clearInterval(interval)
}, [])

  return (
    <h1 className={styles.headline} style={{ whiteSpace: 'pre-line' }}>
      {displayed}
    </h1>
  )
}

function TapeButton({ label, width, onClick, cls }) {
  const [hover, setHover] = useState(false)
  const imgRef = useRef(null)
  const ctxRef = useRef(null)

  const drawToCanvas = useCallback(() => {
    const img = imgRef.current
    if (!img || !img.complete || !img.naturalWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0)
    ctxRef.current = ctx
  }, [])

  useEffect(() => { drawToCanvas() }, [drawToCanvas])

  const handleMouseMove = useCallback((e) => {
    const img = imgRef.current
    const ctx = ctxRef.current
    if (!img || !ctx) return
    const rect = img.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) * (img.naturalWidth / rect.width))
    const y = Math.floor((e.clientY - rect.top) * (img.naturalHeight / rect.height))
    if (x < 0 || y < 0 || x >= img.naturalWidth || y >= img.naturalHeight) {
      setHover(false)
      return
    }
    setHover(ctx.getImageData(x, y, 1, 1).data[3] > 20)
  }, [])

  return (
    <button
      className={`${cls} ${hover ? styles.tapeHover : ''}`}
      onClick={() => { if (hover) onClick() }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHover(false)}
      style={{ cursor: hover ? 'pointer' : 'default' }}
    >
      <img
        ref={imgRef}
        src="/realtape.png"
        width={width}
        onLoad={drawToCanvas}
        aria-hidden="true"
        alt=""
      />
      <span>{label}</span>
    </button>
  )
}

