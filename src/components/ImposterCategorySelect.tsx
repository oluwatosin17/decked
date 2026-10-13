import { IMPOSTER_CATEGORIES, type ImposterCategory } from '../content/imposter'

const primary: React.CSSProperties = { border: 0, borderRadius: 999, minHeight: 48, padding: '0 26px', background: '#dc2827', color: '#fff', fontFamily: "'Staatliches',sans-serif", fontSize: 17, cursor: 'pointer' }
const secondary: React.CSSProperties = { ...primary, background: 'transparent', border: '1px solid rgba(255,255,255,.75)' }

const CATEGORY_ARTWORK: Record<ImposterCategory, string> = {
  places: '/icons/charades-countries.svg',
  food: '/icons/charades-food.svg',
  nature: '/icons/charades-animals.svg',
  everyday: '/icons/everyday.svg',
  culture: '/icons/charades-ai-tech.svg',
  events: '/icons/charades-sports.svg',
}

function CategoryIllustration({ category }: { category: ImposterCategory }) {
  return <span aria-hidden="true" style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,.08)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><img src={CATEGORY_ARTWORK[category]} alt="" style={{ width: 30, height: 30, objectFit: 'contain' }} /></span>
}

export function ImposterCategorySelect({ selected, onChange, onBack, onNext }: { selected: ImposterCategory[]; onChange: (categories: ImposterCategory[]) => void; onBack: () => void; onNext: () => void }) {
  const toggle = (category: ImposterCategory) => onChange(selected.includes(category) ? selected.length === 1 ? selected : selected.filter(item => item !== category) : [...selected, category])
  return <div className="screen-enter" style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '36px 16px 64px' }}>
    <section style={{ width: 'min(680px,100%)', display: 'grid', gap: 26, textAlign: 'center' }}>
      <div><h1 className="font-anton" style={{ margin: 0, color: '#fff', fontSize: 38 }}>CHOOSE YOUR CATEGORIES</h1><p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,.55)', font: "15px 'Satoshi',sans-serif" }}>Pick one or mix a few for your secret words.</p></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
        {IMPOSTER_CATEGORIES.map(category => { const active = selected.includes(category.id); return <button key={category.id} type="button" aria-pressed={active} onClick={() => toggle(category.id)} style={{ minHeight: 72, padding: '10px 14px', borderRadius: 14, border: active ? '2px solid #fff' : '1px dashed rgba(255,255,255,.16)', background: active ? 'rgba(255,255,255,.06)' : '#070708', color: '#fff', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}><CategoryIllustration category={category.id} /><strong className="font-anton" style={{ fontSize: 18, lineHeight: 1.05 }}>{category.label.toUpperCase()}</strong>{active ? <span aria-label="Selected" style={{ marginLeft: 'auto', color: '#fff', font: "700 20px 'Satoshi',sans-serif" }}>✓</span> : null}</button> })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 9 }}><button className="game-btn" style={secondary} onClick={onBack}>GO BACK</button><button className="game-btn-primary" style={primary} onClick={onNext}>NEXT</button></div>
    </section>
  </div>
}
