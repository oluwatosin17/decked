import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))

vi.mock('./supabase', () => ({ supabase: { rpc } }))
vi.mock('../analytics', () => ({ track: vi.fn() }))

import { setSessionValues } from './roomApi'

describe('batched multiplayer session updates', () => {
  beforeEach(() => rpc.mockReset())

  it('sends related gameplay changes in one RPC payload', async () => {
    rpc.mockResolvedValue({ error: null })

    await setSessionValues('room-1', { cardIndex: 2, step: 'vote', voterIndex: 0 })

    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('decked_set_session_values', {
      p_room_id: 'room-1',
      p_values: { cardIndex: 2, step: 'vote', voterIndex: 0 },
    })
  })

  it('does not make an empty synchronization request', async () => {
    await setSessionValues('room-1', {})
    expect(rpc).not.toHaveBeenCalled()
  })

  it('falls back to ordered single-value updates when production lacks the batch RPC', async () => {
    rpc
      .mockResolvedValueOnce({ error: { code: 'PGRST202', message: 'Could not find the function decked_set_session_values' } })
      .mockResolvedValue({ error: null })

    await setSessionValues('room-1', { cardIndex: 2, step: 'vote', voterIndex: 0 })

    expect(rpc).toHaveBeenNthCalledWith(1, 'decked_set_session_values', {
      p_room_id: 'room-1',
      p_values: { cardIndex: 2, step: 'vote', voterIndex: 0 },
    })
    expect(rpc).toHaveBeenNthCalledWith(2, 'decked_set_session_value', { p_room_id: 'room-1', p_key: 'cardIndex', p_value: 2 })
    expect(rpc).toHaveBeenNthCalledWith(3, 'decked_set_session_value', { p_room_id: 'room-1', p_key: 'step', p_value: 'vote' })
    expect(rpc).toHaveBeenNthCalledWith(4, 'decked_set_session_value', { p_room_id: 'room-1', p_key: 'voterIndex', p_value: 0 })
  })

  it('does not mask real synchronization failures', async () => {
    const error = { code: '42501', message: 'You are not in this room.' }
    rpc.mockResolvedValue({ error })

    await expect(setSessionValues('room-1', { step: 'vote' })).rejects.toBe(error)
    expect(rpc).toHaveBeenCalledTimes(1)
  })
})
