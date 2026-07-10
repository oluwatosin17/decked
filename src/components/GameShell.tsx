const SOCIAL_TIKTOK    = '/icons/social-tiktok.svg'
const SOCIAL_INSTAGRAM = '/icons/social-instagram.svg'
const SOCIAL_WHATSAPP  = '/icons/social-whatsapp.svg'

export function GameNav({ onBack }: { onBack: () => void }) {
  return (
    <>
      <nav className="game-nav-bar" style={{
        background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 60px', height: '80px', flexShrink: 0, position: 'relative', zIndex: 10,
      }}>
        <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '28px', color: '#fff', letterSpacing: '0.56px', fontWeight: 400 }}>DECKED</span>

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

        {/* Mobile back button — only visible on small screens */}
        <button
          className="game-nav-mobile-btn"
          onClick={onBack}
          aria-label="Back to games"
          style={{
            display: 'none', background: 'rgba(255,255,255,0.08)', border: 'none',
            color: '#fff', fontFamily: "'Anton SC', sans-serif", fontSize: '14px',
            cursor: 'pointer', padding: '8px 16px', letterSpacing: '0.04em',
            borderRadius: '999px',
          }}
        >
          ← GAMES
        </button>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .game-nav-desktop { display: none !important; }
          .game-nav-mobile-btn { display: block !important; }
          .game-nav-bar { padding: 0 16px !important; height: 52px !important; }
          .game-nav-bar span { font-size: 20px !important; }
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
      background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)',
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
