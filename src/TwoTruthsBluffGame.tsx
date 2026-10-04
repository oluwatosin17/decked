import { useMemo, useState } from 'react'
import { GameFooter, GameNav, PlayAgainLabel } from './components/GameShell'
import PlayerSetup, { type Player } from './components/PlayerSetup'
import { useGameStep, usePersistentGameState } from './hooks/usePersistentGameState'
import { useMultiplayerSession } from './multiplayer/SessionStateContext'

type Statement = { id: string; text: string }
type VoteMap = Record<string, string>
type ScoreMap = Record<string, number>
type Step = 'playerSetup' | 'write' | 'handoff' | 'guess' | 'reveal' | 'done'

const GAME_ID = 'two-truths-bluff'
const STEPS: readonly Step[] = ['playerSetup', 'write', 'handoff', 'guess', 'reveal', 'done']

export function TwoTruthsBluffArtwork({ className = '', portrait = false }: { className?: string; portrait?: boolean }) {
  return (
    <div className={className} role="img" aria-label="Two Truths and a Bluff" style={{ position: 'relative', width: portrait ? '100%' : undefined, height: portrait ? '100%' : undefined, aspectRatio: portrait ? '4 / 5' : '1', overflow: 'hidden' }}>
      <img
        src="/assets/games/two-truths-bluff-approved.png"
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
      />
    </div>
  )
}

const titleStyle: React.CSSProperties = { margin: 0, color: '#fff', fontFamily: "'Anton SC', sans-serif", fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 400, textAlign: 'center' }
const copyStyle: React.CSSProperties = { margin: 0, color: 'rgba(255,255,255,.58)', fontFamily: "'Satoshi', sans-serif", fontSize: '15px', lineHeight: 1.45, textAlign: 'center' }
const surfaceStyle: React.CSSProperties = { background: '#070708', border: '1px dashed rgba(255,255,255,.10)', borderRadius: '14px' }
const fieldStyle: React.CSSProperties = { width: '100%', minHeight: 54, boxSizing: 'border-box', padding: '14px 16px', borderRadius: 12, border: '1px dashed rgba(255,255,255,.10)', background: '#070708', color: '#fff', outline: 'none', fontFamily: "'Satoshi', sans-serif", fontSize: 16 }

function Button({ children, onClick, secondary = false, disabled = false }: { children: React.ReactNode; onClick: () => void; secondary?: boolean; disabled?: boolean }) {
  return <button className="font-staatliches game-btn" disabled={disabled} onClick={onClick} style={{ minHeight: 48, padding: '10px 24px', borderRadius: 999, border: secondary ? '1px solid #fff' : 0, background: secondary ? 'transparent' : disabled ? '#3f3f40' : '#e8292d', color: disabled ? 'rgba(255,255,255,.4)' : '#fff', fontSize: 16, cursor: disabled ? 'not-allowed' : 'pointer' }}>{children}</button>
}

function playerKey(player: Player, index: number) { return player.userId ?? `local-${index}` }

export default function TwoTruthsBluffGame({ onClose }: { onClose: () => void }) {
  const multiplayer = useMultiplayerSession()
  const [step, setStep] = useGameStep<Step>(GAME_ID, 'playerSetup', STEPS)
  const [players, setPlayers] = usePersistentGameState<Player[]>(GAME_ID, 'players', [])
  const [round, setRound] = usePersistentGameState(GAME_ID, 'round', 0)
  const [statements, setStatements] = usePersistentGameState<Statement[]>(GAME_ID, 'statements', [])
  const [bluffId, setBluffId] = usePersistentGameState(GAME_ID, 'bluffId', '')
  const [votes, setVotes] = usePersistentGameState<VoteMap>(GAME_ID, 'votes', {})
  const [scores, setScores] = usePersistentGameState<ScoreMap>(GAME_ID, 'scores', {})
  const [guesserIndex, setGuesserIndex] = usePersistentGameState(GAME_ID, 'guesserIndex', 0)
  const [drafts, setDrafts] = useState(['', '', ''])
  const [draftBluff, setDraftBluff] = useState(2)
  const [selectedGuess, setSelectedGuess] = useState('')
  const active = players[round % Math.max(players.length, 1)]
  const activeKey = active ? playerKey(active, round % players.length) : ''
  const isHost = !multiplayer || multiplayer.currentUserId === multiplayer.hostUserId
  const isActive = !multiplayer || active?.userId === multiplayer.currentUserId
  const eligible = useMemo(() => players.map(playerKey).filter(key => key !== activeKey), [players, activeKey])
  const votePrefix = `ttbVote-${round}-`
  const effectiveVotes = useMemo(() => {
    if (!multiplayer) return votes
    return Object.fromEntries(eligible.map(key => [key, multiplayer.values[`${votePrefix}${key}`]]).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
  }, [eligible, multiplayer, votePrefix, votes])
  const allVoted = eligible.length > 0 && eligible.every(key => effectiveVotes[key])
  const currentGuesserKey = eligible[guesserIndex] ?? ''
  const currentGuesser = players.find((player, index) => playerKey(player, index) === currentGuesserKey)
  const nameForKey = (key: string) => players.find((player, index) => playerKey(player, index) === key)?.name ?? 'Player'

  const startRound = (nextRound = round) => {
    setRound(nextRound)
    setStatements([])
    setBluffId('')
    setVotes({})
    setGuesserIndex(0)
    setSelectedGuess('')
    setDrafts(['', '', ''])
    setDraftBluff(2)
    setStep('write')
  }

  const submitStatements = () => {
    if (drafts.some(item => !item.trim())) return
    const authored = drafts.map((text, index) => ({ id: `${round}-${index}-${Math.random().toString(36).slice(2, 7)}`, text: text.trim() }))
    const bluff = authored[draftBluff].id
    const shuffled = [...authored].sort(() => Math.random() - .5)
    setStatements(shuffled)
    setBluffId(bluff)
    setVotes({})
    setGuesserIndex(0)
    setSelectedGuess('')
    setStep(multiplayer ? 'guess' : 'handoff')
  }

  const calculateScores = (completedVotes: VoteMap) => {
    const nextScores = { ...scores }
    eligible.forEach(key => {
      if (completedVotes[key] === bluffId) nextScores[key] = (nextScores[key] ?? 0) + 1
      else nextScores[activeKey] = (nextScores[activeKey] ?? 0) + 1
    })
    setScores(nextScores)
  }

  const confirmVote = () => {
    if (!selectedGuess) return
    const me = multiplayer?.currentUserId ?? eligible.find(key => !effectiveVotes[key])
    if (!me || me === activeKey || effectiveVotes[me]) return
    if (multiplayer) multiplayer.setValue(`${votePrefix}${me}`, selectedGuess)
    const nextVotes = { ...effectiveVotes, [me]: selectedGuess }
    if (!multiplayer) setVotes(nextVotes)
    setSelectedGuess('')
    if (!multiplayer) {
      if (eligible.every(key => nextVotes[key])) {
        calculateScores(nextVotes)
        setStep('reveal')
      } else {
        setGuesserIndex(index => index + 1)
        setStep('handoff')
      }
    }
  }

  const reveal = () => {
    if (!allVoted) return
    calculateScores(effectiveVotes)
    setStep('reveal')
  }

  const nextRound = () => round + 1 >= players.length ? setStep('done') : startRound(round + 1)
  const restart = () => { setRound(0); setStatements([]); setBluffId(''); setVotes({}); setScores({}); setGuesserIndex(0); setSelectedGuess(''); setStep(multiplayer ? 'write' : 'playerSetup') }

  let content: React.ReactNode
  if (step === 'playerSetup') content = <PlayerSetup minPlayers={2} initialPlayers={players} onSkip={onClose} onNext={nextPlayers => { setPlayers(nextPlayers); startRound(0) }} />
  else if (step === 'write') content = <Screen>
    <h1 style={titleStyle}>{active?.name ? `${active.name}'s turn` : 'Your turn'}</h1>
    {isActive ? <>
      <p style={copyStyle}>Write two true statements and one bluff. Only you should know which is which.</p>
      <div style={{ width: '100%', display: 'grid', gap: 10 }}>{drafts.map((value, index) => <div key={index} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 92px', gap: 8, alignItems: 'stretch' }}><input value={value} onChange={event => setDrafts(items => items.map((item, i) => i === index ? event.target.value : item))} placeholder={`Statement ${index + 1}`} style={fieldStyle} /><button type="button" onClick={() => setDraftBluff(index)} className="font-staatliches" style={{ minWidth: 92, minHeight: 54, borderRadius: 12, border: draftBluff === index ? '1px solid #8e7905' : '1px dashed rgba(255,255,255,.12)', background: draftBluff === index ? '#f0de72' : '#070708', color: draftBluff === index ? '#3a3100' : 'rgba(255,255,255,.55)' }}>BLUFF</button></div>)}</div>
      <Button disabled={drafts.some(item => !item.trim())} onClick={submitStatements}>READY FOR GUESSES</Button>
    </> : <p style={copyStyle}>{active?.name} is writing two truths and a bluff. You’ll see all three together when they are ready.</p>}
  </Screen>
  else if (step === 'handoff') content = <Screen>
    <p className="font-staatliches" style={{ margin: 0, color: '#f0de72', fontSize: 14, letterSpacing: '.12em' }}>KEEP THE BLUFF SECRET</p>
    <h1 style={titleStyle}>Pass the phone to {currentGuesser?.name}</h1>
    <p style={copyStyle}>{active?.name} should look away. {currentGuesser?.name} will make the next private guess.</p>
    <Button onClick={() => setStep('guess')}>I'M {currentGuesser?.name?.toUpperCase()}</Button>
  </Screen>
  else if (step === 'guess' || step === 'reveal') {
    const me = multiplayer?.currentUserId ?? currentGuesserKey
    const submittedGuess = me ? effectiveVotes[me] : ''
    const canVote = step === 'guess' && Boolean(me) && me !== activeKey && !submittedGuess
    const isStoryteller = me === activeKey
    content = <Screen>
      <h1 style={titleStyle}>{step === 'reveal' ? 'The bluff is revealed' : `Which one is ${active?.name}'s bluff?`}</h1>
      <p style={copyStyle}>{step === 'reveal' ? 'See what everyone chose and who spotted the bluff.' : canVote ? `${nameForKey(me)}: ask questions, then lock in one answer.` : submittedGuess ? 'Your guess is locked. Waiting for the other players.' : isStoryteller ? 'Answer their questions without giving the bluff away.' : `${active?.name} is waiting for everyone to guess.`}</p>
      <div style={{ width: '100%', display: 'grid', gap: 12 }}>{statements.map((statement, index) => { const selected = step === 'guess' && (selectedGuess || submittedGuess) === statement.id; const isBluff = step === 'reveal' && statement.id === bluffId; const voters = step === 'reveal' ? Object.entries(effectiveVotes).filter(([, statementId]) => statementId === statement.id).map(([key]) => nameForKey(key)) : []; return <button key={statement.id} disabled={!canVote} onClick={() => setSelectedGuess(statement.id)} style={{ ...surfaceStyle, minHeight: 78, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, color: '#fff', textAlign: 'left', cursor: canVote ? 'pointer' : 'default', border: isBluff ? '2px solid #f0de72' : selected ? '2px solid #fff' : surfaceStyle.border, boxShadow: selected ? '0 0 0 1px rgba(255,255,255,.08)' : 'none' }}><span className="font-slackey" style={{ color: '#8e7905', fontSize: 22 }}>{index + 1}</span><span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 16, lineHeight: 1.35, flex: 1 }}>{statement.text}{voters.length > 0 && <small style={{ display: 'block', marginTop: 6, color: 'rgba(255,255,255,.48)', fontSize: 12 }}>{voters.join(', ')} chose this</small>}</span>{isBluff && <span className="font-staatliches" style={{ color: '#f0de72' }}>BLUFF</span>}</button> })}</div>
      {step === 'guess' && canVote && <Button disabled={!selectedGuess} onClick={confirmVote}>CONFIRM GUESS</Button>}
      {step === 'guess' && <p style={copyStyle}>{Object.keys(effectiveVotes).length} of {eligible.length} guesses submitted</p>}
      {step === 'guess' && isHost && (!canVote || Boolean(submittedGuess)) && <Button disabled={!allVoted} onClick={reveal}>REVEAL THE BLUFF</Button>}
      {step === 'reveal' && isHost && <Button onClick={nextRound}>{round + 1 >= players.length ? 'SEE RESULTS' : 'NEXT PLAYER'}</Button>}
    </Screen>
  } else {
    const ranked = [...players].map((player, index) => ({ player, key: playerKey(player, index), score: scores[playerKey(player, index)] ?? 0 })).sort((a, b) => b.score - a.score)
    const topScore = ranked[0]?.score ?? 0
    const winners = ranked.filter(item => item.score === topScore)
    content = <Screen compact>
    <h1 style={titleStyle}>YOU'RE DECKED</h1>
    <p style={copyStyle}>{winners.length > 1 ? `${winners.map(item => item.player.name).join(' & ')} tied for the win.` : `${winners[0]?.player.name ?? 'The winner'} spotted the most bluffs.`}</p>
    <div className="ttb-results-body" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16 }}>
      <TwoTruthsBluffArtwork className="ttb-results-artwork" />
      <div style={{ ...surfaceStyle, flex: 1, minWidth: 0, padding: '14px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 4 }}><p className="font-staatliches" style={{ margin: '0 0 4px', color: 'rgba(255,255,255,.45)', letterSpacing: '.12em', textAlign: 'center' }}>FINAL SCORES</p>{ranked.map((item, index) => <div key={item.key} style={{ minHeight: 46, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 10, background: index === 0 ? 'rgba(240,222,114,.08)' : 'transparent', borderRadius: 10 }}><span className="font-slackey" style={{ width: 22, color: index === 0 ? '#f0de72' : 'rgba(255,255,255,.32)', fontSize: 16 }}>{index + 1}</span><span style={{ width: 28, height: 28, borderRadius: '50%', background: item.player.color, border: '2px solid #fff' }} /><span className="font-anton" style={{ color: '#fff', fontSize: 16 }}>{item.player.name}</span><span className="font-staatliches" style={{ color: '#f0de72', marginLeft: 'auto', fontSize: 18 }}>{item.score} {item.score === 1 ? 'PT' : 'PTS'}</span></div>)}</div>
    </div>
    <div className="done-btns" style={{ display: 'flex', gap: 10 }}><Button secondary onClick={onClose}>BROWSE GAMES</Button><Button onClick={restart}><PlayAgainLabel /></Button></div>
  </Screen>
  }

  return <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}><GameNav onBack={onClose} gameId={GAME_ID} /><main style={{ flex: 1, display: 'flex' }}>{content}</main><GameFooter /><style>{`.ttb-artwork{display:block;width:min(420px,82vw);aspect-ratio:1}.ttb-artwork-small{width:min(220px,48vw)}.ttb-results-artwork{display:block;width:128px;aspect-ratio:1;flex:0 0 auto}@media(max-width:768px){.ttb-artwork-small{width:150px}.ttb-results-body{flex-direction:column}.ttb-results-artwork{width:112px}.ttb-results-body>div:last-child{width:100%}.ttb-game-screen{padding:28px 16px 48px!important;gap:18px!important}.ttb-game-screen-compact{padding-top:22px!important;gap:12px!important}}`}</style></div>
}

function Screen({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return <div className={`screen-enter ttb-game-screen${compact ? ' ttb-game-screen-compact' : ''}`} style={{ width: 'min(560px, 100%)', margin: 'auto', padding: compact ? '28px 20px 36px' : '44px 20px 64px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: compact ? 14 : 22 }}>{children}</div>
}
