import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Button } from '../../../components/Button';
import { IconButton } from '../../../components/IconButton';
import {
  openSettings,
  requestCamera,
  type PermissionResult,
} from '../../../platform/permissions';
import { colors, fonts, ls, space } from '../../../theme';

export interface ScanCaptureProps {
  /** True while the photo is being read: the shutter is locked and "Đang đọc…" shows. */
  busy: boolean;
  /** Message from the previous attempt (nothing read, OCR failed, ...). */
  notice?: string | null;
  onCaptured: (uri: string) => void;
  onCaptureFailed: () => void;
  onClose: () => void;
  /** Open the review screen with no rows (type them by hand). */
  onManual: () => void;
}

const CORNER = 36;

/** 18a. Full-screen camera with corner guides and a shutter. */
export function ScanCapture({
  busy,
  notice,
  onCaptured,
  onCaptureFailed,
  onClose,
  onManual,
}: ScanCaptureProps) {
  const insets = useSafeAreaInsets();
  const camera = useRef<CameraView>(null);
  const [permission, setPermission] = useState<PermissionResult | 'checking'>(
    'checking',
  );
  const [shooting, setShooting] = useState(false);

  const ask = useCallback(async () => {
    setPermission('checking');
    try {
      setPermission(await requestCamera());
    } catch {
      setPermission('denied');
    }
  }, []);

  useEffect(() => {
    ask();
  }, [ask]);

  const shoot = async () => {
    if (shooting || busy || !camera.current) {
      return;
    }
    setShooting(true);
    try {
      const pic = await camera.current.takePictureAsync({ quality: 0.9 });
      if (pic?.uri) {
        onCaptured(pic.uri);
      } else {
        onCaptureFailed();
      }
    } catch {
      onCaptureFailed();
    } finally {
      setShooting(false);
    }
  };

  const top = { paddingTop: insets.top + space.sm };
  const bottom = { paddingBottom: insets.bottom + space.xxl };

  if (permission !== 'granted') {
    return (
      <View style={[styles.root, styles.center]}>
        <View style={[styles.topBar, top]}>
          <IconButton
            icon={X}
            accessibilityLabel="Đóng"
            onPress={onClose}
          />
        </View>
        <View style={styles.permBody}>
          <Text style={styles.permTitle}>
            {permission === 'checking'
              ? 'Đang kiểm tra camera…'
              : 'Cần quyền dùng camera'}
          </Text>
          {permission === 'denied' ? (
            <>
              <Text style={styles.permText}>
                Ứng dụng cần camera để đọc thời khóa biểu. Ảnh chỉ được đọc
                trên máy bạn.
              </Text>
              <Button title="Cho phép camera" onPress={ask} />
            </>
          ) : null}
          {permission === 'blocked' ? (
            <>
              <Text style={styles.permText}>
                Camera đang bị chặn. Mở cài đặt để bật lại cho OfficeHours.
              </Text>
              <Button title="Mở cài đặt" onPress={() => openSettings()} />
            </>
          ) : null}
          {permission !== 'checking' ? (
            <Button variant="quiet" title="Nhập tay" onPress={onManual} />
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing="back"
        animateShutter={false}
      />

      <View
        pointerEvents="none"
        style={[styles.frame, { top: insets.top + 96, bottom: insets.bottom + 190 }]}
      >
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />
      </View>

      <View style={[styles.topBar, top]}>
        <IconButton icon={X} accessibilityLabel="Đóng" onPress={onClose} />
      </View>

      <View style={[styles.bottom, bottom]}>
        <Text style={styles.hint}>
          {busy
            ? 'Đang đọc…'
            : notice ?? 'Đặt cả thời khóa biểu vào khung. Giữ máy thẳng.'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chụp ảnh thời khóa biểu"
          accessibilityState={{ disabled: busy || shooting, busy }}
          disabled={busy || shooting}
          onPress={shoot}
          style={[styles.shutter, (busy || shooting) && styles.shutterOff]}
        >
          <View style={styles.shutterInner} />
        </Pressable>
        <Button variant="quiet" title="Nhập tay" onPress={onManual} />
      </View>

      {busy ? <View pointerEvents="none" style={styles.dim} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    justifyContent: 'flex-start',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: space.gutter,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  frame: {
    position: 'absolute',
    left: 28,
    right: 28,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: colors.fg,
  },
  tl: {
    left: 0,
    top: 0,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderTopLeftRadius: 16,
  },
  tr: {
    right: 0,
    top: 0,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderTopRightRadius: 16,
  },
  bl: {
    left: 0,
    bottom: 0,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderBottomLeftRadius: 16,
  },
  br: {
    right: 0,
    bottom: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderBottomRightRadius: 16,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.gutter,
  },
  hint: {
    fontSize: 13,
    fontFamily: fonts.medium,
    letterSpacing: ls(13, -0.01),
    color: colors.fg,
    textAlign: 'center',
  },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: colors.fg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOff: {
    opacity: 0.4,
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.fg,
  },
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  permBody: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.gutter,
    gap: space.lg,
  },
  permTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    letterSpacing: ls(24, -0.045),
    color: colors.fg,
  },
  permText: {
    fontSize: 14.5,
    fontFamily: fonts.medium,
    letterSpacing: ls(14.5, -0.012),
    color: colors.fg2,
    lineHeight: 22,
  },
});
