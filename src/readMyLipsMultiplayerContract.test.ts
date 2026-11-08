import { describe, expect, it } from 'vitest'
import migration from '../supabase/migrations/20261029140000_read_my_lips_verified_scoring.sql?raw'
import multiplayerUi from './ReadMyLipsMultiplayerGame.tsx?raw'
import multiplayerFlow from './multiplayer/PlayTogether.tsx?raw'

describe('Read My Lips multiplayer scoring contract', () => {
  it('keeps live decisions private and exposes an itemized review only after the turn', () => {
    expect(migration).toContain('turn_history jsonb not null')
    expect(migration).toContain("not in ('between','done')")
    expect(migration).toContain('decked_get_lips_turn_review')
    expect(migration).toContain("p_action in ('correct','skip')")
    expect(migration).toContain("p_action='undo'")
    expect(migration).toContain("p_action='toggle_review'")
  })

  it('requires the next team or host to review and confirm', () => {
    expect(migration).toContain('reviewer_team:=(team+1)%team_count')
    expect(migration).toContain('if not can_review then raise exception')
    expect(multiplayerUi).toContain('CONFIRM SCORE & NEXT TURN')
    expect(multiplayerUi).toContain('UNDO LAST')
    expect(multiplayerUi).toContain('CORRECT +1')
    expect(multiplayerUi).toContain('SKIP')
  })

  it('uses the configured player order when resolving the private speaker prompt', () => {
    expect(migration).toContain("jsonb_typeof(s->'lips_player_ids')='array'")
    expect(migration).toContain("actor:=(s->'lips_player_ids'")
  })

  it('keeps the invite lobby separate from host-only team setup', () => {
    expect(multiplayerFlow).toContain("setupGameId === 'read-my-lips'")
    expect(multiplayerFlow).toContain("setSetupGameId(room.game_id)")
    expect(multiplayerFlow).toContain('Waiting for the host to start the game…')
    expect(multiplayerFlow).not.toContain('<LipsLobbySetup players={players} busy={busy} onStart={onContinue}')
  })

  it('allows the complete managed prompt library to start a room', () => {
    expect(multiplayerFlow).toContain('shuffledMultiplayerLipsPhrases(Math.random, promptTypes)')
    expect(multiplayerFlow).toContain('error={error}')
  })
})
