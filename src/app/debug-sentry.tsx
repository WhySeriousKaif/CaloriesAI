import * as Sentry from '@sentry/react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Pressable } from '@/components/ui/pressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

class MealAnalysisError extends Error {
  name = 'MealAnalysisError';
}
class PaywallPurchaseError extends Error {
  name = 'PaywallPurchaseError';
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const toast = (message: string) => Alert.alert('Sent to Sentry', message);

function crashInRender(): never {
  throw new Error("Cannot read property 'calories' of undefined");
}

function uncaughtHandlerError() {
  setTimeout(() => {
    throw new MealAnalysisError('Meal analysis worker returned a malformed macro payload');
  }, 0);
}

function unhandledRejection() {
  Promise.reject(new Error('POST /api/meals timed out after 30000ms'));
}

function nativeCrash() {
  Alert.alert('Hard crash the app?', 'The app closes immediately. The report uploads on relaunch.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Crash', style: 'destructive', onPress: () => Sentry.nativeCrash() },
  ]);
}

function captureMealFailure() {
  Sentry.withScope((scope) => {
    scope.setTag('feature', 'meal-analysis');
    scope.setTag('model', 'gpt-4o-mini');
    scope.setLevel('error');
    scope.setContext('meal', {
      meal_id: 'meal_demo',
      image_bytes: 2_184_302,
      retry_count: 2,
    });
    Sentry.captureException(
      new MealAnalysisError('Vision model returned calories outside the plausible range'),
    );
  });
  toast('MealAnalysisError with tags + meal context');
}

function capturePurchaseFailure() {
  Sentry.withScope((scope) => {
    scope.setTag('feature', 'paywall');
    scope.setFingerprint(['paywall', 'purchase-failed', 'payment_declined']);
    scope.setContext('purchase', {
      product_id: 'calorie_pro_yearly',
      price_usd: 39.99,
    });
    Sentry.captureException(new PaywallPurchaseError('Payment declined by the App Store'));
  });
  toast('PaywallPurchaseError with a custom fingerprint');
}

async function captureNetworkFailure() {
  Sentry.addBreadcrumb({ category: 'auth', message: 'Clerk token refreshed', level: 'info' });
  Sentry.addBreadcrumb({ category: 'ui', message: 'Tapped "Log meal"', level: 'info' });
  try {
    await fetch('https://api.calorie-ai.invalid/v1/meals');
    toast('Request unexpectedly succeeded');
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag('feature', 'sync');
      scope.setContext('request', { url: 'https://api.calorie-ai.invalid/v1/meals', method: 'GET' });
      Sentry.captureException(error);
    });
    toast('Network failure with a breadcrumb trail');
  }
}

function captureCameraWarning() {
  Sentry.withScope((scope) => {
    scope.setTag('feature', 'camera');
    scope.setContext('permission', { status: 'denied', can_ask_again: false });
    Sentry.captureMessage('Camera permission denied after the user reached the scan tab', 'warning');
  });
  toast('captureMessage at warning level');
}

const LOGS: { label: string; run: () => void }[] = [
  {
    label: 'trace — cache read',
    run: () => Sentry.logger.trace('Profile cache hit', { key: 'profile', age_ms: 412 }),
  },
  {
    label: 'debug — camera frame',
    run: () =>
      Sentry.logger.debug('Captured frame compressed', { width: 1024, quality: 0.8, bytes: 184302 }),
  },
  {
    label: 'info — meal logged',
    run: () =>
      Sentry.logger.info('Meal logged', { calories: 642, protein_g: 38, source: 'camera' }),
  },
  {
    label: 'warn — formula fallback',
    run: () =>
      Sentry.logger.warn('Plan fell back to Mifflin-St Jeor', {
        reason: 'model_returned_implausible_plan',
        calories: 2100,
      }),
  },
  {
    label: 'error — upload failed',
    run: () =>
      Sentry.logger.error('Meal upload failed', {
        reason: 'HTTP 502 from /api/meals',
      }),
  },
];

async function tracedMealAnalysis() {
  await Sentry.startSpan({ name: 'Analyze meal photo', op: 'meal.analyze' }, async () => {
    await Sentry.startSpan({ name: 'Compress image', op: 'image.compress' }, () => sleep(180));
    await Sentry.startSpan({ name: 'Upload to ImageKit', op: 'http.client' }, () => sleep(520));
    await Sentry.startSpan({ name: 'Vision model', op: 'gen_ai.chat' }, async (span: Sentry.Span) => {
      span.setAttribute('model', 'gpt-4o-mini');
      await sleep(1400);
    });
  });
  toast('Transaction "Analyze meal photo" with child spans');
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text style={{ marginBottom: 8, marginLeft: 26, marginTop: 26, fontSize: 15, fontWeight: '500', color: '#8A8A90' }}>
      {children}
    </Text>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <View style={{ marginHorizontal: 18, overflow: 'hidden', borderRadius: 20, backgroundColor: '#FFFFFF' }}>{children}</View>;
}

function Row({
  label,
  onPress,
  tint = '#000000',
  divider,
}: {
  label: string;
  onPress: () => void;
  tint?: string;
  divider?: boolean;
}) {
  return (
    <View style={divider ? { borderTopWidth: 1, borderTopColor: '#F1F1F3' } : undefined}>
      <Pressable onPress={onPress} style={({ pressed }) => [{ backgroundColor: pressed ? '#F7F7F9' : 'transparent', paddingHorizontal: 18, paddingVertical: 15 }]}>
        <Text style={{ fontSize: 17, color: tint }} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

export default function DebugSentry() {
  const insets = useSafeAreaInsets();
  const [crash, setCrash] = useState(false);

  if (crash) crashInRender();

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F4F6', paddingTop: insets.top }}>
      <StatusBar style="dark" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22 }}>
          <Text style={{ flex: 1, fontSize: 34, fontWeight: 'bold', color: '#000000' }}>Sentry QA</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={{ fontSize: 17, color: '#8A8A90' }}>Close</Text>
          </Pressable>
        </View>
        <Text style={{ marginTop: 4, paddingHorizontal: 22, fontSize: 15, color: '#8A8A90' }}>
          Test error tracking, logs, and performance transactions.
        </Text>

        <SectionTitle>Crashes</SectionTitle>
        <Card>
          <Row label="Uncaught error in render" tint="#E5484D" onPress={() => setCrash(true)} />
          <Row divider label="Uncaught error in a handler" tint="#E5484D" onPress={uncaughtHandlerError} />
          <Row divider label="Unhandled promise rejection" tint="#E5484D" onPress={unhandledRejection} />
          <Row divider label="Native crash" tint="#E5484D" onPress={nativeCrash} />
        </Card>

        <SectionTitle>Handled Errors</SectionTitle>
        <Card>
          <Row label="Meal analysis failed" onPress={captureMealFailure} />
          <Row divider label="Purchase declined" onPress={capturePurchaseFailure} />
          <Row divider label="Network request failed" onPress={captureNetworkFailure} />
          <Row divider label="Camera permission warning" onPress={captureCameraWarning} />
        </Card>

        <SectionTitle>Logs</SectionTitle>
        <Card>
          {LOGS.map((log, index) => (
            <Row
              key={log.label}
              divider={index > 0}
              label={log.label}
              onPress={() => {
                log.run();
                toast(log.label);
              }}
            />
          ))}
        </Card>

        <SectionTitle>Performance</SectionTitle>
        <Card>
          <Row label="Slow meal analysis trace" onPress={tracedMealAnalysis} />
        </Card>
      </ScrollView>
    </View>
  );
}
