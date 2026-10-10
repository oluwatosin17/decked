const SOCIALS = [
  { src: '/icons/social-tiktok.svg', label: 'TikTok' },
  { src: '/icons/social-instagram.svg', label: 'Instagram' },
  { src: '/icons/social-whatsapp.svg', label: 'WhatsApp' },
]

export default function SiteFooter({ onGuides }: { onGuides: () => void }) {
  return (
    <footer className="home-footer site-footer">
      <div className="mobile-footer-top site-footer-top">
        <div className="site-footer-intro">
          <div className="site-footer-brand">
            <img src="/brand/decked-mark.png" alt="" />
            <p className="font-anton">DECKED</p>
          </div>
          <p className="font-inter site-footer-copy">Pick a deck, pass the phone, and let the chaos begin. 10+ party card games, no app, no login, no excuses.</p>
        </div>
        <div className="site-footer-socials">
          {SOCIALS.map(social => <img key={social.label} src={social.src} alt={social.label} />)}
        </div>
      </div>
      <div className="site-footer-rule" />
      <div className="mobile-footer-bottom site-footer-bottom">
        <p>© 2026 DECKED. All rights reserved.</p>
        <div className="site-footer-links">
          <button onClick={onGuides}>Guides</button>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/cookies">Cookies</a>
        </div>
      </div>
    </footer>
  )
}
