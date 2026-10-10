import { supabase } from '../multiplayer/supabase'
import { CONTENT_AUDIT_GAMES } from './deckRegistry'
import { CHOOSE_SIDE_PROMPTS, type ChooseSideCategory } from './chooseYourSide'
import { track } from '../analytics'

interface ManagedItem { id:string;kind:'prompt'|'challenge'|'scenario'|'choice';body:string;metadata:Record<string,unknown>;categories:string[] }
interface ManagedResponse { available:boolean;game_id:string;release_id?:string;checksum?:string;items?:ManagedItem[] }

export interface ManagedContentLoadResult { loadedGames:string[];fallbackGames:string[] }

const validItem = (value:unknown): value is ManagedItem => {
  if (!value || typeof value !== 'object') return false
  const item=value as Partial<ManagedItem>
  return typeof item.id==='string'&&typeof item.body==='string'&&item.body.trim().length>0&&Array.isArray(item.categories)&&item.categories.every(category=>typeof category==='string')&&Boolean(item.metadata)&&typeof item.metadata==='object'
}

/**
 * Opt-in, fail-safe runtime overlay. A category is replaced only when the RPC
 * returns a complete, valid non-empty category. Existing arrays remain intact
 * for unavailable, partial, malformed, or failed responses.
 */
export async function loadManagedContent():Promise<ManagedContentLoadResult>{
  const candidates=CONTENT_AUDIT_GAMES.filter(game=>game.contentModel==='bundled')
  const results=await Promise.allSettled(candidates.map(async game=>{
    const started=performance.now()
    const {data,error}=await supabase.rpc('decked_get_published_content',{p_game_id:game.gameId,p_category_ids:null})
    if(error){track('content_delivery_failed',{game_id:game.gameId,content_source:'bundled',fallback_reason:'rpc_failed',fetch_duration_ms:Math.round(performance.now()-started)});throw error}
    const response=data as ManagedResponse
    if(!response?.available||!Array.isArray(response.items)||!response.items.every(validItem)||!response.release_id){track('content_delivery_failed',{game_id:game.gameId,content_source:'bundled',fallback_reason:response?.available?'invalid_payload':'no_published_release',fetch_duration_ms:Math.round(performance.now()-started)});throw new Error('Managed content unavailable or malformed')}
    for(const deck of game.decks){
      const managed=response.items!.filter(item=>item.categories.includes(deck.category))
      if(managed.length===0)continue
      if(game.gameId==='choose-your-side'){
        const target=CHOOSE_SIDE_PROMPTS[deck.category as ChooseSideCategory] as Array<{optionA:string;optionB:string}>
        const choices=managed.map(item=>({optionA:String(item.metadata.option_a??''),optionB:String(item.metadata.option_b??'')})).filter(item=>item.optionA&&item.optionB)
        if(choices.length===managed.length)target.splice(0,target.length,...choices)
      }else{
        const target=deck.prompts as string[]
        target.splice(0,target.length,...managed.map(item=>item.body))
      }
    }
    track('content_delivery_completed',{game_id:game.gameId,content_source:'managed',release_id:response.release_id,item_count:response.items.length,fetch_duration_ms:Math.round(performance.now()-started)})
    return game.gameId
  }))
  return {loadedGames:results.flatMap(result=>result.status==='fulfilled'?[result.value]:[]),fallbackGames:results.flatMap((result,index)=>result.status==='rejected'?[candidates[index].gameId]:[])}
}
