import { describe, expect, it } from 'vitest'
import { buildContentJsonDocument, contentJsonFilename, parseContentJson } from './contentJson'
import type { ContentItem } from './api'

const item:ContentItem={
  id:'5e9466da-08e5-57b1-a8ff-9719e3cec54f',
  game_id:'read-my-lips',
  item_kind:'prompt',
  lifecycle_status:'active',
  current_version:1,
  published_version:null,
  source:'bundled_import',
  updated_at:'2026-10-29T12:00:00.000Z',
  body:'Drama Llama',
  metadata:{content_format:'Two words',difficulty:'Easy'},
  editorial_status:'draft',
  categories:[{category_id:'funny-ridiculous',enabled:true,sort_order:0}],
}

describe('Command Centre content JSON',()=>{
  it('exports a stable, editable round-trip document',()=>{
    const document=buildContentJsonDocument('read-my-lips','funny-ridiculous',[item],new Date('2026-10-29T12:00:00.000Z'))
    expect(document).toEqual({
      format:'decked-content-v1',
      exported_at:'2026-10-29T12:00:00.000Z',
      game_id:'read-my-lips',
      category_id:'funny-ridiculous',
      items:[{
        id:item.id,
        item_kind:'prompt',
        body:'Drama Llama',
        metadata:{content_format:'Two words',difficulty:'Easy'},
        category_ids:['funny-ridiculous'],
        lifecycle_status:'active',
      }],
    })
    expect(parseContentJson(JSON.stringify(document),'read-my-lips')).toEqual(document)
  })

  it('accepts new cards without ids and defaults them to active',()=>{
    const document=parseContentJson(JSON.stringify({format:'decked-content-v1',game_id:'read-my-lips',items:[{item_kind:'prompt',body:'Fresh phrase',metadata:{content_format:'Short expression'},category_ids:['everyday-life']}]}),'read-my-lips')
    expect(document.items[0]).toMatchObject({body:'Fresh phrase',lifecycle_status:'active'})
    expect(document.items[0].id).toBeUndefined()
  })

  it('accepts JSON files downloaded by the previous Command Centre exporter',()=>{
    const document=parseContentJson(JSON.stringify({schema_version:1,game_id:'read-my-lips',category_id:'funny-ridiculous',exported_at:'2026-10-28T12:00:00Z',cards:[{id:item.id,kind:'prompt',body:'Drama Llama',metadata:{content_format:'Two words'},categories:['funny-ridiculous']}]}),'read-my-lips')
    expect(document).toMatchObject({format:'decked-content-v1',game_id:'read-my-lips',category_id:'funny-ridiculous'})
    expect(document.items[0]).toMatchObject({item_kind:'prompt',category_ids:['funny-ridiculous'],lifecycle_status:'active'})
  })

  it('blocks cross-game, duplicate-id, and malformed uploads before the RPC',()=>{
    const base={format:'decked-content-v1',game_id:'read-my-lips',items:[{id:item.id,item_kind:'prompt',body:'One',metadata:{},category_ids:['everyday-life']}]}
    expect(()=>parseContentJson(JSON.stringify(base),'charades')).toThrow(/belongs to read-my-lips/)
    expect(()=>parseContentJson(JSON.stringify({...base,items:[base.items[0],{...base.items[0],body:'Two'}]}),'read-my-lips')).toThrow(/repeats id/)
    expect(()=>parseContentJson('{oops','read-my-lips')).toThrow(/not valid JSON/)
  })

  it('creates a safe scoped filename',()=>{
    expect(contentJsonFilename('Read My Lips','Funny & Ridiculous',new Date('2026-10-29T12:00:00.000Z'))).toBe('decked-read-my-lips-funny-ridiculous-2026-10-29.json')
  })
})
