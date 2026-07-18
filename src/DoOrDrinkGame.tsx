import { useState, useCallback } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import { useScaledCard } from './hooks/useCardScale'
import SharedDeckSize from './components/DeckSize'
import SharedCustomCards from './components/CustomCards'
import SharedGetReady from './components/GetReady'
import { GameNav, GameFooter } from './components/GameShell'
import { shuffle, getShuffledDeck } from './utils/deckShuffle'

/* ---- Cloudinary assets ---- */
const CDN = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets'

type Category = 'funny' | 'spicy' | 'party' | 'drinking' | 'dares' | 'social' | 'random'

const CATEGORY_OPTIONS: { id: Category; label: string; icon: string }[] = [
  { id: 'funny',    label: 'Funny',    icon: `${CDN}/funny.svg` },
  { id: 'spicy',    label: 'Spicy',    icon: `${CDN}/spicy.svg` },
  { id: 'party',    label: 'Party',    icon: '/icons/party.svg' },
  { id: 'drinking', label: 'Drinking', icon: `${CDN}/drinking.svg` },
  { id: 'dares',    label: 'Dares',    icon: `${CDN}/spicy.svg` },
  { id: 'social',   label: 'Social',   icon: `${CDN}/relationship.svg` },
  { id: 'random',   label: 'Random',   icon: '/icons/random.svg' },
]

const PROMPTS: Record<Category, string[]> = {
  funny: [
    "Do your best impression of a celebrity everyone will recognise. Or drink.",
    "Talk in an accent for the next three rounds. Or drink.",
    "Let someone draw a moustache on your face with a marker. Or drink.",
    "Do 10 push-ups right now. Or drink.",
    "Let someone go through your camera roll for 30 seconds. Or drink.",
    "Speak in a baby voice until the next card. Or drink.",
    "Do your best catwalk across the room. Or drink.",
    "Try to make the person next to you laugh in 15 seconds. Or drink.",
    "Let the group pick an embarrassing photo of you to post on your story. Or drink.",
    "Sing the chorus of the last song you listened to. Or drink.",
    "Act out a movie scene and let everyone guess. Or drink.",
    "Do a TikTok dance right now with no music. Or drink.",
    "Talk without closing your mouth for the next 30 seconds. Or drink.",
    "Prank call the fifth contact in your phone. Or drink.",
    "Let someone type and send a message from your phone. Or drink.",
  ],
  spicy: [
    "Text your last contact: 'I need your help burying something.' Or drink.",
    "Let the group read your last 5 DMs. Or drink.",
    "Send a flirty text to the third person in your contacts. Or drink.",
    "Show the group your screen time report. Or drink.",
    "Let someone post something on your social media story. Or drink.",
    "Reveal the last person you stalked on Instagram. Or drink.",
    "Read the last voice note you sent out loud. Or drink.",
    "Show the last photo you saved from social media. Or drink.",
    "Text your ex 'I miss the way you smell.' Or drink.",
    "Let the group see your most recent search history. Or drink.",
    "Send 'I know what you did' to a random contact. Or drink.",
    "Share the most embarrassing photo in your gallery. Or drink.",
    "Call someone and tell them you're getting married. Or drink.",
    "Give your phone to the person on your right for 60 seconds. Or drink.",
    "Show the group your 'hidden' photo album. Or drink.",
  ],
  party: [
    "Start a conga line around the room. Or drink.",
    "Stand on a chair and give a dramatic toast. Or drink.",
    "Challenge someone to a dance battle right now. Or drink.",
    "Be the DJ and pick the next three songs everyone has to vibe to. Or drink.",
    "Do a handstand against the wall for 10 seconds. Or drink.",
    "Swap an item of clothing with the person to your left. Or drink.",
    "Make up a rap about the person across from you. Or drink.",
    "Do karaoke to a song chosen by the group — no backing out. Or drink.",
    "Speak only in song lyrics for the next 3 rounds. Or drink.",
    "Let someone style your hair however they want. Or drink.",
    "Belly flop onto the nearest couch or cushion. Or drink.",
    "Do the worm across the floor. Or drink.",
    "Let the group give you a new nickname for the rest of the night. Or drink.",
    "Slow dance with an imaginary partner for 30 seconds. Or drink.",
    "Serenade the person to your right with any love song. Or drink.",
  ],
  drinking: [
    "Finish whatever's in your glass right now. Or take two sips instead.",
    "Waterfall! Start drinking and everyone follows — you decide when to stop. Or drink double.",
    "Take a sip every time someone laughs for the next 2 minutes. Or chug now.",
    "Mix two drinks together and take a sip of the creation. Or drink your own.",
    "Take a sip with your non-dominant hand for the rest of the game. Or drink now.",
    "Cheers the person across from you and both take a sip. Or drink alone.",
    "Make a toast and everyone drinks. Or only you drink double.",
    "Play thumb master — last person to put their thumb on the table drinks. Or you drink.",
    "Take a sip for every person in the room. Or do a dare from the group.",
    "Close your eyes and point — whoever you point at, you both drink. Or drink alone.",
    "Take a sip without using your hands. Or drink normally twice.",
    "Name 5 cocktails in 10 seconds. Fail? Drink. Or just drink now.",
    "The oldest person in the room assigns you a drink. Or choose your own double.",
    "Drink every time you make eye contact with someone for 2 minutes. Or chug now.",
    "Rate everyone's drink from best to worst. Whoever's last — they pick your next sip. Or drink.",
  ],
  dares: [
    "Let someone tickle you for 15 seconds without fighting back. Or drink.",
    "Eat a spoonful of something spicy. Or drink.",
    "Hold an ice cube in your hand until it melts. Or drink.",
    "Let someone write something on your forehead. Or drink.",
    "Do a plank for 30 seconds. Or drink.",
    "Let someone give you a makeover with whatever's available. Or drink.",
    "Wear your shirt inside out for the rest of the game. Or drink.",
    "Let someone pick a dare from the internet for you. Or drink.",
    "Balance a spoon on your nose for 20 seconds. Or drink.",
    "Eat a piece of food blindfolded — the group chooses what. Or drink.",
    "Run outside and yell something the group decides. Or drink.",
    "Do a split or attempt a split. Or drink.",
    "Keep a straight face while everyone tries to make you laugh for 30 seconds. Or drink.",
    "Let someone draw on your arm with a permanent marker. Or drink.",
    "Do jumping jacks while singing a nursery rhyme. Or drink.",
  ],
  social: [
    "Post a story of you playing this game right now. Or drink.",
    "Call a friend and tell them you love them. Or drink.",
    "Send a voice note to someone saying 'I've been thinking about you.' Or drink.",
    "Let someone compose a tweet and post it from your account. Or drink.",
    "Share the last compliment you gave someone. Or drink.",
    "Text the first person in your contacts 'We need to talk.' Or drink.",
    "Give every person in the room a genuine compliment. Or drink.",
    "Follow the first person that appears in your Instagram suggestions. Or drink.",
    "Share your most used emoji and explain why. Or drink.",
    "Record a 15-second video of yourself dancing and send it to someone. Or drink.",
    "Change your profile picture to something the group chooses for 24 hours. Or drink.",
    "Let someone go live on your account for 30 seconds. Or drink.",
    "Send a random GIF to the last person you texted. Or drink.",
    "Add someone random on social media and send them a compliment. Or drink.",
    "Share the last meme you saved with the group. Or drink.",
  ],
  random: [],
}

function getPrompts(categories: Category[]): string[] {
  if (categories.includes('random') || categories.length === 0) {
    const allCats = Object.keys(PROMPTS).filter(k => k !== 'random') as Category[]
    const pool: string[] = []
    for (const c of allCats) pool.push(...PROMPTS[c])
    return getShuffledDeck([...new Set(pool)], 'do-or-drink')
  }
  const pool: string[] = []
  for (const c of categories) pool.push(...PROMPTS[c])
  return getShuffledDeck([...new Set(pool)], 'do-or-drink')
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
                  width: '32px', height: '32px', borderRadius: '50%',
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

/* ---- Do Or Drink Card ---- */
function DoOrDrinkCard({ prompt, flipped, onFlip }: { prompt: string; flipped: boolean; onFlip: () => void }) {
  const BG = '#d1ffd5'
  const PURPLE = '#5228eb'
  const { wrapperStyle, cardStyle } = useScaledCard(340, 460)

  return (
    <div style={{ ...wrapperStyle, perspective: '1000px' }}>
    <div
      onClick={!flipped ? onFlip : undefined}
      className="game-card" style={{ ...cardStyle, cursor: flipped ? 'default' : 'pointer' }}
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
          background: BG, borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(82,40,235,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px',
        }}>
          <p style={{
            fontFamily: "'Fredericka the Great', cursive", fontSize: '52px', color: PURPLE,
            lineHeight: 1.05, margin: 0, textTransform: 'uppercase', textAlign: 'center',
          }}>
            DO OR DRINK
          </p>
        </div>
        {/* Back */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: BG, borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(82,40,235,0.25)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Small header top left */}
          <div style={{ padding: '24px 24px 0' }}>
            <p style={{ fontFamily: "'Fredericka the Great', cursive", fontSize: '16px', color: PURPLE, lineHeight: 1.2, margin: 0, textTransform: 'uppercase' }}>
              DO OR DRINK
            </p>
          </div>
          {/* Challenge text centered */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 28px' }}>
            <p style={{
              fontFamily: "'Satoshi', sans-serif", fontSize: '20px', fontWeight: 700, color: '#000',
              lineHeight: 1.4, margin: 0, textAlign: 'center',
            }}>
              {prompt}
            </p>
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
        <div className="done-card" style={{ width: '140px', height: '190px', background: '#d1ffd5', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(82,40,235,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
          <p style={{ fontFamily: "'Fredericka the Great', cursive", fontSize: '22px', color: '#5228eb', lineHeight: 1.1, margin: 0, textAlign: 'center', textTransform: 'uppercase' }}>DO OR DRINK</p>
        </div>
        <div className="done-btns" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="game-btn" onClick={onBrowseGames} style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>BROWSE GAMES</button>
          <button className="game-btn-primary" onClick={onPlayAgain} style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>PLAY AGAIN</button>
        </div>
      </div>
    )
  }

  const BG = '#d1ffd5'

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '40px', position: 'relative', zIndex: 2 }}>
      <DoOrDrinkCard prompt={prompt} flipped={flipped} onFlip={() => setFlipped(true)} />
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

export default function DoOrDrinkGame({ onClose }: { onClose: () => void }) {
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
