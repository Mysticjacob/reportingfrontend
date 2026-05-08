import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  KeyboardAvoidingView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

import { api } from '../../services/api';
import { colors } from '../../theme/theme';

const ACCENT = colors.primary || '#4F8EF7';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const formatDateTime = (val) => {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleString();
  } catch {
    return String(val);
  }
};

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>
      {value !== undefined && value !== null && value !== ''
        ? String(value)
        : '—'}
    </Text>
  </View>
);

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

export default function PRLReportsScreen() {
  const [reports, setReports] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [feedbackOpenId, setFeedbackOpenId] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const r = await api.get('/reports');
      setReports(r.data);
    } catch (e) {
      Alert.alert('Failed to load', e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
    if (feedbackOpenId && feedbackOpenId !== id) {
      setFeedbackOpenId(null);
      setText('');
    }
  };

  const send = async () => {
    if (!text.trim()) {
      Alert.alert('Empty', 'Please write feedback before sending.');
      return;
    }
    try {
      setSending(true);
      Keyboard.dismiss();
      await api.post(`/reports/${feedbackOpenId}/feedback`, { feedback: text });
      Alert.alert('Success', 'Feedback sent');
      setFeedbackOpenId(null);
      setText('');
      await load();
    } catch (e) {
      Alert.alert('Failed', e?.response?.data?.message || e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {loading && reports.length === 0 && (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={styles.emptyText}>Loading reports...</Text>
          </View>
        )}

        {!loading && reports.length === 0 && (
          <View style={styles.empty}>
            <Icon name="file-text" size={40} color="#94A3B8" />
            <Text style={styles.emptyText}>No reports available</Text>
          </View>
        )}

        {reports.map((r) => {
          const reviewed = !!r.prlFeedback;
          const present = Number(r.actualStudentsPresent) || 0;
          const total = Number(r.totalRegisteredStudents) || 0;
          const attendancePct =
            total > 0 ? Math.round((present / total) * 100) : 0;
          const isExpanded = expandedId === r.id;

          return (
            <View key={r.id} style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleExpand(r.id)}
                style={styles.cardHeader}
              >
                <View style={styles.headerLeft}>
                  <View style={styles.iconCircle}>
                    <Icon name="book-open" size={16} color={ACCENT} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.course} numberOfLines={1}>
                      {r.courseName || 'Untitled course'}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {r.lecturerName || 'Unknown lecturer'}
                      {r.dateOfLecture ? ` • ${r.dateOfLecture}` : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.headerRight}>
                  <View
                    style={[
                      styles.badge,
                      reviewed ? styles.reviewed : styles.pending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: reviewed ? '#166534' : '#92400E' },
                      ]}
                    >
                      {reviewed ? 'Reviewed' : 'Pending'}
                    </Text>
                  </View>
                  <Icon
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#94A3B8"
                    style={{ marginLeft: 8 }}
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.expanded}>
                  <Section title="Course & Class">
                    <Row label="Faculty" value={r.facultyName} />
                    <Row label="Class" value={r.className} />
                    <Row label="Course Name" value={r.courseName} />
                    <Row label="Stream" value={r.stream} />
                  </Section>

                  <Section title="Schedule">
                    <Row label="Week" value={r.weekOfReporting} />
                    <Row label="Date of Lecture" value={r.dateOfLecture} />
                    <Row label="Scheduled Time" value={r.scheduledTime} />
                    <Row label="Venue" value={r.venue} />
                  </Section>

                  <Section title="Lecturer">
                    <Row label="Name" value={r.lecturerName} />
                  </Section>

                  <Section title="Attendance">
                    <View style={styles.stats}>
                      <Icon name="users" size={14} color={ACCENT} />
                      <Text style={styles.statsText}>
                        {present}/{total} Students ({attendancePct}%)
                      </Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${attendancePct}%` },
                        ]}
                      />
                    </View>
                    <Row label="Present" value={r.actualStudentsPresent} />
                    <Row label="Registered" value={r.totalRegisteredStudents} />
                  </Section>

                  <Section title="Teaching">
                    <Row label="Topic Taught" value={r.topicTaught} />
                    <Row label="Learning Outcomes" value={r.learningOutcomes} />
                    <Row label="Recommendations" value={r.recommendations} />
                  </Section>

                  <Section title="Date">
                    <Row label="Created" value={formatDateTime(r.createdAt)} />
                  </Section>

                  {reviewed && (
                    <View style={styles.feedbackBox}>
                      <View style={styles.feedbackHeader}>
                        <Icon name="check-circle" size={14} color={ACCENT} />
                        <Text style={styles.feedbackLabel}>PRL Feedback</Text>
                      </View>
                      <Text style={styles.feedbackText}>{r.prlFeedback}</Text>
                      {(r.prlFeedbackBy || r.prlFeedbackAt) && (
                        <Text style={styles.feedbackMeta}>
                          {r.prlFeedbackBy ? `By ${r.prlFeedbackBy}` : ''}
                          {r.prlFeedbackBy && r.prlFeedbackAt ? ' • ' : ''}
                          {r.prlFeedbackAt
                            ? formatDateTime(r.prlFeedbackAt)
                            : ''}
                        </Text>
                      )}
                    </View>
                  )}

                  {!reviewed && feedbackOpenId === r.id && (
                    <View style={{ marginTop: 16 }}>
                      <View style={styles.inputBox}>
                        <Text style={styles.inputLabel}>Feedback</Text>
                        <TextInput
                          multiline
                          value={text}
                          onChangeText={setText}
                          placeholder="Write your feedback..."
                          placeholderTextColor="#94A3B8"
                          style={styles.input}
                          editable={!sending}
                        />
                      </View>

                      <TouchableOpacity
                        style={[styles.sendBtn, sending && { opacity: 0.7 }]}
                        onPress={send}
                        disabled={sending}
                      >
                        {sending ? (
                          <View style={styles.sendingRow}>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={[styles.sendText, { marginLeft: 8 }]}>
                              Sending...
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.sendText}>Send Feedback</Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setFeedbackOpenId(null);
                          setText('');
                        }}
                        style={styles.cancelBtn}
                        disabled={sending}
                      >
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {!reviewed && feedbackOpenId !== r.id && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => setFeedbackOpenId(r.id)}
                    >
                      <Icon name="message-square" size={15} color="#fff" />
                      <Text style={styles.actionText}>Add Feedback</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 80 },

  empty: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  emptyText: { marginTop: 12, color: '#64748B', fontWeight: '600' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  course: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  meta: { marginTop: 2, color: '#64748B', fontSize: 12 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  reviewed: { backgroundColor: '#DCFCE7' },
  pending: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

  expanded: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  section: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },

  row: { flexDirection: 'row', marginTop: 4 },
  rowLabel: { width: 130, color: '#64748B', fontSize: 12, fontWeight: '600' },
  rowValue: { flex: 1, color: '#0F172A', fontSize: 13, lineHeight: 20 },

  stats: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statsText: {
    marginLeft: 8,
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },

  progressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 999 },

  feedbackBox: {
    marginTop: 16,
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  feedbackLabel: {
    fontWeight: '800',
    color: ACCENT,
    marginLeft: 6,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  feedbackText: { color: '#0F172A', lineHeight: 20, fontSize: 13 },
  feedbackMeta: { marginTop: 8, color: '#64748B', fontSize: 11 },

  actionBtn: {
    marginTop: 16,
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontWeight: '700', marginLeft: 8, fontSize: 14 },

  inputBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputLabel: {
    marginBottom: 6,
    fontWeight: '700',
    color: '#334155',
    fontSize: 12,
  },
  input: {
    minHeight: 90,
    color: '#0F172A',
    textAlignVertical: 'top',
    fontSize: 13,
  },

  sendBtn: {
    marginTop: 12,
    backgroundColor: ACCENT,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendText: { color: '#fff', fontWeight: '700' },
  sendingRow: { flexDirection: 'row', alignItems: 'center' },

  cancelBtn: { marginTop: 10, alignItems: 'center' },
  cancelText: { color: '#64748B', fontWeight: '600' },
});
