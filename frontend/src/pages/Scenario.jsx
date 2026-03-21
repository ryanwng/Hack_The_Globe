import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './Scenario.module.css'
import PageShell from '../components/PageShell'
import { completeSession, createSession, createTurn, getHint, getTTS } from '../api/client'
import { mapFrontendScenarioToApi } from '../lib/scenarioApiMapping'

<<<<<<< HEAD
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const hasSpeechRecognition = !!SpeechRecognition;
=======
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
>>>>>>> 142b8270588abdf05001ff4f4f584ff742f6acaa

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
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState(null)

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          finalTranscript += event.results[i][0].transcript;
        }
        setDraftMessage(finalTranscript);
      };
      rec.onerror = (e) => {
        console.error('Speech recognition error', e);
        setIsListening(false);
      };
      rec.onend = () => {
        setIsListening(false);
      };
      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (!hasSpeechRecognition) {
      alert("Your browser does not natively support Speech Recognition. Please try using Chrome or Safari on desktop.");
      return;
    }
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setDraftMessage('');
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const speakText = async (text) => {
    if (!isVoiceEnabled) return
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    if (window.currentAudio) window.currentAudio.pause()

    // Remove markdown asterisks/formatting before speaking
    const cleanText = text.replace(/[*_~`]/g, '')

    // 1. Try backend TTS (ElevenLabs)
    try {
      const response = await getTTS(cleanText)
      if (response && response.audioBuffer) {
        const audio = new Audio("data:audio/mp3;base64," + response.audioBuffer)
        window.currentAudio = audio
        audio.play()
        return // Successfully played premium voice
      }
    } catch (e) {
      console.warn("Backend TTS failed, falling back to browser native TTS", e)
    }

    // 2. Fallback to Browser Native TTS
    if (!('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(cleanText)

    const voices = window.speechSynthesis.getVoices()
    const naturalVoice = voices.find(v =>
      v.name.includes('Samantha') ||
      v.name.includes('Google US English') ||
      v.name.includes('Premium') ||
      v.name.includes('Daniel')
    ) || voices.find(v => v.lang.startsWith('en'))

    if (naturalVoice) {
      utterance.voice = naturalVoice
    }

    // Tune for natural conversational tone
    utterance.rate = 0.95
    utterance.pitch = 1.05

    window.speechSynthesis.speak(utterance)
  }

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
      speakText(payload.aiOpeningMessage)
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
      speakText(turn.aiMessage)
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
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
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
            <div className={styles.headerControls}>
              <button
                className={styles.voiceBtn}
                onClick={() => {
                  setIsVoiceEnabled(!isVoiceEnabled)
                  if (isVoiceEnabled && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel()
                  }
                }}
                title={isVoiceEnabled ? "Mute AI Voice" : "Enable AI Voice"}
              >
                {isVoiceEnabled ? '🔊' : '🔇'}
              </button>
              <button className={styles.pauseBtn} onClick={() => setPhase(p => p === 'paused' ? 'chat' : 'paused')}>
                {phase === 'paused' ? '▶ Resume' : '⏸ Pause'}
              </button>
            </div>
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
<<<<<<< HEAD
              <h2 className={styles.goalHeading}>What is your goal for this conversation?</h2>
=======
              <h2 className={styles.goalHeading}>What's your goal?</h2>
              <p className={styles.goalNote}>Be specific — the AI will tailor the conversation to it.</p>
>>>>>>> 142b8270588abdf05001ff4f4f584ff742f6acaa

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

<<<<<<< HEAD
=======
              {error && <p className={styles.errorText}>{error}</p>}

>>>>>>> 142b8270588abdf05001ff4f4f584ff742f6acaa
              <button
                className={styles.startBtn}
                onClick={handleStart}
                disabled={isLoading || !customGoal.trim()}
              >
                {isLoading ? 'Setting the stage...' : 'Begin →'}
              </button>
            </div >
          </div >
        )
}

{/* ── Chat phase ── */ }
{
  phase === 'chat' && (
    <div className={styles.chatPhase}>

      <div className={styles.goalReminder}>
        <span className={styles.goalReminderLabel}>Goal:</span>
        <span className={styles.goalReminderText}>{selectedGoal}</span>
      </div>

<<<<<<< HEAD
  {
    messages.map((message, i) => (
      <div key={`${message.role}-${i}`} className={message.role === 'assistant' ? styles.characterBubble : styles.userBubble}>
        <div className={styles.speakerHeader}>
          <span className={styles.speakerName}>{message.role === 'assistant' ? 'Them' : 'You'}</span>
          {message.role === 'assistant' && isVoiceEnabled && (
            <button className={styles.replayBtn} onClick={() => speakText(message.content)} title="Replay audio">
              🔊
            </button>
          )}
        </div>
        <p className={styles.bubbleText}>{message.content}</p>
      </div>
    ))
  }
=======
            {/* Messages */}
            <div className={styles.thread}>
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === 'assistant' ? styles.characterBubble : styles.userBubble}>
                  <span className={styles.speakerName}>{msg.role === 'assistant' ? 'Them' : 'You'}</span>
                  <p className={styles.bubbleText}>{msg.content}</p>
                </div>
              ))}
>>>>>>> 142b8270588abdf05001ff4f4f584ff742f6acaa

  {
    isLoading && (
      <div className={styles.characterBubble}>
        <span className={styles.speakerName}>Them</span>
        <p className={styles.typingDots}><span>.</span><span>.</span><span>.</span></p>
      </div>
    )
  }

  <div ref={bottomRef} />
            </div >

    {/* Response options */ }
  {
    !isLoading && responseOptions.length > 0 && !showFreeText && (
      <div className={styles.choices}>
        <p className={styles.choicesPrompt}>How do you respond?</p>
        {responseOptions.map((opt, i) => (
          <button key={i} className={styles.choiceBtn} onClick={() => sendTurn(opt)}>
            <span className={styles.choiceNum}>{i + 1}</span>
            {opt}
          </button>
        ))}
<<<<<<< HEAD
    <button
      className={`${styles.choiceBtn} ${styles.choiceFree}`}
      onClick={() => setShowFreeText(true)}
    >
      ✏️ Write / Speak your response
=======
                <button className={`${styles.choiceBtn} ${styles.choiceFree}`} onClick={() => setShowFreeText(true)}>
        ✏ Write your own
>>>>>>> 142b8270588abdf05001ff4f4f584ff742f6acaa
      </button>
    </div>
            )
  }

  {/* Free text */ }
  {
    !isLoading && showFreeText && (
<<<<<<< HEAD
      <div className={styles.choices}>
        <p className={styles.choicesPrompt}>What do you say?</p>
        <div className={styles.freeInputWrapper}>
          <textarea
            className={styles.freeTextarea}
            value={draftMessage}
            onChange={(e) => setDraftMessage(e.target.value)}
            placeholder="Type your response or click the mic to speak..."
            rows={3}
            disabled={isLoading}
          />
          <button
            className={`${styles.micBtn} ${isListening ? styles.micActive : ''}`}
            onClick={toggleListening}
            disabled={isLoading}
            title="Dictate response"
          >
            {isListening ? '🛑' : '🎙️'}
          </button>
        </div>
        <div className={styles.nextRow}>
=======
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
>>>>>>> 142b8270588abdf05001ff4f4f584ff742f6acaa
              <button
                className={styles.sendBtn}
                onClick={() => sendTurn(draftMessage.trim())}
<<<<<<< HEAD
                disabled={isLoading || !draftMessage.trim() || isListening}
=======
                    disabled={!draftMessage.trim()}
>>>>>>> 142b8270588abdf05001ff4f4f584ff742f6acaa
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
<<<<<<< HEAD

    {
      latestHint && (
        <div className={styles.hintCard}>
          <div className={styles.hintHeader}>
            <span className={styles.hintHeaderLabel}>💡 Coach's Perspective</span>
          </div>
          <div className={styles.hintBody}>
            <p className={styles.hintPerspective}>{latestHint.whatRecruiterMayThink}</p>
            <div className={styles.hintActionBox}>
              <p className={styles.hintAction}><strong className={styles.hintActionLabel}>Suggested action:</strong> {latestHint.whatToSayNext}</p>
            </div>
            <p className={styles.hintWhy}>{latestHint.whyItWorks}</p>
          </div>
        </div>
      )
    }

    {
      error && (
        <div className={styles.choseDisplay}>
          <div className={styles.outcomeCard}>
            <span className={styles.outcomeLabel}>Error</span>
            <p className={styles.outcomeText}>{error}</p>
          </div>
        </div>
      )
    }

    {
      isLoading && (
        <div className={styles.choseDisplay}>
          <p className={styles.goalNote}>Thinking...</p>
        </div>
      )
    }
=======
>>>>>>> 142b8270588abdf05001ff4f4f584ff742f6acaa
          </div >
        )
  }

  {/* Error outside chat */ }
  {
    phase !== 'chat' && phase !== 'goal' && error && (
      <p className={styles.errorText}>{error}</p>
    )
  }

      </div >
    </PageShell >
  )
}
