export default function DashboardLoading() {
  const pulse = {
    background: 'linear-gradient(90deg, var(--surface) 25%, var(--surface2) 50%, var(--surface) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '8px',
  } as React.CSSProperties

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@keyframes shimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }`}</style>

      {/* Nav skeleton */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: '64px', background: 'rgba(12,10,8,0.88)', borderBottom: '1px solid rgba(232,184,75,0.12)', display: 'flex', alignItems: 'center', padding: '0 32px', justifyContent: 'space-between' }}>
        <div style={{ ...pulse, width: '120px', height: '20px' }} />
        <div style={{ ...pulse, width: '200px', height: '20px' }} />
        <div style={{ ...pulse, width: '120px', height: '36px', borderRadius: '999px' }} />
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '96px 32px 60px' }}>

        {/* Hero skeleton */}
        <div style={{ marginBottom: '56px' }}>
          <div style={{ ...pulse, width: '140px', height: '16px', marginBottom: '16px' }} />
          <div style={{ ...pulse, width: '420px', height: '52px', marginBottom: '12px', borderRadius: '12px' }} />
          <div style={{ ...pulse, width: '280px', height: '20px' }} />
        </div>

        {/* Section label */}
        <div style={{ ...pulse, width: '100px', height: '16px', marginBottom: '20px' }} />

        {/* Event cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {[1, 2].map(i => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ height: '3px', background: 'var(--surface2)' }} />
              <div style={{ padding: '20px 22px' }}>
                {/* Status + title */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ ...pulse, width: '60px', height: '28px', borderRadius: '6px' }} />
                  <div style={{ ...pulse, width: '80px', height: '28px', borderRadius: '6px' }} />
                </div>
                <div style={{ ...pulse, width: '80%', height: '28px', marginBottom: '8px', borderRadius: '8px' }} />
                <div style={{ ...pulse, width: '60%', height: '18px', marginBottom: '20px' }} />
                {/* Prize pool */}
                <div style={{ ...pulse, width: '100%', height: '60px', marginBottom: '18px', borderRadius: '12px' }} />
                {/* Team bars */}
                {[1, 2, 3].map(j => (
                  <div key={j} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <div style={{ ...pulse, width: '100px', height: '14px' }} />
                      <div style={{ ...pulse, width: '40px', height: '14px' }} />
                    </div>
                    <div style={{ ...pulse, width: '100%', height: '5px', borderRadius: '3px' }} />
                  </div>
                ))}
                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(232,184,75,0.06)' }}>
                  <div style={{ ...pulse, width: '180px', height: '40px', borderRadius: '10px' }} />
                  <div style={{ ...pulse, width: '110px', height: '36px', borderRadius: '8px' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
