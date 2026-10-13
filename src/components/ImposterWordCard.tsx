import { useScaledCard } from '../hooks/useCardScale'

const NAVY = '#0d2e4b'
const CREAM = '#f5ecd8'
const YELLOW = '#f4e520'
const CORAL = '#ff634e'

export function ImposterWordCard({ word }: { word?: string | null }) {
  const { wrapperStyle, cardStyle } = useScaledCard(320, 400)

  return <div style={wrapperStyle}>
    <article className="game-card" aria-label={`Secret word: ${word ?? ''}`} style={{
      ...cardStyle,
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 18,
      backgroundColor: NAVY,
      backgroundImage: `repeating-linear-gradient(135deg, transparent 0 12px, rgba(245,236,216,.10) 12px 15px, transparent 15px 27px)`,
      boxShadow: '0 24px 60px rgba(0,0,0,.38)',
    }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 12, border: `2px solid ${CREAM}`, borderRadius: 12, opacity: .22 }} />
      <div aria-hidden="true" style={{ position: 'absolute', top: 17, left: 28, right: 28, height: 3, background: CREAM, opacity: .9 }} />
      <div aria-hidden="true" style={{ position: 'absolute', top: 23, left: 28, right: 28, height: 1.5, background: CREAM, opacity: .72 }} />
      <div aria-hidden="true" style={{ position: 'absolute', bottom: 38, left: 28, right: 28, height: 1.5, background: CREAM, opacity: .32 }} />

      <div style={{ position: 'absolute', inset: '34px 28px 50px', borderRadius: 12, background: CREAM, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', boxSizing: 'border-box', textAlign: 'center' }}>
        <span style={{ color: CORAL, font: "400 13px/1 'Staatliches',sans-serif", letterSpacing: '.16em', textTransform: 'uppercase' }}>YOUR SECRET WORD</span>
        <span style={{ width: 38, height: 4, margin: '16px 0 22px', borderRadius: 999, background: YELLOW }} />
        <strong style={{ color: NAVY, font: `400 ${word && word.length > 11 ? 38 : 48}px/.95 'Anton SC',sans-serif`, textTransform: 'uppercase', overflowWrap: 'anywhere' }}>{word}</strong>
      </div>

      <span style={{ position: 'absolute', left: 0, right: 0, bottom: 21, color: CREAM, font: "400 11px/1 'Satoshi',sans-serif", fontWeight: 900, letterSpacing: '.34em', textAlign: 'center' }}>DECKED</span>
    </article>
  </div>
}
