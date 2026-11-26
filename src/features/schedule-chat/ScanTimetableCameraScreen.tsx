import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, StatusPill } from '../../components/AuthPrimitives';
import { Glass } from '../../components/Glass';
import { Pressable3D } from '../../components/Pressable3D';
import { colors, radius, typography } from '../../theme/tokens';

interface ScanTimetableCameraScreenProps {
  detectedCount?: number;
  cameraSlot?: React.ReactNode; // Truyền <CameraView style={StyleSheet.absoluteFill} /> khi gắn camera thật
  onClose?: () => void;
  onPickFromGallery?: () => void;
  onCapture?: () => void;
}

export function ScanTimetableCameraScreen({
  detectedCount = 8,
  cameraSlot,
  onClose,
  onPickFromGallery,
  onCapture,
}: ScanTimetableCameraScreenProps) {
  const [flashOn, setFlashOn] = useState(false);

  return (
    <View style={styles.root}>
      {/* Camera feed layer */}
      <View style={styles.cameraLayer}>{cameraSlot}</View>

      {/* Khung ngắm 4 góc trắng bo tròn (không dùng khung xanh) */}
      <View pointerEvents="none" style={styles.cornersFrame}>
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />
      </View>

      <SafeAreaView style={styles.safe}>
        {/* Topbar */}
        <View style={styles.topNav}>
          <IconButton icon="x" onPress={onClose} />
          <Glass borderRadius={radius.pill}>
            <StatusPill
              glyph="ok"
              label={`Đã đọc ${detectedCount} ô`}
              tone="done"
            />
          </Glass>
        </View>

        <View style={{ flex: 1 }} />

        <Text style={[typography.sm, styles.guideText]}>
          Đặt cả thời khóa biểu vào khung. Giữ máy thẳng.
        </Text>

        {/* Shutter bar */}
        <View style={styles.controlsRow}>
          <IconButton icon="image" onPress={onPickFromGallery} />

          <Pressable3D onPress={onCapture}>
            <View style={styles.shutterOuter}>
              <View style={styles.shutterInner} />
            </View>
          </Pressable3D>

          <View style={{ opacity: flashOn ? 1 : 0.65 }}>
            <IconButton
              icon="flash"
              onPress={() => setFlashOn((prev) => !prev)}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
  cameraLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#101010',
  },
  cornersFrame: {
    position: 'absolute',
    top: '21%',
    bottom: '28%',
    left: 24,
    right: 24,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 16,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 16,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 16,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 16,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  topNav: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guideText: {
    textAlign: 'center',
    color: colors.fg2,
  },
  controlsRow: {
    marginTop: 20,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shutterOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    borderColor: colors.fg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.fg,
  },
});