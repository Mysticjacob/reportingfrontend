import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';

import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../theme/theme';
const ACCENT      = colors.primary  ?? '#4F8EF7';
const BG          = '#F5F7FA';
const CARD_BG     = '#FFFFFF';
const TEXT_DARK   = '#0F1117';
const TEXT_MID    = '#4A5568';
const TEXT_LIGHT  = '#8A94A6';
const BORDER      = '#E8ECF0';
const GREEN       = '#22C55E';
const AMBER       = '#F59E0B';
const RED         = '#EF4444';

const COURSE_PALETTE = [
  { bg: '#EEF4FF', accent: '#3B6FD4', icon: 'book-open' },
  { bg: '#F0FDF4', accent: '#16A34A', icon: 'layers' },
  { bg: '#FFF7ED', accent: '#D97706', icon: 'cpu' },
  { bg: '#FDF4FF', accent: '#9333EA', icon: 'code' },
  { bg: '#FFF1F2', accent: '#E11D48', icon: 'activity' },
  { bg: '#F0F9FF', accent: '#0284C7', icon: 'globe' },
];

const { width: SCREEN_W } = Dimensions.get('window');
const attendanceColor = (rate) => {
  if (rate >= 75) return GREEN;
  if (rate >= 50) return AMBER;
  return RED;
};

const greetingByHour = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

function AttendanceRing({ rate }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: rate, duration: 900, useNativeDriver: false }).start();
  }, [rate]);

  const SIZE = 86;
  const STROKE = 7;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const color = attendanceColor(rate);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: SIZE, height: SIZE }}>
      {/* Background track */}
      <View style={{
        position: 'absolute',
        width: SIZE, height: SIZE, borderRadius: SIZE / 2,
        borderWidth: STROKE, borderColor: BORDER,
      }} />
      {/* Foreground — faked with a rotated arc using border */}
      <View style={{
        position: 'absolute',
        width: SIZE, height: SIZE, borderRadius: SIZE / 2,
        borderWidth: STROKE,
        borderColor: color,
        borderRightColor: 'transparent',
        borderBottomColor: rate > 50 ? color : 'transparent',
        transform: [{ rotate: '-90deg' }],
        opacity: 0.9,
      }} />
      <Text style={{ fontSize: 20, fontWeight: '800', color: TEXT_DARK, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
        {rate}%
      </Text>
      <Text style={{ fontSize: 9, color: TEXT_LIGHT, fontWeight: '600', letterSpacing: 0.5, marginTop: 1 }}>
        ATTEND
      </Text>
    </View>
  );
}

/** Hero stats banner */
function StatsBanner({ courseCount, rate, presentCount, totalCount }) {
  return (
    <View style={s.banner}>
      {/* Left: ring */}
      <AttendanceRing rate={rate} />

      {/* Separator */}
      <View style={s.bannerDivider} />

      {/* Right: two stat blocks */}
      <View style={s.bannerStats}>
        <View style={s.bannerStat}>
          <Text style={s.bannerStatValue}>{courseCount}</Text>
          <Text style={s.bannerStatLabel}>Enrolled Courses</Text>
        </View>
        <View style={s.bannerStatDivider} />
        <View style={s.bannerStat}>
          <Text style={s.bannerStatValue}>{presentCount}/{totalCount}</Text>
          <Text style={s.bannerStatLabel}>Classes Attended</Text>
        </View>
      </View>
    </View>
  );
}

/** Quick-action pill button */
function QuickAction({ icon, label, onPress, tint }) {
  return (
    <TouchableOpacity style={[s.qa, { backgroundColor: tint + '18' }]} onPress={onPress} activeOpacity={0.75}>
      <View style={[s.qaIcon, { backgroundColor: tint + '22' }]}>
        <Icon name={icon} size={15} color={tint} />
      </View>
      <Text style={[s.qaLabel, { color: tint }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Course card — tappable, navigates to Courses */
function CourseCard({ enrollment, index, onPress }) {
  const palette = COURSE_PALETTE[index % COURSE_PALETTE.length];
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  const course = enrollment.course ?? {};

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[s.courseCard, { backgroundColor: palette.bg, borderColor: palette.accent + '30' }]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={`Open ${course.courseName ?? 'course'}`}
      >
        {/* Icon badge */}
        <View style={[s.courseIconWrap, { backgroundColor: palette.accent + '18' }]}>
          <Icon name={palette.icon} size={18} color={palette.accent} />
        </View>

        {/* Info */}
        <View style={s.courseInfo}>
          <Text style={[s.courseName, { color: TEXT_DARK }]} numberOfLines={1}>
            {course.courseName ?? 'Course'}
          </Text>
          <Text style={s.courseMeta} numberOfLines={1}>
            {[course.courseCode, course.venue].filter(Boolean).join('  ·  ')}
          </Text>
          {course.scheduledTime ? (
            <View style={s.courseTimeRow}>
              <Icon name="clock" size={11} color={TEXT_LIGHT} />
              <Text style={s.courseTime}>{course.scheduledTime}</Text>
            </View>
          ) : null}
          {course.lecturerName ? (
            <View style={s.courseTimeRow}>
              <Icon name="user" size={11} color={TEXT_LIGHT} />
              <Text style={s.courseTime}>{course.lecturerName}</Text>
            </View>
          ) : null}
        </View>

        {/* Chevron */}
        <Icon name="chevron-right" size={16} color={palette.accent} style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    </Animated.View>
  );
}

function AttendanceRow({ item }) {
  const present = item.present;
  return (
    <View style={s.attendRow}>
      <View style={[s.attendDot, { backgroundColor: present ? GREEN : RED }]} />
      <View style={{ flex: 1 }}>
        <Text style={s.attendCourse} numberOfLines={1}>{item.courseName ?? 'Class'}</Text>
        <Text style={s.attendDate}>{item.date ?? '—'}</Text>
      </View>
      <Text style={[s.attendStatus, { color: present ? GREEN : RED }]}>
        {present ? 'Present' : 'Absent'}
      </Text>
    </View>
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

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [enrollments, setEnrollments] = useState([]);
  const [attendance, setAttendance]   = useState([]);
  const [refreshing, setRefreshing]   = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [enrRes, attRes] = await Promise.allSettled([
        api.get('/courses/my-enrollments'),
        api.get('/attendance/me'),
      ]);
      if (enrRes.status === 'fulfilled') setEnrollments(enrRes.value.data ?? []);
      if (attRes.status === 'fulfilled') setAttendance(attRes.value.data  ?? []);
    } catch (_) {}
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const present   = attendance.filter(a => a.present).length;
  const rate      = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
  const firstName = user?.name?.split(' ')[0] ?? 'Student';
  const recentAtt = attendance.slice(-5).reverse();

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
      >
        {/* Greeting */}
        <View style={s.greeting}>
          <Text style={s.greetSub}>{greetingByHour()}</Text>
          <Text style={s.greetName}>{firstName}</Text>
        </View>

        {/*  Stats Banner  */}
        <StatsBanner
          courseCount={enrollments.length}
          rate={rate}
          presentCount={present}
          totalCount={attendance.length}
        />

        {/*  Quick Actions */}
        <View style={s.qaRow}>
          <QuickAction icon="book-open"   label="Courses"    tint={ACCENT}  onPress={() => navigation.navigate('Courses')} />
          <QuickAction icon="check-square" label="Attendance" tint="#16A34A" onPress={() => navigation.navigate('Attendance')} />
          <QuickAction icon="calendar"    label="Classes"    tint="#D97706" onPress={() => navigation.navigate('Classes')} />
          <QuickAction icon="star"        label="Rate"       tint="#9333EA" onPress={() => navigation.navigate('Rate')} />
        </View>

        {/* Enrolled Courses */}
        <SectionHeader
          title="My Courses"
          actionLabel={enrollments.length ? 'View all' : undefined}
          onAction={() => navigation.navigate('Courses')}
        />

        {enrollments.length === 0 ? (
          <View style={s.empty}>
            <Icon name="inbox" size={32} color={TEXT_LIGHT} />
            <Text style={s.emptyTitle}>No enrollments yet</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Courses')}>
              <Text style={s.emptyBtnText}>Browse Courses</Text>
            </TouchableOpacity>
          </View>
        ) : (
          enrollments.slice(0, 6).map((e, i) => (
            <CourseCard
              key={e.id ?? i}
              enrollment={e}
              index={i}
              onPress={() => navigation.navigate('Courses', { courseId: e.course?.id })}
            />
          ))
        )}

        {/*Recent Attendance */}
        {recentAtt.length > 0 && (
          <>
            <SectionHeader
              title="Recent Attendance"
              actionLabel="Full history"
              onAction={() => navigation.navigate('Attendance')}
            />
            <View style={s.attendCard}>
              {recentAtt.map((item, i) => (
                <React.Fragment key={item.id ?? i}>
                  <AttendanceRow item={item} />
                  {i < recentAtt.length - 1 && <View style={s.attendSep} />}
                </React.Fragment>
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
  root: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: spacing.lg ?? 20, paddingTop: 4, paddingBottom: 20 },

  // Greeting
  greeting: { marginTop: 20, marginBottom: 20 },
  greetSub: { fontSize: 13, color: TEXT_LIGHT, fontWeight: '500', letterSpacing: 0.3 },
  greetName: {
    fontSize: 30,
    fontWeight: '800',
    color: TEXT_DARK,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.5,
    marginTop: 2,
  },

  // Banner
  banner: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  bannerDivider: { width: 1, height: 60, backgroundColor: BORDER, marginHorizontal: 20 },
  bannerStats: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  bannerStat: { flex: 1, alignItems: 'center' },
  bannerStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT_DARK,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  bannerStatLabel: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '600', marginTop: 3, textAlign: 'center' },
  bannerStatDivider: { width: 1, height: 36, backgroundColor: BORDER },

  // Quick actions
  qaRow: { flexDirection: 'row', gap: 8, marginBottom: 26 },
  qa: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  qaIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  qaLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: TEXT_DARK,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.1,
  },
  sectionAction: { fontSize: 12, fontWeight: '600', color: ACCENT },

  // Course cards
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  courseIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  courseInfo: { flex: 1 },
  courseName: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  courseMeta: { fontSize: 11, color: TEXT_LIGHT, fontWeight: '500', marginBottom: 4 },
  courseTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  courseTime: { fontSize: 11, color: TEXT_LIGHT, fontWeight: '500' },

  // Empty state
  empty: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 36, backgroundColor: CARD_BG,
    borderRadius: 20, marginBottom: 20,
    borderWidth: 1, borderColor: BORDER, borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: 14, color: TEXT_MID, fontWeight: '600', marginTop: 10, marginBottom: 14 },
  emptyBtn: {
    backgroundColor: ACCENT, borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 9,
  },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  // Attendance
  attendCard: {
    backgroundColor: CARD_BG, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    overflow: 'hidden', marginBottom: 14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  attendRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16, gap: 12,
  },
  attendDot: { width: 8, height: 8, borderRadius: 4 },
  attendCourse: { fontSize: 13, fontWeight: '600', color: TEXT_DARK },
  attendDate: { fontSize: 11, color: TEXT_LIGHT, marginTop: 1 },
  attendStatus: { fontSize: 11, fontWeight: '700' },
  attendSep: { height: 1, backgroundColor: BORDER, marginHorizontal: 16 },
});