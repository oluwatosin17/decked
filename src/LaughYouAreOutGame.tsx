import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ─── Assets (permanently hosted on Cloudinary) ─── */
// Card banners
const BANNER_LAUGH = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/banner-laugh.svg'
const BANNER_OUT   = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/banner-out.svg'
// Winner mini-card banners (smaller versions — same art, reused at a smaller size)
const BANNER_LAUGH_SM = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/banner-laugh.svg'
const BANNER_OUT_SM   = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/banner-out.svg'
const ICON_LIVE   = '/icons/live.svg'

/* Hand-authored (no hosting needed — can never 404) */
function WatchIcon({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={style}>
      <circle cx="12" cy="13" r="8" stroke="#fff" strokeWidth="1.8" />
      <path d="M12 9v4l3 2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 2.5h5M12 2.5V5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

const SOCIAL_TIKTOK    = '/icons/social-tiktok.svg'
const SOCIAL_INSTAGRAM = '/icons/social-instagram.svg'
const SOCIAL_WHATSAPP  = '/icons/social-whatsapp.svg'

/* ─── Lives modes ─── */
const LIVES_MODES = [
  { id: 'sudden-death', label: 'Sudden Death',             lives: 1 },
  { id: 'classic',      label: 'Classic',                  lives: 2 },
  { id: 'party-mode',   label: 'Party Mode (Recommended)', lives: 3 },
  { id: 'endurance',    label: 'Endurance',                lives: 4 },
  { id: 'marathon',     label: 'Marathon',                 lives: 5 },
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
  "Act like a lawyer passionately defending the right to eat cereal with a fork.",
  "Pretend you're a sports commentator narrating someone blinking.",
  "Do your best impression of a medieval knight ordering a pizza.",
  "Tell a dramatic story about losing the TV remote.",
  "Pretend you're a tour guide showing visitors around your kitchen.",
  "Do a weather forecast for inside your house.",
  "Narrate yourself scrolling through your phone like a thriller.",
  "Do your best impression of a disappointed parent when the WiFi goes out.",
  "Pretend you're accepting an Oscar for your performance of doing dishes.",
  "Speak like a motivational coach encouraging someone to open a door.",
  "Act like a game show host announcing tonight's dinner.",
  "Do your best impression of a cat walking across a keyboard.",
  "Describe the colour blue to someone who's never seen it.",
  "Act like a scientist explaining why you just sneezed.",
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

/* ─── LYAO Card (flip-capable) ─── */
function LYAOCard({ challenge, flipped, onFlip }: { challenge: string; flipped: boolean; onFlip: () => void }) {
  const W = 320
  const H = 420
  const scale = W / 386

  return (
    <div
      onClick={!flipped ? onFlip : undefined}
      className={!flipped ? 'lyao-card-wrap' : ''}
      style={{ width: `${W}px`, height: `${H}px`, perspective: '1000px', cursor: flipped ? 'default' : 'pointer' }}
    >
      {/* Idle float wrapper — only while unflipped */}
      <div className={!flipped ? 'lyao-float' : ''} style={{ width: '100%', height: '100%' }}>
      <div style={{
        width: '100%', height: '100%', position: 'relative',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
      }}>

        {/* ── Front face ── */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          background: '#36a6bb', borderRadius: `${14 * scale}px`,
          overflow: 'hidden', outline: '2px solid rgba(255,255,255,0.25)',
          boxShadow: '0 20px 50px rgba(54,166,187,0.4)',
        }}>
          {/* Dots */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.22) 1.5px, transparent 1.5px)', backgroundSize: '14px 14px' }} />

          {/* YOU */}
          <p style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            top: `${28 * scale}px`,
            fontFamily: "'Gasoek One', sans-serif", fontSize: `${64 * scale}px`,
            color: '#755aa7', textAlign: 'center', whiteSpace: 'nowrap', margin: 0,
            WebkitTextStroke: `${3 * scale}px white`, paintOrder: 'stroke fill',
          }}>YOU</p>

          {/* LAUGH banner — wide, slight CCW tilt */}
          <div style={{
            position: 'absolute',
            left: '50%', transform: 'translateX(-50%) rotate(-4deg)',
            top: `${112 * scale}px`,
            width: `${330 * scale}px`, height: `${110 * scale}px`,
          }}>
            <img src={BANNER_LAUGH} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
            <p style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Gasoek One', sans-serif", fontSize: `${58 * scale}px`,
              color: '#f6f0f1', textAlign: 'center', whiteSpace: 'nowrap', margin: 0,
            }}>LAUGH</p>
          </div>

          {/* YOU'RE */}
          <p style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            top: `${246 * scale}px`,
            fontFamily: "'Gasoek One', sans-serif", fontSize: `${64 * scale}px`,
            color: '#fd587c', textAlign: 'center', whiteSpace: 'nowrap', margin: 0,
            WebkitTextStroke: `${3 * scale}px white`, paintOrder: 'stroke fill',
          }}>YOU'RE</p>

          {/* OUT banner — narrower, slight CW tilt, text inside */}
          <div style={{
            position: 'absolute',
            left: '50%', transform: 'translateX(-50%) rotate(3deg)',
            top: `${330 * scale}px`,
            width: `${210 * scale}px`, height: `${95 * scale}px`,
          }}>
            <img src={BANNER_OUT} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
            <p style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Gasoek One', sans-serif", fontSize: `${58 * scale}px`,
              color: '#f6f0f1', textAlign: 'center', whiteSpace: 'nowrap', margin: 0,
            }}>OUT</p>
          </div>
        </div>

        {/* ── Back face — challenge ── */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: '#36a6bb', borderRadius: `${14 * scale}px`,
          overflow: 'hidden', outline: '2px solid rgba(255,255,255,0.25)',
          boxShadow: '0 20px 50px rgba(54,166,187,0.4)',
        }}>
          {/* Dots — subtle on back face */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.10) 1.5px, transparent 1.5px)', backgroundSize: '14px 14px' }} />
          {/* Challenge text — Anton SC, white fill, 4px outside purple stroke */}
          <p style={{
            position: 'absolute',
            left: '50%', top: '50%', transform: 'translate(-50%, -60%)',
            width: `${252 * scale}px`,
            fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
            fontSize: `${22 * scale}px`,
            color: '#ffffff', textAlign: 'center', margin: 0, lineHeight: 1.45,
            WebkitTextStroke: `${4 * scale}px #755aa7`, paintOrder: 'stroke fill',
          }}>
            {challenge}
          </p>
          {/* Hashtag */}
          <p style={{
            position: 'absolute', right: `${14 * scale}px`, bottom: `${14 * scale}px`,
            fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
            fontSize: `${9 * scale}px`, color: 'rgba(255,255,255,0.6)', margin: 0, letterSpacing: '0.06em',
          }}>
            #YOULAUGHYOUAREOUT
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}

/* ─── Mini LYAO Card (game over screen) ─── */
function MiniLYAOCard() {
  const W = 150, H = 195, scale = W / 386
  return (
    <div style={{ width: `${W}px`, height: `${H}px`, background: '#36a6bb', borderRadius: `${14 * scale}px`, overflow: 'hidden', position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', outline: '2px solid rgba(255,255,255,0.2)' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.22) 1.5px, transparent 1.5px)', backgroundSize: '9px 9px' }} />
      {/* YOU */}
      <p style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: `${28 * scale}px`, fontFamily: "'Gasoek One', sans-serif", fontSize: `${64 * scale}px`, color: '#755aa7', whiteSpace: 'nowrap', margin: 0, WebkitTextStroke: `${3 * scale}px white`, paintOrder: 'stroke fill' }}>YOU</p>
      {/* LAUGH banner */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%) rotate(-4deg)', top: `${112 * scale}px`, width: `${330 * scale}px`, height: `${110 * scale}px` }}>
        <img src={BANNER_LAUGH_SM} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
        <p style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', fontFamily: "'Gasoek One', sans-serif", fontSize: `${58 * scale}px`, color: '#f6f0f1', whiteSpace: 'nowrap', margin: 0 }}>LAUGH</p>
      </div>
      {/* YOU'RE */}
      <p style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: `${246 * scale}px`, fontFamily: "'Gasoek One', sans-serif", fontSize: `${64 * scale}px`, color: '#fd587c', whiteSpace: 'nowrap', margin: 0, WebkitTextStroke: `${3 * scale}px white`, paintOrder: 'stroke fill' }}>YOU'RE</p>
      {/* OUT banner */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%) rotate(3deg)', top: `${330 * scale}px`, width: `${210 * scale}px`, height: `${95 * scale}px` }}>
        <img src={BANNER_OUT_SM} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
        <p style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', fontFamily: "'Gasoek One', sans-serif", fontSize: `${58 * scale}px`, color: '#f6f0f1', whiteSpace: 'nowrap', margin: 0 }}>OUT</p>
      </div>
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
          {/* Correct watch icon from Figma */}
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <WatchIcon style={{ width: '16px', height: '16px' }} />
          </div>
          <input
            ref={inputRef} type="number" min={5} max={300}
            value={value} onChange={e => setValue(e.target.value)}
            placeholder="Enter seconds"
            style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', flex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', width: '300px' }}>
          <button onClick={onBack} className="game-btn" style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>GO BACK</button>
          <button onClick={() => valid && onNext(parsed)}
            style={{ flex: 1, background: valid ? '#dc2827' : '#333', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: valid ? '#fff' : '#666', cursor: valid ? 'pointer' : 'not-allowed', letterSpacing: '0.05em', textAlign: 'center', transition: 'background 0.2s' }}>
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
      <div style={{ width: '560px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '50px', alignItems: 'center' }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>Lives per Player</h2>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {LIVES_MODES.map(m => {
            const isSelected = selected === m.id
            return (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: isSelected ? '#1a1a1d' : '#111113',
                  border: `1px solid ${isSelected ? 'rgba(255,255,255,0.15)' : 'transparent'}`,
                  borderRadius: '12px', padding: '12px',
                  height: '56px', cursor: 'pointer', width: '100%',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                {/* N life icons */}
                {Array.from({ length: m.lives }, (_, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={ICON_LIVE} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                  </div>
                ))}
                <span style={{
                  fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px',
                  color: isSelected ? '#fff' : 'rgba(255,255,255,0.5)',
                  lineHeight: 'normal', whiteSpace: 'nowrap', transition: 'color 0.15s',
                }}>
                  {m.label}
                </span>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '8px', width: '300px' }}>
          <button onClick={onBack} className="game-btn" style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>GO BACK</button>
          <button className="game-btn-primary" onClick={() => onNext(mode.lives)} style={{ flex: 1, background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', textAlign: 'center' }}>NEXT</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Gameplay: card flip + timer ─── */
type GamePhase = 'card' | 'timer'

function GameplayScreen({ challenge, seconds, onDone }: { challenge: string; seconds: number; onDone: () => void }) {
  const [flipped, setFlipped] = useState(false)
  const [phase, setPhase] = useState<GamePhase>('card')
  const [remaining, setRemaining] = useState(seconds)

  // Reset when challenge changes
  useEffect(() => { setFlipped(false); setPhase('card'); setRemaining(seconds) }, [challenge, seconds])

  // Timer
  useEffect(() => {
    if (phase !== 'timer') return
    if (remaining <= 0) { onDone(); return }
    const id = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, remaining, onDone])

  const pct = remaining / seconds
  const urgentColor = remaining <= 5 ? '#dc2827' : remaining <= 10 ? '#f59e0b' : '#fff'
  const timeStr = remaining >= 60
    ? `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`
    : `${remaining} SECS`

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', position: 'relative', zIndex: 2, padding: '40px' }}>
      <LYAOCard
        challenge={challenge}
        flipped={flipped}
        onFlip={() => setFlipped(true)}
      />

      {phase === 'card' && !flipped && (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          Tap the card to flip it.
        </p>
      )}

      {phase === 'card' && flipped && (
        <button
          className="game-btn"
          onClick={() => setPhase('timer')}
          style={{
            border: '1px solid #fff', background: 'none', borderRadius: '999px',
            padding: '12px 18px', width: '160px',
            fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff',
            textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
            letterSpacing: '0.05em',
          }}
        >
          START TIMER
        </button>
      )}

      {phase === 'timer' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          {/* Progress bar */}
          <div style={{ width: '200px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct * 100}%`, background: urgentColor, borderRadius: '3px', transition: 'width 1s linear, background 0.3s' }} />
          </div>
          <p className={remaining <= 5 ? 'timer-pulse' : ''} style={{
            fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
            fontSize: '36px', color: urgentColor, margin: 0, letterSpacing: '0.05em',
            transition: 'color 0.3s',
          }}>
            {timeStr}
          </p>
          <button className="game-btn" onClick={onDone}
            style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'none', borderRadius: '999px', padding: '8px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
            TIME'S UP
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Who Laughed? ─── */
function WhoLaughedScreen({
  players, livesMap, maxLives, onNext,
}: {
  players: Player[]
  livesMap: Record<string, number>
  maxLives: number
  onNext: (laughedKeys: string[]) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const canNext = selected.size > 0

  const toggle = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '500px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>

        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>WHO LAUGHED?</h2>

        {/* Player rows */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {players.map(p => {
            const lives     = livesMap[p.name] ?? maxLives
            const isOut     = lives <= 0
            const isSelected = selected.has(p.name)

            return (
              <div
                key={p.name}
                className="stagger-item lyao-row"
                onClick={() => !isOut && toggle(p.name)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#111113',
                  border: '1px dashed rgba(255,255,255,0.12)',
                  borderRadius: '12px', padding: '10px 14px', height: '56px',
                  cursor: isOut ? 'default' : 'pointer',
                  opacity: isOut ? 0.4 : 1,
                  boxSizing: 'border-box',
                }}
              >
                {/* Left: avatar (white ring, matching Who's Playing) + name */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: p.color, flexShrink: 0, boxShadow: '0 0 0 2.5px #ffffff' }} />
                  <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '17px', color: '#fff', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </span>
                </div>

                {/* Right: toggle circle — gray always, checkmark pops in when selected */}
                {!isOut && (
                  <div style={{
                    background: 'rgba(255,255,255,0.12)',
                    borderRadius: '50%', width: '32px', height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {isSelected && (
                      <svg key="check" className="check-pop" width="14" height="11" viewBox="0 0 14 11" fill="none">
                        <path d="M1.5 5.5L5.5 9.5L12.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Full-width NEXT button */}
        <button
          onClick={() => canNext && onNext([...selected])}
          style={{
            width: '100%',
            background: canNext ? '#dc2827' : '#2a2a2a',
            border: 'none', borderRadius: '999px', padding: '16px 18px',
            fontFamily: "'Staatliches', sans-serif", fontSize: '18px', letterSpacing: '0.05em',
            color: canNext ? '#fff' : '#666',
            cursor: canNext ? 'pointer' : 'default',
            textAlign: 'center',
            transition: 'background 0.2s',
            boxShadow: canNext ? '0 10px 20px rgba(220,40,39,0.3)' : 'none',
          }}>
          NEXT
        </button>
      </div>
    </div>
  )
}

/* ─── Lives Remaining screen ─── */
function LivesRemainingScreen({
  players, livesMap, maxLives, onSkip, onNext,
}: {
  players: Player[]
  livesMap: Record<string, number>
  maxLives: number
  onSkip: () => void
  onNext: () => void
}) {
  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '500px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '50px', alignItems: 'center' }}>

        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>LIVES REMAINING</h2>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {players.map((p, rowIdx) => {
            const lives = livesMap[p.name] ?? maxLives
            const isOut = lives <= 0
            return (
              <div key={p.name} className="stagger-item lyao-row" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#111113', border: '1px dashed rgba(255,255,255,0.1)',
                borderRadius: '12px', padding: '12px', height: '56px',
                opacity: isOut ? 0.4 : 1, boxSizing: 'border-box',
                animationDelay: `${0.05 + rowIdx * 0.06}s`,
              }}>
                {/* Left: avatar (white ring) + name */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: p.color, flexShrink: 0, boxShadow: '0 0 0 2.5px #ffffff' }} />
                  <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', whiteSpace: 'nowrap' }}>{p.name}</span>
                </div>
                {/* Right: life icons — colored = remaining, greyscale = lost */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {Array.from({ length: maxLives }, (_, i) => {
                    const isActive = i < lives
                    return (
                      <div key={i} className="live-pop" style={{
                        background: isActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                        borderRadius: '10px', width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animationDelay: `${0.1 + rowIdx * 0.07 + i * 0.055}s`,
                        transition: 'background 0.2s',
                      }}>
                        <img
                          src={ICON_LIVE} alt=""
                          style={{
                            width: '22px', height: '22px', objectFit: 'contain',
                            filter: isActive ? 'none' : 'grayscale(1) brightness(0.55)',
                            transition: 'filter 0.3s',
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '8px', width: '402px' }}>
          <button className="game-btn" onClick={onSkip}
            style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', letterSpacing: '0.05em', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>
            SKIP FOR NOW
          </button>
          <button className="game-btn-primary" onClick={onNext}
            style={{ flex: 1, background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', letterSpacing: '0.05em', boxShadow: '0 10px 12px rgba(220,40,39,0.25)' }}>
            NEXT
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Game Over / Tie screen ─── */
function GameOverScreen({ winner, roundsPlayed, onPlayAgain, onBrowseGames }: { winner: Player | null; roundsPlayed: number; onPlayAgain: () => void; onBrowseGames: () => void }) {
  const isTie = winner === null

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '40px', position: 'relative', zIndex: 2 }}>

      {/* Heading */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
        <h2 className="done-heading" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '48px', color: '#fff', margin: 0, textAlign: 'center' }}>
          {isTie ? "IT'S A TIE" : 'GAME OVER'}
        </h2>
        <p className="done-subtitle" style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          You played {roundsPlayed} round{roundsPlayed !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Winner chip OR "No winner" chip */}
      {isTie ? (
        <div className="stagger-item" style={{
          background: '#111113', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '999px', padding: '10px 20px',
          display: 'inline-flex', alignItems: 'center',
        }}>
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', color: '#fff' }}>No winner</span>
        </div>
      ) : winner && (
        <div className="stagger-item" style={{
          background: '#111113', border: '1px dashed rgba(255,255,255,0.12)',
          borderRadius: '12px', padding: '12px 20px', height: '54px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: winner.color, flexShrink: 0 }} />
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '17px', color: '#fff' }}>{winner.name}</span>
          <img src="/icons/trophy.svg" alt="" style={{ width: '24px', height: '24px', marginLeft: '4px' }} />
        </div>
      )}

      <div className="done-card"><MiniLYAOCard /></div>

      {/* Buttons */}
      <div className="done-btns" style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
        <button className="game-btn" onClick={onBrowseGames}
          style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '13px 24px', width: '160px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', letterSpacing: '0.05em', color: '#fff', textAlign: 'center', cursor: 'pointer' }}>
          BROWSE GAMES
        </button>
        <button className="game-btn-primary" onClick={onPlayAgain}
          style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '13px 24px', width: '160px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', letterSpacing: '0.05em', color: '#fff', textAlign: 'center', cursor: 'pointer', boxShadow: '0 8px 20px rgba(220,40,39,0.3)' }}>
          PLAY AGAIN
        </button>
      </div>
    </div>
  )
}

/* ─── Root ─── */
type Step = 'playerSetup' | 'roundLength' | 'livesSetup' | 'gameplay' | 'whoLaughed' | 'livesRemaining' | 'winner'

export default function LaughYouAreOutGame({ onClose }: { onClose: () => void }) {
  const [step,          setStep]          = useState<Step>('playerSetup')
  const [players,       setPlayers]       = useState<Player[]>([])
  const [roundSeconds,  setRoundSeconds]  = useState(30)
  const [maxLives,      setMaxLives]      = useState(3)
  const [livesMap,      setLivesMap]      = useState<Record<string, number>>({})
  const [roundNum,      setRoundNum]      = useState(0)
  const [challenges,    setChallenges]    = useState(() => shuffle(CHALLENGES))
  const [challengeIdx,  setChallengeIdx]  = useState(0)
  const [winner,        setWinner]        = useState<Player | null>(null)

  const currentChallenge = challenges[challengeIdx % challenges.length]

  const startGame = useCallback((p: Player[], lives: number) => {
    const map: Record<string, number> = {}
    p.forEach(pl => { map[pl.name] = lives })
    setLivesMap(map)
    setRoundNum(0)
    setChallenges(shuffle(CHALLENGES))
    setChallengeIdx(0)
    setStep('gameplay')
  }, [])

  const handleLaughed = useCallback((laughedKeys: string[]) => {
    // Deduct lives and show Lives Remaining before moving on
    setLivesMap(prev => {
      const next = { ...prev }
      laughedKeys.forEach(name => { if (next[name] > 0) next[name]-- })
      return next
    })
    setChallengeIdx(i => i + 1)
    setRoundNum(r => r + 1)
    setStep('livesRemaining')
  }, [])

  const handleLivesNext = useCallback(() => {
    // Check if game is over after seeing lives remaining
    const alive = players.filter(p => (livesMap[p.name] ?? maxLives) > 0)
    if (alive.length <= 1) {
      setWinner(alive[0] ?? null)
      setStep('winner')
    } else {
      setStep('gameplay')
    }
  }, [players, livesMap, maxLives])

  const handlePlayAgain = useCallback(() => {
    const map: Record<string, number> = {}
    players.forEach(pl => { map[pl.name] = maxLives })
    setLivesMap(map)
    setRoundNum(0)
    setChallenges(shuffle(CHALLENGES))
    setChallengeIdx(0)
    setWinner(null)
    setStep('gameplay')
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

      {step === 'gameplay' && (
        <GameplayScreen
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
          onNext={handleLaughed}
        />
      )}

      {step === 'livesRemaining' && (
        <LivesRemainingScreen
          players={players}
          livesMap={livesMap}
          maxLives={maxLives}
          onSkip={() => setStep('gameplay')}
          onNext={handleLivesNext}
        />
      )}

      {step === 'winner' && (
        <GameOverScreen
          winner={winner}
          roundsPlayed={roundNum}
          onPlayAgain={handlePlayAgain}
          onBrowseGames={onClose}
        />
      )}

      <GameFooter />
    </div>
  )
}
