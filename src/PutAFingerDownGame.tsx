import { useState, useCallback } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import { useScaledCard } from './hooks/useCardScale'
import SharedDeckSize from './components/DeckSize'
import SharedCustomCards from './components/CustomCards'
import SharedGetReady from './components/GetReady'
import { GameNav, GameFooter } from './components/GameShell'
import { shuffle, getShuffledDeck } from './utils/deckShuffle'

/* ─── Cloudinary assets ─── */
const CDN = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets'
const PAFD_CARD = `${CDN}/put-a-finger-down.png`

type Category = 'funny' | 'relationships' | 'friends' | 'spicy' | 'party' | 'school' | 'work' | 'drinking' | 'travel' | 'random'

const CATEGORY_OPTIONS: { id: Category; label: string; emoji: string; icon: string }[] = [
  { id: 'funny',         label: 'Funny',         emoji: '😂', icon: `${CDN}/funny.svg` },
  { id: 'relationships', label: 'Relationships',  emoji: '❤️', icon: `${CDN}/relationship.svg` },
  { id: 'friends',       label: 'Friends',        emoji: '👯', icon: '/icons/friends.svg' },
  { id: 'spicy',         label: 'Spicy',          emoji: '🌶️', icon: `${CDN}/spicy.svg` },
  { id: 'party',         label: 'Party',          emoji: '🎉', icon: '/icons/party.svg' },
  { id: 'school',        label: 'School',         emoji: '🎓', icon: `${CDN}/school.svg` },
  { id: 'work',          label: 'Work',           emoji: '💼', icon: `${CDN}/work.svg` },
  { id: 'drinking',      label: 'Drinking',       emoji: '🍻', icon: `${CDN}/drinking.svg` },
  { id: 'travel',        label: 'Travel',         emoji: '🌍', icon: `${CDN}/travel.svg` },
  { id: 'random',        label: 'Random',         emoji: '🎲', icon: '/icons/random.svg' },
]

const PROMPTS: Record<Category, string[]> = {
  funny: [
    "Put a finger down if you've ever laughed so hard you cried.",
    "Put a finger down if you've ever snorted while laughing.",
    "Put a finger down if you've ever walked into a glass door.",
    "Put a finger down if you've ever waved back at someone who wasn't waving at you.",
    "Put a finger down if you've ever sent a text to the wrong person.",
    "Put a finger down if you've ever tripped in public and pretended nothing happened.",
    "Put a finger down if you've ever said 'you too' to a waiter who said 'enjoy your meal.'",
    "Put a finger down if you've ever forgotten someone's name right after they told you.",
    "Put a finger down if you've ever laughed at a completely inappropriate moment.",
    "Put a finger down if you've ever accidentally liked a very old post while stalking someone.",
    "Put a finger down if you've ever been caught talking to yourself.",
    "Put a finger down if you've ever tried to push a pull door in front of people.",
    "Put a finger down if you've ever accidentally called a teacher 'mum' or 'dad.'",
    "Put a finger down if you've ever pretended to text to avoid someone.",
    "Put a finger down if you've ever faked a phone call to get out of a situation.",
  ],
  relationships: [
    "Put a finger down if you've ever stayed up all night talking to someone you liked.",
    "Put a finger down if you've ever been in a situationship.",
    "Put a finger down if you've ever gone back to an ex you swore you were done with.",
    "Put a finger down if you've ever said 'I love you' first.",
    "Put a finger down if you've ever cried over someone who didn't deserve it.",
    "Put a finger down if you've ever been ghosted.",
    "Put a finger down if you've ever written a long text and then deleted it.",
    "Put a finger down if you've ever been jealous but pretended you weren't.",
    "Put a finger down if you've ever checked your partner's phone.",
    "Put a finger down if you've ever caught feelings for a friend.",
    "Put a finger down if you've ever had a crush on someone way out of your league.",
    "Put a finger down if you've ever been on a date you wanted to leave immediately.",
    "Put a finger down if you've ever kept a gift from an ex.",
    "Put a finger down if you've ever been dumped by text.",
    "Put a finger down if you've ever had a secret relationship.",
  ],
  friends: [
    "Put a finger down if you've ever talked badly about a friend behind their back.",
    "Put a finger down if you've ever pretended to be busy to avoid making plans.",
    "Put a finger down if you've ever lied to a friend to protect their feelings.",
    "Put a finger down if you've ever been the third wheel.",
    "Put a finger down if you've ever lost a friend over something stupid.",
    "Put a finger down if you've ever screenshot a friend's conversation to send to someone else.",
    "Put a finger down if you've ever cancelled plans and then been seen somewhere else.",
    "Put a finger down if you've ever said 'I'm on my way' when you hadn't left yet.",
    "Put a finger down if you've ever had a friend you only hang out with when drinking.",
    "Put a finger down if you've ever been replaced by a new friend in a friend group.",
    "Put a finger down if you've ever cried in front of your friends.",
    "Put a finger down if you've ever shared a friend's secret with someone else.",
    "Put a finger down if you've ever had a friendship breakup that hurt more than a regular one.",
    "Put a finger down if you've ever pretended to like someone your friend was dating.",
    "Put a finger down if you've ever been in a group chat that was talking about someone in the group.",
  ],
  spicy: [
    "Put a finger down if you've ever had a dream about someone in this room.",
    "Put a finger down if you've ever made out with someone you just met.",
    "Put a finger down if you've ever sent a risky text you immediately regretted.",
    "Put a finger down if you've ever been caught doing something you shouldn't have been doing.",
    "Put a finger down if you've ever had a secret you'll take to the grave.",
    "Put a finger down if you've ever lied about your body count.",
    "Put a finger down if you've ever gone on a date just for the free meal.",
    "Put a finger down if you've ever slid into someone's DMs.",
    "Put a finger down if you've ever been someone's rebound.",
    "Put a finger down if you've ever flirted with someone just because you were bored.",
    "Put a finger down if you've ever had a one-night stand.",
    "Put a finger down if you've ever kissed someone you shouldn't have.",
    "Put a finger down if you've ever been attracted to a friend's partner.",
    "Put a finger down if you've ever used a dating app at a family gathering.",
    "Put a finger down if you've ever told someone you loved them when you didn't.",
  ],
  party: [
    "Put a finger down if you've ever blacked out at a party.",
    "Put a finger down if you've ever danced on a table or bar.",
    "Put a finger down if you've ever thrown up at a party.",
    "Put a finger down if you've ever lost your phone on a night out.",
    "Put a finger down if you've ever gone home with a stranger.",
    "Put a finger down if you've ever karaoke'd in front of strangers.",
    "Put a finger down if you've ever crashed a party you weren't invited to.",
    "Put a finger down if you've ever been the last one standing at a party.",
    "Put a finger down if you've ever woken up somewhere and not known where you were.",
    "Put a finger down if you've ever texted your ex while drunk.",
    "Put a finger down if you've ever done something at a party you've never told anyone about.",
    "Put a finger down if you've ever been kicked out of a bar or club.",
    "Put a finger down if you've ever started a conga line.",
    "Put a finger down if you've ever played beer pong and won.",
    "Put a finger down if you've ever pregamed harder than the actual event.",
  ],
  school: [
    "Put a finger down if you've ever cheated on a test.",
    "Put a finger down if you've ever had a crush on a teacher.",
    "Put a finger down if you've ever skipped school or a class.",
    "Put a finger down if you've ever pretended to be sick to stay home.",
    "Put a finger down if you've ever been sent to the principal's office.",
    "Put a finger down if you've ever plagiarized an essay.",
    "Put a finger down if you've ever cried because of a grade.",
    "Put a finger down if you've ever pulled an all-nighter studying.",
    "Put a finger down if you've ever fallen asleep in class.",
    "Put a finger down if you've ever been caught passing notes.",
    "Put a finger down if you've ever had a school bathroom breakdown.",
    "Put a finger down if you've ever been the class clown.",
    "Put a finger down if you've ever forgotten a homework assignment and made up an excuse.",
    "Put a finger down if you've ever had a teacher who changed your life.",
    "Put a finger down if you've ever been in detention.",
  ],
  work: [
    "Put a finger down if you've ever called in sick when you were perfectly fine.",
    "Put a finger down if you've ever cried at work.",
    "Put a finger down if you've ever had a crush on a coworker.",
    "Put a finger down if you've ever applied for a job you were completely unqualified for.",
    "Put a finger down if you've ever bad-mouthed your boss.",
    "Put a finger down if you've ever fallen asleep at work.",
    "Put a finger down if you've ever been in a work meeting that could've been an email.",
    "Put a finger down if you've ever pretended to work while doing nothing.",
    "Put a finger down if you've ever quit a job dramatically.",
    "Put a finger down if you've ever stolen office supplies.",
    "Put a finger down if you've ever taken a two-hour lunch break.",
    "Put a finger down if you've ever been reprimanded by a manager.",
    "Put a finger down if you've ever gone to work hungover.",
    "Put a finger down if you've ever lied on your CV.",
    "Put a finger down if you've ever had a job you absolutely hated.",
  ],
  drinking: [
    "Put a finger down if you've ever said 'I'm never drinking again' and lied.",
    "Put a finger down if you've ever drunk-dialled someone.",
    "Put a finger down if you've ever mixed drinks and deeply regretted it.",
    "Put a finger down if you've ever thrown up in a public place.",
    "Put a finger down if you've ever been carried home.",
    "Put a finger down if you've ever started a fight while drunk.",
    "Put a finger down if you've ever lost something valuable on a night out.",
    "Put a finger down if you've ever woken up still holding your drink from the night before.",
    "Put a finger down if you've ever had a hangover that lasted more than a day.",
    "Put a finger down if you've ever drunk-texted your boss.",
    "Put a finger down if you've ever pregamed so hard you never made it out.",
    "Put a finger down if you've ever lied about how much you drank.",
    "Put a finger down if you've ever challenged someone to a drinking contest.",
    "Put a finger down if you've ever ordered food at 3am while drunk.",
    "Put a finger down if you've ever been the designated driver and hated it.",
  ],
  travel: [
    "Put a finger down if you've ever missed a flight.",
    "Put a finger down if you've ever been to another continent.",
    "Put a finger down if you've ever gone on a solo trip.",
    "Put a finger down if you've ever slept in an airport.",
    "Put a finger down if you've ever gotten lost in a foreign country.",
    "Put a finger down if you've ever eaten something abroad you couldn't identify.",
    "Put a finger down if you've ever been upgraded on a flight.",
    "Put a finger down if you've ever had a holiday romance.",
    "Put a finger down if you've ever booked a trip on impulse.",
    "Put a finger down if you've ever cried leaving a place you loved.",
    "Put a finger down if you've ever pretended to speak a language you didn't know.",
    "Put a finger down if you've ever lost your luggage.",
    "Put a finger down if you've ever been scammed by a tourist trap.",
    "Put a finger down if you've ever gone skydiving, bungee jumping, or anything extreme.",
    "Put a finger down if you've ever visited more than 5 countries.",
  ],
  random: [],
}

function getPrompts(categories: Category[]): string[] {
  if (categories.includes('random') || categories.length === 0) {
    const allCats = Object.keys(PROMPTS).filter(k => k !== 'random') as Category[]
    const pool: string[] = []
    for (const c of allCats) pool.push(...PROMPTS[c])
    return getShuffledDeck([...new Set(pool)], 'put-a-finger-down')
  }
  const pool: string[] = []
  for (const c of categories) pool.push(...PROMPTS[c])
  return getShuffledDeck([...new Set(pool)], 'put-a-finger-down')
}

/* ─── Category Selection (multi-select) ─── */
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
                  transition: 'background 0.18s, border-color 0.18s, transform 0.15s',
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
                  <div className="check-pop" style={{ marginLeft: 'auto', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

/* ─── Finger Selection ─── */
function FingerSelect({ onSelect }: { onSelect: (n: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null)

  const options = [
    { n: 5, label: '5 Fingers', desc: 'Quick Game', icon: `${CDN}/5-fingers.svg` },
    { n: 10, label: '10 Fingers', desc: 'Classic — Recommended', icon: `${CDN}/10-fingers.svg` },
  ]

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '500px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>
          Starting Fingers
        </h2>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {options.map((opt, i) => {
            const isH = hovered === opt.n
            return (
              <button key={opt.n}
                onMouseEnter={() => setHovered(opt.n)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setTimeout(() => onSelect(opt.n), 80)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  background: isH ? '#1e1e22' : '#111113',
                  border: opt.n === 10 ? '1px solid #ed825144' : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '12px', padding: '14px 16px', cursor: 'pointer',
                  transform: isH ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: isH ? '0 6px 20px rgba(0,0,0,0.35)' : 'none',
                  transition: 'background 0.18s, transform 0.15s, box-shadow 0.18s',
                  animation: `screen-enter 0.4s var(--ease-out) ${0.07 + i * 0.06}s both`,
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '18px', background: isH ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src={opt.icon} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                  <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '17px', color: isH ? '#fff' : 'rgba(255,255,255,0.55)', transition: 'color 0.18s' }}>
                    {opt.label}
                  </span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.3 }}>{opt.desc}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── PAFD Card ─── */
function PAFDCard({ prompt, flipped, onFlip }: { prompt: string; flipped: boolean; onFlip: () => void }) {
  const ORANGE = '#ed8251'
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
          background: '#000', borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(237,130,81,0.25)',
        }}>
          <img src={PAFD_CARD} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
          <div style={{ position: 'absolute', left: '28px', top: '80px', right: '28px' }}>
            <p style={{
              fontFamily: "'Luckiest Guy', cursive", fontSize: '48px', color: ORANGE,
              lineHeight: 1.05, margin: 0, textTransform: 'uppercase',
            }}>
              PUT A FINGER DOWN
            </p>
          </div>
        </div>
        {/* Back */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: '#000', borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(237,130,81,0.25)',
        }}>
          <img src={PAFD_CARD} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
          {/* Small header */}
          <div style={{ position: 'absolute', left: '24px', top: '28px' }}>
            <p style={{ fontFamily: "'Luckiest Guy', cursive", fontSize: '18px', color: ORANGE, lineHeight: 1.1, margin: 0 }}>
              PUT A<br />FINGER<br />DOWN
            </p>
          </div>
          {/* Prompt text */}
          <div style={{ position: 'absolute', left: '24px', top: '100px', right: '24px', bottom: '100px', display: 'flex', alignItems: 'center' }}>
            <p style={{
              fontFamily: "'Luckiest Guy', cursive", fontSize: '26px', color: '#fff',
              lineHeight: 1.2, margin: 0, textTransform: 'uppercase',
            }}>
              {prompt.replace(/^put a finger down /i, '')}
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

/* ─── Gameplay ─── */
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
        <div className="done-card" style={{ width: '140px', height: '190px', background: '#000', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(237,130,81,0.35)', position: 'relative' }}>
          <img src={PAFD_CARD} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
          <div style={{ position: 'absolute', left: '12px', top: '24px', right: '12px' }}>
            <p style={{ fontFamily: "'Luckiest Guy', cursive", fontSize: '18px', color: '#ed8251', lineHeight: 1.05, margin: 0 }}>PUT A FINGER DOWN</p>
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
      <PAFDCard prompt={prompt} flipped={flipped} onFlip={() => setFlipped(true)} />
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

/* ─── Root ─── */
type Step = 'categories' | 'playerSetup' | 'fingers' | 'deckSize' | 'customCards' | 'getReady' | 'game'

export default function PutAFingerDownGame({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('categories')
  const [categories, setCategories] = useState<Category[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [_fingers, setFingers] = useState(10)
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
          onSkip={() => setStep('fingers')}
          onNext={p => { setPlayers(p); setStep('fingers') }}
        />
      )}

      {step === 'fingers' && <FingerSelect onSelect={n => { setFingers(n); setStep('deckSize') }} />}

      {step === 'deckSize' && (
        <SharedDeckSize onBack={() => setStep('fingers')} onNext={n => { setTotalCards(n); setStep('customCards') }} nextLabel="NEXT" />
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
