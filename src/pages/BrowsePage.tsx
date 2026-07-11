import { useState, type CSSProperties } from 'react'
import { BrowseCardGrid, type Category } from '../components/GameCardGrid'

/* ── Assets ── */
const SOCIAL_TIKTOK   = '/icons/social-tiktok.svg'
const SOCIAL_INSTAGRAM = '/icons/social-instagram.svg'
const SOCIAL_WHATSAPP = '/icons/social-whatsapp.svg'

/* Hand-authored (no hosting needed — can never 404) */
function PlayIcon({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={style}>
      <path d="M5.5 3.6c0-1 1.1-1.6 1.9-1.1l9 5.9c.8.5.8 1.7 0 2.2l-9 5.9c-.8.5-1.9-.1-1.9-1.1V3.6Z" fill="#fff" />
    </svg>
  )
}

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all',         label: 'All' },
  { id: 'icebreakers', label: 'Icebreakers' },
  { id: 'deep-talk',   label: 'Deep Talk' },
  { id: 'drinking',    label: 'Drinking' },
  { id: 'couples',     label: 'Couples' },
  { id: 'party-games', label: 'Party Games' },
]

interface Props {
  onHome: () => void
  onPlayTruthOrDare: () => void
  onPlaySpicyStarters: () => void
  onPlayLateNightTalks: () => void
  onPlayDinnerTable?: () => void
  onPlayYouLaugh?: () => void
  onPlayNeverHaveIEver?: () => void
  onPlayCharades?: () => void
  onPlayReconnect?: () => void
  onPlayEveryday?: () => void
  onPlayWNRS?: () => void
  onPlayFingerDown?: () => void
  onPlayTakeASip?: () => void
  onPlaySipOrSpill?: () => void
  onPlayDoOrDrink?: () => void
}

export default function BrowsePage({ onHome, onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks, onPlayDinnerTable, onPlayYouLaugh, onPlayNeverHaveIEver, onPlayCharades, onPlayReconnect, onPlayEveryday, onPlayWNRS, onPlayFingerDown, onPlayTakeASip, onPlaySipOrSpill, onPlayDoOrDrink }: Props) {
  const [active, setActive] = useState<Category>('all')

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>

      {/* ── Sticky nav ── */}
      <nav className="browse-nav" style={{
        background: 'rgba(12,12,14,0.92)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 60px', height: '64px', flexShrink: 0,
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button onClick={onHome} className="font-anton game-btn" style={{
          background: 'none', border: 'none', color: '#fff',
          fontSize: '28px', letterSpacing: '0.56px', cursor: 'pointer', padding: 0,
        }}>
          DECKED
        </button>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div className="browse-nav-links" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            {['Browse Games', 'How to Play', 'About'].map(label => (
              <span key={label} className="font-anton" style={{
                fontSize: '16px',
                color: label === 'Browse Games' ? '#fff' : 'rgba(255,255,255,0.4)',
                cursor: 'default',
              }}>
                {label}
              </span>
            ))}
          </div>

          <button className="game-btn-primary browse-play-btn" onClick={onPlayTruthOrDare} style={{
            background: '#dc2827', border: 'none', borderRadius: '999px',
            padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <PlayIcon style={{ width: '20px', height: '20px' }} />
            <span className="font-staatliches" style={{ fontSize: '16px', color: '#fff', whiteSpace: 'nowrap' }}>
              Play Now
            </span>
          </button>
        </div>
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .browse-nav { padding: 0 16px !important; height: 52px !important; }
          .browse-nav button:first-child { font-size: 20px !important; }
          .browse-play-btn { padding: 6px 12px !important; gap: 4px !important; }
          .browse-play-btn span { font-size: 12px !important; }
          .browse-play-btn svg { width: 14px !important; height: 14px !important; }
        }
      `}</style>

      <style>{`
        @media (max-width: 768px) {
          .browse-nav-links { display: none !important; }
          .browse-main { padding: 20px 16px 40px !important; }
          .browse-content { width: 100% !important; }
          .browse-category-pills { gap: 6px !important; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 4px; flex-wrap: nowrap !important; }
          .browse-category-pills::-webkit-scrollbar { display: none; }
          .browse-category-pills button { font-size: 14px !important; padding: 5px 10px !important; border-radius: 8px !important; }
        }
        @media (max-width: 480px) {
          .browse-main { padding: 16px 12px 32px !important; }
        }
      `}</style>

      {/* ── Main ── */}
      <main className="screen-enter browse-main" style={{ flex: 1, padding: '48px 60px 80px' }}>
        <div className="browse-content" style={{ width: '1320px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '36px' }}>

          {/* Category filter pills — matches Figma 764-33446 */}
          <div className="browse-category-pills" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {CATEGORIES.map(cat => {
              const isActive = active === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActive(cat.id)}
                  style={{
                    background: isActive ? '#18181b' : '#0e0e10',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '6px 12px',
                    fontFamily: "'Anton SC', sans-serif",
                    fontSize: '18px',
                    color: isActive ? '#ffffff' : '#999999',
                    cursor: 'pointer',
                    letterSpacing: 'normal',
                    lineHeight: 'normal',
                    whiteSpace: 'nowrap',
                    transition: 'background 0.15s, color 0.15s, transform 0.15s var(--ease-out)',
                  }}
                  onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = '#1a1a1d'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = '#0e0e10'; (e.currentTarget as HTMLButtonElement).style.color = '#999'; (e.currentTarget as HTMLButtonElement).style.transform = 'none' } }}
                  onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)' }}
                  onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = isActive ? 'none' : 'translateY(-1px)' }}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Card grid — exact same cards as "Pick your vibe", filtered by category */}
          <BrowseCardGrid
            filter={active}
            onPlayTruthOrDare={onPlayTruthOrDare}
            onPlaySpicyStarters={onPlaySpicyStarters}
            onPlayLateNightTalks={onPlayLateNightTalks}
            onPlayDinnerTable={onPlayDinnerTable}
            onPlayYouLaugh={onPlayYouLaugh}
            onPlayNeverHaveIEver={onPlayNeverHaveIEver}
            onPlayCharades={onPlayCharades}
            onPlayReconnect={onPlayReconnect}
            onPlayEveryday={onPlayEveryday}
            onPlayWNRS={onPlayWNRS}
            onPlayFingerDown={onPlayFingerDown}
            onPlayTakeASip={onPlayTakeASip}
            onPlaySipOrSpill={onPlaySipOrSpill}
            onPlayDoOrDrink={onPlayDoOrDrink}
          />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="home-footer" style={{ background: 'rgba(5,5,12,0.80)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', padding: '32px 60px', display: 'flex', flexDirection: 'column', gap: '40px', flexShrink: 0 }}>
        <div className="mobile-footer-top" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '420px' }}>
            <p className="font-anton" style={{ color: '#fff', fontSize: '32px', margin: 0 }}>DECKED</p>
            <p className="font-inter" style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
              Pick a deck, pass the phone, and let the chaos begin. 10+ party card games, no app, no login, no excuses.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={SOCIAL_TIKTOK}    alt="TikTok"    style={{ width: '20px', height: '20px', borderRadius: '8px', objectFit: 'contain' }} />
            <img src={SOCIAL_INSTAGRAM} alt="Instagram" style={{ width: '20px', height: '20px', borderRadius: '8px', objectFit: 'contain' }} />
            <img src={SOCIAL_WHATSAPP}  alt="WhatsApp"  style={{ width: '20px', height: '20px', borderRadius: '8px', objectFit: 'contain' }} />
          </div>
        </div>
        <div style={{ height: '1px', background: '#212326' }} />
        <div className="mobile-footer-bottom" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
          <p style={{ color: '#9ca3af', margin: 0 }}>© 2026 DECKED. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            {['Privacy', 'Terms', 'Cookie'].map(l => (
              <a key={l} href="#" style={{ color: '#fff', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
