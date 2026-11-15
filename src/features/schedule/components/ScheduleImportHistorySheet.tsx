import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useScheduleImports } from '../../../api/hooks';
import type { ScheduleImport } from '../../../api/domainTypes';
import { formatVnDayTime } from '../../../api/time';
import { Button } from '../../../components/Button';
import { Sheet } from '../../../components/motion';
import { colors, fonts, space } from '../../../theme';

export interface ScheduleImportHistorySheetProps {
  visible: boolean;
  onClose: () => void;
}

function HistorySeparator() {
  return <View style={styles.separator} />;
}

export function ScheduleImportHistorySheet({
  visible,
  onClose,
}: ScheduleImportHistorySheetProps) {
  const { data: imports, isLoading, isError, refetch } = useScheduleImports();

  const renderItem = ({ item }: { item: ScheduleImport }) => {
    const formattedDate = formatVnDayTime(item.importedAt);
    const modeLabel =
      item.mode === 'REPLACE' ? 'Thay thế lịch cũ' : 'Gộp thêm lịch';
    const isSuccess = item.status === 'SUCCESS';

    return (
      <View style={styles.historyRow}>
        <View style={styles.historyInfo}>
          <Text style={styles.historyDate}>{formattedDate}</Text>
          <Text style={styles.historyMeta}>
            {modeLabel} · Thêm {item.addedCount} dòng
            {item.replacedCount > 0 ? `, thay ${item.replacedCount}` : ''}
          </Text>
        </View>
        <Text
          style={[
            styles.statusText,
            isSuccess ? styles.statusSuccess : styles.statusFailed,
          ]}
        >
          {isSuccess ? 'Thành công' : 'Thất bại'}
        </Text>
      </View>
    );
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      maxHeight="80%"
      backdropLabel="Đóng lịch sử nhập"
      title="Lịch sử nhập thời khóa biểu"
      style={styles.sheet}
    >
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.fg} />
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            Không thể tải lịch sử nhập thời khóa biểu.
          </Text>
          <Button variant="ghost" title="Thử lại" onPress={() => refetch()} />
        </View>
      ) : !imports || imports.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            Chưa có lịch sử nhập thời khóa biểu nào.
          </Text>
        </View>
      ) : (
        <FlatList
          data={imports}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={HistorySeparator}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Button variant="quiet" title="Đóng" onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sheet: { gap: space.md },
  listContent: {
    paddingVertical: space.xs,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyDate: {
    fontSize: 14.5,
    fontFamily: fonts.semibold,
    color: colors.fg,
  },
  historyMeta: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    color: colors.fg2,
  },
  statusText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
  },
  statusSuccess: {
    color: colors.fg2,
  },
  statusFailed: {
    color: colors.err,
  },
  separator: {
    height: 1,
    backgroundColor: colors.line,
  },
  centerContainer: {
    paddingVertical: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.fg3,
    textAlign: 'center',
  },
});
