import { useStore } from './state/store';
import { TabBar, Toast } from './components/ui';
import { Welcome, OnbDay, OnbThermal, OnbPlace, Starter, SignIn } from './screens/Onboarding';
import { Today } from './screens/Today';
import { Closet, ItemDetail } from './screens/Closet';
import { AddScreen } from './screens/AddFlow';
import { Settings } from './screens/Settings';
import { useForecast, useServerSync } from './state/sync';
import { useDay } from './state/day';

export default function App() {
  const { s } = useStore();
  useServerSync();
  useForecast();
  const { mood } = useDay();
  const main = ['today', 'closet', 'item', 'add', 'settings'].includes(s.route);
  const screen = (() => {
    switch (s.route) {
      case 'welcome': return <Welcome />;
      case 'onb-day': return <OnbDay />;
      case 'onb-thermal': return <OnbThermal />;
      case 'onb-place': return <OnbPlace />;
      case 'starter': return <Starter />;
      case 'signin': return <SignIn />;
      case 'today': return <Today />;
      case 'closet': return <Closet />;
      case 'item': return <ItemDetail key={s.itemId} />;
      case 'add': return <AddScreen />;
      case 'settings': return <Settings />;
    }
  })();
  return (
    <div className={`app mood-${mood}`}>
      {screen}
      {main && <TabBar />}
      <Toast />
    </div>
  );
}
