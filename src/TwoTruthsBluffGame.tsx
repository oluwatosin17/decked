import { useMemo, useState } from 'react'
import { GameFooter, GameNav, PlayAgainLabel } from './components/GameShell'
import PlayerSetup, { type Player } from './components/PlayerSetup'
import { useGameStep, usePersistentGameState } from './hooks/usePersistentGameState'
import { useMultiplayerSession } from './multiplayer/SessionStateContext'

type Statement = { id: string; text: string }
type VoteMap = Record<string, string>
type ScoreMap = Record<string, number>
type Step = 'playerSetup' | 'write' | 'guess' | 'reveal' | 'done'

const GAME_ID = 'two-truths-bluff'
const STEPS: readonly Step[] = ['playerSetup', 'write', 'guess', 'reveal', 'done']

export function TwoTruthsBluffArtwork({ className = '' }: { className?: string }) {
  return (
    <div className={className} role="img" aria-label="Two Truths and a Bluff" style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', containerType: 'inline-size' }}>
      <img src="/icons/two-truths-bluff/shape-web-1.svg" alt="" style={{ position: 'absolute', inset: '5.25%', width: '89.5%', height: '89.5%' }} />
      <img src="/icons/two-truths-bluff/shape-web-3.svg" alt="" style={{ position: 'absolute', left: '19.88%', top: '19.88%', width: '60.25%', height: '60.25%' }} />
      <img src="/icons/two-truths-bluff/shape-web-2.svg" alt="" style={{ position: 'absolute', left: '20.38%', top: '20.38%', width: '59.24%', height: '59.24%' }} />
      <div className="font-slackey" style={{ position: 'absolute', inset: 0, color: '#8e7905', lineHeight: .86 }}>
        <span style={{ position: 'absolute', left: '31.8%', top: '35.8%', fontSize: '13.47cqw' }}>2</span>
        <span style={{ position: 'absolute', left: '43.5%', top: '39.2%', fontSize: '7.86cqw' }}>TRUTHS</span>
        <span style={{ position: 'absolute', left: '31.8%', top: '49.4%', fontSize: '12.12cqw' }}>&amp;</span>
        <span style={{ position: 'absolute', left: '43.5%', top: '52.3%', fontSize: '7.86cqw' }}>A BLUFF</span>
      </div>
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
  const [drafts, setDrafts] = useState(['', '', ''])
  const [draftBluff, setDraftBluff] = useState(2)
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

  const startRound = (nextRound = round) => {
    setRound(nextRound)
    setStatements([])
    setBluffId('')
    setVotes({})
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
    setStep('guess')
  }

  const vote = (id: string) => {
    const me = multiplayer?.currentUserId ?? eligible.find(key => !effectiveVotes[key])
    if (!me || me === activeKey || effectiveVotes[me]) return
    if (multiplayer) multiplayer.setValue(`${votePrefix}${me}`, id)
    const nextVotes = { ...effectiveVotes, [me]: id }
    if (!multiplayer) setVotes(nextVotes)
    if (!multiplayer && eligible.every(key => nextVotes[key])) setStep('reveal')
  }

  const reveal = () => {
    if (!allVoted) return
    const nextScores = { ...scores }
    eligible.forEach(key => {
      if (effectiveVotes[key] === bluffId) nextScores[key] = (nextScores[key] ?? 0) + 1
      else nextScores[activeKey] = (nextScores[activeKey] ?? 0) + 1
    })
    setScores(nextScores)
    setStep('reveal')
  }

  const nextRound = () => round + 1 >= players.length ? setStep('done') : startRound(round + 1)
  const restart = () => { setRound(0); setStatements([]); setBluffId(''); setVotes({}); setScores({}); setStep(multiplayer ? 'write' : 'playerSetup') }

  let content: React.ReactNode
  if (step === 'playerSetup') content = <PlayerSetup minPlayers={2} initialPlayers={players} onSkip={onClose} onNext={nextPlayers => { setPlayers(nextPlayers); startRound(0) }} />
  else if (step === 'write') content = <Screen>
    <TwoTruthsBluffArtwork className="ttb-artwork ttb-artwork-small" />
    <h1 style={titleStyle}>{active?.name ? `${active.name}'s turn` : 'Your turn'}</h1>
    {isActive ? <>
      <p style={copyStyle}>Write two true statements and one bluff. Only you should know which is which.</p>
      <div style={{ width: '100%', display: 'grid', gap: 10 }}>{drafts.map((value, index) => <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input value={value} onChange={event => setDrafts(items => items.map((item, i) => i === index ? event.target.value : item))} placeholder={`Statement ${index + 1}`} style={fieldStyle} /><button type="button" onClick={() => setDraftBluff(index)} className="font-staatliches" style={{ minWidth: 76, height: 42, borderRadius: 999, border: draftBluff === index ? '1px solid #8e7905' : '1px dashed rgba(255,255,255,.12)', background: draftBluff === index ? '#f0de72' : '#070708', color: draftBluff === index ? '#3a3100' : 'rgba(255,255,255,.55)' }}>BLUFF</button></div>)}</div>
      <Button disabled={drafts.some(item => !item.trim())} onClick={submitStatements}>SHUFFLE & SHARE</Button>
    </> : <p style={copyStyle}>{active?.name} is writing two truths and a bluff. You’ll see all three together when they are ready.</p>}
  </Screen>
  else if (step === 'guess' || step === 'reveal') {
    const me = multiplayer?.currentUserId ?? eligible.find(key => !effectiveVotes[key])
    const canVote = step === 'guess' && Boolean(me) && me !== activeKey && !effectiveVotes[me!]
    content = <Screen>
      <h1 style={titleStyle}>{step === 'reveal' ? 'The bluff is revealed' : `Which one is ${active?.name}'s bluff?`}</h1>
      <p style={copyStyle}>{step === 'reveal' ? 'Correct guesses earn one point. The storyteller earns one point for every player fooled.' : 'Ask questions, then choose the statement you think is the bluff.'}</p>
      <div style={{ width: '100%', display: 'grid', gap: 12 }}>{statements.map((statement, index) => { const selected = me ? effectiveVotes[me] === statement.id : false; const isBluff = step === 'reveal' && statement.id === bluffId; return <button key={statement.id} disabled={!canVote} onClick={() => vote(statement.id)} style={{ ...surfaceStyle, minHeight: 78, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, color: '#fff', textAlign: 'left', cursor: canVote ? 'pointer' : 'default', border: isBluff ? '2px solid #f0de72' : selected ? '2px solid #e8292d' : surfaceStyle.border }}><span className="font-slackey" style={{ color: '#8e7905', fontSize: 22 }}>{index + 1}</span><span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: 16, lineHeight: 1.35, flex: 1 }}>{statement.text}</span>{isBluff && <span className="font-staatliches" style={{ color: '#f0de72' }}>BLUFF</span>}</button> })}</div>
      {step === 'guess' && <p style={copyStyle}>{Object.keys(effectiveVotes).length} of {eligible.length} guesses submitted</p>}
      {step === 'guess' && isHost && <Button disabled={!allVoted} onClick={reveal}>REVEAL THE BLUFF</Button>}
      {step === 'reveal' && isHost && <Button onClick={nextRound}>{round + 1 >= players.length ? 'SEE RESULTS' : 'NEXT PLAYER'}</Button>}
    </Screen>
  } else content = <Screen>
    <TwoTruthsBluffArtwork className="ttb-artwork ttb-artwork-small" />
    <h1 style={titleStyle}>YOU'RE DECKED</h1>
    <div style={{ width: '100%', display: 'grid', gap: 8 }}>{players.map((player, index) => <div key={playerKey(player, index)} style={{ ...surfaceStyle, minHeight: 56, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ width: 30, height: 30, borderRadius: '50%', background: player.color, border: '2px solid #fff' }} /><span className="font-anton" style={{ color: '#fff', fontSize: 17 }}>{player.name}</span><span className="font-staatliches" style={{ color: '#f0de72', marginLeft: 'auto', fontSize: 18 }}>{scores[playerKey(player, index)] ?? 0} PTS</span></div>)}</div>
    <div className="done-btns" style={{ display: 'flex', gap: 10 }}><Button secondary onClick={onClose}>BROWSE GAMES</Button><Button onClick={restart}><PlayAgainLabel /></Button></div>
  </Screen>

  return <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}><GameNav onBack={onClose} /><main style={{ flex: 1, display: 'flex' }}>{content}</main><GameFooter /><style>{`.ttb-artwork{display:block;width:min(420px,82vw);aspect-ratio:1}.ttb-artwork-small{width:min(220px,48vw)}@media(max-width:768px){.ttb-artwork-small{width:150px}.ttb-game-screen{padding:28px 16px 48px!important;gap:18px!important}}`}</style></div>
}

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="screen-enter ttb-game-screen" style={{ width: 'min(560px, 100%)', margin: 'auto', padding: '44px 20px 64px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>{children}</div>
}
