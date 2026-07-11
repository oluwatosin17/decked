import { useState, useRef, useEffect, useCallback } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import { useScaledCard } from './hooks/useCardScale'
import { GameNav, GameFooter } from './components/GameShell'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ─── Assets (permanently hosted on Cloudinary) ─── */
const DTC_BOW = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/dtc-bow.svg'

const SOCIAL_TIKTOK    = '/icons/social-tiktok.svg'
const SOCIAL_INSTAGRAM = '/icons/social-instagram.svg'
const SOCIAL_WHATSAPP  = '/icons/social-whatsapp.svg'

/* ─── Questions by mode ─── */
const QUESTIONS_BY_MODE: Record<string, string[]> = {
  'date-night': [
    "What's your favourite memory from our first few dates?",
    "What's something I do that always makes you smile?",
    "If you could relive one moment together, which would it be?",
    "What does your ideal date night look like?",
    "What's something you've been meaning to tell me?",
    "What's the most romantic thing you've ever experienced?",
    "What made you fall for me?",
    "What's a dream you'd love us to chase together?",
    "What's one thing about me that still surprises you?",
    "What's a trip you'd love us to take?",
    "What's the best meal we've ever shared?",
    "What does love feel like to you?",
    "What makes you feel most connected to me?",
    "What's something you appreciate about me that I might not know?",
    "If we could do anything right now, no limits, what would it be?",
  ],
  'friends-night': [
    "What's your go-to comfort food after a long day?",
    "What's the funniest thing that's happened to you this week?",
    "If you could have dinner with any person alive, who?",
    "What's a weird food combination you secretly love?",
    "What's the best meal you've ever had?",
    "What's a hobby you'd love to try together?",
    "What's the most adventurous thing you've ever eaten?",
    "If we opened a restaurant together, what kind would it be?",
    "What's a recipe you swear by?",
    "What's the worst thing you've ever cooked?",
    "What's a childhood snack you still crave?",
    "If this were your last meal, what would be on the table?",
    "What food reminds you of home?",
    "What's the most interesting cuisine you've tried?",
    "What's the best restaurant you've ever been to?",
  ],
  family: [
    "What's a family recipe that means a lot to you?",
    "What's your earliest happy memory around the dinner table?",
    "What's a tradition you'd love to start or bring back?",
    "What does home-cooked food mean to you?",
    "What's the funniest thing that's happened at a family gathering?",
    "If you could cook for anyone, living or dead, who?",
    "What's a lesson you learned from family meals growing up?",
    "What's a value you want to pass on through family dinners?",
    "What's your most cherished family tradition?",
    "What's a story about our family that always gets told at dinner?",
    "What does home mean to you beyond the physical place?",
    "Who's the best cook in our family and why?",
    "What's a meal that always brings the family together?",
    "What holiday meal do you look forward to most?",
    "What would you want on the table for your birthday dinner?",
  ],
  team: [
    "What's the best team meal or outing you've been part of?",
    "If our team opened a restaurant, what would it serve?",
    "What's a hidden talent you have outside of work?",
    "What motivates you that most colleagues wouldn't guess?",
    "What's the best career advice you've ever received?",
    "If you could change one thing about workplace culture, what?",
    "What's a professional accomplishment you're proud of?",
    "How do you recharge after a tough work week?",
    "What's something you wish your team knew about you?",
    "If money was no object, what would you do for a living?",
    "What's the most interesting project you've worked on?",
    "What does good leadership look like to you?",
    "What's a skill you want to develop?",
    "When do you feel most creative?",
    "What's a misconception people have about your role?",
  ],
  'holiday-gathering': [
    "What's your favourite holiday tradition?",
    "What's the best gift you've ever given or received?",
    "What does the holiday season mean to you?",
    "What's your favourite holiday memory?",
    "If you could celebrate any holiday anywhere, where?",
    "What makes a holiday gathering special to you?",
    "What's the best holiday meal you've ever had?",
    "What's a new tradition you'd love to start?",
    "What's the funniest holiday moment you remember?",
    "What are you most grateful for this year?",
    "Who makes the holidays special for you?",
    "What's a holiday song that always gets you in the mood?",
    "What does home feel like during the holidays?",
    "What's a holiday you'd love to experience in another culture?",
    "What would your perfect holiday look like?",
  ],
  birthday: [
    "What's the best birthday you've ever had?",
    "What's a birthday wish you've never told anyone?",
    "What's the most thoughtful birthday gift you've received?",
    "If you could celebrate your birthday anywhere, where?",
    "What's a birthday tradition you love?",
    "What's a year of your life you'd love to revisit?",
    "What's the best birthday surprise you've experienced?",
    "What does another year of life mean to you?",
    "What's a lesson this past year taught you?",
    "If you could invite anyone to your birthday dinner, who?",
    "What's a goal you have for the year ahead?",
    "What are you most proud of from this past year?",
    "What's something you want to do before your next birthday?",
    "What makes you feel celebrated?",
    "What advice would you give to your younger self?",
  ],
  everyday: [
    "If you had to describe yourself using only three words, what would they be?",
    "What's the best meal you've ever had and why was it special?",
    "What's one thing you're proud of that you don't talk about enough?",
    "What does your ideal Sunday look like?",
    "What's the most important lesson you've learned this year?",
    "What's a small thing that makes your day better?",
    "What hobby have you always wanted to try?",
    "What's something that made you laugh recently?",
    "What's a book, film, or show that changed how you see the world?",
    "What's one thing on your bucket list?",
    "What's your earliest happy memory?",
    "What are you grateful for that you don't mention often?",
    "What makes a good conversation?",
    "What's something you've changed your mind about?",
    "If this were your last meal, what would you want?",
  ],
  'random-mix': [
    "If you had to describe yourself using only three words, what would they be?",
    "What's the best meal you've ever had and why was it special?",
    "What's one thing you're proud of that you don't talk about enough?",
    "If you could have dinner with anyone in history, who would it be?",
    "What's a tradition from your childhood you wish you'd kept?",
    "What does your ideal Sunday look like?",
    "What's the most important lesson you've learned this year?",
    "If you could live anywhere in the world, where would you choose?",
    "What's a small thing that makes your day better?",
    "What hobby or skill have you always wanted to learn but haven't yet?",
    "What's the most adventurous thing you've ever eaten?",
    "What's something that made you laugh recently?",
    "What's a book, film, or show that changed the way you see the world?",
    "Who is someone who has had a big influence on your life?",
    "What's one thing on your bucket list?",
    "If you could instantly become an expert in one thing, what would it be?",
    "What's your earliest happy memory?",
    "What does home mean to you?",
    "What's something you're grateful for that you don't mention often?",
    "If you could go back and give your younger self one piece of advice, what would it be?",
    "What's the best advice you've ever received?",
    "What's something you believe that most people disagree with?",
    "What's a dream you've never told many people about?",
    "What moment in your life are you most proud of?",
    "If money were no object, how would you spend your time?",
    "What's the kindest thing a stranger has done for you?",
    "What makes a good friendship?",
    "What's the funniest thing that's happened at a family gathering?",
    "What's something you've changed your mind about as you've gotten older?",
    "If this were your last meal, what would you want on the table?",
  ],
}

function getQuestionsForMode(mode: string): string[] {
  return QUESTIONS_BY_MODE[mode] ?? QUESTIONS_BY_MODE['random-mix']
}


/* ─── DTC Card ─── */
function DTCCard({ question, flipped, onFlip }: { question: string; flipped: boolean; onFlip: () => void }) {
  const CARD_W = 320
  const CARD_H = 400
  const { wrapperStyle, cardStyle } = useScaledCard(CARD_W, CARD_H)

  return (
    <div style={wrapperStyle}>
    <div
      className="game-card"
      onClick={!flipped ? onFlip : undefined}
      style={{ ...cardStyle, perspective: '1000px', cursor: flipped ? 'default' : 'pointer' }}
    >
      <div style={{
        width: '100%', height: '100%', position: 'relative',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        {/* Front face */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          background: '#5a4447', borderRadius: '13px', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(90,68,71,0.4)',
        }}>
          <p style={{
            position: 'absolute', left: '16px', top: '40px',
            fontFamily: "'Staatliches', sans-serif", fontSize: '32px',
            color: '#e8e6e3', lineHeight: 1.1, margin: 0, letterSpacing: '0.02em',
          }}>
            DINNER TABLE<br />CONVERSATION
          </p>
          <img src={DTC_BOW} alt="" style={{
            position: 'absolute',
            bottom: '36px', right: '28px',
            width: '52px', height: '47px',
            objectFit: 'contain',
          }} />
        </div>

        {/* Back face */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: '#f0ece5', borderRadius: '13px', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        }}>
          <p style={{
            position: 'absolute', left: '20px', top: '32px', right: '20px',
            fontFamily: "'Staatliches', sans-serif", fontSize: '26px',
            color: '#5a4447', lineHeight: 1.2, margin: 0, letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}>
            {question}
          </p>
          <img src={DTC_BOW} alt="" style={{
            position: 'absolute',
            bottom: '36px', right: '28px',
            width: '52px', height: '47px',
            objectFit: 'contain',
            filter: 'brightness(0) saturate(100%) invert(28%) sepia(12%) saturate(850%) hue-rotate(310deg) brightness(85%)',
          }} />
        </div>
      </div>
    </div>
    </div>
  )
}

/* ─── Mini DTC Card (done screen) ─── */
function MiniDTCCard() {
  return (
    <div style={{
      width: '140px', height: '175px',
      background: '#5a4447', borderRadius: '9px', overflow: 'hidden',
      position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{
        position: 'absolute', left: '10px', top: '16px',
        fontFamily: "'Staatliches', sans-serif", fontSize: '14px',
        color: '#e8e6e3', lineHeight: 1.1, margin: 0,
      }}>
        DINNER TABLE<br />CONVERSATION
      </p>
      <img src={DTC_BOW} alt="" style={{
        position: 'absolute', bottom: '14px', right: '12px',
        width: '24px', height: '22px', objectFit: 'contain',
      }} />
    </div>
  )
}

/* ─── Screen 2: Deck Size ─── */
function DeckSize({ onBack, onStart }: { onBack: () => void; onStart: (n: number) => void }) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const parsed = parseInt(value, 10)
  const valid  = !isNaN(parsed) && parsed > 0 && parsed <= 200

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '500px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%' }}>
          <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>DECK SIZE</h2>
          <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>How many cards do you want to play?</p>
          <div
            style={{ background: '#111113', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', width: '100%', marginTop: '16px', boxSizing: 'border-box', cursor: 'text' }}
            onClick={() => inputRef.current?.focus()}
          >
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px' }}>#</span>
            </div>
            <input
              ref={inputRef} type="number" min={1} max={200}
              value={value} onChange={e => setValue(e.target.value)}
              placeholder="Enter number"
              style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', flex: 1 }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '292px' }}>
          <button onClick={onBack} style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', cursor: 'pointer', textAlign: 'center', letterSpacing: '0.05em' }}>
            GO BACK
          </button>
          <button
            onClick={() => valid && setTimeout(() => onStart(parsed), 100)}
            style={{ flex: 1, background: valid ? '#dc2827' : '#333', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: valid ? '#fff' : '#666', cursor: valid ? 'pointer' : 'not-allowed', textAlign: 'center', letterSpacing: '0.05em', transition: 'background 0.2s' }}
          >
            START THE GAME
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Screen 3: Get Ready ─── */
function GetReady({ player, onReady }: { player: Player | null; onReady: () => void }) {
  useEffect(() => {
    const id = setTimeout(onReady, 2400)
    return () => clearTimeout(id)
  }, [onReady])

  return (
    <div className="screen-enter" onClick={onReady} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0 }}>Get Ready...</h2>
        {player && (
          <div className="stagger-item" style={{ background: '#18181b', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', padding: '12px', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: player.color, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', whiteSpace: 'nowrap' }}>{player.name.toUpperCase()}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
          <span className="get-ready-dot" /><span className="get-ready-dot" /><span className="get-ready-dot" />
        </div>
      </div>
    </div>
  )
}

/* ─── Screen 4+5: Gameplay ─── */
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
            You played all {totalCards} dinner table cards
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

        <MiniDTCCard />

        <div className="done-btns" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="game-btn" onClick={onBrowseGames} style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>BROWSE GAMES</button>
          <button className="game-btn-primary" onClick={onPlayAgain} style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>PLAY AGAIN</button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '40px', position: 'relative', zIndex: 2 }}>
      <DTCCard question={question} flipped={flipped} onFlip={() => setFlipped(true)} />

      {!flipped ? (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          Tap the card to flip it.
        </p>
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
type Step = 'playerSetup' | 'deckSize' | 'getReady' | 'game'

export default function DinnerTableGame({ mode = 'random-mix', onClose }: { mode?: string; onClose: () => void }) {
  const [step,        setStep]        = useState<Step>('playerSetup')
  const [players,     setPlayers]     = useState<Player[]>([])
  const [totalCards,  setTotalCards]  = useState(0)
  const [cardIndex,   setCardIndex]   = useState(0)
  const [playerIndex, setPlayerIndex] = useState(0)
  const [skipCount,   setSkipCount]   = useState(0)
  const [questions,   setQuestions]   = useState(() => shuffle(getQuestionsForMode(mode)))

  const currentPlayer  = players.length > 0 ? players[playerIndex % players.length] : null
  const currentQuestion = questions[cardIndex % questions.length]

  const handleNext = useCallback(() => {
    const nextCard   = cardIndex + 1
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

  const handlePlayAgain = useCallback(() => {
    setCardIndex(0); setPlayerIndex(0); setSkipCount(0)
    setQuestions(shuffle(getQuestionsForMode(mode))); setStep('getReady')
  }, [mode])

  return (
    <div className="game-fullscreen">
      <GameNav onBack={onClose} />

      {step === 'playerSetup' && (
        <SharedPlayerSetup
          initialPlayers={players}
          skipLabel="SKIP FOR NOW"
          onSkip={() => setStep('deckSize')}
          onNext={p => { setPlayers(p); setStep('deckSize') }}
        />
      )}

      {step === 'deckSize' && (
        <DeckSize
          onBack={() => setStep('playerSetup')}
          onStart={n => { setTotalCards(n); setCardIndex(0); setPlayerIndex(0); setQuestions(shuffle(getQuestionsForMode(mode))); setStep('getReady') }}
        />
      )}

      {step === 'getReady' && (
        <GetReady player={currentPlayer} onReady={goToGame} />
      )}

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
