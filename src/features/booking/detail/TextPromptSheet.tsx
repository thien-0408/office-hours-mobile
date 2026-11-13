import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, Field } from '../../../components';
import { colors, radius, space } from '../../../theme';

/** Bottom sheet with one text field: decline reason, meeting link. */
export function TextPromptSheet({
  visible,
  title,
  label,
  placeholder,
  initialValue = '',
  confirmLabel,
  busy,
  multiline,
  validate,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  label: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel: string;
  busy?: boolean;
  multiline?: boolean;
  /** Returns an error message, or null when valid. */
  validate?: (value: string) => string | null;
  onConfirm: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      setError(null);
    }
  }, [visible, initialValue]);

  const submit = () => {
    const err = validate ? validate(value) : null;
    setError(err);
    if (!err) {
      onConfirm(value.trim());
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}
      >
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Đóng"
        />
        <View style={styles.sheet}>
          <AppText variant="t2">{title}</AppText>
          <Field
            label={label}
            placeholder={placeholder}
            value={value}
            onChangeText={setValue}
            error={error ?? undefined}
            multiline={multiline}
            autoCapitalize={multiline ? 'sentences' : 'none'}
            autoCorrect={false}
            containerStyle={styles.field}
          />
          <View style={styles.row}>
            <Button
              variant="ghost"
              title="Hủy"
              onPress={onClose}
              style={styles.grow}
            />
            <Button
              title={confirmLabel}
              onPress={submit}
              loading={busy}
              style={styles.grow}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.s1,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: space.gutter,
    paddingBottom: space.xxxl,
    gap: space.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  field: { marginTop: space.xs },
  row: { flexDirection: 'row', gap: space.sm },
  grow: { flex: 1 },
});
