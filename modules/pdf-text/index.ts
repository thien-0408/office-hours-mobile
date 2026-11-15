import { requireNativeModule } from 'expo';

export interface PdfTextItem {
  text: string;
  /** PDF user-space x of the run's first glyph. */
  x: number;
  /** PDF user-space y (grows UP from the page bottom), same as pdf.js transform[5]. */
  y: number;
}

export interface PdfTextPage {
  width: number;
  height: number;
  items: PdfTextItem[];
}

export interface PdfTextResult {
  pages: PdfTextPage[];
}

interface PdfTextNative {
  extractTextItems(uri: string): Promise<PdfTextResult>;
}

/** Reads text runs with positions from a local PDF (file:// or content:// uri). Android only. */
export function extractTextItems(uri: string): Promise<PdfTextResult> {
  return requireNativeModule<PdfTextNative>('PdfText').extractTextItems(uri);
}
