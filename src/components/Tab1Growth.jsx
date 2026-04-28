import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import {
  MANAGERS, MONTHS_ORDER, AD_TYPES,
  filterByAdType, filterByMonth, aggregateByCategory,
  getMonthlyManagerStats, fmt, fmtPct, fmtRomi,
  sumField, calcRomi, growth
} from '../utils/dataHelpers';

const COLORS = { 'Серик': '#38bdf8', 'Бекнур': '#a78bfa', 'Артём': '#4ade80', 'Жангир': '#fb923c' };
const METRICS = [
  { key: 'spend', label: 'Затраты' },
  { key: 'revenue', label: 'Выручка' },
  { key: 'profit', label: 'Прибыль' },
];

function GrowthCell({ value }) {
  if (value == null) return <td style={TD}>—</td>;
  const color = value > 0 ? '#4ade80' : value < 0 ? '#f87171' : '#94a3b8';
  return <td style={{ ...TD, color, fontWeight: 600 }}>{fmtPct(value)}</td>;
}

const TD = { padding: '10px 14px', borderBottom: '1px solid #1e293b', fontSize: 13 };
const TH = { padding: '10px 14px', borderBottom: '1px solid #1e293b', fontSize: 12, color: '#64748b', fontWeight: 600, textAlign: 'left', background: '#0f172a', position: 'sticky', top: 0 };

function MonthRow({ label, stats, manager, prev, isCategory = false }) {
  const curr = isCategory ? stats : stats?.[manager];
  const prevData = isCategory ? prev : prev?.[manager];
  if (!curr) return null;
  return (
    <tr>
      <td style={{ ...TD, color: '#94a3b8', paddingLeft: 24 }}>{label}</td>
      <td style={TD}>{fmt(curr.spend)}</td>
      <GrowthCell value={prevData ? growth(curr.spend, prevData.spend) : null} />
      <td style={TD}>{fmt(curr.revenue)}</td>
      <GrowthCell value={prevData ? growth(curr.revenue, prevData.revenue) : null} />
      <td style={TD}>{fmt(curr.profit)}</td>
      <GrowthCell value={prevData ? growth(curr.profit, prevData.profit) : null} />
      <td style={{ ...TD, color: '#38bdf8', fontWeight: 600 }}>{fmtRomi(curr.romi)}</td>
    </tr>
  );
}

function ManagerTable({ data, adType }) {
  const stats = useMemo(() => getMonthlyManagerStats(data, adType), [data, adType]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={TH}>Менеджер / Месяц</th>
            <th style={TH}>Затраты</th>
            <th style={TH}>Δ%</th>
            <th style={TH}>Выручка</th>
            <th style={TH}>Δ%</th>
            <th style={TH}>Прибыль</th>
            <th style={TH}>Δ%</th>
            <th style={{ ...TH, color: '#38bdf8' }}>ROMI</th>
          </tr>
        </thead>
        <tbody>
          {MANAGERS.map(m => (
            <React.Fragment key={m}>
              <tr>
                <td colSpan={8} style={{ ...TD, fontWeight: 700, color: COLORS[m], background: '#0f172a', paddingTop: 16 }}>{m}</td>
              </tr>
              {MONTHS_ORDER.map((month, i) => {
                const monthStats = stats[month]?.[m];
                if (!monthStats || monthStats.count === 0) return null;
                return (
                  <MonthRow
                    key={m + month}
                    label={month.charAt(0).toUpperCase() + month.slice(1)}
                    stats={stats[month]}
                    manager={m}
                    prev={i > 0 ? stats[MONTHS_ORDER[i - 1]] : null}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryTable({ data, adType }) {
  const catsByMonth = useMemo(() => {
    const result = {};
    for (const month of MONTHS_ORDER) {
      const mData = filterByAdType(filterByMonth(data, month), adType);
      result[month] = aggregateByCategory(mData, 15);
    }
    // Collect all categories present in any month
    const allCats = new Set(MONTHS_ORDER.flatMap(m => Object.keys(result[m])));
    return { catsByMonth: result, allCats };
  }, [data, adType]);

  const { catsByMonth: cbm, allCats } = catsByMonth;
  const sortedCats = [...allCats].sort((a, b) => {
    const aprilA = cbm['апрель']?.[a]?.spend || 0;
    const aprilB = cbm['апрель']?.[b]?.spend || 0;
    return aprilB - aprilA;
  });

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={TH}>Категория</th>
            {MONTHS_ORDER.map(m => (
              <React.Fragment key={m}>
                <th style={TH}>{m.slice(0, 3)} Затраты</th>
                <th style={TH}>{m.slice(0, 3)} Прибыль</th>
                <th style={{ ...TH, color: '#38bdf8' }}>ROMI</th>
                <th style={TH}>Δ%</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedCats.slice(0, 12).map(cat => (
            <tr key={cat}>
              <td style={{ ...TD, fontWeight: 500 }}>{cat}</td>
              {MONTHS_ORDER.map((month, i) => {
                const curr = cbm[month]?.[cat];
                const prev = i > 0 ? cbm[MONTHS_ORDER[i - 1]]?.[cat] : null;
                const g = curr && prev ? growth(curr.profit, prev.profit) : null;
                return (
                  <React.Fragment key={month}>
                    <td style={TD}>{curr ? fmt(curr.spend) : '—'}</td>
                    <td style={TD}>{curr ? fmt(curr.profit) : '—'}</td>
                    <td style={{ ...TD, color: '#38bdf8' }}>{curr ? fmtRomi(curr.romi) : '—'}</td>
                    <GrowthCell value={g} />
                  </React.Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GrowthChart({ data, adType }) {
  const chartData = useMemo(() => {
    const months = MONTHS_ORDER.filter((_, i) => i > 0);
    const stats = getMonthlyManagerStats(data, adType);
    return months.map(month => {
      const i = MONTHS_ORDER.indexOf(month);
      const prev = MONTHS_ORDER[i - 1];
      const row = { month: month.slice(0, 3) };
      for (const m of MANAGERS) {
        const curr = stats[month]?.[m]?.profit ?? 0;
        const p = stats[prev]?.[m]?.profit ?? 0;
        row[m] = p ? parseFloat(((curr - p) / Math.abs(p) * 100).toFixed(1)) : null;
      }
      return row;
    });
  }, [data, adType]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={v => v + '%'} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0' }}
          formatter={(v, name) => [v != null ? v.toFixed(1) + '%' : '—', name]}
        />
        <Legend />
        {MANAGERS.map(m => (
          <Bar key={m} dataKey={m} fill={COLORS[m]} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

const CARD = { background: '#1e293b', borderRadius: 12, padding: 24, marginBottom: 24 };
const SEC_TITLE = { color: '#e2e8f0', fontSize: 16, fontWeight: 600, marginBottom: 16, margin: '0 0 16px' };
const TOGGLE = (active) => ({
  padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: active ? '#38bdf8' : '#1e293b', color: active ? '#0f172a' : '#94a3b8', transition: 'all 0.15s',
});

export default function Tab1Growth({ data }) {
  const [adType, setAdType] = useState('all');
  const [view, setView] = useState('managers');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <h2 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>Приросты по менеджерам и категориям</h2>
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
            <p style={SEC_TITLE}>Прирост прибыли по менеджерам (Δ месяц к месяцу)</p>
            <GrowthChart data={data} adType={adType} />
          </div>
          <div style={CARD}>
            <p style={SEC_TITLE}>Детальная таблица по менеджерам</p>
            <ManagerTable data={data} adType={adType} />
          </div>
        </>
      )}

      {view === 'categories' && (
        <div style={CARD}>
          <p style={SEC_TITLE}>Динамика по категориям (топ-12 по затратам)</p>
          <CategoryTable data={data} adType={adType} />
        </div>
      )}
    </div>
  );
}
