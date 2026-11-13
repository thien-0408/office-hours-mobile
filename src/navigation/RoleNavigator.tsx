import { StyleSheet, View } from 'react-native';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Bell,
  CalendarDays,
  House,
  Inbox,
  Map as MapIcon,
  Search,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import type { UserRole } from '../api/types';
import { NavPill } from '../components/motion';
import { colors } from '../theme';
import { ROLE_SPECS, type TabIconName } from './roleConfig';
import { SCREEN_COMPONENTS } from './screenComponents';
import type { AnyStackParamList, AnyTabParamList } from './types';

const ICONS: Record<TabIconName, LucideIcon> = {
  home: House,
  search: Search,
  calendar: CalendarDays,
  map: MapIcon,
  user: User,
  inbox: Inbox,
  users: Users,
  bell: Bell,
};

type IconRender = (p: { color: string; size: number }) => React.JSX.Element;
const TAB_ICON_RENDERERS = Object.fromEntries(
  Object.entries(ICONS).map(([key, Icon]) => [
    key,
    ({ color, size }: { color: string; size: number }) => (
      <Icon color={color} size={size} />
    ),
  ]),
) as Record<TabIconName, IconRender>;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});

const Stack = createNativeStackNavigator<AnyStackParamList>();
const Tab = createBottomTabNavigator<AnyTabParamList>();

const renderTabBar = (props: BottomTabBarProps) => <NavPill {...props} />;

function tabsFor(role: UserRole) {
  function Tabs() {
    return (
      <Tab.Navigator
        tabBar={renderTabBar}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        {ROLE_SPECS[role].tabs.map(tab => {
          return (
            <Tab.Screen
              key={tab.name}
              name={tab.name}
              component={SCREEN_COMPONENTS[tab.root]}
              options={{
                title: tab.label,
                tabBarIcon: TAB_ICON_RENDERERS[tab.icon],
              }}
            />
          );
        })}
      </Tab.Navigator>
    );
  }
  return Tabs;
}

// One stable Tabs component per role (never created during render).
const TABS: Record<UserRole, () => React.JSX.Element> = {
  STUDENT: tabsFor('STUDENT'),
  LECTURER: tabsFor('LECTURER'),
  ADMIN: tabsFor('ADMIN'),
};

/**
 * Signed-in app of one role: a native stack whose first screen is the tab
 * bar; detail screens push over it (Android back / swipe-back are the
 * native-stack defaults).
 */
export function RoleNavigator({ role }: { role: UserRole }) {
  return (
    <View style={styles.root}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Tabs" component={TABS[role]} />
        {ROLE_SPECS[role].stack.map(name => (
          <Stack.Screen
            key={name}
            name={name}
            component={SCREEN_COMPONENTS[name]}
          />
        ))}
      </Stack.Navigator>
    </View>
  );
}
