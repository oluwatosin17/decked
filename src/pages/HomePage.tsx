// React JSX handled by vite/react plugin — no explicit import needed

/* ── Figma-hosted assets ─────────────────────────────────────────── */
// Hero card images
const HERO_RED_IMG    = 'https://www.figma.com/api/mcp/asset/5142f7b4-d5cd-4f24-b0ce-052defd6bc6e'
const HERO_CREAM_IMG  = 'https://www.figma.com/api/mcp/asset/4abb3ef5-d029-4038-9a14-68601f218261'
const HERO_BLUE_IMG   = 'https://www.figma.com/api/mcp/asset/485de5ec-df05-426b-af8a-52b165e138f8'
const HERO_GREEN_IMG  = 'https://www.figma.com/api/mcp/asset/d60df7b9-e444-48c9-bca9-7b0e376d357c'
// Truth or Dare card assets
const HEART_FILLED    = 'https://www.figma.com/api/mcp/asset/19850587-e4a6-40f3-b8cb-3013457f4350'
const HEART_OUTLINE   = 'https://www.figma.com/api/mcp/asset/e05fbcbd-1a73-4232-8ed0-834f5deb7143'
// Card deck assets
const SPICY_BG        = 'https://www.figma.com/api/mcp/asset/c6c6bacb-a434-4ccf-aa10-19832dd03ffe'
const LATE_NIGHT_OUTER = 'https://www.figma.com/api/mcp/asset/501e22f1-6dc4-438b-92ad-f653be26cdfd'
const LATE_NIGHT_MID  = 'https://www.figma.com/api/mcp/asset/a76352f1-92c5-4093-93e3-0b3a39e23a10'
const LATE_NIGHT_INNER = 'https://www.figma.com/api/mcp/asset/6b924388-5737-4918-bd6d-a0c21cee9eda'
const LATE_NIGHT_CHAT = 'https://www.figma.com/api/mcp/asset/9ffded60-567b-481b-a0ea-4fe2afd8c789'
const LATE_NIGHT_SPARK1 = 'https://www.figma.com/api/mcp/asset/64837b09-e033-463d-a1a5-3e950a54f0bf'
const LATE_NIGHT_SPARK2 = 'https://www.figma.com/api/mcp/asset/95e34e79-e165-4a6f-a872-0f44980b5acb'
const NEVER_BUBBLE    = 'https://www.figma.com/api/mcp/asset/0cb08488-1314-4e8e-b5af-d378137ec03f'
const RECONNECT_DOT1  = 'https://www.figma.com/api/mcp/asset/41c118af-cfdc-47e3-8768-9aee9451ba33'
const RECONNECT_DOT2  = 'https://www.figma.com/api/mcp/asset/51046d80-3d02-42b4-8d17-29b32fcaaca0'
const YOU_LAUGH_BANNER1 = 'https://www.figma.com/api/mcp/asset/9f218abd-7c4e-4644-a8b9-13c31f50281b'
const YOU_LAUGH_BANNER2 = 'https://www.figma.com/api/mcp/asset/1ed26443-62c6-4281-8a89-2fbd70ce4f0e'
// Footer social icons
const SOCIAL_TIKTOK   = 'https://www.figma.com/api/mcp/asset/95bd2c19-cbff-47df-888f-c2dcd17eb88c'
const SOCIAL_INSTAGRAM = 'https://www.figma.com/api/mcp/asset/48f45e3e-baf4-48c6-8fd2-e665f8a64015'
const SOCIAL_WHATSAPP = 'https://www.figma.com/api/mcp/asset/94019f0b-e964-4c74-9a75-a02630ef9f90'

interface Props {
  onPlayTruthOrDare: () => void
}

/* ── Truth or Dare card hearts band ───────────────────────────────── */
function HeartsRow({ top }: { top: boolean }) {
  const hearts = [
    HEART_FILLED, HEART_FILLED, HEART_FILLED, HEART_FILLED, HEART_OUTLINE,
    HEART_FILLED, HEART_FILLED, HEART_OUTLINE, HEART_FILLED, HEART_FILLED, HEART_FILLED,
  ]
  return (
    <div style={{
      position: 'absolute',
      [top ? 'top' : 'bottom']: 0,
      left: 0, right: 0,
      height: '66.25px',
      background: '#dc2827',
      overflow: 'hidden',
    }}>
      {/* pink stripes */}
      <div style={{
        position: 'absolute',
        left: 0, right: 0,
        [top ? 'top' : 'bottom']: '47.21px',
        display: 'flex', flexDirection: 'column', gap: '0.761px',
      }}>
        {top
          ? <><div style={{ height: '5.33px', background: '#ecc1c9', width: '100%' }} /><div style={{ height: '3.046px', background: '#ecc1c9', width: '100%' }} /></>
          : <><div style={{ height: '3.046px', background: '#ecc1c9', width: '100%' }} /><div style={{ height: '5.33px', background: '#ecc1c9', width: '100%' }} /></>
        }
      </div>
      {/* heart row */}
      <div style={{
        position: 'absolute',
        left: '50%', transform: 'translateX(-50%)',
        [top ? 'top' : 'top']: top ? '11.42px' : '30.46px',
        display: 'flex', gap: '3.807px', alignItems: 'center', whiteSpace: 'nowrap',
      }}>
        {hearts.map((src, i) => (
          <img key={i} src={src} alt=""
            style={{ width: '24.368px', height: '24.368px', flexShrink: 0, transform: i % 2 === 1 ? 'scaleY(-1)' : 'none' }}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────── */
export default function HomePage({ onPlayTruthOrDare }: Props) {
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
              <a key={label} href="#" className="font-anton" style={{
                textDecoration: 'none',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '16px', fontWeight: 400, lineHeight: 'normal',
                transition: 'color 0.2s',
              }}
                onMouseOver={e => (e.currentTarget.style.color = '#ffffff')}
                onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
                {label}
              </a>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* ── ROW 1 ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

              {/* TRUTH OR DARE */}
              <div className="card-tile" onClick={onPlayTruthOrDare} style={{
                width: '345.716px', height: '348px', background: 'white',
                borderRadius: '15.23px', overflow: 'hidden', position: 'relative', flexShrink: 0,
              }}>
                <HeartsRow top={true} />
                <HeartsRow top={false} />
                {/* center text */}
                <div style={{
                  position: 'absolute', left: '50%', top: '50%',
                  transform: 'translate(-50%,-50%)',
                  width: '183.906px', height: '123.677px',
                }}>
                  <p className="font-satoshi" style={{
                    position: 'absolute', left: '2.29px', right: '-2.29px', top: '1.52px',
                    fontSize: '38.074px', fontWeight: 500, color: '#000',
                    textAlign: 'center', lineHeight: 'normal', margin: 0,
                  }}>TRUTH OR DARE</p>
                  <p className="font-satoshi" style={{
                    position: 'absolute', left: '2.29px', right: '-2.29px', top: 0,
                    fontSize: '38.074px', fontWeight: 500, color: '#d39293',
                    textAlign: 'center', lineHeight: 'normal', margin: 0,
                  }}>TRUTH OR DARE</p>
                  <p className="font-satoshi" style={{
                    position: 'absolute', left: 0, right: 0, top: '105.4px',
                    fontSize: '18.276px', color: '#181b25', textAlign: 'center', margin: 0,
                  }}>FOR COUPLES</p>
                </div>
              </div>

              {/* SPICY STARTERS */}
              <div className="card-tile" style={{
                width: '277.948px', height: '348px', background: '#df91b5',
                borderRadius: '9.039px', overflow: 'hidden', position: 'relative', flexShrink: 0,
              }}>
                <div style={{ position: 'absolute', left: '-70.05px', top: 0, width: '348px', height: '348px', overflow: 'hidden' }}>
                  <img src={SPICY_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '6.62%', left: '25.45%', right: '6.69%', bottom: '6.1%', background: '#b70012' }} />
                </div>
                <p className="font-stick" style={{
                  position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                  top: 'calc(50% - 124.3px)', width: '272.19px',
                  fontSize: '48px', color: '#df91b5', textAlign: 'center', lineHeight: 1,
                }}>spicy<br />starters</p>
                <p className="font-inter-tight" style={{
                  position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                  top: 'calc(50% + 102.59px)', width: '112.54px',
                  fontSize: '10.85px', color: '#df91b5', textAlign: 'center', fontWeight: 300,
                }}>CONVERSATION CARDS TO SHARE</p>
              </div>

              {/* RED FLAG / GREEN FLAG */}
              <div className="card-tile" style={{
                width: '267.692px', height: '348px', borderRadius: '8.705px',
                overflow: 'hidden', flexShrink: 0, position: 'relative',
              }}>
                <img src="/assets/games/redflag-greenflag.png" alt="Red Flag / Green Flag" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{
                  position: 'absolute', left: '120.96px', top: '113.51px',
                  transform: 'translate(-50%,-50%) rotate(-9.27deg)',
                  width: '130.582px', height: '59.743px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                }}>
                  <p className="font-spicy" style={{ fontSize: '22.909px', color: '#e7f0ff', textAlign: 'center', lineHeight: 'normal', margin: 0 }}>Red<br />flag</p>
                </div>
                <div style={{
                  position: 'absolute', left: '163.19px', top: '215.93px',
                  transform: 'translate(-50%,-50%) rotate(-9.27deg)',
                  width: '130.582px', height: '59.743px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                }}>
                  <p className="font-spicy" style={{ fontSize: '22.909px', color: '#e7f0ff', textAlign: 'center', lineHeight: 'normal', margin: 0 }}>Green<br />flag</p>
                </div>
              </div>

              {/* ICEBREAKER */}
              <div className="card-tile" style={{
                width: '277.948px', height: '348px', borderRadius: '9.039px',
                overflow: 'hidden', flexShrink: 0, position: 'relative',
              }}>
                <img src="/assets/games/icebreaker.png" alt="Icebreaker" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <p className="font-staatliches" style={{
                  position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                  top: 'calc(50% - 56.04px)', fontSize: '39.088px', color: '#000',
                  textAlign: 'center', whiteSpace: 'nowrap', margin: 0, pointerEvents: 'none',
                }}>ICEBREAKER</p>
              </div>
            </div>

            {/* ── ROW 2 ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

              {/* DINNER TABLE */}
              <div className="card-tile" style={{
                width: '277.948px', height: '348px', borderRadius: '9.039px',
                overflow: 'hidden', flexShrink: 0, position: 'relative',
              }}>
                <img src="/assets/games/dinner-table.png" alt="Dinner Table Conversation" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div className="font-staatliches" style={{
                  position: 'absolute', left: '10.85px', top: '28.92px',
                  fontSize: '27.117px', color: '#e8e6e3', lineHeight: 'normal',
                  whiteSpace: 'nowrap', pointerEvents: 'none',
                }}>
                  <p style={{ margin: 0, lineHeight: 'normal' }}>DINNER TABLE</p>
                  <p style={{ margin: 0, lineHeight: 'normal' }}>CONVERSATION</p>
                </div>
              </div>

              {/* LATE NIGHT TALKS */}
              <div className="card-tile" style={{
                width: '359.601px', height: '348px', position: 'relative',
                flexShrink: 0, display: 'inline-grid', placeItems: 'start',
              }}>
                <img src={LATE_NIGHT_OUTER} alt="" style={{ gridColumn: 1, gridRow: 1, width: '359.601px', height: '348px', objectFit: 'contain' }} />
                <img src={LATE_NIGHT_MID} alt="" style={{ gridColumn: 1, gridRow: 1, marginLeft: '54.78px', marginTop: '59.62px', width: '252.632px', height: '239.488px', objectFit: 'contain' }} />
                <img src={LATE_NIGHT_INNER} alt="" style={{ gridColumn: 1, gridRow: 1, marginLeft: '59.79px', marginTop: '65.66px', width: '242.609px', height: '227.392px', objectFit: 'contain' }} />
                <div style={{ gridColumn: 1, gridRow: 1, marginLeft: '77.41px', marginTop: '156px', width: '168.435px', display: 'flex', flexDirection: 'column', gap: '3.75px', position: 'relative' }}>
                  <p className="font-slackey" style={{ fontSize: '33.78px', color: '#ff440e', lineHeight: 1, margin: 0 }}>Late</p>
                  <p className="font-slackey" style={{ fontSize: '33.78px', color: '#ff440e', lineHeight: 1, margin: 0 }}>Night</p>
                  <p className="font-slackey" style={{ fontSize: '51.61px', color: '#ff440e', lineHeight: 1, margin: 0 }}>Talks</p>
                  <img src={LATE_NIGHT_CHAT} alt="" style={{ position: 'absolute', left: '106.21px', top: '-17.07px', width: '82.889px', height: '82.889px' }} />
                </div>
                <img src={LATE_NIGHT_SPARK1} alt="" style={{ gridColumn: 1, gridRow: 1, marginLeft: '279.89px', marginTop: '15.74px', width: '32.915px', height: '11.717px' }} />
                <img src={LATE_NIGHT_SPARK2} alt="" style={{ gridColumn: 1, gridRow: 1, marginLeft: '321.05px', marginTop: '27.71px', width: '6.837px', height: '4.297px' }} />
              </div>

              {/* EVERYDAY CONVERSATION (rotated 90deg card) */}
              <div style={{ width: '348px', height: '277.948px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                <div style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                  <div className="card-tile" style={{ width: '277.948px', height: '348px', background: '#eae6e1', borderRadius: '9.039px', overflow: 'hidden', position: 'relative' }}>
                    {/* grain overlay */}
                    <div style={{
                      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, opacity: 0.55,
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
                      backgroundSize: '200px 200px', mixBlendMode: 'multiply',
                    }} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4.52px', zIndex: 2 }}>
                      <div style={{ width: '13px', height: '182px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ transform: 'rotate(90deg)' }}>
                          <p className="font-inter-tight" style={{ fontSize: '10.85px', color: '#181b25', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: 300 }}>
                            Questions to build genuine connection
                          </p>
                        </div>
                      </div>
                      <div style={{ width: '94px', height: '196px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ transform: 'rotate(90deg)' }}>
                          <p className="font-spicy" style={{ fontSize: '34.37px', color: '#0f973d', textAlign: 'center', lineHeight: 1, whiteSpace: 'nowrap' }}>
                            everyday<br />conversation
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CHARADES */}
              <div className="card-tile" style={{ width: '277.948px', height: '348px', background: '#ed3844', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                <p className="font-slackey" style={{
                  position: 'absolute',
                  left: 'calc(50% - 124.06px)', top: 'calc(50% - 29.38px)',
                  fontSize: '42.55px', color: '#e8e6e3', whiteSpace: 'nowrap',
                }}>Charades</p>
              </div>
            </div>

            {/* ── ROW 3 ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>

              {/* WE'RE NOT REALLY STRANGERS */}
              <div className="card-tile" style={{ width: '348.041px', height: '257.189px', borderRadius: '9.04px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                <img src="/assets/games/strangers.png" alt="We're Not Really Strangers" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', left: 0, right: 0, top: '5.42px', display: 'flex', flexDirection: 'column', gap: '0.452px', pointerEvents: 'none' }}>
                  <div style={{ height: '1.808px', background: '#e8e6e3', width: '100%' }} />
                  <div style={{ height: '3.164px', background: '#e8e6e3', width: '100%' }} />
                </div>
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: '5.42px', display: 'flex', flexDirection: 'column', gap: '0.452px', pointerEvents: 'none' }}>
                  <div style={{ height: '1.808px', background: '#e8e6e3', width: '100%' }} />
                  <div style={{ height: '3.164px', background: '#e8e6e3', width: '100%' }} />
                </div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <p className="font-satoshi" style={{ fontSize: '20px', fontWeight: 700, color: '#e8e6e3', textTransform: 'uppercase', whiteSpace: 'nowrap', margin: 0 }}>
                    We're not really strangers
                  </p>
                </div>
              </div>

              {/* NEVER HAVE I EVER */}
              <div className="card-tile" style={{ width: '277.981px', height: '348.041px', background: '#cc66ff', borderRadius: '9.04px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '26.22px', width: '198.429px', height: '198.429px', background: '#fefefe', borderRadius: '2.712px' }} />
                <p className="font-single-day" style={{
                  position: 'absolute', top: '13.9%', left: '18.37%', right: '18.21%', bottom: '43.01%',
                  fontSize: '49.72px', color: '#bb33ff', textAlign: 'center', lineHeight: '49.72px',
                }}>NEVER HAVE I EVER</p>
                <div style={{ position: 'absolute', left: '109.38px', top: '196.17px', width: '59.212px', height: '59.212px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ transform: 'scaleY(-1)' }}>
                    <img src={NEVER_BUBBLE} alt="" style={{ width: '55.5px', height: '44.4px', objectFit: 'contain' }} />
                  </div>
                </div>
                <p className="font-satoshi" style={{
                  position: 'absolute', left: 'calc(50% - 48.14px)', top: '326.8px',
                  fontSize: '7.232px', fontWeight: 700, color: '#fefefe', whiteSpace: 'nowrap', textTransform: 'uppercase',
                }}>GAME OF POOR DECISIONS</p>
              </div>

              {/* LET'S RECONNECT */}
              <div className="card-tile" style={{ width: '277.981px', height: '348.041px', background: '#e9b1ba', borderRadius: '9.04px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                <p className="font-luckiest" style={{
                  position: 'absolute', left: '138.99px', transform: 'translateX(-50%)',
                  top: 'calc(50% - 108.48px)', width: '209.277px',
                  fontSize: '36.16px', color: '#d22f49', textAlign: 'center', lineHeight: 1.15,
                }}>Let's reconnect</p>
                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '296.06px', display: 'flex', alignItems: 'flex-start' }}>
                  <img src={RECONNECT_DOT1} alt="" style={{ width: '19.436px', height: '19.436px' }} />
                  <img src={RECONNECT_DOT1} alt="" style={{ width: '19.436px', height: '19.436px' }} />
                  <img src={RECONNECT_DOT2} alt="" style={{ width: '19.436px', height: '19.436px' }} />
                </div>
              </div>

              {/* PUT A FINGER DOWN */}
              <div className="card-tile" style={{ width: '277.981px', height: '348.041px', borderRadius: '9.04px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                <img src="/assets/games/finger-down.png" alt="Put a Finger Down" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <p className="font-luckiest" style={{
                  position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                  top: 'calc(50% - 108.48px)', width: '209.277px',
                  fontSize: '36.16px', color: '#ed8251', textAlign: 'center', lineHeight: 'normal',
                  margin: 0, pointerEvents: 'none',
                }}>PUT A FINGER DOWN</p>
              </div>
            </div>

            {/* ── ROW 4 ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>

              {/* TAKE A SIP IF */}
              <div className="card-tile" style={{ width: '277.948px', height: '348px', background: '#ffecd1', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                <p className="font-gasoek" style={{
                  position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                  top: 'calc(50% - 112.54px)', width: '208.8px',
                  fontSize: '51.774px', color: '#eb5e28', textAlign: 'center', lineHeight: 1.1,
                }}>TAKE A SIP IF ...</p>
              </div>

              {/* SIP OR SPILL */}
              <div className="card-tile" style={{ width: '277.948px', height: '348px', background: '#ffd5f4', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '263.486px', height: '333.538px', background: '#fb3757', borderRadius: '4.519px', overflow: 'hidden' }}>
                  <p className="font-freckle" style={{
                    position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                    top: 'calc(50% - 89.94px)', width: '242.842px',
                    fontSize: '58.567px', color: '#ffd7f7', textAlign: 'center', lineHeight: 1.1,
                  }}>Sip or Spill</p>
                </div>
              </div>

              {/* YOU LAUGH YOU'RE OUT */}
              <div className="card-tile" style={{ width: '277.948px', height: '348px', background: '#36a6bb', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.25) 2px, transparent 2px)', backgroundSize: '18px 18px' }} />
                <p className="font-gasoek" style={{
                  position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                  top: 'calc(50% - 158.18px)', fontSize: '36.156px', color: '#755aa7',
                  textAlign: 'center', whiteSpace: 'nowrap',
                  WebkitTextStroke: '2.5px white', paintOrder: 'stroke fill',
                }}>YOU</p>
                <div style={{ position: 'absolute', left: '52.88px', top: '61.92px', width: '172.418px', height: '103.044px' }}>
                  <img src={YOU_LAUGH_BANNER1} alt="" style={{ position: 'absolute', inset: '-0.36% -0.52% -0.74% -0.27%', width: 'calc(100% + 0.79px)', height: 'calc(100% + 1.1px)', objectFit: 'fill' }} />
                </div>
                <p className="font-gasoek" style={{
                  position: 'absolute', left: 'calc(50% + 3px)', transform: 'translateX(-50%)',
                  top: 'calc(50% - 86.78px)', fontSize: '39.039px', color: '#f6f0f1',
                  textAlign: 'center', whiteSpace: 'nowrap',
                }}>LAUGH</p>
                <div style={{ position: 'absolute', left: '79.09px', top: '225.07px', width: '120.218px', height: '103.044px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ transform: 'scaleY(-1) rotate(180deg)', width: '100%', height: '100%' }}>
                    <img src={YOU_LAUGH_BANNER2} alt="" style={{ position: 'absolute', inset: '-0.12% -0.75% -0.67% -0.52%', width: 'calc(100% + 1.27px)', height: 'calc(100% + 0.79px)', objectFit: 'fill' }} />
                  </div>
                </div>
                <p className="font-gasoek" style={{
                  position: 'absolute', left: 'calc(50% + 0.22px)', transform: 'translateX(-50%)',
                  top: 'calc(50% - 9.04px)', fontSize: '36.156px', color: '#fd587c',
                  textAlign: 'center', whiteSpace: 'nowrap',
                  WebkitTextStroke: '2.5px white', paintOrder: 'stroke fill',
                }}>YOU'RE</p>
                <p className="font-gasoek" style={{
                  position: 'absolute', left: 'calc(50% - 0.92px)', transform: 'translateX(-50%)',
                  top: 'calc(50% + 77.73px)', fontSize: '39.039px', color: '#f6f0f1',
                  textAlign: 'center', whiteSpace: 'nowrap',
                }}>OUT</p>
              </div>

              {/* DO OR DRINK */}
              <div className="card-tile" style={{ width: '277.948px', height: '348px', background: '#d1ffd5', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 96.27px)', width: '208.8px', textAlign: 'center' }}>
                  <p className="font-fredericka" style={{ fontSize: '51.774px', color: '#5228eb', lineHeight: 1, margin: 0 }}>DO</p>
                  <p className="font-fredericka" style={{ fontSize: '51.774px', color: '#5228eb', lineHeight: 1, margin: 0 }}>OR</p>
                  <p className="font-fredericka" style={{ fontSize: '51.774px', color: '#5228eb', lineHeight: 1, margin: 0 }}>DRINK</p>
                </div>
              </div>
            </div>

          </div>
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
