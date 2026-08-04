import { Pressable, StyleSheet, Text, View } from 'react-native';

interface RulerPickerProps {
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  unit: string;
}

export function RulerPicker({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: RulerPickerProps) {
  const handleDecrement = () => {
    const newVal = Math.max(min, Number((value - step).toFixed(1)));
    onChange(newVal);
  };

  const handleIncrement = () => {
    const newVal = Math.min(max, Number((value + step).toFixed(1)));
    onChange(newVal);
  };

  // Generate ruler tick marks centered around current value
  const numTicks = 9;
  const half = Math.floor(numTicks / 2);
  const ticks: number[] = [];

  for (let i = -half; i <= half; i++) {
    const tickVal = Number((value + i * step).toFixed(1));
    if (tickVal >= min && tickVal <= max) {
      ticks.push(tickVal);
    }
  }

  return (
    <View style={styles.container}>
      {/* Value Display Box */}
      <View style={styles.valueDisplayCard}>
        <View style={styles.valueBadge}>
          <Text style={styles.valueNumber}>
            {step < 1 ? value.toFixed(1) : Math.round(value)}
          </Text>
          <Text style={styles.unitText}>{unit}</Text>
        </View>
      </View>

      {/* Interactive Ruler Controls */}
      <View style={styles.rulerControlBox}>
        <Pressable
          style={({ pressed }) => [styles.adjustBtn, pressed && styles.pressed]}
          onPress={handleDecrement}
          accessibilityRole="button"
          accessibilityLabel="Decrease">
          <Text style={styles.btnText}>−</Text>
        </Pressable>

        {/* Ruler ticks container */}
        <View style={styles.rulerContainer}>
          {/* Central Active Pointer Arrow Needle */}
          <View style={styles.centerIndicator}>
            <View style={styles.pointerNeedle} />
            <View style={styles.pointerCap} />
          </View>

          <View style={styles.ticksRow}>
            {ticks.map((tickVal) => {
              const isSelected = Math.abs(tickVal - value) < step / 2;
              const isMajor = Math.round(tickVal * 10) % 5 === 0 || step >= 1;

              return (
                <Pressable
                  key={tickVal.toString()}
                  style={styles.tickItem}
                  onPress={() => onChange(tickVal)}>
                  <View
                    style={[
                      styles.tickLine,
                      isMajor ? styles.majorTick : styles.minorTick,
                      isSelected && styles.selectedTick,
                    ]}
                  />
                  {isMajor ? (
                    <Text style={[styles.tickText, isSelected && styles.selectedTickText]}>
                      {tickVal}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.adjustBtn, pressed && styles.pressed]}
          onPress={handleIncrement}
          accessibilityRole="button"
          accessibilityLabel="Increase">
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 14,
  },
  valueDisplayCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  valueBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  valueNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: '#073828',
    letterSpacing: -1,
  },
  unitText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  rulerControlBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  adjustBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  btnText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#073828',
  },
  rulerContainer: {
    flex: 1,
    height: 64,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  centerIndicator: {
    position: 'absolute',
    left: '50%',
    top: 2,
    width: 14,
    height: 38,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 10,
    marginLeft: -7,
  },
  pointerNeedle: {
    width: 3,
    height: 32,
    backgroundColor: '#059669',
    borderRadius: 1.5,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  pointerCap: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#073828',
    marginTop: -4,
  },
  ticksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 8,
  },
  tickItem: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 52,
  },
  tickLine: {
    backgroundColor: '#D1D5DB',
    borderRadius: 1,
    marginBottom: 4,
  },
  minorTick: {
    width: 2,
    height: 14,
  },
  majorTick: {
    width: 2.5,
    height: 26,
    backgroundColor: '#9CA3AF',
  },
  selectedTick: {
    backgroundColor: '#073828',
    height: 30,
  },
  tickText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedTickText: {
    color: '#073828',
    fontWeight: '800',
  },
});
