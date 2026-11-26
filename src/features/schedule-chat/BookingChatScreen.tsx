import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollViewInstance
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { IconButton, RevealView } from '../../components/AuthPrimitives';
import { Glass } from '../../components/Glass';
import { GlowBackground } from '../../components/GlowBackground';
import { MonoIcon } from '../../components/Icons';
import { Pressable3D } from '../../components/Pressable3D';
import {
  colors,
  fontFamily,
  ls,
  radius,
  typography,
} from '../../theme/tokens';

export interface ChatMessageItem {
  id: string;
  sender: 'me' | 'them';
  text: string;
  meta: string; // VD: "13:58" hoặc "13:59 · Đã xem"
}

const SAMPLE_MESSAGES: ChatMessageItem[] = [
  {
    id: 'm1',
    sender: 'them',
    text: 'Em chào thầy, em tới cửa phòng 306.B11 rồi ạ.',
    meta: '13:58',
  },
  {
    id: 'm2',
    sender: 'me',
    text: 'Chờ thầy 2 phút, thầy đang xong buổi trước.',
    meta: '13:59 · Đã xem',
  },
  {
    id: 'm3',
    sender: 'them',
    text: 'Dạ vâng. Em gửi trước bản đề cương mới nhất trong file đính kèm ạ.',
    meta: '14:00',
  },
];

interface BookingChatScreenProps {
  peerName?: string;
  peerFirstName?: string;
  peerAvatarUrl?: string;
  bookingSubtitle?: string; // VD: "14:00 · Đề cương đồ án"
  dateHeader?: string;      // VD: "Thứ Tư 18/11"
  showLecturerActionBar?: boolean;
  isPeerTyping?: boolean;
  initialMessages?: ChatMessageItem[];
  onBack?: () => void;
  onSendMessage?: (text: string) => void;
  onMarkNoShow?: () => void;
  onMarkCompleted?: () => void;
}

export function BookingChatScreen({
  peerName = 'Phạm Ngọc Mai',
  peerFirstName = 'Mai',
  peerAvatarUrl = 'https://i.pravatar.cc/120?img=25',
  bookingSubtitle = '14:00 · Đề cương đồ án',
  dateHeader = 'Thứ Tư 18/11',
  showLecturerActionBar = true,
  isPeerTyping = true,
  initialMessages = SAMPLE_MESSAGES,
  onBack,
  onSendMessage,
  onMarkNoShow,
  onMarkCompleted,
}: BookingChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollViewInstance>(null);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'me',
        text: trimmed,
        meta: `${hh}:${mm}`,
      },
    ]);
    setDraft('');
    onSendMessage?.(trimmed);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  };

  return (
    <View style={styles.root}>
      <GlowBackground tone="teal" position="tl" opacityOverride={0.25} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* AppHead */}
          <View style={styles.appHead}>
            <IconButton icon="left" onPress={onBack} />
            <Image
              source={{ uri: peerAvatarUrl }}
              style={styles.peerAvatar}
              contentFit="cover"
            />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.peerName}>
                {peerName}
              </Text>
              <Text numberOfLines={1} style={typography.xs}>
                {bookingSubtitle}
              </Text>
            </View>
          </View>

          {/* Thanh hành động kính nổi dành cho GV khi tới giờ hẹn */}
          {showLecturerActionBar && (
            <RevealView index={0} style={{ paddingHorizontal: 18 }}>
              <Glass borderRadius={radius.lg} style={styles.actBar}>
                <Text style={[typography.sm, { flex: 1, color: colors.fg }]}>
                  Đã tới giờ hẹn
                </Text>

                <Pressable onPress={onMarkNoShow}>
                  <Glass borderRadius={radius.pill} style={styles.barGhostBtn}>
                    <Text style={styles.barGhostText}>Vắng mặt</Text>
                  </Glass>
                </Pressable>

                <Pressable onPress={onMarkCompleted} style={styles.barLightBtn}>
                  <Text style={styles.barLightText}>Đã gặp</Text>
                </Pressable>
              </Glass>
            </RevealView>
          )}

          {/* Danh sách tin nhắn */}
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.chatScroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sysDate}>{dateHeader}</Text>

            {messages.map((msg) => {
              const isMe = msg.sender === 'me';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.msgGroup,
                    isMe ? styles.alignEnd : styles.alignStart,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.bubbleMe : styles.bubbleThem,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        isMe && { color: '#000000' },
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                  <Text style={styles.metaText}>{msg.meta}</Text>
                </View>
              );
            })}

            {isPeerTyping && <TypingIndicator />}
          </ScrollView>

          {/* Composer kính nổi phía dưới */}
          <View style={styles.composerRow}>
            <Glass borderRadius={radius.pill} style={styles.composerInputWrap}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={`Nhắn cho ${peerFirstName}…`}
                placeholderTextColor={colors.fg3}
                selectionColor={colors.fg}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                style={styles.composerInput}
              />
            </Glass>

            <Pressable3D onPress={handleSend} disabled={!draft.trim()}>
              <View
                style={[
                  styles.sendBtn,
                  !draft.trim() && { backgroundColor: colors.s3 },
                ]}
              >
                <MonoIcon
                  name="send"
                  size={18}
                  color={draft.trim() ? '#000000' : colors.fg3}
                />
              </View>
            </Pressable3D>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={[styles.bubble, styles.bubbleThem, styles.typingBox]}>
      {[0, 1, 2].map((idx) => (
        <TypingDot key={idx} delay={idx * 180} />
      ))}
    </View>
  );
}

function TypingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.typingDot, animStyle]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  appHead: {
    height: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  peerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.s3,
  },
  peerName: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    letterSpacing: ls(15, -0.025),
    color: colors.fg,
  },
  actBar: {
    marginTop: 8,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barGhostBtn: {
    height: 36,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barGhostText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.fg,
  },
  barLightBtn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barLightText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: '#000000',
  },
  chatScroll: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 8,
  },
  sysDate: {
    alignSelf: 'center',
    fontFamily: fontFamily.medium,
    fontSize: 11.5,
    color: colors.fg3,
    marginVertical: 4,
  },
  msgGroup: {
    maxWidth: '78%',
  },
  alignStart: {
    alignSelf: 'flex-start',
  },
  alignEnd: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 20,
  },
  bubbleThem: {
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomLeftRadius: 6,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  bubbleText: {
    fontFamily: fontFamily.medium,
    fontSize: 14.5,
    lineHeight: 20.5,
    letterSpacing: ls(14.5, -0.015),
    color: colors.fg,
  },
  metaText: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    color: colors.fg3,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  typingBox: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 14,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.fg3,
  },
  composerRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  composerInputWrap: {
    flex: 1,
    height: 48,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  composerInput: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: colors.fg,
    padding: 0,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});