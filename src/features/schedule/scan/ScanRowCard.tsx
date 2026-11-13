import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Field } from '../../../components/Field';
import { Seg, type SegOption } from '../../../components/Seg';
import { colors, fonts, ls, radius, space } from '../../../theme';
import { normalizeTime, type RowErrors, type ScanRow } from './rows';

const DAY_OPTIONS: SegOption[] = [
  { value: '1', label: 'T2' },
  { value: '2', label: 'T3' },
  { value: '3', label: 'T4' },
  { value: '4', label: 'T5' },
  { value: '5', label: 'T6' },
  { value: '6', label: 'T7' },
  { value: '7', label: 'CN' },
];

export interface ScanRowCardProps {
  row: ScanRow;
  index: number;
  errors: RowErrors;
  onChange: (key: string, patch: Partial<ScanRow>) => void;
  onDelete: (key: string) => void;
  onLayout?: (key: string, e: LayoutChangeEvent) => void;
}

/** One editable parsed row. Errors are red text/border only, no icons or tinted fills. */
export function ScanRowCard({
  row,
  index,
  errors,
  onChange,
  onDelete,
  onLayout,
}: ScanRowCardProps) {
  const hasError = Object.keys(errors).length > 0;
  // Editing counts as the user having checked the row.
  const edit = (patch: Partial<ScanRow>) =>
    onChange(row.key, { ...patch, confidence: 'high' });
  const blurTime = (field: 'startTime' | 'endTime') => {
    const normalized = normalizeTime(row[field]);
    if (normalized && normalized !== row[field]) {
      onChange(row.key, { [field]: normalized });
    }
  };

  return (
    <View
      onLayout={onLayout ? e => onLayout(row.key, e) : undefined}
      style={[styles.card, hasError && styles.cardError]}
    >
      <View style={styles.head}>
        <Text style={[styles.index, hasError && styles.err]}>
          Dòng {index + 1}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Xóa dòng ${index + 1}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => onDelete(row.key)}
        >
          <Text style={styles.delete}>Xóa dòng</Text>
        </Pressable>
      </View>

      {row.confidence === 'low' ? (
        <Text style={styles.low}>
          Máy đọc chưa chắc dòng này. Kiểm tra lại cho đúng.
        </Text>
      ) : null}

      <Field
        label="Tên môn"
        value={row.title}
        onChangeText={v => edit({ title: v })}
        error={errors.title}
        autoCapitalize="sentences"
        returnKeyType="next"
      />

      <View>
        <Seg
          options={DAY_OPTIONS}
          value={row.dayOfWeek >= 1 ? String(row.dayOfWeek) : ''}
          onChange={v => edit({ dayOfWeek: Number(v) })}
        />
        {errors.dayOfWeek ? (
          <Text style={styles.fieldErr}>{errors.dayOfWeek}</Text>
        ) : null}
      </View>

      <View style={styles.pair}>
        <View style={styles.half}>
          <Field
            label="Bắt đầu"
            value={row.startTime}
            onChangeText={v => edit({ startTime: v })}
            onBlur={() => blurTime('startTime')}
            error={errors.startTime}
            placeholder="07:30"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
        </View>
        <View style={styles.half}>
          <Field
            label="Kết thúc"
            value={row.endTime}
            onChangeText={v => edit({ endTime: v })}
            onBlur={() => blurTime('endTime')}
            error={errors.endTime}
            placeholder="09:30"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
        </View>
      </View>

      <Field
        label="Phòng (không bắt buộc)"
        value={row.room}
        onChangeText={v => edit({ room: v })}
        error={errors.room}
        autoCapitalize="characters"
        placeholder="B11.306"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
    gap: space.md,
  },
  cardError: {
    borderColor: 'rgba(255,138,128,0.4)',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  index: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    letterSpacing: ls(13, -0.01),
    color: colors.fg2,
  },
  err: {
    color: colors.err,
  },
  delete: {
    fontSize: 13,
    fontFamily: fonts.medium,
    letterSpacing: ls(13, -0.01),
    color: colors.fg2,
  },
  low: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    color: colors.fg2,
  },
  fieldErr: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.err,
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  pair: {
    flexDirection: 'row',
    gap: space.md,
  },
  half: {
    flex: 1,
  },
});
