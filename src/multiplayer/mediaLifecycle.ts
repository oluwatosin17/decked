/** Reject media granted after a turn, role, or component lifetime changed. */
export function acceptCurrentMediaStream(stream: MediaStream, requestGeneration: number, currentGeneration: number): boolean {
  if (requestGeneration === currentGeneration) return true
  stream.getTracks().forEach(track => track.stop())
  return false
}
