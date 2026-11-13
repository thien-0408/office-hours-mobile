import React, { useState } from 'react';
import {
  Alert,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { AppText, Button } from '../../../components';
import { useCompleteBooking, useMarkNoShow } from '../../../api/hooks/bookings';
import { bookingErrorMessage } from '../detail/bookingLogic';
import { useAppSession } from '../../../navigation/devSession';
import type { Booking } from '../../../api/domainTypes';
import type { UserRole } from '../../../api/types';
import { colors, space } from '../../../theme';
import { canConfirmAttendance } from '../attendanceLogic';

export interface AttendanceActionsProps {
  booking: Booking | null | undefined;
  role?: UserRole | null;
  now?: number;
  variant?: 'row' | 'bar';
  style?: StyleProp<ViewStyle>;
  onSuccess?: (action: 'complete' | 'noShow') => void;
}

export function AttendanceActions({
  booking,
  role,
  now,
  variant = 'row',
  style,
  onSuccess,
}: AttendanceActionsProps) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const session = useAppSession();
  const effectiveRole = role !== undefined ? role : session.role;
  const effectiveNow = now ?? Date.now();

  const [error, setError] = useState<unknown>(null);
  const complete = useCompleteBooking();
  const noShow = useMarkNoShow();

  if (!canConfirmAttendance(booking, effectiveRole, effectiveNow) || !booking) {
    return null;
  }

  const isBusy = complete.isPending || noShow.isPending;

  const handleComplete = () => {
    if (isBusy) {
      return;
    }
    setError(null);
    complete.mutate(booking.id, {
      onSuccess: () => {
        onSuccess?.('complete');
        navigation.navigate('MeetingRecord', { bookingId: booking.id });
      },
      onError: e => {
        setError(e);
      },
    });
  };

  const handleNoShow = () => {
    if (isBusy) {
      return;
    }
    Alert.alert(
      'Xác nhận vắng mặt?',
      'Sinh viên sẽ bị ghi nhận vắng mặt trong buổi hẹn này.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Vắng mặt',
          style: 'destructive',
          onPress: () => {
            setError(null);
            noShow.mutate(booking.id, {
              onSuccess: () => {
                onSuccess?.('noShow');
              },
              onError: e => {
                setError(e);
              },
            });
          },
        },
      ],
    );
  };

  if (variant === 'bar') {
    return (
      <View style={[styles.barContainer, style]}>
        {error ? (
          <AppText
            variant="xs"
            color={colors.err}
            style={styles.error}
            accessibilityRole="alert"
          >
            {bookingErrorMessage(error)}
          </AppText>
        ) : null}
        <View style={styles.barRow}>
          <Button
            variant="quiet"
            title="Vắng mặt"
            disabled={isBusy}
            loading={noShow.isPending}
            onPress={handleNoShow}
            style={[styles.grow, styles.barBtn]}
          />
          <Button
            variant="primary"
            title="Đã gặp"
            disabled={isBusy}
            loading={complete.isPending}
            onPress={handleComplete}
            style={[styles.grow, styles.barBtn]}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.rowContainer, style]}>
      {error ? (
        <AppText
          variant="sm"
          color={colors.err}
          style={styles.error}
          accessibilityRole="alert"
        >
          {bookingErrorMessage(error)}
        </AppText>
      ) : null}
      <View style={styles.row}>
        <Button
          variant="quiet"
          title="Vắng mặt"
          disabled={isBusy}
          loading={noShow.isPending}
          onPress={handleNoShow}
          style={styles.grow}
        />
        <Button
          variant="primary"
          title="Đã gặp"
          disabled={isBusy}
          loading={complete.isPending}
          onPress={handleComplete}
          style={styles.grow}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    gap: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  grow: {
    flex: 1,
  },
  barContainer: {
    backgroundColor: colors.s1,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: space.gutter,
    paddingVertical: space.xs,
    gap: space.xs,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  barBtn: {
    height: 38,
    paddingHorizontal: space.md,
  },
  error: {
    textAlign: 'center',
  },
});
