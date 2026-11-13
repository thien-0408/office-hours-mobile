import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import type { Lecturer } from '../../../api/domainTypes';
import { Avatar, Icon } from '../../../components';
import { PressableCard } from '../../../components/motion';
import { colors, fonts, ls, radius, size } from '../../../theme';
import { lecturerSubtitle } from '../lecturerLogic';

export type LecturerRowProps = {
  lecturer: Lecturer;
  onPress: (lecturer: Lecturer) => void;
};

/** Vertical list row: 48px photo (memoji fallback), name, department. No leading icon. */
function LecturerRowBase({ lecturer, onPress }: LecturerRowProps) {
  const subtitle = lecturerSubtitle(lecturer);
  return (
    <PressableCard
      onPress={() => onPress(lecturer)}
      style={styles.card}
      accessibilityLabel={`${lecturer.name}${subtitle ? `, ${subtitle}` : ''}`}
    >
      <Avatar
        uri={lecturer.photoUrl}
        id={lecturer.id}
        size={size.rowImage}
        shape="squircle"
      />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {lecturer.name}
        </Text>
        {subtitle ? (
          <Text style={styles.sub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Icon as={ChevronRight} size={18} level="muted" />
    </PressableCard>
  );
}

export const LecturerRow = memo(LecturerRowBase);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    marginBottom: 8,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
  },
  text: { flex: 1, minWidth: 0, gap: 2 },
  name: {
    fontSize: 15,
    fontFamily: fonts.bold,
    letterSpacing: ls(15, -0.03),
    color: colors.fg,
  },
  sub: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    letterSpacing: ls(12.5, -0.01),
    color: colors.fg2,
  },
});
