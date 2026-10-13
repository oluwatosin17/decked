import { describe, expect, it } from 'vitest'
import { ALL_MINI_MYSTERIES, evidenceForRound, MINI_MYSTERIES } from './miniMystery'
import migration from '../../supabase/migrations/20261012140000_add_mini_mystery_multiplayer.sql?raw'
import variantMigration from '../../supabase/migrations/20261013120000_expand_mini_mystery_variants.sql?raw'

describe('Mini Mystery multiplayer', () => {
  it('offers twenty-two cases across five useful categories', () => {
    expect(MINI_MYSTERIES).toHaveLength(22)
    expect(new Set(MINI_MYSTERIES.map(mystery => mystery.category)).size).toBe(5)
    expect(MINI_MYSTERIES.filter(mystery => mystery.category === 'Naija Mysteries')).toHaveLength(10)
  })

  it('has enough unique roles for the eight-player room limit', () => {
    for (const mystery of ALL_MINI_MYSTERIES) {
      expect(mystery.roles).toHaveLength(8)
      expect(mystery.roles.filter(role => role.guilty)).toHaveLength(1)
      expect(new Set(mystery.roles.map(role => role.name)).size).toBe(8)
    }
  })

  it('simulates every supported round count without hiding or repeating evidence', () => {
    for (const mystery of ALL_MINI_MYSTERIES) {
      expect(mystery.evidence).toHaveLength(4)
      for (const rounds of [2, 3, 4]) {
        const delivered = Array.from({ length: rounds }, (_, index) => evidenceForRound(mystery, index + 1, rounds)).flat()
        expect(delivered).toEqual(mystery.evidence)
      }
    }
  })

  it('gives every case a complete, logically attributable reveal', () => {
    for (const mystery of ALL_MINI_MYSTERIES) {
      const culprit = mystery.roles.find(role => role.guilty)!
      expect(mystery.briefing).toHaveLength(2)
      expect(mystery.briefing.every(paragraph => paragraph.length > 70)).toBe(true)
      expect(mystery.briefing[1]).toContain('?')
      expect(mystery.culpritProof).toHaveLength(3)
      expect(mystery.redHerringResolutions).toHaveLength(2)
      const proofText = mystery.culpritProof.join(' ').toLowerCase()
      expect(culprit.name.split(' ').some(part => proofText.includes(part.toLowerCase()))).toBe(true)
      expect(mystery.finalReveal.what.length).toBeGreaterThan(80)
      expect(mystery.finalReveal.how).toBe(culprit.guiltyPlan)
      expect(mystery.finalReveal.why).toBe(mystery.motive)
    }
  })

  it('gives every player distinct knowledge and three active round objectives', () => {
    const interaction = /ask|question|reveal|explain|identify|challenge|trace|connect|link|compare|correct|describe|establish|defend|distinguish|separate|emphasize|reconstruct|match|confirm|verify|determine|name|prove|report|admit|direct|test|recover|play|show|focus|protect|persuade|cast|blame|argue|suggest|lead|find|accuse|keep attention/i
    for (const mystery of ALL_MINI_MYSTERIES) for (const role of mystery.roles) {
      expect(role.publicStory).not.toBe(role.secret)
      expect(role.clue).not.toBe(role.secret)
      expect(role.objectives).toHaveLength(3)
      expect(role.objectives.filter(objective => interaction.test(objective)).length, `${mystery.id}/${role.name}`).toBeGreaterThanOrEqual(2)
    }
  })

  it('provides one authored remix with a different culprit for every case', () => {
    expect(ALL_MINI_MYSTERIES).toHaveLength(MINI_MYSTERIES.length * 2)
    for (const base of MINI_MYSTERIES) {
      const remix = ALL_MINI_MYSTERIES.find(mystery => mystery.id === `${base.id}--remix`)!
      expect(remix).toBeDefined()
      expect(remix.roles[0].guilty).toBe(true)
      expect(remix.roles[0].name).not.toBe(base.roles.find(role => role.guilty)?.name)
      expect(remix.finalReveal.how).toBe(remix.roles[0].guiltyPlan)
      expect(remix.finalReveal.why).toBe(remix.motive)
    }
  })

  it('keeps assignments private and exposes dedicated state transitions', () => {
    expect(migration).toContain('alter table public.decked_mini_mystery_assignments enable row level security')
    expect(migration).toContain('revoke all on public.decked_mini_mystery_assignments from public,anon,authenticated')
    expect(migration).toContain('decked_get_mini_mystery_state')
    expect(migration).toContain('decked_mini_mystery_ready')
    expect(migration).toContain('decked_mini_mystery_advance')
    expect(migration).toContain('decked_mini_mystery_vote')
    expect(variantMigration).toContain("base_case_id||'--remix'")
  })
})
