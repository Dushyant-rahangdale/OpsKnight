'use client';

export function DashboardSkeleton() {
  return (
    <main style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '2rem' }}>
      {/* Hero Section Skeleton */}
      <div style={{
        background: 'var(--gradient-primary)',
        color: 'white',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            height: '2rem', 
            width: '300px', 
            background: 'rgba(255,255,255,0.2)', 
            borderRadius: '4px',
            marginBottom: '0.5rem',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}></div>
          <div style={{ 
            height: '1.1rem', 
            width: '200px', 
            background: 'rgba(255,255,255,0.15)', 
            borderRadius: '4px',
            marginBottom: '1rem',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}></div>
          <div style={{ 
            height: '2rem', 
            width: '400px', 
            background: 'rgba(255,255,255,0.15)', 
            borderRadius: '4px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ 
              height: '2.5rem', 
              width: '100px', 
              background: 'rgba(255,255,255,0.2)', 
              borderRadius: '6px',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}></div>
            <div style={{ 
              height: '2.5rem', 
              width: '120px', 
              background: 'rgba(255,255,255,0.2)', 
              borderRadius: '6px',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', width: '100%', maxWidth: '600px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ 
                height: '80px', 
                background: 'rgba(255,255,255,0.15)', 
                borderRadius: '10px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}></div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 320px', gap: '1.5rem' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ 
              height: '1.5rem', 
              width: '150px', 
              background: '#f3f4f6', 
              borderRadius: '4px',
              marginBottom: '1rem',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ 
                  height: '60px', 
                  background: '#f9fafb', 
                  borderRadius: '8px',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}></div>
              ))}
            </div>
          </div>
          <div className="glass-panel" style={{ background: 'white', padding: '0', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ 
                height: '1.2rem', 
                width: '100px', 
                background: '#f3f4f6', 
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}></div>
            </div>
            <div style={{ padding: '1rem' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} style={{ 
                  height: '60px', 
                  background: '#f9fafb', 
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}></div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel" style={{ 
              background: 'white', 
              padding: '1.5rem', 
              borderRadius: '12px',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}>
              <div style={{ 
                height: '1.2rem', 
                width: '120px', 
                background: '#f3f4f6', 
                borderRadius: '4px',
                marginBottom: '1rem',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}></div>
              <div style={{ 
                height: '100px', 
                background: '#f9fafb', 
                borderRadius: '8px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}></div>
            </div>
          ))}
        </aside>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </main>
  );
}

