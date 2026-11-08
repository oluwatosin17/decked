/** The current card was visible to the outgoing speaker, even if it was not scored. */
export function nextLipsTurnCard(currentCard: number): number {
  return currentCard + 1
}

export function hasFreshLipsPhrase(deckLength: number, card: number): boolean {
  return card >= 0 && card < deckLength
}
