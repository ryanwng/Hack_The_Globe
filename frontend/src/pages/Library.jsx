import styles from './Library.module.css'
import PageShell from '../components/PageShell'

const PRACTICED = [
  { title: 'Small talk at the coffee machine', location: 'Break Room', times: 3, lastGoal: 'I just want to get through this without freezing up.', date: 'Mar 18' },
  { title: 'First job interview', location: 'Interview Room', times: 1, lastGoal: 'I want to come across as competent and professional.', date: 'Mar 20' },
]

const AVAILABLE = [
  { id: 'follow-up', title: 'Following up after an interview', location: 'Interview Room', tag: 'Low pressure' },
  { id: 'ask-help', title: 'Asking your manager for help', location: 'Your Desk', tag: 'Low pressure' },
  { id: 'team-meeting', title: 'Speaking up in a team meeting', location: 'Meeting Room', tag: 'Group setting' },
  { id: 'deadline-extend', title: 'Requesting a deadline extension', location: 'Your Desk', tag: 'Conflict-adjacent' },
  { id: 'lunch', title: 'Joining colleagues for lunch', location: 'Break Room', tag: 'Social' },
  { id: 'forgotten-name', title: 'Forgetting a colleague\'s name', location: 'Hallway', tag: 'Awkward moments' },
]

export default function Library({ navigate }) {
  return (
    <PageShell navigate={navigate}>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Library</h1>
          <p className={styles.subtitle}>Your personal record of scenarios practiced.</p>
        </div>

        <div className={styles.divider} />

        {/* Practiced */}
        <section className={styles.section}>
          <span className={styles.sectionLabel}>Practiced</span>
          {PRACTICED.length === 0 && (
            <p className={styles.empty}>You haven't practiced any scenarios yet. Start with the workplace map.</p>
          )}
          <div className={styles.practicedList}>
            {PRACTICED.map(p => (
              <div key={p.title} className={styles.practicedCard}>
                <div className={styles.practicedTop}>
                  <span className={styles.practicedLocation}>{p.location}</span>
                  <span className={styles.practicedDate}>{p.date}</span>
                </div>
                <h3 className={styles.practicedTitle}>{p.title}</h3>
                <p className={styles.practicedGoal}>
                  <em>Last goal:</em> {p.lastGoal}
                </p>
                <div className={styles.practicedMeta}>
                  <span className={styles.timesLabel}>Practiced {p.times}×</span>
                  <button className={styles.replaySmall} onClick={() => navigate('map')}>
                    Practice again →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.divider} />

        {/* Available to explore */}
        <section className={styles.section}>
          <span className={styles.sectionLabel}>Available to explore</span>
          <div className={styles.availableGrid}>
            {AVAILABLE.map(s => (
              <div key={s.id} className={styles.availableCard}>
                <span className={styles.availableTag}>{s.tag}</span>
                <h3 className={styles.availableTitle}>{s.title}</h3>
                <span className={styles.availableLocation}>{s.location}</span>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.divider} />

        <div className={styles.note}>
          <p>Your library is private. No one else can see what you've practiced or how many times. This is for you.</p>
        </div>
      </div>
    </PageShell>
  )
}
