import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Field } from '../../../components';
import { Sheet } from '../../../components/motion';
import { space } from '../../../theme';

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
    <Sheet
      visible={visible}
      onClose={onClose}
      dismissable={!busy}
      title={title}
      style={styles.sheet}
    >
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
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sheet: { gap: space.lg },
  field: { marginTop: space.xs },
  row: { flexDirection: 'row', gap: space.sm },
  grow: { flex: 1 },
});
