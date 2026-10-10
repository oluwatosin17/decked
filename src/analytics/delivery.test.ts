import { describe, expect, it, vi } from 'vitest'
import { installAnalyticsDeliveryRecovery } from './delivery'

class Target {
  visibilityState?: string
  listeners = new Map<string, Set<() => void>>()
  addEventListener(type:string, listener:()=>void){const set=this.listeners.get(type)??new Set();set.add(listener);this.listeners.set(type,set)}
  removeEventListener(type:string, listener:()=>void){this.listeners.get(type)?.delete(listener)}
  emit(type:string){for(const listener of this.listeners.get(type)??[])listener()}
}

describe('mobile analytics delivery recovery',()=>{
  it('retries on reconnect, page resume, backgrounding, and page exit',()=>{
    const flush=vi.fn(),win=new Target(),doc=new Target()
    const uninstall=installAnalyticsDeliveryRecovery(flush,win,doc)
    win.emit('online');win.emit('pageshow');doc.visibilityState='hidden';doc.emit('visibilitychange');win.emit('pagehide')
    expect(flush).toHaveBeenCalledTimes(4)
    uninstall();win.emit('online')
    expect(flush).toHaveBeenCalledTimes(4)
  })
})
