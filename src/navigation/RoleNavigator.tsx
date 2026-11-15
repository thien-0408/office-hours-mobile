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
import {
  MODAL_SCREENS,
  modalOptions,
  stackScreenOptions,
  tabScreenOptions,
  withAmbient,
} from './transitions';
import {
  FloatingMeeting,
  badgeText,
  usePendingCount,
  useUnreadCount,
} from '../features/dashboard';
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

const Stack = createNativeStackNavigator<AnyStackParamList>();
const Tab = createBottomTabNavigator<AnyTabParamList>();

/** NavPill with the floating "next meeting" card above it (hidden on the Map tab). */
function tabBarFor(role: UserRole) {
  function TabBar(props: BottomTabBarProps) {
    const { navigation, state } = props;
    const open = (screen: string, bookingId: string) =>
      (navigation.navigate as (n: string, p: object) => void)(screen, {
        bookingId,
      });
    return (
      <>
        <FloatingMeeting
          role={role}
          hidden={state.routes[state.index]?.name === 'Map'}
          onOpenBooking={id => open('BookingDetail', id)}
          onOpenChat={id => open('Chat', id)}
          onOpenLive={id => open('LiveMeeting', id)}
        />
        <NavPill {...props} />
      </>
    );
  }
  return TabBar;
}

/** Badge text per tab name: lecturer "Review" = pending bookings, admin "Notifications" = unread. */
function useTabBadges(role: UserRole): Record<string, string | undefined> {
  const pending = usePendingCount(role === 'LECTURER');
  const unread = useUnreadCount(role === 'ADMIN');
  return {
    Review: badgeText(pending.data),
    Notifications: badgeText(unread.data),
  };
}

function tabsFor(role: UserRole) {
  const renderTabBar = tabBarFor(role);
  function Tabs() {
    const badges = useTabBadges(role);
    return (
      <Tab.Navigator tabBar={renderTabBar} screenOptions={tabScreenOptions}>
        {ROLE_SPECS[role].tabs.map(tab => {
          return (
            <Tab.Screen
              key={tab.name}
              name={tab.name}
              component={SCREEN_COMPONENTS[tab.root]}
              options={{
                title: tab.label,
                tabBarIcon: TAB_ICON_RENDERERS[tab.icon],
                tabBarBadge: badges[tab.name],
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
    <Stack.Navigator
      screenOptions={stackScreenOptions}
      screenLayout={withAmbient}
    >
      <Stack.Screen name="Tabs" component={TABS[role]} />
      {ROLE_SPECS[role].stack.map(name => (
        <Stack.Screen
          key={name}
          name={name}
          component={SCREEN_COMPONENTS[name]}
          options={MODAL_SCREENS.has(name) ? modalOptions : undefined}
        />
      ))}
    </Stack.Navigator>
  );
}
