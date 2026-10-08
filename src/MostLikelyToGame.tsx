import { useMemo, useState } from 'react'
import { GameFooter, GameNav, PlayAgainLabel } from './components/GameShell'
import PlayerSetup, { type Player } from './components/PlayerSetup'
import { useGameStep, usePersistentGameState } from './hooks/usePersistentGameState'
import { useMultiplayerSession } from './multiplayer/SessionStateContext'
import { MOST_LIKELY_CATEGORIES, MOST_LIKELY_PROMPTS, type MostLikelyCategory } from './content/mostLikelyTo'
import { MostLikelyArtwork } from './components/GameArtworks'

type Step = 'playerSetup' | 'categories' | 'deckSize' | 'game' | 'handoff' | 'vote' | 'reveal' | 'done'
type VoteMap = Record<string, string>
type ScoreMap = Record<string, number>
const GAME_ID = 'most-likely-to'
const STEPS: readonly Step[] = ['playerSetup', 'categories', 'deckSize', 'game', 'handoff', 'vote', 'reveal', 'done']
const COLORS = ['#ef6655', '#ffd12d', '#66d7ad', '#f7f1df']
const CATEGORY_ICONS: Record<MostLikelyCategory, string> = {
  party: '/icons/party.svg', friends: '/icons/friends.svg', couples: '/icons/couples.svg',
  everyday: '/icons/everyday.svg', adventure: '/icons/full-journey.svg', bold: '/icons/how-spicy.svg',
}
const surface: React.CSSProperties = { background: '#070708', border: '1px dashed rgba(255,255,255,.10)', borderRadius: 14 }
const title: React.CSSProperties = { margin: 0, color: '#fff', fontFamily: "'Anton SC', sans-serif", fontSize: 'clamp(28px,5vw,40px)', fontWeight: 400, textAlign: 'center' }
const copy: React.CSSProperties = { margin: 0, color: 'rgba(255,255,255,.58)', fontFamily: "'Satoshi',sans-serif", fontSize: 15, lineHeight: 1.45, textAlign: 'center' }

function Button({ children, onClick, secondary, disabled }: { children: React.ReactNode; onClick: () => void; secondary?: boolean; disabled?: boolean }) {
  return <button className="font-staatliches game-btn" disabled={disabled} onClick={onClick} style={{ minHeight: 48, padding: '10px 24px', borderRadius: 999, border: secondary ? '1px solid #fff' : 0, background: secondary ? 'transparent' : disabled ? '#3f3f40' : '#0759c7', color: disabled ? 'rgba(255,255,255,.4)' : '#fff', fontSize: 16, cursor: disabled ? 'not-allowed' : 'pointer' }}>{children}</button>
}

const playerKey = (player: Player, index: number) => player.userId ?? `local-${index}`
const shuffle = <T,>(items: readonly T[]) => [...items].sort(() => Math.random() - .5)

export default function MostLikelyToGame({ onClose }: { onClose: () => void }) {
  const multiplayer = useMultiplayerSession()
  const [step, setStep] = useGameStep<Step>(GAME_ID, 'playerSetup', STEPS)
  const [players, setPlayers] = usePersistentGameState<Player[]>(GAME_ID, 'players', [])
  const [categories, setCategories] = usePersistentGameState<MostLikelyCategory[]>(GAME_ID, 'categories', ['party', 'friends', 'everyday'])
  const [deckSize, setDeckSize] = usePersistentGameState(GAME_ID, 'deckSize', 20)
  const [deck, setDeck] = usePersistentGameState<string[]>(GAME_ID, 'deck', [])
  const [cardIndex, setCardIndex] = usePersistentGameState(GAME_ID, 'cardIndex', 0)
  const [votes, setVotes] = usePersistentGameState<VoteMap>(GAME_ID, 'votes', {})
  const [scores, setScores] = usePersistentGameState<ScoreMap>(GAME_ID, 'scores', {})
  const [voterIndex, setVoterIndex] = usePersistentGameState(GAME_ID, 'voterIndex', 0)
  const [selected, setSelected] = useState('')
  const isHost = !multiplayer || multiplayer.currentUserId === multiplayer.hostUserId
  const keys = useMemo(() => players.map(playerKey), [players])
  const prefix = `mltVote-${cardIndex}-`
  const effectiveVotes = useMemo(() => multiplayer ? Object.fromEntries(keys.map(key => [key, multiplayer.values[`${prefix}${key}`]]).filter((entry): entry is [string,string] => typeof entry[1] === 'string')) : votes, [keys, multiplayer, prefix, votes])
  const currentVoter = players[voterIndex]
  const currentVoterKey = currentVoter ? playerKey(currentVoter, voterIndex) : ''
  const me = multiplayer?.currentUserId ?? currentVoterKey
  const submitted = me ? effectiveVotes[me] : ''
  const allVoted = keys.length > 0 && keys.every(key => effectiveVotes[key])
  const prompt = deck[cardIndex] ?? ''

  const begin = () => {
    const pool = categories.flatMap(category => MOST_LIKELY_PROMPTS[category])
    setDeck(shuffle(pool).slice(0, Math.min(deckSize, pool.length)))
    setCardIndex(0); setVotes({}); setScores({}); setVoterIndex(0); setSelected(''); setStep(multiplayer ? 'game' : 'handoff')
  }
  const confirm = () => {
    if (!selected || !me || effectiveVotes[me]) return
    if (multiplayer) multiplayer.setValue(`${prefix}${me}`, selected)
    const next = { ...effectiveVotes, [me]: selected }
    if (!multiplayer) setVotes(next)
    setSelected('')
    if (!multiplayer) {
      if (keys.every(key => next[key])) {
        const nextScores = { ...scores }
        Object.values(next).forEach(key => { nextScores[key] = (nextScores[key] ?? 0) + 1 })
        setScores(nextScores)
        setStep('reveal')
      }
      else { setVoterIndex(index => index + 1); setStep('handoff') }
    }
  }
  const reveal = () => {
    if (!allVoted) return
    const next = { ...scores }
    Object.values(effectiveVotes).forEach(key => { next[key] = (next[key] ?? 0) + 1 })
    setScores(next); setStep('reveal')
  }
  const next = () => {
    if (cardIndex + 1 >= deck.length) { setStep('done'); return }
    setCardIndex(index => index + 1); setVotes({}); setVoterIndex(0); setSelected(''); setStep(multiplayer ? 'game' : 'handoff')
  }
  const restart = () => { setDeck([]); setCardIndex(0); setVotes({}); setScores({}); setVoterIndex(0); setSelected(''); setStep(multiplayer ? 'categories' : 'playerSetup') }

  let content: React.ReactNode
  if (step === 'playerSetup') content = <PlayerSetup minPlayers={2} initialPlayers={players} onSkip={onClose} onNext={nextPlayers => { setPlayers(nextPlayers); setStep('categories') }} />
  else if (step === 'categories') content = <Screen>
    <h1 style={title}>Choose your categories</h1>
    <p style={copy}>Pick one or more moods. Each category contains 50 unique cards.</p>
    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
      {MOST_LIKELY_CATEGORIES.map(category => {
        const active = categories.includes(category.id)
        return <button key={category.id} onClick={() => setCategories(current => active ? current.filter(id => id !== category.id) : [...current, category.id])} style={{ ...surface, minHeight: 82, padding: 12, display: 'flex', alignItems: 'center', gap: 12, color: '#fff', textAlign: 'left', border: active ? '1px solid #fff' : surface.border }}>
          <img src={CATEGORY_ICONS[category.id]} alt="" aria-hidden="true" style={{ width: 30, height: 30, objectFit: 'contain', opacity: active ? 1 : .62 }} />
          <span><strong className="font-staatliches" style={{ display: 'block', fontSize: 17 }}>{category.label}{category.adult ? ' · 18+' : ''}</strong><span style={{ fontFamily: "'Satoshi',sans-serif", fontSize: 11, color: 'rgba(255,255,255,.48)' }}>{category.description}</span></span>
        </button>
      })}
    </div>
    <Button disabled={!isHost || categories.length === 0} onClick={() => setStep('deckSize')}>CONTINUE</Button>
  </Screen>
  else if (step === 'deckSize') content = <Screen>
    <h1 style={title}>Deck size</h1>
    <p style={copy}>How many cards would you like to play?</p>
    <label style={{ ...copy, width: '100%', textAlign: 'left' }}>Number of cards<input className="mlt-deck-input" type="number" min={5} max={100} value={deckSize} onChange={event => setDeckSize(Math.max(5, Math.min(100, Number(event.target.value))))} style={{ ...surface, width: '100%', height: 56, marginTop: 8, padding: '0 16px', boxSizing: 'border-box', color: '#fff', fontFamily: "'Satoshi',sans-serif", fontSize: 18, outline: 'none' }} /></label>
    <div style={{ display: 'flex', gap: 10 }}><Button secondary onClick={() => setStep('categories')}>BACK</Button><Button disabled={!isHost} onClick={begin}>START GAME</Button></div>
  </Screen>
  else if (step === 'game') content = <Screen><h1 style={title}>Who’s most likely?</h1><PromptCard prompt={prompt} /><p style={copy}>{multiplayer ? 'Vote privately on your own phone.' : 'Pass the phone so everyone can vote privately.'}</p>{multiplayer && <Button onClick={() => setStep('vote')}>CAST MY VOTE</Button>}</Screen>
  else if (step === 'handoff') content = <Screen><p className="font-staatliches" style={{ margin: 0, color: '#66d7ad', letterSpacing: '.12em' }}>PRIVATE VOTE</p><h1 style={title}>Pass the phone to {currentVoter?.name}</h1><p style={copy}>Everyone else should look away while {currentVoter?.name} chooses.</p><Button onClick={() => setStep('vote')}>I’M {currentVoter?.name?.toUpperCase()}</Button></Screen>
  else if (step === 'vote' || step === 'reveal') {
    const canVote = step === 'vote' && Boolean(me) && !submitted
    const tallies = keys.map(key => ({ key, count: Object.values(effectiveVotes).filter(value => value === key).length })).sort((a,b) => b.count-a.count)
    content = <Screen>
      <h1 style={title}>{step === 'reveal' ? 'The group has spoken' : 'Cast your vote'}</h1>
      <PromptCard prompt={prompt} compact />
      <div style={{ width: '100%', display: 'grid', gap: 8 }}>
        {players.map((player,index) => {
          const key = playerKey(player,index)
          const chosen = (selected || submitted) === key
          const tally = tallies.find(item => item.key === key)?.count ?? 0
          const voterNames = players
            .filter((_, voterIndex) => effectiveVotes[playerKey(players[voterIndex], voterIndex)] === key)
            .map(voter => voter.name)
          return <button key={key} disabled={!canVote} onClick={() => setSelected(key)} style={{ ...surface, minHeight: 58, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, color: '#fff', border: chosen ? '2px solid #fff' : step === 'reveal' && tally === tallies[0]?.count ? '2px solid #ffd12d' : surface.border }}>
            <span style={{ width: 32, height: 32, borderRadius: '50%', background: player.color, border: '2px solid #fff', flexShrink: 0 }} />
            <span style={{ textAlign: 'left' }}>
              <span className="font-anton" style={{ display: 'block', fontSize: 17 }}>{player.name}</span>
              {step === 'reveal' && voterNames.length > 0 ? <span style={{ display: 'block', marginTop: 2, color: 'rgba(255,255,255,.48)', fontFamily: "'Satoshi',sans-serif", fontSize: 11 }}>Voted by {voterNames.join(', ')}</span> : null}
            </span>
            {step === 'reveal' ? <span className="font-staatliches" style={{ marginLeft: 'auto', color: '#ffd12d', fontSize: 20 }}>{tally} {tally === 1 ? 'VOTE' : 'VOTES'}</span> : null}
          </button>
        })}
      </div>
      {step === 'vote' && canVote ? <Button disabled={!selected} onClick={confirm}>CONFIRM VOTE</Button> : null}
      {step === 'vote' ? <p style={copy}>{Object.keys(effectiveVotes).length} of {keys.length} votes submitted</p> : null}
      {step === 'vote' && multiplayer && isHost && (!canVote || Boolean(submitted)) ? <Button disabled={!allVoted} onClick={reveal}>REVEAL VOTES</Button> : null}
      {step === 'reveal' && isHost ? <Button onClick={next}>{cardIndex + 1 >= deck.length ? 'SEE RESULTS' : 'NEXT CARD'}</Button> : null}
    </Screen>
  } else {
    const ranked = players.map((player,index) => ({ player, key: playerKey(player,index), score: scores[playerKey(player,index)] ?? 0 })).sort((a,b) => b.score-a.score)
    const leaders = ranked.filter(item => item.score === ranked[0]?.score)
    const resultCopy = leaders.length > 1
      ? `${leaders.map(item => item.player.name).join(' & ')} tied for most likely overall.`
      : `${ranked[0]?.player.name ?? 'Your group'} was voted most likely overall.`
    content = <Screen compact><h1 style={title}>YOU’RE DECKED</h1><p style={copy}>{resultCopy}</p><div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 16 }}><MostLikelyArtwork compact /><div style={{ ...surface, flex: 1, padding: 14 }}>{ranked.map((item,index) => <div key={item.key} style={{ minHeight: 44, display: 'flex', alignItems: 'center', gap: 9, color: '#fff' }}><span className="font-staatliches" style={{ color: '#ffd12d' }}>{index+1}</span><span className="font-anton">{item.player.name}</span><span className="font-staatliches" style={{ marginLeft: 'auto' }}>{item.score} VOTES</span></div>)}</div></div><div className="done-btns" style={{ display: 'flex', gap: 10 }}><Button secondary onClick={onClose}>BROWSE GAMES</Button><Button onClick={restart}><PlayAgainLabel /></Button></div></Screen>
  }
  return <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}><GameNav onBack={onClose} gameId={GAME_ID} /><main style={{ flex: 1, display: 'flex' }}>{content}</main><GameFooter /></div>
}

function PromptCard({ prompt, compact = false }: { prompt: string; compact?: boolean }) {
  return <div className="game-card" style={{ width: compact ? 'min(300px,76vw)' : 'min(330px,78vw)', aspectRatio: '4/5', padding: compact ? '12px 12px 38px' : '14px 14px 42px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden', background: '#0759c7', borderRadius: 18, boxShadow: '0 24px 64px rgba(7,89,199,.25)' }}>
    {COLORS.slice(0, 3).map((color, index) => <span key={color} aria-hidden="true" style={{ position: 'absolute', width: 52, height: 13, borderRadius: 999, background: color, transform: `rotate(${index % 2 ? -34 : 34}deg)`, left: index === 1 ? 'auto' : -12, right: index === 1 ? -12 : 'auto', top: `${15 + index * 31}%` }} />)}
    <div style={{ height: '100%', padding: compact ? '38px 24px 46px' : '44px 28px 52px', boxSizing: 'border-box', background: '#f7f1df', borderRadius: 10, display: 'grid', placeItems: 'center', color: '#111318', fontFamily: "'Anton SC',sans-serif", fontSize: compact ? 22 : 26, lineHeight: 1.16, textAlign: 'center', textTransform: 'uppercase' }}>{prompt}</div>
    <span className="font-staatliches" style={{ position: 'absolute', left: 0, right: 0, bottom: compact ? 11 : 13, color: '#fff', fontSize: compact ? 12 : 13, letterSpacing: '.2em', textAlign: 'center' }}>DECKED</span>
  </div>
}

function Screen({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return <div className="screen-enter" style={{ width: 'min(560px,100%)', margin: 'auto', padding: compact ? '28px 16px 38px' : '44px 16px 64px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? 14 : 20 }}>{children}</div>
}
