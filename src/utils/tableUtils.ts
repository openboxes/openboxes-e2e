import { Locator } from '@playwright/test';

export const captureRowValues = async <TRow>(
  rowCount: number,
  getRow: (index: number) => TRow,
  ...getters: ((row: TRow) => Locator)[]
): Promise<string[]> => {
  const rows = await Promise.all(
    Array.from({ length: rowCount }, async (_, i) => {
      const row = getRow(i);
      return Promise.all(getters.map((g) => g(row).textContent()));
    })
  );
  return rows
    .flat()
    .map((v) => v?.trim())
    .filter((v): v is string => Boolean(v));
};