import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Tab1Growth from './components/Tab1Growth';
import Tab2KPI from './components/Tab2KPI';
import Tab3WeeklyDynamics from './components/Tab3WeeklyDynamics';
import Tab4ArticleDynamics from './components/Tab4ArticleDynamics';
import Tab5MarchComparison from './components/Tab5MarchComparison';

export default function App() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data.json')
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: '#94a3b8', fontSize: 18 }}>
        Загрузка данных...
      </div>
    );
  }

  const tabs = [
    { label: 'Приросты' },
    { label: 'KPI Апрель' },
    { label: 'Динамика по неделям' },
    { label: 'По артикулам' },
    { label: 'Март vs Апрель' },
  ];

  const components = [
    <Tab1Growth data={data} />,
    <Tab2KPI data={data} />,
    <Tab3WeeklyDynamics data={data} />,
    <Tab4ArticleDynamics data={data} />,
    <Tab5MarchComparison data={data} />,
  ];

  return (
    <Layout tab={tab} setTab={setTab} tabs={tabs}>
      {components[tab]}
    </Layout>
  );
}
