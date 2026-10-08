import { useState, useEffect, useRef } from 'react'
import { ChooseYourSideArtwork, MostLikelyArtwork, TwoTruthsBluffArtwork } from './GameArtworks'

/* ── Assets ── */
const LATE_NIGHT_CARD_BG = '/icons/late-night-card-bg.svg'
const SPICY_CARD_BG      = '/icons/spicy-card-bg.svg'
const RECONNECT_CARD_BG  = '/assets/games/back-to-us.png'

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

const GAME_LABELS: Record<string, string> = {
  'spicy-starters': 'Spicy Opener',
  'red-flag-green-flag': 'Dateable or Dealbreaker',
  'everyday-conversation': 'Real Talk, Every Day',
  strangers: 'Beyond Small Talk',
  reconnect: 'Back to Us',
  'finger-down': 'Drop a Finger',
  'sip-or-spill': 'Answer or Drink',
  'you-laugh': 'Keep a Straight Face',
  'do-or-drink': 'Dare or Pour',
  'who-said-that': 'Who Said That?',
}

function useIsMobile(breakpoint = 768) {
  const query = `(max-width: ${breakpoint}px), (max-height: 500px) and (orientation: landscape)`
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    setIsMobile(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
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

const desktopCardHeight = (card: CardDef) =>
  card.id === 'most-likely-to' || card.id === 'choose-your-side' ? 348 : card.h

export const GAME_CARDS = (
  onPlayTruthOrDare: () => void,
  onPlaySpicyStarters: () => void,
  onPlayLateNightTalks?: () => void,
): CardDef[] => [
  {
    id: 'truth-or-dare', categories: ['couples'], w: 277.948, h: 348, playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '15.23px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
        <img loading="lazy" decoding="async" src="/assets/games/truth-or-dare.png" alt="Truth or Dare" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    ),
  },
  {
    id: 'spicy-starters', categories: ['couples', 'deep-talk'], w: 277.948, h: 348, playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
        <img loading="lazy" decoding="async" src="/assets/games/spicy-opener.png" alt="Spicy Opener" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    ),
  },
  {
    id: 'red-flag-green-flag', categories: ['couples'], w: 267.692, h: 348, playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '15px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default', background: '#1256e8' }}>
        <img loading="lazy" decoding="async" src="/assets/games/dateable-or-dealbreaker.png" alt="Dateable or Dealbreaker" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    ),
  },
  {
    id: 'icebreaker', categories: ['icebreakers', 'party-games'], w: 277.948, h: 348, playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
        <img loading="lazy" decoding="async" src="/assets/games/icebreaker.png" alt="Icebreaker" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <p className="font-staatliches" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 56.04px)', fontSize: '39.088px', color: '#000', textAlign: 'center', whiteSpace: 'nowrap', margin: 0, pointerEvents: 'none' }}>ICEBREAKER</p>
      </div>
    ),
  },
  {
    id: 'dinner-table', categories: ['deep-talk'], w: 277.948, h: 348, playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
        <img loading="lazy" decoding="async" src="/assets/games/dinner-table-v2.png" alt="Dinner Table Conversation" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    ),
  },
  {
    id: 'late-night-talks', categories: ['deep-talk'], w: 359.601, h: 348, playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', position: 'relative', display: 'inline-grid', placeItems: 'start', cursor: onClick ? 'pointer' : 'default', borderRadius: '0', overflow: 'hidden' }}>
        <img loading="lazy" decoding="async" src={LATE_NIGHT_CARD_BG} alt="" style={{ gridColumn: 1, gridRow: 1, width: '100%', height: '100%', objectFit: 'contain' }} />
        <div style={{ gridColumn: 1, gridRow: 1, marginLeft: '77.41px', marginTop: '156px', width: '168.435px', display: 'flex', flexDirection: 'column', gap: '3.75px', position: 'relative' }}>
          <p className="font-slackey" style={{ fontSize: '33.78px', color: '#ff440e', lineHeight: 1, margin: 0 }}>Late</p>
          <p className="font-slackey" style={{ fontSize: '33.78px', color: '#ff440e', lineHeight: 1, margin: 0 }}>Night</p>
          <p className="font-slackey" style={{ fontSize: '51.61px', color: '#ff440e', lineHeight: 1, margin: 0 }}>Talks</p>
        </div>
      </div>
    ),
  },
  {
    id: 'everyday-conversation', categories: ['icebreakers', 'deep-talk'], w: 277.948, h: 348,
    playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{
        width: '100%', height: '100%', borderRadius: '15px', overflow: 'hidden', position: 'relative',
        cursor: onClick ? 'pointer' : 'default', background: '#f4efe4',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.74' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.11'/%3E%3C/svg%3E\")",
      }}>
        <div style={{ position: 'absolute', left: '7px', top: '7px', width: '153px', height: '55px', borderRadius: '13px', background: '#1459bd' }}>
          <span style={{ display: 'block', color: '#f4efe4', fontSize: '25px', letterSpacing: '7px', margin: '6px 0 0 40px' }}>•••</span>
        </div>
        <div style={{ position: 'absolute', right: '7px', top: '7px', width: '101px', height: '89px', borderRadius: '13px', background: '#ef3f2d' }} />
      <div style={{ position: 'absolute', left: '7px', right: '7px', top: '69px', height: '101px', borderRadius: '13px', background: '#f7c928' }} />
      <div style={{ position: 'absolute', left: '7px', right: '7px', top: '178px', height: '70px', borderRadius: '13px', background: '#ed9ca8' }} />
      <p className="font-anton" style={{ position: 'absolute', left: '19px', right: '19px', top: '69px', height: '101px', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', fontSize: '42px', lineHeight: 0.92, letterSpacing: '-0.02em', color: '#111', textTransform: 'uppercase' }}>
          REAL TALK,<br />EVERY DAY
        </p>
        <div style={{ position: 'absolute', left: '7px', bottom: '43px', width: '155px', height: '51px', borderRadius: '13px', background: '#137b4c', display: 'flex', alignItems: 'center', padding: '0 14px' }}>
          <span className="font-satoshi" style={{ color: '#f4efe4', fontSize: '8px', fontWeight: 700, lineHeight: 1.3, letterSpacing: '0.13em' }}>QUESTIONS FOR<br />REAL CONNECTION</span>
        </div>
        <div style={{ position: 'absolute', right: '7px', bottom: '43px', width: '94px', height: '51px', borderRadius: '13px', background: '#1459bd' }} />
        <div style={{ position: 'absolute', left: '7px', right: '7px', bottom: '7px', height: '30px', borderRadius: '11px', background: '#f7c928', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="font-satoshi" style={{ color: '#111', fontSize: '8px', fontWeight: 900, letterSpacing: '0.42em' }}>DECKED</span>
        </div>
      </div>
    ),
  },
  {
    id: 'charades', categories: ['party-games'], w: 277.948, h: 348,
    playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', background: '#5d0c42', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
        <img loading="lazy" decoding="async" src="/assets/games/charades-plum.png" alt="Charades" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scale(1.04)' }} />
      </div>
    ),
  },
  {
    id: 'strangers', categories: ['deep-talk', 'icebreakers'], w: 277.948, h: 348,
    playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{
        width: '100%', height: '100%', borderRadius: '15px', overflow: 'hidden', position: 'relative',
        cursor: onClick ? 'pointer' : 'default', backgroundColor: '#f4efe4',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.10'/%3E%3C/svg%3E\")",
        boxShadow: '0 14px 36px rgba(0,0,0,0.28)',
      }}>
        <div style={{
          position: 'absolute', top: 0, bottom: 0, right: '23px', width: '22px',
          backgroundColor: '#ef3f2d',
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.10'/%3E%3C/svg%3E\")",
          pointerEvents: 'none',
        }} />
        <p className="font-anton" style={{
          position: 'absolute', left: '18px', top: '29px', width: '198px', margin: 0,
          fontSize: '49px', fontWeight: 400, color: '#111', textTransform: 'uppercase',
          lineHeight: 0.88, letterSpacing: '-0.025em', pointerEvents: 'none',
        }}>
          BEYOND<br />SMALL<br />TALK
        </p>
        <span className="font-satoshi" style={{
          position: 'absolute', left: 0, right: 0, bottom: '14px', textAlign: 'center',
          color: '#111', fontSize: '8px', fontWeight: 800, letterSpacing: '0.42em', pointerEvents: 'none',
        }}>DECKED</span>
      </div>
    ),
  },
  {
    id: 'never-have-i-ever', categories: ['drinking', 'party-games'], w: 277.981, h: 348.041,
    playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '15px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default', background: '#0755c9' }}>
        <img loading="lazy" decoding="async" src="/assets/games/never-have-i-ever.jpg" alt="Never Have I Ever" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    ),
  },
  {
    id: 'reconnect', categories: ['deep-talk', 'couples'], w: 277.981, h: 348.041,
    playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '15px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default', background: '#ef3526' }}>
        <img loading="lazy" decoding="async" src={RECONNECT_CARD_BG} alt="Back to Us" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    ),
  },
  {
    id: 'finger-down', categories: ['party-games'], w: 277.981, h: 348.041,
    playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '9.04px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
        <img loading="lazy" decoding="async" src="/assets/games/finger-down.png" alt="Drop a Finger" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <p className="font-luckiest" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 108.48px)', width: '209.277px', fontSize: '36.16px', color: '#ed8251', textAlign: 'center', lineHeight: 'normal', margin: 0, pointerEvents: 'none' }}>DROP A<br />FINGER</p>
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
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', background: '#35152d', borderRadius: '15px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
        <img loading="lazy" decoding="async" src="/assets/games/answer-or-drink.png" alt="Answer or Drink" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    ),
  },
  {
    id: 'you-laugh', categories: ['party-games'], w: 277.948, h: 348, playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '15px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default', background: '#df561b' }}>
        <img loading="lazy" decoding="async" src="/assets/games/keep-a-straight-face.png" alt="Keep a Straight Face" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    ),
  },
  {
    id: 'do-or-drink', categories: ['drinking'], w: 277.948, h: 348, playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', background: '#d1ffd5', borderRadius: '9.039px', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 'calc(50% - 96.27px)', width: '208.8px', textAlign: 'center' }}>
          <p className="font-fredericka" style={{ fontSize: '51.774px', color: '#5228eb', lineHeight: 1, margin: 0 }}>DARE</p>
          <p className="font-fredericka" style={{ fontSize: '51.774px', color: '#5228eb', lineHeight: 1, margin: 0 }}>OR</p>
          <p className="font-fredericka" style={{ fontSize: '51.774px', color: '#5228eb', lineHeight: 1, margin: 0 }}>POUR</p>
        </div>
      </div>
    ),
  },
  {
    id: 'two-truths-bluff', categories: ['icebreakers', 'party-games'], w: 277.948, h: 348, playable: true,
    render: (onClick) => (
      <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', cursor: onClick ? 'pointer' : 'default' }}>
        <TwoTruthsBluffArtwork portrait />
      </div>
    ),
  },
  {
    id: 'most-likely-to', categories: ['icebreakers', 'couples', 'party-games'], w: 310, h: 387.5, playable: true,
    render: (onClick) => <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', cursor: onClick ? 'pointer' : 'default' }}><MostLikelyArtwork /></div>,
  },
  {
    id: 'choose-your-side', categories: ['icebreakers', 'deep-talk', 'party-games'], w: 310, h: 387.5, playable: true,
    render: (onClick) => <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', cursor: onClick ? 'pointer' : 'default' }}><ChooseYourSideArtwork /></div>,
  },
  {
    id: 'who-said-that', categories: ['icebreakers', 'party-games'], w: 277.948, h: 348, playable: true,
    render: (onClick) => <div className="card-tile" onClick={onClick} style={{ width: '100%', height: '100%', borderRadius: '15px', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default' }}><img loading="lazy" decoding="async" src="/assets/games/who-said-that.png" alt="Who Said That?" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /></div>,
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
  onPlayTwoTruthsBluff: () => void
  onPlayMostLikelyTo: () => void
  onPlayChooseYourSide: () => void
  onPlayWhoSaidThat: () => void
}

export function HomeCardRows({ onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks, onPlayTwoTruthsBluff, onPlayMostLikelyTo, onPlayChooseYourSide, onPlayWhoSaidThat }: HomeGridProps) {
  const cards = GAME_CARDS(onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks)
  const byId = Object.fromEntries(cards.map(c => [c.id, c]))

  const getEl = (id: string, onClick?: () => void, style?: React.CSSProperties) => {
    const c = byId[id]
    if (!c) return null
    return (
      <div key={id} style={{ width: `${c.w}px`, height: `${desktopCardHeight(c)}px`, flexShrink: 0, ...style }}>
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
        {getEl('strangers')}
        {getEl('late-night-talks', onPlayLateNightTalks)}
        {getEl('everyday-conversation')}
        {getEl('charades')}
      </>)}
      {row(<>
        {getEl('dinner-table')}
        {getEl('take-a-sip')}
        {getEl('reconnect')}
        {getEl('finger-down')}
      </>, 'flex-start')}
      {row(<>
        {getEl('sip-or-spill')}
        {getEl('never-have-i-ever')}
        {getEl('you-laugh')}
        {getEl('two-truths-bluff', onPlayTwoTruthsBluff)}
      </>, 'flex-start')}
      {row(<>
        {getEl('do-or-drink')}
        {getEl('most-likely-to', onPlayMostLikelyTo)}
        {getEl('choose-your-side', onPlayChooseYourSide)}
        {getEl('who-said-that', onPlayWhoSaidThat)}
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
  onPlayIcebreaker?: () => void
  onPlayRedFlagGreenFlag?: () => void
  onPlayTwoTruthsBluff?: () => void
  onPlayMostLikelyTo?: () => void
  onPlayChooseYourSide?: () => void
  onPlayWhoSaidThat?: () => void
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
    'icebreaker': handlers.onPlayIcebreaker,
    'red-flag-green-flag': handlers.onPlayRedFlagGreenFlag,
    'two-truths-bluff': handlers.onPlayTwoTruthsBluff,
    'most-likely-to': handlers.onPlayMostLikelyTo,
    'choose-your-side': handlers.onPlayChooseYourSide,
    'who-said-that': handlers.onPlayWhoSaidThat,
  }
  return map[card.id]
}

/**
 * ScaledCard — renders the exact desktop card design at a proportional scale
 * inside a container that reserves the correct visual space.
 * This ensures mobile browse cards are pixel-perfect replicas of desktop.
 */
function ScaledCard({ card, onClick, containerWidth }: { card: CardDef; onClick?: () => void; containerWidth: number }) {
  const scale = containerWidth / card.w
  const label = GAME_LABELS[card.id] ?? card.id.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Play ${label}`}
      className="browse-mobile-card-scaled"
      style={{
        display: 'block',
        width: `${containerWidth}px`,
        height: `${card.h * scale}px`,
        overflow: 'hidden',
        borderRadius: `${9 * scale}px`,
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
        padding: 0,
        border: 0,
        background: 'transparent',
        textAlign: 'initial',
      }}
    >
      <div style={{
        width: `${card.w}px`,
        height: `${card.h}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}>
        {card.render()}
      </div>
    </button>
  )
}

/** Reuses the exact Browse Games artwork as a compact, non-interactive preview. */
export function GameCardPreview({ gameId }: { gameId: string }) {
  const card = GAME_CARDS(() => {}, () => {}, () => {}).find(item => item.id === gameId)
  if (!card) return null

  const maxWidth = 170
  const maxHeight = 132
  const scale = Math.min(maxWidth / card.w, maxHeight / card.h)
  const width = card.w * scale
  const height = card.h * scale

  return (
    <div
      className="multiplayer-game-preview"
      aria-hidden="true"
      style={{ width, height, position: 'relative', overflow: 'hidden', borderRadius: `${9 * scale}px`, alignSelf: 'center', flexShrink: 0 }}
    >
      <div style={{ width: card.w, height: card.h, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
        {card.render()}
      </div>
    </div>
  )
}

export function BrowseCardGrid(props: BrowseGridProps) {
  const { filter, onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks } = props
  const allCards = GAME_CARDS(onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks)
  const dinnerTableIndex = allCards.findIndex(card => card.id === 'dinner-table')
  const beyondSmallTalkIndex = allCards.findIndex(card => card.id === 'strangers')
  const swappedCards = allCards.map((card, index) => {
    if (index === dinnerTableIndex) return allCards[beyondSmallTalkIndex]
    if (index === beyondSmallTalkIndex) return allCards[dinnerTableIndex]
    return card
  })
  const neverHaveIEverIndex = swappedCards.findIndex(card => card.id === 'never-have-i-ever')
  const fingerDownIndex = swappedCards.findIndex(card => card.id === 'finger-down')
  const fingerSwappedCards = swappedCards.map((card, index) => {
    if (index === neverHaveIEverIndex) return swappedCards[fingerDownIndex]
    if (index === fingerDownIndex) return swappedCards[neverHaveIEverIndex]
    return card
  })
  const currentNeverHaveIEverIndex = fingerSwappedCards.findIndex(card => card.id === 'never-have-i-ever')
  const answerOrDrinkIndex = fingerSwappedCards.findIndex(card => card.id === 'sip-or-spill')
  const answerNeverSwappedCards = fingerSwappedCards.map((card, index) => {
    if (index === currentNeverHaveIEverIndex) return fingerSwappedCards[answerOrDrinkIndex]
    if (index === answerOrDrinkIndex) return fingerSwappedCards[currentNeverHaveIEverIndex]
    return card
  })
  const currentFingerDownIndex = answerNeverSwappedCards.findIndex(card => card.id === 'finger-down')
  const currentAnswerOrDrinkIndex = answerNeverSwappedCards.findIndex(card => card.id === 'sip-or-spill')
  const dropAnswerSwappedCards = answerNeverSwappedCards.map((card, index) => {
    if (index === currentFingerDownIndex) return answerNeverSwappedCards[currentAnswerOrDrinkIndex]
    if (index === currentAnswerOrDrinkIndex) return answerNeverSwappedCards[currentFingerDownIndex]
    return card
  })
  const currentTakeASipIndex = dropAnswerSwappedCards.findIndex(card => card.id === 'take-a-sip')
  const latestAnswerOrDrinkIndex = dropAnswerSwappedCards.findIndex(card => card.id === 'sip-or-spill')
  const arrangedCards = dropAnswerSwappedCards.map((card, index) => {
    if (index === currentTakeASipIndex) return dropAnswerSwappedCards[latestAnswerOrDrinkIndex]
    if (index === latestAnswerOrDrinkIndex) return dropAnswerSwappedCards[currentTakeASipIndex]
    return card
  })
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set(allCards.map(c => c.id)))
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set())
  const prevFilter = useRef<Category>('all')
  const isMobile = useIsMobile()
  const [gridWidth, setGridWidth] = useState(343) // default for 375px viewport
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isMobile) return
    const measure = () => {
      if (gridRef.current) {
        const gap = 10
        const colWidth = Math.floor((gridRef.current.offsetWidth - gap) / 2)
        setGridWidth(colWidth)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [isMobile])

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

  const filtered = arrangedCards.filter(c => visibleIds.has(c.id))

  if (isMobile) {
    let cardIdx = 0
    return (
      <div ref={gridRef} className="browse-mobile-grid">
        {filtered.map((card) => {
          const i = cardIdx++
          const isExiting = exitingIds.has(card.id)
          const onClick = getCardOnClick(card, props)

          return (
            <div
              key={`${card.id}-${staggerKey}`}
              style={{
                width: `${gridWidth}px`,
                height: `${card.h * (gridWidth / card.w)}px`,
                minWidth: 0,
                overflow: 'hidden',
                lineHeight: 0,
                animation: isExiting
                  ? 'browse-card-exit 0.28s cubic-bezier(0.4,0,1,1) both'
                  : `browse-card-enter 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 30}ms both`,
              }}
            >
              <ScaledCard card={card} onClick={onClick} containerWidth={gridWidth} />
            </div>
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

            const CardWrapper = onClick ? 'button' : 'div'
            const label = GAME_LABELS[card.id] ?? card.id.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')
            return (
              <CardWrapper
                key={`${card.id}-${staggerKey}`}
                className="browse-card-wrap"
                {...(onClick ? { type: 'button' as const, onClick, 'aria-label': `Play ${label}` } : {})}
                style={{
                  width: `${card.w}px`,
                  height: `${desktopCardHeight(card)}px`,
                  flexShrink: 0,
                  animation: isExiting
                    ? 'browse-card-exit 0.28s cubic-bezier(0.4,0,1,1) both'
                    : `browse-card-enter 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 40}ms both`,
                  padding: 0,
                  border: 0,
                  background: 'transparent',
                  textAlign: 'initial',
                }}
              >
                {card.playable && (
                  <div className="play-badge" aria-hidden="true">▶ PLAY</div>
                )}
                {card.render()}
              </CardWrapper>
            )
          })}
          {Array.from({ length: 4 - row.length }, (_, index) => (
            <div key={`spacer-${index}`} aria-hidden="true" style={{ width: `${row[0]?.w ?? 278}px`, height: 0, flexShrink: 0 }} />
          ))}
        </div>
      ))}
    </div>
  )
}
