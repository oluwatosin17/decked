import { useState } from 'react'

const SOCIAL_TIKTOK    = 'https://www.figma.com/api/mcp/asset/52c80b9f-7611-4e1c-b0a1-b87cbde55222'
const SOCIAL_INSTAGRAM = 'https://www.figma.com/api/mcp/asset/2fb330d3-8103-4715-98c4-977825083eae'
const SOCIAL_WHATSAPP  = 'https://www.figma.com/api/mcp/asset/5e3391bc-c214-4266-8b20-9d5680742eef'

export interface GameMode {
  id: string
  label: string
  icon: string
}

export const LNT_MODES: GameMode[] = [
  { id: 'couples',            label: 'Couples',            icon: '/icons/couples.svg' },
  { id: 'friends',            label: 'Friends',            icon: '/icons/friends.svg' },
  { id: 'family',             label: 'Family',             icon: '/icons/family.svg' },
  { id: 'deep-conversations', label: 'Deep Conversations', icon: '/icons/deep-convo.svg' },
  { id: 'first-date',         label: 'First Date',         icon: '/icons/first-date.svg' },
  { id: 'party',              label: 'Party',              icon: '/icons/party.svg' },
  { id: 'nostalgia',          label: 'Nostalgia',          icon: '/icons/nostalgia.svg' },
  { id: 'random',             label: 'Random',             icon: '/icons/random.svg' },
]

export const DTC_MODES: GameMode[] = [
  { id: 'date-night',         label: 'Date Night',         icon: '/icons/couples.svg' },
  { id: 'friends-night',      label: 'Friends Night',      icon: '/icons/friends.svg' },
  { id: 'family',             label: 'Family',             icon: '/icons/family.svg' },
  { id: 'team',               label: 'Team',               icon: '/icons/team.svg' },
  { id: 'holiday-gathering',  label: 'Holiday Gathering',  icon: '/icons/holiday.svg' },
  { id: 'birthday',           label: 'Birthday',           icon: '/icons/party.svg' },
  { id: 'everyday',           label: 'Everyday',           icon: '/icons/nostalgia.svg' },
  { id: 'random-mix',         label: 'Random Mix',         icon: '/icons/random.svg' },
]

interface Props {
  modes: GameMode[]
  onBack: () => void
  onSelect: (mode: string) => void
}

export default function SelectGameMode({ modes, onBack, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [pressed,  setPressed]  = useState<string | null>(null)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Nav */}
      <nav style={{
        background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 60px', height: '80px', flexShrink: 0, position: 'relative', zIndex: 10,
      }}>
        <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '28px', color: '#fff', letterSpacing: '0.56px', fontWeight: 400 }}>DECKED</span>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {['Browse Games', 'How to Play', 'About'].map(label => (
            <button key={label} onClick={label === 'Browse Games' ? onBack : undefined}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontFamily: "'Anton SC', sans-serif", fontSize: '16px', fontWeight: 400, cursor: label === 'Browse Games' ? 'pointer' : 'default', padding: 0, transition: 'color 0.2s' }}
              onMouseOver={e => { if (label === 'Browse Games') (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
              onMouseOut={e => { if (label === 'Browse Games') (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)' }}
            >{label}</button>
          ))}
        </div>
      </nav>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', position: 'relative', zIndex: 2, gap: '40px' }}>
        <h1 style={{
          fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
          fontSize: '40px', color: '#fff', margin: 0, letterSpacing: '0.02em', textAlign: 'center',
          animation: 'screen-enter 0.45s var(--ease-out) both',
        }}>
          Select Game Mode
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', maxWidth: '560px' }}>
          {modes.map((mode, i) => {
            const isHovered = hovered === mode.id
            const isPressed = pressed  === mode.id
            const delay = 0.07 + Math.floor(i / 2) * 0.06
            return (
              <button
                key={mode.id}
                onMouseEnter={() => setHovered(mode.id)}
                onMouseLeave={() => { setHovered(null); setPressed(null) }}
                onMouseDown={() => setPressed(mode.id)}
                onMouseUp={() => setPressed(null)}
                onClick={() => setTimeout(() => onSelect(mode.id), 80)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: isHovered ? '#1e1e22' : '#111113',
                  border: '1px solid', borderColor: isHovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  borderRadius: '12px', padding: '12px', height: '56px', cursor: 'pointer',
                  transform: isPressed ? 'scale(0.97)' : isHovered ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: isHovered ? '0 6px 20px rgba(0,0,0,0.35)' : 'none',
                  transition: 'background 0.18s, border-color 0.18s, transform 0.15s, box-shadow 0.18s',
                  animation: `screen-enter 0.4s var(--ease-out) ${delay}s both`,
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '16px',
                  background: isHovered ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.18s',
                }}>
                  <img src={mode.icon} alt={mode.label} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                </div>
                <span style={{
                  fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '17px',
                  color: isHovered ? '#fff' : 'rgba(255,255,255,0.55)',
                  textAlign: 'left', lineHeight: 'normal', whiteSpace: 'nowrap',
                  transition: 'color 0.18s',
                }}>
                  {mode.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)', padding: '32px 60px', display: 'flex', flexDirection: 'column', gap: '40px', flexShrink: 0, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '420px' }}>
            <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '32px', color: '#fff' }}>DECKED</span>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>Pick a deck, pass the phone, and let the chaos begin. 10+ party card games, no app, no login, no excuses.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
    </div>
  )
}
