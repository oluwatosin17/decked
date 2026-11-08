export type LipsTurnDecision = {
  phrase: string
  correct: boolean
}

export function addLipsDecision(history: readonly LipsTurnDecision[], phrase: string, correct: boolean): LipsTurnDecision[] {
  return [...history, { phrase, correct }]
}

export function undoLipsDecision(history: readonly LipsTurnDecision[]) {
  const decision = history[history.length - 1]
  if (!decision) return { history: [...history], decision: null }
  return { history: history.slice(0, -1), decision }
}

export function toggleLipsDecision(history: readonly LipsTurnDecision[], index: number) {
  const decision = history[index]
  if (!decision) return { history: [...history], decision: null }
  return {
    history: history.map((item, itemIndex) => itemIndex === index ? { ...item, correct: !item.correct } : item),
    decision,
  }
}

export function lipsTurnPoints(history: readonly LipsTurnDecision[]) {
  return history.filter(decision => decision.correct).length
}

export function lipsReviewerTeam(turn: number, teamCount: number) {
  return teamCount > 0 ? (turn + 1) % teamCount : 0
}

export function canReviewLipsTurn({ currentUserId, playerIds, turn, teamCount }: {
  currentUserId: string
  playerIds: readonly string[]
  turn: number
  teamCount: number
}) {
  const reviewerTeam = lipsReviewerTeam(turn, teamCount)
  return playerIds.slice(reviewerTeam * 2, reviewerTeam * 2 + 2).includes(currentUserId)
}
