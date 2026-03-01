import { useState } from 'react'
import { getListings, type ListingItem } from '../api'

export default function Listings() {
  const [listings, setListings] = useState<ListingItem[] | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [zip, setZip] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLoad() {
    setLoading(true)
    setError(null)
    try {
      const res = await getListings({ zip_code: zip.trim() || undefined, limit: 20 })
      setListings(res.listings ?? [])
      setSource(res.source ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
      setListings(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1>Market by area</h1>
      <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
        Real housing data from the U.S. Census (ACS 5-Year). Enter a ZIP to see one area, or leave blank for sample areas.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="ZIP (e.g. 92618)"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          style={{ padding: '0.5rem', width: '8rem' }}
        />
        <button
          onClick={handleLoad}
          disabled={loading}
          style={{
            padding: '0.625rem 1.25rem',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius)',
          }}
        >
          {loading ? 'Loading…' : 'Load data'}
        </button>
      </div>
      {source && <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.5rem' }}>{source}</p>}
      {error && <p style={{ color: 'var(--error)', marginTop: '1rem' }}>{error}</p>}
      {listings && (
        <ul style={{ marginTop: '1rem', paddingLeft: '1.25rem', listStyle: 'none', paddingLeft: 0 }}>
          {listings.length === 0 ? (
            <li style={{ color: 'var(--muted)' }}>No Census data for that ZIP. Try 92618, 92626, 92701, or leave blank.</li>
          ) : (
            listings.map((l) => (
              <li key={l.id} style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                <strong>{l.address}</strong>
                {l.price != null && ` · Median value $${l.price.toLocaleString()}`}
                {l.population != null && ` · Pop. ${l.population.toLocaleString()}`}
                {l.risk != null && ` · Risk ${l.risk.score}/10`}
              </li>
            ))
          )}
        </ul>
      )}
    </>
  )
}
