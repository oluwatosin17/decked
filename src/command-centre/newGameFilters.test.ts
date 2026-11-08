import { describe, expect, it } from 'vitest'
import filterMigration from '../../supabase/migrations/20261101150000_command_centre_new_game_filters.sql?raw'
import { GAME_IDS } from '../gameRegistry'

describe('Command Centre canonical game filters', () => {
  it('accepts every current game, including Read My Lips and Spelling Bee', () => {
    const accepted = filterMigration.match(/p_game_id = any\(array\[(.*?)\]\)/s)?.[1]
    expect(accepted).toBeTruthy()
    const ids = [...(accepted?.matchAll(/'([^']+)'/g) ?? [])].map(match => match[1])
    expect(ids).toEqual(GAME_IDS)
  })
})
