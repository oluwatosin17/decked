import { useEffect, useMemo, useState } from 'react'
import { CompletionFeedbackLink, GameFooter, GameNav } from './components/GameShell'
import { COURT_CASES } from './content/notMeYourHonour'
import { setSessionValues } from './multiplayer/roomApi'
import type { MultiplayerPlayer, MultiplayerRoom } from './multiplayer/types'
import { courtStyles } from './NotMeYourHonourGame'

type CourtPhase = 'roles' | 'briefing' | 'opening' | 'evidence-one' | 'objection' | 'evidence-two' | 'twist' | 'closing' | 'voting' | 'verdict' | 'results'
type Props = { room: MultiplayerRoom; players: MultiplayerPlayer[]; currentUserId: string; onClose: () => void }
const primary: React.CSSProperties = { minHeight: 48, padding: '12px 24px', border: 0, borderRadius: 999, background: '#dc2827', color: '#fff', font: "17px 'Staatliches',sans-serif", cursor: 'pointer' }
const secondary: React.CSSProperties = { ...primary, border: '1px solid #fff', background: 'transparent' }

const readJson = <T,>(value: unknown, fallback: T): T => { try { return typeof value === 'string' ? JSON.parse(value) as T : fallback } catch { return fallback } }

function Paper({ label, title, children }: { label: string; title: string; children?: React.ReactNode }) {
  return <article className="court-card"><div className="court-card-paper"><span className="court-rec">● REC</span><p>{label}</p><h2>{title}</h2>{children}<footer>DECKED</footer></div></article>
}

export default function NotMeYourHonourMultiplayerGame({ room, players, currentUserId, onClose }: Props) {
  const session = room.game_state.session ?? {}
  const phase = (session.court_phase as CourtPhase | undefined) ?? 'roles'
  const round = Number(session.court_round ?? 0)
  const caseIds = readJson<string[]>(session.court_case_ids, COURT_CASES.slice(0, 5).map(item => item.id))
  const scores = readJson<Record<string, number>>(session.court_scores, {})
  const currentCase = COURT_CASES.find(item => item.id === caseIds[round]) ?? COURT_CASES[round % COURT_CASES.length]
  const [privateOpen, setPrivateOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const isHost = room.host_user_id === currentUserId
  const roles = useMemo(() => ({ accused: round % players.length, prosecutor: (round + 1) % players.length, judge: (round + 2) % players.length }), [players.length, round])
  const myIndex = players.findIndex(player => player.user_id === currentUserId)
  const myRole = myIndex === roles.accused ? 'ACCUSED' : myIndex === roles.prosecutor ? 'PROSECUTOR' : myIndex === roles.judge ? 'JUDGE' : 'JURY'
  const voters = players.filter((_, index) => index !== roles.accused && index !== roles.prosecutor)
  const voteKey = `court_vote_${round}_${currentUserId}`
  const myVote = session[voteKey] as string | undefined
  const votes = voters.flatMap(player => {
    const value = session[`court_vote_${round}_${player.user_id}`]
    return value === 'guilty' || value === 'not-guilty' ? [{ player, verdict: value }] : []
  })
  const guilty = votes.filter(value => value.verdict === 'guilty').length
  const judgeId = players[roles.judge]?.user_id
  const judgeVote = votes.find(value => value.player.user_id === judgeId)?.verdict
  const verdict = guilty * 2 === votes.length
    ? (judgeVote ?? 'not-guilty')
    : guilty * 2 > votes.length ? 'guilty' : 'not-guilty'

  useEffect(() => { setPrivateOpen(false) }, [round])

  const update = async (values: Record<string, unknown>) => { setBusy(true); setError(''); try { await setSessionValues(room.id, values) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update the courtroom.') } finally { setBusy(false) } }
  const advance = (next: CourtPhase) => update({ court_phase: next })
  const finishVerdict = async () => {
    const winner = verdict === 'guilty' ? players[roles.prosecutor] : players[roles.accused]
    const nextScores = { ...scores, [winner.user_id]: (scores[winner.user_id] ?? 0) + 2 }
    await update({ court_phase: 'verdict', court_scores: JSON.stringify(nextScores) })
  }
  const nextCase = async () => {
    if (round + 1 >= caseIds.length) await update({ court_phase: 'results' })
    else { setPrivateOpen(false); await update({ court_phase: 'roles', court_round: round + 1 }) }
  }

  let content: React.ReactNode
  if (phase === 'roles') content = <><p className="court-kicker">PRIVATE ROLE · CASE {round + 1} OF {caseIds.length}</p>{!privateOpen ? <><h1>YOU ARE THE {myRole}</h1><div className="court-avatar" style={{ background: players[myIndex]?.color }}/><p>Open your private information where nobody else can see it.</p><button style={primary} onClick={() => setPrivateOpen(true)}>OPEN PRIVATE CARD</button></> : <><Paper label={`PRIVATE · ${myRole}`} title={currentCase.title}>{myRole === 'ACCUSED' ? <p className="court-private">{currentCase.accusedSecret}</p> : myRole === 'PROSECUTOR' ? <p className="court-private">{currentCase.prosecutorClue}</p> : myRole === 'JUDGE' ? <p className="court-private">Keep the trial moving, call objections and break any tied decision.</p> : <p className="court-private">Listen for contradictions. Your verdict stays secret until everyone votes.</p>}</Paper><button style={secondary} onClick={() => setPrivateOpen(false)}>HIDE CARD</button></>}{isHost ? <button style={primary} disabled={busy} onClick={() => advance('briefing')}>EVERYONE IS READY</button> : <p>Waiting for the host to open the case…</p>}</>
  else if (phase === 'briefing') content = <><p className="court-kicker">CASE {round + 1} OF {caseIds.length} · {currentCase.category}</p><h1>{currentCase.title}</h1><Paper label={currentCase.setting} title={currentCase.accusation}>{currentCase.briefing.map(item => <p key={item}>{item}</p>)}</Paper><div className="court-role-strip"><span><i style={{ background: players[roles.accused].color }}/><b>ACCUSED</b>{players[roles.accused].display_name}</span><span><i style={{ background: players[roles.prosecutor].color }}/><b>PROSECUTOR</b>{players[roles.prosecutor].display_name}</span><span><i style={{ background: players[roles.judge].color }}/><b>JUDGE</b>{players[roles.judge].display_name}</span></div>{isHost ? <button style={primary} onClick={() => advance('opening')}>BEGIN THE TRIAL</button> : <p>Waiting for the host…</p>}</>
  else if (phase === 'opening') content = <><p className="court-kicker">OPENING ARGUMENTS</p><h1>MAKE YOUR CASE</h1><div className="court-instruction"><b>{players[roles.prosecutor].display_name}</b> prosecutes first.<br/><b>{players[roles.accused].display_name}</b> answers next.</div><p>Keep each argument under 30 seconds.</p>{isHost ? <button style={primary} onClick={() => advance('evidence-one')}>REVEAL EVIDENCE</button> : null}</>
  else if (phase === 'evidence-one' || phase === 'evidence-two') { const second = phase === 'evidence-two'; content = <><p className="court-kicker">EVIDENCE {second ? 'B' : 'A'}</p><Paper label="ENTERED INTO EVIDENCE" title={currentCase.evidence[second ? 1 : 0]}/><p>Both sides must adapt their argument.</p>{isHost ? <button style={primary} onClick={() => advance(second ? 'twist' : 'objection')}>{second ? 'REVEAL THE TWIST' : 'OPEN OBJECTIONS'}</button> : null}</> }
  else if (phase === 'objection') content = <><p className="court-kicker">OBJECTION!</p><h1>{currentCase.objections[(round + players.length) % currentCase.objections.length]}</h1><p>The Judge chooses which side must complete the challenge.</p>{isHost ? <button style={primary} onClick={() => advance('evidence-two')}>CONTINUE THE CASE</button> : null}</>
  else if (phase === 'twist') content = <><p className="court-kicker">PLOT TWIST</p><Paper label="NEW TESTIMONY" title={currentCase.twist}/><p>Both sides have one chance to repair their story.</p>{isHost ? <button style={primary} onClick={() => advance('closing')}>CLOSING ARGUMENTS</button> : null}</>
  else if (phase === 'closing') content = <><p className="court-kicker">FINAL STATEMENTS</p><h1>THE COURT IS LISTENING</h1><div className="court-instruction">Prosecution gets 20 seconds.<br/>The Accused gets the final 20 seconds.</div>{isHost ? <button style={primary} onClick={() => advance('voting')}>OPEN SECRET VOTING</button> : null}</>
  else if (phase === 'voting') content = <><p className="court-kicker">SECRET VERDICT · {votes.length} OF {voters.length} CAST</p><h1>GUILTY OR NOT GUILTY?</h1>{myRole === 'ACCUSED' || myRole === 'PROSECUTOR' ? <div className="court-instruction">You cannot vote in your own case. Wait for the Judge and Jury.</div> : myVote ? <div className="court-instruction">Your verdict is locked. Waiting for the courtroom.</div> : <div className="court-actions"><button style={secondary} disabled={busy} onClick={() => update({ [voteKey]: 'not-guilty' })}>NOT GUILTY</button><button style={primary} disabled={busy} onClick={() => update({ [voteKey]: 'guilty' })}>GUILTY</button></div>}{isHost && votes.length >= voters.length ? <button style={primary} onClick={finishVerdict}>REVEAL THE VERDICT</button> : <p>Votes stay hidden until everyone has decided.</p>}</>
  else if (phase === 'verdict') content = <><p className="court-kicker">THE VERDICT</p><h1>{verdict === 'guilty' ? 'GUILTY!' : 'NOT GUILTY!'}</h1><Paper label={currentCase.title} title={currentCase.accusation}><p>{guilty} guilty · {votes.length - guilty} not guilty</p></Paper><p>The winning side earns 2 points.</p>{isHost ? <button style={primary} onClick={nextCase}>{round + 1 >= caseIds.length ? 'SEE FINAL SCORES' : 'NEXT CASE'}</button> : <p>Waiting for the host…</p>}</>
  else { const ranked = [...players].sort((a,b) => (scores[b.user_id] ?? 0) - (scores[a.user_id] ?? 0)); content = <><p className="court-kicker">COURT ADJOURNED</p><h1>{ranked[0]?.display_name} WINS</h1><div className="court-scores">{ranked.map((player,index) => <div key={player.user_id}><span><i style={{ background: player.color }}/>{index + 1}. {player.display_name}</span><b>{scores[player.user_id] ?? 0} PTS</b></div>)}</div><CompletionFeedbackLink gameId="not-me-your-honour"/></> }

  return <div className="game-fullscreen"><GameNav onBack={onClose} gameId="not-me-your-honour"/><main className="court-main"><section className="court-shell">{content}{error ? <p role="alert" style={{ color: '#ff7c82' }}>{error}</p> : null}<p className="court-brand">DECKED</p></section></main><GameFooter/><style>{courtStyles}</style></div>
}
