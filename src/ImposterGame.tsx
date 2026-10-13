import { useCallback, useEffect, useState } from 'react'
import { GameFooter, GameNav } from './components/GameShell'
import { ImposterWordCard } from './components/ImposterWordCard'
import type { MultiplayerPlayer, MultiplayerRoom } from './multiplayer/types'
import {
  advanceImposterClue,
  continueImposterRound,
  getImposterState,
  startImposterGame,
  submitImposterVote,
  toggleImposterReady,
  type ImposterPrivateState,
} from './multiplayer/roomApi'

type Props = {
  room: MultiplayerRoom
  players: MultiplayerPlayer[]
  currentUserId: string
  onClose: () => void
}

function Button({ children, onClick, disabled, secondary = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; secondary?: boolean }) {
  return <button type="button" className={secondary ? 'game-btn font-staatliches' : 'game-btn-primary font-staatliches'} onClick={onClick} disabled={disabled} style={{ width: '100%', minHeight: 48, border: secondary ? '1px solid #fff' : 0, borderRadius: 999, padding: '12px 18px', background: secondary ? 'transparent' : '#dc2827', color: '#fff', fontSize: 16, letterSpacing: '.05em', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .48 : 1 }}>{children}</button>
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="imposter-main"><section className="imposter-card">{children}</section></main>
}

export default function ImposterGame({ room, players, currentUserId, onClose }: Props) {
  const [state, setState] = useState<ImposterPrivateState | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const isHost = room.host_user_id === currentUserId

  const load = useCallback(async () => {
    try { setState(await getImposterState(room.id)); setError('') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load this round.') }
  }, [room.id])

  useEffect(() => { void load() }, [load, room.version])
  useEffect(() => { setRevealed(false); setSelected(null) }, [state?.gameNumber, state?.phase])

  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError('')
    try { await action(); await load() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Something went wrong.') }
    finally { setBusy(false) }
  }

  const active = players.find(player => player.user_id === state?.activeUserId)
  const eligibleTargets = players.filter(player => player.user_id !== currentUserId)

  let content: React.ReactNode
  if (!state) content = <><div className="imposter-kicker">IMPOSTER</div><h1>DEALING SECRET WORDS…</h1></>
  else if (state.phase === 'role_reveal') content = <>
    <div className="imposter-kicker">PRIVATE • GAME {state.gameNumber}</div>
    {!revealed ? <>
      <div className="imposter-avatar" aria-hidden="true">?</div>
      <h1>YOUR WORD IS READY</h1>
      <p>Make sure nobody else can see your screen.</p>
      <Button onClick={() => setRevealed(true)}>HOLD TO REVEAL</Button>
    </> : <>
      <ImposterWordCard word={state.word} />
      <p>Remember it. Don’t say it out loud.</p>
      <Button disabled={busy || state.ready} onClick={() => run(() => toggleImposterReady(room.id))}>{state.ready ? 'WAITING FOR EVERYONE…' : "I'VE GOT IT"}</Button>
      <button className="imposter-hide" onClick={() => setRevealed(false)}>Hide my word</button>
    </>}
    <div className="imposter-progress">{state.readyCount} of {players.length} ready</div>
  </>
  else if (state.phase === 'clue') content = <>
    <div className="imposter-kicker">ROUND {state.clueRound} OF 3</div>
    <div className="imposter-turn-dot" style={{ background: active?.color }} />
    <h1>{active?.display_name ?? 'PLAYER'}, YOUR TURN</h1>
    <p>Give one short clue about your word. Don’t say the word itself.</p>
    {state.activeUserId === currentUserId || isHost
      ? <Button disabled={busy} onClick={() => run(() => advanceImposterClue(room.id))}>{state.activeUserId === currentUserId ? 'CLUE GIVEN' : `ADVANCE FOR ${active?.display_name?.toUpperCase()}`}</Button>
      : <div className="imposter-wait">LISTEN CLOSELY…</div>}
    <div className="imposter-progress">{state.turnIndex + 1} of {players.length} clues</div>
  </>
  else if (state.phase === 'discussion') content = <>
    <div className="imposter-kicker">ROUND {state.clueRound} COMPLETE</div>
    <div className="imposter-avatar" aria-hidden="true">!</div>
    <h1>DISCUSS THE CLUES</h1>
    <p>Who sounded suspicious? Defend your clue—but never reveal your word.</p>
    {isHost ? <Button disabled={busy} onClick={() => run(() => continueImposterRound(room.id))}>{state.clueRound < 3 ? `START ROUND ${state.clueRound + 1}` : 'START VOTING'}</Button> : <div className="imposter-wait">WAITING FOR THE HOST…</div>}
  </>
  else if (state.phase === 'voting') content = <>
    <div className="imposter-kicker">PRIVATE VOTE</div>
    <h1>WHO IS THE IMPOSTER?</h1>
    <div className="imposter-vote-grid">{eligibleTargets.map(player => <button type="button" key={player.user_id} className={selected === player.user_id ? 'selected' : ''} onClick={() => !state.hasVoted && setSelected(player.user_id)} disabled={state.hasVoted}>
      <span className="imposter-vote-avatar" style={{ background: player.color }}>{player.display_name.slice(0, 1).toUpperCase()}</span>{player.display_name}{selected === player.user_id ? <span className="imposter-vote-check" aria-label="Selected">✓</span> : null}
    </button>)}</div>
    <Button disabled={busy || state.hasVoted || !selected} onClick={() => run(() => submitImposterVote(room.id, selected!))}>{state.hasVoted ? 'VOTE LOCKED' : 'LOCK IN VOTE'}</Button>
    <div className="imposter-progress">{state.voteCount} of {players.length} votes submitted</div>
  </>
  else content = <>
    <div className="imposter-kicker">THE REVEAL</div>
    <div className="imposter-avatar reveal" aria-hidden="true">!</div>
    <h1>{state.groupWon ? 'THE GROUP CAUGHT THEM' : 'THE IMPOSTER ESCAPED'}</h1>
    <p><strong>{state.imposterName}</strong> was the Imposter.</p>
    <div className="imposter-result-words"><div><small>GROUP WORD</small><b>{state.regularWord}</b></div><div><small>IMPOSTER WORD</small><b>{state.imposterWord}</b></div></div>
    {state.accusedName ? <p>The group chose <strong>{state.accusedName}</strong>.</p> : null}
    {isHost ? <Button disabled={busy} onClick={() => run(() => startImposterGame(room.id))}>PLAY ANOTHER GAME</Button> : <div className="imposter-wait">WAITING FOR THE HOST…</div>}
  </>

  return <div className="game-fullscreen imposter-screen">
    <GameNav onBack={onClose} gameId="imposter" />
    <Shell>{content}{error ? <p role="alert" className="imposter-error">{error}</p> : null}<div className="imposter-brand">— DECKED —</div></Shell>
    <GameFooter />
    <style>{`
      .imposter-main{flex:1;display:grid;place-items:center;padding:36px 16px 72px}.imposter-card{width:min(560px,calc(100vw - 32px));box-sizing:border-box;border-radius:20px;padding:clamp(24px,6vw,44px);background:#070708;border:1px dashed rgba(255,255,255,.10);box-shadow:0 24px 80px rgba(0,0,0,.38);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;text-align:center}.imposter-card h1{font:400 clamp(34px,8vw,48px)/1.05 'Anton SC',sans-serif;color:#fff;margin:0;text-transform:uppercase;max-width:14ch}.imposter-card p{font:500 15px/1.45 'Satoshi',sans-serif;color:rgba(255,255,255,.58);margin:0;max-width:34ch}.imposter-card strong{color:#fff}.imposter-kicker,.imposter-progress,.imposter-brand{font:400 14px/1 'Staatliches',sans-serif;letter-spacing:.14em;text-transform:uppercase}.imposter-kicker{color:#dc2827}.imposter-progress,.imposter-brand{color:rgba(255,255,255,.42)}.imposter-brand{margin-top:12px}.imposter-avatar{width:72px;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;background:#18181b;color:#fff;font:400 38px/1 'Anton SC',sans-serif;border:2px solid rgba(255,255,255,.18)}.imposter-avatar.reveal{background:#dc2827}.imposter-word{font:400 clamp(48px,14vw,76px)/.95 'Anton SC',sans-serif;color:#fff;text-transform:uppercase;overflow-wrap:anywhere}.imposter-category{padding:6px 12px;border-radius:999px;background:#18181b;color:rgba(255,255,255,.58);font:400 13px/1 'Staatliches',sans-serif;letter-spacing:.12em;text-transform:uppercase}.imposter-hide{border:0;background:none;color:rgba(255,255,255,.55);font:600 14px 'Satoshi',sans-serif;text-decoration:underline;cursor:pointer}.imposter-turn-dot{width:32px;height:32px;border-radius:50%;box-shadow:0 0 0 2.5px #fff}.imposter-wait{width:100%;padding:16px;border:1px dashed rgba(255,255,255,.10);border-radius:12px;font:400 16px 'Staatliches',sans-serif;letter-spacing:.08em;box-sizing:border-box;color:rgba(255,255,255,.58)}.imposter-vote-grid{width:100%;display:grid;gap:10px}.imposter-vote-grid button{min-height:56px;padding:10px 16px;border:1px dashed rgba(255,255,255,.10);border-radius:12px;background:#070708;color:#fff;font:700 14px 'Satoshi',sans-serif;display:flex;align-items:center;gap:12px;cursor:pointer}.imposter-vote-grid button.selected{border-style:solid;border-color:#fff;background:#111113}.imposter-vote-grid button .imposter-vote-avatar{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;color:#fff;font:400 18px 'Anton SC',sans-serif;box-shadow:0 0 0 2.5px #fff}.imposter-vote-grid button .imposter-vote-check{width:auto;height:auto;margin-left:auto;border-radius:0;background:none;color:#fff;font:700 22px/1 'Satoshi',sans-serif;box-shadow:none}.imposter-result-words{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:10px}.imposter-result-words div{background:#111113;border-radius:12px;padding:16px 10px;display:flex;flex-direction:column;gap:7px}.imposter-result-words small{font:400 12px 'Staatliches',sans-serif;color:#dc2827;letter-spacing:.12em}.imposter-result-words b{font:400 clamp(24px,7vw,32px) 'Anton SC',sans-serif;color:#fff;text-transform:uppercase}.imposter-error{color:#ff7c82!important}@media(max-width:380px){.imposter-result-words{grid-template-columns:1fr}}
    `}</style>
  </div>
}
