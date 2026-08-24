import { describe, expect, it } from 'vitest'
import { shouldAcceptServerState } from './stateMerge.js'

const state = (ts, routines = []) => ({ _ts: ts, routines, workouts: [], bodyweight: [] })

describe('account hydration ordering', () => {
  it('forces the signed-in account state to replace newer cached state from another session', () => {
    expect(shouldAcceptServerState(state(200, [{ id: 'local' }]), state(100, [{ id: 'server' }]), true, true)).toBe(true)
  })

  it('does not overwrite unsynced local edits during an ordinary background pull', () => {
    expect(shouldAcceptServerState(state(200, [{ id: 'local' }]), state(300, [{ id: 'server' }]), true, false)).toBe(false)
  })
})
