import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import { useScaledCard } from './hooks/useCardScale'
import { CHARADES_CATEGORIES, buildCharadesDeck } from './charadesData'
import { haptic } from './haptics'
import { GameNav, GameFooter, PlayAgainLabel } from './components/GameShell'
import { useGameStep, usePersistentGameState } from './hooks/usePersistentGameState'
import clockSticker from './assets/clock_12677969.svg'
import GroupRegular from '@mingcute/react/core-regular/group'
import DownSmallRegular from '@mingcute/react/core-regular/down-small'
import CloseRegular from '@mingcute/react/core-regular/close'
import ArrowRightRegular from '@mingcute/react/core-regular/arrow-right'
import { useMultiplayerSession } from './multiplayer/SessionStateContext'

const RED = '#ed3844'
const STORAGE_KEY = 'charades-game-state-v3'
const TEAM_COLORS = ['#dc2827','#9b59b6','#27ae60','#e67e22','#3498db','#e91e63','#f39c12','#1abc9c']
const MIN_TEAM_MODE_PLAYERS = 4
const MIN_PLAYERS_PER_TEAM = 2

interface GameTeam { id: string; name: string; color: string; players: Player[] }

type Step =
  | 'playerSetup' | 'teamBuilder' | 'categorySelect' | 'deckSize' | 'customCards' | 'roundLength'
  | 'getReady' | 'game' | 'didTheyGetIt' | 'pointsGained' | 'done'
const STEPS: readonly Step[] = ['playerSetup', 'teamBuilder', 'categorySelect', 'deckSize', 'customCards', 'roundLength', 'getReady', 'game', 'didTheyGetIt', 'pointsGained', 'done']

interface Snapshot {
  step: Step | 'teamMode'
  players: Player[]
  mode?: 'ffa' | 'teams'
  teams: GameTeam[]
  selectedCategories: string[]
  deckSize: number
  customCards: string[]
  roundLength: number
  deck: string[]
  cardIdx: number
  currentTeamIdx: number
  actorIdxByTeam: Record<string, number>
  scores: Record<string, number>
  lastWinnerId: string | null
}

function loadSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.step) return parsed as Snapshot
  } catch { /* ignore */ }
  return null
}

function saveSnapshot(snap: Snapshot) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snap)) } catch { /* ignore */ }
}

function clearSnapshot() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}

const newTeamId = () => crypto.randomUUID()

const TROPHY_ICON = '/icons/trophy.svg'

/* ─── Button style helpers (exact Figma cta spec: 44px, 12px/18px padding, 999px radius) ─── */
function ctaBase(width: number): CSSProperties {
  return {
    width: `${width}px`, height: '44px', boxSizing: 'border-box',
    borderRadius: '999px', padding: '12px 18px',
    fontFamily: "'Staatliches', sans-serif", fontSize: '16px', letterSpacing: '0.05em',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
}
function ctaOutline(width: number): CSSProperties {
  return { ...ctaBase(width), border: '1px solid #fff', background: 'none', color: '#fff', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }
}
function ctaPrimary(width: number, disabled = false): CSSProperties {
  return {
    ...ctaBase(width),
    border: 'none',
    background: disabled ? '#626262' : RED,
    color: disabled ? '#a0a0a0' : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: disabled ? 'none' : `0 10px 12px rgba(237,56,68,0.3)`,
  }
}

const CheckIcon = () => (
  <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
    <path d="M1.5 5.5L5.5 9.5L12.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* ─── 0a. Team Builder ─── */
function TeamBuilderScreen({
  players, initialTeams, onBack, onNext,
}: {
  players: Player[]
  initialTeams: GameTeam[]
  onBack: () => void
  onNext: (teams: GameTeam[]) => void
}) {
  const [teams, setTeams] = useState<GameTeam[]>(initialTeams)
  const [phase, setPhase] = useState<'create' | 'assign'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [assigningPlayer, setAssigningPlayer] = useState<Player | null>(null)

  const unassigned = players.filter(p => !teams.some(t => t.players.includes(p)))
  const canContinue = teams.length >= 2
  const canFinish = unassigned.length === 0 && teams.every(t => t.players.length >= MIN_PLAYERS_PER_TEAM)

  useEffect(() => {
    if (!assigningPlayer) return
    document.body.classList.add('charades-sheet-open')
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAssigningPlayer(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.classList.remove('charades-sheet-open')
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [assigningPlayer])

  const addTeam = () => {
    haptic('light')
    const id = newTeamId()
    const color = TEAM_COLORS[teams.length % TEAM_COLORS.length]
    setTeams(prev => [...prev, { id, name: `Team ${prev.length + 1}`, color, players: [] }])
    setEditingId(id)
    setEditValue(`Team ${teams.length + 1}`)
  }
  const removeTeam = (id: string) => { haptic('light'); setTeams(prev => prev.filter(t => t.id !== id)) }
  const startRename = (t: GameTeam) => { setEditingId(t.id); setEditValue(t.name) }
  const commitRename = () => {
    const name = editValue.trim()
    if (name && editingId) setTeams(prev => prev.map(t => t.id === editingId ? { ...t, name } : t))
    setEditingId(null)
    setEditValue('')
  }
  const assignPlayer = (player: Player, teamId: string) => {
    haptic('medium')
    setTeams(prev => prev.map(t => ({
      ...t,
      players: t.id === teamId
        ? [...t.players.filter(p => p.name !== player.name), player]
        : t.players.filter(p => p.name !== player.name),
    })))
    setAssigningPlayer(null)
  }

  const teamForPlayer = (player: Player) => teams.find(t => t.players.some(p => p.name === player.name))

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '560px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0 }}>
            {phase === 'create' ? 'Create your teams' : 'Assign players'}
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            {phase === 'create' ? 'Create and name at least two teams' : 'Choose a team for every player'}
          </p>
        </div>

        <div style={{ width: '100%', maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {phase === 'create' ? (
            <>
              {teams.map(t => (
                <div key={t.id} className="stagger-item charades-team-row">
                  <div className="avatar-circle" style={{ width: '24px', height: '24px', background: t.color }} />
                  {editingId === t.id ? (
                    <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingId(null) }}
                      onBlur={commitRename} />
                  ) : (
                    <button className="charades-team-name" onClick={() => startRename(t)}>{t.name}</button>
                  )}
                  <button onClick={() => removeTeam(t.id)} className="icon-x-btn charades-team-delete" aria-label={`Delete ${t.name}`}>×</button>
                </div>
              ))}
              <button onClick={addTeam} className="add-team-btn charades-add-team">+ Add team</button>
            </>
          ) : (
            players.map(p => {
              const assignedTeam = teamForPlayer(p)
              return (
                <div key={p.name} className={`stagger-item charades-player-row${assignedTeam ? ' is-assigned' : ''}`}>
                  <div className="avatar-circle" style={{ width: '32px', height: '32px', background: p.color, boxShadow: '0 0 0 2px #fff' }} />
                  <span className="charades-player-name">{p.name}</span>
                  <button className="charades-team-picker" onClick={() => { haptic('light'); setAssigningPlayer(p) }}>
                    {assignedTeam ? <i style={{ background: assignedTeam.color }} /> : <GroupRegular size={18} aria-hidden="true" />}
                    <span>{assignedTeam?.name ?? 'Select team'}</span>
                    <DownSmallRegular className="charades-team-picker-chevron" size={17} aria-hidden="true" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button onClick={() => { haptic('light'); phase === 'assign' ? setPhase('create') : onBack() }} className="cta-btn" style={ctaOutline(142)}>Go back</button>
          <button disabled={phase === 'create' ? !canContinue : !canFinish} onClick={() => {
            if (phase === 'create' && canContinue) { haptic('medium'); setPhase('assign') }
            if (phase === 'assign' && canFinish) { haptic('medium'); onNext(teams) }
          }} className="cta-btn" style={ctaPrimary(142, phase === 'create' ? !canContinue : !canFinish)}>
            {phase === 'create' ? 'Assign players' : 'Next'}
          </button>
        </div>
      </div>

      {assigningPlayer && (
        <div className="charades-drawer-backdrop" role="presentation" onClick={() => setAssigningPlayer(null)}>
          <div className="charades-team-drawer" role="dialog" aria-modal="true" aria-labelledby="charades-drawer-title" onClick={event => event.stopPropagation()}>
            <div className="charades-drawer-heading">
              <h3 id="charades-drawer-title">Select a team for {assigningPlayer.name}</h3>
              <button onClick={() => setAssigningPlayer(null)} aria-label="Close team picker"><CloseRegular size={19} aria-hidden="true" /></button>
            </div>
            <div className="charades-drawer-options">
              {teams.map(t => {
                const selected = teamForPlayer(assigningPlayer)?.id === t.id
                return (
                  <button key={t.id} className={selected ? 'selected' : ''} onClick={() => assignPlayer(assigningPlayer, t.id)}>
                    <i style={{ background: t.color }} />
                    <span>{t.name}</span>
                    <b><ArrowRightRegular size={12} aria-hidden="true" /></b>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── 1. Select Categories ─── */
function CategorySelectScreen({ initialSelected, onBack, onNext }: { initialSelected: string[]; onBack: () => void; onNext: (ids: string[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))
  const canNext = selected.size > 0

  const toggle = (id: string) => {
    haptic('light')
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '824px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>
          Select Category
        </h2>

        <div className="charades-category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', width: '100%', maxHeight: '400px', overflowY: 'auto' }}>
          {CHARADES_CATEGORIES.map((cat, i) => {
            const isSel = selected.has(cat.id)
            return (
              <div key={cat.id} className="nhie-row-enter nhie-row" onClick={() => toggle(cat.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#070708', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '12px', padding: '12px', height: '56px', minWidth: 0, width: '100%',
                  cursor: 'pointer', boxSizing: 'border-box',
                  animationDelay: `${0.03 + i * 0.02}s`,
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={cat.icon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                  </div>
                  <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{cat.label}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isSel && <span key="check" className="check-pop" style={{ display: 'flex' }}><CheckIcon /></span>}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button onClick={() => { haptic('light'); onBack() }} className="cta-btn" style={ctaOutline(142)}>GO BACK</button>
          <button onClick={() => { if (canNext) { haptic('medium'); onNext([...selected]) } }} className="cta-btn" style={ctaPrimary(142, !canNext)}>NEXT</button>
        </div>
      </div>
    </div>
  )
}

/* ─── 2. Deck Size ─── */
function DeckSizeScreen({ initialValue, onBack, onNext }: { initialValue: number; onBack: () => void; onNext: (n: number) => void }) {
  const [value, setValue] = useState(initialValue ? String(initialValue) : '')
  const inputRef = useRef<HTMLInputElement>(null)
  const parsed = parseInt(value, 10)
  const valid = !isNaN(parsed) && parsed >= 1 && parsed <= 100

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '40px', color: '#fff', margin: 0, letterSpacing: '0.04em' }}>DECK SIZE</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>How many cards do you want to play?</p>
        </div>

        <div
          style={{ background: '#070708', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', width: '100%', boxSizing: 'border-box', cursor: 'text' }}
          onClick={() => inputRef.current?.focus()}
        >
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: '18px', fontWeight: 300, lineHeight: 1 }}>+</span>
          </div>
          <input
            ref={inputRef} type="number" min={1} max={100}
            value={value} onChange={e => setValue(e.target.value)}
            placeholder="ENTER NUMBER"
            style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', flex: 1, letterSpacing: '0.06em' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button onClick={() => { haptic('light'); onBack() }} className="cta-btn" style={ctaOutline(142)}>GO BACK</button>
          <button onClick={() => { if (valid) { haptic('medium'); onNext(parsed) } }} className="cta-btn" style={ctaPrimary(142, !valid)}>NEXT</button>
        </div>
      </div>
    </div>
  )
}

/* ─── 3. Custom Cards (optional) ─── */
function CustomCardsScreen({ deckSize, initialCards, onBack, onNext }: { deckSize: number; initialCards: string[]; onBack: () => void; onNext: (cards: string[]) => void }) {
  const [cards, setCards] = useState<string[]>(initialCards)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const remaining = deckSize - cards.length
  const hasInput = input.trim().length > 0

  const addCard = () => {
    const text = input.trim()
    if (!text || remaining <= 0) return
    haptic('light')
    setCards(prev => [...prev, text])
    setInput('')
    inputRef.current?.focus()
  }
  const removeCard = (i: number) => { haptic('light'); setCards(prev => prev.filter((_, idx) => idx !== i)) }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, letterSpacing: '0.04em' }}>CUSTOM CARDS</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Add your own prompts to make the game uniquely yours.</p>
          <p style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '13px', color: remaining === 0 ? '#ed3844' : 'rgba(255,255,255,0.4)', margin: 0, letterSpacing: '0.06em' }}>
            {remaining} OF {deckSize} SLOTS REMAINING
          </p>
        </div>

        <div style={{ width: '100%', maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cards.map((c, i) => (
            <div key={i} className="stagger-item setup-card-row" style={{ background: '#070708', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', boxSizing: 'border-box' }}>
              <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '16px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c}</span>
              <button onClick={() => removeCard(i)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }} aria-label="Remove card">×</button>
            </div>
          ))}

          <div
            className="setup-card-row"
            style={{ background: '#070708', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: remaining > 0 ? 'text' : 'not-allowed', opacity: remaining > 0 ? 1 : 0.5, boxSizing: 'border-box' }}
            onClick={() => remaining > 0 && inputRef.current?.focus()}
          >
            <button
              className="circle-control"
              onClick={e => { e.stopPropagation(); addCard() }}
              disabled={remaining <= 0}
              style={{ background: hasInput ? RED : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', maxWidth: '32px', maxHeight: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: remaining > 0 ? 'pointer' : 'not-allowed', flexShrink: 0, color: '#fff', fontSize: hasInput ? '14px' : '20px', lineHeight: 1 }}
              aria-label="Add card"
            >{hasInput ? '✓' : '+'}</button>
            <input
              ref={inputRef} value={input} disabled={remaining <= 0}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addCard() }}
              placeholder="Type custom prompt"
              style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontSize: '16px', color: '#fff', flex: 1, letterSpacing: '0.04em', textTransform: 'uppercase' }}
            />
            {hasInput && (
              <button onClick={e => { e.stopPropagation(); addCard() }} style={{ background: 'none', border: 'none', fontFamily: "'Staatliches', sans-serif", fontSize: '14px', color: RED, cursor: 'pointer', whiteSpace: 'nowrap', padding: 0, letterSpacing: '0.05em' }}>
                TAP TO ADD →
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button onClick={() => { haptic('light'); onBack() }} className="cta-btn" style={ctaOutline(142)}>GO BACK</button>
          <button onClick={() => { haptic('medium'); onNext(cards) }} className="cta-btn" style={ctaPrimary(142)}>NEXT</button>
        </div>
      </div>
    </div>
  )
}

/* ─── 4. Round Length ─── */
function RoundLengthScreen({ initialValue, onBack, onNext }: { initialValue: number; onBack: () => void; onNext: (seconds: number) => void }) {
  const [value, setValue] = useState(initialValue ? String(initialValue) : '')
  const inputRef = useRef<HTMLInputElement>(null)
  const parsed = parseInt(value, 10)
  const valid = !isNaN(parsed) && parsed >= 5 && parsed <= 300

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '40px', color: '#fff', margin: 0, letterSpacing: '0.04em' }}>SET ROUND LENGTH</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>How long should each turn last?</p>
        </div>

        <div
          style={{ background: '#070708', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', width: '100%', boxSizing: 'border-box', cursor: 'text' }}
          onClick={() => inputRef.current?.focus()}
        >
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src={clockSticker} alt="" aria-hidden="true" style={{ width: '32px', height: '32px', objectFit: 'contain', display: 'block' }} />
          </div>
          <input
            ref={inputRef} type="number" min={5} max={300}
            value={value} onChange={e => setValue(e.target.value)}
            placeholder="ENTER SECONDS"
            style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', flex: 1, letterSpacing: '0.06em' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button onClick={() => { haptic('light'); onBack() }} className="cta-btn" style={ctaOutline(142)}>GO BACK</button>
          <button onClick={() => { if (valid) { haptic('medium'); onNext(parsed) } }} className="cta-btn" style={ctaPrimary(142, !valid)}>START GAME</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Score badges (persistent header during gameplay) ─── */
function ScoreHeader({ scores, teams, currentTeamId }: { scores: Record<string, number>; teams: GameTeam[]; currentTeamId: string }) {
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
      {teams.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: t.id === currentTeamId ? 'rgba(237,56,68,0.15)' : '#070708',
          border: t.id === currentTeamId ? '1px solid rgba(237,56,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: '999px', padding: '8px 16px', transition: 'background 0.2s, border-color 0.2s',
        }}>
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '14px', color: t.id === currentTeamId ? '#fff' : 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>{t.name.toUpperCase()}</span>
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '14px', color: '#fff', letterSpacing: '0.05em' }}>{scores[t.id] ?? 0}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Get Ready (per turn) ─── */
function GetReadyScreen({ team, actor, turnNumber, canContinue = true, onDone }: { team: GameTeam; actor: Player | null; turnNumber: number; canContinue?: boolean; onDone: () => void }) {
  useEffect(() => {
    if (!canContinue) return
    const t = setTimeout(onDone, 1500)
    return () => clearTimeout(t)
  }, [canContinue, onDone])

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '40px', position: 'relative', zIndex: 2 }}>
      <p style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', margin: 0 }}>TURN {turnNumber}</p>
      <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '40px', color: '#fff', margin: 0, letterSpacing: '0.04em' }}>
        GET READY...
      </h2>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '18px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
        {team.name.toUpperCase()}'S TURN
      </p>

      {actor && (
        <div key={`${team.id}-${actor.name}`} className="nhie-chip-enter" style={{
          background: '#070708', borderRadius: '999px', padding: '10px 20px 10px 12px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: actor.color, flexShrink: 0, boxShadow: '0 0 0 2.5px #fff' }} />
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', letterSpacing: '0.04em' }}>
            {actor.name} is acting
          </span>
        </div>
      )}
    </div>
  )
}

/* ─── Charades card (flip) ─── */
export function CharadesCard({ flipped, prompt, onFlip, compact = false }: { flipped: boolean; prompt: string; onFlip: () => void; compact?: boolean }) {
  const W = compact ? 220 : 320
  const H = compact ? 330 : 480
  const { wrapperStyle, cardStyle } = useScaledCard(W, H)
  return (
    <div style={wrapperStyle}>
    <div
      className="game-card"
      onClick={!flipped ? onFlip : undefined}
      data-sound={!flipped ? 'card.flip' : undefined}
      style={{ ...cardStyle, perspective: '1000px', cursor: flipped ? 'default' : 'pointer', flexShrink: 0 }}
    >
      <div className={!flipped ? 'lyao-float' : ''} style={{ width: '100%', height: '100%' }}>
        <div style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)' }}>

          {/* Front */}
          <div style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            background: RED, borderRadius: '16px', boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <p className="font-slackey" style={{ fontSize: '40px', color: '#e8e6e3', margin: 0 }}>Charades</p>
          </div>

          {/* Back */}
          <div style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)', borderRadius: '16px', padding: '20px', boxSizing: 'border-box',
            background: `repeating-linear-gradient(45deg, ${RED} 0 14px, #fff 14px 28px)`,
            boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              width: '100%', height: '100%', background: RED, borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box',
            }}>
              <p className="font-slackey" style={{ fontSize: compact ? '24px' : '32px', color: '#e8e6e3', lineHeight: 1.3, margin: 0, textAlign: 'center' }}>
                {prompt}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

/* ─── Compact countdown control with pause/resume and cancel actions ─── */
export function TimerControl({
  timeLeft, roundLength, paused, onTogglePause, onCancel,
}: {
  timeLeft: number
  roundLength: number
  paused: boolean
  onTogglePause: () => void
  onCancel: () => void
}) {
  const ratio = roundLength > 0 ? Math.max(0, timeLeft / roundLength) : 0
  const minutes = Math.floor(timeLeft / 60)
  const seconds = String(timeLeft % 60).padStart(2, '0')
  const urgent = timeLeft <= 5

  return (
    <div className={`charades-timer-control${urgent ? ' is-urgent' : ''}`}>
      <svg className="charades-timer-track" viewBox="0 0 400 176" preserveAspectRatio="none" aria-hidden="true">
        <rect x="6" y="6" width="388" height="164" rx="44" pathLength="100" />
        <rect className="charades-timer-progress" x="6" y="6" width="388" height="164" rx="44" pathLength="100"
          style={{ strokeDashoffset: 100 - ratio * 100 }} />
      </svg>
      <div className="charades-timer-content">
        <button className="charades-timer-pause" onClick={onTogglePause}>{paused ? 'Resume' : 'Pause'}</button>
        <p className={urgent ? 'timer-pulse' : ''}>{minutes}:{seconds}</p>
        <button className="charades-timer-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

/* ─── 5. Game (prompt + timer) ─── */
function GameScreen({
  prompt, actor, idx, total, roundLength, scores, teams, currentTeamId, onTimeUp,
}: {
  prompt: string
  actor: Player | null
  idx: number
  total: number
  roundLength: number
  scores: Record<string, number>
  teams: GameTeam[]
  currentTeamId: string
  onTimeUp: () => void
}) {
  const multiplayer = useMultiplayerSession()
  const canControl = !multiplayer || actor?.userId === multiplayer.currentUserId || multiplayer.hostUserId === multiplayer.currentUserId
  const visiblePrompt = multiplayer ? (multiplayer.privatePrompt ?? '') : prompt
  const [flipped, setFlipped] = usePersistentGameState('charades', 'roundRevealed', false)
  const [timerStatus, setTimerStatus] = usePersistentGameState<'ready' | 'running' | 'paused'>('charades', 'timerStatus', 'ready')
  const [timerEndsAt, setTimerEndsAt] = usePersistentGameState('charades', 'timerEndsAt', 0)
  const [pausedRemaining, setPausedRemaining] = usePersistentGameState('charades', 'pausedRemaining', roundLength)
  const [timeLeft, setTimeLeft] = useState(roundLength)
  const timeUpRef = useRef(onTimeUp)
  timeUpRef.current = onTimeUp

  useEffect(() => {
    if (!canControl) return
    setFlipped(false)
    setTimerStatus('ready')
    setTimerEndsAt(0)
    setPausedRemaining(roundLength)
  }, [canControl, idx, roundLength, setFlipped, setPausedRemaining, setTimerEndsAt, setTimerStatus])

  useEffect(() => {
    if (timerStatus === 'ready') { setTimeLeft(roundLength); return }
    if (timerStatus === 'paused') { setTimeLeft(pausedRemaining); return }
    const update = () => {
      const remaining = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining === 0 && canControl) { haptic('medium'); timeUpRef.current() }
    }
    update()
    const timer = window.setInterval(update, 250)
    return () => window.clearInterval(timer)
  }, [canControl, pausedRemaining, roundLength, timerEndsAt, timerStatus])

  const handleFlip = () => { if (!canControl) return; haptic('medium'); setFlipped(true) }
  const handleStartTimer = () => {
    if (!canControl) return
    haptic('medium')
    setTimerEndsAt(Date.now() + roundLength * 1000)
    setTimerStatus('running')
  }
  const handleTogglePause = () => {
    if (!canControl) return
    haptic('light')
    if (timerStatus === 'running') {
      const remaining = Math.max(0, Math.ceil((timerEndsAt - Date.now()) / 1000))
      setPausedRemaining(remaining)
      setTimerStatus('paused')
    } else {
      setTimerEndsAt(Date.now() + pausedRemaining * 1000)
      setTimerStatus('running')
    }
  }
  const handleStop = () => { if (!canControl) return; haptic('light'); onTimeUp() }
  const timerStarted = timerStatus !== 'ready'

  return (
    <div className={`screen-enter${timerStarted ? ' charades-active-round' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: timerStarted ? '14px' : '20px', padding: '24px 40px', position: 'relative', zIndex: 2 }}>
      <ScoreHeader scores={scores} teams={teams} currentTeamId={currentTeamId} />

      <p className="counter-in" key={`counter-${idx}`} style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', margin: 0 }}>
        CARD {String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </p>

      <div className={!flipped ? 'nhie-card-enter' : ''} key={`card-${idx}`}>
        <CharadesCard flipped={flipped && Boolean(visiblePrompt)} prompt={visiblePrompt} onFlip={handleFlip} compact={timerStarted} />
      </div>

      {!flipped ? (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
          {canControl ? 'Tap the card to flip. Act only, no talking, no spelling!' : `${actor?.name ?? 'The actor'} is viewing the word.`}
        </p>
      ) : !timerStarted ? (
        <div className="screen-enter-fast" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Ready? Start the timer when everyone's watching.
          </p>
          <button onClick={handleStartTimer} className="cta-btn" style={ctaPrimary(160)}>START TIMER</button>
        </div>
      ) : (
        <div className="screen-enter-fast" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
          <TimerControl timeLeft={timeLeft} roundLength={roundLength} paused={timerStatus === 'paused'} onTogglePause={handleTogglePause} onCancel={handleStop} />
        </div>
      )}
    </div>
  )
}

/* ─── 6. Did They Get It ─── */
function DidTheyGetItScreen({
  currentTeamId, revealedPrompt, canControl, onResult,
}: {
  currentTeamId: string
  revealedPrompt?: string | null
  canControl: boolean
  onResult: (winnerTeamId: string | null) => void
}) {
  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>
          Did They Get It?
        </h2>
        {revealedPrompt ? <div style={{ width: 'min(320px, 80vw)' }}><CharadesCard flipped prompt={revealedPrompt} onFlip={() => {}} compact /></div> : null}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button disabled={!canControl} onClick={() => { haptic('light'); onResult(null) }} className="cta-btn" style={ctaOutline(160)}>NO</button>
          <button disabled={!canControl} onClick={() => { haptic('success'); onResult(currentTeamId) }} className="cta-btn" style={ctaPrimary(160, !canControl)}>YES</button>
        </div>
      </div>
    </div>
  )
}

/* ─── 7. Points Gained ─── */
function PointsGainedScreen({ scores, lastWinnerId, teams, onNext }: { scores: Record<string, number>; lastWinnerId: string | null; teams: GameTeam[]; onNext: () => void }) {
  useEffect(() => { if (lastWinnerId) haptic('success') }, [lastWinnerId])

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', letterSpacing: '0.04em' }}>
          POINTS GAINED
        </h2>

        <div style={{ width: '100%', maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {teams.map(t => {
            const gained = t.id === lastWinnerId
            return (
              <div key={t.id} className="nhie-row-enter" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#070708', border: '1px dashed rgba(255,255,255,0.1)',
                borderRadius: '12px', padding: '10px 14px', height: '56px', boxSizing: 'border-box',
              }}>
                <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '17px', color: '#fff' }}>{t.name.toUpperCase()}</span>
                <span className={gained ? 'nhie-points-pop' : ''} style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', letterSpacing: '0.06em', color: '#fff' }}>
                  {scores[t.id] ?? 0} PTS
                </span>
              </div>
            )
          })}
        </div>

        <button onClick={() => { haptic('light'); onNext() }} style={{ ...ctaPrimary(402), maxWidth: '100%' }}>NEXT</button>
      </div>
    </div>
  )
}

/* ─── Count-up number (score reveal) ─── */
function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf: number
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])
  return value
}

/* ─── Confetti burst (winner reveal only) ─── */
function Confetti() {
  const pieces = useState(() =>
    Array.from({ length: 32 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: TEAM_COLORS[i % TEAM_COLORS.length],
      delay: Math.random() * 0.4,
      duration: 2.2 + Math.random() * 1.4,
      rotate: Math.random() * 360,
      drift: (Math.random() - 0.5) * 120,
      size: 6 + Math.random() * 6,
    }))
  )[0]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          position: 'absolute', top: '-20px', left: `${p.left}%`,
          width: `${p.size}px`, height: `${p.size * 0.4}px`, background: p.color,
          animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
          ['--drift' as string]: `${p.drift}px`, ['--rotate' as string]: `${p.rotate}deg`,
        }} />
      ))}
    </div>
  )
}

/* ─── Score pill with count-up (Done screen) ─── */
function ScorePill({ team, score, delay }: { team: GameTeam; score: number; delay: number }) {
  const animated = useCountUp(score)
  return (
    <div className="stagger-item" style={{ background: '#070708', borderRadius: '999px', padding: '8px 18px', display: 'flex', gap: '8px', alignItems: 'center', animationDelay: `${delay}s` }}>
      <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{team.name.toUpperCase()}</span>
      <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '14px', color: '#fff' }}>{animated}</span>
    </div>
  )
}

/* ─── Mini card (end screens) ─── */
function MiniCharadesCard() {
  return (
    <div className="done-card" style={{ width: '150px', height: '196px', background: RED, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.45)' }}>
      <p className="font-slackey" style={{ fontSize: '26px', color: '#e8e6e3', margin: 0 }}>Charades</p>
    </div>
  )
}

/* ─── 8. Done ─── */
function DoneScreen({
  scores, teams, turnsPlayed, onPlayAgain, onNewGame, onHome,
}: {
  scores: Record<string, number>
  teams: GameTeam[]
  turnsPlayed: number
  onPlayAgain: () => void
  onNewGame: () => void
  onHome: () => void
}) {
  const maxScore = Math.max(...teams.map(t => scores[t.id] ?? 0))
  const winners = teams.filter(t => (scores[t.id] ?? 0) === maxScore)
  const isTie = winners.length > 1

  useEffect(() => { if (!isTie) haptic('celebrate') }, [isTie])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '40px', zIndex: 2, position: 'relative' }}>
      {!isTie && <Confetti />}

      {!isTie && (
        <img src={TROPHY_ICON} alt="" className="trophy-drop-in" style={{ width: '64px', height: '64px' }} />
      )}

      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 className="done-heading" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '48px', color: '#fff', margin: 0, letterSpacing: '0.02em' }}>
          {isTie ? "IT'S A TIE" : 'WE HAVE A WINNER'}
        </h2>
        <p className="done-subtitle" style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          You played {turnsPlayed} turn{turnsPlayed !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="nhie-chip-enter" style={{ background: '#070708', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '999px', padding: '10px 22px', display: 'inline-flex', alignItems: 'center', gap: '10px', maxWidth: '90%' }}>
        <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', color: '#fff', letterSpacing: '0.04em', textAlign: 'center' }}>
          {isTie ? winners.map(w => w.name.toUpperCase()).join(' & ') : winners[0].name.toUpperCase()}
        </span>
        {!isTie && <img src={TROPHY_ICON} alt="" style={{ width: '18px', height: '18px', flexShrink: 0 }} />}
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100%' }}>
        {teams.map((t, i) => (
          <ScorePill key={t.id} team={t} score={scores[t.id] ?? 0} delay={0.32 + i * 0.06} />
        ))}
      </div>

      <MiniCharadesCard />

      <div className="done-btns" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { haptic('light'); onNewGame() }} className="cta-btn" style={ctaOutline(160)}>NEW GAME</button>
          <button onClick={() => { haptic('medium'); onPlayAgain() }} className="cta-btn" style={ctaPrimary(160)}><PlayAgainLabel /></button>
        </div>
        <button onClick={() => { haptic('light'); onHome() }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif", fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}>
          Return Home
        </button>
      </div>
    </div>
  )
}

/* ─── Root ─── */
export default function CharadesGame({ onClose }: { onClose: () => void }) {
  const multiplayer = useMultiplayerSession()
  const restored = useRef(loadSnapshot())
  const restoredWasFreeForAll = restored.current?.mode === 'ffa'
  const restoredStep = restored.current?.step === 'teamMode' || restoredWasFreeForAll
    ? 'teamBuilder'
    : restored.current?.step ?? 'playerSetup'

  const [step, setStep] = useGameStep<Step>('charades', restoredStep, STEPS)
  const [players, setPlayers] = usePersistentGameState<Player[]>('charades', 'players', restored.current?.players ?? [])
  const [teams, setTeams] = usePersistentGameState<GameTeam[]>('charades', 'teams', restoredWasFreeForAll ? [] : restored.current?.teams ?? [])
  const [selectedCategories, setSelectedCategories] = usePersistentGameState<string[]>('charades', 'selectedCategories', restored.current?.selectedCategories ?? [])
  const [deckSize, setDeckSize] = usePersistentGameState('charades', 'deckSize', restored.current?.deckSize ?? 20)
  const [customCards, setCustomCards] = usePersistentGameState<string[]>('charades', 'customCards', restored.current?.customCards ?? [])
  const [roundLength, setRoundLength] = usePersistentGameState('charades', 'roundLength', restored.current?.roundLength ?? 60)
  const [deck, setDeck] = usePersistentGameState<string[]>('charades', 'deck', restored.current?.deck ?? [])
  const [cardIdx, setCardIdx] = usePersistentGameState('charades', 'cardIdx', restored.current?.cardIdx ?? 0)
  const [currentTeamIdx, setCurrentTeamIdx] = usePersistentGameState('charades', 'currentTeamIdx', restored.current?.currentTeamIdx ?? 0)
  const [actorIdxByTeam, setActorIdxByTeam] = usePersistentGameState<Record<string, number>>('charades', 'actorIdxByTeam', restored.current?.actorIdxByTeam ?? {})
  const [scores, setScores] = usePersistentGameState<Record<string, number>>('charades', 'scores', restored.current?.scores ?? {})
  const [lastWinnerId, setLastWinnerId] = usePersistentGameState<string | null>('charades', 'lastWinnerId', restored.current?.lastWinnerId ?? null)

  // Persist state on every change (skipped once game is back at the start screen)
  useEffect(() => {
    if (step === 'playerSetup') { clearSnapshot(); return }
    saveSnapshot({ step, players, mode: 'teams', teams, selectedCategories, deckSize, customCards, roundLength, deck, cardIdx, currentTeamIdx, actorIdxByTeam, scores, lastWinnerId })
  }, [step, players, teams, selectedCategories, deckSize, customCards, roundLength, deck, cardIdx, currentTeamIdx, actorIdxByTeam, scores, lastWinnerId])

  const startGame = () => {
    const builtDeck = buildCharadesDeck(customCards, selectedCategories, deckSize)
    setDeck(builtDeck)
    setCardIdx(0)
    setScores(Object.fromEntries(teams.map(t => [t.id, 0])))
    setCurrentTeamIdx(0)
    setActorIdxByTeam(Object.fromEntries(teams.map(t => [t.id, 0])))
    setStep('getReady')
  }

  const handleRoundResult = useCallback((winnerTeamId: string | null) => {
    setLastWinnerId(winnerTeamId)
    if (winnerTeamId) setScores(prev => ({ ...prev, [winnerTeamId]: (prev[winnerTeamId] ?? 0) + 1 }))
    setStep('pointsGained')
  }, [])

  const advanceTurn = useCallback(() => {
    const next = cardIdx + 1
    // rotate the actor for the team that just finished
    const teamId = teams[currentTeamIdx]?.id
    if (teamId) setActorIdxByTeam(prev => ({ ...prev, [teamId]: (prev[teamId] ?? 0) + 1 }))
    if (next >= deck.length) {
      setStep('done')
      return
    }
    setCardIdx(next)
    setCurrentTeamIdx(i => (i + 1) % teams.length)
    setStep('getReady')
  }, [cardIdx, deck.length, currentTeamIdx, teams])

  const handlePlayAgain = () => {
    const builtDeck = buildCharadesDeck(customCards, selectedCategories, deckSize)
    setDeck(builtDeck)
    setCardIdx(0)
    setScores(Object.fromEntries(teams.map(t => [t.id, 0])))
    setCurrentTeamIdx(0)
    setActorIdxByTeam(Object.fromEntries(teams.map(t => [t.id, 0])))
    setStep('getReady')
  }

  const handleNewGame = () => {
    clearSnapshot()
    setPlayers([])
    setTeams([])
    setSelectedCategories([])
    setDeckSize(20)
    setCustomCards([])
    setRoundLength(60)
    setDeck([])
    setCardIdx(0)
    setCurrentTeamIdx(0)
    setActorIdxByTeam({})
    setScores({})
    setStep('playerSetup')
  }

  const handleHome = () => { clearSnapshot(); onClose() }

  const currentTeam = teams[currentTeamIdx] ?? null
  const currentActor = currentTeam && currentTeam.players.length > 0
    ? currentTeam.players[(actorIdxByTeam[currentTeam.id] ?? 0) % currentTeam.players.length]
    : null
  const canControlRound = !multiplayer || currentActor?.userId === multiplayer.currentUserId || multiplayer.hostUserId === multiplayer.currentUserId

  return (
    <div className="game-fullscreen">
      <GameNav onBack={onClose} gameId="charades" />

      {step === 'playerSetup' && (
        <SharedPlayerSetup
          initialPlayers={players}
          skipLabel="GO BACK"
          minPlayers={MIN_TEAM_MODE_PLAYERS}
          onSkip={onClose}
          onNext={p => { setPlayers(p); setStep('teamBuilder') }}
        />
      )}

      {step === 'teamBuilder' && (
        <TeamBuilderScreen
          players={players}
          initialTeams={teams}
          onBack={() => setStep('playerSetup')}
          onNext={t => { setTeams(t); setStep('categorySelect') }}
        />
      )}

      {step === 'categorySelect' && (
        <CategorySelectScreen
          initialSelected={selectedCategories}
          onBack={() => setStep('teamBuilder')}
          onNext={ids => { setSelectedCategories(ids); setStep('deckSize') }}
        />
      )}

      {step === 'deckSize' && (
        <DeckSizeScreen
          initialValue={deckSize}
          onBack={() => setStep('categorySelect')}
          onNext={n => { setDeckSize(n); setStep('customCards') }}
        />
      )}

      {step === 'customCards' && (
        <CustomCardsScreen
          deckSize={deckSize}
          initialCards={customCards}
          onBack={() => setStep('deckSize')}
          onNext={cards => { setCustomCards(cards); setStep('roundLength') }}
        />
      )}

      {step === 'roundLength' && (
        <RoundLengthScreen
          initialValue={roundLength}
          onBack={() => setStep('customCards')}
          onNext={seconds => { setRoundLength(seconds); startGame() }}
        />
      )}

      {step === 'getReady' && currentTeam && (
        <GetReadyScreen
          team={currentTeam}
          actor={currentActor}
          turnNumber={cardIdx + 1}
          canContinue={canControlRound}
          onDone={() => setStep('game')}
        />
      )}

      {step === 'game' && deck.length > 0 && currentTeam && (
        <GameScreen
          key={cardIdx}
          prompt={deck[cardIdx]}
          actor={currentActor}
          idx={cardIdx}
          total={deck.length}
          roundLength={roundLength}
          scores={scores}
          teams={teams}
          currentTeamId={currentTeam.id}
          onTimeUp={() => setStep('didTheyGetIt')}
        />
      )}

      {step === 'didTheyGetIt' && currentTeam && (
        <DidTheyGetItScreen currentTeamId={currentTeam.id} revealedPrompt={multiplayer?.privatePrompt ?? deck[cardIdx]} canControl={canControlRound} onResult={handleRoundResult} />
      )}

      {step === 'pointsGained' && (
        <PointsGainedScreen scores={scores} lastWinnerId={lastWinnerId} teams={teams} onNext={advanceTurn} />
      )}

      {step === 'done' && (
        <DoneScreen
          scores={scores}
          teams={teams}
          turnsPlayed={deck.length}
          onPlayAgain={handlePlayAgain}
          onNewGame={handleNewGame}
          onHome={handleHome}
        />
      )}

      <GameFooter />
    </div>
  )
}
