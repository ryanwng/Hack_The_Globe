import { useEffect, useMemo, useState } from 'react'
import styles from './Scenario.module.css'
import PageShell from '../components/PageShell'
import { completeSession, createSession, createTurn, getHint } from '../api/client'
import { mapFrontendScenarioToApi } from '../lib/scenarioApiMapping'

const GOAL_OPTIONS = [
  'I want to come across as competent and professional.',
  'I just want to get through this without freezing up.',
  'I want to seem friendly and easy to work with.',
  'I want to be honest about my experience, even if it is limited.',
]

export default function Scenario({ scenario, navigate }) {
  const [phase, setPhase] = useState('goal') // goal | chat | paused
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [history, setHistory] = useState([])
  const [messages, setMessages] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [draftMessage, setDraftMessage] = useState('')
  const [latestHint, setLatestHint] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [error, setError] = useState('')
  const [apiScenario, setApiScenario] = useState(null)
  const [responseOptions, setResponseOptions] = useState([])
  const [showFreeText, setShowFreeText] = useState(false)

  const activeScenario = useMemo(() => scenario || {}, [scenario])
  const scenarioLabel = useMemo(() => activeScenario.title || 'Scenario', [activeScenario.title])

  useEffect(() => {
    setApiScenario(mapFrontendScenarioToApi(activeScenario))
  }, [activeScenario])

  const handleGoal = async (goal) => {
    if (!apiScenario) return
    setSelectedGoal(goal)
    setError('')
    setIsLoading(true)
    try {
      const payload = await createSession({
        scenarioId: apiScenario.scenarioId,
        scenarioTitle: apiScenario.scenarioTitle,
        userGoal: goal,
        difficulty: activeScenario.difficulty || 'medium',
      })
      setSessionId(payload.sessionId)
      setMessages([{ role: 'assistant', content: payload.aiOpeningMessage }])
      setResponseOptions(payload.responseOptions || [])
      setShowFreeText(false)
      setPhase('chat')
    } catch (err) {
      setError(err.message || 'Unable to start session.')
    } finally {
      setIsLoading(false)
    }
  }

  const sendTurn = async (text, requestHint = false) => {
    if (!text || !sessionId) return
    setError('')
    setIsLoading(true)
    setShowFreeText(false)
    setResponseOptions([])
    try {
      const userMessage = { role: 'user', content: text }
      setMessages((prev) => [...prev, userMessage])
      setDraftMessage('')
      const turn = await createTurn(sessionId, {
        userMessage: text,
        requestHint,
      })
      setMessages((prev) => [...prev, { role: 'assistant', content: turn.aiMessage }])
      setResponseOptions(turn.responseOptions || [])
      setLatestHint(turn.hint || null)
      setHistory((prev) => [...prev, { userMessage: text, aiMessage: turn.aiMessage, hint: turn.hint || null }])
    } catch (err) {
      setError(err.message || 'Unable to send message.')
    } finally {
      setIsLoading(false)
    }
  }

  const requestHintOnly = async () => {
    if (!sessionId) return
    setError('')
    setIsLoading(true)
    try {
      const hint = await getHint(sessionId, { userMessageContext: draftMessage || undefined })
      setLatestHint(hint)
    } catch (err) {
      setError(err.message || 'Unable to fetch hint.')
    } finally {
      setIsLoading(false)
    }
  }

  const finishSession = async () => {
    if (!sessionId) return
    setError('')
    setIsFinishing(true)
    try {
      const feedback = await completeSession(sessionId)
      navigate('reflection', {
        scenario: activeScenario,
        goal: selectedGoal,
        history,
        sessionId,
        feedback,
      })
    } catch (err) {
      setError(err.message || 'Unable to complete session.')
    } finally {
      setIsFinishing(false)
    }
  }

  return (
    <PageShell navigate={navigate}>
      <div className={styles.page}>
        <div className={styles.scenarioHeader}>
          <span className={styles.breadcrumb}>Workplace {'→'} {scenarioLabel}</span>
          {phase === 'chat' && (
            <button className={styles.pauseBtn} onClick={() => setPhase(p => p === 'paused' ? 'chat' : 'paused')}>
              {phase === 'paused' ? '▶ Resume' : '⏸ Pause'}
            </button>
          )}
        </div>

        {phase === 'paused' && (
          <div className={styles.pauseCard}>
            <h2 className={styles.pauseTitle}>Paused</h2>
            <p className={styles.pauseText}>Take all the time you need. This will be here when you return.</p>
            <button className={styles.resumeBtn} onClick={() => setPhase('chat')}>▶ Resume scenario</button>
            <button className={styles.exitBtn} onClick={() => navigate('map')}>← Return to map</button>
          </div>
        )}

        {phase === 'goal' && (
          <div className={styles.goalPhase}>
            <div className={styles.settingCard}>
              <span className={styles.settingLabel}>Setting</span>
              <p className={styles.settingText}>Practice a live conversation with AI based on this workplace scenario.</p>
            </div>
            <div className={styles.goalSection}>
              <h2 className={styles.goalHeading}>What is your goal for this conversation?</h2>
              <p className={styles.goalNote}>There is no right answer. You decide what success looks like.</p>
              <div className={styles.goalOptions}>
                {GOAL_OPTIONS.map((g, i) => (
                  <button
                    key={i}
                    className={`${styles.goalOption} ${selectedGoal === g ? styles.goalSelected : ''}`}
                    onClick={() => !isLoading && handleGoal(g)}
                    disabled={isLoading}
                  >
                    {g}
                  </button>
                ))}
              </div>
              {isLoading && <p className={styles.goalNote}>Starting session...</p>}
            </div>
          </div>
        )}

        {phase === 'chat' && (
          <div className={styles.chatPhase}>
            <div className={styles.goalReminder}>
              <span className={styles.goalReminderLabel}>Your goal:</span>
              <span className={styles.goalReminderText}>{selectedGoal}</span>
            </div>

            {messages.map((message, i) => (
              <div key={`${message.role}-${i}`} className={message.role === 'assistant' ? styles.characterBubble : styles.userBubble}>
                <span className={styles.speakerName}>{message.role === 'assistant' ? 'Them' : 'You'}</span>
                <p className={styles.bubbleText}>{message.content}</p>
              </div>
            ))}

            {/* Response options – multiple choice buttons */}
            {!isLoading && responseOptions.length > 0 && !showFreeText && (
              <div className={styles.choices}>
                <p className={styles.choicesPrompt}>How do you respond?</p>
                {responseOptions.map((opt, i) => (
                  <button
                    key={i}
                    className={styles.choiceBtn}
                    onClick={() => sendTurn(opt)}
                    disabled={isLoading}
                  >
                    {opt}
                  </button>
                ))}
                <button
                  className={`${styles.choiceBtn} ${styles.choiceFree}`}
                  onClick={() => setShowFreeText(true)}
                >
                  ✏️ Write your own response
                </button>
              </div>
            )}

            {/* Free text input (shown when user picks "Write your own response") */}
            {!isLoading && showFreeText && (
              <div className={styles.choices}>
                <p className={styles.choicesPrompt}>What do you say?</p>
                <textarea
                  className={styles.freeTextarea}
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  placeholder="Type your response..."
                  rows={3}
                  disabled={isLoading}
                />
                <div className={styles.nextRow}>
                  <button
                    className={styles.revealBtn}
                    onClick={() => sendTurn(draftMessage.trim())}
                    disabled={isLoading || !draftMessage.trim()}
                  >
                    Send →
                  </button>
                  <button
                    className={styles.tryAgainBtn}
                    onClick={() => { setShowFreeText(false); setDraftMessage('') }}
                  >
                    ← Back to options
                  </button>
                </div>
              </div>
            )}

            {/* Action bar */}
            {!isLoading && (
              <div className={styles.nextRow}>
                <button
                  className={styles.tryAgainBtn}
                  onClick={requestHintOnly}
                  disabled={isLoading}
                >
                  💡 Get hint
                </button>
                <button
                  className={styles.continueBtn}
                  onClick={finishSession}
                  disabled={isLoading || isFinishing}
                >
                  {isFinishing ? 'Finishing...' : 'Finish & reflect →'}
                </button>
              </div>
            )}

            {latestHint && (
              <div className={styles.outcomeSection}>
                <div className={styles.thinkingCard}>
                  <span className={styles.thinkingLabel}>What they might be thinking</span>
                  <p className={styles.thinkingText}>{latestHint.whatRecruiterMayThink}</p>
                </div>
                <div className={styles.outcomeCard}>
                  <span className={styles.outcomeLabel}>What to say next</span>
                  <p className={styles.outcomeText}>{latestHint.whatToSayNext}</p>
                </div>
                <div className={styles.outcomeCard}>
                  <span className={styles.outcomeLabel}>Why it works</span>
                  <p className={styles.outcomeText}>{latestHint.whyItWorks}</p>
                </div>
              </div>
            )}

            {error && (
              <div className={styles.choseDisplay}>
                <div className={styles.outcomeCard}>
                  <span className={styles.outcomeLabel}>Error</span>
                  <p className={styles.outcomeText}>{error}</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className={styles.choseDisplay}>
                <p className={styles.goalNote}>Thinking...</p>
              </div>
            )}
          </div>
        )}

        {phase !== 'chat' && error && (
          <div className={styles.choseDisplay}>
            <div className={styles.outcomeCard}>
              <span className={styles.outcomeLabel}>Error</span>
              <p className={styles.outcomeText}>{error}</p>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}
