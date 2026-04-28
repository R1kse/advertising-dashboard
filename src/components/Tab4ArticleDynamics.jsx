import { useState, useMemo } from 'react';
import Select from 'react-select';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { AD_TYPES, getArticles, getArticleWeekly, fmt, fmtRomi } from '../utils/dataHelpers';

const TOGGLE = (active) => ({
  padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
  background: active ? '#38bdf8' : '#1e293b', color: active ? '#0f172a' : '#94a3b8', transition: 'all 0.15s',
});
const CARD = { background: '#1e293b', borderRadius: 12, padding: 24, marginBottom: 20 };
const AXIS_TICK = { fill: '#94a3b8', fontSize: 11 };
const CHART_STYLE = { contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }, labelStyle: { color: '#e2e8f0' } };
const selectStyles = {
  control: (b) => ({ ...b, background: '#1e293b', border: '1px solid #334155', borderRadius: 8, minHeight: 42, boxShadow: 'none', '&:hover': { borderColor: '#38bdf8' } }),
  menu: (b) => ({ ...b, background: '#1e293b', border: '1px solid #334155', zIndex: 100 }),
  option: (b, s) => ({ ...b, background: s.isFocused ? '#334155' : '#1e293b', color: '#e2e8f0', cursor: 'pointer' }),
  singleValue: (b) => ({ ...b, color: '#e2e8f0' }),
  input: (b) => ({ ...b, color: '#e2e8f0' }),
  placeholder: (b) => ({ ...b, color: '#64748b' }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (b) => ({ ...b, color: '#64748b' }),
};

function fmtM(v) {
  if (Math.abs(v) >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(0) + 'K';
  return v;
}

export default function Tab4ArticleDynamics({ data }) {
  const [adType, setAdType] = useState('all');
  const [period, setPeriod] = useState('april');
  const [article, setArticle] = useState(null);

  const articles = useMemo(() => getArticles(data), [data]);

  const weeklyData = useMemo(() => {
    if (!article) return [];
    return getArticleWeekly(data, article.value, adType, period === 'april' ? 'апрель' : null);
  }, [data, article, adType, period]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <h2 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>Динамика по артикулам</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {AD_TYPES.map(t => (
            <button key={t.value} style={TOGGLE(adType === t.value)} onClick={() => setAdType(t.value)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ flex: 1, minWidth: 280, maxWidth: 480 }}>
          <Select
            options={articles}
            value={article}
            onChange={setArticle}
            styles={selectStyles}
            placeholder="Выберите артикул..."
            noOptionsMessage={() => 'Не найдено'}
            filterOption={(option, input) =>
              input ? option.label.toLowerCase().includes(input.toLowerCase()) : true
            }
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={TOGGLE(period === 'april')} onClick={() => setPeriod('april')}>Апрель</button>
          <button style={TOGGLE(period === 'year')} onClick={() => setPeriod('year')}>2026 год</button>
        </div>
      </div>

      {!article && (
        <div style={{ ...CARD, textAlign: 'center', padding: '60px 24px', color: '#64748b' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16 }}>Выберите артикул из списка выше</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Доступно {articles.length} артикулов</div>
        </div>
      )}

      {article && weeklyData.length === 0 && (
        <div style={{ ...CARD, textAlign: 'center', padding: '60px 24px', color: '#64748b' }}>
          <div style={{ fontSize: 16 }}>Нет данных для выбранного периода и типа рекламы</div>
        </div>
      )}

      {article && weeklyData.length > 0 && (
        <>
          {/* Summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Затраты', key: 'spend', color: '#f87171' },
              { label: 'Выручка', key: 'revenue', color: '#38bdf8' },
              { label: 'Прибыль', key: 'profit', color: '#4ade80' },
            ].map(m => {
              const total = weeklyData.reduce((s, w) => s + (w[m.key] || 0), 0);
              return (
                <div key={m.key} style={{ background: '#1e293b', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: m.color }}>{fmt(total)}</div>
                </div>
              );
            })}
            <div style={{ background: '#1e293b', borderRadius: 10, padding: '14px 16px', border: '1px solid #38bdf822' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>ROMI (средний)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#38bdf8' }}>
                {fmtRomi(weeklyData.reduce((s, w) => s + (w.romi || 0), 0) / weeklyData.length)}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 0 }}>
            {[
              { title: 'Затраты на рекламу', key: 'spend', color: '#f87171', fmtFn: v => [fmt(v), 'Затраты'] },
              { title: 'Выручка', key: 'revenue', color: '#38bdf8', fmtFn: v => [fmt(v), 'Выручка'] },
              { title: 'Прибыль', key: 'profit', color: '#4ade80', fmtFn: v => [fmt(v), 'Прибыль'] },
            ].map(({ title, key, color, fmtFn }) => (
              <div key={key} style={CARD}>
                <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={weeklyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                    <XAxis dataKey="label" tick={AXIS_TICK} interval="preserveStartEnd" tickFormatter={v => v.split('-')[0]} />
                    <YAxis tick={AXIS_TICK} tickFormatter={fmtM} width={60} />
                    <Tooltip {...CHART_STYLE} formatter={fmtFn} />
                    <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}

            <div style={CARD}>
              <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ROMI <span style={{ color: '#38bdf8' }}>(прибыль / затраты)</span>
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weeklyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                  <XAxis dataKey="label" tick={AXIS_TICK} interval="preserveStartEnd" tickFormatter={v => v.split('-')[0]} />
                  <YAxis tick={AXIS_TICK} tickFormatter={v => v.toFixed(1)} width={50} />
                  <ReferenceLine y={1} stroke="#facc15" strokeDasharray="4 4" />
                  <Tooltip {...CHART_STYLE} formatter={v => [fmtRomi(v), 'ROMI']} />
                  <Line type="monotone" dataKey="romi" stroke="#facc15" strokeWidth={2.5} dot={{ r: 3, fill: '#facc15' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
