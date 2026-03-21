import styles from './Help.module.css'
import PageShell from '../components/PageShell'

export default function Help({ navigate }) {
  return (
    <PageShell navigate={navigate}>
      <div className={styles.page}>

        <div className={styles.header}>
          <span className={styles.label}>About</span>
          <h1 className={styles.title}>SocialScript</h1>
          <p className={styles.subtitle}>A practice space for social conversations.</p>
        </div>

        <div className={styles.divider} />

        <section className={styles.section}>
          <span className={styles.sectionLabel}>What this is</span>
          <p className={styles.body}>
            SocialScript is built for people who find social interactions effortful —
            particularly autistic people, but also anyone with social anxiety,
            communication differences, or who simply hasn't had much opportunity
            to practice certain kinds of conversations.
          </p>
          <p className={styles.body}>
            You walk through a workplace. You enter rooms. You practice conversations
            with an AI that responds in context — a job interview, a tense moment with
            a manager, small talk at the coffee machine. There are no scores.
            No right answers. No timer. You go at your pace.
          </p>
        </section>

        <div className={styles.divider} />

        <section className={styles.section}>
          <span className={styles.sectionLabel}>Why it helps</span>
          <p className={styles.body}>
            Social interactions are hard to learn from experience alone — they happen
            fast, the stakes feel high, and mistakes linger. Practice in a low-stakes
            environment changes that.
          </p>
          <div className={styles.points}>
            <div className={styles.point}>
              <span className={styles.pointHead}>Reducing uncertainty.</span>
              <span className={styles.pointBody}> A major source of anxiety in social situations
              is not knowing what to expect. Rehearsing a conversation — even an approximation
              of one — builds a mental map of how it might go. That predictability is calming.</span>
            </div>
            <div className={styles.point}>
              <span className={styles.pointHead}>Cognitive rehearsal.</span>
              <span className={styles.pointBody}> Research on motor and cognitive skill learning
              shows that mentally rehearsing an action activates similar neural pathways to
              physically performing it. Practicing a difficult conversation here makes the
              real one feel more familiar.</span>
            </div>
            <div className={styles.point}>
              <span className={styles.pointHead}>No social cost.</span>
              <span className={styles.pointBody}> Saying the wrong thing here has no consequences.
              That removes the fear response that usually interferes with learning. You can
              try approaches you'd never risk in real life.</span>
            </div>
            <div className={styles.point}>
              <span className={styles.pointHead}>Your words, not a script.</span>
              <span className={styles.pointBody}> Every scenario lets you write your own response.
              The goal isn't to teach you to talk like a neurotypical person — it's to help
              you find language that feels true to you and works in context.</span>
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        <section className={styles.section}>
          <span className={styles.sectionLabel}>Sensory settings</span>
          <p className={styles.body}>
            The circle button in the bottom-right corner opens the appearance panel.
            These settings were chosen for specific reasons — not aesthetics alone.
          </p>
          <div className={styles.themeList}>
            <div className={styles.themeItem}>
              <span className={styles.themeName}>Paper</span>
              <p className={styles.themeDesc}>The default. Warm off-white background, moderate contrast.
              Less harsh than pure white displays.</p>
            </div>
            <div className={styles.themeItem}>
              <span className={styles.themeName}>Cream</span>
              <p className={styles.themeDesc}>Slightly warmer tint. Useful if white-heavy screens
              feel cold or clinical.</p>
            </div>
            <div className={styles.themeItem}>
              <span className={styles.themeName}>Night</span>
              <p className={styles.themeDesc}>Dark background. Reduces the total amount of light
              emitted by the screen — important for people with light sensitivity, or for
              use in low-light environments without causing eye strain or overstimulation.</p>
            </div>
            <div className={styles.themeItem}>
              <span className={styles.themeName}>Sage</span>
              <p className={styles.themeDesc}>Muted green tone. Cool greens are associated with
              lower arousal states in visual processing research — useful for reducing
              visual stimulation while keeping contrast readable.</p>
            </div>
            <div className={styles.themeItem}>
              <span className={styles.themeName}>Warm</span>
              <p className={styles.themeDesc}>High warmth, low blue light. Blue wavelengths are
              more stimulating to the nervous system. Reducing them can help with
              sustained reading and focus.</p>
            </div>
            <div className={styles.themeItem}>
              <span className={styles.themeName}>Mist</span>
              <p className={styles.themeDesc}>Low contrast between text and background.
              Counterintuitively, this can reduce visual fatigue for people whose eyes
              work hard to process sharp contrast — common in sensory processing
              differences and some forms of visual stress.</p>
            </div>
          </div>

          <div className={styles.toolList}>
            <div className={styles.toolItem}>
              <span className={styles.toolName}>Reduce Motion</span>
              <p className={styles.toolDesc}>Stops all non-essential animations.
              For people with vestibular sensitivity, even subtle screen movement
              can be disorienting or nauseating.</p>
            </div>
            <div className={styles.toolItem}>
              <span className={styles.toolName}>Font Spacing</span>
              <p className={styles.toolDesc}>Increases letter and word spacing.
              Helps with visual crowding — a phenomenon where closely spaced letters
              interfere with each other's recognition, common in dyslexia and some
              attention differences.</p>
            </div>
            <div className={styles.toolItem}>
              <span className={styles.toolName}>Monochrome</span>
              <p className={styles.toolDesc}>Removes all colour. Useful if colour
              variation feels distracting or if you have colour vision differences.</p>
            </div>
            <div className={styles.toolItem}>
              <span className={styles.toolName}>Readable Font</span>
              <p className={styles.toolDesc}>Switches to Atkinson Hyperlegible, a typeface
              designed by the Braille Institute to maximise legibility — with distinct
              letterforms that reduce character confusion for low-vision readers.</p>
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        <section className={styles.section}>
          <span className={styles.sectionLabel}>A note</span>
          <p className={styles.body}>
            This isn't therapy. It isn't a diagnostic tool. It's practice —
            the same way musicians run scales, or athletes visualise plays before a game.
            The point is repetition in a space where nothing bad can happen,
            so that when it counts, you've been there before.
          </p>
        </section>

        <div className={styles.divider} />

        <div className={styles.backRow}>
          <button className={styles.backBtn} onClick={() => navigate('landing')}>← Back</button>
        </div>

      </div>
    </PageShell>
  )
}
