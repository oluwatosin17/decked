import { describe, expect, it } from 'vitest'
import { contentMetadataForSave } from './contentMetadata'

describe('Command Centre content metadata', () => {
  it('preserves managed metadata and updates Read My Lips prompt classification', () => {
    expect(contentMetadataForSave({ content_id: 'RML-0001', language: 'English' }, 'read-my-lips', 'Two words', 'Medium')).toEqual({
      content_id: 'RML-0001',
      language: 'English',
      content_format: 'Two words',
      difficulty: 'Medium',
    })
  })

  it('does not discard metadata for other games', () => {
    expect(contentMetadataForSave({ source: 'bundled' }, 'charades', '', '')).toEqual({ source: 'bundled' })
  })
})
