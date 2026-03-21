import re

with open('frontend/src/pages/Scenario.jsx', 'r') as f:
    content = f.read()

# Conflict 1
c1 = """<<<<<<< HEAD
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
>>>>>>> 142b8270588abdf05001ff4f4f584ff742f6acaa"""
r1 = """const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
}"""
content = content.replace(c1, r1)

# Conflict 2
c2 = """<<<<<<< HEAD
              <h2 className={styles.goalHeading}>What is your goal for this conversation?</h2>
=======
              <h2 className={styles.goalHeading}>What's your goal?</h2>
              <p className={styles.goalNote}>Be specific — the AI will tailor the conversation to it.</p>
>>>>>>> 142b8270588abdf05001ff4f4f584ff742f6acaa"""
r2 = """              <h2 className={styles.goalHeading}>What's your goal?</h2>
              <p className={styles.goalNote}>Be specific — the AI will tailor the conversation to it.</p>"""
content = content.replace(c2, r2)


# Conflict 3
c3 = """<<<<<<< HEAD
=======
              {error && <p className={styles.errorText}>{error}</p>}

>>>>>>> 142b8270588abdf05001ff4f4f584ff742f6acaa"""
r3 = """              {error && <p className={styles.errorText}>{error}</p>}"""
content = content.replace(c3, r3)

# Conflict 4
c4 = """<<<<<<< HEAD
            {messages.map((message, i) => (
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
            ))}
=======
            {/* Messages */}
            <div className={styles.thread}>
              {messages.map((msg, i) => (
                <div key={i} className={msg.role === 'assistant' ? styles.characterBubble : styles.userBubble}>
                  <span className={styles.speakerName}>{msg.role === 'assistant' ? 'Them' : 'You'}</span>
                  <p className={styles.bubbleText}>{msg.content}</p>
                </div>
              ))}
>>>>>>> 142b8270588abdf05001ff4f4f584ff742f6acaa"""
r4 = """            {/* Messages */}
            <div className={styles.thread}>
              {messages.map((message, i) => (
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
              ))}"""
content = content.replace(c4, r4)

# Conflict 5
c5 = """<<<<<<< HEAD
                <button
                  className={`${styles.choiceBtn} ${styles.choiceFree}`}
                  onClick={() => setShowFreeText(true)}
                >
                  ✏️ Write / Speak your response
=======
                <button className={`${styles.choiceBtn} ${styles.choiceFree}`} onClick={() => setShowFreeText(true)}>
                  ✏ Write your own
>>>>>>> 142b8270588abdf05001ff4f4f584ff742f6acaa"""
r5 = """                <button className={`${styles.choiceBtn} ${styles.choiceFree}`} onClick={() => setShowFreeText(true)}>
                  ✏️ Write / Speak your response
"""
content = content.replace(c5, r5)

# Conflict 6
c6 = """<<<<<<< HEAD
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
>>>>>>> 142b8270588abdf05001ff4f4f584ff742f6acaa"""
r6 = """              <div className={styles.freeInput}>
                <div className={styles.freeInputWrapper}>
                  <textarea
                    className={styles.freeTextarea}
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    placeholder="Type your response or click the mic to speak..."
                    rows={3}
                    autoFocus
                    disabled={isLoading}
                  />
                  <button
                    className={`${styles.micBtn} ${isListening ? styles.micActive : ''}`}
                    onClick={toggleListening}
                    disabled={isLoading}
                    title="Dictate response"
                  >
                    {isListening ? '��' : '🎙️'}
                  </button>
                </div>
                <div className={styles.freeRow}>"""
content = content.replace(c6, r6)


# Conflict 7
c7 = """<<<<<<< HEAD
                    disabled={isLoading || !draftMessage.trim() || isListening}
=======
                    disabled={!draftMessage.trim()}
>>>>>>> 142b8270588abdf05001ff4f4f584ff742f6acaa"""
r7 = """                    disabled={isLoading || !draftMessage.trim() || isListening}"""
content = content.replace(c7, r7)

# Conflict 8
c8 = """<<<<<<< HEAD

            {latestHint && (
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
=======
>>>>>>> 142b8270588abdf05001ff4f4f584ff742f6acaa"""
r8 = """"""
content = content.replace(c8, r8)

with open('frontend/src/pages/Scenario.jsx', 'w') as f:
    f.write(content)

