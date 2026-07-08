import { useState, useEffect, useRef } from 'react'

/* ── Assets ── */
const LATE_NIGHT_CARD_BG = '/icons/late-night-card-bg.svg'
const SPICY_CARD_BG      = '/icons/spicy-card-bg.svg'
const NEVER_CARD_BG      = '/icons/never-have-i-ever-card-bg.svg'
const RECONNECT_HEART    = '/icons/reconnect-heart.svg'
const YOU_LAUGH_BANNER1  = '/icons/you-laugh-banner-purple.svg'
const YOU_LAUGH_BANNER2  = '/icons/you-laugh-banner-pink.svg'

export type Category = 'all' | 'icebreakers' | 'deep-talk' | 'drinking' | 'couples' | 'party-games'

/* ── 16 card render functions — exact designs from Pick Your Vibe ── */
// Each returns { w, h, jsx } so the grid can know card dimensions

interface CardDef {
  id: string
  categories: Category[]
  w: number   // natural width from the homepage layout
  h: number   // natural height
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
    render: () => (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
          <div className="card-tile" style={{ width: '277.948px', height: '348px', background: '#eae6e1', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: 'default' }}>
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
    render: () => (
      <div className="card-tile" style={{ width: '100%', height: '100%', borderRadius: '9.04px', overflow: 'hidden', position: 'relative', cursor: 'default' }}>
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
    render: () => (
      <div className="card-tile" style={{ width: '100%', height: '100%', background: '#e9b1ba', borderRadius: '9.04px', overflow: 'hidden', position: 'relative', cursor: 'default' }}>
        <p className="font-luckiest" style={{ position: 'absolute', left: '138.99px', transform: 'translateX(-50%)', top: 'calc(50% - 108.48px)', width: '209.277px', fontSize: '36.16px', color: '#d22f49', textAlign: 'center', lineHeight: 1.15 }}>Let's reconnect</p>
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '296.06px', display: 'flex', alignItems: 'flex-start' }}>
          <img src={RECONNECT_HEART} alt="" style={{ width: '19.436px', height: '19.436px' }} />
          <img src={RECONNECT_HEART} alt="" style={{ width: '19.436px', height: '19.436px' }} />
          <img src={RECONNECT_HEART} alt="" style={{ width: '19.436px', height: '19.436px' }} />
        </div>
      </div>
    ),
  },
  {
    id: 'finger-down', categories: ['party-games'], w: 277.981, h: 348.041,
    render: () => (
      <div className="card-tile" style={{ width: '100%', height: '100%', borderRadius: '9.04px', overflow: 'hidden', position: 'relative', cursor: 'default' }}>
        <img src="/assets/games/finger-down.png" alt="Put a Finger Down" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <p className="font-luckiest" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 108.48px)', width: '209.277px', fontSize: '36.16px', color: '#ed8251', textAlign: 'center', lineHeight: 'normal', margin: 0, pointerEvents: 'none' }}>PUT A FINGER DOWN</p>
      </div>
    ),
  },
  {
    id: 'take-a-sip', categories: ['drinking'], w: 277.948, h: 348,
    render: () => (
      <div className="card-tile" style={{ width: '100%', height: '100%', background: '#ffecd1', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: 'default' }}>
        <p className="font-gasoek" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 112.54px)', width: '208.8px', fontSize: '51.774px', color: '#eb5e28', textAlign: 'center', lineHeight: 1.1 }}>TAKE A SIP IF ...</p>
      </div>
    ),
  },
  {
    id: 'sip-or-spill', categories: ['drinking', 'party-games'], w: 277.948, h: 348,
    render: () => (
      <div className="card-tile" style={{ width: '100%', height: '100%', background: '#ffd5f4', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: 'default' }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '263.486px', height: '333.538px', background: '#fb3757', borderRadius: '4.519px', overflow: 'hidden' }}>
          <p className="font-freckle" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 89.94px)', width: '242.842px', fontSize: '58.567px', color: '#ffd7f7', textAlign: 'center', lineHeight: 1.1 }}>Sip or Spill</p>
        </div>
      </div>
    ),
  },
  {
    id: 'you-laugh', categories: ['party-games'], w: 277.948, h: 348, playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', background: '#36a6bb', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.25) 2px, transparent 2px)', backgroundSize: '18px 18px' }} />
        <p className="font-gasoek" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 158.18px)', fontSize: '36.156px', color: '#755aa7', textAlign: 'center', whiteSpace: 'nowrap', WebkitTextStroke: '2.5px white', paintOrder: 'stroke fill' as const }}>YOU</p>
        <div style={{ position: 'absolute', left: '52.88px', top: '61.92px', width: '172.418px', height: '103.044px' }}>
          <img src={YOU_LAUGH_BANNER1} alt="" style={{ position: 'absolute', inset: '-0.36% -0.52% -0.74% -0.27%', width: 'calc(100% + 0.79px)', height: 'calc(100% + 1.1px)', objectFit: 'fill' }} />
        </div>
        <p className="font-gasoek" style={{ position: 'absolute', left: 'calc(50% + 3px)', transform: 'translateX(-50%)', top: 'calc(50% - 86.78px)', fontSize: '39.039px', color: '#f6f0f1', textAlign: 'center', whiteSpace: 'nowrap' }}>LAUGH</p>
        <div style={{ position: 'absolute', left: '79.09px', top: '225.07px', width: '120.218px', height: '103.044px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ transform: 'scaleY(-1) rotate(180deg)', width: '100%', height: '100%' }}>
            <img src={YOU_LAUGH_BANNER2} alt="" style={{ position: 'absolute', inset: '-0.12% -0.75% -0.67% -0.52%', width: 'calc(100% + 1.27px)', height: 'calc(100% + 0.79px)', objectFit: 'fill' }} />
          </div>
        </div>
        <p className="font-gasoek" style={{ position: 'absolute', left: 'calc(50% + 0.22px)', transform: 'translateX(-50%)', top: 'calc(50% - 9.04px)', fontSize: '36.156px', color: '#fd587c', textAlign: 'center', whiteSpace: 'nowrap', WebkitTextStroke: '2.5px white', paintOrder: 'stroke fill' as const }}>YOU'RE</p>
        <p className="font-gasoek" style={{ position: 'absolute', left: 'calc(50% - 0.92px)', transform: 'translateX(-50%)', top: 'calc(50% + 77.73px)', fontSize: '39.039px', color: '#f6f0f1', textAlign: 'center', whiteSpace: 'nowrap' }}>OUT</p>
      </div>
    ),
  },
  {
    id: 'do-or-drink', categories: ['drinking'], w: 277.948, h: 348,
    render: () => (
      <div className="card-tile" style={{ width: '100%', height: '100%', background: '#d1ffd5', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: 'default' }}>
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
}

export function BrowseCardGrid({ filter, onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks, onPlayDinnerTable, onPlayYouLaugh, onPlayNeverHaveIEver, onPlayCharades }: BrowseGridProps) {
  const allCards = GAME_CARDS(onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks)
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set(allCards.map(c => c.id)))
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set())
  const prevFilter = useRef<Category>('all')

  useEffect(() => {
    if (prevFilter.current === filter) return
    prevFilter.current = filter

    const nextVisible = filter === 'all'
      ? new Set(allCards.map(c => c.id))
      : new Set(allCards.filter(c => c.categories.includes(filter)).map(c => c.id))

    // Mark cards that are leaving
    const leaving = new Set([...visibleIds].filter(id => !nextVisible.has(id)))
    setExitingIds(leaving)

    // After exit animation, update visible set
    setTimeout(() => {
      setVisibleIds(nextVisible)
      setExitingIds(new Set())
    }, 300)
  }, [filter])

  // Re-stagger entering cards
  const [staggerKey, setStaggerKey] = useState(0)
  useEffect(() => { setStaggerKey(k => k + 1) }, [filter])

  const filtered = allCards.filter(c => visibleIds.has(c.id))

  // Split into rows of 4 — space-between per row preserves exact card sizes
  const rows: typeof filtered[] = []
  for (let i = 0; i < filtered.length; i += 4) rows.push(filtered.slice(i, i + 4))

  let cardIdx = 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {row.map((card) => {
            const i = cardIdx++
            const isExiting = exitingIds.has(card.id)
            const onClick = card.id === 'truth-or-dare' ? onPlayTruthOrDare
                           : card.id === 'spicy-starters' ? onPlaySpicyStarters
                           : card.id === 'late-night-talks' ? onPlayLateNightTalks
                           : card.id === 'dinner-table' ? onPlayDinnerTable
                           : card.id === 'you-laugh' ? onPlayYouLaugh
                           : card.id === 'never-have-i-ever' ? onPlayNeverHaveIEver
                           : card.id === 'charades' ? onPlayCharades
                           : undefined

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
