import { useState, useCallback } from 'react'
import { GameNav, GameFooter } from './components/GameShell'
import { TwoTruthsBluffArtwork } from './TwoTruthsBluffGame'
import { MostLikelyArtwork } from './MostLikelyToGame'
import { ChooseYourSideArtwork } from './ChooseYourSideGame'

interface GameSuggestion {
  id: string
  label: string
  description: string
  thumbnail: string
}

const ALL_GAMES: GameSuggestion[] = [
  { id: 'truth-or-dare', label: 'Truth or Dare', description: 'Spicy truths & bold dares for couples', thumbnail: '/icons/qp-truth-or-dare.svg' },
  { id: 'spicy-starters', label: 'Spicy Opener', description: 'Flirty conversation cards that turn up the heat', thumbnail: '/assets/games/spicy-opener.png' },
  { id: 'late-night-talks', label: 'Late Night Talks', description: 'Questions that spark real conversations', thumbnail: '/icons/qp-late-night-talks.svg' },
  { id: 'dinner-table', label: 'Dinner Table', description: 'Meaningful dinner conversation starters', thumbnail: '/icons/qp-dinner-table.svg' },
  { id: 'you-laugh', label: 'Keep a Straight Face', description: 'Try not to laugh — last one standing wins', thumbnail: '/icons/qp-you-laugh.svg' },
  { id: 'never-have-i-ever', label: 'Never Have I Ever', description: 'Find out who has done what', thumbnail: '/icons/qp-never-have-i-ever.svg' },
  { id: 'charades', label: 'Charades', description: 'Act it out — no words allowed', thumbnail: '/icons/qp-charades.svg' },
  { id: 'lets-reconnect', label: 'Back to Us', description: 'Rebuild bonds with heartfelt questions', thumbnail: '/icons/qp-lets-reconnect.svg' },
  { id: 'everyday-conversations', label: 'Real Talk, Every Day', description: 'Questions to build genuine connection', thumbnail: '/icons/qp-everyday-conversations.svg' },
  { id: 'wnrs', label: 'Beyond Small Talk', description: 'Get to know each other for real', thumbnail: '/icons/qp-wnrs.svg' },
  { id: 'put-a-finger-down', label: 'Drop a Finger', description: 'Drop a finger if it’s true', thumbnail: '/icons/qp-put-a-finger-down.svg' },
  { id: 'take-a-sip', label: 'Take a Sip', description: 'Sip if the statement applies to you', thumbnail: '/icons/qp-take-a-sip.svg' },
  { id: 'sip-or-spill', label: 'Answer or Drink', description: 'Answer honestly or take a drink', thumbnail: '/assets/games/answer-or-drink.png' },
  { id: 'do-or-drink', label: 'Dare or Pour', description: 'Complete the dare or take a drink', thumbnail: '/icons/qp-do-or-drink.svg' },
  { id: 'icebreaker', label: 'Icebreaker', description: 'Fun questions to break the ice', thumbnail: '/icons/qp-icebreaker.svg' },
  { id: 'red-flag-green-flag', label: 'Dateable or Dealbreaker', description: 'Decide what is dateable, debatable, or a dealbreaker', thumbnail: '/assets/games/dateable-or-dealbreaker.png' },
  { id: 'two-truths-bluff', label: 'Two Truths and a Bluff', description: 'Spot the bluff hidden between two truths', thumbnail: '' },
  { id: 'most-likely-to', label: 'Who’s Most Likely To?', description: 'Vote for the person who fits best', thumbnail: '' },
  { id: 'choose-your-side', label: 'Choose Your Side', description: 'Pick a side and make your case', thumbnail: '' },
  { id: 'who-said-that', label: 'Who Said That?', description: 'Write anonymously, then guess who said what', thumbnail: '/assets/games/who-said-that.png' },
]

const RENAMED_THUMBNAILS: Record<string, { background: string; color: string }> = {
  'everyday-conversations': { background: '#f7c928', color: '#111111' },
  wnrs: { background: '#f4efe4', color: '#111111' },
  'lets-reconnect': { background: '#f5e9de', color: '#d22f49' },
  'put-a-finger-down': { background: '#111111', color: '#ed8251' },
  'sip-or-spill': { background: '#35152d', color: '#f7ecd5' },
  'you-laugh': { background: '#36a6bb', color: '#ffffff' },
  'do-or-drink': { background: '#d1ffd5', color: '#5228eb' },
}

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
  const [currentSuggestions, setCurrentSuggestions] = useState(() => pickRandom3())
  const [refreshKey, setRefreshKey] = useState(0)
  const [shufflePhase, setShufflePhase] = useState<'idle' | 'out' | 'in'>('idle')

  const handleShuffle = useCallback(() => {
    if (shufflePhase !== 'idle') return
    setShufflePhase('out')
    setTimeout(() => {
      setCurrentSuggestions(pickRandom3())
      setRefreshKey(k => k + 1)
      setShufflePhase('in')
      setTimeout(() => setShufflePhase('idle'), 500)
    }, 320)
  }, [shufflePhase])

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
          {currentSuggestions.map((game, i) => {
            const fanDirs = ['-50px', '60px', '-35px']
            const fanRots = ['-8deg', '10deg', '-5deg']
            const shuffleAnim = shufflePhase === 'out'
              ? `qp-shuffle-out 0.3s cubic-bezier(0.55,0,1,0.45) ${i * 50}ms both`
              : shufflePhase === 'in'
              ? `qp-shuffle-in 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 80}ms both`
              : `screen-enter 0.4s var(--ease-out) ${0.05 + i * 0.08}s both`

            return (
              <button
                key={`${game.id}-${refreshKey}`}
                onClick={() => onPlay(game.id)}
                className="game-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  background: '#070708', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px', padding: '14px 18px', cursor: 'pointer',
                  textAlign: 'left', width: '100%',
                  animation: shuffleAnim,
                  '--qp-fan': fanDirs[i] || '40px',
                  '--qp-rot': fanRots[i] || '6deg',
                } as React.CSSProperties}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '12px',
                  overflow: 'hidden', flexShrink: 0,
                  background: '#1a1a1e',
                }}>
                  {RENAMED_THUMBNAILS[game.id]
                    ? <div style={{
                        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '5px', boxSizing: 'border-box', textAlign: 'center',
                        background: RENAMED_THUMBNAILS[game.id].background,
                        color: RENAMED_THUMBNAILS[game.id].color,
                      }}>
                        <span className="font-anton" style={{ fontSize: '10px', lineHeight: 1, textTransform: 'uppercase' }}>{game.label}</span>
                      </div>
                    : game.id === 'two-truths-bluff'
                    ? <TwoTruthsBluffArtwork portrait />
                    : game.id === 'most-likely-to'
                    ? <MostLikelyArtwork compact />
                    : game.id === 'choose-your-side'
                    ? <ChooseYourSideArtwork compact />
                    : <img src={game.thumbnail} alt={game.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
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
            )
          })}
        </div>

        <button
          onClick={handleShuffle}
          className="game-btn"
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '999px', padding: '10px 24px',
            fontFamily: "'Staatliches', sans-serif", fontSize: '14px',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'transform 0.2s',
            transform: shufflePhase === 'out' ? 'rotate(180deg) scale(0.9)' : 'none',
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
