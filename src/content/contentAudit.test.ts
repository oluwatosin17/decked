import { describe, expect, it } from 'vitest'
import { GAME_IDS } from '../gameRegistry'
import { CONTENT_AUDIT_GAMES } from './deckRegistry'

const normalize = (value:string)=>value.normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9']+/g,' ').trim()

describe('complete content inventory',()=>{
  it('covers every canonical game exactly once',()=>{
    expect(CONTENT_AUDIT_GAMES.map(game=>game.gameId).sort()).toEqual([...GAME_IDS].sort())
    expect(new Set(CONTENT_AUDIT_GAMES.map(game=>game.gameId)).size).toBe(GAME_IDS.length)
  })

  it('keeps player-authored content separate from bundled migration input',()=>{
    const authored=CONTENT_AUDIT_GAMES.find(game=>game.gameId==='two-truths-bluff')
    expect(authored?.contentModel).toBe('player-authored')
    expect(authored?.decks).toEqual([])
  })

  it('has deterministic, nonblank, normalized-unique category payloads',()=>{
    for(const game of CONTENT_AUDIT_GAMES){
      for(const deck of game.decks){
        const normalized=deck.prompts.map(prompt=>normalize(String(prompt)))
        expect(normalized.every(Boolean),`${game.gameId}/${deck.category} contains a blank`).toBe(true)
        expect(new Set(normalized).size,`${game.gameId}/${deck.category} contains normalized duplicates`).toBe(normalized.length)
      }
    }
  })

  it('preserves the audited migration totals',()=>{
    const memberships=CONTENT_AUDIT_GAMES.flatMap(game=>game.decks).reduce((sum,deck)=>sum+deck.prompts.length,0)
    const unique=new Set(CONTENT_AUDIT_GAMES.flatMap(game=>game.decks.flatMap(deck=>deck.prompts.map(prompt=>`${game.gameId}\u0000${normalize(String(prompt))}`))))
    expect(memberships).toBe(35_207)
    expect(unique.size).toBe(34_826)
  })
})
