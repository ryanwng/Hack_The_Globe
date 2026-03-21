import { useRef, useCallback, useEffect, useState } from 'react'
import styles from './Landing.module.css'

export default function Landing({ navigate }) {
  return (
    <div className={styles.page}>
      <div className={styles.topRule} />

      <header className={styles.header}>
        <span className={styles.logoType}>SocialScript</span>
        <nav className={styles.nav}>
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
  const indexRef = useRef(0)

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

function TypewriterDeco() {
  return (
    <svg viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 220, opacity: 0.18 }}>
      <rect x="30" y="60" width="160" height="110" rx="8" stroke="var(--ink)" strokeWidth="3" fill="none" />
      <rect x="45" y="75" width="130" height="55" rx="4" stroke="var(--ink)" strokeWidth="2" fill="none" />
      {[0,1,2,3,4,5,6,7,8].map(i => (
        <rect key={i} x={50 + i * 13} y={138} width="10" height="10" rx="2" stroke="var(--ink)" strokeWidth="1.5" fill="none" />
      ))}
      {[0,1,2,3,4,5,6,7].map(i => (
        <rect key={i} x={56 + i * 13} y={152} width="10" height="10" rx="2" stroke="var(--ink)" strokeWidth="1.5" fill="none" />
      ))}
      <rect x="70" y="166" width="80" height="10" rx="2" stroke="var(--ink)" strokeWidth="1.5" fill="none" />
      <rect x="60" y="20" width="100" height="50" rx="2" stroke="var(--ink)" strokeWidth="2" fill="none" />
      <line x1="72" y1="32" x2="148" y2="32" stroke="var(--ink)" strokeWidth="1" />
      <line x1="72" y1="40" x2="148" y2="40" stroke="var(--ink)" strokeWidth="1" />
      <line x1="72" y1="48" x2="120" y2="48" stroke="var(--ink)" strokeWidth="1" />
      <rect x="20" y="55" width="180" height="10" rx="3" stroke="var(--ink)" strokeWidth="2" fill="none" />
      <circle cx="22" cy="60" r="5" stroke="var(--ink)" strokeWidth="2" fill="none" />
      <circle cx="198" cy="60" r="5" stroke="var(--ink)" strokeWidth="2" fill="none" />
    </svg>
  )
}
