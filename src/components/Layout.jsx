const S = {
  wrap: { minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column' },
  header: { background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0 24px', position: 'sticky', top: 0, zIndex: 50 },
  inner: { display: 'flex', alignItems: 'center', gap: 32, maxWidth: 1600, margin: '0 auto', width: '100%' },
  brand: { color: '#38bdf8', fontWeight: 700, fontSize: 20, letterSpacing: '-0.5px', whiteSpace: 'nowrap', padding: '16px 0' },
  tabs: { display: 'flex', gap: 4, overflowX: 'auto' },
  tab: (active) => ({
    padding: '18px 16px',
    fontSize: 14,
    fontWeight: 500,
    color: active ? '#38bdf8' : '#64748b',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #38bdf8' : '2px solid transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'color 0.15s',
    marginBottom: -1,
  }),
  content: { flex: 1, padding: '24px', maxWidth: 1600, margin: '0 auto', width: '100%' },
};

export default function Layout({ tab, setTab, tabs, children }) {
  return (
    <div style={S.wrap}>
      <header style={S.header}>
        <div style={S.inner}>
          <div style={S.brand}>Реклама 2026</div>
          <nav style={S.tabs}>
            {tabs.map((t, i) => (
              <button key={i} style={S.tab(tab === i)} onClick={() => setTab(i)}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main style={S.content}>{children}</main>
    </div>
  );
}
