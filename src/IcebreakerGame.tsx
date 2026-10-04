import { useState, useRef, useEffect, useCallback } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import SharedDeckSize from './components/DeckSize'
import { useScaledCard } from './hooks/useCardScale'
import { GameNav, GameFooter, PlayAgainLabel } from './components/GameShell'
import { getShuffledDeck } from './utils/deckShuffle'
import { ICEBREAKER_DEEP_PROMPTS } from './content/decks/icebreakerDeep'
import { ICEBREAKER_FUN_PROMPTS } from './content/decks/icebreakerFun'
import { ICEBREAKER_REFLECTIVE_PROMPTS } from './content/decks/icebreakerReflective'
import { ICEBREAKER_SOCIAL_PROMPTS } from './content/decks/icebreakerSocial'
import { ICEBREAKER_CREATIVE_PROMPTS } from './content/decks/icebreakerCreative'
import { useGameStep, usePersistentGameState } from './hooks/usePersistentGameState'

const ICEBREAKER_BG = '/assets/games/icebreaker.png'
const ICEBREAKER_INNER = '/icons/icebreaker-inner.svg'
const ICEBREAKER_REVEAL_BG = '/icons/icebreaker-reveal-bg.svg'

const CATEGORIES = ['DEEP', 'FUN', 'REFLECTIVE', 'SOCIAL', 'CREATIVE'] as const
export type IcebreakerCategory = typeof CATEGORIES[number]
type Category = IcebreakerCategory

export const ICEBREAKER_DECKS: Record<Category, readonly string[]> = {
  DEEP: ICEBREAKER_DEEP_PROMPTS,
  FUN: ICEBREAKER_FUN_PROMPTS,
  REFLECTIVE: ICEBREAKER_REFLECTIVE_PROMPTS,
  SOCIAL: ICEBREAKER_SOCIAL_PROMPTS,
  CREATIVE: ICEBREAKER_CREATIVE_PROMPTS,
}

export const ICEBREAKER_DECK = CATEGORIES.flatMap(category =>
  ICEBREAKER_DECKS[category].map(text => ({ category, text })),
)

type PlayMode = 'spotlight' | 'round-robin'

/* ── Iceberg SVG icon ── */
function IcebergIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path d="M12 44h40L38 18H26L12 44z" fill="#5BC8F5" opacity="0.7" />
      <path d="M12 44h40L44 56H20L12 44z" fill="#A8E4F8" opacity="0.5" />
      <path d="M26 18l-4 10h8l-2 8h8l-2-8h8l-4-10H26z" fill="#E8F7FD" />
      <path d="M22 28l-10 16h12l-2-16z" fill="#7DD4F7" opacity="0.6" />
      <path d="M42 28l10 16H40l2-16z" fill="#7DD4F7" opacity="0.6" />
    </svg>
  )
}

/* ── Screen 1: Choose Play Mode ── */
function ChoosePlayMode({ onSelect }: { onSelect: (mode: PlayMode) => void }) {
  const [selected, setSelected] = useState<PlayMode | null>(null)

  const handleSelect = (mode: PlayMode) => {
    setSelected(mode)
    setTimeout(() => onSelect(mode), 200)
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '600px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '50px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', lineHeight: '45px' }}>
            CHOOSE A PLAY MODE
          </h2>
          <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0, textAlign: 'center' }}>
            How do you want to play?
          </p>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {([
            { mode: 'spotlight' as PlayMode, icon: '👤', label: 'SPOTLIGHT', desc: 'Only the current player answers each card while everyone else listens' },
            { mode: 'round-robin' as PlayMode, icon: '👥', label: 'ROUND ROBIN', desc: 'Everyone answers the same card before moving to the next one' },
          ]).map(({ mode, icon, label, desc }) => (
            <button
              key={mode}
              onClick={() => handleSelect(mode)}
              className={`spicy-option stagger-item${selected === mode ? ' selected' : ''}`}
              style={{
                background: selected === mode ? '#1e1e22' : '#070708',
                border: '1px solid transparent', borderRadius: '12px',
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '16px', cursor: 'pointer', width: '100%', textAlign: 'left',
              }}
            >
              <div style={{
                background: 'rgba(255,255,255,0.1)', borderRadius: '16px',
                width: '40px', height: '40px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px',
              }}>
                {icon}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '18px', color: selected === mode ? '#fff' : 'rgba(255,255,255,0.5)', display: 'block' }}>
                  {label}
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>
                  {desc}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Screen: Get Ready with all players listed ── */
function IcebreakerGetReady({ players, onReady }: { players: Player[]; onReady: () => void }) {
  useEffect(() => {
    const id = setTimeout(onReady, 2400)
    return () => clearTimeout(id)
  }, [onReady])

  return (
    <div className="screen-enter" onClick={onReady} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', textTransform: 'uppercase' }}>
          GET READY...
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          {players.map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              animation: `screen-enter 0.4s var(--ease-out) ${0.2 + i * 0.15}s both`,
            }}>
              <div className="avatar-circle" style={{ width: '32px', height: '32px', background: p.color, boxShadow: '0 0 0 2.5px #fff' }} />
              <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff' }}>
                {p.name.toUpperCase()}
              </span>
              {i < players.length - 1 && (
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.3)', marginLeft: '-4px' }}>↓</span>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
          <span className="get-ready-dot" />
          <span className="get-ready-dot" />
          <span className="get-ready-dot" />
        </div>
      </div>
    </div>
  )
}

/* ── Ice crack SVG overlay ── */
function IceCracks() {
  return (
    <svg className="icebreaker-cracks" viewBox="0 0 365 457" fill="none" style={{ width: '100%', height: '100%' }}>
      <path d="M182 0 L175 80 L140 130 L120 200 L90 280 L70 360 L50 457" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" />
      <path d="M182 0 L190 60 L220 110 L250 180 L280 260 L310 350 L340 457" stroke="rgba(255,255,255,0.5)" strokeWidth="1" fill="none" />
      <path d="M175 80 L130 95 L80 100" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" fill="none" />
      <path d="M190 60 L240 55 L290 70" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" fill="none" />
      <path d="M140 130 L100 160 L60 150" stroke="rgba(255,255,255,0.35)" strokeWidth="0.7" fill="none" />
      <path d="M220 110 L270 130 L320 120" stroke="rgba(255,255,255,0.35)" strokeWidth="0.7" fill="none" />
      <path d="M120 200 L80 220 L40 210" stroke="rgba(255,255,255,0.3)" strokeWidth="0.7" fill="none" />
      <path d="M250 180 L300 200 L340 190" stroke="rgba(255,255,255,0.3)" strokeWidth="0.7" fill="none" />
    </svg>
  )
}

/* ── Ice shard generator ── */
function spawnIceShards(container: HTMLElement) {
  const rect = container.getBoundingClientRect()
  const count = 10 + Math.floor(Math.random() * 6)
  for (let i = 0; i < count; i++) {
    const shard = document.createElement('div')
    shard.className = 'ice-shard'
    const size = 4 + Math.random() * 12
    const startX = Math.random() * rect.width
    const startY = Math.random() * rect.height * 0.6
    const dx = (Math.random() - 0.5) * 120
    const dy = 80 + Math.random() * 160
    const rot = (Math.random() - 0.5) * 360
    const dur = 0.5 + Math.random() * 0.4
    const colors = ['rgba(200,235,255,0.9)', 'rgba(255,255,255,0.85)', 'rgba(160,220,250,0.8)', 'rgba(220,245,255,0.9)']
    Object.assign(shard.style, {
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${size}px`,
      height: `${size * (0.6 + Math.random() * 0.8)}px`,
      background: colors[Math.floor(Math.random() * colors.length)],
      borderRadius: `${Math.random() > 0.5 ? '1px' : '0'}`,
      clipPath: Math.random() > 0.3 ? `polygon(${Math.random()*30}% 0%, 100% ${Math.random()*40}%, ${60+Math.random()*40}% 100%, 0% ${60+Math.random()*40}%)` : 'none',
      '--shard-x': `${dx}px`,
      '--shard-y': `${dy}px`,
      '--shard-r': `${rot}deg`,
      '--shard-dur': `${dur}s`,
    } as unknown as CSSStyleDeclaration)
    container.appendChild(shard)
    setTimeout(() => shard.remove(), dur * 1000 + 50)
  }
}

/* ── Flip Card: front=icebreaker, back=question ── */
export function IcebreakerCard({ question, flipped, onTap }: {
  question: { category: Category; text: string }
  flipped: boolean
  onTap: () => void
}) {
  const { wrapperStyle, cardStyle } = useScaledCard(365, 457)
  const wrapRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (!flipped && wrapRef.current) {
      spawnIceShards(wrapRef.current)
    }
    onTap()
  }, [flipped, onTap])

  return (
    <div style={wrapperStyle}>
      <div
        ref={wrapRef}
        onClick={handleClick}
        className="icebreaker-card-wrap game-card"
        style={{ ...cardStyle, flexShrink: 0, zIndex: 2, position: 'relative' }}
      >
        <div className="spicy-flip-container" style={{ width: '365px', height: '457px' }}>
          <div className={`spicy-flip-inner${flipped ? ' flipped' : ''}`} style={{ width: '365px', height: '457px' }}>
            {/* FRONT: Icebreaker cover */}
            <div className="spicy-flip-front" style={{ background: '#4AC7F5' }}>
              <img src={ICEBREAKER_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <p style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '42px', color: '#000', textAlign: 'center', margin: 0 }}>
                  ICEBREAKER
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(0,0,0,0.5)', margin: 0 }}>
                  Tap to Reveal
                </p>
              </div>
              {/* Frost + crack overlays */}
              <div className="icebreaker-frost" />
              <IceCracks />
            </div>

            {/* BACK: Full card from Figma (icebreaker-inner.svg) with text overlay */}
            <div className="spicy-flip-back" style={{ background: '#F5FCFE' }}>
              <img src={ICEBREAKER_INNER} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '48px 36px 80px', gap: '16px',
              }}>
                <span style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', letterSpacing: '0.18em', color: '#5BC8F5', textTransform: 'uppercase' }}>
                  {question.category}
                </span>
                <p style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '26px', color: '#1a1a2e', textAlign: 'center', textTransform: 'uppercase', lineHeight: 1.25, margin: 0 }}>
                  {question.text}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Revealed Card (for next-card flip transitions) ── */
function RevealedCard({ question, flipPhase }: { question: { category: Category; text: string }; flipPhase: string }) {
  const { wrapperStyle, cardStyle } = useScaledCard(365, 457)
  const cls = flipPhase === 'out' ? 'game-card-flip-out' : flipPhase === 'in' ? 'game-card-flip-in' : ''

  return (
    <div style={wrapperStyle}>
      <div
        className={`${cls} game-card`}
        style={{
          ...cardStyle, borderRadius: '16px', overflow: 'hidden',
          position: 'relative', zIndex: 2, background: '#F5FCFE',
          boxShadow: '0 32px 80px rgba(91,200,245,0.25)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '40px 32px', gap: '20px',
        }}
      >
        <span style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', letterSpacing: '0.18em', color: '#5BC8F5', textTransform: 'uppercase' }}>
          {question.category}
        </span>
        <p style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '26px', color: '#1a1a2e', textAlign: 'center', textTransform: 'uppercase', lineHeight: 1.25, margin: 0 }}>
          {question.text}
        </p>
        <div style={{ marginTop: 'auto' }}>
          <img src={ICEBREAKER_REVEAL_BG} alt="" style={{ width: '72px', height: '72px', objectFit: 'contain' }} />
        </div>
      </div>
    </div>
  )
}

/* ── Round Robin Tracker ── */
function RoundRobinTracker({ players, answeredSet, onMarkDone, onNext }: {
  players: Player[]
  answeredSet: Set<number>
  onMarkDone: (idx: number) => void
  onNext: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '340px', position: 'relative', zIndex: 2 }}>
      {players.map((p, i) => {
        const done = answeredSet.has(i)
        return (
          <button
            key={i}
            onClick={() => !done && onMarkDone(i)}
            className="nhie-row"
            style={{
              background: done ? 'rgba(91,200,245,0.1)' : '#070708',
              border: `1px solid ${done ? 'rgba(91,200,245,0.3)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px',
              cursor: done ? 'default' : 'pointer', width: '100%',
            }}
          >
            <div className="avatar-circle" style={{ width: '28px', height: '28px', background: p.color, boxShadow: '0 0 0 2px #fff' }} />
            <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '16px', color: '#fff', flex: 1, textAlign: 'left' }}>
              {p.name.toUpperCase()}
            </span>
            {done && <span style={{ color: '#5BC8F5', fontSize: '18px' }}>✓</span>}
          </button>
        )
      })}
      <button
        className="game-btn-primary"
        onClick={onNext}
        style={{
          background: '#5BC8F5', border: 'none', borderRadius: '999px',
          padding: '12px 18px', fontFamily: "'Staatliches', sans-serif",
          fontSize: '16px', color: '#fff', textAlign: 'center', marginTop: '8px',
        }}
      >
        NEXT
      </button>
    </div>
  )
}

/* ── Game Play ── */
type GamePhase = 'card-front' | 'revealed'

function PlayerChip({ player, cardIndex }: { player: Player; cardIndex: number }) {
  return (
    <div key={`${player.name}-${cardIndex}`} className="player-chip-enter" style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div className="avatar-circle" style={{ width: '28px', height: '28px', background: player.color, boxShadow: '0 0 0 2.5px #fff' }} />
      <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em' }}>
        {player.name.toUpperCase()}'S TURN
      </span>
    </div>
  )
}

function GamePlay({ players, mode, totalCards, questions: shuffledQs, onClose }: {
  players: Player[]
  mode: PlayMode
  totalCards: number
  questions: { category: Category; text: string }[]
  onClose: () => void
}) {
  const [cardIndex, setCardIndex] = usePersistentGameState('icebreaker', 'gameCardIndex', 0)
  const [playerIndex, setPlayerIndex] = usePersistentGameState('icebreaker', 'gamePlayerIndex', 0)
  const [phase, setPhase] = usePersistentGameState<GamePhase>('icebreaker', 'gamePhase', 'card-front')
  const [flipped, setFlipped] = usePersistentGameState('icebreaker', 'flipped', false)
  const [flipPhase, setFlipPhase] = useState<'idle' | 'out' | 'in'>('idle')
  const [answeredSet, setAnsweredSet] = useState<Set<number>>(new Set())
  const [skipCount, setSkipCount] = usePersistentGameState('icebreaker', 'skipCount', 0)
  const flippingRef = useRef(false)

  const currentPlayer = players.length > 0 ? players[playerIndex] : null
  const question = shuffledQs[cardIndex]
  const isDone = totalCards > 0 && cardIndex >= totalCards
  const isRoundRobin = mode === 'round-robin' && players.length > 0

  const flipToNextCard = useCallback((skipped = false) => {
    if (flippingRef.current) return
    if (skipped) setSkipCount(c => c + 1)
    flippingRef.current = true
    setFlipPhase('out')
    setTimeout(() => {
      const nextCard = cardIndex + 1
      const nextPlayer = players.length > 0 ? (playerIndex + 1) % players.length : 0
      setCardIndex(nextCard)
      setPlayerIndex(nextPlayer)
      setAnsweredSet(new Set())
      setFlipped(false)
      setPhase('card-front')
      setFlipPhase('in')
      setTimeout(() => { setFlipPhase('idle'); flippingRef.current = false }, 300)
    }, 200)
  }, [cardIndex, playerIndex, players.length])

  const handleTapCard = useCallback(() => {
    if (phase === 'card-front' && !flipped) {
      setFlipped(true)
      setTimeout(() => setPhase('revealed'), 800)
    }
  }, [phase, flipped])

  if (isDone) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '40px' }}>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
          <h2 className="done-heading" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '48px', color: '#fff', margin: 0, textTransform: 'uppercase' }}>
            ICE BROKEN!
          </h2>
          <p className="done-subtitle" style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            You played all {totalCards} icebreaker cards
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 2, background: '#070708', border: '1px dashed rgba(255, 255, 255, 0.10)', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '20px 32px', gap: 0 }}>
          {[
            { count: totalCards, label: 'CARDS', cls: 'done-stat-1' },
            { count: skipCount, label: 'SKIPPED', cls: 'done-stat-2' },
            { count: players.length, label: 'PLAYERS', cls: 'done-stat-3' },
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

        <div className="done-card" style={{ position: 'relative', zIndex: 2 }}>
          <IcebergIcon size={80} />
        </div>

        <div className="done-btns" style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '8px' }}>
          <button className="game-btn" onClick={onClose} style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>
            BROWSE GAMES
          </button>
          <button className="game-btn-primary" onClick={() => { setCardIndex(0); setPlayerIndex(0); setSkipCount(0); setAnsweredSet(new Set()); setFlipped(false); setPhase('card-front') }} style={{ background: '#5BC8F5', border: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}><PlayAgainLabel /></button>
        </div>
      </div>
    )
  }

  /* card-front: show flip card (front or mid-flip) */
  if (phase === 'card-front') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '40px 40px 60px', position: 'relative' }}>
        {currentPlayer && <PlayerChip player={currentPlayer} cardIndex={cardIndex} />}
        <IcebreakerCard question={question} flipped={flipped} onTap={handleTapCard} />
        {totalCards > 0 && (
          <div className="counter-in" style={{ position: 'relative', zIndex: 2, fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>
            CARD {cardIndex + 1} OF {totalCards}
          </div>
        )}
      </div>
    )
  }

  /* revealed: show question card + buttons, and round robin tracker if applicable */
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '40px 20px 60px', position: 'relative', overflowY: 'auto' }}>
      {currentPlayer && <PlayerChip player={currentPlayer} cardIndex={cardIndex} />}

      <RevealedCard question={question} flipPhase={flipPhase} />

      {/* Round Robin: show player tracker below the card */}
      {isRoundRobin && (
        <RoundRobinTracker
          players={players}
          answeredSet={answeredSet}
          onMarkDone={(idx) => setAnsweredSet(prev => new Set(prev).add(idx))}
          onNext={() => flipToNextCard(false)}
        />
      )}

      {/* Spotlight mode or fallback buttons */}
      {!isRoundRobin && (
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '8px', alignItems: 'center', width: '100%', maxWidth: '402px' }}>
          <button className="game-btn"
            onClick={() => flipToNextCard(true)}
            style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)', letterSpacing: '0.05em' }}
          >
            SKIP
          </button>
          <button className="game-btn-primary"
            onClick={() => flipToNextCard(false)}
            style={{ flex: 1, background: '#5BC8F5', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', letterSpacing: '0.05em' }}
          >
            NEXT
          </button>
        </div>
      )}

      {/* Round Robin: skip button */}
      {isRoundRobin && (
        <button className="game-btn"
          onClick={() => flipToNextCard(true)}
          style={{ position: 'relative', zIndex: 2, border: '1px solid rgba(255,255,255,0.2)', background: 'none', borderRadius: '999px', padding: '10px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}
        >
          SKIP THIS CARD
        </button>
      )}

      {totalCards > 0 && (
        <div key={cardIndex} className="counter-in" style={{ position: 'relative', zIndex: 2, fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>
          CARD {cardIndex + 1} OF {totalCards}
        </div>
      )}
    </div>
  )
}

/* ── Root Component ── */
type Step = 'playMode' | 'playerSetup' | 'deckSize' | 'getReady' | 'game'
const STEPS: readonly Step[] = ['playMode', 'playerSetup', 'deckSize', 'getReady', 'game']

export default function IcebreakerGame({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useGameStep<Step>('icebreaker', 'playMode', STEPS)
  const [mode, setMode] = usePersistentGameState<PlayMode>('icebreaker', 'mode', 'spotlight')
  const [players, setPlayers] = usePersistentGameState<Player[]>('icebreaker', 'players', [])
  const [totalCards, setTotalCards] = usePersistentGameState('icebreaker', 'totalCards', 0)
  const [shuffledQs, setShuffledQs] = usePersistentGameState<(typeof ICEBREAKER_DECK)[number][]>('icebreaker', 'questions', () => getShuffledDeck(ICEBREAKER_DECK, 'icebreaker'))

  const goToGame = useCallback(() => setStep('game'), [])

  return (
    <div className="game-fullscreen">
      <GameNav onBack={onClose} gameId="icebreaker" />

      {step === 'playMode' && (
        <ChoosePlayMode onSelect={(m) => { setMode(m); setStep('playerSetup') }} />
      )}

      {step === 'playerSetup' && (
        <SharedPlayerSetup
          initialPlayers={players}
          minPlayers={2}
          skipLabel="GO BACK"
          onSkip={() => setStep('playMode')}
          onNext={(p) => { setPlayers(p); setStep('deckSize') }}
        />
      )}

      {step === 'deckSize' && (
        <SharedDeckSize
          onBack={() => setStep('playerSetup')}
          onNext={(n) => { setTotalCards(n); setShuffledQs(getShuffledDeck(ICEBREAKER_DECK, 'icebreaker', n)); setStep('getReady') }}
        />
      )}

      {step === 'getReady' && (
        <IcebreakerGetReady players={players} onReady={goToGame} />
      )}

      {step === 'game' && (
        <GamePlay
          players={players}
          mode={mode}
          totalCards={totalCards}
          questions={shuffledQs}
          onClose={onClose}
        />
      )}

      <GameFooter />
    </div>
  )
}
