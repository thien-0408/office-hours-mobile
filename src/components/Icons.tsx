import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { colors } from '../theme/tokens';

/** Logo "oh" — vòng thời gian còn hở một khe + chữ h */
export function OhLogo({
  size = 24,
  color = colors.fg,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <G
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="M58.67 63.48A22 22 0 1 1 38 49" />
        <Path d="M74 27V93" />
        <Path d="M74 63A14 14 0 0 1 102 63V93" />
      </G>
    </Svg>
  );
}

/** Icon nét đơn sắc (Lucide) */
export type MonoIconName =
  | 'left'
  | 'right'
  | 'down'
  | 'arrow'
  | 'x'
  | 'check'
  | 'eye'
  | 'eyeoff'
  | 'globe'
  | 'message'
  | 'grad'
  | 'teach'
  | 'calendar'
  | 'search'
  | 'home'
  | 'map'
  | 'user'
  | 'users'
  | 'bell'
  | 'inbox'
  | 'more'
  | 'plus'
  | 'image'
  | 'flash'
  | 'send'
  | 'locate';

export function MonoIcon({
  name,
  size = 20,
  color = colors.fg,
  strokeWidth = 1.9,
}: {
  name: MonoIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === 'left' && <Path d="m15 6-6 6 6 6" />}
      {name === 'right' && <Path d="m9 6 6 6-6 6" />}
      {name === 'down' && <Path d="m6 9 6 6 6-6" />}
      {name === 'arrow' && <Path d="M5 12h14M13 6l6 6-6 6" />}
      {name === 'x' && <Path d="M6 6l12 12M18 6 6 18" />}
      {name === 'check' && <Path d="M5 12.5 10 17l9-10" />}
      {name === 'eye' && (
        <>
          <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <Circle cx={12} cy={12} r={3} />
        </>
      )}
      {name === 'eyeoff' && (
        <>
          <Path d="M3 3l18 18" />
          <Path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
          <Path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </>
      )}
      {name === 'globe' && (
        <>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </>
      )}
      {name === 'message' && (
        <Path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
      )}
      {name === 'grad' && (
        <>
          <Path d="M2 9l10-5 10 5-10 5z" />
          <Path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
        </>
      )}
      {name === 'teach' && (
        <>
          <Rect x={3} y={4} width={18} height={12} rx={1.5} />
          <Path d="M8 20h8M12 16v4" />
        </>
      )}
      {name === 'home' && (
        <>
          <Path d="M3 10.5 12 3l9 7.5" />
          <Path d="M5 9.5V21h14V9.5" />
          <Path d="M10 21v-6h4v6" />
        </>
      )}
      {name === 'search' && (
        <>
          <Circle cx={11} cy={11} r={7} />
          <Path d="m20 20-3.5-3.5" />
        </>
      )}
      {name === 'calendar' && (
        <>
          <Rect x={3} y={4} width={18} height={18} rx={2} />
          <Path d="M16 2v4M8 2v4M3 10h18" />
        </>
      )}
      {name === 'map' && (
        <>
          <Path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
          <Path d="M9 4v14M15 6v14" />
        </>
      )}
      {name === 'user' && (
        <>
          <Circle cx={12} cy={8} r={4} />
          <Path d="M4 21a8 8 0 0 1 16 0" />
        </>
      )}
      {name === 'users' && (
        <>
          <Circle cx={9} cy={8} r={4} />
          <Path d="M2 21a7 7 0 0 1 14 0" />
          <Path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3" />
        </>
      )}
      {name === 'bell' && (
        <>
          <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </>
      )}
      {name === 'inbox' && (
        <>
          <Path d="M3 13h5l2 3h4l2-3h5" />
          <Path d="M5 5h14l2 8v6H3v-6z" />
        </>
      )}
      {name === 'more' && (
        <>
          <Circle cx={5} cy={12} r={1} fill={color} />
          <Circle cx={12} cy={12} r={1} fill={color} />
          <Circle cx={19} cy={12} r={1} fill={color} />
        </>
      )}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" />}
      {name === 'image' && (
        <>
          <Rect x={3} y={4} width={18} height={16} rx={2} />
          <Circle cx={8.5} cy={9} r={1.5} />
          <Path d="m21 15-5-5-8 8" />
        </>
      )}
      {name === 'flash' && <Path d="M13 2 4 14h7l-1 8 9-12h-7z" />}
      {name === 'send' && <Path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />}
      {name === 'locate' && (
        <>
          <Circle cx={12} cy={12} r={4} />
          <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </>
      )}
    </Svg>
  );
}

/**
 * 8 Glyph trạng thái tròn đặc khoét rỗng (SF Symbols .fill style)
 * Khoét bằng compound path + fillRule="evenodd"
 */
export type GlyphType =
  | 'ok'    // CONFIRMED, FULFILLED
  | 'done'  // COMPLETED
  | 'wait'  // PENDING
  | 'queue' // WAITING
  | 'offer' // OFFERED
  | 'no'    // DECLINED
  | 'off'   // CANCELLED, EXPIRED
  | 'warn'; // NO_SHOW, toast lỗi

const OUTER_CIRCLE = 'M12 1a11 11 0 1 0 0 22 11 11 0 1 0 0-22z';

const GLYPH_CUTOUTS: Record<GlyphType, string> = {
  ok: 'M17.55 8.05a1.2 1.2 0 0 1 0 1.7l-6.3 6.6a1.2 1.2 0 0 1-1.72 0l-3.1-3.1a1.2 1.2 0 1 1 1.7-1.7l2.24 2.24 5.45-5.72a1.2 1.2 0 0 1 1.73-.02z',
  done: 'M14.45 8.85a1.1 1.1 0 0 1 0 1.56l-5.3 5.6a1.1 1.1 0 0 1-1.58 0l-2.7-2.7a1.1 1.1 0 1 1 1.56-1.56l1.91 1.91 4.53-4.8a1.1 1.1 0 0 1 1.58-.01zm4 .1a1.1 1.1 0 0 1 0 1.56l-5.3 5.6a1.1 1.1 0 0 1-1.58 0l-.5-.5a1.1 1.1 0 1 1 1.56-1.56l-.27-.27 4.51-4.82a1.1 1.1 0 0 1 1.58-.01z',
  wait: 'M12 6a1.2 1.2 0 0 1 1.2 1.2v4.3l2.62 1.55a1.2 1.2 0 1 1-1.24 2.06l-3.2-1.9A1.2 1.2 0 0 1 10.8 12.2V7.2A1.2 1.2 0 0 1 12 6z',
  queue: 'M7 9a1.1 1.1 0 0 1 1.1-1.1h7.8a1.1 1.1 0 1 1 0 2.2H8.1A1.1 1.1 0 0 1 7 9zm0 3a1.1 1.1 0 0 1 1.1-1.1h7.8a1.1 1.1 0 1 1 0 2.2H8.1A1.1 1.1 0 0 1 7 12zm0 3a1.1 1.1 0 0 1 1.1-1.1h4.3a1.1 1.1 0 1 1 0 2.2H8.1A1.1 1.1 0 0 1 7 15z',
  offer: 'M10 7.8h5a1.2 1.2 0 0 1 1.2 1.2v5a1.2 1.2 0 1 1-2.4 0v-2.1l-3.95 3.95a1.2 1.2 0 0 1-1.7-1.7L12.1 10.2H10a1.2 1.2 0 1 1 0-2.4z',
  no: 'M7.95 7.95a1.2 1.2 0 0 1 1.7 0L12 10.3l2.35-2.35a1.2 1.2 0 1 1 1.7 1.7L13.7 12l2.35 2.35a1.2 1.2 0 0 1-1.7 1.7L12 13.7l-2.35 2.35a1.2 1.2 0 0 1-1.7-1.7L10.3 12 7.95 9.65a1.2 1.2 0 0 1 0-1.7z',
  off: 'M6.4 12a1.2 1.2 0 0 1 1.2-1.2h8.8a1.2 1.2 0 1 1 0 2.4H7.6A1.2 1.2 0 0 1 6.4 12z',
  warn: 'M12 6a1.2 1.2 0 0 1 1.2 1.2v5.6a1.2 1.2 0 1 1-2.4 0V7.2A1.2 1.2 0 0 1 12 6zm0 9.1a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z',
};

export function StatusGlyph({
  type,
  size = 18,
  color = colors.fg,
}: {
  type: GlyphType;
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={`${OUTER_CIRCLE} ${GLYPH_CUTOUTS[type]}`}
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </Svg>
  );
}

/** Logo Gmail giữ màu gốc #EA4335 */
export function GmailLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#EA4335"
        d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
      />
    </Svg>
  );
}

/** Logo Google Meet giữ màu gốc #00897B */
export function GoogleMeetLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#00897B"
        d="M5.53 2.13 0 7.75h5.53zm.398 0v5.62h7.608v3.65l5.47-4.45c-.014-1.22.031-2.25-.025-3.46-.148-1.09-1.287-1.47-2.236-1.36zM23.1 4.32c-.802.295-1.358.995-2.047 1.49-2.506 2.05-4.982 4.12-7.468 6.19 3.025 2.59 6.04 5.18 9.065 7.76 1.218.671 1.428-.814 1.328-1.64v-13a.828.828 0 0 0-.877-.825zM.038 8.15v7.7h5.53v-7.7zm13.577 8.1H6.008v5.62c3.864-.006 7.737.011 11.58-.009 1.02-.07 1.618-1.12 1.468-2.07v-2.51l-5.47-4.68v3.65zm-13.577 0c.02 1.44-.041 2.88.033 4.31.162.948 1.158 1.43 2.047 1.31h3.464v-5.62z"
      />
    </Svg>
  );
}

/** Logo Zoom giữ màu gốc #0B5CFF */
export function ZoomLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#0B5CFF"
        d="M5.033 14.649H.743a.74.74 0 0 1-.686-.458.74.74 0 0 1 .16-.808L3.19 10.41H1.06A1.06 1.06 0 0 1 0 9.35h3.957c.301 0 .57.18.686.458a.74.74 0 0 1-.161.808L1.51 13.59h2.464c.585 0 1.06.475 1.06 1.06zM24 11.338c0-1.14-.927-2.066-2.066-2.066-.61 0-1.158.265-1.537.686a2.061 2.061 0 0 0-1.536-.686c-1.14 0-2.066.926-2.066 2.066v3.311a1.06 1.06 0 0 0 1.06-1.06v-2.251a1.004 1.004 0 0 1 2.013 0v2.251c0 .586.474 1.06 1.06 1.06v-3.311a1.004 1.004 0 0 1 2.012 0v2.251c0 .586.475 1.06 1.06 1.06zM16.265 12a2.728 2.728 0 1 1-5.457 0 2.728 2.728 0 0 1 5.457 0zm-1.06 0a1.669 1.669 0 1 0-3.338 0 1.669 1.669 0 0 0 3.338 0zm-4.82 0a2.728 2.728 0 1 1-5.458 0 2.728 2.728 0 0 1 5.457 0zm-1.06 0a1.669 1.669 0 1 0-3.338 0 1.669 1.669 0 0 0 3.338 0z"
      />
    </Svg>
  );
}

/** Logo Google Calendar giữ màu gốc #4285F4 */
export function GoogleCalendarLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M18.316 5.684H24v12.632h-5.684V5.684zM5.684 24h12.632v-5.684H5.684V24zM18.316 5.684V0H1.895A1.894 1.894 0 0 0 0 1.895v16.421h5.684V5.684h12.632zm-7.207 6.25v-.065c.272-.144.5-.349.687-.617s.279-.595.279-.982c0-.379-.099-.72-.3-1.025a2.05 2.05 0 0 0-.832-.714 2.703 2.703 0 0 0-1.197-.257c-.6 0-1.094.156-1.481.467-.386.311-.65.671-.793 1.078l1.085.452c.086-.249.224-.461.413-.633.189-.172.445-.257.767-.257.33 0 .602.088.816.264a.86.86 0 0 1 .322.703c0 .33-.12.589-.36.778-.24.19-.535.284-.886.284h-.567v1.085h.633c.407 0 .748.109 1.02.327.272.218.407.499.407.843 0 .336-.129.614-.387.832s-.565.327-.924.327c-.351 0-.651-.103-.897-.311-.248-.208-.422-.502-.521-.881l-1.096.452c.178.616.505 1.082.977 1.401.472.319.984.478 1.538.477a2.84 2.84 0 0 0 1.293-.291c.382-.193.684-.458.902-.794.218-.336.327-.72.327-1.149 0-.429-.115-.797-.344-1.105a2.067 2.067 0 0 0-.881-.689zm2.093-1.931l.602.913L15 10.045v5.744h1.187V8.446h-.827l-2.158 1.557zM22.105 0h-3.289v5.184H24V1.895A1.894 1.894 0 0 0 22.105 0zm-3.289 23.5l4.684-4.684h-4.684V23.5zM0 22.105C0 23.152.848 24 1.895 24h3.289v-5.184H0v3.289z"
      />
    </Svg>
  );
}