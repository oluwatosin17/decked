import { useState, type ReactElement } from 'react'

/* ── Asset URLs (reused from HomePage + new) ── */
const PLAY_ICON       = 'https://www.figma.com/api/mcp/asset/08c7add6-bff9-40bd-bd8a-9c08a58a6b3e'
const HEART_FILLED    = 'https://www.figma.com/api/mcp/asset/19850587-e4a6-40f3-b8cb-3013457f4350'
const HEART_OUTLINE   = 'https://www.figma.com/api/mcp/asset/e05fbcbd-1a73-4232-8ed0-834f5deb7143'
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
const SOCIAL_TIKTOK   = 'https://www.figma.com/api/mcp/asset/95bd2c19-cbff-47df-888f-c2dcd17eb88c'
const SOCIAL_INSTAGRAM = 'https://www.figma.com/api/mcp/asset/48f45e3e-baf4-48c6-8fd2-e665f8a64015'
const SOCIAL_WHATSAPP = 'https://www.figma.com/api/mcp/asset/94019f0b-e964-4c74-9a75-a02630ef9f90'

type Category = 'all' | 'icebreakers' | 'deep-talk' | 'drinking' | 'couples' | 'party-games'

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'icebreakers', label: 'Icebreakers' },
  { id: 'deep-talk', label: 'Deep Talk' },
  { id: 'drinking', label: 'Drinking' },
  { id: 'couples', label: 'Couples' },
  { id: 'party-games', label: 'Party Games' },
]

const CARD_W = 310
const CARD_H = 250

/* Tiny hearts band used in ToD card */
function HeartsRow({ top }: { top: boolean }) {
  const hearts = [
    HEART_FILLED, HEART_FILLED, HEART_FILLED, HEART_FILLED, HEART_OUTLINE,
    HEART_FILLED, HEART_FILLED, HEART_OUTLINE, HEART_FILLED, HEART_FILLED, HEART_FILLED,
  ]
  return (
    <div style={{
      position: 'absolute', [top ? 'top' : 'bottom']: 0,
      left: 0, right: 0, height: '52px',
      background: '#dc2827', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', left: 0, right: 0, [top ? 'top' : 'bottom']: '37px', display: 'flex', flexDirection: 'column', gap: '0.6px' }}>
        {top
          ? <><div style={{ height: '4px', background: '#ecc1c9', width: '100%' }} /><div style={{ height: '2.4px', background: '#ecc1c9', width: '100%' }} /></>
          : <><div style={{ height: '2.4px', background: '#ecc1c9', width: '100%' }} /><div style={{ height: '4px', background: '#ecc1c9', width: '100%' }} /></>
        }
      </div>
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', [top ? 'top' : 'top']: top ? '9px' : '23px', display: 'flex', gap: '3px', alignItems: 'center', whiteSpace: 'nowrap' }}>
        {hearts.map((src, i) => (
          <img key={i} src={src} alt="" style={{ width: '19px', height: '19px', flexShrink: 0, transform: i % 2 === 1 ? 'scaleY(-1)' : 'none' }} />
        ))}
      </div>
    </div>
  )
}

interface Props {
  onHome: () => void
  onPlayTruthOrDare: () => void
  onPlaySpicyStarters: () => void
}

interface Game {
  id: string
  categories: Category[]
  render: () => ReactElement
  playable?: boolean
  onClick?: () => void
}

export default function BrowsePage({ onHome, onPlayTruthOrDare, onPlaySpicyStarters }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [hovered, setHovered] = useState<Category | null>(null)

  const cardStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: `${CARD_W}px`, height: `${CARD_H}px`,
    borderRadius: '12px', overflow: 'hidden',
    position: 'relative', flexShrink: 0,
    cursor: 'pointer', ...extra,
  })

  const games: Game[] = [
    {
      id: 'truth-or-dare', categories: ['couples'], playable: true,
      onClick: onPlayTruthOrDare,
      render: () => (
        <div className="card-tile" onClick={onPlayTruthOrDare} style={{ ...cardStyle({ background: '#fff' }) }}>
          <HeartsRow top />
          <HeartsRow top={false} />
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '165px', textAlign: 'center' }}>
            <p className="font-satoshi" style={{ fontSize: '30px', fontWeight: 500, color: '#000', lineHeight: 'normal', margin: 0 }}>TRUTH OR DARE</p>
            <p className="font-satoshi" style={{ fontSize: '30px', fontWeight: 500, color: '#d39293', lineHeight: 'normal', margin: '-2px 0 0', position: 'absolute', top: 0, left: 0, right: 0 }}>TRUTH OR DARE</p>
            <p className="font-satoshi" style={{ fontSize: '14px', color: '#181b25', textAlign: 'center', margin: '66px 0 0' }}>FOR COUPLES</p>
          </div>
        </div>
      ),
    },
    {
      id: 'spicy-starters', categories: ['couples', 'deep-talk'], playable: true,
      onClick: onPlaySpicyStarters,
      render: () => (
        <div className="card-tile" onClick={onPlaySpicyStarters} style={{ ...cardStyle({ background: '#df91b5' }) }}>
          <div style={{ position: 'absolute', left: '-56px', top: 0, width: `${CARD_H}px`, height: `${CARD_H}px`, overflow: 'hidden' }}>
            <img src={SPICY_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: '6.62%', left: '25.45%', right: '6.69%', bottom: '6.1%', background: '#b70012' }} />
          </div>
          <p className="font-stick" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 90px)', width: '220px', fontSize: '36px', color: '#df91b5', textAlign: 'center', lineHeight: 1 }}>
            spicy<br />starters
          </p>
          <p className="font-inter-tight" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% + 75px)', width: '100px', fontSize: '8px', color: '#df91b5', textAlign: 'center', fontWeight: 300 }}>
            CONVERSATION CARDS TO SHARE
          </p>
        </div>
      ),
    },
    {
      id: 'red-flag-green-flag', categories: ['couples'],
      render: () => (
        <div className="card-tile" style={{ ...cardStyle() }}>
          <img src="/assets/games/redflag-greenflag.png" alt="Red Flag / Green Flag" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', left: '96px', top: '75px', transform: 'translate(-50%,-50%) rotate(-9deg)', width: '105px', textAlign: 'center' }}>
            <p className="font-spicy" style={{ fontSize: '18px', color: '#e7f0ff', lineHeight: 1, margin: 0 }}>Red<br />flag</p>
          </div>
          <div style={{ position: 'absolute', left: '130px', top: '165px', transform: 'translate(-50%,-50%) rotate(-9deg)', width: '105px', textAlign: 'center' }}>
            <p className="font-spicy" style={{ fontSize: '18px', color: '#e7f0ff', lineHeight: 1, margin: 0 }}>Green<br />flag</p>
          </div>
        </div>
      ),
    },
    {
      id: 'icebreaker', categories: ['icebreakers', 'party-games'],
      render: () => (
        <div className="card-tile" style={{ ...cardStyle() }}>
          <img src="/assets/games/icebreaker.png" alt="Icebreaker" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <p className="font-staatliches" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 40px)', fontSize: '32px', color: '#000', textAlign: 'center', whiteSpace: 'nowrap', margin: 0 }}>
            ICEBREAKER
          </p>
        </div>
      ),
    },
    {
      id: 'dinner-table', categories: ['deep-talk'],
      render: () => (
        <div className="card-tile" style={{ ...cardStyle() }}>
          <img src="/assets/games/dinner-table.png" alt="Dinner Table Conversation" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div className="font-staatliches" style={{ position: 'absolute', left: '9px', top: '22px', fontSize: '21px', color: '#e8e6e3', lineHeight: 'normal' }}>
            <p style={{ margin: 0 }}>DINNER TABLE</p>
            <p style={{ margin: 0 }}>CONVERSATION</p>
          </div>
        </div>
      ),
    },
    {
      id: 'late-night-talks', categories: ['deep-talk'],
      render: () => (
        <div className="card-tile" style={{ ...cardStyle({ overflow: 'visible' }) }}>
          <div style={{ position: 'relative', width: `${CARD_W}px`, height: `${CARD_H}px`, display: 'inline-grid', placeItems: 'start', overflow: 'hidden', borderRadius: '12px' }}>
            <img src={LATE_NIGHT_OUTER} alt="" style={{ gridColumn: 1, gridRow: 1, width: `${CARD_W}px`, height: `${CARD_H}px`, objectFit: 'contain' }} />
            <img src={LATE_NIGHT_MID} alt="" style={{ gridColumn: 1, gridRow: 1, marginLeft: '44px', marginTop: '48px', width: '204px', height: '193px', objectFit: 'contain' }} />
            <img src={LATE_NIGHT_INNER} alt="" style={{ gridColumn: 1, gridRow: 1, marginLeft: '48px', marginTop: '53px', width: '196px', height: '184px', objectFit: 'contain' }} />
            <div style={{ gridColumn: 1, gridRow: 1, marginLeft: '62px', marginTop: '120px', width: '136px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <p className="font-slackey" style={{ fontSize: '27px', color: '#ff440e', lineHeight: 1, margin: 0 }}>Late</p>
              <p className="font-slackey" style={{ fontSize: '27px', color: '#ff440e', lineHeight: 1, margin: 0 }}>Night</p>
              <p className="font-slackey" style={{ fontSize: '41px', color: '#ff440e', lineHeight: 1, margin: 0 }}>Talks</p>
              <img src={LATE_NIGHT_CHAT} alt="" style={{ position: 'absolute', left: '85px', top: '-12px', width: '67px', height: '67px' }} />
            </div>
            <img src={LATE_NIGHT_SPARK1} alt="" style={{ gridColumn: 1, gridRow: 1, marginLeft: '226px', marginTop: '12px', width: '26px', height: '9px' }} />
            <img src={LATE_NIGHT_SPARK2} alt="" style={{ gridColumn: 1, gridRow: 1, marginLeft: '259px', marginTop: '22px', width: '5px', height: '3px' }} />
          </div>
        </div>
      ),
    },
    {
      id: 'everyday-conversation', categories: ['icebreakers', 'deep-talk'],
      render: () => (
        <div className="card-tile" style={{ ...cardStyle({ background: '#eae6e1' }) }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.45, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: '200px 200px', mixBlendMode: 'multiply' as const }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className="font-spicy" style={{ fontSize: '28px', color: '#0f973d', textAlign: 'center', lineHeight: 1.1, margin: 0 }}>
              everyday<br />conversation
            </p>
          </div>
          <p className="font-inter-tight" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '30px', fontSize: '9px', color: '#181b25', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: 300, margin: 0 }}>
            Questions to build genuine connection
          </p>
        </div>
      ),
    },
    {
      id: 'charades', categories: ['party-games'],
      render: () => (
        <div className="card-tile" style={{ ...cardStyle({ background: '#ed3844' }) }}>
          <p className="font-slackey" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 24px)', fontSize: '36px', color: '#e8e6e3', whiteSpace: 'nowrap', margin: 0 }}>
            Charades
          </p>
        </div>
      ),
    },
    {
      id: 'strangers', categories: ['deep-talk', 'icebreakers'],
      render: () => (
        <div className="card-tile" style={{ ...cardStyle() }}>
          <img src="/assets/games/strangers.png" alt="We're Not Really Strangers" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: '4px', display: 'flex', flexDirection: 'column', gap: '0.4px' }}>
            <div style={{ height: '1.5px', background: '#e8e6e3', width: '100%' }} />
            <div style={{ height: '2.5px', background: '#e8e6e3', width: '100%' }} />
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: '4px', display: 'flex', flexDirection: 'column', gap: '0.4px' }}>
            <div style={{ height: '1.5px', background: '#e8e6e3', width: '100%' }} />
            <div style={{ height: '2.5px', background: '#e8e6e3', width: '100%' }} />
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className="font-satoshi" style={{ fontSize: '16px', fontWeight: 700, color: '#e8e6e3', textTransform: 'uppercase', textAlign: 'center', margin: 0 }}>
              We're not really strangers
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'never-have-i-ever', categories: ['drinking', 'party-games'],
      render: () => (
        <div className="card-tile" style={{ ...cardStyle({ background: '#cc66ff' }) }}>
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '21px', width: '160px', height: '160px', background: '#fefefe', borderRadius: '2px' }} />
          <p className="font-single-day" style={{ position: 'absolute', top: '11%', left: '14%', right: '14%', bottom: '34%', fontSize: '40px', color: '#bb33ff', textAlign: 'center', lineHeight: '40px', margin: 0 }}>
            NEVER HAVE I EVER
          </p>
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '157px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ transform: 'scaleY(-1)' }}>
              <img src={NEVER_BUBBLE} alt="" style={{ width: '45px', height: '36px', objectFit: 'contain' }} />
            </div>
          </div>
          <p className="font-satoshi" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '14px', fontSize: '6px', fontWeight: 700, color: '#fefefe', whiteSpace: 'nowrap', textTransform: 'uppercase', margin: 0 }}>
            GAME OF POOR DECISIONS
          </p>
        </div>
      ),
    },
    {
      id: 'reconnect', categories: ['deep-talk', 'couples'],
      render: () => (
        <div className="card-tile" style={{ ...cardStyle({ background: '#e9b1ba' }) }}>
          <p className="font-luckiest" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 84px)', width: '190px', fontSize: '30px', color: '#d22f49', textAlign: 'center', lineHeight: 1.2, margin: 0 }}>
            Let's reconnect
          </p>
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '32px', display: 'flex', alignItems: 'flex-start' }}>
            <img src={RECONNECT_DOT1} alt="" style={{ width: '16px', height: '16px' }} />
            <img src={RECONNECT_DOT1} alt="" style={{ width: '16px', height: '16px' }} />
            <img src={RECONNECT_DOT2} alt="" style={{ width: '16px', height: '16px' }} />
          </div>
        </div>
      ),
    },
    {
      id: 'finger-down', categories: ['party-games'],
      render: () => (
        <div className="card-tile" style={{ ...cardStyle() }}>
          <img src="/assets/games/finger-down.png" alt="Put a Finger Down" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <p className="font-luckiest" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 84px)', width: '190px', fontSize: '30px', color: '#ed8251', textAlign: 'center', lineHeight: 'normal', margin: 0 }}>
            PUT A FINGER DOWN
          </p>
        </div>
      ),
    },
    {
      id: 'take-a-sip', categories: ['drinking'],
      render: () => (
        <div className="card-tile" style={{ ...cardStyle({ background: '#ffecd1' }) }}>
          <p className="font-gasoek" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 86px)', width: '190px', fontSize: '42px', color: '#eb5e28', textAlign: 'center', lineHeight: 1.1, margin: 0 }}>
            TAKE A SIP IF ...
          </p>
        </div>
      ),
    },
    {
      id: 'sip-or-spill', categories: ['drinking', 'party-games'],
      render: () => (
        <div className="card-tile" style={{ ...cardStyle({ background: '#ffd5f4' }) }}>
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '295px', height: '238px', background: '#fb3757', borderRadius: '4px', overflow: 'hidden' }}>
            <p className="font-freckle" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 70px)', width: '220px', fontSize: '47px', color: '#ffd7f7', textAlign: 'center', lineHeight: 1.1, margin: 0 }}>
              Sip or Spill
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'you-laugh', categories: ['party-games'],
      render: () => (
        <div className="card-tile" style={{ ...cardStyle({ background: '#36a6bb' }) }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.25) 2px, transparent 2px)', backgroundSize: '14px 14px' }} />
          <p className="font-gasoek" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 124px)', fontSize: '29px', color: '#755aa7', textAlign: 'center', whiteSpace: 'nowrap', WebkitTextStroke: '2px white', paintOrder: 'stroke fill' as const, margin: 0 }}>YOU</p>
          <div style={{ position: 'absolute', left: '42px', top: '50px', width: '139px', height: '83px' }}>
            <img src={YOU_LAUGH_BANNER1} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
          </div>
          <p className="font-gasoek" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 68px)', fontSize: '31px', color: '#f6f0f1', textAlign: 'center', whiteSpace: 'nowrap', margin: 0 }}>LAUGH</p>
          <div style={{ position: 'absolute', left: '63px', top: '168px', width: '97px', height: '83px' }}>
            <div style={{ transform: 'scaleY(-1) rotate(180deg)', width: '100%', height: '100%' }}>
              <img src={YOU_LAUGH_BANNER2} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }} />
            </div>
          </div>
          <p className="font-gasoek" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 8px)', fontSize: '29px', color: '#fd587c', textAlign: 'center', whiteSpace: 'nowrap', WebkitTextStroke: '2px white', paintOrder: 'stroke fill' as const, margin: 0 }}>YOU'RE</p>
          <p className="font-gasoek" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% + 60px)', fontSize: '31px', color: '#f6f0f1', textAlign: 'center', whiteSpace: 'nowrap', margin: 0 }}>OUT</p>
        </div>
      ),
    },
    {
      id: 'do-or-drink', categories: ['drinking'],
      render: () => (
        <div className="card-tile" style={{ ...cardStyle({ background: '#d1ffd5' }) }}>
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 80px)', width: '190px', textAlign: 'center' }}>
            <p className="font-fredericka" style={{ fontSize: '43px', color: '#5228eb', lineHeight: 1, margin: 0 }}>DO</p>
            <p className="font-fredericka" style={{ fontSize: '43px', color: '#5228eb', lineHeight: 1, margin: 0 }}>OR</p>
            <p className="font-fredericka" style={{ fontSize: '43px', color: '#5228eb', lineHeight: 1, margin: 0 }}>DRINK</p>
          </div>
        </div>
      ),
    },
  ]

  const filtered = activeCategory === 'all'
    ? games
    : games.filter(g => g.categories.includes(activeCategory))

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>

      {/* ── Nav ── */}
      <nav style={{
        background: 'rgba(12,12,14,0.92)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 60px', height: '64px', flexShrink: 0, position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button onClick={onHome} className="font-anton" style={{ background: 'none', border: 'none', color: '#fff', fontSize: '28px', letterSpacing: '0.56px', cursor: 'pointer', padding: 0 }}>
          DECKED
        </button>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            {['Browse Games', 'How to Play', 'About'].map(label => (
              <button key={label} className="font-anton game-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: label === 'Browse Games' ? '#fff' : 'rgba(255,255,255,0.4)', padding: 0 }}>
                {label}
              </button>
            ))}
          </div>
          {/* Play Now CTA */}
          <button className="game-btn-primary" onClick={onPlayTruthOrDare} style={{
            background: '#dc2827', border: 'none', borderRadius: '999px',
            padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer',
          }}>
            <img src={PLAY_ICON} alt="" style={{ width: '20px', height: '20px' }} />
            <span className="font-staatliches" style={{ fontSize: '16px', color: '#fff', whiteSpace: 'nowrap' }}>Play Now</span>
          </button>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="screen-enter" style={{ flex: 1, padding: '48px 60px 80px' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>

          {/* Category filter pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '40px' }}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id
              const isHov    = hovered === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  onMouseEnter={() => setHovered(cat.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    border: `1px solid ${isActive ? '#fff' : 'rgba(255,255,255,0.2)'}`,
                    background: isActive ? '#fff' : isHov ? 'rgba(255,255,255,0.1)' : 'transparent',
                    borderRadius: '999px',
                    padding: '8px 20px',
                    fontFamily: "'Anton SC', sans-serif",
                    fontSize: '14px',
                    color: isActive ? '#000' : '#fff',
                    cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s',
                    transform: isHov && !isActive ? 'translateY(-1px)' : 'none',
                    letterSpacing: '0.02em',
                  }}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* 4-column card grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(4, ${CARD_W}px)`,
            gap: '20px',
            justifyContent: 'center',
          }}>
            {filtered.map(game => (
              <div key={game.id} className="stagger-item">
                {game.render()}
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: "'Anton SC', sans-serif", fontSize: '20px', paddingTop: '80px' }}>
              No games in this category yet.
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: 'rgba(5,5,12,0.80)', backdropFilter: 'blur(4px)', padding: '32px 60px', display: 'flex', flexDirection: 'column', gap: '40px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '420px' }}>
            <p className="font-anton" style={{ color: '#fff', fontSize: '32px', margin: 0 }}>DECKED</p>
            <p className="font-inter" style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
              Pick a deck, pass the phone, and let the chaos begin. 10+ party card games, no app, no login, no excuses.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={SOCIAL_TIKTOK}    alt="TikTok"    style={{ width: '20px', height: '20px', borderRadius: '8px', objectFit: 'contain' }} />
            <img src={SOCIAL_INSTAGRAM} alt="Instagram" style={{ width: '20px', height: '20px', borderRadius: '8px', objectFit: 'contain' }} />
            <img src={SOCIAL_WHATSAPP}  alt="WhatsApp"  style={{ width: '20px', height: '20px', borderRadius: '8px', objectFit: 'contain' }} />
          </div>
        </div>
        <div style={{ height: '1px', background: '#212326' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
          <p style={{ color: '#9ca3af', margin: 0 }}>© 2026 DECKED. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            {['Privacy', 'Terms', 'Cookie'].map(l => (
              <a key={l} href="#" style={{ color: '#fff', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
