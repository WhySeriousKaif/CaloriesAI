import { BarChart3 } from 'lucide-react-native';

import { ComingSoon } from '@/components/coming-soon';

export default function AnalyticsScreen() {
  return (
    <ComingSoon
      icon={BarChart3}
      title="Analytics"
      description="Trends across your calories and macros, so you can see whether you're tracking toward your goal or drifting."
    />
  );
}
