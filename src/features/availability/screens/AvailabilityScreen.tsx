import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { ChevronRight, Plus } from 'lucide-react-native';
import {
  useActiveSemester,
  useAvailabilityExceptions,
  useAvailabilityRules,
  useDeleteAvailabilityException,
} from '../../../api/hooks';
import type {
  AvailabilityException,
  AvailabilityRule,
} from '../../../api/domainTypes';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import { IconButton } from '../../../components/IconButton';
import { Screen } from '../../../components/Screen';
import { BlurTarget, Skeleton, useTabBarSpace } from '../../../components/motion';
import { colors, fonts, ls, radius, space } from '../../../theme';
import { useSession } from '../../auth/session';
import {
  availabilityErrorMessage,
  formatExceptionSummary,
  formatRuleLabel,
  groupRulesByDay,
} from '../availabilityLogic';
import { AddAvailabilityRuleSheet } from '../components/AddAvailabilityRuleSheet';
import { AddExceptionSheet } from '../components/AddExceptionSheet';
import { EditAvailabilityRuleSheet } from '../components/EditAvailabilityRuleSheet';

export function AvailabilityScreen() {
  const isFocused = useIsFocused();
  const tabSpace = useTabBarSpace();
  const { user } = useSession();
  const lecturerId = user?.id ?? '';

  const { data: activeSemester } = useActiveSemester();
  const {
    data: rules,
    isLoading: rulesLoading,
    isError: rulesError,
    refetch: refetchRules,
  } = useAvailabilityRules(lecturerId);

  const {
    data: exceptions,
    isLoading: exceptionsLoading,
    isError: exceptionsError,
    refetch: refetchExceptions,
  } = useAvailabilityExceptions(lecturerId);

  const deleteExceptionMutation = useDeleteAvailabilityException();

  const [addRuleSheetVisible, setAddRuleSheetVisible] = useState(false);
  const [addExceptionSheetVisible, setAddExceptionSheetVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<AvailabilityRule | null>(null);

  const ruleGroups = useMemo(() => {
    if (!rules) {
      return [];
    }
    return groupRulesByDay(rules);
  }, [rules]);

  const handleDeleteException = (ex: AvailabilityException) => {
    const summary = formatExceptionSummary(ex);
    Alert.alert(
      'Xóa ngoại lệ',
      `Bạn có chắc chắn muốn xóa "${summary.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            deleteExceptionMutation.mutate(ex.id, {
              onError: err => {
                Alert.alert('Không thể xóa', availabilityErrorMessage(err));
              },
            });
          },
        },
      ],
    );
  };

  const semesterLabel = activeSemester
    ? `${activeSemester.name} (${activeSemester.startDate} – ${activeSemester.endDate})`
    : 'Chưa có học kỳ đang kích hoạt';

  return (
    <BlurTarget active={isFocused}>
      <Screen contentContainerStyle={[styles.screenContent, { paddingBottom: tabSpace + 24 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Lịch rảnh</Text>
          <IconButton
            icon={Plus}
            accessibilityLabel="Thêm khung giờ mới"
            onPress={() => setAddRuleSheetVisible(true)}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Active semester & intro */}
          <View style={styles.semesterBox}>
            <Text style={styles.semesterName} numberOfLines={1}>
              {semesterLabel}
            </Text>
            <Text style={styles.leadText}>
              Mỗi khung giờ lặp lại hằng tuần và tự chia thành slot.
            </Text>
          </View>

          {/* Availability rules grouped by day */}
          {rulesLoading ? (
            <View style={styles.loadingContainer}>
              <Skeleton width="100%" height={56} borderRadius={radius.card} />
              <Skeleton width="100%" height={56} borderRadius={radius.card} />
            </View>
          ) : rulesError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.emptyText}>
                Không thể tải danh sách lịch rảnh.
              </Text>
              <Button variant="ghost" title="Thử lại" onPress={() => refetchRules()} />
            </View>
          ) : ruleGroups.length === 0 ? (
            <View style={styles.emptyGroup}>
              <Text style={styles.emptyText}>
                Chưa có khung giờ rảnh nào. Bấm dấu + để thêm khung giờ.
              </Text>
            </View>
          ) : (
            ruleGroups.map(group => (
              <View key={group.dayOfWeek} style={styles.daySection}>
                <Text style={styles.subLabel}>{group.dayLabel}</Text>
                <View style={styles.groupCard}>
                  {group.rules.map((rule, idx) => {
                    const formatted = formatRuleLabel(rule);
                    const isLast = idx === group.rules.length - 1;

                    return (
                      <Pressable
                        key={rule.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${formatted.timeRange}, ${formatted.subtitle}, ${formatted.slotCount} slot`}
                        onPress={() => setEditingRule(rule)}
                        style={[styles.lineRow, !isLast && styles.lineDivider]}
                      >
                        <View style={styles.lineInfo}>
                          <Text style={styles.lineTime}>{formatted.timeRange}</Text>
                          <Text style={styles.lineSubtitle}>{formatted.subtitle}</Text>
                        </View>
                        <View style={styles.lineVal}>
                          <Text style={styles.lineValText}>
                            {formatted.slotCount} slot
                          </Text>
                          <Icon as={ChevronRight} size={14} level="muted" />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))
          )}

          {/* Exceptions section */}
          <View style={styles.exceptionSection}>
            <View style={styles.exceptionHeader}>
              <Text style={styles.subLabel}>Ngoại lệ</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Thêm ngoại lệ"
                onPress={() => setAddExceptionSheetVisible(true)}
                style={styles.addExceptionBtn}
              >
                <Text style={styles.addExceptionText}>+ Thêm ngoại lệ</Text>
              </Pressable>
            </View>

            {exceptionsLoading ? (
              <Skeleton width="100%" height={56} borderRadius={radius.card} />
            ) : exceptionsError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.emptyText}>
                  Không thể tải danh sách ngoại lệ.
                </Text>
                <Button
                  variant="ghost"
                  title="Thử lại"
                  onPress={() => refetchExceptions()}
                />
              </View>
            ) : !exceptions || exceptions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  Chưa có ngày nghỉ hoặc giờ thêm nào.
                </Text>
              </View>
            ) : (
              <View style={styles.groupCard}>
                {exceptions.map((ex, idx) => {
                  const summary = formatExceptionSummary(ex);
                  const isLast = idx === exceptions.length - 1;

                  return (
                    <Pressable
                      key={ex.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${summary.title}, ${summary.subtitle}`}
                      onPress={() => handleDeleteException(ex)}
                      style={[styles.lineRow, !isLast && styles.lineDivider]}
                    >
                      <View style={styles.lineInfo}>
                        <Text style={styles.lineTime}>{summary.title}</Text>
                        {summary.subtitle ? (
                          <Text style={styles.lineSubtitle}>{summary.subtitle}</Text>
                        ) : null}
                      </View>
                      <View style={styles.lineVal}>
                        <Icon as={ChevronRight} size={14} level="muted" />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Sheets */}
        <AddAvailabilityRuleSheet
          visible={addRuleSheetVisible}
          lecturerId={lecturerId}
          activeSemester={activeSemester}
          onClose={() => setAddRuleSheetVisible(false)}
        />

        <AddExceptionSheet
          visible={addExceptionSheetVisible}
          lecturerId={lecturerId}
          onClose={() => setAddExceptionSheetVisible(false)}
        />

        <EditAvailabilityRuleSheet
          rule={editingRule}
          visible={Boolean(editingRule)}
          onClose={() => setEditingRule(null)}
        />
      </Screen>
    </BlurTarget>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: space.gutter,
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xs,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: fonts.bold,
    letterSpacing: ls(28, -0.055),
    color: colors.fg,
  },
  scrollContent: {
    paddingTop: space.xs,
    paddingBottom: space.xl,
    gap: space.md,
  },
  semesterBox: {
    paddingVertical: space.xs,
    gap: 4,
  },
  semesterName: {
    fontSize: 13.5,
    fontFamily: fonts.semibold,
    color: colors.fg,
    letterSpacing: ls(13.5, -0.01),
  },
  leadText: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    color: colors.fg2,
    letterSpacing: ls(12.5, -0.01),
  },
  daySection: {
    gap: 6,
  },
  subLabel: {
    fontSize: 12.5,
    fontFamily: fonts.semibold,
    color: colors.fg3,
    letterSpacing: ls(12.5, -0.01),
  },
  groupCard: {
    borderRadius: radius.card,
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
  },
  emptyGroup: {
    paddingVertical: space.xl,
    alignItems: 'center',
  },
  emptyCard: {
    borderRadius: radius.card,
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: space.lg,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  lineRow: {
    minHeight: 54,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lineDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  lineInfo: {
    flex: 1,
    gap: 3,
  },
  lineTime: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    letterSpacing: ls(15, -0.025),
    color: colors.fg,
  },
  lineSubtitle: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.fg3,
    letterSpacing: ls(12, -0.005),
  },
  lineVal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lineValText: {
    fontSize: 13.5,
    fontFamily: fonts.medium,
    color: colors.fg3,
    fontVariant: ['tabular-nums'],
  },
  exceptionSection: {
    gap: 6,
    marginTop: space.sm,
  },
  exceptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addExceptionBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  addExceptionText: {
    fontSize: 12.5,
    fontFamily: fonts.semibold,
    color: colors.fg2,
  },
  loadingContainer: {
    gap: space.sm,
  },
  errorContainer: {
    paddingVertical: space.lg,
    alignItems: 'center',
    gap: space.sm,
  },
  emptyText: {
    fontSize: 13.5,
    fontFamily: fonts.medium,
    color: colors.fg3,
    textAlign: 'center',
  },
});
