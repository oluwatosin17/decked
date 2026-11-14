import { describe, expect, it } from 'vitest'
import { addLipsDecision, canReviewLipsTurn, lipsReviewerTeam, lipsTurnPoints, toggleLipsDecision, undoLipsDecision } from './readMyLipsScoring'

describe('Read My Lips turn scoring', () => {
  it('records every correct and skipped prompt in order', () => {
    const history = addLipsDecision(addLipsDecision([], 'Banana', true), 'Angry Goat', false)

    expect(history).toEqual([
      { phrase: 'Banana', correct: true },
      { phrase: 'Angry Goat', correct: false },
    ])
    expect(lipsTurnPoints(history)).toBe(1)
  })

  it('undoes the latest decision and returns it so the score and prompt can be restored', () => {
    const history = [{ phrase: 'Banana', correct: true }, { phrase: 'Angry Goat', correct: false }]
    const result = undoLipsDecision(history)

    expect(result.decision).toEqual({ phrase: 'Angry Goat', correct: false })
    expect(result.history).toEqual([{ phrase: 'Banana', correct: true }])
  })

  it('changes a reviewed prompt between correct and skipped without changing its order', () => {
    const history = [{ phrase: 'Banana', correct: true }, { phrase: 'Angry Goat', correct: false }]
    const result = toggleLipsDecision(history, 1)

    expect(result.decision).toEqual({ phrase: 'Angry Goat', correct: false })
    expect(result.history).toEqual([{ phrase: 'Banana', correct: true }, { phrase: 'Angry Goat', correct: true }])
    expect(lipsTurnPoints(result.history)).toBe(2)
  })

  it('safely ignores undo and review requests when there is no matching decision', () => {
    expect(undoLipsDecision([])).toEqual({ history: [], decision: null })
    expect(toggleLipsDecision([], 0)).toEqual({ history: [], decision: null })
  })

  it('hands multiplayer review only to the next team, including when the host played', () => {
    const players = ['host', 'guesser-a', 'speaker-b', 'guesser-b']
    expect(lipsReviewerTeam(0, 2)).toBe(1)
    expect(canReviewLipsTurn({ currentUserId: 'speaker-b', playerIds: players, turn: 0, teamCount: 2 })).toBe(true)
    expect(canReviewLipsTurn({ currentUserId: 'guesser-a', playerIds: players, turn: 0, teamCount: 2 })).toBe(false)
    expect(canReviewLipsTurn({ currentUserId: 'host', playerIds: players, turn: 0, teamCount: 2 })).toBe(false)
    expect(lipsReviewerTeam(1, 2)).toBe(0)
    expect(canReviewLipsTurn({ currentUserId: 'host', playerIds: players, turn: 1, teamCount: 2 })).toBe(true)
  })
})
