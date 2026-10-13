import { useEffect, useMemo, useState } from 'react'
import { passAndPlayTracker } from './analytics/passAndPlay'
import { GameFooter, GameNav } from './components/GameShell'
import PlayerSetup, { type Player } from './components/PlayerSetup'
import { chooseMiniMysteryVariant, evidenceForRound, isMiniMysterySolved, markMiniMysterySolved, miniMysteryBaseId, MINI_MYSTERIES, type MiniMysteryCase, type MysteryRole } from './content/miniMystery'

type Assignment = { player: Player; role: MysteryRole }
type Phase = 'case' | 'rounds' | 'players' | 'role-handoff' | 'role' | 'opening' | 'round-handoff' | 'objective' | 'discussion' | 'evidence' | 'vote-handoff' | 'vote' | 'reveal' | 'results'
const GAME_ID = 'mini-mystery'
const shell: React.CSSProperties = { width: 'min(660px,calc(100vw - 32px))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }
const heading: React.CSSProperties = { margin: 0, color: '#fff', font: "400 clamp(34px,8vw,54px)/1.02 'Anton SC',sans-serif", textTransform: 'uppercase' }
const body: React.CSSProperties = { margin: 0, color: 'rgba(255,255,255,.62)', font: "15px/1.5 'Satoshi',sans-serif" }
const kicker: React.CSSProperties = { margin: 0, color: '#ef352f', font: "14px/1 'Staatliches',sans-serif", letterSpacing: '.15em', textTransform: 'uppercase' }
const primary: React.CSSProperties = { border: 0, borderRadius: 999, padding: '13px 25px', background: '#dc2827', color: '#fff', font: "16px/1 'Staatliches',sans-serif", letterSpacing: '.05em', cursor: 'pointer' }
const secondary: React.CSSProperties = { ...primary, border: '1px solid #fff', background: 'transparent' }
const panel: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 'clamp(22px,5vw,34px)', borderRadius: 18, background: '#070708', border: '1px dashed rgba(255,255,255,.14)' }
const ROUND_LEVELS = [{ rounds: 2, label: 'QUICK CASE', detail: 'The same mystery at a faster pace.' }, { rounds: 3, label: 'CLASSIC CASE', detail: 'A balanced mix of clues and discussion.', recommended: true }, { rounds: 4, label: 'DEEP CASE', detail: 'More time to question and investigate.' }]
const objectiveForRound = (role: MysteryRole, round: number) => role.objectives[round - 1] ?? (role.guilty ? 'Make your final case. Name an innocent suspect and explain how the evidence could point to them.' : 'Make your final deduction. Identify one contradiction, name your leading suspect and ask them to explain it.')

function shuffled<T>(items: T[]) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const random = new Uint32Array(1); crypto.getRandomValues(random)
    const other = random[0] % (index + 1); [result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

function Person({ assignment }: { assignment: Assignment }) {
  return <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 12, boxSizing: 'border-box', borderRadius: 12, background: '#070708', border: '1px dashed rgba(255,255,255,.14)' }}><span style={{ width: 34, height: 34, flex: '0 0 auto', borderRadius: '50%', background: assignment.player.color, boxShadow: '0 0 0 2px #fff' }} /><strong style={{ color: '#fff', font: "400 19px/1 'Anton SC',sans-serif" }}>{assignment.player.name.toUpperCase()}</strong></div>
}

function Dossier({ role, round }: { role: MysteryRole; round?: number }) {
  const guilty = role.guilty === true
  return <article style={{ position: 'relative', width: 'min(430px,100%)', boxSizing: 'border-box', color: '#08293f', background: 'linear-gradient(#f4ead2,#f4ead2) padding-box,repeating-linear-gradient(135deg,#123953 0 12px,#2d6079 12px 15px,#123953 15px 25px) border-box', border: '12px solid transparent', borderRadius: 16, padding: 'clamp(22px,6vw,38px)', boxShadow: 'inset 0 0 0 2px #7195aa,0 20px 50px rgba(0,0,0,.32)', textAlign: 'left' }}>
    <p style={{ margin: 0, color: '#dc2827', font: "13px/1 'Staatliches',sans-serif", letterSpacing: '.14em' }}>{round ? `ROUND ${round} — PRIVATE OBJECTIVE` : guilty ? 'YOUR ROLE — CULPRIT' : 'YOUR PRIVATE ROLE'}</p>
    <h2 style={{ margin: '12px 0 4px', font: "400 clamp(34px,9vw,48px)/1 'Anton SC',sans-serif", textTransform: 'uppercase' }}>{role.name}</h2>
    <p style={{ margin: '0 0 20px', font: "700 13px/1.2 'Satoshi',sans-serif", letterSpacing: '.12em', textTransform: 'uppercase' }}>{role.title}</p>
    {round ? <p style={{ margin: 0, font: "700 18px/1.45 'Satoshi',sans-serif" }}>{objectiveForRound(role, round)}</p> : <div style={{ display: 'grid', gap: 16 }}>
      <section><b>YOUR PUBLIC STORY</b><p>{role.publicStory}</p></section>
      <section><b>YOUR SECRET</b><p>{role.secret}</p></section>
      <section><b>WHAT YOU KNOW</b><p>{role.clue}</p></section>
      {guilty ? <section className="mm-culprit-section" style={{ padding: 14, borderRadius: 10, background: '#dc2827', color: '#fff' }}><b>WHAT REALLY HAPPENED</b><p>{role.guiltyPlan}</p></section> : null}
    </div>}
    <div style={{ height: 2, background: '#08293f', marginTop: 26 }} /><p style={{ margin: '10px 0 0', textAlign: 'center', font: "800 11px/1 'Satoshi',sans-serif", letterSpacing: '.4em' }}>DECKED</p>
  </article>
}

export default function MiniMysteryGame({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('case')
  const [mystery, setMystery] = useState<MiniMysteryCase>(MINI_MYSTERIES[0])
  const [category, setCategory] = useState<string>('All')
  const [rounds, setRounds] = useState(3)
  const [players, setPlayers] = useState<Player[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [index, setIndex] = useState(0)
  const [round, setRound] = useState(1)
  const [votes, setVotes] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [revealBeat, setRevealBeat] = useState(0)
  const culpritIndex = assignments.findIndex(item => item.role.guilty)
  const counts = useMemo(() => assignments.map((_, candidate) => votes.filter(vote => vote === candidate).length), [assignments, votes])

  useEffect(() => {
    try {
      localStorage.setItem(`decked:game-session:v1:${GAME_ID}:players`, JSON.stringify(players.map(() => ({}))))
      localStorage.setItem(`decked:game-session:v1:${GAME_ID}:rounds`, JSON.stringify(rounds))
      localStorage.setItem(`decked:game-session:v1:${GAME_ID}:roundIndex`, JSON.stringify(Math.max(0, round - 1)))
    } catch { /* Analytics remain best-effort when storage is unavailable. */ }
    passAndPlayTracker.observeStep(GAME_ID, phase, 'case')
    passAndPlayTracker.observeValue(GAME_ID, 'roundIndex', Math.max(0, round - 1))
  }, [phase, players.length, round, rounds])

  const begin = (nextPlayers: Player[], nextMystery = mystery) => {
    const selectedRoles = [nextMystery.roles[0], ...shuffled(nextMystery.roles.slice(1)).slice(0, nextPlayers.length - 1)]
    setPlayers(nextPlayers); setAssignments(shuffled(selectedRoles).map((role, roleIndex) => ({ role, player: nextPlayers[roleIndex] })))
    setIndex(0); setRound(1); setVotes([]); setSelected(null); setRevealBeat(0); setPhase('role-handoff')
  }
  const nextPrivate = (next: Phase) => index + 1 < assignments.length ? (setIndex(value => value + 1), setPhase(next)) : (setIndex(0), setPhase(next === 'role-handoff' ? 'opening' : 'discussion'))
  const nextRound = () => round < rounds ? (setRound(value => value + 1), setIndex(0), setPhase('round-handoff')) : (setIndex(0), setPhase('vote-handoff'))
  const lockVote = () => { if (selected == null) return; const nextVotes = [...votes, selected]; setVotes(nextVotes); setSelected(null); if (index + 1 < assignments.length) { setIndex(value => value + 1); setPhase('vote-handoff') } else { setRevealBeat(0); setPhase('reveal') } }

  // Setup phases do not have role assignments yet, so render them before the
  // assignment-driven game screens below are derived.
  if (phase === 'rounds') return <div className="game-fullscreen"><GameNav onBack={() => setPhase('case')} gameId={GAME_ID} /><main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '36px 16px 72px' }}><section style={shell}><p style={kicker}>CHOOSE YOUR EXPERIENCE</p><h1 style={heading}>HOW DO YOU WANT TO PLAY?</h1><p style={body}>Choose how many rounds you’d like to investigate.</p><div style={{ width: '100%', display: 'grid', gap: 10 }}>{ROUND_LEVELS.map(level => <button key={level.rounds} type="button" onClick={() => setRounds(level.rounds)} style={{ padding: 18, display: 'grid', gridTemplateColumns: '52px 1fr auto', alignItems: 'center', gap: 14, textAlign: 'left', borderRadius: 14, border: rounds === level.rounds ? '2px solid #fff' : '1px dashed rgba(255,255,255,.18)', background: rounds === level.rounds ? '#123953' : '#070708', color: '#fff', cursor: 'pointer' }}><strong style={{ font: "400 34px/1 'Anton SC',sans-serif", textAlign: 'center' }}>{level.rounds}</strong><span><b style={{ display: 'block', font: "400 19px/1 'Staatliches',sans-serif", letterSpacing: '.06em' }}>{level.label}</b><small style={{ color: 'rgba(255,255,255,.58)', font: "13px/1.35 'Satoshi',sans-serif" }}>{level.detail}</small></span>{level.recommended ? <em style={{ color: '#ffe800', font: "12px 'Staatliches',sans-serif", fontStyle: 'normal' }}>RECOMMENDED</em> : null}</button>)}</div><div style={{ display: 'flex', gap: 10 }}><button style={secondary} onClick={() => setPhase('case')}>GO BACK</button><button style={primary} onClick={() => setPhase('players')}>CONTINUE</button></div></section></main><GameFooter /></div>
  if (phase === 'players') return <div className="game-fullscreen"><GameNav onBack={() => setPhase('rounds')} gameId={GAME_ID} /><main style={{ flex: 1, display: 'flex' }}><PlayerSetup minPlayers={4} maxPlayers={8} initialPlayers={players} skipLabel="GO BACK" onSkip={() => setPhase('rounds')} onNext={begin} /></main><GameFooter /></div>

  let content: React.ReactNode
  if (phase === 'case') content = <div style={{ ...shell, width: 'min(940px,calc(100vw - 32px))' }}><p style={kicker}>CHOOSE A CASE</p><h1 style={heading}>MINI MYSTERY</h1><div className="mm-category-row" role="group" aria-label="Mystery category">{['All', ...new Set(MINI_MYSTERIES.map(item => item.category))].map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className="game-btn" style={{ minHeight: 40, padding: '8px 15px', borderRadius: 999, border: category === item ? '1px solid #fff' : '1px dashed rgba(255,255,255,.2)', background: category === item ? '#dc2827' : '#070708', color: '#fff', font: "15px 'Staatliches',sans-serif", cursor: 'pointer' }}>{item.toUpperCase()}</button>)}</div><div className="mm-case-grid" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>{MINI_MYSTERIES.filter(item => category === 'All' || item.category === category).map(item => <button key={item.id} className="game-btn" onClick={() => { setMystery(chooseMiniMysteryVariant(item.id)); setPhase('rounds') }} style={{ minHeight: 220, padding: 20, borderRadius: 16, border: '2px solid #f4ead2', background: '#123953', color: '#fff', textAlign: 'left', cursor: 'pointer' }}><span style={{ ...kicker, color: '#f4ead2' }}>{item.category}</span><strong style={{ display: 'block', marginTop: 14, font: "400 28px/1.05 'Anton SC',sans-serif" }}>{item.title.toUpperCase()}</strong><span style={{ display: 'block', marginTop: 10, color: 'rgba(255,255,255,.48)', font: "12px/1.3 'Satoshi',sans-serif", textTransform: 'uppercase' }}>{item.setting}</span><span style={{ display: 'block', marginTop: 12, color: 'rgba(255,255,255,.72)', font: "14px/1.4 'Satoshi',sans-serif" }}>{item.incident}</span>{isMiniMysterySolved(item.id) ? <span style={{ display: 'block', marginTop: 14, color: '#ffe800', font: "13px/1 'Staatliches',sans-serif", letterSpacing: '.1em' }}>SOLVED · REMIX AVAILABLE</span> : null}</button>)}</div></div>
  else if (phase === 'role-handoff') content = <><p style={kicker}>PRIVATE ROLE · {index + 1} OF {assignments.length}</p><h1 style={heading}>{assignments[index].player.name}’S DOSSIER</h1><Person assignment={assignments[index]} /><p style={body}>Make sure nobody else can see the screen.</p><button style={primary} onClick={() => setPhase('role')}>OPEN DOSSIER</button></>
  else if (phase === 'role') content = <><Dossier role={assignments[index].role} /><p style={body}>Remember your story, secret and clue.</p><button style={primary} onClick={() => nextPrivate('role-handoff')}>HIDE &amp; {index + 1 < assignments.length ? 'PASS ON' : 'BEGIN CASE'}</button></>
  else if (phase === 'opening') content = <><p style={kicker}>CASE FILE</p><h1 style={heading}>{mystery.title}</h1><div style={panel}>{mystery.briefing.map(paragraph => <p key={paragraph} style={{ ...body, color: '#fff', fontSize: 18, textAlign: 'left' }}>{paragraph}</p>)}<div style={{ height: 1, background: 'rgba(255,255,255,.12)', margin: '22px 0' }} /><p style={{ ...kicker, textAlign: 'left' }}>CONFIRMED FACTS</p>{mystery.knownFacts.map(fact => <p key={fact} style={{ ...body, margin: '8px 0', textAlign: 'left' }}>• {fact}</p>)}</div><button style={primary} onClick={() => { setIndex(0); setPhase('round-handoff') }}>START ROUND 1</button></>
  else if (phase === 'round-handoff') content = <><p style={kicker}>ROUND {round} OF {rounds} · PRIVATE UPDATE {index + 1} OF {assignments.length}</p><h1 style={heading}>{assignments[index].player.name}’S TURN</h1><Person assignment={assignments[index]} /><p style={body}>Take the phone privately before opening your objective.</p><button style={primary} onClick={() => setPhase('objective')}>SHOW OBJECTIVE</button></>
  else if (phase === 'objective') content = <><Dossier role={assignments[index].role} round={round} /><button style={primary} onClick={() => nextPrivate('round-handoff')}>HIDE &amp; {index + 1 < assignments.length ? 'PASS ON' : 'START QUESTIONING'}</button></>
  else if (phase === 'discussion') content = <><p style={kicker}>ROUND {round} OF {rounds}</p><h1 style={heading}>{round === 1 ? 'ESTABLISH YOUR STORIES' : round === rounds ? 'FINAL INTERROGATION' : 'FOLLOW THE EVIDENCE'}</h1><div style={panel}><p style={{ ...body, color: '#fff', fontSize: 18 }}>Stay in character. Complete your private objective, question the others and decide whose story does not fit.</p><p style={{ ...body, marginTop: 16 }}>Each player should answer at least one direct question before continuing.</p></div><button style={primary} onClick={() => setPhase('evidence')}>REVEAL EVIDENCE</button></>
  else if (phase === 'evidence') content = <><p style={kicker}>EVIDENCE #{round}</p><h1 style={heading}>NEW INFORMATION</h1><div style={{ ...panel, display: 'grid', gap: 14, background: '#f4ead2', border: '10px solid #123953' }}>{evidenceForRound(mystery, round, rounds).map(item => <p key={item} style={{ margin: 0, color: '#08293f', font: "700 clamp(19px,5vw,26px)/1.35 'Satoshi',sans-serif" }}>{item}</p>)}</div><button style={primary} onClick={nextRound}>{round < rounds ? `START ROUND ${round + 1}` : 'MAKE FINAL ACCUSATIONS'}</button></>
  else if (phase === 'vote-handoff') content = <><p style={kicker}>PRIVATE ACCUSATION · {index + 1} OF {assignments.length}</p><h1 style={heading}>{assignments[index].player.name}’S ACCUSATION</h1><Person assignment={assignments[index]} /><p style={body}>Nobody else should see your choice.</p><button style={primary} onClick={() => setPhase('vote')}>CHOOSE THE CULPRIT</button></>
  else if (phase === 'vote') content = <><p style={kicker}>FINAL ACCUSATION</p><h1 style={heading}>WHO DID IT?</h1><div style={{ width: '100%', display: 'grid', gap: 9 }}>{assignments.map((item, candidate) => candidate === index ? null : <button key={item.player.name} onClick={() => setSelected(candidate)} style={{ minHeight: 58, display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, background: '#070708', color: '#fff', border: selected === candidate ? '1px solid #fff' : '1px dashed rgba(255,255,255,.14)', cursor: 'pointer' }}><span style={{ width: 32, height: 32, borderRadius: '50%', background: item.player.color, boxShadow: '0 0 0 2px #fff' }} /><span style={{ font: "400 18px/1 'Anton SC',sans-serif" }}>{item.player.name.toUpperCase()}</span>{selected === candidate ? <span style={{ marginLeft: 'auto', fontSize: 22 }}>✓</span> : null}</button>)}</div><button disabled={selected == null} style={{ ...primary, opacity: selected == null ? .35 : 1 }} onClick={lockVote}>LOCK IN ACCUSATION</button></>
  else if (phase === 'reveal') content = <><p style={kicker}>THE TRUTH</p><h1 style={heading}>{revealBeat < mystery.solutionBeats.length ? mystery.solutionBeats[revealBeat] : `${assignments[culpritIndex].player.name} was guilty.`}</h1>{revealBeat >= mystery.solutionBeats.length ? <Person assignment={assignments[culpritIndex]} /> : <div style={{ ...panel, minHeight: 150, display: 'grid', placeItems: 'center' }}><span style={{ fontSize: 56 }}>?</span></div>}<button style={primary} onClick={() => revealBeat < mystery.solutionBeats.length ? setRevealBeat(value => value + 1) : (markMiniMysterySolved(mystery.id), setPhase('results'))}>{revealBeat < mystery.solutionBeats.length ? 'CONTINUE REVEAL' : 'SEE RESULTS'}</button></>
  else {
    const highest = Math.max(...counts); const caught = counts[culpritIndex] === highest && counts.filter(count => count === highest).length === 1
    content = <><p style={kicker}>CASE CLOSED</p><h1 style={heading}>{caught ? 'THE CULPRIT WAS CAUGHT' : 'THE CULPRIT ESCAPED'}</h1><Person assignment={assignments[culpritIndex]} /><div style={{ ...panel, display: 'grid', gap: 18 }}><section><p style={kicker}>WHAT HAPPENED</p><p style={{ ...body, color: '#fff', fontSize: 17 }}>{mystery.finalReveal.what}</p></section><section><p style={kicker}>HOW</p><p style={{ ...body, color: '#fff' }}>{mystery.finalReveal.how}</p></section><section><p style={kicker}>WHY</p><p style={{ ...body, color: '#fff' }}>{mystery.finalReveal.why}</p></section><section><p style={kicker}>THE PROOF</p>{mystery.culpritProof.map(item => <p key={item} style={{ ...body, marginTop: 8, textAlign: 'left' }}>• {item}</p>)}</section><section><p style={kicker}>RED HERRINGS EXPLAINED</p>{mystery.redHerringResolutions.map(item => <p key={item} style={{ ...body, marginTop: 8, textAlign: 'left' }}>• {item}</p>)}</section></div><div style={{ width: '100%', display: 'grid', gap: 8 }}>{assignments.map((item, candidate) => <div key={item.player.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 10, background: '#070708', color: '#fff' }}><span>{item.player.name}</span><b>{counts[candidate]} VOTE{counts[candidate] === 1 ? '' : 'S'}</b></div>)}</div><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}><button style={secondary} onClick={() => setPhase('players')}>CHANGE PLAYERS</button><button style={primary} onClick={() => begin(players)}>PLAY AGAIN</button><button style={secondary} onClick={() => { const next = chooseMiniMysteryVariant(miniMysteryBaseId(mystery.id)); setMystery(next); begin(players, next) }}>REMIX CASE</button><button style={secondary} onClick={() => setPhase('case')}>NEW CASE</button></div></>
  }

  return <div className="game-fullscreen"><GameNav onBack={onClose} gameId={GAME_ID} /><main className="screen-enter" style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '36px 16px 72px' }}><div style={shell}>{content}</div></main><GameFooter /><style>{`.mm-category-row{width:100%;display:flex;flex-wrap:wrap;justify-content:center;gap:8px}@media(max-width:720px){.mm-case-grid{grid-template-columns:1fr!important}.mm-category-row{justify-content:flex-start;overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px}.mm-category-row button{flex:0 0 auto}} article section b{font:400 13px/1 'Staatliches',sans-serif;letter-spacing:.1em;color:#dc2827}.mm-culprit-section b{color:#fff}article section p{margin:6px 0 0;font:15px/1.45 'Satoshi',sans-serif}`}</style></div>
}
