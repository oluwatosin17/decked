import { useEffect, useMemo, useState } from 'react'
import { GameFooter, GameNav, PlayAgainLabel } from './components/GameShell'
import DeckSize from './components/DeckSize'
import PlayerSetup, { type Player } from './components/PlayerSetup'
import { useGameStep, usePersistentGameState } from './hooks/usePersistentGameState'
import { useMultiplayerSession } from './multiplayer/SessionStateContext'
import { beginBadAdviceRound, completeBadAdviceRound, getBadAdviceRound, restartBadAdvice, submitBadAdviceAnswer, type AnonymousBadAdviceRound } from './multiplayer/roomApi'
import { BAD_ADVICE_CATEGORIES, shuffledSituations, situationsFor, type BadAdviceCategory } from './content/badAdviceOnly'

type Step = 'playerSetup' | 'categories' | 'rounds' | 'handoff' | 'answer' | 'waiting' | 'reveal' | 'done'
type Answer = { author: string; text: string }
const GAME_ID = 'bad-advice-only'
const STEPS: readonly Step[] = ['playerSetup', 'categories', 'rounds', 'handoff', 'answer', 'waiting', 'reveal', 'done']
const CATEGORY_PRESENTATION: Record<BadAdviceCategory, { icon: string; description: string }> = {
  dating: { icon: '/icons/couples.svg', description: 'Dates, crushes, exes, and romantic disasters.' },
  friends: { icon: '/icons/friends.svg', description: 'Group chats, loyalty tests, and messy friendships.' },
  work: { icon: '/icons/colleague.svg', description: 'Jobs, money mistakes, and workplace chaos.' },
  everyday: { icon: '/icons/everyday.svg', description: 'Awkward moments that only get worse.' },
  naija: { icon: '/icons/family.svg', description: 'Family expectations, relatives, and home drama.' },
  wild: { icon: '/icons/random.svg', description: 'Impossible choices and maximum chaos.' },
}
const playerKey = (player: Player, index: number) => player.userId ?? `local-${index}`
const shell: React.CSSProperties = { width: 'min(620px,100%)', margin: 'auto', padding: '40px 16px 64px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }
const title: React.CSSProperties = { margin: 0, color: '#f8f0df', fontFamily: "'Anton SC',sans-serif", fontSize: 'clamp(34px,8vw,58px)', lineHeight: 1, textAlign: 'center' }
const copy: React.CSSProperties = { margin: 0, color: 'rgba(248,240,223,.7)', fontFamily: "'Satoshi',sans-serif", fontSize: 15, lineHeight: 1.5, textAlign: 'center' }

function Button({ children, onClick, disabled, secondary }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; secondary?: boolean }) {
  return <button className="font-staatliches game-btn" disabled={disabled} onClick={onClick} style={{ minHeight: 48, padding: '10px 24px', borderRadius: 999, border: secondary ? '1px solid #f8f0df' : 0, background: secondary ? 'transparent' : disabled ? '#555' : '#174ba0', color: '#f8f0df', fontSize: 16, cursor: disabled ? 'not-allowed' : 'pointer' }}>{children}</button>
}

export default function BadAdviceOnlyGame({ onClose }: { onClose: () => void }) {
  const multiplayer = useMultiplayerSession()
  const [step, setStep] = useGameStep<Step>(GAME_ID, 'playerSetup', STEPS)
  const [players, setPlayers] = usePersistentGameState<Player[]>(GAME_ID, 'players', [])
  const [categories, setCategories] = usePersistentGameState<BadAdviceCategory[]>(GAME_ID, 'categories', BAD_ADVICE_CATEGORIES.map(item => item.id))
  const [roundCount, setRoundCount] = usePersistentGameState(GAME_ID, 'roundCount', 8)
  const [deck, setDeck] = usePersistentGameState<string[]>(GAME_ID, 'deck', [])
  const [round, setRound] = usePersistentGameState(GAME_ID, 'round', 0)
  const [answers, setAnswers] = usePersistentGameState<Record<string, string>>(GAME_ID, 'answers', {})
  const [scores, setScores] = usePersistentGameState<Record<string, number>>(GAME_ID, 'scores', {})
  const [writerIndex, setWriterIndex] = usePersistentGameState(GAME_ID, 'writerIndex', 0)
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [actionError, setActionError] = useState('')
  const [anonymousRound, setAnonymousRound] = useState<AnonymousBadAdviceRound | null>(null)
  const isHost = !multiplayer || multiplayer.currentUserId === multiplayer.hostUserId
  const keys = useMemo(() => players.map(playerKey), [players])
  const judgeIndex = players.length ? round % players.length : 0
  const judge = players[judgeIndex]
  const roundState = anonymousRound?.round_number === round ? anonymousRound : null
  const isJudge = multiplayer?.currentUserId === keys[judgeIndex]
  const eligibleKeys = keys.filter((_, index) => index !== judgeIndex)
  const effectiveAnswers = answers
  const me = multiplayer?.currentUserId ?? eligibleKeys[writerIndex]
  const answerCount = multiplayer ? roundState?.answer_count ?? 0 : Object.keys(effectiveAnswers).length
  const allAnswered = multiplayer
    ? !!roundState && roundState.expected_count > 0 && roundState.answer_count >= roundState.expected_count
    : eligibleKeys.length > 0 && eligibleKeys.every(key => effectiveAnswers[key])
  const revealed: Answer[] = useMemo(() => multiplayer
    ? (roundState?.answers ?? []).map(answer => ({ author: answer.answer_id, text: answer.text })).sort((a, b) => a.text.localeCompare(b.text))
    : Object.entries(effectiveAnswers).map(([author, text]) => ({ author, text })).sort((a, b) => a.text.localeCompare(b.text)), [roundState?.answers, effectiveAnswers, multiplayer])

  useEffect(() => {
    if (!multiplayer || !['answer', 'reveal'].includes(step)) return
    let active = true
    getBadAdviceRound(multiplayer.roomId, round)
      .then(state => { if (active) setAnonymousRound(state) })
      .catch(() => { if (active) setActionError('Could not load this round. Please refresh the page.') })
    return () => { active = false }
  }, [multiplayer?.roomId, multiplayer?.roomVersion, round, step])

  useEffect(() => {
    if (!multiplayer || !isHost || step !== 'answer' || roundState) return
    let active = true
    beginBadAdviceRound(multiplayer.roomId, round)
      .then(() => getBadAdviceRound(multiplayer.roomId, round))
      .then(state => { if (active) setAnonymousRound(state) })
      .catch(() => { if (active) setActionError('Could not prepare this round. Please try again.') })
    return () => { active = false }
  }, [multiplayer?.roomId, multiplayer?.roomVersion, isHost, round, roundState, step])

  const begin = async (count = roundCount) => {
    const selected = shuffledSituations(situationsFor(categories)).slice(0, count)
    if (multiplayer) {
      setActionError('')
      try { await beginBadAdviceRound(multiplayer.roomId, 0) }
      catch { setActionError('Could not start the round. Please try again.'); return }
      setAnonymousRound(null)
    }
    setDeck(selected.map(item => item.situation)); setRound(0); setAnswers({}); setScores({}); setWriterIndex(0); setDraft('')
    setStep(multiplayer ? 'answer' : 'handoff')
  }
  const submit = async () => {
    const text = draft.trim()
    if (!text || !me || me === keys[judgeIndex] || (multiplayer ? roundState?.has_answered : effectiveAnswers[me]) || submitting) return
    if (multiplayer) {
      setSubmitting(true)
      setActionError('')
      try {
        await submitBadAdviceAnswer(multiplayer.roomId, round, text, crypto.randomUUID())
        setAnonymousRound(await getBadAdviceRound(multiplayer.roomId, round))
      }
      catch { setActionError('Your answer could not be sent. Please try again.'); setSubmitting(false); return }
      setSubmitting(false)
    } else setAnswers({ ...effectiveAnswers, [me]: text })
    setDraft('')
    if (multiplayer) return
    if (writerIndex + 1 >= eligibleKeys.length) setStep('reveal')
    else { setWriterIndex(index => index + 1); setStep('handoff') }
  }
  const choose = async (author: string) => {
    if (multiplayer && !isJudge) return
    if (multiplayer) {
      if (choosing) return
      setChoosing(true)
      setActionError('')
      try { await completeBadAdviceRound(multiplayer.roomId, round, author); setAnonymousRound(null) }
      catch { setActionError('The winning answer could not be saved. Please try again.'); setChoosing(false); return }
      setChoosing(false)
      return
    }
    setScores(current => ({ ...current, [author]: (current[author] ?? 0) + 1 }))
    if (round + 1 >= deck.length) { setStep('done'); return }
    setRound(index => index + 1); setAnswers({}); setWriterIndex(0); setDraft(''); setStep(multiplayer ? 'answer' : 'handoff')
  }
  const restart = async () => {
    if (multiplayer) {
      const selected = shuffledSituations(situationsFor(categories)).slice(0, roundCount)
      setActionError('')
      try {
        await restartBadAdvice(multiplayer.roomId, {
          answers: {}, baoSessionId: crypto.randomUUID(), deck: selected.map(item => item.situation),
          recentCards: selected.map(item => item.situation), round: 0, roundCount,
          scores: {}, step: 'answer', winnerId: '', writerIndex: 0,
        })
        await beginBadAdviceRound(multiplayer.roomId, 0)
        setAnonymousRound(await getBadAdviceRound(multiplayer.roomId, 0))
      } catch { setActionError('Could not restart Bad Advice. Please try again.') }
      return
    }
    setDeck([]); setRound(0); setAnswers({}); setScores({}); setWriterIndex(0); setDraft(''); setStep('playerSetup')
  }

  let content: React.ReactNode
  if (step === 'playerSetup') content = <PlayerSetup minPlayers={3} initialPlayers={players} onSkip={onClose} onNext={nextPlayers => { setPlayers(nextPlayers); setStep('categories') }} />
  else if (step === 'categories') content = <section style={shell}>
    <p className="font-staatliches" style={{ color: '#f04b45', margin: 0, letterSpacing: '.15em' }}>SET THE CHAOS LEVEL</p>
    <h1 style={title}>Choose situations</h1>
    <p style={copy}>Pick at least one category. Every deck contains original situations recovered from the live game.</p>
    <div className="bad-advice-category-grid">
      {BAD_ADVICE_CATEGORIES.map(category => {
        const active = categories.includes(category.id)
        const presentation = CATEGORY_PRESENTATION[category.id]
        return <button
          key={category.id}
          className="bad-advice-category-card"
          aria-pressed={active}
          onClick={() => setCategories(current => active ? current.filter(id => id !== category.id) : [...current, category.id])}
        >
          <span className="bad-advice-category-icon" aria-hidden="true">
            <img src={presentation.icon} alt="" />
          </span>
          <span className="bad-advice-category-copy">
            <strong className="font-staatliches">{category.label}</strong>
            <span>{presentation.description}</span>
          </span>
          <span className="bad-advice-category-check" aria-hidden="true">✓</span>
        </button>
      })}
    </div>
    <Button disabled={!isHost || categories.length === 0} onClick={() => setStep('rounds')}>CONTINUE</Button>
  </section>
  else if (step === 'rounds') content = isHost
    ? <DeckSize
        title="HOW MANY ROUNDS?"
        description="The judge rotates automatically every round."
        inputLabel="Number of rounds"
        min={3}
        max={30}
        initialValue={roundCount}
        nextLabel="START GAME"
        onBack={() => setStep('categories')}
        onNext={count => { setRoundCount(count); void begin(count) }}
      />
    : <section style={shell}><h1 style={title}>How many rounds?</h1><p style={copy}>The host is choosing the game length.</p></section>
  else if (step === 'handoff') content = <section style={shell}><p className="font-staatliches" style={{ color: '#f04b45', margin: 0 }}>PRIVATE ANSWER</p><h1 style={title}>Pass to {players[keys.indexOf(eligibleKeys[writerIndex])]?.name}</h1><p style={copy}>{judge?.name} is judging. Everyone else should look away.</p><Button onClick={() => setStep('answer')}>I’M READY</Button></section>
  else if (step === 'answer' && multiplayer && roundState?.has_answered) content = <section style={shell}><h1 style={title}>Advice submitted</h1><p style={copy}>{answerCount} of {eligibleKeys.length} answers are in. The judge will reveal them when everyone is ready.</p>{isHost && <Button disabled={!allAnswered} onClick={() => setStep('reveal')}>REVEAL ADVICE</Button>}</section>
  else if (step === 'answer') {
    const isJudge = me === keys[judgeIndex]
    content = <section style={shell}><p className="font-staatliches" style={{ color: '#f04b45', margin: 0 }}>ROUND {round + 1} OF {deck.length}</p><h1 style={{ ...title, fontSize: 'clamp(28px,6vw,44px)' }}>{deck[round]}</h1>{isJudge ? <><p style={copy}>You’re the judge. Wait for everyone’s terrible advice.</p>{isHost && <Button disabled={!allAnswered} onClick={() => setStep('reveal')}>REVEAL ADVICE</Button>}</> : <><label style={{ ...copy, width: '100%', textAlign: 'left' }}>Your worst possible advice<textarea autoFocus maxLength={multiplayer ? 220 : 240} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Make it spectacularly unhelpful…" style={{ width: '100%', minHeight: 130, marginTop: 8, padding: 14, boxSizing: 'border-box', borderRadius: 12, border: '1px solid rgba(248,240,223,.2)', background: '#101114', color: '#f8f0df', font: "16px 'Satoshi',sans-serif", resize: 'vertical' }} /></label><Button disabled={!draft.trim() || submitting || (!!multiplayer && !roundState)} onClick={() => void submit()}>{submitting ? 'SENDING…' : 'SUBMIT ANONYMOUSLY'}</Button>{actionError && <p role="alert" style={{ ...copy, color: '#ff7c82' }}>{actionError}</p>}</>}</section>
  } else if (step === 'waiting') content = <section style={shell}><h1 style={title}>Advice submitted</h1><p style={copy}>{answerCount} of {eligibleKeys.length} answers are in. The judge will reveal them when everyone is ready.</p>{isHost && <Button disabled={!allAnswered} onClick={() => setStep('reveal')}>REVEAL ADVICE</Button>}</section>
  else if (step === 'reveal') content = <section style={shell}><p className="font-staatliches" style={{ color: '#f04b45', margin: 0 }}>{judge?.name} IS THE JUDGE</p><h1 style={title}>Pick the worst advice</h1><p style={copy}>Answers stay anonymous until the judge chooses.</p><div style={{ width: '100%', display: 'grid', gap: 10 }}>{revealed.map((answer, index) => <button key={`${answer.author}-${index}`} disabled={choosing || (!!multiplayer && !isJudge)} onClick={() => void choose(answer.author)} style={{ minHeight: 72, padding: 14, borderRadius: 12, border: '1px dashed rgba(248,240,223,.25)', background: '#f8f0df', color: '#174ba0', font: "600 16px/1.4 'Satoshi',sans-serif", textAlign: 'left', cursor: !multiplayer || isJudge ? 'pointer' : 'default' }}>{answer.text}</button>)}</div>{actionError && <p role="alert" style={{ ...copy, color: '#ff7c82' }}>{actionError}</p>}</section>
  else { const ranked = players.map((player, index) => ({ player, key: playerKey(player, index), score: scores[playerKey(player, index)] ?? 0 })).sort((a, b) => b.score - a.score); content = <section style={shell}><h1 style={title}>BAD ADVICE CHAMPION</h1><p style={copy}>{ranked[0]?.player.name ?? 'Your group'} gave the most gloriously terrible advice.</p><div style={{ width: '100%', display: 'grid', gap: 8 }}>{ranked.map((item, index) => <div key={item.key} style={{ display: 'flex', alignItems: 'center', padding: 13, borderRadius: 12, background: '#101114', color: '#f8f0df' }}><span className="font-staatliches" style={{ color: '#f04b45' }}>#{index + 1}</span><strong style={{ marginLeft: 12, fontFamily: "'Satoshi',sans-serif" }}>{item.player.name}</strong><span className="font-staatliches" style={{ marginLeft: 'auto' }}>{item.score} PTS</span></div>)}</div><div className="done-btns" style={{ display: 'flex', gap: 10 }}><Button secondary onClick={onClose}>BROWSE GAMES</Button><Button onClick={() => void restart()}><PlayAgainLabel /></Button></div>{actionError && <p role="alert" style={{ ...copy, color: '#ff7c82' }}>{actionError}</p>}</section> }

  return <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}><GameNav onBack={onClose} gameId={GAME_ID} /><main style={{ flex: 1, display: 'flex' }}>{content}{step === 'rounds' && actionError && <p role="alert" style={{ ...copy, position: 'fixed', left: '50%', bottom: 84, transform: 'translateX(-50%)', color: '#ff7c82', zIndex: 5 }}>{actionError}</p>}</main><GameFooter /></div>
}
