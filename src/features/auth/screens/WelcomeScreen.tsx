import { useNavigation } from '@react-navigation/native';
import {
  PlaceholderButton,
  PlaceholderScreen,
} from '../../../navigation/PlaceholderScreen';
import { markWelcomeSeen } from '../../../navigation/welcomeFlag';

export function WelcomeScreen() {
  const navigation = useNavigation();
  return (
    <PlaceholderScreen screen="Welcome" title="Chào mừng">
      <PlaceholderButton
        label="Bắt đầu"
        onPress={() => {
          markWelcomeSeen();
          navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
        }}
      />
    </PlaceholderScreen>
  );
}
