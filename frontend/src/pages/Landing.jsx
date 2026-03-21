import styles from './Landing.module.css'

export default function Landing({ navigate }) {
  return (
    <div className={styles.page}>
      {/* Header rule */}
      <div className={styles.topRule} />

      <header className={styles.header}>
        <span className={styles.logoType}>SocialScript</span>
        <nav className={styles.nav}>
          <button className={styles.navLink} onClick={() => navigate('library')}>My Library</button>
          <span className={styles.navDivider}>·</span>
          <button className={styles.navLink} onClick={() => navigate('map')}>Practice</button>
        </nav>
      </header>

      <div className={styles.headerRule} />

      {/* Hero */}
      <main className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>— a safe space to rehearse real life —</p>
          <h1 className={styles.headline}>
            Practice the<br />conversations<br />that matter.
          </h1>
          <p className={styles.subline}>
            No right answers. No judgment. Just a quiet place to try things out,
            build confidence, and understand how interactions unfold.
          </p>
          <div className={styles.ctaRow}>
            <button className={styles.ctaPrimary} onClick={() => navigate('map')}>
              Open the workplace
            </button>
            <button className={styles.ctaSecondary} onClick={() => navigate('library')}>
              Browse scenarios
            </button>
          </div>
        </div>

        <div className={styles.heroAside}>
          <TypewriterDeco />
        </div>
      </main>

      <div className={styles.sectionRule} />

      {/* How it works */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How it works</h2>
        <div className={styles.steps}>
          {[
            { n: '01', title: 'Choose a scenario', body: 'Pick a workplace situation from the interactive map — a job interview, a difficult conversation, or just small talk at the coffee machine.' },
            { n: '02', title: 'Set your own goal', body: 'You decide what success looks like. Getting through quickly. Being warm. Staying professional. There\'s no wrong goal.' },
            { n: '03', title: 'Play it out', body: 'Have a real conversation with an AI character. Pause whenever you need. Try different things. See how they land.' },
            { n: '04', title: 'Reflect, not score', body: 'After each scenario, you get a quiet reflection — what you tried, what might happen next, and what you could explore differently.' },
          ].map(step => (
            <div key={step.n} className={styles.step}>
              <span className={styles.stepNum}>{step.n}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepBody}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.sectionRule} />

      {/* Principles */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Our principles</h2>
        <div className={styles.principles}>
          {[
            { icon: '◇', title: 'No scores, ever', body: 'Social interaction isn\'t a test. We never grade you.' },
            { icon: '◇', title: 'Your goal, your rules', body: '"I want this to end quickly" is just as valid as "I want to make a friend."' },
            { icon: '◇', title: 'Pause anytime', body: 'A pause button is always one tap away. Overwhelm is expected and respected.' },
            { icon: '◇', title: 'Private by default', body: 'No leaderboards. No social feed. This is yours alone.' },
            { icon: '◇', title: 'Realistic, not cruel', body: 'Characters react like real people — not perfectly, not harshly. Just human.' },
            { icon: '◇', title: 'Evidence-based', body: 'Built on behavioral rehearsal — the same technique used in CBT and the PEERS program.' },
          ].map(p => (
            <div key={p.title} className={styles.principle}>
              <span className={styles.principleIcon}>{p.icon}</span>
              <h3 className={styles.principleTitle}>{p.title}</h3>
              <p className={styles.principleBody}>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.sectionRule} />

      {/* Footer */}
      <footer className={styles.footer}>
        <p className={styles.footerTagline}><em>Stories can change the world.</em></p>
        <p className={styles.footerSmall}>SocialScript · Hack the Globe 2026 · Built with care for autistic young adults</p>
      </footer>

      <div className={styles.bottomRule} />
    </div>
  )
}

function TypewriterDeco() {
  return (
    <svg viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 220, opacity: 0.18 }}>
      {/* Typewriter body */}
      <rect x="30" y="60" width="160" height="110" rx="8" stroke="#1a1a2e" strokeWidth="3" fill="none" />
      <rect x="45" y="75" width="130" height="55" rx="4" stroke="#1a1a2e" strokeWidth="2" fill="none" />
      {/* Keys */}
      {[0,1,2,3,4,5,6,7,8].map(i => (
        <rect key={i} x={50 + i * 13} y={138} width="10" height="10" rx="2" stroke="#1a1a2e" strokeWidth="1.5" fill="none" />
      ))}
      {[0,1,2,3,4,5,6,7].map(i => (
        <rect key={i} x={56 + i * 13} y={152} width="10" height="10" rx="2" stroke="#1a1a2e" strokeWidth="1.5" fill="none" />
      ))}
      {/* Space bar */}
      <rect x="70" y="166" width="80" height="10" rx="2" stroke="#1a1a2e" strokeWidth="1.5" fill="none" />
      {/* Paper */}
      <rect x="60" y="20" width="100" height="50" rx="2" stroke="#1a1a2e" strokeWidth="2" fill="none" />
      {/* Lines on paper */}
      <line x1="72" y1="32" x2="148" y2="32" stroke="#1a1a2e" strokeWidth="1" />
      <line x1="72" y1="40" x2="148" y2="40" stroke="#1a1a2e" strokeWidth="1" />
      <line x1="72" y1="48" x2="120" y2="48" stroke="#1a1a2e" strokeWidth="1" />
      {/* Platen */}
      <rect x="20" y="55" width="180" height="10" rx="3" stroke="#1a1a2e" strokeWidth="2" fill="none" />
      {/* Side knobs */}
      <circle cx="22" cy="60" r="5" stroke="#1a1a2e" strokeWidth="2" fill="none" />
      <circle cx="198" cy="60" r="5" stroke="#1a1a2e" strokeWidth="2" fill="none" />
    </svg>
  )
}
