export function safeExportFilename(filename: string) {
  return /^decked-[a-z-]+-\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}\.csv$/.test(filename) ? filename : 'decked-export.csv'
}

export function createCsvBlob(csv: string) {
  return new Blob([csv], { type: 'text/csv;charset=utf-8' })
}

export function downloadExport(filename: string, csv: string) {
  const url = URL.createObjectURL(createCsvBlob(csv))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = safeExportFilename(filename)
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
