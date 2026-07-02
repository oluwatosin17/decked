import { useState, useEffect, useCallback, useRef } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ─── Assets (from GameCardGrid) ─── */
const BANNER_LAUGH = 'https://www.figma.com/api/mcp/asset/20a2f2c6-f5fb-49c7-baed-a4572816ec34'
const BANNER_OUT   = 'https://www.figma.com/api/mcp/asset/5f3240e6-3c83-4fad-8b98-928384264491'

const SOCIAL_TIKTOK    = 'https://www.figma.com/api/mcp/asset/52c80b9f-7611-4e1c-b0a1-b87cbde55222'
const SOCIAL_INSTAGRAM = 'https://www.figma.com/api/mcp/asset/2fb330d3-8103-4715-98c4-977825083eae'
const SOCIAL_WHATSAPP  = 'https://www.figma.com/api/mcp/asset/5e3391bc-c214-4266-8b20-9d5680742eef'

/* ─── Lives modes ─── */
const LIVES_MODES = [
  { id: 'sudden-death', label: 'Sudden Death',            lives: 1 },
  { id: 'classic',      label: 'Classic',                 lives: 2 },
  { id: 'party-mode',   label: 'Party Mode (Recommended)',lives: 3 },
  { id: 'endurance',    label: 'Endurance',               lives: 4 },
  { id: 'marathon',     label: 'Marathon',                lives: 5 },
]

/* ─── Challenges ─── */
const CHALLENGES = [
  "Pretend you're a robot learning how to dance for the first time.",
  "Describe what you had for breakfast as if it was the most dramatic thing that ever happened.",
  "Speak like a pirate for the next 30 seconds.",
  "Do your best impression of a cat discovering a vacuum cleaner.",
  "Narrate everything you do right now as if you're a nature documentary.",
  "Try to sell a used sock like it's the most valuable item in the world.",
  "Act out waking up in the morning but in extreme slow motion.",
  "Describe your last trip to the supermarket as if it was an action movie.",
  "Do your best impression of a baby learning to walk for the first time.",
  "Explain how to make a sandwich as if you've never seen food before.",
  "Pretend you're a news anchor reporting on the fact that you're sitting down.",
  "Do a dramatic reading of your most recent text message.",
  "Act like you just discovered gravity for the first time.",
  "Speak only in questions for the next 30 seconds.",
  "Pretend you're a Shakespearean actor reciting your grocery list.",
  "Do your best impression of a penguin trying to text.",
  "Describe the colour blue to someone who's never seen it.",
  "Act like a lawyer passionately defending the right to eat cereal with a fork.",
  "Pretend you're a sports commentator narrating someone blinking.",
  "Do your best impression of a medieval knight ordering a pizza.",
  "Tell a dramatic story about losing the TV remote.",
  "Pretend you're a tour guide showing visitors around your kitchen.",
  "Do a weather forecast for inside your house.",
  "Act like a scientist explaining why you just sneezed.",
  "Narrate yourself scrolling through your phone like a thriller.",
  "Do your best impression of a disappointed parent when the WiFi goes out.",
  "Pretend you're accepting an Oscar for your performance of doing dishes.",
  "Speak like a motivational coach encouraging someone to open a door.",
  "Act like a game show host announcing tonight's dinner.",
  "Do your best impression of a cat walking across a keyboard.",
]

/* ─── Nav ─── */
function GameNav({ onBack }: { onBack: () => void }) {
  return (
    <nav style={{ background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 60px', height: '80px', flexShrink: 0, position: 'relative', zIndex: 10 }}>
      <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '28px', color: '#fff', letterSpacing: '0.56px', fontWeight: 400 }}>DECKED</span>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        {['Browse Games', 'How to Play', 'About'].map(label => (
          <button key={label} onClick={label === 'Browse Games' ? onBack : undefined}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontFamily: "'Anton SC', sans-serif", fontSize: '16px', cursor: label === 'Browse Games' ? 'pointer' : 'default', padding: 0, transition: 'color 0.2s' }}
            onMouseOver={e => { if (label === 'Browse Games') (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
            onMouseOut={e => { if (label === 'Browse Games') (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)' }}
          >{label}</button>
        ))}
      </div>
    </nav>
  )
}

/* ─── Footer ─── */
function GameFooter() {
  return (
    <footer style={{ background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)', padding: '32px 60px', display: 'flex', flexDirection: 'column', gap: '40px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '420px' }}>
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '32px', color: '#fff' }}>DECKED</span>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>Pick a deck, pass the phone, and let the chaos begin. 10+ party card games, no app, no login, no excuses.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {[SOCIAL_TIKTOK, SOCIAL_INSTAGRAM, SOCIAL_WHATSAPP].map((src, i) => (
            <img key={i} src={src} alt="" style={{ width: '20px', height: '20px', borderRadius: '8px', objectFit: 'contain' }} />
          ))}
        </div>
      </div>
      <div style={{ height: '1px', background: '#212326', width: '100%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#9ca3af' }}>© 2026 DECKED. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Privacy', 'Terms', 'Cookie'].map(l => (
            <button key={l} style={{ background: 'none', border: 'none', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '13px', cursor: 'pointer', padding: 0 }}>{l}</button>
          ))}
        </div>
      </div>
    </footer>
  )
}

/* ─── LYAO Card front face ─── */
function LYAOCardFront({ size = 320 }: { size?: number }) {
  const scale = size / 386
  return (
    <div style={{
      width: `${size}px`, height: `${Math.round(483 * scale)}px`,
      background: '#36a6bb', borderRadius: `${13 * scale}px`,
      overflow: 'hidden', position: 'relative',
      boxShadow: '0 24px 60px rgba(54,166,187,0.35)',
    }}>
      {/* Dotted pattern overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1.5px, transparent 1.5px)',
        backgroundSize: '14px 14px',
      }} />
      {/* YOU */}
      <p style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        top: `${22 * scale}px`,
        fontFamily: "'Gasoek One', sans-serif", fontSize: `${50 * scale}px`,
        color: '#755aa7', textAlign: 'center', whiteSpace: 'nowrap',
        margin: 0, lineHeight: 'normal',
      }}>YOU</p>
      {/* LAUGH banner */}
      <div style={{ position: 'absolute', left: `${73 * scale}px`, top: `${86 * scale}px`, width: `${240 * scale}px`, height: `${143 * scale}px` }}>
        <img src={BANNER_LAUGH} alt="" style={{ position: 'absolute', inset: '-0.36% -0.52% -0.74% -0.27%', width: '101%', height: '102%', objectFit: 'fill' }} />
        <p style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
          fontFamily: "'Gasoek One', sans-serif", fontSize: `${54 * scale}px`,
          color: '#f6f0f1', textAlign: 'center', whiteSpace: 'nowrap', margin: 0,
        }}>LAUGH</p>
      </div>
      {/* YOU'RE */}
      <p style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        top: `${255 * scale}px`,
        fontFamily: "'Gasoek One', sans-serif", fontSize: `${50 * scale}px`,
        color: '#fd587c', textAlign: 'center', whiteSpace: 'nowrap',
        margin: 0, lineHeight: 'normal',
      }}>YOU'RE</p>
      {/* OUT banner */}
      <div style={{ position: 'absolute', left: `${110 * scale}px`, top: `${312 * scale}px`, width: `${167 * scale}px`, height: `${143 * scale}px`, transform: 'scaleY(-1)' }}>
        <img src={BANNER_OUT} alt="" style={{ position: 'absolute', inset: '-0.12% -0.75% -0.67% -0.52%', width: '102%', height: '101%', objectFit: 'fill' }} />
      </div>
      <p style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        bottom: `${22 * scale}px`,
        fontFamily: "'Gasoek One', sans-serif", fontSize: `${54 * scale}px`,
        color: '#f6f0f1', textAlign: 'center', whiteSpace: 'nowrap',
        margin: 0, lineHeight: 'normal',
      }}>OUT</p>
    </div>
  )
}

/* ─── LYAO Card back (challenge) ─── */
function LYAOCardBack({ challenge, size = 320 }: { challenge: string; size?: number }) {
  const scale = size / 386
  return (
    <div style={{
      width: `${size}px`, height: `${Math.round(483 * scale)}px`,
      background: '#36a6bb', borderRadius: `${13 * scale}px`,
      overflow: 'hidden', position: 'relative',
      boxShadow: '0 24px 60px rgba(54,166,187,0.35)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: `${28 * scale}px ${22 * scale}px`,
      boxSizing: 'border-box',
    }}>
      {/* Dotted pattern overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1.5px, transparent 1.5px)',
        backgroundSize: '14px 14px',
      }} />
      <p style={{
        fontFamily: "'Gasoek One', sans-serif", fontSize: `${Math.max(18, 26 * scale)}px`,
        color: '#f6f0f1', textAlign: 'center', margin: 0, lineHeight: 1.25,
        position: 'relative', zIndex: 1,
      }}>
        {challenge}
      </p>
      <p style={{
        fontFamily: "'Inter', sans-serif", fontSize: `${12 * scale}px`,
        color: 'rgba(255,255,255,0.55)', margin: 0, textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>
        #YOULAUGH YOU'REOUT
      </p>
    </div>
  )
}

/* ─── Mini LYAO Card ─── */
function MiniLYAOCard() {
  return (
    <div style={{
      width: '120px', height: '150px',
      background: '#36a6bb', borderRadius: '8px',
      overflow: 'hidden', position: 'relative',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1.5px, transparent 1.5px)', backgroundSize: '10px 10px' }} />
      <p style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '10px', fontFamily: "'Gasoek One', sans-serif", fontSize: '16px', color: '#755aa7', whiteSpace: 'nowrap', margin: 0 }}>YOU</p>
      <div style={{ position: 'absolute', left: '18px', top: '30px', width: '84px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={BANNER_LAUGH} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
        <p style={{ position: 'relative', fontFamily: "'Gasoek One', sans-serif", fontSize: '18px', color: '#f6f0f1', margin: 0 }}>LAUGH</p>
      </div>
      <p style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '74px', fontFamily: "'Gasoek One', sans-serif", fontSize: '16px', color: '#fd587c', whiteSpace: 'nowrap', margin: 0 }}>YOU'RE</p>
      <div style={{ position: 'absolute', left: '30px', top: '92px', width: '60px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scaleY(-1)' }}>
        <img src={BANNER_OUT} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
      </div>
      <p style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '8px', fontFamily: "'Gasoek One', sans-serif", fontSize: '18px', color: '#f6f0f1', whiteSpace: 'nowrap', margin: 0 }}>OUT</p>
    </div>
  )
}

/* ─── Hearts display ─── */
function Hearts({ current, max }: { current: number; max: number }) {
  if (max === 1) {
    return <span style={{ fontSize: '16px' }}>{current > 0 ? '💀' : '🩶'}</span>
  }
  return (
    <div style={{ display: 'flex', gap: '3px' }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ fontSize: '14px', opacity: i < current ? 1 : 0.25 }}>❤️</span>
      ))}
    </div>
  )
}

/* ─── Screen 2: Set Round Length ─── */
function SetRoundLength({ onBack, onNext }: { onBack: () => void; onNext: (secs: number) => void }) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const parsed = parseInt(value, 10)
  const valid  = !isNaN(parsed) && parsed >= 5 && parsed <= 300

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '500px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center' }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>SET ROUND LENGTH</h2>
        <div
          style={{ background: '#111113', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', width: '100%', boxSizing: 'border-box', cursor: 'text' }}
          onClick={() => inputRef.current?.focus()}
        >
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>⏱</span>
          </div>
          <input
            ref={inputRef} type="number" min={5} max={300}
            value={value} onChange={e => setValue(e.target.value)}
            placeholder="Enter seconds"
            style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', flex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', width: '300px' }}>
          <button onClick={onBack} className="game-btn" style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', textAlign: 'center' }}>GO BACK</button>
          <button onClick={() => valid && onNext(parsed)}
            style={{ flex: 1, background: valid ? '#dc2827' : '#333', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: valid ? '#fff' : '#666', cursor: valid ? 'pointer' : 'not-allowed', letterSpacing: '0.05em', transition: 'background 0.2s', textAlign: 'center' }}>
            NEXT
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Screen 3: Lives per Player ─── */
function LivesSetup({ onBack, onNext }: { onBack: () => void; onNext: (lives: number) => void }) {
  const [selected, setSelected] = useState('party-mode')

  const mode = LIVES_MODES.find(m => m.id === selected)!

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '500px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>Lives per Player</h2>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {LIVES_MODES.map(m => {
            const isSelected = selected === m.id
            return (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  background: isSelected ? '#1e1e22' : '#111113',
                  border: `1px solid ${isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '12px', padding: '14px 16px',
                  cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                {/* Life icons */}
                <div style={{ display: 'flex', gap: '3px', minWidth: '80px' }}>
                  {m.lives === 1 ? (
                    <span style={{ fontSize: '16px' }}>💀</span>
                  ) : (
                    Array.from({ length: m.lives }, (_, i) => (
                      <span key={i} style={{ fontSize: '14px', color: '#dc2827' }}>♦</span>
                    ))
                  )}
                </div>
                <span style={{
                  fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px',
                  color: isSelected ? '#fff' : 'rgba(255,255,255,0.6)',
                  transition: 'color 0.15s',
                }}>
                  {m.label}
                </span>
                {isSelected && (
                  <div style={{ marginLeft: 'auto', width: '20px', height: '20px', background: '#dc2827', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: '11px' }}>✓</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '8px', width: '300px' }}>
          <button onClick={onBack} className="game-btn" style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', textAlign: 'center' }}>GO BACK</button>
          <button className="game-btn-primary" onClick={() => onNext(mode.lives)} style={{ flex: 1, background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', textAlign: 'center' }}>NEXT</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Screen 4: Card face (tap to flip) ─── */
function CardFaceScreen({ onFlip }: { onFlip: () => void }) {
  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', position: 'relative', zIndex: 2, padding: '40px' }}>
      <div onClick={onFlip} style={{ cursor: 'pointer' }}>
        <LYAOCardFront size={320} />
      </div>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
        Tap the card to flip it.
      </p>
    </div>
  )
}

/* ─── Screen 5: Card back (challenge + start timer) ─── */
function CardBackScreen({ challenge, onStartTimer }: { challenge: string; onStartTimer: () => void }) {
  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', position: 'relative', zIndex: 2, padding: '40px' }}>
      <LYAOCardBack challenge={challenge} size={320} />
      <button
        className="game-btn-primary"
        onClick={onStartTimer}
        style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '14px 48px', fontFamily: "'Staatliches', sans-serif", fontSize: '18px', color: '#fff', letterSpacing: '0.08em' }}
      >
        START TIMER
      </button>
    </div>
  )
}

/* ─── Screen 6: Timer countdown ─── */
function TimerScreen({ challenge, seconds, onDone }: { challenge: string; seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (remaining <= 0) { onDone(); return }
    const id = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(id)
  }, [remaining, onDone])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const timeStr = mins > 0
    ? `${mins}:${secs.toString().padStart(2, '0')}`
    : `${remaining} SECS`

  const pct = remaining / seconds
  const urgentColor = remaining <= 5 ? '#dc2827' : remaining <= 10 ? '#f59e0b' : '#fff'

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px', position: 'relative', zIndex: 2, padding: '40px' }}>
      <LYAOCardBack challenge={challenge} size={300} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        {/* Progress arc */}
        <div style={{ position: 'relative', width: '120px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: `${pct * 100}%`, borderRadius: '4px',
            background: urgentColor,
            transition: 'width 1s linear, background 0.3s',
          }} />
        </div>
        <p style={{
          fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
          fontSize: '40px', color: urgentColor, margin: 0, letterSpacing: '0.04em',
          transition: 'color 0.3s',
          animation: remaining <= 5 ? 'done-stat-pop 0.3s var(--ease-out) both' : 'none',
        }}>
          {timeStr}
        </p>
      </div>

      <button className="game-btn" onClick={onDone}
        style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'none', borderRadius: '999px', padding: '10px 28px', fontFamily: "'Staatliches', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>
        TIME'S UP
      </button>
    </div>
  )
}

/* ─── Screen 7: Who Laughed? ─── */
function WhoLaughedScreen({
  players, livesMap, maxLives, roundNum, totalRounds,
  onSkip, onNext
}: {
  players: Player[]
  livesMap: Record<string, number>
  maxLives: number
  roundNum: number
  totalRounds: number
  onSkip: () => void
  onNext: (laughedKeys: string[]) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const activePlayers = players.filter(p => livesMap[p.name] > 0)
  const canNext = true // can always proceed

  const toggle = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '500px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>Who Laughed?</h2>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activePlayers.map(p => {
            const isSelected = selected.has(p.name)
            return (
              <button
                key={p.name}
                onClick={() => toggle(p.name)}
                style={{
                  display: 'flex', alignItems: 'center',
                  background: '#111113', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px', padding: '14px 16px',
                  cursor: 'pointer', transition: 'border-color 0.15s',
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: p.color, flexShrink: 0, marginRight: '14px' }} />
                <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', flex: 1, textAlign: 'left' }}>{p.name}</span>
                {/* Lives remaining */}
                <div style={{ marginRight: '12px' }}>
                  <Hearts current={livesMap[p.name]} max={maxLives} />
                </div>
                {/* Checkbox */}
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  border: `2px solid ${isSelected ? '#dc2827' : 'rgba(255,255,255,0.2)'}`,
                  background: isSelected ? '#dc2827' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.15s',
                }}>
                  {isSelected && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                </div>
              </button>
            )
          })}
        </div>

        {totalRounds > 0 && (
          <div className="counter-in" style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>
            ROUND {roundNum} OF {totalRounds}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', width: '360px' }}>
          <button className="game-btn" onClick={onSkip} style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', textAlign: 'center' }}>SKIP FOR NOW</button>
          <button
            className={canNext ? 'game-btn-primary' : ''}
            onClick={() => onNext([...selected])}
            style={{ flex: 1, background: selected.size > 0 ? '#dc2827' : '#2a2a2a', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: selected.size > 0 ? '#fff' : '#555', cursor: 'pointer', letterSpacing: '0.05em', textAlign: 'center', transition: 'background 0.2s' }}>
            NEXT
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Screen 8: Winner ─── */
function WinnerScreen({ winner, roundsPlayed, onPlayAgain, onBrowseGames }: { winner: Player | null; roundsPlayed: number; onPlayAgain: () => void; onBrowseGames: () => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '40px', position: 'relative', zIndex: 2 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
        <h2 className="done-heading" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '48px', color: '#fff', margin: 0 }}>WE HAVE A WINNER!</h2>
        <p className="done-subtitle" style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>You played {roundsPlayed} round{roundsPlayed !== 1 ? 's' : ''}</p>
      </div>

      {winner && (
        <div className="stagger-item" style={{ background: '#18181b', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', padding: '12px 20px', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: winner.color, flexShrink: 0, boxShadow: '0 0 0 2.5px #ffffff' }} />
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '20px', color: '#fff' }}>{winner.name}</span>
          <span style={{ fontSize: '20px' }}>🏆</span>
        </div>
      )}

      <MiniLYAOCard />

      <div className="done-btns" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button className="game-btn" onClick={onBrowseGames} style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>BROWSE GAMES</button>
        <button className="game-btn-primary" onClick={onPlayAgain} style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>PLAY AGAIN</button>
      </div>
    </div>
  )
}

/* ─── Root ─── */
type Step = 'playerSetup' | 'roundLength' | 'livesSetup' | 'cardFace' | 'cardBack' | 'timer' | 'whoLaughed' | 'winner'

export default function LaughYouAreOutGame({ onClose }: { onClose: () => void }) {
  const [step,          setStep]          = useState<Step>('playerSetup')
  const [players,       setPlayers]       = useState<Player[]>([])
  const [roundSeconds,  setRoundSeconds]  = useState(30)
  const [maxLives,      setMaxLives]      = useState(3)
  const [livesMap,      setLivesMap]      = useState<Record<string, number>>({})
  const [roundNum,      setRoundNum]      = useState(1)
  const [challenges,    setChallenges]    = useState(() => shuffle(CHALLENGES))
  const [challengeIdx,  setChallengeIdx]  = useState(0)
  const [winner,        setWinner]        = useState<Player | null>(null)

  const currentChallenge = challenges[challengeIdx % challenges.length]
  const activePlayers = players.filter(p => livesMap[p.name] > 0)

  const startGame = useCallback((p: Player[], lives: number) => {
    const map: Record<string, number> = {}
    p.forEach(pl => { map[pl.name] = lives })
    setLivesMap(map)
    setRoundNum(1)
    setChallenges(shuffle(CHALLENGES))
    setChallengeIdx(0)
    setStep('cardFace')
  }, [])

  const handleLaughed = useCallback((laughedKeys: string[]) => {
    setLivesMap(prev => {
      const next = { ...prev }
      laughedKeys.forEach(name => {
        if (next[name] > 0) next[name]--
      })
      return next
    })

    setChallengeIdx(i => i + 1)
    setRoundNum(r => r + 1)

    // Check for winner after next render
    setTimeout(() => {
      setLivesMap(current => {
        const alive = players.filter(p => current[p.name] > 0)
        if (alive.length <= 1) {
          setWinner(alive[0] ?? null)
          setStep('winner')
        } else {
          setStep('cardFace')
        }
        return current
      })
    }, 50)
  }, [players])

  const handlePlayAgain = useCallback(() => {
    setRoundNum(1)
    const map: Record<string, number> = {}
    players.forEach(pl => { map[pl.name] = maxLives })
    setLivesMap(map)
    setChallenges(shuffle(CHALLENGES))
    setChallengeIdx(0)
    setWinner(null)
    setStep('cardFace')
  }, [players, maxLives])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <GameNav onBack={onClose} />

      {step === 'playerSetup' && (
        <SharedPlayerSetup
          initialPlayers={players}
          skipLabel="GO BACK"
          onSkip={onClose}
          onNext={p => { setPlayers(p); setStep('roundLength') }}
        />
      )}

      {step === 'roundLength' && (
        <SetRoundLength
          onBack={() => setStep('playerSetup')}
          onNext={secs => { setRoundSeconds(secs); setStep('livesSetup') }}
        />
      )}

      {step === 'livesSetup' && (
        <LivesSetup
          onBack={() => setStep('roundLength')}
          onNext={lives => { setMaxLives(lives); startGame(players, lives) }}
        />
      )}

      {step === 'cardFace' && (
        <CardFaceScreen onFlip={() => setStep('cardBack')} />
      )}

      {step === 'cardBack' && (
        <CardBackScreen
          challenge={currentChallenge}
          onStartTimer={() => setStep('timer')}
        />
      )}

      {step === 'timer' && (
        <TimerScreen
          key={challengeIdx}
          challenge={currentChallenge}
          seconds={roundSeconds}
          onDone={() => setStep('whoLaughed')}
        />
      )}

      {step === 'whoLaughed' && (
        <WhoLaughedScreen
          players={players}
          livesMap={livesMap}
          maxLives={maxLives}
          roundNum={roundNum}
          totalRounds={0}
          onSkip={() => { setChallengeIdx(i => i + 1); setRoundNum(r => r + 1); setStep('cardFace') }}
          onNext={handleLaughed}
        />
      )}

      {step === 'winner' && (
        <WinnerScreen
          winner={winner}
          roundsPlayed={roundNum - 1}
          onPlayAgain={handlePlayAgain}
          onBrowseGames={onClose}
        />
      )}

      <GameFooter />
    </div>
  )
}
