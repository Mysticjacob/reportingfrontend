import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/theme';

export default function Badge({ label, dark }) {
  return (
    <View style={[styles.b, dark && { backgroundColor: colors.primary }]}>
      <Text style={[styles.t, dark && { color: colors.textInverse }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  b: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.borderStrong, alignSelf: 'flex-start' },
  t: { fontSize: 11, fontWeight: '700', color: colors.text, letterSpacing: 0.5, textTransform: 'uppercase' },
});
