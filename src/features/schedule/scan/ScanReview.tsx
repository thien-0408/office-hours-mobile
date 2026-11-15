import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActiveSemester, useImportSchedule } from '../../../api/hooks';
import type {
  ImportScheduleResult,
  ScheduleImportMode,
} from '../../../api/domainTypes';
import { batchRowErrors } from '../../../api/schedule';
import { Button } from '../../../components/Button';
import { Seg, type SegOption } from '../../../components/Seg';
import { TopNav } from '../../../components/TopNav';
import { colors, fonts, ls, space } from '../../../theme';
import { ScanRowCard } from './ScanRowCard';
import {
  emptyRow,
  mapBatchErrors,
  MAX_ROWS,
  submitBlock,
  submitErrorText,
  toBatchPayload,
  validateRow,
  countLow,
  type RowErrors,
  type ScanRow,
} from './rows';

const MODE_OPTIONS: SegOption[] = [
  { value: 'REPLACE', label: 'Thay thế toàn bộ' },
  { value: 'MERGE', label: 'Gộp thêm' },
];

const MODE_HINT: Record<ScheduleImportMode, string> = {
  REPLACE:
    'Xóa lịch đã nhập từ PDF trước đó của học kỳ này, giữ lịch bạn nhập tay.',
  MERGE: 'Giữ lịch hiện có, chỉ thêm các dòng mới và bỏ dòng trùng.',
};

export interface ScanReviewProps {
  initialRows: ScanRow[];
  /** Names of the picked PDFs, sent as `sourceFiles` (empty for manual entry). */
  sourceFiles?: string[];
  onBack: () => void;
  onDone: (result: ImportScheduleResult) => void;
}

/** 18b. Review and edit every row, then POST the batch. */
export function ScanReview({
  initialRows,
  sourceFiles = [],
  onBack,
  onDone,
}: ScanReviewProps) {
  const [rows, setRows] = useState<ScanRow[]>(initialRows);
  const [mode, setMode] = useState<ScheduleImportMode>('REPLACE');
  // Errors from a 422, keyed by row key so they survive deleting other rows.
  const [serverErrors, setServerErrors] = useState<Record<string, RowErrors>>(
    {},
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const semester = useActiveSemester();
  const importMutation = useImportSchedule();

  const scroll = useRef<ScrollViewInstance>(null);
  const layouts = useRef<Record<string, number>>({});
  const onCardLayout = useCallback((key: string, e: LayoutChangeEvent) => {
    layouts.current[key] = e.nativeEvent.layout.y;
  }, []);

  const errorsOf = useCallback(
    (row: ScanRow): RowErrors => ({
      ...serverErrors[row.key],
      ...validateRow(row),
    }),
    [serverErrors],
  );

  const invalidCount = useMemo(
    () => rows.filter(r => Object.keys(errorsOf(r)).length > 0).length,
    [rows, errorsOf],
  );
  const lowCount = countLow(rows);
  const block = submitBlock(rows);

  const changeRow = (key: string, patch: Partial<ScanRow>) => {
    setRows(rs => rs.map(r => (r.key === key ? { ...r, ...patch } : r)));
    if (serverErrors[key]) {
      setServerErrors(({ [key]: _gone, ...rest }) => rest);
    }
  };
  const deleteRow = (key: string) => {
    setRows(rs => rs.filter(r => r.key !== key));
    delete layouts.current[key];
  };
  const addRow = () => {
    const last = rows[rows.length - 1];
    setRows(rs => [...rs, emptyRow(last?.dayOfWeek ?? 0)]);
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  };

  const submit = () => {
    if (block || !semester.data) {
      return;
    }
    setSubmitError(null);
    setServerErrors({});
    const sent = rows;
    importMutation.mutate(
      toBatchPayload(sent, semester.data.id, mode, sourceFiles),
      {
        onSuccess: onDone,
        onError: e => {
          setSubmitError(submitErrorText(e, sent.length));
          const mapped = mapBatchErrors(batchRowErrors(e), sent.length);
          const byKey: Record<string, RowErrors> = {};
          for (const [idx, errs] of Object.entries(mapped.byRow)) {
            byKey[sent[Number(idx)].key] = errs;
          }
          setServerErrors(byKey);
          if (mapped.firstRowIndex !== null) {
            const y = layouts.current[sent[mapped.firstRowIndex].key];
            if (y !== undefined) {
              scroll.current?.scrollTo({
                y: Math.max(0, y - 12),
                animated: true,
              });
            }
          }
        },
      },
    );
  };

  const summary = [
    `${rows.length} dòng`,
    invalidCount > 0 ? `${invalidCount} cần sửa` : null,
    lowCount > 0 ? `${lowCount} đọc chưa chắc` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const saveDisabled =
    block !== null || !semester.data || importMutation.isPending;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <View style={styles.pad}>
        <TopNav onBack={onBack} title={summary} />
      </View>

      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Kiểm tra lại</Text>
        <Text style={styles.sub}>
          Đọc từ file PDF. Sửa hoặc xóa từng dòng nếu cần.
        </Text>

        <View style={styles.mode}>
          <Seg
            options={MODE_OPTIONS}
            value={mode}
            onChange={v => setMode(v as ScheduleImportMode)}
          />
          <Text style={styles.hint}>{MODE_HINT[mode]}</Text>
        </View>

        {rows.length === 0 ? (
          <Text style={styles.empty}>
            Chưa có dòng nào. Thêm dòng để nhập thời khóa biểu.
          </Text>
        ) : null}

        {rows.map((row, i) => (
          <ScanRowCard
            key={row.key}
            row={row}
            index={i}
            errors={errorsOf(row)}
            onChange={changeRow}
            onDelete={deleteRow}
            onLayout={onCardLayout}
          />
        ))}

        <Button
          variant="ghost"
          title="Thêm dòng"
          onPress={addRow}
          disabled={rows.length >= MAX_ROWS}
        />
      </ScrollView>

      <View style={styles.footer}>
        {block === 'tooMany' ? (
          <Text style={styles.footerErr}>Tối đa 2.000 dòng mỗi lần lưu.</Text>
        ) : null}
        {submitError ? (
          <Text style={styles.footerErr}>{submitError}</Text>
        ) : null}
        {semester.isError ? (
          <View style={styles.semRow}>
            <Text style={styles.footerErr}>
              Không lấy được học kỳ hiện tại.
            </Text>
            <Button
              variant="quiet"
              title="Thử lại"
              onPress={() => semester.refetch()}
            />
          </View>
        ) : null}
        <Button
          title={rows.length > 0 ? `Lưu ${rows.length} dòng` : 'Lưu'}
          disabled={saveDisabled}
          loading={importMutation.isPending}
          onPress={submit}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  pad: {
    paddingHorizontal: space.gutter,
  },
  content: {
    paddingHorizontal: space.gutter,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  title: {
    fontSize: 30,
    fontFamily: fonts.bold,
    letterSpacing: ls(30, -0.05),
    color: colors.fg,
    marginTop: space.xs,
  },
  sub: {
    fontSize: 14.5,
    fontFamily: fonts.medium,
    letterSpacing: ls(14.5, -0.012),
    color: colors.fg2,
    lineHeight: 21,
  },
  mode: {
    gap: space.sm,
    marginTop: space.sm,
  },
  hint: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    color: colors.fg3,
    paddingHorizontal: 4,
  },
  empty: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.fg3,
    textAlign: 'center',
    paddingVertical: space.xxl,
  },
  footer: {
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
    paddingBottom: space.sm,
    gap: space.sm,
  },
  footerErr: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.err,
    textAlign: 'center',
  },
  semRow: {
    alignItems: 'center',
  },
});
