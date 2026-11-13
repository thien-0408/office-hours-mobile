import { useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  DarkTheme,
  NavigationContainer,
  useIsFocused,
} from '@react-navigation/native';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import {
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { CalendarDays, House } from 'lucide-react-native';
import {
  BlurTarget,
  Glow,
  GlassProvider,
  NavPill,
  Odometer,
  PressableCard,
  Reveal,
  useTabBarSpace,
} from './src/components/motion';
import { colors, radius, space, text } from './src/theme';

const Tab = createBottomTabNavigator();
const renderTabBar = (props: BottomTabBarProps) => <NavPill {...props} />;
const homeIcon = ({ color, size }: { color: string; size: number }) => (
  <House color={color} size={size} />
);
const calendarIcon = ({ color, size }: { color: string; size: number }) => (
  <CalendarDays color={color} size={size} />
);
const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg },
};

// Demo of the motion kit (F-03). Replaced by real navigation later.
function DemoScreen({
  title,
  tone,
}: {
  title: string;
  tone: 'brand' | 'teal';
}) {
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarSpace();
  const [left, setLeft] = useState(125);

  useEffect(() => {
    const t = setInterval(() => setLeft(v => (v > 0 ? v - 1 : 125)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={styles.screen}>
      <Glow tone={tone} position="tl" />
      <BlurTarget active={focused} style={styles.flex}>
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + space.xl,
            paddingBottom: bottom,
            paddingHorizontal: space.gutter,
            gap: space.md,
          }}
        >
          <Text style={text.t1}>{title}</Text>
          <Odometer value={left} format="mm:ss" />
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <Reveal key={i} id={`${title}-${i}`} index={i}>
              <PressableCard style={styles.card}>
                <Text style={text.t3}>Thẻ {i + 1}</Text>
                <Text style={text.sub}>
                  Chạm và giữ để thấy hiệu ứng nghiêng
                </Text>
              </PressableCard>
            </Reveal>
          ))}
        </ScrollView>
      </BlurTarget>
    </View>
  );
}

const HomeScreen = () => <DemoScreen title="Trang chủ" tone="brand" />;
const BookScreen = () => <DemoScreen title="Lịch hẹn" tone="teal" />;

function App() {
  const [fontsLoaded] = useFonts({
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        {fontsLoaded ? (
          <GlassProvider>
            <NavigationContainer theme={navTheme}>
              <Tab.Navigator
                tabBar={renderTabBar}
                screenOptions={{
                  headerShown: false,
                  sceneStyle: styles.screen,
                }}
              >
                <Tab.Screen
                  name="Home"
                  component={HomeScreen}
                  options={{
                    title: 'Trang chủ',
                    tabBarIcon: homeIcon,
                  }}
                />
                <Tab.Screen
                  name="Book"
                  component={BookScreen}
                  options={{
                    title: 'Lịch hẹn',
                    tabBarBadge: 2,
                    tabBarIcon: calendarIcon,
                  }}
                />
              </Tab.Navigator>
            </NavigationContainer>
          </GlassProvider>
        ) : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  card: {
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.s1,
    gap: space.xs,
  },
});

export default App;
