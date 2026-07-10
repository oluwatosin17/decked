import { useState, useEffect } from 'react'
import { HomeCardRows } from '../components/GameCardGrid'

const HERO_RED_IMG    = 'https://res.cloudinary.com/oluwatosin17/image/upload/f_auto,q_auto,w_480/decked/hero-red'
const HERO_CREAM_IMG  = 'https://res.cloudinary.com/oluwatosin17/image/upload/f_auto,q_auto,w_480/decked/hero-cream'
const HERO_BLUE_IMG   = 'https://res.cloudinary.com/oluwatosin17/image/upload/f_auto,q_auto,w_480/decked/hero-blue'
const HERO_GREEN_IMG  = 'https://res.cloudinary.com/oluwatosin17/image/upload/f_auto,q_auto,w_480/decked/hero-green'
const SOCIAL_TIKTOK   = '/icons/social-tiktok.svg'
const SOCIAL_INSTAGRAM = '/icons/social-instagram.svg'
const SOCIAL_WHATSAPP = '/icons/social-whatsapp.svg'

const MOBILE_FEATURED_CARDS: {
  id: string; svg: string; action: 'onPlayTruthOrDare' | 'onPlaySpicyStarters' | 'onPlayLateNightTalks' | 'onBrowse'
  label?: string | string[]; font?: string; color?: string; fontSize?: string; sub?: string; subColor?: string
  hasEmbeddedText?: boolean
}[] = [
  { id: 'truth-or-dare', svg: '/icons/truth-or-dare-mobile.svg', action: 'onPlayTruthOrDare',
    label: ['TRUTH', 'OR DARE'], font: "'Satoshi', sans-serif", color: '#000', fontSize: '20px', sub: 'FOR COUPLES', subColor: '#181b25' },
  { id: 'spicy-starters', svg: '/icons/spicy-starters-mobile.svg', action: 'onPlaySpicyStarters',
    label: ['spicy', 'starters'], font: "'Stick', sans-serif", color: '#fff', fontSize: '24px' },
  { id: 'late-night-talks', svg: '/icons/late-night-talks-mobile.svg', action: 'onPlayLateNightTalks',
    label: ['Late', 'Night', 'Talks'], font: "'Slackey', cursive", color: '#ff440e', fontSize: '20px' },
  { id: 'charades', svg: '/icons/charades-mobile.svg', action: 'onBrowse',
    label: 'Charades', font: "'Slackey', cursive", color: '#e8e6e3', fontSize: '26px' },
  { id: 'never-have-i-ever', svg: '/icons/never-have-i-ever-mobile.svg', action: 'onBrowse',
    label: ['NEVER', 'HAVE I', 'EVER'], font: "'Single Day', cursive", color: '#bb33ff', fontSize: '24px' },
  { id: 'you-laugh', svg: '/icons/you-laugh-you-are-out-mobile.svg', action: 'onBrowse', hasEmbeddedText: true },
]

function useIsMobile(bp = 768) {
  const [m, setM] = useState(typeof window !== 'undefined' ? window.innerWidth <= bp : false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp}px)`)
    const h = (e: MediaQueryListEvent) => setM(e.matches)
    setM(mq.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [bp])
  return m
}

interface Props {
  onPlayTruthOrDare: () => void
  onPlaySpicyStarters: () => void
  onPlayLateNightTalks: () => void
  onBrowse: () => void
}

export default function HomePage({ onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks, onBrowse }: Props) {
  const isMobile = useIsMobile()
  const actions = { onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks, onBrowse }

  if (isMobile) {
    return (
      <div style={{ background: 'transparent', minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Mobile nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px', padding: '0 16px', position: 'relative', zIndex: 20 }}>
          <span className="font-anton" style={{ color: '#fff', fontSize: '22px', letterSpacing: '0.56px', fontWeight: 400 }}>DECKED</span>
        </nav>

        {/* Mobile hero */}
        <div className="screen-enter" style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
          <h1 className="font-spicy" style={{ color: 'white', fontSize: '42px', lineHeight: 1, margin: 0 }}>
            The party starts here
          </h1>
          <p className="font-satoshi" style={{ color: '#d9dbde', fontSize: '16px', lineHeight: '20px', margin: 0 }}>
            Pick a deck, pass the phone, and let things get interesting.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="font-staatliches" onClick={onPlayTruthOrDare} style={{
              background: '#dc2827', color: 'white', fontSize: '14px',
              padding: '10px 16px', borderRadius: '999px', border: 'none', cursor: 'pointer',
              boxShadow: '0 8px 12px rgba(220,40,39,0.25)',
            }}>QUICK PLAY</button>
            <button className="font-staatliches" onClick={onBrowse} style={{
              background: 'transparent', color: 'white', fontSize: '14px',
              padding: '10px 16px', borderRadius: '999px', border: '1px solid white', cursor: 'pointer',
            }}>BROWSE GAMES</button>
          </div>
        </div>

        {/* Mobile featured cards grid */}
        <section style={{ padding: '32px 0 24px' }}>
          <h2 className="font-spicy" style={{ color: 'white', fontSize: '32px', margin: '0 0 16px 16px' }}>Pick your vibe.</h2>
          <div className="home-mobile-grid">
            {MOBILE_FEATURED_CARDS.map((card, i) => {
              const lines = Array.isArray(card.label) ? card.label : card.label ? [card.label] : []
              return (
                <div
                  key={card.id}
                  className="home-mobile-card"
                  onClick={actions[card.action]}
                  style={{ animation: `browse-card-enter 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 50}ms both`, position: 'relative' }}
                >
                  <img src={card.svg} alt="" style={{ position: 'relative', zIndex: 1 }} />
                  {!card.hasEmbeddedText && lines.length > 0 && (
                    <div style={{
                      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', zIndex: 2, padding: '12px',
                      pointerEvents: 'none', textAlign: 'center', gap: '2px',
                    }}>
                      {lines.map((line, j) => (
                        <span key={j} style={{
                          fontFamily: card.font, fontSize: card.fontSize,
                          color: card.color, lineHeight: 1.1, fontWeight: 500,
                        }}>{line}</span>
                      ))}
                      {card.sub && (
                        <span style={{
                          fontFamily: "'Inter Tight', sans-serif", fontSize: '8px',
                          color: card.subColor || card.color, marginTop: '6px', fontWeight: 300,
                        }}>{card.sub}</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ padding: '16px 16px 0', textAlign: 'center' }}>
            <button className="font-staatliches game-btn" onClick={onBrowse} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: '14px', padding: '10px 24px', borderRadius: '999px', cursor: 'pointer',
              width: '100%', letterSpacing: '0.04em',
            }}>VIEW ALL GAMES</button>
          </div>
        </section>

        {/* Mobile footer */}
        <footer style={{ marginTop: 'auto', background: 'rgba(5,5,12,0.80)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p className="font-anton" style={{ color: '#fff', fontSize: '24px', margin: 0 }}>DECKED</p>
            <p className="font-inter" style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>
              Pick a deck, pass the phone, and let the chaos begin.
            </p>
          </div>
          <div style={{ height: '1px', background: '#212326' }} />
          <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0, fontFamily: 'Inter, sans-serif' }}>© 2026 DECKED. All rights reserved.</p>
        </footer>
      </div>
    )
  }

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', position: 'relative', zIndex: 1 }}>

      <section className="home-hero relative w-full overflow-hidden" style={{ height: '943px' }}>

        {/* Nav */}
        <nav className="home-nav" style={{
          position: 'relative', zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '80px', padding: '0 60px',
        }}>
          <span className="font-anton" style={{ color: '#ffffff', fontSize: '28px', letterSpacing: '0.56px', lineHeight: 'normal', fontWeight: 400 }}>
            DECKED
          </span>
          <div className="home-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {['Browse Games', 'How to Play', 'About'].map(label => (
              <button key={label} onClick={label === 'Browse Games' ? onBrowse : undefined}
                className="font-anton game-btn"
                style={{
                  background: 'none', border: 'none', padding: 0,
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '16px', fontWeight: 400, lineHeight: 'normal',
                  cursor: label === 'Browse Games' ? 'pointer' : 'default',
                }}>
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Hero copy */}
        <div className="home-hero-copy absolute z-20" style={{
          top: '108px', left: '50%', transform: 'translateX(-50%)',
          width: '435px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', textAlign: 'center', width: '100%' }}>
            <h1 className="font-spicy" style={{ color: 'white', fontSize: '70px', lineHeight: 1, width: '100%', margin: 0 }}>
              The party starts here
            </h1>
            <p className="font-satoshi" style={{ color: '#d9dbde', fontSize: '20px', lineHeight: '22px', letterSpacing: '-0.2px', width: '100%', margin: 0 }}>
              Pick a deck, pass the phone, and let things get interesting.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="font-staatliches" style={{
              background: '#dc2827', color: 'white', fontSize: '16px',
              padding: '12px 18px', borderRadius: '999px', border: 'none',
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: '0 10px 12px rgba(220,40,39,0.25)', transition: 'background 0.2s',
            }}
              onMouseOver={e => (e.currentTarget.style.background = '#c41f1e')}
              onMouseOut={e => (e.currentTarget.style.background = '#dc2827')}>
              QUICK PLAY
            </button>
            <button className="font-staatliches" style={{
              background: 'transparent', color: 'white', fontSize: '16px',
              padding: '12px 18px', borderRadius: '999px', border: '1px solid white',
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: '0 10px 24px rgba(220,40,39,0.25)', transition: 'background 0.2s',
            }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
              BROWSE GAMES
            </button>
          </div>
        </div>

        {/* Floating hero cards (Group 7, x=232 y=432 in Figma) */}
        <div className="home-hero-cards absolute z-10" style={{ left: 'calc(50% - 488.5px)', top: '432px', width: '977px', height: '483px' }}>

          {/* Card 1: Red, -6.38deg */}
          <div className="hero-card absolute flex items-center justify-center" style={{ left: 0, top: 0, width: '317px', height: '380px' }}>
            <div className="relative rounded-[12px]" style={{ width: '280px', height: '351px', background: '#e4422b', transform: 'rotate(-6.38deg)' }}>
              <div className="absolute rounded-[6px] overflow-hidden" style={{ left: '20px', top: '20px', width: '240px', height: '168px' }}>
                <img src={HERO_RED_IMG} alt="" className="w-full h-full object-cover" />
              </div>
              <p className="font-staatliches text-[#ffffc8] absolute" style={{ left: '21px', right: '22px', top: '219px', bottom: '48px', fontSize: '22px', lineHeight: '1.2' }}>
                WHAT'S ONE THING SOMEONE CAN DO THAT INSTANTLY MAKES THEM MORE ATTRACTIVE?
              </p>
            </div>
          </div>

          {/* Card 2: Cream, +11.44deg */}
          <div className="hero-card absolute flex items-center justify-center" style={{ left: '230px', top: '47px', width: '344px', height: '400px' }}>
            <div className="relative rounded-[12px]" style={{ width: '280px', height: '351px', background: '#f6ebdb', transform: 'rotate(11.44deg)' }}>
              <div className="absolute rounded-[6px] overflow-hidden" style={{ left: '20px', top: '20px', width: '240px', height: '168px' }}>
                <img src={HERO_CREAM_IMG} alt="" className="w-full h-full object-cover" />
              </div>
              <p className="font-staatliches text-[#635847] absolute" style={{ left: '16px', right: '27px', top: '211px', bottom: '28px', fontSize: '22px', lineHeight: '1.2' }}>
                TAKE A SIP IF YOU'VE EVER STAYED UP ALL NIGHT THINKING ABOUT SOMEONE IN THIS CIRCLE.
              </p>
            </div>
          </div>

          {/* Card 3: Blue, -2.93deg */}
          <div className="hero-card absolute flex items-center justify-center" style={{ left: '473px', top: 0, width: '298px', height: '365px' }}>
            <div className="relative rounded-[12px]" style={{ width: '280px', height: '351px', background: '#1591cd', transform: 'rotate(-2.93deg)' }}>
              <div className="absolute rounded-[6px] overflow-hidden" style={{ left: '20px', top: '20px', width: '240px', height: '168px' }}>
                <img src={HERO_BLUE_IMG} alt="" className="w-full h-full object-cover" />
              </div>
              <p className="font-staatliches text-[#affffe] absolute" style={{ left: '21px', right: '22px', top: '219px', bottom: '20px', fontSize: '22px', lineHeight: '1.2' }}>
                IF YOU WERE ACCUSED OF A CRIME, WHAT WOULD YOUR FRIENDS GENUINELY ASSUME YOU DID?
              </p>
            </div>
          </div>

          {/* Card 4: Green, +1.12deg */}
          <div className="hero-card absolute flex items-center justify-center" style={{ left: '690px', top: '126px', width: '287px', height: '357px' }}>
            <div className="relative rounded-[12px]" style={{ width: '280px', height: '351px', background: '#58f89f', transform: 'rotate(1.12deg)' }}>
              <div className="absolute rounded-[6px] overflow-hidden" style={{ left: '20px', top: '20px', width: '240px', height: '168px' }}>
                <img src={HERO_GREEN_IMG} alt="" className="w-full h-full object-cover" />
              </div>
              <p className="font-staatliches text-[#034f0d] absolute" style={{ left: '20px', right: '23px', top: '219px', bottom: '48px', fontSize: '22px', lineHeight: '1.2' }}>
                WHAT DO YOU THINK IS THE MOST MISUNDERSTOOD PART OF YOUR PERSONALITY?
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CARD LIBRARY SECTION
      ══════════════════════════════════════════════ */}
      <section className="cards-section home-cards-section w-full" style={{ paddingTop: '90px', paddingBottom: '80px' }}>
        <div style={{ width: '1320px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <h2 className="font-spicy" style={{ color: 'white', fontSize: '60px', lineHeight: 'normal', margin: 0 }}>
            Pick your vibe.
          </h2>

          <HomeCardRows onPlayTruthOrDare={onPlayTruthOrDare} onPlaySpicyStarters={onPlaySpicyStarters} onPlayLateNightTalks={onPlayLateNightTalks} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════ */}
      <footer style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '40px', padding: '32px 60px', background: 'rgba(5,5,12,0.80)', backdropFilter: 'blur(4px)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '420px' }}>
            <p className="font-anton text-white" style={{ fontSize: '32px' }}>DECKED</p>
            <p className="font-inter" style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.5 }}>
              Pick a deck, pass the phone, and let the chaos begin. 10+ party card games, no app, no login, no excuses.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={SOCIAL_TIKTOK}    alt="TikTok"    className="rounded-[8px]" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            <img src={SOCIAL_INSTAGRAM} alt="Instagram" className="rounded-[8px]" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            <img src={SOCIAL_WHATSAPP}  alt="WhatsApp"  className="rounded-[8px]" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
          </div>
        </div>
        <div style={{ width: '100%', height: '1px', background: '#212326' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
          <p style={{ color: '#9ca3af' }}>© 2026 DECKED. All rights reserved.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: 'white' }}>
            {['Privacy', 'Terms', 'Cookie'].map(label => (
              <a key={label} href="#" style={{ color: 'white', textDecoration: 'none' }}
                onMouseOver={e => (e.currentTarget.style.color = '#9ca3af')}
                onMouseOut={e => (e.currentTarget.style.color = 'white')}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
