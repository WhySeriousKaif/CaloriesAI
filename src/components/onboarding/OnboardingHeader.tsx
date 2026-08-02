import { Pressable, StyleSheet, Text, View } from 'react-native';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  showBack?: boolean;
}

export function OnboardingHeader({
  currentStep,
  totalSteps,
  onBack,
  showBack = true,
}: OnboardingHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Navigation Top Row */}
      <View style={styles.navRow}>
        {showBack && currentStep > 1 ? (
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        {/* Step Badge */}
        <Text style={styles.stepBadge}>
          {currentStep} OF {totalSteps}
        </Text>

        <View style={styles.backPlaceholder} />
      </View>

      {/* Segmented Progress Bar */}
      <View style={styles.progressRow}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <View
              key={index}
              style={[
                styles.progressDot,
                isCompleted && styles.completedDot,
                isActive && styles.activeDot,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  backArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A3527',
  },
  backPlaceholder: {
    width: 36,
  },
  stepBadge: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#073828',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  activeDot: {
    backgroundColor: '#073828',
  },
  completedDot: {
    backgroundColor: '#073828',
    opacity: 0.6,
  },
});
