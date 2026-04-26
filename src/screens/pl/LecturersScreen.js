import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';

import Icon from 'react-native-vector-icons/Feather';

import Header from '../../components/Header';
import Badge from '../../components/Badge';

import { api } from '../../services/api';
import { colors, spacing } from '../../theme/theme';

const PRIMARY = colors.primary || '#4F8EF7';

export default function LecturersScreen() {
  const [list, setList] = useState([]);
  const [refreshing, setRefreshing] =
    useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await api.get(
        '/users/lecturers'
      );
      setList(res.data || []);
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

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
        {list.length === 0 ? (
          <View style={styles.empty}>
            <Icon
              name="users"
              size={34}
              color="#94A3B8"
            />
            <Text style={styles.emptyText}>
              No lecturers found
            </Text>
          </View>
        ) : (
          list.map(l => (
            <TouchableOpacity
              key={l.id}
              activeOpacity={0.85}
              style={styles.card}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {l.name}
                </Text>

                <Text style={styles.email}>
                  {l.email}
                </Text>

                {l.stream && (
                  <View style={styles.badgeWrap}>
                    <Badge label={l.stream} />
                  </View>
                )}
              </View>
              <View style={styles.iconBox}>
                <Icon
                  name="user"
                  size={18}
                  color={PRIMARY}
                />
              </View>
            </TouchableOpacity>
          ))
        )}

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

    borderRadius: 20,

    padding: 18,

    marginBottom: 12,

    borderWidth: 1,
    borderColor: '#E5EAF0',

    flexDirection: 'row',
    alignItems: 'center',

    ...{
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 6,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      elevation: 1,
    },
  },

  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  email: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },

  badgeWrap: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },

  iconBox: {
    width: 44,
    height: 44,

    borderRadius: 14,

    backgroundColor:
      PRIMARY + '15',

    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: {
    alignItems: 'center',
    marginTop: 60,
  },

  emptyText: {
    marginTop: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
});