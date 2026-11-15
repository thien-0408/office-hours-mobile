import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ImportScheduleResult } from '../../../api/domainTypes';
import { Button } from '../../../components/Button';
import { TopNav } from '../../../components/TopNav';
import { colors, fonts, ls, space } from '../../../theme';
import {
  readTimetablePdfs,
  timetablePdfErrorText,
} from '../pdf/readTimetablePdfs';
import { ScanReview } from '../scan/ScanReview';
import { fromTimetableRows, type ScanRow } from '../scan/rows';

type Step =
  | { name: 'pick'; busy: boolean; notice: string | null }
  | { name: 'review'; rows: ScanRow[]; sourceFiles: string[] }
  | { name: 'done'; result: ImportScheduleResult };

/** 18. Nhập thời khóa biểu từ PDF: chọn file (18a), soát lại (18b), xong. */
export function ScheduleScanScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [step, setStep] = useState<Step>({
    name: 'pick',
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
  const toPick = (notice: string | null = null) =>
    setStep({ name: 'pick', busy: false, notice });

  const onPick = async () => {
    setStep({ name: 'pick', busy: true, notice: null });
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (picked.canceled || picked.assets.length === 0) {
        toPick();
        return;
      }
      const { rows, sourceFiles } = await readTimetablePdfs(
        picked.assets.map(a => ({
          uri: a.uri,
          name: a.name,
          mimeType: a.mimeType,
        })),
      );
      setStep({ name: 'review', rows: fromTimetableRows(rows), sourceFiles });
    } catch (e) {
      toPick(timetablePdfErrorText(e));
    }
  };

  if (step.name === 'pick') {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <View style={styles.nav}>
          <TopNav onBack={close} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>Nhập thời khóa biểu (PDF)</Text>
          <Text style={styles.line}>
            Chọn file PDF thời khóa biểu tải từ phòng Đào tạo. Có thể chọn nhiều
            file một lần, ví dụ file lý thuyết và file thực hành.
          </Text>
          <Text style={styles.line}>
            Chỉ nhận đúng file mẫu của trường, không nhận ảnh chụp.
          </Text>
          {step.notice ? <Text style={styles.err}>{step.notice}</Text> : null}
        </View>
        <View style={styles.footer}>
          <Button title="Chọn file PDF" onPress={onPick} loading={step.busy} />
          <Button
            variant="quiet"
            title="Nhập tay"
            disabled={step.busy}
            onPress={() =>
              setStep({ name: 'review', rows: [], sourceFiles: [] })
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  if (step.name === 'review') {
    return (
      <ScanReview
        initialRows={step.rows}
        sourceFiles={step.sourceFiles}
        onBack={() => toPick()}
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
    backgroundColor: colors.bg,
  },
  nav: {
    paddingHorizontal: space.gutter,
  },
  err: {
    fontSize: 13.5,
    fontFamily: fonts.medium,
    color: colors.err,
    lineHeight: 20,
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
    gap: space.sm,
  },
});
