import {describe,expect,it} from 'vitest'
import {acquisitionContext} from './context'

describe('acquisitionContext',()=>{
  it('keeps campaign labels and only the external referrer hostname',()=>{
    expect(acquisitionContext('?utm_source=Instagram&utm_campaign=Launch%20Week','https://example.com/private/path?token=no','usedecked.com')).toEqual({
      utm_source:'instagram',utm_medium:undefined,utm_campaign:'launch_week',utm_content:undefined,utm_term:undefined,referrer_domain:'example.com',
    })
  })
  it('does not report a same-site referrer',()=>{expect(acquisitionContext('','https://usedecked.com/games','usedecked.com').referrer_domain).toBeUndefined()})
})
