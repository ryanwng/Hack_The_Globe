import { useState } from 'react'
import styles from './Scenario.module.css'
import PageShell from '../components/PageShell'

// Demo script for "first-interview" — other scenarios would have their own
const DEMO_SCRIPT = {
  setting: 'You\'re in a small meeting room. Across the table sits Jordan, the hiring manager — mid-30s, professional but relaxed. They have your resume in front of them. The interview is about to begin.',
  character: { name: 'Jordan', role: 'Hiring Manager', pronoun: 'they' },
  goal_options: [
    'I want to come across as competent and professional.',
    'I just want to get through this without freezing up.',
    'I want to seem friendly and easy to work with.',
    'I want to be honest about my experience, even if it\'s limited.',
  ],
  turns: [
    {
      id: 't1',
      character_says: 'Thanks for coming in today. Before we get into the role, I\'d love to just hear a bit about you — tell me about yourself.',
      options: [
        { id: 'a', text: 'Give a prepared overview of your background and why you\'re here.', thinking: 'Jordan seems receptive. A structured intro signals that you\'ve prepared.', outcome: 'Jordan nods and makes a note. "Good, so you\'ve thought about this. Let\'s dig in."' },
        { id: 'b', text: 'Say something like: "Sure — I\'m a bit nervous but I\'ll do my best."', thinking: 'Acknowledging nerves can feel relatable, but may also signal low confidence to some interviewers.', outcome: 'Jordan smiles slightly. "That\'s totally okay. Take your time." The tone stays warm but you feel the dynamic shift slightly.' },
        { id: 'c', text: 'Pause and ask: "Could you be more specific about what aspect you\'d like to hear about?"', thinking: 'Asking for clarification is a sign of precision, but in an open-ended moment, it can also read as evasion.', outcome: 'Jordan blinks, then says: "Sure — just your background, experience, why you\'re interested in this role." They seem slightly surprised.' },
        { id: 'd', text: '(Write your own response)', free: true, thinking: 'You chose your own words.', outcome: 'Jordan listens carefully. Their reaction will depend on what you said — but you stayed true to yourself.' },
      ]
    },
    {
      id: 't2',
      character_says: 'I see you haven\'t had a formal job before. That\'s fine — what have you done outside of school that you\'re proud of?',
      options: [
        { id: 'a', text: 'Talk about a project, hobby, or volunteer experience with specific details.', thinking: 'Specifics build credibility. Jordan can picture what you\'re describing.', outcome: '"That\'s exactly the kind of initiative we look for," Jordan says, leaning forward slightly.' },
        { id: 'b', text: 'Say: "Honestly, not that much — I\'ve mostly been focusing on school."', thinking: 'Honesty is good. But framing it as "not that much" may undersell yourself.', outcome: 'Jordan nods slowly. "Well, is there anything — even small?" The question is gentle, but there\'s a small silence.' },
        { id: 'c', text: 'Ask if it\'s okay to talk about something personal rather than professional.', thinking: 'Setting context shows self-awareness. It also opens a more personal, human moment.', outcome: '"Of course," Jordan says. "That\'s often the most interesting stuff."' },
        { id: 'd', text: '(Write your own response)', free: true, thinking: 'You chose your own words.', outcome: 'Jordan responds to whatever you said. The conversation continues.' },
      ]
    },
  ]
}

export default function Scenario({ scenario, navigate }) {
  const [phase, setPhase] = useState('goal') // goal | chat | paused
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [turnIndex, setTurnIndex] = useState(0)
  const [history, setHistory] = useState([])
  const [chosen, setChosen] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [freeText, setFreeText] = useState('')

  const script = DEMO_SCRIPT
  const currentTurn = script.turns[turnIndex]
  const isLast = turnIndex >= script.turns.length - 1

  const handleGoal = (goal) => {
    setSelectedGoal(goal)
    setPhase('chat')
  }

  const handleChoose = (option) => {
    setChosen(option)
    setRevealed(false)
  }

  const handleReveal = () => {
    setRevealed(true)
  }

  const handleNext = () => {
    setHistory(prev => [...prev, { turn: currentTurn, chosen, freeText }])
    if (isLast) {
      navigate('reflection', { scenario, goal: selectedGoal, history: [...history, { turn: currentTurn, chosen, freeText }] })
    } else {
      setTurnIndex(i => i + 1)
      setChosen(null)
      setRevealed(false)
      setFreeText('')
    }
  }

  return (
    <PageShell navigate={navigate}>
      <div className={styles.page}>
        {/* Scenario header */}
        <div className={styles.scenarioHeader}>
          <span className={styles.breadcrumb}>Workplace → {scenario?.title || 'Scenario'}</span>
          {phase === 'chat' && (
            <button className={styles.pauseBtn} onClick={() => setPhase(p => p === 'paused' ? 'chat' : 'paused')}>
              {phase === 'paused' ? '▶ Resume' : '⏸ Pause'}
            </button>
          )}
        </div>

        {/* Paused overlay */}
        {phase === 'paused' && (
          <div className={styles.pauseCard}>
            <h2 className={styles.pauseTitle}>Paused</h2>
            <p className={styles.pauseText}>Take all the time you need. This will be here when you return.</p>
            <button className={styles.resumeBtn} onClick={() => setPhase('chat')}>▶ Resume scenario</button>
            <button className={styles.exitBtn} onClick={() => navigate('map')}>← Return to map</button>
          </div>
        )}

        {/* Goal selection */}
        {phase === 'goal' && (
          <div className={styles.goalPhase}>
            <div className={styles.settingCard}>
              <span className={styles.settingLabel}>Setting</span>
              <p className={styles.settingText}>{script.setting}</p>
            </div>
            <div className={styles.goalSection}>
              <h2 className={styles.goalHeading}>What\'s your goal for this conversation?</h2>
              <p className={styles.goalNote}>There\'s no right answer. You decide what success looks like.</p>
              <div className={styles.goalOptions}>
                {script.goal_options.map((g, i) => (
                  <button
                    key={i}
                    className={`${styles.goalOption} ${selectedGoal === g ? styles.goalSelected : ''}`}
                    onClick={() => handleGoal(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat phase */}
        {phase === 'chat' && (
          <div className={styles.chatPhase}>
            {/* Goal reminder */}
            <div className={styles.goalReminder}>
              <span className={styles.goalReminderLabel}>Your goal:</span>
              <span className={styles.goalReminderText}>{selectedGoal}</span>
            </div>

            {/* Past turns */}
            {history.map((h, i) => (
              <div key={i} className={styles.historyTurn}>
                <div className={styles.characterBubble}>
                  <span className={styles.speakerName}>{script.character.name}</span>
                  <p className={styles.bubbleText}>{h.turn.character_says}</p>
                </div>
                <div className={styles.userBubble}>
                  <span className={styles.speakerName}>You</span>
                  <p className={styles.bubbleText}>{h.chosen?.free ? h.freeText || h.chosen.text : h.chosen?.text}</p>
                </div>
              </div>
            ))}

            {/* Current turn */}
            <div className={styles.characterBubble}>
              <span className={styles.speakerName}>{script.character.name}</span>
              <p className={styles.bubbleText}>{currentTurn.character_says}</p>
            </div>

            {!chosen && (
              <div className={styles.choices}>
                <p className={styles.choicesPrompt}>How do you respond?</p>
                {currentTurn.options.map(opt => (
                  <button
                    key={opt.id}
                    className={`${styles.choiceBtn} ${opt.free ? styles.choiceFree : ''}`}
                    onClick={() => handleChoose(opt)}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            )}

            {chosen && chosen.free && !revealed && (
              <div className={styles.freeInput}>
                <p className={styles.freePrompt}>What do you say?</p>
                <textarea
                  className={styles.freeTextarea}
                  value={freeText}
                  onChange={e => setFreeText(e.target.value)}
                  placeholder="Type your response..."
                  rows={3}
                />
                <button
                  className={styles.freeSubmit}
                  onClick={handleReveal}
                  disabled={!freeText.trim()}
                >
                  See what happens →
                </button>
              </div>
            )}

            {chosen && !chosen.free && !revealed && (
              <div className={styles.choseDisplay}>
                <div className={styles.userBubble}>
                  <span className={styles.speakerName}>You</span>
                  <p className={styles.bubbleText}>{chosen.text}</p>
                </div>
                <button className={styles.revealBtn} onClick={handleReveal}>
                  See what happens →
                </button>
              </div>
            )}

            {chosen && revealed && (
              <div className={styles.outcomeSection}>
                {chosen.free && freeText && (
                  <div className={styles.userBubble}>
                    <span className={styles.speakerName}>You</span>
                    <p className={styles.bubbleText}>{freeText}</p>
                  </div>
                )}
                <div className={styles.thinkingCard}>
                  <span className={styles.thinkingLabel}>What {script.character.name} might be thinking</span>
                  <p className={styles.thinkingText}>{chosen.thinking}</p>
                </div>
                <div className={styles.outcomeCard}>
                  <span className={styles.outcomeLabel}>What happens next</span>
                  <p className={styles.outcomeText}>{chosen.outcome}</p>
                </div>
                <div className={styles.nextRow}>
                  <button className={styles.tryAgainBtn} onClick={() => { setChosen(null); setRevealed(false); setFreeText('') }}>
                    ← Try a different response
                  </button>
                  <button className={styles.continueBtn} onClick={handleNext}>
                    {isLast ? 'Finish & reflect →' : 'Continue →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  )
}
