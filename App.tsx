import { useRef, type ComponentRef } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BlurTargetView, BlurView } from 'expo-blur';
import {
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Clock } from 'lucide-react-native';

// Smoke screen proving the UI foundation works. Replaced by navigation later.
function App() {
  const [fontsLoaded] = useFonts({
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const blurTarget = useRef<ComponentRef<typeof View>>(null);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        {fontsLoaded ? (
          <View style={styles.container}>
            <Text style={styles.title}>OfficeHours</Text>
            <Clock color="#FFFFFF" size={24} />
            <View style={styles.stack}>
              <BlurTargetView ref={blurTarget} style={styles.backdrop}>
                <View style={styles.colour} />
              </BlurTargetView>
              <BlurView
                intensity={60}
                tint="dark"
                blurTarget={blurTarget}
                blurMethod="dimezisBlurViewSdk31Plus"
                style={styles.blur}
              />
            </View>
            <Pressable
              onPressIn={() => {
                scale.value = withSpring(0.92);
              }}
              onPressOut={() => {
                scale.value = withSpring(1);
              }}
            >
              <Animated.View style={[styles.button, animatedStyle]}>
                <Text style={styles.buttonText}>Nhấn thử</Text>
              </Animated.View>
            </Pressable>
          </View>
        ) : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    backgroundColor: '#000000',
  },
  title: { color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 32 },
  stack: { width: 240, height: 120 },
  backdrop: { width: 240, height: 120, borderRadius: 24, overflow: 'hidden' },
  colour: { flex: 1, backgroundColor: '#3465E0' },
  blur: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 24,
    overflow: 'hidden',
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#E0E0E0',
  },
  buttonText: {
    color: '#000000',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
});

export default App;
