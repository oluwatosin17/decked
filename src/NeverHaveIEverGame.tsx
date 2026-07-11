import { useState, useRef, useEffect, useCallback } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import { useScaledCard } from './hooks/useCardScale'
import SelectGameMode, { NHIE_MODES } from './SelectGameMode'
import { haptic } from './haptics'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ─── Prompts ─── */
const ALL_PROMPTS = [
  "Text-stalked an ex or someone I used to talk to from a friend's phone.",
  "Pretended to be sick to get out of plans I actually agreed to.",
  "Googled myself and spent more than 10 minutes looking at the results.",
  "Said 'I'm on my way' when I hadn't even left the house yet.",
  "Liked someone's photo from years ago while deep-diving their profile.",
  "Laughed at a joke I didn't understand just to fit in.",
  "Eaten food I dropped on the floor after more than 5 seconds.",
  "Cried watching a commercial or a show I claimed to not care about.",
  "Sent a screenshot of a conversation to the exact person in the screenshot.",
  "Blocked someone on social media and then unblocked them to check their profile.",
  "Started a diet and quit it by noon on the first day.",
  "Talked badly about someone and then been totally nice to their face.",
  "Faked knowing a song by mumbling through the parts I didn't know.",
  "Binge-watched an entire show in one day and lied about it.",
  "Practiced what I'd say in an argument before having it.",
  "Eaten an entire meal standing over the sink or straight from the pot.",
  "Used 'seen it!' as an excuse not to go to something I didn't want to attend.",
  "Taken a selfie and deleted it because I didn't look how I wanted to.",
  "Eavesdropped on a conversation and pretended I wasn't listening.",
  "Bought something, kept the tags on, wore it, and returned it.",
  "Called in sick when I was completely fine and used the day for myself.",
  "Laughed at something at the worst possible moment and couldn't stop.",
  "Replied 'lol' to a voice note I didn't listen to.",
  "Blamed my bad mood on being tired when it was actually something else entirely.",
  "Rehearsed a story in my head before telling it out loud.",
  "Said 'no more drinking' and then accepted a drink 20 minutes later.",
  "Checked someone's location and then acted like I didn't know where they were.",
  "Pretended my phone died to avoid a conversation.",
  "Made up an excuse so believable I almost believed it myself.",
  "Watched a video on someone else's phone without saying anything.",
]

const PURPLE = '#bf5af2'

/* ─── Shared Nav ─── */
function GameNav({ onBack }: { onBack: () => void }) {
  return (
    <nav style={{ background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 60px', height: '80px', flexShrink: 0, zIndex: 10, position: 'relative' }}>
      <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '28px', color: '#fff', letterSpacing: '0.56px', fontWeight: 400 }}>DECKED</span>
      <div style={{ display: 'flex', gap: '24px' }}>
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
const SOCIAL_TIKTOK    = '/icons/social-tiktok.svg'
const SOCIAL_INSTAGRAM = '/icons/social-instagram.svg'
const SOCIAL_WHATSAPP  = '/icons/social-whatsapp.svg'

function GameFooter() {
  return (
    <footer style={{ background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', padding: '32px 60px', display: 'flex', flexDirection: 'column', gap: '40px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '420px' }}>
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '32px', color: '#fff' }}>DECKED</span>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>Pick a deck, pass the phone, and let the chaos begin. 10+ party card games, no app, no login, no excuses.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[SOCIAL_TIKTOK, SOCIAL_INSTAGRAM, SOCIAL_WHATSAPP].map((src, i) => (
            <img key={i} src={src} alt="" style={{ width: '20px', height: '20px', borderRadius: '8px', objectFit: 'contain' }} />
          ))}
        </div>
      </div>
      <div style={{ height: '1px', background: '#212326' }} />
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

/* ─── NHIE Card ─── */
function NHIECard({ flipped, prompt, onFlip }: { flipped: boolean; prompt: string; onFlip: () => void }) {
  const W = 320, H = 480
  const { wrapperStyle, cardStyle } = useScaledCard(W, H)

  return (
    <div style={wrapperStyle}>
    <div
      className="game-card"
      onClick={!flipped ? () => { haptic('medium'); onFlip() } : undefined}
      style={{
        ...cardStyle, perspective: '1000px',
        cursor: flipped ? 'default' : 'pointer', flexShrink: 0,
        transition: 'transform 0.22s var(--ease-out)',
      }}
      onMouseEnter={e => { if (!flipped) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
      onMouseDown={e => { if (!flipped) (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.97)' }}
      onMouseUp={e => { if (!flipped) (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)' }}
    >
      <div className={!flipped ? 'lyao-float' : ''} style={{ width: '100%', height: '100%' }}>
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
        }}>

          {/* ── Front: purple card + white speech bubble ── */}
          <div style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            background: PURPLE, borderRadius: '16px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Speech bubble — larger, fills more of the card */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* White box */}
              <div style={{
                background: '#fff', borderRadius: '14px',
                width: `${W - 52}px`, height: `${Math.round(H * 0.6)}px`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <p style={{
                  fontFamily: "'Single Day', cursive", fontSize: `${W * 0.175}px`, color: PURPLE,
                  textAlign: 'center', lineHeight: 1.12, margin: 0, padding: '8px 16px',
                }}>
                  NEVER<br />HAVE I<br />EVER
                </p>
              </div>
              {/* Triangle pointer downward */}
              <div style={{
                width: 0, height: 0,
                borderLeft: '22px solid transparent',
                borderRight: '22px solid transparent',
                borderTop: '30px solid #fff',
                marginTop: '-1px',
              }} />
            </div>

            {/* Bottom label */}
            <p style={{
              position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
              fontFamily: "'Anton SC', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.12em', whiteSpace: 'nowrap', margin: 0,
            }}>
              GAME OF POOR DECISIONS
            </p>
          </div>

          {/* ── Back: white card with prompt ── */}
          <div style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: '#fff', borderRadius: '16px',
            border: `3px solid ${PURPLE}`,
            boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column', padding: '18px',
          }}>
            {/* Mini bubble badge */}
            <div style={{ alignSelf: 'flex-start', position: 'relative', marginBottom: '24px' }}>
              <div style={{ background: PURPLE, borderRadius: '8px', padding: '8px 10px', display: 'inline-block' }}>
                <p style={{ fontFamily: "'Single Day', cursive", fontSize: '11px', color: '#fff', textAlign: 'center', lineHeight: 1.2, margin: 0 }}>
                  NEVER<br />HAVE I<br />EVER
                </p>
              </div>
              <div style={{ position: 'absolute', bottom: '-10px', left: '14px', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: `11px solid ${PURPLE}` }} />
            </div>

            {/* Prompt text */}
            <p style={{
              fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
              fontSize: '21px', color: '#111', lineHeight: 1.38, margin: 0,
              textTransform: 'uppercase',
            }}>
              {prompt}
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

/* ─── 1. Deck Size ─── */
function DeckSizeScreen({ onBack, onNext }: { onBack: () => void; onNext: (n: number) => void }) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const parsed = parseInt(value, 10)
  const valid = !isNaN(parsed) && parsed >= 1 && parsed <= 100

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '40px', color: '#fff', margin: 0, letterSpacing: '0.04em' }}>DECK SIZE</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>How many cards do you want to play?</p>
        </div>

        <div
          style={{ background: '#111113', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', width: '100%', boxSizing: 'border-box', cursor: 'text' }}
          onClick={() => inputRef.current?.focus()}
        >
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: '18px', fontWeight: 300, lineHeight: 1 }}>+</span>
          </div>
          <input
            ref={inputRef} type="number" min={1} max={100}
            value={value} onChange={e => setValue(e.target.value)}
            placeholder="ENTER NUMBER"
            style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', flex: 1, letterSpacing: '0.06em' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button onClick={() => { haptic('light'); onBack() }} className="game-btn"
            style={{ width: '142px', height: '44px', boxSizing: 'border-box', border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', boxShadow: '0 10px 24px rgba(0,0,0,0.25)', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer' }}>
            GO BACK
          </button>
          <button onClick={() => { if (valid) { haptic('medium'); onNext(parsed) } }} className={valid ? 'game-btn-primary' : ''}
            style={{ width: '142px', height: '44px', boxSizing: 'border-box', background: valid ? '#dc2827' : '#626262', border: 'none', borderRadius: '999px', padding: '12px 18px', boxShadow: valid ? '0 10px 12px rgba(220,40,39,0.25)' : 'none', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: valid ? '#fff' : '#a0a0a0', cursor: valid ? 'pointer' : 'not-allowed', letterSpacing: '0.05em', transition: 'background 0.2s, color 0.2s' }}>
            START THE GAME
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── 2. Get Ready ─── */
function GetReadyScreen({ players, onDone }: { players: Player[]; onDone: () => void }) {
  const [playerIdx, setPlayerIdx] = useState(0)

  useEffect(() => {
    const isLast = playerIdx >= Math.max(players.length - 1, 0)
    const delay = isLast ? 1200 : 1400
    const t = setTimeout(() => {
      if (isLast) {
        onDone()
      } else {
        setPlayerIdx(i => i + 1)
      }
    }, delay)
    return () => clearTimeout(t)
  }, [playerIdx, players.length, onDone])

  const current = players.length > 0 ? players[playerIdx] : null

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '40px', position: 'relative', zIndex: 2 }}>
      <h2 style={{
        fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '40px', color: '#fff',
        margin: 0, letterSpacing: '0.04em',
      }}>
        GET READY...
      </h2>

      {current && (
        /* key forces remount/re-animate on each new player — only one ever visible */
        <div key={playerIdx} className="screen-enter-fast" style={{
          background: '#111113', borderRadius: '999px',
          padding: '10px 20px 10px 12px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: current.color, flexShrink: 0, boxShadow: '0 0 0 2.5px #fff' }} />
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', letterSpacing: '0.04em' }}>
            {current.name}
          </span>
        </div>
      )}

      {players.length === 0 && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="get-ready-dot" />
          <span className="get-ready-dot" />
          <span className="get-ready-dot" />
        </div>
      )}
    </div>
  )
}

/* ─── 3. Game (card flip) ─── */
function GameScreen({
  prompts, idx, onSkip, onReveal,
}: {
  prompts: string[]
  idx: number
  onSkip: () => void
  onReveal: () => void
}) {
  const [flipped, setFlipped] = useState(false)
  const total = prompts.length

  // Reset flip when card changes
  useEffect(() => { setFlipped(false) }, [idx])

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '24px 40px', position: 'relative', zIndex: 2 }}>
      {/* Counter */}
      <p className="counter-in" key={`counter-${idx}`} style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', margin: 0 }}>
        {String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </p>

      <div className={!flipped ? 'nhie-card-enter' : ''} key={`card-${idx}`}>
        <NHIECard
          key={idx}
          flipped={flipped}
          prompt={prompts[idx]}
          onFlip={() => setFlipped(true)}
        />
      </div>

      {!flipped ? (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
          Tap the card to flip it.
        </p>
      ) : (
        <div className="screen-enter-fast" style={{ display: 'flex', gap: '8px' }}>
          <button className="game-btn" onClick={() => { haptic('light'); onSkip() }}
            style={{ width: '160px', height: '44px', boxSizing: 'border-box', border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', boxShadow: '0 10px 24px rgba(0,0,0,0.25)', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer' }}>
            SKIP FOR NOW
          </button>
          <button className="game-btn-primary" onClick={() => { haptic('light'); onReveal() }}
            style={{ width: '160px', height: '44px', boxSizing: 'border-box', background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 18px', boxShadow: '0 10px 12px rgba(220,40,39,0.25)', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer' }}>
            NEXT
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── 4. I've Done It ─── */
function IveDoneItScreen({
  players, onNext,
}: {
  players: Player[]
  onNext: (didIt: string[]) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (name: string) => {
    haptic('light')
    setSelected(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>
          I'VE DONE IT
        </h2>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {players.map((p, i) => {
            const isSel = selected.has(p.name)
            return (
              <div key={p.name} className="nhie-row-enter nhie-row" onClick={() => toggle(p.name)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#111113', border: '1px dashed rgba(255,255,255,0.12)',
                  borderRadius: '12px', padding: '10px 14px', height: '56px',
                  cursor: 'pointer', boxSizing: 'border-box',
                  animationDelay: `${0.05 + i * 0.06}s`,
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: p.color, flexShrink: 0, boxShadow: '0 0 0 2.5px #fff' }} />
                  <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '17px', color: '#fff', whiteSpace: 'nowrap' }}>{p.name}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isSel && (
                    <svg key="check" className="check-pop" width="14" height="11" viewBox="0 0 14 11" fill="none">
                      <path d="M1.5 5.5L5.5 9.5L12.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Full-width NEXT — always active (could be 0 selections = nobody did it) */}
        <button className="game-btn-primary" onClick={() => { haptic('medium'); onNext([...selected]) }}
          style={{ width: '402px', maxWidth: '100%', height: '44px', boxSizing: 'border-box', background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer', boxShadow: '0 10px 12px rgba(220,40,39,0.25)' }}>
          NEXT
        </button>
      </div>
    </div>
  )
}

/* ─── 5. Points Gained ─── */
function PointsGainedScreen({
  players, pointsMap, newPoints, onSkip, onNext,
}: {
  players: Player[]
  pointsMap: Record<string, number>
  newPoints: Record<string, number>
  onSkip: () => void
  onNext: () => void
}) {
  useEffect(() => {
    if (Object.values(newPoints).some(g => g > 0)) haptic('success')
  }, [newPoints])

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', letterSpacing: '0.04em' }}>
          POINTS GAINED
        </h2>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {players.map((p, i) => {
            const gained = newPoints[p.name] ?? 0
            const total  = pointsMap[p.name] ?? 0
            return (
              <div key={p.name} className="nhie-row-enter" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#111113', border: '1px dashed rgba(255,255,255,0.12)',
                borderRadius: '12px', padding: '10px 14px', height: '56px',
                boxSizing: 'border-box', animationDelay: `${0.06 + i * 0.07}s`,
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: p.color, flexShrink: 0, boxShadow: '0 0 0 2.5px #fff' }} />
                  <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '17px', color: '#fff', whiteSpace: 'nowrap' }}>{p.name}</span>
                </div>
                <span className={gained > 0 ? 'nhie-points-pop' : ''} style={{
                  fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
                  fontSize: '16px', letterSpacing: '0.06em',
                  color: gained > 0 ? '#fff' : 'rgba(255,255,255,0.3)',
                }}>
                  {gained > 0 ? `${total} PTS` : '0 PT'}
                </span>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button className="game-btn" onClick={() => { haptic('light'); onSkip() }}
            style={{ width: '197px', height: '44px', boxSizing: 'border-box', border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', boxShadow: '0 10px 24px rgba(0,0,0,0.25)', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer' }}>
            SKIP FOR NOW
          </button>
          <button className="game-btn-primary" onClick={() => { haptic('light'); onNext() }}
            style={{ width: '197px', height: '44px', boxSizing: 'border-box', background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 18px', boxShadow: '0 10px 12px rgba(220,40,39,0.25)', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer' }}>
            NEXT
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Mini NHIE card (reused in end screens) ─── */
function MiniNHIECard() {
  return (
    <div className="done-card" style={{ width: '150px', height: '196px', background: PURPLE, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.45)', position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ background: '#fff', borderRadius: '10px', width: '112px', height: '118px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontFamily: "'Single Day', cursive", fontSize: '21px', color: PURPLE, textAlign: 'center', lineHeight: 1.2, margin: 0 }}>NEVER<br />HAVE I<br />EVER</p>
        </div>
        <div style={{ width: 0, height: 0, borderLeft: '13px solid transparent', borderRight: '13px solid transparent', borderTop: '16px solid #fff', marginTop: '-1px' }} />
      </div>
      <p style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', fontFamily: "'Anton SC', sans-serif", fontSize: '7px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', whiteSpace: 'nowrap', margin: 0 }}>GAME OF POOR DECISIONS</p>
    </div>
  )
}

/* ─── End screen buttons ─── */
function EndButtons({ onBrowse, onPlayAgain }: { onBrowse: () => void; onPlayAgain: () => void }) {
  return (
    <div className="done-btns" style={{ display: 'flex', gap: '8px' }}>
      <button className="game-btn" onClick={() => { haptic('light'); onBrowse() }}
        style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', width: '160px', height: '44px', boxSizing: 'border-box', boxShadow: '0 10px 24px rgba(0,0,0,0.25)', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer' }}>
        BROWSE GAMES
      </button>
      <button className="game-btn-primary" onClick={() => { haptic('light'); onPlayAgain() }}
        style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 18px', width: '160px', height: '44px', boxSizing: 'border-box', boxShadow: '0 10px 12px rgba(220,40,39,0.25)', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer' }}>
        PLAY AGAIN
      </button>
    </div>
  )
}

/* ─── 6. Done — Winner or Tie ─── */
function DoneScreen({ players, pointsMap, roundsPlayed, onPlayAgain, onBrowse }: {
  players: Player[]
  pointsMap: Record<string, number>
  roundsPlayed: number
  onPlayAgain: () => void
  onBrowse: () => void
}) {
  const sorted = [...players].sort((a, b) => (pointsMap[b.name] ?? 0) - (pointsMap[a.name] ?? 0))
  const topScore = pointsMap[sorted[0]?.name] ?? 0
  const topPlayers = sorted.filter(p => (pointsMap[p.name] ?? 0) === topScore)
  const isTie = topPlayers.length > 1
  const winner = isTie ? null : sorted[0]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '40px', zIndex: 2, position: 'relative' }}>

      {/* Heading */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 className="done-heading" style={{
          fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
          fontSize: '48px', color: '#fff', margin: 0, letterSpacing: '0.02em',
        }}>
          {isTie ? "IT'S A TIE" : 'WE HAVE A WINNER'}
        </h2>
        <p className="done-subtitle" style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          You played {roundsPlayed} round{roundsPlayed !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Winner chip OR No Winner chip */}
      {isTie ? (
        <div className="nhie-chip-enter" style={{
          background: '#111113', border: '1px dashed rgba(255,255,255,0.2)',
          borderRadius: '999px', padding: '10px 22px',
          display: 'inline-flex', alignItems: 'center',
        }}>
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', color: '#fff', letterSpacing: '0.04em' }}>NO WINNER</span>
        </div>
      ) : winner ? (
        <div className="nhie-chip-enter" style={{
          background: '#111113', border: '1px dashed rgba(255,255,255,0.2)',
          borderRadius: '999px', padding: '10px 22px',
          display: 'inline-flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: winner.color, flexShrink: 0, boxShadow: '0 0 0 2px #fff' }} />
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', color: '#fff', letterSpacing: '0.04em' }}>{winner.name}</span>
          <span style={{ fontSize: '18px' }}>🏆</span>
        </div>
      ) : null}

      <MiniNHIECard />

      <EndButtons onBrowse={onBrowse} onPlayAgain={onPlayAgain} />
    </div>
  )
}

/* ─── Root ─── */
type Step = 'playerSetup' | 'modeSelect' | 'deckSize' | 'getReady' | 'game' | 'iveDoneIt' | 'pointsGained' | 'done'

export default function NeverHaveIEverGame({ onClose }: { onClose: () => void }) {
  const [step,       setStep]       = useState<Step>('playerSetup')
  const [players,    setPlayers]    = useState<Player[]>([])
  const [prompts,    setPrompts]    = useState<string[]>([])
  const [cardIdx,    setCardIdx]    = useState(0)
  const [pointsMap,  setPointsMap]  = useState<Record<string, number>>({})
  const [lastPoints, setLastPoints] = useState<Record<string, number>>({})

  const startGame = (deckSize: number) => {
    setPrompts(shuffle(ALL_PROMPTS).slice(0, Math.min(deckSize, ALL_PROMPTS.length)))
    setCardIdx(0)
    const init: Record<string, number> = {}
    players.forEach(p => { init[p.name] = 0 })
    setPointsMap(init)
    setStep('getReady')
  }

  const handleIveDoneIt = useCallback((didIt: string[]) => {
    const gained: Record<string, number> = {}
    const next = { ...pointsMap }
    players.forEach(p => {
      const g = didIt.includes(p.name) ? 1 : 0
      gained[p.name] = g
      next[p.name] = (next[p.name] ?? 0) + g
    })
    setLastPoints(gained)
    setPointsMap(next)
    setStep('pointsGained')
  }, [pointsMap, players])

  const advanceCard = useCallback(() => {
    const next = cardIdx + 1
    if (next >= prompts.length) {
      setStep('done')
    } else {
      setCardIdx(next)
      setStep('game')
    }
  }, [cardIdx, prompts.length])

  const handlePlayAgain = () => {
    setPrompts(shuffle(ALL_PROMPTS).slice(0, prompts.length))
    setCardIdx(0)
    const init: Record<string, number> = {}
    players.forEach(p => { init[p.name] = 0 })
    setPointsMap(init)
    setStep('getReady')
  }

  /* ── Mode select renders standalone (full-screen overlay) ── */
  if (step === 'modeSelect') {
    return (
      <SelectGameMode
        modes={NHIE_MODES}
        onBack={() => setStep('playerSetup')}
        onSelect={() => setStep('deckSize')}
      />
    )
  }

  return (
    <div className="game-fullscreen">
      <GameNav onBack={onClose} />

      {step === 'playerSetup' && (
        <SharedPlayerSetup
          initialPlayers={players}
          skipLabel="GO BACK"
          onSkip={onClose}
          onNext={p => { setPlayers(p); setStep('modeSelect') }}
        />
      )}

      {step === 'deckSize' && (
        <DeckSizeScreen onBack={() => setStep('modeSelect')} onNext={startGame} />
      )}

      {step === 'getReady' && (
        <GetReadyScreen players={players} onDone={() => setStep('game')} />
      )}

      {step === 'game' && (
        <GameScreen
          key={cardIdx}
          prompts={prompts}
          idx={cardIdx}
          onSkip={advanceCard}
          onReveal={() => setStep('iveDoneIt')}
        />
      )}

      {step === 'iveDoneIt' && (
        <IveDoneItScreen players={players} onNext={handleIveDoneIt} />
      )}

      {step === 'pointsGained' && (
        <PointsGainedScreen
          players={players}
          pointsMap={pointsMap}
          newPoints={lastPoints}
          onSkip={advanceCard}
          onNext={advanceCard}
        />
      )}

      {step === 'done' && (
        <DoneScreen
          players={players}
          pointsMap={pointsMap}
          roundsPlayed={prompts.length}
          onPlayAgain={handlePlayAgain}
          onBrowse={onClose}
        />
      )}

      <GameFooter />
    </div>
  )
}
