import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { SectionHeader } from '../../components/AppPrimitives';
import { IconButton, RevealView } from '../../components/AuthPrimitives';
import { GlowBackground } from '../../components/GlowBackground';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../../theme/tokens';

interface MeetingRecordScreenProps {
  studentName?: string;
  studentAvatarUrl?: string;
  timeSubtitle?: string;
  initialAttended?: boolean;
  initialNotes?: string;
  initialAiSummary?: string;
  onBack?: () => void;
  onSaveRecord?: (payload: {
    attended: boolean;
    notes: string;
  }) => Promise<void>;
  onRegenerateSummary?: () => Promise<string>;
}

export function MeetingRecordScreen({
  studentName = 'Phạm Ngọc Mai',
  studentAvatarUrl = 'https://i.pravatar.cc/200?img=25',
  timeSubtitle = 'Thứ Tư 18/11 · 14:00 – 14:20',
  initialAttended = true,
  initialNotes = 'Đề cương ổn. Cần rút gọn phần tổng quan, bổ sung sơ đồ ERD và kế hoạch kiểm thử.',
  initialAiSummary = 'Mai trình bày đề cương đồ án. Giảng viên đề nghị: (1) rút gọn chương tổng quan, (2) thêm sơ đồ ERD, (3) viết kế hoạch kiểm thử trước buổi sau.',
  onBack,
  onSaveRecord,
  onRegenerateSummary,
}: MeetingRecordScreenProps) {
  const [attended, setAttended] = useState(initialAttended);
  const [notes, setNotes] = useState(initialNotes);
  const [aiSummary, setAiSummary] = useState(initialAiSummary);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSaveRecord?.({ attended, notes: notes.trim() });
    } finally {
      setSaving(false);
    }
  };

  const handleUseSummary = () => {
    setNotes(aiSummary);
  };

  const handleRegenerate = async () => {
    if (regenerating) return;
    setRegenerating(true);
    try {
      if (onRegenerateSummary) {
        const next = await onRegenerateSummary();
        setAiSummary(next);
      }
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <View style={styles.root}>
      <GlowBackground tone="teal" position="tr" opacityOverride={0.25} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* AppHead */}
            <View style={styles.appHead}>
              <IconButton icon="left" onPress={onBack} />
              <Pressable
                disabled={saving}
                onPress={handleSave}
                style={({ pressed }) => [
                  styles.saveBtn,
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? 'Đang lưu' : 'Lưu'}
                </Text>
              </Pressable>
            </View>

            {/* Thông tin sinh viên */}
            <RevealView index={0} style={styles.studentRow}>
              <Image
                source={{ uri: studentAvatarUrl }}
                style={[styles.avatarLg, squircle(20)]}
                contentFit="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={typography.h2}>{studentName}</Text>
                <Text style={[typography.sm, { marginTop: 2 }]}>
                  {timeSubtitle}
                </Text>
              </View>
            </RevealView>

            {/* Segmented: Có mặt / Vắng mặt */}
            <RevealView index={1} style={styles.seg2}>
              <Pressable
                onPress={() => setAttended(true)}
                style={[styles.segTab, attended && styles.segTabOn]}
              >
                <Text style={[styles.segText, attended && styles.segTextOn]}>
                  Có mặt
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setAttended(false)}
                style={[styles.segTab, !attended && styles.segTabOn]}
              >
                <Text style={[styles.segText, !attended && styles.segTextOn]}>
                  Vắng mặt
                </Text>
              </Pressable>
            </RevealView>

            {/* Ô Ghi chú */}
            <RevealView
              index={2}
              style={[styles.notesBox, squircle(radius.lg)]}
            >
              <Text style={styles.notesLabel}>Ghi chú</Text>
              <TextInput
                multiline
                value={notes}
                onChangeText={setNotes}
                placeholder="Nhập nội dung đã trao đổi hoặc kết luận buổi hẹn…"
                placeholderTextColor={colors.fg4}
                selectionColor={colors.fg}
                style={styles.notesInput}
              />
            </RevealView>

            {/* Tóm tắt tự động (không icon lấp lánh, không gradient tím) */}
            <RevealView index={3}>
              <SectionHeader
                title="Tóm tắt tự động"
                style={{ marginTop: 22, marginBottom: 10 }}
              />

              <View style={[styles.aiCard, squircle(radius.lg)]}>
                <Text style={styles.aiText}>{aiSummary}</Text>

                <View style={styles.aiActions}>
                  <Pressable
                    onPress={handleUseSummary}
                    style={styles.useSummaryBtn}
                  >
                    <Text style={styles.useSummaryText}>Dùng bản tóm tắt</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleRegenerate}
                    style={styles.regenBtn}
                  >
                    <Text style={styles.regenText}>
                      {regenerating ? 'Đang tạo…' : 'Tạo lại'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Text style={styles.hint}>
                Bản tóm tắt chỉ vào ghi chú khi bạn bấm "Dùng bản tóm tắt".
              </Text>
            </RevealView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  appHead: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveBtn: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    letterSpacing: ls(14, -0.03),
    color: '#000000',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  avatarLg: {
    width: 64,
    height: 64,
    backgroundColor: colors.s3,
  },
  seg2: {
    marginTop: 20,
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  segTab: {
    flex: 1,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segTabOn: {
    backgroundColor: colors.glassHi,
    borderWidth: 1,
    borderColor: colors.glassLine,
  },
  segText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13.5,
    color: colors.fg3,
  },
  segTextOn: {
    color: colors.fg,
  },
  notesBox: {
    marginTop: 12,
    minHeight: 120,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  notesLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11.5,
    color: colors.fg3,
    marginBottom: 4,
  },
  notesInput: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: ls(15, -0.015),
    color: colors.fg,
    padding: 0,
    textAlignVertical: 'top',
  },
  aiCard: {
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  aiText: {
    fontFamily: fontFamily.medium,
    fontSize: 13.5,
    lineHeight: 20,
    letterSpacing: ls(13.5, -0.01),
    color: colors.fg,
  },
  aiActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  useSummaryBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  useSummaryText: {
    fontFamily: fontFamily.bold,
    fontSize: 13.5,
    color: '#000000',
  },
  regenBtn: {
    height: 40,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  regenText: {
    fontFamily: fontFamily.bold,
    fontSize: 13.5,
    color: colors.fg2,
  },
  hint: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.fg3,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
});