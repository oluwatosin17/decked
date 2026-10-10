import { useState, useCallback, useEffect, useRef } from 'react'
import { GameNav, GameFooter } from './components/GameShell'
import { GameArtworkThumbnail } from './components/GameCardGrid'
import { track } from './analytics'
import { DiscoveryJourneyTracker } from './analytics/journey'
import type { MultiplayerGameId } from './multiplayer/types'

const quickPlayJourney = new DiscoveryJourneyTracker(track)

interface GameSuggestion {
  id: string
  artworkId: string
  label: string
  description: string
}

const ALL_GAMES: GameSuggestion[] = [
  { id: 'truth-or-dare', artworkId: 'truth-or-dare', label: 'Truth or Dare', description: 'Spicy truths & bold dares for couples' },
  { id: 'spicy-starters', artworkId: 'spicy-starters', label: 'Spicy Opener', description: 'Flirty conversation cards that turn up the heat' },
  { id: 'late-night-talks', artworkId: 'late-night-talks', label: 'Late Night Talks', description: 'Questions that spark real conversations' },
  { id: 'dinner-table', artworkId: 'dinner-table', label: 'Dinner Table', description: 'Meaningful dinner conversation starters' },
  { id: 'you-laugh', artworkId: 'you-laugh', label: 'Keep a Straight Face', description: 'Try not to laugh — last one standing wins' },
  { id: 'never-have-i-ever', artworkId: 'never-have-i-ever', label: 'Never Have I Ever', description: 'Find out who has done what' },
  { id: 'charades', artworkId: 'charades', label: 'Charades', description: 'Act it out — no words allowed' },
  { id: 'lets-reconnect', artworkId: 'reconnect', label: 'Back to Us', description: 'Rebuild bonds with heartfelt questions' },
  { id: 'everyday-conversations', artworkId: 'everyday-conversation', label: 'Real Talk, Every Day', description: 'Questions to build genuine connection' },
  { id: 'wnrs', artworkId: 'strangers', label: 'Beyond Small Talk', description: 'Get to know each other for real' },
  { id: 'put-a-finger-down', artworkId: 'finger-down', label: 'Drop a Finger', description: 'Drop a finger if it’s true' },
  { id: 'take-a-sip', artworkId: 'take-a-sip', label: 'Take a Sip', description: 'Sip if the statement applies to you' },
  { id: 'sip-or-spill', artworkId: 'sip-or-spill', label: 'Answer or Drink', description: 'Answer honestly or take a drink' },
  { id: 'do-or-drink', artworkId: 'do-or-drink', label: 'Dare or Pour', description: 'Complete the dare or take a drink' },
  { id: 'icebreaker', artworkId: 'icebreaker', label: 'Icebreaker', description: 'Fun questions to break the ice' },
  { id: 'red-flag-green-flag', artworkId: 'red-flag-green-flag', label: 'Dateable or Dealbreaker', description: 'Decide what is dateable, debatable, or a dealbreaker' },
  { id: 'two-truths-bluff', artworkId: 'two-truths-bluff', label: 'Two Truths and a Bluff', description: 'Spot the bluff hidden between two truths' },
  { id: 'most-likely-to', artworkId: 'most-likely-to', label: 'Who’s Most Likely To?', description: 'Vote for the person who fits best' },
  { id: 'choose-your-side', artworkId: 'choose-your-side', label: 'Choose Your Side', description: 'Pick a side and make your case' },
  { id: 'who-said-that', artworkId: 'who-said-that', label: 'Who Said That?', description: 'Write anonymously, then guess who said what' },
  { id: 'we-just-met', artworkId: 'we-just-met', label: 'We Just Met', description: 'Easy questions for a first date or a new connection' },
]

function shuffleGames(): GameSuggestion[] {
  const shuffled = [...ALL_GAMES]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
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
  onPlay: (gameId: string, context?: { recommendationSetId: string; position: number }) => void
}

export default function QuickPlay({ onBack, onPlay }: Props) {
  const [gameQueue, setGameQueue] = useState(shuffleGames)
  const [refreshKey, setRefreshKey] = useState(0)
  const [shufflePhase, setShufflePhase] = useState<'idle' | 'out' | 'in'>('idle')
  const currentSuggestions = gameQueue.slice(0, 3)
  const [recommendationSetId, setRecommendationSetId] = useState(() => crypto.randomUUID())
  const [shuffleNumber, setShuffleNumber] = useState(0)
  const recommendedGameIds = currentSuggestions.map(game => game.artworkId as MultiplayerGameId)
  const initialSetId = useRef(recommendationSetId)

  useEffect(() => {
    if (recommendationSetId === initialSetId.current) quickPlayJourney.quickPlayViewed(recommendationSetId, recommendedGameIds)
    else quickPlayJourney.quickPlayShuffled(recommendationSetId, recommendedGameIds, shuffleNumber)
  }, [recommendationSetId, recommendedGameIds, shuffleNumber])

  const handleShuffle = useCallback(() => {
    if (shufflePhase !== 'idle') return
    setShufflePhase('out')
    setTimeout(() => {
      setGameQueue(current => {
        const unseen = current.slice(3)
        if (unseen.length >= 3) return unseen
        const previousIds = new Set(current.slice(0, 3).map(game => game.id))
        const nextDeck = shuffleGames().filter(game => !previousIds.has(game.id))
        return [...unseen, ...nextDeck]
      })
      setRefreshKey(k => k + 1)
      const nextSetId = crypto.randomUUID()
      setRecommendationSetId(nextSetId)
      setShuffleNumber(value => value + 1)
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
                onClick={() => onPlay(game.id, { recommendationSetId, position: i + 1 })}
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
                  <GameArtworkThumbnail gameId={game.artworkId} />
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
