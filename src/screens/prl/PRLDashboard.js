import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, ScrollView, Text, StyleSheet,
  RefreshControl, ActivityIndicator, Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { api } from '../../services/api';
import { colors, spacing } from '../../theme/theme';

const PRIMARY = colors.primary || '#4F8EF7';
const SURFACE = '#FFFFFF';
const BG      = '#F4F7FB';
const BORDER  = '#E5EAF0';
const TEXT    = '#0F172A';
const MUTED   = '#64748B';
const SUCCESS = '#10B981';
const INFO    = '#3B82F6';
const ACCENT  = '#8B5CF6';

const formatRelative = (iso) => {
  if (!iso) return '';
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)    return 'just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch { return ''; }
};

export default function PRLDashboard() {
  const [reports, setReports]     = useState([]);
  const [courses, setCourses]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefresh]  = useState(false);
  const [error, setError]         = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [rRes, cRes] = await Promise.allSettled([
        api.get('/reports'),
        api.get('/courses'),   
      ]);

      if (rRes.status === 'fulfilled') {
        setReports(Array.isArray(rRes.value.data) ? rRes.value.data : []);
      } else {
        console.warn('Reports fetch failed:', rRes.reason?.message);
        setReports([]);
      }

      if (cRes.status === 'fulfilled') {
        setCourses(Array.isArray(cRes.value.data) ? cRes.value.data : []);
      } else {
        console.warn('Courses fetch failed:', cRes.reason?.message);
        setCourses([]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefresh(true);
    await load();
    setRefresh(false);
  }, [load]);

  const reviewedCount = useMemo(
    () => reports.filter(r => r.prlFeedback).length,
    [reports]
  );

  const reviewRate = reports.length
    ? Math.round((reviewedCount / reports.length) * 100)
    : 0;

  const latest = useMemo(() => {
    return [...reports]
      .sort((a, b) => {
        const ta = new Date(a.createdAt || a.dateOfLecture || 0).getTime();
        const tb = new Date(b.createdAt || b.dateOfLecture || 0).getTime();
        return tb - ta;
      })
      .slice(0, 5);
  }, [reports]);

  const stats = [
    {
      label: 'Reports',
      value: reports.length,
      icon:  'file-text',
      tint:  INFO,
      hint:  'Total submissions',
    },
    {
      label: 'Reviewed',
      value: reviewedCount,
      icon:  'check-circle',
      tint:  SUCCESS,
      hint:  `${reviewRate}% completion`,
    },
    {
      label: 'Classes',
      value: courses.length,
      icon:  'calendar',
      tint:  ACCENT,
      hint:  'Active modules',
    },
  ];

  const insightText = () => {
    if (loading) return 'Loading data…';
    if (reports.length === 0) return 'No reports submitted yet. Activity will appear here once lecturers start reporting.';
    if (reviewedCount === reports.length) return 'All reports reviewed. Your stream is fully up to date.';
    const pending = reports.length - reviewedCount;
    return `${reviewedCount} of ${reports.length} reports reviewed. ${pending} still pending your feedback.`;
  };

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />
        }
      >
        <View style={s.hero}>
          <Text style={s.heroTitle}>Stream Overview</Text>
          <Text style={s.heroText}>
            Monitor reports, feedback progress and class activity across your department.
          </Text>

          <View style={s.heroRow}>
            <HeroStat label="Total Reports" value={loading ? '…' : String(reports.length)} />
            <View style={s.heroDivider} />
            <HeroStat label="Reviewed"     value={loading ? '…' : String(reviewedCount)} />
            <View style={s.heroDivider} />
            <HeroStat label="Completion"   value={loading ? '…' : `${reviewRate}%`} />
          </View>
        </View>

        <SectionHead title="Overview" sub="Your stream at a glance" />

        <View style={s.grid}>
          {stats.map((item, i) => (
            <View key={i} style={s.statCard}>
              <View style={[s.iconBox, { backgroundColor: item.tint + '14' }]}>
                <Icon name={item.icon} size={20} color={item.tint} />
              </View>
              {loading
                ? <ActivityIndicator size="small" color={item.tint} style={{ marginVertical: 6 }} />
                : <Text style={s.statValue}>{item.value}</Text>
              }
              <Text style={s.statLabel}>{item.label}</Text>
              <Text style={s.statHint}>{item.hint}</Text>
            </View>
          ))}
        </View>

        <View style={s.insightCard}>
          <View style={s.insightTop}>
            <View style={s.insightIcon}>
              <Icon name="activity" size={16} color={PRIMARY} />
            </View>
            <Text style={s.insightTitle}>Quick Insight</Text>
          </View>

          <Text style={s.insightText}>{insightText()}</Text>

          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${loading ? 0 : reviewRate}%` }]} />
          </View>

          {!loading && reports.length > 0 && (
            <Text style={s.progressLabel}>
              {reviewedCount}/{reports.length} reviewed
            </Text>
          )}
        </View>

        <SectionHead title="Latest Reports" sub="Most recent submissions" />

        {loading ? (
          <ActivityIndicator color={PRIMARY} style={{ marginVertical: 24 }} />
        ) : latest.length === 0 ? (
          <View style={s.empty}>
            <Icon name="inbox" size={28} color={MUTED} />
            <Text style={s.emptyText}>No reports yet</Text>
            <Text style={s.emptySub}>Reports submitted by lecturers will appear here.</Text>
          </View>
        ) : (
          latest.map((r, i) => {
            const reviewed = !!r.prlFeedback;
            const present  = Number(r.actualStudentsPresent)   || 0;
            const total    = Number(r.totalRegisteredStudents)  || 0;
            const pct      = total > 0 ? Math.round((present / total) * 100) : null;

            return (
              <View key={r.id || i} style={s.card}>
                <View style={s.cardTop}>
                  <View style={[s.cardIcon, { backgroundColor: (reviewed ? SUCCESS : INFO) + '14' }]}>
                    <Icon
                      name={reviewed ? 'check-circle' : 'file-text'}
                      size={16}
                      color={reviewed ? SUCCESS : INFO}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle} numberOfLines={1}>
                      {r.courseName || 'Untitled course'}
                    </Text>
                    <Text style={s.cardMeta} numberOfLines={1}>
                      {r.lecturerName || 'Unknown lecturer'}
                      {r.className ? ` • ${r.className}` : ''}
                      {r.dateOfLecture ? ` • ${r.dateOfLecture}` : ''}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={s.timeText}>{formatRelative(r.createdAt || r.dateOfLecture)}</Text>
                    <View style={[s.badge, { backgroundColor: reviewed ? SUCCESS + '18' : INFO + '18' }]}>
                      <Text style={[s.badgeText, { color: reviewed ? SUCCESS : INFO }]}>
                        {reviewed ? 'Reviewed' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </View>

                {pct !== null && (
                  <View style={s.attendRow}>
                    <Icon name="users" size={11} color={MUTED} />
                    <Text style={s.attendText}>{present}/{total} students</Text>
                    <View style={s.miniTrack}>
                      <View style={[s.miniFill, { width: `${pct}%`, backgroundColor: pct >= 75 ? SUCCESS : pct >= 50 ? '#F59E0B' : '#EF4444' }]} />
                    </View>
                    <Text style={s.attendPct}>{pct}%</Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function HeroStat({ label, value }) {
  return (
    <View style={s.heroMeta}>
      <Text style={s.heroMetaValue}>{value}</Text>
      <Text style={s.heroMetaLabel}>{label}</Text>
    </View>
  );
}

function SectionHead({ title, sub }) {
  return (
    <View style={s.sectionHead}>
      <Text style={s.sectionTitle}>{title}</Text>
      {sub ? <Text style={s.sectionSub}>{sub}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll:    { padding: spacing?.lg || 20 },

  hero: {
    backgroundColor: PRIMARY, borderRadius: 24, padding: 24, marginBottom: 22,
    shadowColor: PRIMARY, shadowOpacity: 0.25, shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  heroTitle:      { fontSize: 24, fontWeight: '900', color: '#fff' },
  heroText:       { marginTop: 8, color: '#E5EDFF', fontSize: 13, lineHeight: 20 },
  heroRow:        { flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8 },
  heroMeta:       { flex: 1, alignItems: 'center' },
  heroMetaValue:  { color: '#fff', fontSize: 18, fontWeight: '900' },
  heroMetaLabel:  { color: '#E5EDFF', fontSize: 11, marginTop: 2, fontWeight: '600' },
  heroDivider:    { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },

  sectionHead:  { marginBottom: 12, marginTop: 4, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: TEXT },
  sectionSub:   { fontSize: 12, color: MUTED, marginTop: 2 },

  grid:      { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard:  { width: '32%', backgroundColor: SURFACE, borderRadius: 18, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: BORDER },
  iconBox:   { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: '900', color: TEXT },
  statLabel: { marginTop: 2, fontSize: 12, color: TEXT, fontWeight: '700' },
  statHint:  { marginTop: 2, fontSize: 10, color: MUTED, fontWeight: '500' },

  insightCard:  { backgroundColor: SURFACE, borderRadius: 22, padding: 20, marginTop: 4, marginBottom: 8, borderWidth: 1, borderColor: BORDER },
  insightTop:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  insightIcon:  { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY + '14' },
  insightTitle: { fontSize: 14, fontWeight: '800', color: TEXT },
  insightText:  { marginTop: 12, fontSize: 13, color: MUTED, lineHeight: 20 },
  progressTrack:{ marginTop: 14, height: 8, backgroundColor: '#EEF2F7', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: PRIMARY, borderRadius: 999 },
  progressLabel:{ marginTop: 6, fontSize: 11, color: MUTED, fontWeight: '600', textAlign: 'right' },

  card:    { backgroundColor: SURFACE, borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: BORDER },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon:{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle:{ fontSize: 13, fontWeight: '800', color: TEXT },
  cardMeta: { fontSize: 11, color: MUTED, marginTop: 2 },
  timeText: { fontSize: 10, color: MUTED, fontWeight: '600' },
  badge:    { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:{ fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },

  attendRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: BORDER },
  attendText: { fontSize: 11, color: MUTED, fontWeight: '600' },
  miniTrack:  { flex: 1, height: 4, backgroundColor: '#EEF2F7', borderRadius: 999, overflow: 'hidden' },
  miniFill:   { height: '100%', borderRadius: 999 },
  attendPct:  { fontSize: 11, color: MUTED, fontWeight: '700', width: 32, textAlign: 'right' },

  empty:    { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText:{ color: MUTED, fontSize: 13, fontWeight: '700' },
  emptySub: { color: MUTED, fontSize: 12, textAlign: 'center', paddingHorizontal: 20 },
});