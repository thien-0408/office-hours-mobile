import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  NavPill,
  SettingsGroup,
  SettingsRow,
  SubLabel,
} from '../../components/AppPrimitives';
import { IconButton, RevealView } from '../../components/AuthPrimitives';
import { GoogleMeetLogo, ZoomLogo } from '../../components/Icons';
import {
  colors,
  fontFamily,
  ls,
  typography,
} from '../../theme/tokens';
import {
  CreateAvailabilityPayload,
  CreateAvailabilitySheet,
} from './CreateAvailabilitySheet';

export interface AvailabilityRuleItem {
  id: string;
  dayGroup: string; // VD: "Thứ Hai", "Thứ Tư"
  timeRange: string; // VD: "08:00 – 10:00"
  detailSub: string; // VD: "Slot 20 phút · 306.B11"
  slotCount: number;
  meetingProvider?: 'zoom' | 'meet' | null;
}

export interface AvailabilityExceptionItem {
  id: string;
  type: 'BLOCK' | 'ADD';
  title: string;
  reason: string;
}

const SAMPLE_RULES: AvailabilityRuleItem[] = [
  {
    id: 'rule-1',
    dayGroup: 'Thứ Hai',
    timeRange: '08:00 – 10:00',
    detailSub: 'Slot 20 phút · 306.B11',
    slotCount: 6,
  },
  {
    id: 'rule-2',
    dayGroup: 'Thứ Tư',
    timeRange: '14:00 – 16:00',
    detailSub: 'Slot 20 phút · 306.B11',
    slotCount: 6,
  },
  {
    id: 'rule-3',
    dayGroup: 'Thứ Tư',
    timeRange: '19:00 – 20:00',
    detailSub: 'Slot 15 phút · online',
    slotCount: 4,
    meetingProvider: 'zoom',
  },
];

const SAMPLE_EXCEPTIONS: AvailabilityExceptionItem[] = [
  {
    id: 'ex-1',
    type: 'BLOCK',
    title: 'Nghỉ · Thứ Sáu 20/11',
    reason: 'Họp khoa cả ngày',
  },
  {
    id: 'ex-2',
    type: 'ADD',
    title: 'Thêm · Thứ Bảy 21/11, 09:00 – 10:00',
    reason: 'Ôn thi cuối kỳ · 306.B11',
  },
];

interface LecturerAvailabilityScreenProps {
  rules?: AvailabilityRuleItem[];
  exceptions?: AvailabilityExceptionItem[];
  onCreateRules?: (payload: CreateAvailabilityPayload) => Promise<void>;
  onPressRule?: (rule: AvailabilityRuleItem) => void;
  onPressException?: (ex: AvailabilityExceptionItem) => void;
  onSelectTab?: (tab: string) => void;
}

export function LecturerAvailabilityScreen({
  rules = SAMPLE_RULES,
  exceptions = SAMPLE_EXCEPTIONS,
  onCreateRules,
  onPressRule,
  onPressException,
  onSelectTab,
}: LecturerAvailabilityScreenProps) {
  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  // Nhóm rules theo thứ trong tuần
  const groupedDays = Array.from(new Set(rules.map((r) => r.dayGroup)));

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* AppHead */}
          <View style={styles.appHead}>
            <RevealView index={0}>
              <Text style={styles.pageTitle}>Lịch rảnh</Text>
            </RevealView>
            <IconButton icon="plus" onPress={() => setCreateSheetOpen(true)} />
          </View>

          <RevealView index={1}>
            <Text style={typography.sm}>
              Mỗi khung giờ lặp lại hằng tuần và tự chia thành slot.
            </Text>
          </RevealView>

          {/* Nhóm theo thứ */}
          {groupedDays.map((dayName, gIdx) => {
            const dayRules = rules.filter((r) => r.dayGroup === dayName);
            return (
              <RevealView key={dayName} index={gIdx + 2}>
                <SubLabel>{dayName}</SubLabel>
                <SettingsGroup>
                  {dayRules.map((rule) => (
                    <SettingsRow
                      key={rule.id}
                      label={rule.timeRange}
                      subtitle={rule.detailSub}
                      valueText={`${rule.slotCount} slot`}
                      showChevron
                      rightSlot={
                        rule.meetingProvider === 'zoom' ? (
                          <View style={styles.providerBadge}>
                            <ZoomLogo size={20} />
                          </View>
                        ) : rule.meetingProvider === 'meet' ? (
                          <View style={styles.providerBadge}>
                            <GoogleMeetLogo size={20} />
                          </View>
                        ) : undefined
                      }
                      onPress={() => onPressRule?.(rule)}
                    />
                  ))}
                </SettingsGroup>
              </RevealView>
            );
          })}

          {/* Nhóm Ngoại lệ */}
          {exceptions.length > 0 && (
            <RevealView index={groupedDays.length + 2}>
              <SubLabel>Ngoại lệ</SubLabel>
              <SettingsGroup>
                {exceptions.map((ex) => (
                  <SettingsRow
                    key={ex.id}
                    label={ex.title}
                    subtitle={ex.reason}
                    showChevron
                    onPress={() => onPressException?.(ex)}
                  />
                ))}
              </SettingsGroup>
            </RevealView>
          )}
        </ScrollView>
      </SafeAreaView>

      <CreateAvailabilitySheet
        visible={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        onSubmit={async (payload) => {
          await onCreateRules?.(payload);
        }}
      />

      <NavPill role="gv" activeTab="book" onSelectTab={onSelectTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  appHead: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    letterSpacing: ls(28, -0.055),
    color: colors.fg,
  },
  providerBadge: {
    marginRight: 4,
  },
});