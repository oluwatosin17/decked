import { HomeCardRows } from '../components/GameCardGrid'
// React JSX handled by vite/react plugin — no explicit import needed

/* ── Figma-hosted assets ─────────────────────────────────────────── */
// Hero card images (permanently hosted on Cloudinary — see /decked folder)
const HERO_RED_IMG    = 'https://res.cloudinary.com/oluwatosin17/image/upload/f_auto,q_auto,w_480/decked/hero-red'
const HERO_CREAM_IMG  = 'https://res.cloudinary.com/oluwatosin17/image/upload/f_auto,q_auto,w_480/decked/hero-cream'
const HERO_BLUE_IMG   = 'https://res.cloudinary.com/oluwatosin17/image/upload/f_auto,q_auto,w_480/decked/hero-blue'
const HERO_GREEN_IMG  = 'https://res.cloudinary.com/oluwatosin17/image/upload/f_auto,q_auto,w_480/decked/hero-green'
// Footer social icons
const SOCIAL_TIKTOK   = '/icons/social-tiktok.svg'
const SOCIAL_INSTAGRAM = '/icons/social-instagram.svg'
const SOCIAL_WHATSAPP = '/icons/social-whatsapp.svg'

interface Props {
  onPlayTruthOrDare: () => void
  onPlaySpicyStarters: () => void
  onPlayLateNightTalks: () => void
  onBrowse: () => void
}

/* ── Main component ───────────────────────────────────────────────── */
export default function HomePage({ onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks, onBrowse }: Props) {
  return (
    <div style={{ background: 'transparent', minHeight: '100vh', position: 'relative', zIndex: 1 }}>

      {/* ══════════════════════════════════════════════
          HERO SECTION  (943px tall)
      ══════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden" style={{ height: '943px' }}>

        {/* Nav — matches Figma: wordmark left, 3 text links right, no CTA button */}
        <nav style={{
          position: 'relative', zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '80px', padding: '0 60px',
        }}>
          <span className="font-anton" style={{ color: '#ffffff', fontSize: '28px', letterSpacing: '0.56px', lineHeight: 'normal', fontWeight: 400 }}>
            DECKED
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
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

        {/* Hero copy — centered in the 1440px frame */}
        <div className="absolute z-20" style={{
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
        <div className="absolute z-10" style={{ left: 'calc(50% - 488.5px)', top: '432px', width: '977px', height: '483px' }}>

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
      <section className="cards-section w-full" style={{ paddingTop: '90px', paddingBottom: '80px' }}>
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
