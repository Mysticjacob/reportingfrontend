import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme/theme';

export default function Button({ title, onPress, variant = 'primary', loading, disabled, style }) {
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.base,
        isOutline && styles.outline,
        isGhost && styles.ghost,
        !isOutline && !isGhost && styles.primary,
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isGhost ? colors.text : colors.textInverse} />
      ) : (
        <Text style={[styles.text, (isOutline || isGhost) && { color: colors.text }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48, paddingHorizontal: spacing.lg, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
  },
  primary: { backgroundColor: colors.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.borderStrong },
  ghost: { backgroundColor: 'transparent' },
  text: { color: colors.textInverse, fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
});
