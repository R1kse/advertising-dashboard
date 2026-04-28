import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { AD_TYPES, MANAGERS, getWeeklyData, fmt, fmtRomi } from '../utils/dataHelpers';

const TOGGLE = (active) => ({
  padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: active ? '#38bdf8' : '#1e293b', color: active ? '#0f172a' : '#94a3b8', transition: 'all 0.15s',
});

const CARD = { background: '#1e293b', borderRadius: 12, padding: 24, marginBottom: 20 };
const CHART_STYLE = { contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }, labelStyle: { color: '#e2e8f0' } };
const AXIS_TICK = { fill: '#94a3b8', fontSize: 11 };

function fmtM(v) {
  if (Math.abs(v) >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(0) + 'K';
  return v;
}

function WeekChart({ title, dataKey, data, color = '#38bdf8', formatter, yTickFormatter }) {
  return (
    <div style={CARD}>
      <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
          <XAxis dataKey="label" tick={AXIS_TICK} interval="preserveStartEnd" tickFormatter={v => v.split('-')[0]} />
          <YAxis tick={AXIS_TICK} tickFormatter={yTickFormatter || fmtM} width={60} />
          <Tooltip {...CHART_STYLE} formatter={formatter || ((v) => [fmt(v), title])} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MultiManagerChart({ title, dataKey, data, formatter, yTickFormatter }) {
  const COLORS = { 'Серик': '#38bdf8', 'Бекнур': '#a78bfa', 'Артём': '#4ade80', 'Жангир': '#fb923c' };

  return (
    <div style={CARD}>
      <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title} по менеджерам</p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
          <XAxis dataKey="label" tick={AXIS_TICK} interval="preserveStartEnd" tickFormatter={v => v.split('-')[0]} />
          <YAxis tick={AXIS_TICK} tickFormatter={yTickFormatter || fmtM} width={60} />
          <Tooltip {...CHART_STYLE} formatter={formatter || ((v, name) => [fmt(v), name])} />
          <Legend />
          {MANAGERS.map(m => (
            <Line key={m} type="monotone" dataKey={m} stroke={COLORS[m]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Tab3WeeklyDynamics({ data }) {
  const [adType, setAdType] = useState('all');
  const [view, setView] = useState('total');

  const weeklyTotal = useMemo(() => getWeeklyData(data, adType), [data, adType]);

  const weeklyByManager = useMemo(() => {
    const byWeek = {};
    const filtered = data.filter(d => d.weekNum > 0 && (!adType || adType === 'all' || d.adType === adType));
    for (const r of filtered) {
      if (!byWeek[r.weekNum]) byWeek[r.weekNum] = { weekNum: r.weekNum, label: r.week || `Нед. ${r.weekNum}` };
      if (!byWeek[r.weekNum][r.manager]) byWeek[r.weekNum][r.manager] = { spend: 0, revenue: 0, profit: 0, rows: [] };
      byWeek[r.weekNum][r.manager].spend += r.spend || 0;
      byWeek[r.weekNum][r.manager].revenue += r.revenue || 0;
      byWeek[r.weekNum][r.manager].profit += r.profit || 0;
      byWeek[r.weekNum][r.manager].rows.push(r);
    }
    const result = Object.values(byWeek).sort((a, b) => a.weekNum - b.weekNum);
    return result.map(w => {
      const row = { label: w.label };
      for (const m of MANAGERS) {
        row[m] = w[m]?.profit ?? 0;
      }
      return row;
    });
  }, [data, adType]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <h2 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>Динамика по неделям</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {AD_TYPES.map(t => (
            <button key={t.value} style={TOGGLE(adType === t.value)} onClick={() => setAdType(t.value)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button style={TOGGLE(view === 'total')} onClick={() => setView('total')}>Общая динамика</button>
        <button style={TOGGLE(view === 'managers')} onClick={() => setView('managers')}>По менеджерам</button>
      </div>

      {view === 'total' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 0 }}>
          <WeekChart title="Затраты на рекламу" dataKey="spend" data={weeklyTotal} color="#f87171"
            formatter={v => [fmt(v), 'Затраты']} />
          <WeekChart title="Выручка" dataKey="revenue" data={weeklyTotal} color="#38bdf8"
            formatter={v => [fmt(v), 'Выручка']} />
          <WeekChart title="Прибыль" dataKey="profit" data={weeklyTotal} color="#4ade80"
            formatter={v => [fmt(v), 'Прибыль']} />
          <div style={CARD}>
            <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ROMI <span style={{ color: '#38bdf8' }}>(прибыль / затраты)</span>
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={weeklyTotal} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                <XAxis dataKey="label" tick={AXIS_TICK} interval="preserveStartEnd" tickFormatter={v => v.split('-')[0]} />
                <YAxis tick={AXIS_TICK} tickFormatter={v => v.toFixed(1)} width={50} />
                <ReferenceLine y={1} stroke="#facc15" strokeDasharray="4 4" label={{ value: 'ROMI=1', fill: '#facc15', fontSize: 11 }} />
                <Tooltip {...CHART_STYLE} formatter={v => [fmtRomi(v), 'ROMI']} />
                <Line type="monotone" dataKey="romi" stroke="#facc15" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {view === 'managers' && (
        <MultiManagerChart
          title="Прибыль"
          dataKey="profit"
          data={weeklyByManager}
        />
      )}
    </div>
  );
}
