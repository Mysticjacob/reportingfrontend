import React from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/theme';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

import StudentDashboard from '../screens/student/StudentDashboard';
import CoursesScreen from '../screens/student/CoursesScreen';
import AttendanceScreen from '../screens/student/AttendanceScreen';
import RatingScreen from '../screens/student/RatingScreen';

import LecturerDashboard from '../screens/lecturer/LecturerDashboard';
import MarkAttendanceScreen from '../screens/lecturer/MarkAttendanceScreen';
import SubmitReportScreen from '../screens/lecturer/SubmitReportScreen';
import MyRatingsScreen from '../screens/lecturer/MyRatingsScreen';
import LectureReportsScreen from '../screens/lecturer/ViewReport';

import PRLDashboard from '../screens/prl/PRLDashboard';
import PRLReportsScreen from '../screens/prl/PRLReportsScreen';
import MonitoringScreen from '../screens/prl/MonitoringScreen';
import PRLCourseScreen from '../screens/prl/PRLCourseScreen';

import PLDashboard from '../screens/pl/PLDashboard';
import ManageModulesScreen from '../screens/pl/ManageModulesScreen';
import LecturersScreen from '../screens/pl/LecturersScreen';
import PLReportsScreen from '../screens/pl/ReportsScreen';

import ClassesScreen from '../screens/shared/ClassesScreen';
import RatingsListScreen from '../screens/shared/RatingsListScreen';

const ACCENT       = colors.primary ?? '#4F8EF7';
const TOPBAR_BG    = '#FFFFFF';
const TOPBAR_BORDER= '#E6EAF0';
const BRAND_DARK   = '#0F1117';
const TEXT_MUTED   = '#64748B';
const TEXT_STRONG  = '#0F172A';
const TAB_INACTIVE = '#475569';
const TAB_HOVER_BG = '#EEF2FF';
const TAB_ACTIVE_BG= '#EEF4FF';
const PAGE_BG      = '#F7F8FB';

const APP_NAME = 'Limkokwing Reporting';

const STUDENT_ROUTES = [
  { name: 'Home',       icon: 'home',         label: 'Home',       component: StudentDashboard },
  { name: 'Courses',    icon: 'book-open',    label: 'Courses',    component: CoursesScreen },
  { name: 'Attendance', icon: 'check-square', label: 'Attendance', component: AttendanceScreen },
  { name: 'Classes',    icon: 'calendar',     label: 'Classes',    component: ClassesScreen },
  { name: 'Rate',       icon: 'star',         label: 'Rate',       component: RatingScreen },
];

const LECTURER_ROUTES = [
  { name: 'Home',       icon: 'home',         label: 'Home',       component: LecturerDashboard },
  { name: 'Classes',    icon: 'calendar',     label: 'Classes',    component: ClassesScreen },
  { name: 'Attendance', icon: 'check-square', label: 'Attendance', component: MarkAttendanceScreen },
  { name: 'Report',     icon: 'file-text',    label: 'Submit',     component: SubmitReportScreen },
  { name: 'Reports',    icon: 'folder',       label: 'Reports',    component: LectureReportsScreen },
  { name: 'Ratings',    icon: 'award',        label: 'Ratings',    component: MyRatingsScreen },
];

const PRL_ROUTES = [
  { name: 'Home',     icon: 'home',         label: 'Home',     component: PRLDashboard },
  { name: 'Courses',  icon: 'book-open',    label: 'Courses',  component: PRLCourseScreen },
  { name: 'Reports',  icon: 'folder',       label: 'Reports',  component: PRLReportsScreen },
  { name: 'Classes',  icon: 'calendar',     label: 'Classes',  component: ClassesScreen },
  { name: 'Ratings',  icon: 'bar-chart-2',  label: 'Ratings',  component: RatingsListScreen },
];

const PL_ROUTES = [
  { name: 'Home',      icon: 'home',        label: 'Home',     component: PLDashboard },
  { name: 'Courses',   icon: 'book-open',   label: 'Courses',  component: ManageModulesScreen },
  { name: 'Classes',   icon: 'calendar',    label: 'Classes',  component: ClassesScreen },
  { name: 'Lecturers', icon: 'users',       label: 'Staff',    component: LecturersScreen },
  { name: 'Reports',   icon: 'folder',      label: 'Reports',  component: PLReportsScreen },
  { name: 'Ratings',   icon: 'bar-chart-2', label: 'Ratings',  component: RatingsListScreen },
];

function TopTab({ item, isActive, onPress, onLayout }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLayout={onLayout}
      activeOpacity={0.85}
      style={[styles.tab, isActive && styles.tabActive]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Icon
        name={item.icon}
        size={15}
        color={isActive ? ACCENT : TAB_INACTIVE}
        style={{ marginRight: 6 }}
      />
      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]} numberOfLines={1}>
        {item.label}
      </Text>
      {isActive && <View style={styles.tabUnderline} />}
    </TouchableOpacity>
  );
}

function TopBar({ routes, activeName, onNavigate }) {
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isCompact = width < 720;

  const scrollRef = React.useRef(null);
  const tabLayouts = React.useRef({});
  const scrollViewWidth = React.useRef(0);

  const scrollActiveIntoView = React.useCallback((name, animated = true) => {
    const layout = tabLayouts.current[name];
    const viewW = scrollViewWidth.current;
    if (!layout || !viewW) return;
    const target = Math.max(0, layout.x - (viewW - layout.width) / 2);
    scrollRef.current?.scrollTo({ x: target, y: 0, animated });
  }, []);

  React.useEffect(() => {
    const id = setTimeout(() => scrollActiveIntoView(activeName, true), 50);
    return () => clearTimeout(id);
  }, [activeName, scrollActiveIntoView]);

  const Brand = (
    <View style={styles.brandLeft}>
      <View style={styles.brandMark}>
        <Text style={styles.brandMarkText}>L</Text>
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text style={styles.brandTitle} numberOfLines={1}>{APP_NAME}</Text>
        {!isCompact && (
          <Text style={styles.brandSubtitle} numberOfLines={1}>
            Faculty of Information & Communication Technology
          </Text>
        )}
      </View>
    </View>
  );

  const Account = (
    <View style={styles.brandRight}>
      {user?.name && (
        <View style={styles.userPill}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user.name?.[0] ?? 'U').toUpperCase()}
            </Text>
          </View>
          <View style={{ marginLeft: 8, flexShrink: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
            {user?.role && (
              <Text style={styles.userRole} numberOfLines={1}>{user.role.toUpperCase()}</Text>
            )}
          </View>
        </View>
      )}

      <TouchableOpacity
        onPress={logout}
        style={styles.logoutBtn}
        accessibilityLabel="Log out"
        activeOpacity={0.85}
      >
        <Icon name="log-out" size={15} color="#fff" />
        {!isCompact && <Text style={styles.logoutText}>Logout</Text>}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.topBarSafe}>
      {isCompact ? (
        <View style={styles.brandColumn}>
          <View style={styles.brandRowCompact}>
            {Brand}
            <TouchableOpacity
              onPress={logout}
              style={styles.iconLogoutBtn}
              accessibilityLabel="Log out"
              activeOpacity={0.85}
            >
              <Icon name="log-out" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          {user?.name && (
            <View style={styles.accountRowCompact}>
              <View style={styles.userPill}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(user.name?.[0] ?? 'U').toUpperCase()}
                  </Text>
                </View>
                <View style={{ marginLeft: 8, flexShrink: 1 }}>
                  <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
                  {user?.role && (
                    <Text style={styles.userRole}>{user.role.toUpperCase()}</Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.brandRow}>
          {Brand}
          {Account}
        </View>
      )}

      <View style={styles.tabStripWrap}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabStrip}
          onLayout={(e) => {
            scrollViewWidth.current = e.nativeEvent.layout.width;
            scrollActiveIntoView(activeName, false);
          }}
          onContentSizeChange={() => scrollActiveIntoView(activeName, false)}
        >
          {routes.map((r) => (
            <TopTab
              key={r.name}
              item={r}
              isActive={r.name === activeName}
              onPress={() => onNavigate(r.name)}
              onLayout={(e) => {
                const { x, width: w } = e.nativeEvent.layout;
                tabLayouts.current[r.name] = { x, width: w };
                if (r.name === activeName) {
                  scrollActiveIntoView(activeName, false);
                }
              }}
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const Stack = createNativeStackNavigator();

function RoleNavigator({ routes, initialRouteName }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName ?? routes[0].name}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: PAGE_BG },
        animation: 'fade',
      }}
    >
      {routes.map(({ name, component: Component }) => (
        <Stack.Screen key={name} name={name}>
          {(props) => (
            <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
              <TopBar
                routes={routes}
                activeName={props.route.name}
                onNavigate={(target) => props.navigation.navigate(target)}
              />
              <View style={{ flex: 1 }}>
                <Component {...props} />
              </View>
            </View>
          )}
        </Stack.Screen>
      ))}
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  const resolveNavigator = () => {
    if (!user) return <AuthStack />;
    switch (user.role) {
      case 'student':  return <RoleNavigator routes={STUDENT_ROUTES} />;
      case 'lecturer': return <RoleNavigator routes={LECTURER_ROUTES} />;
      case 'prl':      return <RoleNavigator routes={PRL_ROUTES} />;
      default:         return <RoleNavigator routes={PL_ROUTES} />;
    }
  };

  return <NavigationContainer>{resolveNavigator()}</NavigationContainer>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PAGE_BG,
  },

  topBarSafe: {
    backgroundColor: TOPBAR_BG,
    borderBottomWidth: 1,
    borderBottomColor: TOPBAR_BORDER,
    ...Platform.select({
      ios:     { shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 3 },
      default: {},
    }),
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },

  brandColumn: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 10,
  },
  brandRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  accountRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    flex: 1,
  },
  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: BRAND_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandMarkText: {
    color: ACCENT,
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT_STRONG,
    letterSpacing: 0.2,
  },
  brandSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 0.2,
  },

  brandRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: 220,
    flexShrink: 1,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  userName: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_STRONG,
  },
  userRole: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: ACCENT,
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_DARK,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  iconLogoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BRAND_DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },

  tabStripWrap: {
    borderTopWidth: 1,
    borderTopColor: TOPBAR_BORDER,
    backgroundColor: TOPBAR_BG,
  },
  tabStrip: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 4,
    borderRadius: 8,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: TAB_ACTIVE_BG,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TAB_INACTIVE,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: ACCENT,
    fontWeight: '800',
  },
  tabUnderline: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: ACCENT,
  },
});