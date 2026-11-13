import { useId } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, G, Mask, Path } from 'react-native-svg';
import { colors } from '../theme';

export type StatusGlyphKind =
  | 'ok'
  | 'done'
  | 'wait'
  | 'queue'
  | 'offer'
  | 'no'
  | 'off'
  | 'warn';

export interface StatusGlyphProps {
  kind: StatusGlyphKind;
  size?: number;
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}

export interface StatusGlyphInfo {
  kind: StatusGlyphKind;
  opacity: number;
}

const STATUS_MAP: Record<string, StatusGlyphInfo> = {
  PENDING: { kind: 'wait', opacity: 0.62 },
  CONFIRMED: { kind: 'ok', opacity: 1 },
  FULFILLED: { kind: 'ok', opacity: 1 },
  COMPLETED: { kind: 'done', opacity: 1 },
  WAITING: { kind: 'queue', opacity: 0.62 },
  OFFERED: { kind: 'offer', opacity: 1 },
  DECLINED: { kind: 'no', opacity: 0.62 },
  CANCELLED: { kind: 'off', opacity: 0.62 },
  CANCELED: { kind: 'off', opacity: 0.62 },
  EXPIRED: { kind: 'off', opacity: 0.62 },
  NO_SHOW: { kind: 'warn', opacity: 1 },
  ERROR: { kind: 'warn', opacity: 1 },
};

/**
 * Maps a backend status string to its respective glyph kind and opacity.
 */
export function statusGlyph(status: string): StatusGlyphInfo {
  const normalized = status ? status.trim().toUpperCase() : '';
  return STATUS_MAP[normalized] ?? { kind: 'wait', opacity: 0.62 };
}

function renderPaths(kind: StatusGlyphKind) {
  switch (kind) {
    case 'ok':
      return <Path d="M7.3 12.3l3.1 3.1 6.3-6.6" />;
    case 'done':
      return (
        <>
          <Path d="M5.6 12.6l2.7 2.7 5.3-5.6" />
          <Path d="M11.8 14.8l.5.5 5.3-5.6" />
        </>
      );
    case 'wait':
      return <Path d="M12 7.2v5l3.2 1.9" />;
    case 'queue':
      return <Path d="M8 9h8M8 12h8M8 15h4.5" />;
    case 'offer':
      return <Path d="M9 15l6-6M10 9h5v5" />;
    case 'no':
      return <Path d="M8.8 8.8l6.4 6.4M15.2 8.8l-6.4 6.4" />;
    case 'off':
      return <Path d="M7.6 12h8.8" />;
    case 'warn':
      return (
        <>
          <Path d="M12 7.2v5.6" />
          <Path d="M12 16.4v.1" />
        </>
      );
    default:
      return null;
  }
}

export function StatusGlyph({
  kind,
  size = 16,
  color = colors.fg,
  opacity = 1,
  style,
}: StatusGlyphProps) {
  const reactId = useId();
  const maskId = `status-mask-${kind}-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style}
      accessibilityRole="image"
    >
      <Defs>
        <Mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="24"
          height="24"
        >
          <Circle cx="12" cy="12" r="11" fill="#FFFFFF" />
          <G
            fill="none"
            stroke="#000000"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {renderPaths(kind)}
          </G>
        </Mask>
      </Defs>
      <Circle
        cx="12"
        cy="12"
        r="11"
        fill={color}
        opacity={opacity}
        mask={`url(#${maskId})`}
      />
    </Svg>
  );
}
