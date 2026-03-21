import { useEffect, useState } from 'react'
import styles from './Reflection.module.css'
import PageShell from '../components/PageShell'
import { completeSession } from '../api/client'

export default function Reflection({ data, navigate }) {
  const scenario = data?.scenario
  const goal = data?.goal
  const history = data?.history || []
  const characterName = data?.characterName || ''
  const [feedback, setFeedback] = useState(data?.feedback || null)
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')
  const [expandedTurn, setExpandedTurn] = useState(null)

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

        {/* Annotated replay */}
        <div className={styles.block}>
          <span className={styles.blockLabel}>Annotated replay</span>
          <p className={styles.replayNote}>Tap any turn to see the social signal from that moment.</p>
          {history.length === 0 && <p className={styles.historyQ}>Nothing recorded yet.</p>}
          {history.map((h, i) => (
            <div
              key={i}
              className={`${styles.historyItem} ${expandedTurn === i ? styles.historyItemExpanded : ''}`}
              onClick={() => setExpandedTurn(expandedTurn === i ? null : i)}
            >
              <div className={styles.turnHeader}>
                <span className={styles.turnNumber}>Turn {i + 1}</span>
                {h.socialSignal && <span className={styles.turnSignalDot}>◉</span>}
              </div>
              <p className={styles.historyQ}>
                {characterName && <span className={styles.speakerTag}>{characterName}</span>}
                {h.aiMessage}
              </p>
              <p className={styles.historyA}><em>You:</em> {h.userMessage}</p>
              {expandedTurn === i && h.socialSignal && (
                <div className={styles.turnSignal}>
                  <span className={styles.turnSignalIcon}>◉</span>
                  <span className={styles.turnSignalText}>{h.socialSignal}</span>
                </div>
              )}
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
            Open my journal
          </button>
        </div>
      </div>
    </PageShell>
  )
}
