import { useState, useMemo } from 'react';
import { AD_TYPES, MANAGERS, KPI_TARGETS, TEAM_TARGET, getAprilKpiStats, fmt, fmtPct } from '../utils/dataHelpers';

const TOGGLE = (active) => ({
  padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: active ? '#38bdf8' : '#1e293b', color: active ? '#0f172a' : '#94a3b8', transition: 'all 0.15s',
});

const COLORS = { 'Серик': '#38bdf8', 'Бекнур': '#a78bfa', 'Артём': '#4ade80', 'Жангир': '#fb923c' };

function kpiColor(pct) {
  if (pct >= 100) return '#4ade80';
  if (pct >= 70) return '#facc15';
  return '#f87171';
}

function ProgressBar({ manager, stats, isTeam }) {
  const name = isTeam ? 'Команда' : manager;
  const s = stats[isTeam ? '_team' : manager];
  if (!s) return null;

  const factW = Math.min(s.factPct, 100);
  const forecastW = Math.min(s.forecastPct, 100);
  const color = kpiColor(s.forecastPct);
  const target = isTeam ? TEAM_TARGET : KPI_TARGETS[manager];

  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isTeam && <div style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS[manager] }} />}
          <span style={{ fontWeight: 700, fontSize: isTeam ? 18 : 16, color: isTeam ? '#f1f5f9' : COLORS[manager] }}>
            {name}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Цель: {fmt(target)}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color }}>
            {s.forecastPct.toFixed(1)}% KPI
          </div>
        </div>
      </div>

      {/* Bar track */}
      <div style={{ position: 'relative', height: 20, background: '#0f172a', borderRadius: 10, overflow: 'hidden' }}>
        {/* Forecast bar (lighter/transparent) */}
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: forecastW + '%',
          background: color + '33',
          borderRadius: 10,
          transition: 'width 0.5s ease',
        }} />
        {/* Fact bar */}
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: factW + '%',
          background: color,
          borderRadius: 10,
          transition: 'width 0.5s ease',
        }} />
        {/* 100% mark */}
        <div style={{ position: 'absolute', left: '100%', top: 0, transform: 'translateX(-1px)', width: 2, height: '100%', background: '#475569' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Факт ({s.coveredDays} дн.)</div>
          <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 15 }}>{fmt(s.fact)}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{s.factPct.toFixed(1)}% от цели</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Прогноз на 30 дней</div>
          <div style={{ fontWeight: 600, color, fontSize: 15 }}>{fmt(s.forecast)}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{s.forecastPct.toFixed(1)}% от цели</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Среднедневная прибыль</div>
          <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: 15 }}>{fmt(s.dailyAvg || (s.fact / s.coveredDays))}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>охват {s.coveredDays} из 30 дней</div>
        </div>
      </div>
    </div>
  );
}

export default function Tab2KPI({ data }) {
  const [adType, setAdType] = useState('all');

  const stats = useMemo(() => getAprilKpiStats(data, adType), [data, adType]);

  const teamColor = kpiColor(stats._team?.forecastPct || 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <h2 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>KPI Апрель 2026</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {AD_TYPES.map(t => (
            <button key={t.value} style={TOGGLE(adType === t.value)} onClick={() => setAdType(t.value)}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Team summary card */}
      <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, marginBottom: 24, border: `1px solid ${teamColor}33` }}>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Команда — общая цель</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: teamColor }}>
              {stats._team?.forecastPct?.toFixed(1)}% KPI
            </div>
            <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
              Прогноз: {fmt(stats._team?.forecast)} / {fmt(TEAM_TARGET)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>Факт</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{fmt(stats._team?.fact)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>Дней охвачено</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{stats._team?.coveredDays} / 30</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12, fontSize: 13, color: '#64748b' }}>
        Прогноз = (факт ÷ покрытых дней) × 30 · ████ факт · ░░░░ прогноз
      </div>

      {MANAGERS.map(m => (
        <ProgressBar key={m} manager={m} stats={stats} />
      ))}

      <ProgressBar isTeam manager={null} stats={stats} />
    </div>
  );
}
