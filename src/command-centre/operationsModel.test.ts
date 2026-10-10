import { describe,expect,it } from 'vitest'
import { applyReliabilityDimensionFilters,operationsViewState,parseReliabilityDimensionFilters,safeGroupLabel } from './operationsModel'

describe('operational report states and redaction',()=>{
  it('covers loading, failures, empty results, and filtered data',()=>{
    expect(operationsViewState('loading',null)).toBe('loading')
    expect(operationsViewState('error',null)).toBe('error')
    expect(operationsViewState('ready',0)).toBe('empty')
    expect(operationsViewState('ready',4)).toBe('data')
  })
  it('allows stable aggregate labels and redacts free-form values',()=>{
    expect(safeGroupLabel('rpc_name:PGRST202')).toBe('rpc_name:PGRST202')
    expect(safeGroupLabel('token=secret value')).toBe('redacted')
    expect(safeGroupLabel('x'.repeat(161))).toBe('redacted')
  })
  it('redacts diagnostic values that resemble messages, secrets, or stack frames',()=>{
    expect(safeGroupLabel('Bearer abc.def.ghi')).toBe('redacted')
    expect(safeGroupLabel('Error: failed at render (App.tsx:42)')).toBe('redacted')
    expect(safeGroupLabel('decked_join_room:PGRST202')).toBe('decked_join_room:PGRST202')
  })
  it('round-trips reliability dimensions through URL parameters',()=>{
    const parsed=parseReliabilityDimensionFilters('?browser=Chrome&version=2026.10.9')
    expect(parsed).toEqual({browser:'Chrome',appVersion:'2026.10.9'})
    const params=applyReliabilityDimensionFilters(new URLSearchParams('env=production'),parsed)
    expect(params.get('browser')).toBe('Chrome')
    expect(params.get('version')).toBe('2026.10.9')
    expect(applyReliabilityDimensionFilters(params,{browser:'',appVersion:''}).toString()).toBe('env=production')
  })
})
