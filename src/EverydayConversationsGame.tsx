import { useState, useCallback } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import { useScaledCard } from './hooks/useCardScale'
import SharedDeckSize from './components/DeckSize'
import SharedCustomCards from './components/CustomCards'
import SharedGetReady from './components/GetReady'
import { GameNav, GameFooter } from './components/GameShell'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ─── Cloudinary assets ─── */
const CDN = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets'

type Theme = 'everyday' | 'deep-convo' | 'first-date' | 'nostalgia' | 'team' | 'party' | 'random'

const THEME_OPTIONS: { id: Theme; label: string; icon: string }[] = [
  { id: 'everyday',   label: 'Everyday',           icon: `${CDN}/everyday.svg` },
  { id: 'deep-convo', label: 'Deep Conversations', icon: '/icons/deep-convo.svg' },
  { id: 'first-date', label: 'First Date',         icon: '/icons/first-date.svg' },
  { id: 'nostalgia',  label: 'Nostalgia',          icon: '/icons/nostalgia.svg' },
  { id: 'team',       label: 'Team Building',      icon: '/icons/team.svg' },
  { id: 'party',      label: 'Party',              icon: '/icons/party.svg' },
  { id: 'random',     label: 'Random',             icon: '/icons/random.svg' },
]

const QUESTIONS: Record<Theme, string[]> = {
  everyday: [
    "What made today good or bad?",
    "What's something small that brightened your day recently?",
    "What's on your mind right now that you haven't said out loud?",
    "What's a routine you couldn't live without?",
    "What's the best part of your typical day?",
    "What's one thing you're looking forward to this week?",
    "How are you really doing — beyond 'fine'?",
    "What's something that frustrated you recently that you let go of?",
    "What's the last thing that made you genuinely laugh?",
    "What's a conversation you had today that stuck with you?",
    "If you could change one thing about your daily routine, what?",
    "What's something you do every day that most people wouldn't guess?",
    "What's a meal you had recently that was really satisfying?",
    "Who's someone you interacted with today that you're grateful for?",
    "What's a small win you had today?",
    "What's the last interesting thing you read or watched?",
    "What's something you're putting off that you know you should do?",
    "If you had an extra hour today, how would you spend it?",
    "What's a simple pleasure you enjoyed recently?",
    "What's one thing you learned today?",
  ],
  'deep-convo': [
    "What's a belief you hold that most people would disagree with?",
    "What's the most important lesson you've learned in the past year?",
    "If you could change one thing about yourself, what would it be?",
    "What does your ideal life look like in ten years?",
    "What are you most afraid of that you rarely admit?",
    "What does being truly honest with someone mean to you?",
    "What's a part of yourself that you've had to learn to accept?",
    "What's the most meaningful conversation you've ever had?",
    "What would you do if you knew you couldn't fail?",
    "What does it mean to live authentically?",
    "What's a mistake you're grateful you made?",
    "What do you think happens after we die?",
    "What's something you've outgrown that was once important to you?",
    "What's the hardest truth you've had to face?",
    "What do you think is the purpose of suffering?",
    "When do you feel most alive?",
    "What's a question you've been avoiding?",
    "What would you want said about you at your funeral?",
    "What's the bravest thing you've ever done?",
    "What does unconditional love look like?",
  ],
  'first-date': [
    "What's something that always makes you smile?",
    "What do you do for fun when nobody's watching?",
    "What's the most interesting thing about your job or what you study?",
    "What's a place that holds a special memory for you?",
    "What are you passionate about that you could talk about for hours?",
    "What's the best trip you've ever been on?",
    "What's your idea of a perfect weekend?",
    "What quality do you value most in a friend?",
    "What's a movie or show you never get tired of?",
    "What would you do with a completely free day?",
    "What's the most spontaneous thing you've ever done?",
    "What's a dream you've had since you were young?",
    "What's the most interesting fact about you?",
    "What are you currently obsessed with?",
    "What's a deal-breaker for you in any relationship?",
    "What makes you feel most comfortable around someone?",
    "What's the last thing that surprised you in a good way?",
    "If money wasn't a factor, what would you do with your life?",
    "What's a skill you wish you had?",
    "What's the best piece of advice you've ever received?",
  ],
  nostalgia: [
    "What's your earliest happy memory?",
    "What's a toy, game, or activity from your childhood you miss?",
    "What song takes you straight back to a specific time in your life?",
    "What's a family tradition from your childhood you wish you'd kept?",
    "What's the best birthday you can remember?",
    "What's a smell or taste that instantly brings back a memory?",
    "What's a movie or show you loved as a kid that still holds up?",
    "What's a moment from school you'll never forget?",
    "What's the most fun you had as a teenager?",
    "Who was your childhood best friend and what happened?",
    "What's a fashion trend you fully committed to that you regret?",
    "What's a piece of technology you miss from growing up?",
    "What was your favourite place to go as a child?",
    "What's a lesson from your childhood that stuck with you?",
    "What's the best summer holiday you had growing up?",
    "What were you known for in school?",
    "What's a food from your childhood that you still crave?",
    "What was the first album or song you ever loved?",
    "What's a game you played with friends that defined your childhood?",
    "What would your ten-year-old self think of who you are now?",
  ],
  team: [
    "What's one thing about you that would surprise your teammates?",
    "What's the most rewarding project you've worked on?",
    "What motivates you to do your best work?",
    "What's a professional skill you'd love to develop?",
    "How do you prefer to receive feedback?",
    "What's the best team you've ever been part of, and why?",
    "What's one thing that makes collaboration easier for you?",
    "What do you wish people understood about your working style?",
    "What's a work moment you're really proud of?",
    "If you could solve one problem at work, what would it be?",
    "What does a good work-life balance look like to you?",
    "What's the most important quality in a teammate?",
    "How do you handle disagreements in a professional setting?",
    "What's a strength you bring to every team?",
    "What's something you're currently learning or want to learn?",
    "What's the best career advice you've ever been given?",
    "When do you feel most creative?",
    "What's a misconception people have about your role?",
    "How do you celebrate wins, big or small?",
    "What would your ideal work environment look like?",
  ],
  party: [
    "What's the most embarrassing thing that's happened to you at a party?",
    "What's your go-to karaoke song?",
    "What's the worst pick-up line you've ever heard or used?",
    "What's the wildest thing you've done on a night out?",
    "If you could have any celebrity at this party, who would it be?",
    "What's your signature drink?",
    "What's the funniest thing that's happened to you recently?",
    "What's a dare you'd never do, no matter what?",
    "What's the most random talent you have?",
    "If your life had a theme song, what would it be?",
    "What's the best party you've ever been to?",
    "What's the most ridiculous outfit you've ever worn?",
    "If you had to eat one food for the rest of your life, what?",
    "What's the funniest rumour you've heard about yourself?",
    "What's a guilty pleasure you don't hide anymore?",
    "What's the latest you've ever stayed up and why?",
    "What's the best impulse purchase you've ever made?",
    "If you could be famous for one thing, what would it be?",
    "What's the most adventurous thing on your bucket list?",
    "What would your autobiography be called?",
  ],
  random: [],
}

function getQuestions(theme: Theme): string[] {
  if (theme === 'random') {
    const allThemes = Object.keys(QUESTIONS).filter(k => k !== 'random') as Theme[]
    const pool: string[] = []
    for (const t of allThemes) pool.push(...QUESTIONS[t])
    return shuffle([...new Set(pool)])
  }
  return shuffle([...QUESTIONS[theme]])
}

/* ─── Everyday Conversation Card ─── */
function ECCard({ question, flipped, onFlip }: { question: string; flipped: boolean; onFlip: () => void }) {
  const { wrapperStyle, cardStyle } = useScaledCard(320, 400)
  return (
    <div style={wrapperStyle}>
    <div
      onClick={!flipped ? onFlip : undefined}
      className="game-card" style={{ ...cardStyle, perspective: '1000px', cursor: flipped ? 'default' : 'pointer' }}
    >
      <div style={{
        width: '100%', height: '100%', position: 'relative',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        {/* Front */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          background: '#eae6e1', borderRadius: '13px', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(15,151,61,0.25)',
        }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, opacity: 0.55, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")", backgroundSize: '200px 200px', mixBlendMode: 'multiply' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', zIndex: 2 }}>
            <p style={{ fontFamily: "'Spicy Rice', cursive", fontSize: '36px', color: '#0f973d', textAlign: 'center', lineHeight: 1, margin: 0 }}>
              everyday<br />conversation
            </p>
            <p style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 300, fontSize: '11px', color: '#181b25', textAlign: 'center', margin: 0 }}>
              Questions to build genuine connection
            </p>
          </div>
        </div>
        {/* Back */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: '#eae6e1', borderRadius: '13px', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(15,151,61,0.25)',
        }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, opacity: 0.55, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")", backgroundSize: '200px 200px', mixBlendMode: 'multiply' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px', zIndex: 2 }}>
            <p style={{
              fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
              fontSize: '22px', color: '#0f973d',
              textAlign: 'center', textTransform: 'uppercase',
              lineHeight: 1.25, margin: 0,
            }}>
              {question}
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

/* ─── Theme Selection ─── */
function ThemeSelect({ onSelect }: { onSelect: (t: Theme) => void }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [pressed, setPressed] = useState<string | null>(null)

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '560px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center' }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>
          Pick a Vibe
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
          {THEME_OPTIONS.map((opt, i) => {
            const isHovered = hovered === opt.id
            const isPressed = pressed === opt.id
            const delay = 0.07 + Math.floor(i / 2) * 0.06
            return (
              <button key={opt.id}
                onMouseEnter={() => setHovered(opt.id)}
                onMouseLeave={() => { setHovered(null); setPressed(null) }}
                onMouseDown={() => setPressed(opt.id)}
                onMouseUp={() => setPressed(null)}
                onClick={() => setTimeout(() => onSelect(opt.id as Theme), 80)}
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
                  <img src={opt.icon} alt={opt.label} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                </div>
                <span style={{
                  fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '17px',
                  color: isHovered ? '#fff' : 'rgba(255,255,255,0.55)',
                  textAlign: 'left', lineHeight: 'normal', whiteSpace: 'nowrap',
                  transition: 'color 0.18s',
                }}>
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── Gameplay ─── */
function GamePlay({ players, cardIndex, totalCards, skipCount, question, onSkip, onNext, onPlayAgain, onBrowseGames }: {
  players: Player[]; cardIndex: number; totalCards: number; skipCount: number
  question: string; onSkip: () => void; onNext: () => void
  onPlayAgain: () => void; onBrowseGames: () => void
}) {
  const [flipped, setFlipped] = useState(false)
  const isDone = totalCards > 0 && cardIndex >= totalCards

  if (isDone) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '40px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
          <h2 className="done-heading" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '48px', color: '#fff', margin: 0, textTransform: 'uppercase' }}>You're Decked</h2>
          <p className="done-subtitle" style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            You played all {totalCards} everyday conversation cards
          </p>
        </div>
        <div style={{ background: '#18181b', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '20px 32px' }}>
          {[
            { count: totalCards, label: 'CARDS' },
            { count: skipCount, label: 'SKIPPED' },
            { count: Math.max(players.length, 1), label: 'PLAYERS' },
          ].map((stat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)', margin: '0 28px' }} />}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '40px', color: '#fff', lineHeight: 1 }}>{stat.count}</span>
                <span style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="done-card" style={{ width: '140px', height: '175px', background: '#eae6e1', borderRadius: '9px', overflow: 'hidden', position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontFamily: "'Spicy Rice', cursive", fontSize: '14px', color: '#0f973d', textAlign: 'center', lineHeight: 1, margin: 0 }}>everyday<br />conversation</p>
        </div>
        <div className="done-btns" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="game-btn" onClick={onBrowseGames} style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>BROWSE GAMES</button>
          <button className="game-btn-primary" onClick={onPlayAgain} style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>PLAY AGAIN</button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '40px', position: 'relative', zIndex: 2 }}>
      <ECCard question={question} flipped={flipped} onFlip={() => setFlipped(true)} />
      {!flipped ? (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Tap the card to flip it.</p>
      ) : (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="game-btn" onClick={() => { setFlipped(false); setTimeout(onSkip, 120) }}
            style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>
            SKIP FOR NOW
          </button>
          <button className="game-btn-primary" onClick={() => { setFlipped(false); setTimeout(onNext, 120) }}
            style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>
            NEXT
          </button>
        </div>
      )}
      {totalCards > 0 && (
        <div key={cardIndex} className="counter-in" style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>
          CARD {cardIndex + 1} OF {totalCards}
        </div>
      )}
    </div>
  )
}

/* ─── Root ─── */
type Step = 'theme' | 'playerSetup' | 'deckSize' | 'customCards' | 'getReady' | 'game'

export default function EverydayConversationsGame({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('theme')
  const [theme, setTheme] = useState<Theme>('everyday')
  const [players, setPlayers] = useState<Player[]>([])
  const [totalCards, setTotalCards] = useState(0)
  const [cardIndex, setCardIndex] = useState(0)
  const [playerIndex, setPlayerIndex] = useState(0)
  const [skipCount, setSkipCount] = useState(0)
  const [questions, setQuestions] = useState<string[]>([])
  const [customCards, setCustomCards] = useState<string[]>([])

  const currentPlayer = players.length > 0 ? players[playerIndex % players.length] : null
  const currentQuestion = questions[cardIndex % questions.length]

  const handleNext = useCallback(() => {
    const nextCard = cardIndex + 1
    const nextPlayer = players.length > 0 ? (playerIndex + 1) % players.length : 0
    setCardIndex(nextCard)
    setPlayerIndex(nextPlayer)
    if (totalCards > 0 && nextCard >= totalCards) setStep('game')
    else setStep('getReady')
  }, [cardIndex, playerIndex, players.length, totalCards])

  const handleSkip = useCallback(() => {
    setSkipCount(c => c + 1)
    handleNext()
  }, [handleNext])

  const goToGame = useCallback(() => setStep('game'), [])

  const startGame = (custom: string[]) => {
    setCustomCards(custom)
    const generated = getQuestions(theme)
    const allQuestions = shuffle([...custom, ...generated])
    const trimmed = totalCards > 0 ? allQuestions.slice(0, totalCards) : allQuestions
    setQuestions(trimmed)
    if (totalCards > trimmed.length) setTotalCards(trimmed.length)
    setCardIndex(0)
    setPlayerIndex(0)
    setStep('getReady')
  }

  const handlePlayAgain = useCallback(() => {
    const generated = getQuestions(theme)
    const allQuestions = shuffle([...customCards, ...generated])
    const trimmed = totalCards > 0 ? allQuestions.slice(0, totalCards) : allQuestions
    setQuestions(trimmed)
    setCardIndex(0)
    setPlayerIndex(0)
    setSkipCount(0)
    setStep('getReady')
  }, [theme, customCards, totalCards])

  return (
    <div className="game-fullscreen">
      <GameNav onBack={onClose} />

      {step === 'theme' && <ThemeSelect onSelect={t => { setTheme(t); setStep('playerSetup') }} />}

      {step === 'playerSetup' && (
        <SharedPlayerSetup
          initialPlayers={players}
          skipLabel="SKIP FOR NOW"
          onSkip={() => setStep('deckSize')}
          onNext={p => { setPlayers(p); setStep('deckSize') }}
        />
      )}

      {step === 'deckSize' && (
        <SharedDeckSize
          onBack={() => setStep('playerSetup')}
          onNext={n => { setTotalCards(n); setStep('customCards') }}
          nextLabel="NEXT"
        />
      )}

      {step === 'customCards' && (
        <SharedCustomCards
          maxCards={totalCards}
          onBack={() => setStep('deckSize')}
          onNext={startGame}
        />
      )}

      {step === 'getReady' && <SharedGetReady player={currentPlayer} onReady={goToGame} />}

      {step === 'game' && (
        <GamePlay
          players={players} cardIndex={cardIndex} totalCards={totalCards}
          skipCount={skipCount} question={currentQuestion}
          onSkip={handleSkip} onNext={handleNext}
          onPlayAgain={handlePlayAgain} onBrowseGames={onClose}
        />
      )}

      <GameFooter />
    </div>
  )
}
