import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import { CHARADES_CATEGORIES, buildCharadesDeck } from './charadesData'
import { haptic } from './haptics'

const RED = '#ed3844'
const STORAGE_KEY = 'charades-game-state-v1'

type Team = 'A' | 'B'
type Step =
  | 'playerSetup' | 'teamAssign' | 'categorySelect' | 'deckSize' | 'customCards' | 'roundLength'
  | 'getReady' | 'game' | 'didTheyGetIt' | 'pointsGained' | 'done'

interface Snapshot {
  step: Step
  players: Player[]
  teams: Record<Team, Player[]>
  selectedCategories: string[]
  deckSize: number
  customCards: string[]
  roundLength: number
  deck: string[]
  cardIdx: number
  currentTeam: Team
  actorIdxByTeam: Record<Team, number>
  scores: Record<Team, number>
  lastYes: boolean
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

function assignTeams(players: Player[]): Record<Team, Player[]> {
  const A: Player[] = []
  const B: Player[] = []
  players.forEach((p, i) => (i % 2 === 0 ? A : B).push(p))
  return { A, B }
}

/* ─── Shared Nav ─── */
function GameNav({ onBack }: { onBack: () => void }) {
  return (
    <nav style={{ background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 60px', height: '80px', flexShrink: 0, zIndex: 10, position: 'relative' }}>
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
    <footer style={{ background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)', padding: '32px 60px', display: 'flex', flexDirection: 'column', gap: '40px', flexShrink: 0 }}>
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

/* ─── 0. Team Assignment ─── */
function TeamAssignScreen({
  teams, onBack, onNext,
}: {
  teams: Record<Team, Player[]>
  onBack: () => void
  onNext: (teams: Record<Team, Player[]>) => void
}) {
  const [assign, setAssign] = useState<Record<Team, Player[]>>(teams)
  const canNext = assign.A.length > 0 && assign.B.length > 0

  const movePlayer = (from: Team, player: Player) => {
    haptic('light')
    const to: Team = from === 'A' ? 'B' : 'A'
    setAssign(prev => ({
      ...prev,
      [from]: prev[from].filter(p => p !== player),
      [to]: [...prev[to], player],
    }))
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '600px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0 }}>
            Assign Teams
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Tap a player to move them to the other team
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
          {(['A', 'B'] as Team[]).map(t => (
            <div key={t} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>TEAM {t}</span>
                <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>({assign[t].length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '56px' }}>
                {assign[t].map(p => (
                  <div key={p.name} onClick={() => movePlayer(t, p)} className="stagger-item" style={{
                    background: '#111113', border: '1px dashed rgba(255,255,255,0.1)',
                    borderRadius: '12px', height: '52px', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', cursor: 'pointer', boxSizing: 'border-box',
                  }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: p.color, flexShrink: 0, boxShadow: '0 0 0 2px #fff' }} />
                    <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '16px', color: '#fff', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button onClick={() => { haptic('light'); onBack() }} style={ctaOutline(142)}>GO BACK</button>
          <button onClick={() => { if (canNext) { haptic('medium'); onNext(assign) } }} style={ctaPrimary(142, !canNext)}>NEXT</button>
        </div>
      </div>
    </div>
  )
}

/* ─── 1. Select Categories ─── */
function CategorySelectScreen({ onBack, onNext }: { onBack: () => void; onNext: (ids: string[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
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
          <button onClick={() => { haptic('light'); onBack() }} style={ctaOutline(142)}>GO BACK</button>
          <button onClick={() => { if (canNext) { haptic('medium'); onNext([...selected]) } }} style={ctaPrimary(142, !canNext)}>NEXT</button>
        </div>
      </div>
    </div>
  )
}

/* ─── 2. Deck Size ─── */
function DeckSizeScreen({ onBack, onNext }: { onBack: () => void; onNext: (n: number) => void }) {
  const [value, setValue] = useState('')
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
          <button onClick={() => { haptic('light'); onBack() }} style={ctaOutline(142)}>GO BACK</button>
          <button onClick={() => { if (valid) { haptic('medium'); onNext(parsed) } }} style={ctaPrimary(142, !valid)}>NEXT</button>
        </div>
      </div>
    </div>
  )
}

/* ─── 3. Custom Cards (optional) ─── */
function CustomCardsScreen({ deckSize, onBack, onNext }: { deckSize: number; onBack: () => void; onNext: (cards: string[]) => void }) {
  const [cards, setCards] = useState<string[]>([])
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
          <button onClick={() => { haptic('light'); onBack() }} style={ctaOutline(142)}>GO BACK</button>
          <button onClick={() => { haptic('medium'); onNext(cards) }} style={ctaPrimary(142)}>NEXT</button>
        </div>
      </div>
    </div>
  )
}

/* ─── 4. Round Length ─── */
function RoundLengthScreen({ onBack, onNext }: { onBack: () => void; onNext: (seconds: number) => void }) {
  const [value, setValue] = useState('')
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
          <button onClick={() => { haptic('light'); onBack() }} style={ctaOutline(142)}>GO BACK</button>
          <button onClick={() => { if (valid) { haptic('medium'); onNext(parsed) } }} style={ctaPrimary(142, !valid)}>START GAME</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Score badges (persistent header during gameplay) ─── */
function ScoreHeader({ scores, currentTeam }: { scores: Record<Team, number>; currentTeam: Team }) {
  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      {(['A', 'B'] as Team[]).map(t => (
        <div key={t} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: t === currentTeam ? 'rgba(237,56,68,0.15)' : '#111113',
          border: t === currentTeam ? '1px solid rgba(237,56,68,0.5)' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: '999px', padding: '8px 16px', transition: 'background 0.2s, border-color 0.2s',
        }}>
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '14px', color: t === currentTeam ? '#fff' : 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>TEAM {t}</span>
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '14px', color: '#fff', letterSpacing: '0.05em' }}>{scores[t]}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Get Ready (per turn) ─── */
function GetReadyScreen({ team, actor, turnNumber, onDone }: { team: Team; actor: Player | null; turnNumber: number; onDone: () => void }) {
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
        TEAM {team}'s turn
      </p>

      {actor && (
        <div key={`${team}-${actor.name}`} className="nhie-chip-enter" style={{
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
  return (
    <div
      onClick={!flipped ? onFlip : undefined}
      style={{ width: `${W}px`, height: `${H}px`, perspective: '1000px', cursor: flipped ? 'default' : 'pointer', flexShrink: 0 }}
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
  )
}

/* ─── 5. Game (prompt + timer) ─── */
function GameScreen({
  prompt, idx, total, roundLength, scores, currentTeam, onTimeUp,
}: {
  prompt: string
  idx: number
  total: number
  roundLength: number
  scores: Record<Team, number>
  currentTeam: Team
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
    if (timeLeft <= 0) { timeUpRef.current(); return }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [flipped, timerStarted, timeLeft])

  const handleFlip = () => { haptic('medium'); setFlipped(true) }
  const handleStartTimer = () => { haptic('medium'); setTimerStarted(true) }
  const handleStop = () => { haptic('light'); onTimeUp() }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '24px 40px', position: 'relative', zIndex: 2 }}>
      <ScoreHeader scores={scores} currentTeam={currentTeam} />

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
          <button onClick={handleStartTimer} style={ctaPrimary(160)}>START TIMER</button>
        </div>
      ) : (
        <div className="screen-enter-fast" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <p className={timeLeft <= 5 ? 'timer-pulse' : ''} style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '56px', color: timeLeft <= 5 ? RED : '#fff', margin: 0, letterSpacing: '0.02em' }}>
            {timeLeft}
          </p>
          <button onClick={handleStop} style={ctaOutline(160)}>STOP TIMER</button>
        </div>
      )}
    </div>
  )
}

/* ─── 6. Did They Get It ─── */
function DidTheyGetItScreen({ onResult }: { onResult: (yes: boolean) => void }) {
  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>
          Did They Get It?
        </h2>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button onClick={() => { haptic('light'); onResult(false) }} style={ctaOutline(160)}>NO</button>
          <button onClick={() => { haptic('success'); onResult(true) }} style={ctaPrimary(160)}>YES</button>
        </div>
      </div>
    </div>
  )
}

/* ─── 7. Points Gained ─── */
function PointsGainedScreen({ scores, lastYes, currentTeam, onNext }: { scores: Record<Team, number>; lastYes: boolean; currentTeam: Team; onNext: () => void }) {
  useEffect(() => { if (lastYes) haptic('success') }, [lastYes])

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
      <div style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '28px', alignItems: 'center', zIndex: 2, position: 'relative' }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', letterSpacing: '0.04em' }}>
          POINTS GAINED
        </h2>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(['A', 'B'] as Team[]).map(t => {
            const gained = t === currentTeam && lastYes
            return (
              <div key={t} className="nhie-row-enter" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#111113', border: '1px dashed rgba(255,255,255,0.12)',
                borderRadius: '12px', padding: '10px 14px', height: '56px', boxSizing: 'border-box',
              }}>
                <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '17px', color: '#fff' }}>TEAM {t}</span>
                <span className={gained ? 'nhie-points-pop' : ''} style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', letterSpacing: '0.06em', color: '#fff' }}>
                  {scores[t]} PTS
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
  scores, turnsPlayed, onPlayAgain, onNewGame, onHome,
}: {
  scores: Record<Team, number>
  turnsPlayed: number
  onPlayAgain: () => void
  onNewGame: () => void
  onHome: () => void
}) {
  const isTie = scores.A === scores.B
  const winner: Team | null = isTie ? null : (scores.A > scores.B ? 'A' : 'B')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '40px', zIndex: 2, position: 'relative' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 className="done-heading" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '48px', color: '#fff', margin: 0, letterSpacing: '0.02em' }}>
          {isTie ? "IT'S A TIE" : 'WE HAVE A WINNER'}
        </h2>
        <p className="done-subtitle" style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          You played {turnsPlayed} turn{turnsPlayed !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="nhie-chip-enter" style={{ background: '#111113', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '999px', padding: '10px 22px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', color: '#fff', letterSpacing: '0.04em' }}>
          {isTie ? 'NO WINNER' : `TEAM ${winner}`}
        </span>
        {!isTie && <img src={TROPHY_ICON} alt="" style={{ width: '18px', height: '18px' }} />}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {(['A', 'B'] as Team[]).map(t => (
          <div key={t} style={{ background: '#111113', borderRadius: '999px', padding: '8px 18px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>TEAM {t}</span>
            <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '14px', color: '#fff' }}>{scores[t]}</span>
          </div>
        ))}
      </div>

      <MiniCharadesCard />

      <div className="done-btns" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { haptic('light'); onNewGame() }} style={ctaOutline(160)}>NEW GAME</button>
          <button onClick={() => { haptic('medium'); onPlayAgain() }} style={ctaPrimary(160)}>PLAY AGAIN</button>
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
  const [teams, setTeams] = useState<Record<Team, Player[]>>(restored.current?.teams ?? { A: [], B: [] })
  const [selectedCategories, setSelectedCategories] = useState<string[]>(restored.current?.selectedCategories ?? [])
  const [deckSize, setDeckSize] = useState(restored.current?.deckSize ?? 20)
  const [customCards, setCustomCards] = useState<string[]>(restored.current?.customCards ?? [])
  const [roundLength, setRoundLength] = useState(restored.current?.roundLength ?? 60)
  const [deck, setDeck] = useState<string[]>(restored.current?.deck ?? [])
  const [cardIdx, setCardIdx] = useState(restored.current?.cardIdx ?? 0)
  const [currentTeam, setCurrentTeam] = useState<Team>(restored.current?.currentTeam ?? 'A')
  const [actorIdxByTeam, setActorIdxByTeam] = useState<Record<Team, number>>(restored.current?.actorIdxByTeam ?? { A: 0, B: 0 })
  const [scores, setScores] = useState<Record<Team, number>>(restored.current?.scores ?? { A: 0, B: 0 })
  const [lastYes, setLastYes] = useState(restored.current?.lastYes ?? false)

  // Persist state on every change (skipped once game is back at the start screen)
  useEffect(() => {
    if (step === 'playerSetup') { clearSnapshot(); return }
    saveSnapshot({ step, players, teams, selectedCategories, deckSize, customCards, roundLength, deck, cardIdx, currentTeam, actorIdxByTeam, scores, lastYes })
  }, [step, players, teams, selectedCategories, deckSize, customCards, roundLength, deck, cardIdx, currentTeam, actorIdxByTeam, scores, lastYes])

  const startGame = () => {
    const builtDeck = buildCharadesDeck(customCards, selectedCategories, deckSize)
    setDeck(builtDeck)
    setCardIdx(0)
    setScores({ A: 0, B: 0 })
    setCurrentTeam('A')
    setActorIdxByTeam({ A: 0, B: 0 })
    setStep('getReady')
  }

  const handleResult = useCallback((yes: boolean) => {
    setLastYes(yes)
    if (yes) setScores(prev => ({ ...prev, [currentTeam]: prev[currentTeam] + 1 }))
    setStep('pointsGained')
  }, [currentTeam])

  const advanceTurn = useCallback(() => {
    const next = cardIdx + 1
    // rotate the actor for the team that just finished
    setActorIdxByTeam(prev => ({ ...prev, [currentTeam]: prev[currentTeam] + 1 }))
    if (next >= deck.length) {
      setStep('done')
      return
    }
    setCardIdx(next)
    setCurrentTeam(t => (t === 'A' ? 'B' : 'A'))
    setStep('getReady')
  }, [cardIdx, deck.length, currentTeam])

  const handlePlayAgain = () => {
    const builtDeck = buildCharadesDeck(customCards, selectedCategories, deckSize)
    setDeck(builtDeck)
    setCardIdx(0)
    setScores({ A: 0, B: 0 })
    setCurrentTeam('A')
    setActorIdxByTeam({ A: 0, B: 0 })
    setStep('getReady')
  }

  const handleNewGame = () => {
    clearSnapshot()
    setPlayers([])
    setTeams({ A: [], B: [] })
    setSelectedCategories([])
    setDeckSize(20)
    setCustomCards([])
    setRoundLength(60)
    setDeck([])
    setCardIdx(0)
    setCurrentTeam('A')
    setActorIdxByTeam({ A: 0, B: 0 })
    setScores({ A: 0, B: 0 })
    setStep('playerSetup')
  }

  const handleHome = () => { clearSnapshot(); onClose() }

  const currentTeamPlayers = teams[currentTeam]
  const currentActor = currentTeamPlayers.length > 0
    ? currentTeamPlayers[actorIdxByTeam[currentTeam] % currentTeamPlayers.length]
    : null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <GameNav onBack={handleHome} />

      {step === 'playerSetup' && (
        <SharedPlayerSetup
          initialPlayers={players}
          skipLabel="GO BACK"
          minPlayers={2}
          onSkip={onClose}
          onNext={p => { setPlayers(p); setTeams(assignTeams(p)); setStep('teamAssign') }}
        />
      )}

      {step === 'teamAssign' && (
        <TeamAssignScreen
          teams={teams}
          onBack={() => setStep('playerSetup')}
          onNext={t => { setTeams(t); setStep('categorySelect') }}
        />
      )}

      {step === 'categorySelect' && (
        <CategorySelectScreen
          onBack={() => setStep('teamAssign')}
          onNext={ids => { setSelectedCategories(ids); setStep('deckSize') }}
        />
      )}

      {step === 'deckSize' && (
        <DeckSizeScreen
          onBack={() => setStep('categorySelect')}
          onNext={n => { setDeckSize(n); setStep('customCards') }}
        />
      )}

      {step === 'customCards' && (
        <CustomCardsScreen
          deckSize={deckSize}
          onBack={() => setStep('deckSize')}
          onNext={cards => { setCustomCards(cards); setStep('roundLength') }}
        />
      )}

      {step === 'roundLength' && (
        <RoundLengthScreen
          onBack={() => setStep('customCards')}
          onNext={seconds => { setRoundLength(seconds); startGame() }}
        />
      )}

      {step === 'getReady' && (
        <GetReadyScreen
          team={currentTeam}
          actor={currentActor}
          turnNumber={cardIdx + 1}
          onDone={() => setStep('game')}
        />
      )}

      {step === 'game' && deck.length > 0 && (
        <GameScreen
          key={cardIdx}
          prompt={deck[cardIdx]}
          idx={cardIdx}
          total={deck.length}
          roundLength={roundLength}
          scores={scores}
          currentTeam={currentTeam}
          onTimeUp={() => setStep('didTheyGetIt')}
        />
      )}

      {step === 'didTheyGetIt' && (
        <DidTheyGetItScreen onResult={handleResult} />
      )}

      {step === 'pointsGained' && (
        <PointsGainedScreen scores={scores} lastYes={lastYes} currentTeam={currentTeam} onNext={advanceTurn} />
      )}

      {step === 'done' && (
        <DoneScreen
          scores={scores}
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
