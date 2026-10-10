import { useEffect, type ReactNode } from 'react'
import { GUIDE_ARTICLES, GUIDE_LIBRARY, type Guide } from '../guideData'
import type { Screen } from '../navigation'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { GameArtworkCover } from '../components/GameCardGrid'

const GAME_CONTEXT: Record<string, { format: string; mood: string }> = {
  'charades': { format: 'Team guessing', mood: 'High energy' },
  'you-laugh': { format: 'Quick challenges', mood: 'Silly and fast' },
  'truth-or-dare': { format: 'Questions and dares', mood: 'Bold' },
  'never-have-i-ever': { format: 'Story prompts', mood: 'Revealing' },
  'most-likely-to': { format: 'Group voting', mood: 'Playful' },
  'choose-your-side': { format: 'Pick and debate', mood: 'Conversational' },
  'who-said-that': { format: 'Guessing game', mood: 'Familiar groups' },
  'spicy-starters': { format: 'Flirty prompts', mood: 'Playful' },
  'late-night-talks': { format: 'Deep questions', mood: 'Intimate' },
  'lets-reconnect': { format: 'Reflection prompts', mood: 'Thoughtful' },
  'red-flag-green-flag': { format: 'Compatibility debate', mood: 'Lighthearted' },
  'everyday-conversations': { format: 'Conversation prompts', mood: 'Relaxed' },
  'icebreaker': { format: 'Prompt deck', mood: 'Low pressure' },
  'two-truths-bluff': { format: 'Social bluffing', mood: 'Friendly' },
  'take-a-sip': { format: 'Drinking prompts', mood: 'Easygoing' },
  'sip-or-spill': { format: 'Answer or sip', mood: 'Revealing' },
  'do-or-drink': { format: 'Dare or sip', mood: 'High energy' },
}

interface SharedProps {
  onHome: () => void
  onBrowse: () => void
  onAbout: () => void
  onNavigateGuide: (screen: Screen) => void
}

export function GuideLibraryPage(props: SharedProps) {
  return (
    <GuideLayout {...props} current="guides">
      <header className="guide-hero">
        <h1 className="font-anton">{GUIDE_LIBRARY.heading}</h1>
        <p>{GUIDE_LIBRARY.intro}</p>
      </header>
      <section className="guide-library-grid" aria-label="Decked game guides">
        {GUIDE_ARTICLES.map((guide, index) => (
          <button key={guide.slug} className="guide-library-card" onClick={() => props.onNavigateGuide(guide.screen)}>
            <span>0{index + 1}</span>
            <h2>{guide.heading}</h2>
            <p>{guide.description}</p>
            <strong>READ GUIDE →</strong>
          </button>
        ))}
      </section>
    </GuideLayout>
  )
}

export function GuideArticlePage({ guide, onPlay, ...props }: SharedProps & { guide: Guide; onPlay: (gameId: string) => void }) {
  useEffect(() => {
    const firstHeading = document.querySelector<HTMLElement>('.guide-article h1')
    firstHeading?.focus({ preventScroll: true })
  }, [guide.slug])

  return (
    <GuideLayout {...props} current={guide.screen}>
      <article className="guide-article">
        <nav className="guide-breadcrumb" aria-label="Breadcrumb">
          <button onClick={() => props.onNavigateGuide('guides')}>Guides</button><span>›</span><span>{guide.heading}</span>
        </nav>
        <header className="guide-hero">
          <h1 className="font-anton" tabIndex={-1}>{guide.heading}</h1>
          <p>{guide.summary ?? guide.intro}</p>
        </header>

        <section aria-labelledby="compare-games">
          <div className="guide-section-heading">
            <h2 id="compare-games">Recommended games</h2>
          </div>
          <div className="guide-comparison" role="list">
            {guide.recommendations?.map((game, index) => (
              <section className="guide-game-card" role="listitem" key={game.gameId}>
                <div className="guide-game-image">
                  <GameArtworkCover gameId={game.gameId} label={game.name} />
                </div>
                <div className="guide-game-copy">
                  <div><p className="guide-game-number">{String(index + 1).padStart(2, '0')}</p><h3>{game.name}</h3></div>
                  <p>{game.reason}</p>
                  <dl>
                    <div><dt>Players</dt><dd>{game.players}</dd></div>
                    <div><dt>Time</dt><dd>{game.duration}</dd></div>
                    <div><dt>Format</dt><dd>{GAME_CONTEXT[game.gameId]?.format ?? game.bestFor}</dd></div>
                    <div>
                      <dt>{game.alcohol === 'Optional' ? 'Drinks' : 'Mood'}</dt>
                      <dd>{game.alcohol === 'Optional' ? 'Optional' : (GAME_CONTEXT[game.gameId]?.mood ?? game.bestFor)}</dd>
                    </div>
                  </dl>
                  <button className="guide-play-button" onClick={() => onPlay(game.gameId)}>PLAY {game.name.toUpperCase()}</button>
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="guide-tips" aria-labelledby="guide-tips">
          <div className="guide-section-heading"><h2 id="guide-tips">Practical tips</h2></div>
          <ol>{guide.tips?.map((tip, index) => <li key={tip}><span>{index + 1}</span><p>{tip}</p></li>)}</ol>
        </section>

        <section className="guide-faq" aria-labelledby="guide-faq">
          <div className="guide-section-heading"><h2 id="guide-faq">Frequently asked questions</h2></div>
          {guide.faqs?.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
        </section>

        <aside className="guide-final-cta">
          <h2>Choose a deck and start in seconds.</h2>
          <p>No account, no download, and no complicated setup.</p>
          <button onClick={props.onBrowse}>BROWSE ALL GAMES</button>
        </aside>
      </article>
    </GuideLayout>
  )
}

function GuideLayout({ children, onHome, onBrowse, onAbout, onNavigateGuide }: SharedProps & { children: ReactNode; current: Screen }) {
  return <main className="guide-page">
    <SiteHeader active="guides" onHome={onHome} onBrowse={onBrowse} onGuides={() => onNavigateGuide('guides')} onAbout={onAbout} />
    <div className="guide-shell screen-enter">{children}</div>
    <SiteFooter onGuides={() => onNavigateGuide('guides')} />
  </main>
}
