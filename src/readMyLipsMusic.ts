// A small original instrumental loop generated in the browser. No media file,
// external stream, or paid music service is needed.
export function startHeadphoneMusic(): () => void {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) throw new Error('Music playback is unavailable in this browser.')
  const context = new AudioContextClass()
  const master = context.createGain()
  master.gain.value = 0.26
  master.connect(context.destination)

  const chords = [
    [261.63, 329.63, 392.00], // C
    [220.00, 261.63, 329.63], // Am
    [174.61, 220.00, 261.63], // F
    [196.00, 246.94, 293.66], // G
  ]
  const melody = [392, 440, 523.25, 440, 329.63, 392, 440, 392, 349.23, 392, 440, 392, 293.66, 349.23, 392, 329.63]
  const note = (frequency: number, at: number, duration: number, volume: number, type: OscillatorType) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = type
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(volume, at + 0.025)
    gain.gain.setValueAtTime(volume, at + Math.max(0.04, duration - 0.12))
    gain.gain.linearRampToValueAtTime(0, at + duration)
    oscillator.connect(gain)
    gain.connect(master)
    oscillator.start(at)
    oscillator.stop(at + duration + 0.02)
  }

  let beat = 0
  let nextTime = context.currentTime + 0.05
  const schedule = () => {
    while (nextTime < context.currentTime + 1.5) {
      const position = beat % 16
      const chord = chords[Math.floor(position / 4)]
      if (position % 4 === 0) {
        note(chord[0] / 2, nextTime, 1.7, 0.14, 'sine')
        for (const frequency of chord) note(frequency, nextTime, 1.6, 0.045, 'triangle')
      }
      note(melody[position], nextTime, 0.34, 0.07, 'triangle')
      beat += 1
      nextTime += 0.5
    }
  }
  void context.resume()
  schedule()
  const timer = window.setInterval(schedule, 500)
  return () => { window.clearInterval(timer); void context.close() }
}
