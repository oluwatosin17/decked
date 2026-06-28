import { useState } from 'react'
import { BrowseCardGrid, type Category } from '../components/GameCardGrid'

/* ── Assets ── */
const PLAY_ICON       = 'https://www.figma.com/api/mcp/asset/08c7add6-bff9-40bd-bd8a-9c08a58a6b3e'
const SOCIAL_TIKTOK   = 'https://www.figma.com/api/mcp/asset/95bd2c19-cbff-47df-888f-c2dcd17eb88c'
const SOCIAL_INSTAGRAM = 'https://www.figma.com/api/mcp/asset/48f45e3e-baf4-48c6-8fd2-e665f8a64015'
const SOCIAL_WHATSAPP = 'https://www.figma.com/api/mcp/asset/94019f0b-e964-4c74-9a75-a02630ef9f90'

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
}

export default function BrowsePage({ onHome, onPlayTruthOrDare, onPlaySpicyStarters }: Props) {
  const [active, setActive] = useState<Category>('all')

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>

      {/* ── Sticky nav ── */}
      <nav style={{
        background: 'rgba(12,12,14,0.92)', backdropFilter: 'blur(8px)',
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
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
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

          <button className="game-btn-primary" onClick={onPlayTruthOrDare} style={{
            background: '#dc2827', border: 'none', borderRadius: '999px',
            padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <img src={PLAY_ICON} alt="" style={{ width: '20px', height: '20px' }} />
            <span className="font-staatliches" style={{ fontSize: '16px', color: '#fff', whiteSpace: 'nowrap' }}>
              Play Now
            </span>
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="screen-enter" style={{ flex: 1, padding: '48px 60px 80px' }}>
        <div style={{ width: '1320px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '36px' }}>

          {/* Category filter pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat, i) => {
              const isActive = active === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActive(cat.id)}
                  style={{
                    border: `1px solid ${isActive ? '#fff' : 'rgba(255,255,255,0.2)'}`,
                    background: isActive ? '#fff' : 'transparent',
                    borderRadius: '999px',
                    padding: '9px 22px',
                    fontFamily: "'Anton SC', sans-serif",
                    fontSize: '14px',
                    color: isActive ? '#000' : '#fff',
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                    transition: 'background 0.18s, border-color 0.18s, color 0.18s, transform 0.18s var(--ease-out), box-shadow 0.18s',
                    animationDelay: `${i * 40}ms`,
                    animation: 'browse-card-enter 0.4s var(--ease-out) both',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none' } }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)' }}
                  onMouseUp={e => { e.currentTarget.style.transform = isActive ? 'none' : 'translateY(-1px)' }}
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
          />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: 'rgba(5,5,12,0.80)', backdropFilter: 'blur(4px)', padding: '32px 60px', display: 'flex', flexDirection: 'column', gap: '40px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
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
