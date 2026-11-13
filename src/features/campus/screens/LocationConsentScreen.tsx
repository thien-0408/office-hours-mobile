import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import { Button, IconButton, Screen, TopNav } from '../../../components';
import type { AnyStackParamList, ScreenParams } from '../../../navigation/types';
import { openSettings, requestForegroundLocation } from '../../../platform/permissions';
import { colors, fonts, ls, radius, space, text } from '../../../theme';
import {
  getExplanationForStep,
  nextStepFor,
  type NextStep,
  setConsent,
} from '../consent';

interface FactItem {
  key: string;
  value: string;
  detail: string;
}

const FACTS: FactItem[] = [
  {
    key: 'Chia sẻ gì',
    value: 'Block, vị trí trong campus, tầng ước lượng',
    detail: 'Tọa độ ước lượng và độ chính xác GPS. Không theo dõi hành trình ngoài trường.',
  },
  {
    key: 'Với ai',
    value: 'Chỉ người trong buổi hẹn',
    detail: 'Chỉ sinh viên và giảng viên có lịch hẹn xác nhận, khi cả hai cùng bật.',
  },
  {
    key: 'Khi nào',
    value: 'Từ giờ hẹn tới tối đa 15 phút sau',
    detail: 'Từ giờ bắt đầu tới 15 phút sau giờ kết thúc. Chỉ khi app đang mở.',
  },
  {
    key: 'Lưu ở đâu',
    value: 'Không lưu lên máy chủ OfficeHours',
    detail: 'Dữ liệu truyền thẳng qua Realtime Database và tự động xóa khi kết thúc buổi hẹn.',
  },
];

function ConsentArt() {
  return (
    <View style={styles.artContainer} accessibilityElementsHidden aria-hidden>
      <View style={styles.artCanvas}>
        {/* Destination building block: Block 11 */}
        <View style={[styles.isoBlock, styles.blockB11]}>
          <View style={styles.blockRoofB11}>
            <Text style={styles.roofLabelB11}>B11</Text>
          </View>
          <View style={styles.blockFront} />
          <View style={styles.blockSide} />
        </View>

        {/* Adjacent building blocks */}
        <View style={[styles.isoBlock, styles.blockB8]}>
          <View style={styles.blockRoofMuted}>
            <Text style={styles.roofLabelMuted}>B8</Text>
          </View>
          <View style={styles.blockFront} />
          <View style={styles.blockSide} />
        </View>

        <View style={[styles.isoBlock, styles.blockB3]}>
          <View style={styles.blockRoofMuted}>
            <Text style={styles.roofLabelMuted}>B3</Text>
          </View>
          <View style={styles.blockFront} />
          <View style={styles.blockSide} />
        </View>

        {/* Connecting route indicators */}
        <View style={styles.routeTrack}>
          <View style={styles.routeDot} />
          <View style={styles.routeDot} />
          <View style={styles.routeDot} />
          <View style={styles.routeDot} />
        </View>

        {/* User location pin */}
        <View style={styles.userPin}>
          <View style={styles.userPinRing} />
          <View style={styles.userPinCore} />
          <View style={styles.pinTag}>
            <Text style={styles.pinTagText}>Bạn</Text>
          </View>
        </View>

        {/* Destination target marker */}
        <View style={styles.destPin}>
          <View style={styles.destPinCore} />
          <View style={[styles.pinTag, styles.destTag]}>
            <Text style={styles.destTagText}>306.B11</Text>
          </View>
        </View>
      </View>

      {/* Bottom fade to seamlessly blend into black background */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)', colors.bg]}
        style={styles.artFade}
        pointerEvents="none"
      />
    </View>
  );
}

export function LocationConsentScreen() {
  const route = useRoute<RouteProp<ScreenParams, 'LocationConsent'>>();
  const navigation = useNavigation<NativeStackNavigationProp<AnyStackParamList>>();

  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStep, setPermissionStep] = useState<NextStep | null>(null);
  const [explanationMessage, setExplanationMessage] = useState<string | null>(null);

  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handlePrimaryPress = async () => {
    if (permissionStep === 'settings') {
      await openSettings();
      return;
    }

    setIsRequesting(true);
    setExplanationMessage(null);
    try {
      await setConsent(true);
      const permissionResult = await requestForegroundLocation();
      const step = nextStepFor(permissionResult);
      setPermissionStep(step);

      if (step === 'navigate') {
        const nextRoute = route.params?.next;
        if (nextRoute) {
          navigation.navigate(nextRoute as any);
        } else if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('CampusMap' as any);
        }
      } else {
        setExplanationMessage(getExplanationForStep(step));
      }
    } catch {
      setPermissionStep('retry');
      setExplanationMessage(getExplanationForStep('retry'));
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDecline = async () => {
    try {
      await setConsent(false);
    } finally {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  };

  const handleHelp = () => {
    navigation.navigate('Help' as any);
  };

  const getPrimaryButtonTitle = (): string => {
    if (permissionStep === 'settings') {
      return 'Mở Cài đặt';
    }
    if (permissionStep === 'retry') {
      return 'Thử lại';
    }
    return 'Cho phép vị trí';
  };

  return (
    <Screen edges={['top', 'bottom']} scroll contentContainerStyle={styles.screenContent}>
      <TopNav
        left={
          <IconButton
            icon={X}
            accessibilityLabel="Đóng"
            onPress={handleClose}
          />
        }
      />

      <ConsentArt />

      <View style={styles.body}>
        <Text style={styles.title}>Chia sẻ vị trí trong buổi hẹn</Text>
        <Text style={styles.subtitle}>
          Để hai bên tìm thấy nhau khi gặp trực tiếp. Bạn tắt được bất cứ lúc nào.
        </Text>

        <View style={styles.factsCard}>
          {FACTS.map((item, index) => (
            <View
              key={item.key}
              style={[
                styles.factRow,
                index > 0 && styles.factRowDivider,
              ]}
            >
              <Text style={styles.factKey}>{item.key}</Text>
              <View style={styles.factValueSlot}>
                <Text style={styles.factValue}>{item.value}</Text>
                <Text style={styles.factDetail}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        {explanationMessage ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{explanationMessage}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            variant="primary"
            title={getPrimaryButtonTitle()}
            loading={isRequesting}
            onPress={handlePrimaryPress}
            accessibilityLabel={getPrimaryButtonTitle()}
          />

          <Button
            variant="quiet"
            title="Để sau"
            disabled={isRequesting}
            onPress={handleDecline}
            accessibilityLabel="Để sau"
            style={styles.quietBtn}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đọc thêm về quyền riêng tư"
            onPress={handleHelp}
            style={styles.privacyLink}
            hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
          >
            <Text style={styles.privacyLinkText}>Đọc thêm về quyền riêng tư</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: space.xxl,
  },
  body: {
    marginTop: space.sm,
  },
  title: {
    ...text.t1,
    marginTop: space.xs,
  },
  subtitle: {
    ...text.sub,
    marginTop: space.sm,
    color: colors.fg2,
  },
  artContainer: {
    height: 190,
    marginHorizontal: -space.gutter,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.bg,
  },
  artCanvas: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  isoBlock: {
    position: 'absolute',
  },
  blockB11: {
    top: 32,
    right: 56,
    width: 90,
    height: 60,
  },
  blockB8: {
    top: 72,
    left: 48,
    width: 76,
    height: 48,
  },
  blockB3: {
    top: 24,
    left: 110,
    width: 68,
    height: 42,
  },
  blockRoofB11: {
    width: '100%',
    height: 38,
    backgroundColor: '#383838',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ skewX: '-24deg' }, { rotate: '4deg' }],
  },
  roofLabelB11: {
    color: '#ffffff',
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: ls(12, -0.02),
  },
  blockRoofMuted: {
    width: '100%',
    height: 32,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ skewX: '-24deg' }, { rotate: '4deg' }],
  },
  roofLabelMuted: {
    color: colors.fg3,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  blockFront: {
    height: 14,
    backgroundColor: '#141414',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
  },
  blockSide: {
    position: 'absolute',
    right: -4,
    top: 6,
    width: 6,
    bottom: 0,
    backgroundColor: '#101010',
  },
  routeTrack: {
    position: 'absolute',
    top: 86,
    left: 128,
    width: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    transform: [{ rotate: '-18deg' }],
  },
  routeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.fg3,
  },
  userPin: {
    position: 'absolute',
    left: 64,
    top: 48,
    alignItems: 'center',
  },
  userPinRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    position: 'absolute',
    top: -5,
  },
  userPinCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.fg,
  },
  pinTag: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.s3,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  pinTagText: {
    fontSize: 10.5,
    fontFamily: fonts.semibold,
    color: colors.fg,
  },
  destPin: {
    position: 'absolute',
    right: 80,
    top: 20,
    alignItems: 'center',
  },
  destPinCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  destTag: {
    backgroundColor: '#262626',
    borderColor: '#ffffff',
  },
  destTagText: {
    fontSize: 10.5,
    fontFamily: fonts.bold,
    color: colors.fg,
  },
  artFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
  },
  factsCard: {
    marginTop: space.lg,
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    paddingHorizontal: 16,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  factRowDivider: {
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  factKey: {
    width: 82,
    paddingTop: 1,
    color: colors.fg3,
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: ls(13, -0.01),
  },
  factValueSlot: {
    flex: 1,
  },
  factValue: {
    color: colors.fg,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: ls(14, -0.015),
  },
  factDetail: {
    marginTop: 2,
    color: colors.fg3,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
  },
  messageBox: {
    marginTop: space.lg,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  messageText: {
    color: colors.fg2,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: ls(13, -0.01),
  },
  actions: {
    marginTop: space.xl,
    gap: space.sm,
  },
  quietBtn: {
    marginTop: 2,
  },
  privacyLink: {
    alignSelf: 'center',
    paddingVertical: space.sm,
    marginTop: space.xs,
  },
  privacyLinkText: {
    color: colors.fg2,
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    letterSpacing: ls(13.5, -0.015),
  },
});
