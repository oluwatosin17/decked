import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const SITE_URL = 'https://www.usedecked.com'
const OUTPUT_DIRECTORY = 'dist'
const DEFAULT_IMAGE = '/brand/decked-social-avatar.png'
const guides = JSON.parse(await readFile('src/content/guides.json', 'utf8'))

const games = [
  game('/games/truth-or-dare', 'Truth or Dare', '/assets/games/truth-or-dare.png', 'friends, couples, and parties', '2 or more', '10–60 minutes', 'Party game'),
  game('/games/spicy-starters', 'Spicy Starters', '/assets/games/spicy-opener.png', 'adult couples and date nights', '2 or more', '10–45 minutes', 'Conversation game'),
  game('/games/late-night-talks', 'Late Night Talks', DEFAULT_IMAGE, 'couples, friends, and late-night hangouts', '2 or more', '15–60 minutes', 'Conversation game'),
  game('/games/dinner-table', 'Dinner Table', '/assets/games/dinner-table-v2.png', 'families, friends, dates, and teams', '2 or more', '10–45 minutes', 'Conversation game'),
  game('/games/you-laugh-youre-out', "You Laugh, You're Out", '/assets/games/keep-a-straight-face.png', 'friends, families, and parties', '2 or more', '10–30 minutes', 'Party game'),
  game('/games/never-have-i-ever', 'Never Have I Ever', '/assets/games/never-have-i-ever.jpg', 'friends and parties', '3 or more', '10–45 minutes', 'Party game'),
  game('/games/charades', 'Charades', '/assets/games/charades-v2.png', 'families, friends, and groups', '4 or more', '15–60 minutes', 'Guessing game'),
  game('/games/lets-reconnect', "Let's Reconnect", '/assets/games/back-to-us.png', 'couples, friends, and families', '2 or more', '15–60 minutes', 'Conversation game'),
  game('/games/everyday-conversations', 'Everyday Conversations', '/assets/games/everyday-conversation.png', 'friends, families, couples, and teams', '2 or more', '10–45 minutes', 'Conversation game'),
  game('/games/were-not-really-strangers', "We're Not Really Strangers", '/assets/games/wnrs-card.png', 'friends, dates, and new connections', '2 or more', '15–60 minutes', 'Conversation game'),
  game('/games/put-a-finger-down', 'Put a Finger Down', '/assets/games/finger-down.png', 'friends and parties', '3 or more', '10–30 minutes', 'Party game'),
  game('/games/take-a-sip', 'Take a Sip', DEFAULT_IMAGE, 'adult friends and parties', '2 or more', '10–45 minutes', 'Party game', true),
  game('/games/sip-or-spill', 'Sip or Spill', '/assets/games/answer-or-drink.png', 'adult friends and parties', '2 or more', '10–45 minutes', 'Party game', true),
  game('/games/do-or-drink', 'Do or Drink', DEFAULT_IMAGE, 'adult friends and parties', '2 or more', '10–45 minutes', 'Party game', true),
  game('/games/icebreaker', 'Icebreaker', '/assets/games/icebreaker.png', 'new groups, teams, friends, and dates', '2 or more', '10–45 minutes', 'Icebreaker game'),
  game('/games/red-flag-green-flag', 'Red Flag, Green Flag', '/assets/games/dateable-or-dealbreaker.png', 'friends, couples, and dates', '2 or more', '10–45 minutes', 'Conversation game'),
  game('/games/two-truths-and-a-bluff', 'Two Truths and a Bluff', '/assets/games/two-truths-bluff-approved.png', 'friends, teams, and new groups', '3 or more', '10–30 minutes', 'Icebreaker game'),
  game('/games/most-likely-to', 'Most Likely To', DEFAULT_IMAGE, 'friends, families, and parties', '3 or more', '10–45 minutes', 'Party game'),
  game('/games/choose-your-side', 'Choose Your Side', '/assets/games/choose-your-side.png', 'friends, teams, and parties', '2 or more', '10–45 minutes', 'Party game'),
  game('/games/who-said-that', 'Who Said That?', '/assets/games/who-said-that.png', 'friends, families, and groups', '3 or more', '10–45 minutes', 'Guessing game'),
  game('/games/we-just-met', 'We Just Met', '/assets/games/we-just-met.png', 'new friends, dates, and groups', '2 or more', '10–45 minutes', 'Icebreaker game'),
]

const pages = [
  {
    path: '/',
    title: 'Decked — Free Online Party & Conversation Games',
    description: 'Play free party and conversation games online with Decked. Pick a deck, pass the phone, or invite friends—no download or account needed.',
    image: DEFAULT_IMAGE,
    type: 'WebPage',
    body: `<main><h1>Free online party and conversation games</h1><p>Decked is a free collection of browser-based games for friends, couples, families, parties, and teams. No account or download is required.</p><nav aria-label="Explore Decked"><a href="/games">Browse all games</a> · <a href="/guides">Read game guides</a> · <a href="/about">About Decked</a></nav><h2>Choose a guide</h2><ul>${guides.slice(1).map(guide => `<li><a href="${guide.path}">${escapeHtml(guide.heading)}</a></li>`).join('')}</ul></main>`,
  },
  {
    path: '/games',
    title: 'Free Online Party Games — Browse Decked Games',
    description: 'Browse free party games, conversation starters, drinking games, couple games, icebreakers, and group games you can play instantly online.',
    image: DEFAULT_IMAGE,
    type: 'CollectionPage',
    body: `
      <main>
        <a href="/">Decked</a>
        <h1>Free online party and conversation games</h1>
        <p>Choose a game for parties, date nights, family gatherings, team hangouts, or meeting new people. Play instantly in your browser with no download or account.</p>
        <nav aria-label="Decked games">
          <ul>${games.map(game => `<li><a href="${game.path}">${escapeHtml(game.name)}</a></li>`).join('')}</ul>
        </nav>
      </main>`,
  },
  {
    path: '/about',
    title: 'About Decked — Games That Bring People Together',
    description: 'Learn how Decked makes parties, dates, family gatherings, and group hangouts more memorable with simple browser-based games.',
    image: DEFAULT_IMAGE,
    type: 'AboutPage',
    body: `
      <main>
        <a href="/">Decked</a>
        <h1>About Decked</h1>
        <p>Decked is a collection of browser-based party and conversation games created to make spending time together more memorable.</p>
        <p>Pass one phone around or invite everyone to join from their own device. There is nothing to download, no account to create, and no complicated setup.</p>
        <p><a href="/games">Browse all Decked games</a></p>
      </main>`,
  },
  legalPage('/privacy', 'Privacy Policy — Decked', 'Learn what information Decked processes, why it is used, how long it is kept, and the privacy choices available to you.', 'Privacy Policy', 'Decked processes limited on-device game data, temporary multiplayer information, technical records, and privacy-safe usage analytics when enabled. We do not sell personal data or use it for targeted advertising.'),
  legalPage('/terms', 'Terms of Use — Decked', 'Read the terms governing use of Decked browser games, multiplayer rooms, user content, safety, and availability.', 'Terms of Use', 'These terms govern use of Decked. Use the service lawfully, choose games appropriate for your group, skip any prompt, and never treat a game as an instruction to do something unsafe or illegal.'),
  legalPage('/cookies', 'Cookie Policy — Decked', 'Learn how Decked uses cookies, local storage, anonymous authentication, preferences, and analytics technologies.', 'Cookie Policy', 'Decked uses browser storage and similar technologies for game progress, preferences, anonymous multiplayer authentication, security, and analytics when enabled. We do not use advertising cookies.'),
  ...guides.map(guide => ({
    ...guide,
    image: DEFAULT_IMAGE,
    type: guide.path === '/guides' ? 'CollectionPage' : 'Article',
    body: guide.path === '/guides' ? guideLibraryBody(guide) : guideArticleBody(guide),
  })),
  ...games.map(game => ({
    ...game,
    title: `${game.name} Online — Play Free on Decked`,
    description: `Play ${game.name} online for free with Decked. Start instantly in your browser with ${game.audience}—no download or account needed.`,
    type: 'WebPage',
    body: `
      <main>
        <nav><a href="/">Decked</a> · <a href="/games">Browse games</a></nav>
        <article>
          <h1>Play ${escapeHtml(game.name)} online</h1>
          <p>Start a free game of ${escapeHtml(game.name)} for ${escapeHtml(game.audience)}. Decked works directly in your browser, with no app download and no account required.</p>
          <dl>
            <dt>Players</dt><dd>${escapeHtml(game.players)}</dd>
            <dt>Typical play time</dt><dd>${escapeHtml(game.duration)}</dd>
            <dt>Best for</dt><dd>${escapeHtml(game.audience)}</dd>
            <dt>Format</dt><dd>Free browser-based ${escapeHtml(game.genre.toLowerCase())}; no account or download required</dd>
            ${game.drinkingGame ? '<dt>Drinks</dt><dd>Designed for adults; alcoholic drinks are optional</dd>' : ''}
          </dl>
          <img src="${game.image}" alt="${escapeHtml(game.name)} game on Decked" width="600" height="750" />
          <p><a href="${game.path}">Play ${escapeHtml(game.name)} now</a></p>
        </article>
      </main>`,
  })),
]

const baseHtml = await readFile(join(OUTPUT_DIRECTORY, 'index.html'), 'utf8')
const sitemap = await readFile('public/sitemap.xml', 'utf8')

for (const page of pages) {
  const canonical = `${SITE_URL}${page.path}`
  const image = `${SITE_URL}${page.image}`
  const structuredData = buildStructuredData(page, canonical, image)

  const html = setTag(setMeta(setLink(baseHtml, 'canonical', canonical), page), 'title', escapeHtml(page.title))
    .replace('</head>', `  <script type="application/ld+json">${escapeJson(structuredData)}</script>\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"><div data-prerendered-route="${page.path}">${page.body}</div></div>`)

  const outputPath = join(OUTPUT_DIRECTORY, page.path.slice(1), 'index.html')
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, html)

  if (!sitemap.includes(`<loc>${canonical}</loc>`)) {
    throw new Error(`Prerendered page is missing from sitemap: ${canonical}`)
  }
}

console.log(`Prerendered ${pages.length} indexable routes.`)

function game(path, name, image, audience, players, duration, genre, drinkingGame = false) {
  return { path, name, image, audience, players, duration, genre, drinkingGame }
}

function legalPage(path, title, description, heading, summary) {
  return {
    path, title, description, image: DEFAULT_IMAGE, type: 'WebPage',
    body: `<main><nav><a href="/">Decked</a></nav><article><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(summary)}</p><p>Last updated: 10 October 2026</p><p>Contact <a href="mailto:hello@usedecked.com">hello@usedecked.com</a> with questions or requests.</p></article></main>`,
  }
}

function buildStructuredData(page, canonical, image) {
  const websiteId = `${SITE_URL}/#website`
  const organizationId = `${SITE_URL}/#organization`
  const breadcrumbId = `${canonical}#breadcrumb`
  const pageId = `${canonical}#webpage`
  const graph = [
    {
      '@type': page.type,
      '@id': pageId,
      url: canonical,
      name: page.title,
      description: page.description,
      isPartOf: { '@id': websiteId },
      about: { '@id': organizationId },
      breadcrumb: { '@id': breadcrumbId },
      primaryImageOfPage: { '@type': 'ImageObject', url: image },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': breadcrumbId,
      itemListElement: breadcrumbItems(page, canonical),
    },
  ]

  if (page.path === '/') {
    delete graph[0].breadcrumb
    graph.pop()
    graph[0].mainEntity = { '@id': websiteId }
  } else if (page.path === '/games') {
    graph[0].mainEntity = {
      '@type': 'ItemList',
      numberOfItems: games.length,
      itemListElement: games.map((entry, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: entry.name,
        url: `${SITE_URL}${entry.path}`,
      })),
    }
  } else if (page.path === '/about') {
    graph[0].mainEntity = { '@id': organizationId }
  } else if (page.path === '/guides') {
    graph[0].mainEntity = {
      '@type': 'ItemList',
      numberOfItems: guides.length - 1,
      itemListElement: guides.slice(1).map((guide, index) => ({
        '@type': 'ListItem', position: index + 1, name: guide.heading, url: `${SITE_URL}${guide.path}`,
      })),
    }
  } else if (page.path.startsWith('/guides/')) {
    const faqId = `${canonical}#faq`
    graph[0].headline = page.heading
    graph[0].author = { '@id': organizationId }
    graph[0].publisher = { '@id': organizationId }
    graph[0].mainEntity = {
      '@type': 'ItemList',
      numberOfItems: page.recommendations.length,
      itemListElement: page.recommendations.map((entry, index) => ({
        '@type': 'ListItem', position: index + 1, name: entry.name, url: `${SITE_URL}${entry.path}`,
      })),
    }
    graph[0].subjectOf = { '@id': faqId }
    graph.push({
      '@type': 'FAQPage',
      '@id': faqId,
      mainEntity: page.faqs.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    })
  } else {
    const gameId = `${canonical}#game`
    graph[0].mainEntity = { '@id': gameId }
    graph.push({
      '@type': ['VideoGame', 'WebApplication'],
      '@id': gameId,
      name: page.name,
      description: page.description,
      url: canonical,
      image,
      applicationCategory: 'GameApplication',
      applicationSubCategory: page.genre,
      operatingSystem: 'Any operating system with a modern web browser',
      browserRequirements: 'JavaScript and a modern web browser',
      gamePlatform: 'Web browser',
      playMode: 'MultiPlayer',
      numberOfPlayers: {
        '@type': 'QuantitativeValue',
        minValue: Number.parseInt(page.players, 10),
        unitText: 'players',
      },
      audience: {
        '@type': 'PeopleAudience',
        audienceType: page.audience,
      },
      offers: {
        '@type': 'Offer',
        price: 0,
        priceCurrency: 'USD',
        availability: 'https://schema.org/OnlineOnly',
        url: canonical,
      },
      publisher: { '@id': organizationId },
      isAccessibleForFree: true,
    })
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}

function breadcrumbItems(page, canonical) {
  const items = [
    { '@type': 'ListItem', position: 1, name: 'Decked', item: `${SITE_URL}/` },
  ]
  if (page.path.startsWith('/games/')) {
    items.push({ '@type': 'ListItem', position: 2, name: 'Games', item: `${SITE_URL}/games` })
    items.push({ '@type': 'ListItem', position: 3, name: page.name, item: canonical })
  } else if (page.path.startsWith('/guides/')) {
    items.push({ '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/guides` })
    items.push({ '@type': 'ListItem', position: 3, name: page.heading, item: canonical })
  } else {
    const names = { '/games': 'Games', '/guides': 'Guides', '/about': 'About', '/privacy': 'Privacy Policy', '/terms': 'Terms of Use', '/cookies': 'Cookie Policy' }
    const name = names[page.path] ?? page.title
    items.push({ '@type': 'ListItem', position: 2, name, item: canonical })
  }
  return items
}

function guideLibraryBody(guide) {
  return `<main><nav><a href="/">Decked</a> · <a href="/games">Games</a></nav><article><h1>${escapeHtml(guide.heading)}</h1><p>${escapeHtml(guide.intro)}</p><ul>${guides.slice(1).map(item => `<li><a href="${item.path}">${escapeHtml(item.heading)}</a><p>${escapeHtml(item.description)}</p></li>`).join('')}</ul></article></main>`
}

function guideArticleBody(guide) {
  return `<main><nav><a href="/">Decked</a> · <a href="/guides">Guides</a></nav><article><h1>${escapeHtml(guide.heading)}</h1><p>${escapeHtml(guide.intro)}</p><section><h2>Quick answer</h2><p>${escapeHtml(guide.summary)}</p></section><section><h2>Recommended games</h2>${guide.recommendations.map(game => `<article><h3><a href="${game.path}">${escapeHtml(game.name)}</a></h3><p>${escapeHtml(game.reason)}</p><dl><dt>Players</dt><dd>${escapeHtml(game.players)}</dd><dt>Time</dt><dd>${escapeHtml(game.duration)}</dd><dt>Best for</dt><dd>${escapeHtml(game.bestFor)}</dd><dt>Alcohol</dt><dd>${escapeHtml(game.alcohol)}</dd></dl></article>`).join('')}</section><section><h2>Practical tips</h2><ol>${guide.tips.map(tip => `<li>${escapeHtml(tip)}</li>`).join('')}</ol></section><section><h2>Frequently asked questions</h2>${guide.faqs.map(item => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join('')}</section></article></main>`
}

function setMeta(html, page) {
  const values = {
    'name:description': page.description,
    'name:robots': 'index,follow,max-image-preview:large',
    'property:og:title': page.title,
    'property:og:description': page.description,
    'property:og:url': `${SITE_URL}${page.path}`,
    'property:og:image': `${SITE_URL}${page.image}`,
    'property:og:image:alt': `${page.title} — Decked`,
    'name:twitter:title': page.title,
    'name:twitter:description': page.description,
    'name:twitter:image': `${SITE_URL}${page.image}`,
  }

  return Object.entries(values).reduce((result, [selector, value]) => {
    const separator = selector.indexOf(':')
    const attribute = selector.slice(0, separator)
    const key = selector.slice(separator + 1)
    const pattern = new RegExp(`<meta\\s+${attribute}="${escapeRegExp(key)}"\\s+content="[^"]*"\\s*/?>`)
    return result.replace(pattern, `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`)
  }, html)
}

function setLink(html, relation, href) {
  const pattern = new RegExp(`<link\\s+rel="${escapeRegExp(relation)}"\\s+href="[^"]*"\\s*/?>`)
  return html.replace(pattern, `<link rel="${relation}" href="${href}" />`)
}

function setTag(html, tag, content) {
  return html.replace(new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`), `<${tag}>${content}</${tag}>`)
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
