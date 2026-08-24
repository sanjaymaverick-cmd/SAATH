export const hasData = st => !!((st?.workouts || []).length || (st?.routines || []).length || (st?.bodyweight || []).length)

export const shouldAcceptServerState = (localState, serverState, dirty, force = false) =>
  !!serverState && (force || !hasData(localState) || (((serverState._ts || 0) >= (localState._ts || 0)) && !dirty))
