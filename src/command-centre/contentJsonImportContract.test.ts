import { describe, expect, it } from 'vitest'
import migration from '../../supabase/migrations/20261029150000_content_json_round_trip.sql?raw'

describe('content JSON import migration',()=>{
  it('keeps import staff-only, bounded, atomic, and draft-first',()=>{
    expect(migration).toContain("decked_is_command_centre_staff('editor')")
    expect(migration).toContain("jsonb_array_length(p_document->'items') not between 1 and 5000")
    expect(migration).toContain("values(target_item_id,1,btrim(item->>'body'),target_normalized_body,item->'metadata','draft'")
    expect(migration).toContain('revoke all on function public.decked_command_centre_import_content_json')
    expect(migration).not.toContain('decked_command_centre_publish_content(game_id')
  })
})
