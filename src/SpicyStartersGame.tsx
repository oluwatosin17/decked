import { useState, useCallback } from 'react'

/* ─── Asset URLs (Figma MCP hosted) ─── */
// Intro card — back of deck (red background, pink checkerboard)
const SPICY_INTRO_BG  = 'https://www.figma.com/api/mcp/asset/ce496b8c-9b30-4b79-ab38-ff810a1fb8a4'
// Game card — front (pink background, red checkerboard)
const SPICY_CARD_BG   = 'https://www.figma.com/api/mcp/asset/20298f80-8b5f-4caf-b054-1a6346c38f30'
// Social icons
const SOCIAL_TIKTOK    = 'https://www.figma.com/api/mcp/asset/52c80b9f-7611-4e1c-b0a1-b87cbde55222'
const SOCIAL_INSTAGRAM = 'https://www.figma.com/api/mcp/asset/2fb330d3-8103-4715-98c4-977825083eae'
const SOCIAL_WHATSAPP  = 'https://www.figma.com/api/mcp/asset/5e3391bc-c214-4266-8b20-9d5680742eef'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const QUESTIONS = [
  "What's one thing someone can do that instantly makes them more attractive?",
  "If you could change one thing about how you typically communicate in relationships, what would it be?",
  "What's something you find deeply attractive in a person that you rarely admit?",
  "What's the most meaningful conversation you've had this year?",
  "What's something you wish people understood about you without you having to explain?",
  "What's a small, everyday thing someone does that makes you feel truly appreciated?",
  "What topic could you talk about for hours without getting bored?",
  "When did you last feel truly understood by someone?",
  "What's something you've been wanting to say but haven't found the right moment?",
  "What's one thing you appreciate about the person sitting next to you right now?",
  "What makes you feel most like yourself?",
  "What's a question you've always wanted to ask but been afraid to?",
  "What's the best piece of advice you've ever received about love?",
  "What's one thing you're still learning about relationships?",
  "What's a memory that makes you smile every time you think about it?",
  "What's something you used to believe about love that you no longer believe?",
  "What's a small act of kindness someone did for you that stayed with you?",
  "What makes you feel most vulnerable in a relationship?",
  "What does home feel like to you?",
  "What's one thing you'd do differently if you could start a relationship over?",
]

/* ─── Shared nav ─── */
function GameNav({ onBack }: { onBack: () => void }) {
  return (
    <nav style={{
      background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)',
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
              lineHeight: 'normal', padding: 0, transition: 'color 0.2s',
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
      background: 'rgba(5,5,12,0.72)', backdropFilter: 'blur(4px)',
      padding: '32px 60px',
      display: 'flex', flexDirection: 'column', gap: '40px', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '420px' }}>
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '32px', color: '#fff', lineHeight: 'normal' }}>DECKED</span>
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

/* ─── Spicy Starters Card (reusable shell) ─── */
function SpicyCard({
  bgImage, innerBg, children, onClick, style = {},
}: {
  bgImage: string
  innerBg: string
  children?: React.ReactNode
  onClick?: () => void
  style?: React.CSSProperties
}) {
  // Card outer: 365×457px, pink base, checkerboard overlay image, inner content rect
  // Based on Figma: image at left=-91.99px, 457×457px, inner rect at inset 6.62%/6.69%/6.1%/25.45%
  // In card coords: inner rect ≈ top:30px, right:30px, bottom:28px, left:24px
  return (
    <div
      onClick={onClick}
      style={{
        width: '365px', height: '457px',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Pink base behind the checkerboard image */}
      <div style={{ position: 'absolute', inset: 0, background: '#df91b5' }} />

      {/* Checkerboard border image — extends to the left to show full pattern */}
      <div style={{ position: 'absolute', left: '-92px', top: 0, width: '457px', height: '457px', overflow: 'hidden' }}>
        <img src={bgImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      {/* Inner content area (inside the checkerboard border) */}
      <div style={{
        position: 'absolute',
        top: '30px', right: '30px', bottom: '28px', left: '24px',
        background: innerBg,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {children}
      </div>
    </div>
  )
}

/* ─── Screen 1: Intro ─── */
function IntroScreen({ onTap }: { onTap: () => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px', position: 'relative', padding: '40px' }}>
      {/* Intro card — back of deck */}
      <SpicyCard
        bgImage={SPICY_INTRO_BG}
        innerBg="#b70012"
        onClick={onTap}
        style={{ boxShadow: '0 32px 80px rgba(183,0,18,0.4)', zIndex: 2 }}
      >
        {/* Title: "spicy starters" in Stick font */}
        <p style={{
          fontFamily: "'Stick', sans-serif",
          fontSize: '45px', color: '#df91b5',
          textAlign: 'center', lineHeight: 'normal',
          margin: 0, position: 'absolute',
          left: '50%', transform: 'translateX(-50%)',
          top: 'calc(50% - 138px)',
          width: '280px',
          whiteSpace: 'pre-line',
        }}>
          spicy{'\n'}starters
        </p>
        {/* Subtitle */}
        <p style={{
          fontFamily: "'Inter Tight', sans-serif",
          fontWeight: 300, fontSize: '14px', color: '#df91b5',
          textAlign: 'center', lineHeight: 'normal',
          margin: 0, position: 'absolute',
          left: '50%', transform: 'translateX(-50%)',
          top: 'calc(50% + 135px)',
          width: '148px',
          whiteSpace: 'normal',
        }}>
          CONVERSATION CARDS TO SHARE
        </p>
      </SpicyCard>

      {/* Hint text */}
      <p style={{
        fontFamily: "'Inter', sans-serif", fontWeight: 400,
        fontSize: '16px', color: 'rgba(255,255,255,0.5)',
        margin: 0, position: 'relative', zIndex: 2,
      }}>
        Tap the card to flip it.
      </p>
    </div>
  )
}

/* ─── Screen 2: Game ─── */
function GameScreen({ questions, onClose }: { questions: string[]; onClose: () => void }) {
  const [idx, setIdx]       = useState(0)
  const [flipping, setFlipping] = useState(false)

  const advance = useCallback(() => {
    if (flipping) return
    setFlipping(true)
    setTimeout(() => {
      setIdx(i => i + 1)
      setFlipping(false)
    }, 220)
  }, [flipping])

  const question = questions[idx % questions.length]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px', position: 'relative', padding: '40px 40px 60px' }}>

      {/* Game card — front side */}
      <div
        key={idx}
        className="tod-card-enter"
        style={{
          opacity: flipping ? 0 : 1,
          transform: flipping ? 'scale(0.96)' : 'scale(1)',
          transition: 'opacity 0.22s, transform 0.22s',
          zIndex: 2,
        }}
      >
        <SpicyCard
          bgImage={SPICY_CARD_BG}
          innerBg="#df91b5"
          style={{ boxShadow: '0 32px 80px rgba(171,18,41,0.35)' }}
        >
          {/* Question text — centered, slightly above middle */}
          <p style={{
            fontFamily: "'Staatliches', sans-serif",
            fontSize: '29.7px', color: '#ab1229',
            textAlign: 'center',
            lineHeight: 'normal',
            margin: 0,
            padding: '0 16px',
            position: 'absolute',
            left: 0, right: 0,
            top: '50%', transform: 'translateY(-50%)',
          }}>
            {question.toUpperCase()}
          </p>
        </SpicyCard>
      </div>

      {/* Card counter */}
      <p style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', margin: 0, zIndex: 2 }}>
        CARD {idx + 1}
      </p>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <button
          onClick={advance}
          style={{
            border: '1px solid #fff', background: 'none', borderRadius: '999px',
            padding: '12px 18px', width: '160px',
            fontFamily: "'Staatliches', sans-serif", fontSize: '16px',
            color: '#fff', cursor: 'pointer', textAlign: 'center',
            boxShadow: '0 10px 24px rgba(0,0,0,0.25)', letterSpacing: '0.05em',
          }}
        >
          SKIP FOR NOW
        </button>
        <button
          onClick={advance}
          style={{
            background: '#dc2827', border: 'none', borderRadius: '999px',
            padding: '12px 18px', width: '160px',
            fontFamily: "'Staatliches', sans-serif", fontSize: '16px',
            color: '#fff', cursor: 'pointer', textAlign: 'center',
            filter: 'drop-shadow(0 10px 12px rgba(220,40,39,0.35))', letterSpacing: '0.05em',
          }}
        >
          NEXT
        </button>
      </div>
    </div>
  )
}

/* ─── Root Component ─── */
type Step = 'intro' | 'game'

export default function SpicyStartersGame({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('intro')
  const [questions] = useState(() => shuffle(QUESTIONS))

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'transparent',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      <GameNav onBack={onClose} />

      {step === 'intro' && (
        <IntroScreen onTap={() => setStep('game')} />
      )}

      {step === 'game' && (
        <GameScreen questions={questions} onClose={onClose} />
      )}

      <GameFooter />
    </div>
  )
}
