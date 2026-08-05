import { Image } from 'expo-image';
import { CloudOff, RotateCw } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Pressable } from '@/components/ui/pressable';
import { Palette, Radius } from '@/constants/design';

type ErrorScreenProps = {
  title?: string;
  message?: string;
  /** Awaited so the button can show progress for the length of the retry. */
  onRetry: () => void | Promise<void>;
  /** Optional secondary action, e.g. "Sign out". */
  secondaryLabel?: string;
  onSecondary?: () => void;
};

/**
 * Full-screen "we couldn't load this" state with a retry.
 *
 * Deliberately a dead end rather than a redirect: the alternative is guessing
 * why the request failed, and every wrong guess strands the user somewhere
 * confusing (an onboarding flow they already finished, or an empty dashboard
 * that reads as data loss). Showing the failure and letting them retry is both
 * more honest and cheaper to recover from.
 */
export function ErrorScreen({
  title = "Couldn't load your data",
  message = 'Something went wrong on our end. Please try again.',
  onRetry,
  secondaryLabel,
  onSecondary,
}: ErrorScreenProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.brand}>
        <Image
          source={require('../../../assets/images/logo-mark.png')}
          style={styles.logo}
          contentFit="contain"
          alt="Calora"
        />
      </View>

      <View style={styles.iconBadge}>
        <CloudOff size={26} color={Palette.danger} strokeWidth={2} />
      </View>

      <Text style={styles.title} maxFontSizeMultiplier={1.3}>
        {title}
      </Text>
      <Text style={styles.message} maxFontSizeMultiplier={1.3}>
        {message}
      </Text>

      <Pressable
        onPress={handleRetry}
        disabled={retrying}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        accessibilityState={{ disabled: retrying, busy: retrying }}
        style={({ pressed }) => [
          styles.retry,
          pressed && styles.retryPressed,
          retrying && styles.retryDisabled,
        ]}>
        <RotateCw size={18} color={Palette.onBrand} strokeWidth={2.5} />
        <Text style={styles.retryLabel} maxFontSizeMultiplier={1.2}>
          {retrying ? 'Retrying…' : 'Try again'}
        </Text>
      </Pressable>

      {secondaryLabel && onSecondary ? (
        <Pressable
          onPress={onSecondary}
          accessibilityRole="button"
          accessibilityLabel={secondaryLabel}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={({ pressed }) => [styles.secondary, pressed && styles.secondaryPressed]}>
          <Text style={styles.secondaryLabel} maxFontSizeMultiplier={1.3}>
            {secondaryLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  brand: {
    marginBottom: 28,
  },
  logo: {
    width: 56,
    height: 56,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: Palette.dangerTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: Palette.text,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400',
    color: Palette.textSecondary,
    textAlign: 'center',
    marginBottom: 26,
  },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    paddingHorizontal: 28,
    borderRadius: Radius.pill,
    backgroundColor: Palette.brand,
  },
  retryPressed: {
    opacity: 0.88,
  },
  retryDisabled: {
    opacity: 0.6,
  },
  retryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.onBrand,
  },
  secondary: {
    marginTop: 18,
    paddingVertical: 6,
  },
  secondaryPressed: {
    opacity: 0.6,
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
});
