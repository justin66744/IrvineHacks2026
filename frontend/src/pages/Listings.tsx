import { useState } from 'react'
import { getListings } from '../api'

export default function Listings() {
  const [listings, setListings] = useState<Array<{ id: string; address: string; price?: number }> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLoad() {
    setLoading(true)
    setError(null)
    try {
      const res = await getListings()
      setListings(res.listings ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1>Listings</h1>
      <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
        Mock listings for demo. Replace with RentCast or real feed later.
      </p>
      <button
        onClick={handleLoad}
        disabled={loading}
        style={{
          marginTop: '1rem',
          padding: '0.625rem 1.25rem',
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius)',
        }}
      >
        {loading ? 'Loading…' : 'Load listings'}
      </button>
      {error && <p style={{ color: 'var(--error)', marginTop: '1rem' }}>{error}</p>}
      {listings && (
        <ul style={{ marginTop: '1rem', paddingLeft: '1.25rem' }}>
          {listings.map((l) => (
            <li key={l.id}>{l.address} {l.price != null && `— $${l.price.toLocaleString()}`}</li>
          ))}
        </ul>
      )}
    </>
  )
}
