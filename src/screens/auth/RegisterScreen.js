import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { colors, spacing, typography, radius } from '../../theme/theme';

const ROLES = [
  { id: 'student',  label: 'Student',  icon: 'school-outline',     desc: 'Access courses & reports' },
  { id: 'lecturer', label: 'Lecturer', icon: 'person-outline',     desc: 'Manage classes' },
  { id: 'prl',      label: 'PRL',      icon: 'clipboard-outline',  desc: 'Principal Lecturer' },
  { id: 'pl',       label: 'PL',       icon: 'star-outline',       desc: 'Program Leader' },
];

const STREAMS = [
  { id: 'Software Engineering',  short: 'SE'  },
  { id: 'Information Technology', short: 'IT'  },
  { id: 'Business IT',           short: 'BIT' },
];

const STEPS = ['Account', 'Role', 'Confirm'];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'student', stream: '',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [step]);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: null }));
  };

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.name.trim())  e.name = 'Name is required';
      if (!form.email.trim()) e.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
      if (!form.password) e.password = 'Password is required';
      else if (form.password.length < 6) e.password = 'Min 6 characters';
    }
    if (step === 1 && form.role !== 'student' && !form.stream) {
      e.stream = 'Please select a stream';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(-20);
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        stream: form.role === 'student' ? null : form.stream || null,
      });
    } catch (e) {
      Alert.alert('Registration failed', e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle="dark-content" />

      <View style={styles.headerDecor} pointerEvents="none">
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.wrap}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >

        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>L</Text>
          </View>
          <Text style={styles.brandName}>Limkokwing Reporting</Text>
        </View>

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          Join thousands of educators and students on the LUCT reporting system
        </Text>

        <View style={styles.stepper}>
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <View style={styles.stepItem}>
                <View style={[styles.stepCircle, i <= step && styles.stepCircleActive]}>
                  {i < step ? (
                    <Ionicons name="checkmark" size={16} color={colors.textInverse} />
                  ) : (
                    <Text style={[styles.stepNumber, i <= step && styles.stepNumberActive]}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, i <= step && styles.stepLabelActive]}>
                  {label}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, i < step && styles.stepLineActive]} />
              )}
            </React.Fragment>
          ))}
        </View>

        <Animated.View
          style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >

          {step === 0 && (
            <View>
              <Text style={styles.cardTitle}>Personal information</Text>
              <View style={styles.field}>
                <Input
                  label="Full name"
                  value={form.name}
                  onChangeText={(v) => set('name', v)}
                  placeholder="Selekane Pents'e"
                />
                {errors.name && <Text style={styles.error}>{errors.name}</Text>}
              </View>

              <View style={styles.field}>
                <Input
                  label="Email address"
                  value={form.email}
                  onChangeText={(v) => set('email', v)}
                  placeholder="selekanepentse@gmail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && <Text style={styles.error}>{errors.email}</Text>}
              </View>

              <View style={styles.field}>
                <Input
                  label="Password"
                  value={form.password}
                  onChangeText={(v) => set('password', v)}
                  secureTextEntry
                  placeholder="At least 6 characters"
                />
                {errors.password && <Text style={styles.error}>{errors.password}</Text>}
              </View>
            </View>
          )}

          {step === 1 && (
            <View>
              <Text style={styles.cardTitle}>Choose your role</Text>
              <Text style={styles.cardHint}>This determines your access level</Text>

              <View style={styles.roleGrid}>
                {ROLES.map((r) => {
                  const active = form.role === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => set('role', r.id)}
                      activeOpacity={0.7}
                      style={[styles.roleCard, active && styles.roleCardActive]}
                    >
                      <Ionicons
                        name={r.icon}
                        size={22}
                        color={active ? colors.primary : colors.text}
                        style={{ marginBottom: 8 }}
                      />
                      <Text style={[styles.roleLabel, active && styles.roleLabelActive]}>
                        {r.label}
                      </Text>
                      <Text style={[styles.roleDesc, active && styles.roleDescActive]}>
                        {r.desc}
                      </Text>
                      {active && (
                        <View style={styles.roleBadge}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {form.role !== 'student' && (
                <View style={{ marginTop: spacing.lg }}>
                  <Text style={styles.cardTitle}>Select your stream</Text>
                  <Text style={styles.cardHint}>Pick the program you belong to</Text>

                  <View>
                    {STREAMS.map((s) => {
                      const active = form.stream === s.id;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          onPress={() => set('stream', s.id)}
                          activeOpacity={0.7}
                          style={[styles.streamRow, active && styles.streamRowActive]}
                        >
                          <View style={[styles.streamShort, active && styles.streamShortActive]}>
                            <Text
                              style={[
                                styles.streamShortText,
                                active && styles.streamShortTextActive,
                              ]}
                            >
                              {s.short}
                            </Text>
                          </View>
                          <Text style={[styles.streamText, active && styles.streamTextActive]}>
                            {s.id}
                          </Text>
                          <View style={[styles.radio, active && styles.radioActive]}>
                            {active && <View style={styles.radioDot} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {errors.stream && <Text style={styles.error}>{errors.stream}</Text>}
                </View>
              )}
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.cardTitle}>Review & confirm</Text>
              <Text style={styles.cardHint}>Make sure everything looks right</Text>

              <View style={styles.reviewBox}>
                <ReviewRow label="Full name" value={form.name} />
                <ReviewRow label="Email" value={form.email} />
                <ReviewRow
                  label="Role"
                  value={ROLES.find((r) => r.id === form.role)?.label}
                  last={form.role === 'student'}
                />
                {form.role !== 'student' && (
                  <ReviewRow label="Stream" value={form.stream || '—'} last />
                )}
              </View>

              <View style={styles.terms}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                <Text style={styles.termsText}>
                  By creating an account you agree to our{' '}
                  <Text style={styles.termsLink}>Terms</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.actions}>
            {step > 0 && (
              <TouchableOpacity onPress={back} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={16} color={colors.text} />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              {step < STEPS.length - 1 ? (
                <Button title="Continue" onPress={next} />
              ) : (
                <Button title="Create account" onPress={submit} loading={loading} />
              )}
            </View>
          </View>
        </Animated.View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.signinLink}>
          <Text style={styles.signinText}>
            Already have an account? <Text style={styles.signinBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ReviewRow({ label, value, last }) {
  return (
    <View style={[styles.reviewRow, !last && styles.reviewRowBorder]}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.xl, paddingTop: spacing.xxl * 1.2, flexGrow: 1 },

  headerDecor: { position: 'absolute', top: 0, left: 0, right: 0, height: 280, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.12 },
  blob1: { width: 280, height: 280, backgroundColor: colors.primary, top: -100, right: -80 },
  blob2: { width: 200, height: 200, backgroundColor: colors.primary, top: -40, left: -60, opacity: 0.08 },

  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  logo: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  logoText: { color: colors.textInverse, fontSize: 22, fontWeight: '800' },
  brandName: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },

  title: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textMuted || '#6b7280', lineHeight: 22, marginBottom: spacing.xl },

  stepper: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  stepItem: { alignItems: 'center', width: 70 },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6',
    borderWidth: 2, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  stepCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepNumber: { fontSize: 13, fontWeight: '700', color: '#9ca3af' },
  stepNumberActive: { color: colors.textInverse },
  stepLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af' },
  stepLabelActive: { color: colors.text },
  stepLine: { flex: 1, height: 2, backgroundColor: '#e5e7eb', marginBottom: 20, marginHorizontal: -10 },
  stepLineActive: { backgroundColor: colors.primary },

  card: {
    backgroundColor: '#fff', borderRadius: radius.lg || 16, padding: spacing.xl,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 4 },
    elevation: 3, borderWidth: 1, borderColor: '#f1f5f9',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardHint: { fontSize: 13, color: '#6b7280', marginBottom: spacing.lg },
  field: { marginBottom: spacing.md },
  error: { fontSize: 12, color: '#ef4444', marginTop: 4, fontWeight: '500' },

  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleCard: {
    width: '48%', padding: 14, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: '#e5e7eb', backgroundColor: '#fafbfc', position: 'relative',
  },
  roleCardActive: { borderColor: colors.primary, backgroundColor: '#fff' },
  roleLabel: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  roleLabelActive: { color: colors.primary },
  roleDesc: { fontSize: 11, color: '#6b7280', lineHeight: 15 },
  roleDescActive: { color: '#4b5563' },
  roleBadge: {
    position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  streamRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fafbfc', marginBottom: 8,
  },
  streamRowActive: { borderColor: colors.primary, backgroundColor: '#fff' },
  streamShort: {
    width: 40, height: 40, borderRadius: radius.sm || 8, backgroundColor: '#e5e7eb',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  streamShortActive: { backgroundColor: colors.primary },
  streamShortText: { fontSize: 12, fontWeight: '800', color: '#6b7280' },
  streamShortTextActive: { color: '#fff' },
  streamText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  streamTextActive: { color: colors.primary },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  reviewBox: { backgroundColor: '#f9fafb', borderRadius: radius.md, padding: 4, marginBottom: spacing.md },
  reviewRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12,
  },
  reviewRowBorder: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  reviewLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  reviewValue: { fontSize: 14, fontWeight: '700', color: colors.text, maxWidth: '60%', textAlign: 'right' },

  terms: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#f0f9ff', padding: 12, borderRadius: radius.sm || 8,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  termsText: { flex: 1, fontSize: 12, color: '#475569', lineHeight: 18 },
  termsLink: { color: colors.primary, fontWeight: '700' },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: spacing.xl },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.md,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  backBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },

  signinLink: { marginTop: spacing.xl, alignItems: 'center', paddingVertical: 12 },
  signinText: { fontSize: 14, color: '#6b7280' },
  signinBold: { color: colors.primary, fontWeight: '700' },
});
