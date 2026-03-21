import { useEffect, useState } from 'react'
import styles from './Reflection.module.css'
import PageShell from '../components/PageShell'
import { completeSession } from '../api/client'

export default function Reflection({ data, navigate }) {
  const scenario = data?.scenario
  const goal = data?.goal
  const history = data?.history || []
  const [feedback, setFeedback] = useState(data?.feedback || null)
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')

  useEffect(() => {
    let active = true
    async function loadFeedback() {
      if (feedback || !data?.sessionId) return
      setIsLoadingFeedback(true)
      setFeedbackError('')
      try {
        const payload = await completeSession(data.sessionId)
        if (active) setFeedback(payload)
      } catch (err) {
        if (active) setFeedbackError(err.message || 'Unable to load feedback.')
      } finally {
        if (active) setIsLoadingFeedback(false)
      }
    }
    loadFeedback()
    return () => {
      active = false
    }
  }, [data?.sessionId, feedback])

  return (
    <PageShell navigate={navigate}>
      <div className={styles.page}>
        <div className={styles.header}>
          <span className={styles.label}>Reflection</span>
          <h1 className={styles.title}>You finished the scenario.</h1>
          <p className={styles.subtitle}>This isn't a score. It's a chance to look back.</p>
        </div>

        <div className={styles.divider} />

        {/* Goal recap */}
        <div className={styles.block}>
          <span className={styles.blockLabel}>Your goal was</span>
          <p className={styles.blockText}>{goal || 'Not set'}</p>
        </div>

        {/* What happened */}
        <div className={styles.block}>
          <span className={styles.blockLabel}>What you tried</span>
          {history.map((h, i) => (
            <div key={i} className={styles.historyItem}>
              <p className={styles.historyQ}>{h.turn?.character_says}</p>
              <p className={styles.historyA}>
                <em>You:</em> {h.chosen?.free ? h.freeText || h.chosen?.text : h.chosen?.text}
              </p>
              <p className={styles.historyOutcome}>{h.chosen?.outcome}</p>
            </div>
          ))}
        </div>

        <div className={styles.divider} />

        {(isLoadingFeedback || feedback || feedbackError) && (
          <div className={styles.block}>
            <span className={styles.blockLabel}>AI feedback</span>
            {isLoadingFeedback && <p className={styles.blockText}>Generating feedback...</p>}
            {feedbackError && <p className={styles.blockText}>{feedbackError}</p>}
            {feedback && (
              <>
                <p className={styles.blockText}><strong>Overall score:</strong> {feedback.overallScore}</p>
                <p className={styles.blockText}><strong>Strengths:</strong> {feedback.strengths.join(', ') || 'N/A'}</p>
                <p className={styles.blockText}><strong>Improvements:</strong> {feedback.improvements.join(', ') || 'N/A'}</p>
                <p className={styles.blockText}><strong>Better phrases:</strong> {feedback.exampleBetterPhrases.join(', ') || 'N/A'}</p>
                <p className={styles.blockText}><strong>Next focus:</strong> {feedback.nextPracticeFocus}</p>
              </>
            )}
          </div>
        )}

        <div className={styles.divider} />

        {/* Reflection prompts */}
        <div className={styles.block}>
          <span className={styles.blockLabel}>Things to consider</span>
          <ul className={styles.promptList}>
            <li className={styles.promptItem}>Was there a moment that felt more comfortable than you expected?</li>
            <li className={styles.promptItem}>Was there a response you wanted to try but didn't? You can go back and replay.</li>
            <li className={styles.promptItem}>Did you move toward your goal? Not perfectly — just in any direction.</li>
          </ul>
        </div>

        <div className={styles.divider} />

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.replayBtn} onClick={() => navigate('scenario', scenario)}>
            ↺ Replay with a different approach
          </button>
          <button className={styles.mapBtn} onClick={() => navigate('map')}>
            ← Back to the workplace
          </button>
          <button className={styles.libraryBtn} onClick={() => navigate('library')}>
            Open my library
          </button>
        </div>

        {/* Add to library prompt */}
        <div className={styles.saveCard}>
          <span className={styles.saveLabel}>Save to your library?</span>
          <p className={styles.saveText}>
            Your library tracks the scenarios you've practiced and the approaches you've explored.
            No one else can see it.
          </p>
          <button className={styles.saveBtn}>Save this scenario</button>
        </div>
      </div>
    </PageShell>
  )
}
