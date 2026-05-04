import React, { useEffect, useState, useCallback } from 'react';
import {
  View, ScrollView, Text, StyleSheet,
  RefreshControl, Platform, TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { colors, spacing } from '../../theme/theme';

const ACCENT     = colors.primary ?? '#4F8EF7';
const BG         = '#F5F7FA';
const CARD_BG    = '#FFFFFF';
const TEXT_DARK  = '#0F1117';
const TEXT_MID   = '#4A5568';
const TEXT_LIGHT = '#8A94A6';
const BORDER     = '#E8ECF0';

const CARD_ICON = 'book-open';

function MetaRow({ icon, value }) {
  if (!value) return null;
  return (
    <View style={s.metaRow}>
      <Icon name={icon} size={12} color={TEXT_LIGHT} />
      <Text style={s.metaText} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ClassCard({ course, role }) {
  const isLecturer = role === 'lecturer';

  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.iconWrap}>
          <Icon name={CARD_ICON} size={18} color={ACCENT} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={s.moduleName} numberOfLines={1}>
            {course.className || course.courseName}
          </Text>

          <View style={s.codePill}>
            <Text style={s.codeText}>
              {course.courseCode || '—'}
            </Text>
          </View>
        </View>
      </View>

      <View style={s.details}>
        <MetaRow icon="map-pin"  value={course.venue         || 'Venue TBA'} />
        <MetaRow icon="clock"    value={course.scheduledTime || 'Time TBA'} />
        {!isLecturer && (
          <MetaRow icon="user"   value={course.lecturerName  || 'Lecturer unassigned'} />
        )}
        {(role === 'pl' || role === 'prl') && course.stream && (
          <MetaRow icon="layers" value={course.stream} />
        )}
        {(role === 'pl' || role === 'prl') && (
          <MetaRow icon="users"  value={`${course.totalStudents || 0} registered students`} />
        )}
      </View>
    </View>
  );
}

const PAGE_COPY = {
  student:  { title: 'My Classes',  sub: 'Classes for your enrolled courses' },
  lecturer: { title: 'My Classes',  sub: 'Modules assigned to you' },
  prl:      { title: 'All Classes', sub: 'Every module across all programmes' },
  pl:       { title: 'All Classes', sub: 'Every module and its schedule' },
};

export default function ClassesScreen() {
  const { user } = useAuth();
  const role = user?.role ?? 'student';

  const [courses, setCourses]    = useState([]);
  const [refreshing, setRefresh] = useState(false);
  const [query, setQuery]        = useState('');

  const load = useCallback(async () => {
    try {
      if (role === 'student') {
        const res = await api.get('/courses/my-enrollments');
        const enrollments = res.data ?? [];
        setCourses(enrollments.map(e => e.course).filter(Boolean));
      } else {
        const res = await api.get('/courses');
        let all = res.data ?? [];
        if (role === 'lecturer') {
          const uid = user?.uid || user?.id;
          all = all.filter(c => c.lecturerId === uid);
        }
        setCourses(all);
      }
    } catch {}
  }, [role, user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefresh(true);
    await load();
    setRefresh(false);
  }, [load]);

  const filtered = courses.filter(c => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (c.className    || '').toLowerCase().includes(q) ||
      (c.courseName   || '').toLowerCase().includes(q) ||
      (c.courseCode   || '').toLowerCase().includes(q) ||
      (c.venue        || '').toLowerCase().includes(q) ||
      (c.lecturerName || '').toLowerCase().includes(q) ||
      (c.stream       || '').toLowerCase().includes(q)
    );
  });

  const copy = PAGE_COPY[role] || PAGE_COPY.student;

  return (
    <View style={s.root}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>{copy.title}</Text>
        <Text style={s.pageSub}>{copy.sub}</Text>

        <View style={s.searchWrap}>
          <Icon name="search" size={14} color={TEXT_LIGHT} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by name, code, venue…"
            placeholderTextColor={TEXT_LIGHT}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Icon
              name="x"
              size={14}
              color={TEXT_LIGHT}
              onPress={() => setQuery('')}
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
      >
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Icon name="calendar" size={38} color={TEXT_LIGHT} />
            <Text style={s.emptyTitle}>No classes found</Text>
            <Text style={s.emptySub}>
              {role === 'student'
                ? 'Enroll in courses to see your classes here.'
                : role === 'lecturer'
                ? 'No modules have been assigned to you yet.'
                : 'No modules have been created yet.'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={s.countLabel}>
              {filtered.length} class{filtered.length !== 1 ? 'es' : ''}
            </Text>
            {filtered.map((c, i) => (
              <ClassCard key={c.id || i} course={c} role={role} />
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  pageTitle: {
    fontSize: 22, fontWeight: '800', color: TEXT_DARK,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  pageSub: { fontSize: 12, color: TEXT_LIGHT, marginTop: 3, marginBottom: 14 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F1F5F9', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 13, color: TEXT_DARK, padding: 0 },

  scroll:     { padding: spacing.lg ?? 20 },
  countLabel: { fontSize: 12, color: TEXT_LIGHT, fontWeight: '600', marginBottom: 12 },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 4,
    borderLeftColor: ACCENT,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  cardTop:    { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconWrap:   {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, backgroundColor: ACCENT + '18',
  },
  moduleName: { fontSize: 15, fontWeight: '800', color: TEXT_DARK, marginBottom: 5 },
  codePill:   {
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
    alignSelf: 'flex-start', backgroundColor: ACCENT + '15',
  },
  codeText: { fontSize: 10, fontWeight: '700', color: ACCENT },

  details:  { gap: 6 },
  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaText: { fontSize: 12, color: TEXT_MID, fontWeight: '500', flex: 1 },

  empty:      { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MID, marginTop: 14 },
  emptySub:   { fontSize: 13, color: TEXT_LIGHT, marginTop: 8, textAlign: 'center', paddingHorizontal: 30, lineHeight: 20 },
});