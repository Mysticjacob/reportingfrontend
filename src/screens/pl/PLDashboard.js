import React, { useEffect, useState, useMemo } from 'react';

import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';

import Header from '../../components/Header';
import { api } from '../../services/api';
import { colors, spacing } from '../../theme/theme';

const PRIMARY = colors.primary || '#4F8EF7';
const SURFACE = '#FFFFFF';
const BG = '#F4F7FB';
const BORDER = '#E5EAF0';
const TEXT = '#0F172A';
const MUTED = '#64748B';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const DANGER = '#EF4444';
const INFO = '#3B82F6';

const formatRelative = (iso) => {
  if (!iso) return '';
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return '';
  }
};

export default function PLDashboard() {
  const navigation = useNavigation();

  const [stats, setStats] = useState({
    courses: 0,
    lecturers: 0,
    reports: 0,
    ratings: 0,
  });
  const [recentReports, setRecentReports] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [a, b, c, d] = await Promise.all([
        api.get('/courses'),
        api.get('/users/lecturers'),
        api.get('/reports'),
        api.get('/ratings'),
      ]);

      setStats({
        courses: a.data.length,
        lecturers: b.data.length,
        reports: c.data.length,
        ratings: d.data.length,
      });

      const sortedReports = [...c.data].sort((x, y) => {
        const tx = new Date(x.createdAt || x.dateOfLecture || 0).getTime();
        const ty = new Date(y.createdAt || y.dateOfLecture || 0).getTime();
        return ty - tx;
      });
      setRecentReports(sortedReports.slice(0, 4));
      setRatings(d.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const reviewedCount = useMemo(
    () => recentReports.filter((r) => r.prlFeedback).length,
    [recentReports]
  );

  const cards = [
    {
      label: 'Courses',
      value: stats.courses,
      icon: 'book-open',
      tint: INFO,
      hint: 'Active courses',
    },
    {
      label: 'Lecturers',
      value: stats.lecturers,
      icon: 'users',
      tint: SUCCESS,
      hint: 'Faculty members',
    },
    {
      label: 'Reports',
      value: stats.reports,
      icon: 'file-text',
      tint: WARNING,
      hint: 'Submissions',
    },
    {
      label: 'Reviews',
      value: stats.ratings,
      icon: 'message-square',
      tint: DANGER,
      hint: 'Student feedback',
    },
  ];

  const goTo = (route) => {
    try {
      navigation.navigate(route);
    } catch {}
  };

  const quickActions = [
    { label: 'Courses',   icon: 'book-open',   tint: INFO,    route: 'Courses' },
    { label: 'Lecturers', icon: 'user-plus',   tint: SUCCESS, route: 'Lecturers' },
    { label: 'Reports',   icon: 'file-text',   tint: WARNING, route: 'Reports' },
    { label: 'Ratings',   icon: 'bar-chart-2', tint: DANGER,  route: 'Ratings' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY}
          />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Welcome back</Text>
          <Text style={styles.heroText}>
            Monitor modules, lecturers, reports and student feedback in one place.
          </Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaValue}>{stats.reports}</Text>
              <Text style={styles.heroMetaLabel}>Total Reports</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaValue}>{reviewedCount}</Text>
              <Text style={styles.heroMetaLabel}>Recently Reviewed</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaValue}>{stats.lecturers}</Text>
              <Text style={styles.heroMetaLabel}>Lecturers</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.sectionSub}>Key metrics at a glance</Text>
        </View>

        <View style={styles.grid}>
          {cards.map((item, index) => (
            <View key={index} style={styles.card}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: item.tint + '14' },
                ]}
              >
                <Icon name={item.icon} size={20} color={item.tint} />
              </View>

              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={item.tint}
                  style={{ marginVertical: 6 }}
                />
              ) : (
                <Text style={styles.value}>{item.value}</Text>
              )}

              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.hint}>{item.hint}</Text>
            </View>
          ))}
        </View>

        <View style={styles.quickCard}>
          <View style={styles.quickTop}>
            <View style={styles.quickTopLeft}>
              <Icon name="zap" size={18} color={PRIMARY} />
              <Text style={styles.quickTitle}>Quick Actions</Text>
            </View>
            <Text style={styles.quickHint}>Tap to navigate</Text>
          </View>

          <View style={styles.quickGrid}>
            {quickActions.map((qa, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.85}
                onPress={() => goTo(qa.route)}
                style={styles.quickItem}
              >
                <View
                  style={[
                    styles.quickIcon,
                    { backgroundColor: qa.tint + '14' },
                  ]}
                >
                  <Icon name={qa.icon} size={18} color={qa.tint} />
                </View>
                <Text style={styles.quickItemText}>{qa.label}</Text>
                <Icon name="chevron-right" size={16} color={MUTED} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.activityHead}>
            <View style={styles.quickTopLeft}>
              <Icon name="activity" size={18} color={PRIMARY} />
              <Text style={styles.quickTitle}>Recent Reports</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => goTo('Reports')}>
              <Text style={styles.linkText}>View all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              color={PRIMARY}
              style={{ marginVertical: 24 }}
            />
          ) : recentReports.length === 0 ? (
            <View style={styles.empty}>
              <Icon name="inbox" size={28} color={MUTED} />
              <Text style={styles.emptyText}>No recent reports</Text>
            </View>
          ) : (
            recentReports.map((r, i) => {
              const reviewed = !!r.prlFeedback;
              return (
                <View
                  key={r.id || i}
                  style={[
                    styles.activityItem,
                    i === recentReports.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View
                    style={[
                      styles.activityDot,
                      { backgroundColor: reviewed ? SUCCESS : WARNING },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityTitle} numberOfLines={1}>
                      {r.courseName || r.courseId || 'Untitled course'}
                    </Text>
                    <Text style={styles.activitySub} numberOfLines={1}>
                      {(r.lecturerName || 'Unknown lecturer') +
                        (r.className ? ` • ${r.className}` : '')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor:
                            (reviewed ? SUCCESS : WARNING) + '18',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: reviewed ? SUCCESS : WARNING },
                        ]}
                      >
                        {reviewed ? 'Reviewed' : 'Pending'}
                      </Text>
                    </View>
                    <Text style={styles.activityTime}>
                      {formatRelative(r.createdAt || r.dateOfLecture)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { padding: spacing?.lg || 20 },

  hero: {
    backgroundColor: PRIMARY,
    borderRadius: 24,
    padding: 24,
    marginBottom: 22,
    shadowColor: PRIMARY,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff' },
  heroText: {
    fontSize: 13,
    color: '#E5EDFF',
    marginTop: 8,
    lineHeight: 20,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  heroMeta: { flex: 1, alignItems: 'center' },
  heroMetaValue: { color: '#fff', fontSize: 18, fontWeight: '900' },
  heroMetaLabel: {
    color: '#E5EDFF',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  heroDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  sectionHead: { marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: TEXT },
  sectionSub: { fontSize: 12, color: MUTED, marginTop: 2 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  value: { fontSize: 26, fontWeight: '900', color: TEXT },
  label: { marginTop: 4, fontSize: 13, color: TEXT, fontWeight: '700' },
  hint: { marginTop: 2, fontSize: 11, color: MUTED, fontWeight: '500' },

  quickCard: {
    backgroundColor: SURFACE,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 10,
  },
  quickTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickTitle: { fontSize: 15, fontWeight: '800', color: TEXT },
  quickHint: { fontSize: 11, color: MUTED, fontWeight: '600' },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  quickItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickItemText: { fontSize: 13, fontWeight: '700', color: TEXT, flex: 1 },

  activityCard: {
    backgroundColor: SURFACE,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 16,
  },
  activityHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  linkText: { fontSize: 12, color: PRIMARY, fontWeight: '700' },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityTitle: { fontSize: 13, fontWeight: '700', color: TEXT },
  activitySub: { fontSize: 11, color: MUTED, marginTop: 2 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  activityTime: { fontSize: 10, color: MUTED, marginTop: 4, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyText: { color: MUTED, fontSize: 13, fontWeight: '600' },
});
