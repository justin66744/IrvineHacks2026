export default function Assistance() {
  return (
    <>
      <h1>Assistance match</h1>
      <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>
        Down-payment and first-time buyer programs. Stub — add static JSON or HUD data later.
      </p>
      <div
        style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'var(--surface)',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius)',
          color: 'var(--muted)',
          textAlign: 'center',
        }}
      >
        Assistance programs not yet loaded. Add data/mock_programs.json or HUD dataset.
      </div>
    </>
  )
}
