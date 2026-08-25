import { expect, Locator } from '@playwright/test';

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

// the row list can be briefly stale/empty right after a reload, so retry
// the scan the same way a locator-based lookup would implicitly do via
// expect()'s auto-retrying assertions
export const findRowIndexByText = async (
  rows: Locator,
  text: string,
  { timeout = 10000 } = {}
): Promise<number> => {
  let matchedIndex = -1;
  await expect(async () => {
    const texts = await rows.allTextContents();
    matchedIndex = texts.findIndex((rowText) => rowText.includes(text));
    if (matchedIndex === -1) {
      throw new Error(`Row with text "${text}" not found`);
    }
  }).toPass({ timeout });
  return matchedIndex;
};
