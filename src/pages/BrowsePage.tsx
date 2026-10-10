import { useState } from 'react'
import { BrowseCardGrid, type Category } from '../components/GameCardGrid'
import { track } from '../analytics'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all',         label: 'All' },
  { id: 'icebreakers', label: 'Icebreakers' },
  { id: 'deep-talk',   label: 'Deep Talk' },
  { id: 'drinking',    label: 'Drinking' },
  { id: 'couples',     label: 'Couples' },
  { id: 'party-games', label: 'Party Games' },
]

interface Props {
  onHome: () => void
  onGuides: () => void
  onAbout: () => void
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
  onPlayWeJustMet?: () => void
}

export default function BrowsePage({ onHome, onGuides, onAbout, onPlayTruthOrDare, onPlaySpicyStarters, onPlayLateNightTalks, onPlayDinnerTable, onPlayYouLaugh, onPlayNeverHaveIEver, onPlayCharades, onPlayReconnect, onPlayEveryday, onPlayWNRS, onPlayFingerDown, onPlayTakeASip, onPlaySipOrSpill, onPlayDoOrDrink, onPlayIcebreaker, onPlayRedFlagGreenFlag, onPlayTwoTruthsBluff, onPlayMostLikelyTo, onPlayChooseYourSide, onPlayWhoSaidThat, onPlayWeJustMet }: Props) {
  const [active, setActive] = useState<Category>('all')
  const selectCategory = (category: Category, target: HTMLButtonElement) => {
    if (category === active) return
    track('browse_category_selected', { category_id: category, previous_category_id: active })
    setActive(category)
    window.requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }))
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>

      <SiteHeader active="browse" onHome={onHome} onBrowse={() => {}} onGuides={onGuides} onAbout={onAbout} />

      <style>{`
        @media (max-width: 768px) {
          .browse-main { padding: 20px 16px 40px !important; }
          .browse-content { width: 100% !important; }
          .browse-category-pills { width: 100%; min-width: 0; gap: 8px !important; overflow-x: auto; overflow-y: hidden; overscroll-behavior-x: contain; -webkit-overflow-scrolling: touch; scrollbar-width: none; scroll-behavior: smooth; scroll-snap-type: x proximity; scroll-padding-inline: 12px; padding: 0 2px 6px; flex-wrap: nowrap !important; }
          .browse-category-pills::-webkit-scrollbar { display: none; }
          .browse-category-pills button { min-width: max-content; min-height: 40px; font-size: 14px !important; padding: 7px 12px !important; border-radius: 8px !important; flex: 0 0 auto !important; scroll-snap-align: center; }
        }
        @media (max-width: 480px) {
          .browse-main { padding: 16px 12px 32px !important; }
        }
      `}</style>

      {/* ── Main ── */}
      <main className="screen-enter browse-main" style={{ flex: 1, padding: '48px 60px 80px' }}>
        <div className="browse-content" style={{ width: '1320px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '36px' }}>

          {/* Category filter pills — matches Figma 764-33446 */}
          <div className="browse-category-pills" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {CATEGORIES.map(cat => {
              const isActive = active === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={event => selectCategory(cat.id, event.currentTarget)}
                  style={{
                    background: isActive ? '#18181b' : '#0e0e10',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '6px 12px',
                    fontFamily: "'Anton SC', sans-serif",
                    fontSize: '18px',
                    color: isActive ? '#ffffff' : '#999999',
                    cursor: 'pointer',
                    letterSpacing: 'normal',
                    lineHeight: 'normal',
                    whiteSpace: 'nowrap',
                    transition: 'background 0.15s, color 0.15s, transform 0.15s var(--ease-out)',
                  }}
                  onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = '#1a1a1d'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' } }}
                  onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = '#0e0e10'; (e.currentTarget as HTMLButtonElement).style.color = '#999'; (e.currentTarget as HTMLButtonElement).style.transform = 'none' } }}
                  onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)' }}
                  onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = isActive ? 'none' : 'translateY(-1px)' }}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Card grid — exact same cards as "Pick your vibe", filtered by category */}
          <BrowseCardGrid
            filter={active}
            onPlayTruthOrDare={onPlayTruthOrDare}
            onPlaySpicyStarters={onPlaySpicyStarters}
            onPlayLateNightTalks={onPlayLateNightTalks}
            onPlayDinnerTable={onPlayDinnerTable}
            onPlayYouLaugh={onPlayYouLaugh}
            onPlayNeverHaveIEver={onPlayNeverHaveIEver}
            onPlayCharades={onPlayCharades}
            onPlayReconnect={onPlayReconnect}
            onPlayEveryday={onPlayEveryday}
            onPlayWNRS={onPlayWNRS}
            onPlayFingerDown={onPlayFingerDown}
            onPlayTakeASip={onPlayTakeASip}
            onPlaySipOrSpill={onPlaySipOrSpill}
            onPlayDoOrDrink={onPlayDoOrDrink}
            onPlayIcebreaker={onPlayIcebreaker}
            onPlayRedFlagGreenFlag={onPlayRedFlagGreenFlag}
            onPlayTwoTruthsBluff={onPlayTwoTruthsBluff}
            onPlayMostLikelyTo={onPlayMostLikelyTo}
            onPlayChooseYourSide={onPlayChooseYourSide}
            onPlayWhoSaidThat={onPlayWhoSaidThat}
            onPlayWeJustMet={onPlayWeJustMet}
          />
        </div>
      </main>

      <SiteFooter onGuides={onGuides} />
    </div>
  )
}
