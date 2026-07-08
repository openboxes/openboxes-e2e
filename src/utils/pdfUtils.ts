import fs from 'node:fs';

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.js';
import type {
  PDFDocumentProxy,
  PDFPageProxy,
  TextItem,
} from 'pdfjs-dist/types/src/display/api';

type PositionedTextItem = {
  str: string;
  x: number;
  y: number;
};

type PdfTextLine = {
  y: number;
  items: PositionedTextItem[];
};

type ColumnBounds = {
  startX: number;
  endX: number;
};

type ColumnHeader = {
  y: number;
  bounds: ColumnBounds;
};

const Y_TOLERANCE = 2;
const X_TOLERANCE = 2;
/**
  Max vertical distance (in pdf units) between text lines belonging to the
  same table header row. Header cells are vertically centered, so a header
  row with wrapped labels renders up to three text lines a few units apart,
  while the first data row starts further below (cell padding + borders).
*/
const HEADER_BLOCK_SPAN = 12;
/**
  Max vertical distance between consecutive table row lines. A bigger gap
  means the table has ended and following text (e.g. a signature section or
  page footer) is not part of it.
*/
const MAX_ROW_GAP = 25;
/**
  Max vertical distance between text lines belonging to the same table row.
  A cell with wrapped content renders continuation lines one text line
  (~10 units) below, while the next table row starts further down
  (cell padding + borders).
*/
const MAX_CELL_LINE_GAP = 12;

const loadPdfDocument = (filePath: string): Promise<PDFDocumentProxy> => {
  const data = new Uint8Array(fs.readFileSync(filePath));
  return getDocument({ data }).promise;
};

const getPageNumbers = (doc: PDFDocumentProxy): number[] =>
  Array.from({ length: doc.numPages }, (_, i) => i + 1);

const getPositionedTextItems = async (
  page: PDFPageProxy
): Promise<PositionedTextItem[]> => {
  const content = await page.getTextContent();
  return (
    content.items
      // getTextContent() returns TextItem | TextMarkedContent; only TextItem
      // carries actual text (`str`), so this type guard drops marked-content
      // markers and narrows the type for the mapping below
      .filter((item): item is TextItem => 'str' in item)
      .filter((item) => item.str.trim())
      .map((item) => ({
        str: item.str.trim(),
        x: item.transform[4],
        y: item.transform[5],
      }))
  );
};

const groupItemsIntoLines = (items: PositionedTextItem[]): PdfTextLine[] =>
  [...items]
    .sort((a, b) => b.y - a.y)
    .reduce<PdfTextLine[]>((lines, item) => {
      const line = lines.find((l) => Math.abs(l.y - item.y) <= Y_TOLERANCE);
      if (!line) {
        return [...lines, { y: item.y, items: [item] }];
      }
      line.items.push(item);
      return lines;
    }, [])
    .map((line) => ({
      ...line,
      items: [...line.items].sort((a, b) => a.x - b.x),
    }));

type HeaderMatch = {
  startX: number;
  topY: number;
  bottomY: number;
  matchedItems: Set<PositionedTextItem>;
};

/**
  Tries to match the full header text starting from the given item.
  A wrapped header label continues on following text lines of the header
  block, with each continuation fragment left-aligned with the first one.
*/
const matchHeaderFromItem = (
  lines: PdfTextLine[],
  lineIndex: number,
  itemIndex: number,
  columnHeader: string
): HeaderMatch | null => {
  const startX = lines[lineIndex].items[itemIndex].x;
  const matchedItems = new Set<PositionedTextItem>();
  let text = '';
  let bottomY = lines[lineIndex].y;

  const consumeLineItems = (line: PdfTextLine, fromIndex: number) => {
    for (let i = fromIndex; i < line.items.length; i++) {
      const candidate = text
        ? `${text} ${line.items[i].str}`
        : line.items[i].str;
      if (!columnHeader.startsWith(candidate)) {
        return;
      }
      text = candidate;
      matchedItems.add(line.items[i]);
      bottomY = line.y;
    }
  };

  consumeLineItems(lines[lineIndex], itemIndex);

  for (let i = lineIndex + 1; i < lines.length; i++) {
    if (text === columnHeader || lines[i].y < bottomY - HEADER_BLOCK_SPAN) {
      break;
    }
    const alignedItemIndex = lines[i].items.findIndex(
      (item) => Math.abs(item.x - startX) <= X_TOLERANCE
    );
    if (alignedItemIndex === -1) {
      continue;
    }
    consumeLineItems(lines[i], alignedItemIndex);
  }

  if (text !== columnHeader) {
    return null;
  }
  return { startX, topY: lines[lineIndex].y, bottomY, matchedItems };
};

const getHeaderBlockLines = (
  lines: PdfTextLine[],
  match: HeaderMatch
): PdfTextLine[] =>
  lines
    .filter((line) => line.y <= match.topY + HEADER_BLOCK_SPAN)
    .filter((line) => line.y >= match.bottomY - HEADER_BLOCK_SPAN);

/**
  The column ends where the closest other text of the header block starts,
  i.e. at the smallest x (greater than the column start) among header block
  items not belonging to the matched header itself.
*/
const findColumnEndX = (
  headerBlockLines: PdfTextLine[],
  match: HeaderMatch
): number =>
  headerBlockLines
    .reduce<PositionedTextItem[]>((items, line) => items.concat(line.items), [])
    .filter((item) => !match.matchedItems.has(item))
    .filter((item) => item.x > match.startX + X_TOLERANCE)
    .reduce((endX, item) => Math.min(endX, item.x), Infinity);

const findColumnHeader = (
  lines: PdfTextLine[],
  columnHeader: string
): ColumnHeader | null => {
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    for (
      let itemIndex = 0;
      itemIndex < lines[lineIndex].items.length;
      itemIndex++
    ) {
      const match = matchHeaderFromItem(
        lines,
        lineIndex,
        itemIndex,
        columnHeader
      );
      if (!match) {
        continue;
      }
      const headerBlockLines = getHeaderBlockLines(lines, match);
      return {
        y: Math.min(...headerBlockLines.map((line) => line.y)),
        bounds: {
          startX: match.startX,
          endX: findColumnEndX(headerBlockLines, match),
        },
      };
    }
  }
  return null;
};

/**
  Collects the lines making up the table body: lines below the header row,
  until the first vertical gap bigger than a table row.
*/
const getTableRowLines = (
  lines: PdfTextLine[],
  headerBottomY: number
): PdfTextLine[] => {
  const rowLines: PdfTextLine[] = [];
  let previousY = headerBottomY;

  for (const line of lines) {
    if (line.y >= headerBottomY - Y_TOLERANCE) {
      continue;
    }
    if (previousY - line.y > MAX_ROW_GAP) {
      break;
    }
    rowLines.push(line);
    previousY = line.y;
  }

  return rowLines;
};

const getCellValue = (
  line: PdfTextLine,
  { startX, endX }: ColumnBounds
): string =>
  line.items
    .filter((item) => item.x >= startX - X_TOLERANCE)
    .filter((item) => item.x < endX - X_TOLERANCE)
    .map((item) => item.str)
    .join(' ');

/**
  Groups consecutive table body lines into rows: a line close enough to the
  previous one is a continuation of the same row (wrapped cell content).
*/
const groupLinesIntoRows = (rowLines: PdfTextLine[]): PdfTextLine[][] =>
  rowLines.reduce<PdfTextLine[][]>((rows, line) => {
    const currentRow = rows[rows.length - 1];
    const previousLine = currentRow?.[currentRow.length - 1];
    if (previousLine && previousLine.y - line.y <= MAX_CELL_LINE_GAP) {
      currentRow.push(line);
      return rows;
    }
    return [...rows, [line]];
  }, []);

const extractColumnValuesFromLines = (
  lines: PdfTextLine[],
  columnHeader: string
): string[] => {
  const header = findColumnHeader(lines, columnHeader);
  if (!header) {
    return [];
  }
  return groupLinesIntoRows(getTableRowLines(lines, header.y)).map((rowLines) =>
    rowLines
      .map((line) => getCellValue(line, header.bounds))
      .filter(Boolean)
      .join(' ')
  );
};

/**
  Extracts cell values of a single table column from a PDF, identified by
  its column header (wrapped, multi-line header labels are supported).
  Column boundaries are derived from x coordinates of the header text, so
  only values positioned within that column are returned — one entry per
  table row (per page), with an empty string for an empty cell. A cell
  wrapped into multiple text lines is joined back with spaces.
*/
export const extractPdfColumnValues = async (
  filePath: string,
  columnHeader: string
): Promise<string[]> => {
  const doc = await loadPdfDocument(filePath);

  const pageValues = await Promise.all(
    getPageNumbers(doc).map(async (pageNum) => {
      const page = await doc.getPage(pageNum);
      const items = await getPositionedTextItems(page);
      return extractColumnValuesFromLines(
        groupItemsIntoLines(items),
        columnHeader
      );
    })
  );

  return pageValues.reduce((all, values) => all.concat(values), []);
};

export const pdfContainsValues = async (
  filePath: string,
  values: string[]
): Promise<boolean> => {
  const pdfText = await extractPdfText(filePath);
  return values.every((value) => pdfText.includes(value));
};

export const extractPdfText = async (filePath: string): Promise<string> => {
  const doc = await loadPdfDocument(filePath);

  // Extract text from each page
  const pageTexts = await Promise.all(
    getPageNumbers(doc).map(async (pageNum) => {
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
