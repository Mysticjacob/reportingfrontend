import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/theme';

export default function EmptyState({ title, subtitle }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.t}>{title}</Text>
      {subtitle ? <Text style={styles.s}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.xl, alignItems: 'center' },
  t: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  s: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
