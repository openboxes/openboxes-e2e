import fs from 'node:fs';

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.js';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

export const pdfContainsValues = async (
  filePath: string,
  values: string[]
): Promise<boolean> => {
  const pdfText = await extractPdfText(filePath);
  return values.every((value) => pdfText.includes(value));
};

export const extractPdfText = async (filePath: string): Promise<string> => {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await getDocument({ data }).promise;

  // Get page numbers available in the PDF
  const pageNumbers = Array.from({ length: doc.numPages }, (_, i) => i + 1);
  // Extract text from each page
  const pageTexts = await Promise.all(
    pageNumbers.map(async (pageNum) => {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      return content.items
        .map((item) => ('str' in item ? (item as TextItem).str : ''))
        .join(' ');
    })
  );

  // Combine text from all pages into a single string
  return pageTexts.join('\n');
};
