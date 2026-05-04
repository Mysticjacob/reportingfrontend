import React, { useEffect, useState, useCallback } from 'react';
import {
  View, ScrollView, Text, StyleSheet,
  RefreshControl, Platform, TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { api } from '../../services/api';
import { colors, spacing } from '../../theme/theme';

const ACCENT     = colors.primary ?? '#4F8EF7';
const BG         = '#F5F7FA';
const CARD_BG    = '#FFFFFF';
const TEXT_DARK  = '#0F1117';
const TEXT_MID   = '#4A5568';
const TEXT_LIGHT = '#8A94A6';
const BORDER     = '#E8ECF0';
const SUCCESS    = '#16A34A';
const AMBER      = '#D97706';

const CARD_ICON = 'book-open';

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={s.infoRow}>
      <View style={s.infoIconWrap}>
        <Icon name={icon} size={12} color={TEXT_LIGHT} />
      </View>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function CourseCard({ course }) {
  const hasLecturer = !!course.lecturerName;

  return (
    <View style={s.card}>
      {/* ── header ── */}
      <View style={s.cardHeader}>
        <View style={s.iconWrap}>
          <Icon name={CARD_ICON} size={20} color={ACCENT} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={s.courseName} numberOfLines={2}>
            {course.className || course.courseName}
          </Text>
          <View style={s.chipRow}>
            <View style={s.chip}>
              <Text style={s.chipText}>
                {course.courseCode || '—'}
              </Text>
            </View>
            {course.stream ? (
              <View style={s.chipStream}>
                <Text style={s.chipStreamText}>{course.stream}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={s.details}>
        <InfoRow icon="map-pin" label="Venue"    value={course.venue         || 'TBA'} />
        <InfoRow icon="clock"   label="Schedule" value={course.scheduledTime || 'TBA'} />
        <InfoRow icon="user"    label="Lecturer" value={course.lecturerName  || 'Unassigned'} />
        <InfoRow icon="users"   label="Students" value={course.totalStudents ? `${course.totalStudents} registered` : null} />
      </View>

      <View style={s.statusRow}>
        <View style={[
          s.statusPill,
          { backgroundColor: hasLecturer ? SUCCESS + '12' : AMBER + '12' },
        ]}>
          <Icon
            name={hasLecturer ? 'check-circle' : 'alert-circle'}
            size={11}
            color={hasLecturer ? SUCCESS : AMBER}
          />
          <Text style={[s.statusText, { color: hasLecturer ? SUCCESS : AMBER }]}>
            {hasLecturer ? 'Lecturer assigned' : 'No lecturer assigned'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function StreamPill({ label, active, onPress }) {
  return (
    <Text
      onPress={onPress}
      style={[s.pill, active && s.pillActive]}
    >
      {label}
    </Text>
  );
}

export default function PRLCourseScreen() {
  const [courses, setCourses]    = useState([]);
  const [loading, setLoading]    = useState(true);
  const [refreshing, setRefresh] = useState(false);
  const [query, setQuery]        = useState('');
  const [stream, setStream]      = useState('All');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/courses');
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefresh(true);
    await load();
    setRefresh(false);
  }, [load]);

  const streams = ['All', ...Array.from(
    new Set(courses.map(c => c.stream).filter(Boolean))
  ).sort()];

  const filtered = courses.filter(c => {
    const matchStream = stream === 'All' || c.stream === stream;
    if (!matchStream) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (c.className    || '').toLowerCase().includes(q) ||
      (c.courseName   || '').toLowerCase().includes(q) ||
      (c.courseCode   || '').toLowerCase().includes(q) ||
      (c.venue        || '').toLowerCase().includes(q) ||
      (c.lecturerName || '').toLowerCase().includes(q)
    );
  });

  return (
    <View style={s.root}>

      <View style={s.pageHeader}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.pageTitle}>All Courses</Text>
            <Text style={s.pageSub}>Read-only overview of all courses</Text>
          </View>

          <View style={s.countBadge}>
            <Text style={s.countBadgeText}>{loading ? '…' : courses.length}</Text>
            <Text style={s.countBadgeLabel}>total</Text>
          </View>
        </View>

        <View style={s.searchWrap}>
          <Icon name="search" size={14} color={TEXT_LIGHT} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by name, code, venue, lecturer…"
            placeholderTextColor={TEXT_LIGHT}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Icon name="x" size={14} color={TEXT_LIGHT} onPress={() => setQuery('')} />
          )}
        </View>

        {streams.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.pillRow}
          >
            {streams.map(st => (
              <StreamPill
                key={st}
                label={st}
                active={stream === st}
                onPress={() => setStream(st)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
      >
        {loading ? (
          [1, 2, 3].map(i => <View key={i} style={s.skeleton} />)
        ) : filtered.length === 0 ? (
          <View style={s.empty}>
            <Icon name="calendar" size={40} color={TEXT_LIGHT} />
            <Text style={s.emptyTitle}>No classes found</Text>
            <Text style={s.emptySub}>
              {courses.length === 0
                ? 'No modules have been created yet.'
                : 'Try adjusting your search or filter.'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={s.resultLabel}>
              Showing {filtered.length} of {courses.length} class{courses.length !== 1 ? 'es' : ''}
            </Text>
            {filtered.map((c, i) => (
              <CourseCard key={c.id || i} course={c} />
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  pageHeader: {
    backgroundColor: CARD_BG,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: 22, fontWeight: '800', color: TEXT_DARK,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  pageSub: { fontSize: 12, color: TEXT_LIGHT, marginTop: 3 },

  countBadge: {
    alignItems: 'center',
    backgroundColor: ACCENT + '12',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  countBadgeText:  { fontSize: 20, fontWeight: '900', color: ACCENT },
  countBadgeLabel: { fontSize: 9, fontWeight: '700', color: ACCENT, marginTop: 1, letterSpacing: 0.5 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F1F5F9', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 13, color: TEXT_DARK, padding: 0 },

  pillRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, fontSize: 12, fontWeight: '700',
    color: TEXT_MID, backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  pillActive: { backgroundColor: ACCENT, color: '#fff' },

  scroll:      { padding: spacing?.lg ?? 20 },
  resultLabel: { fontSize: 12, color: TEXT_LIGHT, fontWeight: '600', marginBottom: 14 },

  card: {
    backgroundColor: CARD_BG, borderRadius: 18,
    padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: BORDER,
    borderLeftWidth: 4, borderLeftColor: ACCENT,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  iconWrap: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, backgroundColor: ACCENT + '18',
  },
  courseName: { fontSize: 15, fontWeight: '800', color: TEXT_DARK, marginBottom: 6, lineHeight: 20 },
  chipRow:    { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip:       { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: ACCENT + '15' },
  chipText:   { fontSize: 10, fontWeight: '700', color: ACCENT },
  chipStream:     { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#F1F5F9' },
  chipStreamText: { fontSize: 10, fontWeight: '700', color: TEXT_MID },

  details:      { gap: 8, marginBottom: 14 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoIconWrap: { width: 18, alignItems: 'center' },
  infoLabel:    { fontSize: 11, fontWeight: '600', color: TEXT_LIGHT, width: 60 },
  infoValue:    { flex: 1, fontSize: 13, color: TEXT_MID, fontWeight: '500' },

  statusRow:  { borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 12 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  skeleton: {
    height: 160, backgroundColor: '#E8ECF2',
    borderRadius: 18, marginBottom: 14, opacity: 0.5,
  },

  empty:      { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MID, marginTop: 14 },
  emptySub:   { fontSize: 13, color: TEXT_LIGHT, marginTop: 8, textAlign: 'center', paddingHorizontal: 30, lineHeight: 20 },
});