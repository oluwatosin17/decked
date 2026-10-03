import { useEffect, useCallback } from 'react'
import type { Player } from './PlayerSetup'

interface Props {
  player: Player | null
  label?: string
  onReady: () => void
}

export default function GetReady({ player, label = 'Get Ready...', onReady }: Props) {
  const stableOnReady = useCallback(onReady, [onReady])

  useEffect(() => {
    const id = setTimeout(stableOnReady, 2400)
    return () => clearTimeout(id)
  }, [stableOnReady])

  return (
    <button className="screen-enter get-ready-screen" onClick={onReady} aria-label="Start game now" style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer', border: 0, background: 'transparent' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>
          {label}
        </h2>
        {player && (
          <div className="stagger-item" style={{ background: '#070708', border: '1px dashed rgba(255, 255, 255, 0.10)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', padding: '12px', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: player.color, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', whiteSpace: 'nowrap' }}>
              {player.name.toUpperCase()}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
          <span className="get-ready-dot" />
          <span className="get-ready-dot" />
          <span className="get-ready-dot" />
        </div>
      </div>
    </button>
  )
}
