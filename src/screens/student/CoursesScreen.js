import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  RefreshControl,
  Alert,
  Animated,
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
const GREEN      = '#16A34A';
const GREEN_BG   = '#F0FDF4';

const COURSE_PALETTE = [
  { bg: '#EEF4FF', accent: '#3B6FD4', icon: 'book-open' },
  { bg: '#F0FDF4', accent: '#16A34A', icon: 'layers'    },
  { bg: '#FFF7ED', accent: '#D97706', icon: 'cpu'       },
  { bg: '#FDF4FF', accent: '#9333EA', icon: 'code'      },
  { bg: '#FFF1F2', accent: '#E11D48', icon: 'activity'  },
  { bg: '#F0F9FF', accent: '#0284C7', icon: 'globe'     },
];

const palette = (index) => COURSE_PALETTE[index % COURSE_PALETTE.length];

function SearchBar({ value, onChange }) {
  return (
    <View style={s.searchWrap}>
      <Icon name="search" size={15} color={TEXT_LIGHT} style={{ marginRight: 8 }} />
      <TextInput
        style={s.searchInput}
        value={value}
        onChangeText={onChange}
        placeholder="Search courses, codes, lecturers…"
        placeholderTextColor={TEXT_LIGHT}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="x" size={14} color={TEXT_LIGHT} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function StreamFilters({ streams, active, onChange }) {
  if (streams.length <= 1) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
      {['All', ...streams].map((stream) => (
        <TouchableOpacity
          key={stream}
          style={[s.chip, active === stream && s.chipActive]}
          onPress={() => onChange(stream)}
          activeOpacity={0.75}
        >
          <Text style={[s.chipLabel, active === stream && s.chipLabelActive]}>{stream}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function MetaRow({ icon, label, style }) {
  if (!label) return null;
  return (
    <View style={[s.metaRow, style]}>
      <Icon name={icon} size={11} color={TEXT_LIGHT} />
      <Text style={s.metaText} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function CourseCard({ course, index, isEnrolled, onEnroll, enrolling }) {
  const p     = palette(index);
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,     useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={[s.card, { transform: [{ scale }] }]}>
      <TouchableOpacity activeOpacity={1} onPressIn={onPressIn} onPressOut={onPressOut}>

        {/* Top: icon + name + enrolled badge */}
        <View style={s.cardTop}>
          <View style={[s.cardIcon, { backgroundColor: p.accent + '1A' }]}>
            <Icon name={p.icon} size={18} color={p.accent} />
          </View>

          <View style={s.cardMeta}>
            <Text style={s.cardName} numberOfLines={2}>{course.courseName}</Text>
            <View style={s.cardCodeRow}>
              {course.courseCode ? (
                <View style={[s.codeChip, { backgroundColor: p.accent + '15' }]}>
                  <Text style={[s.codeChipText, { color: p.accent }]}>{course.courseCode}</Text>
                </View>
              ) : null}
              {course.stream ? (
                <View style={s.streamChip}>
                  <Text style={s.streamChipText}>{course.stream}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {isEnrolled && (
            <View style={s.enrolledBadge}>
              <Icon name="check" size={10} color={GREEN} />
              <Text style={s.enrolledBadgeText}>Enrolled</Text>
            </View>
          )}
        </View>

        <View style={s.cardDivider} />

        {/* Details grid: 2 columns */}
        <View style={s.detailsGrid}>
          <View style={s.detailsCol}>
            <MetaRow icon="map-pin" label={course.venue        || 'Venue TBA'} />
            <MetaRow icon="user"    label={course.lecturerName || 'Unassigned'} style={{ marginTop: 6 }} />
          </View>
          <View style={s.detailsCol}>
            <MetaRow icon="clock"   label={course.scheduledTime || 'Time TBA'} />
            {course.credits ? (
              <MetaRow icon="award" label={`${course.credits} credits`} style={{ marginTop: 6 }} />
            ) : null}
          </View>
        </View>

        {!isEnrolled && (
          <TouchableOpacity
            style={[s.registerBtn, { backgroundColor: p.accent }, enrolling && s.registerBtnLoading]}
            onPress={onEnroll}
            disabled={enrolling}
            activeOpacity={0.8}
          >
            <Icon name={enrolling ? 'loader' : 'plus'} size={14} color="#FFF" />
            <Text style={s.registerBtnText}>{enrolling ? 'Registering…' : 'Register'}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function SummaryStrip({ total, enrolledCount }) {
  return (
    <View style={s.strip}>
      <View style={s.stripStat}>
        <Text style={s.stripVal}>{total}</Text>
        <Text style={s.stripLbl}>Total</Text>
      </View>
      <View style={s.stripDivider} />
      <View style={s.stripStat}>
        <Text style={[s.stripVal, { color: GREEN }]}>{enrolledCount}</Text>
        <Text style={s.stripLbl}>Enrolled</Text>
      </View>
      <View style={s.stripDivider} />
      <View style={s.stripStat}>
        <Text style={[s.stripVal, { color: ACCENT }]}>{total - enrolledCount}</Text>
        <Text style={s.stripLbl}>Available</Text>
      </View>
    </View>
  );
}

export default function CoursesScreen() {
  const [courses, setCourses]     = useState([]);
  const [enrolled, setEnrolled]   = useState(new Set());
  const [enrolling, setEnrolling] = useState(null);
  const [search, setSearch]       = useState('');
  const [stream, setStream]       = useState('All');
  const [refreshing, setRefresh]  = useState(false);

  const load = useCallback(async () => {
    try {
      const [cRes, eRes] = await Promise.allSettled([
        api.get('/courses'),
        api.get('/courses/my-enrollments'),
      ]);
      if (cRes.status === 'fulfilled') setCourses(cRes.value.data ?? []);
      if (eRes.status === 'fulfilled')
        setEnrolled(new Set(eRes.value.data.map(x => x.courseId)));
    } catch (_) {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefresh(true);
    await load();
    setRefresh(false);
  }, [load]);

  const enroll = useCallback(async (id) => {
    setEnrolling(id);
    try {
      await api.post('/courses/enroll', { courseId: id });
      setEnrolled(prev => new Set([...prev, id]));
    } catch (e) {
      Alert.alert('Registration failed', e?.response?.data?.message || e.message);
    } finally {
      setEnrolling(null);
    }
  }, []);

  const streams = useMemo(() =>
    [...new Set(courses.map(c => c.stream).filter(Boolean))],
    [courses]
  );

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim();
    return courses.filter(c => {
      const matchStream = stream === 'All' || c.stream === stream;
      const matchSearch = !q || [c.courseName, c.courseCode, c.lecturerName, c.venue]
        .some(f => f?.toLowerCase().includes(q));
      return matchStream && matchSearch;
    });
  }, [courses, search, stream]);

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
      >
        <View style={s.heading}>
          <Text style={s.headTitle}>Courses</Text>
          <Text style={s.headSub}>Browse and register for classes</Text>
        </View>

        {courses.length > 0 && (
          <SummaryStrip total={courses.length} enrolledCount={enrolled.size} />
        )}

        <SearchBar value={search} onChange={setSearch} />
        <StreamFilters streams={streams} active={stream} onChange={setStream} />

        {(search || stream !== 'All') && (
          <Text style={s.resultCount}>
            {visible.length} course{visible.length !== 1 ? 's' : ''} found
          </Text>
        )}

        {visible.length === 0 && (
          <View style={s.empty}>
            <Icon name="inbox" size={34} color={TEXT_LIGHT} />
            <Text style={s.emptyTitle}>No courses found</Text>
            <Text style={s.emptySub}>Try a different search or filter</Text>
          </View>
        )}

        {visible.map((c, i) => (
          <CourseCard
            key={c.id}
            course={c}
            index={i}
            isEnrolled={enrolled.has(c.id)}
            onEnroll={() => enroll(c.id)}
            enrolling={enrolling === c.id}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: spacing.lg ?? 20, paddingTop: 4, paddingBottom: 20 },

  heading:   { marginTop: 20, marginBottom: 18 },
  headTitle: {
    fontSize: 28, fontWeight: '800', color: TEXT_DARK,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', letterSpacing: -0.5,
  },
  headSub: { fontSize: 13, color: TEXT_LIGHT, fontWeight: '500', marginTop: 2 },

  // Summary strip
  strip: {
    flexDirection: 'row', backgroundColor: CARD_BG, borderRadius: 16,
    paddingVertical: 14, marginBottom: 16,
    borderWidth: 1, borderColor: BORDER,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  stripStat:    { flex: 1, alignItems: 'center' },
  stripVal:     { fontSize: 22, fontWeight: '800', color: TEXT_DARK, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  stripLbl:     { fontSize: 10, color: TEXT_LIGHT, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  stripDivider: { width: 1, backgroundColor: BORDER, alignSelf: 'stretch', marginVertical: 4 },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD_BG, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: BORDER, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT_DARK, fontWeight: '500', padding: 0 },

  // Chips
  chipRow:          { paddingBottom: 14, gap: 8 },
  chip:             { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER },
  chipActive:       { backgroundColor: TEXT_DARK, borderColor: TEXT_DARK },
  chipLabel:        { fontSize: 12, fontWeight: '600', color: TEXT_MID },
  chipLabelActive:  { color: '#FFF' },

  resultCount: { fontSize: 12, color: TEXT_LIGHT, fontWeight: '600', marginBottom: 10 },

  // Card
  card: {
    backgroundColor: CARD_BG, borderRadius: 18,
    borderWidth: 1, borderColor: BORDER,
    padding: 16, marginBottom: 14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  cardTop:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cardIcon:    { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardMeta:    { flex: 1 },
  cardName:    { fontSize: 15, fontWeight: '700', color: TEXT_DARK, lineHeight: 21, marginBottom: 6 },
  cardCodeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  codeChip:    { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  codeChipText:{ fontSize: 11, fontWeight: '700' },
  streamChip:  { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#F1F5F9' },
  streamChipText: { fontSize: 11, fontWeight: '600', color: TEXT_MID },

  enrolledBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: GREEN_BG, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  enrolledBadgeText: { fontSize: 11, fontWeight: '700', color: GREEN },

  cardDivider:  { height: 1, backgroundColor: BORDER, marginBottom: 12 },

  detailsGrid: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  detailsCol:  { flex: 1 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:    { fontSize: 12, color: TEXT_LIGHT, fontWeight: '500', flex: 1 },

  registerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 12, paddingVertical: 11,
  },
  registerBtnLoading: { opacity: 0.65 },
  registerBtnText:    { fontSize: 14, fontWeight: '700', color: '#FFF' },

  empty:      { alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MID, marginTop: 12 },
  emptySub:   { fontSize: 13, color: TEXT_LIGHT, marginTop: 4 },
});