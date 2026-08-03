import { Flame, Sparkles, X } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Radius } from '@/constants/design';

type StreakModalProps = {
  visible: boolean;
  onClose: () => void;
  streakCount?: number;
};

export function StreakModal({ visible, onClose, streakCount = 1 }: StreakModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={12}>
            <X size={20} color={Palette.textSecondary} />
          </Pressable>

          <View style={styles.flameCircle}>
            <Flame size={48} color="#EF4444" fill="#EF4444" />
          </View>

          <Text style={styles.title}>{streakCount} Day Streak!</Text>
          <Text style={styles.subtitle}>
            You&apos;re building a great habit! Log your meals daily to keep your flame burning.
          </Text>

          <View style={styles.statBox}>
            <Sparkles size={20} color={Palette.brand} />
            <Text style={styles.statText}>Every meal logged keeps your momentum alive.</Text>
          </View>

          <Pressable style={styles.gotItButton} onPress={onClose}>
            <Text style={styles.gotItText}>Keep it going!</Text>
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
    maxWidth: 360,
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    padding: 24,
    alignItems: 'center',
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
  flameCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.brandTint,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    marginBottom: 20,
    width: '100%',
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.brand,
    flex: 1,
  },
  gotItButton: {
    backgroundColor: Palette.brand,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radius.pill,
    width: '100%',
    alignItems: 'center',
  },
  gotItText: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.onBrand,
  },
});
