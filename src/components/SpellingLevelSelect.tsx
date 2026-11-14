import { SPELLING_LEVELS, type SpellingLevel } from '../content/spellingBee'
import '../spelling-bee.css'

export default function SpellingLevelSelect({ selected, onChange, onBack, onNext }: { selected: SpellingLevel[]; onChange: (levels: SpellingLevel[]) => void; onBack: () => void; onNext: () => void }) {
  const toggle = (level: SpellingLevel) => onChange(selected.includes(level) ? selected.filter(value => value !== level) : [...selected, level])
  return <section className="rml-shell spelling-level-select">
    <h1>CHOOSE LEVELS</h1>
    <p className="rml-copy">Pick one or mix a few.</p>
    <div className="spelling-level-grid" role="group" aria-label="Spelling levels">{SPELLING_LEVELS.map(level => <button key={level.id} type="button" aria-pressed={selected.includes(level.id)} onClick={() => toggle(level.id)}><span><strong>{level.label}</strong><small>{level.description}</small></span><span className="spelling-level-check" aria-hidden="true">{selected.includes(level.id) ? '✓' : ''}</span></button>)}</div>
    <div className="rml-builder-actions"><button className="rml-secondary" onClick={onBack}>GO BACK</button><button className="rml-primary" disabled={!selected.length} onClick={onNext}>NEXT</button></div>
  </section>
}
