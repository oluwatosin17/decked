import { useMemo, useState } from 'react'
import { GameFooter, GameNav, PlayAgainLabel } from './components/GameShell'
import PlayerSetup, { type Player } from './components/PlayerSetup'
import { useGameStep, usePersistentGameState } from './hooks/usePersistentGameState'
import { useMultiplayerSession } from './multiplayer/SessionStateContext'
import { CHOOSE_SIDE_CATEGORIES, CHOOSE_SIDE_PROMPTS, type ChooseSideCategory, type ChooseSidePrompt } from './content/chooseYourSide'

type Step = 'playerSetup' | 'categories' | 'deckSize' | 'handoff' | 'vote' | 'reveal' | 'done'
type Side = 'a' | 'b'
type VoteMap = Record<string, Side>
type Stats = { unanimous: number; closestGap: number; mostDivisive?: ChooseSidePrompt; aVotes: number; bVotes: number }
const GAME_ID = 'choose-your-side'
const STEPS: readonly Step[] = ['playerSetup', 'categories', 'deckSize', 'handoff', 'vote', 'reveal', 'done']
const RED = '#ef3f24', BLUE = '#0759c7', CREAM = '#f7efd9'
const surface: React.CSSProperties = { background: '#070708', border: '1px dashed rgba(255,255,255,.12)', borderRadius: 14 }
const title: React.CSSProperties = { margin: 0, color: '#fff', fontFamily: "'Anton SC',sans-serif", fontSize: 'clamp(30px,6vw,44px)', fontWeight: 400, lineHeight: 1.05, textAlign: 'center' }
const copy: React.CSSProperties = { margin: 0, color: 'rgba(255,255,255,.58)', fontFamily: "'Satoshi',sans-serif", fontSize: 15, lineHeight: 1.45, textAlign: 'center' }

export function ChooseYourSideArtwork({ compact = false }: { compact?: boolean }) {
  return <div role="img" aria-label="Choose Your Side" style={{ width: compact ? 130 : '100%', height: '100%', minHeight: compact ? 162 : undefined, position: 'relative', overflow: 'hidden', borderRadius: compact ? 9 : 14, backgroundImage: "url('/assets/games/choose-your-side.png')", backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 18px 55px rgba(0,0,0,.28)' }} />
}

function Button({ children, onClick, secondary, disabled }: { children: React.ReactNode; onClick: () => void; secondary?: boolean; disabled?: boolean }) {
  return <button className="font-staatliches game-btn" disabled={disabled} onClick={onClick} style={{ minHeight: 48, padding: '10px 24px', borderRadius: 999, border: secondary ? '1px solid #fff' : 0, background: secondary ? 'transparent' : disabled ? '#414143' : RED, color: disabled ? 'rgba(255,255,255,.4)' : '#fff', fontSize: 16, cursor: disabled ? 'not-allowed' : 'pointer' }}>{children}</button>
}

const shuffle = <T,>(items: readonly T[]) => [...items].sort(() => Math.random() - .5)
const playerKey = (player: Player, index: number) => player.userId ?? `local-${index}`

export default function ChooseYourSideGame({ onClose }: { onClose: () => void }) {
  const multiplayer = useMultiplayerSession()
  const [step, setStep] = useGameStep<Step>(GAME_ID, 'playerSetup', STEPS)
  const [players, setPlayers] = usePersistentGameState<Player[]>(GAME_ID, 'players', [])
  const [categories, setCategories] = usePersistentGameState<ChooseSideCategory[]>(GAME_ID, 'categories', ['everyday', 'funny', 'morals'])
  const [deckSize, setDeckSize] = usePersistentGameState(GAME_ID, 'deckSize', 20)
  const [deck, setDeck] = usePersistentGameState<ChooseSidePrompt[]>(GAME_ID, 'deck', [])
  const [cardIndex, setCardIndex] = usePersistentGameState(GAME_ID, 'cardIndex', 0)
  const [votes, setVotes] = usePersistentGameState<VoteMap>(GAME_ID, 'votes', {})
  const [voterIndex, setVoterIndex] = usePersistentGameState(GAME_ID, 'voterIndex', 0)
  const [stats, setStats] = usePersistentGameState<Stats>(GAME_ID, 'stats', { unanimous: 0, closestGap: 999, aVotes: 0, bVotes: 0 })
  const [selected, setSelected] = useState<Side | ''>('')
  const isHost = !multiplayer || multiplayer.currentUserId === multiplayer.hostUserId
  const keys = useMemo(() => players.map(playerKey), [players])
  const prefix = `cysVote-${cardIndex}-`
  const effectiveVotes = useMemo(() => multiplayer
    ? Object.fromEntries(keys.map(key => [key, multiplayer.values[`${prefix}${key}`]]).filter((entry): entry is [string,Side] => entry[1] === 'a' || entry[1] === 'b'))
    : votes, [keys, multiplayer, prefix, votes])
  const currentVoter = players[voterIndex]
  const me = multiplayer?.currentUserId ?? (currentVoter ? playerKey(currentVoter, voterIndex) : '')
  const submitted = me ? effectiveVotes[me] : undefined
  const allVoted = keys.length > 0 && keys.every(key => effectiveVotes[key])
  const prompt = deck[cardIndex]

  const begin = () => {
    const pool = categories.flatMap(category => CHOOSE_SIDE_PROMPTS[category])
    setDeck(shuffle(pool).slice(0, Math.min(deckSize, pool.length)))
    setCardIndex(0); setVotes({}); setVoterIndex(0); setStats({ unanimous: 0, closestGap: 999, aVotes: 0, bVotes: 0 }); setSelected('')
    setStep(multiplayer ? 'vote' : 'handoff')
  }
  const recordRound = (roundVotes: VoteMap) => {
    const a = Object.values(roundVotes).filter(side => side === 'a').length
    const b = Object.values(roundVotes).filter(side => side === 'b').length
    const gap = Math.abs(a - b)
    setStats(current => ({
      unanimous: current.unanimous + (a === 0 || b === 0 ? 1 : 0),
      closestGap: Math.min(current.closestGap, gap),
      mostDivisive: gap < current.closestGap ? prompt : current.mostDivisive,
      aVotes: current.aVotes + a, bVotes: current.bVotes + b,
    }))
  }
  const confirm = () => {
    if (!selected || !me || submitted) return
    if (multiplayer) multiplayer.setValue(`${prefix}${me}`, selected)
    const nextVotes = { ...effectiveVotes, [me]: selected }
    if (!multiplayer) setVotes(nextVotes)
    setSelected('')
    if (!multiplayer) {
      if (keys.every(key => nextVotes[key])) { recordRound(nextVotes); setStep('reveal') }
      else { setVoterIndex(index => index + 1); setStep('handoff') }
    }
  }
  const reveal = () => { if (allVoted) { recordRound(effectiveVotes); setStep('reveal') } }
  const next = () => {
    if (cardIndex + 1 >= deck.length) { setStep('done'); return }
    setCardIndex(index => index + 1); setVotes({}); setVoterIndex(0); setSelected(''); setStep(multiplayer ? 'vote' : 'handoff')
  }
  const restart = () => { setDeck([]); setCardIndex(0); setVotes({}); setVoterIndex(0); setSelected(''); setStats({ unanimous: 0, closestGap: 999, aVotes: 0, bVotes: 0 }); setStep(multiplayer ? 'categories' : 'playerSetup') }

  let content: React.ReactNode
  if (step === 'playerSetup') content = <PlayerSetup minPlayers={2} initialPlayers={players} onSkip={onClose} onNext={nextPlayers => { setPlayers(nextPlayers); setStep('categories') }} />
  else if (step === 'categories') content = <Screen>
    <h1 style={title}>Choose your categories</h1><p style={copy}>Pick one or more kinds of dilemma.</p>
    <div className="cys-category-grid" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
      {CHOOSE_SIDE_CATEGORIES.map(category => { const active = categories.includes(category.id); return <button key={category.id} onClick={() => setCategories(current => active ? current.filter(id => id !== category.id) : [...current, category.id])} style={{ ...surface, minHeight: 78, padding: 13, color: '#fff', textAlign: 'left', border: active ? `2px solid ${category.id === 'morals' ? '#ffd341' : '#fff'}` : surface.border }}><strong className="font-staatliches" style={{ display: 'block', fontSize: 17 }}>{category.label}{category.adult ? ' · 18+' : ''}</strong><span style={{ fontFamily: "'Satoshi',sans-serif", fontSize: 11, color: 'rgba(255,255,255,.48)' }}>{category.description}</span></button> })}
    </div><Button disabled={!isHost || categories.length === 0} onClick={() => setStep('deckSize')}>CONTINUE</Button>
  </Screen>
  else if (step === 'deckSize') content = <Screen><h1 style={title}>Deck size</h1><p style={copy}>How many dilemmas should the group settle?</p><div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>{[10,20,30,40].map(size => <button key={size} onClick={() => setDeckSize(size)} className="font-staatliches" style={{ ...surface, minHeight: 54, color: '#fff', fontSize: 19, border: deckSize === size ? `2px solid ${RED}` : surface.border }}>{size}</button>)}</div><div style={{ display: 'flex', gap: 10 }}><Button secondary onClick={() => setStep('categories')}>BACK</Button><Button disabled={!isHost} onClick={begin}>START GAME</Button></div></Screen>
  else if (step === 'handoff') content = <Screen><p className="font-staatliches" style={{ margin: 0, color: '#ffd341', letterSpacing: '.14em' }}>CHOOSE IN PRIVATE</p><h1 style={title}>Pass the phone to {currentVoter?.name}</h1><p style={copy}>Everyone else should look away. Your side stays hidden until the reveal.</p><Button onClick={() => setStep('vote')}>I’M {currentVoter?.name?.toUpperCase()}</Button></Screen>
  else if ((step === 'vote' || step === 'reveal') && prompt) {
    const aNames = players.filter((_, index) => effectiveVotes[playerKey(players[index], index)] === 'a').map(player => player.name)
    const bNames = players.filter((_, index) => effectiveVotes[playerKey(players[index], index)] === 'b').map(player => player.name)
    const canVote = step === 'vote' && !submitted
    content = <Screen wide><h1 style={title}>{step === 'reveal' ? 'The room has chosen' : 'Choose your side'}</h1><DilemmaCard prompt={prompt} selected={(selected || submitted) as Side | undefined} reveal={step === 'reveal'} aNames={aNames} bNames={bNames} onSelect={canVote ? setSelected : undefined} />
      {step === 'vote' && canVote ? <Button disabled={!selected} onClick={confirm}>LOCK IN MY SIDE</Button> : null}
      {step === 'vote' ? <p style={copy}>{Object.keys(effectiveVotes).length} of {keys.length} choices locked in</p> : null}
      {step === 'vote' && multiplayer && isHost && submitted ? <Button disabled={!allVoted} onClick={reveal}>REVEAL THE ROOM</Button> : null}
      {step === 'reveal' && isHost ? <><p style={copy}>Pick someone from each side to defend their choice.</p><Button onClick={next}>{cardIndex + 1 >= deck.length ? 'SEE RECAP' : 'NEXT DILEMMA'}</Button></> : null}
    </Screen>
  } else content = <Screen wide><h1 style={title}>YOU’RE DECKED</h1><p style={copy}>Your group settled {deck.length} dilemmas.</p><div className="cys-recap" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}><Stat value={stats.unanimous} label="UNANIMOUS" /><Stat value={stats.aVotes} label="RED PICKS" color={RED} /><Stat value={stats.bVotes} label="BLUE PICKS" color={BLUE} /></div>{stats.mostDivisive ? <div style={{ ...surface, width: '100%', padding: 18, boxSizing: 'border-box' }}><p className="font-staatliches" style={{ margin: '0 0 10px', color: '#ffd341', letterSpacing: '.12em' }}>MOST DIVISIVE</p><p style={{ ...copy, color: '#fff', textAlign: 'left' }}>{stats.mostDivisive.optionA} <span style={{ color: 'rgba(255,255,255,.35)' }}>or</span> {stats.mostDivisive.optionB}</p></div> : null}<div className="done-btns" style={{ display: 'flex', gap: 10 }}><Button secondary onClick={onClose}>BROWSE GAMES</Button><Button onClick={restart}><PlayAgainLabel /></Button></div></Screen>

  return <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}><GameNav onBack={onClose} gameId={GAME_ID} /><main style={{ flex: 1, display: 'flex' }}>{content}</main><GameFooter /></div>
}

function DilemmaCard({ prompt, selected, reveal, aNames, bNames, onSelect }: { prompt: ChooseSidePrompt; selected?: Side; reveal: boolean; aNames: string[]; bNames: string[]; onSelect?: (side: Side) => void }) {
  const option = (side: Side, text: string, names: string[]) => <button aria-pressed={selected === side} disabled={!onSelect} onClick={() => onSelect?.(side)} style={{ minHeight: 154, padding: '24px 20px', border: selected === side ? '3px solid #fff' : 0, background: side === 'a' ? RED : BLUE, color: CREAM, cursor: onSelect ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}><span className="font-anton" style={{ fontSize: 'clamp(22px,5vw,32px)', lineHeight: 1.08, textTransform: 'uppercase' }}>{text}</span>{reveal ? <span className="font-satoshi" style={{ fontSize: 12, opacity: .82 }}>{names.length} {names.length === 1 ? 'vote' : 'votes'}{names.length ? ` · ${names.join(', ')}` : ''}</span> : null}</button>
  return <div className="game-card" style={{ width: 'min(520px,92vw)', overflow: 'hidden', borderRadius: 18, boxShadow: '0 28px 70px rgba(0,0,0,.34)' }}>{option('a', prompt.optionA, aNames)}<div className="font-staatliches" style={{ height: 36, display: 'grid', placeItems: 'center', background: CREAM, color: '#111', fontSize: 16, letterSpacing: '.12em' }}>OR</div>{option('b', prompt.optionB, bNames)}<div className="font-staatliches" style={{ padding: '10px', background: '#111', color: '#fff', textAlign: 'center', letterSpacing: '.22em', fontSize: 12 }}>DECKED</div></div>
}

function Stat({ value, label, color = '#ffd341' }: { value: number; label: string; color?: string }) { return <div style={{ ...surface, padding: 14, textAlign: 'center' }}><strong className="font-anton" style={{ display: 'block', color, fontSize: 34 }}>{value}</strong><span className="font-staatliches" style={{ color: 'rgba(255,255,255,.58)', fontSize: 12 }}>{label}</span></div> }
function Screen({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) { return <div className="screen-enter" style={{ width: wide ? 'min(620px,100%)' : 'min(560px,100%)', margin: 'auto', padding: '40px 16px 64px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>{children}</div> }
