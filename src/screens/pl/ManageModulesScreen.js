import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import Icon from 'react-native-vector-icons/Feather';

import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';

import { api } from '../../services/api';
import { colors, spacing } from '../../theme/theme';

const PRIMARY = colors.primary || '#4F8EF7';

const STREAMS = [
  'Software Engineering',
  'Information Technology',
  'Business IT',
];

export default function ManageModulesScreen() {
  const [list, setList] = useState([]);
  const [lecturers, setLecturers] =
    useState([]);

  const [form, setForm] = useState({
    courseCode: '',
    courseName: '',
    venue: '',
    scheduledTime: '',
    stream: '',
    totalStudents: '',
    lecturerId: '',
    lecturerName: '',
  });

  const update = (k, v) =>
    setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [courses, users] =
        await Promise.all([
          api.get('/courses'),
          api.get('/users/lecturers'),
        ]);

      setList(courses.data || []);
      setLecturers(users.data || []);
    } catch {}
  };

  const save = async () => {
    if (
      !form.courseCode ||
      !form.courseName
    ) {
      return Alert.alert(
        'Missing',
        'Course code and name required'
      );
    }

    try {
      await api.post('/courses', form);

      Alert.alert(
        'Success',
        'Module added'
      );

      setForm({
        courseCode: '',
        courseName: '',
        venue: '',
        scheduledTime: '',
        stream: '',
        totalStudents: '',
        lecturerId: '',
        lecturerName: '',
      });

      load();
    } catch (e) {
      Alert.alert(
        'Failed',
        e?.response?.data?.message ||
          e.message
      );
    }
  };

  const remove = async id => {
    try {
      await api.delete(`/courses/${id}`);
      load();
    } catch (e) {
      Alert.alert(
        'Failed',
        e.message
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>
            Add New Course
          </Text>

          <Input
            label="Course Code"
            value={form.courseCode}
            onChangeText={v =>
              update(
                'courseCode',
                v
              )
            }
          />

          <Input
            label="Course Name"
            value={form.courseName}
            onChangeText={v =>
              update(
                'courseName',
                v
              )
            }
          />

          <Input
            label="Venue"
            value={form.venue}
            onChangeText={v =>
              update('venue', v)
            }
          />

          <Input
            label="Scheduled Time"
            placeholder="Mon 10:00 - 12:00"
            value={form.scheduledTime}
            onChangeText={v =>
              update(
                'scheduledTime',
                v
              )
            }
          />

          <Input
            label="Total Students"
            keyboardType="numeric"
            value={
              form.totalStudents
            }
            onChangeText={v =>
              update(
                'totalStudents',
                v
              )
            }
          />
          <Text style={styles.label}>
            Stream
          </Text>

          <View style={styles.wrap}>
            {STREAMS.map(s => (
              <TouchableOpacity
                key={s}
                onPress={() =>
                  update(
                    'stream',
                    s
                  )
                }
                style={[
                  styles.tag,
                  form.stream ===
                    s &&
                    styles.tagActive,
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    form.stream ===
                      s &&
                      styles.tagTextActive,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>
            Assign Lecturer
          </Text>

          <View style={styles.wrap}>
            {lecturers.map(l => (
              <TouchableOpacity
                key={l.id}
                onPress={() => {
                  update(
                    'lecturerId',
                    l.id
                  );

                  update(
                    'lecturerName',
                    l.name
                  );
                }}
                style={[
                  styles.tag,
                  form.lecturerId ===
                    l.id &&
                    styles.tagActive,
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    form.lecturerId ===
                      l.id &&
                      styles.tagTextActive,
                  ]}
                >
                  {l.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title="Add Course"
            onPress={save}
            style={{
              marginTop: spacing.md,
            }}
          />
        </View>

        <Text style={styles.section}>
          All Course
        </Text>

        {list.map(c => (
          <View
            key={c.id}
            style={styles.moduleCard}
          >
            <View
              style={styles.topRow}
            >
              <View
                style={styles.iconBox}
              >
                <Icon
                  name="book"
                  size={18}
                  color={PRIMARY}
                />
              </View>

              <View
                style={{ flex: 1 }}
              >
                <Text
                  style={
                    styles.moduleName
                  }
                >
                  {c.courseName}
                </Text>

                <Text
                  style={
                    styles.moduleMeta
                  }
                >
                  {c.courseCode} •{' '}
                  {c.stream || '—'}
                </Text>
              </View>
            </View>

            <View
              style={styles.infoBox}
            >
              <Text
                style={
                  styles.infoText
                }
              >
                 {c.venue || 'TBA'}
              </Text>

              <Text
                style={
                  styles.infoText
                }
              >
                {' '}
                {c.scheduledTime ||
                  'TBA'}
              </Text>

              <Text
                style={
                  styles.infoText
                }
              >
                {' '}
                {c.lecturerName ||
                  'Unassigned'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                remove(c.id)
              }
              style={
                styles.deleteBtn
              }
            >
              <Icon
                name="trash-2"
                size={15}
                color="#DC2626"
              />

              <Text
                style={
                  styles.deleteText
                }
              >
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  scroll: {
    padding: spacing.lg || 20,
  },

  card: {
    backgroundColor: '#fff',

    borderRadius: 24,

    padding: 20,

    borderWidth: 1,
    borderColor: '#E5EAF0',
  },

  title: {
    fontSize: 18,
    fontWeight: '800',

    marginBottom: 16,

    color: '#111827',
  },

  label: {
    marginTop: 10,
    marginBottom: 10,

    fontSize: 14,
    fontWeight: '700',

    color: '#111827',
  },

  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  tag: {
    paddingHorizontal: 14,
    paddingVertical: 10,

    borderRadius: 14,

    borderWidth: 1,
    borderColor: '#E5EAF0',

    marginRight: 8,
    marginBottom: 8,

    backgroundColor: '#fff',
  },

  tagActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },

  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },

  tagTextActive: {
    color: '#fff',
  },

  section: {
    fontSize: 16,
    fontWeight: '800',

    marginTop: 22,
    marginBottom: 14,

    color: '#111827',
  },

  moduleCard: {
    backgroundColor: '#fff',

    borderRadius: 22,

    padding: 18,

    marginBottom: 14,

    borderWidth: 1,
    borderColor: '#E5EAF0',
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconBox: {
    width: 48,
    height: 48,

    borderRadius: 16,

    backgroundColor:
      PRIMARY + '15',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 14,
  },

  moduleName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  moduleMeta: {
    fontSize: 12,
    color: '#6B7280',

    marginTop: 4,
  },

  infoBox: {
    marginTop: 16,
    gap: 6,
  },

  infoText: {
    fontSize: 13,
    color: '#4B5563',
  },

  deleteBtn: {
    marginTop: 18,

    height: 44,

    borderRadius: 14,

    backgroundColor:
      '#FEF2F2',

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,
  },

  deleteText: {
    color: '#DC2626',
    fontWeight: '700',
  },
});