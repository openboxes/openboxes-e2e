import fs from 'node:fs';

import XLSX from 'xlsx';

import { deleteFile } from '@/utils/FileIOUtils';

export class WorkbookUtils {
  private _workbook: XLSX.WorkBook | null = null;
  private _filePath: string;

  constructor(workbook: XLSX.WorkBook, filePath: string) {
    this._workbook = workbook;
    this._filePath = filePath;
  }

  get workbook() {
    if (!this._workbook) {
      throw new Error('Workbook does not exist');
    }
    return this._workbook;
  }

  public static read(filePath: string) {
    const workbook = XLSX.readFile(filePath, { type: 'string' });
    return new WorkbookUtils(workbook, filePath);
  }

  private static transformDataArrayToJSON(data: unknown[][]) {
    const headers = data[0] as string[];
    const content = data.slice(1);

    return content.map((entry) => {
      return headers.reduce(
        (acc, columnName, index) => ({
          ...acc,
          [`${columnName}`]: entry[index],
        }),
        {}
      );
    });
  }

  public static saveFile(data: unknown[][], filePath: string) {
    const mappedDocuments = this.transformDataArrayToJSON(data);

    const worksheet = XLSX.utils.json_to_sheet(mappedDocuments);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const csvContent = XLSX.write(workbook, {
      bookType: 'csv',
      type: 'string',
    });

    fs.writeFileSync(filePath, csvContent);

    return new WorkbookUtils(workbook, filePath);
  }

  public delete() {
    deleteFile(this._filePath);
  }

  get sheetNames() {
    return this.workbook.SheetNames;
  }

  public getSheet(sheetIndex = 0) {
    return this.workbook.Sheets[this.sheetNames[sheetIndex]];
  }

  public sheetToJSON(sheetIndex = 0): unknown[][] {
    const sheet = this.getSheet(sheetIndex);
    return XLSX.utils.sheet_to_json(sheet, { header: 1 });
  }

  public getHeaders(sheetIndex = 0) {
    const data = this.sheetToJSON(sheetIndex);
    return data[0];
  }

  public getData(sheetIndex = 0) {
    const data = this.sheetToJSON(sheetIndex);
    return data.slice(1);
  }
}
