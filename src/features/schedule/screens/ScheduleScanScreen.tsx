import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ImportScheduleResult } from '../../../api/domainTypes';
import { Button } from '../../../components/Button';
import { colors, fonts, ls, space } from '../../../theme';
import { scanImage } from '../scan/ocr';
import { ScanCapture } from '../scan/ScanCapture';
import { ScanReview } from '../scan/ScanReview';
import { fromParsed, type ScanRow } from '../scan/rows';

type Step =
  | { name: 'capture'; busy: boolean; notice: string | null }
  | { name: 'review'; rows: ScanRow[] }
  | { name: 'done'; result: ImportScheduleResult };

const NOTHING_READ =
  'Không đọc được dòng nào. Chụp gần hơn, đủ sáng, rồi thử lại.';
const OCR_FAILED = 'Không đọc được ảnh. Thử chụp lại.';

/** 18. Quét thời khóa biểu: chụp (18a), soát lại (18b), xong. */
export function ScheduleScanScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [step, setStep] = useState<Step>({
    name: 'capture',
    busy: false,
    notice: null,
  });

  const close = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MySchedule');
    }
  };
  const toCapture = (notice: string | null = null) =>
    setStep({ name: 'capture', busy: false, notice });

  const onCaptured = async (uri: string) => {
    setStep({ name: 'capture', busy: true, notice: null });
    try {
      const parsed = await scanImage(uri);
      if (parsed.length === 0) {
        toCapture(NOTHING_READ);
      } else {
        setStep({ name: 'review', rows: fromParsed(parsed) });
      }
    } catch {
      toCapture(OCR_FAILED);
    }
  };

  if (step.name === 'capture') {
    return (
      <ScanCapture
        busy={step.busy}
        notice={step.notice}
        onCaptured={onCaptured}
        onCaptureFailed={() => toCapture(OCR_FAILED)}
        onClose={close}
        onManual={() => setStep({ name: 'review', rows: [] })}
      />
    );
  }

  if (step.name === 'review') {
    return (
      <ScanReview
        initialRows={step.rows}
        onBack={() => toCapture()}
        onDone={result => setStep({ name: 'done', result })}
      />
    );
  }

  const { result } = step;
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <Text style={styles.title}>Đã lưu thời khóa biểu</Text>
        <Text style={styles.line}>
          Thêm {result.addedCount} dòng · bỏ qua {result.skippedCount} · thay{' '}
          {result.replacedCount}
        </Text>
        <Text style={styles.line}>
          Các khung giờ trống để đặt lịch hẹn đã được cập nhật.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button
          title="Xem lịch của tôi"
          onPress={() => navigation.navigate('MySchedule')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.gutter,
    gap: space.md,
  },
  title: {
    fontSize: 30,
    fontFamily: fonts.bold,
    letterSpacing: ls(30, -0.05),
    color: colors.fg,
  },
  line: {
    fontSize: 14.5,
    fontFamily: fonts.medium,
    letterSpacing: ls(14.5, -0.012),
    color: colors.fg2,
    lineHeight: 21,
  },
  footer: {
    paddingHorizontal: space.gutter,
    paddingBottom: space.lg,
  },
});
