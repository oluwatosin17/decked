import { useState } from 'react'
import { GameNav, GameFooter } from './components/GameShell'

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

export const NHIE_MODES: GameMode[] = [
  { id: 'classic',      label: 'Classic',      icon: '/icons/nhie-classic.svg' },
  { id: 'spicy',        label: 'Spicy',        icon: '/icons/nhie-spicy.svg' },
  { id: 'confessions',  label: 'Confessions',  icon: '/icons/nhie-confessions.svg' },
  { id: 'drinking',     label: 'Drinking',     icon: '/icons/nhie-drinking.svg' },
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
    <div className="game-fullscreen">
      <GameNav onBack={onBack} />

      {/* Main */}
      <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', position: 'relative', zIndex: 2, gap: '40px' }}>
        <h1 className="setup-title" style={{
          fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
          fontSize: '40px', color: '#fff', margin: 0, letterSpacing: '0.02em', textAlign: 'center',
        }}>
          Select Game Mode
        </h1>

        <div className="mode-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', maxWidth: '560px' }}>
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
                className="mode-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: isHovered ? '#1e1e22' : '#111113',
                  border: '1px solid', borderColor: isHovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  borderRadius: '12px', padding: '12px', minHeight: '56px', cursor: 'pointer',
                  transform: isPressed ? 'scale(0.97)' : isHovered ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: isHovered ? '0 6px 20px rgba(0,0,0,0.35)' : 'none',
                  transition: 'background 0.18s, border-color 0.18s, transform 0.15s, box-shadow 0.18s',
                  animation: `screen-enter 0.4s var(--ease-out) ${delay}s both`,
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: isHovered ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.18s',
                }}>
                  <img src={mode.icon} alt={mode.label} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                </div>
                <span style={{
                  fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '17px',
                  color: isHovered ? '#fff' : 'rgba(255,255,255,0.55)',
                  textAlign: 'left', lineHeight: 'normal',
                  transition: 'color 0.18s',
                }}>
                  {mode.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <GameFooter />
    </div>
  )
}
