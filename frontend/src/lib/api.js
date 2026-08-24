export const IS_ANDROID = /Android/.test(navigator.userAgent)

export async function api(path, opts) {
  const r = await fetch(path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts))
  const data = await r.json().catch(() => ({}))
  if (!r.ok) { const e = new Error(data.error || ('HTTP ' + r.status)); e.status = r.status; throw e }
  return data
}

export async function passwordLogin(login, password) {
  const result = await api('/api/login', {
    method: 'POST', body: JSON.stringify({ login, password })
  })
  return result.user
}

export async function changePassword(newPassword, currentPassword = '') {
  const result = await api('/api/password/change', {
    method: 'POST', body: JSON.stringify({ currentPassword, newPassword })
  })
  return result.user
}
