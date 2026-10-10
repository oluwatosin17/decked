import { SCREEN_PATHS, type Screen } from './navigation'
import { GUIDE_BY_SCREEN } from './guideData'

const SITE_URL = 'https://www.usedecked.com'
const DEFAULT_IMAGE = `${SITE_URL}/brand/decked-social-avatar.png`

const gameNames: Partial<Record<Screen, string>> = {
  'late-night-talks': 'Late Night Talks',
  'dinner-table': 'Dinner Table',
  'you-laugh': "You Laugh, You're Out",
  'never-have-i-ever': 'Never Have I Ever',
  charades: 'Charades',
  'truth-or-dare': 'Truth or Dare',
  'spicy-starters': 'Spicy Starters',
  'lets-reconnect': "Let's Reconnect",
  'everyday-conversations': 'Everyday Conversations',
  wnrs: "We're Not Really Strangers",
  'put-a-finger-down': 'Put a Finger Down',
  'take-a-sip': 'Take a Sip',
  'sip-or-spill': 'Sip or Spill',
  'do-or-drink': 'Do or Drink',
  icebreaker: 'Icebreaker',
  'red-flag-green-flag': 'Red Flag, Green Flag',
  'two-truths-bluff': 'Two Truths and a Bluff',
  'most-likely-to': 'Most Likely To',
  'choose-your-side': 'Choose Your Side',
  'who-said-that': 'Who Said That?',
  'we-just-met': 'We Just Met',
}

const noIndexScreens = new Set<Screen>([
  'quick-play',
  'play-mode',
  'lnt-select',
  'dtc-select',
  'play-together',
])

function upsertMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = content
}

function setCanonical(url: string) {
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = url
}

export function updateDocumentMetadata(screen: Screen) {
  const gameName = gameNames[screen]
  const guide = GUIDE_BY_SCREEN.get(screen)
  const path = SCREEN_PATHS[screen]
  const canonical = `${SITE_URL}${path === '/' ? '/' : path}`

  let title = 'Decked — Free Online Party & Conversation Games'
  let description = 'Play free party and conversation games online with Decked. Pick a deck, pass the phone, or invite friends—no download or account needed.'

  if (guide) {
    title = guide.title
    description = guide.description
  } else if (screen === 'browse') {
    title = 'Free Online Party Games — Browse Decked Games'
    description = 'Browse free party games, conversation starters, drinking games, couple games, icebreakers, and group games you can play instantly online.'
  } else if (screen === 'about') {
    title = 'About Decked — Games That Bring People Together'
    description = 'Learn how Decked makes parties, dates, family gatherings, and group hangouts more memorable with simple browser-based games.'
  } else if (screen === 'privacy') {
    title = 'Privacy Policy — Decked'
    description = 'Learn what information Decked processes, why it is used, how long it is kept, and the privacy choices available to you.'
  } else if (screen === 'terms') {
    title = 'Terms of Use — Decked'
    description = 'Read the terms governing use of Decked browser games, multiplayer rooms, user content, safety, and availability.'
  } else if (screen === 'cookies') {
    title = 'Cookie Policy — Decked'
    description = 'Learn how Decked uses cookies, local storage, anonymous authentication, preferences, and analytics technologies.'
  } else if (gameName) {
    title = `${gameName} Online — Play Free on Decked`
    description = `Play ${gameName} online for free with Decked. Start instantly in your browser with friends—no download or account needed.`
  }

  document.title = title
  setCanonical(canonical)
  upsertMeta('meta[name="description"]', 'name', 'description', description)
  upsertMeta('meta[name="robots"]', 'name', 'robots', noIndexScreens.has(screen) ? 'noindex,follow' : 'index,follow,max-image-preview:large')
  upsertMeta('meta[property="og:title"]', 'property', 'og:title', title)
  upsertMeta('meta[property="og:description"]', 'property', 'og:description', description)
  upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical)
  upsertMeta('meta[property="og:image"]', 'property', 'og:image', DEFAULT_IMAGE)
  upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
  upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
  upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', DEFAULT_IMAGE)
}
