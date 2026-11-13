import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton } from '../../../components';
import { colors, space } from '../../../theme';
import { LecturerCover } from './LecturerCover';

export type SheetFrameProps = {
  lecturerId: string;
  photoUrl?: string | null;
  onBack: () => void;
  children: ReactNode;
};

/**
 * Bottom-sheet look (mock 12, 12b, 15) as a normal stack screen: dimmed lecturer cover behind,
 * a #121212 sheet with a grab bar anchored at the bottom. Shared by BookSlot and Reschedule.
 */
export function SheetFrame({
  lecturerId,
  photoUrl,
  onBack,
  children,
}: SheetFrameProps) {
  return (
    <View style={styles.root}>
      <LecturerCover id={lecturerId} photoUrl={photoUrl} dim />
      <SafeAreaView edges={['top']} style={styles.flex}>
        <View style={styles.nav}>
          <IconButton
            icon={ChevronLeft}
            accessibilityLabel="Quay lại"
            onPress={onBack}
            style={styles.navBtn}
          />
        </View>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.spacer} />
          <View style={styles.sheet}>
            <View style={styles.grab} />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetContent}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  nav: { paddingHorizontal: space.gutter, height: 52, justifyContent: 'center' },
  navBtn: { backgroundColor: 'rgba(0,0,0,0.38)' },
  spacer: { flexGrow: 1, minHeight: 24 },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderCurve: 'continuous',
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderColor: colors.line2,
    paddingTop: 10,
  },
  grab: {
    width: 40,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.fg4,
    alignSelf: 'center',
    marginBottom: 18,
  },
  sheetContent: { paddingHorizontal: 20, paddingBottom: 30 },
});
