import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, typography } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
const ACCENT       = colors.primary ?? '#4F8EF7';
const BG           = colors.bg      ?? '#FFFFFF';
const BORDER       = colors.border  ?? '#E8ECF0';
const TEXT_PRIMARY = colors.text    ?? '#0F1117';
const TEXT_MUTED   = colors.textMuted ?? '#8A94A6';

const ROLE_COLORS = {
  student:  { bg: '#EEF4FF', text: '#3B6FD4' },
  lecturer: { bg: '#F0FDF4', text: '#2D7D4F' },
  prl:      { bg: '#FFF7ED', text: '#B45309' },
  pl:       { bg: '#FDF4FF', text: '#7C3AED' },
};
export default function Header({ title, subtitle }) {
  const { user, logout } = useAuth();

  const roleStyle = user?.role ? ROLE_COLORS[user.role] ?? ROLE_COLORS.student : null;

  return (
    <View style={styles.header}>
      {/* Left: title block */}
      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Right: role badge + logout */}
      {user && (
        <View style={styles.rightCluster}>
          {/* Role badge */}
          {user.role && roleStyle && (
            <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
              <Icon name="shield" size={9} color={roleStyle.text} style={{ marginRight: 4 }} />
              <Text style={[styles.roleBadgeText, { color: roleStyle.text }]}>
                {user.role.toUpperCase()}
              </Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Logout button */}
          <TouchableOpacity
            onPress={logout}
            style={styles.logoutBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Icon name="log-out" size={16} color={TEXT_MUTED} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg ?? 20,
    paddingTop: spacing.lg ?? 20,
    paddingBottom: spacing.md ?? 14,
    backgroundColor: BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  titleBlock: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    letterSpacing: 0.2,
    lineHeight: 26,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: TEXT_MUTED,
    letterSpacing: 0.3,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: BORDER,
  },
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});