/* eslint-disable no-bitwise -- UTF-8 byte math */
// @stomp/stompjs encodes and decodes frames with the global TextEncoder/TextDecoder.
// Hermes in React Native 0.88 (Hermes v1) ships both, so this only installs a tiny UTF-8
// fallback when they are missing (older engine, odd test runtime). No extra dependency.

export function utf8Encode(input: string): Uint8Array {
  const out: number[] = [];
  for (const ch of input) {
    const cp = ch.codePointAt(0) as number;
    if (cp < 0x80) {
      out.push(cp);
    } else if (cp < 0x800) {
      out.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f));
    } else if (cp < 0x10000) {
      out.push(
        0xe0 | (cp >> 12),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      );
    } else {
      out.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f),
      );
    }
  }
  return Uint8Array.from(out);
}

export function utf8Decode(input: ArrayBuffer | ArrayBufferView): string {
  const b =
    input instanceof ArrayBuffer
      ? new Uint8Array(input)
      : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  let s = '';
  for (let i = 0; i < b.length; ) {
    const c = b[i++];
    let cp: number;
    if (c < 0x80) {
      cp = c;
    } else if (c >= 0xf0) {
      cp =
        ((c & 0x07) << 18) |
        ((b[i++] & 0x3f) << 12) |
        ((b[i++] & 0x3f) << 6) |
        (b[i++] & 0x3f);
    } else if (c >= 0xe0) {
      cp = ((c & 0x0f) << 12) | ((b[i++] & 0x3f) << 6) | (b[i++] & 0x3f);
    } else {
      cp = ((c & 0x1f) << 6) | (b[i++] & 0x3f);
    }
    s += String.fromCodePoint(cp);
  }
  return s;
}

export function installTextCodecIfMissing(): void {
  const g = globalThis as Record<string, unknown>;
  if (typeof g.TextEncoder === 'undefined') {
    g.TextEncoder = class {
      encode(s = '') {
        return utf8Encode(s);
      }
    };
  }
  if (typeof g.TextDecoder === 'undefined') {
    g.TextDecoder = class {
      decode(b: ArrayBuffer | ArrayBufferView = new Uint8Array(0)) {
        return utf8Decode(b);
      }
    };
  }
}
