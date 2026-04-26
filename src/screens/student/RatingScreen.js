import React, { useEffect, useState, useCallback, useRef } from 'react';
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
const GOLD       = '#F59E0B';
const GOLD_BG    = '#FFFBEB';
const GREEN      = '#16A34A';
const GREEN_BG   = '#F0FDF4';

const MAX_COMMENT = 300;

const COURSE_PALETTE = [
  { accent: '#3B6FD4', icon: 'book-open' },
  { accent: '#16A34A', icon: 'layers'    },
  { accent: '#D97706', icon: 'cpu'       },
  { accent: '#9333EA', icon: 'code'      },
  { accent: '#E11D48', icon: 'activity'  },
  { accent: '#0284C7', icon: 'globe'     },
];
const palette = (i) => COURSE_PALETTE[i % COURSE_PALETTE.length];
const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

function Star({ filled, onPress, size = 32 }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.35, useNativeDriver: true, speed: 40 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 40 }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Icon
          name="star"
          size={size}
          color={filled ? GOLD : BORDER}
          style={{ marginRight: 6 }}
          solid={filled}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

function StarRating({ score, onChange }) {
  return (
    <View style={s.starBlock}>
      <View style={s.starRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <Star key={n} filled={n <= score} onPress={() => onChange(n)} />
        ))}
      </View>
      {score > 0 && (
        <Text style={s.starLabel}>{STAR_LABELS[score]}</Text>
      )}
    </View>
  );
}

function RatingForm({ score, setScore, comment, setComment, onSubmit, submitting }) {
  const remaining = MAX_COMMENT - comment.length;

  return (
    <View style={s.form}>
      <View style={s.formDivider} />

      <Text style={s.formLabel}>Your rating</Text>
      <StarRating score={score} onChange={setScore} />

      <Text style={[s.formLabel, { marginTop: 16 }]}>Comment <Text style={s.optional}>(optional)</Text></Text>
      <View style={s.commentWrap}>
        <TextInput
          style={s.commentInput}
          value={comment}
          onChangeText={t => t.length <= MAX_COMMENT && setComment(t)}
          placeholder="Share your experience with this lecturer…"
          placeholderTextColor={TEXT_LIGHT}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={[s.charCount, remaining < 30 && { color: '#EF4444' }]}>
          {remaining} left
        </Text>
      </View>

      <TouchableOpacity
        style={[s.submitBtn, (!score || submitting) && s.submitBtnDisabled]}
        onPress={onSubmit}
        disabled={!score || submitting}
        activeOpacity={0.85}
      >
        <Icon name={submitting ? 'loader' : 'send'} size={15} color="#FFF" />
        <Text style={s.submitBtnText}>{submitting ? 'Submitting…' : 'Submit Rating'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function RatedBadge({ score }) {
  return (
    <View style={s.ratedBadge}>
      <Icon name="check-circle" size={12} color={GREEN} />
      <Text style={s.ratedBadgeText}>Rated {score}/5</Text>
    </View>
  );
}

function EnrollmentCard({ enrollment, index, activeId, onToggle, onSubmit }) {
  const isOpen    = activeId === enrollment.id;
  const isRated   = !!enrollment._rated;
  const p         = palette(index);
  const course    = enrollment.course ?? {};

  const [score,      setScore]      = useState(5);
  const [comment,    setComment]    = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const ok = await onSubmit(enrollment, score, comment);
    if (ok) { setScore(5); setComment(''); }
    setSubmitting(false);
  };

  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 30 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={[s.card, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={() => !isRated && onToggle(enrollment.id)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <View style={s.cardHeader}>
          <View style={[s.cardIcon, { backgroundColor: p.accent + '1A' }]}>
            <Icon name={p.icon} size={18} color={p.accent} />
          </View>

          <View style={s.cardInfo}>
            <Text style={s.cardName} numberOfLines={1}>
              {course.courseName ?? 'Course'}
            </Text>
            <Text style={s.cardCode} numberOfLines={1}>
              {course.courseCode ?? ''}
            </Text>

            <View style={s.lecturerRow}>
              <Icon name="user" size={11} color={TEXT_LIGHT} />
              <Text style={s.lecturerName} numberOfLines={1}>
                {course.lecturerName ?? 'Unassigned'}
              </Text>
            </View>

            {course.venue ? (
              <View style={[s.lecturerRow, { marginTop: 3 }]}>
                <Icon name="map-pin" size={11} color={TEXT_LIGHT} />
                <Text style={s.lecturerName}>{course.venue}</Text>
              </View>
            ) : null}
          </View>

          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            {isRated ? (
              <RatedBadge score={enrollment._ratedScore} />
            ) : (
              <View style={[s.rateBtn, { borderColor: p.accent }, isOpen && { backgroundColor: p.accent }]}>
                <Text style={[s.rateBtnText, { color: isOpen ? '#FFF' : p.accent }]}>
                  {isOpen ? 'Cancel' : 'Rate'}
                </Text>
              </View>
            )}
            {!isRated && (
              <Icon
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={TEXT_LIGHT}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {isOpen && !isRated && (
        <RatingForm
          score={score}
          setScore={setScore}
          comment={comment}
          setComment={setComment}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </Animated.View>
  );
}

export default function RatingScreen() {
  const [enrollments, setEnrollments] = useState([]);
  const [activeId, setActiveId]       = useState(null);
  const [refreshing, setRefresh]      = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/courses/my-enrollments');
      setEnrollments(r.data ?? []);
    } catch (_) {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefresh(true);
    await load();
    setRefresh(false);
  }, [load]);

  const toggleActive = useCallback((id) => {
    setActiveId(prev => prev === id ? null : id);
  }, []);

  const submitRating = useCallback(async (enrollment, score, comment) => {
    const course = enrollment.course ?? {};
    try {
      await api.post('/ratings', {
        targetType: 'lecturer',
        targetId:   course.lecturerId   ?? enrollment.lecturerId ?? 'unknown',
        targetName: course.lecturerName ?? 'Lecturer',
        courseId:   enrollment.courseId,
        score,
        comment,
      });

      setEnrollments(prev =>
        prev.map(e =>
          e.id === enrollment.id
            ? { ...e, _rated: true, _ratedScore: score }
            : e
        )
      );
      setActiveId(null);

      Alert.alert('Thank you!', 'Your rating has been submitted successfully.');
      return true;
    } catch (e) {
      Alert.alert('Submission failed', e?.response?.data?.message || e.message);
      return false;
    }
  }, []);

  const ratedCount = enrollments.filter(e => e._rated).length;

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
          <Text style={s.headTitle}>Rate Lecturers</Text>
          <Text style={s.headSub}>Share your experience with your lecturers</Text>
        </View>

        {enrollments.length > 0 && (
          <View style={s.progressStrip}>
            <View style={s.progressInfo}>
              <Icon name="star" size={14} color={GOLD} />
              <Text style={s.progressText}>
                {ratedCount} of {enrollments.length} rated
              </Text>
            </View>
            <View style={s.progressTrack}>
              <View style={[
                s.progressFill,
                { width: `${enrollments.length ? (ratedCount / enrollments.length) * 100 : 0}%` }
              ]} />
            </View>
          </View>
        )}

        {enrollments.length === 0 && (
          <View style={s.empty}>
            <Icon name="star" size={34} color={TEXT_LIGHT} />
            <Text style={s.emptyTitle}>No courses to rate</Text>
            <Text style={s.emptySub}>Enroll in courses first to rate your lecturers.</Text>
          </View>
        )}

        {enrollments.map((e, i) => (
          <EnrollmentCard
            key={e.id}
            enrollment={e}
            index={i}
            activeId={activeId}
            onToggle={toggleActive}
            onSubmit={submitRating}
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

  progressStrip: {
    backgroundColor: CARD_BG, borderRadius: 14, padding: 14,
    marginBottom: 18, borderWidth: 1, borderColor: BORDER,
  },
  progressInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  progressText: { fontSize: 13, fontWeight: '600', color: TEXT_MID },
  progressTrack: {
    height: 6, backgroundColor: BORDER, borderRadius: 3, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: GOLD, borderRadius: 3,
  },

  card: {
    backgroundColor: CARD_BG, borderRadius: 18,
    borderWidth: 1, borderColor: BORDER,
    marginBottom: 14, overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 16 },
  cardIcon:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardInfo:   { flex: 1, marginRight: 10 },
  cardName:   { fontSize: 14, fontWeight: '700', color: TEXT_DARK, marginBottom: 2 },
  cardCode:   { fontSize: 11, fontWeight: '600', color: TEXT_LIGHT, marginBottom: 6 },
  lecturerRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  lecturerName: { fontSize: 12, color: TEXT_LIGHT, fontWeight: '500', flex: 1 },

  rateBtn: {
    borderWidth: 1.5, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  rateBtnText: { fontSize: 12, fontWeight: '700' },

  ratedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: GREEN_BG, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  ratedBadgeText: { fontSize: 11, fontWeight: '700', color: GREEN },

  form:       { paddingHorizontal: 16, paddingBottom: 16 },
  formDivider:{ height: 1, backgroundColor: BORDER, marginBottom: 16 },
  formLabel:  { fontSize: 12, fontWeight: '700', color: TEXT_MID, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  optional:   { fontWeight: '400', textTransform: 'none', letterSpacing: 0, color: TEXT_LIGHT },

  starBlock: { alignItems: 'flex-start', marginBottom: 4 },
  starRow:   { flexDirection: 'row', marginBottom: 6 },
  starLabel: { fontSize: 13, fontWeight: '700', color: GOLD },

  commentWrap: {
    backgroundColor: BG, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER,
    padding: 12, marginBottom: 16,
  },
  commentInput: {
    fontSize: 14, color: TEXT_DARK, minHeight: 80,
    fontWeight: '400', lineHeight: 20,
  },
  charCount: { fontSize: 11, color: TEXT_LIGHT, textAlign: 'right', marginTop: 6, fontWeight: '600' },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 13,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  empty:      { alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT_MID, marginTop: 12 },
  emptySub:   { fontSize: 13, color: TEXT_LIGHT, marginTop: 4, textAlign: 'center' },
});