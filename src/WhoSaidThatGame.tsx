import { useState } from 'react'
import { GameFooter, GameNav, PlayAgainLabel } from './components/GameShell'
import PlayerSetup, { type Player } from './components/PlayerSetup'
import DeckSize from './components/DeckSize'
import CustomCards from './components/CustomCards'
import { useGameStep, usePersistentGameState } from './hooks/usePersistentGameState'
import { useMultiplayerSession } from './multiplayer/SessionStateContext'
import { createSessionDeck } from './utils/deckShuffle'
import { WHO_SAID_THAT_PROMPTS } from './content/whoSaidThat'

export { WHO_SAID_THAT_PROMPTS } from './content/whoSaidThat'

const GAME_ID = 'who-said-that'
const STEPS = ['playerSetup', 'deckSize', 'customCards', 'answer', 'guess', 'reveal', 'done'] as const
type Step = typeof STEPS[number]
type Answer = { authorId: string; text: string }
type GuessMap = Record<string, string>
type ScoreMap = Record<string, number>

const shell: React.CSSProperties = { width: 'min(470px, calc(100vw - 32px))', margin: 'auto', padding: '28px 16px 56px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }
const panel: React.CSSProperties = { width: '100%', minHeight: 500, boxSizing: 'border-box', borderRadius: 26, padding: '30px 28px 26px', background: '#fff1d6', border: '8px solid #35152d', boxShadow: '0 24px 70px rgba(0,0,0,.34), inset 0 0 0 2px rgba(53,21,45,.12)', position: 'relative', overflow: 'hidden' }
const button: React.CSSProperties = { minHeight: 48, padding: '10px 22px', border: 0, borderRadius: 999, background: '#f28b2b', color: '#35152d', fontFamily: "'Staatliches', sans-serif", fontSize: 16, cursor: 'pointer' }
const secondaryButton: React.CSSProperties = { ...button, background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.78)' }
const resultsSurface: React.CSSProperties = { width: '100%', boxSizing: 'border-box', borderRadius: 18, padding: 14, background: 'rgba(24,20,36,.92)', border: '1px solid rgba(255,255,255,.08)', boxShadow: '0 20px 60px rgba(0,0,0,.28)' }

function CardHeader({ children }: { children: React.ReactNode }) {
  return <><p className="font-staatliches" style={{ margin: 0, color: '#35152d', letterSpacing: '.16em', position: 'relative' }}>{children}</p><span aria-hidden style={{ width: 48, height: 4, borderRadius: 99, background: '#f28b2b', display: 'block' }} /></>
}

const keyFor = (player: Player, index: number) => player.userId ?? `local-${index}`
function PlayerChip({ player }: { player: Player }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, minHeight: 38, padding: '5px 12px 5px 7px', borderRadius: 999, background: '#35152d', color: '#fff1d6', fontFamily: "'Satoshi', sans-serif", fontWeight: 700, position: 'relative' }}><i style={{ width: 26, height: 26, borderRadius: '50%', background: player.color, border: '2px solid #fff1d6', flex: '0 0 auto' }} />{player.name}</span>
}

export default function WhoSaidThatGame({ onClose }: { onClose: () => void }) {
  const multiplayer = useMultiplayerSession()
  const remotePlayers: Player[] = multiplayer?.players?.map(player => ({ name: player.name, color: player.color, userId: player.userId })) ?? []
  const [step, setStep] = useGameStep<Step>(GAME_ID, multiplayer ? 'deckSize' : 'playerSetup', STEPS)
  const [localPlayers, setLocalPlayers] = usePersistentGameState<Player[]>(GAME_ID, 'players', [])
  const players = multiplayer ? remotePlayers : localPlayers
  const [round, setRound] = usePersistentGameState(GAME_ID, 'round', 0)
  const [answers, setAnswers] = usePersistentGameState<Record<string, string>>(GAME_ID, 'answers', {})
  const [answerIndex, setAnswerIndex] = usePersistentGameState(GAME_ID, 'answerIndex', 0)
  const [revealIndex, setRevealIndex] = usePersistentGameState(GAME_ID, 'revealIndex', 0)
  const [guesses, setGuesses] = usePersistentGameState<GuessMap>(GAME_ID, 'guesses', {})
  const [scores, setScores] = usePersistentGameState<ScoreMap>(GAME_ID, 'scores', {})
  const [totalCards, setTotalCards] = usePersistentGameState(GAME_ID, 'totalCards', 10)
  const [, setCustomCards] = usePersistentGameState<string[]>(GAME_ID, 'customCards', [])
  const [deck, setDeck] = usePersistentGameState<string[]>(GAME_ID, 'deck', [])
  const [scoredReveal, setScoredReveal] = usePersistentGameState(GAME_ID, 'scoredReveal', -1)
  const [draft, setDraft] = useState('')
  const [ready, setReady] = useState(false)
  const [showChoices, setShowChoices] = useState(false)
  const [playerSearch, setPlayerSearch] = useState('')

  const prompt = deck[round] ?? WHO_SAID_THAT_PROMPTS[round % WHO_SAID_THAT_PROMPTS.length]
  const roundCount = Math.max(1, deck.length || totalCards)
  const ids = players.map(keyFor)
  const currentUserId = multiplayer?.currentUserId
  const isHost = !multiplayer || multiplayer.currentUserId === multiplayer.hostUserId
  const submittedCount = ids.filter(id => answers[id]?.trim()).length
  const answerList: Answer[] = ids.filter(id => answers[id]?.trim()).map(authorId => ({ authorId, text: answers[authorId] })).sort((a, b) => `${round}-${a.authorId}`.localeCompare(`${round}-${b.authorId}`))
  const currentAnswer = answerList[revealIndex]
  const eligibleGuessers = currentAnswer ? ids.filter(id => id !== currentAnswer.authorId) : []
  const localAnswerPlayer = players[answerIndex]
  const localAnswerId = localAnswerPlayer ? keyFor(localAnswerPlayer, answerIndex) : ''
  const localGuesserIndex = eligibleGuessers.findIndex(id => !guesses[id])
  const localGuesserId = eligibleGuessers[Math.max(0, localGuesserIndex)]
  const localGuesser = players.find((player, index) => keyFor(player, index) === localGuesserId)
  const myAnswer = currentUserId ? answers[currentUserId] : undefined
  const myGuess = currentUserId ? guesses[currentUserId] : undefined
  const allGuessed = eligibleGuessers.length > 0 && eligibleGuessers.every(id => guesses[id])

  const submitAnswer = (id: string) => {
    const text = draft.trim()
    if (!text) return
    setAnswers(previous => ({ ...previous, [id]: text }))
    setDraft('')
    setReady(false)
    if (!multiplayer) {
      if (answerIndex + 1 >= players.length) { setRevealIndex(0); setGuesses({}); setStep('guess') }
      else setAnswerIndex(index => index + 1)
    }
  }

  const scoreCurrent = () => {
    if (!currentAnswer || scoredReveal === revealIndex) return
    const next = { ...scores }
    let correct = 0
    eligibleGuessers.forEach(id => {
      if (guesses[id] === currentAnswer.authorId) { next[id] = (next[id] ?? 0) + 1; correct += 1 }
    })
    if (correct === 0) next[currentAnswer.authorId] = (next[currentAnswer.authorId] ?? 0) + 1
    setScores(next)
    setScoredReveal(revealIndex)
  }

  const reveal = () => { scoreCurrent(); setStep('reveal') }
  const nextAnswer = () => {
    setShowChoices(false); setPlayerSearch('')
    if (revealIndex + 1 < answerList.length) { setRevealIndex(index => index + 1); setGuesses({}); setStep('guess') }
    else if (round + 1 >= roundCount) setStep('done')
    else { setRound(value => value + 1); setAnswers({}); setAnswerIndex(0); setRevealIndex(0); setGuesses({}); setScoredReveal(-1); setReady(false); setStep('answer') }
  }
  const skipCard = () => {
    setDraft(''); setAnswers({}); setAnswerIndex(0); setRevealIndex(0); setGuesses({}); setScoredReveal(-1); setReady(false); setShowChoices(false); setPlayerSearch('')
    if (round + 1 >= roundCount) setStep('done')
    else setRound(value => value + 1)
  }
  const startGame = (custom: string[]) => {
    setCustomCards(custom)
    setDeck(createSessionDeck(WHO_SAID_THAT_PROMPTS, { customCards: custom, deckSize: totalCards }))
    setRound(0); setAnswers({}); setAnswerIndex(0); setRevealIndex(0); setGuesses({}); setScores({}); setScoredReveal(-1); setReady(false)
    setStep('answer')
  }
  const restart = () => { setRound(0); setAnswers({}); setAnswerIndex(0); setRevealIndex(0); setGuesses({}); setScores({}); setScoredReveal(-1); setReady(false); setShowChoices(false); setPlayerSearch(''); setStep(multiplayer ? 'deckSize' : 'playerSetup') }

  if (step === 'playerSetup') return <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}><GameNav onBack={onClose} gameId={GAME_ID} /><main style={{ flex: 1, display: 'flex' }}><PlayerSetup minPlayers={3} initialPlayers={localPlayers} onSkip={onClose} onNext={next => { setLocalPlayers(next); setAnswers({}); setAnswerIndex(0); setStep('deckSize') }} /></main><GameFooter /></div>
  if (step === 'deckSize') return <div className="game-fullscreen"><GameNav onBack={onClose} gameId={GAME_ID} /><DeckSize onBack={() => multiplayer ? onClose() : setStep('playerSetup')} onNext={value => { setTotalCards(value); setStep('customCards') }} nextLabel="NEXT" /><GameFooter /></div>
  if (step === 'customCards') return <div className="game-fullscreen"><GameNav onBack={onClose} gameId={GAME_ID} /><CustomCards maxCards={totalCards} onBack={() => setStep('deckSize')} onNext={startGame} /><GameFooter /></div>

  let content: React.ReactNode
  if (step === 'answer') {
    const active = multiplayer ? players.find((player, index) => keyFor(player, index) === currentUserId) : localAnswerPlayer
    const activeId = multiplayer ? currentUserId ?? '' : localAnswerId
    const alreadySubmitted = multiplayer ? Boolean(myAnswer) : false
    content = !multiplayer && !ready ? <div style={shell}>
      <p className="font-staatliches" style={{ margin: 0, color: '#f28b2b', letterSpacing: '.14em' }}>ROUND {round + 1} OF {roundCount}</p>
      <div className="who-said-card" style={{ ...panel, minHeight: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, textAlign: 'center' }}>
        <CardHeader>WHO SAID THAT?</CardHeader>
        <h1 className="font-anton" style={{ margin: 0, color: '#35152d', fontSize: 31, lineHeight: 1.18 }}>{prompt}</h1>
        {active && <PlayerChip player={active} />}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="game-btn" style={{ ...secondaryButton, color: '#35152d', borderColor: 'rgba(53,21,45,.55)' }} onClick={skipCard}>SKIP CARD</button>
          <button className="game-btn-primary" style={button} onClick={() => setReady(true)}>I'M READY</button>
        </div>
      </div>
    </div> : <div style={{ ...shell, width: 'min(620px, calc(100vw - 32px))' }}>
      <p className="font-staatliches" style={{ margin: 0, color: '#f28b2b', letterSpacing: '.14em' }}>ROUND {round + 1} OF {roundCount}</p>
      <h1 className="font-anton" style={{ margin: 0, color: '#fff', fontSize: 36, lineHeight: 1.1, textAlign: 'center' }}>{active?.name.toUpperCase()}'S TURN</h1>
      <div style={{ width: '100%', boxSizing: 'border-box', borderRadius: 14, padding: '22px 24px', background: 'rgba(24,20,36,.92)', border: '1px solid rgba(255,255,255,.04)', textAlign: 'center' }}>
        <p className="font-staatliches" style={{ margin: 0, color: 'rgba(255,255,255,.78)', fontSize: 22, lineHeight: 1.25 }}>{prompt}</p>
      </div>
      {alreadySubmitted ? <p style={{ margin: 0, color: 'rgba(255,255,255,.62)', fontFamily: "'Satoshi', sans-serif" }}>Answer locked. Waiting for everyone else… ({submittedCount}/{players.length})</p> : <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}><textarea autoFocus value={draft} onChange={event => setDraft(event.target.value)} maxLength={180} placeholder="TYPE YOUR ANSWER" style={{ width: '100%', minHeight: 96, resize: 'none', boxSizing: 'border-box', padding: 18, borderRadius: 14, border: '1px solid rgba(255,255,255,.09)', background: '#050506', color: '#fff', font: "16px/1.4 'Satoshi', sans-serif", outline: 'none' }} /><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>{isHost && <button className="game-btn" style={secondaryButton} onClick={skipCard}>SKIP CARD</button>}<button className="game-btn-primary" style={{ ...button, opacity: draft.trim() ? 1 : .45 }} disabled={!draft.trim()} onClick={() => submitAnswer(activeId)}>LOCK ANSWER</button></div></div>}
      {multiplayer && submittedCount === players.length && isHost && <button style={button} onClick={() => { setRevealIndex(0); setGuesses({}); setStep('guess') }}>START GUESSING</button>}
    </div>
  } else if (step === 'guess' && currentAnswer) {
    const voterId = multiplayer ? currentUserId ?? '' : localGuesserId
    const voter = multiplayer ? players.find((player, index) => keyFor(player, index) === voterId) : localGuesser
    const isAuthor = voterId === currentAnswer.authorId
    const canGuess = Boolean(voterId) && !isAuthor && !guesses[voterId]
    const selectablePlayers = players.filter((player, index) => keyFor(player, index) !== voterId && player.name.toLowerCase().includes(playerSearch.trim().toLowerCase()))
    content = showChoices && canGuess ? <div style={{ ...shell, width: 'min(760px, calc(100vw - 32px))' }}>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 'min(560px, 100%)', boxSizing: 'border-box', borderRadius: 14, padding: '18px 22px', background: 'rgba(24,20,36,.92)', border: '1px solid rgba(255,255,255,.04)', textAlign: 'center', display: 'grid', gap: 10 }}><p className="font-staatliches" style={{ margin: 0, color: 'rgba(255,255,255,.45)', fontSize: 15, lineHeight: 1.3 }}>{prompt}</p><p style={{ margin: 0, color: '#fff', font: "700 21px/1.3 'Satoshi', sans-serif" }}>“{currentAnswer.text}”</p></div>
        <h1 className="font-anton" style={{ margin: '4px 0 0', color: '#fff', fontSize: 34, lineHeight: 1.1, textAlign: 'center' }}>{voter?.name.toUpperCase()}'S VOTE</h1>
        <p style={{ margin: 0, color: 'rgba(255,255,255,.38)', font: "14px 'Satoshi', sans-serif" }}>{eligibleGuessers.filter(id => guesses[id]).length + 1} of {eligibleGuessers.length}</p>
        {players.length > 8 && <input aria-label="Search players" value={playerSearch} onChange={event => setPlayerSearch(event.target.value)} placeholder="Search players…" style={{ width: 'min(420px, 100%)', height: 48, boxSizing: 'border-box', borderRadius: 12, border: '1px solid rgba(255,241,214,.22)', background: '#fff1d6', color: '#35152d', padding: '0 15px', font: "600 16px 'Satoshi', sans-serif", outline: 'none' }} />}
        <div style={{ width: '100%', maxHeight: 'min(52vh, 520px)', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: 10, padding: 4, boxSizing: 'border-box' }}>
          {selectablePlayers.map((player) => { const id = keyFor(player, players.indexOf(player)); return <button key={id} onClick={() => { setGuesses(previous => ({ ...previous, [voterId]: id })); setShowChoices(false); setPlayerSearch('') }} style={{ minHeight: 56, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: '#070708', color: '#fff', display: 'flex', alignItems: 'center', gap: 11, padding: '8px 13px', font: "700 15px 'Satoshi', sans-serif", cursor: 'pointer', textAlign: 'left' }}><i style={{ width: 30, height: 30, borderRadius: '50%', background: player.color, border: '2px solid rgba(255,255,255,.75)', flexShrink: 0 }} />{player.name}</button> })}
        </div>
        <button style={{ ...button, background: 'transparent', color: '#fff1d6', border: '1px solid rgba(255,241,214,.55)' }} onClick={() => { setShowChoices(false); setPlayerSearch('') }}>BACK TO PROMPT</button>
      </div>
    </div> : <div style={{ ...shell, width: 'min(620px, calc(100vw - 32px))' }}>
      <div style={{ width: '100%', boxSizing: 'border-box', borderRadius: 14, padding: '20px 24px', background: 'rgba(24,20,36,.92)', border: '1px solid rgba(255,255,255,.04)', textAlign: 'center', display: 'grid', gap: 10 }}><p className="font-staatliches" style={{ margin: 0, color: 'rgba(255,255,255,.45)', fontSize: 15, lineHeight: 1.3 }}>{prompt}</p><p style={{ margin: 0, color: '#fff', font: "700 22px/1.3 'Satoshi', sans-serif" }}>“{currentAnswer.text}”</p></div>
      <h1 className="font-anton" style={{ margin: 0, color: '#fff', fontSize: 36, lineHeight: 1.1, textAlign: 'center' }}>{voter?.name.toUpperCase()}'S TURN</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', textAlign: 'center' }}>
        {isAuthor ? <p style={{ color: 'rgba(255,255,255,.58)', fontFamily: "'Satoshi', sans-serif", textAlign: 'center' }}>This answer is yours. Wait for the others to guess.</p> : myGuess && multiplayer ? <p style={{ color: 'rgba(255,255,255,.58)', fontFamily: "'Satoshi', sans-serif" }}>Guess locked. Waiting for everyone else…</p> : canGuess ? <button style={button} onClick={() => setShowChoices(true)}>CHOOSE WHO SAID IT</button> : null}
        {allGuessed && isHost && <button style={button} onClick={reveal}>REVEAL AUTHOR</button>}
      </div>
    </div>
  } else if (step === 'reveal' && currentAnswer) {
    const author = players.find((player, index) => keyFor(player, index) === currentAnswer.authorId)
    const correct = eligibleGuessers.filter(id => guesses[id] === currentAnswer.authorId).length
    content = <div style={shell}><div className="who-said-card" style={{ ...panel, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18, alignItems: 'center', textAlign: 'center' }}><CardHeader>THE AUTHOR WAS</CardHeader>{author && <PlayerChip player={author} />}<blockquote style={{ margin: 0, color: '#35152d', font: "700 22px/1.35 'Satoshi', sans-serif", position: 'relative' }}>“{currentAnswer.text}”</blockquote><p style={{ margin: 0, color: 'rgba(53,21,45,.68)', fontFamily: "'Satoshi', sans-serif", position: 'relative' }}>{correct ? `${correct} ${correct === 1 ? 'player' : 'players'} guessed correctly.` : `${author?.name ?? 'The author'} fooled everyone and earns a point.`}</p>{isHost && <button style={{ ...button, position: 'relative' }} onClick={nextAnswer}>{revealIndex + 1 < answerList.length ? 'NEXT ANSWER' : round + 1 < roundCount ? 'NEXT ROUND' : 'SEE RESULTS'}</button>}</div></div>
  } else {
    const ranked = players.map((player, index) => ({ player, id: keyFor(player, index), score: scores[keyFor(player, index)] ?? 0 })).sort((a, b) => b.score - a.score)
    const topScore = ranked[0]?.score ?? 0
    const winners = ranked.filter(item => item.score === topScore)
    const resultCopy = topScore === 0 ? 'No points this time — the mystery lives on.' : winners.length > 1 ? `${winners.map(item => item.player.name).join(' & ')} tied for the win.` : `${winners[0]?.player.name ?? 'The winner'} knew the group best.`
    content = <div style={{ ...shell, width: 'min(560px, calc(100vw - 32px))' }}><h1 className="font-anton done-heading" style={{ color: '#fff', margin: 0, fontSize: 42 }}>YOU’RE DECKED</h1><p style={{ margin: 0, color: 'rgba(255,255,255,.62)', font: "16px/1.45 'Satoshi', sans-serif", textAlign: 'center' }}>{resultCopy}</p><div style={resultsSurface}><p className="font-staatliches" style={{ margin: '0 0 6px', color: 'rgba(255,255,255,.42)', letterSpacing: '.14em', textAlign: 'center' }}>FINAL SCORES</p>{ranked.map((item, index) => <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 50, padding: '4px 10px', borderRadius: 11, background: index === 0 && topScore > 0 ? 'rgba(242,139,43,.12)' : 'transparent' }}><span className="font-staatliches" style={{ color: index === 0 && topScore > 0 ? '#f28b2b' : 'rgba(255,255,255,.32)', width: 20 }}>{index + 1}</span><i style={{ width: 28, height: 28, borderRadius: '50%', background: item.player.color, border: '2px solid rgba(255,255,255,.8)', flex: '0 0 auto' }} /><span className="font-anton" style={{ color: '#fff', fontSize: 16 }}>{item.player.name}</span><strong className="font-staatliches" style={{ marginLeft: 'auto', color: '#f28b2b', fontSize: 19 }}>{item.score} {item.score === 1 ? 'PT' : 'PTS'}</strong></div>)}</div><div className="done-btns" style={{ display: 'flex', gap: 10 }}><button className="game-btn" style={secondaryButton} onClick={onClose}>BROWSE GAMES</button>{isHost && <button className="game-btn-primary" style={button} onClick={restart}><PlayAgainLabel /></button>}</div></div>
  }

  return <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}><GameNav onBack={onClose} gameId={GAME_ID} /><main style={{ flex: 1, display: 'flex' }}>{content}</main><GameFooter /></div>
}
