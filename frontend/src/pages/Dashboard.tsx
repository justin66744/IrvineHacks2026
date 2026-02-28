import { useState } from 'react'
import { getRiskScore } from '../api'
import type { RiskResponse } from '../api'

export default function Dashboard() {
  const [risk, setRisk] = useState<RiskResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheck() {
    setLoading(true)
    setError(null)
    setRisk(null)
    try {
      const res = await getRiskScore()
      setRisk(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1>Corporate Acquisition Risk Score</h1>
      <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
        See institutional activity signals. Stub data for now — wire real entity/cash/concentration logic later.
      </p>
      <button
        onClick={handleCheck}
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
        {loading ? 'Loading…' : 'Get risk score (demo)'}
      </button>
      {error && <p style={{ color: 'var(--error)', marginTop: '1rem' }}>{error}</p>}
      {risk && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem 1.25rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          }}
        >
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            Risk {risk.score}/10 — {risk.label}
          </div>
          {risk.properties_owned != null && (
            <p style={{ marginTop: '0.5rem', color: 'var(--muted)' }}>
              {risk.properties_owned} properties owned · {risk.all_cash ? 'All-cash' : ''} · {risk.related_entities} related entities
            </p>
          )}
          <ul style={{ marginTop: '0.75rem', paddingLeft: '1.25rem' }}>
            {risk.signals.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <p style={{ marginTop: '0.75rem' }}>{risk.explanation}</p>
          <p style={{ marginTop: '1rem', fontWeight: 600 }}>Would you like to receive alerts for similar properties?</p>
        </div>
      )}
    </>
  )
}
