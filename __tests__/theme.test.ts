import {
  colors,
  glass,
  glow,
  tintPairs,
  radius,
  size,
  space,
  iconOpacity,
  springs,
  press3D,
  fonts,
  ls,
  tracking,
  text,
} from '../src/theme';

describe('theme tokens', () => {
  test('ls(24, -0.04) === -0.96', () => {
    expect(ls(24, -0.04)).toBe(-0.96);
  });

  test('damping of springs.press equals 2 * Math.sqrt(420)', () => {
    const expectedDamping = 2 * Math.sqrt(420);
    expect(springs.press.damping).toBeCloseTo(expectedDamping, 5);
  });

  test('all colors in colors are valid hex or rgba strings', () => {
    const hexOrRgbaRegex =
      /^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(?:0|1|0?\.\d+)\s*\))$/;
    for (const value of Object.values(colors)) {
      expect(typeof value).toBe('string');
      expect(hexOrRgbaRegex.test(value)).toBe(true);
    }
  });

  test('text.hero.fontSize === 34', () => {
    expect(text.hero.fontSize).toBe(34);
  });

  test('press3D properties match specifications', () => {
    expect(press3D.maxTilt).toBe(4);
    expect(press3D.pressedScale).toBe(0.97);
  });

  test('typography styles use fontFamily and omit fontWeight', () => {
    for (const style of Object.values(text)) {
      expect(style.fontFamily).toBeDefined();
      expect((style as Record<string, unknown>).fontWeight).toBeUndefined();
    }
  });

  test('glass and glow tokens match specifications', () => {
    expect(glass.tint).toBe('rgba(19,19,19,0.78)');
    expect(glass.outline).toBe('rgba(255,255,255,0.05)');
    expect(glass.highlight).toBe('rgba(255,255,255,0.10)');
    expect(glass.solid).toBe('rgba(19,19,19,0.94)');
    expect(glass.blurHigh).toBe(24);
    expect(glass.blurLow).toBe(12);
    expect(glass.shadow).toBe('0px 2px 6px 2px rgba(0,0,0,0.12)');
    expect(glow.brand.color).toBe('#3465e0');
    expect(glow.brand.opacity).toBe(0.34);
    expect(glow.indigo.color).toBe('#4b47a0');
    expect(glow.teal.color).toBe('#2f6b52');
    expect(glow.wine.color).toBe('#7a3349');
  });

  test('tintPairs contains 4 pairs', () => {
    expect(tintPairs).toHaveLength(4);
    for (const pair of tintPairs) {
      expect(pair).toHaveLength(2);
    }
  });

  test('radius tokens match specifications', () => {
    expect(radius.sm).toBe(12);
    expect(radius.md).toBe(14);
    expect(radius.lg).toBe(18);
    expect(radius.card).toBe(20);
    expect(radius.sheet).toBe(26);
    expect(radius.pill).toBe(999);
  });

  test('size tokens match specifications', () => {
    expect(size.button).toBe(54);
    expect(size.buttonQuiet).toBe(44);
    expect(size.field).toBe(58);
    expect(size.iconButton).toBe(40);
    expect(size.avatar).toBe(40);
    expect(size.listRow).toBe(66);
    expect(size.rowImage).toBe(48);
    expect(size.navBar).toBe(64);
    expect(size.topNav).toBe(52);
  });

  test('space tokens match specifications', () => {
    expect(space.xs).toBe(4);
    expect(space.sm).toBe(8);
    expect(space.md).toBe(12);
    expect(space.lg).toBe(16);
    expect(space.xl).toBe(20);
    expect(space.xxl).toBe(24);
    expect(space.xxxl).toBe(32);
    expect(space.gutter).toBe(22);
  });

  test('iconOpacity tokens match specifications', () => {
    expect(iconOpacity.active).toBe(1);
    expect(iconOpacity.normal).toBe(0.62);
    expect(iconOpacity.muted).toBe(0.38);
  });

  test('fonts mapping matches @expo-google-fonts/inter naming', () => {
    expect(fonts.medium).toBe('Inter_500Medium');
    expect(fonts.semibold).toBe('Inter_600SemiBold');
    expect(fonts.bold).toBe('Inter_700Bold');
    expect(fonts.extrabold).toBe('Inter_800ExtraBold');
  });

  test('tracking tokens are defined', () => {
    expect(tracking.display).toBe(-0.04);
    expect(tracking.title).toBe(-0.03);
    expect(tracking.body).toBe(0);
  });

  test('typography has all 11 required variants with valid colors and fonts', () => {
    const requiredVariants: (keyof typeof text)[] = [
      'hero',
      't1',
      't2',
      't3',
      'sub',
      'sm',
      'xs',
      'eyebrow',
      'button',
      'fieldLabel',
      'fieldValue',
    ];
    for (const variant of requiredVariants) {
      expect(text[variant]).toBeDefined();
      expect(typeof text[variant].fontSize).toBe('number');
      expect(typeof text[variant].fontFamily).toBe('string');
      expect(typeof text[variant].color).toBe('string');
    }
  });
});
