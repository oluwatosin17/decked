import { useState, useRef } from 'react'

export type Player = { name: string; color: string }

const PLAYER_COLORS = ['#dc2827','#9b59b6','#27ae60','#e67e22','#3498db','#e91e63','#f39c12','#1abc9c']

interface Props {
  initialPlayers?: Player[]
  /** Label for the secondary/back button */
  skipLabel?: string
  /** Minimum number of players required before NEXT activates (default 1) */
  minPlayers?: number
  onSkip: () => void
  onNext: (players: Player[]) => void
}

export default function PlayerSetup({ initialPlayers = [], skipLabel = 'SKIP FOR NOW', minPlayers = 1, onSkip, onNext }: Props) {
  const [players, setPlayers]   = useState<Player[]>(initialPlayers)
  const [input, setInput]       = useState('')
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue]   = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const editRef  = useRef<HTMLInputElement>(null)

  const nextColor = PLAYER_COLORS[players.length % PLAYER_COLORS.length]
  const hasInput  = input.trim().length > 0
  const canNext   = players.length >= minPlayers

  const addPlayer = () => {
    const name = input.trim()
    if (!name) return
    setPlayers(prev => [...prev, { name, color: PLAYER_COLORS[prev.length % PLAYER_COLORS.length] }])
    setInput('')
    inputRef.current?.focus()
  }

  const removePlayer = (idx: number) => setPlayers(prev => prev.filter((_, i) => i !== idx))

  const startEdit = (idx: number) => {
    setEditingIdx(idx)
    setEditValue(players[idx].name)
    setTimeout(() => editRef.current?.select(), 0)
  }

  const commitEdit = () => {
    const name = editValue.trim()
    if (name && editingIdx !== null)
      setPlayers(prev => prev.map((p, i) => i === editingIdx ? { ...p, name } : p))
    setEditingIdx(null)
    setEditValue('')
  }

  return (
    <div className="screen-enter" style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', padding: '40px',
    }}>
      <div className="setup-container" style={{
        width: '500px', position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <h2 style={{
            fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
            fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center',
          }}>
            Who's Playing?
          </h2>
          {minPlayers > 1 && (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Add at least {minPlayers} players to continue
            </p>
          )}
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {players.map((p, i) => (
            <div key={i} className="stagger-item" style={{
              background: '#111113', border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: '12px', height: '56px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px',
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: p.color, flexShrink: 0, boxShadow: '0 0 0 2.5px #ffffff',
                }} />
                {editingIdx === i ? (
                  <input
                    ref={editRef}
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') { setEditingIdx(null) } }}
                    onBlur={commitEdit}
                    style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', flex: 1 }}
                  />
                ) : (
                  <span
                    onClick={() => startEdit(i)}
                    style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', cursor: 'text', flex: 1 }}
                  >
                    {p.name}
                  </span>
                )}
              </div>
              <button
                onClick={() => removePlayer(i)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px', padding: '0 4px', display: 'flex', alignItems: 'center' }}
                aria-label="Remove player"
              >×</button>
            </div>
          ))}

          {/* Add player input row */}
          <div
            style={{
              background: '#111113', border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: '12px', height: '56px',
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'text',
            }}
            onClick={() => inputRef.current?.focus()}
          >
            <button
              onClick={e => { e.stopPropagation(); addPlayer() }}
              style={{
                background: hasInput ? nextColor : 'rgba(255,255,255,0.1)',
                border: 'none', borderRadius: '16px',
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, color: '#fff',
                fontSize: hasInput ? '14px' : '20px', fontWeight: 400, lineHeight: 1,
                transition: 'background 0.15s',
                boxShadow: hasInput ? '0 0 0 2.5px #ffffff' : 'none',
              }}
              aria-label="Add player"
            >{hasInput ? '✓' : '+'}</button>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addPlayer() }}
              placeholder="Add a player..."
              style={{
                background: 'none', border: 'none', outline: 'none',
                fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
                fontSize: '18px', color: '#fff', flex: 1,
              }}
            />
            {hasInput && (
              <button onClick={e => { e.stopPropagation(); addPlayer() }} style={{ background: 'none', border: 'none', fontFamily: "'Staatliches', sans-serif", fontSize: '14px', color: nextColor, cursor: 'pointer', whiteSpace: 'nowrap', padding: 0, letterSpacing: '0.05em' }}>
                TAP TO ADD →
              </button>
            )}
          </div>
        </div>

        <div className="setup-buttons" style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '380px' }}>
          <button
            className="game-btn"
            onClick={onSkip}
            style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', letterSpacing: '0.05em' }}
          >
            {skipLabel}
          </button>
          <button
            className={canNext ? 'game-btn-primary' : ''}
            onClick={() => canNext && setTimeout(() => onNext(players), 100)}
            style={{
              flex: 1, background: canNext ? '#dc2827' : '#2a2a2a',
              border: 'none', borderRadius: '999px', padding: '12px 18px',
              fontFamily: "'Staatliches', sans-serif", fontSize: '16px',
              color: canNext ? '#fff' : '#555',
              cursor: canNext ? 'pointer' : 'not-allowed',
              textAlign: 'center', letterSpacing: '0.05em', transition: 'background 0.2s, color 0.2s',
            }}
          >
            NEXT
          </button>
        </div>
      </div>
    </div>
  )
}
