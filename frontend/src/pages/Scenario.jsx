import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './Scenario.module.css'
import PageShell from '../components/PageShell'
import { completeSession, createSession, createTurn, getHint } from '../api/client'
import { mapFrontendScenarioToApi } from '../lib/scenarioApiMapping'

// ── Location ASCII art ─────────────────────────────────────
const ROOM_ART = {
  desk:
`  ╔═══════════╗
  ║ ┌──┐  ██  ║
  ║ │▓▓│  ██  ║
  ╚═╧══╧══════╝`,
  interview:
`  ┌───────────┐
  │    [○]    │
  │  ───────  │
  │    [○]    │
  └───────────┘`,
  coffee:
`    ┌─────┐
    │ ◉   │
    │     │
    └──┬──┘
    ───┴─── ☕`,
  meeting:
`  ┌─────────────┐
  ○  ─────────  ○
  ○  ─────────  ○
  └─────────────┘`,
  hallway:
`  │             │
  │  →    →    │
  │             │`,
}

const SCENARIO_ROOM = {
  'ask-help':        'desk',
  'deadline-extend': 'desk',
  'first-interview': 'interview',
  'follow-up':       'interview',
  'small-talk':      'coffee',
  'lunch':           'coffee',
  'team-meeting':    'meeting',
  'disagreement':    'meeting',
  'pass-boss':       'hallway',
  'forgotten-name':  'hallway',
}

export default function Scenario({ scenario, navigate }) {
  const [phase, setPhase] = useState('goal') // goal | chat | paused
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [history, setHistory] = useState([])
  const [messages, setMessages] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [draftMessage, setDraftMessage] = useState('')
  const [latestHint, setLatestHint] = useState(null)
  const [showHint, setShowHint] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [error, setError] = useState('')
  const [apiScenario, setApiScenario] = useState(null)
  const [responseOptions, setResponseOptions] = useState([])
  const [showFreeText, setShowFreeText] = useState(false)
  const [customGoal, setCustomGoal] = useState('')
  const [contextInput, setContextInput] = useState('')

  const bottomRef = useRef(null)
  const activeScenario = useMemo(() => scenario || {}, [scenario])
  const scenarioLabel = useMemo(() => activeScenario.title || 'Scenario', [activeScenario.title])
  const roomArt = ROOM_ART[SCENARIO_ROOM[activeScenario.id]] || ROOM_ART.desk

  useEffect(() => {
    setApiScenario(mapFrontendScenarioToApi(activeScenario))
  }, [activeScenario])

  useEffect(() => {
    if (phase === 'chat') bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, phase])

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

  const sendTurn = async (text) => {
    if (!text || !sessionId) return
    setError('')
    setIsLoading(true)
    setShowFreeText(false)
    setResponseOptions([])
    setShowHint(false)
    try {
      setMessages((prev) => [...prev, { role: 'user', content: text }])
      setDraftMessage('')
      const turn = await createTurn(sessionId, { userMessage: text })
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

  const requestHint = async () => {
    if (!sessionId) return
    setError('')
    setIsLoading(true)
    try {
      const hint = await getHint(sessionId, { userMessageContext: draftMessage || undefined })
      setLatestHint(hint)
      setShowHint(true)
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
      navigate('reflection', { scenario: activeScenario, goal: selectedGoal, history, sessionId, feedback })
    } catch (err) {
      setError(err.message || 'Unable to complete session.')
    } finally {
      setIsFinishing(false)
    }
  }

  return (
    <PageShell navigate={navigate}>
      <div className={styles.page}>

        {/* ── Header ── */}
        <div className={styles.scenarioHeader}>
          <button className={styles.backBtn} onClick={() => navigate('map')}>← Back</button>
          <span className={styles.breadcrumb}>{scenarioLabel}</span>
          {phase === 'chat' && (
            <button className={styles.pauseBtn} onClick={() => setPhase(p => p === 'paused' ? 'chat' : 'paused')}>
              {phase === 'paused' ? '▶ Resume' : '⏸ Pause'}
            </button>
          )}
          {phase !== 'chat' && <span />}
        </div>

        {/* ── Paused ── */}
        {phase === 'paused' && (
          <div className={styles.pauseCard}>
            <h2 className={styles.pauseTitle}>Paused</h2>
            <p className={styles.pauseText}>Take all the time you need.</p>
            <button className={styles.resumeBtn} onClick={() => setPhase('chat')}>▶ Resume</button>
            <button className={styles.exitBtn} onClick={() => navigate('map')}>← Return to map</button>
          </div>
        )}

        {/* ── Goal phase ── */}
        {phase === 'goal' && (
          <div className={styles.goalPhase}>

            <div className={styles.sceneBanner}>
              <pre className={styles.sceneArt}>{roomArt}</pre>
              <div className={styles.sceneInfo}>
                <span className={styles.sceneLabel}>Location</span>
                <p className={styles.sceneTitle}>{scenarioLabel}</p>
                <p className={styles.sceneDesc}>{activeScenario.description}</p>
              </div>
            </div>

            <div className={styles.goalSection}>
              <h2 className={styles.goalHeading}>What's your goal?</h2>
              <p className={styles.goalNote}>Be specific — the AI will tailor the conversation to it.</p>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Your goal</label>
                <textarea
                  className={styles.goalInput}
                  placeholder="e.g. I want to sound confident while admitting the mistake."
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  rows={3}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Context <span className={styles.optional}>(optional)</span></label>
                <input
                  className={styles.contextInput}
                  placeholder="e.g. Technical meeting with engineering leads"
                  value={contextInput}
                  onChange={(e) => setContextInput(e.target.value)}
                />
              </div>

              {error && <p className={styles.errorText}>{error}</p>}

              <button
                className={styles.startBtn}
                onClick={handleStart}
                disabled={isLoading || !customGoal.trim()}
              >
                {isLoading ? 'Setting the stage...' : 'Begin →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Chat phase ── */}
        {phase === 'chat' && (
          <div className={styles.chatPhase}>

            <div className={styles.goalReminder}>
              <span className={styles.goalReminderLabel}>Goal:</span>
              <span className={styles.goalReminderText}>{selectedGoal}</span>
            </div>

            {/* Messages */}
            <div className={styles.thread}>
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === 'assistant' ? styles.characterBubble : styles.userBubble}>
                  <span className={styles.speakerName}>{msg.role === 'assistant' ? 'Them' : 'You'}</span>
                  <p className={styles.bubbleText}>{msg.content}</p>
                </div>
              ))}

              {isLoading && (
                <div className={styles.characterBubble}>
                  <span className={styles.speakerName}>Them</span>
                  <p className={styles.typingDots}><span>.</span><span>.</span><span>.</span></p>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Response options */}
            {!isLoading && responseOptions.length > 0 && !showFreeText && (
              <div className={styles.choices}>
                <p className={styles.choicesPrompt}>How do you respond?</p>
                {responseOptions.map((opt, i) => (
                  <button key={i} className={styles.choiceBtn} onClick={() => sendTurn(opt)}>
                    <span className={styles.choiceNum}>{i + 1}</span>
                    {opt}
                  </button>
                ))}
                <button className={`${styles.choiceBtn} ${styles.choiceFree}`} onClick={() => setShowFreeText(true)}>
                  ✏ Write your own
                </button>
              </div>
            )}

            {/* Free text */}
            {!isLoading && showFreeText && (
              <div className={styles.freeInput}>
                <textarea
                  className={styles.freeTextarea}
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  placeholder="Type your response..."
                  rows={3}
                  autoFocus
                />
                <div className={styles.freeRow}>
                  <button
                    className={styles.sendBtn}
                    onClick={() => sendTurn(draftMessage.trim())}
                    disabled={!draftMessage.trim()}
                  >
                    Send →
                  </button>
                  <button className={styles.backToOptions} onClick={() => { setShowFreeText(false); setDraftMessage('') }}>
                    ← Options
                  </button>
                </div>
              </div>
            )}

            {/* Hint panel */}
            {showHint && latestHint && (
              <div className={styles.hintPanel}>
                <div className={styles.hintPanelHeader}>
                  <span className={styles.hintPanelLabel}>Hint</span>
                  <button className={styles.hintClose} onClick={() => setShowHint(false)}>✕</button>
                </div>
                <div className={styles.hintRow}>
                  <span className={styles.hintKey}>They might be thinking</span>
                  <p className={styles.hintVal}>{latestHint.whatRecruiterMayThink}</p>
                </div>
                <div className={styles.hintRow}>
                  <span className={styles.hintKey}>What to say next</span>
                  <p className={styles.hintVal}>{latestHint.whatToSayNext}</p>
                </div>
                <div className={styles.hintRow}>
                  <span className={styles.hintKey}>Why it works</span>
                  <p className={styles.hintVal}>{latestHint.whyItWorks}</p>
                </div>
              </div>
            )}

            {error && <p className={styles.errorText}>{error}</p>}

            {/* Action bar */}
            {!isLoading && (
              <div className={styles.actionBar}>
                <button className={styles.hintBtn} onClick={requestHint}>
                  💡 Hint
                </button>
                <button
                  className={styles.finishBtn}
                  onClick={finishSession}
                  disabled={isFinishing || messages.length < 2}
                >
                  {isFinishing ? 'Finishing...' : 'Finish & reflect →'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error outside chat */}
        {phase !== 'chat' && phase !== 'goal' && error && (
          <p className={styles.errorText}>{error}</p>
        )}

      </div>
    </PageShell>
  )
}
