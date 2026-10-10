import { useState, useRef, useEffect, useCallback } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import { useScaledCard } from './hooks/useCardScale'
import SelectGameMode, { NHIE_MODES } from './SelectGameMode'
import { haptic } from './haptics'
import { GameNav, GameFooter, PlayAgainLabel } from './components/GameShell'
import { getShuffledDeck, shuffle } from './utils/deckShuffle'
import { NEVER_HAVE_I_EVER_PROMPTS } from './content/decks/neverHaveIEver'
import { useGameStep, usePersistentGameState } from './hooks/usePersistentGameState'

export const NEVER_HAVE_I_EVER_DECK = [...NEVER_HAVE_I_EVER_PROMPTS]

const NHIE_BLUE = '#0755c9'
const NHIE_CREAM = '#f5ecd8'
const NHIE_CORAL = '#ff6c5e'
const NHIE_NAVY = '#15365f'
const NHIE_TEXTURE = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.12'/%3E%3C/svg%3E\")"
const playerScoreKey = (player: Player, index: number) => `${index}:${player.name}`
const playerScore = (scores: Record<string, number>, player: Player, index: number) =>
  scores[playerScoreKey(player, index)] ?? scores[player.name] ?? 0


/* ─── NHIE Card ─── */
export function NHIECard({ flipped, prompt, onFlip }: { flipped: boolean; prompt: string; onFlip: () => void }) {
  const W = 320, H = 480
  const { wrapperStyle, cardStyle } = useScaledCard(W, H)

  return (
    <div style={wrapperStyle}>
    <div
      className="game-card"
      onClick={!flipped ? () => { haptic('medium'); onFlip() } : undefined}
      data-sound={!flipped ? 'card.flip' : undefined}
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

          {/* ── Front: approved Never Have I Ever artwork ── */}
          <div style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            background: NHIE_BLUE, borderRadius: '20px', overflow: 'hidden',
            boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          }}>
            <img src="/assets/games/never-have-i-ever.jpg" alt="Never Have I Ever" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>

          {/* ── Back: prompt card derived from the cover palette ── */}
          <div style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            backgroundColor: NHIE_BLUE, backgroundImage: NHIE_TEXTURE, borderRadius: '20px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: '20px', borderRadius: '14px', backgroundColor: NHIE_CREAM, backgroundImage: NHIE_TEXTURE }} />
            <p style={{ position: 'absolute', top: '42px', left: '36px', right: '36px', margin: 0, fontFamily: "'Anton SC', sans-serif", fontSize: '13px', letterSpacing: '0.14em', color: NHIE_CORAL, textAlign: 'center' }}>NEVER HAVE I EVER</p>
            <div style={{ position: 'absolute', top: '75px', left: '50%', width: '42px', height: '4px', borderRadius: '99px', transform: 'translateX(-50%)', background: NHIE_CORAL }} />
            <p style={{
              position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '248px',
              fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
              fontSize: prompt.length > 88 ? '21px' : '25px', color: NHIE_NAVY, lineHeight: 1.2, margin: 0,
              textTransform: 'uppercase', textAlign: 'center',
            }}>
              {prompt}
            </p>
            <div aria-hidden="true" style={{ position: 'absolute', left: '32px', bottom: '30px', display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
              {[20, 27, 30, 24].map((height, i) => <span key={i} style={{ display: 'block', width: '7px', height: `${height}px`, borderRadius: '7px 7px 2px 2px', background: NHIE_CORAL, transform: i === 0 ? 'rotate(-38deg) translateY(5px)' : undefined, transformOrigin: 'bottom right' }} />)}
            </div>
            <p style={{ position: 'absolute', left: 0, right: 0, bottom: '34px', margin: 0, fontFamily: "'Satoshi', sans-serif", fontSize: '10px', fontWeight: 900, letterSpacing: '0.34em', color: NHIE_NAVY, textAlign: 'center' }}>DECKED</p>
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
          style={{ background: '#070708', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', width: '100%', boxSizing: 'border-box', cursor: 'text' }}
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
          background: '#070708', borderRadius: '999px',
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
export function IveDoneItScreen({
  players, onNext,
}: {
  players: Player[]
  onNext: (selectedPlayerIndexes: number[]) => void
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const toggle = (index: number) => {
    haptic('light')
    setSelected(prev => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
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
            const isSel = selected.has(i)
            return (
              <div key={`${i}:${p.name}`} className="nhie-row-enter nhie-row" onClick={() => toggle(i)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#070708', border: '1px dashed rgba(255,255,255,0.1)',
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
            const key = playerScoreKey(p, i)
            const gained = newPoints[key] ?? newPoints[p.name] ?? 0
            const total  = playerScore(pointsMap, p, i)
            return (
              <div key={key} className="nhie-row-enter" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#070708', border: '1px dashed rgba(255,255,255,0.1)',
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
    <div className="done-card" style={{ width: '150px', height: '196px', background: NHIE_BLUE, borderRadius: '10px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.45)', position: 'relative' }}>
      <img src="/assets/games/never-have-i-ever.jpg" alt="Never Have I Ever" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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
        style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 18px', width: '160px', height: '44px', boxSizing: 'border-box', boxShadow: '0 10px 12px rgba(220,40,39,0.25)', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', cursor: 'pointer' }}><PlayAgainLabel /></button>
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
  const sorted = players.map((player, index) => ({ player, index }))
    .sort((a, b) => playerScore(pointsMap, b.player, b.index) - playerScore(pointsMap, a.player, a.index))
  const topScore = sorted[0] ? playerScore(pointsMap, sorted[0].player, sorted[0].index) : 0
  const topPlayers = sorted.filter(entry => playerScore(pointsMap, entry.player, entry.index) === topScore)
  const isTie = topPlayers.length > 1
  const winner = isTie ? null : sorted[0]?.player

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
          background: '#070708', border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: '999px', padding: '10px 22px',
          display: 'inline-flex', alignItems: 'center',
        }}>
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', color: '#fff', letterSpacing: '0.04em' }}>NO WINNER</span>
        </div>
      ) : winner ? (
        <div className="nhie-chip-enter" style={{
          background: '#070708', border: '1px dashed rgba(255,255,255,0.1)',
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
const STEPS: readonly Step[] = ['playerSetup', 'modeSelect', 'deckSize', 'getReady', 'game', 'iveDoneIt', 'pointsGained', 'done']

export default function NeverHaveIEverGame({ onClose }: { onClose: () => void }) {
  const [step,       setStep]       = useGameStep<Step>('never-have-i-ever', 'playerSetup', STEPS)
  const [players,    setPlayers]    = usePersistentGameState<Player[]>('never-have-i-ever', 'players', [])
  const [prompts,    setPrompts]    = usePersistentGameState<string[]>('never-have-i-ever', 'prompts', [])
  const [cardIdx,    setCardIdx]    = usePersistentGameState('never-have-i-ever', 'cardIdx', 0)
  const [pointsMap,  setPointsMap]  = usePersistentGameState<Record<string, number>>('never-have-i-ever', 'pointsMap', {})
  const [lastPoints, setLastPoints] = usePersistentGameState<Record<string, number>>('never-have-i-ever', 'lastPoints', {})

  const startGame = (deckSize: number) => {
    setPrompts(getShuffledDeck(NEVER_HAVE_I_EVER_DECK, 'never-have-i-ever', deckSize))
    setCardIdx(0)
    const init: Record<string, number> = {}
    players.forEach((p, index) => { init[playerScoreKey(p, index)] = 0 })
    setPointsMap(init)
    setStep('getReady')
  }

  const handleIveDoneIt = useCallback((selectedPlayerIndexes: number[]) => {
    const gained: Record<string, number> = {}
    const next: Record<string, number> = {}
    players.forEach((p, index) => {
      const key = playerScoreKey(p, index)
      const g = selectedPlayerIndexes.includes(index) ? 1 : 0
      gained[key] = g
      next[key] = playerScore(pointsMap, p, index) + g
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
    setPrompts(shuffle(NEVER_HAVE_I_EVER_DECK).slice(0, prompts.length))
    setCardIdx(0)
    const init: Record<string, number> = {}
    players.forEach((p, index) => { init[playerScoreKey(p, index)] = 0 })
    setPointsMap(init)
    setStep('getReady')
  }

  /* ── Mode select renders standalone (full-screen overlay) ── */
  if (step === 'modeSelect') {
    return (
      <SelectGameMode
        gameId="never-have-i-ever"
        modes={NHIE_MODES}
        onBack={() => setStep('playerSetup')}
        onSelect={() => setStep('deckSize')}
      />
    )
  }

  return (
    <div className="game-fullscreen">
      <GameNav onBack={onClose} gameId="never-have-i-ever" />

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
