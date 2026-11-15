import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { AdminUser } from '../../../api/domainTypes';
import { ERR } from '../../../api/errorCodes';
import { ApiError } from '../../../api/errors';
import {
  useDeactivateUser,
  useUpdateAdminUser,
} from '../../../api/hooks/campusAdmin';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { DepartmentPicker } from '../../../components/DepartmentPicker';
import { Seg, type SegOption } from '../../../components/Seg';
import { Sheet, useSheetItem } from '../../../components/motion';
import { colors, fonts, ls, space } from '../../../theme';
import { canDeleteUser } from './userAdminLogic';

const ROLE_OPTIONS: SegOption[] = [
  { value: 'STUDENT', label: 'Sinh viên' },
  { value: 'LECTURER', label: 'Giảng viên' },
  { value: 'ADMIN', label: 'Admin' },
];

export interface UserEditSheetProps {
  user: AdminUser | null;
  currentUserId: string | null | undefined;
  visible: boolean;
  onClose: () => void;
}

export function UserEditSheet({
  user: userProp,
  currentUserId,
  visible,
  onClose,
}: UserEditSheetProps) {
  // Keeps the user on screen while the sheet slides away after close.
  const user = useSheetItem(userProp);
  const updateMutation = useUpdateAdminUser();
  const deactivateMutation = useDeactivateUser();

  const [role, setRole] = useState<'STUDENT' | 'LECTURER' | 'ADMIN'>('STUDENT');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setDepartment(user.department ?? '');
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const isSelf = !canDeleteUser(user.id, currentUserId);

  const handleSave = () => {
    const trimmedDept = department.trim();
    updateMutation.mutate(
      {
        id: user.id,
        payload: {
          role,
          department: trimmedDept.length > 0 ? trimmedDept : null,
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (err: unknown) => {
          if (err instanceof ApiError) {
            if (err.is(400, ERR.CANNOT_MODIFY_SELF)) {
              Alert.alert(
                'Không thể sửa',
                'Không thể tự thay đổi thông tin quản trị của chính mình.',
              );
              return;
            }
            if (err.is(409, ERR.LAST_ADMIN_REQUIRED)) {
              Alert.alert(
                'Không thể sửa',
                'Hệ thống phải có ít nhất một quản trị viên.',
              );
              return;
            }
          }
          Alert.alert('Lỗi', 'Không thể cập nhật người dùng. Vui lòng thử lại.');
        },
      },
    );
  };

  const handleDelete = () => {
    if (isSelf) {
      Alert.alert('Không thể xóa', 'Bạn không thể xóa tài khoản của chính mình.');
      return;
    }

    Alert.alert(
      'Xóa người dùng',
      `Bạn có chắc chắn muốn xóa/khóa tài khoản "${user.fullName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            deactivateMutation.mutate(user.id, {
              onSuccess: () => {
                onClose();
              },
              onError: (err: unknown) => {
                if (err instanceof ApiError) {
                  if (err.is(400, ERR.CANNOT_MODIFY_SELF)) {
                    Alert.alert('Lỗi', 'Không thể tự xóa tài khoản của chính mình.');
                    return;
                  }
                  if (err.is(409, ERR.LAST_ADMIN_REQUIRED)) {
                    Alert.alert(
                      'Lỗi',
                      'Không thể xóa quản trị viên duy nhất còn lại trong hệ thống.',
                    );
                    return;
                  }
                }
                Alert.alert('Lỗi', 'Không thể xóa người dùng. Vui lòng thử lại.');
              },
            });
          },
        },
      ],
    );
  };

  const isBusy = updateMutation.isPending || deactivateMutation.isPending;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      dismissable={!isBusy}
      backdropLabel="Đóng bảng chỉnh sửa"
      style={styles.sheetContainer}
      header={
        <View style={styles.userHeader}>
          <Avatar id={user.id} size={50} shape="round" />
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.fullName}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
        </View>
      }
    >
      <View style={styles.formGroup}>
        <Text style={styles.fieldLabel}>Vai trò</Text>
        <Seg
          options={ROLE_OPTIONS}
          value={role}
          onChange={val => setRole(val as 'STUDENT' | 'LECTURER' | 'ADMIN')}
        />
      </View>

      <View style={styles.formGroup}>
        <DepartmentPicker
          label="Khoa"
          value={department}
          onChange={code => setDepartment(code ?? '')}
        />
      </View>

      <View style={styles.actionButtons}>
        <Button
          variant="primary"
          title="Lưu thay đổi"
          loading={updateMutation.isPending}
          disabled={isBusy}
          onPress={handleSave}
        />

        {!isSelf ? (
          <Button
            variant="quiet"
            title="Xóa người dùng"
            loading={deactivateMutation.isPending}
            disabled={isBusy}
            onPress={handleDelete}
            textStyle={styles.deleteButtonText}
          />
        ) : (
          <Text style={styles.selfNotice}>
            Tài khoản của bạn (không thể xóa chính mình)
          </Text>
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sheetContainer: { gap: space.lg },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingBottom: space.xs,
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.fg,
    letterSpacing: ls(18, -0.02),
  },
  userEmail: {
    fontSize: 13.5,
    fontFamily: fonts.medium,
    color: colors.fg2,
  },
  formGroup: {
    gap: space.xs,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.fg3,
    letterSpacing: ls(12, -0.01),
  },
  actionButtons: {
    gap: space.sm,
    marginTop: space.xs,
  },
  deleteButtonText: {
    color: colors.err,
  },
  selfNotice: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.fg3,
    paddingVertical: space.xs,
  },
});
