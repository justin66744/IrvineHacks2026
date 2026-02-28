import { useState } from 'react'
import { subscribeAlerts } from '../api'

export default function Alerts() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [zip, setZip] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const res = await subscribeAlerts(email || undefined, phone || undefined, zip || undefined)
      setMessage(res.ok ? 'Signup received (stub — wire Twilio/Resend later).' : res.message)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1>Early access alerts</h1>
      <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
        Get notified when new listings hit. Stub — wire Twilio (SMS) or Resend (email) later.
      </p>
      <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 320 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
        />
        <input
          type="tel"
          placeholder="Phone (SMS)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
        />
        <input
          type="text"
          placeholder="ZIP code"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '0.625rem 1.25rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)' }}>
          {loading ? 'Submitting…' : 'Subscribe'}
        </button>
      </form>
      {message && <p style={{ marginTop: '1rem', color: 'var(--muted)' }}>{message}</p>}
    </>
  )
}
