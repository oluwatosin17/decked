import { useEffect, type ReactNode } from 'react'
import { GAME_SEARCH_DESCRIPTORS, GUIDE_ARTICLES, GUIDE_LIBRARY, type Guide } from '../guideData'
import type { Screen } from '../navigation'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { GameArtworkCover } from '../components/GameCardGrid'
import { HOW_TO_PLAY_GUIDES, appGameIdForGuide, howToPlayScreen, type HowToPlayGuide } from '../howToPlayData'

const GAME_CONTEXT: Record<string, { format: string; mood: string }> = {
  'charades': { format: 'Team guessing', mood: 'High energy' },
  'you-laugh': { format: 'Quick challenges', mood: 'Silly and fast' },
  'truth-or-dare': { format: 'Questions and dares', mood: 'Bold' },
  'never-have-i-ever': { format: 'Story prompts', mood: 'Revealing' },
  'most-likely-to': { format: 'Group voting', mood: 'Playful' },
  'choose-your-side': { format: 'Pick and debate', mood: 'Conversational' },
  'who-said-that': { format: 'Guessing game', mood: 'Familiar groups' },
  'think-fast': { format: 'Buzzer challenge', mood: 'Fast and competitive' },
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
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h2>{guide.heading}</h2>
            <p>{guide.description}</p>
            <strong>READ GUIDE →</strong>
          </button>
        ))}
      </section>
    </GuideLayout>
  )
}

export function HowToPlayCataloguePage(props: SharedProps) {
  return (
    <GuideLayout {...props} current="guide-how-to-play-decked-games">
      <nav className="guide-breadcrumb" aria-label="Breadcrumb">
        <button onClick={() => props.onNavigateGuide('guides')}>Guides</button><span>›</span><span>How to play</span>
      </nav>
      <header className="guide-hero">
        <h1 className="font-anton">How to play Decked games</h1>
        <p>Choose a game to learn the setup, rules, winning conditions, and practical tips. When you are ready, you can start that exact game from its guide.</p>
      </header>
      <section className="how-to-catalogue" aria-label="How to play every Decked game">
        {HOW_TO_PLAY_GUIDES.map(guide => (
          <button key={guide.gameId} className="how-to-catalogue-card" onClick={() => props.onNavigateGuide(howToPlayScreen(guide.gameId))}>
            <span className="how-to-card-art"><GameArtworkCover gameId={guide.gameId} label={guide.name} /></span>
            <span className="how-to-card-copy"><strong>{guide.name}</strong><small>{guide.summary}</small><b>HOW TO PLAY →</b></span>
          </button>
        ))}
      </section>
    </GuideLayout>
  )
}

export function HowToPlayDetailPage({ guide, onPlay, ...props }: SharedProps & { guide: HowToPlayGuide; onPlay: (gameId: string) => void }) {
  useEffect(() => { document.querySelector<HTMLElement>('.how-to-detail h1')?.focus({ preventScroll: true }) }, [guide.gameId])
  return (
    <GuideLayout {...props} current={howToPlayScreen(guide.gameId)}>
      <article className="guide-article how-to-detail">
        <nav className="guide-breadcrumb" aria-label="Breadcrumb">
          <button onClick={() => props.onNavigateGuide('guides')}>Guides</button><span>›</span>
          <button onClick={() => props.onNavigateGuide('guide-how-to-play-decked-games')}>How to play</button><span>›</span><span>{guide.name}</span>
        </nav>
        <header className="how-to-detail-hero">
          <div className="how-to-detail-art"><GameArtworkCover gameId={guide.gameId} label={guide.name} /></div>
          <div>
            <p className="how-to-eyebrow">HOW TO PLAY</p>
            <h1 className="font-anton" tabIndex={-1}>{guide.name}</h1>
            <p>{guide.summary}</p>
            <dl><div><dt>Players</dt><dd>{guide.players}</dd></div><div><dt>Typical time</dt><dd>{guide.duration}</dd></div></dl>
            <button className="guide-play-button" onClick={() => onPlay(appGameIdForGuide(guide.gameId))}>PLAY {guide.name.toUpperCase()}</button>
          </div>
        </header>
        <section className="how-to-objective" aria-labelledby="how-to-objective">
          <p className="how-to-eyebrow">THE OBJECTIVE</p>
          <h2 id="how-to-objective">What players are trying to do</h2>
          <p>{guide.objective}</p>
        </section>
        <div className="how-to-instructions">
          <section><p className="how-to-step-number">01</p><h2>Set up the game</h2><ol>{guide.setup.map(item => <li key={item}>{item}</li>)}</ol></section>
          <section><p className="how-to-step-number">02</p><h2>How a round works</h2><ol>{guide.steps.map(item => <li key={item}>{item}</li>)}</ol></section>
          <section><p className="how-to-step-number">03</p><h2>How it ends</h2><p>{guide.ending}</p></section>
        </div>
        <div className="how-to-deep-dive">
          <section><p className="how-to-eyebrow">EXAMPLE ROUND</p><h2>See it in action</h2><p>{guide.example}</p></section>
          <section><p className="how-to-eyebrow">GOOD TO KNOW</p><h2>Rules people often miss</h2><p>{guide.remember}</p></section>
        </div>
        <section className="guide-tips" aria-labelledby="how-to-tips">
          <div className="guide-section-heading"><h2 id="how-to-tips">Tips for a better game</h2></div>
          <ol>{guide.tips.map((tip, index) => <li key={tip}><span>{index + 1}</span><p>{tip}</p></li>)}</ol>
        </section>
        <aside className="guide-final-cta">
          <h2>Ready to play {guide.name}?</h2>
          <p>Choose Pass &amp; Play for one device or Play Together for separate phones.</p>
          <button onClick={() => onPlay(appGameIdForGuide(guide.gameId))}>CHOOSE HOW TO PLAY</button>
        </aside>
      </article>
    </GuideLayout>
  )
}

export function GuideArticlePage({ guide, onPlay, ...props }: SharedProps & { guide: Guide; onPlay: (gameId: string) => void }) {
  const gameIds = new Set(guide.recommendations?.map(game => game.gameId) ?? [])
  const relatedGuides = GUIDE_ARTICLES
    .filter(candidate => candidate.slug !== guide.slug)
    .map(candidate => ({
      guide: candidate,
      score: candidate.recommendations?.filter(game => gameIds.has(game.gameId)).length ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.guide)

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
                  {GAME_SEARCH_DESCRIPTORS[game.path] && <p className="guide-game-descriptor"><strong>Game style:</strong> {GAME_SEARCH_DESCRIPTORS[game.path]}.</p>}
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

        {guide.sections?.map(section => (
          <section className="guide-explainer" key={section.heading}>
            <div className="guide-section-heading"><h2>{section.heading}</h2></div>
            {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}

        <section className="guide-tips" aria-labelledby="guide-tips">
          <div className="guide-section-heading"><h2 id="guide-tips">Practical tips</h2></div>
          <ol>{guide.tips?.map((tip, index) => <li key={tip}><span>{index + 1}</span><p>{tip}</p></li>)}</ol>
        </section>

        <section className="guide-faq" aria-labelledby="guide-faq">
          <div className="guide-section-heading"><h2 id="guide-faq">Frequently asked questions</h2></div>
          {guide.faqs?.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
        </section>

        <section className="guide-related" aria-labelledby="related-guides">
          <div className="guide-section-heading"><h2 id="related-guides">Related game guides</h2></div>
          <div className="guide-related-grid">
            {relatedGuides.map(item => (
              <button key={item.slug} onClick={() => props.onNavigateGuide(item.screen)}>
                <strong>{item.heading}</strong>
                <span>{item.description}</span>
              </button>
            ))}
          </div>
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
