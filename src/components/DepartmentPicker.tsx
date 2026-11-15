import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDepartments } from '../api/hooks/departments';
import { departmentLabel, FALLBACK_DEPARTMENTS } from '../api/departments';
import { colors, fonts, iconOpacity, radius, size as themeSize, text } from '../theme';

export interface DepartmentPickerProps {
  label?: string;
  /** Department code, or null/'' for none. */
  value: string | null | undefined;
  onChange: (code: string | null) => void;
  /** Offer a "Không chọn" row (optional field). Default true. */
  allowNone?: boolean;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Field-styled picker for the backend `Department` enum (`GET /departments`).
 * A legacy free-text value still displays as-is until the user picks a code.
 */
export function DepartmentPicker({
  label = 'Khoa',
  value,
  onChange,
  allowNone = true,
  error,
  containerStyle,
}: DepartmentPickerProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { data } = useDepartments();
  const list = data ?? FALLBACK_DEPARTMENTS;
  const shown = departmentLabel(value, list);
  const selected = value ? value.trim().toUpperCase() : null;

  const pick = (code: string | null) => {
    setOpen(false);
    onChange(code);
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${shown ?? 'chưa chọn'}`}
        onPress={() => setOpen(true)}
        style={[styles.field, error ? styles.fieldError : null]}
      >
        <View style={styles.col}>
          <Text
            style={[styles.label, { color: error ? colors.err : colors.fg3 }]}
            numberOfLines={1}
          >
            {label}
          </Text>
          <Text
            style={[styles.value, !shown && styles.placeholder]}
            numberOfLines={1}
          >
            {shown ?? 'Chọn khoa'}
          </Text>
        </View>
        <ChevronDown
          size={18}
          color={colors.fg}
          opacity={iconOpacity.muted}
        />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          accessibilityLabel="Đóng"
          onPress={() => setOpen(false)}
        />
        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle}>{label}</Text>
          <ScrollView style={styles.list}>
            {allowNone ? (
              <Row
                text="Không chọn"
                on={selected == null}
                onPress={() => pick(null)}
              />
            ) : null}
            {list.map(d => (
              <Row
                key={d.code}
                text={d.labelVi}
                sub={d.code}
                on={selected === d.code}
                onPress={() => pick(d.code)}
              />
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function Row({
  text: label,
  sub,
  on,
  onPress,
}: {
  text: string;
  sub?: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.row, on && styles.rowOn]}
    >
      <Text style={[styles.rowText, on && styles.rowTextOn]} numberOfLines={1}>
        {label}
      </Text>
      {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  field: {
    minHeight: themeSize.field,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fieldError: { borderColor: 'rgba(255, 138, 128, 0.45)' },
  col: { flex: 1, minWidth: 0, gap: 2 },
  label: { ...text.fieldLabel },
  value: { ...text.fieldValue },
  placeholder: { color: colors.fg4 },
  error: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.err,
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: colors.s1,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '70%',
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.line2,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.fg,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  list: { flexGrow: 0 },
  row: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowOn: { backgroundColor: colors.s3 },
  rowText: {
    flex: 1,
    fontSize: 15.5,
    fontFamily: fonts.medium,
    color: colors.fg2,
  },
  rowTextOn: { color: colors.fg, fontFamily: fonts.semibold },
  rowSub: { fontSize: 12, fontFamily: fonts.medium, color: colors.fg3 },
});
