import React, { useState, useRef, useEffect } from 'react';
import { View,Text,ScrollView,StyleSheet, Alert,TouchableOpacity, Animated, KeyboardAvoidingView, Platform, StatusBar,} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { colors, spacing, radius } from '../../theme/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      Alert.alert('Login failed', e?.response?.data?.message || e.message);
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

        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>
          Sign in to continue to the Faculty Reporting System
        </Text>

        <Animated.View
          style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <Text style={styles.cardTitle}>Sign in</Text>
          <Text style={styles.cardHint}>Enter your credentials below</Text>

          <View style={styles.field}>
            <Input
              label="Email address"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (errors.email) setErrors((p) => ({ ...p, email: null }));
              }}
              placeholder="selekanepentse@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.error}>{errors.email}</Text>}
          </View>

          <View style={styles.field}>
            <Input
              label="Password"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (errors.password) setErrors((p) => ({ ...p, password: null }));
              }}
              placeholder="••••••••"
              secureTextEntry
            />
            {errors.password && <Text style={styles.error}>{errors.password}</Text>}
          </View>

          <View style={{ marginTop: spacing.md }}>
            <Button title="Sign in" onPress={submit} loading={loading} />
          </View>

          <View style={styles.secureNote}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.primary} />
            <Text style={styles.secureText}>Your connection is secure and encrypted</Text>
          </View>
        </Animated.View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.signupLink}
        >
          <Text style={styles.signupText}>
            No account? <Text style={styles.signupBold}>Create one</Text>
          </Text>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.xl, paddingTop: spacing.xxl * 1.5, flexGrow: 1 },

  headerDecor: { position: 'absolute', top: 0, left: 0, right: 0, height: 280, overflow: 'hidden' },

  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  logo: {
    width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  logoText: { color: colors.textInverse, fontSize: 22, fontWeight: '800' },
  brandName: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },

  title: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: {
    fontSize: 15, color: colors.textMuted || '#6b7280', lineHeight: 22, marginBottom: spacing.xl,
  },

  card: {
    backgroundColor: '#fff', borderRadius: radius.lg || 16, padding: spacing.xl,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 4 },
    elevation: 3, borderWidth: 1, borderColor: '#f1f5f9',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  cardHint: { fontSize: 13, color: '#6b7280', marginBottom: spacing.lg },

  field: { marginBottom: spacing.md },
  error: { fontSize: 12, color: '#ef4444', marginTop: 4, fontWeight: '500' },

  secureNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center',
    marginTop: spacing.lg,
  },
  secureText: { fontSize: 12, color: '#6b7280' },

  signupLink: { marginTop: spacing.xl, alignItems: 'center', paddingVertical: 12 },
  signupText: { fontSize: 14, color: '#6b7280' },
  signupBold: { color: colors.primary, fontWeight: '700' },
});
