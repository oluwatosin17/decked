import { useState, useMemo } from 'react'
import { GameNav, GameFooter } from './components/GameShell'

interface GameSuggestion {
  id: string
  label: string
  description: string
  thumbnail: string
}

const ALL_GAMES: GameSuggestion[] = [
  { id: 'truth-or-dare', label: 'Truth or Dare', description: 'Spicy truths & bold dares for couples', thumbnail: '/icons/truth-or-dare-mobile.svg' },
  { id: 'spicy-starters', label: 'Spicy Starters', description: 'Deep conversation cards to share', thumbnail: '/icons/spicy-starters-mobile.svg' },
  { id: 'late-night-talks', label: 'Late Night Talks', description: 'Questions that spark real conversations', thumbnail: '/icons/late-night-talks-mobile.svg' },
  { id: 'dinner-table', label: 'Dinner Table', description: 'Meaningful dinner conversation starters', thumbnail: '/icons/dinner-conversation-mobile.svg' },
  { id: 'you-laugh', label: "You Laugh You're Out", description: 'Try not to laugh — last one standing wins', thumbnail: '/icons/you-laugh-you-are-out-mobile.svg' },
  { id: 'never-have-i-ever', label: 'Never Have I Ever', description: 'Find out who has done what', thumbnail: '/icons/never-have-i-ever-mobile.svg' },
  { id: 'charades', label: 'Charades', description: 'Act it out — no words allowed', thumbnail: '/icons/charades-mobile.svg' },
  { id: 'lets-reconnect', label: "Let's Reconnect", description: 'Rebuild bonds with heartfelt questions', thumbnail: '/icons/reconnect-mobile.svg' },
  { id: 'everyday-conversations', label: 'Everyday Conversations', description: 'Questions to build genuine connection', thumbnail: '/icons/everyday-conversations-mobile.svg' },
  { id: 'wnrs', label: "We're Not Really Strangers", description: 'Get to know each other for real', thumbnail: '/icons/we-are-not-really-strangers-mobile.svg' },
  { id: 'put-a-finger-down', label: 'Put a Finger Down', description: 'Who has the most fingers down?', thumbnail: '/icons/put-a-finger-down-mobile.svg' },
  { id: 'take-a-sip', label: 'Take a Sip', description: 'Sip if the statement applies to you', thumbnail: '/icons/take-a-sip-mobile.svg' },
  { id: 'sip-or-spill', label: 'Sip or Spill', description: 'Answer honestly or take a drink', thumbnail: '/icons/sip-and-spill-mobile.svg' },
  { id: 'do-or-drink', label: 'Do or Drink', description: 'Complete the dare or take a drink', thumbnail: '/icons/do-or-drink-mobile.svg' },
]

function pickRandom3(): GameSuggestion[] {
  const shuffled = [...ALL_GAMES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

function ShuffleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M16 3h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 16v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 15l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 4l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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

      <div style={{
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
                borderRadius: '16px', padding: '14px 18px', cursor: 'pointer',
                textAlign: 'left', width: '100%',
                animation: `screen-enter 0.4s var(--ease-out) ${0.05 + i * 0.08}s both`,
              }}
            >
              <div style={{
                width: '56px', height: '56px', borderRadius: '12px',
                overflow: 'hidden', flexShrink: 0,
                background: '#1a1a1e',
              }}>
                <img
                  src={game.thumbnail}
                  alt={game.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
                  fontSize: '17px', color: '#fff', margin: 0, letterSpacing: '0.02em',
                }}>
                  {game.label}
                </p>
                <p style={{
                  fontFamily: "'Inter', sans-serif", fontSize: '12px',
                  color: 'rgba(255,255,255,0.4)', margin: '3px 0 0', lineHeight: 1.3,
                }}>
                  {game.description}
                </p>
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
            display: 'flex', alignItems: 'center', gap: '8px',
          }}
        >
          <ShuffleIcon />
          SHUFFLE
        </button>
      </div>

      <GameFooter />
    </div>
  )
}
