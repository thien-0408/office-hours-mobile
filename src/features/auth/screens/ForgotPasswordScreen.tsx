import { PlaceholderScreen } from '../../../navigation/PlaceholderScreen';

export function ForgotPasswordScreen() {
  return (
    <PlaceholderScreen
      screen="ForgotPassword"
      title="Quên mật khẩu"
      links={['ResetPassword', 'Login']}
    />
  );
}
