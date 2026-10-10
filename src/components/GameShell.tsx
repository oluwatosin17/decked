import { useEffect, useState } from 'react'
import { passAndPlayTracker } from '../analytics/passAndPlay'
import { useMultiplayerSession } from '../multiplayer/SessionStateContext'

const SOCIAL_TIKTOK    = '/icons/social-tiktok.svg'
const SOCIAL_INSTAGRAM = '/icons/social-instagram.svg'
const SOCIAL_WHATSAPP  = '/icons/social-whatsapp.svg'

export function GameNav({ onBack, gameId }: { onBack: () => void; gameId?: string }) {
  const [showExitChoice, setShowExitChoice] = useState(false)
  const multiplayer = useMultiplayerSession()

  const leaveGame = () => {
    if (gameId && !multiplayer) passAndPlayTracker.abandon(gameId)
    onBack()
  }

  useEffect(() => {
    if (!showExitChoice) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowExitChoice(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [showExitChoice])

  const resetGame = () => {
    if (!gameId) {
      onBack()
      return
    }
    const prefix = `decked:game-session:v1:${gameId}:`
    try {
      Object.keys(window.localStorage)
        .filter(key => key.startsWith(prefix))
        .forEach(key => window.localStorage.removeItem(key))
      if (gameId === 'charades') window.localStorage.removeItem('charades-game-state-v3')
    } catch { /* Storage may be unavailable. */ }
    setShowExitChoice(false)
    leaveGame()
  }

  return (
    <>
      <nav className="game-nav-bar" style={{
        background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 60px', height: '80px', flexShrink: 0, position: 'relative', zIndex: 10,
      }}>
        <button
          type="button"
          onClick={() => gameId ? setShowExitChoice(true) : onBack()}
          aria-label="Open game options"
          style={{ background: 'none', border: 0, padding: 0, fontFamily: "'Anton SC', sans-serif", fontSize: '28px', color: '#fff', letterSpacing: '0.56px', fontWeight: 400, cursor: 'pointer' }}
        >DECKED</button>

        {/* Desktop nav links */}
        <div className="game-nav-desktop" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {['Browse Games', 'Guides', 'About'].map(label => (
            <button key={label} onClick={label === 'Browse Games' ? leaveGame : undefined}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontFamily: "'Anton SC', sans-serif", fontSize: '16px', fontWeight: 400, cursor: label === 'Browse Games' ? 'pointer' : 'default', padding: 0, transition: 'color 0.2s' }}
              onMouseOver={e => { if (label === 'Browse Games') (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
              onMouseOut={e => { if (label === 'Browse Games') (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)' }}
            >{label}</button>
          ))}
        </div>

        {/* Mobile back button — only visible on small screens */}
        <button
          className="game-nav-mobile-btn"
          onClick={leaveGame}
          aria-label="Back to games"
          style={{
            display: 'none', background: 'rgba(255,255,255,0.08)', border: 'none',
            color: '#fff', fontFamily: "'Anton SC', sans-serif", fontSize: '12px',
            cursor: 'pointer', padding: '4px 10px', letterSpacing: '0.04em',
            height: '30px', lineHeight: 1,
            borderRadius: '999px',
          }}
        >
          ← GAMES
        </button>
      </nav>

      {showExitChoice && (
        <div
          role="presentation"
          onClick={() => setShowExitChoice(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-exit-title"
            onClick={event => event.stopPropagation()}
            style={{ width: 'min(100%, 390px)', boxSizing: 'border-box', background: '#070708', border: '1px dashed rgba(255, 255, 255, 0.10)', borderRadius: '20px', padding: '28px 24px 24px', boxShadow: '0 24px 80px rgba(0,0,0,0.55)', textAlign: 'center' }}
          >
            <h2 id="game-exit-title" style={{ margin: 0, color: '#fff', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '28px', textTransform: 'uppercase' }}>Leave this game?</h2>
            <p style={{ margin: '10px 0 24px', color: 'rgba(255,255,255,0.58)', fontFamily: "'Satoshi', sans-serif", fontSize: '15px', lineHeight: 1.45 }}>Continue where you stopped, or reset this game and return to the beginning.</p>
            <div className="game-exit-actions" style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowExitChoice(false)}
                style={{ flex: 1, minHeight: '44px', border: '1px solid #fff', borderRadius: '999px', background: 'transparent', color: '#fff', fontFamily: "'Staatliches', sans-serif", fontSize: '15px', cursor: 'pointer' }}
              >CONTINUE GAME</button>
              <button
                type="button"
                onClick={resetGame}
                style={{ flex: 1, minHeight: '44px', border: 0, borderRadius: '999px', background: '#dc2827', color: '#fff', fontFamily: "'Staatliches', sans-serif", fontSize: '15px', cursor: 'pointer' }}
              >RESET GAME</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .game-nav-desktop { display: none !important; }
          .game-nav-mobile-btn {
            display: block !important;
            width: auto !important;
            min-width: 0 !important;
            min-height: 30px !important;
            height: 30px !important;
            padding: 4px 10px !important;
            font-size: 12px !important;
          }
          .game-nav-bar { padding: 0 16px !important; height: 52px !important; }
          .game-nav-bar > button:first-child { font-size: 20px !important; }
          .game-exit-actions { flex-direction: column; }
        }
      `}</style>
    </>
  )
}

/**
 * GameFooter — hidden on mobile during gameplay for immersive experience.
 * Only shown on desktop.
 */
export function GameFooter() {
  return (
    <footer className="game-footer" style={{
      background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
      padding: '32px 60px', display: 'flex', flexDirection: 'column', gap: '40px', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '420px', minWidth: '200px' }}>
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '32px', color: '#fff' }}>DECKED</span>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>Pick a deck, pass the phone, and let the chaos begin. 10+ party card games, no app, no login, no excuses.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {[SOCIAL_TIKTOK, SOCIAL_INSTAGRAM, SOCIAL_WHATSAPP].map((src, i) => (
            <img key={i} src={src} alt="" style={{ width: '20px', height: '20px', borderRadius: '8px', objectFit: 'contain' }} />
          ))}
        </div>
      </div>
      <div style={{ height: '1px', background: '#212326', width: '100%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#9ca3af' }}>© 2026 DECKED. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Privacy', 'Terms', 'Cookie'].map(l => (
            <button key={l} style={{ background: 'none', border: 'none', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '13px', cursor: 'pointer', padding: 0 }}>{l}</button>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .game-footer { display: none !important; }
        }
      `}</style>
    </footer>
  )
}
export function PlayAgainLabel() {
  const multiplayer = useMultiplayerSession()
  if (!multiplayer) return <>PLAY AGAIN</>
  if (multiplayer.currentUserId !== multiplayer.hostUserId) {
    return <>{multiplayer.requestedRematch ? 'REMATCH REQUESTED' : 'REQUEST REMATCH'}</>
  }
  const count = multiplayer.rematchRequestCount ?? 0
  return <>{count > 0 ? `PLAY AGAIN · ${count} REQUEST${count === 1 ? '' : 'S'}` : 'PLAY AGAIN'}</>
}
