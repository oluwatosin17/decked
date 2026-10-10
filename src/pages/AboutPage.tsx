import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

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
          <p>Decked is a browser-based collection of party and conversation games made to help people have a better time together. There is nothing to download, no account to create, and no complicated setup.</p>
        </header>
        <div className="about-simple-copy font-satoshi">
          <p>Play in the same room by passing one phone around, or create a multiplayer room and invite everyone to join from their own device. Both ways to play are designed to get the game started quickly and keep the focus on the group.</p>
          <p>Different decks suit different moments. Some bring energy and laughter, some reveal unexpected stories, and others open conversations people would not normally have. Whether it is a party, date night, family gathering, or your first time meeting, there is a game to help everyone settle in and connect.</p>
          <p>Decked uses technology to bring people into the same experience, not pull their attention apart. Simple rules, easy sharing, and carefully written prompts make it easier to start conversations and keep them moving.</p>
          <p>Decked is still growing, with new games, questions, and ways to play added over time. Have an idea, a question, or want to say hello? Reach us at <a href="mailto:hello@usedecked.com">hello@usedecked.com</a>.</p>
        </div>
      </article>
      <SiteFooter onGuides={onGuides} />
    </main>
  )
}
