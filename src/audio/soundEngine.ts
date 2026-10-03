import type { SoundEvent } from './soundEvents'

type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }

class DeckedSoundEngine {
  private context: AudioContext | null = null
  private output: GainNode | null = null

  private getContext() {
    if (this.context) return this.context
    if (typeof window === 'undefined') return null
    const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
    if (!AudioContextClass) return null
    this.context = new AudioContextClass()
    this.output = this.context.createGain()
    // Keep enough headroom for layered sounds while remaining clearly audible
    // through a phone speaker. Individual voices are mixed below this bus.
    this.output.gain.value = 0.72
    this.output.connect(this.context.destination)
    return this.context
  }

  async unlock() {
    const context = this.getContext()
    if (context?.state === 'suspended') await context.resume()
  }

  play(event: SoundEvent) {
    const context = this.getContext()
    const output = this.output
    if (!context || !output) return

    // Call resume inside the original pointer gesture. Safari may keep the
    // context suspended briefly, but scheduled nodes begin when resume lands.
    if (context.state === 'suspended') void context.resume()

    const now = context.currentTime
    if (event === 'ui.tap') return this.tone(520, 0.04, 0.11, now, 'sine', 390)
    if (event === 'deck.shuffle') return this.shuffle(now)
    if (event === 'card.flip') return this.cardSnap(now)
    if (event === 'card.next') {
      this.cardSnap(now)
      this.tone(164, 0.15, 0.2, now + 0.035, 'sine', 112)
      return
    }
    if (event === 'turn.change') {
      this.tone(392, 0.1, 0.16, now, 'sine')
      this.tone(587, 0.15, 0.14, now + 0.085, 'sine')
      return
    }
    if (event === 'game.start') {
      this.cardSnap(now)
      ;[196, 294, 440].forEach((frequency, index) => this.tone(frequency, 0.2, 0.12, now + 0.055 * index, 'triangle'))
      return
    }
    ;[262, 392, 523].forEach((frequency, index) => this.tone(frequency, 0.28, 0.13, now + 0.09 * index, 'sine'))
  }

  private tone(frequency: number, duration: number, volume: number, start: number, type: OscillatorType, endFrequency?: number) {
    if (!this.context || !this.output) return
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start)
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    oscillator.connect(gain).connect(this.output)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.01)
  }

  private noise(duration: number, volume: number, start: number, highpass: number) {
    if (!this.context || !this.output) return
    const frameCount = Math.ceil(this.context.sampleRate * duration)
    const buffer = this.context.createBuffer(1, frameCount, this.context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frameCount; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frameCount)
    const source = this.context.createBufferSource()
    const filter = this.context.createBiquadFilter()
    const gain = this.context.createGain()
    source.buffer = buffer
    filter.type = 'highpass'
    filter.frequency.value = highpass
    gain.gain.setValueAtTime(volume, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    source.connect(filter).connect(gain).connect(this.output)
    source.start(start)
  }

  private cardSnap(start: number) {
    this.noise(0.09, 0.34, start, 1200)
    this.tone(132, 0.14, 0.24, start + 0.012, 'sine', 76)
    this.tone(920, 0.045, 0.13, start + 0.008, 'triangle', 460)
  }

  private shuffle(start: number) {
    for (let i = 0; i < 5; i += 1) this.noise(0.065, 0.2, start + i * 0.045, 1000 + i * 120)
    this.tone(146, 0.2, 0.16, start + 0.1, 'sine', 98)
  }
}

export const soundEngine = new DeckedSoundEngine()
