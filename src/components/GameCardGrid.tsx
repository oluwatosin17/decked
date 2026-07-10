import { useState, useEffect, useRef } from 'react'

/* ── Assets ── */
const LATE_NIGHT_CARD_BG = '/icons/late-night-card-bg.svg'
const SPICY_CARD_BG      = '/icons/spicy-card-bg.svg'
const NEVER_CARD_BG      = '/icons/never-have-i-ever-card-bg.svg'
const RECONNECT_CARD_BG  = '/icons/reconnect-card-bg.svg'
const YOU_LAUGH_CARD_BG  = '/icons/you-laugh-card-bg.svg'

/* ── Mobile SVG card assets ── */
const MOBILE_CARDS: Record<string, string> = {
  'truth-or-dare': '/icons/truth-or-dare-mobile.svg',
  'spicy-starters': '/icons/spicy-starters-mobile.svg',
  'red-flag-green-flag': '/icons/red-flag-green-flag-mobile.svg',
  'icebreaker': '/icons/icebreaker-mobile.svg',
  'dinner-table': '/icons/dinner-conversation-mobile.svg',
  'late-night-talks': '/icons/late-night-talks-mobile.svg',
  'everyday-conversation': '/icons/everyday-conversations-mobile.svg',
  'charades': '/icons/charades-mobile.svg',
  'strangers': '/icons/we-are-not-really-strangers-mobile.svg',
  'never-have-i-ever': '/icons/never-have-i-ever-mobile.svg',
  'reconnect': '/icons/reconnect-mobile.svg',
  'finger-down': '/icons/put-a-finger-down-mobile.svg',
  'take-a-sip': '/icons/take-a-sip-mobile.svg',
  'sip-or-spill': '/icons/sip-and-spill-mobile.svg',
  'you-laugh': '/icons/you-laugh-you-are-out-mobile.svg',
  'do-or-drink': '/icons/do-or-drink-mobile.svg',
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  )
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    setIsMobile(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])
  return isMobile
}

export type Category = 'all' | 'icebreakers' | 'deep-talk' | 'drinking' | 'couples' | 'party-games'

interface CardDef {
  id: string
  categories: Category[]
  w: number
  h: number
  render: (onClick?: () => void) => React.ReactNode
  playable?: boolean
}

export const GAME_CARDS = (
  onPlayTruthOrDare: () => void,
  onPlaySpicyStarters: () => void,
  onPlayLateNightTalks?: () => void,
): CardDef[] => [
  {
    id: 'truth-or-dare', categories: ['couples'], w: 345.716, h: 348, playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '15.23px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
        <img src="/assets/games/truth-or-dare.png" alt="Truth or Dare" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '183.906px', height: '123.677px' }}>
          <p className="font-satoshi" style={{ position: 'absolute', left: '2.29px', right: '-2.29px', top: '1.52px', fontSize: '38.074px', fontWeight: 500, color: '#000', textAlign: 'center', lineHeight: 'normal', margin: 0 }}>TRUTH OR DARE</p>
          <p className="font-satoshi" style={{ position: 'absolute', left: '2.29px', right: '-2.29px', top: 0, fontSize: '38.074px', fontWeight: 500, color: '#d39293', textAlign: 'center', lineHeight: 'normal', margin: 0 }}>TRUTH OR DARE</p>
          <p className="font-satoshi" style={{ position: 'absolute', left: 0, right: 0, top: '105.4px', fontSize: '18.276px', color: '#181b25', textAlign: 'center', margin: 0 }}>FOR COUPLES</p>
        </div>
      </div>
    ),
  },
  {
    id: 'spicy-starters', categories: ['couples', 'deep-talk'], w: 277.948, h: 348, playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
        <img src={SPICY_CARD_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <p className="font-stick" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 124.3px)', width: '272.19px', fontSize: '48px', color: '#df91b5', textAlign: 'center', lineHeight: 1 }}>spicy<br />starters</p>
        <p className="font-inter-tight" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% + 102.59px)', width: '112.54px', fontSize: '10.85px', color: '#df91b5', textAlign: 'center', fontWeight: 300 }}>CONVERSATION CARDS TO SHARE</p>
      </div>
    ),
  },
  {
    id: 'red-flag-green-flag', categories: ['couples'], w: 267.692, h: 348,
    render: () => (
      <div className="card-tile" style={{ width: '100%', height: '100%', borderRadius: '8.705px', overflow: 'hidden', position: 'relative', cursor: 'default' }}>
        <img src="/assets/games/redflag-greenflag.png" alt="Red Flag / Green Flag" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', left: '120.96px', top: '113.51px', transform: 'translate(-50%,-50%) rotate(-9.27deg)', width: '130.582px', height: '59.743px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <p className="font-spicy" style={{ fontSize: '22.909px', color: '#e7f0ff', textAlign: 'center', lineHeight: 'normal', margin: 0 }}>Red<br />flag</p>
        </div>
        <div style={{ position: 'absolute', left: '163.19px', top: '215.93px', transform: 'translate(-50%,-50%) rotate(-9.27deg)', width: '130.582px', height: '59.743px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <p className="font-spicy" style={{ fontSize: '22.909px', color: '#e7f0ff', textAlign: 'center', lineHeight: 'normal', margin: 0 }}>Green<br />flag</p>
        </div>
      </div>
    ),
  },
  {
    id: 'icebreaker', categories: ['icebreakers', 'party-games'], w: 277.948, h: 348,
    render: () => (
      <div className="card-tile" style={{ width: '100%', height: '100%', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: 'default' }}>
        <img src="/assets/games/icebreaker.png" alt="Icebreaker" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <p className="font-staatliches" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 56.04px)', fontSize: '39.088px', color: '#000', textAlign: 'center', whiteSpace: 'nowrap', margin: 0, pointerEvents: 'none' }}>ICEBREAKER</p>
      </div>
    ),
  },
  {
    id: 'dinner-table', categories: ['deep-talk'], w: 277.948, h: 348, playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
        <img src="/assets/games/dinner-table.png" alt="Dinner Table Conversation" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div className="font-staatliches" style={{ position: 'absolute', left: '10.85px', top: '28.92px', fontSize: '27.117px', color: '#e8e6e3', lineHeight: 'normal', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          <p style={{ margin: 0 }}>DINNER TABLE</p>
          <p style={{ margin: 0 }}>CONVERSATION</p>
        </div>
      </div>
    ),
  },
  {
    id: 'late-night-talks', categories: ['deep-talk'], w: 359.601, h: 348, playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', position: 'relative', display: 'inline-grid', placeItems: 'start', cursor: onClick ? 'pointer' : 'default', borderRadius: '0', overflow: 'hidden' }}>
        <img src={LATE_NIGHT_CARD_BG} alt="" style={{ gridColumn: 1, gridRow: 1, width: '100%', height: '100%', objectFit: 'contain' }} />
        <div style={{ gridColumn: 1, gridRow: 1, marginLeft: '77.41px', marginTop: '156px', width: '168.435px', display: 'flex', flexDirection: 'column', gap: '3.75px', position: 'relative' }}>
          <p className="font-slackey" style={{ fontSize: '33.78px', color: '#ff440e', lineHeight: 1, margin: 0 }}>Late</p>
          <p className="font-slackey" style={{ fontSize: '33.78px', color: '#ff440e', lineHeight: 1, margin: 0 }}>Night</p>
          <p className="font-slackey" style={{ fontSize: '51.61px', color: '#ff440e', lineHeight: 1, margin: 0 }}>Talks</p>
        </div>
      </div>
    ),
  },
  {
    id: 'everyday-conversation', categories: ['icebreakers', 'deep-talk'], w: 348, h: 277.948,
    playable: true,
    render: (onClick) => (
      <div onClick={onClick} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default' }}>
        <div style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
          <div className="card-tile" style={{ width: '277.948px', height: '348px', background: '#eae6e1', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, opacity: 0.55, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")", backgroundSize: '200px 200px', mixBlendMode: 'multiply' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4.52px', zIndex: 2 }}>
              <div style={{ width: '13px', height: '182px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ transform: 'rotate(90deg)' }}>
                  <p className="font-inter-tight" style={{ fontSize: '10.85px', color: '#181b25', textAlign: 'center', whiteSpace: 'nowrap', fontWeight: 300 }}>Questions to build genuine connection</p>
                </div>
              </div>
              <div style={{ width: '94px', height: '196px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ transform: 'rotate(90deg)' }}>
                  <p className="font-spicy" style={{ fontSize: '34.37px', color: '#0f973d', textAlign: 'center', lineHeight: 1, whiteSpace: 'nowrap' }}>everyday<br />conversation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'charades', categories: ['party-games'], w: 277.948, h: 348,
    playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', background: '#ed3844', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
        <p className="font-slackey" style={{ position: 'absolute', left: 'calc(50% - 124.06px)', top: 'calc(50% - 29.38px)', fontSize: '42.55px', color: '#e8e6e3', whiteSpace: 'nowrap' }}>Charades</p>
      </div>
    ),
  },
  {
    id: 'strangers', categories: ['deep-talk', 'icebreakers'], w: 348.041, h: 257.189,
    playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '9.04px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
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
          <p className="font-satoshi" style={{ fontSize: '20px', fontWeight: 700, color: '#e8e6e3', textTransform: 'uppercase', whiteSpace: 'nowrap', margin: 0 }}>We're not really strangers</p>
        </div>
      </div>
    ),
  },
  {
    id: 'never-have-i-ever', categories: ['drinking', 'party-games'], w: 277.981, h: 348.041,
    playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '9.04px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
        <img src={NEVER_CARD_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <p className="font-single-day" style={{ position: 'absolute', top: '13.9%', left: '18.37%', right: '18.21%', bottom: '43.01%', fontSize: '49.72px', color: '#bb33ff', textAlign: 'center', lineHeight: '49.72px' }}>NEVER HAVE I EVER</p>
      </div>
    ),
  },
  {
    id: 'reconnect', categories: ['deep-talk', 'couples'], w: 277.981, h: 348.041,
    playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '9.04px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
        <img src={RECONNECT_CARD_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <p className="font-luckiest" style={{ position: 'absolute', left: '138.99px', transform: 'translateX(-50%)', top: 'calc(50% - 108.48px)', width: '209.277px', fontSize: '36.16px', color: '#d22f49', textAlign: 'center', lineHeight: 1.15 }}>Let's reconnect</p>
      </div>
    ),
  },
  {
    id: 'finger-down', categories: ['party-games'], w: 277.981, h: 348.041,
    playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '9.04px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
        <img src="/assets/games/finger-down.png" alt="Put a Finger Down" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <p className="font-luckiest" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 108.48px)', width: '209.277px', fontSize: '36.16px', color: '#ed8251', textAlign: 'center', lineHeight: 'normal', margin: 0, pointerEvents: 'none' }}>PUT A FINGER DOWN</p>
      </div>
    ),
  },
  {
    id: 'take-a-sip', categories: ['drinking'], w: 277.948, h: 348, playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', background: '#ffecd1', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
        <p className="font-gasoek" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 112.54px)', width: '208.8px', fontSize: '51.774px', color: '#eb5e28', textAlign: 'center', lineHeight: 1.1 }}>TAKE A SIP IF ...</p>
      </div>
    ),
  },
  {
    id: 'sip-or-spill', categories: ['drinking', 'party-games'], w: 277.948, h: 348, playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', background: '#ffd5f4', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '263.486px', height: '333.538px', background: '#fb3757', borderRadius: '4.519px', overflow: 'hidden' }}>
          <p className="font-freckle" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 89.94px)', width: '242.842px', fontSize: '58.567px', color: '#ffd7f7', textAlign: 'center', lineHeight: 1.1 }}>Sip or Spill</p>
        </div>
      </div>
    ),
  },
  {
    id: 'you-laugh', categories: ['party-games'], w: 277.948, h: 348, playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
        <img src={YOU_LAUGH_CARD_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    ),
  },
  {
    id: 'do-or-drink', categories: ['drinking'], w: 277.948, h: 348, playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', background: '#d1ffd5', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 96.27px)', width: '208.8px', textAlign: 'center' }}>
          <p className="font-fredericka" style={{ fontSize: '51.774px', color: '#5228eb', lineHeight: 1, margin: 0 }}>DO</p>
          <p className="font-fredericka" style={{ fontSize: '51.774px', color: '#5228eb', lineHeight: 1, margin: 0 }}>OR</p>
          <p className="font-fredericka" style={{ fontSize: '51.774px', color: '#5228eb', lineHeight: 1, margin: 0 }}>DRINK</p>
        </div>
      </div>
    ),
  },
]

/* ═══════════════════════════════════════════════
   ROW LAYOUT  (used by HomePage "Pick Your Vibe")
   Same exact rows as before, just reading from GAME_CARDS
   ═══════════════════════════════════════════════ */
interface HomeGridProps {
  onPlayTruthOrDare: () => void
  onPlaySpicyStarters: () => void
  onPlayLateNightTalks: () => void
}

export function HomeCardRows({ onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks }: HomeGridProps) {
  const cards = GAME_CARDS(onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks)
  const byId = Object.fromEntries(cards.map(c => [c.id, c]))

  const getEl = (id: string, onClick?: () => void, style?: React.CSSProperties) => {
    const c = byId[id]
    if (!c) return null
    return (
      <div key={id} style={{ width: `${c.w}px`, height: `${c.h}px`, flexShrink: 0, ...style }}>
        {c.render(onClick)}
      </div>
    )
  }

  const row = (children: React.ReactNode, align = 'center') => (
    <div style={{ display: 'flex', alignItems: align, justifyContent: 'space-between' }}>
      {children}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {row(<>
        {getEl('truth-or-dare', onPlayTruthOrDare)}
        {getEl('spicy-starters', onPlaySpicyStarters)}
        {getEl('red-flag-green-flag')}
        {getEl('icebreaker')}
      </>)}
      {row(<>
        {getEl('dinner-table')}
        {getEl('late-night-talks', onPlayLateNightTalks)}
        {getEl('everyday-conversation')}
        {getEl('charades')}
      </>)}
      {row(<>
        {getEl('strangers')}
        {getEl('never-have-i-ever')}
        {getEl('reconnect')}
        {getEl('finger-down')}
      </>, 'flex-start')}
      {row(<>
        {getEl('take-a-sip')}
        {getEl('sip-or-spill')}
        {getEl('you-laugh')}
        {getEl('do-or-drink')}
      </>, 'flex-start')}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   BROWSE GRID  (filterable, animated)
   ═══════════════════════════════════════════════ */
interface BrowseGridProps {
  filter: Category
  onPlayTruthOrDare: () => void
  onPlaySpicyStarters: () => void
  onPlayLateNightTalks: () => void
  onPlayDinnerTable?: () => void
  onPlayYouLaugh?: () => void
  onPlayNeverHaveIEver?: () => void
  onPlayCharades?: () => void
  onPlayReconnect?: () => void
  onPlayEveryday?: () => void
  onPlayWNRS?: () => void
  onPlayFingerDown?: () => void
  onPlayTakeASip?: () => void
  onPlaySipOrSpill?: () => void
  onPlayDoOrDrink?: () => void
}

function getCardOnClick(card: CardDef, handlers: BrowseGridProps) {
  const map: Record<string, (() => void) | undefined> = {
    'truth-or-dare': handlers.onPlayTruthOrDare,
    'spicy-starters': handlers.onPlaySpicyStarters,
    'late-night-talks': handlers.onPlayLateNightTalks,
    'dinner-table': handlers.onPlayDinnerTable,
    'you-laugh': handlers.onPlayYouLaugh,
    'never-have-i-ever': handlers.onPlayNeverHaveIEver,
    'charades': handlers.onPlayCharades,
    'reconnect': handlers.onPlayReconnect,
    'everyday-conversation': handlers.onPlayEveryday,
    'strangers': handlers.onPlayWNRS,
    'finger-down': handlers.onPlayFingerDown,
    'take-a-sip': handlers.onPlayTakeASip,
    'sip-or-spill': handlers.onPlaySipOrSpill,
    'do-or-drink': handlers.onPlayDoOrDrink,
  }
  return map[card.id]
}

interface MobileCardStyle {
  label: string | string[]
  font: string
  color: string
  fontSize?: string
  sub?: string
  subColor?: string
  hasEmbeddedText?: boolean
}

const MOBILE_CARD_STYLES: Record<string, MobileCardStyle> = {
  'truth-or-dare': { label: ['TRUTH', 'OR DARE'], font: "'Satoshi', sans-serif", color: '#000', fontSize: '20px', sub: 'FOR COUPLES', subColor: '#181b25' },
  'spicy-starters': { label: ['spicy', 'starters'], font: "'Stick', sans-serif", color: '#fff', fontSize: '24px' },
  'red-flag-green-flag': { label: ['Red flag', 'Green flag'], font: "'Spicy Rice', cursive", color: '#e7f0ff', fontSize: '18px' },
  'icebreaker': { label: 'ICEBREAKER', font: "'Staatliches', sans-serif", color: '#000', fontSize: '22px' },
  'dinner-table': { label: ['DINNER TABLE', 'CONVERSATION'], font: "'Staatliches', sans-serif", color: '#e8e6e3', fontSize: '16px' },
  'late-night-talks': { label: ['Late', 'Night', 'Talks'], font: "'Slackey', cursive", color: '#ff440e', fontSize: '20px' },
  'everyday-conversation': { label: ['everyday', 'conversation'], font: "'Spicy Rice', cursive", color: '#0f973d', fontSize: '20px', sub: 'Questions to build genuine connection', subColor: '#181b25' },
  'charades': { label: 'Charades', font: "'Slackey', cursive", color: '#e8e6e3', fontSize: '26px' },
  'strangers': { label: "WE'RE NOT REALLY STRANGERS", font: "'Satoshi', sans-serif", color: '#e8e6e3', fontSize: '11px' },
  'never-have-i-ever': { label: ['NEVER', 'HAVE I', 'EVER'], font: "'Single Day', cursive", color: '#bb33ff', fontSize: '24px' },
  'reconnect': { label: ["Let's", 'Reconnect'], font: "'Luckiest Guy', cursive", color: '#d22f49', fontSize: '20px' },
  'finger-down': { label: ['PUT A', 'FINGER', 'DOWN'], font: "'Luckiest Guy', cursive", color: '#ed8251', fontSize: '18px' },
  'take-a-sip': { label: ['TAKE A', 'SIP IF', '...'], font: "'Gasoek One', sans-serif", color: '#eb5e28', fontSize: '24px' },
  'sip-or-spill': { label: ['Sip or', 'Spill'], font: "'Freckle Face', cursive", color: '#ffd7f7', fontSize: '28px' },
  'you-laugh': { label: '', font: '', color: '', hasEmbeddedText: true },
  'do-or-drink': { label: ['DO', 'OR', 'DRINK'], font: "'Fredericka the Great', serif", color: '#5228eb', fontSize: '24px' },
}

function MobileCard({ card, onClick, isExiting, staggerIndex }: { card: CardDef; onClick?: () => void; isExiting: boolean; staggerIndex: number }) {
  const mobileSvg = MOBILE_CARDS[card.id]
  const style = MOBILE_CARD_STYLES[card.id]

  const renderLabel = () => {
    if (!style || !style.label) return null
    const lines = Array.isArray(style.label) ? style.label : [style.label]
    return (
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', zIndex: 2, padding: '12px',
        pointerEvents: 'none', textAlign: 'center', gap: '2px',
      }}>
        {lines.map((line, i) => (
          <span key={i} style={{
            fontFamily: style.font, fontSize: style.fontSize || '20px',
            color: style.color, lineHeight: 1.1, fontWeight: 500,
          }}>{line}</span>
        ))}
        {style.sub && (
          <span style={{
            fontFamily: "'Inter Tight', sans-serif", fontSize: '8px',
            color: style.subColor || style.color, marginTop: '6px', fontWeight: 300,
          }}>{style.sub}</span>
        )}
      </div>
    )
  }

  return (
    <div
      className="browse-mobile-card"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        animation: isExiting
          ? 'browse-card-exit 0.28s cubic-bezier(0.4,0,1,1) both'
          : `browse-card-enter 0.4s cubic-bezier(0.22,1,0.36,1) ${staggerIndex * 30}ms both`,
      }}
    >
      {mobileSvg ? (
        <>
          <img src={mobileSvg} alt="" className="browse-mobile-card-img" style={{ position: 'relative', zIndex: 1 }} />
          {!style?.hasEmbeddedText && renderLabel()}
        </>
      ) : (
        <div style={{ width: '100%', height: '100%' }}>{card.render(onClick)}</div>
      )}
    </div>
  )
}

export function BrowseCardGrid(props: BrowseGridProps) {
  const { filter, onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks } = props
  const allCards = GAME_CARDS(onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks)
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set(allCards.map(c => c.id)))
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set())
  const prevFilter = useRef<Category>('all')
  const isMobile = useIsMobile()

  useEffect(() => {
    if (prevFilter.current === filter) return
    prevFilter.current = filter

    const nextVisible = filter === 'all'
      ? new Set(allCards.map(c => c.id))
      : new Set(allCards.filter(c => c.categories.includes(filter)).map(c => c.id))

    const leaving = new Set([...visibleIds].filter(id => !nextVisible.has(id)))
    setExitingIds(leaving)

    setTimeout(() => {
      setVisibleIds(nextVisible)
      setExitingIds(new Set())
    }, 300)
  }, [filter])

  const [staggerKey, setStaggerKey] = useState(0)
  useEffect(() => { setStaggerKey(k => k + 1) }, [filter])

  const filtered = allCards.filter(c => visibleIds.has(c.id))

  if (isMobile) {
    let cardIdx = 0
    return (
      <div className="browse-mobile-grid">
        {filtered.map((card) => {
          const i = cardIdx++
          const isExiting = exitingIds.has(card.id)
          const onClick = getCardOnClick(card, props)
          const mobileSvg = MOBILE_CARDS[card.id]

          return (
            <MobileCard
              key={`${card.id}-${staggerKey}`}
              card={card}
              onClick={onClick}
              isExiting={isExiting}
              staggerIndex={i}
            />
          )
        })}
      </div>
    )
  }

  const rows: typeof filtered[] = []
  for (let i = 0; i < filtered.length; i += 4) rows.push(filtered.slice(i, i + 4))

  let cardIdx = 0
  return (
    <div className="browse-card-grid" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="browse-card-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {row.map((card) => {
            const i = cardIdx++
            const isExiting = exitingIds.has(card.id)
            const onClick = getCardOnClick(card, props)

            return (
              <div
                key={`${card.id}-${staggerKey}`}
                className="browse-card-wrap"
                style={{
                  width: `${card.w}px`,
                  height: `${card.h}px`,
                  flexShrink: 0,
                  animation: isExiting
                    ? 'browse-card-exit 0.28s cubic-bezier(0.4,0,1,1) both'
                    : `browse-card-enter 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 40}ms both`,
                }}
              >
                {card.playable && (
                  <div className="play-badge" aria-hidden="true">▶ PLAY</div>
                )}
                {card.render(onClick)}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
