import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  RefreshControl,
  TextInput,
} from 'react-native';

import Icon from 'react-native-vector-icons/Feather';

import Header from '../../components/Header';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';

import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius } from '../../theme/theme';

const PRIMARY = colors.primary || '#4F8EF7';

const BG = '#F4F7FB';
const CARD = '#FFFFFF';

const TEXT_DARK = '#111827';
const TEXT_MID = '#6B7280';
const TEXT_LIGHT = '#94A3B8';

const BORDER = '#E5EAF0';

const SUCCESS = '#16A34A';
const WARNING = '#D97706';

export default function MarkAttendanceScreen() {
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(null);

  const [students, setStudents] = useState([]);
  const [presence, setPresence] = useState({});

  const [refreshing, setRefreshing] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await api.get('/courses');

      setCourses(
        (res.data || []).filter(
          c =>
            c.lecturerId === user?.id ||
            c.lecturerId === user?.uid
        )
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to load courses');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  }, []);

  const selectCourse = async (course) => {
    try {
      setLoadingStudents(true);

      setSelected(course);

      const { data } = await api.get(
        `/courses/${course.id}/students`
      );

      setStudents(data || []);

      const initialPresence = {};

      (data || []).forEach(student => {
        initialPresence[student.studentId] = false;
      });

      setPresence(initialPresence);
    } catch (e) {
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const toggleAttendance = (studentId) => {
    setPresence(prev => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const markAllPresent = () => {
    const updated = {};

    students.forEach(student => {
      updated[student.studentId] = true;
    });

    setPresence(updated);
  };

  const clearAttendance = () => {
    const updated = {};

    students.forEach(student => {
      updated[student.studentId] = false;
    });

    setPresence(updated);
  };

  const submit = async () => {
    try {
      const records = Object.keys(presence).map(
        studentId => ({
          studentId,
          present: !!presence[studentId],
        })
      );

      await api.post('/attendance/mark', {
        courseId: selected.id,
        records,
      });

      Alert.alert(
        'Success',
        'Attendance saved successfully'
      );

      setSelected(null);
      setStudents([]);
      setPresence({});
      setSearch('');
    } catch (e) {
      Alert.alert(
        'Failed',
        e?.response?.data?.message || e.message
      );
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student =>
      student.studentName
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [students, search]);

  const presentCount = Object.values(
    presence
  ).filter(Boolean).length;

  const absentCount =
    students.length - presentCount;
  if (!selected) {
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
          {courses.length === 0 ? (
            <EmptyState title="No courses assigned" />
          ) : (
            courses.map(course => (
              <TouchableOpacity
                key={course.id}
                activeOpacity={0.85}
                onPress={() =>
                  selectCourse(course)
                }
                style={styles.courseCard}
              >
                <View style={styles.courseLeft}>
                  <View style={styles.courseIcon}>
                    <Icon
                      name="book-open"
                      size={18}
                      color={PRIMARY}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.courseTitle}>
                      {course.courseName}
                    </Text>

                    <Text
                      style={styles.courseMeta}
                    >
                      {course.courseCode} •{' '}
                      {course.venue || 'TBA'}
                    </Text>
                  </View>
                </View>

                <Icon
                  name="chevron-right"
                  size={18}
                  color={TEXT_LIGHT}
                />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {students.length}
            </Text>

            <Text style={styles.statLabel}>
              Students
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text
              style={[
                styles.statValue,
                { color: SUCCESS },
              ]}
            >
              {presentCount}
            </Text>

            <Text style={styles.statLabel}>
              Present
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text
              style={[
                styles.statValue,
                { color: WARNING },
              ]}
            >
              {absentCount}
            </Text>

            <Text style={styles.statLabel}>
              Absent
            </Text>
          </View>
        </View>
        <View style={styles.searchBox}>
          <Icon
            name="search"
            size={16}
            color={TEXT_LIGHT}
          />

          <TextInput
            placeholder="Search students..."
            placeholderTextColor={TEXT_LIGHT}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={markAllPresent}
          >
            <Icon
              name="check-circle"
              size={16}
              color={SUCCESS}
            />

            <Text
              style={[
                styles.actionText,
                { color: SUCCESS },
              ]}
            >
              Mark All Present
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={clearAttendance}
          >
            <Icon
              name="x-circle"
              size={16}
              color={WARNING}
            />

            <Text
              style={[
                styles.actionText,
                { color: WARNING },
              ]}
            >
              Clear
            </Text>
          </TouchableOpacity>
        </View>
        {loadingStudents ? (
          <View style={styles.loadingBox}>
            <Text>Loading students...</Text>
          </View>
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            title="No students found"
          />
        ) : (
          filteredStudents.map(student => {
            const isPresent =
              !!presence[student.studentId];

            return (
              <TouchableOpacity
                key={student.studentId}
                activeOpacity={0.85}
                onPress={() =>
                  toggleAttendance(
                    student.studentId
                  )
                }
                style={[
                  styles.studentCard,
                  isPresent &&
                    styles.studentCardActive,
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    isPresent &&
                      styles.checkboxActive,
                  ]}
                >
                  {isPresent && (
                    <Icon
                      name="check"
                      size={14}
                      color="#fff"
                    />
                  )}
                </View>
                <View style={styles.avatar}>
                  <Text
                    style={styles.avatarText}
                  >
                    {student.studentName?.charAt(
                      0
                    )}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.studentName,
                      isPresent && {
                        color: '#fff',
                      },
                    ]}
                  >
                    {student.studentName}
                  </Text>

                  <Text
                    style={[
                      styles.studentEmail,
                      isPresent && {
                        color: '#DCE7FF',
                      },
                    ]}
                  >
                    {student.studentEmail}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        isPresent
                          ? 'rgba(255,255,255,0.2)'
                          : '#EEF2F7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: isPresent
                          ? '#fff'
                          : TEXT_MID,
                      },
                    ]}
                  >
                    {isPresent
                      ? 'Present'
                      : 'Absent'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <Button
          title="Save Attendance"
          onPress={submit}
          style={{ marginTop: 20 }}
        />

        <Button
          title="Back"
          variant="ghost"
          onPress={() => {
            setSelected(null);
            setStudents([]);
            setPresence({});
          }}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  scroll: {
    padding: spacing.lg || 20,
  },
  courseCard: {
    backgroundColor: CARD,
    borderRadius: 22,

    padding: 18,
    marginBottom: 14,

    borderWidth: 1,
    borderColor: BORDER,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: {
          width: 0,
          height: 3,
        },
      },

      android: {
        elevation: 2,
      },
    }),
  },

  courseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  courseIcon: {
    width: 50,
    height: 50,

    borderRadius: 16,

    backgroundColor: PRIMARY + '15',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 14,
  },

  courseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_DARK,
  },

  courseMeta: {
    fontSize: 12,
    color: TEXT_MID,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },

  statCard: {
    flex: 1,

    backgroundColor: CARD,

    borderRadius: 18,

    paddingVertical: 20,

    alignItems: 'center',

    borderWidth: 1,
    borderColor: BORDER,
  },

  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT_DARK,
  },

  statLabel: {
    marginTop: 5,
    fontSize: 12,
    color: TEXT_MID,
    fontWeight: '600',
  },
  searchBox: {
    height: 54,

    backgroundColor: CARD,

    borderRadius: 18,

    borderWidth: 1,
    borderColor: BORDER,

    paddingHorizontal: 16,

    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 18,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: TEXT_DARK,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  actionBtn: {
    flex: 1,

    height: 50,

    borderRadius: 16,

    backgroundColor: CARD,

    borderWidth: 1,
    borderColor: BORDER,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,
  },

  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  studentCard: {
    backgroundColor: CARD,

    borderRadius: 20,

    padding: 16,

    marginBottom: 12,

    borderWidth: 1,
    borderColor: BORDER,

    flexDirection: 'row',
    alignItems: 'center',

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 5,
        shadowOffset: {
          width: 0,
          height: 2,
        },
      },

      android: {
        elevation: 1,
      },
    }),
  },

  studentCardActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },

  checkbox: {
    width: 26,
    height: 26,

    borderRadius: 8,

    borderWidth: 2,
    borderColor: BORDER,

    marginRight: 14,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#fff',
  },

  checkboxActive: {
    backgroundColor: SUCCESS,
    borderColor: SUCCESS,
  },
  avatar: {
    width: 48,
    height: 48,

    borderRadius: 24,

    backgroundColor: '#E8F0FF',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 14,
  },

  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: PRIMARY,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
  },

  studentEmail: {
    fontSize: 12,
    color: TEXT_MID,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 30,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  loadingBox: {
    backgroundColor: CARD,
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
  },
});