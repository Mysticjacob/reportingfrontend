import React, { useEffect, useState } from 'react';

import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import Icon from 'react-native-vector-icons/Feather';

import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';

import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../theme/theme';

const PRIMARY = colors.primary || '#4F8EF7';

export default function SubmitReportScreen() {
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    className: '',
    weekOfReporting: '',
    dateOfLecture: '',
    actualStudentsPresent: '',
    totalRegisteredStudents: '',
    topicTaught: '',
    learningOutcomes: '',
    recommendations: '',
  });

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(
        (res.data || []).filter(
          c => c.lecturerId === user?.id || c.lecturerId === user?.uid
        )
      );
    } catch {}
  };

  const submit = async () => {
    if (!course) return Alert.alert('Select a course');
    if (submitting) return;

    setSubmitting(true);
    try {
      await api.post('/reports', {
        ...form,
        courseId: course.id,
        courseName: course.courseName,
        courseCode: course.courseCode,
        venue: course.venue,
        scheduledTime: course.scheduledTime,
        stream: course.stream,
      });

      Alert.alert('Success', 'Report submitted successfully');

      setForm({
        className: '',
        weekOfReporting: '',
        dateOfLecture: '',
        actualStudentsPresent: '',
        totalRegisteredStudents: '',
        topicTaught: '',
        learningOutcomes: '',
        recommendations: '',
      });
    } catch (e) {
      Alert.alert('Failed', e?.response?.data?.message || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={styles.section}>Select Course</Text>

        {courses.map(c => {
          const active = course?.id === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              activeOpacity={0.85}
              onPress={() => setCourse(c)}
              style={[styles.courseCard, active && styles.courseCardActive]}
            >
              <View style={styles.courseRow}>
                <View>
                  <Text style={styles.courseTitle}>{c.courseName}</Text>
                  <Text style={styles.courseMeta}>
                    {c.courseCode} • {c.venue}
                  </Text>
                </View>

                {active && (
                  <View style={styles.check}>
                    <Icon name="check" size={14} color="#fff" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.form}>
          <Input
            label="Class Name"
            value={form.className}
            onChangeText={v => update('className', v)}
          />

          <Input
            label="Week Number"
            value={form.weekOfReporting}
            keyboardType="numeric"
            onChangeText={v => update('weekOfReporting', v)}
          />

          <Input
            label="Lecture Date"
            value={form.dateOfLecture}
            placeholder="YYYY-MM-DD"
            onChangeText={v => update('dateOfLecture', v)}
          />

          <Input
            label="Students Present"
            value={form.actualStudentsPresent}
            keyboardType="numeric"
            onChangeText={v => update('actualStudentsPresent', v)}
          />

          <Input
            label="Registered Students"
            value={form.totalRegisteredStudents}
            keyboardType="numeric"
            onChangeText={v => update('totalRegisteredStudents', v)}
          />

          <Input
            label="Topic Taught"
            multiline
            value={form.topicTaught}
            onChangeText={v => update('topicTaught', v)}
          />

          <Input
            label="Learning Outcomes"
            multiline
            value={form.learningOutcomes}
            onChangeText={v => update('learningOutcomes', v)}
          />

          <Input
            label="Recommendations"
            multiline
            value={form.recommendations}
            onChangeText={v => update('recommendations', v)}
          />

          <Button
            title={submitting ? 'Submitting...' : 'Submit Report'}
            onPress={submit}
            loading={submitting}
            disabled={submitting}
            style={{ marginTop: spacing.md }}
          />
        </View>

        <View style={{ height: 320 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  scroll: {
    padding: spacing.lg || 20,
    flexGrow: 1,
  },
  section: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5EAF0',
  },
  courseCardActive: {
    borderColor: PRIMARY,
    borderWidth: 2,
    backgroundColor: PRIMARY + '08',
  },
  courseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  courseMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    marginTop: 10,
    gap: 10,
  },
});
