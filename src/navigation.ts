export type Screen =
  | 'home' | 'browse' | 'quick-play'
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
  | 'play-together'

export const SCREEN_PATHS: Record<Screen, string> = {
  home: '/',
  browse: '/games',
  'quick-play': '/quick-play',
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
  'play-together': '/play-together',
}

const PATH_SCREENS = new Map(Object.entries(SCREEN_PATHS).map(([screen, path]) => [path, screen as Screen]))

export function screenFromLocation(): Screen {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  return PATH_SCREENS.get(path) ?? 'home'
}

export function urlForScreen(screen: Screen) {
  return SCREEN_PATHS[screen]
}
