import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react-native';
import {
  Field,
  IconButton,
  type FieldInputRef,
  type FieldProps,
} from '../../../components';

/** Field with a trailing show/hide button (the only icon allowed in an input, STYLE-MOCHY 8.3). */
export const PasswordField = forwardRef<
  FieldInputRef,
  Omit<FieldProps, 'secureTextEntry' | 'trailing'>
>(function PasswordFieldInner(props, ref) {
  const [shown, setShown] = useState(false);
  return (
    <Field
      ref={ref}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      secureTextEntry={!shown}
      trailing={
        <IconButton
          icon={shown ? EyeOff : Eye}
          iconSize={18}
          size={32}
          accessibilityLabel={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          onPress={() => setShown(s => !s)}
        />
      }
    />
  );
});
