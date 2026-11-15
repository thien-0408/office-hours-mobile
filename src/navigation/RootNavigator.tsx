import { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AmbientSurface } from '../components/motion';
import { stackScreenOptions, withAmbient } from './transitions';
import { useAppSession } from './devSession';
import { AUTH_SCREENS, initialAuthRoute } from './roleConfig';
import { RoleNavigator } from './RoleNavigator';
import { SCREEN_COMPONENTS } from './screenComponents';
import type { AuthStackParamList } from './types';
import { readWelcomeSeen } from './welcomeFlag';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function Splash() {
  return <AmbientSurface />;
}

function AuthNavigator() {
  // undefined = still reading the flag
  const [flag, setFlag] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    readWelcomeSeen().then(v => alive && setFlag(v));
    return () => {
      alive = false;
    };
  }, []);

  if (flag === undefined) {
    return <Splash />;
  }
  return (
    <AuthStack.Navigator
      initialRouteName={initialAuthRoute(flag)}
      screenOptions={stackScreenOptions}
      screenLayout={withAmbient}
    >
      {AUTH_SCREENS.map(name => (
        <AuthStack.Screen
          key={name}
          name={name as keyof AuthStackParamList}
          component={SCREEN_COMPONENTS[name]}
        />
      ))}
    </AuthStack.Navigator>
  );
}

/** loading -> splash, signedOut -> auth stack, signedIn -> the role's app. */
export function RootNavigator() {
  const { status, role } = useAppSession();
  if (status === 'loading') {
    return <Splash />;
  }
  if (status === 'signedIn' && role) {
    return <RoleNavigator key={role} role={role} />;
  }
  return <AuthNavigator />;
}
