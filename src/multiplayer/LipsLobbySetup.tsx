import { useEffect, useState } from 'react'
import GroupRegular from '@mingcute/react/core-regular/group'
import DownSmallRegular from '@mingcute/react/core-regular/down-small'
import CloseRegular from '@mingcute/react/core-regular/close'
import ArrowRightRegular from '@mingcute/react/core-regular/arrow-right'
import CheckRegular from '@mingcute/react/core-regular/check'
import type { MultiplayerPlayer } from './types'
import { RoundLengthScreen } from '../CharadesGame'
import SpellingLevelSelect from '../components/SpellingLevelSelect'
import type { SpellingLevel } from '../content/spellingBee'
import { READ_MY_LIPS_PROMPT_TYPES, type ReadMyLipsPromptSelection, type ReadMyLipsPromptType } from '../content/readMyLips'
import '../read-my-lips.css'

const teamColors = ['#8b5cf6', '#38bdf8', '#2dd4bf', '#a3e635', '#f472b6', '#facc15']
const MAX_ROUNDS = 30

export default function LipsLobbySetup({ players, busy, error, onStart, onBack, spelling = false }: { players: MultiplayerPlayer[]; busy: boolean; error?: string; spelling?: boolean; onBack?: () => void; onStart: (teamNames: string[], playerIds: string[], roundSeconds: number, roundsPerTeam: number, promptTypes: ReadMyLipsPromptSelection[], levels: SpellingLevel[]) => void }) {
  const [teams, setTeams] = useState<string[]>([])
  const [phase, setPhase] = useState<'levels' | 'create' | 'assign' | 'prompt-type' | 'timer' | 'rounds'>(spelling ? 'levels' : 'create')
  const [levels, setLevels] = useState<SpellingLevel[]>([])
  const [roundSeconds, setRoundSeconds] = useState(60)
  const [roundsPerTeam, setRoundsPerTeam] = useState(2)
  const [promptTypes, setPromptTypes] = useState<ReadMyLipsPromptSelection[]>([])
  const [assignments, setAssignments] = useState<Record<string, number>>({})
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [swapTeam, setSwapTeam] = useState<number | null>(null)
  const counts = teams.map((_, index) => players.filter(player => assignments[player.user_id] === index).length)
  const ready = players.length >= 4 && players.length % 2 === 0 && teams.length * 2 === players.length && teams.every((name, index) => name.trim().length > 0 && counts[index] === 2)
  const roundLimit = spelling && teams.length ? Math.min(MAX_ROUNDS, Math.floor(levels.length * 12 / teams.length)) : MAX_ROUNDS
  const validRounds = Number.isInteger(roundsPerTeam) && roundsPerTeam >= 1 && roundsPerTeam <= roundLimit
  const mixedSelected = promptTypes.includes('mixed')
  const assigningPlayer = players.find(player => player.user_id === assigningId)
  const closePicker = () => { setAssigningId(null); setSwapTeam(null) }
  useEffect(() => {
    if (!assigningId) return
    document.body.classList.add('charades-sheet-open')
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setAssigningId(null); setSwapTeam(null) } }
    window.addEventListener('keydown', closeOnEscape)
    return () => { document.body.classList.remove('charades-sheet-open'); window.removeEventListener('keydown', closeOnEscape) }
  }, [assigningId])
  const start = (seconds: number) => {
    if (!ready || !validRounds || (spelling ? !levels.length : !promptTypes.length)) return
    const ordered = teams.flatMap((_, index) => players.filter(player => assignments[player.user_id] === index).map(player => player.user_id))
    onStart(teams.map(name => name.trim()), ordered, seconds, roundsPerTeam, promptTypes, levels)
  }
  const togglePromptType = (type: ReadMyLipsPromptType) => setPromptTypes(current => {
    const selected = current.filter(item => item !== 'mixed')
    return selected.includes(type) ? selected.filter(item => item !== type) : [...selected, type]
  })
  const assign = (teamIndex: number) => {
    if (!assigningId) return
    setAssignments(current => ({ ...current, [assigningId]: teamIndex }))
    closePicker()
  }
  const swap = (otherId: string) => {
    if (!assigningId || swapTeam === null) return
    const oldTeam = assignments[assigningId]
    setAssignments(current => ({ ...current, [assigningId]: swapTeam, [otherId]: oldTeam }))
    closePicker()
  }
  if (phase === 'levels') return <SpellingLevelSelect selected={levels} onChange={setLevels} onBack={onBack ?? (() => setPhase('create'))} onNext={() => setPhase('create')} />
  if (phase === 'prompt-type') return <div className="rml-lobby-setup rml-team-builder">
    <h2>PICK PROMPT TYPE</h2>
    <p className="rml-copy">Choose Mixed, or select one or more specific types.</p>
    <div className="rml-prompt-type-grid" role="group" aria-label="Prompt types"><button type="button" aria-pressed={mixedSelected} onClick={() => setPromptTypes(['mixed'])}><strong>Mixed</strong></button>{READ_MY_LIPS_PROMPT_TYPES.map(option => <button key={option.id} type="button" aria-pressed={!mixedSelected && promptTypes.includes(option.id)} onClick={() => togglePromptType(option.id)}><strong>{option.label}</strong></button>)}</div>
    <div className="rml-builder-actions"><button className="rml-secondary" onClick={() => setPhase('assign')}>GO BACK</button><button className="rml-primary" disabled={!promptTypes.length} onClick={() => setPhase('timer')}>NEXT</button></div>
  </div>
  if (phase === 'timer') return <RoundLengthScreen initialValue={roundSeconds} onBack={() => setPhase(spelling ? 'assign' : 'prompt-type')} onNext={seconds => { setRoundSeconds(seconds); setPhase('rounds') }} nextLabel="NEXT" />
  if (phase === 'rounds') return <div className="rml-lobby-setup rml-team-builder">
    <h2>HOW MANY ROUNDS?</h2>
    <p className="rml-copy">One round gives every team one timed turn.</p>
    <label className="rml-round-input"><span aria-hidden="true">#</span><input aria-label="Number of rounds per team" type="number" inputMode="numeric" min={1} max={roundLimit} value={roundsPerTeam || ''} placeholder="ENTER ROUNDS" onChange={event => setRoundsPerTeam(event.target.value === '' ? 0 : Number(event.target.value))} onBlur={() => { if (!validRounds) setRoundsPerTeam(2) }} /><b>ROUNDS PER TEAM</b></label>
    <p className="rml-round-summary">{validRounds ? <>{teams.length} teams × {roundsPerTeam} {roundsPerTeam === 1 ? 'round' : 'rounds'} = <strong>{teams.length * roundsPerTeam} total turns</strong></> : <>Enter between 1 and {roundLimit} rounds.</>}</p>
    {error ? <p className="rml-setup-error" role="alert">{error}</p> : null}
    <div className="rml-builder-actions"><button className="rml-secondary" onClick={() => setPhase('timer')}>GO BACK</button><button className="rml-primary" disabled={busy || !validRounds} onClick={() => start(roundSeconds)}>START GAME</button></div>
  </div>
  return <div className="rml-lobby-setup rml-team-builder">
    <h2>{phase === 'create' ? 'CREATE YOUR TEAMS' : 'ASSIGN PLAYERS'}</h2>
    <p className="rml-copy">{phase === 'create' ? 'Two players per team' : 'Choose a team for every player'}</p>
    {phase === 'create' ? <div className="rml-builder-list">{teams.map((name, index) => <div className="charades-team-row" key={index}><span className="avatar-circle" style={{ width: 24, height: 24, background: teamColors[index % teamColors.length] }} aria-hidden="true"/><input aria-label={`Team ${index + 1} name`} maxLength={18} value={name} onChange={event => setTeams(current => current.map((value, item) => item === index ? event.target.value : value))} /><button type="button" className="icon-x-btn charades-team-delete" aria-label={`Delete ${name}`} onClick={() => { setTeams(current => current.filter((_, item) => item !== index)); setAssignments(current => Object.fromEntries(Object.entries(current).filter(([, team]) => team !== index).map(([id, team]) => [id, team > index ? team - 1 : team]))) }}>×</button></div>)}<button className="add-team-btn charades-add-team" disabled={teams.length * 2 >= players.length} onClick={() => setTeams(current => [...current, `Team ${current.length + 1}`])}>+ ADD TEAM</button></div> :
    <div className="rml-builder-list">{players.map((player, playerIndex) => { const assignedTeam = assignments[player.user_id]; return <div className={`charades-player-row${assignedTeam !== undefined ? ' is-assigned' : ''}`} key={player.user_id}><span className="avatar-circle" style={{ width: 32, height: 32, background: teamColors[playerIndex % teamColors.length], boxShadow: '0 0 0 2px #fff' }} aria-hidden="true"/><span className="charades-player-name">{player.display_name}</span><button className="charades-team-picker" type="button" aria-label={`Choose team for ${player.display_name}`} onClick={() => { setSwapTeam(null); setAssigningId(player.user_id) }}>{assignedTeam !== undefined ? <i style={{ background: teamColors[assignedTeam % teamColors.length] }} /> : <GroupRegular size={18} aria-hidden="true"/>}<span>{assignedTeam !== undefined ? teams[assignedTeam] : 'Select team'}</span><DownSmallRegular className="charades-team-picker-chevron" size={17} aria-hidden="true"/></button></div> })}</div>}
    <div className="rml-builder-actions">{(phase === 'assign' || spelling) && <button className="rml-secondary" onClick={() => setPhase(phase === 'assign' ? 'create' : 'levels')}>GO BACK</button>}<button className="rml-primary" disabled={busy || (phase === 'create' ? players.length < 4 || players.length % 2 !== 0 || teams.length * 2 !== players.length || teams.some(name => !name.trim()) : !ready)} onClick={() => phase === 'create' ? setPhase('assign') : setPhase(spelling ? 'timer' : 'prompt-type')}>{phase === 'create' ? 'ASSIGN PLAYERS' : 'NEXT'}</button></div>
    {assigningPlayer && <div className="charades-drawer-backdrop" role="presentation" onClick={closePicker}><div className="charades-team-drawer" role="dialog" aria-modal="true" aria-labelledby="rml-lobby-drawer-title" onClick={event => event.stopPropagation()}><div className="charades-drawer-heading"><h3 id="rml-lobby-drawer-title">{swapTeam === null ? `Select a team for ${assigningPlayer.display_name}` : `Swap ${assigningPlayer.display_name} with…`}</h3><button type="button" onClick={closePicker} aria-label="Close team picker"><CloseRegular size={19} aria-hidden="true"/></button></div><div className="charades-drawer-options">{swapTeam === null ? teams.map((name, index) => { const selected = assignments[assigningPlayer.user_id] === index; const full = counts[index] >= 2; return <button key={index} type="button" className={selected ? 'selected' : ''} disabled={selected || (full && assignments[assigningPlayer.user_id] === undefined)} onClick={() => full ? setSwapTeam(index) : assign(index)}><i style={{ background: teamColors[index % teamColors.length] }} aria-hidden="true"/><span>{name}</span><b>{selected ? <CheckRegular size={14} aria-hidden="true"/> : <ArrowRightRegular size={14} aria-hidden="true"/>}</b></button> }) : players.filter(player => assignments[player.user_id] === swapTeam).map(player => <button key={player.user_id} type="button" onClick={() => swap(player.user_id)}><span>{player.display_name}</span><b><ArrowRightRegular size={14} aria-hidden="true"/></b></button>)}</div></div></div>}
  </div>
}
