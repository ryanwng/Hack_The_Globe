import { useMemo, useState } from 'react'
import styles from './Library.module.css'
import PageShell from '../components/PageShell'

const AVAILABLE = [
  { id: 'follow-up', title: 'Following up after an interview', location: 'Interview Room', tag: 'Low pressure' },
  { id: 'ask-help', title: 'Asking your manager for help', location: 'Your Desk', tag: 'Low pressure' },
  { id: 'team-meeting', title: 'Speaking up in a team meeting', location: 'Meeting Room', tag: 'Group setting' },
  { id: 'deadline-extend', title: 'Requesting a deadline extension', location: 'Your Desk', tag: 'Conflict-adjacent' },
  { id: 'lunch', title: 'Joining colleagues for lunch', location: 'Break Room', tag: 'Social' },
  { id: 'forgotten-name', title: 'Forgetting a colleague\'s name', location: 'Hallway', tag: 'Awkward moments' },
]

function formatDate(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch { return '' }
}

export default function Library({ navigate }) {
  const [expandedEntry, setExpandedEntry] = useState(null)
  const [journalVersion, setJournalVersion] = useState(0)

  const journal = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('socialscript_journal') || '[]')
    } catch { return [] }
  }, [journalVersion])

  const clearJournal = () => {
    if (confirm('Clear your entire session journal? This cannot be undone.')) {
      localStorage.removeItem('socialscript_journal')
      setExpandedEntry(null)
      setJournalVersion(v => v + 1)
    }
  }

  return (
    <PageShell navigate={navigate}>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Session Journal</h1>
          <p className={styles.subtitle}>Your private record of every conversation practiced.</p>
        </div>

        <div className={styles.divider} />

        {/* Journal entries */}
        <section className={styles.section}>
          <div className={styles.sectionTop}>
            <span className={styles.sectionLabel}>Past sessions ({journal.length})</span>
            {journal.length > 0 && (
              <button className={styles.clearBtn} onClick={clearJournal}>Clear all</button>
            )}
          </div>
          {journal.length === 0 && (
            <p className={styles.empty}>No sessions yet. Complete a scenario from the workplace map to see it here.</p>
          )}
          <div className={styles.practicedList}>
            {journal.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className={`${styles.practicedCard} ${expandedEntry === idx ? styles.practicedCardExpanded : ''}`}
                onClick={() => setExpandedEntry(expandedEntry === idx ? null : idx)}
              >
                <div className={styles.practicedTop}>
                  <span className={styles.practicedLocation}>
                    {entry.characterName && `${entry.characterName} · `}{entry.scenarioTitle}
                  </span>
                  <span className={styles.practicedDate}>{formatDate(entry.date)}</span>
                </div>
                <p className={styles.practicedGoal}>
                  <em>Goal:</em> {entry.goal}
                </p>
                <div className={styles.practicedMeta}>
                  <span className={styles.timesLabel}>{entry.turnCount} turn{entry.turnCount !== 1 ? 's' : ''}</span>
                </div>

                {/* Expanded: show feedback summary */}
                {expandedEntry === idx && entry.feedback && (
                  <div className={styles.journalDetail}>
                    {entry.feedback.strengths?.length > 0 && (
                      <div className={styles.journalSection}>
                        <span className={styles.journalSectionLabel}>Strengths</span>
                        <ul className={styles.journalList}>
                          {entry.feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {entry.feedback.improvements?.length > 0 && (
                      <div className={styles.journalSection}>
                        <span className={styles.journalSectionLabel}>To improve</span>
                        <ul className={styles.journalList}>
                          {entry.feedback.improvements.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {entry.feedback.nextPracticeFocus && (
                      <div className={styles.journalSection}>
                        <span className={styles.journalSectionLabel}>Next focus</span>
                        <p className={styles.journalFocus}>{entry.feedback.nextPracticeFocus}</p>
                      </div>
                    )}
                  </div>
                )}
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
          <p>Your journal is stored locally on this device. No one else can see what you've practiced or how many times. This is for you.</p>
        </div>
      </div>
    </PageShell>
  )
}
