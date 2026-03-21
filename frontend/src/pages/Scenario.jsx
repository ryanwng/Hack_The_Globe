import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './Scenario.module.css'
import PageShell from '../components/PageShell'
import { completeSession, createSession, createTurn, getHint, getTTS } from '../api/client'
import { mapFrontendScenarioToApi } from '../lib/scenarioApiMapping'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const hasSpeechRecognition = !!SpeechRecognition;

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
`    ( (  )
     ) ) (
    ┌─────┐
    │     │
    └──┬──┘
    ───┴───`,
  meeting:
`  ┌─────────────┐
  ○  ─────────  ○
  ○  ─────────  ○
  └─────────────┘`,
  hallway:
`  ┌─────────────┐
  │  →    →     │
  │             │
  └─────────────┘`,
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

const ROOM_CHARACTER = {
  desk:      'Your Manager',
  interview: 'Interviewer',
  coffee:    'Colleague',
  meeting:   'Team Lead',
  hallway:   'Coworker',
}

function parseOption(opt) {
  const match = opt.match(/^\[(\w+)\]\s*(.+)$/)
  if (match) return { tag: match[1], text: match[2] }
  return { tag: null, text: opt }
}

const MOOD_FACES = {
  neutral:       { leftEye: [40, 38], rightEye: [60, 38], eyeR: 3, pupilOff: [1, 0], brows: null, mouth: null },
  pleased:       { leftEye: [40, 38], rightEye: [60, 38], eyeR: 2.5, pupilOff: [0.5, 0], brows: null, mouth: { type: 'smile', y: 52 } },
  skeptical:     { leftEye: [40, 38], rightEye: [60, 38], eyeR: 3, pupilOff: [1, 0], brows: 'raised-right', mouth: { type: 'flat', y: 52 } },
  concerned:     { leftEye: [40, 39], rightEye: [60, 39], eyeR: 3.2, pupilOff: [0, 0.5], brows: null, mouth: { type: 'flat', y: 52 } },
  impressed:     { leftEye: [40, 37], rightEye: [60, 37], eyeR: 3.8, pupilOff: [0, -0.5], brows: 'raised', mouth: { type: 'open', y: 52 } },
  uncomfortable: { leftEye: [41, 39], rightEye: [59, 39], eyeR: 2.5, pupilOff: [2, 0.5], brows: null, mouth: { type: 'flat', y: 52 } },
  amused:        { leftEye: [40, 39], rightEye: [60, 39], eyeR: 2, pupilOff: [0, 0], brows: null, mouth: { type: 'grin', y: 51 } },
  thoughtful:    { leftEye: [40, 37], rightEye: [60, 37], eyeR: 3, pupilOff: [-1.5, -1], brows: 'raised-left', mouth: { type: 'flat', y: 52 } },
}

function MouthShape({ type, y }) {
  switch (type) {
    case 'smile': return <path d={`M42 ${y} Q50 ${y + 5} 58 ${y}`} stroke="var(--paper)" strokeWidth="1.8" fill="none" />
    case 'grin': return <path d={`M40 ${y} Q50 ${y + 7} 60 ${y}`} stroke="var(--paper)" strokeWidth="2" fill="none" />
    case 'frown': return <path d={`M43 ${y + 2} Q50 ${y - 2} 57 ${y + 2}`} stroke="var(--paper)" strokeWidth="1.5" fill="none" />
    case 'flat': return <line x1="43" y1={y} x2="57" y2={y} stroke="var(--paper)" strokeWidth="1.5" />
    case 'open': return <ellipse cx="50" cy={y + 1} rx="4" ry="3" fill="var(--paper)" fillOpacity="0.6" />
    case 'tight': return <line x1="45" y1={y} x2="55" y2={y + 1} stroke="var(--paper)" strokeWidth="1.2" />
    default: return null
  }
}

function BrowShapes({ type }) {
  switch (type) {
    case 'raised': return (<>
      <line x1="34" y1="30" x2="45" y2="31" stroke="var(--paper)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="55" y1="31" x2="66" y2="30" stroke="var(--paper)" strokeWidth="1.5" strokeLinecap="round" />
    </>)
    case 'raised-right': return (<>
      <line x1="34" y1="33" x2="45" y2="33" stroke="var(--paper)" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="55" y1="31" x2="66" y2="29" stroke="var(--paper)" strokeWidth="1.5" strokeLinecap="round" />
    </>)
    case 'raised-left': return (<>
      <line x1="34" y1="29" x2="45" y2="31" stroke="var(--paper)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="55" y1="33" x2="66" y2="33" stroke="var(--paper)" strokeWidth="1.3" strokeLinecap="round" />
    </>)
    case 'furrowed': return (<>
      <line x1="35" y1="31" x2="45" y2="33" stroke="var(--paper)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="55" y1="33" x2="65" y2="31" stroke="var(--paper)" strokeWidth="1.4" strokeLinecap="round" />
    </>)
    default: return null
  }
}

function CharacterAvatar({ speaking, mood = 'neutral' }) {
  const face = MOOD_FACES[mood] || MOOD_FACES.neutral
  const [lx, ly] = face.leftEye
  const [rx, ry] = face.rightEye
  const [px, py] = face.pupilOff

  return (
    <div className={`${styles.avatarWrap} ${speaking ? styles.avatarSpeaking : ''}`}>
      <svg className={styles.avatarSvg} viewBox="0 0 100 120" fill="none">
        <ellipse cx="50" cy="116" rx="28" ry="4" fill="var(--ink)" fillOpacity="0.1" />
        <rect x="25" y="68" width="50" height="42" rx="10" fill="var(--ink)" />
        <circle cx="50" cy="40" r="26" fill="var(--ink)" />
        {/* eyes */}
        <circle cx={lx} cy={ly} r={face.eyeR} fill="var(--paper)" />
        <circle cx={rx} cy={ry} r={face.eyeR} fill="var(--paper)" />
        {/* pupils */}
        <circle cx={lx + px} cy={ly + py} r="1.2" fill="var(--paper-dark)" />
        <circle cx={rx + px} cy={ry + py} r="1.2" fill="var(--paper-dark)" />
        {/* brows */}
        {face.brows && <BrowShapes type={face.brows} />}
        {/* mouth */}
        {face.mouth && <MouthShape type={face.mouth.type} y={face.mouth.y} />}
      </svg>
    </div>
  )
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
  const [showText, setShowText] = useState(false)
  const [customGoal, setCustomGoal] = useState('')
  const [contextInput, setContextInput] = useState('')
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const [showTranscript, setShowTranscript] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [narration, setNarration] = useState('')
  const [charName, setCharName] = useState('')
  const [socialSignal, setSocialSignal] = useState('')
  const [mood, setMood] = useState('neutral')
  const [pendingOptions, setPendingOptions] = useState([])
  const [optionsReady, setOptionsReady] = useState(false)

  const bottomRef = useRef(null)
  const activeScenario = useMemo(() => scenario || {}, [scenario])
  const scenarioLabel = useMemo(() => activeScenario.title || 'Scenario', [activeScenario.title])
  const roomArt = ROOM_ART[SCENARIO_ROOM[activeScenario.id]] || ROOM_ART.desk
  const roomKey = SCENARIO_ROOM[activeScenario.id] || 'desk'
  const displayName = charName || ROOM_CHARACTER[roomKey]

  // Latest AI dialogue for caption
  const latestAiMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i].content
    }
    return ''
  }, [messages])

  // Typewriter effect (skipped if user prefers reduced motion)
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [displayedText, setDisplayedText] = useState('')
  const typewriterRef = useRef(null)

  useEffect(() => {
    if (typewriterRef.current) clearInterval(typewriterRef.current)
    if (!latestAiMessage) { setDisplayedText(''); return }
    if (prefersReducedMotion) { setDisplayedText(latestAiMessage); return }
    setDisplayedText('')
    let i = 0
    const speed = Math.max(18, Math.min(35, 1200 / latestAiMessage.length))
    typewriterRef.current = setInterval(() => {
      i++
      setDisplayedText(latestAiMessage.slice(0, i))
      if (i >= latestAiMessage.length) clearInterval(typewriterRef.current)
    }, speed)
    return () => clearInterval(typewriterRef.current)
  }, [latestAiMessage])

  // ── Voice setup ──
  useEffect(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices()
    return () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel() }
  }, [])

  const gotFinalResult = useRef(false)
  const committedText = useRef('')

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            committedText.current += event.results[i][0].transcript;
            gotFinalResult.current = true;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setDraftMessage(committedText.current + interim);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (!hasSpeechRecognition) {
      alert("Your browser does not support Speech Recognition. Try Chrome or Safari.");
      return;
    }
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
    } else {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (window.currentAudio) { window.currentAudio.pause(); window.currentAudio = null; }
      setDraftMessage('');
      gotFinalResult.current = false;
      committedText.current = '';
      try { recognition.start(); setIsListening(true); } catch (e) { console.error(e); }
    }
  };

  const speakText = async (text) => {
    if (!isVoiceEnabled) return
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    if (window.currentAudio) window.currentAudio.pause()
    const cleanText = text.replace(/[*_~`]/g, '')
    setIsSpeaking(true)

    try {
      const response = await getTTS(cleanText)
      if (response && response.audioBuffer) {
        const audio = new Audio("data:audio/mp3;base64," + response.audioBuffer)
        window.currentAudio = audio
        audio.onended = () => setIsSpeaking(false)
        audio.play()
        return
      }
    } catch (e) {
      console.warn("Backend TTS failed, falling back", e)
    }

    if (!('speechSynthesis' in window)) { setIsSpeaking(false); return }
    const utterance = new SpeechSynthesisUtterance(cleanText)
    const voices = window.speechSynthesis.getVoices()
    const naturalVoice = voices.find(v =>
      v.name.includes('Samantha') || v.name.includes('Google US English') ||
      v.name.includes('Premium') || v.name.includes('Daniel')
    ) || voices.find(v => v.lang.startsWith('en'))
    if (naturalVoice) utterance.voice = naturalVoice
    utterance.rate = 0.95
    utterance.pitch = 1.05
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => { setApiScenario(mapFrontendScenarioToApi(activeScenario)) }, [activeScenario])

  // Stagger options in after dialogue appears
  const revealOptions = (opts) => {
    setOptionsReady(false)
    setPendingOptions(opts)
    setResponseOptions([])
    // Short delay so dialogue + TTS start first, then options fade in
    setTimeout(() => {
      setResponseOptions(opts)
      setOptionsReady(true)
    }, 600)
  }

  // ── API handlers ──
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
      setNarration(payload.narration || '')
      setCharName(payload.characterName || '')
      setMood(payload.mood || 'neutral')
      // Show dialogue + start speaking IMMEDIATELY
      setMessages([{ role: 'assistant', content: payload.aiOpeningMessage }])
      setIsLoading(false)
      setPhase('chat')
      speakText(payload.aiOpeningMessage)
      // Options stagger in while character talks
      revealOptions(payload.responseOptions || [])
    } catch (err) {
      setError(err.message || 'Unable to start session.')
      setIsLoading(false)
    }
  }

  const sendTurn = async (text) => {
    if (!text || !sessionId) return
    setError('')
    setIsLoading(true)
    setShowText(false)
    setResponseOptions([])
    setOptionsReady(false)
    setShowHint(false)
    setSocialSignal('')
    try {
      setMessages((prev) => [...prev, { role: 'user', content: text }])
      setDraftMessage('')
      const turn = await createTurn(sessionId, { userMessage: text })
      // Show dialogue + start speaking IMMEDIATELY
      setMessages((prev) => [...prev, { role: 'assistant', content: turn.aiMessage }])
      setNarration(turn.narration || '')
      setMood(turn.mood || 'neutral')
      setIsLoading(false)
      speakText(turn.aiMessage)
      // Signal + options stagger in while character talks
      setTimeout(() => setSocialSignal(turn.socialSignal || ''), 300)
      revealOptions(turn.responseOptions || [])
      setLatestHint(turn.hint || null)
      setHistory((prev) => [...prev, { userMessage: text, aiMessage: turn.aiMessage, hint: turn.hint || null, socialSignal: turn.socialSignal || '', mood: turn.mood || 'neutral' }])
    } catch (err) {
      setError(err.message || 'Unable to send message.')
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
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    try {
      const feedback = await completeSession(sessionId)
      const sessionData = { scenario: activeScenario, goal: selectedGoal, history, sessionId, feedback, characterName: charName }
      // Save to journal in localStorage
      try {
        const journal = JSON.parse(localStorage.getItem('socialscript_journal') || '[]')
        journal.unshift({
          id: sessionId,
          date: new Date().toISOString(),
          scenarioTitle: activeScenario.title || scenarioLabel,
          scenarioId: activeScenario.id,
          goal: selectedGoal,
          characterName: charName,
          turnCount: history.length,
          history,
          feedback,
        })
        localStorage.setItem('socialscript_journal', JSON.stringify(journal.slice(0, 50)))
      } catch (e) { /* localStorage full or unavailable */ }
      navigate('reflection', sessionData)
    } catch (err) {
      setError(err.message || 'Unable to complete session.')
    } finally {
      setIsFinishing(false)
    }
  }

  // Keep a ref to latest draft so the auto-send timer reads current value
  const draftRef = useRef(draftMessage)
  useEffect(() => { draftRef.current = draftMessage }, [draftMessage])

  // Auto-send when mic finishes and we captured speech
  useEffect(() => {
    if (!isListening && gotFinalResult.current && draftRef.current.trim()) {
      const t = setTimeout(() => {
        const text = draftRef.current.trim()
        if (text) {
          sendTurn(text)
          gotFinalResult.current = false
        }
      }, 800)
      return () => clearTimeout(t)
    }
  }, [isListening]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PageShell navigate={navigate}>
      <div className={styles.page}>

        {/* ── Header ── */}
        <div className={styles.scenarioHeader}>
          <button className={styles.backBtn} onClick={() => navigate('map')}>← Back</button>
          <span className={styles.breadcrumb}>{scenarioLabel}</span>
          <div className={styles.headerControls}>
            {phase === 'chat' && (
              <>
                <button
                  className={styles.voiceBtn}
                  onClick={() => {
                    setIsVoiceEnabled(!isVoiceEnabled)
                    if (isVoiceEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel()
                  }}
                  title={isVoiceEnabled ? "Mute" : "Unmute"}
                >
                  {isVoiceEnabled ? '◉' : '○'}
                </button>
                <button className={styles.pauseBtn} onClick={() => setPhase(p => p === 'paused' ? 'chat' : 'paused')}>
                  ||
                </button>
              </>
            )}
          </div>
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
                <textarea className={styles.goalInput} placeholder="e.g. I want to sound confident while admitting the mistake." value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} rows={3} />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Context <span className={styles.optional}>(optional)</span></label>
                <input className={styles.contextInput} placeholder="e.g. Technical meeting with engineering leads" value={contextInput} onChange={(e) => setContextInput(e.target.value)} />
              </div>
              {error && <p className={styles.errorText}>{error}</p>}
              <button className={styles.startBtn} onClick={handleStart} disabled={isLoading || !customGoal.trim()}>
                {isLoading ? 'Setting the stage...' : 'Begin →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Chat phase — "Call" UI ── */}
        {phase === 'chat' && (
          <div className={styles.callView}>

            {/* Goal reminder */}
            <div className={styles.goalReminder}>
              <span className={styles.goalReminderLabel}>Goal:</span>
              <span className={styles.goalReminderText}>{selectedGoal}</span>
            </div>

            {/* Call screen */}
            <div className={styles.callScreen}>
              {narration && (
                <p className={styles.narration}>{narration}</p>
              )}
              <CharacterAvatar speaking={isSpeaking || isLoading} mood={mood} />
              <span className={styles.charName}>{displayName}</span>

              {/* Caption */}
              <div className={styles.caption}>
                {isLoading ? (
                  <p className={styles.captionText}>
                    <span className={styles.dots}><span>.</span><span>.</span><span>.</span></span>
                  </p>
                ) : (
                  <p className={styles.captionText}>
                    {displayedText}
                    {displayedText.length < latestAiMessage.length && <span className={styles.cursor}>|</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Transcribed text preview */}
            {isListening && draftMessage && (
              <div className={styles.liveTranscript}>
                <span className={styles.liveLabel}>You:</span> {draftMessage}
              </div>
            )}

            {/* Social signal */}
            {socialSignal && !isLoading && (
              <div className={styles.signalBar}>
                <span className={styles.signalIcon}>◉</span>
                <span className={styles.signalText}>{socialSignal}</span>
              </div>
            )}

            {/* Response options */}
            {!isLoading && responseOptions.length > 0 && !showText && (
              <div className={styles.options}>
                {responseOptions.map((opt, i) => {
                  const { tag, text } = parseOption(opt)
                  return (
                    <button key={i} className={styles.optionBtn} onClick={() => sendTurn(text)}>
                      {tag && <span className={styles.optionTag}>{tag}</span>}
                      <span className={styles.optionText}>{text}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Hint panel */}
            {showHint && latestHint && (
              <div className={styles.hintPanel}>
                <div className={styles.hintHeader}>
                  <span className={styles.hintLabel}>Hint</span>
                  <button className={styles.hintClose} onClick={() => setShowHint(false)}>✕</button>
                </div>
                <div className={styles.hintRow}>
                  <span className={styles.hintKey}>They're thinking</span>
                  <p className={styles.hintVal}>{latestHint.whatRecruiterMayThink}</p>
                </div>
                <div className={styles.hintRow}>
                  <span className={styles.hintKey}>Try saying</span>
                  <p className={styles.hintVal}>{latestHint.whatToSayNext}</p>
                </div>
                <div className={styles.hintRow}>
                  <span className={styles.hintKey}>Why it works</span>
                  <p className={styles.hintVal}>{latestHint.whyItWorks}</p>
                </div>
              </div>
            )}

            {/* Input area — mic-first */}
            <div className={styles.inputArea}>
              {!showText ? (
                <>
                  <button
                    className={`${styles.bigMic} ${isListening ? styles.bigMicActive : ''}`}
                    onClick={toggleListening}
                    disabled={isLoading}
                  >
                    {isListening ? '■' : '●'}
                  </button>
                  <span className={styles.micLabel}>
                    {isListening ? 'Listening...' : 'Tap to respond'}
                  </span>
                  <button className={styles.textToggle} onClick={() => setShowText(true)}>
                    or type your response
                  </button>
                </>
              ) : (
                <div className={styles.textInput}>
                  <input
                    className={styles.textField}
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    placeholder="Type your response..."
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter' && draftMessage.trim()) sendTurn(draftMessage.trim()) }}
                  />
                  <button className={styles.sendBtn} onClick={() => sendTurn(draftMessage.trim())} disabled={!draftMessage.trim()}>
                    Send →
                  </button>
                  <button className={styles.textToggle} onClick={() => { setShowText(false); setDraftMessage('') }}>
                    use mic instead
                  </button>
                </div>
              )}
            </div>

            {error && <p className={styles.errorText}>{error}</p>}

            {/* Bottom bar */}
            <div className={styles.bottomBar}>
              <button className={styles.hintBtn} onClick={requestHint} disabled={isLoading}>
                ? Hint
              </button>
              <button className={styles.transcriptToggle} onClick={() => setShowTranscript(!showTranscript)}>
                {showTranscript ? 'Hide' : 'Transcript'}
              </button>
              <button className={styles.finishBtn} onClick={finishSession} disabled={isFinishing || messages.length < 2}>
                {isFinishing ? 'Finishing...' : 'Finish →'}
              </button>
            </div>

            {/* Collapsible transcript */}
            {showTranscript && (
              <div className={styles.transcript}>
                {messages.map((msg, i) => (
                  <div key={i} className={msg.role === 'assistant' ? styles.tLineAi : styles.tLineUser}>
                    <span className={styles.tRole}>{msg.role === 'assistant' ? 'Them' : 'You'}</span>
                    <span className={styles.tText}>{msg.content}</span>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>
    </PageShell>
  )
}
