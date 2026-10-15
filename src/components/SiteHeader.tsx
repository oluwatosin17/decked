export type SiteSection = 'browse' | 'guides' | 'about' | 'feedback'

interface Props {
  active?: SiteSection
  onHome: () => void
  onBrowse: () => void
  onGuides: () => void
  onAbout: () => void
}

export default function SiteHeader({ active, onHome, onBrowse, onGuides, onAbout }: Props) {
  const links: Array<{ id: SiteSection; label: string; onClick?: () => void; href?: string }> = [
    { id: 'browse', label: 'BROWSE GAMES', onClick: onBrowse },
    { id: 'guides', label: 'GUIDES', onClick: onGuides },
    { id: 'about', label: 'ABOUT', onClick: onAbout },
    { id: 'feedback', label: 'FEEDBACK', href: '/feedback?source=header' },
  ]

  return <nav className="site-header" aria-label="Main navigation">
    <button className="site-header-brand font-anton" onClick={onHome} aria-label="Go to Decked home">
      <img src="/brand/decked-mark.png" alt="" /><span>DECKED</span>
    </button>
    <div className="site-header-links">
      {links.map(link => link.href ? <a key={link.id} href={link.href} className={`font-anton${active===link.id?' active':''}`} aria-current={active===link.id?'page':undefined}>{link.label}</a> : <button key={link.id} className={`font-anton${active === link.id ? ' active' : ''}`} onClick={active === link.id ? undefined : link.onClick} aria-current={active === link.id ? 'page' : undefined}>{link.label}</button>)}
    </div>
  </nav>
}
