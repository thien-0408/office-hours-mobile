import TextRecognition from '@react-native-ml-kit/text-recognition';
import { parseTimetable, type ParsedScanRow } from './parseTimetable';

/** Read a photo on-device with ML Kit and turn it into draft rows. Throws if ML Kit fails. */
export async function scanImage(uri: string): Promise<ParsedScanRow[]> {
  const result = await TextRecognition.recognize(uri);
  return parseTimetable(result);
}
