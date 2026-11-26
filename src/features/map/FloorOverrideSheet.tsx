import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PillButton } from '../../components/AuthPrimitives';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../../theme/tokens';

interface FloorOverrideSheetProps {
  visible: boolean;
  buildingName?: string;
  baroEstimatedFloor?: number;
  initialSelectedFloor?: number;
  peerShortName?: string;
  onClose: () => void;
  onSaveFloor: (floor: number) => void;
  onResetToEstimated: () => void;
}

export function FloorOverrideSheet({
  visible,
  buildingName = 'Block 11',
  baroEstimatedFloor = 2,
  initialSelectedFloor = 3,
  peerShortName = 'TS. Khoa',
  onClose,
  onSaveFloor,
  onResetToEstimated,
}: FloorOverrideSheetProps) {
  const [selectedFloor, setSelectedFloor] = useState(initialSelectedFloor);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.sheet, squircle(radius.sheet)]}>
          <View style={styles.grab} />

          <Text style={typography.h2}>Bạn đang ở tầng mấy?</Text>
          <Text style={[typography.sm, { marginTop: 8 }]}>
            Barometer đoán bạn ở tầng {baroEstimatedFloor} của {buildingName}. Chọn tay sẽ được giữ cho tới khi bạn ra khỏi block.
          </Text>

          {/* 4 ô số to */}
          <View style={styles.floorGrid}>
            {[1, 2, 3, 4].map((fl) => {
              const isOn = fl === selectedFloor;
              const isEstimated = fl === baroEstimatedFloor;
              return (
                <Pressable
                  key={fl}
                  onPress={() => setSelectedFloor(fl)}
                  style={[
                    styles.floorCell,
                    squircle(radius.lg),
                    isOn && styles.floorCellOn,
                  ]}
                >
                  <Text
                    style={[
                      styles.floorBigNum,
                      isOn && { color: '#000000' },
                    ]}
                  >
                    {fl}
                  </Text>
                  {isEstimated && (
                    <Text
                      style={[
                        styles.estTag,
                        isOn && { color: 'rgba(0,0,0,0.6)' },
                      ]}
                    >
                      đoán
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.noteBox, squircle(radius.lg)]}>
            <Text style={styles.noteText}>
              {peerShortName} sẽ thấy:{' '}
              <Text style={styles.noteBold}>
                {buildingName} · tầng {selectedFloor} (tự chọn)
              </Text>
            </Text>
          </View>

          <PillButton
            title={`Lưu tầng ${selectedFloor}`}
            onPress={() => {
              onSaveFloor(selectedFloor);
              onClose();
            }}
            style={{ marginTop: 20 }}
          />
          <PillButton
            title="Dùng lại tầng ước lượng"
            variant="quiet"
            onPress={() => {
              onResetToEstimated();
              onClose();
            }}
            style={{ marginTop: 4 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: 30,
  },
  grab: {
    width: 40,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.fg4,
    alignSelf: 'center',
    marginBottom: 18,
  },
  floorGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  floorCell: {
    flex: 1,
    height: 68,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floorCellOn: {
    backgroundColor: colors.fg,
    borderWidth: 0,
  },
  floorBigNum: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    letterSpacing: ls(22, -0.04),
    fontVariant: ['tabular-nums'],
    color: colors.fg,
  },
  estTag: {
    fontFamily: fontFamily.medium,
    fontSize: 10.5,
    color: colors.fg3,
    marginTop: 1,
  },
  noteBox: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
  },
  noteText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.fg2,
  },
  noteBold: {
    fontFamily: fontFamily.bold,
    color: colors.fg,
  },
});