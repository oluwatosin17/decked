/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import { useScaledCard } from './hooks/useCardScale'

type SetPlayers = React.Dispatch<React.SetStateAction<Player[]>>

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ─── Asset URLs (permanently hosted on Cloudinary) ─── */
const HEART_FILLED     = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/heart-filled.svg'
const HEART_GAME       = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/heart-filled.svg'
const SOCIAL_TIKTOK    = '/icons/social-tiktok.svg'
const SOCIAL_INSTAGRAM = '/icons/social-instagram.svg'
const SOCIAL_WHATSAPP  = '/icons/social-whatsapp.svg'

const PLAYER_COLORS = ['#dc2827','#9b59b6','#27ae60','#e67e22','#3498db','#e91e63','#f39c12','#1abc9c']

/* ─── Game prompts ─── */
const TRUTHS = [
  "Have you ever had a crush on a friend's partner?",
  "What's the most embarrassing thing you've done for someone you liked?",
  "Have you ever lied to your partner? What about?",
  "What's something you've never told anyone about your past?",
  "What's the biggest mistake you've made in a relationship?",
  "Have you ever ghosted someone? Do you regret it?",
  "What's the most childish thing you still do?",
  "What's something about yourself you're working to change?",
  "What's the last lie you told?",
  "Have you ever cheated in a game, test, or relationship?",
  "What's the most money you've spent on something you regret?",
  "What would you do if you won the lottery tomorrow?",
  "Have you ever talked badly about a friend behind their back?",
  "What's your biggest fear about the future?",
  "What's something you're secretly proud of that you'd never admit?",
  "Have you ever had feelings for someone in this room?",
  "What's the weirdest dream you've had about someone you know?",
  "What's a deal-breaker you've ignored in a relationship?",
  "What's the most daring thing you've ever done?",
  "Have you ever faked being sick to avoid something?",
]

const DARES = [
  "Dance without music for 30 seconds.",
  "Text your most recent contact something nice without explaining why.",
  "Do your best impression of someone in this room.",
  "Sing the chorus of the last song you listened to.",
  "Let someone else post something on your social media.",
  "Do 20 jumping jacks right now.",
  "Say something nice about every person in the room.",
  "Speak in an accent for the next 3 rounds.",
  "Show the last 5 photos in your camera roll.",
  "Let the group read your last sent text message.",
  "Call someone and say 'I have something to confess' then hang up.",
  "Do your best runway walk across the room.",
  "Attempt to lick your elbow for 10 seconds.",
  "Tell an embarrassing story about yourself from the past year.",
  "Let someone draw on your arm with a pen.",
  "Make a dramatic speech about why you deserve to win this game.",
  "Put on a song and dance for exactly 30 seconds.",
  "Write a haiku about the person to your left. Read it aloud.",
  "Do your best celebrity impression until someone guesses who it is.",
  "Show your most recent search on your phone.",
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

/* ─── Shared nav ─── */
function GameNav({ onBack }: { onBack: () => void }) {
  return (
    <nav style={{
      background: 'rgba(5,5,12,0.72)',
      backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 60px', height: '80px', flexShrink: 0, position: 'relative', zIndex: 10,
    }}>
      <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '28px', color: '#fff', letterSpacing: '0.56px', lineHeight: 'normal', fontWeight: 400 }}>
        DECKED
      </span>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        {['Browse Games', 'How to Play', 'About'].map(label => (
          <button
            key={label}
            onClick={label === 'Browse Games' ? onBack : undefined}
            onMouseOver={e => { if (label === 'Browse Games') (e.currentTarget as HTMLButtonElement).style.color = '#ffffff' }}
            onMouseOut={e => { if (label === 'Browse Games') (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)' }}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.4)',
              fontFamily: "'Anton SC', sans-serif",
              fontSize: '16px', fontWeight: 400,
              cursor: label === 'Browse Games' ? 'pointer' : 'default',
              lineHeight: 'normal', padding: 0,
              transition: 'color 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}

/* ─── Shared footer ─── */
function GameFooter() {
  return (
    <footer style={{
      background: 'rgba(5,5,12,0.72)',
      backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
      padding: '32px 60px',
      display: 'flex', flexDirection: 'column', gap: '40px',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '420px' }}>
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '32px', color: '#fff', lineHeight: 'normal' }}>
            DECKED
          </span>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '14px', color: '#9ca3af', lineHeight: 1.5, margin: 0 }}>
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
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#9ca3af' }}>
          © 2026 DECKED. All rights reserved.
        </span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Privacy', 'Terms', 'Cookie'].map(l => (
            <button key={l} style={{ background: 'none', border: 'none', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '13px', cursor: 'pointer', padding: 0 }}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </footer>
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
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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

        {currentPlayer && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: currentPlayer.color, border: `2px solid ${cardText}`, opacity: 0.9 }} />
            <img src={HEART_GAME} alt="" style={{ width: '36px', height: '36px', opacity: 0.85 }} />
          </div>
        )}
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
  const [shuffledTruths, setShuffledTruths] = useState(() => shuffle(TRUTHS))
  const [shuffledDares,  setShuffledDares]  = useState(() => shuffle(DARES))

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
    setShuffledTruths(shuffle(TRUTHS))
    setShuffledDares(shuffle(DARES))
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
          onStart={n => { setTotalCards(n); setCardIndex(0); setPlayerIndex(0); setShuffledTruths(shuffle(TRUTHS)); setShuffledDares(shuffle(DARES)); setStep('getReady') }}
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
