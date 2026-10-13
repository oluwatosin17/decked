import { useEffect, useState } from 'react'
import { passAndPlayTracker } from './analytics/passAndPlay'
import { GameFooter, GameNav } from './components/GameShell'
import PlayerSetup, { type Player } from './components/PlayerSetup'
import { ImposterWordCard } from './components/ImposterWordCard'
import DeckSize from './components/DeckSize'
import { ImposterCategorySelect } from './components/ImposterCategorySelect'
import { getImposterPairs, IMPOSTER_CATEGORIES, type ImposterCategory, type ImposterWordPair } from './content/imposter'

type Phase = 'categories' | 'rounds' | 'setup' | 'handoff' | 'word' | 'clue' | 'discussion' | 'vote-handoff' | 'vote' | 'results'
const GAME_ID = 'imposter'
const randomIndex = (length: number) => { const values = new Uint32Array(1); crypto.getRandomValues(values); return values[0] % length }
const shell: React.CSSProperties = { width: 'min(560px, calc(100vw - 32px))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }
const panel: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#070708', border: '1px dashed rgba(255,255,255,.10)', borderRadius: 20, padding: 'clamp(24px, 6vw, 44px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }
const heading: React.CSSProperties = { margin: 0, color: '#fff', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: 'clamp(34px, 8vw, 48px)', lineHeight: 1.05, textTransform: 'uppercase' }
const body: React.CSSProperties = { margin: 0, color: 'rgba(255,255,255,.58)', fontFamily: "'Satoshi', sans-serif", fontSize: 15, lineHeight: 1.45 }
const kicker: React.CSSProperties = { margin: 0, color: '#dc2827', fontFamily: "'Staatliches', sans-serif", fontSize: 14, letterSpacing: '.14em', textTransform: 'uppercase' }
const primary: React.CSSProperties = { border: 0, borderRadius: 999, padding: '12px 24px', background: '#dc2827', color: '#fff', fontFamily: "'Staatliches', sans-serif", fontSize: 16, letterSpacing: '.05em', cursor: 'pointer' }
const secondary: React.CSSProperties = { ...primary, border: '1px solid #fff', background: 'transparent' }

function PlayerChip({ player }: { player: Player }) {
  return <div className="setup-card-row" style={{ minHeight: 56, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, background: '#070708', border: '1px dashed rgba(255,255,255,.10)' }}><span className="avatar-circle" style={{ width: 32, height: 32, background: player.color, boxShadow: '0 0 0 2.5px #fff' }} /><strong style={{ color: '#fff', fontFamily: "'Anton SC',sans-serif", fontSize: 18, fontWeight: 400 }}>{player.name.toUpperCase()}</strong></div>
}

export default function ImposterPassAndPlayGame({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('categories')
  const [categories, setCategories] = useState<ImposterCategory[]>(IMPOSTER_CATEGORIES.map(category => category.id))
  const [roundCount, setRoundCount] = useState(3)
  const [players, setPlayers] = useState<Player[]>([])
  const [pair, setPair] = useState<ImposterWordPair | null>(null)
  const [imposterIndex, setImposterIndex] = useState(0)
  const [revealIndex, setRevealIndex] = useState(0)
  const [clueRound, setClueRound] = useState(1)
  const [turnIndex, setTurnIndex] = useState(0)
  const [voterIndex, setVoterIndex] = useState(0)
  const [votes, setVotes] = useState<number[]>([])
  const [selectedVote, setSelectedVote] = useState<number | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(`decked:game-session:v1:${GAME_ID}:players`, JSON.stringify(players.map(() => ({}))))
      localStorage.setItem(`decked:game-session:v1:${GAME_ID}:roundCount`, JSON.stringify(roundCount))
      localStorage.setItem(`decked:game-session:v1:${GAME_ID}:roundIndex`, JSON.stringify(Math.max(0, clueRound - 1)))
    } catch { /* Analytics remain best-effort when storage is unavailable. */ }
    passAndPlayTracker.observeStep(GAME_ID, phase, 'categories')
    passAndPlayTracker.observeValue(GAME_ID, 'roundIndex', Math.max(0, clueRound - 1))
  }, [clueRound, phase, players.length, roundCount])

  const deal = (nextPlayers: Player[]) => { const pool = getImposterPairs(categories); setPlayers(nextPlayers); setPair(pool[randomIndex(pool.length)]); setImposterIndex(randomIndex(nextPlayers.length)); setRevealIndex(0); setClueRound(1); setTurnIndex(0); setVoterIndex(0); setVotes([]); setSelectedVote(null); setPhase('handoff') }
  const hideAndContinue = () => revealIndex + 1 < players.length ? (setRevealIndex(value => value + 1), setPhase('handoff')) : (setTurnIndex(0), setPhase('clue'))
  const advanceClue = () => turnIndex + 1 < players.length ? setTurnIndex(value => value + 1) : setPhase('discussion')
  const continueRound = () => clueRound < roundCount ? (setClueRound(value => value + 1), setTurnIndex(0), setPhase('clue')) : (setVoterIndex(0), setPhase('vote-handoff'))
  const lockVote = () => { if (selectedVote == null) return; setVotes(current => [...current, selectedVote]); setSelectedVote(null); if (voterIndex + 1 < players.length) { setVoterIndex(value => value + 1); setPhase('vote-handoff') } else setPhase('results') }

  if (phase === 'categories') return <div className="game-fullscreen"><GameNav onBack={onClose} gameId={GAME_ID} /><main style={{ flex: 1, display: 'flex' }}><ImposterCategorySelect selected={categories} onChange={setCategories} onBack={onClose} onNext={() => setPhase('rounds')} /></main><GameFooter /></div>
  if (phase === 'rounds') return <div className="game-fullscreen"><GameNav onBack={onClose} gameId={GAME_ID} /><main style={{ flex: 1, display: 'flex' }}><DeckSize title="NUMBER OF ROUNDS" description="How many clue rounds do you want to play?" inputLabel="Number of rounds" min={1} max={10} initialValue={roundCount} nextLabel="NEXT" onBack={() => setPhase('categories')} onNext={rounds => { setRoundCount(rounds); setPhase('setup') }} /></main><GameFooter /></div>
  if (phase === 'setup') return <div className="game-fullscreen"><GameNav onBack={onClose} gameId={GAME_ID} /><main style={{ flex: 1, display: 'flex' }}><PlayerSetup minPlayers={3} initialPlayers={players} skipLabel="GO BACK" onSkip={() => setPhase('rounds')} onNext={deal} /></main><GameFooter /></div>

  const counts = players.map((_, index) => votes.filter(vote => vote === index).length)
  const highest = Math.max(0, ...counts)
  const leaders = counts.map((count, index) => count === highest ? index : -1).filter(index => index >= 0)
  const accused = leaders.length === 1 ? leaders[0] : null
  const groupWon = accused === imposterIndex
  let content: React.ReactNode

  if (phase === 'handoff') content = <><p style={kicker}>PASS THE PHONE · {revealIndex + 1} OF {players.length}</p><h1 style={heading}>{players[revealIndex].name}’S TURN</h1><PlayerChip player={players[revealIndex]} /><p style={body}>Make sure nobody else can see the screen.</p><button className="game-btn-primary" style={primary} onClick={() => setPhase('word')}>SHOW MY WORD</button></>
  else if (phase === 'word') content = <><ImposterWordCard word={revealIndex === imposterIndex ? pair?.imposter : pair?.regular} /><p style={body}>Remember it. Don’t say it or show anyone.</p><button className="game-btn-primary" style={primary} onClick={hideAndContinue}>HIDE &amp; {revealIndex + 1 < players.length ? 'PASS ON' : 'START ROUND 1'}</button></>
  else if (phase === 'clue') content = <><p style={kicker}>ROUND {clueRound} OF {roundCount} · CLUE {turnIndex + 1} OF {players.length}</p><h1 style={heading}>{players[turnIndex].name}’S TURN</h1><PlayerChip player={players[turnIndex]} /><div style={{ ...panel, padding: 28 }}><p style={{ ...body, color: '#fff', fontSize: 18 }}>Give one short clue about your word. Don’t repeat a clue or say the word.</p></div><button className="game-btn-primary" style={primary} onClick={advanceClue}>CLUE GIVEN</button></>
  else if (phase === 'discussion') content = <><p style={kicker}>ROUND {clueRound} COMPLETE</p><h1 style={heading}>DISCUSS THE CLUES</h1><div style={{ ...panel, padding: 28 }}><p style={{ ...body, color: '#fff', fontSize: 18 }}>Who sounds suspicious? Defend your clue without revealing your word.</p></div><button className="game-btn-primary" style={primary} onClick={continueRound}>{clueRound < roundCount ? `START ROUND ${clueRound + 1}` : 'START PRIVATE VOTING'}</button></>
  else if (phase === 'vote-handoff') content = <><p style={kicker}>PASS THE PHONE · VOTE {voterIndex + 1} OF {players.length}</p><h1 style={heading}>{players[voterIndex].name}’S VOTE</h1><PlayerChip player={players[voterIndex]} /><p style={body}>Make sure nobody else can see your choice.</p><button className="game-btn-primary" style={primary} onClick={() => setPhase('vote')}>CHOOSE A PLAYER</button></>
  else if (phase === 'vote') content = <><p style={kicker}>PRIVATE VOTE</p><h1 style={heading}>WHO IS THE IMPOSTER?</h1><div style={{ width: '100%', display: 'grid', gap: 10 }}>{players.map((player, index) => index === voterIndex ? null : <button key={`${player.name}-${index}`} className="setup-card-row game-btn" onClick={() => setSelectedVote(index)} style={{ minHeight: 56, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12, background: '#070708', border: selectedVote === index ? '1px solid #fff' : '1px dashed rgba(255,255,255,.10)', color: '#fff', cursor: 'pointer' }}><span className="avatar-circle" style={{ width: 32, height: 32, background: player.color, boxShadow: '0 0 0 2.5px #fff' }} /><strong style={{ fontFamily: "'Anton SC',sans-serif", fontSize: 18, fontWeight: 400 }}>{player.name.toUpperCase()}</strong>{selectedVote === index ? <span aria-label="Selected" style={{ marginLeft: 'auto', color: '#fff', font: "700 22px/1 'Satoshi',sans-serif" }}>✓</span> : null}</button>)}</div><button className={selectedVote == null ? 'game-btn' : 'game-btn-primary'} disabled={selectedVote == null} style={{ ...primary, background: selectedVote == null ? '#2a2a2a' : '#dc2827', color: selectedVote == null ? '#555' : '#fff', cursor: selectedVote == null ? 'not-allowed' : 'pointer' }} onClick={lockVote}>LOCK IN VOTE</button></>
  else content = <>
    <div style={{ display: 'grid', justifyItems: 'center', gap: 8 }}>
      <p style={kicker}>GAME COMPLETE</p>
      <h1 className="done-heading" style={heading}>{groupWon ? 'THE GROUP CAUGHT THEM' : accused == null ? 'THE VOTE WAS TIED' : 'THE IMPOSTER ESCAPED'}</h1>
    </div>
    <PlayerChip player={players[imposterIndex]} />
    <p style={body}>was the Imposter</p>
    <div style={{ background: '#070708', border: '1px dashed rgba(255,255,255,.10)', borderRadius: 12, display: 'flex', alignItems: 'stretch', padding: '20px 24px', width: '100%', boxSizing: 'border-box' }}>
      {[{ label: 'GROUP WORD', word: pair?.regular }, { label: 'IMPOSTER WORD', word: pair?.imposter }].map((item, index) => <div key={item.label} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'stretch' }}>
        {index > 0 ? <span aria-hidden="true" style={{ width: 1, background: 'rgba(255,255,255,.10)', margin: '0 24px' }} /> : null}
        <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 7, textAlign: 'center' }}>
          <small style={{ ...kicker, fontSize: 12 }}>{item.label}</small>
          <strong style={{ color: '#fff', font: "clamp(23px,6vw,32px)/1 'Anton SC',sans-serif", overflowWrap: 'anywhere' }}>{item.word?.toUpperCase()}</strong>
        </div>
      </div>)}
    </div>
    <p style={body}>{accused != null ? `The group selected ${players[accused].name} with ${highest} vote${highest === 1 ? '' : 's'}.` : 'Nobody received a clear majority.'}</p>
    <div className="done-btns" style={{ display: 'flex', gap: 10 }}><button className="game-btn" style={secondary} onClick={() => setPhase('setup')}>CHANGE PLAYERS</button><button className="game-btn-primary" style={primary} onClick={() => deal(players)}>PLAY AGAIN</button></div>
  </>

  return <div className="game-fullscreen"><GameNav onBack={onClose} gameId={GAME_ID} /><main className="screen-enter" style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '36px 16px 72px' }}><div style={shell}>{content}</div></main><GameFooter /></div>
}
