import { useState, useRef, useEffect, useCallback } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import SelectGameMode, { NHIE_MODES } from './SelectGameMode'

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
    <nav style={{ background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 60px', height: '80px', flexShrink: 0, zIndex: 10, position: 'relative' }}>
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
const SOCIAL_TIKTOK    = 'https://www.figma.com/api/mcp/asset/52c80b9f-7611-4e1c-b0a1-b87cbde55222'
const SOCIAL_INSTAGRAM = 'https://www.figma.com/api/mcp/asset/2fb330d3-8103-4715-98c4-977825083eae'
const SOCIAL_WHATSAPP  = 'https://www.figma.com/api/mcp/asset/5e3391bc-c214-4266-8b20-9d5680742eef'

function GameFooter() {
  return (
    <footer style={{ background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)', padding: '32px 60px', display: 'flex', flexDirection: 'column', gap: '40px', flexShrink: 0 }}>
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

  return (
    <div
      onClick={!flipped ? onFlip : undefined}
      style={{
        width: `${W}px`, height: `${H}px`, perspective: '1000px',
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
                  fontFamily: "'Slackey', cursive", fontSize: `${W * 0.175}px`, color: PURPLE,
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
                <p style={{ fontFamily: "'Slackey', cursive", fontSize: '11px', color: '#fff', textAlign: 'center', lineHeight: 1.2, margin: 0 }}>
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
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: '20px', fontWeight: 300, lineHeight: 1 }}>+</span>
          </div>
          <input
            ref={inputRef} type="number" min={1} max={100}
            value={value} onChange={e => setValue(e.target.value)}
            placeholder="ENTER NUMBER"
            style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', flex: 1, letterSpacing: '0.06em' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button onClick={onBack} className="game-btn"
            style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '14px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '17px', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer' }}>
            GO BACK
          </button>
          <button onClick={() => valid && onNext(parsed)} className={valid ? 'game-btn-primary' : ''}
            style={{ flex: 1, background: valid ? '#dc2827' : '#2a2a2a', border: 'none', borderRadius: '999px', padding: '14px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '17px', color: valid ? '#fff' : '#555', cursor: valid ? 'pointer' : 'not-allowed', letterSpacing: '0.05em', transition: 'background 0.2s, color 0.2s' }}>
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
  const [fadeIn, setFadeIn] = useState(true)

  useEffect(() => {
    if (players.length === 0) { setTimeout(onDone, 1500); return }
    const cycle = () => {
      if (playerIdx < players.length - 1) {
        setFadeIn(false)
        setTimeout(() => { setPlayerIdx(i => i + 1); setFadeIn(true) }, 300)
      } else {
        setTimeout(onDone, 900)
      }
    }
    const t = setTimeout(cycle, playerIdx === players.length - 1 ? 900 : 1000)
    return () => clearTimeout(t)
  }, [playerIdx, players.length, onDone])

  const current = players[playerIdx]

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '40px', position: 'relative', zIndex: 2 }}>
      <h2 style={{
        fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '40px', color: '#fff',
        margin: 0, letterSpacing: '0.04em',
      }}>
        GET READY...
      </h2>

      {current && (
        <div style={{
          background: '#111113', borderRadius: '999px',
          padding: '10px 20px 10px 12px',
          display: 'flex', alignItems: 'center', gap: '10px',
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? 'scale(1)' : 'scale(0.9)',
          transition: 'opacity 0.25s var(--ease-out), transform 0.25s var(--ease-spring)',
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
      <p className="counter-in" key={idx} style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', margin: 0 }}>
        {String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </p>

      <NHIECard
        key={idx}
        flipped={flipped}
        prompt={prompts[idx]}
        onFlip={() => setFlipped(true)}
      />

      {!flipped ? (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
          Tap the card to flip it.
        </p>
      ) : (
        <div className="screen-enter-fast" style={{ display: 'flex', gap: '8px' }}>
          <button className="game-btn" onClick={onSkip}
            style={{ border: '1px solid rgba(255,255,255,0.4)', background: 'none', borderRadius: '999px', padding: '13px 28px', fontFamily: "'Staatliches', sans-serif", fontSize: '17px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em', cursor: 'pointer' }}>
            SKIP FOR NOW
          </button>
          <button className="game-btn-primary" onClick={onReveal}
            style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '13px 32px', fontFamily: "'Staatliches', sans-serif", fontSize: '17px', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer', boxShadow: '0 8px 20px rgba(220,40,39,0.35)' }}>
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
    setSelected(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
        <h2 style={{ fontFamily: "'Slackey', cursive", fontSize: '38px', color: '#fff', margin: 0, textAlign: 'center' }}>
          I've Done It
        </h2>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {players.map((p, i) => {
            const isSel = selected.has(p.name)
            return (
              <div key={p.name} className="stagger-item lyao-row" onClick={() => toggle(p.name)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#111113', border: '1px dashed rgba(255,255,255,0.12)',
                  borderRadius: '12px', padding: '10px 14px', height: '56px',
                  cursor: 'pointer', boxSizing: 'border-box',
                  animationDelay: `${0.04 + i * 0.05}s`,
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
        <button className="game-btn-primary" onClick={() => onNext([...selected])}
          style={{ width: '100%', background: '#dc2827', border: 'none', borderRadius: '999px', padding: '15px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '18px', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer', boxShadow: '0 8px 20px rgba(220,40,39,0.3)' }}>
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
              <div key={p.name} className="stagger-item" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#111113', border: '1px dashed rgba(255,255,255,0.12)',
                borderRadius: '12px', padding: '10px 14px', height: '56px',
                boxSizing: 'border-box', animationDelay: `${0.04 + i * 0.06}s`,
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: p.color, flexShrink: 0, boxShadow: '0 0 0 2.5px #fff' }} />
                  <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '17px', color: '#fff', whiteSpace: 'nowrap' }}>{p.name}</span>
                </div>
                <span className={gained > 0 ? 'counter-in' : ''} style={{
                  fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
                  fontSize: '16px', letterSpacing: '0.06em',
                  color: gained > 0 ? PURPLE : 'rgba(255,255,255,0.35)',
                }}>
                  {gained > 0 ? `${total} PTS` : '0 PT'}
                </span>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button className="game-btn" onClick={onSkip}
            style={{ flex: 1, border: '1px solid rgba(255,255,255,0.5)', background: 'none', borderRadius: '999px', padding: '14px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '17px', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer' }}>
            SKIP FOR NOW
          </button>
          <button className="game-btn-primary" onClick={onNext}
            style={{ flex: 1, background: '#dc2827', border: 'none', borderRadius: '999px', padding: '14px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '17px', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer', boxShadow: '0 8px 20px rgba(220,40,39,0.3)' }}>
            NEXT
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── 6. Done ─── */
function DoneScreen({ players, pointsMap, onPlayAgain, onBrowse }: {
  players: Player[]; pointsMap: Record<string, number>; onPlayAgain: () => void; onBrowse: () => void
}) {
  const sorted = [...players].sort((a, b) => (pointsMap[b.name] ?? 0) - (pointsMap[a.name] ?? 0))
  const winner = sorted[0]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '40px', zIndex: 2, position: 'relative' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 className="done-heading" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '48px', color: '#fff', margin: '0 0 8px' }}>YOU'RE DECKED!</h2>
        {winner && <p className="done-subtitle" style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          {winner.name} leads with {pointsMap[winner.name] ?? 0} pts
        </p>}
      </div>

      {/* Leaderboard */}
      <div className="stagger-item" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sorted.map((p, i) => (
          <div key={p.name} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#111113', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px', padding: '10px 16px', height: '52px',
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.3)', width: '18px' }}>{i + 1}</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: p.color, flexShrink: 0, boxShadow: '0 0 0 2px #fff' }} />
              <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '16px', color: '#fff' }}>{p.name}</span>
            </div>
            <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '15px', color: PURPLE, letterSpacing: '0.05em' }}>
              {pointsMap[p.name] ?? 0} PTS
            </span>
          </div>
        ))}
      </div>

      {/* Mini card */}
      <div className="done-card" style={{ width: '120px', height: '160px', background: PURPLE, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 24px rgba(191,90,242,0.45)` }}>
        <div style={{ background: '#fff', borderRadius: '8px', width: '84px', height: '92px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <p style={{ fontFamily: "'Slackey', cursive", fontSize: '13px', color: PURPLE, textAlign: 'center', lineHeight: 1.2, margin: 0 }}>NEVER<br />HAVE I<br />EVER</p>
          <div style={{ position: 'absolute', bottom: '-9px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '10px solid #fff' }} />
        </div>
      </div>

      <div className="done-btns" style={{ display: 'flex', gap: '8px' }}>
        <button className="game-btn" onClick={onBrowse}
          style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '13px 24px', width: '160px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer' }}>
          BROWSE GAMES
        </button>
        <button className="game-btn-primary" onClick={onPlayAgain}
          style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '13px 24px', width: '160px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer', boxShadow: '0 8px 20px rgba(220,40,39,0.3)' }}>
          PLAY AGAIN
        </button>
      </div>
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
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
          onPlayAgain={handlePlayAgain}
          onBrowse={onClose}
        />
      )}

      <GameFooter />
    </div>
  )
}
