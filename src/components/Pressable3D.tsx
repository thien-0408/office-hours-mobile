import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { press3DConfig, springs } from '../theme/tokens';

interface Pressable3DProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  maxTilt?: number;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
}

export function Pressable3D({
  children,
  onPress,
  disabled = false,
  maxTilt = press3DConfig.maxTilt,
  style,
  haptic = true,
}: Pressable3DProps) {
  const reducedMotion = useReducedMotion();
  const rotX = useSharedValue(0);
  const rotY = useSharedValue(0);
  const scale = useSharedValue(1);
  const width = useSharedValue(1);
  const height = useSharedValue(1);

  const triggerPress = () => {
    if (disabled) return;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    }
    onPress?.();
  };

  const gesture = Gesture.Pan()
    .enabled(!disabled)
    .maxPointers(1)
    .shouldCancelWhenOutside(true)
    .onBegin((e) => {
      if (reducedMotion) {
        scale.value = withSpring(0.98, springs.press);
        return;
      }
      const nx = (e.x / Math.max(width.value, 1)) * 2 - 1;
      const ny = (e.y / Math.max(height.value, 1)) * 2 - 1;
      rotX.value = withSpring(-ny * maxTilt, springs.press);
      rotY.value = withSpring(nx * maxTilt, springs.press);
      scale.value = withSpring(press3DConfig.pressedScale, springs.press);
    })
    .onUpdate((e) => {
      if (reducedMotion) return;
      const nx = Math.max(-1, Math.min(1, (e.x / Math.max(width.value, 1)) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, (e.y / Math.max(height.value, 1)) * 2 - 1));
      rotX.value = -ny * maxTilt;
      rotY.value = nx * maxTilt;
    })
    .onEnd(() => {
      runOnJS(triggerPress)();
    })
    .onFinalize(() => {
      rotX.value = withSpring(0, springs.press);
      rotY.value = withSpring(0, springs.press);
      scale.value = withSpring(1, springs.press);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 700 },
      { rotateX: `${rotX.value}deg` },
      { rotateY: `${rotY.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        onLayout={(e) => {
          width.value = e.nativeEvent.layout.width;
          height.value = e.nativeEvent.layout.height;
        }}
        style={[style, animatedStyle]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}