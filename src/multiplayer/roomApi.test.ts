import { describe, expect, it } from 'vitest'
import { classifyJoinFailure, safeAnalyticsErrorCode, throwTrackedRpcError } from './roomApi'

describe('multiplayer failure analytics', () => {
  it('classifies invalid and expired joins without retaining sensitive input', () => {
    expect(classifyJoinFailure({ message: 'Room not found or expired. CODE ABC234' })).toBe('not_found_or_expired')
    expect(classifyJoinFailure({ message: 'This game has already started.' })).toBe('already_started')
    expect(classifyJoinFailure({ message: 'This room is full.' })).toBe('room_full')
    expect(classifyJoinFailure({ message: 'backend included unexpected private detail' })).toBe('rpc_rejected')
  })

  it('allows only bounded stable database error codes', () => {
    expect(safeAnalyticsErrorCode({ code: 'PGRST202' })).toBe('PGRST202')
    expect(safeAnalyticsErrorCode({ code: 'secret value with spaces' })).toBe('unknown')
    expect(safeAnalyticsErrorCode({})).toBe('unknown')
  })

  it('preserves the original RPC error without exposing its message through classification', () => {
    const error = Object.assign(new Error('private room detail must not be tracked'), { code: '42501' })
    expect(() => throwTrackedRpcError(error, 'decked_start_multi_game')).toThrow(error)
  })
})
