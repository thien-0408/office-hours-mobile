import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from 'react';
import type {
  StyleProp,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, radius, size as themeSize, text } from '../theme';

export interface FieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  hint?: string;
  trailing?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<TextStyle>;
}

export type FieldInputRef = ComponentRef<typeof TextInput>;
type FocusHandler = NonNullable<TextInputProps['onFocus']>;
type BlurHandler = NonNullable<TextInputProps['onBlur']>;

export const Field = forwardRef<FieldInputRef, FieldProps>(
  function FieldComponent(
    {
    label,
    value,
    onChangeText,
    error,
    hint,
    trailing,
    containerStyle,
    inputContainerStyle,
    style,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);

  useImperativeHandle(ref, () => inputRef.current as ComponentRef<typeof TextInput>);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleFocus: FocusHandler = e => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur: BlurHandler = e => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const hasError = Boolean(error);

  const resolvedBorderColor = hasError
    ? 'rgba(255, 138, 128, 0.45)'
    : isFocused
    ? colors.focus
    : colors.line;

  const resolvedLabelColor = hasError
    ? colors.err
    : isFocused
    ? colors.fg2
    : colors.fg3;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.field,
          { borderColor: resolvedBorderColor },
          inputContainerStyle,
        ]}
      >
        <View style={styles.inputCol}>
          <Text
            style={[
              styles.label,
              { color: resolvedLabelColor },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholderTextColor={colors.fg4}
            selectionColor={colors.fg}
            style={[styles.input, style]}
            {...rest}
          />
        </View>
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </Pressable>
      {hasError ? (
        <Text style={[styles.hint, styles.hintError]}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  field: {
    minHeight: themeSize.field, // 58
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.lg, // 18
    borderCurve: 'continuous',
    backgroundColor: colors.s2,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    ...text.fieldLabel,
  },
  input: {
    ...text.fieldValue,
    padding: 0,
    margin: 0,
    includeFontPadding: false,
  },
  trailing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.fg3,
    paddingTop: 6,
    paddingHorizontal: 4,
    letterSpacing: -0.06,
  },
  hintError: {
    color: colors.err,
  },
});
