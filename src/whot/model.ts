export type WhotShape = 'circle' | 'triangle' | 'cross' | 'square' | 'star' | 'whot'

export type WhotCard = {
  id: string
  shape: WhotShape
  number: number
}

export type WhotRules = {
  finishMode: 'first-out' | 'ranking'
  startingCards: number
  pickTwo: boolean
  pickThree: boolean
  holdOn: boolean
  suspension: boolean
  generalMarket: boolean
  stacking: 'off' | 'same' | 'mixed'
  whotCancelsPenalty: boolean
  drawMode: 'one' | 'until-playable'
  playDrawnCard: boolean
  lastCardCall: boolean
  missedCallPenalty: number
}

export type WhotPlayer = { id: string; name: string; color: string }

export type WhotState = {
  players: WhotPlayer[]
  hands: Record<string, WhotCard[]>
  drawPile: WhotCard[]
  discardPile: WhotCard[]
  currentPlayerIndex: number
  direction: 1 | -1
  requestedShape: Exclude<WhotShape, 'whot'> | null
  pendingDraw: number
  pendingKind: 2 | 5 | null
  awaitingShape: boolean
  lastCardDeclared: Record<string, boolean>
  winnerId: string | null
  finishOrder: string[]
  turn: number
  message: string
  rules: WhotRules
}

export const CLASSIC_WHOT_RULES: WhotRules = {
  finishMode: 'first-out',
  startingCards: 6,
  pickTwo: true,
  pickThree: true,
  holdOn: true,
  suspension: true,
  generalMarket: true,
  stacking: 'same',
  whotCancelsPenalty: false,
  drawMode: 'one',
  playDrawnCard: false,
  lastCardCall: true,
  missedCallPenalty: 2,
}

const NUMBERS: Record<Exclude<WhotShape, 'whot'>, number[]> = {
  circle: [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14],
  triangle: [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14],
  cross: [1, 2, 3, 5, 7, 10, 11, 13, 14],
  square: [1, 2, 3, 5, 7, 10, 11, 13, 14],
  star: [1, 2, 3, 4, 5, 7, 8],
}

export const SHAPES: Exclude<WhotShape, 'whot'>[] = ['circle', 'triangle', 'cross', 'square', 'star']

export function createWhotDeck(): WhotCard[] {
  const deck = SHAPES.flatMap(shape => NUMBERS[shape].map(number => ({ id: `${shape}-${number}`, shape, number })))
  return [...deck, ...Array.from({ length: 5 }, (_, index) => ({ id: `whot-20-${index + 1}`, shape: 'whot' as const, number: 20 }))]
}

export function shuffleWhot<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    ;[result[index], result[swap]] = [result[swap], result[index]]
  }
  return result
}

const isAction = (card: WhotCard, rules: WhotRules) =>
  (card.number === 1 && rules.holdOn) || (card.number === 2 && rules.pickTwo) ||
  (card.number === 5 && rules.pickThree) || (card.number === 8 && rules.suspension) ||
  (card.number === 14 && rules.generalMarket) || card.shape === 'whot'

export function createWhotGame(players: WhotPlayer[], rules: WhotRules = CLASSIC_WHOT_RULES, random = Math.random): WhotState {
  const deck = shuffleWhot(createWhotDeck(), random)
  const hands: Record<string, WhotCard[]> = Object.fromEntries(players.map(player => [player.id, []]))
  for (let count = 0; count < rules.startingCards; count += 1) {
    for (const player of players) {
      const card = deck.pop()
      if (card) hands[player.id].push(card)
    }
  }
  let opening = deck.pop()!
  while (isAction(opening, rules) && deck.length) {
    deck.unshift(opening)
    opening = deck.pop()!
  }
  return {
    players, hands, drawPile: deck, discardPile: [opening], currentPlayerIndex: 0, direction: 1,
    requestedShape: null, pendingDraw: 0, pendingKind: null, awaitingShape: false,
    lastCardDeclared: {}, winnerId: null, finishOrder: [], turn: 1, message: `${players[0]?.name ?? 'Player 1'} starts`, rules,
  }
}

export const topCard = (state: WhotState) => state.discardPile[state.discardPile.length - 1]
export const currentPlayer = (state: WhotState) => state.players[state.currentPlayerIndex]

export function canPlayWhotCard(state: WhotState, card: WhotCard): boolean {
  if (state.winnerId || state.awaitingShape) return false
  if (state.pendingDraw > 0) {
    if (card.shape === 'whot') return state.rules.whotCancelsPenalty
    if (state.rules.stacking === 'off') return false
    if (state.rules.stacking === 'same') return card.number === state.pendingKind
    return card.number === 2 || card.number === 5
  }
  if (card.shape === 'whot') return true
  const top = topCard(state)
  if (state.requestedShape) return card.shape === state.requestedShape
  return card.shape === top.shape || card.number === top.number
}

function nextIndex(state: WhotState, steps = 1) {
  const length = state.players.length
  const finishOrder = state.finishOrder ?? []
  let index = state.currentPlayerIndex
  let moved = 0
  let checked = 0
  while (moved < steps && checked < length * Math.max(steps, 1) * 2) {
    index = (index + state.direction + length) % length
    if (!finishOrder.includes(state.players[index].id)) moved += 1
    checked += 1
  }
  return index
}

function refillPile(state: WhotState) {
  if (state.drawPile.length) return state
  const top = topCard(state)
  return { ...state, drawPile: shuffleWhot(state.discardPile.slice(0, -1)), discardPile: [top] }
}

function drawCards(state: WhotState, playerId: string, count: number) {
  let next = { ...state, hands: { ...state.hands, [playerId]: [...state.hands[playerId]] } }
  for (let index = 0; index < count; index += 1) {
    next = refillPile(next)
    const card = next.drawPile[next.drawPile.length - 1]
    if (!card) break
    next.drawPile = next.drawPile.slice(0, -1)
    next.hands[playerId].push(card)
  }
  return next
}

function advance(state: WhotState, steps = 1, message?: string): WhotState {
  const index = nextIndex(state, steps)
  return { ...state, currentPlayerIndex: index, turn: state.turn + 1, message: message ?? `${state.players[index].name}'s turn` }
}

export function declareLastCard(state: WhotState, playerId: string): WhotState {
  if (state.hands[playerId]?.length !== 2) return state
  return { ...state, lastCardDeclared: { ...state.lastCardDeclared, [playerId]: true }, message: `${state.players.find(player => player.id === playerId)?.name} called last card` }
}

export function playWhotCard(state: WhotState, playerId: string, cardId: string): WhotState {
  if (currentPlayer(state)?.id !== playerId || state.awaitingShape) return state
  const hand = state.hands[playerId] ?? []
  const card = hand.find(item => item.id === cardId)
  if (!card || !canPlayWhotCard(state, card)) return state
  const remaining = hand.filter(item => item.id !== cardId)
  const calledLastCard = Boolean(state.lastCardDeclared[playerId])
  let next: WhotState = {
    ...state,
    hands: { ...state.hands, [playerId]: remaining },
    discardPile: [...state.discardPile, card],
    requestedShape: null,
    lastCardDeclared: { ...state.lastCardDeclared, [playerId]: remaining.length === 1 ? calledLastCard : false },
  }
  if (state.rules.lastCardCall && remaining.length === 1 && !calledLastCard) {
    next = drawCards(next, playerId, state.rules.missedCallPenalty)
    next.message = `${currentPlayer(state).name} missed the last-card call and picked ${state.rules.missedCallPenalty}`
  }
  if (remaining.length === 0 && (!state.rules.lastCardCall || calledLastCard)) {
    if ((state.rules.finishMode ?? 'first-out') === 'first-out') return { ...next, winnerId: playerId, finishOrder: [playerId], message: `${currentPlayer(state).name} wins!` }
    const finishOrder = [...(state.finishOrder ?? []), playerId]
    const remainingPlayers = state.players.filter(player => !finishOrder.includes(player.id))
    if (remainingPlayers.length <= 1) {
      const finalOrder = [...finishOrder, ...remainingPlayers.map(player => player.id)]
      return { ...next, winnerId: finalOrder[0], finishOrder: finalOrder, message: `${currentPlayer(state).name} finished!` }
    }
    return advance({ ...next, finishOrder }, 1, `${currentPlayer(state).name} finished #${finishOrder.length}`)
  }
  if (card.shape === 'whot') {
    const canceled = state.pendingDraw > 0 && state.rules.whotCancelsPenalty
    return { ...next, awaitingShape: true, pendingDraw: canceled ? 0 : state.pendingDraw, pendingKind: canceled ? null : state.pendingKind, message: `${currentPlayer(state).name}, choose a shape` }
  }
  if (card.number === 2 && state.rules.pickTwo) return advance({ ...next, pendingDraw: state.pendingDraw + 2, pendingKind: 2 }, 1, `Pick ${state.pendingDraw + 2} or defend with a 2`)
  if (card.number === 5 && state.rules.pickThree) return advance({ ...next, pendingDraw: state.pendingDraw + 3, pendingKind: 5 }, 1, `Pick ${state.pendingDraw + 3} or defend with a 5`)
  if (card.number === 1 && state.rules.holdOn) return { ...next, turn: state.turn + 1, message: `${currentPlayer(state).name} holds on and plays again` }
  if (card.number === 8 && state.rules.suspension) return { ...next, turn: state.turn + 1, message: `${state.players[nextIndex(state, 1)].name} is suspended. ${currentPlayer(state).name} plays again` }
  if (card.number === 14 && state.rules.generalMarket) {
    for (const player of state.players) if (player.id !== playerId) next = drawCards(next, player.id, 1)
    return { ...next, turn: state.turn + 1, message: `General market: everyone else picked one. ${currentPlayer(state).name} plays again` }
  }
  return advance(next)
}

export function chooseWhotShape(state: WhotState, playerId: string, shape: Exclude<WhotShape, 'whot'>): WhotState {
  if (!state.awaitingShape || currentPlayer(state)?.id !== playerId) return state
  return advance({ ...state, awaitingShape: false, requestedShape: shape }, 1, `${shape.toUpperCase()} was called`)
}

export function drawForWhotTurn(state: WhotState, playerId: string): WhotState {
  if (currentPlayer(state)?.id !== playerId || state.awaitingShape) return state
  const count = state.pendingDraw || 1
  let next = drawCards(state, playerId, count)
  if (!state.pendingDraw && state.rules.drawMode === 'until-playable') {
    while (next.drawPile.length && !next.hands[playerId].some(card => canPlayWhotCard(next, card))) next = drawCards(next, playerId, 1)
  }
  if (!state.pendingDraw && state.rules.playDrawnCard) {
    const drawn = next.hands[playerId][next.hands[playerId].length - 1]
    if (drawn && canPlayWhotCard(next, drawn)) return { ...next, message: `${currentPlayer(state).name} may play the drawn card` }
  }
  return advance({ ...next, pendingDraw: 0, pendingKind: null }, 1, `${currentPlayer(state).name} picked ${count}`)
}
