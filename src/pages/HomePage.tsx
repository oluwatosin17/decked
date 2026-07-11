import { useState, useEffect, useRef } from 'react'
import { HomeCardRows, GAME_CARDS } from '../components/GameCardGrid'

const HERO_RED_IMG    = 'https://res.cloudinary.com/oluwatosin17/image/upload/f_auto,q_auto,w_480/decked/hero-red'
const HERO_CREAM_IMG  = 'https://res.cloudinary.com/oluwatosin17/image/upload/f_auto,q_auto,w_480/decked/hero-cream'
const HERO_BLUE_IMG   = 'https://res.cloudinary.com/oluwatosin17/image/upload/f_auto,q_auto,w_480/decked/hero-blue'
const HERO_GREEN_IMG  = 'https://res.cloudinary.com/oluwatosin17/image/upload/f_auto,q_auto,w_480/decked/hero-green'
const SOCIAL_TIKTOK   = '/icons/social-tiktok.svg'
const SOCIAL_INSTAGRAM = '/icons/social-instagram.svg'
const SOCIAL_WHATSAPP = '/icons/social-whatsapp.svg'

const FEATURED_IDS = ['truth-or-dare', 'spicy-starters', 'late-night-talks', 'charades', 'never-have-i-ever', 'you-laugh']
const FEATURED_ACTIONS: Record<string, 'onPlayTruthOrDare' | 'onPlaySpicyStarters' | 'onPlayLateNightTalks' | 'onBrowse'> = {
  'truth-or-dare': 'onPlayTruthOrDare',
  'spicy-starters': 'onPlaySpicyStarters',
  'late-night-talks': 'onPlayLateNightTalks',
  'charades': 'onBrowse',
  'never-have-i-ever': 'onBrowse',
  'you-laugh': 'onBrowse',
}

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

function MobileFeaturedGrid({ actions }: { actions: Record<string, () => void> }) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [colW, setColW] = useState(166)
  const allCards = GAME_CARDS(actions.onPlayTruthOrDare, actions.onPlaySpicyStarters, actions.onPlayLateNightTalks)
  const featured = allCards.filter(c => FEATURED_IDS.includes(c.id))

  useEffect(() => {
    const measure = () => {
      if (gridRef.current) {
        setColW(Math.floor((gridRef.current.offsetWidth - 10) / 2))
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '0 16px', alignItems: 'start' }}>
      {featured.map((card, i) => {
        const scale = colW / card.w
        const action = FEATURED_ACTIONS[card.id]
        const onClick = action ? actions[action] : undefined
        return (
          <div key={card.id} style={{ animation: `browse-card-enter 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 50}ms both` }}>
            <div
              onClick={onClick}
              style={{
                width: `${colW}px`, height: `${card.h * scale}px`,
                overflow: 'hidden', borderRadius: `${9 * scale}px`,
                cursor: onClick ? 'pointer' : 'default',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{
                width: `${card.w}px`, height: `${card.h}px`,
                transform: `scale(${scale})`, transformOrigin: 'top left',
              }}>
                {card.render(onClick)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function HomePage({ onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks, onBrowse }: Props) {
  const isMobile = useIsMobile()
  const actions = { onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks, onBrowse }

  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
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

        {/* Mobile featured cards grid — uses exact desktop card designs, scaled down */}
        <section style={{ padding: '32px 0 24px' }}>
          <h2 className="font-spicy" style={{ color: 'white', fontSize: '32px', margin: '0 0 16px 16px' }}>Pick your vibe.</h2>
          <MobileFeaturedGrid actions={actions} />
          <div style={{ padding: '16px 16px 0', textAlign: 'center' }}>
            <button className="font-staatliches game-btn" onClick={onBrowse} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: '14px', padding: '10px 24px', borderRadius: '999px', cursor: 'pointer',
              width: '100%', letterSpacing: '0.04em',
            }}>VIEW ALL GAMES</button>
          </div>
        </section>

        {/* Mobile footer */}
        <footer className="home-footer" style={{
          marginTop: 'auto', background: 'rgba(5,5,12,0.92)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          padding: '20px 16px 24px', display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p className="font-anton" style={{ color: '#fff', fontSize: '18px', margin: 0, letterSpacing: '0.4px' }}>DECKED</p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {[SOCIAL_TIKTOK, SOCIAL_INSTAGRAM, SOCIAL_WHATSAPP].map((src, i) => (
                <img key={i} src={src} alt="" style={{ width: '16px', height: '16px', borderRadius: '4px', objectFit: 'contain', opacity: 0.7 }} />
              ))}
            </div>
          </div>
          <p className="font-inter" style={{ color: '#6b7280', fontSize: '12px', lineHeight: 1.4, margin: 0 }}>
            Pick a deck, pass the phone, and let the chaos begin.
          </p>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ color: '#4b5563', fontSize: '11px', margin: 0, fontFamily: 'Inter, sans-serif' }}>© 2026 DECKED</p>
            <div style={{ display: 'flex', gap: '16px' }}>
              {['Privacy', 'Terms'].map(l => (
                <span key={l} style={{ color: '#6b7280', fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>{l}</span>
              ))}
            </div>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

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
            <button className="font-staatliches" onClick={onPlayTruthOrDare} style={{
              background: '#dc2827', color: 'white', fontSize: '16px',
              padding: '12px 18px', borderRadius: '999px', border: 'none',
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: '0 10px 12px rgba(220,40,39,0.25)', transition: 'background 0.2s',
            }}
              onMouseOver={e => (e.currentTarget.style.background = '#c41f1e')}
              onMouseOut={e => (e.currentTarget.style.background = '#dc2827')}>
              QUICK PLAY
            </button>
            <button className="font-staatliches" onClick={onBrowse} style={{
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
      <footer className="home-footer" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '40px', padding: '32px 60px', background: 'rgba(5,5,12,0.80)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
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
