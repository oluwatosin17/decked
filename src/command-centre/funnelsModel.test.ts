import { describe,expect,it } from 'vitest'
import { applyFunnelDimensionFilters,completeFunnels, funnelsViewState,orderFunnelSteps, parseFunnelDimensionFilters,type FunnelsResponse } from './funnelsModel'

const expected=['landing','browse','selected','completed']
describe('ordered funnel rules',()=>{
  it('keeps the three canonical funnels visible with zero-valued steps',()=>{const funnels=completeFunnels([]);expect(funnels).toHaveLength(3);expect(funnels.every(funnel=>funnel.steps.length>=6)).toBe(true);expect(funnels.flatMap(funnel=>funnel.steps).every(step=>step.entrants===0)).toBe(true)})
  it('ignores out-of-order and repeated steps and takes the earliest qualifying occurrence',()=>{
    const steps=orderFunnelSteps(expected,[
      {name:'selected',occurredAt:'2026-10-01T09:00:00Z'},
      {name:'landing',occurredAt:'2026-10-01T10:00:00Z'},
      {name:'browse',occurredAt:'2026-10-01T10:05:00Z'},
      {name:'browse',occurredAt:'2026-10-01T10:06:00Z'},
      {name:'selected',occurredAt:'2026-10-01T10:07:00Z'},
      {name:'completed',occurredAt:'2026-10-01T10:40:00Z'},
    ],'2026-10-01T10:00:00Z')
    expect(steps).toEqual(['2026-10-01T10:00:00.000Z','2026-10-01T10:05:00.000Z','2026-10-01T10:07:00.000Z','2026-10-01T10:40:00.000Z'])
  })
  it('does not skip a missing step or admit events outside the 24-hour window',()=>{
    expect(orderFunnelSteps(expected,[{name:'landing',occurredAt:'2026-10-01T10:00:00Z'},{name:'selected',occurredAt:'2026-10-01T10:10:00Z'}],'2026-10-01T10:00:00Z')).toEqual(['2026-10-01T10:00:00.000Z',null,null,null])
    expect(orderFunnelSteps(['landing','completed'],[{name:'landing',occurredAt:'2026-10-01T10:00:00Z'},{name:'completed',occurredAt:'2026-10-02T10:00:01Z'}],'2026-10-01T10:00:00Z')).toEqual(['2026-10-01T10:00:00.000Z',null])
  })
  it('supports cross-day sessions and UTC timezone boundaries',()=>{
    expect(orderFunnelSteps(['landing','completed'],[{name:'landing',occurredAt:'2026-10-01T23:59:30-02:00'},{name:'completed',occurredAt:'2026-10-02T02:05:00Z'}],'2026-10-02T01:59:30Z')).toEqual(['2026-10-02T01:59:30.000Z','2026-10-02T02:05:00.000Z'])
  })
  it('round-trips acquisition source and app-version URL filters',()=>{
    const query=applyFunnelDimensionFilters(new URLSearchParams('env=preview'),{source:'invite',appVersion:'2026.10.9'})
    expect(query.toString()).toContain('source=invite')
    expect(parseFunnelDimensionFilters(`?${query}`).source).toBe('invite')
    expect(parseFunnelDimensionFilters(`?${query}`).appVersion).toBe('2026.10.9')
  })
  it('covers loading, error, empty, and populated fixtures',()=>{
    const empty={funnels:[{funnel_id:'discovery',name:'Discovery',steps:[{step_order:1,step_name:'Landing',entrants:0,conversion_from_previous:100,conversion_from_first:0,median_seconds_from_previous:null}]}]} as FunnelsResponse
    const populated={...empty,funnels:[{...empty.funnels[0],steps:[{...empty.funnels[0].steps[0],entrants:5}]}]} as FunnelsResponse
    expect(funnelsViewState('loading',null)).toBe('loading');expect(funnelsViewState('error',null)).toBe('error');expect(funnelsViewState('ready',empty)).toBe('empty');expect(funnelsViewState('ready',populated)).toBe('data')
  })
})
