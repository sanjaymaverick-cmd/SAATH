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
  const [login, setLogin] = useState(() => localStorage.getItem('saath_login') || '')
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
      localStorage.setItem('saath_login', login.trim().toLowerCase())
      setHydrating(true)
      setUser(user)
      if (!user.mustChangePassword) await pullState(true)
      useUI.getState().toast(`Welcome, ${user.name}`)
    } catch (error) {
      useUI.getState().toast(error.message || 'Sign-in failed')
    } finally { setHydrating(false); setBusy(false) }
  }

  const head = <header className="login-brand">
    <div className="login-orbit login-orbit-a" aria-hidden="true" />
    <div className="login-orbit login-orbit-b" aria-hidden="true" />
    <img className="login-mark" src="saath-mark.svg" alt="SAATH logo" width="112" height="112" />
    <div className="login-kicker">YOUR DAILY WELLNESS COMPANION</div>
    <h1>SAATH</h1>
    <p>Progress, together.</p>
  </header>

  if (DEMO) return <div className="narrow login-screen" style={wrap}>{head}
    <div className="muted" style={{ marginBottom: 30 }}>{t('Demo mode - everything stays in this browser.')}</div>
    <Button variant="primary" onClick={() => setGuest(true)}>{t('Start the demo')}</Button>
  </div>

  return <div className="narrow login-screen" style={wrap}>
    {head}
    <form className="login-card" onSubmit={signIn}>
      <div className="login-card-head">
        <div><span>Welcome back</span><strong>Let’s keep moving.</strong></div>
        <span className="login-status"><i /> Private access</span>
      </div>
      <label className="field-label" htmlFor="saath-login">Login ID</label>
      <input id="saath-login" className="input" autoCapitalize="none" autoCorrect="off" autoComplete="username"
        maxLength={32} value={login} onChange={event => setLogin(event.target.value)} placeholder="your.login" />
      <label className="field-label" htmlFor="saath-password">Password</label>
      <div className="password-field">
        <input id="saath-password" className="input" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
          maxLength={128} value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" />
        <button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'}
          onClick={() => setShowPassword(v => !v)}>{showPassword ? 'Hide' : 'Show'}</button>
      </div>
      <Button variant="primary" disabled={busy} onClick={signIn}>{busy ? 'Signing in…' : 'Sign in'}</Button>
    </form>
    {canGuest && <Button variant="ghost" className="dim" onClick={() => setGuest(true)} style={{ marginTop: 10 }}>{t('Continue without account')}</Button>}
    <div className="login-help">Access is provided by your SAATH administrator.<br />Need help signing in? Contact your family administrator.</div>
    <div className="dim small" style={{ marginTop: 20, textAlign: 'center', opacity: 0.6 }}>
      Made for "Suman Bagriya by Sanjay Bagriya"
    </div>
  </div>
}
