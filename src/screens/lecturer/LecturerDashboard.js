import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../theme/theme';

const ACCENT     = colors.primary ?? '#4F8EF7';
const BG         = '#F5F7FA';
const CARD_BG    = '#FFFFFF';
const TEXT_DARK  = '#0F1117';
const TEXT_MID   = '#4A5568';
const TEXT_LIGHT = '#8A94A6';
const BORDER     = '#E8ECF0';
const GOLD       = '#F59E0B';
const GREEN      = '#16A34A';
const AMBER      = '#D97706';
const RED        = '#DC2626';

const CARD_ICON = 'book-open';

const greetingByHour = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const ratingColor = (avg) => {
  if (!avg || avg === '—') return TEXT_LIGHT;
  const n = parseFloat(avg);
  if (n >= 4) return GREEN;
  if (n >= 3) return AMBER;
  return RED;
};

function StarRow({ score, size = 13 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Icon
          key={n}
          name="star"
          size={size}
          color={n <= Math.round(score) ? GOLD : BORDER}
        />
      ))}
    </View>
  );
}

function StatsBanner({ courseCount, reportCount, avg }) {
  const avgColor = ratingColor(avg);
  return (
    <View style={s.banner}>
      <View style={s.bannerStat}>
        <Text style={s.bannerVal}>{courseCount}</Text>
        <Text style={s.bannerLbl}>Courses</Text>
      </View>
      <View style={s.bannerDivider} />
      <View style={s.bannerStat}>
        <Text style={s.bannerVal}>{reportCount}</Text>
        <Text style={s.bannerLbl}>Reports</Text>
      </View>
      <View style={s.bannerDivider} />
      <View style={s.bannerStat}>
        <Text style={[s.bannerVal, { color: avgColor }]}>{avg}</Text>
        <StarRow score={parseFloat(avg) || 0} />
        <Text style={s.bannerLbl}>Avg Rating</Text>
      </View>
    </View>
  );
}

function QuickAction({ icon, label, tint, onPress }) {
  return (
    <TouchableOpacity
      style={[s.qa, { backgroundColor: tint + '18' }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[s.qaIcon, { backgroundColor: tint + '22' }]}>
        <Icon name={icon} size={15} color={tint} />
      </View>
      <Text style={[s.qaLabel, { color: tint }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {actionLabel && (
        <TouchableOpacity onPress={onAction}>
          <Text style={s.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function MetaRow({ icon, label }) {
  if (!label) return null;
  return (
    <View style={s.metaRow}>
      <Icon name={icon} size={11} color={TEXT_LIGHT} />
      <Text style={s.metaText} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function CourseCard({ course, onPress }) {
  return (
    <TouchableOpacity style={s.courseCard} onPress={onPress} activeOpacity={0.8}>
      <View style={s.courseStripe} />

      <View style={s.courseIcon}>
        <Icon name={CARD_ICON} size={18} color={ACCENT} />
      </View>

      <View style={s.courseInfo}>
        <Text style={s.courseName} numberOfLines={1}>{course.courseName}</Text>
        <View style={s.codeChip}>
          <Text style={s.codeChipText}>{course.courseCode}</Text>
        </View>
        <View style={s.courseMeta}>
          <MetaRow icon="map-pin" label={course.venue || 'TBA'} />
          <MetaRow icon="clock"   label={course.scheduledTime || 'TBA'} />
          {course.enrolledCount != null && (
            <MetaRow icon="users" label={`${course.enrolledCount} students`} />
          )}
        </View>
      </View>

      <Icon name="chevron-right" size={16} color={ACCENT} />
    </TouchableOpacity>
  );
}

function RatingRow({ rating, isLast }) {
  const score = rating.score ?? 0;
  return (
    <View style={[s.ratingRow, !isLast && s.ratingRowBorder]}>
      <View style={s.ratingLeft}>
        <View style={[s.ratingDot, { backgroundColor: ratingColor(score) }]} />
        <View>
          <Text style={s.ratingCourse} numberOfLines={1}>
            {rating.targetName ?? rating.courseName ?? 'Course'}
          </Text>
          <StarRow score={score} size={11} />
        </View>
      </View>
      <Text style={[s.ratingScore, { color: ratingColor(score) }]}>{score}/5</Text>
    </View>
  );
}

export default function LecturerDashboard() {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [courses, setCourses]    = useState([]);
  const [reports, setReports]    = useState([]);
  const [ratings, setRatings]    = useState([]);
  const [refreshing, setRefresh] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cRes, rRes, raRes] = await Promise.allSettled([
        api.get('/courses'),
        api.get('/reports'),
        api.get('/ratings'),
      ]);
      if (cRes.status === 'fulfilled') {
        setCourses((cRes.value.data ?? []).filter(c => c.lecturerId === user?.uid || c.lecturerId === user?.id));
      }
      if (rRes.status  === 'fulfilled') setReports(rRes.value.data  ?? []);
      if (raRes.status === 'fulfilled') setRatings(raRes.value.data ?? []);
    } catch (_) {}
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefresh(true);
    await load();
    setRefresh(false);
  }, [load]);

  const avg = ratings.length
    ? (ratings.reduce((a, b) => a + (b.score ?? 0), 0) / ratings.length).toFixed(1)
    : '—';

  const firstName = user?.name?.split(' ')[0] ?? 'Lecturer';
  const recentRatings = ratings.slice(-4).reverse();

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
      >
        <View style={s.greeting}>
          <Text style={s.greetSub}>{greetingByHour()}</Text>
          <Text style={s.greetName}>{firstName}</Text>
        </View>

        <StatsBanner
          courseCount={courses.length}
          reportCount={reports.length}
          avg={avg}
        />

        <View style={s.qaRow}>
          <QuickAction icon="calendar"     label="Classes"    tint={ACCENT}  onPress={() => navigation.navigate('Classes')} />
          <QuickAction icon="check-square" label="Attendance" tint="#16A34A" onPress={() => navigation.navigate('Attendance')} />
          <QuickAction icon="file-text"    label="Report"     tint="#D97706" onPress={() => navigation.navigate('Report')} />
          <QuickAction icon="award"        label="Ratings"    tint="#9333EA" onPress={() => navigation.navigate('Ratings')} />
        </View>

        <SectionHeader
          title="My Courses"
          actionLabel={courses.length ? 'View all' : undefined}
          onAction={() => navigation.navigate('Classes')}
        />

        {courses.length === 0 ? (
          <View style={s.empty}>
            <Icon name="inbox" size={32} color={TEXT_LIGHT} />
            <Text style={s.emptyTitle}>No courses assigned yet</Text>
          </View>
        ) : (
          courses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onPress={() => navigation.navigate('Classes', { courseId: c.id })}
            />
          ))
        )}

        {recentRatings.length > 0 && (
          <>
            <SectionHeader
              title="Recent Ratings"
              actionLabel="All ratings"
              onAction={() => navigation.navigate('Ratings')}
            />
            <View style={s.ratingsCard}>
              {recentRatings.map((r, i) => (
                <RatingRow key={r.id ?? i} rating={r} isLast={i === recentRatings.length - 1} />
              ))}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: spacing.lg ?? 20, paddingTop: 4, paddingBottom: 20 },

  greeting:  { marginTop: 20, marginBottom: 20 },
  greetSub:  { fontSize: 13, color: TEXT_LIGHT, fontWeight: '500', letterSpacing: 0.3 },
  greetName: {
    fontSize: 30, fontWeight: '800', color: TEXT_DARK,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.5, marginTop: 2,
  },

  banner: {
    backgroundColor: CARD_BG, borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', marginBottom: 18,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  bannerStat:    { flex: 1, alignItems: 'center', gap: 4 },
  bannerVal:     { fontSize: 26, fontWeight: '800', color: TEXT_DARK, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  bannerLbl:     { fontSize: 10, color: TEXT_LIGHT, fontWeight: '600', marginTop: 2, letterSpacing: 0.4 },
  bannerDivider: { width: 1, height: 50, backgroundColor: BORDER, marginHorizontal: 4 },

  qaRow:  { flexDirection: 'row', gap: 8, marginBottom: 26 },
  qa:     { flex: 1, alignItems: 'center', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 4 },
  qaIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  qaLabel:{ fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle:  {
    fontSize: 15, fontWeight: '700', color: TEXT_DARK,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  sectionAction: { fontSize: 12, fontWeight: '600', color: ACCENT },

  courseCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD_BG, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    marginBottom: 10, overflow: 'hidden',
    paddingRight: 14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  courseStripe: { width: 4, alignSelf: 'stretch', backgroundColor: ACCENT },
  courseIcon:   {
    width: 44, height: 44, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    margin: 12, backgroundColor: ACCENT + '1A',
  },
  courseInfo:   { flex: 1, paddingVertical: 12 },
  courseName:   { fontSize: 14, fontWeight: '700', color: TEXT_DARK, marginBottom: 4 },
  codeChip:     {
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
    alignSelf: 'flex-start', marginBottom: 6,
    backgroundColor: ACCENT + '15',
  },
  codeChipText: { fontSize: 10, fontWeight: '700', color: ACCENT },
  courseMeta:   { gap: 3 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:     { fontSize: 11, color: TEXT_LIGHT, fontWeight: '500' },

  ratingsCard: {
    backgroundColor: CARD_BG, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
    marginBottom: 14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  ratingRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  ratingRowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  ratingLeft:      { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  ratingDot:       { width: 8, height: 8, borderRadius: 4 },
  ratingCourse:    { fontSize: 13, fontWeight: '600', color: TEXT_DARK, marginBottom: 3 },
  ratingScore:     { fontSize: 13, fontWeight: '800' },

  empty:      { alignItems: 'center', paddingVertical: 32, backgroundColor: CARD_BG, borderRadius: 16, borderWidth: 1, borderColor: BORDER, borderStyle: 'dashed', marginBottom: 20 },
  emptyTitle: { fontSize: 14, color: TEXT_MID, fontWeight: '600', marginTop: 10 },
});