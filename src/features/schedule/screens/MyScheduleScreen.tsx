import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useIsFocused,
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import {
  useDeleteScheduleEntry,
  useScheduleEntries,
} from '../../../api/hooks';
import type { ScheduleBlock } from '../../../api/domainTypes';
import { Button } from '../../../components/Button';
import { IconButton } from '../../../components/IconButton';
import { Screen } from '../../../components/Screen';
import { BlurTarget, Skeleton, useTabBarSpace } from '../../../components/motion';
import { colors, fonts, ls, radius, space } from '../../../theme';
import { AddScheduleEntrySheet } from '../components/AddScheduleEntrySheet';
import { ScheduleImportHistorySheet } from '../components/ScheduleImportHistorySheet';
import {
  filterBlocksByDay,
  formatScheduleSource,
  getWeekDays,
  scheduleErrorMessage,
} from '../scheduleLogic';

export function MyScheduleScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const isFocused = useIsFocused();
  const tabSpace = useTabBarSpace();

  const weekDays = useMemo(() => getWeekDays(), []);
  // Default to today's day of week or Monday (1)
  const todayItem = weekDays.find(d => d.isToday);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(
    todayItem ? todayItem.dayOfWeek : 1,
  );

  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [historySheetVisible, setHistorySheetVisible] = useState(false);

  const { data: entries, isLoading, isError, refetch } = useScheduleEntries();
  const deleteMutation = useDeleteScheduleEntry();

  const dayBlocks = useMemo(() => {
    if (!entries) {
      return [];
    }
    return filterBlocksByDay(entries, selectedDayOfWeek);
  }, [entries, selectedDayOfWeek]);

  const handleDelete = (block: ScheduleBlock) => {
    Alert.alert(
      'Xóa lịch bận',
      `Bạn có chắc chắn muốn xóa "${block.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(block.id, {
              onError: err => {
                Alert.alert('Không thể xóa', scheduleErrorMessage(err));
              },
            });
          },
        },
      ],
    );
  };

  const handleOpenScan = () => {
    navigation.navigate('ScheduleScan');
  };

  return (
    <BlurTarget active={isFocused}>
      <Screen contentContainerStyle={[styles.screenContent, { paddingBottom: tabSpace + 24 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Lịch của tôi</Text>
          <IconButton
            icon={Plus}
            accessibilityLabel="Thêm lịch bận"
            onPress={() => setAddSheetVisible(true)}
          />
        </View>

        {/* Quick action bar */}
        <View style={styles.actionRow}>
          <Button
            variant="ghost"
            title="Quét thời khóa biểu"
            onPress={handleOpenScan}
            style={styles.scanButton}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xem lịch sử nhập thời khóa biểu"
            onPress={() => setHistorySheetVisible(true)}
            style={styles.historyButton}
          >
            <Text style={styles.historyButtonText}>Lịch sử nhập</Text>
          </Pressable>
        </View>

        {/* 7-day strip */}
        <View style={styles.daysStrip}>
          {weekDays.map(item => {
            const isSelected = item.dayOfWeek === selectedDayOfWeek;
            return (
              <Pressable
                key={item.dayOfWeek}
                accessibilityRole="button"
                accessibilityLabel={`${item.fullLabel}, ngày ${item.dateNumber}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelectedDayOfWeek(item.dayOfWeek)}
                style={[
                  styles.dayCard,
                  isSelected ? styles.dayCardActive : styles.dayCardInactive,
                ]}
              >
                <Text
                  style={[
                    styles.dayShortText,
                    isSelected ? styles.dayShortActive : styles.dayShortInactive,
                  ]}
                >
                  {item.shortLabel}
                </Text>
                <Text
                  style={[
                    styles.dayNumberText,
                    isSelected ? styles.dayNumberActive : styles.dayNumberInactive,
                  ]}
                >
                  {item.dateNumber}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Agenda Section */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.agendaList}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Skeleton width="100%" height={68} borderRadius={radius.md} />
              <Skeleton width="100%" height={68} borderRadius={radius.md} />
              <Skeleton width="100%" height={68} borderRadius={radius.md} />
            </View>
          ) : isError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.emptyText}>
                Không thể tải lịch bận. Kiểm tra mạng rồi thử lại.
              </Text>
              <Button variant="ghost" title="Thử lại" onPress={() => refetch()} />
            </View>
          ) : dayBlocks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Không có lịch bận trong ngày này.
              </Text>
            </View>
          ) : (
            dayBlocks.map(block => {
              const details = [
                `${block.startTime} – ${block.endTime}`,
                block.room ? block.room : null,
                formatScheduleSource(block.source),
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <View key={block.id} style={styles.blockCard}>
                  <View style={styles.blockInfo}>
                    <Text style={styles.blockTitle} numberOfLines={1}>
                      {block.title}
                    </Text>
                    <Text style={styles.blockDetails} numberOfLines={1}>
                      {details}
                    </Text>
                    {block.lecturerName ? (
                      <Text style={styles.blockSubNote} numberOfLines={1}>
                        GV: {block.lecturerName}
                      </Text>
                    ) : null}
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Xóa ${block.title}`}
                    onPress={() => handleDelete(block)}
                    style={styles.deleteButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.deleteButtonText}>Xóa</Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Sheets */}
        <AddScheduleEntrySheet
          visible={addSheetVisible}
          defaultDayOfWeek={selectedDayOfWeek}
          onClose={() => setAddSheetVisible(false)}
        />

        <ScheduleImportHistorySheet
          visible={historySheetVisible}
          onClose={() => setHistorySheetVisible(false)}
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: space.sm,
  },
  scanButton: {
    height: 38,
    paddingHorizontal: space.md,
  },
  historyButton: {
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
  },
  historyButtonText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.fg3,
    letterSpacing: ls(13, -0.01),
  },
  daysStrip: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: space.sm,
  },
  dayCard: {
    flex: 1,
    height: 60,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayCardActive: {
    backgroundColor: colors.fg,
  },
  dayCardInactive: {
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
    opacity: 0.62,
  },
  dayShortText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
  },
  dayShortActive: {
    color: 'rgba(0, 0, 0, 0.55)',
  },
  dayShortInactive: {
    color: colors.fg3,
  },
  dayNumberText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    letterSpacing: ls(18, -0.04),
    fontVariant: ['tabular-nums'],
  },
  dayNumberActive: {
    color: colors.onPrimary,
  },
  dayNumberInactive: {
    color: colors.fg,
  },
  agendaList: {
    paddingTop: space.md,
    gap: space.sm,
  },
  loadingContainer: {
    gap: space.sm,
  },
  errorContainer: {
    paddingVertical: space.xxl,
    alignItems: 'center',
    gap: space.md,
  },
  emptyContainer: {
    paddingVertical: space.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.fg3,
    textAlign: 'center',
  },
  blockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  blockInfo: {
    flex: 1,
    gap: 3,
  },
  blockTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    letterSpacing: ls(15, -0.025),
    color: colors.fg,
  },
  blockDetails: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    color: colors.fg2,
  },
  blockSubNote: {
    fontSize: 11.5,
    fontFamily: fonts.medium,
    color: colors.fg3,
  },
  deleteButton: {
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    marginLeft: space.sm,
  },
  deleteButtonText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.err,
  },
});
