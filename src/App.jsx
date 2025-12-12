export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ color: '#1f2937', marginBottom: '16px' }}>SafeGuard SOS</h1>
        <p style={{ color: '#6b7280', fontSize: '18px' }}>Personal Safety System</p>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '16px' }}>Loading...</p>
      </div>
    </div>
  )
}
