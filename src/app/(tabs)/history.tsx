import { Clock } from 'lucide-react-native';

import { ComingSoon } from '@/components/coming-soon';

export default function HistoryScreen() {
  return (
    <ComingSoon
      icon={Clock}
      title="Meal history"
      description="Every meal you log will show up here, grouped by day, so you can look back on how a week actually went."
    />
  );
}
