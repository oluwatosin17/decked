import { describe, expect, it } from 'vitest'
import { CLASSIC_WHOT_RULES, canPlayWhotCard, chooseWhotShape, createWhotGame, currentPlayer, declareLastCard, drawForWhotTurn, playWhotCard, type WhotCard, type WhotState } from './model'

const players = [{ id: 'a', name: 'Ada', color: '#f00' }, { id: 'b', name: 'Bola', color: '#00f' }, { id: 'c', name: 'Chidi', color: '#0f0' }]
const card = (shape: WhotCard['shape'], number: number, id = `${shape}-${number}`): WhotCard => ({ id, shape, number })
const state = (hands: WhotState['hands'], top = card('circle', 7)): WhotState => ({
  players, hands, drawPile: [card('square', 3), card('star', 4)], discardPile: [top], currentPlayerIndex: 0, direction: 1,
  requestedShape: null, pendingDraw: 0, pendingKind: null, awaitingShape: false, lastCardDeclared: {}, winnerId: null, finishOrder: [], turn: 1,
  message: '', rules: CLASSIC_WHOT_RULES,
})

describe('Whot rules engine', () => {
  it('creates a 54-card deck and deals six each', () => {
    const game = createWhotGame(players, CLASSIC_WHOT_RULES, () => 0.5)
    expect(Object.values(game.hands).every(hand => hand.length === 6)).toBe(true)
    expect(game.drawPile.length + game.discardPile.length + 18).toBe(54)
  })
  it('matches by shape or number and allows Whot', () => {
    const game = state({ a: [], b: [], c: [] })
    expect(canPlayWhotCard(game, card('circle', 11))).toBe(true)
    expect(canPlayWhotCard(game, card('star', 7))).toBe(true)
    expect(canPlayWhotCard(game, card('star', 3))).toBe(false)
    expect(canPlayWhotCard(game, card('whot', 20))).toBe(true)
  })
  it('stacks pick twos and makes the next player draw four', () => {
    let game = state({ a: [card('circle', 2, 'a2')], b: [card('triangle', 2, 'b2')], c: [card('star', 3)] })
    game = playWhotCard(game, 'a', 'a2')
    game = playWhotCard(game, 'b', 'b2')
    expect(game.pendingDraw).toBe(4)
    expect(game.currentPlayerIndex).toBe(2)
    game = drawForWhotTurn(game, 'c')
    expect(game.hands.c).toHaveLength(5)
    expect(game.currentPlayerIndex).toBe(0)
  })
  it('supports mixed draw stacking and blocks stacking when disabled', () => {
    const pending = { ...state({ a: [], b: [], c: [] }), pendingDraw: 2, pendingKind: 2 as const }
    expect(canPlayWhotCard({ ...pending, rules: { ...pending.rules, stacking: 'same' } }, card('triangle', 5))).toBe(false)
    expect(canPlayWhotCard({ ...pending, rules: { ...pending.rules, stacking: 'mixed' } }, card('triangle', 5))).toBe(true)
    expect(canPlayWhotCard({ ...pending, rules: { ...pending.rules, stacking: 'off' } }, card('triangle', 2))).toBe(false)
  })
  it('lets the same player continue after Hold On, Suspension, and General Market', () => {
    for (const [number, id] of [[1, 'hold'], [8, 'suspend'], [14, 'market']] as const) {
      const initial = state({
        a: [card('circle', number, id), card('triangle', 7), card('star', 9)],
        b: [card('circle', 3)],
        c: [card('square', 4)],
      })
      const game = playWhotCard(initial, 'a', id)
      expect(game.currentPlayerIndex).toBe(0)
      expect(game.turn).toBe(2)
      if (number === 14) {
        expect(game.hands.b).toHaveLength(2)
        expect(game.hands.c).toHaveLength(2)
      }
    }
  })
  it('continues in ranking mode and assigns the final remaining player last place', () => {
    let game: WhotState = {
      ...state({ a: [card('circle', 7, 'a-out')], b: [card('circle', 7, 'b-out')], c: [card('star', 3, 'c-last')] }),
      rules: { ...CLASSIC_WHOT_RULES, finishMode: 'ranking', lastCardCall: false },
    }
    game = playWhotCard(game, 'a', 'a-out')
    expect(game.winnerId).toBeNull()
    expect(game.finishOrder).toEqual(['a'])
    expect(currentPlayer(game).id).toBe('b')
    game = playWhotCard(game, 'b', 'b-out')
    expect(game.winnerId).toBe('a')
    expect(game.finishOrder).toEqual(['a', 'b', 'c'])
  })
  it('lets Whot 20 cancel an accumulated draw and still requires a shape call', () => {
    let game: WhotState = {
      ...state({ a: [card('whot', 20, 'cancel'), card('circle', 4)], b: [], c: [] }),
      pendingDraw: 6,
      pendingKind: 2 as const,
      rules: { ...CLASSIC_WHOT_RULES, whotCancelsPenalty: true },
    }
    game = playWhotCard(game, 'a', 'cancel')
    expect(game.pendingDraw).toBe(0)
    expect(game.awaitingShape).toBe(true)
    expect(game.currentPlayerIndex).toBe(0)
    game = chooseWhotShape(game, 'a', 'square')
    expect(game.requestedShape).toBe('square')
    expect(game.currentPlayerIndex).toBe(1)
  })
  it('requires a shape choice after Whot', () => {
    let game = state({ a: [card('whot', 20, 'w'), card('circle', 4)], b: [], c: [] })
    game = playWhotCard(game, 'a', 'w')
    expect(game.awaitingShape).toBe(true)
    game = chooseWhotShape(game, 'a', 'star')
    expect(game.requestedShape).toBe('star')
    expect(game.currentPlayerIndex).toBe(1)
  })
  it('supports calling last card before playing down to one', () => {
    let game = state({ a: [card('circle', 7, 'play'), card('star', 3)], b: [], c: [] })
    game = declareLastCard(game, 'a')
    game = playWhotCard(game, 'a', 'play')
    expect(game.hands.a).toHaveLength(1)
  })
})
