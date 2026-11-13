import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { colors, glass, iconOpacity, radius, size, springs } from '../../theme';
import { Glass } from './Glass';

const SIDE = 16; // pill margin from screen edges
const PAD = 8; // pill inner horizontal padding
const TAB_W = 48; // collapsed (icon only) tab width
const TAB_H = 48;
const ACTIVE_MAX_W = 144; // icon + label
const BOTTOM_GAP = 12; // above the bottom safe-area inset
const CONTENT_GAP = 16; // breathing room between content and pill
const ICON = 22;
const ICON_X = (TAB_W - ICON) / 2;
const LABEL_X = ICON_X + ICON + 8;

/** Bottom padding (excluding safe-area inset) screens need above the pill. */
export const TAB_BAR_SPACE = size.navBar + BOTTOM_GAP + CONTENT_GAP;

/** Full bottom padding including the safe-area inset. */
export function useTabBarSpace() {
  const { bottom } = useSafeAreaInsets();
  return TAB_BAR_SPACE + bottom;
}

/**
 * Geometry of the tabs for a (possibly fractional) active position `pos`.
 * Pure + worklet so the UI thread and tests share it.
 */
export function navPillTabX(
  index: number,
  pos: number,
  count: number,
  pillWidth: number,
) {
  'worklet';
  const activeW = Math.min(
    ACTIVE_MAX_W,
    pillWidth - 2 * PAD - (count - 1) * TAB_W,
  );
  const total = (count - 1) * TAB_W + activeW;
  const start = (pillWidth - total) / 2;
  const t = Math.min(1, Math.max(0, index - pos));
  return {
    x: start + index * TAB_W + (activeW - TAB_W) * t,
    activeW,
    start,
  };
}

type Route = BottomTabBarProps['state']['routes'][number];

function TabVisual({
  route,
  index,
  count,
  pos,
  pillWidth,
  options,
}: {
  route: Route;
  index: number;
  count: number;
  pos: { value: number };
  pillWidth: number;
  options: BottomTabBarProps['descriptors'][string]['options'];
}) {
  const label =
    typeof options.tabBarLabel === 'string'
      ? options.tabBarLabel
      : options.title ?? route.name;
  const badge = options.tabBarBadge;

  const wrap = useAnimatedStyle(() => ({
    transform: [
      { translateX: navPillTabX(index, pos.value, count, pillWidth).x },
    ],
  }));
  const icon = useAnimatedStyle(() => {
    const a = Math.max(0, 1 - Math.abs(index - pos.value));
    return {
      opacity:
        iconOpacity.normal + (iconOpacity.active - iconOpacity.normal) * a,
    };
  });
  const labelStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - Math.abs(index - pos.value)),
  }));
  const badgeStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.abs(index - pos.value)),
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.visual, wrap]}>
      <Animated.View style={[styles.icon, icon]}>
        {options.tabBarIcon?.({
          focused: false,
          color: colors.fg,
          size: ICON,
        })}
      </Animated.View>
      <Animated.Text numberOfLines={1} style={[styles.label, labelStyle]}>
        {label}
      </Animated.Text>
      {badge != null && badge !== '' ? (
        <Animated.View style={[styles.badge, badgeStyle]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

/**
 * Floating glass pill used as `tabBar` of @react-navigation/bottom-tabs:
 * `<Tab.Navigator tabBar={props => <NavPill {...props} />}>`.
 * Icon-only tabs; the active one gets a highlight that springs between tabs
 * and shows its label. Touch targets are plain Pressables; the visual layer
 * (icons, labels, highlight) is animated on the UI thread.
 */
export function NavPill({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pillWidth = width - 2 * SIDE;
  const count = state.routes.length;
  const pos = useSharedValue(state.index);

  useEffect(() => {
    pos.value = withSpring(state.index, springs.indicator);
  }, [pos, state.index]);

  const highlight = useAnimatedStyle(() => {
    const g = navPillTabX(0, pos.value, count, pillWidth);
    return {
      width: g.activeW,
      transform: [{ translateX: g.start + pos.value * TAB_W }],
    };
  });

  return (
    <Glass
      style={[
        styles.pill,
        { left: SIDE, right: SIDE, bottom: insets.bottom + BOTTOM_GAP },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.highlight, highlight]}
      />
      {state.routes.map((route, index) => (
        <TabVisual
          key={route.key}
          route={route}
          index={index}
          count={count}
          pos={pos}
          pillWidth={pillWidth}
          options={descriptors[route.key].options}
        />
      ))}
      {state.routes.map((route, index) => {
        const options = descriptors[route.key].options;
        const focused = state.index === index;
        const g = navPillTabX(index, state.index, count, pillWidth);
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            Haptics.selectionAsync().catch(() => {});
            navigation.navigate(route.name, route.params);
          }
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={() =>
              navigation.emit({ type: 'tabLongPress', target: route.key })
            }
            style={[
              styles.target,
              { left: g.x, width: focused ? g.activeW : TAB_W },
            ]}
          />
        );
      })}
    </Glass>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    height: size.navBar,
    borderRadius: radius.pill,
  },
  highlight: {
    position: 'absolute',
    top: (size.navBar - TAB_H) / 2,
    left: 0,
    height: TAB_H,
    borderRadius: radius.pill,
    backgroundColor: glass.highlight,
  },
  target: {
    position: 'absolute',
    top: (size.navBar - TAB_H) / 2,
    height: TAB_H,
    borderRadius: radius.pill,
  },
  visual: {
    position: 'absolute',
    top: (size.navBar - TAB_H) / 2,
    left: 0,
    height: TAB_H,
    width: ACTIVE_MAX_W,
    justifyContent: 'center',
  },
  icon: {
    position: 'absolute',
    left: ICON_X,
    width: ICON,
    height: ICON,
  },
  label: {
    position: 'absolute',
    left: LABEL_X,
    right: 8,
    color: colors.fg,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    letterSpacing: -0.42,
  },
  badge: {
    position: 'absolute',
    top: 6,
    left: TAB_W - 4 - 17,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.fg,
  },
  badgeText: {
    color: colors.onPrimary,
    fontFamily: 'Inter_700Bold',
    fontSize: 10.5,
    lineHeight: 17,
    textAlign: 'center',
  },
});
