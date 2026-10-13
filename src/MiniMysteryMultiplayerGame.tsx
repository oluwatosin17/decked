import { useCallback, useEffect, useState } from 'react'
import { GameFooter, GameNav } from './components/GameShell'
import { chooseMiniMysteryVariant, evidenceForRound, findMiniMystery, markMiniMysterySolved, miniMysteryBaseId, type MysteryRole } from './content/miniMystery'
import type { MultiplayerPlayer, MultiplayerRoom } from './multiplayer/types'
import {
  advanceMiniMystery,
  getMiniMysteryState,
  startMiniMysteryGame,
  submitMiniMysteryVote,
  toggleMiniMysteryReady,
  type MiniMysteryPrivateState,
} from './multiplayer/roomApi'

type Props = { room: MultiplayerRoom; players: MultiplayerPlayer[]; currentUserId: string; onClose: () => void }

function Button({ children, onClick, disabled, secondary = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; secondary?: boolean }) {
  return <button type="button" className={secondary ? 'game-btn font-staatliches' : 'game-btn-primary font-staatliches'} onClick={onClick} disabled={disabled} style={{ width: '100%', minHeight: 48, border: secondary ? '1px solid #fff' : 0, borderRadius: 999, padding: '12px 18px', background: secondary ? 'transparent' : '#dc2827', color: '#fff', fontSize: 16, letterSpacing: '.05em', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .45 : 1 }}>{children}</button>
}

function Dossier({ role, round }: { role: MysteryRole; round?: number }) {
  const objective = round ? role.objectives[round - 1] ?? (role.guilty ? 'Make your final case. Name an innocent suspect and explain how the evidence could point to them.' : 'Make your final deduction. Identify one contradiction, name your leading suspect and ask them to explain it.') : ''
  return <article className="mm-online-dossier">
    <p className="mm-online-label">{round ? `ROUND ${round} — PRIVATE OBJECTIVE` : role.guilty ? 'YOUR ROLE — CULPRIT' : 'YOUR PRIVATE ROLE'}</p>
    <h2>{role.name}</h2><h3>{role.title}</h3>
    {round ? <p className="mm-online-objective">{objective}</p> : <div className="mm-online-sections">
      <section><b>YOUR PUBLIC STORY</b><p>{role.publicStory}</p></section>
      <section><b>YOUR SECRET</b><p>{role.secret}</p></section>
      <section><b>WHAT YOU KNOW</b><p>{role.clue}</p></section>
      {role.guilty ? <section className="culprit"><b>WHAT REALLY HAPPENED</b><p>{role.guiltyPlan}</p></section> : null}
    </div>}
    <div className="mm-online-rule" /><footer>DECKED</footer>
  </article>
}

export default function MiniMysteryMultiplayerGame({ room, players, currentUserId, onClose }: Props) {
  const [state, setState] = useState<MiniMysteryPrivateState | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const isHost = room.host_user_id === currentUserId
  const load = useCallback(async () => {
    try { setState(await getMiniMysteryState(room.id)); setError('') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load this case.') }
  }, [room.id])

  useEffect(() => { void load() }, [load, room.version])
  useEffect(() => { setRevealed(false); setSelected(null) }, [state?.gameNumber, state?.phase, state?.round])
  useEffect(() => { if (state?.phase === 'results') markMiniMysterySolved(state.caseId) }, [state?.caseId, state?.phase])
  const run = async (action: () => Promise<void>) => { setBusy(true); setError(''); try { await action(); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Something went wrong.') } finally { setBusy(false) } }

  const mystery = state ? findMiniMystery(state.caseId) : undefined
  const role = state && mystery ? mystery.roles[state.roleIndex] : null
  const eligibleTargets = players.filter(player => player.user_id !== currentUserId)
  const culprit = players.find(player => player.display_name === state?.culpritName)
  let content: React.ReactNode

  if (!state || !mystery || !role) content = <><p className="mm-online-kicker">MINI MYSTERY</p><h1>OPENING THE CASE FILE…</h1></>
  else if (state.phase === 'role_reveal') content = <>
    <p className="mm-online-kicker">PRIVATE DOSSIER · CASE {state.gameNumber}</p>
    {!revealed ? <><div className="mm-online-seal">?</div><h1>YOUR DOSSIER IS READY</h1><p>Make sure nobody else can see your screen.</p><Button onClick={() => setRevealed(true)}>OPEN DOSSIER</Button></> : <><Dossier role={role} /><p>Remember your story, secret and clue.</p><Button disabled={busy || state.ready} onClick={() => run(() => toggleMiniMysteryReady(room.id))}>{state.ready ? 'WAITING FOR EVERYONE…' : "I'VE READ MY DOSSIER"}</Button><button className="mm-online-hide" onClick={() => setRevealed(false)}>Hide my dossier</button></>}
    <p className="mm-online-progress">{state.readyCount} of {players.length} ready</p>
  </>
  else if (state.phase === 'opening') content = <><p className="mm-online-kicker">CASE FILE</p><h1>{mystery.title}</h1><div className="mm-online-panel">{mystery.briefing.map(paragraph => <p className="lead" key={paragraph}>{paragraph}</p>)}<hr /><p className="mm-online-kicker">CONFIRMED FACTS</p>{mystery.knownFacts.map(fact => <p key={fact}>• {fact}</p>)}</div>{isHost ? <Button disabled={busy} onClick={() => run(() => advanceMiniMystery(room.id))}>START ROUND 1</Button> : <div className="mm-online-wait">WAITING FOR THE HOST…</div>}</>
  else if (state.phase === 'objective') content = <><p className="mm-online-kicker">PRIVATE · ROUND {state.round} OF {state.rounds}</p>{!revealed ? <><div className="mm-online-seal">!</div><h1>YOUR NEXT OBJECTIVE</h1><p>Open this privately before questioning begins.</p><Button onClick={() => setRevealed(true)}>SHOW OBJECTIVE</Button></> : <><Dossier role={role} round={state.round} /><Button disabled={busy || state.ready} onClick={() => run(() => toggleMiniMysteryReady(room.id))}>{state.ready ? 'WAITING FOR EVERYONE…' : "I'VE GOT IT"}</Button><button className="mm-online-hide" onClick={() => setRevealed(false)}>Hide objective</button></>}<p className="mm-online-progress">{state.readyCount} of {players.length} ready</p></>
  else if (state.phase === 'discussion') content = <><p className="mm-online-kicker">ROUND {state.round} OF {state.rounds}</p><h1>{state.round === 1 ? 'ESTABLISH YOUR STORIES' : state.round === state.rounds ? 'FINAL INTERROGATION' : 'FOLLOW THE EVIDENCE'}</h1><div className="mm-online-panel"><p className="lead">Stay in character. Complete your objective, question the others and decide whose story does not fit.</p><p>Each player should answer at least one direct question.</p></div>{isHost ? <Button disabled={busy} onClick={() => run(() => advanceMiniMystery(room.id))}>REVEAL EVIDENCE</Button> : <div className="mm-online-wait">QUESTION THE OTHERS…</div>}</>
  else if (state.phase === 'evidence') content = <><p className="mm-online-kicker">EVIDENCE #{state.round}</p><h1>NEW INFORMATION</h1><div className="mm-online-evidence">{evidenceForRound(mystery, state.round, state.rounds).map(item => <p key={item}>{item}</p>)}</div>{isHost ? <Button disabled={busy} onClick={() => run(() => advanceMiniMystery(room.id))}>{state.round < state.rounds ? `START ROUND ${state.round + 1}` : 'MAKE FINAL ACCUSATIONS'}</Button> : <div className="mm-online-wait">WAITING FOR THE HOST…</div>}</>
  else if (state.phase === 'voting') content = <><p className="mm-online-kicker">PRIVATE ACCUSATION</p><h1>WHO DID IT?</h1><div className="mm-online-votes">{eligibleTargets.map(player => <button key={player.user_id} type="button" disabled={state.hasVoted} className={selected === player.user_id ? 'selected' : ''} onClick={() => setSelected(player.user_id)}><span style={{ background: player.color }}>{player.display_name.slice(0, 1).toUpperCase()}</span>{player.display_name}{selected === player.user_id ? <b>✓</b> : null}</button>)}</div><Button disabled={busy || state.hasVoted || !selected} onClick={() => run(() => submitMiniMysteryVote(room.id, selected!))}>{state.hasVoted ? 'ACCUSATION LOCKED' : 'LOCK IN ACCUSATION'}</Button><p className="mm-online-progress">{state.voteCount} of {players.length} accusations submitted</p></>
  else if (state.phase === 'reveal') content = <><p className="mm-online-kicker">THE TRUTH</p><div className="mm-online-seal">!</div><h1>{mystery.solutionBeats[Math.min(state.revealBeat, mystery.solutionBeats.length - 1)]}</h1>{isHost ? <Button disabled={busy} onClick={() => run(() => advanceMiniMystery(room.id))}>{state.revealBeat + 1 < mystery.solutionBeats.length ? 'CONTINUE REVEAL' : 'REVEAL THE CULPRIT'}</Button> : <div className="mm-online-wait">THE CASE IS UNFOLDING…</div>}</>
  else content = <><p className="mm-online-kicker">CASE CLOSED</p><h1>{state.groupWon ? 'THE CULPRIT WAS CAUGHT' : 'THE CULPRIT ESCAPED'}</h1>{culprit ? <div className="mm-online-person"><span style={{ background: culprit.color }} />{state.culpritName}</div> : null}<div className="mm-online-panel mm-online-reveal"><section><p className="mm-online-kicker">WHAT HAPPENED</p><p className="lead">{mystery.finalReveal.what}</p></section><section><p className="mm-online-kicker">HOW</p><p>{mystery.finalReveal.how}</p></section><section><p className="mm-online-kicker">WHY</p><p>{mystery.finalReveal.why}</p></section><section><p className="mm-online-kicker">THE PROOF</p>{mystery.culpritProof.map(item => <p key={item}>• {item}</p>)}</section><section><p className="mm-online-kicker">RED HERRINGS EXPLAINED</p>{mystery.redHerringResolutions.map(item => <p key={item}>• {item}</p>)}</section>{state.accusedName ? <p>The group accused <b>{state.accusedName}</b>.</p> : null}</div><div className="mm-online-results">{players.map(player => <div key={player.user_id}><span>{player.display_name}</span><b>{state.voteCounts[player.user_id] ?? 0} VOTES</b></div>)}</div>{isHost ? <Button disabled={busy} onClick={() => { const next = chooseMiniMysteryVariant(miniMysteryBaseId(state.caseId)); void run(() => startMiniMysteryGame(room.id, next.id, state.rounds)) }}>REMIX CASE</Button> : <div className="mm-online-wait">WAITING FOR THE HOST…</div>}</>

  return <div className="game-fullscreen"><GameNav onBack={onClose} gameId="mini-mystery" /><main className="mm-online-main"><section className="mm-online-card">{content}{error ? <p role="alert" className="mm-online-error">{error}</p> : null}<p className="mm-online-brand">— DECKED —</p></section></main><GameFooter /><style>{`
    .mm-online-main{flex:1;display:grid;place-items:center;padding:36px 16px 72px}.mm-online-card{width:min(620px,calc(100vw - 32px));display:flex;flex-direction:column;align-items:center;gap:20px;text-align:center}.mm-online-card>h1{margin:0;max-width:17ch;color:#fff;font:400 clamp(34px,8vw,54px)/1.03 'Anton SC',sans-serif;text-transform:uppercase}.mm-online-card>p{margin:0;color:rgba(255,255,255,.6);font:15px/1.5 'Satoshi',sans-serif}.mm-online-kicker,.mm-online-progress,.mm-online-brand{font:400 14px/1 'Staatliches',sans-serif!important;letter-spacing:.14em;text-transform:uppercase}.mm-online-kicker{color:#dc2827!important}.mm-online-progress,.mm-online-brand{color:rgba(255,255,255,.42)!important}.mm-online-seal{width:72px;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;background:#dc2827;color:#fff;font:400 38px/1 'Anton SC',sans-serif}.mm-online-hide{border:0;background:none;color:rgba(255,255,255,.55);font:600 14px 'Satoshi',sans-serif;text-decoration:underline;cursor:pointer}.mm-online-wait{width:100%;box-sizing:border-box;padding:16px;border:1px dashed rgba(255,255,255,.14);border-radius:12px;color:rgba(255,255,255,.58);font:400 16px 'Staatliches',sans-serif;letter-spacing:.08em}.mm-online-panel{width:100%;box-sizing:border-box;padding:24px;border-radius:16px;background:#070708;border:1px dashed rgba(255,255,255,.14);text-align:left}.mm-online-panel p{margin:8px 0;color:rgba(255,255,255,.62);font:15px/1.48 'Satoshi',sans-serif}.mm-online-panel .lead{color:#fff;font-size:18px}.mm-online-reveal{display:grid;gap:18px}.mm-online-evidence{width:100%;box-sizing:border-box;padding:32px 25px;border:10px solid #123953;border-radius:16px;background:#f4ead2;color:#08293f;display:grid;gap:14px}.mm-online-evidence p{margin:0;font:700 clamp(19px,5vw,26px)/1.35 'Satoshi',sans-serif}.mm-online-dossier{position:relative;width:min(430px,100%);box-sizing:border-box;padding:clamp(22px,6vw,38px);border:12px solid transparent;border-radius:16px;background:linear-gradient(#f4ead2,#f4ead2) padding-box,repeating-linear-gradient(135deg,#123953 0 12px,#2d6079 12px 15px,#123953 15px 25px) border-box;color:#08293f;text-align:left;box-shadow:inset 0 0 0 2px #7195aa,0 20px 50px rgba(0,0,0,.32)}.mm-online-dossier h2{margin:12px 0 4px;font:400 clamp(34px,9vw,48px)/1 'Anton SC',sans-serif;text-transform:uppercase}.mm-online-dossier h3{margin:0 0 20px;font:700 13px/1.2 'Satoshi',sans-serif;letter-spacing:.12em;text-transform:uppercase}.mm-online-label{margin:0;color:#dc2827;font:13px/1 'Staatliches',sans-serif;letter-spacing:.14em}.mm-online-sections{display:grid;gap:16px}.mm-online-sections b{font:400 13px/1 'Staatliches',sans-serif;letter-spacing:.1em;color:#dc2827}.mm-online-sections p{margin:6px 0 0;font:15px/1.45 'Satoshi',sans-serif}.mm-online-sections .culprit{padding:14px;border-radius:10px;background:#dc2827;color:#fff}.mm-online-sections .culprit b{color:#fff}.mm-online-objective{margin:0;font:700 18px/1.45 'Satoshi',sans-serif}.mm-online-rule{height:2px;background:#08293f;margin-top:26px}.mm-online-dossier footer{margin-top:10px;text-align:center;font:800 11px/1 'Satoshi',sans-serif;letter-spacing:.4em}.mm-online-votes,.mm-online-results{width:100%;display:grid;gap:9px}.mm-online-votes button,.mm-online-results>div{min-height:56px;display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:12px;background:#070708;color:#fff;border:1px dashed rgba(255,255,255,.14);font:700 14px 'Satoshi',sans-serif}.mm-online-votes button{cursor:pointer}.mm-online-votes button.selected{border-style:solid;border-color:#fff}.mm-online-votes button span,.mm-online-person span{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;box-shadow:0 0 0 2px #fff}.mm-online-votes button b,.mm-online-results b{margin-left:auto}.mm-online-results>div{justify-content:space-between}.mm-online-person{display:flex;align-items:center;gap:12px;color:#fff;font:400 22px 'Anton SC',sans-serif;text-transform:uppercase}.mm-online-error{color:#ff7c82!important}
  `}</style></div>
}
