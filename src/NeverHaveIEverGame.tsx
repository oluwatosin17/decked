import { useState, useRef } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'

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

/* ─── NHIE Card ─── */
const PURPLE = '#bf5af2'

function NHIECard({ flipped, prompt, onFlip }: { flipped: boolean; prompt: string; onFlip: () => void }) {
  const W = 320, H = 420

  return (
    <div
      onClick={!flipped ? onFlip : undefined}
      className={!flipped ? 'lyao-card-wrap' : ''}
      style={{ width: `${W}px`, height: `${H}px`, perspective: '1000px', cursor: flipped ? 'default' : 'pointer' }}
    >
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
            background: PURPLE, borderRadius: '16px',
            overflow: 'hidden', boxShadow: '0 20px 50px rgba(191,90,242,0.45)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Speech bubble */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Bubble box */}
              <div style={{
                background: '#fff', borderRadius: '14px',
                width: '220px', height: '220px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', zIndex: 1,
              }}>
                <p style={{
                  fontFamily: "'Slackey', cursive", fontSize: '42px', color: PURPLE,
                  textAlign: 'center', lineHeight: 1.15, margin: 0, padding: '10px',
                }}>
                  NEVER<br />HAVE I<br />EVER
                </p>
              </div>
              {/* Triangle pointer */}
              <div style={{
                position: 'absolute', bottom: '-22px', left: '50%',
                transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '16px solid transparent',
                borderRight: '16px solid transparent',
                borderTop: '24px solid #fff',
                zIndex: 0,
              }} />
            </div>

            {/* Bottom label */}
            <p style={{
              position: 'absolute', bottom: '18px', left: '50%', transform: 'translateX(-50%)',
              fontFamily: "'Anton SC', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.75)',
              letterSpacing: '0.12em', whiteSpace: 'nowrap', margin: 0,
            }}>
              GAME OF POOR DECISIONS
            </p>
          </div>

          {/* ── Back face — prompt ── */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: '#fff', borderRadius: '16px',
            border: `3px solid ${PURPLE}`,
            boxShadow: '0 20px 50px rgba(191,90,242,0.35)',
            display: 'flex', flexDirection: 'column', padding: '16px',
          }}>
            {/* Mini bubble badge top-left */}
            <div style={{ alignSelf: 'flex-start', position: 'relative', marginBottom: '20px' }}>
              <div style={{
                background: PURPLE, borderRadius: '8px',
                padding: '8px 10px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <p style={{
                  fontFamily: "'Slackey', cursive", fontSize: '11px', color: '#fff',
                  textAlign: 'center', lineHeight: 1.2, margin: 0,
                }}>
                  NEVER<br />HAVE I<br />EVER
                </p>
              </div>
              {/* Mini triangle */}
              <div style={{
                position: 'absolute', bottom: '-10px', left: '12px',
                width: 0, height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: `11px solid ${PURPLE}`,
              }} />
            </div>

            {/* Prompt text */}
            <p style={{
              fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
              fontSize: '22px', color: '#111', lineHeight: 1.35, margin: 0,
              flex: 1, display: 'flex', alignItems: 'flex-start',
            }}>
              {prompt.toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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

/* ─── Deck Size screen ─── */
function DeckSizeScreen({ onBack, onNext }: { onBack: () => void; onNext: (n: number) => void }) {
  const [value, setValue] = useState('10')
  const inputRef = useRef<HTMLInputElement>(null)
  const parsed = parseInt(value, 10)
  const valid = !isNaN(parsed) && parsed >= 1 && parsed <= 100

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '40px', color: '#fff', margin: '0 0 10px', letterSpacing: '0.04em' }}>DECK SIZE</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>How many cards do you want to play?</p>
        </div>

        <div
          style={{ background: '#111113', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', width: '100%', boxSizing: 'border-box', cursor: 'text' }}
          onClick={() => inputRef.current?.focus()}
        >
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: '18px', fontWeight: 300, lineHeight: 1 }}>+</span>
          </div>
          <input
            ref={inputRef} type="number" min={1} max={100}
            value={value} onChange={e => setValue(e.target.value)}
            placeholder="10"
            style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '20px', color: '#fff', flex: 1, letterSpacing: '0.06em' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button onClick={onBack} className="game-btn"
            style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '14px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '17px', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer' }}>
            GO BACK
          </button>
          <button onClick={() => valid && onNext(parsed)}
            className="game-btn-primary"
            style={{ flex: 1, background: valid ? '#dc2827' : '#333', border: 'none', borderRadius: '999px', padding: '14px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '17px', color: valid ? '#fff' : '#666', cursor: valid ? 'pointer' : 'not-allowed', letterSpacing: '0.05em', transition: 'background 0.2s' }}>
            START THE GAME
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Game screen ─── */
function GameScreen({ prompts, onDone }: { prompts: string[]; onDone: (stats: { cards: number; skipped: number }) => void }) {
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [skipped, setSkipped] = useState(0)
  const total = prompts.length

  const goNext = (wasSkipped = false) => {
    if (wasSkipped) setSkipped(s => s + 1)
    if (idx + 1 >= total) {
      onDone({ cards: total, skipped: wasSkipped ? skipped + 1 : skipped })
    } else {
      setFlipped(false)
      setTimeout(() => setIdx(i => i + 1), 80)
    }
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '40px', position: 'relative', zIndex: 2 }}>
      {/* Counter */}
      <p className="counter-in" key={idx} style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', margin: 0 }}>
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
          Tap the card to reveal
        </p>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="game-btn" onClick={() => goNext(true)}
            style={{ border: '1px solid rgba(255,255,255,0.4)', background: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em', cursor: 'pointer' }}>
            SKIP
          </button>
          <button className="game-btn-primary" onClick={() => goNext(false)}
            style={{ background: PURPLE, border: 'none', borderRadius: '999px', padding: '12px 28px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer', boxShadow: '0 8px 20px rgba(191,90,242,0.4)' }}>
            NEXT CARD
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Done screen ─── */
function DoneScreen({ stats, players, onPlayAgain, onBrowse }: { stats: { cards: number; skipped: number }; players: Player[]; onPlayAgain: () => void; onBrowse: () => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '40px', position: 'relative', zIndex: 2 }}>
      <div style={{ textAlign: 'center' }}>
        <h2 className="done-heading" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '48px', color: '#fff', margin: '0 0 8px' }}>YOU'RE DECKED!</h2>
        <p className="done-subtitle" style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          {players.length > 0 ? `${players.map(p => p.name).join(', ')} played ${stats.cards} cards` : `${stats.cards} cards played`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        {[
          { label: 'CARDS', value: stats.cards },
          { label: 'SKIPPED', value: stats.skipped },
          { label: 'PLAYERS', value: players.length || '—' },
        ].map((s, i) => (
          <div key={s.label} className={`done-stat-${i + 1}`} style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px 24px', textAlign: 'center', minWidth: '90px' }}>
            <p style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '28px', color: '#fff', margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mini NHIE card */}
      <div className="done-card" style={{
        width: '130px', height: '170px', background: PURPLE, borderRadius: '12px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(191,90,242,0.45)',
      }}>
        <div style={{ background: '#fff', borderRadius: '8px', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <p style={{ fontFamily: "'Slackey', cursive", fontSize: '14px', color: PURPLE, textAlign: 'center', lineHeight: 1.2, margin: 0 }}>NEVER<br />HAVE I<br />EVER</p>
          <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '9px solid #fff' }} />
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
type Step = 'playerSetup' | 'deckSize' | 'game' | 'done'

export default function NeverHaveIEverGame({ onClose }: { onClose: () => void }) {
  const [step,    setStep]    = useState<Step>('playerSetup')
  const [players, setPlayers] = useState<Player[]>([])
  const [prompts, setPrompts] = useState<string[]>([])
  const [stats,   setStats]   = useState({ cards: 0, skipped: 0 })

  const startGame = (deckSize: number) => {
    setPrompts(shuffle(ALL_PROMPTS).slice(0, Math.min(deckSize, ALL_PROMPTS.length)))
    setStep('game')
  }

  const handlePlayAgain = () => {
    setPrompts(shuffle(ALL_PROMPTS).slice(0, prompts.length))
    setStep('game')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <GameNav onBack={onClose} />

      {step === 'playerSetup' && (
        <SharedPlayerSetup
          initialPlayers={players}
          skipLabel="GO BACK"
          onSkip={onClose}
          onNext={p => { setPlayers(p); setStep('deckSize') }}
        />
      )}

      {step === 'deckSize' && (
        <DeckSizeScreen
          onBack={() => setStep('playerSetup')}
          onNext={startGame}
        />
      )}

      {step === 'game' && (
        <GameScreen
          prompts={prompts}
          onDone={s => { setStats(s); setStep('done') }}
        />
      )}

      {step === 'done' && (
        <DoneScreen
          stats={stats}
          players={players}
          onPlayAgain={handlePlayAgain}
          onBrowse={onClose}
        />
      )}

      <GameFooter />
    </div>
  )
}
