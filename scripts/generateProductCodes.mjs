import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CSV_PATH = path.join(__dirname, '..', 'src', 'setup', 'dataImport', 'products.csv');
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'constants', 'ProductCodes.generated.ts');

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

function deriveKey({ code, name }) {
  const lastSegment = name ? name.split('-').pop().trim() : '';
  const sanitized = lastSegment.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  if (!sanitized) {
    return `PRODUCT_${code}`;
  }
  return /^\d/.test(sanitized) ? `_${sanitized}` : sanitized;
}

function buildFileContent(rows) {
  const seen = new Map();
  for (const row of rows) {
    const key = deriveKey(row);
    if (seen.has(key)) {
      throw new Error(
        `Duplicate Product key "${key}" derived for codes "${seen.get(key)}" and "${row.code}". ` +
          'Update Name column in products.csv to make them distinct.'
      );
    }
    seen.set(key, row.code);
  }

  const entries = [...seen.entries()]
    .map(([key, code]) => `  ${key}: '${code}',`)
    .join('\n');

  return `// AUTO-GENERATED FILE. DO NOT EDIT.
// Regenerated from src/setup/dataImport/products.csv by scripts/generateProductCodes.mjs

export const Product = {
${entries}
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

console.log(
  `Generated ${OUTPUT_PATH} with ${rows.length} products: ${rows.map((r) => r.code).join(', ')}`
);