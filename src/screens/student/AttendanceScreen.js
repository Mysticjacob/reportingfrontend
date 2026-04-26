import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  RefreshControl,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { api } from '../../services/api';
import { colors, spacing } from '../../theme/theme';
const ACCENT    = colors.primary ?? '#4F8EF7';
const BG        = '#F5F7FA';
const CARD_BG   = '#FFFFFF';
const TEXT_DARK = '#0F1117';
const TEXT_MID  = '#4A5568';
const TEXT_LIGHT = '#8A94A6';
const BORDER    = '#E8ECF0';
const GREEN     = '#16A34A';
const GREEN_BG  = '#F0FDF4';
const RED       = '#DC2626';
const RED_BG    = '#FFF1F2';
const AMBER     = '#D97706';

const FILTERS = ['All', 'Present', 'Absent'];

const attendanceColor = (rate) => {
  if (rate >= 75) return GREEN;
  if (rate >= 50) return AMBER;
  return RED;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

const monthLabel = (dateStr) => {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

const groupByMonth = (records) => {
  const groups = {};
  records.forEach((r) => {
    const key = monthLabel(r.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  return Object.entries(groups);
};

function SummaryCard({ items }) {
  const present = items.filter(a => a.present).length;
  const absent  = items.length - present;
  const rate    = items.length ? Math.round((present / items.length) * 100) : 0;
  const color   = attendanceColor(rate);

  return (
    <View style={s.summary}>
      {/* Three stat blocks */}
      <View style={s.summaryStats}>
        <View style={s.summaryStat}>
          <Text style={[s.summaryVal, { color: GREEN }]}>{present}</Text>
          <Text style={s.summaryLbl}>Present</Text>
        </View>
        <View style={s.summaryMid} />
        <View style={s.summaryStat}>
          <Text style={[s.summaryVal, { color: RED }]}>{absent}</Text>
          <Text style={s.summaryLbl}>Absent</Text>
        </View>
        <View style={s.summaryMid} />
        <View style={s.summaryStat}>
          <Text style={[s.summaryVal, { color: ACCENT }]}>{rate}%</Text>
          <Text style={s.summaryLbl}>Rate</Text>
        </View>
      </View>

      <View style={[s.summaryStatus, { backgroundColor: color + '15' }]}>
        <Icon name={rate >= 75 ? 'check-circle' : rate >= 50 ? 'alert-circle' : 'x-circle'} size={12} color={color} />
        <Text style={[s.summaryStatusText, { color }]}>
          {rate >= 75 ? 'Good standing' : rate >= 50 ? 'Needs improvement' : 'At risk — attend more classes'}
        </Text>
      </View>
    </View>
  );
}

function FilterTabs({ active, onChange }) {
  return (
    <View style={s.filterRow}>
      {FILTERS.map((f) => (
        <TouchableOpacity
          key={f}
          style={[s.filterTab, active === f && s.filterTabActive]}
          onPress={() => onChange(f)}
          activeOpacity={0.75}
        >
          <Text style={[s.filterLabel, active === f && s.filterLabelActive]}>{f}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function AttendanceRow({ record, isLast }) {
  const present = record.present;
  const course = record.course ?? record.courseDetails ?? {};

  const courseName   = course.courseName   ?? record.courseName   ?? null;
  const courseCode   = course.courseCode   ?? record.courseCode   ?? null;
  const venue        = course.venue        ?? record.venue        ?? null;
  const scheduledTime = course.scheduledTime ?? record.scheduledTime ?? record.time ?? null;
  const lecturerName = course.lecturerName ?? record.lecturerName ?? null;

  const dateObj = record.date ? new Date(record.date) : null;
  const dayNum  = dateObj && !isNaN(dateObj)
    ? dateObj.toLocaleDateString('en-GB', { day: 'numeric' }) : '—';
  const monStr  = dateObj && !isNaN(dateObj)
    ? dateObj.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase() : '';
  const timeStr = dateObj && !isNaN(dateObj)
    ? dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <View style={[s.row, !isLast && s.rowBorder]}>
      {/* Status stripe */}
      <View style={[s.stripe, { backgroundColor: present ? GREEN : RED }]} />
      <View style={s.dateCol}>
        <Text style={s.dateDay}>{dayNum}</Text>
        <Text style={s.dateMon}>{monStr}</Text>
        {timeStr && <Text style={s.dateTime}>{timeStr}</Text>}
      </View>

      <View style={s.rowDivider} />
      <View style={s.rowInfo}>
        {/* Course name — primary */}
        <Text style={s.rowCourse} numberOfLines={1}>
          {courseName ?? 'Unknown Course'}
        </Text>
        <View style={s.rowMeta}>
          {courseCode ? (
            <View style={s.metaChip}>
              <Icon name="hash" size={10} color={TEXT_LIGHT} />
              <Text style={s.metaText}>{courseCode}</Text>
            </View>
          ) : null}
          {scheduledTime ? (
            <View style={s.metaChip}>
              <Icon name="clock" size={10} color={TEXT_LIGHT} />
              <Text style={s.metaText}>{scheduledTime}</Text>
            </View>
          ) : null}
        </View>

        {venue ? (
          <View style={[s.metaChip, { marginTop: 3 }]}>
            <Icon name="map-pin" size={10} color={TEXT_LIGHT} />
            <Text style={s.metaText}>{venue}</Text>
          </View>
        ) : null}

        {lecturerName ? (
          <View style={[s.metaChip, { marginTop: 3 }]}>
            <Icon name="user" size={10} color={TEXT_LIGHT} />
            <Text style={s.metaText}>{lecturerName}</Text>
          </View>
        ) : null}
      </View>

      <View style={[s.badge, { backgroundColor: present ? GREEN_BG : RED_BG }]}>
        <Icon name={present ? 'check' : 'x'} size={11} color={present ? GREEN : RED} />
        <Text style={[s.badgeText, { color: present ? GREEN : RED }]}>
          {present ? 'Present' : 'Absent'}
        </Text>
      </View>
    </View>
  );
}

function MonthGroup({ month, records }) {
  const presentCount = records.filter(r => r.present).length;
  const rate = Math.round((presentCount / records.length) * 100);

  return (
    <View style={s.groupCard}>
      {/* Group header */}
      <View style={s.groupHeader}>
        <Text style={s.groupMonth}>{month}</Text>
        <View style={[s.groupRate, { backgroundColor: attendanceColor(rate) + '18' }]}>
          <Text style={[s.groupRateText, { color: attendanceColor(rate) }]}>
            {rate}% · {presentCount}/{records.length}
          </Text>
        </View>
      </View>

      {records.map((r, i) => (
        <AttendanceRow key={r.id ?? i} record={r} isLast={i === records.length - 1} />
      ))}
    </View>
  );
}

export default function AttendanceScreen() {
  const [items, setItems]       = useState([]);
  const [filter, setFilter]     = useState('All');
  const [refreshing, setRefresh] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/attendance/me');
      setItems(r.data ?? []);
    } catch (_) {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefresh(true);
    await load();
    setRefresh(false);
  }, [load]);

  const filtered = useMemo(() => {
    const sorted = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (filter === 'Present') return sorted.filter(a => a.present);
    if (filter === 'Absent')  return sorted.filter(a => !a.present);
    return sorted;
  }, [items, filter]);

  const grouped = useMemo(() => groupByMonth(filtered), [filtered]);

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      >
        <View style={s.heading}>
          <Text style={s.headTitle}>Attendance</Text>
          <Text style={s.headSub}>Your full class history</Text>
        </View>

        {items.length > 0 && <SummaryCard items={items} />}

        <FilterTabs active={filter} onChange={setFilter} />

        {filtered.length === 0 && (
          <View style={s.empty}>
            <Icon name="calendar" size={34} color={TEXT_LIGHT} />
            <Text style={s.emptyTitle}>No records found</Text>
            <Text style={s.emptySub}>
              {filter === 'All' ? 'Your attendance will appear here.' : `No ${filter.toLowerCase()} records.`}
            </Text>
          </View>
        )}

        {grouped.map(([month, records]) => (
          <MonthGroup key={month} month={month} records={records} />
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
  headTitle: { fontSize: 28, fontWeight: '800', color: TEXT_DARK, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', letterSpacing: -0.5 },
  headSub:   { fontSize: 13, color: TEXT_LIGHT, fontWeight: '500', marginTop: 2 },

  summary: {
    backgroundColor: CARD_BG, borderRadius: 20, padding: 20,
    marginBottom: 18,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  summaryDivider: { width: '100%', height: 1, backgroundColor: BORDER, marginVertical: 16 },
  summaryStats:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 16 },
  summaryStat:    { alignItems: 'center', flex: 1 },
  summaryVal:     { fontSize: 28, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  summaryLbl:     { fontSize: 10, color: TEXT_LIGHT, fontWeight: '600', marginTop: 3, letterSpacing: 0.4 },
  summaryMid:     { width: 1, height: 36, backgroundColor: BORDER },
  summaryStatus:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  summaryStatusText: { fontSize: 12, fontWeight: '600' },

  filterRow: { flexDirection: 'row', backgroundColor: CARD_BG, borderRadius: 12, padding: 4, marginBottom: 18, borderWidth: 1, borderColor: BORDER },
  filterTab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  filterTabActive: { backgroundColor: ACCENT },
  filterLabel: { fontSize: 13, fontWeight: '600', color: TEXT_MID },
  filterLabelActive: { color: '#FFF' },

  groupCard: {
    backgroundColor: CARD_BG, borderRadius: 16, marginBottom: 14,
    overflow: 'hidden', borderWidth: 1, borderColor: BORDER,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER,
    backgroundColor: '#FAFBFC',
  },
  groupMonth:    { fontSize: 13, fontWeight: '700', color: TEXT_DARK },
  groupRate:     { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  groupRateText: { fontSize: 11, fontWeight: '700' },

  row:       { flexDirection: 'row', alignItems: 'center', paddingRight: 14, paddingVertical: 14, minHeight: 70 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  stripe:    { width: 3, alignSelf: 'stretch', borderRadius: 2, marginRight: 0 },

  dateCol: { width: 46, alignItems: 'center', paddingHorizontal: 8 },
  dateDay: { fontSize: 18, fontWeight: '800', color: TEXT_DARK, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  dateMon: { fontSize: 10, color: TEXT_LIGHT, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateTime: { fontSize: 9, color: ACCENT, fontWeight: '700', marginTop: 2, letterSpacing: 0.2 },

  rowDivider: { width: 1, height: 40, backgroundColor: BORDER, marginRight: 12 },

  rowInfo:   { flex: 1, marginRight: 10 },
  rowCourse: { fontSize: 13, fontWeight: '700', color: TEXT_DARK, marginBottom: 5 },
  rowMeta:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText:  { fontSize: 11, color: TEXT_LIGHT, fontWeight: '500' },

  badge:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  empty:      { alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MID, marginTop: 12 },
  emptySub:   { fontSize: 13, color: TEXT_LIGHT, marginTop: 4, textAlign: 'center' },
});