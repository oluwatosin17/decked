import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import { useScaledCard } from './hooks/useCardScale'
import { CHARADES_CATEGORIES, buildCharadesDeck } from './charadesData'
import { haptic } from './haptics'

const RED = '#ed3844'
const STORAGE_KEY = 'charades-game-state-v3'
const TEAM_COLORS = ['#dc2827','#9b59b6','#27ae60','#e67e22','#3498db','#e91e63','#f39c12','#1abc9c']
const MIN_TEAM_MODE_PLAYERS = 4
const MIN_PLAYERS_PER_TEAM = 2

interface GameTeam { id: string; name: string; color: string; players: Player[] }
type PlayMode = 'ffa' | 'teams'

type Step =
  | 'playerSetup' | 'teamMode' | 'teamBuilder' | 'categorySelect' | 'deckSize' | 'customCards' | 'roundLength'
  | 'getReady' | 'game' | 'didTheyGetIt' | 'pointsGained' | 'done'

interface Snapshot {
  step: Step
  players: Player[]
  mode: PlayMode
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

function buildFreeForAllTeams(players: Player[]): GameTeam[] {
  return players.map(p => ({ id: newTeamId(), name: p.name, color: p.color, players: [p] }))
}

/* ─── Shared Nav ─── */
function GameNav({ onBack }: { onBack: () => void }) {
  return (
    <nav style={{ background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 60px', height: '80px', flexShrink: 0, zIndex: 10, position: 'relative' }}>
      <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '28px', color: '#fff', letterSpacing: '0.56px', fontWeight: 400 }}>DECKED</span>
      <div style={{ display: 'flex', gap: '24px' }}>
        {['Browse Games', 'How to Play', 'About'].map(label => (
          <button key={label} onClick={label === 'Browse Games' ? onBack : undefined}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontFamily: "'Anton SC', sans-serif", fontSize: '16px', cursor: label === 'Browse Games' ? 'pointer' : 'default', padding: 0, transition: 'color 0.2s' }}
            onMouseOver={e => { if (label === 'Browse Games') (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
            onMouseOut={e => { if (label === 'Browse Games') (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)' }}
          >{label}</button>
        ))}
      </div>
    </nav>
  )
}

/* ─── Shared Footer ─── */
const SOCIAL_TIKTOK    = '/icons/social-tiktok.svg'
const SOCIAL_INSTAGRAM = '/icons/social-instagram.svg'
const SOCIAL_WHATSAPP  = '/icons/social-whatsapp.svg'
const TROPHY_ICON      = '/icons/trophy.svg'

function GameFooter() {
  return (
    <footer style={{ background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', padding: '32px 60px', display: 'flex', flexDirection: 'column', gap: '40px', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '420px' }}>
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '32px', color: '#fff' }}>DECKED</span>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>Pick a deck, pass the phone, and let the chaos begin. 10+ party card games, no app, no login, no excuses.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {[SOCIAL_TIKTOK, SOCIAL_INSTAGRAM, SOCIAL_WHATSAPP].map((src, i) => (
            <img key={i} src={src} alt="" style={{ width: '20px', height: '20px', borderRadius: '8px', objectFit: 'contain' }} />
          ))}
        </div>
      </div>
      <div style={{ height: '1px', background: '#212326' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#9ca3af' }}>© 2026 DECKED. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Privacy', 'Terms', 'Cookie'].map(l => (
            <button key={l} style={{ background: 'none', border: 'none', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '13px', cursor: 'pointer', padding: 0 }}>{l}</button>
          ))}
        </div>
      </div>
    </footer>
  )
}

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

/* ─── 0a. How would you like to play? ─── */
function TeamModeScreen({ playerCount, onBack, onSelect }: { playerCount: number; onBack: () => void; onSelect: (mode: PlayMode) => void }) {
  const teamsLocked = playerCount < MIN_TEAM_MODE_PLAYERS
  const options: { mode: PlayMode; title: string; desc: string }[] = [
    { mode: 'ffa',   title: 'FREE-FOR-ALL',  desc: 'Each player competes individually' },
    { mode: 'teams', title: 'TEAMS',         desc: 'Group players into custom teams' },
  ]
  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '500px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>
          How would you like to play?
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          {options.map((opt, i) => {
            const locked = opt.mode === 'teams' && teamsLocked
            return (
              <div key={opt.mode} className={`stagger-item mode-row${locked ? ' mode-row-locked' : ''}`} onClick={() => { if (locked) { haptic('light'); return }; haptic('medium'); onSelect(opt.mode) }}
                style={{
                  background: '#111113', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px',
                  padding: '18px 20px', cursor: locked ? 'not-allowed' : 'pointer', boxSizing: 'border-box',
                  display: 'flex', flexDirection: 'column', gap: '4px', opacity: locked ? 0.45 : 1,
                  transition: 'opacity 0.2s', animationDelay: `${0.04 + i * 0.05}s`,
                }}
              >
                <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '20px', color: '#fff', letterSpacing: '0.04em' }}>{opt.title}</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{opt.desc}</span>
                {locked && (
                  <span className="mode-locked-hint" style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '12px', color: RED, letterSpacing: '0.05em', marginTop: '2px' }}>
                    NEED AT LEAST {MIN_TEAM_MODE_PLAYERS} PLAYERS
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <button onClick={() => { haptic('light'); onBack() }} className="cta-btn" style={ctaOutline(142)}>GO BACK</button>
      </div>
    </div>
  )
}

/* ─── 0b. Team Builder ─── */
function TeamBuilderScreen({
  players, initialTeams, onBack, onNext,
}: {
  players: Player[]
  initialTeams: GameTeam[]
  onBack: () => void
  onNext: (teams: GameTeam[]) => void
}) {
  const [teams, setTeams] = useState<GameTeam[]>(initialTeams)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const unassigned = players.filter(p => !teams.some(t => t.players.includes(p)))
  const canNext = teams.length >= 2 && unassigned.length === 0 && teams.every(t => t.players.length >= MIN_PLAYERS_PER_TEAM)

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
    haptic('light')
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, players: [...t.players, player] } : t))
  }
  const unassignPlayer = (player: Player) => {
    haptic('light')
    setTeams(prev => prev.map(t => ({ ...t, players: t.players.filter(p => p !== player) })))
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '560px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0 }}>
            Build Your Teams
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Create teams, name them, and assign every player
          </p>
        </div>

        <div style={{ width: '100%', maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {teams.map(t => (
            <div key={t.id} className="stagger-item" style={{ background: '#111113', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                {editingId === t.id ? (
                  <input
                    autoFocus value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingId(null) }}
                    onBlur={commitRename}
                    style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '17px', color: '#fff', flex: 1 }}
                  />
                ) : (
                  <span onClick={() => startRename(t)} style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '17px', color: '#fff', flex: 1, cursor: 'text' }}>{t.name}</span>
                )}
                <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>({t.players.length})</span>
                <button onClick={() => removeTeam(t.id)} className="icon-x-btn" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px', padding: '0 2px' }} aria-label="Delete team">×</button>
              </div>

              {t.players.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {t.players.map(p => (
                    <div key={p.name} className="chip-pop" style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px', padding: '4px 6px 4px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '14px', color: '#fff' }}>{p.name}</span>
                      <button onClick={() => unassignPlayer(p)} className="icon-x-btn" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '14px', padding: '0 2px' }} aria-label="Remove from team">×</button>
                    </div>
                  ))}
                </div>
              )}
              {t.players.length > 0 && t.players.length < MIN_PLAYERS_PER_TEAM && (
                <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '12px', color: RED, letterSpacing: '0.04em' }}>
                  ADD {MIN_PLAYERS_PER_TEAM - t.players.length} MORE PLAYER{MIN_PLAYERS_PER_TEAM - t.players.length > 1 ? 'S' : ''}
                </span>
              )}
            </div>
          ))}

          <button onClick={addTeam} className="add-team-btn" style={{ background: 'none', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px', color: 'rgba(255,255,255,0.6)', fontFamily: "'Staatliches', sans-serif", fontSize: '15px', letterSpacing: '0.05em', cursor: 'pointer' }}>
            + ADD TEAM
          </button>

          {unassigned.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>UNASSIGNED</span>
              {unassigned.map(p => (
                <div key={p.name} className="stagger-item" style={{ background: '#111113', border: '1px dashed rgba(237,56,68,0.4)', borderRadius: '12px', height: '52px', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', boxSizing: 'border-box' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: p.color, flexShrink: 0, boxShadow: '0 0 0 2px #fff' }} />
                  <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '16px', color: '#fff', flex: 1, minWidth: 0 }}>{p.name}</span>
                  <select
                    defaultValue=""
                    onChange={e => { if (e.target.value) assignPlayer(p, e.target.value) }}
                    style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '13px', padding: '6px 8px' }}
                  >
                    <option value="" disabled>Choose team…</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button onClick={() => { haptic('light'); onBack() }} className="cta-btn" style={ctaOutline(142)}>GO BACK</button>
          <button onClick={() => { if (canNext) { haptic('medium'); onNext(teams) } }} className="cta-btn" style={ctaPrimary(142, !canNext)}>NEXT</button>
        </div>
      </div>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', width: '100%', maxHeight: '400px', overflowY: 'auto' }}>
          {CHARADES_CATEGORIES.map((cat, i) => {
            const isSel = selected.has(cat.id)
            return (
              <div key={cat.id} className="nhie-row-enter nhie-row" onClick={() => toggle(cat.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#111113', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '12px', padding: '12px', height: '56px', minWidth: 0, width: '100%',
                  cursor: 'pointer', boxSizing: 'border-box',
                  animationDelay: `${0.03 + i * 0.02}s`,
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={cat.icon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                  </div>
                  <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>{cat.label}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
          style={{ background: '#111113', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', width: '100%', boxSizing: 'border-box', cursor: 'text' }}
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
            <div key={i} className="stagger-item" style={{ background: '#111113', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', boxSizing: 'border-box' }}>
              <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '16px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c}</span>
              <button onClick={() => removeCard(i)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }} aria-label="Remove card">×</button>
            </div>
          ))}

          <div
            style={{ background: '#111113', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: remaining > 0 ? 'text' : 'not-allowed', opacity: remaining > 0 ? 1 : 0.5, boxSizing: 'border-box' }}
            onClick={() => remaining > 0 && inputRef.current?.focus()}
          >
            <button
              onClick={e => { e.stopPropagation(); addCard() }}
              disabled={remaining <= 0}
              style={{ background: hasInput ? RED : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '16px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: remaining > 0 ? 'pointer' : 'not-allowed', flexShrink: 0, color: '#fff', fontSize: hasInput ? '14px' : '20px', lineHeight: 1 }}
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
          style={{ background: '#111113', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', width: '100%', boxSizing: 'border-box', cursor: 'text' }}
          onClick={() => inputRef.current?.focus()}
        >
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: 300, lineHeight: 1 }}>⏱</span>
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
          background: t.id === currentTeamId ? 'rgba(237,56,68,0.15)' : '#111113',
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
function GetReadyScreen({ team, actor, turnNumber, onDone }: { team: GameTeam; actor: Player | null; turnNumber: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1500)
    return () => clearTimeout(t)
  }, [onDone])

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
          background: '#111113', borderRadius: '999px', padding: '10px 20px 10px 12px',
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
function CharadesCard({ flipped, prompt, onFlip }: { flipped: boolean; prompt: string; onFlip: () => void }) {
  const W = 320, H = 480
  const { wrapperStyle, cardStyle } = useScaledCard(W, H)
  return (
    <div style={wrapperStyle}>
    <div
      className="game-card"
      onClick={!flipped ? onFlip : undefined}
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
              <p className="font-slackey" style={{ fontSize: '32px', color: '#e8e6e3', lineHeight: 1.3, margin: 0, textAlign: 'center' }}>
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

/* ─── Circular countdown ring — the timer is the centerpiece once running ─── */
function TimerRing({ timeLeft, roundLength }: { timeLeft: number; roundLength: number }) {
  const size = 168
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = roundLength > 0 ? Math.max(0, timeLeft / roundLength) : 0
  const offset = circumference * (1 - ratio)
  const urgent = timeLeft <= 5

  return (
    <div className="timer-ring-breathe" style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={RED} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear', filter: urgent ? 'drop-shadow(0 0 10px rgba(237,56,68,0.8))' : 'drop-shadow(0 0 6px rgba(237,56,68,0.4))' }}
        />
      </svg>
      <p className={urgent ? 'timer-pulse' : ''} style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '64px', margin: 0,
        color: urgent ? RED : '#fff', letterSpacing: '0.02em',
      }}>
        {timeLeft}
      </p>
    </div>
  )
}

/* ─── 5. Game (prompt + timer) ─── */
function GameScreen({
  prompt, idx, total, roundLength, scores, teams, currentTeamId, onTimeUp,
}: {
  prompt: string
  idx: number
  total: number
  roundLength: number
  scores: Record<string, number>
  teams: GameTeam[]
  currentTeamId: string
  onTimeUp: () => void
}) {
  const [flipped, setFlipped] = useState(false)
  const [timerStarted, setTimerStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(roundLength)
  const timeUpRef = useRef(onTimeUp)
  timeUpRef.current = onTimeUp

  useEffect(() => { setFlipped(false); setTimerStarted(false); setTimeLeft(roundLength) }, [idx, roundLength])

  useEffect(() => {
    if (!flipped || !timerStarted) return
    if (timeLeft <= 0) { haptic('medium'); timeUpRef.current(); return }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [flipped, timerStarted, timeLeft])

  const handleFlip = () => { haptic('medium'); setFlipped(true) }
  const handleStartTimer = () => { haptic('medium'); setTimerStarted(true) }
  const handleStop = () => { haptic('light'); onTimeUp() }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '24px 40px', position: 'relative', zIndex: 2 }}>
      <ScoreHeader scores={scores} teams={teams} currentTeamId={currentTeamId} />

      <p className="counter-in" key={`counter-${idx}`} style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', margin: 0 }}>
        CARD {String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </p>

      <div className={!flipped ? 'nhie-card-enter' : ''} key={`card-${idx}`}>
        <CharadesCard flipped={flipped} prompt={prompt} onFlip={handleFlip} />
      </div>

      {!flipped ? (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
          Tap the card to flip it. Act only — no talking, no spelling!
        </p>
      ) : !timerStarted ? (
        <div className="screen-enter-fast" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            Ready? Start the timer when everyone's watching.
          </p>
          <button onClick={handleStartTimer} className="cta-btn" style={ctaPrimary(160)}>START TIMER</button>
        </div>
      ) : (
        <div className="screen-enter-fast" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <TimerRing timeLeft={timeLeft} roundLength={roundLength} />
          <button onClick={handleStop} className="cta-btn" style={ctaOutline(160)}>STOP TIMER</button>
        </div>
      )}
    </div>
  )
}

/* ─── 6. Did They Get It ─── */
function DidTheyGetItScreen({
  mode, teams, currentTeamId, onResult,
}: {
  mode: PlayMode
  teams: GameTeam[]
  currentTeamId: string
  onResult: (winnerTeamId: string | null) => void
}) {
  if (mode === 'teams') {
    return (
      <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
          <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>
            Did They Get It?
          </h2>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={() => { haptic('light'); onResult(null) }} className="cta-btn" style={ctaOutline(160)}>NO</button>
            <button onClick={() => { haptic('success'); onResult(currentTeamId) }} className="cta-btn" style={ctaPrimary(160)}>YES</button>
          </div>
        </div>
      </div>
    )
  }

  // Free-for-all: everyone but the actor is guessing — host taps whoever shouted the right answer first.
  const guessers = teams.filter(t => t.id !== currentTeamId)
  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '32px', color: '#fff', margin: 0 }}>
            Who Guessed It First?
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Tap whoever shouted the right answer first
          </p>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {guessers.map((t, i) => (
            <div key={t.id} className="stagger-item guesser-row" onClick={() => { haptic('success'); onResult(t.id) }}
              style={{
                background: '#111113', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: '12px',
                height: '56px', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                boxSizing: 'border-box', cursor: 'pointer', animationDelay: `${0.03 + i * 0.04}s`,
              }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: t.color, flexShrink: 0, boxShadow: '0 0 0 2px #fff' }} />
              <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '17px', color: '#fff', flex: 1, minWidth: 0 }}>{t.name}</span>
            </div>
          ))}
        </div>

        <button onClick={() => { haptic('light'); onResult(null) }} className="cta-btn" style={ctaOutline(197)}>NO ONE GOT IT</button>
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
                background: '#111113', border: '1px dashed rgba(255,255,255,0.12)',
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
    <div className="stagger-item" style={{ background: '#111113', borderRadius: '999px', padding: '8px 18px', display: 'flex', gap: '8px', alignItems: 'center', animationDelay: `${delay}s` }}>
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

      <div className="nhie-chip-enter" style={{ background: '#111113', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '999px', padding: '10px 22px', display: 'inline-flex', alignItems: 'center', gap: '10px', maxWidth: '90%' }}>
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
          <button onClick={() => { haptic('medium'); onPlayAgain() }} className="cta-btn" style={ctaPrimary(160)}>PLAY AGAIN</button>
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
  const restored = useRef(loadSnapshot())

  const [step, setStep] = useState<Step>(restored.current?.step ?? 'playerSetup')
  const [players, setPlayers] = useState<Player[]>(restored.current?.players ?? [])
  const [mode, setMode] = useState<PlayMode>(restored.current?.mode ?? 'ffa')
  const [teams, setTeams] = useState<GameTeam[]>(restored.current?.teams ?? [])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(restored.current?.selectedCategories ?? [])
  const [deckSize, setDeckSize] = useState(restored.current?.deckSize ?? 20)
  const [customCards, setCustomCards] = useState<string[]>(restored.current?.customCards ?? [])
  const [roundLength, setRoundLength] = useState(restored.current?.roundLength ?? 60)
  const [deck, setDeck] = useState<string[]>(restored.current?.deck ?? [])
  const [cardIdx, setCardIdx] = useState(restored.current?.cardIdx ?? 0)
  const [currentTeamIdx, setCurrentTeamIdx] = useState(restored.current?.currentTeamIdx ?? 0)
  const [actorIdxByTeam, setActorIdxByTeam] = useState<Record<string, number>>(restored.current?.actorIdxByTeam ?? {})
  const [scores, setScores] = useState<Record<string, number>>(restored.current?.scores ?? {})
  const [lastWinnerId, setLastWinnerId] = useState<string | null>(restored.current?.lastWinnerId ?? null)

  // Persist state on every change (skipped once game is back at the start screen)
  useEffect(() => {
    if (step === 'playerSetup') { clearSnapshot(); return }
    saveSnapshot({ step, players, mode, teams, selectedCategories, deckSize, customCards, roundLength, deck, cardIdx, currentTeamIdx, actorIdxByTeam, scores, lastWinnerId })
  }, [step, players, mode, teams, selectedCategories, deckSize, customCards, roundLength, deck, cardIdx, currentTeamIdx, actorIdxByTeam, scores, lastWinnerId])

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
    setMode('ffa')
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

  return (
    <div className="game-fullscreen">
      <GameNav onBack={handleHome} />

      {step === 'playerSetup' && (
        <SharedPlayerSetup
          initialPlayers={players}
          skipLabel="GO BACK"
          minPlayers={2}
          onSkip={onClose}
          onNext={p => { setPlayers(p); setStep('teamMode') }}
        />
      )}

      {step === 'teamMode' && (
        <TeamModeScreen
          playerCount={players.length}
          onBack={() => setStep('playerSetup')}
          onSelect={selected => {
            setMode(selected)
            if (selected === 'ffa') { setTeams(buildFreeForAllTeams(players)); setStep('categorySelect') }
            else setStep('teamBuilder')
          }}
        />
      )}

      {step === 'teamBuilder' && (
        <TeamBuilderScreen
          players={players}
          initialTeams={teams}
          onBack={() => setStep('teamMode')}
          onNext={t => { setTeams(t); setStep('categorySelect') }}
        />
      )}

      {step === 'categorySelect' && (
        <CategorySelectScreen
          initialSelected={selectedCategories}
          onBack={() => setStep('teamMode')}
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
          onDone={() => setStep('game')}
        />
      )}

      {step === 'game' && deck.length > 0 && currentTeam && (
        <GameScreen
          key={cardIdx}
          prompt={deck[cardIdx]}
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
        <DidTheyGetItScreen mode={mode} teams={teams} currentTeamId={currentTeam.id} onResult={handleRoundResult} />
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
