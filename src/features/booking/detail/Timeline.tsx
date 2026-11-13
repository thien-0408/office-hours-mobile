import { StyleSheet, Text, View } from 'react-native';
import { StatusGlyph, statusGlyph } from '../../../components';
import { colors, fonts, ls } from '../../../theme';
import type { BookingTimelineEvent } from '../../../api/domainTypes';
import { formatVnDayMonth, formatVnTime } from '../../../api/time';
import { TIMELINE_LABEL } from './bookingLogic';

const GLYPH_STATUS: Record<string, string> = {
  CREATED: 'PENDING',
  RESCHEDULED: 'PENDING',
};

/** `.tline`: vertical, text-only events, newest first, Vietnam time. */
export function Timeline({ events }: { events: BookingTimelineEvent[] }) {
  // API returns oldest first; the mock shows the latest at the top.
  const ordered = [...events].reverse();
  return (
    <View style={styles.list}>
      {ordered.map(e => {
        const g = statusGlyph(GLYPH_STATUS[e.type] ?? e.type);
        return (
          <View key={e.id} style={styles.event}>
            <StatusGlyph kind={g.kind} size={18} opacity={g.opacity} />
            <View style={styles.main}>
              <Text style={styles.label}>
                {TIMELINE_LABEL[e.type] ?? e.label}
              </Text>
              {e.note ? <Text style={styles.note}>{e.note}</Text> : null}
            </View>
            <Text style={styles.time}>
              {formatVnDayMonth(e.at)} {formatVnTime(e.at)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 14 },
  event: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  main: { flex: 1, minWidth: 0 },
  label: {
    fontSize: 14,
    fontFamily: fonts.medium,
    letterSpacing: ls(14, -0.02),
    color: colors.fg,
  },
  note: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.fg3,
  },
  time: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.fg3,
    fontVariant: ['tabular-nums'],
  },
});
