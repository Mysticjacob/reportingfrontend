import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Platform,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';

import Icon from 'react-native-vector-icons/Feather';

import Header from '../../components/Header';
import EmptyState from '../../components/EmptyState';

import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../theme/theme';

const PRIMARY = colors.primary || '#4F8EF7';

const BG = '#F4F7FB';
const CARD = '#FFFFFF';

const TEXT_DARK = '#111827';
const TEXT_MID = '#6B7280';
const TEXT_LIGHT = '#94A3B8';

const BORDER = '#E5EAF0';

const GOLD = '#F59E0B';
const GREEN = '#16A34A';
const AMBER = '#D97706';
const RED = '#DC2626';

const getRatingColor = (score) => {
  if (score >= 4) return GREEN;
  if (score >= 3) return AMBER;
  return RED;
};

function StarRating({ rating }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map(star => (
        <Icon
          key={star}
          name="star"
          size={14}
          color={star <= rating ? GOLD : '#DCE3EA'}
        />
      ))}
    </View>
  );
}

export default function MyRatingsScreen() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [refreshing, setRefreshing] =
    useState(false);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      const res = await api.get('/ratings');

      setItems(
        (res.data || []).filter(
          item =>
            item.targetId === user?.id ||
            item.targetId === user?.uid
        )
      );
    } catch (e) {}
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRatings();
    setRefreshing(false);
  }, []);

  const average = useMemo(() => {
    if (!items.length) return '—';

    return (
      items.reduce(
        (acc, item) =>
          acc + (item.score || 0),
        0
      ) / items.length
    ).toFixed(1);
  }, [items]);

  const avgColor =
    average === '—'
      ? TEXT_LIGHT
      : getRatingColor(Number(average));

  const excellentRatings = items.filter(
    item => item.score >= 4
  ).length;

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
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>
                Average Rating
              </Text>

              <Text
                style={[
                  styles.summaryValue,
                  { color: avgColor },
                ]}
              >
                {average}
              </Text>

              <StarRating
                rating={
                  average === '—'
                    ? 0
                    : Math.round(
                        Number(average)
                      )
                }
              />
            </View>

            <View style={styles.scoreCircle}>
              <Text
                style={styles.scoreCircleText}
              >
                {items.length}
              </Text>

              <Text
                style={styles.scoreCircleLabel}
              >
                Reviews
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {excellentRatings}
              </Text>

              <Text style={styles.statLabel}>
                Excellent
              </Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {items.length}
              </Text>

              <Text style={styles.statLabel}>
                Total Ratings
              </Text>
            </View>
          </View>
        </View>
        {items.length === 0 ? (
          <EmptyState title="No ratings yet" />
        ) : (
          items.map((rating, index) => {
            const scoreColor =
              getRatingColor(
                rating.score || 0
              );

            return (
              <TouchableOpacity
                key={rating.id || index}
                activeOpacity={0.9}
                style={styles.ratingCard}
              >
                <View style={styles.ratingTop}>
                  <View
                    style={[
                      styles.ratingBadge,
                      {
                        backgroundColor:
                          scoreColor + '18',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.ratingScore,
                        {
                          color: scoreColor,
                        },
                      ]}
                    >
                      {rating.score}/5
                    </Text>
                  </View>

                  <View
                    style={styles.rightTop}
                  >
                    <Text
                      style={
                        styles.anonymousText
                      }
                    >
                      Anonymous Student
                    </Text>

                    <StarRating
                      rating={
                        rating.score || 0
                      }
                    />
                  </View>
                </View>
                {rating.comment ? (
                  <View
                    style={
                      styles.commentBox
                    }
                  >
                    <Icon
                      name="message-square"
                      size={15}
                      color={
                        TEXT_LIGHT
                      }
                    />

                    <Text
                      style={
                        styles.commentText
                      }
                    >
                      {rating.comment}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={
                      styles.noCommentBox
                    }
                  >
                    <Text
                      style={
                        styles.noCommentText
                      }
                    >
                      No written feedback
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

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
  summaryCard: {
    backgroundColor: CARD,

    borderRadius: 24,

    padding: 22,

    borderWidth: 1,
    borderColor: BORDER,

    marginBottom: 20,

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

  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  summaryLabel: {
    fontSize: 13,
    color: TEXT_MID,
    fontWeight: '600',
    marginBottom: 6,
  },

  summaryValue: {
    fontSize: 42,
    fontWeight: '900',
  },
  starRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  scoreCircle: {
    width: 90,
    height: 90,

    borderRadius: 45,

    backgroundColor: PRIMARY + '15',

    alignItems: 'center',
    justifyContent: 'center',
  },

  scoreCircleText: {
    fontSize: 28,
    fontWeight: '900',
    color: PRIMARY,
  },

  scoreCircleLabel: {
    fontSize: 11,
    color: PRIMARY,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  statBox: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT_DARK,
  },

  statLabel: {
    marginTop: 5,
    fontSize: 12,
    color: TEXT_MID,
    fontWeight: '600',
  },

  ratingCard: {
    backgroundColor: CARD,

    borderRadius: 22,

    padding: 18,

    marginBottom: 14,

    borderWidth: 1,
    borderColor: BORDER,

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
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

  ratingTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ratingBadge: {
    width: 70,
    height: 70,

    borderRadius: 20,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 16,
  },

  ratingScore: {
    fontSize: 20,
    fontWeight: '900',
  },

  rightTop: {
    flex: 1,
  },

  anonymousText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 6,
  },

  commentBox: {
    marginTop: 18,

    backgroundColor: '#F8FAFC',

    borderRadius: 18,

    padding: 16,

    flexDirection: 'row',

    borderWidth: 1,
    borderColor: BORDER,
  },

  commentText: {
    flex: 1,

    marginLeft: 10,

    fontSize: 14,

    lineHeight: 22,

    color: TEXT_MID,
  },
  noCommentBox: {
    marginTop: 18,

    padding: 14,

    borderRadius: 16,

    backgroundColor: '#F8FAFC',
  },

  noCommentText: {
    fontSize: 13,
    color: TEXT_LIGHT,
    fontStyle: 'italic',
  },
});