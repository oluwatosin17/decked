import { describe,expect,it } from 'vitest'
import { GAME_NAMES,GAME_REGISTRY,type GameId } from '../gameRegistry'
import { completeGameRows,filterSortGames,gamesCsv,gamesFilterCount,gamesViewState,type GameAnalyticsRow } from './gamesModel'

const row=(game_id:GameId,overrides:Partial<GameAnalyticsRow>={}):GameAnalyticsRow=>({game_id,game_views:0,selections:0,pass_and_play_starts:0,multiplayer_starts:0,unique_players:0,first_card_rate:0,completion_rate:0,median_cards_played:null,median_duration_seconds:null,replay_rate:0,trend_percent:null,...overrides})
const nameFor=(id:GameId)=>GAME_NAMES[id]

describe('games report transformations',()=>{
  it('uses the canonical 21-game registry',()=>{
    expect(GAME_REGISTRY).toHaveLength(21)
    expect(new Set(GAME_REGISTRY.map(game=>game.id)).size).toBe(21)
  })
  it('sorts numeric values and filters by canonical name or id',()=>{
    const rows=[row('charades',{completion_rate:40}),row('icebreaker',{completion_rate:80})]
    expect(filterSortGames(rows,'break','completion_rate','desc',nameFor).map(item=>item.game_id)).toEqual(['icebreaker'])
    expect(filterSortGames(rows,'','completion_rate','desc',nameFor).map(item=>item.game_id)).toEqual(['icebreaker','charades'])
  })
  it('exports exactly the currently filtered order and escapes spreadsheet formulas',()=>{
    const rows=[row('charades',{game_views:12}),row('icebreaker',{game_views:3})]
    const filtered=filterSortGames(rows,'char','game_views','desc',nameFor)
    const csv=gamesCsv(filtered,nameFor)
    expect(csv).toContain('"Charades","charades","12"')
    expect(csv).not.toContain('Icebreaker')
    expect(gamesCsv([row('charades')],()=> '=unsafe')).toContain("\"'=unsafe\"")
  })

  it('counts optional Games filters without treating the required date range as a badge',()=>{
    expect(gamesFilterCount('production','',7)).toBe(0)
    expect(gamesFilterCount('preview','pass_and_play',30)).toBe(3)
  })
  it('keeps all 21 canonical games visible when the query returns no activity',()=>{const completed=completeGameRows([]);expect(completed).toHaveLength(21);expect(completed.every(item=>item.game_views===0&&item.completion_rate===0)).toBe(true)})
  it('distinguishes loading, error, zero-data and realistic data fixtures',()=>{
    const empty=[row('charades'),row('we-just-met')]
    expect(gamesViewState('loading',null)).toBe('loading')
    expect(gamesViewState('error',null)).toBe('error')
    expect(gamesViewState('ready',empty)).toBe('empty')
    expect(gamesViewState('ready',[row('charades',{selections:1})])).toBe('data')
  })
})
