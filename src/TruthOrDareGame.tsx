/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from 'react'

type Player = { name: string; color: string }
type SetPlayers = React.Dispatch<React.SetStateAction<Player[]>>

/* ─── Asset URLs (7-day Figma MCP hosted) ─── */
const HEART_FILLED = 'https://www.figma.com/api/mcp/asset/7d1c3e18-e7bf-4c69-8b59-a7e40df03a36'
const SOCIAL_TIKTOK    = 'https://www.figma.com/api/mcp/asset/52c80b9f-7611-4e1c-b0a1-b87cbde55222'
const SOCIAL_INSTAGRAM = 'https://www.figma.com/api/mcp/asset/2fb330d3-8103-4715-98c4-977825083eae'
const SOCIAL_WHATSAPP  = 'https://www.figma.com/api/mcp/asset/5e3391bc-c214-4266-8b20-9d5680742eef'

const PLAYER_COLORS = ['#dc2827', '#9b59b6', '#27ae60', '#e67e22', '#3498db', '#e91e63', '#f39c12', '#1abc9c']

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


/* ─── Hearts band (top / bottom of age-gate card) ─── */
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
      {/* pink stripe lines */}
      <div style={{
        position: 'absolute',
        [top ? 'bottom' : 'top']: '25px',
        left: 0, right: 0,
        display: 'flex', flexDirection: 'column', gap: '1px',
      }}>
        {top
          ? <><div style={{ height: '7px', background: '#ecc1c9' }} /><div style={{ height: '4px', background: '#ecc1c9' }} /></>
          : <><div style={{ height: '4px', background: '#ecc1c9' }} /><div style={{ height: '7px', background: '#ecc1c9' }} /></>
        }
      </div>
      {/* heart row */}
      <div style={{
        position: 'absolute',
        [top ? 'top' : 'bottom']: '15px',
        left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '5px', alignItems: 'center',
      }}>
        {Array.from({ length: 11 }, (_, i) => (
          <img
            key={i} src={HEART_FILLED} alt=""
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
      backdropFilter: 'blur(4px)',
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
      backdropFilter: 'blur(4px)',
      padding: '32px 60px',
      display: 'flex', flexDirection: 'column', gap: '40px',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '420px' }}>
          <span style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '32px', color: '#fff', lineHeight: 'normal' }}>
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
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      {/* galaxy canvas from galaxy.ts provides the star background */}
      <div style={{
        background: '#fff', borderRadius: '20px',
        width: '454px', position: 'relative', overflow: 'hidden', zIndex: 2,
      }}>
        {/* Top red hearts band */}
        <HeartsRow top={true} />

        {/* White middle content */}
        <div style={{ padding: '107px 90px 107px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          {/* 18+ badge */}
          <div style={{ transform: 'rotate(-6deg)', marginBottom: '4px' }}>
            <div style={{
              background: '#e62a24',
              border: '4px solid #000', borderRadius: '9999px',
              width: '97px', height: '96px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '38px', color: '#fff', letterSpacing: '1.44px', lineHeight: 1 }}>
                18+
              </span>
            </div>
          </div>

          {/* Text block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <h2 style={{
              fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
              fontSize: '36px', color: '#000', margin: 0,
              textAlign: 'center', lineHeight: '45px', whiteSpace: 'nowrap',
            }}>
              MATURE CONTENT
            </h2>
            <div style={{ textAlign: 'center', color: '#5d3f3c', fontSize: '14px', fontFamily: "'Inter', sans-serif", fontWeight: 400, lineHeight: '20px' }}>
              <p style={{ margin: 0 }}>Truth or Dare includes</p>
              <p style={{ margin: 0 }}>mature content for ages 18+</p>
              <p style={{ margin: '0 0 0' }}>&nbsp;</p>
              <p style={{ margin: 0 }}>Continue?</p>
            </div>
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '215px', marginTop: '4px' }}>
            <button
              onClick={onBack}
              className="tod-cta-outline"
              style={{
                flex: 1,
                border: '1px solid #000', background: 'none', borderRadius: '999px',
                padding: '12px 18px',
                fontFamily: "'Staatliches', sans-serif", fontSize: '16px',
                color: '#131416', cursor: 'pointer', textAlign: 'center',
                boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
              }}
            >
              No, go back
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1,
                background: '#dc2827', border: 'none', borderRadius: '999px',
                padding: '12px 18px',
                fontFamily: "'Staatliches', sans-serif", fontSize: '16px',
                color: '#fff', cursor: 'pointer', textAlign: 'center',
                filter: 'drop-shadow(0 10px 12px rgba(220,40,39,0.25))',
              }}
            >
              YES, I'm 18+
            </button>
          </div>
        </div>

        {/* Bottom red hearts band */}
        <HeartsRow top={false} />
      </div>
    </div>
  )
}

/* ─── Screen 2: Player Setup ─── */
function PlayerSetup({ players, setPlayers, onSkip, onNext }: { players: Player[]; setPlayers: SetPlayers; onSkip: () => void; onNext: () => void }) {
  const [input, setInput] = useState('')
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const editRef = useRef<HTMLInputElement>(null)

  const nextColor = PLAYER_COLORS[players.length % PLAYER_COLORS.length]
  const hasInput = input.trim().length > 0

  const addPlayer = () => {
    const name = input.trim()
    if (!name) return
    setPlayers((prev: Player[]) => [...prev, { name, color: PLAYER_COLORS[prev.length % PLAYER_COLORS.length] }])
    setInput('')
    inputRef.current?.focus()
  }

  const removePlayer = (idx: number) => setPlayers((prev: Player[]) => prev.filter((_: Player, i: number) => i !== idx))

  const startEdit = (idx: number) => {
    setEditingIdx(idx)
    setEditValue(players[idx].name)
    setTimeout(() => editRef.current?.select(), 0)
  }

  const commitEdit = () => {
    const name = editValue.trim()
    if (name && editingIdx !== null) {
      setPlayers((prev: Player[]) => prev.map((p: Player, i: number) => i === editingIdx ? { ...p, name } : p))
    }
    setEditingIdx(null)
    setEditValue('')
  }

  const cancelEdit = () => {
    setEditingIdx(null)
    setEditValue('')
  }

  const canNext = players.length > 0

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      {/* galaxy canvas from galaxy.ts provides the star background */}
      <div style={{ width: '600px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '50px', alignItems: 'center' }}>

        {/* Title */}
        <h2 style={{
          fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
          fontSize: '36px', color: '#fff',
          margin: 0, textAlign: 'center', lineHeight: '45px',
        }}>
          Who's playing?
        </h2>

        {/* Players + Add input */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {players.map((p: Player, i: number) => (
            <div key={i} style={{
              background: '#111113',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: '12px', height: '56px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px',
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: p.color, flexShrink: 0,
                  boxShadow: '0 0 0 2.5px #ffffff',
                }} />
                {editingIdx === i ? (
                  <input
                    ref={editRef}
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit() }}
                    onBlur={commitEdit}
                    style={{
                      background: 'none', border: 'none', outline: 'none',
                      fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
                      fontSize: '18px', color: '#fff', flex: 1, lineHeight: 'normal',
                    }}
                  />
                ) : (
                  <span
                    onClick={() => startEdit(i)}
                    style={{
                      fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
                      fontSize: '18px', color: '#fff', lineHeight: 'normal',
                      cursor: 'text', flex: 1,
                    }}
                  >
                    {p.name}
                  </span>
                )}
              </div>
              <button
                onClick={() => removePlayer(i)}
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer', fontSize: '18px',
                  lineHeight: 1, padding: '0 4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label="Remove player"
              >
                ×
              </button>
            </div>
          ))}

          {/* Add player row */}
          <div
            style={{
              background: '#111113',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: '12px', height: '56px',
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px', cursor: 'text',
            }}
            onClick={() => inputRef.current?.focus()}
          >
            {/* + button: becomes colored ✓ when typing */}
            <button
              onClick={(e) => { e.stopPropagation(); addPlayer() }}
              style={{
                background: hasInput ? nextColor : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '16px', width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
                color: hasInput ? '#fff' : 'rgba(255,255,255,0.6)',
                fontSize: hasInput ? '16px' : '20px', fontWeight: 400,
                lineHeight: 1,
                transition: 'background 0.15s',
                boxShadow: hasInput ? '0 0 0 2.5px #ffffff' : 'none',
              }}
              aria-label="Add player"
            >
              {hasInput ? '✓' : '+'}
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addPlayer() }}
              placeholder="Add a player..."
              style={{
                background: 'none', border: 'none', outline: 'none',
                fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
                fontSize: '18px', color: '#fff',
                flex: 1, lineHeight: 'normal',
              }}
            />
            {/* TAP TO ADD → inline prompt */}
            {hasInput && (
              <button
                onClick={(e) => { e.stopPropagation(); addPlayer() }}
                style={{
                  background: 'none', border: 'none',
                  fontFamily: "'Staatliches', sans-serif", fontSize: '14px',
                  color: nextColor, cursor: 'pointer',
                  whiteSpace: 'nowrap', padding: 0, letterSpacing: '0.05em',
                }}
              >
                TAP TO ADD →
              </button>
            )}
          </div>
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '402px' }}>
          <button
            onClick={onSkip}
            style={{
              flex: 1,
              border: '1px solid #fff', background: 'none', borderRadius: '999px',
              padding: '12px 18px',
              fontFamily: "'Staatliches', sans-serif", fontSize: '16px',
              color: '#fff', cursor: 'pointer', textAlign: 'center',
              boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
            }}
          >
            SKIP FOR NOW
          </button>
          <button
            onClick={canNext ? onNext : undefined}
            style={{
              flex: 1,
              background: canNext ? '#dc2827' : '#626262',
              border: 'none', borderRadius: '999px',
              padding: '12px 18px',
              fontFamily: "'Staatliches', sans-serif", fontSize: '16px',
              color: canNext ? '#fff' : '#a0a0a0',
              cursor: canNext ? 'pointer' : 'not-allowed',
              textAlign: 'center',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            NEXT
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Screen 3: Game Play ─── */
function GamePlay({ players, onBack }: { players: Player[]; onBack: () => void }) {
  const [cardIndex, setCardIndex] = useState(0)
  const [playerIndex, setPlayerIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [cardKey, setCardKey] = useState(0)

  // Deterministic per-card type: even = truth, odd = dare
  const isTruth = cardIndex % 2 === 0
  const prompt = isTruth
    ? TRUTHS[cardIndex % TRUTHS.length]
    : DARES[cardIndex % DARES.length]

  const currentPlayer = players.length > 0 ? players[playerIndex] : null
  const nextPlayer = players.length > 1 ? players[(playerIndex + 1) % players.length] : null

  const cardBg = isTruth ? '#f7b8bc' : '#dc2827'
  const cardTextColor = isTruth ? '#dc2827' : '#f7b8bc'

  const advance = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setTimeout(() => {
      setCardIndex(i => i + 1)
      setPlayerIndex(i => players.length > 0 ? (i + 1) % players.length : 0)
      setCardKey(k => k + 1)
      setIsAnimating(false)
    }, 220)
  }, [isAnimating, players.length])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px 40px 60px' }}>
      {/* galaxy canvas from galaxy.ts provides the star background */}

      {/* Current player label */}
      {currentPlayer && (
        <div style={{
          position: 'relative', zIndex: 2,
          marginBottom: '28px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: currentPlayer.color, flexShrink: 0,
            border: '2px solid rgba(255,255,255,0.2)',
          }} />
          <span style={{
            fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
            fontSize: '18px', color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.04em',
          }}>
            {currentPlayer.name.toUpperCase()}'S TURN
          </span>
          <span style={{
            fontFamily: "'Staatliches', sans-serif", fontSize: '14px',
            color: isTruth ? '#f7b8bc' : '#dc2827',
            background: isTruth ? 'rgba(247,184,188,0.12)' : 'rgba(220,40,39,0.12)',
            border: `1px solid ${isTruth ? 'rgba(247,184,188,0.3)' : 'rgba(220,40,39,0.3)'}`,
            borderRadius: '999px',
            padding: '3px 12px',
            letterSpacing: '0.1em',
          }}>
            {isTruth ? 'TRUTH' : 'DARE'}
          </span>
        </div>
      )}

      {/* Card */}
      <div
        key={cardKey}
        className="tod-card-enter"
        style={{
          position: 'relative', zIndex: 2,
          background: cardBg,
          borderRadius: '20px',
          width: '400px', minHeight: '400px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '48px 40px 36px',
          gap: '32px',
          boxShadow: `0 32px 80px ${isTruth ? 'rgba(247,100,100,0.25)' : 'rgba(220,40,39,0.45)'}`,
          opacity: isAnimating ? 0 : 1,
          transform: isAnimating ? 'translateY(16px) scale(0.96)' : 'translateY(0) scale(1)',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
        }}
      >
        {/* Type label inside card */}
        <div style={{
          position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
          fontFamily: "'Staatliches', sans-serif",
          fontSize: '13px', letterSpacing: '0.18em',
          color: cardTextColor, opacity: 0.65,
          textTransform: 'uppercase',
        }}>
          {isTruth ? '— TRUTH —' : '— DARE —'}
        </div>

        {/* Prompt text */}
        <p style={{
          fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
          fontSize: '28px', color: cardTextColor,
          textAlign: 'center', textTransform: 'uppercase',
          lineHeight: 1.2, margin: 0,
          letterSpacing: '0.02em',
        }}>
          {prompt}
        </p>

        {/* Player avatars at bottom */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {currentPlayer ? (
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: currentPlayer.color,
              border: `2px solid ${cardTextColor}`,
              opacity: 0.9,
            }} />
          ) : (
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
            }} />
          )}
          <img src={HEART_FILLED} alt="" style={{ width: '36px', height: '36px', opacity: 0.85 }} />
          {nextPlayer && (
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: nextPlayer.color,
              border: `2px solid ${cardTextColor}`,
              opacity: 0.5,
            }} />
          )}
        </div>
      </div>

      {/* Card counter */}
      <div style={{
        position: 'relative', zIndex: 2,
        marginTop: '20px',
        fontFamily: "'Staatliches', sans-serif",
        fontSize: '13px', color: 'rgba(255,255,255,0.25)',
        letterSpacing: '0.12em',
      }}>
        CARD {cardIndex + 1}
      </div>

      {/* Buttons */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', gap: '8px', alignItems: 'center',
        width: '402px', marginTop: '28px',
      }}>
        <button
          onClick={advance}
          style={{
            flex: 1,
            border: '1px solid #fff', background: 'none', borderRadius: '999px',
            padding: '12px 18px',
            fontFamily: "'Staatliches', sans-serif", fontSize: '16px',
            color: '#fff', cursor: 'pointer', textAlign: 'center',
            boxShadow: '0 10px 24px rgba(0,0,0,0.25)',
            letterSpacing: '0.05em',
          }}
        >
          SKIP FOR NOW
        </button>
        <button
          onClick={advance}
          style={{
            flex: 1,
            background: '#dc2827', border: 'none', borderRadius: '999px',
            padding: '12px 18px',
            fontFamily: "'Staatliches', sans-serif", fontSize: '16px',
            color: '#fff', cursor: 'pointer', textAlign: 'center',
            filter: 'drop-shadow(0 10px 12px rgba(220,40,39,0.35))',
            letterSpacing: '0.05em',
          }}
        >
          NEXT
        </button>
      </div>
    </div>
  )
}

/* ─── Root Game Component ─── */
export default function TruthOrDareGame({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState('ageGate')
  const [players, setPlayers] = useState<Player[]>([])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'transparent',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      <GameNav onBack={onClose} />

      {step === 'ageGate' && (
        <AgeGate onBack={onClose} onConfirm={() => setStep('playerSetup')} />
      )}
      {step === 'playerSetup' && (
        <PlayerSetup
          players={players}
          setPlayers={setPlayers}
          onSkip={() => setStep('game')}
          onNext={() => setStep('game')}
        />
      )}
      {step === 'game' && (
        <GamePlay players={players} onBack={() => setStep('playerSetup')} />
      )}

      <GameFooter />
    </div>
  )
}
