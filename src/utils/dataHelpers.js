export const MANAGERS = ['Серик', 'Бекнур', 'Артём', 'Жангир'];
export const MONTHS_ORDER = ['январь', 'февраль', 'март', 'апрель'];
export const KPI_TARGETS = {
  'Серик': 1750000,
  'Бекнур': 1750000,
  'Жангир': 1750000,
  'Артём': 5250000,
};
export const TEAM_TARGET = 10500000;

export const AD_TYPES = [
  { value: 'all', label: 'Общий' },
  { value: 'арк', label: 'АРК' },
  { value: 'поиск', label: 'Поиск' },
];

export function filterByAdType(data, adType) {
  if (!adType || adType === 'all') return data;
  return data.filter(d => d.adType === adType);
}

export function filterByMonth(data, month) {
  return data.filter(d => d.month === month);
}

export function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽';
}

export function fmtNum(n, decimals = 0) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}

export function fmtPct(n) {
  if (n == null || isNaN(n)) return '—';
  return (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
}

export function fmtRomi(n) {
  if (n == null || isNaN(n)) return '—';
  return n.toFixed(2);
}

export function growth(curr, prev) {
  if (!prev || prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

export function sumField(rows, field) {
  return rows.reduce((acc, r) => acc + (r[field] || 0), 0);
}

export function calcRomi(rows) {
  const spend = sumField(rows, 'spend');
  const profit = sumField(rows, 'profit');
  if (!spend) return 0;
  return profit / spend;
}

export function aggregateByManager(rows) {
  const result = {};
  for (const m of MANAGERS) {
    const mRows = rows.filter(r => r.manager === m);
    result[m] = {
      spend: sumField(mRows, 'spend'),
      revenue: sumField(mRows, 'revenue'),
      profit: sumField(mRows, 'profit'),
      margin: sumField(mRows, 'margin'),
      romi: calcRomi(mRows),
      count: mRows.length,
    };
  }
  return result;
}

export function aggregateByCategory(rows, topN = 12) {
  const cats = {};
  for (const r of rows) {
    if (!r.category) continue;
    if (!cats[r.category]) cats[r.category] = { spend: 0, revenue: 0, profit: 0, margin: 0, rows: [] };
    cats[r.category].spend += r.spend || 0;
    cats[r.category].revenue += r.revenue || 0;
    cats[r.category].profit += r.profit || 0;
    cats[r.category].margin += r.margin || 0;
    cats[r.category].rows.push(r);
  }
  for (const k of Object.keys(cats)) {
    cats[k].romi = calcRomi(cats[k].rows);
  }
  const sorted = Object.entries(cats)
    .sort((a, b) => b[1].spend - a[1].spend)
    .slice(0, topN);
  return Object.fromEntries(sorted);
}

export function getMonthlyManagerStats(data, adType) {
  const filtered = filterByAdType(data, adType);
  const result = {};
  for (const month of MONTHS_ORDER) {
    const mData = filterByMonth(filtered, month);
    result[month] = aggregateByManager(mData);
  }
  return result;
}

export function getMonthlyGrowth(stats, manager, metric) {
  const months = MONTHS_ORDER.filter(m => stats[m] && stats[m][manager] && stats[m][manager].count > 0);
  const result = {};
  for (let i = 1; i < months.length; i++) {
    const curr = stats[months[i]]?.[manager]?.[metric] ?? 0;
    const prev = stats[months[i - 1]]?.[manager]?.[metric] ?? 0;
    result[months[i]] = growth(curr, prev);
  }
  return result;
}

export function getWeeklyData(data, adType) {
  const filtered = filterByAdType(data, adType).filter(d => d.weekNum > 0);
  const byWeek = {};
  for (const r of filtered) {
    const key = r.weekNum;
    if (!byWeek[key]) byWeek[key] = { weekNum: key, week: r.week, rows: [] };
    byWeek[key].rows.push(r);
  }
  return Object.values(byWeek)
    .sort((a, b) => a.weekNum - b.weekNum)
    .map(w => ({
      weekNum: w.weekNum,
      week: w.week,
      label: w.week || `Нед. ${w.weekNum}`,
      spend: sumField(w.rows, 'spend'),
      revenue: sumField(w.rows, 'revenue'),
      profit: sumField(w.rows, 'profit'),
      romi: calcRomi(w.rows),
      margin: sumField(w.rows, 'margin'),
    }));
}

export function getArticles(data) {
  const set = new Map();
  for (const r of data) {
    if (r.article && !set.has(r.article)) {
      set.set(r.article, { value: r.article, label: `${r.article} — ${r.category}` });
    }
  }
  return Array.from(set.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function getArticleWeekly(data, article, adType, monthFilter) {
  let rows = data.filter(r => r.article === article);
  if (monthFilter) rows = rows.filter(r => r.month === monthFilter);
  rows = filterByAdType(rows, adType).filter(r => r.weekNum > 0);
  const byWeek = {};
  for (const r of rows) {
    if (!byWeek[r.weekNum]) byWeek[r.weekNum] = { weekNum: r.weekNum, week: r.week, rows: [] };
    byWeek[r.weekNum].rows.push(r);
  }
  return Object.values(byWeek)
    .sort((a, b) => a.weekNum - b.weekNum)
    .map(w => ({
      weekNum: w.weekNum,
      label: w.week || `Нед. ${w.weekNum}`,
      spend: sumField(w.rows, 'spend'),
      revenue: sumField(w.rows, 'revenue'),
      profit: sumField(w.rows, 'profit'),
      romi: calcRomi(w.rows),
    }));
}

// Parse week string like "01.01.26-05.01.26" → { start: Date, end: Date }
function parseWeekRange(weekStr) {
  if (!weekStr) return null;
  const parts = weekStr.split('-');
  if (parts.length < 2) return null;
  const parseDate = s => {
    const [d, m, y] = s.trim().split('.');
    if (!d || !m || !y) return null;
    const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
    return new Date(year, parseInt(m) - 1, parseInt(d));
  };
  const start = parseDate(parts[0]);
  const end = parseDate(parts[1]);
  if (!start || !end) return null;
  return { start, end };
}

export function getAprilKpiStats(data, adType) {
  const filtered = filterByAdType(filterByMonth(data, 'апрель'), adType);
  const aprilDays = 30;

  // Collect distinct week ranges in april data
  const weekRanges = new Set(filtered.map(r => r.week).filter(Boolean));
  let coveredDays = 0;
  const coveredDates = new Set();
  for (const wr of weekRanges) {
    const range = parseWeekRange(wr);
    if (!range) continue;
    // Only count days in april
    const aprilStart = new Date(2026, 3, 1);
    const aprilEnd = new Date(2026, 3, 30);
    let d = new Date(Math.max(range.start.getTime(), aprilStart.getTime()));
    const end = new Date(Math.min(range.end.getTime(), aprilEnd.getTime()));
    while (d <= end) {
      coveredDates.add(d.toDateString());
      d = new Date(d.getTime() + 86400000);
    }
  }
  coveredDays = coveredDates.size || 1;

  const result = {};
  for (const m of MANAGERS) {
    const mRows = filtered.filter(r => r.manager === m);
    const fact = sumField(mRows, 'profit');
    const dailyAvg = fact / coveredDays;
    const forecast = dailyAvg * aprilDays;
    const target = KPI_TARGETS[m] || 0;
    result[m] = {
      fact,
      dailyAvg,
      forecast,
      target,
      factPct: target ? (fact / target) * 100 : 0,
      forecastPct: target ? (forecast / target) * 100 : 0,
      coveredDays,
    };
  }

  const teamFact = MANAGERS.reduce((s, m) => s + (result[m]?.fact || 0), 0);
  const teamForecast = MANAGERS.reduce((s, m) => s + (result[m]?.forecast || 0), 0);
  result['_team'] = {
    fact: teamFact,
    forecast: teamForecast,
    target: TEAM_TARGET,
    factPct: (teamFact / TEAM_TARGET) * 100,
    forecastPct: (teamForecast / TEAM_TARGET) * 100,
    coveredDays,
  };

  return result;
}

export function getComparisonData(data, adType) {
  const filtered = filterByAdType(data, adType);
  const march = filterByMonth(filtered, 'март');
  const april = filterByMonth(filtered, 'апрель');

  const byManager = {};
  for (const m of MANAGERS) {
    const mM = march.filter(r => r.manager === m);
    const mA = april.filter(r => r.manager === m);
    byManager[m] = {
      march: { spend: sumField(mM, 'spend'), revenue: sumField(mM, 'revenue'), profit: sumField(mM, 'profit'), romi: calcRomi(mM) },
      april: { spend: sumField(mA, 'spend'), revenue: sumField(mA, 'revenue'), profit: sumField(mA, 'profit'), romi: calcRomi(mA) },
    };
    for (const metric of ['spend', 'revenue', 'profit', 'romi']) {
      byManager[m][metric + 'Delta'] = growth(byManager[m].april[metric], byManager[m].march[metric]);
    }
  }

  const cats = new Set([...march.map(r => r.category), ...april.map(r => r.category)].filter(Boolean));
  const marchCatAgg = aggregateByCategory(march, 100);
  const aprilCatAgg = aggregateByCategory(april, 100);
  const byCategory = {};
  for (const cat of cats) {
    const mC = marchCatAgg[cat] || { spend: 0, revenue: 0, profit: 0, romi: 0 };
    const aC = aprilCatAgg[cat] || { spend: 0, revenue: 0, profit: 0, romi: 0 };
    byCategory[cat] = {
      march: mC,
      april: aC,
    };
    for (const metric of ['spend', 'revenue', 'profit', 'romi']) {
      byCategory[cat][metric + 'Delta'] = growth(aC[metric], mC[metric]);
    }
  }

  return { byManager, byCategory };
}
