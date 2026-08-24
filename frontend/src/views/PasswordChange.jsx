import { useState } from 'react'
import { changePassword } from '../lib/api.js'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { Button } from '../components/ui.jsx'

export default function PasswordChange() {
  const user = useStore(s => s.user)
  const { setUser, pullState, signOut } = useStore()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  const save = async event => {
    event?.preventDefault()
    if (password.length < 10) return useUI.getState().toast('Use at least 10 characters')
    if (password !== confirm) return useUI.getState().toast('Passwords do not match')
    setBusy(true)
    try {
      const updated = await changePassword(password)
      setUser(updated)
      await pullState()
      useUI.getState().toast('Password changed')
    } catch (error) { useUI.getState().toast(error.message || 'Could not change password') }
    finally { setBusy(false) }
  }

  return <div className="narrow" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '78vh' }}>
    <img src="icon-180.png" alt="" width="82" height="82" style={{ alignSelf: 'center', borderRadius: 20 }} />
    <h1 style={{ textAlign: 'center', margin: '16px 0 6px' }}>Welcome, {user?.name}</h1>
    <p className="muted" style={{ textAlign: 'center', marginBottom: 26 }}>Choose your private password to continue.</p>
    <form onSubmit={save} style={{ display: 'grid', gap: 12 }}>
      <input className="input" type="password" autoComplete="new-password" value={password}
        onChange={event => setPassword(event.target.value)} placeholder="New password" maxLength={128} />
      <input className="input" type="password" autoComplete="new-password" value={confirm}
        onChange={event => setConfirm(event.target.value)} placeholder="Confirm new password" maxLength={128} />
      <Button variant="primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Set password'}</Button>
      <Button variant="ghost" onClick={() => signOut()}>Sign out</Button>
    </form>
  </div>
}
