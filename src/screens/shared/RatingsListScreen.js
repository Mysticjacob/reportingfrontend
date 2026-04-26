import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';

import Icon from 'react-native-vector-icons/Feather';

import Header from '../../components/Header';
import EmptyState from '../../components/EmptyState';

import { api } from '../../services/api';
import { colors, spacing } from '../../theme/theme';

const PRIMARY = colors.primary || '#4F8EF7';

export default function RatingsListScreen() {
  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] =
    useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await api.get(
        '/ratings'
      );
      setItems(res.data || []);
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const starColor = score => {
    if (score >= 4) return '#16A34A';
    if (score >= 3) return '#D97706';
    return '#DC2626';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY}
          />
        }
      >
        {items.length === 0 ? (
          <EmptyState title="No ratings yet" />
        ) : (
          items.map(r => (
            <View
              key={r.id}
              style={styles.card}
            >
              {/* TOP */}
              <View style={styles.topRow}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor:
                        starColor(
                          r.score
                        ) + '20',
                    },
                  ]}
                >
                  <Icon
                    name="star"
                    size={16}
                    color={starColor(
                      r.score
                    )}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>
                    {r.targetName}
                  </Text>

                  <Text style={styles.meta}>
                    From {r.raterRole}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.score,
                    {
                      color:
                        starColor(
                          r.score
                        ),
                    },
                  ]}
                >
                  {r.score}/5
                </Text>
              </View>

              {/* COMMENT */}
              {r.comment ? (
                <Text style={styles.comment}>
                  {r.comment}
                </Text>
              ) : (
                <Text
                  style={styles.noComment}
                >
                  No comment provided
                </Text>
              )}
            </View>
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
    borderRadius: 18,

    padding: 16,

    marginBottom: 12,

    borderWidth: 1,
    borderColor: '#E5EAF0',
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconBox: {
    width: 40,
    height: 40,

    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 12,
  },

  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  meta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },

  score: {
    fontSize: 14,
    fontWeight: '900',
  },

  comment: {
    marginTop: 12,

    fontSize: 13,
    color: '#374151',

    lineHeight: 20,
  },

  noComment: {
    marginTop: 12,

    fontSize: 12,
    fontStyle: 'italic',
    color: '#9CA3AF',
  },
});