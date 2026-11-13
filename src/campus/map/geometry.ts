import { ExtrudeGeometry, ShapeGeometry, Shape } from 'three';
import type { XZ } from '../campusData';
import { outlineToShapePoints } from './mapMath';

function toShape(outline: readonly XZ[]): Shape | null {
  const pts = outlineToShapePoints(outline);
  if (pts.length < 3) {
    return null;
  }
  const shape = new Shape();
  shape.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    shape.lineTo(pts[i].x, pts[i].y);
  }
  shape.closePath();
  return shape;
}

/**
 * Prism of an outline between heights y0..y1 (metres), already in world space
 * (shape y = campus z, rotated -90deg about X so it lands on world -Z).
 */
export function createPrismGeometry(
  outline: readonly XZ[],
  y0: number,
  y1: number,
): ExtrudeGeometry | null {
  const shape = toShape(outline);
  if (!shape || y1 <= y0) {
    return null;
  }
  const geometry = new ExtrudeGeometry(shape, {
    depth: y1 - y0,
    bevelEnabled: false,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, y0, 0);
  return geometry;
}

/** Flat ground polygon (campus boundary) at y = 0. */
export function createGroundGeometry(
  outline: readonly XZ[],
): ShapeGeometry | null {
  const shape = toShape(outline);
  if (!shape) {
    return null;
  }
  const geometry = new ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}
