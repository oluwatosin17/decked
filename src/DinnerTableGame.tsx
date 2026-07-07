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
const DTC_BOW = 'https://www.figma.com/api/mcp/asset/058155f3-e036-4776-a744-090ea223bdaa'

const SOCIAL_TIKTOK    = '/icons/social-tiktok.svg'
const SOCIAL_INSTAGRAM = '/icons/social-instagram.svg'
const SOCIAL_WHATSAPP  = '/icons/social-whatsapp.svg'

/* ─── Questions ─── */
const QUESTIONS = [
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
]

/* ─── Shared Nav ─── */
function GameNav({ onBack }: { onBack: () => void }) {
  return (
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
  )
}

/* ─── Shared Footer ─── */
function GameFooter() {
  return (
    <footer style={{ background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)', padding: '32px 60px', display: 'flex', flexDirection: 'column', gap: '40px', flexShrink: 0 }}>
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

/* ─── DTC Card ─── */
function DTCCard({ question, flipped, onFlip }: { question: string; flipped: boolean; onFlip: () => void }) {
  const CARD_W = 320
  const CARD_H = 400

  return (
    <div
      onClick={!flipped ? onFlip : undefined}
      style={{ width: `${CARD_W}px`, height: `${CARD_H}px`, perspective: '1000px', cursor: flipped ? 'default' : 'pointer' }}
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
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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

export default function DinnerTableGame({ onClose }: { onClose: () => void }) {
  const [step,        setStep]        = useState<Step>('playerSetup')
  const [players,     setPlayers]     = useState<Player[]>([])
  const [totalCards,  setTotalCards]  = useState(0)
  const [cardIndex,   setCardIndex]   = useState(0)
  const [playerIndex, setPlayerIndex] = useState(0)
  const [skipCount,   setSkipCount]   = useState(0)
  const [questions,   setQuestions]   = useState(() => shuffle(QUESTIONS))

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
    setQuestions(shuffle(QUESTIONS)); setStep('getReady')
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
