export type SoundEvent =
  | 'ui.tap'
  | 'deck.shuffle'
  | 'card.flip'
  | 'card.next'
  | 'turn.change'
  | 'game.start'
  | 'game.complete'

export type SoundElement = HTMLElement & {
  dataset: DOMStringMap & { sound?: SoundEvent | 'none' }
}
