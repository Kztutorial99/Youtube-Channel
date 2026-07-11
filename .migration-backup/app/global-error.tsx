'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body style={{ background: '#0a0a14', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px', fontFamily: 'sans-serif' }}>
        <p style={{ fontSize: '18px', fontWeight: 700 }}>Dashboard Error</p>
        <p style={{ color: '#8888bb', fontSize: '14px' }}>{error.message || 'Fatal error. Mohon refresh.'}</p>
        <button
          onClick={reset}
          style={{ padding: '8px 20px', background: 'rgba(255,0,0,0.2)', color: '#ff4444', border: '1px solid rgba(255,0,0,0.3)', borderRadius: '12px', cursor: 'pointer', fontSize: '14px' }}
        >
          Refresh
        </button>
      </body>
    </html>
  );
}
