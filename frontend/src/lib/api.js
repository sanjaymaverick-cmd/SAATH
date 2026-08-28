export const IS_ANDROID = /Android/.test(navigator.userAgent)

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

export async function api(path, opts) {
  const r = await fetch(API_BASE + path, Object.assign({ headers: { 'Content-Type': 'application/json' }, credentials: API_BASE ? 'include' : 'same-origin' }, opts))
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
