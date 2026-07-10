import { useState } from 'react'

const SOCIAL_TIKTOK    = '/icons/social-tiktok.svg'
const SOCIAL_INSTAGRAM = '/icons/social-instagram.svg'
const SOCIAL_WHATSAPP  = '/icons/social-whatsapp.svg'

export function GameNav({ onBack }: { onBack: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav style={{
      background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(16px, 4vw, 60px)', height: '64px', flexShrink: 0, position: 'relative', zIndex: 10,
    }}>
      <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: 'clamp(22px, 3vw, 28px)', color: '#fff', letterSpacing: '0.56px', fontWeight: 400 }}>DECKED</span>

      {/* Desktop nav links */}
      <div className="game-nav-desktop" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        {['Browse Games', 'How to Play', 'About'].map(label => (
          <button key={label} onClick={label === 'Browse Games' ? onBack : undefined}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontFamily: "'Anton SC', sans-serif", fontSize: '16px', fontWeight: 400, cursor: label === 'Browse Games' ? 'pointer' : 'default', padding: 0, transition: 'color 0.2s' }}
            onMouseOver={e => { if (label === 'Browse Games') (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
            onMouseOut={e => { if (label === 'Browse Games') (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)' }}
          >{label}</button>
        ))}
      </div>

      {/* Mobile back button */}
      <button
        className="game-nav-mobile-back"
        onClick={onBack}
        style={{
          display: 'none', background: 'none', border: 'none',
          color: '#fff', fontFamily: "'Anton SC', sans-serif", fontSize: '14px',
          cursor: 'pointer', padding: '8px 12px', letterSpacing: '0.04em',
        }}
      >
        ← BACK
      </button>

      {/* Mobile menu toggle */}
      <button
        className="game-nav-mobile-menu"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: 'none', background: 'none', border: 'none',
          color: '#fff', fontSize: '24px', cursor: 'pointer', padding: '4px',
          lineHeight: 1,
        }}
        aria-label="Menu"
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          position: 'absolute', top: '64px', left: 0, right: 0,
          background: 'rgba(5,5,12,0.95)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', padding: '12px 16px', gap: '4px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          animation: 'screen-enter-fast 0.2s var(--ease-out) both',
        }}>
          {['Browse Games', 'How to Play', 'About'].map(label => (
            <button key={label}
              onClick={() => { setMenuOpen(false); if (label === 'Browse Games') onBack() }}
              style={{
                background: 'none', border: 'none', padding: '12px 0',
                fontFamily: "'Anton SC', sans-serif", fontSize: '16px',
                color: label === 'Browse Games' ? '#fff' : 'rgba(255,255,255,0.4)',
                textAlign: 'left', cursor: label === 'Browse Games' ? 'pointer' : 'default',
              }}
            >{label}</button>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .game-nav-desktop { display: none !important; }
          .game-nav-mobile-back { display: block !important; }
          .game-nav-mobile-menu { display: block !important; }
        }
        @media (min-width: 641px) {
          .game-nav-mobile-back { display: none !important; }
          .game-nav-mobile-menu { display: none !important; }
        }
      `}</style>
    </nav>
  )
}

export function GameFooter() {
  return (
    <footer style={{
      background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)',
      padding: 'clamp(20px, 3vw, 32px) clamp(16px, 4vw, 60px)',
      display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 3vw, 40px)', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '420px', minWidth: '200px' }}>
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: 'clamp(24px, 3vw, 32px)', color: '#fff' }}>DECKED</span>
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
    </footer>
  )
}
