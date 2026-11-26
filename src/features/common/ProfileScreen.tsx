import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AppRole,
  NavPill,
  SettingsGroup,
  SettingsRow,
} from '../../components/AppPrimitives';
import { IconButton, RevealView } from '../../components/AuthPrimitives';
import { Glass } from '../../components/Glass';
import { MonoIcon } from '../../components/Icons';
import { Pressable3D } from '../../components/Pressable3D';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../../theme/tokens';

export interface CampusRoomOption {
  id: string;
  label: string; // VD: "306.B11"
  buildingName: string;
}

interface ProfileScreenProps {
  role?: AppRole;
  eyebrow?: string; // VD: "Tiến sĩ · Giảng viên" hoặc "Sinh viên · K12"
  displayName?: string; // VD: "Nguyễn\nMinh Khoa"
  department?: string;
  email?: string;
  photoUrl?: string;
  officeRoom?: string;
  bio?: string;
  rooms?: CampusRoomOption[];
  onBack?: () => void;
  onChangePhoto?: () => void;
  onSelectOfficeRoom?: (room: CampusRoomOption) => void;
  onEditBio?: () => void;
  onSelectTab?: (tab: string) => void;
}

const SAMPLE_ROOMS: CampusRoomOption[] = [
  { id: 'r-306', label: '306.B11', buildingName: 'Block 11 · Tầng 3' },
  { id: 'r-308', label: '308.B11', buildingName: 'Block 11 · Tầng 3' },
  { id: 'r-204', label: '204.B11', buildingName: 'Block 11 · Tầng 2' },
];

export function ProfileScreen({
  role = 'gv',
  eyebrow = 'Tiến sĩ · Giảng viên',
  displayName = 'Nguyễn\nMinh Khoa',
  department = 'Khoa Công nghệ thông tin',
  email = 'khoa.nguyen@eiu.edu.vn',
  photoUrl = 'https://i.pravatar.cc/800?img=11',
  officeRoom = '306.B11',
  bio = 'Hệ phân tán, đồ án',
  rooms = SAMPLE_ROOMS,
  onBack,
  onChangePhoto,
  onSelectOfficeRoom,
  onEditBio,
  onSelectTab,
}: ProfileScreenProps) {
  const [selectedRoom, setSelectedRoom] = useState(officeRoom);
  const [roomModalOpen, setRoomModalOpen] = useState(false);

  return (
    <View style={styles.root}>
      {/* Cover ảnh tràn viền mờ dần xuống đen */}
      <View pointerEvents="none" style={styles.cover}>
        <Image
          source={{ uri: photoUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="top"
        />
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.4)',
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0.45)',
            '#000000',
          ]}
          locations={[0, 0.28, 0.66, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* AppHead */}
          <View style={styles.appHead}>
            {onBack ? <IconButton icon="left" onPress={onBack} /> : <View />}
            <Pressable3D onPress={onChangePhoto}>
              <Glass borderRadius={radius.pill} style={styles.smGlassBtn}>
                <Text style={styles.smGlassText}>Đổi ảnh</Text>
              </Glass>
            </Pressable3D>
          </View>

          <View style={{ height: 220 }} />

          <RevealView index={0}>
            <Text style={typography.eyebrow}>{eyebrow}</Text>
          </RevealView>
          <RevealView index={1}>
            <Text style={[styles.tName, { marginTop: 8 }]}>{displayName}</Text>
          </RevealView>
          <RevealView index={2}>
            <Text style={[typography.sm, { marginTop: 10 }]}>{department}</Text>
          </RevealView>

          <RevealView index={3}>
            <SettingsGroup style={{ marginTop: 20 }}>
              <SettingsRow label="Email" valueText={email} />
              {role === 'gv' && (
                <SettingsRow
                  label="Phòng làm việc"
                  valueText={selectedRoom}
                  showChevron
                  onPress={() => setRoomModalOpen(true)}
                />
              )}
              <SettingsRow
                label="Giới thiệu"
                valueText={bio}
                showChevron
                onPress={onEditBio}
              />
            </SettingsGroup>
          </RevealView>
        </ScrollView>
      </SafeAreaView>

      {/* Modal chọn phòng làm việc (GV) */}
      <Modal
        visible={roomModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRoomModalOpen(false)}
      >
        <Pressable
          style={styles.scrim}
          onPress={() => setRoomModalOpen(false)}
        >
          <View style={[styles.sheet, squircle(radius.sheet)]}>
            <View style={styles.grab} />
            <Text style={[typography.h2, { marginBottom: 12 }]}>
              Phòng làm việc
            </Text>
            {rooms.map((rm) => {
              const isSelected = rm.label === selectedRoom;
              return (
                <Pressable
                  key={rm.id}
                  onPress={() => {
                    setSelectedRoom(rm.label);
                    onSelectOfficeRoom?.(rm);
                    setRoomModalOpen(false);
                  }}
                  style={styles.roomOption}
                >
                  <View>
                    <Text style={typography.body}>{rm.label}</Text>
                    <Text style={typography.xs}>{rm.buildingName}</Text>
                  </View>
                  {isSelected && (
                    <MonoIcon name="check" size={18} color={colors.fg} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      <NavPill role={role} activeTab="me" onSelectTab={onSelectTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 430,
  },
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
  smGlassBtn: {
    height: 42,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smGlassText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    letterSpacing: ls(14, -0.025),
    color: colors.fg,
  },
  tName: {
    fontFamily: fontFamily.bold,
    fontSize: 40,
    lineHeight: 39.2,
    letterSpacing: ls(40, -0.06),
    color: colors.fg,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.64)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: colors.line2,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 34,
  },
  grab: {
    width: 40,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.fg4,
    alignSelf: 'center',
    marginBottom: 18,
  },
  roomOption: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
});