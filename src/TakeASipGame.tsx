import { useState, useCallback } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
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

type Category = 'funny' | 'relationships' | 'spicy' | 'party' | 'drinking' | 'school' | 'work' | 'travel' | 'green-flags' | 'red-flags' | 'random'

const CATEGORY_OPTIONS: { id: Category; label: string; icon: string }[] = [
  { id: 'funny',         label: 'Funny',         icon: `${CDN}/funny.svg` },
  { id: 'relationships', label: 'Relationships',  icon: `${CDN}/relationship.svg` },
  { id: 'spicy',         label: 'Spicy',          icon: `${CDN}/spicy.svg` },
  { id: 'party',         label: 'Party',          icon: '/icons/party.svg' },
  { id: 'drinking',      label: 'Drinking',       icon: `${CDN}/drinking.svg` },
  { id: 'school',        label: 'School',         icon: `${CDN}/school.svg` },
  { id: 'work',          label: 'Work',           icon: `${CDN}/work.svg` },
  { id: 'travel',        label: 'Travel',         icon: `${CDN}/travel.svg` },
  { id: 'green-flags',   label: 'Green Flags',    icon: `${CDN}/green-flag.svg` },
  { id: 'red-flags',     label: 'Red Flags',      icon: `${CDN}/red-flag.svg` },
  { id: 'random',        label: 'Random',         icon: '/icons/random.svg' },
]

const PROMPTS: Record<Category, string[]> = {
  funny: [
    "Take a sip if you've ever laughed so hard you snorted in public.",
    "Take a sip if you've ever waved back at someone who wasn't waving at you.",
    "Take a sip if you've ever walked into a glass door.",
    "Take a sip if you've ever sent a text to the wrong person.",
    "Take a sip if you've ever said 'you too' when a waiter said 'enjoy your meal.'",
    "Take a sip if you've ever tripped over nothing and blamed it on an invisible object.",
    "Take a sip if you've ever laughed at a completely inappropriate moment.",
    "Take a sip if you've ever forgotten someone's name two seconds after they told you.",
    "Take a sip if you've ever accidentally liked a very old photo while stalking someone.",
    "Take a sip if you've ever tried to push a pull door in front of people.",
    "Take a sip if you've ever been caught talking to yourself.",
    "Take a sip if you've ever faked a phone call to avoid someone.",
    "Take a sip if you've ever accidentally called a teacher 'mum' or 'dad.'",
    "Take a sip if you've ever pretended to text to look busy.",
    "Take a sip if you've ever told a joke that nobody laughed at.",
  ],
  relationships: [
    "Take a sip if you've ever stayed up all night texting someone you liked.",
    "Take a sip if you've ever been in a situationship.",
    "Take a sip if you've ever gone back to an ex you swore you were done with.",
    "Take a sip if you've ever said 'I love you' first.",
    "Take a sip if you've ever cried over someone who didn't deserve your tears.",
    "Take a sip if you've ever been ghosted.",
    "Take a sip if you've ever typed a long message and then deleted it all.",
    "Take a sip if you've ever been jealous but acted like you weren't.",
    "Take a sip if you've ever checked your partner's phone.",
    "Take a sip if you've ever caught feelings for a close friend.",
    "Take a sip if you've ever had a crush on someone way out of your league.",
    "Take a sip if you've ever been on a date you wanted to escape immediately.",
    "Take a sip if you've ever kept a gift from an ex.",
    "Take a sip if you've ever been dumped over text.",
    "Take a sip if you've ever had a secret relationship.",
  ],
  spicy: [
    "Take a sip if you've ever had a dream about someone in this room.",
    "Take a sip if you've ever kissed someone you just met that night.",
    "Take a sip if you've ever sent a risky text you immediately regretted.",
    "Take a sip if you've ever lied about your body count.",
    "Take a sip if you've ever slid into someone's DMs at 2am.",
    "Take a sip if you've ever flirted with someone just because you were bored.",
    "Take a sip if you've ever been someone's rebound and didn't know it.",
    "Take a sip if you've ever kissed someone you shouldn't have.",
    "Take a sip if you've ever been attracted to a friend's partner.",
    "Take a sip if you've ever used a dating app while sitting next to someone you're dating.",
    "Take a sip if you've ever sent a selfie to the wrong person.",
    "Take a sip if you've ever had a secret you'll take to the grave.",
    "Take a sip if you've ever gone on a date just for the free meal.",
    "Take a sip if you've ever had a one-night stand.",
    "Take a sip if you've ever told someone you loved them when you didn't.",
  ],
  party: [
    "Take a sip if you've ever blacked out at a party.",
    "Take a sip if you've ever danced on a table or bar.",
    "Take a sip if you've ever thrown up at a party.",
    "Take a sip if you've ever lost your phone on a night out.",
    "Take a sip if you've ever crashed a party you weren't invited to.",
    "Take a sip if you've ever karaoke'd in front of strangers.",
    "Take a sip if you've ever been the last one standing at a party.",
    "Take a sip if you've ever woken up somewhere and had no idea how you got there.",
    "Take a sip if you've ever texted your ex while drunk at a party.",
    "Take a sip if you've ever been kicked out of a bar or club.",
    "Take a sip if you've ever started a conga line.",
    "Take a sip if you've ever pregamed harder than the actual event.",
    "Take a sip if you've ever made a speech at a party nobody asked for.",
    "Take a sip if you've ever broken something at someone else's house party.",
    "Take a sip if you've ever hidden in a bathroom to avoid someone at a party.",
  ],
  drinking: [
    "Take a sip if you've ever said 'I'm never drinking again' and lied.",
    "Take a sip if you've ever drunk-dialled someone at 3am.",
    "Take a sip if you've ever mixed drinks and deeply regretted it the next morning.",
    "Take a sip if you've ever thrown up in a public place.",
    "Take a sip if you've ever been carried home by your friends.",
    "Take a sip if you've ever started a fight while drunk.",
    "Take a sip if you've ever lost something valuable on a night out.",
    "Take a sip if you've ever woken up still holding your drink from the night before.",
    "Take a sip if you've ever had a hangover that lasted more than a day.",
    "Take a sip if you've ever drunk-texted your boss.",
    "Take a sip if you've ever pregamed so hard you never made it out.",
    "Take a sip if you've ever lied about how much you drank.",
    "Take a sip if you've ever challenged someone to a drinking contest and lost.",
    "Take a sip if you've ever ordered food at 3am while completely wasted.",
    "Take a sip if you've ever been the designated driver and hated every second.",
  ],
  school: [
    "Take a sip if you've ever cheated on a test.",
    "Take a sip if you've ever had a crush on a teacher.",
    "Take a sip if you've ever skipped an entire day of classes.",
    "Take a sip if you've ever pretended to be sick to stay home.",
    "Take a sip if you've ever been sent to the principal's office.",
    "Take a sip if you've ever plagiarized an essay.",
    "Take a sip if you've ever cried because of a bad grade.",
    "Take a sip if you've ever pulled an all-nighter before an exam.",
    "Take a sip if you've ever fallen asleep in class.",
    "Take a sip if you've ever been caught passing notes in class.",
    "Take a sip if you've ever had a breakdown in the school bathroom.",
    "Take a sip if you've ever been the class clown.",
    "Take a sip if you've ever made up an excuse for missing homework.",
    "Take a sip if you've ever used your phone under the desk during a lecture.",
    "Take a sip if you've ever been in detention.",
  ],
  work: [
    "Take a sip if you've ever called in sick when you were perfectly healthy.",
    "Take a sip if you've ever cried at work.",
    "Take a sip if you've ever had a crush on a coworker.",
    "Take a sip if you've ever applied for a job you were completely unqualified for.",
    "Take a sip if you've ever talked badly about your boss behind their back.",
    "Take a sip if you've ever fallen asleep at your desk.",
    "Take a sip if you've ever sat through a meeting that should have been an email.",
    "Take a sip if you've ever pretended to work while doing absolutely nothing.",
    "Take a sip if you've ever quit a job dramatically.",
    "Take a sip if you've ever stolen office supplies.",
    "Take a sip if you've ever taken a two-hour lunch and hoped nobody noticed.",
    "Take a sip if you've ever been reprimanded by your manager.",
    "Take a sip if you've ever gone to work hungover.",
    "Take a sip if you've ever lied on your CV.",
    "Take a sip if you've ever had a job you absolutely hated but stayed anyway.",
  ],
  travel: [
    "Take a sip if you've ever missed a flight.",
    "Take a sip if you've ever been to another continent.",
    "Take a sip if you've ever gone on a solo trip.",
    "Take a sip if you've ever slept in an airport.",
    "Take a sip if you've ever gotten completely lost in a foreign country.",
    "Take a sip if you've ever eaten something abroad you couldn't identify.",
    "Take a sip if you've ever been upgraded on a flight.",
    "Take a sip if you've ever had a holiday romance.",
    "Take a sip if you've ever booked a trip on impulse.",
    "Take a sip if you've ever cried leaving a place you loved.",
    "Take a sip if you've ever pretended to speak a language you didn't know.",
    "Take a sip if you've ever lost your luggage.",
    "Take a sip if you've ever been scammed by a tourist trap.",
    "Take a sip if you've ever gone skydiving, bungee jumping, or something extreme.",
    "Take a sip if you've ever visited more than five countries.",
  ],
  'green-flags': [
    "Take a sip if you always text back within a reasonable time.",
    "Take a sip if you remember people's birthdays without Facebook reminding you.",
    "Take a sip if you've ever apologised first even when you weren't entirely wrong.",
    "Take a sip if you always ask if someone got home safe.",
    "Take a sip if you've ever stayed up late to comfort a friend.",
    "Take a sip if you always offer to help with the dishes.",
    "Take a sip if you've ever given a genuine compliment to a stranger.",
    "Take a sip if you actually listen when people vent instead of waiting to talk.",
    "Take a sip if you hold the door open for people behind you.",
    "Take a sip if you've ever planned a surprise for someone just to see them smile.",
    "Take a sip if you always keep your promises.",
    "Take a sip if you share your food without being asked.",
    "Take a sip if you've ever defended someone who wasn't in the room.",
    "Take a sip if you put your phone away during conversations.",
    "Take a sip if you tip well at restaurants.",
  ],
  'red-flags': [
    "Take a sip if you've ever read a message and purposely not replied for hours.",
    "Take a sip if you've ever lied about where you were.",
    "Take a sip if you've ever gone through someone's phone without them knowing.",
    "Take a sip if you've ever said 'I'm fine' when you definitely were not fine.",
    "Take a sip if you've ever talked badly about your best friend behind their back.",
    "Take a sip if you've ever kept texting your ex while in a new relationship.",
    "Take a sip if you've ever cancelled plans and then posted on social media.",
    "Take a sip if you've ever given someone the silent treatment.",
    "Take a sip if you've ever said 'I don't care' when you clearly did.",
    "Take a sip if you've ever blamed someone else for something you did.",
    "Take a sip if you've ever screenshot a private conversation to share it.",
    "Take a sip if you've ever flirted with someone's partner right in front of them.",
    "Take a sip if you've ever pretended to be busy to avoid making plans.",
    "Take a sip if you've ever kept score in a friendship or relationship.",
    "Take a sip if you've ever left someone on read just to make a point.",
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
                  <div style={{ marginLeft: 'auto', width: '20px', height: '20px', borderRadius: '50%', background: '#ed8251', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
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

/* ---- Take A Sip Card ---- */
function TakeASipCard({ prompt, flipped, onFlip }: { prompt: string; flipped: boolean; onFlip: () => void }) {
  const ORANGE = '#eb5e28'
  const BG = '#ffecd1'

  return (
    <div
      onClick={!flipped ? onFlip : undefined}
      style={{ width: '340px', height: '460px', perspective: '1000px', cursor: flipped ? 'default' : 'pointer' }}
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
          boxShadow: '0 24px 60px rgba(235,94,40,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px',
        }}>
          <p style={{
            fontFamily: "'Gasoek One', sans-serif", fontSize: '48px', color: ORANGE,
            lineHeight: 1.1, margin: 0, textTransform: 'uppercase', textAlign: 'center',
          }}>
            TAKE A SIP IF ...
          </p>
        </div>
        {/* Back */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: BG, borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(235,94,40,0.25)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Small header */}
          <div style={{ padding: '24px 24px 0' }}>
            <p style={{ fontFamily: "'Gasoek One', sans-serif", fontSize: '14px', color: ORANGE, lineHeight: 1.2, margin: 0, textTransform: 'uppercase' }}>
              TAKE A SIP IF ...
            </p>
          </div>
          {/* Prompt text */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 28px' }}>
            <p style={{
              fontFamily: "'Anton SC', sans-serif", fontSize: '24px', color: ORANGE,
              lineHeight: 1.3, margin: 0, textTransform: 'uppercase', textAlign: 'center', fontWeight: 400,
            }}>
              {prompt.replace(/^take a sip if /i, '')}
            </p>
          </div>
          {/* Three dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', paddingBottom: '28px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ORANGE }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ORANGE }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ORANGE }} />
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
        <div className="done-card" style={{ width: '140px', height: '190px', background: '#ffecd1', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(235,94,40,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
          <p style={{ fontFamily: "'Gasoek One', sans-serif", fontSize: '18px', color: '#eb5e28', lineHeight: 1.1, margin: 0, textAlign: 'center', textTransform: 'uppercase' }}>TAKE A SIP IF ...</p>
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
      <TakeASipCard prompt={prompt} flipped={flipped} onFlip={() => setFlipped(true)} />
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

export default function TakeASipGame({ onClose }: { onClose: () => void }) {
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
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
