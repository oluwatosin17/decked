export function lipsTurnRoles(turn: number, teamCount: number) {
  const team = turn % teamCount
  const speakerSlot = Math.floor(turn / teamCount) % 2
  return { team, speakerIndex: team * 2 + speakerSlot, guesserIndex: team * 2 + 1 - speakerSlot }
}
