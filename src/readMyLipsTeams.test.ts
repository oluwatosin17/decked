import { describe, expect, it } from 'vitest'
import { lipsTurnRoles } from './readMyLipsTeams'

describe('Read My Lips team rotation', () => {
  it.each([1, 2, 3, 4, 10, 30])('supports %i selected round(s) with one turn per team in each round', roundsPerTeam => {
    const teamCount = 3
    const turns = Array.from({ length: teamCount * roundsPerTeam }, (_, turn) => lipsTurnRoles(turn, teamCount))

    expect(turns).toHaveLength(teamCount * roundsPerTeam)
    for (let team = 0; team < teamCount; team++) {
      expect(turns.filter(turn => turn.team === team)).toHaveLength(roundsPerTeam)
    }
  })

  it('hands a two-team game back and forth and alternates each team speaker by round', () => {
    const turns = Array.from({ length: 8 }, (_, turn) => lipsTurnRoles(turn, 2))

    expect(turns.map(turn => turn.team)).toEqual([0, 1, 0, 1, 0, 1, 0, 1])
    expect(turns.map(turn => turn.speakerIndex)).toEqual([0, 2, 1, 3, 0, 2, 1, 3])
    expect(turns.map(turn => turn.guesserIndex)).toEqual([1, 3, 0, 2, 1, 3, 0, 2])
  })

  it.each([2, 3, 4, 6])('gives each of %i teams four turns and both players two speaking turns', teamCount => {
    const turns = Array.from({ length: teamCount * 4 }, (_, turn) => lipsTurnRoles(turn, teamCount))
    for (let team = 0; team < teamCount; team++) {
      const teamTurns = turns.filter(turn => turn.team === team)
      expect(teamTurns).toHaveLength(4)
      expect(teamTurns.map(turn => turn.speakerIndex)).toEqual([team * 2, team * 2 + 1, team * 2, team * 2 + 1])
      expect(teamTurns.every(turn => Math.floor(turn.guesserIndex / 2) === team && turn.guesserIndex !== turn.speakerIndex)).toBe(true)
    }
  })
})
