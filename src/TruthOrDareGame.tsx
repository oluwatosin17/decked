/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import { useScaledCard } from './hooks/useCardScale'
import { GameNav, GameFooter } from './components/GameShell'
import { getShuffledDeck } from './utils/deckShuffle'

type SetPlayers = React.Dispatch<React.SetStateAction<Player[]>>

/* ─── Asset URLs (permanently hosted on Cloudinary) ─── */
const HEART_FILLED     = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/heart-filled.svg'
const HEART_GAME       = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/heart-filled.svg'
const SOCIAL_TIKTOK    = '/icons/social-tiktok.svg'
const SOCIAL_INSTAGRAM = '/icons/social-instagram.svg'
const SOCIAL_WHATSAPP  = '/icons/social-whatsapp.svg'

const PLAYER_COLORS = ['#dc2827','#9b59b6','#27ae60','#e67e22','#3498db','#e91e63','#f39c12','#1abc9c']

/* ─── Game prompts ─── */
const TRUTHS = [
  "What was your first impression of your partner, and what do you think now?",
  "Where is the most adventurous place you've ever wanted to be kissed?",
  "What's a romantic fantasy you've never shared with anyone?",
  "What physical feature do you notice first when you're attracted to someone?",
  "Have you ever had a dream about someone in this room that made you blush?",
  "What's the most romantic thing someone has ever done for you?",
  "What's something your partner does that secretly drives you wild?",
  "If you could relive one intimate moment from your relationship, which would it be?",
  "What's a guilty pleasure you enjoy when your partner isn't around?",
  "Have you ever been attracted to someone you definitely shouldn't have been?",
  "What's the boldest move you've ever made on someone you were into?",
  "What outfit does your partner wear that you find irresistible?",
  "What's a secret turn-on you've never admitted out loud?",
  "Have you ever sent a flirty message to the wrong person?",
  "What's the most embarrassing thing that's happened to you during a date?",
  "If we had no plans tomorrow, how would you want to spend tonight?",
  "What's the longest you've ever thought about a single kiss?",
  "What song makes you think about romance or intimacy every time you hear it?",
  "Have you ever pretended to like something in the bedroom just to please your partner?",
  "What's a compliment you've received that still makes your heart race?",
  "What's the most spontaneous romantic thing you've ever done?",
  "If you could describe your ideal date night in three words, what would they be?",
  "What's something you find attractive that most people would find unusual?",
  "Have you ever written something romantic — a letter, poem, or text — that you never sent?",
  "What part of your body do you feel most confident about?",
  "What's the most intimate non-physical thing a partner has ever done for you?",
  "When did you first realize you were genuinely attracted to your partner?",
  "What's a romantic movie scene you secretly wish would happen to you?",
  "Have you ever had a crush on a close friend's partner?",
  "What's the naughtiest thought you've had about your partner in public?",
  "If your partner could read your mind for one hour, what would surprise them most?",
  "What's something you want your partner to do more of in the bedroom?",
  "Have you ever been caught in an embarrassing romantic moment?",
  "What's a dating rule you've broken that turned out really well?",
  "What do you think is the most attractive thing about yourself?",
  "Have you ever faked enjoying a kiss? What happened?",
  "What's the biggest romantic risk you've ever taken?",
  "If you could change one thing about your love life right now, what would it be?",
  "What's something flirty your partner said that you still think about?",
  "Have you ever felt butterflies with someone while you were already in a relationship?",
  "What's the most seductive thing someone has ever whispered to you?",
  "What would you do if your partner dared you to skinny dip right now?",
  "What's a fantasy scenario you've imagined but never brought up?",
  "Have you ever used a dating app while in a 'it's complicated' situation?",
  "What physical affection do you crave most — kisses, cuddles, or something else?",
  "What's the most romantic text you've ever received?",
  "If you had to describe your kissing style, what would you say?",
  "What's one thing your partner does that instantly puts you in the mood?",
  "Have you ever lied about your number of past relationships? By how many?",
  "What's the spiciest thing on your romantic bucket list that you haven't done yet?",
]

const DARES = [
  "Give your partner a slow, 30-second kiss right now.",
  "Whisper something in your partner's ear that would make them blush.",
  "Give your partner a neck massage for one full minute.",
  "Do your most seductive walk across the room.",
  "Let your partner choose a spot on your body and kiss it.",
  "Send your partner the flirtiest text you can think of — read it aloud first.",
  "Recreate the most romantic scene from a movie with your partner.",
  "Slow dance with your partner for 60 seconds — no music allowed.",
  "Look into your partner's eyes for 60 seconds without looking away or laughing.",
  "Give your partner three genuine compliments about their appearance right now.",
  "Let your partner feed you something using only their hands.",
  "Do your best impression of how your partner flirts with you.",
  "Kiss your partner's hand like you're in a romance novel.",
  "Describe your partner using only words that start with 'S' for 30 seconds.",
  "Give your partner a piggyback ride across the room.",
  "Tell your partner the exact moment you knew you wanted to kiss them.",
  "Let your partner style your hair however they want for the rest of the game.",
  "Hold your partner's face and tell them three things you adore about them.",
  "Act out the story of your first kiss together — with full dramatic flair.",
  "Remove one piece of clothing — your choice.",
  "Let your partner draw a heart anywhere on your body with their finger.",
  "Serenade your partner with any love song — even badly.",
  "Give your partner a forehead kiss and tell them why they're special to you.",
  "Show your partner the last photo you secretly took of them on your phone.",
  "Do your best 'bedroom eyes' look and hold it for 10 seconds.",
  "Let your partner pick a dare from the next round for you in advance.",
  "Blindfold yourself and let your partner guide you around the room for 30 seconds.",
  "Write 'I love you' on your partner's arm with your finger — very slowly.",
  "Share the lock screen on your phone and explain why you chose it.",
  "Sit on your partner's lap for the next two rounds.",
  "Give your partner a butterfly kiss using only your eyelashes.",
  "Reenact the first time you said 'I love you' to each other.",
  "Let your partner choose your outfit for the rest of the evening.",
  "Kiss each of your partner's fingertips one at a time.",
  "Record a 15-second voice note telling your partner why they're attractive.",
  "Do a dramatic reading of your last flirty text exchange with your partner.",
  "Give your partner a compliment that would make a stranger uncomfortable.",
  "Let your partner take a selfie with you in the most romantic pose possible.",
  "Hug your partner from behind and whisper something sweet.",
  "Play with your partner's hair for 30 seconds while maintaining eye contact.",
  "Tell your partner about a time they looked so good it distracted you.",
  "Demonstrate your ideal first-date goodbye on your partner.",
  "Write a two-line love poem about your partner and read it dramatically.",
  "Trace the outline of your partner's lips with your finger.",
  "Put on your partner's favorite song and dance together for the full chorus.",
  "Carry your partner bridal-style across the room — or at least try.",
  "Let your partner leave a lipstick mark (or pretend to) anywhere they choose.",
  "Share one thing you want to try together that you've been too shy to mention.",
  "Take your partner's hand and kiss their wrist slowly.",
  "Describe in detail what your perfect romantic evening with your partner looks like.",
]

/* ─── Hearts band (age-gate card) ─── */
function HeartsRow({ top }: { top: boolean }) {
  return (
    <div style={{
      position: 'absolute',
      [top ? 'top' : 'bottom']: '0',
      left: 0, right: 0,
      height: '87px',
      background: '#dc2827',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        [top ? 'bottom' : 'top']: '14px',
        left: 0, right: 0,
        display: 'flex', flexDirection: 'column', gap: '1px',
      }}>
        {top
          ? <><div style={{ height: '7px', background: '#ecc1c9' }} /><div style={{ height: '4px', background: '#ecc1c9' }} /></>
          : <><div style={{ height: '4px', background: '#ecc1c9' }} /><div style={{ height: '7px', background: '#ecc1c9' }} /></>
        }
      </div>
      <div style={{
        position: 'absolute',
        [top ? 'top' : 'bottom']: '15px',
        left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '5px', alignItems: 'center',
      }}>
        {Array.from({ length: 11 }, (_, i) => (
          <img key={i} src={HEART_FILLED} alt=""
            style={{ width: '32px', height: '32px', flexShrink: 0, transform: i % 2 === 1 ? 'scaleY(-1)' : 'none' }}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Screen 1: Age Gate ─── */
function AgeGate({ onBack, onConfirm }: { onBack: () => void; onConfirm: () => void }) {
  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div className="card-float-up" style={{
        background: '#fff', borderRadius: '20px',
        width: '454px', position: 'relative', overflow: 'hidden', zIndex: 2,
      }}>
        <HeartsRow top={true} />
        <div style={{ padding: '107px 90px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{ transform: 'rotate(-6deg)', marginBottom: '4px' }}>
            <div style={{
              background: '#e62a24', border: '4px solid #000', borderRadius: '9999px',
              width: '97px', height: '96px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px',
            }}>
              <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '72px', color: '#fff', letterSpacing: '1.44px', lineHeight: '72px', display: 'block', textAlign: 'center', whiteSpace: 'nowrap' }}>
                18+
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#000', margin: 0, textAlign: 'center', lineHeight: '45px', whiteSpace: 'nowrap' }}>
              MATURE CONTENT
            </h2>
            <div style={{ textAlign: 'center', color: '#5d3f3c', fontSize: '14px', fontFamily: "'Satoshi', sans-serif", fontWeight: 400, lineHeight: '20px', letterSpacing: '-0.2px' }}>
              <p style={{ margin: 0 }}>Truth or Dare includes</p>
              <p style={{ margin: 0 }}>mature content for ages 18+</p>
              <p style={{ margin: '8px 0 0' }}>Continue?</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '215px', marginTop: '4px' }}>
            <button className="game-btn" onClick={() => setTimeout(onBack, 100)} style={{ flex: 1, border: '1px solid #000', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#131416', textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>
              No, go back
            </button>
            <button className="game-btn-primary" onClick={() => setTimeout(onConfirm, 100)} style={{ flex: 1, background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center' }}>
              YES, I'm 18+
            </button>
          </div>
        </div>
        <HeartsRow top={false} />
      </div>
    </div>
  )
}

/* ─── Screen 2: Player Setup ─── */
/* ─── Screen 2: Player Setup — uses shared component ─── */

/* ─── Screen 3: Deck Size ─── */
function DeckSize({ onBack, onStart }: { onBack: () => void; onStart: (n: number) => void }) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const parsed   = parseInt(value, 10)
  const valid    = !isNaN(parsed) && parsed > 0 && parsed <= 200

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '600px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '50px', alignItems: 'center' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%' }}>
          <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', lineHeight: '45px' }}>
            DECK SIZE
          </h2>
          <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0, textAlign: 'center' }}>
            How many cards do you want to play?
          </p>

          <div
            style={{ background: '#111113', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'text', width: '100%', marginTop: '16px', boxSizing: 'border-box' }}
            onClick={() => inputRef.current?.focus()}
          >
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px', lineHeight: 1 }}>#</span>
            </div>
            <input
              ref={inputRef}
              type="number"
              min={1}
              max={200}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Enter number"
              style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', flex: 1, lineHeight: 'normal' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '292px' }}>
          <button
            onClick={onBack}
            style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', cursor: 'pointer', textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}
          >
            GO BACK
          </button>
          <button className={valid ? 'game-btn-primary' : ''} onClick={() => valid && setTimeout(() => onStart(parsed), 100)}
            style={{ flex: 1, background: valid ? '#dc2827' : '#626262', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: valid ? '#fff' : '#a0a0a0', cursor: valid ? 'pointer' : 'not-allowed', textAlign: 'center', transition: 'background 0.2s, color 0.2s' }}
          >
            START THE GAME
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Screen 4: Get Ready ─── */
function GetReady({ player, onReady }: { player: Player | null; onReady: () => void }) {
  useEffect(() => {
    const id = setTimeout(onReady, 2400)
    return () => clearTimeout(id)
  }, [onReady])

  return (
    <div className="screen-enter" onClick={onReady} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', lineHeight: '45px', textTransform: 'uppercase' }}>
          Get ready...
        </h2>

        {player && (
          <div className="stagger-item" style={{ background: '#18181b', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', padding: '12px', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: player.color, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', lineHeight: 'normal', whiteSpace: 'nowrap' }}>
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

/* ─── Screen 5: Game Play ─── */
type CardState = 'picking' | 'truth' | 'dare'

function GamePlay({ players, cardIndex, totalCards, truthCount, dareCount, skipCount, shuffledTruths, shuffledDares, onAdvance, onPlayAgain, onBrowseGames }: {
  players: Player[]
  cardIndex: number
  totalCards: number
  truthCount: number
  dareCount: number
  skipCount: number
  shuffledTruths: string[]
  shuffledDares: string[]
  onAdvance: (type: 'truth' | 'dare' | 'skip') => void
  onPlayAgain: () => void
  onBrowseGames: () => void
}) {
  const [cardState, setCardState] = useState<CardState>('picking')
  const [flipPhase, setFlipPhase] = useState<'idle' | 'out' | 'in'>('idle')
  const flippingRef = useRef(false)
  const { wrapperStyle: splitWrapperStyle, cardStyle: splitCardStyle } = useScaledCard(454, 457)
  const { wrapperStyle: revealWrapperStyle, cardStyle: revealCardStyle } = useScaledCard(454, 400)

  const currentPlayer = players.length > 0 ? players[cardIndex % players.length] : null

  const truthPrompt = shuffledTruths[cardIndex % shuffledTruths.length]
  const darePrompt  = shuffledDares[cardIndex % shuffledDares.length]

  const pickChoice = useCallback((choice: 'truth' | 'dare') => {
    if (flippingRef.current || cardState !== 'picking') return
    flippingRef.current = true
    setFlipPhase('out')
    setTimeout(() => {
      setCardState(choice)
      setFlipPhase('in')
      setTimeout(() => { setFlipPhase('idle'); flippingRef.current = false }, 300)
    }, 160)
  }, [cardState])

  // advance: flip current card OUT then immediately call cb().
  // GamePlay will unmount (step → getReady), so no flip-in needed —
  // next card starts fresh with cardState='picking' on remount.
  const advance = (cb: () => void) => {
    if (flippingRef.current) return
    flippingRef.current = true
    setFlipPhase('out')
    setTimeout(() => {
      flippingRef.current = false
      setFlipPhase('idle')
      cb() // → handleAdvance → step='getReady'
    }, 220)
  }

  const isDone = totalCards > 0 && cardIndex >= totalCards

  if (isDone) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px', padding: '40px' }}>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
          <h2 className="done-heading" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '48px', color: '#fff', margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            You're Decked
          </h2>
          <p className="done-subtitle" style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            You played all {totalCards} Truth or Dare cards
          </p>
        </div>

        {/* Stats card */}
        <div style={{ position: 'relative', zIndex: 2, background: '#18181b', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '20px 32px', gap: '0' }}>
          {[
            { count: truthCount, label: 'TRUTHS',  cls: 'done-stat-1' },
            { count: dareCount,  label: 'DARES',   cls: 'done-stat-2' },
            { count: skipCount,  label: 'SKIPPED', cls: 'done-stat-3' },
          ].map((stat, i) => (
            <div key={i} className={stat.cls} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)', margin: '0 28px' }} />}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '40px', color: '#fff', lineHeight: 1 }}>{stat.count}</span>
                <span style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mini Truth or Dare card */}
        <div className="done-card" style={{
          position: 'relative', zIndex: 2,
          width: '199px', height: '200px',
          background: '#fff', borderRadius: '9px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          flexShrink: 0,
        }}>
          {/* Top red band: hearts at top, stripes toward inner edge */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '38px', background: '#dc2827', overflow: 'hidden' }}>
            {/* Stripes near inner edge (bottom of top band) */}
            <div style={{ position: 'absolute', top: '27px', left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: '0.4px' }}>
              <div style={{ height: '3px', background: '#ecc1c9', width: '100%' }} />
              <div style={{ height: '1.7px', background: '#ecc1c9', width: '100%' }} />
            </div>
            {/* Hearts row centered */}
            <div style={{ position: 'absolute', top: '6.5px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '2.2px', alignItems: 'center', whiteSpace: 'nowrap' }}>
              {Array.from({ length: 11 }, (_, i) => (
                <img key={i} src={HEART_FILLED} alt="" style={{ width: '14px', height: '14px', flexShrink: 0, transform: i % 2 === 1 ? 'scaleY(-1)' : 'none' }} />
              ))}
            </div>
          </div>

          {/* Center text block — two overlapping layers create the shadow effect */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '106px', height: '71px' }}>
            {/* Black shadow layer */}
            <p style={{ position: 'absolute', left: '1px', right: '-1px', top: '1px', fontFamily: "'Satoshi', sans-serif", fontWeight: 500, fontSize: '21.9px', color: '#000', textAlign: 'center', lineHeight: 1.2, margin: 0 }}>
              TRUTH OR DARE
            </p>
            {/* Pink main text */}
            <p style={{ position: 'absolute', left: '1px', right: '-1px', top: '0', fontFamily: "'Satoshi', sans-serif", fontWeight: 500, fontSize: '21.9px', color: '#d39293', textAlign: 'center', lineHeight: 1.2, margin: 0 }}>
              TRUTH OR DARE
            </p>
            {/* FOR COUPLES */}
            <p style={{ position: 'absolute', left: 0, right: 0, top: '60px', fontFamily: "'Satoshi', sans-serif", fontSize: '10.5px', color: '#181b25', textAlign: 'center', margin: 0 }}>
              FOR COUPLES
            </p>
          </div>

          {/* Bottom red band: stripes near inner edge (top of bottom band), hearts toward bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '38px', background: '#dc2827', overflow: 'hidden' }}>
            {/* Stripes near inner edge (top of bottom band) */}
            <div style={{ position: 'absolute', top: '6px', left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: '0.4px' }}>
              <div style={{ height: '1.7px', background: '#ecc1c9', width: '100%' }} />
              <div style={{ height: '3px', background: '#ecc1c9', width: '100%' }} />
            </div>
            {/* Hearts row centered */}
            <div style={{ position: 'absolute', top: '17.5px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '2.2px', alignItems: 'center', whiteSpace: 'nowrap' }}>
              {Array.from({ length: 11 }, (_, i) => (
                <img key={i} src={HEART_FILLED} alt="" style={{ width: '14px', height: '14px', flexShrink: 0, transform: i % 2 === 1 ? 'scaleY(-1)' : 'none' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="done-btns" style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="game-btn" onClick={onBrowseGames} style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>
            BROWSE GAMES
          </button>
          <button className="game-btn-primary" onClick={onPlayAgain} style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>
            PLAY AGAIN
          </button>
        </div>
      </div>
    )
  }

  /* Split card (picking) */
  if (cardState === 'picking') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px', padding: '40px 40px 60px', position: 'relative' }}>

        {currentPlayer && (
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: currentPlayer.color, flexShrink: 0, border: '2px solid rgba(255,255,255,0.2)' }} />
            <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em' }}>
              {currentPlayer.name.toUpperCase()}'S TURN
            </span>
          </div>
        )}

        {/* Split card */}
        <div style={splitWrapperStyle}>
        <div
          className={`tod-split-card tod-card-enter game-card${flipPhase === 'out' ? ' tod-flip-out' : flipPhase === 'in' ? ' tod-flip-in' : ''}`}
          style={{
            ...splitCardStyle,
            position: 'relative', zIndex: 2,
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(220,40,39,0.35)',
          }}
        >
          {/* TRUTH — top half */}
          <div
            className="tod-truth-half"
            onClick={() => pickChoice('truth')}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '228.5px',
              background: '#e9b1ba',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span className="tod-half-label" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#dd2a25', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              TRUTH
            </span>
          </div>

          {/* DARE — bottom half */}
          <div
            className="tod-dare-half"
            onClick={() => pickChoice('dare')}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '228.5px',
              background: '#dd2a25',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span className="tod-half-label" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#e9b1ba', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              DARE
            </span>
          </div>

          {/* Hearts at divider */}
          <div className="tod-hearts" style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex', gap: '5px', alignItems: 'center',
            zIndex: 3, pointerEvents: 'none',
          }}>
            <img src={HEART_GAME} alt="" style={{ width: '32px', height: '32px' }} />
            <img src={HEART_GAME} alt="" style={{ width: '32px', height: '32px', transform: 'scaleY(-1)' }} />
          </div>
        </div>
        </div>

        {/* SKIP THIS CARD */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center' }}>
          <button
            className="game-btn"
            onClick={() => advance(() => onAdvance('skip'))}
            style={{
              border: '1px solid #fff', background: 'none', borderRadius: '999px',
              padding: '12px 18px', width: '160px',
              fontFamily: "'Staatliches', sans-serif", fontSize: '16px',
              color: '#fff', textAlign: 'center',
              boxShadow: '0 10px 24px rgba(0,0,0,0.25)', letterSpacing: '0.05em',
            }}
          >
            SKIP THIS CARD
          </button>
        </div>

        {/* Card counter */}
        {totalCards > 0 && (
          <div key={cardIndex} className="counter-in" style={{ position: 'relative', zIndex: 2, fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>
            CARD {cardIndex + 1} OF {totalCards}
          </div>
        )}
      </div>
    )
  }

  /* Revealed card (truth or dare) */
  const isTruth    = cardState === 'truth'
  const cardBg     = isTruth ? '#f7b8bc' : '#dc2827'
  const cardText   = isTruth ? '#dc2827' : '#f7b8bc'
  const prompt     = isTruth ? truthPrompt : darePrompt
  const typeLabel  = isTruth ? '— TRUTH —' : '— DARE —'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 40px 60px', gap: '24px', position: 'relative' }}>

      {currentPlayer && (
        <div key={currentPlayer.name} className="player-chip-enter" style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: currentPlayer.color, flexShrink: 0, border: '2px solid rgba(255,255,255,0.2)', boxShadow: `0 0 0 3px ${currentPlayer.color}33` }} />
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em' }}>
            {currentPlayer.name.toUpperCase()}'S TURN
          </span>
          <span style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '14px', color: isTruth ? '#f7b8bc' : '#dc2827', background: isTruth ? 'rgba(247,184,188,0.12)' : 'rgba(220,40,39,0.12)', border: `1px solid ${isTruth ? 'rgba(247,184,188,0.3)' : 'rgba(220,40,39,0.3)'}`, borderRadius: '999px', padding: '3px 12px', letterSpacing: '0.1em' }}>
            {isTruth ? 'TRUTH' : 'DARE'}
          </span>
        </div>
      )}

      <div style={revealWrapperStyle}>
      <div
        className={`tod-card-enter game-card${flipPhase === 'out' ? ' tod-flip-out' : flipPhase === 'in' ? ' tod-flip-in' : ''}`}
        style={{
          ...revealCardStyle,
          position: 'relative', zIndex: 2,
          background: cardBg, borderRadius: '20px',
          minHeight: '400px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '52px 48px 44px', gap: '24px',
          boxShadow: `0 32px 80px ${isTruth ? 'rgba(247,100,100,0.25)' : 'rgba(220,40,39,0.45)'}`,
        }}
      >
        <div style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', letterSpacing: '0.18em', color: cardText, opacity: 0.65, textTransform: 'uppercase' }}>
          {typeLabel}
        </div>

        <p style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '28px', color: cardText, textAlign: 'center', textTransform: 'uppercase', lineHeight: 1.2, margin: 0, letterSpacing: '0.02em' }}>
          {prompt}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
          <img src={HEART_GAME} alt="" style={{ width: '36px', height: '36px', opacity: 0.85 }} />
        </div>
      </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '8px', alignItems: 'center', width: '402px' }}>
        <button className="game-btn"
          onClick={() => advance(() => onAdvance('skip'))}
          style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)', letterSpacing: '0.05em' }}
        >
          SKIP
        </button>
        <button className="game-btn-primary"
          onClick={() => advance(() => onAdvance(isTruth ? 'truth' : 'dare'))}
          style={{ flex: 1, background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', letterSpacing: '0.05em' }}
        >
          NEXT
        </button>
      </div>

      {totalCards > 0 && (
        <div key={cardIndex} className="counter-in" style={{ position: 'relative', zIndex: 2, fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>
          CARD {cardIndex + 1} OF {totalCards}
        </div>
      )}
    </div>
  )
}

/* ─── Root Game Component ─── */
type Step = 'ageGate' | 'playerSetup' | 'deckSize' | 'getReady' | 'game'

export default function TruthOrDareGame({ onClose }: { onClose: () => void }) {
  const [step,           setStep]           = useState<Step>('ageGate')
  const [players,        setPlayers]        = useState<Player[]>([])
  const [totalCards,     setTotalCards]     = useState(0)
  const [cardIndex,      setCardIndex]      = useState(0)
  const [playerIndex,    setPlayerIndex]    = useState(0)
  const [truthCount,     setTruthCount]     = useState(0)
  const [dareCount,      setDareCount]      = useState(0)
  const [skipCount,      setSkipCount]      = useState(0)
  const [shuffledTruths, setShuffledTruths] = useState(() => getShuffledDeck(TRUTHS, 'truth-or-dare-truths'))
  const [shuffledDares,  setShuffledDares]  = useState(() => getShuffledDeck(DARES, 'truth-or-dare-dares'))

  const currentPlayer = players.length > 0 ? players[playerIndex] : null

  const handleAdvance = useCallback((type: 'truth' | 'dare' | 'skip') => {
    if (type === 'truth')     setTruthCount(c => c + 1)
    else if (type === 'dare') setDareCount(c => c + 1)
    else                      setSkipCount(c => c + 1)
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

  const goToGame = useCallback(() => setStep('game'), [])

  const handlePlayAgain = useCallback(() => {
    setCardIndex(0)
    setPlayerIndex(0)
    setTruthCount(0)
    setDareCount(0)
    setSkipCount(0)
    setShuffledTruths(getShuffledDeck(TRUTHS, 'truth-or-dare-truths'))
    setShuffledDares(getShuffledDeck(DARES, 'truth-or-dare-dares'))
    setStep('getReady')
  }, [])

  return (
    <div className="game-fullscreen">
      <GameNav onBack={onClose} />

      {step === 'ageGate' && (
        <AgeGate onBack={onClose} onConfirm={() => setStep('playerSetup')} />
      )}

      {step === 'playerSetup' && (
        <SharedPlayerSetup
          initialPlayers={players}
          skipLabel="GO BACK"
          onSkip={() => setStep('ageGate')}
          onNext={p => { setPlayers(p); setStep('deckSize') }}
        />
      )}

      {step === 'deckSize' && (
        <DeckSize
          onBack={() => setStep('playerSetup')}
          onStart={n => { setTotalCards(n); setCardIndex(0); setPlayerIndex(0); setShuffledTruths(getShuffledDeck(TRUTHS, 'truth-or-dare-truths')); setShuffledDares(getShuffledDeck(DARES, 'truth-or-dare-dares')); setStep('getReady') }}
        />
      )}

      {step === 'getReady' && (
        <GetReady
          player={currentPlayer}
          onReady={goToGame}
        />
      )}

      {step === 'game' && (
        <GamePlay
          players={players}
          cardIndex={cardIndex}
          totalCards={totalCards}
          truthCount={truthCount}
          dareCount={dareCount}
          skipCount={skipCount}
          shuffledTruths={shuffledTruths}
          shuffledDares={shuffledDares}
          onAdvance={handleAdvance}
          onPlayAgain={handlePlayAgain}
          onBrowseGames={onClose}
        />
      )}

      <GameFooter />
    </div>
  )
}
