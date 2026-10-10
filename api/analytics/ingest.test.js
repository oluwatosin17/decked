import { describe, expect, it } from 'vitest'
import { acceptedEventIds } from './ingest.js'

describe('analytics geography enrichment',()=>{
  it('only enriches event IDs confirmed stored by ingestion',()=>{
    const ids=acceptedEventIds({accepted_event_ids:['accepted'],duplicate_event_ids:['duplicate'],rejected:[{event_id:'rejected'}]})
    expect([...ids]).toEqual(['accepted','duplicate'])
    expect(ids.has('rejected')).toBe(false)
  })
})
