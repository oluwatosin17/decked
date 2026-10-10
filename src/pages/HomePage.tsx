import { useState, useEffect, useRef } from 'react'
import { HomeCardRows, GAME_CARDS } from '../components/GameCardGrid'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

const FEATURED_IDS = ['truth-or-dare', 'spicy-starters', 'late-night-talks', 'charades', 'never-have-i-ever', 'you-laugh', 'two-truths-bluff', 'most-likely-to', 'choose-your-side', 'who-said-that']
const FEATURED_ACTIONS: Record<string, string> = {
  'truth-or-dare': 'onPlayTruthOrDare',
  'spicy-starters': 'onPlaySpicyStarters',
  'late-night-talks': 'onPlayLateNightTalks',
  'charades': 'onPlayCharades',
  'never-have-i-ever': 'onPlayNeverHaveIEver',
  'you-laugh': 'onPlayYouLaugh',
  'two-truths-bluff': 'onPlayTwoTruthsBluff',
  'most-likely-to': 'onPlayMostLikelyTo',
  'choose-your-side': 'onPlayChooseYourSide',
  'who-said-that': 'onPlayWhoSaidThat',
}

function useIsMobile(bp = 768) {
  const query = `(max-width: ${bp}px), (max-height: 500px) and (orientation: landscape)`
  const [m, setM] = useState(typeof window !== 'undefined' ? window.matchMedia(query).matches : false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const h = (e: MediaQueryListEvent) => setM(e.matches)
    setM(mq.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [query])
  return m
}

interface Props {
  onQuickPlay?: () => void
  onPlayTruthOrDare: () => void
  onPlaySpicyStarters: () => void
  onPlayLateNightTalks: () => void
  onPlayCharades?: () => void
  onPlayNeverHaveIEver?: () => void
  onPlayYouLaugh?: () => void
  onPlayTwoTruthsBluff: () => void
  onPlayMostLikelyTo: () => void
  onPlayChooseYourSide: () => void
  onPlayWhoSaidThat: () => void
  onBrowse: () => void
  onGuides: () => void
  onAbout: () => void
  onPlayTogether: () => void
}

function MobileFeaturedGrid({ actions }: { actions: Record<string, (() => void) | undefined> }) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [colW, setColW] = useState(166)
  const allCards = GAME_CARDS(actions.onPlayTruthOrDare!, actions.onPlaySpicyStarters!, actions.onPlayLateNightTalks)
  const featured = allCards.filter(c => FEATURED_IDS.includes(c.id))

  useEffect(() => {
    const measure = () => {
      if (gridRef.current) {
        const styles = window.getComputedStyle(gridRef.current)
        const innerWidth = gridRef.current.clientWidth
          - parseFloat(styles.paddingLeft)
          - parseFloat(styles.paddingRight)
        setColW(Math.floor((innerWidth - 10) / 2))
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (gridRef.current) observer.observe(gridRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={gridRef} className="home-featured-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', padding: '0 16px', alignItems: 'start' }}>
      {featured.map((card, i) => {
        const scale = colW / card.w
        const cardHeight = card.h * scale
        const action = FEATURED_ACTIONS[card.id]
        const onClick = action ? actions[action] : undefined
        const label = card.id.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')
        return (
          <div key={card.id} style={{ width: `${colW}px`, height: `${cardHeight}px`, minWidth: 0, maxWidth: '100%', overflow: 'hidden', lineHeight: 0, animation: `browse-card-enter 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 50}ms both` }}>
            <button
              type="button"
              onClick={onClick}
              aria-label={`Play ${label}`}
              style={{
                display: 'block', width: `${colW}px`, height: `${cardHeight}px`,
                overflow: 'hidden', borderRadius: `${9 * scale}px`,
                cursor: onClick ? 'pointer' : 'default',
                WebkitTapHighlightColor: 'transparent',
                padding: 0, border: 0, background: 'transparent', textAlign: 'initial',
              }}
            >
              <div style={{
                width: `${card.w}px`, height: `${card.h}px`,
                transform: `scale(${scale})`, transformOrigin: 'top left',
              }}>
                {card.render()}
              </div>
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default function HomePage({ onQuickPlay, onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks, onPlayCharades, onPlayNeverHaveIEver, onPlayYouLaugh, onPlayTwoTruthsBluff, onPlayMostLikelyTo, onPlayChooseYourSide, onPlayWhoSaidThat, onBrowse, onGuides, onAbout, onPlayTogether }: Props) {
  const isMobile = useIsMobile()
  const actions: Record<string, (() => void) | undefined> = { onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks, onPlayCharades: onPlayCharades ?? onBrowse, onPlayNeverHaveIEver: onPlayNeverHaveIEver ?? onBrowse, onPlayYouLaugh: onPlayYouLaugh ?? onBrowse, onPlayTwoTruthsBluff, onPlayMostLikelyTo, onPlayChooseYourSide, onPlayWhoSaidThat, onBrowse }

  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
        <SiteHeader onHome={() => {}} onBrowse={onBrowse} onGuides={onGuides} onAbout={onAbout} />

        {/* Mobile hero — compact, balanced */}
        <div className="screen-enter" style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
          <h1 className="font-anton" style={{ color: 'white', fontSize: '32px', lineHeight: 1.05, margin: 0, fontWeight: 400 }}>
            THE PARTY STARTS HERE
          </h1>
          <p className="font-satoshi" style={{ color: '#d9dbde', fontSize: '14px', lineHeight: '18px', margin: 0, maxWidth: '280px' }}>
            Pick a deck, pass the phone, and let things get interesting.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="font-staatliches" onClick={onPlayTogether} style={{
              background: '#fff', color: '#bd0025', fontSize: '12px',
              padding: '7px 13px', borderRadius: '999px', border: 'none', cursor: 'pointer',
            }}>PLAY TOGETHER</button>
            <button className="font-staatliches mobile-quick-play" onClick={onQuickPlay ?? onBrowse} style={{
              background: '#dc2827', color: 'white', fontSize: '12px',
              padding: '7px 13px', borderRadius: '999px', border: 'none', cursor: 'pointer',
              boxShadow: '0 8px 12px rgba(220,40,39,0.25)',
            }}>QUICK PLAY</button>
            <button className="font-staatliches" onClick={onBrowse} style={{
              background: 'transparent', color: 'white', fontSize: '13px',
              padding: '9px 16px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.5)', cursor: 'pointer',
            }}>BROWSE GAMES</button>
          </div>
        </div>

        {/* Featured cards — no heading, just the grid */}
        <section style={{ padding: '24px 0 20px' }}>
          <MobileFeaturedGrid actions={actions} />
          <div style={{ padding: '12px 16px 0', textAlign: 'center' }}>
            <button className="font-staatliches game-btn" onClick={onBrowse} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: '13px', padding: '9px 20px', borderRadius: '999px', cursor: 'pointer',
              width: '100%', letterSpacing: '0.04em',
            }}>VIEW ALL GAMES</button>
          </div>
        </section>

        <SiteFooter onGuides={onGuides} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

      <section className="home-hero relative w-full overflow-hidden" style={{ height: '420px' }}>

        <SiteHeader onHome={() => {}} onBrowse={onBrowse} onGuides={onGuides} onAbout={onAbout} />

        {/* Hero copy */}
        <div className="home-hero-copy absolute z-20" style={{
          top: '108px', left: '50%', transform: 'translateX(-50%)',
          width: '435px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', textAlign: 'center', width: '100%' }}>
            <h1 className="font-anton" style={{ color: 'white', fontSize: '70px', lineHeight: 1, width: '100%', margin: 0, fontWeight: 400 }}>
              THE PARTY STARTS HERE
            </h1>
            <p className="font-satoshi" style={{ color: '#d9dbde', fontSize: '20px', lineHeight: '22px', letterSpacing: '-0.2px', width: '100%', margin: 0 }}>
              Pick a deck, pass the phone, and let things get interesting.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="font-staatliches" onClick={onPlayTogether} style={{
              background: '#fff', color: '#bd0025', fontSize: '16px',
              padding: '12px 18px', borderRadius: '999px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>PLAY TOGETHER</button>
            <button className="font-staatliches" onClick={onQuickPlay ?? onBrowse} style={{
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

      </section>

      {/* ══════════════════════════════════════════════
          CARD LIBRARY SECTION
      ══════════════════════════════════════════════ */}
      <section className="cards-section home-cards-section w-full" style={{ paddingTop: '90px', paddingBottom: '80px' }}>
        <div style={{ width: '1320px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <HomeCardRows onPlayTruthOrDare={onPlayTruthOrDare} onPlaySpicyStarters={onPlaySpicyStarters} onPlayLateNightTalks={onPlayLateNightTalks} onPlayTwoTruthsBluff={onPlayTwoTruthsBluff} onPlayMostLikelyTo={onPlayMostLikelyTo} onPlayChooseYourSide={onPlayChooseYourSide} onPlayWhoSaidThat={onPlayWhoSaidThat} />
        </div>
      </section>

      <SiteFooter onGuides={onGuides} />
    </div>
  )
}
