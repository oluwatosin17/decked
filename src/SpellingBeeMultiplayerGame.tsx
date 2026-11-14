import { useEffect, useRef, useState } from 'react'
import { CompletionFeedbackLink, GameFooter, GameNav } from './components/GameShell'
import SpellingWordCard from './components/SpellingWordCard'
import { supabase } from './multiplayer/supabase'
import type { MultiplayerPlayer, MultiplayerRoom } from './multiplayer/types'
import type { SpellingWord } from './content/spellingBee'
import './read-my-lips.css'
import './spelling-bee.css'

type PrivateTurn = { word: SpellingWord | null; audio_id: string | null; definition: string | null; hint_sentence: string | null }

export default function SpellingBeeMultiplayerGame({ room, players, currentUserId, onClose }: { room: MultiplayerRoom; players: MultiplayerPlayer[]; currentUserId: string; onClose: () => void }) {
  const state = room.game_state.session ?? {}
  const turn = Number(state.sp_turn ?? 0)
  const teamCount = Number(state.sp_team_count ?? 2)
  const seconds = Number(state.sp_seconds ?? 60)
  const rounds = Number(state.sp_rounds ?? 3)
  const phase = String(state.sp_phase ?? 'ready')
  const ids = Array.isArray(state.sp_player_ids) ? state.sp_player_ids.map(String) : []
  const teams = Array.isArray(state.sp_team_names) ? state.sp_team_names.map(String) : []
  const scores = Array.isArray(state.sp_scores) ? state.sp_scores.map(Number) : Array(teamCount).fill(0)
  const team = turn % teamCount
  const round = Math.floor(turn / teamCount)
  const spellerId = ids[team * 2 + round % 2]
  const speller = players.find(player => player.user_id === spellerId)
  const isSpeller = currentUserId === spellerId
  const [privateTurn, setPrivateTurn] = useState<PrivateTurn | null>(null)
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const timeoutRequested = useRef('')
  const deadline = state.sp_deadline ? Date.parse(String(state.sp_deadline)) : 0
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000))
  const totalTurns = teamCount * rounds
  const winner = scores.filter(score => score === Math.max(...scores)).length === 1 ? teams[scores.indexOf(Math.max(...scores))] : null
  const scoreboard = <div className="rml-scoreboard" data-teams={teamCount}>{scores.map((score, index) => <div key={index}><span>{teams[index] || `Team ${index + 1}`}</span><b>{score}</b></div>)}</div>

  useEffect(() => {
    setPrivateTurn(null)
    setAnswer('')
    if (phase !== 'word' && phase !== 'result' && phase !== 'done') return
    let active = true
    void supabase.rpc('decked_get_spelling_word', { p_room_id: room.id }).then(({ data, error: issue }) => {
      if (!active) return
      if (issue) { setError('Could not load this turn. Refresh and try again.'); return }
      setPrivateTurn(data as PrivateTurn)
    })
    return () => { active = false }
  }, [room.id, turn, phase, room.version])
  useEffect(() => {
    if (phase !== 'word') return
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [phase])
  const action = async (name: 'begin' | 'timeout' | 'next') => {
    if (busy) return
    setBusy(true); setError('')
    const { error: issue } = await supabase.rpc('decked_spelling_action', { p_room_id: room.id, p_action: name, p_expected_turn: turn })
    if (issue) setError(issue.message)
    setBusy(false)
  }
  const submit = async () => {
    if (busy || !isSpeller || !answer.trim() || remaining <= 0) return
    setBusy(true); setError('')
    const { error: issue } = await supabase.rpc('decked_submit_spelling', { p_room_id: room.id, p_expected_turn: turn, p_spelling: answer.trim() })
    if (issue) setError(issue.message)
    setBusy(false)
  }
  useEffect(() => {
    if (phase !== 'word' || !deadline || remaining > 0) return
    const key = `${turn}:${deadline}`
    if (timeoutRequested.current === key) return
    timeoutRequested.current = key
    void supabase.rpc('decked_spelling_action', { p_room_id: room.id, p_action: 'timeout', p_expected_turn: turn }).then(({ error: issue }) => {
      if (issue && !/Time has not run out|Invalid room action/.test(issue.message)) { timeoutRequested.current = ''; setError(issue.message) }
    })
  }, [phase, deadline, remaining, turn, room.id])

  return <div className="game-fullscreen spelling-game"><GameNav onBack={onClose} gameId="spelling-bee"/><main className="rml-main"><section className="rml-shell">
    <p className="rml-kicker">{phase === 'done' ? 'FINAL SCORE' : `TURN ${turn + 1} / ${totalTurns}`}</p>
    {phase !== 'word' && <h1>{phase === 'done' ? winner ? `WINNER: ${winner.toUpperCase()}` : "IT'S A TIE" : phase === 'ready' ? `${speller?.display_name?.toUpperCase() ?? 'PLAYER'} SPELLS` : state.sp_correct ? 'CORRECT!' : 'NO POINT'}</h1>}
    {phase !== 'word' && scoreboard}
    {phase === 'ready' && <><p className="rml-copy">{speller?.display_name} listens, spells aloud, then enters the answer.</p>{isSpeller ? <button className="rml-primary" disabled={busy} onClick={() => void action('begin')}>START TURN</button> : <p className="rml-copy">Waiting for the speller.</p>}</>}
    {phase === 'word' && (isSpeller ? <><SpellingWordCard key={turn} word={null} audioUrl={privateTurn?.audio_id ? `/assets/spelling-pronunciations/${privateTurn.audio_id}.wav` : null} hints={privateTurn?.definition && privateTurn.hint_sentence ? { definition: privateTurn.definition, sentence: privateTurn.hint_sentence } : undefined} seconds={seconds} remaining={remaining} reader={false}/><form className="spelling-answer-form" onSubmit={event => { event.preventDefault(); void submit() }}><label htmlFor="multiplayer-spelling-answer">Spell aloud, then enter the word</label><input id="multiplayer-spelling-answer" autoComplete="off" autoCapitalize="off" spellCheck={false} value={answer} onChange={event => setAnswer(event.target.value)} disabled={busy || remaining <= 0}/><button className="rml-primary" type="submit" disabled={busy || !answer.trim() || remaining <= 0}>CHECK SPELLING</button></form></> : <p className="rml-copy">The active speller is listening to the word privately. Waiting for the result.</p>)}
    {phase === 'result' && <><p className="rml-copy">The spelling was</p><div className="spelling-answer">{privateTurn?.word?.word ?? 'Loading…'}</div>{(isSpeller || room.host_user_id === currentUserId) ? <button className="rml-primary" disabled={busy} onClick={() => void action('next')}>{turn + 1 >= totalTurns ? 'SEE RESULTS' : 'NEXT TURN'}</button> : <p className="rml-copy">Waiting for the next turn.</p>}</>}
    {phase === 'done' && <><img className="rml-trophy" src="/icons/trophy.svg" alt=""/><button className="rml-secondary" onClick={onClose}>LEAVE ROOM</button><CompletionFeedbackLink gameId="spelling-bee"/></>}
    {error && <p className="rml-setup-error" role="alert">{error}</p>}
  </section></main><GameFooter/></div>
}
