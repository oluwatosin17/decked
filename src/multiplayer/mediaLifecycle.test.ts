import { describe, expect, it, vi } from 'vitest'
import { acceptCurrentMediaStream } from './mediaLifecycle'

describe('Read My Lips media lifecycle', () => {
  it('stops late camera or microphone tracks after a role change or unmount', () => {
    const stopVideo = vi.fn()
    const stopAudio = vi.fn()
    const stream = { getTracks: () => [{ stop: stopVideo }, { stop: stopAudio }] } as unknown as MediaStream
    expect(acceptCurrentMediaStream(stream, 1, 2)).toBe(false)
    expect(stopVideo).toHaveBeenCalledOnce()
    expect(stopAudio).toHaveBeenCalledOnce()
  })

  it('retains a current stream for the active role', () => {
    const stop = vi.fn()
    const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream
    expect(acceptCurrentMediaStream(stream, 3, 3)).toBe(true)
    expect(stop).not.toHaveBeenCalled()
  })
})
