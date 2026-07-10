import { useState, useRef } from 'react'

interface Props {
  onBack: () => void
  onNext: (n: number) => void
  nextLabel?: string
}

export default function DeckSize({ onBack, onNext, nextLabel = 'START THE GAME' }: Props) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const parsed = parseInt(value, 10)
  const valid = !isNaN(parsed) && parsed > 0 && parsed <= 200

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 'clamp(20px, 4vw, 40px)' }}>
      <div style={{ width: '100%', maxWidth: '500px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 'clamp(24px, 4vw, 40px)', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%' }}>
          <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>DECK SIZE</h2>
          <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>How many cards do you want to play?</p>
          <div
            style={{ background: '#111113', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', width: '100%', marginTop: '16px', boxSizing: 'border-box', cursor: 'text' }}
            onClick={() => inputRef.current?.focus()}
          >
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px' }}>#</span>
            </div>
            <input
              ref={inputRef}
              type="number" min={1} max={200}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Enter number"
              style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', flex: 1 }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '292px' }}>
          <button onClick={onBack} className="game-btn" style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', cursor: 'pointer', textAlign: 'center', letterSpacing: '0.05em' }}>
            GO BACK
          </button>
          <button
            className={valid ? 'game-btn-primary' : ''}
            onClick={() => valid && setTimeout(() => onNext(parsed), 100)}
            style={{ flex: 1, background: valid ? '#dc2827' : '#333', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: valid ? '#fff' : '#666', cursor: valid ? 'pointer' : 'not-allowed', textAlign: 'center', letterSpacing: '0.05em', transition: 'background 0.2s' }}
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
