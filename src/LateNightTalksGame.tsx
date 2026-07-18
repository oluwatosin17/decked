import { useState, useRef, useEffect, useCallback } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import { useScaledCard } from './hooks/useCardScale'
import { GameNav, GameFooter } from './components/GameShell'
import { getShuffledDeck } from './utils/deckShuffle'

/* ─── Assets (permanently hosted on Cloudinary — see decked/game-assets folder) ─── */
const LNT_OUTER  = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/lnt-outer.svg'
const LNT_INNER  = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/lnt-inner.svg'
const LNT_INNER2 = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/lnt-inner2.svg'
const LNT_CHAT   = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/lnt-chat.svg'
const LNT_SPARK1 = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/lnt-spark1.svg'
const LNT_SPARK2 = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/lnt-spark2.svg'

const SOCIAL_TIKTOK    = '/icons/social-tiktok.svg'
const SOCIAL_INSTAGRAM = '/icons/social-instagram.svg'
const SOCIAL_WHATSAPP  = '/icons/social-whatsapp.svg'

/* ─── Questions by mode ─── */
const QUESTIONS_BY_MODE: Record<string, string[]> = {
  couples: [
    "What makes you feel most loved by your partner?",
    "What's your favourite memory of us together?",
    "What's something you've always wanted to tell me?",
    "What does your ideal life with me look like in 5 years?",
    "What's the most romantic thing you've ever experienced?",
    "What's something I do that you find deeply attractive?",
    "When did you first know you had feelings for me?",
    "What's your love language and why?",
    "What does home feel like to you?",
    "What's a dream you haven't told me about?",
    "What's a fear you carry about our relationship?",
    "When do you feel most connected to me?",
    "What's the best piece of advice you'd give about love?",
    "What's something you're proud of about us?",
    "What's one thing you'd change about how we communicate?",
  ],
  friends: [
    "What makes you feel appreciated as a friend?",
    "What's something you've never told anyone?",
    "What's your biggest fear about the future?",
    "What's a moment with me you'd relive if you could?",
    "When do you feel most like yourself around friends?",
    "What's the best advice you've ever received?",
    "What's something you wish your friends understood about you?",
    "What's a belief you used to hold that you've changed?",
    "What makes you feel most alive?",
    "Who has shaped who you are the most?",
    "What's a question you wish someone would ask you?",
    "What do you value most in a friendship?",
    "What's something that always cheers you up?",
    "What does loyalty mean to you?",
    "What's the most important lesson friendship has taught you?",
  ],
  family: [
    "What's a family memory that always makes you smile?",
    "What's something you've never told your family?",
    "What's a tradition you'd love to pass on?",
    "What does family mean to you beyond blood?",
    "What's a lesson your parents taught you that stuck?",
    "What's something you wish your family talked about more?",
    "When do you feel closest to your family?",
    "What's the best advice a family member gave you?",
    "What's something you appreciate about your upbringing?",
    "What's a family story that gets told every gathering?",
    "What would you change about how your family communicates?",
    "What's a value your family holds that you're proud of?",
    "What's your favourite family tradition?",
    "What's a moment you were really proud of your family?",
    "What does home feel like to you?",
  ],
  'deep-conversations': [
    "What's the meaning of life to you?",
    "What's a truth you've been avoiding?",
    "What does it mean to truly know someone?",
    "What's the hardest thing about being honest?",
    "What's something you're still healing from?",
    "When was the last time you felt truly free?",
    "What do you think happens when we die?",
    "What's the most important lesson life has taught you?",
    "What would you do if fear didn't exist?",
    "What's a question you're afraid to know the answer to?",
    "What does forgiveness really mean to you?",
    "What are you most grateful for?",
    "What's something you've outgrown that was once important?",
    "What would your younger self think of who you are now?",
    "What do you want your life to stand for?",
  ],
  'first-date': [
    "What's something that always makes you smile?",
    "What are you most passionate about right now?",
    "What's the most interesting place you've been?",
    "What does your ideal weekend look like?",
    "What's a fun fact about you that surprises people?",
    "What quality do you value most in someone?",
    "What's a movie or show you never get tired of?",
    "If you could live anywhere, where would it be?",
    "What's the most spontaneous thing you've done?",
    "What's your comfort food?",
    "What do you do when nobody's watching?",
    "What's the best trip you've ever taken?",
    "What's a skill you wish you had?",
    "What makes you laugh the hardest?",
    "What are you looking forward to most right now?",
  ],
  party: [
    "What's the most embarrassing thing you've done at a party?",
    "What's the wildest night you've ever had?",
    "What's your go-to karaoke song?",
    "What's the funniest thing that's happened to you recently?",
    "If your life had a theme song, what would it be?",
    "What's a secret talent nobody here knows about?",
    "What's the most impulsive decision you've ever made?",
    "What's a guilty pleasure you refuse to give up?",
    "What's the best party you've ever been to?",
    "If you could be famous for one thing, what?",
    "What's the worst date you've ever been on?",
    "What's the most random thing on your bucket list?",
    "What's the latest you've ever stayed up and why?",
    "What would your autobiography be called?",
    "What's the craziest rumour about yourself you've heard?",
  ],
  nostalgia: [
    "What's your earliest happy memory?",
    "What song takes you straight back to a specific time?",
    "What's a childhood toy or game you miss?",
    "What smell instantly triggers a memory for you?",
    "What was the best summer of your life?",
    "What's a movie from your childhood that still holds up?",
    "What were you known for in school?",
    "What's a friendship from your past you think about?",
    "What food from your childhood do you still crave?",
    "What was the first song or album you loved?",
    "What fashion trend did you fully commit to?",
    "What was your favourite place to go as a kid?",
    "What game defined your childhood?",
    "What's a lesson from childhood that stuck with you?",
    "What would your ten-year-old self think of you now?",
  ],
  random: [
    "What makes you feel appreciated?",
    "What's something you've never told anyone?",
    "What's your biggest fear about the future?",
    "What's a moment you'd relive if you could?",
    "What does your ideal life look like in 5 years?",
    "What's something you're still healing from?",
    "When do you feel most like yourself?",
    "What's the best advice you've ever received?",
    "What's something you wish people understood about you?",
    "What's a belief you used to hold that you've changed?",
    "What makes you feel most alive?",
    "What's a dream you haven't told many people about?",
    "What's your love language and why?",
    "What's the kindest thing someone has done for you?",
    "What's something you're proud of that others might not notice?",
    "Who has shaped who you are the most?",
    "What's a question you wish someone would ask you?",
    "What's the last thing that made you genuinely laugh?",
    "What do you think about before you fall asleep?",
    "What's one thing you'd change about yourself?",
    "What does home feel like to you?",
    "What's a habit you wish you could break?",
    "What's something that always cheers you up?",
    "When was the last time you stepped outside your comfort zone?",
    "What's the most important lesson life has taught you?",
    "What's something you're secretly good at?",
    "What's a place that holds a special memory for you?",
    "What does success mean to you?",
    "What's the most spontaneous thing you've ever done?",
    "What's your favourite thing about yourself?",
  ],
}

function getQuestionsForMode(mode: string): string[] {
  return QUESTIONS_BY_MODE[mode] ?? QUESTIONS_BY_MODE.random
}


/* ─── LNT Card (the scalloped orange card) ─── */
function LNTCard({ question, flipped, onFlip }: { question: string; flipped: boolean; onFlip: () => void }) {
  const { wrapperStyle, cardStyle } = useScaledCard(400, 387)
  return (
    <div style={{ ...wrapperStyle, perspective: '1000px' }}>
    <div
      className="game-card"
      onClick={!flipped ? onFlip : undefined}
      style={{
        ...cardStyle,
        position: 'relative', cursor: flipped ? 'default' : 'pointer',
      }}
    >
      <div style={{
        width: '100%', height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        {/* Front face — LNT logo */}
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          <div style={{ position: 'relative', width: '400px', height: '387px', display: 'grid', placeItems: 'start' }}>
            {/* Scalloped outer */}
            <img src={LNT_OUTER} alt="" style={{ gridColumn: 1, gridRow: 1, width: '400px', height: '387px', objectFit: 'fill' }} />
            {/* Pink inner bg */}
            <img src={LNT_INNER} alt="" style={{ gridColumn: 1, gridRow: 1, position: 'absolute', left: '61px', top: '66px', width: '281px', height: '266px', objectFit: 'fill' }} />
            {/* Inner darker layer */}
            <img src={LNT_INNER2} alt="" style={{ gridColumn: 1, gridRow: 1, position: 'absolute', left: '67px', top: '73px', width: '270px', height: '253px', objectFit: 'fill' }} />
            {/* Text + chat bubble */}
            <div style={{ gridColumn: 1, gridRow: 1, position: 'absolute', left: '86px', top: '194px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontFamily: "'Slackey', cursive", fontSize: '37.6px', color: '#ff440e', lineHeight: 1 }}>Late</span>
                <span style={{ fontFamily: "'Slackey', cursive", fontSize: '37.6px', color: '#ff440e', lineHeight: 1 }}>Night</span>
                <span style={{ fontFamily: "'Slackey', cursive", fontSize: '57.4px', color: '#ff440e', lineHeight: 1 }}>Talks</span>
              </div>
              <img src={LNT_CHAT} alt="" style={{ position: 'absolute', left: '118px', top: '-19px', width: '92px', height: '92px' }} />
            </div>
            {/* Sparks */}
            <img src={LNT_SPARK1} alt="" style={{ gridColumn: 1, gridRow: 1, position: 'absolute', left: '311px', top: '17.5px', width: '36.6px', height: '13px' }} />
            <img src={LNT_SPARK2} alt="" style={{ gridColumn: 1, gridRow: 1, position: 'absolute', left: '357px', top: '30.8px', width: '7.6px', height: '4.8px' }} />
          </div>
        </div>

        {/* Back face — Question */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}>
          <div style={{ position: 'relative', width: '400px', height: '387px', display: 'grid', placeItems: 'start' }}>
            <img src={LNT_OUTER} alt="" style={{ gridColumn: 1, gridRow: 1, width: '400px', height: '387px', objectFit: 'fill' }} />
            <img src={LNT_INNER} alt="" style={{ gridColumn: 1, gridRow: 1, position: 'absolute', left: '61px', top: '66px', width: '281px', height: '266px', objectFit: 'fill' }} />
            <img src={LNT_INNER2} alt="" style={{ gridColumn: 1, gridRow: 1, position: 'absolute', left: '67px', top: '73px', width: '270px', height: '253px', objectFit: 'fill' }} />
            {/* Question text */}
            <div style={{
              gridColumn: 1, gridRow: 1,
              position: 'absolute', left: '67px', top: '66px', width: '270px', height: '253px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
              boxSizing: 'border-box',
            }}>
              <p style={{
                fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
                fontSize: '22px', color: '#ff440e',
                textAlign: 'center', textTransform: 'uppercase',
                lineHeight: 1.25, margin: 0, letterSpacing: '0.02em',
              }}>
                {question}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

/* ─── Mini LNT Card (for done screen) ─── */
function MiniLNTCard() {
  return (
    <div style={{ position: 'relative', width: '160px', height: '155px' }}>
      <img src={LNT_OUTER} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
      <img src={LNT_INNER} alt="" style={{ position: 'absolute', left: '24px', top: '26px', width: '112px', height: '106px', objectFit: 'fill' }} />
      <img src={LNT_INNER2} alt="" style={{ position: 'absolute', left: '27px', top: '29px', width: '108px', height: '101px', objectFit: 'fill' }} />
      <div style={{ position: 'absolute', left: '35px', top: '78px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontFamily: "'Slackey', cursive", fontSize: '15px', color: '#ff440e', lineHeight: 1 }}>Late</span>
          <span style={{ fontFamily: "'Slackey', cursive", fontSize: '15px', color: '#ff440e', lineHeight: 1 }}>Night</span>
          <span style={{ fontFamily: "'Slackey', cursive", fontSize: '23px', color: '#ff440e', lineHeight: 1 }}>Talks</span>
        </div>
        <img src={LNT_CHAT} alt="" style={{ position: 'absolute', left: '47px', top: '-7.5px', width: '37px', height: '37px' }} />
      </div>
    </div>
  )
}

/* ─── Screen 1: Who's Playing? — uses shared component ─── */

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
              ref={inputRef}
              type="number" min={1} max={200}
              value={value}
              onChange={e => setValue(e.target.value)}
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
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>
          Get Ready...
        </h2>
        {player && (
          <div className="stagger-item" style={{ background: '#18181b', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', padding: '12px', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: player.color, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', whiteSpace: 'nowrap' }}>
              {player.name.toUpperCase()}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
          <span className="get-ready-dot" />
          <span className="get-ready-dot" />
          <span className="get-ready-dot" />
        </div>
      </div>
    </div>
  )
}

/* ─── Screen 4 & 5: Game Play ─── */
function GamePlay({ players, cardIndex, totalCards, skipCount, question, onSkip, onNext, onPlayAgain, onBrowseGames }: {
  players: Player[]
  cardIndex: number
  totalCards: number
  skipCount: number
  question: string
  onSkip: () => void
  onNext: () => void
  onPlayAgain: () => void
  onBrowseGames: () => void
}) {
  const [flipped, setFlipped] = useState(false)

  const isDone = totalCards > 0 && cardIndex >= totalCards

  if (isDone) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '40px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
          <h2 className="done-heading" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '48px', color: '#fff', margin: 0, textTransform: 'uppercase' }}>
            You're Decked
          </h2>
          <p className="done-subtitle" style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            You played all {totalCards} spicy starters cards
          </p>
        </div>

        {/* Stats */}
        <div style={{ background: '#18181b', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '20px 32px' }}>
          {[
            { count: totalCards, label: 'CARDS' },
            { count: skipCount,  label: 'SKIPPED' },
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

        <MiniLNTCard />

        <div className="done-btns" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="game-btn" onClick={onBrowseGames} style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>
            BROWSE GAMES
          </button>
          <button className="game-btn-primary" onClick={onPlayAgain} style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>
            PLAY AGAIN
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '40px', position: 'relative', zIndex: 2 }}>
      <LNTCard
        question={question}
        flipped={flipped}
        onFlip={() => setFlipped(true)}
      />

      {!flipped ? (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          Tap the card to flip it.
        </p>
      ) : (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="game-btn"
            onClick={() => { setFlipped(false); setTimeout(onSkip, 120) }}
            style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}
          >
            SKIP FOR NOW
          </button>
          <button
            className="game-btn-primary"
            onClick={() => { setFlipped(false); setTimeout(onNext, 120) }}
            style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}
          >
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

export default function LateNightTalksGame({ mode = 'random', onClose }: { mode?: string; onClose: () => void }) {
  const [step,        setStep]        = useState<Step>('playerSetup')
  const [players,     setPlayers]     = useState<Player[]>([])
  const [totalCards,  setTotalCards]  = useState(0)
  const [cardIndex,   setCardIndex]   = useState(0)
  const [playerIndex, setPlayerIndex] = useState(0)
  const [skipCount,   setSkipCount]   = useState(0)
  const [questions,   setQuestions]   = useState(() => getShuffledDeck(getQuestionsForMode(mode), 'late-night-talks'))

  const currentPlayer = players.length > 0 ? players[playerIndex % players.length] : null

  const currentQuestion = questions[cardIndex % questions.length]

  const handleNext = useCallback(() => {
    const nextCard   = cardIndex + 1
    const nextPlayer = players.length > 0 ? (playerIndex + 1) % players.length : 0
    setCardIndex(nextCard)
    setPlayerIndex(nextPlayer)
    if (totalCards > 0 && nextCard >= totalCards) {
      setStep('game')
    } else {
      setStep('getReady')
    }
  }, [cardIndex, playerIndex, players.length, totalCards])

  const handleSkip = useCallback(() => {
    setSkipCount(c => c + 1)
    handleNext()
  }, [handleNext])

  const goToGame = useCallback(() => setStep('game'), [])

  const handlePlayAgain = useCallback(() => {
    setCardIndex(0)
    setPlayerIndex(0)
    setSkipCount(0)
    setQuestions(getShuffledDeck(getQuestionsForMode(mode), 'late-night-talks'))
    setStep('getReady')
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
          onStart={n => { setTotalCards(n); setCardIndex(0); setPlayerIndex(0); setQuestions(getShuffledDeck(getQuestionsForMode(mode), 'late-night-talks')); setStep('getReady') }}
        />
      )}

      {step === 'getReady' && (
        <GetReady player={currentPlayer} onReady={goToGame} />
      )}

      {step === 'game' && (
        <GamePlay
          players={players}
          cardIndex={cardIndex}
          totalCards={totalCards}
          skipCount={skipCount}
          question={currentQuestion}
          onSkip={handleSkip}
          onNext={handleNext}
          onPlayAgain={handlePlayAgain}
          onBrowseGames={onClose}
        />
      )}

      <GameFooter />
    </div>
  )
}
