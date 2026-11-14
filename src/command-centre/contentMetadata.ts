export function contentMetadataForSave(existing: Record<string, unknown>, gameId: string, contentFormat: string, difficulty: string) {
  if (gameId !== 'read-my-lips') return { ...existing }
  return {
    ...existing,
    content_format: contentFormat,
    difficulty,
  }
}
