import { colors, fonts, ls, springs, text } from '../src/theme';

describe('theme', () => {
  test('ls converts em to pt', () => {
    expect(ls(24, -0.04)).toBeCloseTo(-0.96, 10);
  });

  test('spring converts dampingRatio to Reanimated damping', () => {
    expect(springs.press.damping).toBeCloseTo(2 * Math.sqrt(520), 5);
    expect(springs.indicator.damping).toBeCloseTo(0.92 * 2 * Math.sqrt(280), 5);
  });

  test('every color is a valid hex or rgba string', () => {
    const re =
      /^(#[0-9a-fA-F]{6}|rgba\(\d{1,3},\d{1,3},\d{1,3},(0|1|0?\.\d+)\))$/;
    for (const value of Object.values(colors)) {
      expect(value).toMatch(re);
    }
  });

  test('text styles pick weight via fontFamily, never fontWeight', () => {
    const families = Object.values(fonts) as string[];
    for (const style of Object.values(text)) {
      expect(families).toContain(style.fontFamily);
      expect(style).not.toHaveProperty('fontWeight');
    }
  });

  test('body text keeps light tracking so Vietnamese diacritics do not collide', () => {
    for (const key of ['sub', 'sm', 'fieldValue'] as const) {
      const em = text[key].letterSpacing / text[key].fontSize;
      expect(em).toBeGreaterThanOrEqual(-0.02);
    }
  });
});
