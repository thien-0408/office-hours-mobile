import { StyleSheet, View } from 'react-native';
import { AppText, StatusGlyph } from '../../components';
import { colors } from '../../theme';
import { passwordHint, passwordRules, passwordStrength } from './validators';

/** Segmented strength meter + hint (Register, mock 2). */
export function PasswordMeter({ password }: { password: string }) {
  const score = passwordStrength(password);
  return (
    <View>
      <View style={styles.meter} accessibilityLabel={`Độ mạnh ${score}/4`}>
        {[1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[styles.seg, i <= score && styles.segOn]}
          />
        ))}
      </View>
      <AppText variant="xs" style={styles.hint}>
        {passwordHint(password)}
      </AppText>
    </View>
  );
}

/**
 * Rules list (mock 4): empty ring becomes a solid white glyph when met.
 * Pass `confirm` to include the "match" rule.
 */
export function PasswordRules({
  password,
  confirm,
  showMeter = false,
}: {
  password: string;
  confirm?: string;
  showMeter?: boolean;
}) {
  const rules = passwordRules(password, confirm);
  return (
    <View style={styles.rules}>
      {showMeter ? <PasswordMeter password={password} /> : null}
      {rules.map(r => (
        <View key={r.id} style={styles.rule} accessible accessibilityLabel={`${r.label}${r.ok ? ', đã đạt' : ''}`}>
          {r.ok ? (
            <StatusGlyph kind="ok" size={18} />
          ) : (
            <View style={styles.ring} />
          )}
          <AppText variant="sm" color={r.ok ? colors.fg : colors.fg3}>
            {r.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  meter: { flexDirection: 'row', gap: 6, marginTop: 10 },
  seg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.fg4,
  },
  segOn: { backgroundColor: colors.fg },
  hint: { marginTop: 8 },
  rules: { marginTop: 14, gap: 10 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ring: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.fg4,
  },
});
