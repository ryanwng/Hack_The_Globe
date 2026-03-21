import { useEffect, useMemo, useState } from 'react'
import styles from './Scenario.module.css'
import PageShell from '../components/PageShell'
import { completeSession, createSession, createTurn, getHint } from '../api/client'
import { mapFrontendScenarioToApi } from '../lib/scenarioApiMapping'



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
  const [customGoal, setCustomGoal] = useState('')
  const [contextInput, setContextInput] = useState('')

  const activeScenario = useMemo(() => scenario || {}, [scenario])
  const scenarioLabel = useMemo(() => activeScenario.title || 'Scenario', [activeScenario.title])

  useEffect(() => {
    setApiScenario(mapFrontendScenarioToApi(activeScenario))
  }, [activeScenario])

  const handleStart = async () => {
    if (!apiScenario || !customGoal.trim()) return
    setError('')
    setIsLoading(true)
    try {
      const payload = await createSession({
        scenarioId: apiScenario.scenarioId,
        scenarioTitle: apiScenario.scenarioTitle,
        userGoal: customGoal.trim(),
        userContext: contextInput.trim() || undefined,
        difficulty: activeScenario.difficulty || 'medium',
      })
      setSessionId(payload.sessionId)
      setSelectedGoal(customGoal.trim())
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
              <span className={styles.settingLabel}>Scenario</span>
              <p className={styles.settingText}>{activeScenario.description}</p>
            </div>
            <div className={styles.goalSection}>
              <h2 className={styles.goalHeading}>What is your goal for this conversation?</h2>
              
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Your specific goal</label>
                <textarea
                  className={styles.goalInput}
                  placeholder="e.g. I want to sound confident while admitting the mistake."
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  rows={3}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Setting / Context (Optional)</label>
                <input
                  className={styles.contextInput}
                  placeholder="e.g. Technical meeting with engineering leads"
                  value={contextInput}
                  onChange={(e) => setContextInput(e.target.value)}
                />
              </div>

              <button 
                className={styles.startBtn}
                onClick={handleStart}
                disabled={isLoading || !customGoal.trim()}
              >
                {isLoading ? 'Setting the stage...' : 'Start Scenario →'}
              </button>
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
