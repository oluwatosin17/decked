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

/* ---- Cloudinary assets ---- */
const CDN = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets'

type Category = 'funny' | 'relationships' | 'spicy' | 'party' | 'drinking' | 'friends' | 'random'

const CATEGORY_OPTIONS: { id: Category; label: string; icon: string }[] = [
  { id: 'funny',         label: 'Funny',         icon: `${CDN}/funny.svg` },
  { id: 'relationships', label: 'Relationships',  icon: `${CDN}/relationship.svg` },
  { id: 'spicy',         label: 'Spicy',          icon: `${CDN}/spicy.svg` },
  { id: 'party',         label: 'Party',          icon: '/icons/party.svg' },
  { id: 'drinking',      label: 'Drinking',       icon: `${CDN}/drinking.svg` },
  { id: 'friends',       label: 'Friends',        icon: '/icons/friends.svg' },
  { id: 'random',        label: 'Random',         icon: '/icons/random.svg' },
]

const PROMPTS: Record<Category, string[]> = {
  funny: [
    "What's the most embarrassing thing you've ever done in front of a crush?",
    "What's the weirdest thing you've ever Googled?",
    "What's the dumbest lie you've ever told and actually got away with?",
    "What's the most childish thing you still do?",
    "What's the worst fashion trend you fully committed to?",
    "What's the funniest thing you've ever said at the worst possible time?",
    "What's the most ridiculous thing you've ever cried over?",
    "What's your most embarrassing autocorrect fail?",
    "What's the weirdest food combination you secretly enjoy?",
    "What's the most awkward thing you've done on a first date?",
    "What's the longest you've gone without showering and why?",
    "What's the most absurd excuse you've made to get out of plans?",
    "What's the most embarrassing song on your playlist right now?",
    "What's the worst gift you've ever received but had to pretend to like?",
    "What's the silliest thing you've ever gotten into an argument about?",
  ],
  relationships: [
    "What quality do you value most in a friendship?",
    "What's the biggest lesson a past relationship taught you?",
    "Have you ever stayed in a relationship longer than you should have? Why?",
    "What's your biggest dealbreaker in a relationship?",
    "What's the most romantic thing someone has ever done for you?",
    "Have you ever been in love with someone who didn't love you back?",
    "What's the hardest conversation you've ever had with a partner?",
    "Do you believe in second chances after someone cheats?",
    "What's one thing you wish you'd said to an ex?",
    "What's the most toxic trait you've had to unlearn in relationships?",
    "Have you ever lost feelings for someone overnight? What happened?",
    "What's the nicest thing a partner has ever said to you?",
    "Do you think your parents' relationship has influenced yours?",
    "What's something you'd never compromise on in a relationship?",
    "Have you ever had your heart broken so badly it changed you as a person?",
  ],
  spicy: [
    "What's the wildest DM you've ever sent or received?",
    "What's the most scandalous thing you've done that nobody here knows about?",
    "Have you ever had feelings for two people at the same time?",
    "What's the most attractive quality in the person sitting next to you?",
    "What's the biggest risk you've ever taken for someone you liked?",
    "What's a secret about your love life that would surprise everyone here?",
    "Have you ever used someone to make another person jealous?",
    "What's the most forward thing you've ever done to get someone's attention?",
    "Who in this room would you trust with your deepest secret?",
    "What's the most inappropriate crush you've ever had?",
    "Have you ever lied to keep a relationship going?",
    "What's the most impulsive thing you've done because of attraction?",
    "Have you ever caught feelings for someone you absolutely shouldn't have?",
    "What's the boldest move someone has ever made on you?",
    "What's one thing you find attractive that most people would find weird?",
  ],
  party: [
    "What's the most regrettable thing you've done at a party?",
    "What's the craziest dare you've ever actually gone through with?",
    "Have you ever hooked up with someone at a party and regretted it?",
    "What's the most embarrassing thing you've done while drunk?",
    "Have you ever been so drunk you forgot an entire night?",
    "What's the wildest thing you've witnessed at a party?",
    "Have you ever pretended to be drunk to get away with something?",
    "What's the worst party you've ever been to and what made it so bad?",
    "Have you ever caused drama at a party? What happened?",
    "What's the biggest secret you've spilled while drunk?",
    "Have you ever kissed a stranger at a party?",
    "What's the most out-of-character thing you've done at a party?",
    "Have you ever snuck into a place you weren't supposed to be?",
    "What's the worst hangover story you have?",
    "Have you ever left a party without telling anyone? Why?",
  ],
  drinking: [
    "What's the drunkest you've ever been and what happened?",
    "What's the worst decision you've ever made while drinking?",
    "Have you ever drunk-called or texted someone and wished you hadn't?",
    "What drink instantly makes you cringe because of a bad experience?",
    "Have you ever thrown up in someone's car, house, or on someone?",
    "What's the most money you've ever spent on a single night out?",
    "Have you ever blacked out and done something you only found out about later?",
    "What's the worst hangover cure you've ever tried?",
    "Have you ever lied about how much you could drink?",
    "What's the most embarrassing thing you've posted online while drunk?",
    "Have you ever woken up in a place you didn't recognize?",
    "What's the longest drinking session you've ever had?",
    "Have you ever cried in public while drunk?",
    "What's your go-to drunk food order at 3am?",
    "Have you ever made a drunk promise you actually had to keep?",
  ],
  friends: [
    "Who in this group are you closest to and why?",
    "What's something you admire about the person to your left?",
    "Have you ever been jealous of a friend's success?",
    "What's the biggest sacrifice you've made for a friend?",
    "Have you ever had a falling-out with a close friend? What happened?",
    "What's one thing you've never told your best friend?",
    "Who in this room would you call first in an emergency?",
    "Have you ever lied to protect a friend from the truth?",
    "What's the most annoying habit of the person sitting across from you?",
    "Have you ever felt left out by this friend group?",
    "What's the funniest memory you share with someone in this room?",
    "Have you ever talked about someone in this room behind their back?",
    "What's one thing you wish you could change about your friendships?",
    "Who in this room gives the best advice?",
    "Have you ever pretended to like someone's partner for the sake of friendship?",
  ],
  random: [],
}

function getPrompts(categories: Category[]): string[] {
  if (categories.includes('random') || categories.length === 0) {
    const allCats = Object.keys(PROMPTS).filter(k => k !== 'random') as Category[]
    const pool: string[] = []
    for (const c of allCats) pool.push(...PROMPTS[c])
    return shuffle([...new Set(pool)])
  }
  const pool: string[] = []
  for (const c of categories) pool.push(...PROMPTS[c])
  return shuffle([...new Set(pool)])
}

/* ---- Category Selection (multi-select) ---- */
function CategorySelect({ onNext }: { onNext: (cats: Category[]) => void }) {
  const [selected, setSelected] = useState<Set<Category>>(new Set())

  const toggle = (id: Category) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (id === 'random') {
        return new Set(['random'] as Category[])
      }
      next.delete('random')
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const canContinue = selected.size > 0

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '560px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>
            Choose Categories
          </h2>
          <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Select one or more categories
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
          {CATEGORY_OPTIONS.map((opt, i) => {
            const isSel = selected.has(opt.id)
            return (
              <button key={opt.id}
                onClick={() => toggle(opt.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: isSel ? '#1e1e22' : '#111113',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '12px', padding: '12px', height: '56px', cursor: 'pointer',
                  transition: 'background 0.18s, transform 0.15s',
                  animation: `screen-enter 0.4s var(--ease-out) ${0.07 + Math.floor(i / 2) * 0.06}s both`,
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '16px',
                  background: isSel ? 'rgba(237,130,81,0.15)' : 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <img src={opt.icon} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                </div>
                <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '17px', color: isSel ? '#fff' : 'rgba(255,255,255,0.55)', textAlign: 'left', whiteSpace: 'nowrap', transition: 'color 0.18s' }}>
                  {opt.label}
                </span>
                {isSel && (
                  <div style={{ marginLeft: 'auto', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <button
          className={canContinue ? 'game-btn-primary' : ''}
          onClick={() => canContinue && onNext([...selected])}
          style={{
            width: '200px', background: canContinue ? '#dc2827' : '#333',
            border: 'none', borderRadius: '999px', padding: '12px 18px',
            fontFamily: "'Staatliches', sans-serif", fontSize: '16px',
            color: canContinue ? '#fff' : '#666', cursor: canContinue ? 'pointer' : 'not-allowed',
            textAlign: 'center', letterSpacing: '0.05em', transition: 'background 0.2s',
          }}
        >
          NEXT
        </button>
      </div>
    </div>
  )
}

/* ---- Sip or Spill Card ---- */
function SipOrSpillCard({ prompt, flipped, onFlip }: { prompt: string; flipped: boolean; onFlip: () => void }) {
  const { wrapperStyle, cardStyle } = useScaledCard(340, 460)
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
          background: '#ffd5f4', borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(251,55,87,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px',
        }}>
          <div style={{
            width: 'calc(100% - 16px)', height: 'calc(100% - 16px)',
            background: '#fb3757', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #ffd5f4',
          }}>
            <p style={{
              fontFamily: "'Freckle Face', cursive", fontSize: '52px', color: '#fff',
              lineHeight: 1.1, margin: 0, textAlign: 'center',
            }}>
              Sip or Spill
            </p>
          </div>
        </div>
        {/* Back */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: '#ffd5f4', borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(251,55,87,0.25)',
          padding: '12px',
        }}>
          <div style={{
            width: '100%', height: '100%',
            border: '2px solid #fb3757', borderRadius: '10px',
            display: 'flex', flexDirection: 'column', position: 'relative',
            boxSizing: 'border-box',
          }}>
            {/* Sip header top left */}
            <div style={{ padding: '20px 20px 0' }}>
              <p style={{ fontFamily: "'Freckle Face', cursive", fontSize: '24px', color: '#fb3757', margin: 0 }}>
                Sip
              </p>
            </div>
            {/* Question text centered */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
              <p style={{
                fontFamily: "'Satoshi', sans-serif", fontSize: '20px', fontWeight: 700, color: '#181b25',
                lineHeight: 1.4, margin: 0, textTransform: 'uppercase', textAlign: 'center',
              }}>
                {prompt}
              </p>
            </div>
            {/* Sip or Spill bottom right */}
            <div style={{ padding: '0 20px 20px', textAlign: 'right' }}>
              <p style={{ fontFamily: "'Freckle Face', cursive", fontSize: '14px', color: '#fb3757', margin: 0 }}>
                Sip or Spill
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

/* ---- Gameplay ---- */
function GamePlay({ players, cardIndex, totalCards, skipCount, prompt, onSkip, onNext, onPlayAgain, onBrowseGames }: {
  players: Player[]; cardIndex: number; totalCards: number; skipCount: number
  prompt: string; onSkip: () => void; onNext: () => void
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
            You played all {totalCards} prompts
          </p>
        </div>
        <div style={{ background: '#18181b', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '20px 32px' }}>
          {[
            { count: totalCards, label: 'PROMPTS' },
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
        {/* Mini card */}
        <div className="done-card" style={{ width: '140px', height: '190px', background: '#ffd5f4', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(251,55,87,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
          <div style={{ width: '100%', height: '100%', background: '#fb3757', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
            <p style={{ fontFamily: "'Freckle Face', cursive", fontSize: '20px', color: '#fff', lineHeight: 1.1, margin: 0, textAlign: 'center' }}>Sip or Spill</p>
          </div>
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
      <SipOrSpillCard prompt={prompt} flipped={flipped} onFlip={() => setFlipped(true)} />
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
            NEXT CARD
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

/* ---- Root ---- */
type Step = 'categories' | 'playerSetup' | 'deckSize' | 'customCards' | 'getReady' | 'game'

export default function SipOrSpillGame({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('categories')
  const [categories, setCategories] = useState<Category[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [totalCards, setTotalCards] = useState(0)
  const [cardIndex, setCardIndex] = useState(0)
  const [playerIndex, setPlayerIndex] = useState(0)
  const [skipCount, setSkipCount] = useState(0)
  const [prompts, setPrompts] = useState<string[]>([])
  const [customCards, setCustomCards] = useState<string[]>([])

  const currentPlayer = players.length > 0 ? players[playerIndex % players.length] : null
  const currentPrompt = prompts[cardIndex] ?? ''

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
    const generated = getPrompts(categories)
    const allPrompts = shuffle([...custom, ...generated])
    const trimmed = totalCards > 0 ? allPrompts.slice(0, totalCards) : allPrompts
    setPrompts(trimmed)
    if (totalCards > trimmed.length) setTotalCards(trimmed.length)
    setCardIndex(0)
    setPlayerIndex(0)
    setStep('getReady')
  }

  const handlePlayAgain = useCallback(() => {
    const generated = getPrompts(categories)
    const allPrompts = shuffle([...customCards, ...generated])
    const trimmed = totalCards > 0 ? allPrompts.slice(0, totalCards) : allPrompts
    setPrompts(trimmed)
    setCardIndex(0)
    setPlayerIndex(0)
    setSkipCount(0)
    setStep('getReady')
  }, [categories, customCards, totalCards])

  return (
    <div className="game-fullscreen">
      <GameNav onBack={onClose} />

      {step === 'categories' && <CategorySelect onNext={cats => { setCategories(cats); setStep('playerSetup') }} />}

      {step === 'playerSetup' && (
        <SharedPlayerSetup
          initialPlayers={players}
          skipLabel="SKIP FOR NOW"
          onSkip={() => setStep('deckSize')}
          onNext={p => { setPlayers(p); setStep('deckSize') }}
        />
      )}

      {step === 'deckSize' && (
        <SharedDeckSize onBack={() => setStep('playerSetup')} onNext={n => { setTotalCards(n); setStep('customCards') }} nextLabel="NEXT" />
      )}

      {step === 'customCards' && (
        <SharedCustomCards maxCards={totalCards} onBack={() => setStep('deckSize')} onNext={startGame} />
      )}

      {step === 'getReady' && <SharedGetReady player={currentPlayer} onReady={goToGame} />}

      {step === 'game' && (
        <GamePlay
          players={players} cardIndex={cardIndex} totalCards={totalCards}
          skipCount={skipCount} prompt={currentPrompt}
          onSkip={handleSkip} onNext={handleNext}
          onPlayAgain={handlePlayAgain} onBrowseGames={onClose}
        />
      )}

      <GameFooter />
    </div>
  )
}
