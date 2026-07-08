import { useState, useRef, useCallback, useEffect, type CSSProperties } from 'react'

/* ─── Asset URLs (permanently hosted on Cloudinary) ─── */
const HEART_FILLED     = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/heart-filled.svg'
const SPICY_INTRO_BG   = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/spicy-card-bg.svg'
const SPICY_CARD_BG    = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/spicy-card-bg.svg'
const SOCIAL_TIKTOK    = '/icons/social-tiktok.svg'
const SOCIAL_INSTAGRAM = '/icons/social-instagram.svg'
const SOCIAL_WHATSAPP  = '/icons/social-whatsapp.svg'

/* Hand-authored (no hosting needed — can never 404) */
function ChiliGlyph({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={style}>
      <path d="M8 3.5c1.2-1 2.4-1.4 3.2-.6.6.6.4 1.6-.3 2.6 2.8-.2 5 1 5.9 3.2 1.2 2.9-.1 6.7-2.9 9.5-2.9 2.9-6.6 4-9.3 2.7A5.6 5.6 0 0 1 2 15.8c0-3.3 2-6.8 5-9.3.3-1.1.4-2.1 1-3z" fill="#E63946" />
      <path d="M8 3.5c1.2-1 2.4-1.4 3.2-.6.6.6.4 1.6-.3 2.6" stroke="#5B8C3E" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  )
}

type Player = { name: string; color: string }
const PLAYER_COLORS = ['#dc2827','#9b59b6','#27ae60','#e67e22','#3498db','#e91e63','#f39c12','#1abc9c']

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ─── Questions by spice level ─── */
const MILD_QUESTIONS = [
  "What's one thing someone can do that instantly makes them more attractive?",
  "What's the most meaningful conversation you've had this year?",
  "What topic could you talk about for hours without getting bored?",
  "What's something you find deeply attractive in a person?",
  "What makes you feel most like yourself?",
  "What's a memory that makes you smile every time you think about it?",
  "What does home feel like to you?",
  "What's a small act of kindness someone did for you that stayed with you?",
  "What's one thing you appreciate about the person next to you right now?",
  "What makes you feel most understood by someone?",
]

const MEDIUM_QUESTIONS = [
  "What's something you wish people understood about you without you having to explain?",
  "When did you last feel truly understood by someone?",
  "What's something you've been wanting to say but haven't found the right moment?",
  "What's a question you've always wanted to ask but been afraid to?",
  "What's one thing you're still learning about relationships?",
  "What's something you used to believe about love that you no longer believe?",
  "What makes you feel most vulnerable in a relationship?",
  "What's the best piece of advice you've ever received about love?",
  "What do you find yourself craving most in your relationships right now?",
  "What's a deal-breaker for you that you've never fully admitted?",
  ...MILD_QUESTIONS,
]

const HOT_QUESTIONS = [
  "What's one thing you'd do differently if you could start your last relationship over?",
  "What's your biggest fear about intimacy that you rarely share?",
  "Have you ever felt a connection with someone you shouldn't have? What happened?",
  "What's something you've always wanted to try in a relationship but haven't?",
  "What's the most honest thing you've ever said to a partner?",
  "What do you find yourself hiding in relationships to seem more appealing?",
  "What was the hardest thing you've had to forgive someone for?",
  "What's a boundary you've crossed that you still think about?",
  "When were you the most vulnerable with someone, and how did it go?",
  "What's one truth about yourself in relationships you'd tell a stranger but not a friend?",
  ...MEDIUM_QUESTIONS,
]

/* ─── Shared nav ─── */
function GameNav({ onBack }: { onBack: () => void }) {
  return (
    <nav style={{
      background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 60px', height: '80px', flexShrink: 0, position: 'relative', zIndex: 10,
    }}>
      <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '28px', color: '#fff', letterSpacing: '0.56px', lineHeight: 'normal', fontWeight: 400 }}>
        DECKED
      </span>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        {['Browse Games', 'How to Play', 'About'].map(label => (
          <button key={label}
            onClick={label === 'Browse Games' ? onBack : undefined}
            onMouseOver={e => { if (label === 'Browse Games') (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
            onMouseOut={e => { if (label === 'Browse Games') (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)' }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontFamily: "'Anton SC', sans-serif", fontSize: '16px', fontWeight: 400, cursor: label === 'Browse Games' ? 'pointer' : 'default', lineHeight: 'normal', padding: 0, transition: 'color 0.2s' }}
          >{label}</button>
        ))}
      </div>
    </nav>
  )
}

/* ─── Shared footer ─── */
function GameFooter() {
  return (
    <footer style={{ background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)', padding: '32px 60px', display: 'flex', flexDirection: 'column', gap: '40px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '420px' }}>
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '32px', color: '#fff', lineHeight: 'normal' }}>DECKED</span>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '14px', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
            Pick a deck, pass the phone, and let the chaos begin. 10+ party card games, no app, no login, no excuses.
          </p>
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

/* ─── Hearts row (age gate card top/bottom band) ─── */
function HeartsRow({ top }: { top: boolean }) {
  return (
    <div style={{
      position: 'absolute', [top ? 'top' : 'bottom']: top ? 0 : '-1px',
      left: 0, right: 0, height: '87px',
      background: '#dc2827', overflow: 'hidden',
    }}>
      {/* Stripes */}
      <div style={{ position: 'absolute', [top ? 'top' : 'bottom']: '62px', left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {top
          ? <><div style={{ height: '7px', background: '#ecc1c9', width: '100%' }} /><div style={{ height: '4px', background: '#ecc1c9', width: '100%' }} /></>
          : <><div style={{ height: '4px', background: '#ecc1c9', width: '100%' }} /><div style={{ height: '7px', background: '#ecc1c9', width: '100%' }} /></>
        }
      </div>
      {/* Hearts */}
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        top: top ? '15px' : '40px',
        display: 'flex', gap: '5px', alignItems: 'center', whiteSpace: 'nowrap',
      }}>
        {Array.from({ length: 11 }, (_, i) => (
          <img key={i} src={HEART_FILLED} alt=""
            style={{ width: '32px', height: '32px', flexShrink: 0, transform: i % 2 === 1 ? 'scaleY(-1)' : 'none' }}
          />
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SCREEN 1 — Age Gate
   ═══════════════════════════════════════════════════════ */
function AgeGate({ onBack, onConfirm }: { onBack: () => void; onConfirm: () => void }) {
  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      {/* Outer card with checkerboard border — floats up into view */}
      <div className="card-float-up" style={{
        width: '392px', height: '504px', borderRadius: '12px', overflow: 'hidden',
        position: 'relative', flexShrink: 0, zIndex: 2,
        boxShadow: '0 32px 80px rgba(183,0,18,0.4)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: '#df91b5' }} />
        <div style={{ position: 'absolute', left: '-33px', top: 0, width: '457px', height: '504px', overflow: 'hidden' }}>
          <img src={SPICY_INTRO_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{
          position: 'absolute', top: '30px', right: '24px', bottom: '28px', left: '24px',
          background: '#b70012', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px',
          padding: '28px 40px',
        }}>
          <div style={{ width: '107px', height: '106px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ transform: 'rotate(-6deg)' }}>
              <div style={{
                background: '#e62a24', border: '4px solid #000', borderRadius: '9999px',
                width: '97px', height: '96px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px',
              }}>
                <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '72px', color: '#fff', letterSpacing: '1.44px', lineHeight: '72px', display: 'block', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  18+
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', lineHeight: '45px', whiteSpace: 'nowrap' }}>
              MATURE CONTENT
            </h2>
            <div style={{ textAlign: 'center', color: '#fff', fontSize: '14px', fontFamily: "'Satoshi', sans-serif", fontWeight: 400, lineHeight: '20px', letterSpacing: '-0.2px' }}>
              <p style={{ margin: 0 }}>Spicy Starters includes</p>
              <p style={{ margin: 0 }}>mature content for ages 18+</p>
              <p style={{ margin: '8px 0 0' }}>Continue?</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '215px', marginTop: '4px' }}>
            <button className="game-btn" onClick={() => setTimeout(onBack, 100)} style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>
              No, go back
            </button>
            <button className="game-btn-primary" onClick={() => setTimeout(onConfirm, 100)} style={{ flex: 1, background: '#fff', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#b70012', textAlign: 'center' }}>
              YES, I'm 18+
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SCREEN 2 — How Spicy Do You Like It
   ═══════════════════════════════════════════════════════ */
type SpiceLevel = 'mild' | 'medium' | 'hot'

function ChiliIcon() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.1)', borderRadius: '16px',
      width: '32px', height: '32px', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      <div style={{ width: '32px', height: '32px', overflow: 'hidden', position: 'relative' }}>
        {/* inset-[15.37%_28.22%] = top/bottom: 15.37% = 4.9px, left/right: 28.22% = 9px */}
        <ChiliGlyph style={{ position: 'absolute', top: '15.37%', left: '28.22%', right: '28.22%', bottom: '15.37%', width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '100%' }} />
      </div>
    </div>
  )
}

function HowSpicy({ onSelect }: { onSelect: (level: SpiceLevel) => void }) {
  const [selected, setSelected] = useState<SpiceLevel | null>(null)

  const options: { level: SpiceLevel; label: string; count: number }[] = [
    { level: 'mild', label: 'MILD', count: 1 },
    { level: 'medium', label: 'MEDIUM', count: 2 },
    { level: 'hot', label: 'HOT', count: 3 },
  ]

  const handleSelect = (level: SpiceLevel) => {
    setSelected(level)
    setTimeout(() => onSelect(level), 200)
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '600px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '50px', alignItems: 'center' }}>

        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', lineHeight: '45px' }}>
          how spicy do you like it
        </h2>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {options.map(({ level, label, count }) => {
            const isSelected = selected === level
            return (
              <button
                key={level}
                onClick={() => handleSelect(level)}
                className={`spicy-option stagger-item${isSelected ? ' selected' : ''}`}
                style={{
                  background: isSelected ? '#1e1e22' : '#111113',
                  border: '1px solid transparent',
                  borderRadius: '12px', height: '56px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px', cursor: 'pointer', width: '100%',
                }}
              >
                {Array.from({ length: count }, (_, i) => <ChiliIcon key={i} />)}
                <span style={{
                  fontFamily: "'Anton SC', sans-serif", fontSize: '18px',
                  color: isSelected ? '#fff' : 'rgba(255,255,255,0.5)',
                  lineHeight: 'normal', transition: 'color 0.15s',
                }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SCREEN 3 — Who's Playing?
   ═══════════════════════════════════════════════════════ */
function PlayerSetup({ players, setPlayers, onBack, onNext, onSkip }: {
  players: Player[]
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
  onBack: () => void
  onNext: () => void
  onSkip?: () => void
}) {
  const [input, setInput] = useState('')
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const editRef = useRef<HTMLInputElement>(null)

  const nextColor = PLAYER_COLORS[players.length % PLAYER_COLORS.length]
  const hasInput = input.trim().length > 0

  const addPlayer = () => {
    const name = input.trim()
    if (!name) return
    setPlayers(prev => [...prev, { name, color: PLAYER_COLORS[prev.length % PLAYER_COLORS.length] }])
    setInput('')
    inputRef.current?.focus()
  }

  const commitEdit = () => {
    const name = editValue.trim()
    if (name && editingIdx !== null)
      setPlayers(prev => prev.map((p, i) => i === editingIdx ? { ...p, name } : p))
    setEditingIdx(null)
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '600px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '50px', alignItems: 'center' }}>

        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', lineHeight: '45px' }}>
          Who's playing?
        </h2>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {players.map((p, i) => (
            <div key={i} className="stagger-item" style={{ background: '#111113', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: p.color, flexShrink: 0, boxShadow: '0 0 0 2.5px #ffffff' }} />
                {editingIdx === i ? (
                  <input ref={editRef} value={editValue} onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingIdx(null) }}
                    onBlur={commitEdit}
                    style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', flex: 1 }}
                    autoFocus
                  />
                ) : (
                  <span onClick={() => { setEditingIdx(i); setEditValue(p.name); setTimeout(() => editRef.current?.select(), 0) }}
                    style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', cursor: 'text', flex: 1 }}>
                    {p.name}
                  </span>
                )}
              </div>
              <button onClick={() => setPlayers(prev => prev.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 4px' }} aria-label="Remove">
                ×
              </button>
            </div>
          ))}

          <div style={{ background: '#111113', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'text' }}
            onClick={() => inputRef.current?.focus()}>
            <button onClick={e => { e.stopPropagation(); addPlayer() }}
              style={{ background: hasInput ? nextColor : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '16px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: hasInput ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: hasInput ? '16px' : '20px', lineHeight: 1, transition: 'background 0.15s', boxShadow: hasInput ? '0 0 0 2.5px #ffffff' : 'none' }}>
              {hasInput ? '✓' : '+'}
            </button>
            <input ref={inputRef} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addPlayer() }}
              placeholder="Add a player..."
              style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', flex: 1 }}
            />
            {hasInput && (
              <button onClick={e => { e.stopPropagation(); addPlayer() }}
                style={{ background: 'none', border: 'none', fontFamily: "'Staatliches', sans-serif", fontSize: '14px', color: nextColor, cursor: 'pointer', whiteSpace: 'nowrap', padding: 0, letterSpacing: '0.05em' }}>
                TAP TO ADD →
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '402px' }}>
          <button className="game-btn" onClick={onSkip ?? onBack} style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>
            SKIP FOR NOW
          </button>
          <button className="game-btn-primary" onClick={onNext} style={{ flex: 1, background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center' }}>
            NEXT
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SCREEN 4 — Deck Size
   ═══════════════════════════════════════════════════════ */
function DeckSize({ onBack, onStart }: { onBack: () => void; onStart: (n: number) => void }) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const parsed = parseInt(value, 10)
  const valid = !isNaN(parsed) && parsed > 0 && parsed <= 200

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '600px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '50px', alignItems: 'center' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%' }}>
          <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', lineHeight: '45px' }}>
            DECK SIZE
          </h2>
          <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0, textAlign: 'center' }}>
            How many cards do you want to play?
          </p>

          <div style={{ background: '#111113', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'text', width: '100%', marginTop: '16px', boxSizing: 'border-box' }}
            onClick={() => inputRef.current?.focus()}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px', lineHeight: 1 }}>#</span>
            </div>
            <input ref={inputRef} type="number" min={1} max={200} value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Enter number"
              style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', flex: 1 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '292px' }}>
          <button className="game-btn" onClick={() => setTimeout(onBack, 100)} style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>
            GO BACK
          </button>
          <button className={valid ? 'game-btn-primary' : ''} onClick={() => valid && setTimeout(() => onStart(parsed), 100)}
            style={{ flex: 1, background: valid ? '#dc2827' : '#626262', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: valid ? '#fff' : '#a0a0a0', cursor: valid ? 'pointer' : 'not-allowed', textAlign: 'center', transition: 'background 0.2s' }}>
            START THE GAME
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SCREEN 5 — Get Ready
   ═══════════════════════════════════════════════════════ */
function GetReady({ player, onReady }: { player: Player | null; onReady: () => void }) {
  const stableOnReady = useCallback(onReady, [])

  useEffect(() => {
    const id = setTimeout(stableOnReady, 2400)
    return () => clearTimeout(id)
  }, [stableOnReady])

  return (
    <div className="screen-enter" onClick={onReady} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', lineHeight: '45px', textTransform: 'uppercase' }}>
          Get ready...
        </h2>
        {player && (
          <div className="stagger-item" style={{ background: '#18181b', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', padding: '12px', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: player.color, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', lineHeight: 'normal', whiteSpace: 'nowrap' }}>
              {player.name.toUpperCase()}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
          <span className="get-ready-dot" />
          <span className="get-ready-dot" />
          <span className="get-ready-dot" />
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SCREEN 6 — Intro Card (real 3D flip)
   ═══════════════════════════════════════════════════════ */
function IntroCard({ onTap, firstQuestion }: { onTap: () => void; firstQuestion: string }) {
  const [flipped, setFlipped] = useState(false)

  const handleTap = () => {
    if (flipped) return
    setFlipped(true)
    setTimeout(onTap, 800) // navigate after flip completes (matches 0.75s CSS)
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px', position: 'relative', padding: '40px' }}>
      {/* Hover wrapper provides lift + shadow; flip container provides perspective */}
      <div
        onClick={handleTap}
        className="intro-card-hover-wrap"
        style={{ width: '365px', height: '457px', flexShrink: 0, zIndex: 2, position: 'relative' }}
      >
        <div className="spicy-flip-container" style={{ width: '365px', height: '457px' }}>
        <div className={`spicy-flip-inner${flipped ? ' flipped' : ''}`} style={{ width: '365px', height: '457px' }}>

          {/* ── FRONT: spicy starters cover ── */}
          <div className="spicy-flip-front">
            <div style={{ position: 'absolute', inset: 0, background: '#df91b5' }} />
            <div style={{ position: 'absolute', left: '-92px', top: 0, width: '457px', height: '457px', overflow: 'hidden' }}>
              <img src={SPICY_INTRO_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ position: 'absolute', top: '30px', right: '30px', bottom: '28px', left: '24px', background: '#b70012', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ fontFamily: "'Stick', sans-serif", fontSize: '45px', color: '#df91b5', textAlign: 'center', lineHeight: 'normal', margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 138px)', width: '280px' }}>
                spicy{'\n'}starters
              </p>
              <p style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 300, fontSize: '14px', color: '#df91b5', textAlign: 'center', lineHeight: 'normal', margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% + 135px)', width: '148px' }}>
                CONVERSATION CARDS TO SHARE
              </p>
            </div>
          </div>

          {/* ── BACK: first question card ── */}
          <div className="spicy-flip-back">
            <div style={{ position: 'absolute', inset: 0, background: '#df91b5' }} />
            <div style={{ position: 'absolute', left: '-92px', top: 0, width: '457px', height: '457px', overflow: 'hidden' }}>
              <img src={SPICY_CARD_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ position: 'absolute', top: '30px', right: '30px', bottom: '28px', left: '24px', background: '#df91b5', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '29.7px', color: '#ab1229', textAlign: 'center', lineHeight: 'normal', margin: 0, padding: '0 16px' }}>
                {firstQuestion.toUpperCase()}
              </p>
            </div>
          </div>

        </div>
        </div> {/* spicy-flip-container */}
      </div> {/* intro-card-hover-wrap */}

      <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '16px', color: flipped ? 'transparent' : 'rgba(255,255,255,0.5)', margin: 0, position: 'relative', zIndex: 2, transition: 'color 0.3s' }}>
        Tap the card to flip it.
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SCREEN 7 — Game Cards
   ═══════════════════════════════════════════════════════ */
type FlipPhase = 'idle' | 'out' | 'in'

function SpicyCard({ question, flipPhase }: { question: string; flipPhase: FlipPhase }) {
  const cls = flipPhase === 'out' ? 'game-card-flip-out'
            : flipPhase === 'in'  ? 'game-card-flip-in'
            : ''
  return (
    <div className={cls} style={{
      width: '365px', height: '457px', borderRadius: '12px', overflow: 'hidden',
      position: 'relative', flexShrink: 0, zIndex: 2,
      boxShadow: '0 32px 80px rgba(171,18,41,0.35)',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: '#df91b5' }} />
      <div style={{ position: 'absolute', left: '-92px', top: 0, width: '457px', height: '457px', overflow: 'hidden' }}>
        <img src={SPICY_CARD_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ position: 'absolute', top: '30px', right: '30px', bottom: '28px', left: '24px', background: '#df91b5', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '29.7px', color: '#ab1229', textAlign: 'center', lineHeight: 'normal', margin: 0, padding: '0 16px' }}>
          {question.toUpperCase()}
        </p>
      </div>
    </div>
  )
}

function GameScreen({ questions, players, totalCards, onClose }: {
  questions: string[]
  players: Player[]
  totalCards: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(0)
  const [playerIdx, setPlayerIdx] = useState(0)
  const [flipPhase, setFlipPhase] = useState<FlipPhase>('idle')
  const [displayIdx, setDisplayIdx] = useState(0)  // what's actually shown
  const [skipCount, setSkipCount] = useState(0)

  const flippingRef = useRef(false)
  const playersRef  = useRef(players)
  useEffect(() => { playersRef.current = players }, [players])

  const advance = useCallback((skipped = false) => {
    if (flippingRef.current) return
    if (skipped) setSkipCount(c => c + 1)
    flippingRef.current = true

    // Phase 1 — flip out
    setFlipPhase('out')

    setTimeout(() => {
      // Mid-flip: update content (card is edge-on, invisible)
      setIdx(i => i + 1)
      setDisplayIdx(i => i + 1)
      setPlayerIdx(i => {
        const len = playersRef.current.length
        return len > 0 ? (i + 1) % len : 0
      })

      // Phase 2 — flip in
      setFlipPhase('in')

      setTimeout(() => {
        setFlipPhase('idle')
        flippingRef.current = false
      }, 300)
    }, 180)
  }, [])

  const isDone = totalCards > 0 && idx >= totalCards
  const currentPlayer = players.length > 0 ? players[playerIdx] : null
  const question = questions[displayIdx % questions.length]

  if (isDone) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '40px' }}>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
          <h2 className="done-heading" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '48px', color: '#fff', margin: 0, textTransform: 'uppercase' }}>
            YOU'RE DECKED
          </h2>
          <p className="done-subtitle" style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            You played all {totalCards} spicy starters cards
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 2, background: '#18181b', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '20px 32px', gap: 0 }}>
          {[
            { count: totalCards,      label: 'CARDS',   cls: 'done-stat-1' },
            { count: skipCount,       label: 'SKIPPED', cls: 'done-stat-2' },
            { count: players.length,  label: 'PLAYERS', cls: 'done-stat-3' },
          ].map((stat, i) => (
            <div key={i} className={stat.cls} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)', margin: '0 28px' }} />}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '40px', color: '#fff', lineHeight: 1 }}>{stat.count}</span>
                <span style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="done-card" style={{ position: 'relative', zIndex: 2, width: '199px', height: '200px', borderRadius: '9px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(183,0,18,0.4)', flexShrink: 0 }}>
          <div style={{ position: 'absolute', inset: 0, background: '#df91b5' }} />
          <div style={{ position: 'absolute', left: '-40px', top: 0, width: '260px', height: '200px', overflow: 'hidden' }}>
            <img src={SPICY_INTRO_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ position: 'absolute', top: '13px', right: '13px', bottom: '12px', left: '11px', background: '#b70012', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: "'Stick', sans-serif", fontSize: '19px', color: '#df91b5', textAlign: 'center', lineHeight: 'normal', margin: 0 }}>spicy{'\n'}starters</p>
            <p style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 300, fontSize: '6px', color: '#df91b5', textAlign: 'center', lineHeight: 'normal', margin: '8px 0 0' }}>CONVERSATION CARDS TO SHARE</p>
          </div>
        </div>

        <div className="done-btns" style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '8px' }}>
          <button className="game-btn" onClick={onClose} style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>
            BROWSE GAMES
          </button>
          <button className="game-btn-primary" onClick={() => { setIdx(0); setDisplayIdx(0); setPlayerIdx(0); setSkipCount(0); setFlipPhase('idle') }} style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>
            PLAY AGAIN
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', position: 'relative', padding: '40px 40px 60px' }}>

      {currentPlayer && (
        <div key={currentPlayer.name} className="player-chip-enter" style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: currentPlayer.color, flexShrink: 0, border: '2px solid rgba(255,255,255,0.25)', boxShadow: `0 0 0 3px ${currentPlayer.color}33` }} />
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em' }}>
            {currentPlayer.name.toUpperCase()}'S TURN
          </span>
        </div>
      )}

      {/* Game card with 3D flip */}
      <SpicyCard question={question} flipPhase={flipPhase} />

      {totalCards > 0 && (
        <p key={`counter-${idx}`} className="counter-in" style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', margin: 0, zIndex: 2 }}>
          CARD {idx + 1} OF {totalCards}
        </p>
      )}

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <button className="game-btn" onClick={() => advance(true)} style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', width: '160px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)', letterSpacing: '0.05em' }}>
          SKIP FOR NOW
        </button>
        <button className="game-btn-primary" onClick={() => advance(false)} style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 18px', width: '160px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', letterSpacing: '0.05em' }}>
          NEXT
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   ROOT COMPONENT
   ═══════════════════════════════════════════════════════ */
type Step = 'ageGate' | 'howSpicy' | 'playerSetup' | 'deckSize' | 'getReady' | 'intro' | 'game'

export default function SpicyStartersGame({ onClose }: { onClose: () => void }) {
  const [step, setStep]           = useState<Step>('ageGate')
  const [spiceLevel, setSpiceLevel] = useState<SpiceLevel>('medium')
  const [players, setPlayers]     = useState<Player[]>([])
  const [totalCards, setTotalCards] = useState(0)
  const [cardIndex, setCardIndex] = useState(0)
  const [playerIndex, setPlayerIndex] = useState(0)
  const [questions, setQuestions] = useState<string[]>(() => shuffle(MEDIUM_QUESTIONS))

  const currentPlayer = players.length > 0 ? players[playerIndex] : null

  const goToGame = useCallback(() => setStep('game'), [])

  const handleSelectSpice = (level: SpiceLevel) => {
    setSpiceLevel(level)
    const bank = level === 'mild' ? MILD_QUESTIONS : level === 'hot' ? HOT_QUESTIONS : MEDIUM_QUESTIONS
    setQuestions(shuffle(bank))
    setStep('playerSetup')
  }

  const handleStart = (n: number) => {
    setTotalCards(n)
    setCardIndex(0)
    setPlayerIndex(0)
    setPlayers(prev => shuffle([...prev])) // shuffle player order each game
    setStep('getReady')
  }

  const handleGetReadyDone = useCallback(() => {
    setStep('intro')
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'transparent', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <GameNav onBack={onClose} />

      {step === 'ageGate' && (
        <AgeGate onBack={onClose} onConfirm={() => setStep('howSpicy')} />
      )}

      {step === 'howSpicy' && (
        <HowSpicy onSelect={handleSelectSpice} />
      )}

      {step === 'playerSetup' && (
        <PlayerSetup
          players={players} setPlayers={setPlayers}
          onBack={() => setStep('howSpicy')}
          onNext={() => setStep('deckSize')}
          onSkip={() => { setPlayers([]); setStep('deckSize') }}
        />
      )}

      {step === 'deckSize' && (
        <DeckSize onBack={() => setStep('playerSetup')} onStart={handleStart} />
      )}

      {step === 'getReady' && (
        <GetReady player={currentPlayer} onReady={handleGetReadyDone} />
      )}

      {step === 'intro' && (
        <IntroCard onTap={goToGame} firstQuestion={questions[0] ?? ''} />
      )}

      {step === 'game' && (
        <GameScreen
          questions={questions}
          players={players}
          totalCards={totalCards}
          onClose={onClose}
        />
      )}

      <GameFooter />
    </div>
  )
}
