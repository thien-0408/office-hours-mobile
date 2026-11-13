/**
 * Memoji avatar catalogue for OfficeHours Mobile.
 * Provides fallback avatars for users without a profile picture.
 */

export const memojiImages = [
  require('../../assets/memoji/1.png'),
  require('../../assets/memoji/2.png'),
  require('../../assets/memoji/3.png'),
  require('../../assets/memoji/4.png'),
  require('../../assets/memoji/5.png'),
  require('../../assets/memoji/6.png'),
  require('../../assets/memoji/7.png'),
  require('../../assets/memoji/8.png'),
  require('../../assets/memoji/9.png'),
  require('../../assets/memoji/10.png'),
  require('../../assets/memoji/11.png'),
  require('../../assets/memoji/12.png'),
  require('../../assets/memoji/13.png'),
  require('../../assets/memoji/14.png'),
  require('../../assets/memoji/15.png'),
  require('../../assets/memoji/16.png'),
  require('../../assets/memoji/17.png'),
  require('../../assets/memoji/18.png'),
  require('../../assets/memoji/19.png'),
  require('../../assets/memoji/20.png'),
  require('../../assets/memoji/21.png'),
  require('../../assets/memoji/22.png'),
  require('../../assets/memoji/23.png'),
  require('../../assets/memoji/24.png'),
  require('../../assets/memoji/25.png'),
  require('../../assets/memoji/26.png'),
  require('../../assets/memoji/27.png'),
  require('../../assets/memoji/28.png'),
  require('../../assets/memoji/29.png'),
  require('../../assets/memoji/30.png'),
  require('../../assets/memoji/31.png'),
  require('../../assets/memoji/32.png'),
  require('../../assets/memoji/33.png'),
  require('../../assets/memoji/34.png'),
  require('../../assets/memoji/35.png'),
  require('../../assets/memoji/36.png'),
  require('../../assets/memoji/37.png'),
  require('../../assets/memoji/38.png'),
  require('../../assets/memoji/39.png'),
  require('../../assets/memoji/40.png'),
  require('../../assets/memoji/41.png'),
  require('../../assets/memoji/42.png'),
  require('../../assets/memoji/43.png'),
  require('../../assets/memoji/44.png'),
  require('../../assets/memoji/45.png'),
  require('../../assets/memoji/46.png'),
  require('../../assets/memoji/47.png'),
  require('../../assets/memoji/48.png'),
  require('../../assets/memoji/49.png'),
  require('../../assets/memoji/50.png'),
  require('../../assets/memoji/51.png'),
  require('../../assets/memoji/52.png'),
  require('../../assets/memoji/53.png'),
  require('../../assets/memoji/54.png'),
  require('../../assets/memoji/55.png'),
  require('../../assets/memoji/56.png'),
  require('../../assets/memoji/57.png'),
];

export const MEMOJI_IMAGES = memojiImages;

/**
 * Stable hash for string inputs using prime modulo arithmetic.
 */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(hash);
}

/**
 * Returns a stable memoji image asset for any user/entity ID.
 */
export function memojiFor(id: string) {
  if (!id) {
    return memojiImages[0];
  }
  const index = hashString(id) % memojiImages.length;
  return memojiImages[index];
}
