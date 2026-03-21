import styles from './PageShell.module.css'

export default function PageShell({ children, navigate }) {
  return (
    <div className={styles.shell}>
      <div className={styles.topRule} />
      <header className={styles.header}>
        <button className={styles.logo} onClick={() => navigate('landing')}>SocialScript</button>
        <nav className={styles.nav}>
          <button className={styles.navLink} onClick={() => navigate('map')}>Workplace</button>
          <span className={styles.sep}>·</span>
          <button className={styles.navLink} onClick={() => navigate('library')}>Library</button>
        </nav>
      </header>
      <div className={styles.headerRule} />
      <main className={styles.main}>
        {children}
      </main>
      <div className={styles.footerRule} />
      <footer className={styles.footer}>
        <span>SocialScript</span>
        <span className={styles.sep}>·</span>
        <em>Stories can change the world.</em>
      </footer>
    </div>
  )
}
