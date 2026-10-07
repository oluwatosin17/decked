import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import { useScaledCard } from './hooks/useCardScale'
import { GameNav, GameFooter, PlayAgainLabel } from './components/GameShell'
import { TimerControl } from './CharadesGame'
import { getShuffledDeck } from './utils/deckShuffle'
import { DARE_SUPPLEMENT } from './content/supplemental'
import { useGameStep, usePersistentGameState } from './hooks/usePersistentGameState'

const ICON_LIVE   = '/icons/live.svg'

const STRAIGHT_FACE_ORANGE = '#df561b'
const STRAIGHT_FACE_MINT = '#e5f5d5'
const STRAIGHT_FACE_BURGUNDY = '#781d23'
const PAPER_TEXTURE = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.13'/%3E%3C/svg%3E\")"

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

const LAUGH_EXTRAS = [
  "Interview your shoe about where it sees itself in five years.",
  "Apologise sincerely to a spoon for never appreciating its hard work.",
  "Act like a mosquito trying to check into a luxury hotel.",
  "Give a breaking-news report about somebody opening a packet of snacks.",
  "Pretend the floor is mildly inconvenient lava.",
  "Demonstrate how a giraffe would try to hide behind a lamp.",
  "Explain taxes to an imaginary five-year-old using only fruit metaphors.",
  "Perform a victory dance for successfully remembering your own name.",
  "Act like a ghost who is embarrassed about haunting the wrong house.",
  "Give a serious TED Talk about why socks disappear in the laundry.",
  "Pretend to be a waiter serving invisible food to a demanding customer.",
  "Imitate a chicken attempting its first job interview.",
  "Deliver a love confession to the nearest piece of furniture.",
  "Act like your knees have started arguing with each other.",
  "Present an award to yourself for doing absolutely nothing today.",
  "Pretend to be a detective investigating a suspicious biscuit crumb.",
  "Demonstrate a new exercise routine designed entirely for lazy people.",
  "Act like a superhero whose only power is finding misplaced chargers.",
  "Explain your outfit as if every item has a dangerous secret.",
  "Pretend an invisible duck is following you and you cannot let anyone notice.",
  "Make a dramatic phone call to inform someone that water is wet.",
  "Act like a royal person learning how to use a vending machine.",
  "Give directions to the bathroom as if it is a legendary quest.",
  "Pretend your elbow has just told you shocking gossip.",
  "Perform an advertisement for a pillow that refuses to let people sleep.",
  "Act like a chef whose only ingredient is air.",
  "Explain why you are late using the plot of a completely invented action film.",
  "Pretend to be a pigeon running for political office.",
  "Demonstrate how to sit down as if it requires years of professional training.",
  "Give an emotional farewell speech to a snack before eating it.",
  "Act like a dog that has suddenly realised it is adopted.",
  "Pretend your hands are two strangers meeting on a first date.",
  "Announce every movement you make like an airport departure.",
  "Imitate a person trying to sneeze silently during a serious ceremony.",
  "Hold a press conference explaining why you forgot to charge your phone.",
  "Act like an alien attempting to blend into a supermarket queue.",
  "Teach the group a dance move called The Unpaid Bill.",
  "Pretend the nearest object has deeply offended your ancestors.",
  "Give a motivational speech to someone whose toast fell butter-side down.",
  "Act like a magician whose tricks are all extremely obvious.",
  "Describe brushing your teeth as an Olympic sport.",
  "Pretend to be a security guard protecting the last slice of pizza.",
  "Sing a short national anthem for people who cancel plans.",
  "Act like a fashion model wearing invisible shoes that are too tight.",
  "Give a cooking demonstration for a meal nobody should ever eat.",
  "Pretend your chair is a horse that refuses to move.",
  "Explain a paper clip as if it is advanced alien technology.",
  "Act like a toddler negotiating a major business deal.",
  "Perform a dramatic reunion with someone you saw five minutes ago.",
  "Pretend to be a dentist examining an invisible crocodile.",
  "Narrate somebody drinking water like the final scene of a romance film.",
  "Act like a spy whose only mission is to borrow a pen.",
  "Explain why Mondays should be illegal in the style of a courtroom argument.",
  "Pretend your hair is giving you terrible life advice.",
  "Demonstrate how a confused vampire applies sunscreen.",
  "Give a guided meditation for people trapped in a long queue.",
  "Act like a football coach motivating a team of houseplants.",
  "Pretend you are trapped inside a mime's invisible box and find the emergency exit.",
  "Read an imaginary restaurant menu as if every dish is personally insulting.",
  "Act like a squirrel trying to remember a complicated password.",
  "Give a product review of the air in the room.",
  "Pretend your feet are celebrities avoiding photographers.",
  "Demonstrate how a very dramatic person opens an ordinary envelope.",
  "Act like a teacher explaining why naps deserve academic credit.",
  "Give a campaign speech promising free snacks for everyone.",
  "Pretend a balloon has challenged you to a dance battle.",
  "Explain your morning using only the names of imaginary film sequels.",
  "Act like a waiter who has forgotten what food is.",
  "Perform a slow-motion argument with your own reflection.",
  "Pretend to translate a conversation between two angry potatoes.",
  "Give an inspirational speech about surviving a low phone battery.",
  "Act like a museum guide presenting an extremely ordinary sock.",
  "Demonstrate how a penguin would prepare for a beach holiday.",
  "Pretend your nose is auditioning for a musical.",
  "Give a weather warning about an approaching cloud of bad decisions.",
  "Act like a robot attempting to understand a knock-knock joke.",
  "Explain why the nearest wall deserves a public apology.",
  "Pretend you are a pirate searching the room for missing WiFi.",
  "Perform a dramatic scene in which you discover the remote was beside you.",
  "Act like a personal trainer encouraging someone to lift a single crisp.",
]

export const LAUGH_YOU_ARE_OUT_DECK = [...CHALLENGES, ...DARE_SUPPLEMENT, ...LAUGH_EXTRAS]


/* ─── LYAO Card (flip-capable) ─── */
function LYAOCard({ challenge, flipped, onFlip }: { challenge: string; flipped: boolean; onFlip: () => void }) {
  const W = 320
  const H = 420
  const { wrapperStyle, cardStyle } = useScaledCard(W, H)

  return (
    <div style={wrapperStyle}>
    <div
      onClick={!flipped ? onFlip : undefined}
      data-sound={!flipped ? 'card.flip' : undefined}
      className={`game-card${!flipped ? ' lyao-card-wrap' : ''}`}
      style={{ ...cardStyle, perspective: '1000px', cursor: flipped ? 'default' : 'pointer' }}
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
          backgroundColor: STRAIGHT_FACE_ORANGE,
          backgroundImage: PAPER_TEXTURE,
          borderRadius: '20px', overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.38)',
        }}>
          <img src="/assets/games/keep-a-straight-face.png" alt="Keep a Straight Face" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>

        {/* ── Back face — challenge ── */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          backgroundColor: STRAIGHT_FACE_ORANGE,
          backgroundImage: `repeating-linear-gradient(135deg, #c9431f 0, #c9431f 10px, #f47b32 10px, #f47b32 20px), ${PAPER_TEXTURE}`,
          borderRadius: '20px', overflow: 'hidden', padding: '18px', boxSizing: 'border-box',
          boxShadow: '0 20px 50px rgba(0,0,0,0.38)',
        }}>
          <div style={{
            position: 'absolute', inset: '24px', borderRadius: '14px',
            backgroundColor: STRAIGHT_FACE_MINT,
            backgroundImage: PAPER_TEXTURE,
          }} />
          <p style={{ position: 'absolute', top: '38px', left: '36px', right: '36px', margin: 0, color: STRAIGHT_FACE_BURGUNDY, fontFamily: "'Anton SC', sans-serif", fontSize: '13px', letterSpacing: '0.16em', textAlign: 'center' }}>KEEP A STRAIGHT FACE</p>
          <div style={{ position: 'absolute', top: '71px', left: '50%', width: '44px', height: '4px', borderRadius: '99px', transform: 'translateX(-50%)', background: STRAIGHT_FACE_ORANGE }} />
          <p style={{
            position: 'absolute',
            left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
            width: '248px',
            fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
            fontSize: '24px', color: '#173654', textAlign: 'center', margin: 0, lineHeight: 1.2,
          }}>
            {challenge}
          </p>
          <p style={{
            position: 'absolute', left: 0, right: 0, bottom: '38px',
            fontFamily: "'Satoshi', sans-serif", fontWeight: 800,
            fontSize: '10px', color: STRAIGHT_FACE_BURGUNDY, margin: 0, letterSpacing: '0.32em', textAlign: 'center',
          }}>
            DECKED
          </p>
        </div>
      </div>
      </div>
    </div>
    </div>
  )
}

/* ─── Mini LYAO Card (game over screen) ─── */
function MiniLYAOCard() {
  const W = 150, H = 195
  return (
    <div style={{ width: `${W}px`, height: `${H}px`, background: STRAIGHT_FACE_ORANGE, borderRadius: '10px', overflow: 'hidden', position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      <img src="/assets/games/keep-a-straight-face.png" alt="Keep a Straight Face" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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
        <div className="setup-card-row"
          style={{ background: '#070708', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', width: '100%', boxSizing: 'border-box', cursor: 'text' }}
          onClick={() => inputRef.current?.focus()}
        >
          {/* Correct watch icon from Figma */}
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
                  background: isSelected ? '#1a1a1d' : '#070708',
                  border: `1px solid ${isSelected ? 'rgba(255,255,255,0.15)' : 'transparent'}`,
                  borderRadius: '12px', padding: '12px',
                  height: '56px', cursor: 'pointer', width: '100%',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                {/* N life icons */}
                {Array.from({ length: m.lives }, (_, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
  const [paused, setPaused] = useState(false)

  // Reset when challenge changes
  useEffect(() => { setFlipped(false); setPhase('card'); setRemaining(seconds); setPaused(false) }, [challenge, seconds])

  // Timer
  useEffect(() => {
    if (phase !== 'timer' || paused) return
    if (remaining <= 0) { onDone(); return }
    const id = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, paused, remaining, onDone])

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
        <TimerControl
          timeLeft={remaining}
          roundLength={seconds}
          paused={paused}
          onTogglePause={() => setPaused(value => !value)}
          onCancel={onDone}
        />
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
                  background: '#070708',
                  border: '1px dashed rgba(255,255,255,0.1)',
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
                background: '#070708', border: '1px dashed rgba(255,255,255,0.1)',
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
          background: '#070708', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '999px', padding: '10px 20px',
          display: 'inline-flex', alignItems: 'center',
        }}>
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', color: '#fff' }}>No winner</span>
        </div>
      ) : winner && (
        <div className="stagger-item" style={{
          background: '#070708', border: '1px dashed rgba(255,255,255,0.1)',
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
          style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '13px 24px', width: '160px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', letterSpacing: '0.05em', color: '#fff', textAlign: 'center', cursor: 'pointer', boxShadow: '0 8px 20px rgba(220,40,39,0.3)' }}><PlayAgainLabel /></button>
      </div>
    </div>
  )
}

/* ─── Root ─── */
type Step = 'playerSetup' | 'roundLength' | 'livesSetup' | 'gameplay' | 'whoLaughed' | 'livesRemaining' | 'winner'
const STEPS: readonly Step[] = ['playerSetup', 'roundLength', 'livesSetup', 'gameplay', 'whoLaughed', 'livesRemaining', 'winner']

export default function LaughYouAreOutGame({ onClose }: { onClose: () => void }) {
  const [step,          setStep]          = useGameStep<Step>('you-laugh', 'playerSetup', STEPS)
  const [players,       setPlayers]       = usePersistentGameState<Player[]>('you-laugh', 'players', [])
  const [roundSeconds,  setRoundSeconds]  = usePersistentGameState('you-laugh', 'roundSeconds', 30)
  const [maxLives,      setMaxLives]      = usePersistentGameState('you-laugh', 'maxLives', 3)
  const [livesMap,      setLivesMap]      = usePersistentGameState<Record<string, number>>('you-laugh', 'livesMap', {})
  const [roundNum,      setRoundNum]      = usePersistentGameState('you-laugh', 'roundNum', 0)
  const [challenges,    setChallenges]    = usePersistentGameState<string[]>('you-laugh', 'challenges', () => getShuffledDeck(LAUGH_YOU_ARE_OUT_DECK, 'laugh-you-are-out'))
  const [challengeIdx,  setChallengeIdx]  = usePersistentGameState('you-laugh', 'challengeIdx', 0)
  const [winner,        setWinner]        = usePersistentGameState<Player | null>('you-laugh', 'winner', null)

  const currentChallenge = challenges[challengeIdx % challenges.length]

  const startGame = useCallback((p: Player[], lives: number) => {
    const map: Record<string, number> = {}
    p.forEach(pl => { map[pl.name] = lives })
    setLivesMap(map)
    setRoundNum(0)
    setChallenges(getShuffledDeck(LAUGH_YOU_ARE_OUT_DECK, 'laugh-you-are-out'))
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
    setChallenges(getShuffledDeck(LAUGH_YOU_ARE_OUT_DECK, 'laugh-you-are-out'))
    setChallengeIdx(0)
    setWinner(null)
    setStep('gameplay')
  }, [players, maxLives])

  return (
    <div className="game-fullscreen">
      <GameNav onBack={onClose} gameId="you-laugh" />

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
