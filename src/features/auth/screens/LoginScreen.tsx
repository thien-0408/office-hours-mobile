import { setDevRole } from '../../../navigation/devSession';
import {
  PlaceholderButton,
  PlaceholderScreen,
} from '../../../navigation/PlaceholderScreen';

export function LoginScreen() {
  return (
    <PlaceholderScreen
      screen="Login"
      title="Đăng nhập"
      links={['Register', 'ForgotPassword']}
    >
      {/* TODO(MO-04): remove the dev role switch when Login calls the API. */}
      {__DEV__ ? (
        <>
          <PlaceholderButton
            label="Vào như SV"
            onPress={() => setDevRole('STUDENT')}
          />
          <PlaceholderButton
            label="Vào như GV"
            onPress={() => setDevRole('LECTURER')}
          />
          <PlaceholderButton
            label="Vào như AD"
            onPress={() => setDevRole('ADMIN')}
          />
        </>
      ) : null}
    </PlaceholderScreen>
  );
}
