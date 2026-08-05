import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/ui/pressable';

interface VerticalScalePickerProps {
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  unit: string;
}

export function VerticalScalePicker({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: VerticalScalePickerProps) {
  const handleDecrement = () => {
    const newVal = Math.max(min, Number((value - step).toFixed(1)));
    onChange(newVal);
  };

  const handleIncrement = () => {
    const newVal = Math.min(max, Number((value + step).toFixed(1)));
    onChange(newVal);
  };

  // Generate 5 tick numbers around current value
  const numSteps = 2;
  const tickValues: number[] = [];

  for (let i = numSteps; i >= -numSteps; i--) {
    const tVal = Number((value + i * step * 5).toFixed(1));
    if (tVal >= min && tVal <= max) {
      tickValues.push(tVal);
    }
  }

  return (
    <View style={styles.container}>
      {/* Quick Adjust Buttons Header */}
      <View style={styles.controlsRow}>
        <Pressable
          style={({ pressed }) => [styles.adjustBtn, pressed && styles.pressed]}
          onPress={handleIncrement}
          accessibilityRole="button"
          accessibilityLabel="Increase">
          <Text style={styles.btnText}>▲</Text>
        </Pressable>
        <Text style={styles.valueReadout}>
          {step < 1 ? value.toFixed(1) : Math.round(value)} {unit}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.adjustBtn, pressed && styles.pressed]}
          onPress={handleDecrement}
          accessibilityRole="button"
          accessibilityLabel="Decrease">
          <Text style={styles.btnText}>▼</Text>
        </Pressable>
      </View>

      {/* Vertical Ruler Track */}
      <View style={styles.rulerTrackContainer}>
        {/* Central Indicator Line & Badge */}
        <View style={styles.indicatorOverlay}>
          <View style={styles.badgeBox}>
            <Text style={styles.badgeText}>
              {step < 1 ? value.toFixed(1) : Math.round(value)}
            </Text>
          </View>
          <View style={styles.greenLine} />
          <View style={styles.greenDot} />
        </View>

        {/* Ticks List */}
        <View style={styles.ticksList}>
          {tickValues.map((tVal) => {
            const isSelected = Math.abs(tVal - value) < (step * 5) / 2;
            return (
              <Pressable
                key={tVal.toString()}
                style={styles.tickRow}
                onPress={() => onChange(tVal)}>
                <View style={styles.tickLinesBox}>
                  <View style={[styles.tickLine, isSelected && styles.selectedTickLine]} />
                  <View style={styles.minorTickLine} />
                  <View style={styles.minorTickLine} />
                </View>
                <Text style={[styles.tickLabel, isSelected && styles.selectedTickLabel]}>
                  {step < 1 ? tVal.toFixed(1) : Math.round(tVal)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  valueReadout: {
    fontSize: 22,
    fontWeight: '800',
    color: '#073828',
  },
  adjustBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#073828',
  },
  rulerTrackContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#FAFAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
    justifyContent: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  indicatorOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: '50%',
    marginTop: -16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeBox: {
    backgroundColor: '#073828',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  greenLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#073828',
    borderRadius: 1.5,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#073828',
    marginLeft: -2,
  },
  ticksList: {
    flex: 1,
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  tickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  tickLinesBox: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  tickLine: {
    width: 32,
    height: 2,
    backgroundColor: '#D1D5DB',
  },
  selectedTickLine: {
    backgroundColor: '#073828',
    width: 44,
    height: 3,
  },
  minorTickLine: {
    width: 16,
    height: 1.5,
    backgroundColor: '#E5E7EB',
  },
  tickLabel: {
    width: 50,
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  selectedTickLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#073828',
  },
});
