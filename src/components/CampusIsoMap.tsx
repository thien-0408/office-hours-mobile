import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Image as SvgImage,
  Polygon,
  Polyline,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import {
  CAMPUS_BOUNDARY_XZ,
  CAMPUS_BUILDINGS,
  CAMPUS_WALKWAYS,
  normalizeBuildingCode,
  XZPoint,
} from '../data/campusData';
import { fontFamily } from '../theme/tokens';

export interface MapPinItem {
  id: string;
  x: number;
  z: number;
  floor?: number;
  avatarUrl: string;
  label?: string;
  solid?: boolean;
  dashed?: boolean;
  accuracyRadius?: number;
  lift?: number;
}

export interface MapRouteLine {
  pts: XZPoint[];
  dashed?: boolean;
  width?: number;
}

interface CampusIsoMapProps {
  center?: XZPoint;
  scale?: number;
  anchor?: [number, number];
  highlight?: { code: string; floor: number };
  buildingCounts?: Record<string, number>;
  lines?: MapRouteLine[];
  pins?: MapPinItem[];
  showLabels?: boolean;
}

const COS30 = 0.866;
const SIN30 = 0.5;
const FLOOR_H = 9.5;

export function CampusIsoMap({
  center = [58, 132],
  scale = 1.15,
  anchor = [188, 330],
  highlight,
  buildingCounts,
  lines = [],
  pins = [],
  showLabels = true,
}: CampusIsoMapProps) {
  const iso = (x: number, y: number, z: number): [number, number] => {
    const dx = (x - center[0]) * scale;
    const dz = -(z - center[1]) * scale; // Trục z của EIU hướng Bắc (+z), trên màn hình hướng lên trên
    const dy = y * scale;
    const sx = anchor[0] + (dx - dz) * COS30;
    const sy = anchor[1] + (dx + dz) * SIN30 - dy;
    return [sx, sy];
  };

  const ptsStr = (pts: [number, number][]) =>
    pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

  const hlNorm = highlight ? normalizeBuildingCode(highlight.code) : null;

  // Sắp xếp tòa nhà từ xa tới gần theo trục chiều sâu màn hình (dx + dz)
  const sortedBuildings = [...CAMPUS_BUILDINGS].sort((a, b) => {
    const depthA = a.centerXZ[0] - a.centerXZ[1];
    const depthB = b.centerXZ[0] - b.centerXZ[1];
    return depthA - depthB;
  });

  // Chuẩn hóa map buildingCounts ("8" -> "B8", "11" -> "B11")
  const normCounts: Record<string, number> = {};
  if (buildingCounts) {
    Object.entries(buildingCounts).forEach(([k, v]) => {
      const norm = normalizeBuildingCode(k);
      if (norm) normCounts[norm] = v;
    });
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 375 812">
        <Defs>
          {pins.map((pin) => (
            <ClipPath key={`clip-${pin.id}`} id={`clip-${pin.id}`}>
              <Circle cx={0} cy={0} r={14} />
            </ClipPath>
          ))}
        </Defs>

        {/* Nền tối */}
        <Rect x={0} y={0} width={375} height={812} fill="#060606" />

        {/* Ranh giới khuôn viên EIU (sourceBoundaryWay 225069027) */}
        <Polygon
          points={ptsStr(CAMPUS_BOUNDARY_XZ.map(([x, z]) => iso(x, 0, z)))}
          fill="#0B0B0B"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1.2}
        />

        {/* Mạng lưới lối đi & đường nội khu từ eiu-osm-seed.json */}
        {CAMPUS_WALKWAYS.map((w) => (
          <Polyline
            key={`way-${w.id}`}
            points={ptsStr(w.pts.map(([x, z]) => iso(x, 0.2, z)))}
            fill="none"
            stroke={
              w.type === 'footway'
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(255,255,255,0.11)'
            }
            strokeWidth={w.type === 'footway' ? 1.5 : 3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Đùn khối 2.5D từng tòa nhà theo từng tầng */}
        {sortedBuildings.map((b) => {
          const count = normCounts[b.code] ?? 0;
          const isCountActive = count > 0;
          const ring = b.outlineXZ;

          return (
            <G key={b.id}>
              {Array.from({ length: b.floors }, (_, fIdx) => {
                const floorNum = fIdx + 1;
                const y0 = fIdx * FLOOR_H;
                const y1 = floorNum * FLOOR_H;
                const isHl = hlNorm === b.code && highlight?.floor === floorNum;
                const isTopFloor = floorNum === b.floors;

                const topPts = ring.map(([x, z]) => iso(x, y1, z));
                const botPts = ring.map(([x, z]) => iso(x, y0, z));

                const roofFill = isHl
                  ? '#F4F4F4'
                  : isTopFloor && isCountActive
                    ? `rgba(255,255,255,${Math.min(0.85, 0.16 + count * 0.055)})`
                    : '#1B1B1B';

                const wallFill = isHl ? '#C8C8C8' : '#121212';
                const strokeCol = isHl
                  ? 'rgba(255,255,255,0.55)'
                  : 'rgba(255,255,255,0.09)';

                return (
                  <G key={`${b.id}-f${floorNum}`}>
                    {/* Các mặt đứng xung quanh đa giác */}
                    {ring.slice(0, -1).map((_, edgeIdx) => {
                      const pA = topPts[edgeIdx];
                      const pB = topPts[edgeIdx + 1];
                      const pC = botPts[edgeIdx + 1];
                      const pD = botPts[edgeIdx];
                      return (
                        <Polygon
                          key={`wall-${edgeIdx}`}
                          points={ptsStr([pA, pB, pC, pD])}
                          fill={wallFill}
                          stroke={strokeCol}
                          strokeWidth={0.6}
                        />
                      );
                    })}

                    {/* Sàn / Mái tầng */}
                    <Polygon
                      points={ptsStr(topPts)}
                      fill={roofFill}
                      stroke={strokeCol}
                      strokeWidth={0.8}
                    />
                  </G>
                );
              })}

              {/* Nhãn Block trên mái */}
              {showLabels && (() => {
                const labelPos = iso(
                  b.centerXZ[0],
                  b.floors * FLOOR_H + 5,
                  b.centerXZ[1],
                );
                return (
                  <SvgText
                    x={labelPos[0]}
                    y={labelPos[1]}
                    fill={
                      hlNorm === b.code || isCountActive
                        ? '#FFFFFF'
                        : 'rgba(255,255,255,0.48)'
                    }
                    fontSize={10.5}
                    fontFamily={fontFamily.bold}
                    textAnchor="middle"
                  >
                    {isCountActive ? `${b.shortTag} · ${count}` : b.shortTag}
                  </SvgText>
                );
              })()}
            </G>
          );
        })}

        {/* Đường dẫn nét chấm ngoài trời tới cửa block */}
        {lines.map((line, idx) => {
          const mapped = line.pts.map(([x, z]) => iso(x, 1, z));
          return (
            <Polyline
              key={`route-${idx}`}
              points={ptsStr(mapped)}
              fill="none"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={line.width ?? 3}
              strokeDasharray={line.dashed ? '5,5' : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {/* Pins ảnh đại diện tròn viền trắng */}
        {pins.map((pin) => {
          const yHeight =
            (pin.floor ? (pin.floor - 0.5) * FLOOR_H : 2) +
            (pin.lift ?? 0) * 0.22;
          const [px, py] = iso(pin.x, yHeight, pin.z);

          return (
            <G key={pin.id} transform={`translate(${px}, ${py})`}>
              {pin.accuracyRadius && (
                <Circle
                  cx={0}
                  cy={0}
                  r={pin.accuracyRadius * 2}
                  fill="rgba(255,255,255,0.08)"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth={1}
                />
              )}

              <Circle
                cx={0}
                cy={0}
                r={16}
                fill="#111111"
                stroke="#FFFFFF"
                strokeWidth={2}
              />
              <SvgImage
                x={-14}
                y={-14}
                width={28}
                height={28}
                href={{ uri: pin.avatarUrl }}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#clip-${pin.id})`}
              />

              {pin.label && (
                <G transform="translate(0, 22)">
                  <Rect
                    x={-44}
                    y={0}
                    width={88}
                    height={20}
                    rx={10}
                    fill={pin.solid ? '#FFFFFF' : 'rgba(18,18,18,0.92)'}
                    stroke={
                      pin.solid
                        ? 'transparent'
                        : pin.dashed
                          ? 'rgba(255,255,255,0.55)'
                          : 'rgba(255,255,255,0.2)'
                    }
                    strokeWidth={1}
                    strokeDasharray={pin.dashed ? '3,3' : undefined}
                  />
                  <SvgText
                    x={0}
                    y={13.5}
                    fill={pin.solid ? '#000000' : '#FFFFFF'}
                    fontSize={10.5}
                    fontFamily={fontFamily.bold}
                    textAnchor="middle"
                  >
                    {pin.label}
                  </SvgText>
                </G>
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}