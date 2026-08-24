import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { passwordLogin } from '../lib/api.js'
import { t } from '../lib/i18n.js'
import { DEMO } from '../lib/demo.js'
import { guestAllowed } from '../lib/guest.js'
import { Button } from '../components/ui.jsx'

export default function Login() {
  const { setUser, pullState, setGuest, setHydrating } = useStore()
  const config = useStore(s => s.config)
  const [login, setLogin] = useState(() => localStorage.getItem('fitfam_login') || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const canGuest = guestAllowed(config)
  const wrap = { display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '78vh', textAlign: 'center' }

  const signIn = async event => {
    event?.preventDefault()
    if (!login.trim() || !password) return useUI.getState().toast('Enter your login ID and password')
    setBusy(true)
    try {
      const user = await passwordLogin(login.trim(), password)
      localStorage.setItem('fitfam_login', login.trim().toLowerCase())
      setHydrating(true)
      setUser(user)
      if (!user.mustChangePassword) await pullState(true)
      useUI.getState().toast(`Welcome, ${user.name}`)
    } catch (error) {
      useUI.getState().toast(error.message || 'Sign-in failed')
    } finally { setHydrating(false); setBusy(false) }
  }

  const head = <>
    <img src="icon-180.png" alt="" width="104" height="104" style={{ alignSelf: 'center', borderRadius: 24 }} />
    <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.028em', margin: '14px 0 4px' }}>Bagriya FitFam</h1>
  </>

  if (DEMO) return <div className="narrow" style={wrap}>{head}
    <div className="muted" style={{ marginBottom: 30 }}>{t('Live demo — everything stays in this browser.')}</div>
    <Button variant="primary" onClick={() => setGuest(true)}>{t('Start the demo')}</Button>
  </div>

  return <div className="narrow login-screen" style={wrap}>
    {head}
    <div className="muted" style={{ marginBottom: 28 }}>Stronger together.</div>
    <form onSubmit={signIn} style={{ display: 'grid', gap: 12, textAlign: 'left' }}>
      <label className="small muted" htmlFor="fitfam-login">Login ID</label>
      <input id="fitfam-login" className="input" autoCapitalize="none" autoCorrect="off" autoComplete="username"
        maxLength={32} value={login} onChange={event => setLogin(event.target.value)} placeholder="family.member" />
      <label className="small muted" htmlFor="fitfam-password">Password</label>
      <div className="password-field">
        <input id="fitfam-password" className="input" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
          maxLength={128} value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" />
        <button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'}
          onClick={() => setShowPassword(v => !v)}>{showPassword ? 'Hide' : 'Show'}</button>
      </div>
      <Button variant="primary" disabled={busy} onClick={signIn}>{busy ? 'Signing in…' : 'Sign in'}</Button>
    </form>
    {canGuest && <Button variant="ghost" className="dim" onClick={() => setGuest(true)} style={{ marginTop: 10 }}>{t('Continue without account')}</Button>}
    <div className="muted small login-help" style={{ marginTop: 24 }}>Accounts are created by the family administrator. Ask the administrator to reset a forgotten password.</div>
  </div>
}
