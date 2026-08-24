import test from 'node:test'
import assert from 'node:assert/strict'
import { adherenceSummary, plannedRoutineId } from './adherence.js'

const state = {
  routines: [{ id: 'strength' }],
  week: { 1: 'strength', 3: 'strength', 5: 'strength' },
  dayPlan: { '2026-08-21': 'rest', '2026-08-22': 'strength' },
  workouts: [{ d: '2026-08-17' }, { d: '2026-08-19' }, { d: '2026-08-22' }]
}

test('planned routine respects rest and reschedule overrides', () => {
  assert.equal(plannedRoutineId(state, '2026-08-21'), null)
  assert.equal(plannedRoutineId(state, '2026-08-22'), 'strength')
})

test('adherence reports completed, missed, percent and streak', () => {
  const result = adherenceSummary(state, '2026-08-23', 7)
  assert.deepEqual(result, {
    scheduled: 3, completed: 3, missed: 0, streak: 3,
    percent: 100, weekScheduled: 3, weekCompleted: 3
  })
})

