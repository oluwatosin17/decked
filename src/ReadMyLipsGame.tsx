import { useEffect, useState } from 'react'
import CheckRegular from '@mingcute/react/core-regular/check'
import GroupRegular from '@mingcute/react/core-regular/group'
import DownSmallRegular from '@mingcute/react/core-regular/down-small'
import CloseRegular from '@mingcute/react/core-regular/close'
import ArrowRightRegular from '@mingcute/react/core-regular/arrow-right'
import { CompletionFeedbackLink, GameFooter, GameNav } from './components/GameShell'
import PlayerSetup from './components/PlayerSetup'
import { RoundLengthScreen, TimerControl } from './CharadesGame'
import { useGameStep, usePersistentGameState } from './hooks/usePersistentGameState'
import { lipsPromptCount, READ_MY_LIPS_CATEGORIES, READ_MY_LIPS_PROMPT_TYPES, shuffledLipsPhrases, type ReadMyLipsPromptSelection, type ReadMyLipsPromptType } from './content/readMyLips'
import { lipsTurnRoles } from './readMyLipsTeams'
import { hasFreshLipsPhrase, nextLipsTurnCard } from './readMyLipsTurn'
import { addLipsDecision, lipsTurnPoints, toggleLipsDecision, undoLipsDecision, type LipsTurnDecision } from './readMyLipsScoring'
import './read-my-lips.css'

const ID = 'read-my-lips'
type Step = 'categories' | 'prompt-type' | 'setup' | 'create-teams' | 'teams' | 'timer' | 'rounds' | 'handoff' | 'playing' | 'judge' | 'result' | 'between' | 'done'
const steps: Step[] = ['categories', 'prompt-type', 'setup', 'create-teams', 'teams', 'timer', 'rounds', 'handoff', 'playing', 'judge', 'result', 'between', 'done']
const MAX_ROUNDS = 30
const teamColors = ['#8b5cf6', '#38bdf8', '#2dd4bf', '#a3e635', '#f472b6', '#facc15']
const categoryIllustrations: Record<string, string> = {
  'funny-ridiculous': '/icons/random.svg',
  'naija-vibes': '/icons/family.svg',
  'love-relationships': '/icons/couples.svg',
  'everyday-life': '/icons/everyday.svg',
  'friends-social-life': '/icons/friends.svg',
  'pop-culture-internet': '/icons/charades-influencers.svg',
  'food-kitchen': '/icons/charades-food.svg',
  'tricky-tongue-twister': '/icons/charades-internet-slang.svg',
}

export default function ReadMyLipsGame({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useGameStep<Step>(ID, 'categories', steps)
  const [names, setNames] = usePersistentGameState<string[]>(ID, 'players', [])
  const [roster, setRoster] = usePersistentGameState<string[]>(ID, 'roster', [])
  const [teamSlots, setTeamSlots] = usePersistentGameState<number[]>(ID, 'teamSlots', [])
  const [teamCount, setTeamCount] = usePersistentGameState(ID, 'teamCount', 2)
  const [teamNames, setTeamNames] = usePersistentGameState<string[]>(ID, 'teamNames', [])
  const [categories, setCategories] = usePersistentGameState<string[]>(ID, 'categories', [])
  const [promptTypes, setPromptTypes] = usePersistentGameState<ReadMyLipsPromptSelection[]>(ID, 'promptTypesV2', [])
  useEffect(() => { if (categories.some(id => !READ_MY_LIPS_CATEGORIES.some(item => item.id === id))) setCategories(current => current.filter(id => READ_MY_LIPS_CATEGORIES.some(item => item.id === id))) }, [categories, setCategories])
  const validPromptTypes = Array.isArray(promptTypes) ? promptTypes.filter(type => type === 'mixed' || READ_MY_LIPS_PROMPT_TYPES.some(item => item.id === type)) : []
  useEffect(() => {
    if (!Array.isArray(promptTypes)) { setPromptTypes([]); return }
    const valid = promptTypes.filter(type => type === 'mixed' || READ_MY_LIPS_PROMPT_TYPES.some(item => item.id === type))
    if (valid.length !== promptTypes.length) setPromptTypes(valid)
  }, [promptTypes, setPromptTypes])
  const [deck, setDeck] = usePersistentGameState<string[]>(ID, 'deck', [])
  const [turn, setTurn] = usePersistentGameState(ID, 'turn', 0)
  const [card, setCard] = usePersistentGameState(ID, 'card', 0)
  const [scores, setScores] = usePersistentGameState<number[]>(ID, 'scores', [0, 0])
  const [roundSeconds, setRoundSeconds] = usePersistentGameState(ID, 'roundSeconds', 60)
  const [roundsPerTeam, setRoundsPerTeam] = usePersistentGameState(ID, 'roundsPerTeam', 2)
  const [turnStartScore, setTurnStartScore] = usePersistentGameState(ID, 'turnStartScore', 0)
  const [, setSkips] = usePersistentGameState(ID, 'skips', 0)
  const [turnHistory, setTurnHistory] = usePersistentGameState<LipsTurnDecision[]>(ID, 'turnHistory', [])
  const [deckExhausted, setDeckExhausted] = usePersistentGameState(ID, 'deckExhausted', false)
  const [deadline, setDeadline] = usePersistentGameState(ID, 'deadline', 0)
  const [pausedSeconds, setPausedSeconds] = usePersistentGameState(ID, 'pausedSeconds', 0)
  const [paused, setPaused] = usePersistentGameState(ID, 'paused', false)
  const [now, setNow] = useState(Date.now())
  const [assigningPlayerIndex, setAssigningPlayerIndex] = useState<number | null>(null)
  const [swapTeamIndex, setSwapTeamIndex] = useState<number | null>(null)
  const { team, speakerIndex, guesserIndex } = lipsTurnRoles(turn, teamCount)
  const speaker = names[speakerIndex] || `Player ${speakerIndex + 1}`
  const guesser = names[guesserIndex] || `Player ${guesserIndex + 1}`
  const teamName = (index: number) => teamNames[index]?.trim() || `Team ${index + 1}`
  const remaining = paused ? pausedSeconds : Math.max(0, Math.ceil((deadline - now) / 1000))
  useEffect(() => {
    if (step !== 'playing' || paused) return
    const tick = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(tick)
  }, [step, paused])
  useEffect(() => {
    if (step !== 'playing' || paused || !deadline || remaining > 0) return
    setDeadline(0)
    setStep('between')
  }, [deadline, paused, remaining, setDeadline, setStep, step])
  useEffect(() => {
    if (step !== 'judge' && step !== 'result') return
    const resumedSeconds = Math.max(1, pausedSeconds || roundSeconds)
    const resumedAt = Date.now()
    setPausedSeconds(resumedSeconds)
    setDeadline(resumedAt + resumedSeconds * 1000)
    setNow(resumedAt)
    setPaused(false)
    setStep('playing')
  }, [pausedSeconds, roundSeconds, setDeadline, setPaused, setPausedSeconds, setStep, step])
  useEffect(() => {
    if (assigningPlayerIndex === null) return
    document.body.classList.add('charades-sheet-open')
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setAssigningPlayerIndex(null); setSwapTeamIndex(null) } }
    window.addEventListener('keydown', closeOnEscape)
    return () => { document.body.classList.remove('charades-sheet-open'); window.removeEventListener('keydown', closeOnEscape) }
  }, [assigningPlayerIndex])
  const canStart = teamCount >= 2 && teamSlots.length === teamCount * 2 && teamSlots.every(slot => slot >= 0 && slot < roster.length) && new Set(teamSlots).size === roster.length
  const validRounds = Number.isInteger(roundsPerTeam) && roundsPerTeam >= 1 && roundsPerTeam <= MAX_ROUNDS
  const promptCount = lipsPromptCount(categories, validPromptTypes)
  const mixedSelected = validPromptTypes.includes('mixed')
  const togglePromptType = (type: ReadMyLipsPromptType) => setPromptTypes(current => {
    const selected = Array.isArray(current) ? current.filter(item => item !== 'mixed') : []
    return selected.includes(type) ? selected.filter(item => item !== type) : [...selected, type]
  })
  const start = () => { if (!canStart || !categories.length || !promptCount || !validRounds) return; setNames(teamSlots.map(index => roster[index])); setDeck(shuffledLipsPhrases(Math.random, categories, validPromptTypes)); setTurn(0); setCard(0); setScores(Array(teamCount).fill(0)); setTurnStartScore(0); setSkips(0); setTurnHistory([]); setDeckExhausted(false); setDeadline(0); setPausedSeconds(roundSeconds); setPaused(false); setStep('handoff') }
  const beginTurn = () => { const startedAt = Date.now(); setTurnHistory([]); setPausedSeconds(roundSeconds); setDeadline(startedAt + roundSeconds * 1000); setNow(startedAt); setPaused(false); setStep('playing') }
  const togglePause = () => { if (paused) { setDeadline(Date.now() + pausedSeconds * 1000); setNow(Date.now()); setPaused(false) } else { setPausedSeconds(remaining); setPaused(true) } }
  const markPhrase = (correct: boolean) => {
    if (step !== 'playing' || remaining <= 0 || paused) return
    const phrase = deck[card]
    if (!phrase) return
    setTurnHistory(previous => addLipsDecision(previous, phrase, correct))
    if (correct) setScores(previous => previous.map((score, index) => index === team ? score + 1 : score))
    else setSkips(value => value + 1)
    setCard(index => index + 1)
    if (!hasFreshLipsPhrase(deck.length, card + 1)) { setDeadline(0); setStep('between') }
  }
  const undoLast = () => {
    if (step !== 'playing') return
    const result = undoLipsDecision(turnHistory)
    if (!result.decision) return
    setTurnHistory(result.history)
    setCard(index => Math.max(0, index - 1))
    if (result.decision.correct) setScores(previous => previous.map((score, index) => index === team ? Math.max(turnStartScore, score - 1) : score))
    else setSkips(value => Math.max(0, value - 1))
  }
  const reviewDecision = (index: number) => {
    if (step !== 'between') return
    const result = toggleLipsDecision(turnHistory, index)
    if (!result.decision) return
    setTurnHistory(result.history)
    if (result.decision.correct) {
      setScores(previous => previous.map((score, scoreIndex) => scoreIndex === team ? Math.max(turnStartScore, score - 1) : score))
      setSkips(value => value + 1)
    } else {
      setScores(previous => previous.map((score, scoreIndex) => scoreIndex === team ? score + 1 : score))
      setSkips(value => Math.max(0, value - 1))
    }
  }
  const endTurn = () => { if (step !== 'playing') return; setPausedSeconds(0); setDeadline(0); setPaused(false); setStep('between') }
  const totalTurns = roundsPerTeam * teamCount
  const next = () => { if (turn + 1 >= totalTurns) { setStep('done'); return } const nextCard = nextLipsTurnCard(card); if (!hasFreshLipsPhrase(deck.length, nextCard)) { setDeckExhausted(true); setStep('done'); return } setCard(nextCard); setTurnHistory([]); setTurnStartScore(scores[(turn + 1) % teamCount] ?? 0); setTurn(turn + 1); setDeadline(0); setPausedSeconds(roundSeconds); setPaused(false); setStep('handoff') }
  const assignPlayer = (playerIndex: number, teamIndex: number) => {
    setTeamSlots(current => {
      const updated = [...current]
      const previousSlot = updated.indexOf(playerIndex)
      if (previousSlot >= teamIndex * 2 && previousSlot < teamIndex * 2 + 2) return updated
      const emptySlot = [teamIndex * 2, teamIndex * 2 + 1].find(index => updated[index] === -1)
      if (emptySlot === undefined) return updated
      if (previousSlot !== -1) updated[previousSlot] = -1
      updated[emptySlot] = playerIndex
      return updated
    })
    setAssigningPlayerIndex(null)
    setSwapTeamIndex(null)
  }
  const swapPlayers = (firstPlayer: number, secondPlayer: number) => {
    setTeamSlots(current => {
      const updated = [...current]
      const firstSlot = updated.indexOf(firstPlayer)
      const secondSlot = updated.indexOf(secondPlayer)
      if (firstSlot === -1 || secondSlot === -1) return updated
      ;[updated[firstSlot], updated[secondSlot]] = [updated[secondSlot], updated[firstSlot]]
      return updated
    })
    setAssigningPlayerIndex(null)
    setSwapTeamIndex(null)
  }
  const exitGame = () => {
    window.localStorage.setItem('decked:game-session:v1:read-my-lips:categories', '[]')
    window.localStorage.setItem('decked:game-session:v1:read-my-lips:step', 'categories')
    onClose()
  }
  return <div className="game-fullscreen rml-game"><GameNav onBack={exitGame} gameId={ID} />
    {step === 'setup' ? <PlayerSetup minPlayers={4} playerCountMultiple={2} initialPlayers={roster.map((name, index) => ({ name, color: ['#e44b22','#f4aa36','#3064a7','#b33f66','#22a7a1','#a759c3'][index % 6] }))} skipLabel="BACK" onSkip={() => setStep('prompt-type')} onNext={players => { setRoster(players.map(player => player.name)); setTeamSlots([]); setTeamNames([]); setTeamCount(0); setStep('create-teams') }} /> : step === 'timer' ? <RoundLengthScreen initialValue={roundSeconds} onBack={() => setStep('teams')} onNext={seconds => { setRoundSeconds(seconds); setStep('rounds') }} nextLabel="NEXT" /> :
    <main className="rml-main"><section className={`rml-shell${step === 'create-teams' || step === 'teams' ? ' rml-team-builder' : ''}`}>
      {step === 'rounds' ? <>
        <h2>HOW MANY ROUNDS?</h2>
        <p className="rml-copy">One round gives every team one timed turn.</p>
        <label className="rml-round-input"><span aria-hidden="true">#</span><input aria-label="Number of rounds per team" type="number" inputMode="numeric" min={1} max={MAX_ROUNDS} value={roundsPerTeam || ''} placeholder="ENTER ROUNDS" onChange={event => setRoundsPerTeam(event.target.value === '' ? 0 : Number(event.target.value))} onBlur={() => { if (!validRounds) setRoundsPerTeam(2) }} /><b>ROUNDS PER TEAM</b></label>
        <p className="rml-round-summary">{validRounds ? <>{teamCount} teams × {roundsPerTeam} {roundsPerTeam === 1 ? 'round' : 'rounds'} = <strong>{totalTurns} total turns</strong></> : <>Enter between 1 and {MAX_ROUNDS} rounds.</>}</p>
        <div className="rml-builder-actions"><button className="rml-secondary" onClick={() => setStep('timer')}>GO BACK</button><button className="rml-primary" disabled={!validRounds} onClick={start}>START GAME</button></div>
      </> : step === 'categories' ? <>
        <h1>PICK CATEGORIES</h1>
        <div className="bad-advice-category-grid rml-category-grid">{READ_MY_LIPS_CATEGORIES.map(category => <button key={category.id} className="bad-advice-category-card rml-category-card" type="button" aria-pressed={categories.includes(category.id)} onClick={() => setCategories(current => current.includes(category.id) ? current.filter(item => item !== category.id) : [...current, category.id])}><span className="bad-advice-category-icon"><img src={categoryIllustrations[category.id] ?? '/icons/random.svg'} alt="" /></span><span className="bad-advice-category-copy"><strong className="font-staatliches">{category.label}</strong></span><span className="bad-advice-category-check" aria-hidden="true"><CheckRegular size={14} /></span></button>)}</div>
        <button className="rml-primary" disabled={!categories.length} onClick={() => setStep('prompt-type')}>NEXT</button>
      </> : step === 'prompt-type' ? <>
        <h2>PICK PROMPT TYPE</h2>
        <p className="rml-copy">Choose Mixed, or select one or more specific types.</p>
        <div className="rml-prompt-type-grid" role="group" aria-label="Prompt types"><button type="button" aria-pressed={mixedSelected} onClick={() => setPromptTypes(['mixed'])}><strong>Mixed</strong></button>{READ_MY_LIPS_PROMPT_TYPES.map(option => <button key={option.id} type="button" aria-pressed={!mixedSelected && validPromptTypes.includes(option.id)} onClick={() => togglePromptType(option.id)}><strong>{option.label}</strong></button>)}</div>
        <div className="rml-builder-actions"><button className="rml-secondary" onClick={() => setStep('categories')}>GO BACK</button><button className="rml-primary" disabled={!promptCount} onClick={() => setStep('setup')}>NEXT</button></div>
      </> : step === 'create-teams' ? <>
        <h2>CREATE YOUR TEAMS</h2>
        <p className="rml-copy">Two players per team</p>
        <div className="rml-builder-list">{teamNames.map((name, index) => <div className="charades-team-row" key={index}><span className="avatar-circle" style={{ width: 24, height: 24, background: teamColors[index % teamColors.length] }} aria-hidden="true"/><input aria-label={`Team ${index + 1} name`} maxLength={18} value={name} onChange={event => setTeamNames(current => current.map((value, nameIndex) => nameIndex === index ? event.target.value : value))} /><button type="button" className="icon-x-btn charades-team-delete" aria-label={`Delete ${name}`} onClick={() => { setTeamNames(current => current.filter((_, nameIndex) => nameIndex !== index)); setTeamCount(count => count - 1); setTeamSlots([]) }}>×</button></div>)}<button type="button" className="add-team-btn charades-add-team" disabled={teamCount * 2 >= roster.length} onClick={() => { setTeamNames(current => [...current, `Team ${current.length + 1}`]); setTeamCount(count => count + 1); setTeamSlots([]) }}>+ ADD TEAM</button></div>
        <div className="rml-builder-actions"><button className="rml-secondary" onClick={() => setStep('setup')}>GO BACK</button><button className="rml-primary" disabled={roster.length % 2 !== 0 || teamCount < 2 || teamCount * 2 !== roster.length || teamNames.some(name => !name.trim())} onClick={() => { if (teamSlots.length !== teamCount * 2) setTeamSlots(Array(teamCount * 2).fill(-1)); setStep('teams') }}>ASSIGN PLAYERS</button></div>
      </> : step === 'teams' ? <>
        <h2>ASSIGN PLAYERS</h2>
        <p className="rml-copy">Choose a team for every player</p>
        <div className="rml-builder-list">{roster.map((name, playerIndex) => { const slot = teamSlots.indexOf(playerIndex); const assignedTeam = slot === -1 ? -1 : Math.floor(slot / 2); return <div className={`charades-player-row${assignedTeam >= 0 ? ' is-assigned' : ''}`} key={playerIndex}><span className="avatar-circle" style={{ width: 32, height: 32, background: teamColors[playerIndex % teamColors.length], boxShadow: '0 0 0 2px #fff' }} aria-hidden="true"/><span className="charades-player-name">{name}</span><button className="charades-team-picker" type="button" onClick={() => { setSwapTeamIndex(null); setAssigningPlayerIndex(playerIndex) }} aria-label={`Choose team for ${name}`}>{assignedTeam >= 0 ? <i style={{ background: teamColors[assignedTeam % teamColors.length] }} /> : <GroupRegular size={18} aria-hidden="true"/>}<span>{assignedTeam >= 0 ? teamName(assignedTeam) : 'Select team'}</span><DownSmallRegular className="charades-team-picker-chevron" size={17} aria-hidden="true"/></button></div> })}</div>
        <div className="rml-builder-actions"><button className="rml-secondary" onClick={() => setStep('create-teams')}>GO BACK</button><button className="rml-primary" disabled={!canStart} onClick={() => setStep('timer')}>NEXT</button></div>
        {assigningPlayerIndex !== null && <div className="charades-drawer-backdrop" role="presentation" onClick={() => { setAssigningPlayerIndex(null); setSwapTeamIndex(null) }}>
          <div className="charades-team-drawer" role="dialog" aria-modal="true" aria-labelledby="rml-drawer-title" onClick={event => event.stopPropagation()}>
            <div className="charades-drawer-heading"><h3 id="rml-drawer-title">{swapTeamIndex === null ? `Select a team for ${roster[assigningPlayerIndex]}` : `Swap ${roster[assigningPlayerIndex]} with…`}</h3><button type="button" onClick={() => { setAssigningPlayerIndex(null); setSwapTeamIndex(null) }} aria-label="Close team picker"><CloseRegular size={19} aria-hidden="true" /></button></div>
            <div className="charades-drawer-options">{swapTeamIndex === null ? teamNames.map((name, teamIndex) => {
              const currentSlot = teamSlots.indexOf(assigningPlayerIndex)
              const selected = currentSlot >= 0 && Math.floor(currentSlot / 2) === teamIndex
              const full = teamSlots.slice(teamIndex * 2, teamIndex * 2 + 2).every(index => index >= 0)
              return <button key={teamIndex} type="button" className={selected ? 'selected' : ''} disabled={selected || (full && currentSlot === -1)} onClick={() => full ? setSwapTeamIndex(teamIndex) : assignPlayer(assigningPlayerIndex, teamIndex)}><i style={{ background: teamColors[teamIndex % teamColors.length] }} aria-hidden="true"/><span>{name}</span><b>{selected ? <CheckRegular size={14} aria-hidden="true"/> : <ArrowRightRegular size={14} aria-hidden="true"/>}</b></button>
            }) : teamSlots.slice(swapTeamIndex * 2, swapTeamIndex * 2 + 2).map(index => <button key={index} type="button" onClick={() => swapPlayers(assigningPlayerIndex, index)}><span>{roster[index]}</span><b><ArrowRightRegular size={14} aria-hidden="true"/></b></button>)}</div>
          </div>
        </div>}
      </> : <>
        <p className="rml-kicker">{step === 'done' ? 'FINAL SCORE' : `TURN ${turn + 1} / ${totalTurns}`}</p>
        <h1>{step === 'done' ? scores.filter(score => score === Math.max(...scores)).length > 1 ? "IT'S A TIE" : `${teamName(scores.indexOf(Math.max(...scores))).toUpperCase()} WINS` : step === 'handoff' ? `${teamName(team).toUpperCase()}'S TURN` : step === 'between' ? 'TURN COMPLETE' : 'MOUTH THE PHRASE'}</h1>
        {['handoff','between','done'].includes(step) && <div className="rml-scoreboard" data-teams={teamCount}>{scores.map((score, index) => <div key={index}><span>{teamName(index)}</span><b>{score}</b></div>)}</div>}
        {step === 'handoff' && <><p className="rml-copy">Pass to {speaker}. {guesser} guesses with headphones + music.</p><p className="rml-copy">{speaker} marks every phrase Correct or Skip · Mouth only · No gestures</p><button className="rml-primary" onClick={beginTurn}>START {teamName(team).toUpperCase()}'S TURN</button></>}
        {step === 'playing' && <><article className="rml-prompt-card" aria-label="Private phrase for speaker"><span>ONLY {speaker.toUpperCase()} SEES THIS</span><p>{deck[card]}</p><b>DECKED</b></article><TimerControl timeLeft={remaining} roundLength={roundSeconds} paused={paused} onTogglePause={togglePause} onCancel={endTurn} cancelLabel="END TURN"/><div className="rml-actions" aria-label="Score this phrase"><button className="rml-secondary" disabled={paused || remaining <= 0} onClick={() => markPhrase(false)}>SKIP</button><button className="rml-primary" disabled={paused || remaining <= 0} onClick={() => markPhrase(true)}>CORRECT +1</button></div><button className="rml-undo" type="button" disabled={!turnHistory.length} onClick={undoLast}>UNDO LAST</button></>}
        {step === 'between' && <><p className="rml-copy">Pass the phone to the next team. Review this turn before confirming.</p><div className="rml-score-adjust" aria-label={`${lipsTurnPoints(turnHistory)} points scored`}><strong>{lipsTurnPoints(turnHistory)}</strong></div>{turnHistory.length ? <div className="rml-turn-review" aria-label={`${teamName(team)} turn review`}>{turnHistory.map((decision, index) => <div key={`${index}-${decision.phrase}`}><span>{decision.phrase}</span><button type="button" className={decision.correct ? 'is-correct' : 'is-skipped'} onClick={() => reviewDecision(index)}>{decision.correct ? 'CORRECT +1' : 'SKIPPED'}</button></div>)}</div> : <p className="rml-copy">No prompts were marked this turn.</p>}<button className="rml-primary" onClick={next}>{turn + 1 >= totalTurns ? 'CONFIRM SCORE & RESULTS' : 'CONFIRM SCORE & NEXT TURN'}</button></>}
        {step === 'done' && <><img className="rml-trophy" src="/icons/trophy.svg" alt=""/>{deckExhausted && <p className="rml-copy" role="status">No unused phrases remain, so this game ended early.</p>}<div className="rml-actions"><button className="rml-secondary" onClick={exitGame}>BROWSE GAMES</button><button className="rml-primary" onClick={start}>PLAY AGAIN</button></div><CompletionFeedbackLink gameId={ID}/></>}
      </>}
    </section></main>}
    <GameFooter /></div>
}
