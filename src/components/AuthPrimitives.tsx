import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../theme/tokens';
import { Glass } from './Glass';
import {
  GlyphType,
  MonoIcon,
  MonoIconName,
  StatusGlyph,
} from './Icons';
import { Pressable3D } from './Pressable3D';

/** Nút viên thuốc 54px */
export function PillButton({
  title,
  variant = 'primary',
  disabled = false,
  loading = false,
  withArrow = false,
  leftSlot,
  rightSlot,
  onPress,
  style,
}: {
  title: string;
  variant?: 'primary' | 'glass' | 'quiet';
  disabled?: boolean;
  loading?: boolean;
  withArrow?: boolean;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const isDisabled = disabled || loading;

  if (variant === 'quiet') {
    return (
      <Pressable
        disabled={isDisabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.quietBtn,
          pressed && { opacity: 0.7 },
          style,
        ]}
      >
        <Text style={styles.quietText}>{title}</Text>
        {rightSlot}
      </Pressable>
    );
  }

  const inner = (
    <View
      style={[
        styles.btnBase,
        variant === 'primary' &&
        (disabled ? styles.btnDisabled : styles.btnPrimary),
        variant === 'glass' && styles.btnGlassWrap,
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.onPrimary : colors.fg}
          style={{ marginRight: 6 }}
        />
      )}
      {!loading && leftSlot}
      <Text
        style={[
          styles.btnText,
          variant === 'primary'
            ? disabled
              ? styles.btnTextDisabled
              : styles.btnTextPrimary
            : styles.btnTextGlass,
        ]}
      >
        {title}
      </Text>
      {rightSlot}
      {withArrow && !disabled && !loading && (
        <View style={styles.kbdArrow}>
          <MonoIcon name="arrow" size={18} color={colors.primary} />
        </View>
      )}
    </View>
  );

  if (variant === 'glass') {
    return (
      <Pressable3D disabled={isDisabled} onPress={onPress}>
        <Glass borderRadius={radius.pill} style={styles.btnBase}>
          {leftSlot}
          <Text style={[styles.btnText, styles.btnTextGlass]}>{title}</Text>
          {rightSlot}
        </Glass>
      </Pressable3D>
    );
  }

  return (
    <Pressable3D disabled={isDisabled} onPress={onPress}>
      {inner}
    </Pressable3D>
  );
}

/** Ô nhập nền #161616, nhãn bên trong, không có icon đầu ô */
interface AppFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  isPassword?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  rightIcon?: MonoIconName;
  onPressField?: () => void; // Dùng cho ô chọn Khoa (dropdown)
}

export function AppField({
  label,
  error,
  hint,
  isPassword = false,
  clearable = false,
  onClear,
  rightIcon,
  onPressField,
  value,
  ...rest
}: AppFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(isPassword);

  const hasError = Boolean(error);

  const content = (
    <View
      style={[
        styles.field,
        squircle(radius.lg),
        focused && !hasError && styles.fieldFocus,
        hasError && styles.fieldErr,
      ]}
    >
      <View style={styles.fieldInner}>
        <Text
          style={[
            styles.fieldLabel,
            focused && { color: colors.fg2 },
            hasError && { color: colors.err },
          ]}
        >
          {label}
        </Text>
        {onPressField ? (
          <Text
            numberOfLines={1}
            style={[styles.fieldInput, !value && { color: colors.fg4 }]}
          >
            {value || rest.placeholder}
          </Text>
        ) : (
          <TextInput
            {...rest}
            value={value}
            secureTextEntry={hidden}
            placeholderTextColor={colors.fg4}
            selectionColor={colors.fg}
            onFocus={(e) => {
              setFocused(true);
              rest.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              rest.onBlur?.(e);
            }}
            style={styles.fieldInput}
          />
        )}
      </View>

      {isPassword && (
        <Pressable
          hitSlop={10}
          onPress={() => setHidden((prev) => !prev)}
          style={styles.trailBtn}
        >
          <MonoIcon
            name={hidden ? 'eye' : 'eyeoff'}
            size={18}
            color={colors.fg3}
          />
        </Pressable>
      )}

      {clearable && Boolean(value) && !isPassword && (
        <Pressable hitSlop={10} onPress={onClear} style={styles.trailBtn}>
          <MonoIcon name="x" size={15} color={colors.fg3} />
        </Pressable>
      )}

      {rightIcon && (
        <View style={styles.trailBtn}>
          <MonoIcon name={rightIcon} size={18} color={colors.fg3} />
        </View>
      )}
    </View>
  );

  return (
    <View>
      {onPressField ? (
        <Pressable onPress={onPressField}>{content}</Pressable>
      ) : (
        content
      )}
      {hasError ? (
        <Text style={[styles.hintText, { color: colors.err }]}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** Nút tròn kính 40px (back, close) */
export function IconButton({
  icon,
  onPress,
  size = 40,
}: {
  icon: MonoIconName;
  onPress?: () => void;
  size?: number;
}) {
  return (
    <Pressable3D onPress={onPress}>
      <Glass
        borderRadius={radius.pill}
        style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MonoIcon name={icon} size={size < 36 ? 15 : 20} color={colors.fg} />
      </Glass>
    </Pressable3D>
  );
}

/** Viên thuốc trạng thái có glyph khoét rỗng */
export function StatusPill({
  glyph,
  label,
  tone = 'done',
}: {
  glyph: GlyphType;
  label: string;
  tone?: 'done' | 'soft';
}) {
  return (
    <View style={styles.pill}>
      <StatusGlyph
        type={glyph}
        size={15}
        color={tone === 'done' ? colors.fg : colors.fg2}
      />
      <Text
        style={[
          styles.pillText,
          { color: tone === 'done' ? colors.fg : colors.fg2 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

/** Toast kính nổi trên cùng (dùng ở màn 1b bị giới hạn 429) */
export function ToastBanner({
  glyph = 'warn',
  title,
  subtitle,
}: {
  glyph?: GlyphType;
  title: string;
  subtitle: string;
}) {
  return (
    <Animated.View entering={FadeInUp.duration(300)} style={styles.toastWrap}>
      <Glass borderRadius={radius.toast} style={styles.toastInner}>
        <StatusGlyph type={glyph} size={30} color={colors.fg} />
        <View style={{ flex: 1 }}>
          <Text style={styles.toastTitle}>{title}</Text>
          <Text style={styles.toastSub}>{subtitle}</Text>
        </View>
      </Glass>
    </Animated.View>
  );
}

/** Wrapper hiệu ứng xuất hiện lần lượt (.rv trong mochy.css) */
export function RevealView({
  index = 0,
  children,
  style,
}: {
  index?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 55 + 80).duration(420)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btnBase: {
    height: 54,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnDisabled: {
    backgroundColor: colors.s4,
  },
  btnGlassWrap: {
    backgroundColor: 'transparent',
  },
  btnText: {
    fontFamily: fontFamily.bold,
    fontSize: 15.5,
    letterSpacing: ls(15.5, -0.03),
  },
  btnTextPrimary: {
    color: colors.onPrimary,
  },
  btnTextDisabled: {
    color: 'rgba(255,255,255,0.42)',
  },
  btnTextGlass: {
    color: colors.fg,
  },
  kbdArrow: {
    position: 'absolute',
    right: 8,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quietBtn: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  quietText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    letterSpacing: ls(14, -0.02),
    color: colors.fg2,
  },
  field: {
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fieldFocus: {
    borderColor: colors.focus,
  },
  fieldErr: {
    borderColor: colors.errBorder,
  },
  fieldInner: {
    flex: 1,
    gap: 2,
  },
  fieldLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11.5,
    letterSpacing: ls(11.5, -0.005),
    color: colors.fg3,
  },
  fieldInput: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15.5,
    letterSpacing: ls(15.5, -0.02),
    color: colors.fg,
    padding: 0,
    margin: 0,
  },
  trailBtn: {
    padding: 4,
  },
  hintText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    letterSpacing: ls(12, -0.005),
    color: colors.fg3,
    paddingHorizontal: 4,
    paddingTop: 6,
  },
  pill: {
    height: 26,
    paddingHorizontal: 10,
    paddingLeft: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
  },
  toastWrap: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    zIndex: 20,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toastTitle: {
    ...typography.h3,
    fontSize: 14,
  },
  toastSub: {
    ...typography.sm,
    fontSize: 12.5,
    marginTop: 1,
  },
});