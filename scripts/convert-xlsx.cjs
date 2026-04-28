const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', '..', 'claude анализ (1).xlsx');
const wb = xlsx.readFile(filePath);
const ws = wb.Sheets['Лист2'];

// Headers are on row 2 (index 1), so skip first row
const raw = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null });

// Row 1 (index 1) = headers
const headers = raw[1].map(h => (h != null ? String(h).trim() : ''));

// Map column names to normalized keys
const COL_MAP = {
  'Менеджер': 'manager',
  'категория': 'category',
  'Тип рекламы': 'adType',
  'артикул': 'article',
  'Затраты на рекламу': 'spend',
  'выручка тотал': 'revenue',
  'итого прибыль': 'profit',
  'ROMI (return om marketing investments)': 'romi',
  'тотал маржа': 'margin',
  'месяц': 'month',
  'номер недели': 'weekNum',
  'неделя': 'week',
  'год': 'year',
};

// For duplicate headers, take first occurrence
const colIndexes = {};
headers.forEach((h, i) => {
  const key = COL_MAP[h];
  if (key && colIndexes[key] === undefined) colIndexes[key] = i;
});

console.log('Column mapping:', colIndexes);

const data = [];
// Data starts from row index 2
for (let r = 2; r < raw.length; r++) {
  const row = raw[r];
  if (!row || row.every(v => v == null)) continue;

  const get = key => {
    const idx = colIndexes[key];
    return idx !== undefined ? row[idx] : null;
  };

  const manager = get('manager');
  if (!manager || String(manager).trim() === '') continue;

  const spend = parseFloat(get('spend'));
  const profit = parseFloat(get('profit'));
  if (isNaN(spend) && isNaN(profit)) continue;

  const adTypeRaw = get('adType');
  const adType = adTypeRaw ? String(adTypeRaw).trim().toLowerCase() : '';

  const romiVal = parseFloat(get('romi'));
  const revenueVal = parseFloat(get('revenue'));
  const marginVal = parseFloat(get('margin'));
  const weekNum = parseInt(get('weekNum'));

  data.push({
    manager: String(manager).trim(),
    category: String(get('category') || '').trim(),
    adType,
    article: get('article') != null ? String(get('article')).trim() : '',
    spend: isNaN(spend) ? 0 : spend,
    revenue: isNaN(revenueVal) ? 0 : revenueVal,
    profit: isNaN(profit) ? 0 : profit,
    romi: isNaN(romiVal) ? 0 : romiVal,
    margin: isNaN(marginVal) ? 0 : marginVal,
    month: String(get('month') || '').trim().toLowerCase(),
    weekNum: isNaN(weekNum) ? 0 : weekNum,
    week: String(get('week') || '').trim(),
    year: parseInt(get('year')) || 2026,
  });
}

console.log(`Total rows: ${data.length}`);
console.log('Managers:', [...new Set(data.map(d => d.manager))]);
console.log('Months:', [...new Set(data.map(d => d.month))]);
console.log('Ad types:', [...new Set(data.map(d => d.adType))]);
console.log('Week nums:', [...new Set(data.map(d => d.weekNum))].sort((a,b)=>a-b));

const outPath = path.join(__dirname, '..', 'public', 'data.json');
fs.writeFileSync(outPath, JSON.stringify(data, null, 0));
console.log(`Saved ${data.length} records to ${outPath}`);
