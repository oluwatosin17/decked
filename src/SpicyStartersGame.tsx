import { useState, useRef, useCallback, useEffect, type CSSProperties } from 'react'
import { useScaledCard } from './hooks/useCardScale'
import { GameNav, GameFooter } from './components/GameShell'

/* ─── Asset URLs ─── */
const SPICY_INTRO_BG   = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/spicy-talks.svg'
const SPICY_CARD_BG    = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/spicy-talks.svg'
const SPICY_FRONT_SVG  = '/icons/spicy-front.svg'
const SPICY_BACK_SVG   = '/icons/spicy-back.svg'
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
  "What's one thing someone can do that instantly makes them more attractive to you?",
  "When was the last time someone gave you butterflies — and what did they do?",
  "What's a physical feature you always notice first when you're attracted to someone?",
  "Do you believe in love at first sight, or does attraction always build over time?",
  "What's the flirtiest thing someone has ever said to you?",
  "What's a small gesture that makes you feel desired?",
  "If you could describe your ideal kiss in three words, what would they be?",
  "What's your love language, and does your partner know it?",
  "What song always puts you in a romantic mood?",
  "What type of touch from your partner makes you melt?",
  "What's the most attractive confidence move someone has pulled on you?",
  "Do you prefer being chased or doing the chasing in the early stages?",
  "What's a compliment that would make you blush no matter who said it?",
  "What's the best first date you've ever been on, and what made it electric?",
  "If your partner looked at you a certain way across the room, what look would stop you in your tracks?",
  "What's a romantic cliche you secretly love?",
  "Do you think tension or comfort is more important for chemistry?",
  "What does someone's voice sound like when it's attractive to you?",
  "What's the most charming way someone has ever asked for your number?",
  "If you could set the scene for a perfect flirty evening, what would it look like?",
]

const MEDIUM_QUESTIONS = [
  "What's something you've always wanted to hear from a partner but never have?",
  "What's the most vulnerable thing you've ever admitted during pillow talk?",
  "Have you ever stayed in a relationship because the physical chemistry was too good to leave?",
  "What's a desire you've only recently discovered about yourself?",
  "What's the most daring thing you've done to impress someone you were attracted to?",
  "Is there something your partner does in the bedroom that you wish they did more often?",
  "What's a past experience that completely changed how you think about intimacy?",
  "What boundary in a relationship took you the longest to learn to set?",
  "Have you ever been so attracted to someone it scared you? What happened?",
  "What's a confession about your romantic past that might surprise your partner?",
  "What's the most intense physical chemistry you've ever felt with someone?",
  "Have you ever done something in a relationship that you'd never admit to your friends?",
  "What's a romantic or intimate experience you wish you could have again?",
  "What's something about your desires that you think your partner still doesn't fully understand?",
  "When was the last time you felt truly wanted — not just loved, but wanted?",
  "What's the biggest sacrifice you've made for physical or emotional intimacy?",
  "Have you ever had a moment where attraction hit you completely out of nowhere?",
  "What's a conversation about intimacy you've been avoiding with your partner?",
  "What's the most honest thing you've ever said to a partner about what you need?",
  "If you could ask your partner one question about your intimate life and get a completely honest answer, what would it be?",
]

const HOT_QUESTIONS = [
  "What's a fantasy you've replayed in your mind but never told anyone about?",
  "If your partner could read your deepest desires, what would surprise them most?",
  "What's the most intense romantic experience you've ever had?",
  "Is there something you've always wanted to try intimately but felt too nervous to suggest?",
  "What's a secret preference in the bedroom that you've never voiced?",
  "Have you ever been so consumed by desire for someone that you did something completely out of character?",
  "What's the most vulnerable you've ever been during an intimate moment?",
  "If you had zero inhibitions for one night, what would you want to do with your partner?",
  "What's a part of your body you wish your partner paid more attention to?",
  "What's the most honest thing you can say about what truly turns you on?",
  "Have you ever fantasized about someone while being with someone else?",
  "What's a romantic or intimate scenario that lives rent-free in your head?",
  "If your partner asked you to describe exactly how you want to be touched, what would you say?",
  "What's something you've pretended to enjoy intimately that you actually didn't?",
  "What's the riskiest place you've ever wanted to be intimate with someone?",
  "What would your partner be shocked to learn about your private thoughts?",
  "Have you ever felt more emotionally naked than physically naked with someone? What happened?",
  "What's a desire you've outgrown, and what replaced it?",
  "If you could design the perfect intimate evening from start to finish, what would every detail look like?",
  "What's one thing you wish you had the courage to ask for in your relationship right now?",
]


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
                <div className="avatar-circle" style={{ width: '32px', height: '32px', background: p.color, boxShadow: '0 0 0 2.5px #ffffff' }} />
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
              style={{ background: hasInput ? nextColor : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', maxWidth: '32px', maxHeight: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: hasInput ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: hasInput ? '16px' : '20px', lineHeight: 1, transition: 'background 0.15s', boxShadow: hasInput ? '0 0 0 2.5px #ffffff' : 'none' }}>
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
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
  const { wrapperStyle, cardStyle } = useScaledCard(365, 457)

  const handleTap = () => {
    if (flipped) return
    setFlipped(true)
    setTimeout(onTap, 800) // navigate after flip completes (matches 0.75s CSS)
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px', position: 'relative', padding: '40px' }}>
      {/* Hover wrapper provides lift + shadow; flip container provides perspective */}
      <div style={wrapperStyle}>
      <div
        onClick={handleTap}
        className="intro-card-hover-wrap game-card"
        style={{ ...cardStyle, flexShrink: 0, zIndex: 2, position: 'relative' }}
      >
        <div className="spicy-flip-container" style={{ width: '365px', height: '457px' }}>
        <div className={`spicy-flip-inner${flipped ? ' flipped' : ''}`} style={{ width: '365px', height: '457px' }}>

          {/* ── FRONT: spicy starters cover (SVG) ── */}
          <div className="spicy-flip-front">
            <img src={SPICY_FRONT_SVG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* ── BACK: first question card (SVG bg + text overlay) ── */}
          <div className="spicy-flip-back">
            <img src={SPICY_BACK_SVG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
              <p style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '29.7px', color: '#ab1229', textAlign: 'center', lineHeight: 'normal', margin: 0, padding: '0 16px' }}>
                {firstQuestion.toUpperCase()}
              </p>
            </div>
          </div>

        </div>
        </div> {/* spicy-flip-container */}
      </div> {/* intro-card-hover-wrap */}
      </div> {/* scaled wrapper */}

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
  const { wrapperStyle, cardStyle } = useScaledCard(365, 457)
  const cls = flipPhase === 'out' ? 'game-card-flip-out'
            : flipPhase === 'in'  ? 'game-card-flip-in'
            : ''
  return (
    <div style={wrapperStyle}>
    <div className={`${cls} game-card`} style={{
      ...cardStyle, borderRadius: '12px', overflow: 'hidden',
      position: 'relative', flexShrink: 0, zIndex: 2,
      boxShadow: '0 32px 80px rgba(171,18,41,0.35)',
    }}>
      <img src={SPICY_BACK_SVG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
        <p style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '29.7px', color: '#ab1229', textAlign: 'center', lineHeight: 'normal', margin: 0, padding: '0 16px' }}>
          {question.toUpperCase()}
        </p>
      </div>
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
    <div className="game-fullscreen">
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
