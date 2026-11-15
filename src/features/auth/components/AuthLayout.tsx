import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Screen, TopNav } from '../../../components';
import { Glow, type GlowPosition } from '../../../components/motion';
import { glow } from '../../../theme';

export type AuthLayoutProps = {
  tone: keyof typeof glow;
  glowPosition?: GlowPosition;
  onBack?: () => void;
  backLabel?: string;
  right?: ReactNode;
  children: ReactNode;
};

/** Glow + top bar + scrolling body that keeps the bottom button reachable with the keyboard open. */
export function AuthLayout({
  tone,
  glowPosition = 'tl',
  onBack,
  backLabel,
  right,
  children,
}: AuthLayoutProps) {
  return (
    <View style={styles.root}>
      <Glow tone={tone} position={glowPosition} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Screen
          scroll
          style={styles.transparent}
          edges={['top', 'bottom']}
          contentContainerStyle={styles.content}
          scrollViewProps={{ keyboardDismissMode: 'on-drag' }}
        >
          <TopNav
            onBack={onBack}
            backAccessibilityLabel={backLabel}
            right={right}
            style={styles.nav}
          />
          {children}
        </Screen>
      </KeyboardAvoidingView>
    </View>
  );
}

/** Pushes following children (the primary button) to the bottom when there is room. */
export function Spacer() {
  return <View style={styles.spacer} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  transparent: { backgroundColor: 'transparent' },
  content: { flexGrow: 1, paddingBottom: 16 },
  nav: { paddingHorizontal: 0 },
  spacer: { flexGrow: 1, minHeight: 24 },
});
