import { useState, useRef } from 'react'

interface Props {
  maxCards: number
  onBack: () => void
  onNext: (customCards: string[]) => void
}

export default function CustomCards({ maxCards, onBack, onNext }: Props) {
  const [cards, setCards] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const editRef = useRef<HTMLInputElement>(null)

  const hasInput = input.trim().length > 0
  const canAdd = cards.length < maxCards

  const addCard = () => {
    const text = input.trim()
    if (!text || !canAdd) return
    setCards(prev => [...prev, text])
    setInput('')
    inputRef.current?.focus()
  }

  const removeCard = (idx: number) => setCards(prev => prev.filter((_, i) => i !== idx))

  const startEdit = (idx: number) => {
    setEditingIdx(idx)
    setEditValue(cards[idx])
    setTimeout(() => editRef.current?.select(), 0)
  }

  const commitEdit = () => {
    const text = editValue.trim()
    if (text && editingIdx !== null)
      setCards(prev => prev.map((c, i) => i === editingIdx ? text : c))
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
        display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <h2 style={{
            fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
            fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center',
          }}>
            CUSTOM CARDS
          </h2>
          <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0, textAlign: 'center' }}>
            Add your own questions (optional). Max {maxCards} cards.
          </p>
          {cards.length > 0 && (
            <p style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.3)', margin: 0, letterSpacing: '0.08em' }}>
              {cards.length} / {maxCards} CARDS
            </p>
          )}
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
          {cards.map((c, i) => (
            <div key={i} className="stagger-item" style={{
              background: '#111113', border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: '12px', minHeight: '56px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px',
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'rgba(220,40,39,0.15)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Staatliches', sans-serif", fontSize: '14px', color: '#dc2827',
                }}>
                  {i + 1}
                </div>
                {editingIdx === i ? (
                  <input
                    ref={editRef}
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingIdx(null) }}
                    onBlur={commitEdit}
                    style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Inter', sans-serif", fontSize: '15px', color: '#fff', flex: 1 }}
                  />
                ) : (
                  <span
                    onClick={() => startEdit(i)}
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.8)', cursor: 'text', flex: 1, lineHeight: 1.4 }}
                  >
                    {c}
                  </span>
                )}
              </div>
              <button
                onClick={() => removeCard(i)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px', padding: '0 4px', display: 'flex', alignItems: 'center' }}
                aria-label="Remove card"
              >×</button>
            </div>
          ))}

          {canAdd && (
            <div
              style={{
                background: '#111113', border: '1px dashed rgba(255,255,255,0.1)',
                borderRadius: '12px', minHeight: '56px',
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'text',
              }}
              onClick={() => inputRef.current?.focus()}
            >
              <button
                onClick={e => { e.stopPropagation(); addCard() }}
                style={{
                  background: hasInput ? '#dc2827' : 'rgba(255,255,255,0.1)',
                  border: 'none', borderRadius: '8px',
                  width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0, color: '#fff',
                  fontSize: hasInput ? '14px' : '20px', fontWeight: 400, lineHeight: 1,
                  transition: 'background 0.15s',
                }}
                aria-label="Add card"
              >{hasInput ? '✓' : '+'}</button>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCard() }}
                placeholder="Type a question..."
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '15px', color: '#fff', flex: 1,
                }}
              />
              {hasInput && (
                <button onClick={e => { e.stopPropagation(); addCard() }} style={{ background: 'none', border: 'none', fontFamily: "'Staatliches', sans-serif", fontSize: '14px', color: '#dc2827', cursor: 'pointer', whiteSpace: 'nowrap', padding: 0, letterSpacing: '0.05em' }}>
                  ADD →
                </button>
              )}
            </div>
          )}
        </div>

        <div className="setup-buttons" style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '380px' }}>
          <button
            className="game-btn"
            onClick={onBack}
            style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', letterSpacing: '0.05em' }}
          >
            GO BACK
          </button>
          <button
            className="game-btn-primary"
            onClick={() => setTimeout(() => onNext(cards), 100)}
            style={{
              flex: 1, background: '#dc2827',
              border: 'none', borderRadius: '999px', padding: '12px 18px',
              fontFamily: "'Staatliches', sans-serif", fontSize: '16px',
              color: '#fff', cursor: 'pointer',
              textAlign: 'center', letterSpacing: '0.05em',
            }}
          >
            {cards.length > 0 ? 'NEXT' : 'SKIP'}
          </button>
        </div>
      </div>
    </div>
  )
}
