import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import DownSmallRegular from '@mingcute/react/core-regular/down-small'
import InformationRegular from '@mingcute/react/core-regular/information'
import { useSound } from './audio/SoundProvider'
import { track } from './analytics'
import { GameFooter, GameNav, PlayAgainLabel } from './components/GameShell'
import { haptic } from './haptics'
import PlayerSetup, { type Player } from './components/PlayerSetup'
import { useMultiplayerSession } from './multiplayer/SessionStateContext'
import {
  CLASSIC_WHOT_RULES, SHAPES, canPlayWhotCard, chooseWhotShape, createWhotGame,
  currentPlayer, declareLastCard, drawForWhotTurn, playWhotCard, topCard,
  type WhotCard, type WhotRules, type WhotShape, type WhotState,
} from './whot/model'

const COLORS: Record<WhotShape, string> = {
  circle: '#ef3f36', triangle: '#1268d6', cross: '#f2b90f', square: '#22a66f', star: '#7040c8', whot: '#35152d',
}

function Shape({ shape, size = 78 }: { shape: WhotShape; size?: number }) {
  const color = COLORS[shape]
  if (shape === 'circle') return <span style={{ width: size, height: size, borderRadius: '50%', background: color }} />
  if (shape === 'triangle') return <span style={{ width: 0, height: 0, borderLeft: `${size / 2}px solid transparent`, borderRight: `${size / 2}px solid transparent`, borderBottom: `${size}px solid ${color}` }} />
  if (shape === 'cross') return <span style={{ width: size, height: size, position: 'relative' }}><i style={{ position: 'absolute', left: '34%', top: 0, width: '32%', height: '100%', background: color }} /><i style={{ position: 'absolute', left: 0, top: '34%', width: '100%', height: '32%', background: color }} /></span>
  if (shape === 'square') return <span style={{ width: size, height: size, background: color }} />
  if (shape === 'star') return <span style={{ color, fontSize: size * 1.2, lineHeight: .8 }}>★</span>
  return <span className="font-anton" style={{ width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'conic-gradient(#ef3f36,#f2b90f,#22a66f,#1268d6,#7040c8,#ef3f36)', color: '#fff', fontSize: size * .28 }}>WHOT</span>
}

export function WhotCardView({ card, compact = false, disabled = false, onClick }: { card: WhotCard; compact?: boolean; disabled?: boolean; onClick?: (element: HTMLButtonElement) => void }) {
  const width = compact ? 104 : 190
  const height = compact ? 148 : 270
  const color = COLORS[card.shape]
  return <button data-sound="none" className={`whot-card ${compact ? 'whot-card--hand' : 'whot-card--table'}`} disabled={disabled || !onClick} onClick={onClick ? event => onClick(event.currentTarget) : undefined} aria-label={`${card.shape} ${card.number}`} style={{
    width, height, flex: `0 0 ${width}px`, position: 'relative', borderRadius: compact ? 12 : 20, border: `2px solid ${color}`,
    background: '#fff9e9', color, padding: 0, boxShadow: disabled ? 'none' : '0 12px 34px rgba(0,0,0,.28)',
    cursor: onClick && !disabled ? 'pointer' : 'default', opacity: disabled ? .42 : 1, transform: disabled ? 'none' : undefined,
  }}>
    <span className="font-anton" style={{ position: 'absolute', left: compact ? 8 : 13, top: compact ? 5 : 9, fontSize: compact ? 23 : 34, lineHeight: 1 }}>{card.number}</span>
    <span style={{ position: 'absolute', left: compact ? 10 : 17, top: compact ? 31 : 48 }}><Shape shape={card.shape} size={compact ? 15 : 22} /></span>
    <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', display: 'grid', placeItems: 'center' }}><Shape shape={card.shape} size={compact ? 54 : 102} /></span>
    <span className="font-anton" style={{ position: 'absolute', right: compact ? 8 : 13, bottom: compact ? 5 : 9, fontSize: compact ? 23 : 34, lineHeight: 1, transform: 'rotate(180deg)' }}>{card.number}</span>
  </button>
}

function RulesSetup({ initialRules, playerCount, onBack, onRulesChange, onStart }: { initialRules: WhotRules; playerCount: number; onBack: () => void; onRulesChange: (rules: WhotRules) => void; onStart: (rules: WhotRules) => void }) {
  const [rules, setRulesState] = useState(initialRules)
  const [openSection, setOpenSection] = useState<'actions' | 'draw' | null>('actions')
  const [openHelp, setOpenHelp] = useState<'stacking' | 'cancel' | null>(null)
  const [startingCardsInput, setStartingCardsInput] = useState(String(initialRules.startingCards))
  const maxStartingCards = Math.max(1, Math.floor(53 / Math.max(2, playerCount)))
  const setRules = (update: WhotRules | ((current: WhotRules) => WhotRules)) => setRulesState(current => {
    const next = typeof update === 'function' ? update(current) : update
    onRulesChange(next)
    return next
  })
  const commitStartingCards = () => {
    const parsed = Number.parseInt(startingCardsInput, 10)
    const value = Number.isFinite(parsed) ? Math.min(maxStartingCards, Math.max(1, parsed)) : initialRules.startingCards
    setStartingCardsInput(String(value))
    setRules(current => ({ ...current, startingCards: value }))
  }
  const toggle = (key: keyof WhotRules) => setRules(current => ({ ...current, [key]: !current[key] }))
  const Switch = ({ name, label }: { name: keyof WhotRules; label: string }) => <button type="button" role="switch" aria-checked={Boolean(rules[name])} onClick={() => toggle(name)} style={{ minHeight: 48, padding: '11px 13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,.1)', borderRadius: 11, background: '#070708', color: '#fff' }}><span style={{ font: "14px 'Satoshi',sans-serif" }}>{label}</span><span aria-hidden="true" style={{ width: 40, height: 23, padding: 3, borderRadius: 20, background: rules[name] ? '#E52B2B' : '#414149', boxSizing: 'border-box', transition: 'background .2s' }}><i style={{ display: 'block', width: 17, height: 17, borderRadius: '50%', background: '#fff', transform: rules[name] ? 'translateX(17px)' : 'none', transition: 'transform .2s' }} /></span></button>
  const responseOptions: { value: WhotRules['stacking']; title: string; summary: string }[] = [
    { value: 'same', title: 'Matching cards only', summary: '+2 on +2 · +3 on +3' },
    { value: 'mixed', title: 'Mix Pick Two & Three', summary: 'Either card can stack' },
    { value: 'off', title: 'No stacking', summary: 'Next player draws' },
  ]
  const HelpButton = ({ name, label }: { name: 'stacking' | 'cancel'; label: string }) => <button type="button" aria-label={label} aria-expanded={openHelp === name} onClick={() => setOpenHelp(current => current === name ? null : name)} style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', padding: 0, border: 0, borderRadius: '50%', background: 'transparent', color: '#919299' }}><InformationRegular size={18} /></button>
  const SectionHeader = ({ section, title }: { section: 'actions' | 'draw'; title: string }) => <button type="button" aria-expanded={openSection === section} onClick={() => { setOpenSection(current => current === section ? null : section); setOpenHelp(null) }} style={{ width: '100%', minHeight: 50, padding: '12px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, textAlign: 'left', border: 0, background: 'transparent', color: '#fff' }}><b style={{ font: "15px 'Satoshi',sans-serif" }}>{title}</b><DownSmallRegular size={20} aria-hidden="true" style={{ color: '#999aa1', transition: 'transform .2s', transform: openSection === section ? 'rotate(180deg)' : 'none' }} /></button>
  return <main className="screen-enter" style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '28px 16px 72px' }}><section style={{ width: 'min(560px,100%)', display: 'grid', gap: 14 }}>
    <div><h1 className="font-anton" style={{ margin: 0, color: '#fff', fontSize: 42 }}>HOUSE RULES</h1><p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,.56)', font: "15px/1.5 'Satoshi',sans-serif" }}>Set the rules your group wants to play with.</p></div>
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 14px', borderRadius: 12, background: '#070708', border: '1px solid rgba(255,255,255,.1)' }}><span><strong style={{ display: 'block', color: '#fff', font: "15px 'Satoshi',sans-serif" }}>Cards per player</strong><small style={{ display: 'block', marginTop: 3, color: 'rgba(255,255,255,.46)', font: "12px 'Satoshi',sans-serif" }}>Enter 1–{maxStartingCards} for {playerCount} players</small></span><input aria-label="Cards per player" inputMode="numeric" type="number" min={1} max={maxStartingCards} value={startingCardsInput} onChange={event => setStartingCardsInput(event.target.value.replace(/[^0-9]/g, ''))} onBlur={commitStartingCards} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur() }} style={{ width: 72, height: 44, boxSizing: 'border-box', borderRadius: 10, border: '1px solid rgba(255,255,255,.2)', background: '#18191e', color: '#fff', textAlign: 'center', font: "22px 'Anton SC',sans-serif", outline: 'none' }} /></label>
    <div style={{ border: '1px solid rgba(255,255,255,.1)', borderRadius: 13, background: 'rgba(7,7,8,.82)', overflow: 'hidden' }}><SectionHeader section="actions" title="Action cards" />{openSection === 'actions' ? <div className="whot-rules-grid" style={{ padding: '0 10px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}><Switch name="pickTwo" label="Pick Two" /><Switch name="pickThree" label="Pick Three" /><Switch name="holdOn" label="Hold On" /><Switch name="suspension" label="Suspension" /><Switch name="generalMarket" label="General Market" /><Switch name="lastCardCall" label="Last-card call" /></div> : null}</div>
    <div style={{ border: '1px solid rgba(255,255,255,.1)', borderRadius: 13, background: 'rgba(7,7,8,.82)', overflow: 'hidden' }}><SectionHeader section="draw" title="Draw rules" />{openSection === 'draw' ? <div style={{ padding: '0 10px 10px', display: 'grid', gap: 10 }}><div><div style={{ minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><strong style={{ color: '#fff', font: "14px 'Satoshi',sans-serif" }}>Can players stack draw cards?</strong><HelpButton name="stacking" label="Explain draw stacking" /></div>{openHelp === 'stacking' ? <p role="note" style={{ margin: '0 2px 9px', color: 'rgba(255,255,255,.52)', font: "12px/1.45 'Satoshi',sans-serif" }}>A stacked draw card passes the turn and adds to the penalty. Matching mode allows +2 on +2 and +3 on +3. Mixed mode allows either card. The first player who cannot stack draws the full total.</p> : null}<div className="whot-stacking-options" role="radiogroup" aria-label="Draw stacking rule" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>{responseOptions.map(option => <button key={option.value} type="button" role="radio" aria-checked={rules.stacking === option.value} onClick={() => setRules(current => ({ ...current, stacking: option.value }))} style={{ minHeight: 54, padding: '8px 10px', borderRadius: 10, border: `1px solid ${rules.stacking === option.value ? '#8f9098' : 'rgba(255,255,255,.1)'}`, background: rules.stacking === option.value ? '#303138' : '#070708', color: '#fff', textAlign: 'left' }}><span style={{ display: 'grid', gridTemplateColumns: '16px minmax(0,1fr)', columnGap: 7, alignItems: 'start' }}><span aria-hidden="true" style={{ boxSizing: 'border-box', display: 'block', width: 16, height: 16, borderRadius: '50%', border: `2px solid ${rules.stacking === option.value ? '#fff' : '#686971'}`, boxShadow: rules.stacking === option.value ? 'inset 0 0 0 3px #303138' : 'none', background: rules.stacking === option.value ? '#fff' : 'transparent' }} /><span><span style={{ display: 'block', font: "13px/1.2 'Satoshi',sans-serif" }}>{option.title}</span><small style={{ display: 'block', marginTop: 3, color: 'rgba(255,255,255,.45)', font: "11px/1.2 'Satoshi',sans-serif" }}>{option.summary}</small></span></span></button>)}</div></div><div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 10 }}><div style={{ width: '100%', minHeight: 56, boxSizing: 'border-box', padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderRadius: 10, background: '#070708', border: '1px solid rgba(255,255,255,.1)' }}><div style={{ minWidth: 0 }}><strong style={{ display: 'block', color: '#fff', font: "14px/1.2 'Satoshi',sans-serif" }}>Whot 20 cancels draws</strong><p style={{ margin: '1px 0 0', color: 'rgba(255,255,255,.46)', font: "11px/1.3 'Satoshi',sans-serif" }}>Clears the penalty, then calls a shape.</p></div><HelpButton name="cancel" label="Explain Whot 20 draw cancellation" /><button type="button" role="switch" aria-label="Whot 20 cancels draws" aria-checked={rules.whotCancelsPenalty} onClick={() => toggle('whotCancelsPenalty')} style={{ flex: '0 0 auto', width: 40, height: 23, padding: 3, border: 0, borderRadius: 20, background: rules.whotCancelsPenalty ? '#7c7d85' : '#303138', boxSizing: 'border-box' }}><i aria-hidden="true" style={{ display: 'block', width: 17, height: 17, borderRadius: '50%', background: '#fff', transform: rules.whotCancelsPenalty ? 'translateX(17px)' : 'none', transition: '.2s' }} /></button></div>{openHelp === 'cancel' ? <p role="note" style={{ margin: '6px 4px 0', color: 'rgba(255,255,255,.52)', font: "12px/1.45 'Satoshi',sans-serif" }}>When a draw penalty is active, Whot 20 clears the full penalty. The same player then chooses a shape before play moves to the next player.</p> : null}</div></div> : null}</div>
    <div style={{ display: 'flex', gap: 10 }}><button className="game-btn" onClick={onBack} style={{ flex: 1, border: '1px solid #fff', background: 'transparent', color: '#fff', borderRadius: 999, padding: 13 }}>BACK</button><button className="game-btn-primary font-staatliches" onClick={() => onStart(rules)} style={{ flex: 1, border: 0, background: '#dc2827', color: '#fff', borderRadius: 999, padding: 13, fontSize: 17 }}>CONTINUE</button></div>
  </section></main>
}

function FinishModeSetup({ initialMode, onBack, onStart }: { initialMode: WhotRules['finishMode']; onBack: () => void; onStart: (mode: WhotRules['finishMode']) => void }) {
  const [mode, setMode] = useState(initialMode ?? 'first-out')
  const options: { value: WhotRules['finishMode']; title: string; description: string }[] = [
    { value: 'first-out', title: 'First Out', description: 'The first player to clear their hand wins. The game ends immediately.' },
    { value: 'ranking', title: 'Full Ranking', description: 'Players who finish are ranked while everyone else keeps playing.' },
  ]
  return <main className="screen-enter" style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '28px 16px 72px' }}><section style={{ width: 'min(560px,100%)', display: 'grid', gap: 18 }}>
    <div><h1 className="font-anton" style={{ margin: 0, color: '#fff', fontSize: 42 }}>CHOOSE A GAME STYLE</h1><p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,.56)', font: "15px/1.5 'Satoshi',sans-serif" }}>Decide what happens when a player runs out of cards.</p></div>
    <div role="radiogroup" aria-label="Game finish style" style={{ display: 'grid', gap: 10 }}>{options.map(option => {
      const selected = mode === option.value
      return <button key={option.value} type="button" role="radio" aria-checked={selected} onClick={() => setMode(option.value)} style={{ minHeight: 92, padding: '16px', display: 'grid', gridTemplateColumns: '22px 1fr', alignItems: 'start', gap: 12, borderRadius: 14, border: `1px solid ${selected ? '#fff' : 'rgba(255,255,255,.12)'}`, background: selected ? '#303138' : '#070708', color: '#fff', textAlign: 'left' }}>
        <span aria-hidden="true" style={{ boxSizing: 'border-box', width: 19, height: 19, marginTop: 2, borderRadius: '50%', border: `2px solid ${selected ? '#fff' : '#686971'}`, background: selected ? '#dc2827' : 'transparent', boxShadow: selected ? 'inset 0 0 0 4px #303138' : 'none' }} />
        <span><strong className="font-staatliches" style={{ display: 'block', fontSize: 21, letterSpacing: '.03em' }}>{option.title}</strong><small style={{ display: 'block', marginTop: 4, color: 'rgba(255,255,255,.55)', font: "13px/1.45 'Satoshi',sans-serif" }}>{option.description}</small></span>
      </button>
    })}</div>
    <div style={{ display: 'flex', gap: 10 }}><button className="game-btn" onClick={onBack} style={{ flex: 1, border: '1px solid #fff', background: 'transparent', color: '#fff', borderRadius: 999, padding: 13 }}>BACK</button><button className="game-btn-primary font-staatliches" onClick={() => onStart(mode)} style={{ flex: 1, border: 0, background: '#dc2827', color: '#fff', borderRadius: 999, padding: 13, fontSize: 17 }}>DEAL CARDS</button></div>
  </section></main>
}

type CardFlight = {
  id: number
  card?: WhotCard
  back?: boolean
  from: DOMRect
  to: DOMRect
  delay: number
  startScale: number
  endScale: number
}

function FlightLayer({ flights }: { flights: CardFlight[] }) {
  return <div aria-hidden="true" className="whot-flight-layer">{flights.map(flight => {
    const width = flight.back ? 88 : 104
    const height = flight.back ? 126 : 148
    const fromX = flight.from.left + flight.from.width / 2 - width / 2
    const fromY = flight.from.top + flight.from.height / 2 - height / 2
    const toX = flight.to.left + flight.to.width / 2 - width / 2
    const toY = flight.to.top + flight.to.height / 2 - height / 2
    const style = {
      left: fromX,
      top: fromY,
      width,
      height,
      '--whot-flight-x': `${toX - fromX}px`,
      '--whot-flight-y': `${toY - fromY}px`,
      '--whot-flight-delay': `${flight.delay}ms`,
      '--whot-flight-start-scale': flight.startScale,
      '--whot-flight-scale': flight.endScale,
    } as CSSProperties
    return <div key={flight.id} className="whot-flight" style={style}>
      {flight.back ? <div className={`whot-flight-flip ${flight.card ? 'whot-flight-flip--reveal' : ''}`}><div className="whot-flight-face whot-flight-back"><span className="font-anton">WHOT</span></div>{flight.card ? <div className="whot-flight-face whot-flight-front"><WhotCardView card={flight.card} compact /></div> : null}</div> : flight.card ? <WhotCardView card={flight.card} compact /> : null}
    </div>
  })}</div>
}

function GameTable({ state, viewerId, passAndPlay, onChange, onPlayAgain, onExit }: { state: WhotState; viewerId: string; passAndPlay: boolean; onChange: (next: WhotState) => void; onPlayAgain: () => void; onExit: () => void }) {
  const active = currentPlayer(state)
  const viewer = state.players.find(player => player.id === viewerId)!
  const hand = state.hands[viewerId] ?? []
  const isTurn = active?.id === viewerId
  const [revealed, setRevealed] = useState(!passAndPlay)
  const [seenTurn, setSeenTurn] = useState(state.turn)
  const [seenPlayerId, setSeenPlayerId] = useState(active.id)
  const [flights, setFlights] = useState<CardFlight[]>([])
  const [animating, setAnimating] = useState(false)
  const [drawPlaceholders, setDrawPlaceholders] = useState(0)
  const [visualTop, setVisualTop] = useState(topCard(state))
  const { play: playSound } = useSound()
  const discardRef = useRef<HTMLDivElement>(null)
  const drawRef = useRef<HTMLButtonElement>(null)
  const handRef = useRef<HTMLDivElement>(null)
  const drawSlotRefs = useRef<Array<HTMLDivElement | null>>([])
  const playerRefs = useRef<Record<string, HTMLSpanElement | null>>({})
  const previousState = useRef(state)
  const skipNextStateAnimation = useRef(false)
  const flightId = useRef(0)

  const addFlight = (from: DOMRect, to: DOMRect, options: { card?: WhotCard; back?: boolean; delay?: number; endScale?: number } = {}) => {
    const id = ++flightId.current
    const delay = options.delay ?? 0
    const baseWidth = options.back ? 88 : 104
    const baseHeight = options.back ? 126 : 148
    const startScale = Math.min(1, Math.max(.28, Math.min(from.width / baseWidth, from.height / baseHeight)))
    const endScale = options.endScale ?? (options.card && !options.back ? Math.min(to.width / baseWidth, to.height / baseHeight) : 1)
    setFlights(current => [...current, { id, from, to, card: options.card, back: options.back, delay, startScale, endScale }])
    if (options.card) window.setTimeout(() => haptic(options.back ? 'light' : 'medium'), (options.back ? 920 : 520) + delay)
    const lifetime = options.back && options.card ? 1080 : 690
    window.setTimeout(() => setFlights(current => current.filter(flight => flight.id !== id)), lifetime + delay)
  }
  const motionDelay = (duration: number) => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? Promise.resolve() : new Promise<void>(resolve => window.setTimeout(resolve, duration))
  const nextFrame = () => new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()))

  useEffect(() => {
    if (state.winnerId) haptic('celebrate')
  }, [state.winnerId])

  useEffect(() => {
    if (seenTurn === state.turn) return
    setSeenTurn(state.turn)
    const playerChanged = seenPlayerId !== active.id
    setSeenPlayerId(active.id)
    setRevealed(!passAndPlay || !playerChanged)
  }, [active.id, passAndPlay, seenPlayerId, seenTurn, state.turn])

  useEffect(() => {
    const previous = previousState.current
    previousState.current = state
    if (previous === state) return
    if (skipNextStateAnimation.current) {
      skipNextStateAnimation.current = false
      setVisualTop(topCard(state))
      return
    }
    if (passAndPlay) {
      setVisualTop(topCard(state))
      return
    }
    const deckRect = drawRef.current?.getBoundingClientRect()
    const discardRect = discardRef.current?.getBoundingClientRect()
    const previousTop = topCard(previous)
    const nextTop = topCard(state)
    if (discardRect && previousTop?.id !== nextTop?.id) {
      const sourcePlayer = currentPlayer(previous)
      const sourceRect = playerRefs.current[sourcePlayer?.id]?.getBoundingClientRect()
      setVisualTop(previousTop)
      if (sourceRect) {
        addFlight(sourceRect, discardRect, { card: nextTop })
        playSound('card.next')
        window.setTimeout(() => setVisualTop(nextTop), 620)
      } else setVisualTop(nextTop)
    } else {
      setVisualTop(nextTop)
    }
    if (deckRect) {
      let drewCards = false
      state.players.forEach((player, playerIndex) => {
        const gained = (state.hands[player.id]?.length ?? 0) - (previous.hands[player.id]?.length ?? 0)
        if (gained <= 0) return
        drewCards = true
        const target = player.id === viewerId ? handRef.current?.getBoundingClientRect() : playerRefs.current[player.id]?.getBoundingClientRect()
        if (!target) return
        for (let index = 0; index < gained; index += 1) addFlight(deckRect, target, { back: true, delay: playerIndex * 60 + index * 70 })
      })
      if (drewCards) playSound('card.flip')
    }
  }, [passAndPlay, playSound, state, viewerId])

  const playCard = async (card: WhotCard, element: HTMLButtonElement) => {
    if (animating) return
    const next = playWhotCard(state, viewerId, card.id)
    if (next === state) return
    setAnimating(true)
    playSound('card.next')
    const destination = discardRef.current?.getBoundingClientRect()
    if (destination) {
      addFlight(element.getBoundingClientRect(), destination, { card })
      await motionDelay(620)
    }
    if (card.number === 14 && state.rules.generalMarket) {
      const deckRect = drawRef.current?.getBoundingClientRect()
      if (deckRect) {
        let index = 0
        state.players.filter(player => player.id !== viewerId).forEach(player => {
          const target = playerRefs.current[player.id]?.getBoundingClientRect()
          if (target) addFlight(deckRect, target, { back: true, delay: index++ * 90 })
        })
        await motionDelay(Math.min(520, 300 + index * 70))
      }
    }
    skipNextStateAnimation.current = true
    onChange(next)
    setAnimating(false)
  }

  const drawCards = async () => {
    if (animating) return
    const next = drawForWhotTurn(state, viewerId)
    if (next === state) return
    setAnimating(true)
    playSound('card.flip')
    const source = drawRef.current?.getBoundingClientRect()
    const count = Math.max(1, (next.hands[viewerId]?.length ?? 0) - hand.length)
    const drawnCards = (next.hands[viewerId] ?? []).slice(hand.length)
    setDrawPlaceholders(count)
    await nextFrame()
    if (source) {
      for (let index = 0; index < count; index += 1) {
        const target = drawSlotRefs.current[index]?.getBoundingClientRect()
        if (!target) continue
        const endScale = Math.min(target.width / 88, target.height / 126)
        addFlight(source, target, { back: true, card: drawnCards[index], delay: index * 90, endScale })
      }
      await motionDelay(Math.min(1400, 1030 + Math.max(0, count - 1) * 90))
    }
    skipNextStateAnimation.current = true
    onChange(next)
    setDrawPlaceholders(0)
    setAnimating(false)
  }

  if (state.winnerId) {
    const winner = state.players.find(player => player.id === state.winnerId)
    if ((state.rules.finishMode ?? 'first-out') === 'ranking') {
      const rankings = (state.finishOrder ?? []).map(id => state.players.find(player => player.id === id)).filter((player): player is NonNullable<typeof player> => Boolean(player))
      return <main className="whot-result screen-enter" style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '36px 20px 72px', textAlign: 'center' }}><div style={{ width: 'min(440px,100%)', display: 'grid', justifyItems: 'center', gap: 16 }}><img src="/icons/trophy.svg" alt="" style={{ width: 68, height: 68 }} /><div><p className="font-staatliches" style={{ margin: 0, color: '#dc2827', letterSpacing: '.14em' }}>GAME COMPLETE</p><h1 className="font-anton" style={{ color: '#fff', fontSize: 52, margin: '5px 0 0' }}>FINAL RANKING</h1><p style={{ margin: '7px 0 0', color: 'rgba(255,255,255,.55)', font: "15px 'Satoshi',sans-serif" }}>{winner?.name} cleared their hand first.</p></div><ol style={{ width: '100%', listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>{rankings.map((player, index) => <li key={player.id} style={{ minHeight: 52, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, background: index === 0 ? '#dc2827' : '#070708', color: '#fff' }}><strong className="font-anton" style={{ width: 34, fontSize: 22 }}>#{index + 1}</strong><span style={{ width: 12, height: 12, borderRadius: '50%', background: player.color }} /><span style={{ font: "15px 'Satoshi',sans-serif" }}>{player.name}</span>{index === 0 ? <img src="/icons/trophy.svg" alt="Winner" style={{ width: 21, height: 21, marginLeft: 'auto' }} /> : null}</li>)}</ol><div className="whot-result-actions" style={{ width: '100%', display: 'flex', gap: 10 }}><button className="game-btn" onClick={onExit} style={{ flex: 1, border: '1px solid #fff', borderRadius: 999, padding: '13px 20px', background: 'transparent', color: '#fff' }}>BACK TO GAMES</button><button className="game-btn-primary" onClick={onPlayAgain} style={{ flex: 1, border: 0, borderRadius: 999, padding: '13px 20px', background: '#dc2827', color: '#fff' }}><PlayAgainLabel /></button></div></div></main>
    }
    return <main className="whot-result screen-enter" style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '36px 20px 72px', textAlign: 'center' }}><div style={{ width: 'min(440px,100%)', display: 'grid', justifyItems: 'center', gap: 20 }}><img src="/icons/trophy.svg" alt="" style={{ width: 76, height: 76 }} /><div><p className="font-staatliches" style={{ margin: 0, color: '#dc2827', letterSpacing: '.14em' }}>WE HAVE A WINNER</p><h1 className="font-anton" style={{ color: '#fff', fontSize: 56, lineHeight: 1.05, margin: '6px 0 0' }}>{winner?.name.toUpperCase()} WINS!</h1><p style={{ margin: '9px 0 0', color: 'rgba(255,255,255,.55)', font: "15px 'Satoshi',sans-serif" }}>First to clear every card. That was Whot.</p></div>{winner ? <div style={{ minHeight: 54, padding: '8px 18px', display: 'inline-flex', alignItems: 'center', gap: 10, border: '1px dashed rgba(255,255,255,.16)', borderRadius: 999, background: '#070708' }}><span style={{ width: 30, height: 30, borderRadius: '50%', background: winner.color }} /><strong className="font-staatliches" style={{ color: '#fff', fontSize: 18, letterSpacing: '.04em' }}>{winner.name}</strong><img src="/icons/trophy.svg" alt="Winner" style={{ width: 22, height: 22 }} /></div> : null}<div className="whot-result-actions" style={{ width: '100%', display: 'flex', gap: 10 }}><button className="game-btn" onClick={onExit} style={{ flex: 1, border: '1px solid #fff', borderRadius: 999, padding: '13px 20px', background: 'transparent', color: '#fff' }}>BACK TO GAMES</button><button className="game-btn-primary" onClick={onPlayAgain} style={{ flex: 1, border: 0, borderRadius: 999, padding: '13px 20px', background: '#dc2827', color: '#fff' }}><PlayAgainLabel /></button></div></div></main>
  }
  if (passAndPlay && isTurn && (!revealed || seenTurn !== state.turn)) return <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}><div><p className="font-staatliches" style={{ color: '#dc2827', letterSpacing: '.12em' }}>PASS THE PHONE</p><h1 className="font-anton" style={{ color: '#fff', fontSize: 44, margin: '8px 0' }}>{active.name.toUpperCase()}'S TURN</h1><p style={{ color: 'rgba(255,255,255,.55)', font: "15px 'Satoshi',sans-serif" }}>Make sure nobody else can see your hand.</p><button className="game-btn-primary" onClick={() => setRevealed(true)} style={{ marginTop: 18, border: 0, borderRadius: 999, padding: '13px 26px', background: '#dc2827', color: '#fff' }}>SHOW MY CARDS</button></div></main>

  return <main className="whot-table" style={{ flex: '1 0 auto', minHeight: 'calc(100dvh - 72px)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '14px 16px 32px', overflowX: 'hidden' }}>
    <FlightLayer flights={flights} />
    <div style={{ width: 'min(980px,100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><div><strong className="font-anton" style={{ color: '#fff', fontSize: 20 }}>{active.name.toUpperCase()}'S TURN</strong><p style={{ margin: 2, color: 'rgba(255,255,255,.54)', font: "13px 'Satoshi',sans-serif" }}>{state.message}</p></div><div style={{ display: 'flex', gap: 6 }}>{state.players.map(player => { const place = (state.finishOrder ?? []).indexOf(player.id); return <span ref={element => { playerRefs.current[player.id] = element }} key={player.id} title={place >= 0 ? `${player.name} finished #${place + 1}` : player.name} style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: '50%', background: place >= 0 ? '#414149' : player.color, color: '#fff', font: "12px 'Anton SC',sans-serif", outline: player.id === active.id ? '3px solid #fff' : 'none' }}>{place >= 0 ? `#${place + 1}` : state.hands[player.id].length}</span> })}</div></div>
    <div className="whot-board" style={{ display: 'flex', alignItems: 'center', gap: 24 }}><button data-sound="none" ref={drawRef} className="whot-draw" disabled={!isTurn || animating} onClick={drawCards} style={{ width: 116, height: 166, borderRadius: 14, border: '2px solid #f7f1df', background: '#35152d', color: '#f7f1df', font: "24px 'Anton SC',sans-serif", boxShadow: '0 14px 35px rgba(0,0,0,.35)' }}>DRAW<br /><small style={{ fontSize: 12 }}>{state.drawPile.length} LEFT</small></button><div ref={discardRef}><WhotCardView card={visualTop} /></div><div className="whot-status" style={{ width: 116, color: '#fff', font: "14px/1.4 'Satoshi',sans-serif" }}>{state.requestedShape ? <>CALLED<br /><b className="font-anton" style={{ fontSize: 20 }}>{state.requestedShape.toUpperCase()}</b></> : state.pendingDraw ? <>PENALTY<br /><b className="font-anton" style={{ color: '#dc2827', fontSize: 26 }}>PICK {state.pendingDraw}</b></> : 'MATCH SHAPE OR NUMBER'}</div></div>
    {state.awaitingShape && isTurn ? <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>{SHAPES.map(shape => <button key={shape} onClick={() => onChange(chooseWhotShape(state, viewerId, shape))} style={{ width: 58, height: 58, display: 'grid', placeItems: 'center', borderRadius: 12, background: '#fff9e9', border: `2px solid ${COLORS[shape]}` }}><Shape shape={shape} size={28} /></button>)}</div> : null}
    <div ref={handRef} style={{ width: 'min(100%,980px)', marginTop: 'auto' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><span className="font-staatliches" style={{ color: '#fff', letterSpacing: '.08em' }}>{viewer.name.toUpperCase()} · {hand.length + drawPlaceholders} CARDS</span>{isTurn && state.rules.lastCardCall && hand.length === 2 ? <button className="whot-last-card" disabled={animating} onClick={() => onChange(declareLastCard(state, viewerId))} style={{ border: 0, borderRadius: 999, padding: '8px 14px', background: state.lastCardDeclared[viewerId] ? '#22a66f' : '#dc2827', color: '#fff' }}>{state.lastCardDeclared[viewerId] ? 'LAST CARD CALLED' : 'CALL LAST CARD'}</button> : null}</div><div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 2px 18px' }}>{hand.map(card => <WhotCardView key={card.id} compact card={card} disabled={animating || !isTurn || !canPlayWhotCard(state, card)} onClick={element => playCard(card, element)} />)}{Array.from({ length: drawPlaceholders }, (_, index) => <div key={`draw-slot-${index}`} ref={element => { drawSlotRefs.current[index] = element }} className="whot-draw-slot" />)}</div></div>
  </main>
}

export default function WhotGame({ onClose }: { onClose: () => void }) {
  const multiplayer = useMultiplayerSession()
  const [localStep, setLocalStep] = useState<'players' | 'rules' | 'mode' | 'game'>('players')
  const [localPlayers, setLocalPlayers] = useState<Player[]>([])
  const [localRules, setLocalRules] = useState<WhotRules>(CLASSIC_WHOT_RULES)
  const [localState, setLocalState] = useState<WhotState | null>(null)
  const localStartedAt = useRef<number | null>(null)
  const trackedWinner = useRef<string | null>(null)
  const remoteState = multiplayer?.values.whotState as WhotState | undefined
  const setRemote = multiplayer ? (next: WhotState) => multiplayer.setValue('whotState', next) : undefined
  const remotePlayers = useMemo(() => multiplayer?.players?.map(player => ({ id: player.userId, name: player.name, color: player.color })) ?? [], [multiplayer?.players])
  const state = multiplayer ? remoteState : localState ?? undefined
  const viewerId = multiplayer?.currentUserId ?? (state ? currentPlayer(state).id : '')
  const step = multiplayer ? (state ? 'game' : localStep === 'mode' ? 'mode' : 'rules') : localStep

  useEffect(() => {
    if (multiplayer || !state?.winnerId || trackedWinner.current === state.winnerId) return
    trackedWinner.current = state.winnerId
    track('game_completed', { game_id: 'whot', play_mode: 'pass_and_play', completion_reason: 'winner_declared', cards_presented: state.turn, cards_skipped: 0, rounds_completed: state.turn, duration_seconds: Math.max(0, Math.floor((Date.now() - (localStartedAt.current ?? Date.now())) / 1000)), player_count: state.players.length })
  }, [multiplayer, state])
  return <div className="game-fullscreen"><GameNav onBack={onClose} />
    {step === 'players' ? <PlayerSetup initialPlayers={localPlayers} minPlayers={2} skipLabel="BACK" onSkip={onClose} onNext={players => { setLocalPlayers(players); setLocalStep('rules') }} /> : null}
    {step === 'rules' ? <RulesSetup initialRules={localRules} playerCount={(multiplayer ? remotePlayers : localPlayers).length} onRulesChange={setLocalRules} onBack={() => multiplayer ? onClose() : setLocalStep('players')} onStart={rules => { setLocalRules(rules); setLocalStep('mode') }} /> : null}
    {step === 'mode' ? <FinishModeSetup initialMode={localRules.finishMode} onBack={() => setLocalStep('rules')} onStart={finishMode => { const rules = { ...localRules, finishMode }; setLocalRules(rules); const players = multiplayer ? remotePlayers : localPlayers.map((player, index) => ({ id: `local-${index}`, name: player.name, color: player.color })); const next = createWhotGame(players, rules); if (multiplayer) { setRemote?.(next); multiplayer.setValue('step', 'game') } else { localStartedAt.current = Date.now(); trackedWinner.current = null; track('player_setup_completed', { game_id: 'whot', play_mode: 'pass_and_play', player_count: players.length }); track('deck_configured', { game_id: 'whot', requested_card_count: 54, actual_card_count: 54, built_in_card_count: 54, custom_card_count: 0, mode_ids: [finishMode] }); track('game_started', { game_id: 'whot', play_mode: 'pass_and_play', starting_step: 'game', configured_card_count: 54, player_count: players.length }); setLocalState(next); setLocalStep('game') } }} /> : null}
    {step === 'game' && state ? <GameTable state={state} viewerId={viewerId} passAndPlay={!multiplayer} onChange={next => multiplayer ? setRemote?.(next) : setLocalState(next)} onPlayAgain={() => { if (multiplayer && multiplayer.currentUserId !== multiplayer.hostUserId) { multiplayer.setValue('step', 'game'); return } const next = createWhotGame(state.players, state.rules); if (multiplayer) { setRemote?.(next); multiplayer.setValue('step', 'game') } else { localStartedAt.current = Date.now(); trackedWinner.current = null; track('game_started', { game_id: 'whot', play_mode: 'pass_and_play', starting_step: 'game', configured_card_count: 54, player_count: state.players.length }); setLocalState(next) } }} onExit={onClose} /> : null}
    <GameFooter /><style>{`.whot-last-card{padding:7px 12px!important;font-size:12px!important;white-space:nowrap}.whot-draw-slot{width:104px;height:148px;flex:0 0 104px;box-sizing:border-box;border:1px dashed rgba(255,255,255,.16);border-radius:12px;background:rgba(255,255,255,.025)}.whot-flight-layer{position:fixed;inset:0;pointer-events:none;z-index:10000;overflow:hidden}.whot-flight{position:fixed;animation:whot-card-flight 640ms cubic-bezier(.2,.72,.22,1) var(--whot-flight-delay) both;filter:drop-shadow(0 16px 22px rgba(0,0,0,.38));will-change:transform,opacity}.whot-flight>.whot-card{width:100%!important;height:100%!important;min-height:0!important}.whot-flight-flip{position:relative;width:100%;height:100%;transform-style:preserve-3d}.whot-flight-flip--reveal{animation:whot-card-reveal 1000ms cubic-bezier(.2,.72,.22,1) var(--whot-flight-delay) both}.whot-flight-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}.whot-flight-front{transform:rotateY(180deg)}.whot-flight-front>.whot-card{width:100%!important;height:100%!important;min-height:0!important}.whot-flight-back{width:100%;height:100%;display:grid;place-items:center;box-sizing:border-box;border:2px solid #f7f1df;border-radius:12px;background:#35152d;color:#f7f1df;box-shadow:0 12px 28px rgba(0,0,0,.32)}.whot-flight-back span{font-size:20px}@keyframes whot-card-reveal{0%,58%{transform:rotateY(0)}92%,100%{transform:rotateY(180deg)}}@keyframes whot-card-flight{0%{transform:translate3d(0,0,0) rotate(-3deg) scale(var(--whot-flight-start-scale));opacity:1}72%{opacity:1}84%{transform:translate3d(var(--whot-flight-x),var(--whot-flight-y),0) rotate(1deg) scale(var(--whot-flight-scale));opacity:1}92%{transform:translate3d(var(--whot-flight-x),var(--whot-flight-y),0) rotate(-.6deg) scale(var(--whot-flight-scale));opacity:1}100%{transform:translate3d(var(--whot-flight-x),var(--whot-flight-y),0) rotate(0) scale(var(--whot-flight-scale));opacity:1}}input[aria-label="Cards per player"]{appearance:textfield;-moz-appearance:textfield;padding:0!important;text-align:center!important}input[aria-label="Cards per player"]::-webkit-inner-spin-button,input[aria-label="Cards per player"]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}button[aria-label="Whot 20 cancels draws"]{min-width:40px!important;max-width:40px!important;min-height:23px!important;height:23px!important;align-self:center}button[aria-label="Whot 20 cancels draws"][aria-checked="true"]{background:#E52B2B!important}button[aria-label="Whot 20 cancels draws"][aria-checked="false"]{background:#414149!important}@media(prefers-reduced-motion:reduce){.whot-flight-layer{display:none}}@media(max-width:600px){.whot-rules-grid{grid-template-columns:1fr!important}.whot-stacking-options{grid-template-columns:1fr!important}.whot-table{min-height:calc(100dvh - 52px)!important;gap:12px!important;padding:10px 16px 18px!important}.whot-board{gap:10px!important;margin-top:18px!important}.whot-card--table{width:156px!important;height:223px!important;flex-basis:156px!important;border-radius:15px!important}.whot-draw{width:82px!important;height:120px!important;font-size:19px!important}.whot-status{width:82px!important;font-size:11px!important}.whot-card--hand{width:84px!important;height:120px!important;flex-basis:84px!important}.whot-draw-slot{width:84px;height:120px;flex-basis:84px}.whot-last-card{padding:6px 10px!important;font-size:10px!important;letter-spacing:.02em;white-space:nowrap}}`}</style>
  </div>
}
