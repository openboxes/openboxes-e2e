import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CSV_PATH = path.join(__dirname, '..', 'src', 'setup', 'dataImport', 'products.csv');
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'generated', 'ProductCodes.generated.ts');

function parseCsv(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) {
    return [];
  }
  const headers = lines[0].split(',').map((h) => h.trim());
  const codeIndex = headers.indexOf('ProductCode');
  const nameIndex = headers.indexOf('Name');
  if (codeIndex === -1) {
    throw new Error(`ProductCode column not found in ${CSV_PATH}`);
  }
  if (nameIndex === -1) {
    throw new Error(`Name column not found in ${CSV_PATH}`);
  }
  return lines
    .slice(1)
    .map((line) => line.split(','))
    .map((cols) => ({
      code: cols[codeIndex]?.trim() ?? '',
      name: cols[nameIndex]?.trim() ?? '',
    }))
    .filter((row) => row.code.length > 0);
}

function buildFileContent(rows) {
  const codeByName = new Map(rows.map((row) => [row.name, row.code]));

  // Stable keys for the generated objects, mapped to the name value
  // in products.csv that identifies the row. The productCode (value) is read
  // from the CSV at generation time, so codes can change without touching tests.
  const PRODUCT_KEYS = {
    ONE: rows[0].name,
    TWO: rows[1].name,
    THREE: rows[2].name,
    FOUR: rows[3].name,
    FIVE: rows[4].name,
    SIX: rows[5].name,
  }

  const entries = Object.entries(PRODUCT_KEYS).map(([key, name]) => {
    const code = codeByName.get(name);
    if (!code) {
      throw new Error(
        `Product with Name "${name}" (key ${key}) not found in ${CSV_PATH}. ` +
          'Update PRODUCT_KEYS in scripts/generateProductCodes.mjs or add the row to products.csv.'
      );
    }
    return `  ${key}: '${code}',`;
  });

  return `// AUTO-GENERATED FILE. DO NOT EDIT.
// Regenerated from src/setup/dataImport/products.csv by scripts/generateProductCodes.mjs
// Output: src/generated/ProductCodes.generated.ts

export const Product = {
${entries.join('\n')}
} as const;

export type ProductCode = (typeof Product)[keyof typeof Product];
`;
}

const csv = fs.readFileSync(CSV_PATH, 'utf8');
const rows = parseCsv(csv);
if (rows.length === 0) {
  throw new Error(`No product codes found in ${CSV_PATH}`);
}

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, buildFileContent(rows), 'utf8');
