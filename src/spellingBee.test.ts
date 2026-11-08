import { describe, expect, it } from 'vitest'
import { buildSpellingTurnDeck, isCorrectSpelling, spellingTurn, SPELLING_WORDS } from './content/spellingBee'
import { spellingAudioUrl } from './content/spellingAudio'
// @ts-expect-error The browser-only tsconfig excludes Node typings; Vitest runs this in Node.
import { existsSync } from 'node:fs'
import fairnessMigration from '../supabase/migrations/20261101130000_spelling_bee_fairness.sql?raw'

describe('Spelling Bee turns', () => {
  it('gives teams equal turns, rotates spellers, and never repeats a word', () => {
    const teams = [
      { players: [{ name: 'Ayo' }, { name: 'Bisi' }] },
      { players: [{ name: 'Kemi' }, { name: 'Dami' }] },
      { players: [{ name: 'Esther' }, { name: 'Tosin' }] },
    ]
    const deck = buildSpellingTurnDeck(teams.length, 4, () => 0.5)
    expect(deck).toHaveLength(12)
    expect(new Set(deck.map(item => item.word)).size).toBe(12)
    expect(deck.every(item => SPELLING_WORDS.includes(item))).toBe(true)
    expect(Array.from({ length: 12 }, (_, turn) => spellingTurn(teams, turn).teamIndex)).toEqual([0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2])
    expect(spellingTurn(teams, 0).speller).toBe('Ayo')
    expect(spellingTurn(teams, 3).speller).toBe('Bisi')
    expect(spellingTurn(teams, 6).speller).toBe('Ayo')
  })

  it('rejects a game longer than its reviewed word library', () => {
    expect(() => buildSpellingTurnDeck(4, 10)).toThrow()
  })

  it('uses only chosen levels and limits rounds to that selection', () => {
    const deck = buildSpellingTurnDeck(2, 6, () => 0.5, [2])
    expect(deck).toHaveLength(12)
    expect(deck.every(item => item.level === 2)).toBe(true)
    expect(() => buildSpellingTurnDeck(2, 7, () => 0.5, [2])).toThrow()
    expect(() => buildSpellingTurnDeck(2, 1, () => 0.5, [])).toThrow()
  })

  it('gives every team the same difficulty within a complete round', () => {
    const deck = buildSpellingTurnDeck(3, 9, () => 0.4)
    for (let offset = 0; offset < deck.length; offset += 3) {
      expect(new Set(deck.slice(offset, offset + 3).map(item => item.level)).size).toBe(1)
    }
    expect(new Set(deck.map(item => item.word)).size).toBe(deck.length)
  })

  it('accepts only the canonical spelling or explicit regional variants', () => {
    const entry = { word: 'colour', variants: ['color'] }
    expect(isCorrectSpelling(' COLOUR ', entry)).toBe(true)
    expect(isCorrectSpelling('color', entry)).toBe(true)
    expect(isCorrectSpelling('colur', entry)).toBe(false)
    expect(isCorrectSpelling('color ', { word: 'colour' })).toBe(false)
  })

  it('has a playable pronunciation asset for every bundled word', () => {
    for (const entry of SPELLING_WORDS) {
      const url = spellingAudioUrl(entry.word)
      expect(url, entry.word).toBeTruthy()
      expect(existsSync(new URL(`../public${url}`, import.meta.url)), entry.word).toBe(true)
    }
  })

  it('keeps the multiplayer answer server-side until judging, with one authoritative submission', () => {
    expect(fairnessMigration).toContain("if s->>'sp_phase' in ('result','done') then")
    expect(fairnessMigration).toContain("return jsonb_build_object('word',null")
    expect(fairnessMigration).toContain("s->>'sp_phase'<>'word' or auth.uid()<>speller")
    expect(fairnessMigration).toContain("for update")
    expect(fairnessMigration).toContain("revoke execute on function public.decked_start_spelling_game(uuid,jsonb,jsonb,jsonb,integer,integer) from authenticated")
  })
})
