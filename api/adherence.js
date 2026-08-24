const isoAdd = (iso, days) => {
  const date = new Date(iso + 'T12:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function plannedRoutineId(state, iso) {
  const override = state.dayPlan?.[iso]
  if (override === 'rest') return null
  if (override && state.routines?.some(routine => routine.id === override)) return override
  const weekday = new Date(iso + 'T12:00:00Z').getUTCDay()
  return state.week?.[weekday] || null
}

export function adherenceSummary(state = {}, today = new Date().toISOString().slice(0, 10), days = 28) {
  const completedDates = new Set((state.workouts || []).map(workout => workout.d))
  let scheduled = 0, completed = 0, missed = 0
  const recent = []
  for (let offset = -(days - 1); offset <= 0; offset += 1) {
    const date = isoAdd(today, offset)
    if (!plannedRoutineId(state, date)) continue
    const done = completedDates.has(date)
    scheduled += 1
    if (done) completed += 1
    else if (date < today) missed += 1
    recent.push({ date, done })
  }
  let streak = 0
  for (let index = recent.length - 1; index >= 0; index -= 1) {
    if (recent[index].date === today && !recent[index].done) continue
    if (!recent[index].done) break
    streak += 1
  }
  const last7 = recent.filter(item => item.date >= isoAdd(today, -6))
  return {
    scheduled, completed, missed, streak,
    percent: scheduled ? Math.round(completed / scheduled * 100) : 0,
    weekScheduled: last7.length,
    weekCompleted: last7.filter(item => item.done).length
  }
}

