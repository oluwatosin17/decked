import { describe, expect, it } from 'vitest'
import { GAME_IDS } from '../gameRegistry'
import { MULTIPLAYER_GAMES } from '../multiplayer/gameConfig'
import { PASS_AND_PLAY_GAMES } from './passAndPlayRegistry'
import catalogueMigration from '../../supabase/migrations/20261011120000_add_whot_multiplayer.sql?raw'
import aggregateMigration from '../../supabase/migrations/20261011224500_refresh_multiplayer_analytics_aggregates.sql?raw'
import exportMigration from '../../supabase/migrations/20261011231500_fix_command_centre_export_integrity.sql?raw'
import knowMeMigration from '../../supabase/migrations/20261013150000_add_do_you_know_me_multiplayer.sql?raw'
import thinkFastMigration from '../../supabase/migrations/20261014190000_add_think_fast_multiplayer.sql?raw'
import courtroomMigration from '../../supabase/migrations/20261015130000_add_not_me_your_honour.sql?raw'

const sorted = (values: readonly string[]) => [...values].sort()

describe('analytics game wiring', () => {
  it('keeps pass-and-play and multiplayer registries aligned with the catalogue', () => {
    expect(sorted(Object.keys(MULTIPLAYER_GAMES))).toEqual(sorted(GAME_IDS))
    expect(sorted(Object.values(PASS_AND_PLAY_GAMES).map(game => game.gameId))).toEqual(sorted(GAME_IDS))
  })

  it('keeps every game in the effective database analytics allowlists', () => {
    for (const gameId of GAME_IDS) {
      expect(catalogueMigration + knowMeMigration + thinkFastMigration + courtroomMigration, `room/session analytics is missing ${gameId}`).toContain(`'${gameId}'`)
      expect(aggregateMigration + knowMeMigration + thinkFastMigration + courtroomMigration, `daily aggregates are missing ${gameId}`).toContain(`'${gameId}'`)
    }
  })

  it('keeps Whot available to both Command Centre export paths', () => {
    expect(exportMigration).toContain('decked_export_command_centre_csv')
    expect(exportMigration).toContain('decked_export_command_centre_games_csv')
    expect(exportMigration).toContain("'''we-just-met'',''whot'''\n")
  })
})
