import { describe, expect, it } from 'vitest'
import { createCsvBlob, safeExportFilename } from './exportDownload'

describe('CSV download safety', () => {
  it('accepts only server-style filenames', () => {
    expect(safeExportFilename('decked-games-2026-10-01-2026-10-09.csv')).toBe('decked-games-2026-10-01-2026-10-09.csv')
    expect(safeExportFilename('../../danger.csv')).toBe('decked-export.csv')
  })

  it('creates a usable large CSV blob without changing the payload', async () => {
    const csv = ['id,value', ...Array.from({ length: 50_000 }, (_, index) => `${index},row-${index}`)].join('\n')
    const blob = createCsvBlob(csv)
    expect(blob.type).toBe('text/csv;charset=utf-8')
    expect(blob.size).toBe(new TextEncoder().encode(csv).byteLength)
    expect(await blob.text()).toBe(csv)
  })
})
