import { useState, useMemo } from 'react'
import { GameNav, GameFooter } from './components/GameShell'

interface GameSuggestion {
  id: string
  label: string
  description: string
  color: string
  icon: string
}

const ALL_GAMES: GameSuggestion[] = [
  { id: 'truth-or-dare', label: 'Truth or Dare', description: 'Spicy truths & bold dares for couples', color: '#dc2827', icon: '💕' },
  { id: 'spicy-starters', label: 'Spicy Starters', description: 'Deep conversation cards to share', color: '#b70012', icon: '🌶️' },
  { id: 'late-night-talks', label: 'Late Night Talks', description: 'Questions that spark real conversations', color: '#ff440e', icon: '🌙' },
  { id: 'dinner-table', label: 'Dinner Table', description: 'Meaningful dinner conversation starters', color: '#6b5b4f', icon: '🍽️' },
  { id: 'you-laugh', label: "You Laugh You're Out", description: 'Try not to laugh — last one standing wins', color: '#36a6bb', icon: '😂' },
  { id: 'never-have-i-ever', label: 'Never Have I Ever', description: 'Find out who has done what', color: '#bb33ff', icon: '🙈' },
  { id: 'charades', label: 'Charades', description: 'Act it out — no words allowed', color: '#ed3844', icon: '🎭' },
  { id: 'lets-reconnect', label: "Let's Reconnect", description: 'Rebuild bonds with heartfelt questions', color: '#d22f49', icon: '💞' },
  { id: 'everyday-conversations', label: 'Everyday Conversations', description: 'Questions to build genuine connection', color: '#0f973d', icon: '💬' },
  { id: 'wnrs', label: "We're Not Really Strangers", description: 'Get to know each other for real', color: '#e8423f', icon: '👀' },
  { id: 'put-a-finger-down', label: 'Put a Finger Down', description: 'Who has the most fingers down?', color: '#ed8251', icon: '🖐️' },
  { id: 'take-a-sip', label: 'Take a Sip', description: 'Sip if the statement applies to you', color: '#eb5e28', icon: '🥤' },
  { id: 'sip-or-spill', label: 'Sip or Spill', description: 'Answer honestly or take a drink', color: '#fb3757', icon: '🍷' },
  { id: 'do-or-drink', label: 'Do or Drink', description: 'Complete the dare or take a drink', color: '#5228eb', icon: '🎯' },
]

function pickRandom3(): GameSuggestion[] {
  const shuffled = [...ALL_GAMES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

interface Props {
  onBack: () => void
  onPlay: (gameId: string) => void
}

export default function QuickPlay({ onBack, onPlay }: Props) {
  const [suggestions] = useState(() => pickRandom3())
  const [refreshKey, setRefreshKey] = useState(0)
  const currentSuggestions = useMemo(() => refreshKey === 0 ? suggestions : pickRandom3(), [refreshKey])

  return (
    <div className="game-fullscreen">
      <GameNav onBack={onBack} />

      <div className="screen-enter" style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '28px', padding: '40px 20px',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{
            fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
            fontSize: '36px', color: '#fff', margin: 0, letterSpacing: '0.02em',
          }}>
            QUICK PLAY
          </h1>
          <p style={{
            fontFamily: "'Satoshi', sans-serif", fontSize: '15px',
            color: 'rgba(255,255,255,0.5)', margin: 0,
          }}>
            Pick one to jump right in
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '440px' }}>
          {currentSuggestions.map((game, i) => (
            <button
              key={`${game.id}-${refreshKey}`}
              onClick={() => onPlay(game.id)}
              className="game-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                background: '#111113', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px', padding: '18px 20px', cursor: 'pointer',
                textAlign: 'left', width: '100%',
                animation: `screen-enter 0.4s var(--ease-out) ${0.05 + i * 0.08}s both`,
              }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: game.color, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px',
              }}>
                {game.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
                  fontSize: '18px', color: '#fff', margin: 0, letterSpacing: '0.02em',
                }}>
                  {game.label}
                </p>
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontSize: '13px',
                  color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', lineHeight: 1.3,
                }}>
                  {game.description}
                </p>
              </div>
              <div style={{
                fontFamily: "'Staatliches', sans-serif", fontSize: '12px',
                color: game.color, letterSpacing: '0.08em',
                padding: '4px 10px', borderRadius: '999px',
                border: `1px solid ${game.color}40`,
                flexShrink: 0,
              }}>
                PLAY
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="game-btn"
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '999px', padding: '10px 24px',
            fontFamily: "'Staatliches', sans-serif", fontSize: '14px',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            letterSpacing: '0.06em',
          }}
        >
          🔄 SHUFFLE
        </button>
      </div>

      <GameFooter />
    </div>
  )
}
