export type SiteSection = 'browse' | 'guides' | 'about'

interface Props {
  active?: SiteSection
  onHome: () => void
  onBrowse: () => void
  onGuides: () => void
  onAbout: () => void
}

export default function SiteHeader({ active, onHome, onBrowse, onGuides, onAbout }: Props) {
  const links: { id: SiteSection; label: string; onClick: () => void }[] = [
    { id: 'browse', label: 'BROWSE GAMES', onClick: onBrowse },
    { id: 'guides', label: 'GUIDES', onClick: onGuides },
    { id: 'about', label: 'ABOUT', onClick: onAbout },
  ]

  return <nav className="site-header" aria-label="Main navigation">
    <button className="site-header-brand font-anton" onClick={onHome} aria-label="Go to Decked home">
      <img src="/brand/decked-mark.png" alt="" /><span>DECKED</span>
    </button>
    <div className="site-header-links">
      {links.map(link => <button
        key={link.id}
        className={`font-anton${active === link.id ? ' active' : ''}`}
        onClick={active === link.id ? undefined : link.onClick}
        aria-current={active === link.id ? 'page' : undefined}
      >{link.label}</button>)}
    </div>
  </nav>
}
