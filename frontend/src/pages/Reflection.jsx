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
          {history.length === 0 && <p className={styles.historyQ}>Nothing recorded yet.</p>}
          {history.map((h, i) => (
            <div key={i} className={styles.historyItem}>
              <p className={styles.historyQ}>{h.aiMessage}</p>
              <p className={styles.historyA}><em>You:</em> {h.userMessage}</p>
            </div>
          ))}
        </div>

        <div className={styles.divider} />

        {(isLoadingFeedback || feedback || feedbackError) && (
          <>
            {isLoadingFeedback && (
              <div className={styles.block}>
                <span className={styles.blockLabel}>Feedback</span>
                <p className={styles.blockText}>Generating feedback…</p>
              </div>
            )}
            {feedbackError && (
              <div className={styles.block}>
                <span className={styles.blockLabel}>Feedback</span>
                <p className={styles.blockText}>{feedbackError}</p>
              </div>
            )}
            {feedback && (
              <>
                {feedback.strengths?.length > 0 && (
                  <div className={styles.block}>
                    <span className={styles.blockLabel}>What went well</span>
                    <ul className={styles.promptList}>
                      {feedback.strengths.map((s, i) => <li key={i} className={styles.promptItem}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {feedback.improvements?.length > 0 && (
                  <div className={styles.block}>
                    <span className={styles.blockLabel}>Things to explore next time</span>
                    <ul className={styles.promptList}>
                      {feedback.improvements.map((s, i) => <li key={i} className={styles.promptItem}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {feedback.exampleBetterPhrases?.length > 0 && (
                  <div className={styles.block}>
                    <span className={styles.blockLabel}>Phrases to try</span>
                    <ul className={styles.promptList}>
                      {feedback.exampleBetterPhrases.map((s, i) => <li key={i} className={styles.promptItem}>"{s}"</li>)}
                    </ul>
                  </div>
                )}
                {feedback.nextPracticeFocus && (
                  <div className={styles.block}>
                    <span className={styles.blockLabel}>Next practice focus</span>
                    <p className={styles.blockText}>{feedback.nextPracticeFocus}</p>
                  </div>
                )}
              </>
            )}
          </>
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
