import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/theme';

export default function StatTile({ label, value }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1, backgroundColor: colors.primary, padding: spacing.lg,
    borderRadius: radius.lg, marginRight: spacing.sm, minHeight: 90, justifyContent: 'space-between',
  },
  value: { fontSize: 28, fontWeight: '800', color: colors.textInverse },
  label: { fontSize: 11, color: colors.textInverse, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
});
