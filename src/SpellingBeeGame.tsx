import { useEffect, useState } from 'react'
import { GameFooter, GameNav, CompletionFeedbackLink } from './components/GameShell'
import PlayerSetup, { type Player } from './components/PlayerSetup'
import { RoundLengthScreen, TeamBuilderScreen, type GameTeam } from './CharadesGame'
import SpellingLevelSelect from './components/SpellingLevelSelect'
import SpellingWordCard from './components/SpellingWordCard'
import { useGameStep, usePersistentGameState } from './hooks/usePersistentGameState'
import { buildSpellingTurnDeck, isCorrectSpelling, spellingMaxRounds, spellingTurn, type SpellingLevel, type SpellingWord } from './content/spellingBee'
import { normalizeSpelling } from './content/spellingSelection'
import './read-my-lips.css'
import './spelling-bee.css'

const ID = 'spelling-bee'
type Step = 'levels' | 'players' | 'teams' | 'timer' | 'rounds' | 'handoff' | 'word' | 'result' | 'done'
const STEPS: Step[] = ['levels', 'players', 'teams', 'timer', 'rounds', 'handoff', 'word', 'result', 'done']

export default function SpellingBeeGame({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useGameStep<Step>(ID, 'levels', STEPS)
  const [levels, setLevels] = usePersistentGameState<SpellingLevel[]>(ID, 'levels', [])
  const [players, setPlayers] = usePersistentGameState<Player[]>(ID, 'players', [])
  const [teams, setTeams] = usePersistentGameState<GameTeam[]>(ID, 'teams', [])
  const [seconds, setSeconds] = usePersistentGameState(ID, 'seconds', 60)
  const [rounds, setRounds] = usePersistentGameState(ID, 'rounds', 3)
  const [deck, setDeck] = usePersistentGameState<SpellingWord[]>(ID, 'deck', [])
  const [recentWords, setRecentWords] = usePersistentGameState<string[]>(ID, 'recentWords', [])
  const [turn, setTurn] = usePersistentGameState(ID, 'turn', 0)
  const [scores, setScores] = usePersistentGameState<number[]>(ID, 'scores', [])
  const [deadline, setDeadline] = usePersistentGameState(ID, 'deadline', 0)
  const [pausedSeconds, setPausedSeconds] = usePersistentGameState(ID, 'pausedSeconds', 0)
  const [paused, setPaused] = usePersistentGameState(ID, 'paused', false)
  const [lastCorrect, setLastCorrect] = usePersistentGameState<boolean | null>(ID, 'lastCorrect', null)
  const [now, setNow] = useState(Date.now())
  const [answer, setAnswer] = useState('')
  const totalTurns = teams.length * rounds
  const active = teams.length ? spellingTurn(teams, turn) : { teamIndex: 0, round: 0, speller: '' }
  const word = deck[turn]
  const remaining = paused ? pausedSeconds : Math.max(0, Math.ceil((deadline - now) / 1000))
  const maxRounds = teams.length ? Math.min(30, spellingMaxRounds(teams.length, levels)) : 0
  const validRounds = Number.isInteger(rounds) && rounds >= 1 && rounds <= maxRounds

  useEffect(() => {
    if (step !== 'word' || !deadline || paused) return
    const timer = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(timer)
  }, [step, deadline, paused])
  useEffect(() => {
    if (step === 'word' && deadline && !paused && remaining <= 0) {
      setDeadline(0); setLastCorrect(false); setStep('result')
    }
  }, [step, deadline, paused, remaining, setDeadline, setLastCorrect, setStep])
  const begin = () => {
    const start = Date.now(); setNow(start); setPaused(false); setPausedSeconds(seconds); setLastCorrect(null); setAnswer(''); setDeadline(start + seconds * 1000); setStep('word')
  }
  const togglePause = () => {
    if (paused) { const start = Date.now(); setNow(start); setDeadline(start + pausedSeconds * 1000); setPaused(false) }
    else { setPausedSeconds(remaining); setPaused(true) }
  }
  const submitAnswer = () => {
    if (step !== 'word' || !word || paused || remaining <= 0 || !answer.trim()) return
    const correct = isCorrectSpelling(answer, word)
    if (correct) setScores(current => current.map((value, index) => index === active.teamIndex ? value + 1 : value))
    setLastCorrect(correct); setDeadline(0); setStep('result')
  }
  const next = () => {
    if (turn + 1 >= totalTurns) setStep('done')
    else { setTurn(turn + 1); setLastCorrect(null); setStep('handoff') }
  }
  const startGame = () => {
    if (!levels.length) { setStep('levels'); return }
    if (!validRounds || teams.some(team => team.players.length < 2) || teams.length < 2) return
    const nextDeck = buildSpellingTurnDeck(teams.length, rounds, Math.random, levels, new Set(recentWords))
    setDeck(nextDeck); setRecentWords([...new Set([...nextDeck.map(item => normalizeSpelling(item.word)), ...recentWords])].slice(0, 100)); setScores(teams.map(() => 0)); setTurn(0); setDeadline(0); setLastCorrect(null); setStep('handoff')
  }
  const exit = () => { onClose() }
  const scoreboard = <div className="rml-scoreboard" data-teams={teams.length}>{teams.map((team, index) => <div key={team.id}><span>{team.name}</span><b>{scores[index] ?? 0}</b></div>)}</div>

  return <div className="game-fullscreen spelling-game"><GameNav onBack={exit} gameId={ID} />
    {step === 'levels' ? <main className="rml-main"><SpellingLevelSelect selected={levels} onChange={setLevels} onBack={exit} onNext={() => setStep('players')} /></main> :
      step === 'players' ? <PlayerSetup minPlayers={4} initialPlayers={players} onNext={value => { setPlayers(value); setTeams([]); setStep('teams') }} skipLabel="GO BACK" onSkip={() => setStep('levels')} /> :
      step === 'teams' ? <TeamBuilderScreen players={players} initialTeams={teams} onBack={() => setStep('players')} onNext={value => { setTeams(value); setStep('timer') }} /> :
      step === 'timer' ? <RoundLengthScreen initialValue={seconds} onBack={() => setStep('teams')} onNext={value => { setSeconds(value); setStep('rounds') }} nextLabel="NEXT" /> :
      <main className="rml-main"><section className="rml-shell">
        {step === 'rounds' ? <><h1>HOW MANY ROUNDS?</h1><p className="rml-copy">Every team spells once per round.</p><label className="rml-round-input"><span aria-hidden="true">#</span><input aria-label="Rounds per team" type="number" min="1" max={maxRounds} value={rounds || ''} onChange={event => setRounds(Number(event.target.value))}/><b>ROUNDS PER TEAM</b></label><p className="rml-copy">Up to {maxRounds} rounds with {teams.length} teams.</p><div className="rml-builder-actions"><button className="rml-secondary" onClick={() => setStep('timer')}>GO BACK</button><button className="rml-primary" disabled={!validRounds} onClick={startGame}>START GAME</button></div></> :
          step === 'handoff' ? <><p className="rml-kicker">TURN {turn + 1} / {totalTurns}</p><h1>{active.speller.toUpperCase()} SPELLS</h1>{scoreboard}<p className="rml-copy">Listen, spell aloud, then enter the answer.</p><button className="rml-primary" onClick={begin}>START TURN</button></> :
          step === 'word' ? <><p className="rml-kicker">ROUND {active.round + 1} · {teams[active.teamIndex]?.name}</p><SpellingWordCard key={turn} word={word} seconds={seconds} remaining={remaining} paused={paused} onTogglePause={togglePause} onEndTurn={() => { setDeadline(0); setLastCorrect(false); setStep('result') }} reader={false} /><form className="spelling-answer-form" onSubmit={event => { event.preventDefault(); submitAnswer() }}><label htmlFor="spelling-answer">Spell aloud, then enter the word</label><input id="spelling-answer" autoComplete="off" autoCapitalize="off" spellCheck={false} value={answer} onChange={event => setAnswer(event.target.value)} disabled={paused || remaining <= 0} /><button className="rml-primary" type="submit" disabled={paused || remaining <= 0 || !answer.trim()}>CHECK SPELLING</button></form></> :
          step === 'result' ? <><p className="rml-kicker">TURN {turn + 1} / {totalTurns}</p><h1>{lastCorrect ? 'CORRECT!' : 'NO POINT'}</h1><p className="rml-copy">The spelling was</p><div className="spelling-answer">{word?.word}</div>{scoreboard}<button className="rml-primary" onClick={next}>{turn + 1 >= totalTurns ? 'SEE RESULTS' : 'NEXT TURN'}</button></> :
          <><p className="rml-kicker">FINAL SCORE</p><h1>{scores.filter(score => score === Math.max(...scores)).length === 1 ? `WINNER: ${teams[scores.indexOf(Math.max(...scores))]?.name.toUpperCase()}` : "IT'S A TIE"}</h1><img className="rml-trophy" src="/icons/trophy.svg" alt=""/>{scoreboard}<div className="rml-actions"><button className="rml-secondary" onClick={exit}>BROWSE GAMES</button><button className="rml-primary" onClick={startGame}>PLAY AGAIN</button></div><CompletionFeedbackLink gameId={ID}/></>}
      </section></main>}
    <GameFooter />
  </div>
}
