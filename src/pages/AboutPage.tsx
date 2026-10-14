import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { SOCIAL_LINKS } from '../socialLinks'

interface Props {
  onHome: () => void
  onBrowse: () => void
  onGuides: () => void
}

export default function AboutPage({ onHome, onBrowse, onGuides }: Props) {
  return (
    <main className="about-simple-page">
      <SiteHeader active="about" onHome={onHome} onBrowse={onBrowse} onGuides={onGuides} onAbout={() => {}} />

      <article className="guide-shell screen-enter">
        <header className="guide-hero about-page-hero">
          <h1 className="font-anton">ABOUT DECKED</h1>
          <p>Decked is a browser-based collection of party, card, and conversation games made to help people have a better time together. There is nothing to download, no account to create, and no complicated setup.</p>
        </header>
        <div className="about-simple-copy font-satoshi">
          <p>Play in the same room by passing one phone around, or create a multiplayer room and invite everyone to join from their own device. Both ways to play are designed to get the game started quickly and keep the focus on the group.</p>
          <p>Different decks suit different moments. Some bring energy and laughter, some reveal unexpected stories, and others open conversations people would not normally have. Whether it is a party, date night, family gathering, or your first time meeting, there is a game to help everyone settle in and connect.</p>
          <p>Decked uses technology to bring people into the same experience, not pull their attention apart. Simple rules, easy sharing, and carefully written prompts make it easier to start conversations and keep them moving.</p>
          <p>Decked is still growing, with new games, questions, and ways to play added over time. Have an idea, a question, or want to say hello? Reach us at <a href="mailto:hello@usedecked.com">hello@usedecked.com</a>.</p>
          <section className="about-social-section" aria-labelledby="about-social-title">
            <div>
              <h2 id="about-social-title" className="font-anton">FOLLOW DECKED</h2>
              <p>Find new games, conversation prompts, and ways to play at <strong>@usedecked</strong>.</p>
            </div>
            <div className="about-social-links">
              {SOCIAL_LINKS.map(social => (
                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer">
                  <img src={social.icon} alt="" />
                  <span>{social.label.replace('Decked on ', '')}</span>
                  <small>@usedecked</small>
                </a>
              ))}
            </div>
          </section>
        </div>
      </article>
      <SiteFooter onGuides={onGuides} />
    </main>
  )
}
