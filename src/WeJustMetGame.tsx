import { useMemo } from 'react'
import { GameFooter, GameNav, PlayAgainLabel } from './components/GameShell'
import PlayerSetup, { type Player } from './components/PlayerSetup'
import DeckSize from './components/DeckSize'
import CustomCards from './components/CustomCards'
import { useGameStep, usePersistentGameState } from './hooks/usePersistentGameState'
import { useMultiplayerSession } from './multiplayer/SessionStateContext'
import { WE_JUST_MET_CATEGORIES, WE_JUST_MET_PROMPTS, type WeJustMetCategory } from './content/weJustMet'

const GAME_ID = 'we-just-met'
const STEPS = ['playerSetup', 'categories', 'deckSize', 'customCards', 'game', 'done'] as const
type Step = typeof STEPS[number]

const shuffle = <T,>(items: readonly T[]) => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

const primaryButton: React.CSSProperties = {
  border: 0, borderRadius: 999, minHeight: 48, padding: '0 26px', background: '#dc2827', color: '#fff',
  fontFamily: "'Staatliches', sans-serif", fontSize: 17, cursor: 'pointer', letterSpacing: '.03em',
}

const secondaryButton: React.CSSProperties = {
  ...primaryButton, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.75)',
}

function CategoryIllustration({ category, size = 58 }: { category: WeJustMetCategory; size?: number }) {
  const index = WE_JUST_MET_CATEGORIES.findIndex(item => item.id === category)
  const column = index % 3
  const row = Math.floor(index / 3)
  return <span aria-hidden="true" style={{ width: size, height: size, position: 'relative', overflow: 'hidden', flexShrink: 0 }}><img src="/assets/games/we-just-met-category-illustrations.png" alt="" style={{ position: 'absolute', width: size * 3, height: size * 2, maxWidth: 'none', left: -column * size, top: -row * size, objectFit: 'fill' }} /></span>
}

export default function WeJustMetGame({ onClose }: { onClose: () => void }) {
  const multiplayer = useMultiplayerSession()
  const isHost = !multiplayer || multiplayer.currentUserId === multiplayer.hostUserId
  const sessionPlayers = multiplayer?.players?.map(player => ({ name: player.name, color: player.color, userId: player.userId })) ?? []
  const [step, setStep] = useGameStep<Step>(GAME_ID, 'playerSetup', STEPS)
  const [players, setPlayers] = usePersistentGameState<Player[]>(GAME_ID, 'players', sessionPlayers)
  const [selectedCategories, setSelectedCategories] = usePersistentGameState<WeJustMetCategory[]>(GAME_ID, 'categories', ['easy'])
  const [deckSize, setDeckSize] = usePersistentGameState(GAME_ID, 'deckSize', 10)
  const [deck, setDeck] = usePersistentGameState<string[]>(GAME_ID, 'deck', [])
  const [customCards, setCustomCards] = usePersistentGameState<string[]>(GAME_ID, 'customCards', [])
  const [cardIndex, setCardIndex] = usePersistentGameState(GAME_ID, 'cardIndex', 0)
  const [playerIndex, setPlayerIndex] = usePersistentGameState(GAME_ID, 'playerIndex', 0)
  const [skipped, setSkipped] = usePersistentGameState(GAME_ID, 'skipped', 0)

  const activePlayers = multiplayer ? sessionPlayers : players
  const currentPlayer = activePlayers[playerIndex % Math.max(activePlayers.length, 1)]
  const currentUserCanControl = !multiplayer || currentPlayer?.userId === multiplayer.currentUserId || isHost
  const availableCount = useMemo(() => selectedCategories.reduce((total, category) => total + WE_JUST_MET_PROMPTS[category].length, 0), [selectedCategories])

  const toggleCategory = (category: WeJustMetCategory) => {
    setSelectedCategories(current => current.includes(category)
      ? current.length === 1 ? current : current.filter(item => item !== category)
      : [...current, category])
  }

  const buildDeck = (custom: string[]) => {
    const prompts = Array.from(new Set(selectedCategories.flatMap(category => WE_JUST_MET_PROMPTS[category])))
    const customUnique = Array.from(new Set(custom.map(card => card.trim()).filter(Boolean)))
    const builtInCount = Math.max(0, deckSize - customUnique.length)
    const nextDeck = shuffle([...shuffle(prompts).slice(0, builtInCount), ...customUnique]).slice(0, deckSize)
    setCustomCards(customUnique)
    setDeck(nextDeck)
    setCardIndex(0)
    setPlayerIndex(0)
    setSkipped(0)
    setStep('game')
  }

  const advance = (wasSkipped = false) => {
    if (!currentUserCanControl) return
    if (wasSkipped) setSkipped(value => value + 1)
    if (cardIndex + 1 >= deck.length) setStep('done')
    else {
      setCardIndex(value => value + 1)
      setPlayerIndex(value => (value + 1) % Math.max(activePlayers.length, 1))
    }
  }

  const restart = () => {
    setDeck([])
    setCardIndex(0)
    setPlayerIndex(0)
    setSkipped(0)
    setStep(multiplayer ? 'categories' : 'playerSetup')
  }

  let content: React.ReactNode
  if (step === 'playerSetup' && !multiplayer) {
    content = <PlayerSetup initialPlayers={players} minPlayers={2} skipLabel="GO BACK" onSkip={onClose} onNext={nextPlayers => { setPlayers(nextPlayers); setStep('categories') }} />
  } else if (step === 'categories') {
    content = <div className="screen-enter" style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '36px 16px 64px' }}>
      <section style={{ width: 'min(680px, 100%)', display: 'grid', gap: 26, textAlign: 'center' }}>
        <div><h1 className="font-anton" style={{ margin: 0, color: '#fff', fontSize: 38 }}>WHAT DO YOU WANT TO TALK ABOUT?</h1><p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,.55)', font: "15px 'Satoshi', sans-serif" }}>Pick one or mix a few. You can choose something different next time.</p></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
          {WE_JUST_MET_CATEGORIES.map(category => { const selected = selectedCategories.includes(category.id); return <button key={category.id} type="button" aria-pressed={selected} onClick={() => toggleCategory(category.id)} style={{ minHeight: 94, padding: '10px 14px', borderRadius: 14, border: selected ? `2px solid ${category.color}` : '1px dashed rgba(255,255,255,.16)', background: selected ? `${category.color}12` : '#070708', color: '#fff', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11 }}><CategoryIllustration category={category.id} /><span style={{ display: 'grid', gap: 5 }}><span className="font-anton" style={{ fontSize: 18 }}>{category.label.toUpperCase()}</span><span style={{ color: 'rgba(255,255,255,.52)', font: "13px/1.35 'Satoshi', sans-serif" }}>{category.description}</span></span></button> })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 9 }}><button style={secondaryButton} onClick={() => multiplayer ? onClose() : setStep('playerSetup')}>{multiplayer ? 'LEAVE ROOM' : 'GO BACK'}</button><button style={primaryButton} onClick={() => setStep('deckSize')}>NEXT</button></div>
      </section>
    </div>
  } else if (step === 'deckSize') {
    content = <DeckSize onBack={() => setStep('categories')} onNext={size => { setDeckSize(Math.min(size, availableCount)); setStep('customCards') }} nextLabel="NEXT" />
  } else if (step === 'customCards') {
    content = <CustomCards maxCards={deckSize} onBack={() => setStep('deckSize')} onNext={buildDeck} />
  } else if (step === 'game') {
    const question = deck[cardIndex]
    content = <div className="screen-enter" style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '30px 16px 64px' }}>
      <section style={{ width: 'min(560px, 100%)', display: 'grid', justifyItems: 'center', gap: 16 }}>
        <p className="font-staatliches" style={{ margin: 0, color: '#ff7a16', fontSize: 15, letterSpacing: '.13em' }}>CARD {cardIndex + 1} OF {deckSize}</p>
        {currentPlayer && <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><i style={{ width: 28, height: 28, borderRadius: '50%', background: currentPlayer.color, border: '2px solid #fff' }} /><span className="font-anton" style={{ color: '#fff', fontSize: 18 }}>{currentPlayer.name.toUpperCase()}'S QUESTION</span></div>}
        <article key={cardIndex} className="wjm-card-swap" style={{ width: 'min(350px, 84vw)', aspectRatio: '4 / 5', boxSizing: 'border-box', padding: 13, borderRadius: 22, background: '#f36f21', boxShadow: '0 24px 70px rgba(243,111,33,.24)', position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden="true" className="wjm-frame-dashes" />
          <div style={{ height: '100%', boxSizing: 'border-box', padding: '22px 28px 28px', borderRadius: 12, background: '#fff1d6', border: '2px solid #f6c688', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <CategoryIllustration category="dating" size={48} />
            <h1 className="font-anton" style={{ margin: 'auto 0', color: '#17113a', fontSize: 'clamp(24px, 5.5vw, 33px)', lineHeight: 1.13 }}>{question?.toUpperCase()}</h1>
            <span className="font-staatliches" style={{ color: '#151515', fontSize: 10, letterSpacing: '.3em' }}>DECKED</span>
          </div>
        </article>
        {currentUserCanControl ? <div style={{ display: 'flex', gap: 9 }}><button style={secondaryButton} onClick={() => advance(true)}>SKIP</button><button style={primaryButton} onClick={() => advance(false)}>NEXT</button></div> : <p style={{ margin: 0, color: 'rgba(255,255,255,.55)', font: "14px 'Satoshi', sans-serif" }}>Waiting for {currentPlayer?.name}…</p>}
      </section>
    </div>
  } else {
    content = <div className="screen-enter" style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '32px 16px 60px' }}><section style={{ width: 'min(600px, 100%)', textAlign: 'center', display: 'grid', justifyItems: 'center', gap: 16 }}><h1 className="font-anton" style={{ margin: 0, color: '#fff', fontSize: 48 }}>YOU’RE DECKED</h1><p style={{ margin: 0, color: 'rgba(255,255,255,.62)', font: "16px/1.5 'Satoshi', sans-serif" }}>Hopefully, “we just met” feels a little less true now.</p><div className="wjm-results-body" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16 }}><img className="wjm-results-art" src="/assets/games/we-just-met.png" alt="We Just Met" style={{ width: 152, aspectRatio: '4 / 5', objectFit: 'cover', borderRadius: 16, flex: '0 0 auto' }} /><div style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', padding: '12px 16px', borderRadius: 14, background: '#070708', border: '1px dashed rgba(255,255,255,.12)', display: 'grid', gap: 4 }}><p className="font-staatliches" style={{ margin: '2px 0 6px', color: 'rgba(255,255,255,.42)', letterSpacing: '.13em' }}>YOUR CONVERSATION</p><div style={{ minHeight: 52, display: 'flex', alignItems: 'center' }}><span className="font-anton" style={{ color: '#fff' }}>ANSWERED</span><strong className="font-staatliches" style={{ marginLeft: 'auto', color: '#9dcc34', fontSize: 22 }}>{deck.length - skipped}</strong></div><div style={{ minHeight: 52, display: 'flex', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,.07)' }}><span className="font-anton" style={{ color: '#fff' }}>SKIPPED</span><strong className="font-staatliches" style={{ marginLeft: 'auto', color: '#ff6d60', fontSize: 22 }}>{skipped}</strong></div></div></div><div className="done-btns" style={{ display: 'flex', gap: 9 }}><button className="game-btn" style={secondaryButton} onClick={onClose}>BROWSE GAMES</button>{isHost && <button className="game-btn-primary" style={primaryButton} onClick={restart}><PlayAgainLabel /></button>}</div></section></div>
  }

  return <div className="game-fullscreen" style={{ minHeight: '100vh' }}><GameNav onBack={onClose} gameId={GAME_ID} /><main style={{ flex: 1, display: 'flex' }}>{content}</main><GameFooter /><style>{`@keyframes wjm-card-swap{0%{opacity:0;transform:translateX(115px) rotate(11deg) scale(.9)}58%{opacity:1;transform:translateX(-12px) rotate(-2.5deg) scale(1.015)}78%{transform:translateX(5px) rotate(1deg) scale(.995)}100%{opacity:1;transform:none}}.wjm-card-swap{animation:wjm-card-swap .58s cubic-bezier(.2,.85,.28,1.08) both;transform-origin:50% 110%}.wjm-frame-dashes{position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 12px,rgba(255,241,214,.72) 12px 22px,transparent 22px 34px);mask:linear-gradient(#000 0 0) top/100% 6px no-repeat,linear-gradient(#000 0 0) bottom/100% 6px no-repeat;pointer-events:none}@media(max-width:560px){.wjm-results-body{flex-direction:column}.wjm-results-art{width:118px!important}.wjm-results-body>div{width:100%}}@media(prefers-reduced-motion:reduce){.wjm-card-swap{animation:none}}`}</style></div>
}
