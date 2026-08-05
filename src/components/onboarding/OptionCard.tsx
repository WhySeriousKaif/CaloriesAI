import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/components/ui/pressable';

interface OptionCardProps {
  title: string;
  description?: string;
  icon?: string;
  iconNode?: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
}

export function OptionCard({
  title,
  description,
  icon,
  iconNode,
  selected,
  onSelect,
}: OptionCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        selected ? styles.selectedCard : styles.unselectedCard,
        pressed && styles.pressed,
      ]}
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      {/* Icon Graphic */}
      {iconNode ? (
        <View style={[styles.iconBox, selected && styles.selectedIconBox]}>
          {iconNode}
        </View>
      ) : icon ? (
        <View style={[styles.iconBox, selected && styles.selectedIconBox]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
      ) : null}

      {/* Content */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, selected && styles.selectedTitle]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, selected && styles.selectedDescription]}>
            {description}
          </Text>
        ) : null}
      </View>

      {/* Selected Checkmark Badge */}
      {selected ? (
        <View style={styles.checkmarkBadge}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 12,
  },
  unselectedCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  selectedCard: {
    backgroundColor: '#F0FDF4', // Mint light tint matching reference design
    borderColor: '#073828',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  selectedIconBox: {
    backgroundColor: '#DCFCE7',
  },
  iconText: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A3527',
    marginBottom: 2,
    includeFontPadding: false,
  },
  selectedTitle: {
    color: '#073828',
  },
  description: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563', // High contrast readable gray
    includeFontPadding: false,
  },
  selectedDescription: {
    color: '#047857',
  },
  checkmarkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#073828',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
