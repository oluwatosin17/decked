export type Screen =
  | 'home' | 'about' | 'privacy' | 'terms' | 'cookies' | 'browse' | 'guides'
  | `guide-${string}`
  | 'quick-play' | 'play-mode'
  | 'lnt-select' | 'late-night-talks'
  | 'dtc-select' | 'dinner-table'
  | 'you-laugh' | 'never-have-i-ever' | 'charades'
  | 'truth-or-dare' | 'spicy-starters'
  | 'lets-reconnect' | 'everyday-conversations' | 'wnrs' | 'put-a-finger-down'
  | 'take-a-sip' | 'sip-or-spill' | 'do-or-drink'
  | 'icebreaker' | 'red-flag-green-flag'
  | 'two-truths-bluff'
  | 'most-likely-to'
  | 'choose-your-side'
  | 'who-said-that'
  | 'we-just-met'
  | 'whot'
  | 'imposter'
  | 'mini-mystery'
  | 'play-together'

export const SCREEN_PATHS: Record<string, string> = {
  home: '/',
  about: '/about',
  privacy: '/privacy',
  terms: '/terms',
  cookies: '/cookies',
  browse: '/games',
  guides: '/guides',
  'quick-play': '/quick-play',
  'play-mode': '/games/play',
  'lnt-select': '/games/late-night-talks/mode',
  'late-night-talks': '/games/late-night-talks',
  'dtc-select': '/games/dinner-table/mode',
  'dinner-table': '/games/dinner-table',
  'you-laugh': '/games/you-laugh-youre-out',
  'never-have-i-ever': '/games/never-have-i-ever',
  charades: '/games/charades',
  'truth-or-dare': '/games/truth-or-dare',
  'spicy-starters': '/games/spicy-starters',
  'lets-reconnect': '/games/lets-reconnect',
  'everyday-conversations': '/games/everyday-conversations',
  wnrs: '/games/were-not-really-strangers',
  'put-a-finger-down': '/games/put-a-finger-down',
  'take-a-sip': '/games/take-a-sip',
  'sip-or-spill': '/games/sip-or-spill',
  'do-or-drink': '/games/do-or-drink',
  icebreaker: '/games/icebreaker',
  'red-flag-green-flag': '/games/red-flag-green-flag',
  'two-truths-bluff': '/games/two-truths-and-a-bluff',
  'most-likely-to': '/games/most-likely-to',
  'choose-your-side': '/games/choose-your-side',
  'who-said-that': '/games/who-said-that',
  'we-just-met': '/games/we-just-met',
  whot: '/games/whot',
  imposter: '/games/imposter',
  'mini-mystery': '/games/mini-mystery',
  'play-together': '/play-together',
}

const PATH_SCREENS = new Map(Object.entries(SCREEN_PATHS).map(([screen, path]) => [path, screen as Screen]))

export function screenFromLocation(): Screen {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path.startsWith('/guides/')) return `guide-${path.slice('/guides/'.length)}`
  return PATH_SCREENS.get(path) ?? 'home'
}

export function urlForScreen(screen: Screen) {
  if (screen.startsWith('guide-')) return `/guides/${screen.slice('guide-'.length)}`
  return SCREEN_PATHS[screen]
}
