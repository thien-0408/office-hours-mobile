import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  useIsFocused,
  useNavigation,
  useNavigationState,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurTarget, useTabBarSpace } from '../components/motion';
import { colors, radius, space, text } from '../theme';
import { useAppSession } from './devSession';
import { resolveTarget, SAMPLE_PARAMS, SCREEN_NUMBER } from './roleConfig';
import type { ScreenName } from './types';

/**
 * TODO: temporary shell for the 28 placeholder screens. Each feature task
 * replaces its placeholder with the real UI and this file can then go.
 * Plain RN only on purpose. `links` are screens to open; links the current
 * role cannot reach are hidden.
 */
export function PlaceholderScreen({
  screen,
  title,
  links = [],
  children,
}: {
  screen: ScreenName;
  title: string;
  links?: ScreenName[];
  children?: ReactNode;
}) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { role } = useAppSession();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const isTabRoot = useNavigationState(s => s.type === 'tab');

  const navigate = navigation.navigate as (
    name: string,
    params?: object,
  ) => void;
  const go = (to: ScreenName) => {
    const target = resolveTarget(role, to);
    if (!target) {
      return;
    }
    if (target.kind === 'tab') {
      navigate('Tabs', { screen: target.tab });
    } else {
      navigate(target.screen, SAMPLE_PARAMS[to]);
    }
  };

  const body = (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + space.xl,
          paddingBottom: isTabRoot ? tabSpace : insets.bottom + space.xl,
        },
      ]}
    >
      {navigation.canGoBack() ? (
        <PlaceholderButton
          label="← Quay lại"
          onPress={() => navigation.goBack()}
        />
      ) : null}
      <Text style={text.sub}>Màn {SCREEN_NUMBER[screen]}</Text>
      <Text style={text.t1}>{title}</Text>
      {children}
      {links.map(to =>
        resolveTarget(role, to) ? (
          <PlaceholderButton
            key={to}
            label={`${SCREEN_NUMBER[to]}. ${to}`}
            onPress={() => go(to)}
          />
        ) : null,
      )}
    </ScrollView>
  );

  return (
    <View style={styles.root}>
      {isTabRoot ? (
        <BlurTarget active={focused} style={styles.root}>
          {body}
        </BlurTarget>
      ) : (
        body
      )}
    </View>
  );
}

/** Plain button used by placeholders. */
export function PlaceholderButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.btn}>
      <Text style={text.t3}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: space.gutter, gap: space.md },
  btn: {
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.s2,
  },
});
