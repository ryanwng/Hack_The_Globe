import { useState, useEffect, useCallback, useRef } from 'react'
import styles from './WorkplaceMap.module.css'
import PageShell from '../components/PageShell'
import { useTheme } from '../context/ThemeContext'

// ── Constants ──────────────────────────────────────────────
const MAP_W = 960  // total map width in px
const MAP_H = 640  // total map height in px
const TILE = 42
const SPEED = 3    // px per frame
const CHAR_W = 20
const CHAR_H = 28
const VIEW_W = 620 // viewport width (what's visible)
const VIEW_H = 460 // viewport height

// ── Room definitions (pixel coords) ───────────────────────
const ROOMS = [
  {
    id: 'desk',
    label: 'Your Desk',
    icon: '⬜',
    x: 42, y: 42, w: 280, h: 196,
    doorX: 182, doorY: 230, doorW: 42, doorH: 10,
    scenarios: [
      { id: 'ask-help', title: 'Asking your manager for help', difficulty: 'gentle', duration: '5–8 min', tag: 'Low pressure', apiScenarioId: 'team_conflict', apiScenarioTitle: 'Team Conflict' },
      { id: 'deadline-extend', title: 'Requesting a deadline extension', difficulty: 'moderate', duration: '8–12 min', tag: 'Conflict-adjacent', apiScenarioId: 'team_conflict', apiScenarioTitle: 'Team Conflict' },
    ],
  },
  {
    id: 'interview',
    label: 'Interview Room',
    icon: '▣',
    x: 638, y: 42, w: 280, h: 196,
    doorX: 750, doorY: 230, doorW: 42, doorH: 10,
    scenarios: [
      { id: 'first-interview', title: 'First job interview', difficulty: 'moderate', duration: '10–15 min', tag: 'High stakes', apiScenarioId: 'job_interview', apiScenarioTitle: 'Job Interview' },
      { id: 'follow-up', title: 'Following up after an interview', difficulty: 'gentle', duration: '5–8 min', tag: 'Low pressure', apiScenarioId: 'job_interview', apiScenarioTitle: 'Job Interview' },
    ],
  },
  {
    id: 'break-room',
    label: 'Break Room',
    icon: '◫',
    x: 42, y: 336, w: 280, h: 260,
    doorX: 182, doorY: 336, doorW: 42, doorH: 10,
    scenarios: [
      { id: 'small-talk', title: 'Small talk at the coffee machine', difficulty: 'gentle', duration: '4–6 min', tag: 'Social', apiScenarioId: 'team_conflict', apiScenarioTitle: 'Team Conflict' },
      { id: 'lunch', title: 'Joining colleagues for lunch', difficulty: 'gentle', duration: '6–10 min', tag: 'Social', apiScenarioId: 'team_conflict', apiScenarioTitle: 'Team Conflict' },
    ],
  },
  {
    id: 'meeting',
    label: 'Meeting Room',
    icon: '▦',
    x: 638, y: 336, w: 280, h: 260,
    doorX: 778, doorY: 336, doorW: 42, doorH: 10,
    scenarios: [
      { id: 'team-meeting', title: 'Speaking up in a team meeting', difficulty: 'moderate', duration: '10–15 min', tag: 'Group setting', apiScenarioId: 'team_conflict', apiScenarioTitle: 'Team Conflict' },
      { id: 'disagreement', title: 'Disagreeing respectfully', difficulty: 'challenging', duration: '12–18 min', tag: 'Conflict', apiScenarioId: 'team_conflict', apiScenarioTitle: 'Team Conflict' },
    ],
  },
]

const HALLWAY_ZONE = { x: 378, y: 238, w: 204, h: 184 }

// ── Wall segments (rects that block movement) ─────────────
// Build from room boundaries minus door openings
function buildWalls() {
  const walls = []
  const T = 6 // wall thickness

  // Outer boundary walls
  walls.push({ x: 0, y: 0, w: MAP_W, h: T })           // top
  walls.push({ x: 0, y: MAP_H - T, w: MAP_W, h: T })   // bottom
  walls.push({ x: 0, y: 0, w: T, h: MAP_H })            // left
  walls.push({ x: MAP_W - T, y: 0, w: T, h: MAP_H })    // right

  for (const room of ROOMS) {
    const { x, y, w, h, doorX, doorY, doorW, doorH } = room

    // Top wall of room (if door is not on top)
    if (doorY !== y) {
      walls.push({ x, y, w, h: T })
    } else {
      // Split around door
      if (doorX > x) walls.push({ x, y, w: doorX - x, h: T })
      if (doorX + doorW < x + w) walls.push({ x: doorX + doorW, y, w: (x + w) - (doorX + doorW), h: T })
    }

    // Bottom wall
    // Always carve bottom wall with a gap for the door
    const bottomY = y + h - T
    
    walls.push({
      x,
      y: bottomY,
      w: doorX - x,
      h: T,
    })

    walls.push({
      x: doorX + doorW,
      y: bottomY,
      w: (x + w) - (doorX + doorW),
      h: T,
    })

    // Left wall
    if (doorX !== x) {
      walls.push({ x, y, w: T, h })
    } else {
      if (doorY > y) walls.push({ x, y, w: T, h: doorY - y })
      if (doorY + doorW < y + h) walls.push({ x, y: doorY + doorW, w: T, h: (y + h) - (doorY + doorW) })
    }

    // Right wall
    if (doorX !== x + w) {
      walls.push({ x: x + w - T, y, w: T, h })
    } else {
      if (doorY > y) walls.push({ x: x + w - T, y, w: T, h: doorY - y })
      if (doorY + doorW < y + h) walls.push({ x: x + w - T, y: doorY + doorW, w: T, h: (y + h) - (doorY + doorW) })
    }
  }

  return walls
}

const WALLS = buildWalls()

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function isBlocked(px, py) {
  const charRect = { x: px, y: py, w: CHAR_W, h: CHAR_H }
  // Must stay within map
  if (px < 0 || py < 0 || px + CHAR_W > MAP_W || py + CHAR_H > MAP_H) return true
  for (const wall of WALLS) {
    if (rectsOverlap(charRect, wall)) return true
  }
  return false
}

function getRoomAt(px, py) {
  const cx = px + CHAR_W / 2
  const cy = py + CHAR_H / 2
  for (const room of ROOMS) {
    if (cx > room.x && cx < room.x + room.w && cy > room.y && cy < room.y + room.h) {
      return room
    }
  }
  return null
}

// ── Key directions ────────────────────────────────────────
const DIR = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
}

const FACING_FROM_DIR = { '0,-1': 'up', '0,1': 'down', '-1,0': 'left', '1,0': 'right' }

const DIFFICULTY_LABEL = { gentle: 'Gentle', moderate: 'Moderate', challenging: 'Challenging' }

// ── Component ─────────────────────────────────────────────
export default function WorkplaceMap({ navigate }) {
  const { reduceMotion } = useTheme()

  // Position in pixels
  const [pos, setPos] = useState({ x: 480, y: 300 })
  const [facing, setFacing] = useState('down')
  const [walking, setWalking] = useState(false)
  const [activeRoom, setActiveRoom] = useState(null)

  // Discrete camera for reduce-motion mode
  const [snapCam, setSnapCam] = useState({ x: 0, y: 0 })
  const snapCamRef = useRef({ x: 0, y: 0 })

  const keysDown = useRef(new Set())
  const posRef = useRef(pos)
  const rafRef = useRef(null)
  const mapRef = useRef(null)

  posRef.current = pos

  // Game loop
  useEffect(() => {
    let lastTime = 0

    function tick(time) {
      rafRef.current = requestAnimationFrame(tick)

      // ~60fps throttle
      if (time - lastTime < 16) return
      lastTime = time

      const keys = keysDown.current
      let dx = 0, dy = 0
      for (const key of keys) {
        const d = DIR[key]
        if (d) { dx += d[0]; dy += d[1] }
      }

      if (dx === 0 && dy === 0) {
        setWalking(false)
        return
      }

      // Normalize diagonal
      if (dx !== 0 && dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy)
        dx = dx / len
        dy = dy / len
      }

      const prev = posRef.current
      let nextX = prev.x + dx * SPEED
      let nextY = prev.y + dy * SPEED

      // Try full move first
      if (isBlocked(nextX, nextY)) {
        // Try sliding along axes
        const slideX = isBlocked(nextX, prev.y) ? prev.x : nextX
        const slideY = isBlocked(prev.x, nextY) ? prev.y : nextY
        nextX = slideX
        nextY = slideY
      }

      if (nextX !== prev.x || nextY !== prev.y) {
        setPos({ x: nextX, y: nextY })
        setWalking(true)
      } else {
        setWalking(false)
      }

      // Facing
      const facingKey = `${Math.sign(dx)},${Math.sign(dy)}`
      if (FACING_FROM_DIR[facingKey]) {
        setFacing(FACING_FROM_DIR[facingKey])
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Detect room
  useEffect(() => {
    const room = getRoomAt(pos.x, pos.y)
    setActiveRoom(room)
  }, [pos])

  // Discrete camera snap for reduce-motion mode
  // Background stays locked; snaps only when char hits viewport margin
  useEffect(() => {
    if (!reduceMotion) return
    const MARGIN = 40
    const cam = snapCamRef.current
    const localX = pos.x - cam.x
    const localY = pos.y - cam.y
    const needsSnap =
      localX < MARGIN ||
      localX + CHAR_W > VIEW_W - MARGIN ||
      localY < MARGIN ||
      localY + CHAR_H > VIEW_H - MARGIN
    if (needsSnap) {
      const next = {
        x: Math.max(0, Math.min(MAP_W - VIEW_W, pos.x + CHAR_W / 2 - VIEW_W / 2)),
        y: Math.max(0, Math.min(MAP_H - VIEW_H, pos.y + CHAR_H / 2 - VIEW_H / 2)),
      }
      snapCamRef.current = next
      setSnapCam(next)
    }
  }, [pos, reduceMotion])

  // Key handlers
  useEffect(() => {
  const handler = (e) => {
    // Movement keys
    if (DIR[e.key]) {
      e.preventDefault()
      keysDown.current.add(e.key)
    }

    // E key interaction
    if (e.key === 'e' || e.key === 'E') {
      if (activeRoom && isNearDoor(posRef.current, activeRoom)) {
        const firstScenario = activeRoom.scenarios?.[0]
        if (firstScenario) {
          navigate('scenario', firstScenario)
        }
      }
    }
  }

  const up = (e) => {
    keysDown.current.delete(e.key)
  }

  window.addEventListener('keydown', handler)
  window.addEventListener('keyup', up)

  return () => {
    window.removeEventListener('keydown', handler)
    window.removeEventListener('keyup', up)
  }
}, [activeRoom, navigate])

  // Auto-focus
  useEffect(() => { mapRef.current?.focus() }, [])

  // Check if character is in hallway zone
  const cx = pos.x + CHAR_W / 2
  const cy = pos.y + CHAR_H / 2
  const inHallway = cx > HALLWAY_ZONE.x && cx < HALLWAY_ZONE.x + HALLWAY_ZONE.w &&
    cy > HALLWAY_ZONE.y && cy < HALLWAY_ZONE.y + HALLWAY_ZONE.h

  const hallwayScenarios = [
    { id: 'pass-boss', title: 'Passing your boss in the corridor', difficulty: 'gentle', duration: '3–5 min', tag: 'Quick', apiScenarioId: 'team_conflict', apiScenarioTitle: 'Team Conflict' },
    { id: 'forgotten-name', title: 'Forgetting a colleague\'s name', difficulty: 'moderate', duration: '5–8 min', tag: 'Awkward moments', apiScenarioId: 'team_conflict', apiScenarioTitle: 'Team Conflict' },
  ]

  const panelRoom = activeRoom || (inHallway ? { id: 'hallway', label: 'Hallway', icon: '—', scenarios: hallwayScenarios } : null)

  // Camera: smooth tracking normally; discrete snap in reduce-motion mode
  const camX = reduceMotion ? snapCam.x : Math.max(0, Math.min(MAP_W - VIEW_W, pos.x + CHAR_W / 2 - VIEW_W / 2))
  const camY = reduceMotion ? snapCam.y : Math.max(0, Math.min(MAP_H - VIEW_H, pos.y + CHAR_H / 2 - VIEW_H / 2))

  return (
    <PageShell navigate={navigate}>
      <div className={styles.page}>
        <div className={styles.titleBar}>
          <h1 className={styles.title}>The Workplace</h1>
          <p className={styles.subtitle}>Use WASD or arrow keys to walk around. Enter a room to see its scenarios.</p>
        </div>

        <div className={styles.layout}>
          {/* Viewport — fixed size, no scroll */}
          <div
            className={styles.viewport}
            ref={mapRef}
            tabIndex={0}
            style={{ width: VIEW_W, height: VIEW_H }}
          >
            {/* The full map, shifted by camera */}
            <div className={styles.mapGrid} style={{
              width: MAP_W, height: MAP_H, position: 'absolute',
              transform: `translate(${-camX}px, ${-camY}px)`,
            }}>

              {/* Floor (background handles this) */}

              {/* Room floor fills */}
              {ROOMS.map(room => (
                <div
                  key={room.id}
                  className={styles.roomFloor}
                  style={{ left: room.x, top: room.y, width: room.w, height: room.h }}
                />
              ))}

              {/* Hallway zone */}
              <div
                className={styles.hallwayFloor}
                style={{ left: HALLWAY_ZONE.x, top: HALLWAY_ZONE.y, width: HALLWAY_ZONE.w, height: HALLWAY_ZONE.h }}
              />

              {/* Wall segments */}
              {WALLS.map((wall, i) => (
                <div
                  key={i}
                  className={styles.wall}
                  style={{ left: wall.x, top: wall.y, width: wall.w, height: wall.h }}
                />
              ))}

              {/* Door markers */}
              {ROOMS.map(room => (
                <div
                  key={`door-${room.id}`}
                  className={styles.door}
                  style={{
                    left: room.doorX,
                    top: room.doorY,     // ❗ no offset
                    width: room.doorW,
                    height: room.doorH,           // match wall thickness (T = 6)
                  }}
                />
              ))}

              {/* Room labels */}
              {ROOMS.map(room => (
                <div
                  key={`label-${room.id}`}
                  className={styles.roomLabel}
                  style={{ left: room.x + room.w / 2, top: room.y + 18 }}
                >
                  <span className={styles.roomIcon}>{room.icon}</span>
                  <span className={styles.roomName}>{room.label}</span>
                </div>
              ))}

              {/* Hallway label */}
              <div
                className={styles.roomLabel}
                style={{ left: HALLWAY_ZONE.x + HALLWAY_ZONE.w / 2, top: HALLWAY_ZONE.y + 14 }}
              >
                <span className={styles.roomIcon}>—</span>
                <span className={styles.roomName}>Hallway</span>
              </div>

              {/* Some decorative furniture */}
              <Furniture />

              {/* Character */}
              <div
                className={`${styles.character} ${walking ? styles.charWalking : ''}`}
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: CHAR_W,
                  height: CHAR_H,
                }}
              >
                <CharacterSVG facing={facing} />
              </div>
            </div>
          </div>{/* end viewport */}

          {/* Panel */}
          <div className={styles.panel}>
            {!panelRoom && (
              <div className={styles.panelHint}>
                <p className={styles.hintText}>Use WASD or arrow keys to move.</p>
                <p className={styles.hintText}>Walk through a door into a room to see its scenarios.</p>
                <div className={styles.legend}>
                  {ROOMS.map(h => (
                    <div key={h.id} className={styles.legendItem}>
                      <span className={styles.legendIcon}>{h.icon}</span>
                      <span className={styles.legendLabel}>{h.label}</span>
                    </div>
                  ))}
                  <div className={styles.legendItem}>
                    <span className={styles.legendIcon}>—</span>
                    <span className={styles.legendLabel}>Hallway</span>
                  </div>
                </div>
              </div>
            )}

            {panelRoom && (
              <div className={styles.scenarioPanel}>
                <div className={styles.panelHeader}>
                  <span className={styles.panelIcon}>{panelRoom.icon}</span>
                  <h2 className={styles.panelTitle}>{panelRoom.label}</h2>
                </div>
                <div className={styles.panelDivider} />
                {panelRoom.scenarios.map(s => (
                  <ScenarioCard key={s.id} scenario={s} onStart={() => navigate('scenario', s)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}

// ── Decorative furniture SVGs (purely visual) ─────────────
function Furniture() {
  return (
    <>
      {/* Desk room: desk + monitor */}
      <div className={styles.furniture} style={{ left: 90, top: 100, width: 100, height: 60 }}>
        <svg viewBox="0 0 100 60" fill="none" width="100" height="60">
          <rect x="2" y="10" width="96" height="46" rx="3" stroke="var(--ink)" strokeWidth="1.5" fill="none" opacity="0.2" />
          <rect x="30" y="2" width="40" height="26" rx="2" stroke="var(--ink)" strokeWidth="1" fill="none" opacity="0.15" />
          <line x1="48" y1="28" x2="52" y2="35" stroke="var(--ink)" strokeWidth="1" opacity="0.12" />
        </svg>
      </div>
      {/* Interview room: table + chairs */}
      <div className={styles.furniture} style={{ left: 700, top: 90, width: 110, height: 70 }}>
        <svg viewBox="0 0 110 70" fill="none" width="110" height="70">
          <rect x="20" y="18" width="70" height="34" rx="3" stroke="var(--ink)" strokeWidth="1.5" fill="none" opacity="0.2" />
          <circle cx="55" cy="9" r="7" stroke="var(--ink)" strokeWidth="1" fill="none" opacity="0.15" />
          <circle cx="55" cy="61" r="7" stroke="var(--ink)" strokeWidth="1" fill="none" opacity="0.15" />
        </svg>
      </div>
      {/* Break room: coffee machine + table */}
      <div className={styles.furniture} style={{ left: 80, top: 390, width: 60, height: 60 }}>
        <svg viewBox="0 0 60 60" fill="none" width="60" height="60">
          <rect x="8" y="4" width="38" height="48" rx="4" stroke="var(--ink)" strokeWidth="1.5" fill="none" opacity="0.2" />
          <circle cx="27" cy="28" r="10" stroke="var(--ink)" strokeWidth="1" fill="none" opacity="0.15" />
          <rect x="12" y="44" width="12" height="4" rx="1" stroke="var(--ink)" strokeWidth="0.8" fill="none" opacity="0.12" />
        </svg>
      </div>
      <div className={styles.furniture} style={{ left: 155, top: 420, width: 100, height: 50 }}>
        <svg viewBox="0 0 100 50" fill="none" width="100" height="50">
          <rect x="4" y="4" width="92" height="42" rx="3" stroke="var(--ink)" strokeWidth="1.5" fill="none" opacity="0.15" />
        </svg>
      </div>
      {/* Meeting room: long conference table */}
      <div className={styles.furniture} style={{ left: 670, top: 390, width: 180, height: 60 }}>
        <svg viewBox="0 0 180 60" fill="none" width="180" height="60">
          <rect x="8" y="12" width="164" height="36" rx="4" stroke="var(--ink)" strokeWidth="1.5" fill="none" opacity="0.2" />
          {[40, 90, 140].map(cx => (
            <g key={cx}>
              <circle cx={cx} cy="6" r="5" stroke="var(--ink)" strokeWidth="1" fill="none" opacity="0.12" />
              <circle cx={cx} cy="54" r="5" stroke="var(--ink)" strokeWidth="1" fill="none" opacity="0.12" />
            </g>
          ))}
        </svg>
      </div>
    </>
  )
}

// ── Scenario card ─────────────────────────────────────────
function ScenarioCard({ scenario, onStart }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.cardTag}>{scenario.tag}</span>
        <span className={`${styles.cardDiff} ${styles[`diff_${scenario.difficulty}`]}`}>
          {DIFFICULTY_LABEL[scenario.difficulty]}
        </span>
      </div>
      <h3 className={styles.cardTitle}>{scenario.title}</h3>
      <p className={styles.cardDur}>~ {scenario.duration}</p>
      <button className={styles.startBtn} onClick={onStart}>Begin →</button>
    </div>
  )
}

// ── Character SVG ─────────────────────────────────────────
function CharacterSVG({ facing }) {
  const eyes = {
    down:  { lx: 6.5, ly: 7,  rx: 11.5, ry: 7 },
    up:    { lx: 6.5, ly: 6,  rx: 11.5, ry: 6 },
    left:  { lx: 5,   ly: 7,  rx: 10,   ry: 7 },
    right: { lx: 8,   ly: 7,  rx: 13,   ry: 7 },
  }
  const e = eyes[facing] || eyes.down
  const showEyes = facing !== 'up'

  return (
    <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
      <ellipse cx="10" cy="27" rx="6" ry="1.5" fill="var(--ink)" fillOpacity="0.18" />
      <rect x="5" y="12" width="10" height="10" rx="2" fill="var(--ink)" />
      <circle cx="10" cy="7" r="5.5" fill="var(--ink)" />
      {showEyes && <>
        <circle cx={e.lx} cy={e.ly} r="0.9" fill="var(--paper)" />
        <circle cx={e.rx} cy={e.ry} r="0.9" fill="var(--paper)" />
      </>}
      <rect x="6" y="22" width="3" height="4.5" rx="1" fill="var(--ink)" />
      <rect x="11" y="22" width="3" height="4.5" rx="1" fill="var(--ink)" />
    </svg>
  )
}

function isNearDoor(pos, room) {
  if (!room) return false

  const cx = pos.x + CHAR_W / 2
  const cy = pos.y + CHAR_H / 2

  const door = {
    x: room.doorX,
    y: room.doorY,
    w: room.doorW,
    h: room.doorH,
  }

  // small interaction buffer
  const buffer = 20

  return (
    cx > door.x - buffer &&
    cx < door.x + door.w + buffer &&
    cy > door.y - buffer &&
    cy < door.y + door.h + buffer
  )
}