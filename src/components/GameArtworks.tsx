const MOST_LIKELY_COLORS = ['#ef6655', '#ffd12d', '#66d7ad', '#f7f1df']

export function TwoTruthsBluffArtwork({ className = '', portrait = false }: { className?: string; portrait?: boolean }) {
  return <div className={className} role="img" aria-label="Two Truths and a Bluff" style={{ position: 'relative', width: portrait ? '100%' : undefined, height: portrait ? '100%' : undefined, aspectRatio: portrait ? '4 / 5' : '1', overflow: 'hidden' }}>
    <img loading="lazy" decoding="async" src="/assets/games/two-truths-bluff-approved.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: portrait ? 'fill' : 'contain', objectPosition: 'center' }} />
  </div>
}

export function MostLikelyArtwork({ compact = false }: { compact?: boolean }) {
  return <div role="img" aria-label="Who’s Most Likely To?" style={{ width: compact ? 130 : 'min(310px,76vw)', aspectRatio: '4/5', position: 'relative', overflow: 'hidden', borderRadius: compact ? 10 : 18, background: '#0759c7', boxShadow: '0 18px 55px rgba(0,0,0,.28)' }}>
    {MOST_LIKELY_COLORS.map((color, index) => <span key={color} style={{ position: 'absolute', width: compact ? 30 : 62, height: compact ? 10 : 18, borderRadius: 999, background: color, transform: `rotate(${index % 2 ? -35 : 35}deg)`, left: index % 2 ? 'auto' : -8, right: index % 2 ? -8 : 'auto', top: `${12 + index * 22}%` }} />)}
    <div className="font-anton" style={{ position: 'absolute', inset: compact ? '17px 12px 26px' : '38px 28px 52px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f7f1df', fontSize: compact ? 28 : 'clamp(48px,14vw,72px)', lineHeight: .9, textAlign: 'center' }}>WHO’S<br />MOST<br />LIKELY<br />TO?</div>
    <span className="font-anton" style={{ position: 'absolute', left: 0, right: 0, bottom: compact ? 8 : 16, color: '#fff', fontSize: compact ? 8 : 12, letterSpacing: '.18em', textAlign: 'center' }}>DECKED</span>
  </div>
}

export function ChooseYourSideArtwork({ compact = false }: { compact?: boolean }) {
  return <div style={{ width: compact ? 130 : '100%', aspectRatio: '4 / 5', height: compact ? undefined : '100%', minHeight: compact ? undefined : 0, position: 'relative', overflow: 'hidden', borderRadius: compact ? 9 : 14 }}>
    <img loading="lazy" decoding="async" src="/assets/games/choose-your-side.png" alt="Choose Your Side" style={{ display: 'block', position: 'absolute', width: '123.4%', height: '118.2%', left: '-11.7%', top: '-9.1%', maxWidth: 'none' }} />
  </div>
}
