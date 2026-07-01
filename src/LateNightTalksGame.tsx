import { useState, useRef, useEffect, useCallback } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ─── Assets ─── */
const LNT_OUTER  = 'https://www.figma.com/api/mcp/asset/507aa3ce-b14c-4dfd-bfb6-21e0d961e8c6'
const LNT_INNER  = 'https://www.figma.com/api/mcp/asset/6bfe659f-3464-48e0-a4e2-94d4d27d1586'
const LNT_INNER2 = 'https://www.figma.com/api/mcp/asset/04b634a0-1c37-4b47-8a5a-3ad9a26e6f41'
const LNT_CHAT   = 'https://www.figma.com/api/mcp/asset/874fdf51-481c-4660-836c-bcc971cbe12b'
const LNT_SPARK1 = 'https://www.figma.com/api/mcp/asset/a79aec31-5dd2-4f81-9d98-53639cab845f'
const LNT_SPARK2 = 'https://www.figma.com/api/mcp/asset/8117f7b4-3ad4-485c-b58a-28511a4df4c9'

const SOCIAL_TIKTOK    = 'https://www.figma.com/api/mcp/asset/52c80b9f-7611-4e1c-b0a1-b87cbde55222'
const SOCIAL_INSTAGRAM = 'https://www.figma.com/api/mcp/asset/2fb330d3-8103-4715-98c4-977825083eae'
const SOCIAL_WHATSAPP  = 'https://www.figma.com/api/mcp/asset/5e3391bc-c214-4266-8b20-9d5680742eef'

/* ─── Questions ─── */
const QUESTIONS = [
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
]

/* ─── Shared Nav ─── */
function GameNav({ onBack }: { onBack: () => void }) {
  return (
    <nav style={{
      background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 60px', height: '80px', flexShrink: 0, position: 'relative', zIndex: 10,
    }}>
      <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '28px', color: '#fff', letterSpacing: '0.56px', fontWeight: 400 }}>
        DECKED
      </span>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        {['Browse Games', 'How to Play', 'About'].map(label => (
          <button key={label} onClick={label === 'Browse Games' ? onBack : undefined}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
              fontFamily: "'Anton SC', sans-serif", fontSize: '16px', fontWeight: 400,
              cursor: label === 'Browse Games' ? 'pointer' : 'default', padding: 0, transition: 'color 0.2s',
            }}
            onMouseOver={e => { if (label === 'Browse Games') (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
            onMouseOut={e => { if (label === 'Browse Games') (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)' }}
          >{label}</button>
        ))}
      </div>
    </nav>
  )
}

/* ─── Shared Footer ─── */
function GameFooter() {
  return (
    <footer style={{
      background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)',
      padding: '32px 60px', display: 'flex', flexDirection: 'column', gap: '40px', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '420px' }}>
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '32px', color: '#fff' }}>DECKED</span>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
            Pick a deck, pass the phone, and let the chaos begin. 10+ party card games, no app, no login, no excuses.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {[SOCIAL_TIKTOK, SOCIAL_INSTAGRAM, SOCIAL_WHATSAPP].map((src, i) => (
            <img key={i} src={src} alt="" style={{ width: '20px', height: '20px', borderRadius: '8px', objectFit: 'contain' }} />
          ))}
        </div>
      </div>
      <div style={{ height: '1px', background: '#212326', width: '100%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#9ca3af' }}>© 2026 DECKED. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Privacy', 'Terms', 'Cookie'].map(l => (
            <button key={l} style={{ background: 'none', border: 'none', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '13px', cursor: 'pointer', padding: 0 }}>{l}</button>
          ))}
        </div>
      </div>
    </footer>
  )
}

/* ─── LNT Card (the scalloped orange card) ─── */
function LNTCard({ question, flipped, onFlip }: { question: string; flipped: boolean; onFlip: () => void }) {
  return (
    <div
      onClick={!flipped ? onFlip : undefined}
      style={{
        width: '400px', height: '387px',
        position: 'relative', cursor: flipped ? 'default' : 'pointer',
        perspective: '1000px',
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
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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

export default function LateNightTalksGame({ onClose }: { onClose: () => void }) {
  const [step,        setStep]        = useState<Step>('playerSetup')
  const [players,     setPlayers]     = useState<Player[]>([])
  const [totalCards,  setTotalCards]  = useState(0)
  const [cardIndex,   setCardIndex]   = useState(0)
  const [playerIndex, setPlayerIndex] = useState(0)
  const [skipCount,   setSkipCount]   = useState(0)
  const [questions,   setQuestions]   = useState(() => shuffle(QUESTIONS))

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
    setQuestions(shuffle(QUESTIONS))
    setStep('getReady')
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
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
          onStart={n => { setTotalCards(n); setCardIndex(0); setPlayerIndex(0); setQuestions(shuffle(QUESTIONS)); setStep('getReady') }}
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
