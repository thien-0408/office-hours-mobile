import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppField,
  IconButton,
  PillButton,
  RevealView,
} from '../../components/AuthPrimitives';
import { MonoIcon } from '../../components/Icons';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../../theme/tokens';

export type BatchImportMode = 'REPLACE' | 'MERGE';

export interface ScannedScheduleRow {
  id: string;
  subject: string;
  weekdayLabel: string; // VD: "Thứ 2"
  startTime: string;    // VD: "07:30"
  endTime: string;      // VD: "09:30"
  room: string;
}

const SAMPLE_SCANNED_ROWS: ScannedScheduleRow[] = [
  {
    id: 'r1',
    subject: 'Lập trình Web',
    weekdayLabel: 'Thứ 2',
    startTime: '07:30',
    endTime: '09:30',
    room: 'A1.203',
  },
  {
    id: 'r2',
    subject: 'Cấu trúc dữ liệu',
    weekdayLabel: 'Thứ 3',
    startTime: '09:30',
    endTime: '11:30',
    room: 'B11.105',
  },
  {
    id: 'r3',
    subject: 'Thể chất',
    weekdayLabel: 'Thứ 3',
    startTime: '15:00',
    endTime: '14:00', // Lỗi cố ý giống mock để sinh viên sửa
    room: 'Sân B',
  },
  {
    id: 'r4',
    subject: 'Mạng máy tính',
    weekdayLabel: 'Thứ 6',
    startTime: '07:30',
    endTime: '09:30',
    room: 'B8.201',
  },
  {
    id: 'r5',
    subject: 'Tiếng Anh 4',
    weekdayLabel: 'Thứ 2',
    startTime: '13:00',
    endTime: '15:00',
    room: 'B4.002',
  },
];

function isTimeOrderValid(start: string, end: string): boolean {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return -1;
    return h * 60 + m;
  };
  const s = toMin(start);
  const e = toMin(end);
  return s >= 0 && e > s;
}

interface ScanTimetableReviewScreenProps {
  initialRows?: ScannedScheduleRow[];
  onBack?: () => void;
  onSaveBatch?: (
    mode: BatchImportMode,
    rows: ScannedScheduleRow[],
  ) => Promise<void>;
}

export function ScanTimetableReviewScreen({
  initialRows = SAMPLE_SCANNED_ROWS,
  onBack,
  onSaveBatch,
}: ScanTimetableReviewScreenProps) {
  const [mode, setMode] = useState<BatchImportMode>('REPLACE');
  const [rows, setRows] = useState<ScannedScheduleRow[]>(initialRows);
  const [editingRow, setEditingRow] = useState<ScannedScheduleRow | null>(null);
  const [loading, setLoading] = useState(false);

  const errorCount = useMemo(
    () =>
      rows.filter((r) => !isTimeOrderValid(r.startTime, r.endTime)).length,
    [rows],
  );

  const handleSave = async () => {
    if (errorCount > 0 || loading) return;
    setLoading(true);
    try {
      await onSaveBatch?.(mode, rows);
    } finally {
      setLoading(false);
    }
  };

  const applyEdit = () => {
    if (!editingRow) return;
    setRows((prev) =>
      prev.map((r) => (r.id === editingRow.id ? editingRow : r)),
    );
    setEditingRow(null);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* AppHead */}
          <View style={styles.appHead}>
            <IconButton icon="left" onPress={onBack} />
            <Text style={typography.sm}>
              {rows.length} dòng
              {errorCount > 0 ? ` · ${errorCount} cần sửa` : ''}
            </Text>
          </View>

          <RevealView index={0}>
            <Text style={[typography.h1, { marginTop: 8 }]}>Kiểm tra lại</Text>
          </RevealView>

          {/* Segmented: Thay lịch cũ / Gộp thêm */}
          <RevealView index={1} style={styles.seg2}>
            <Pressable
              onPress={() => setMode('REPLACE')}
              style={[styles.segTab, mode === 'REPLACE' && styles.segTabOn]}
            >
              <Text
                style={[
                  styles.segText,
                  mode === 'REPLACE' && styles.segTextOn,
                ]}
              >
                Thay lịch cũ
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('MERGE')}
              style={[styles.segTab, mode === 'MERGE' && styles.segTabOn]}
            >
              <Text
                style={[styles.segText, mode === 'MERGE' && styles.segTextOn]}
              >
                Gộp thêm
              </Text>
            </Pressable>
          </RevealView>

          {/* Danh sách dòng đã đọc */}
          <RevealView index={2} style={{ marginTop: 8 }}>
            {rows.map((row, idx) => {
              const valid = isTimeOrderValid(row.startTime, row.endTime);
              return (
                <React.Fragment key={row.id}>
                  {idx > 0 && <View style={styles.line} />}
                  <Pressable
                    onPress={() => setEditingRow({ ...row })}
                    style={({ pressed }) => [
                      styles.row,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.rowTitle,
                          !valid && { color: colors.err },
                        ]}
                      >
                        {row.subject}
                      </Text>
                      <Text style={styles.rowSub}>
                        {row.weekdayLabel} · {row.startTime} –{' '}
                        <Text style={!valid ? { color: colors.err } : undefined}>
                          {row.endTime}
                        </Text>{' '}
                        · {row.room}
                      </Text>
                      {!valid && (
                        <Text style={styles.errMsg}>
                          Giờ kết thúc phải sau giờ bắt đầu.
                        </Text>
                      )}
                    </View>
                    <MonoIcon name="right" size={16} color={colors.fg3} />
                  </Pressable>
                </React.Fragment>
              );
            })}
          </RevealView>

          <View style={{ flex: 1, minHeight: 28 }} />

          <RevealView index={3}>
            <PillButton
              title={`Lưu ${rows.length} dòng`}
              disabled={errorCount > 0}
              loading={loading}
              onPress={handleSave}
            />
          </RevealView>
        </ScrollView>
      </SafeAreaView>

      {/* Sheet sửa nhanh từng dòng */}
      <Modal
        visible={Boolean(editingRow)}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingRow(null)}
      >
        <View style={styles.scrim}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setEditingRow(null)}
          />
          {editingRow && (
            <View style={[styles.sheet, squircle(radius.sheet)]}>
              <View style={styles.grab} />
              <Text style={[typography.h2, { marginBottom: 14 }]}>
                Sửa buổi học
              </Text>

              <View style={{ gap: 10 }}>
                <AppField
                  label="Môn học"
                  value={editingRow.subject}
                  onChangeText={(t) =>
                    setEditingRow({ ...editingRow, subject: t })
                  }
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <AppField
                      label="Bắt đầu"
                      value={editingRow.startTime}
                      onChangeText={(t) =>
                        setEditingRow({ ...editingRow, startTime: t })
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppField
                      label="Kết thúc"
                      value={editingRow.endTime}
                      error={
                        !isTimeOrderValid(
                          editingRow.startTime,
                          editingRow.endTime,
                        )
                          ? 'Phải sau giờ bắt đầu'
                          : undefined
                      }
                      onChangeText={(t) =>
                        setEditingRow({ ...editingRow, endTime: t })
                      }
                    />
                  </View>
                </View>
                <AppField
                  label="Phòng"
                  value={editingRow.room}
                  onChangeText={(t) =>
                    setEditingRow({ ...editingRow, room: t })
                  }
                />
              </View>

              <PillButton
                title="Xong"
                onPress={applyEdit}
                style={{ marginTop: 18 }}
              />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  appHead: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seg2: {
    marginTop: 16,
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  segTab: {
    flex: 1,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segTabOn: {
    backgroundColor: colors.glassHi,
    borderWidth: 1,
    borderColor: colors.glassLine,
  },
  segText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13.5,
    color: colors.fg3,
  },
  segTextOn: {
    color: colors.fg,
  },
  line: {
    height: 1,
    backgroundColor: colors.line,
  },
  row: {
    minHeight: 62,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    letterSpacing: ls(15, -0.03),
    color: colors.fg,
  },
  rowSub: {
    ...typography.sm,
    fontSize: 12.5,
    marginTop: 2,
  },
  errMsg: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.err,
    marginTop: 2,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.64)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: colors.line2,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  grab: {
    width: 40,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.fg4,
    alignSelf: 'center',
    marginBottom: 18,
  },
});