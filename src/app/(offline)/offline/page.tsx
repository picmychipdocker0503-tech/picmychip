export default function OfflinePage() {
  return (
    <div
      style={{
        alignItems: 'center',
        background: '#fafafa',
        color: '#171717',
        display: 'flex',
        flexDirection: 'column',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        gap: '16px',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          background: '#005d1e',
          borderRadius: '9999px',
          color: '#fff',
          display: 'flex',
          fontSize: '28px',
          fontWeight: 700,
          height: '56px',
          justifyContent: 'center',
          width: '56px',
        }}
      >
        !
      </div>

      <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>You&rsquo;re offline</h1>

      <p style={{ color: '#525252', fontSize: '15px', lineHeight: 1.6, margin: 0, maxWidth: '340px' }}>
        Picmychip needs an internet connection for this page. Check your connection and try
        again.
      </p>

      <a
        href="/"
        style={{
          background: '#005d1e',
          borderRadius: '9999px',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 600,
          marginTop: '8px',
          padding: '10px 24px',
          textDecoration: 'none',
        }}
      >
        Try again
      </a>
    </div>
  )
}
