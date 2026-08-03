import { Info, X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Radius } from '@/constants/design';

type CalorieInfoModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function CalorieInfoModal({ visible, onClose }: CalorieInfoModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
            <X size={20} color={Palette.textSecondary} />
          </Pressable>

          <View style={styles.iconCircle}>
            <Info size={32} color={Palette.brand} />
          </View>

          <Text style={styles.title}>Target Calculation</Text>
          <Text style={styles.subtitle}>
            Your daily calorie and macro goals are personalized using science-backed formulas.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. BMR & Energy Expenditure</Text>
            <Text style={styles.sectionText}>
              Calculated using the Mifflin-St Jeor formula based on your age, gender, height, and current weight.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Goal Adjustment</Text>
            <Text style={styles.sectionText}>
              Adjusted for your target weight and weekly pace (deficit for weight loss, surplus for muscle gain).
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Macro Ratio</Text>
            <Text style={styles.sectionText}>
              Optimized macro splits (Protein ~30%, Carbs ~45%, Fat ~25%) to preserve muscle and maximize energy.
            </Text>
          </View>

          <Pressable style={styles.gotItButton} onPress={onClose}>
            <Text style={styles.gotItText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Palette.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Palette.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  section: {
    backgroundColor: Palette.background,
    padding: 12,
    borderRadius: Radius.md,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.text,
    marginBottom: 2,
  },
  sectionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Palette.textSecondary,
    lineHeight: 17,
  },
  gotItButton: {
    backgroundColor: Palette.brand,
    paddingVertical: 14,
    borderRadius: Radius.pill,
    alignItems: 'center',
    marginTop: 10,
  },
  gotItText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.onBrand,
  },
});
