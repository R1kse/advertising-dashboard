import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AD_TYPES, MANAGERS, getComparisonData, fmt, fmtRomi } from '../utils/dataHelpers';

const TOGGLE = (active) => ({
  padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: active ? '#38bdf8' : '#1e293b', color: active ? '#0f172a' : '#94a3b8', transition: 'all 0.15s',
});
const CARD = { background: '#1e293b', borderRadius: 12, padding: 24, marginBottom: 20 };
const TD = { padding: '10px 14px', borderBottom: '1px solid #0f172a', fontSize: 13 };
const TH = { padding: '10px 14px', fontSize: 12, color: '#64748b', fontWeight: 600, textAlign: 'left', borderBottom: '2px solid #0f172a' };

function DeltaCell({ value }) {
  if (value == null || isNaN(value)) return <td style={TD}>—</td>;
  const color = value > 0 ? '#4ade80' : value < 0 ? '#f87171' : '#94a3b8';
  return (
    <td style={{ ...TD, color, fontWeight: 600 }}>
      {value > 0 ? '+' : ''}{value.toFixed(1)}%
    </td>
  );
}

function ManagersTable({ byManager }) {
  const metrics = [
    { key: 'spend', label: 'Затраты', fmt: fmt },
    { key: 'revenue', label: 'Выручка', fmt: fmt },
    { key: 'profit', label: 'Прибыль', fmt: fmt },
    { key: 'romi', label: 'ROMI', fmt: fmtRomi, accent: true },
  ];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#0f172a' }}>
            <th style={TH}>Менеджер</th>
            {metrics.map(m => (
              <React.Fragment key={m.key}>
                <th style={{ ...TH, color: '#94a3b8' }}>Март {m.label}</th>
                <th style={{ ...TH, color: m.accent ? '#38bdf8' : '#e2e8f0' }}>Апрель {m.label}</th>
                <th style={TH}>Δ%</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {MANAGERS.map(m => {
            const d = byManager[m];
            if (!d) return null;
            return (
              <tr key={m} style={{ '&:hover': { background: '#0f172a' } }}>
                <td style={{ ...TD, fontWeight: 700, color: '#e2e8f0' }}>{m}</td>
                {metrics.map(metric => (
                  <React.Fragment key={metric.key}>
                    <td style={{ ...TD, color: '#64748b' }}>{metric.fmt(d.march[metric.key])}</td>
                    <td style={{ ...TD, color: metric.accent ? '#38bdf8' : '#e2e8f0' }}>{metric.fmt(d.april[metric.key])}</td>
                    <DeltaCell value={d[metric.key + 'Delta']} />
                  </React.Fragment>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CategoriesTable({ byCategory }) {
  const sorted = Object.entries(byCategory)
    .sort((a, b) => (b[1].april?.spend || 0) - (a[1].april?.spend || 0))
    .slice(0, 15);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#0f172a' }}>
            <th style={TH}>Категория</th>
            <th style={{ ...TH, color: '#94a3b8' }}>Март Затраты</th>
            <th style={{ ...TH, color: '#e2e8f0' }}>Апрель Затраты</th>
            <th style={TH}>Δ% Затр.</th>
            <th style={{ ...TH, color: '#94a3b8' }}>Март Прибыль</th>
            <th style={{ ...TH, color: '#e2e8f0' }}>Апрель Прибыль</th>
            <th style={TH}>Δ% Приб.</th>
            <th style={{ ...TH, color: '#94a3b8' }}>ROMI март</th>
            <th style={{ ...TH, color: '#38bdf8' }}>ROMI апр.</th>
            <th style={TH}>Δ% ROMI</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(([cat, d]) => (
            <tr key={cat}>
              <td style={{ ...TD, fontWeight: 500 }}>{cat}</td>
              <td style={{ ...TD, color: '#64748b' }}>{fmt(d.march.spend)}</td>
              <td style={TD}>{fmt(d.april.spend)}</td>
              <DeltaCell value={d.spendDelta} />
              <td style={{ ...TD, color: '#64748b' }}>{fmt(d.march.profit)}</td>
              <td style={TD}>{fmt(d.april.profit)}</td>
              <DeltaCell value={d.profitDelta} />
              <td style={{ ...TD, color: '#64748b' }}>{fmtRomi(d.march.romi)}</td>
              <td style={{ ...TD, color: '#38bdf8' }}>{fmtRomi(d.april.romi)}</td>
              <DeltaCell value={d.romiDelta} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ComparisonBarChart({ byManager }) {
  const chartData = MANAGERS.map(m => {
    const d = byManager[m];
    if (!d) return { manager: m, 'Март прибыль': 0, 'Апрель прибыль': 0 };
    return {
      manager: m,
      'Март': Math.round(d.march.profit),
      'Апрель': Math.round(d.april.profit),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
        <XAxis dataKey="manager" tick={{ fill: '#94a3b8', fontSize: 13 }} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          formatter={(v, name) => [fmt(v), name]}
        />
        <Legend />
        <Bar dataKey="Март" fill="#475569" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Апрель" fill="#4ade80" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function CategoryBarChart({ byCategory }) {
  const sorted = Object.entries(byCategory)
    .sort((a, b) => (b[1].april?.profit || 0) - (a[1].april?.profit || 0))
    .slice(0, 8);

  const chartData = sorted.map(([cat, d]) => ({
    category: cat.length > 18 ? cat.slice(0, 18) + '…' : cat,
    'Март': Math.round(d.march.profit),
    'Апрель': Math.round(d.april.profit),
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v} />
        <YAxis type="category" dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={140} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          formatter={(v, name) => [fmt(v), name]}
        />
        <Legend />
        <Bar dataKey="Март" fill="#475569" radius={[0, 3, 3, 0]} />
        <Bar dataKey="Апрель" fill="#4ade80" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function Tab5MarchComparison({ data }) {
  const [adType, setAdType] = useState('all');
  const [view, setView] = useState('managers');

  const { byManager, byCategory } = useMemo(() => getComparisonData(data, adType), [data, adType]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <h2 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>Март vs Апрель</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {AD_TYPES.map(t => (
            <button key={t.value} style={TOGGLE(adType === t.value)} onClick={() => setAdType(t.value)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button style={TOGGLE(view === 'managers')} onClick={() => setView('managers')}>Менеджеры</button>
        <button style={TOGGLE(view === 'categories')} onClick={() => setView('categories')}>Категории</button>
      </div>

      {view === 'managers' && (
        <>
          <div style={CARD}>
            <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Прибыль: Март vs Апрель по менеджерам
            </p>
            <ComparisonBarChart byManager={byManager} />
          </div>
          <div style={CARD}>
            <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Детальное сравнение по менеджерам
            </p>
            <ManagersTable byManager={byManager} />
          </div>
        </>
      )}

      {view === 'categories' && (
        <>
          <div style={CARD}>
            <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Прибыль: Март vs Апрель (топ-8 категорий)
            </p>
            <CategoryBarChart byCategory={byCategory} />
          </div>
          <div style={CARD}>
            <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Детальное сравнение по категориям (топ-15)
            </p>
            <CategoriesTable byCategory={byCategory} />
          </div>
        </>
      )}
    </div>
  );
}
