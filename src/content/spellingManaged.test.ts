import { afterEach, describe, expect, it } from 'vitest'
import candidate from '../../docs/qa/spelling-bee-candidate/command-centre-draft-import.json'
import { parseContentJson } from '../command-centre/contentJson'
import { applyManagedSpellingContent, spellingContentPreview, spellingWordFromManaged } from './spellingManaged'
import { getSpellingWords, resetManagedSpellingWords, SPELLING_WORDS } from './spellingBee'
import migration from '../../supabase/migrations/20261108100000_spelling_bee_managed_content.sql?raw'

afterEach(resetManagedSpellingWords)

describe('Spelling Bee managed content integration', () => {
  it('previews the prepared 934-row import without touching gameplay', () => {
    const document = parseContentJson(JSON.stringify(candidate), 'spelling-bee')
    const preview = spellingContentPreview(document.items, [])
    expect(preview).toMatchObject({ count: 934, bundledCount: 0, existingCount: 0, needsReview: 934, errors: [] })
    expect(preview.levels[1] + preview.levels[2] + preview.levels[3]).toBe(934)
    expect(getSpellingWords()).toBe(SPELLING_WORDS)
    const duplicate = spellingContentPreview(document.items.slice(0, 1), [{ id: 'other-id', body: document.items[0].body }])
    expect(duplicate.errors[0]).toMatch(/already exists/)
  })

  it('keeps unreviewed and audio-less words out of the playable deck', () => {
    const draft = candidate.items[0]
    expect(spellingWordFromManaged({ ...draft, kind: 'prompt', categories: draft.category_ids })).toBeNull()
    const approved = { ...draft, metadata: { ...draft.metadata, review_status: 'approved' } }
    expect(applyManagedSpellingContent([{ ...approved, kind: 'prompt', categories: approved.category_ids }])).toBe(false)
    expect(getSpellingWords()).toBe(SPELLING_WORDS)
  })

  it('maps approved, audio-backed published rows and falls back for missing levels', () => {
    const items = SPELLING_WORDS.slice(0, 2).map(word => ({
      kind: 'prompt', body: word.word, categories: [`level-${word.level}`],
      metadata: { definition: word.definition, sentence: word.sentence, level: word.level, variants: [], review_status: 'approved' },
    }))
    expect(applyManagedSpellingContent(items)).toBe(true)
    expect(getSpellingWords().filter(word => word.level === 1)).toHaveLength(2)
    expect(getSpellingWords().filter(word => word.level === 2)).toHaveLength(12)
  })

  it('requires reviewed audio-backed releases and server-owned equal-difficulty rounds', () => {
    expect(migration).toContain("v.metadata->>'review_status' is distinct from 'approved'")
    expect(migration).toContain('decked_spelling_catalog c where lower(c.word)=lower(v.body)')
    expect(migration).toContain('if available>=teams then selected_level:=level_order[level_index]')
    expect(migration).toContain('perform public.decked_start_spelling_game(p_room_id,chosen')
    expect(migration).toContain("if s->>'sp_phase'='word' and auth.uid()=speller then")
    expect(migration).toContain("return jsonb_build_object('word',null,'audio_id',null,'definition',null,'hint_sentence',null)")
  })
})
