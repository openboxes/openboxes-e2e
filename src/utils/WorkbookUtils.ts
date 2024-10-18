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

  public delete() {
    deleteFile(this._filePath);
  }

  get sheetNames() {
    return this.workbook.SheetNames;
  }

  public getSheet(sheetIndex = 0) {
    return this.workbook.Sheets[this.sheetNames[sheetIndex]];
  }

  public sheetToJSON(sheetIndex = 0) {
    const sheet = this.getSheet(sheetIndex);
    return XLSX.utils.sheet_to_json(sheet);
  }

  public getHeaders(sheetIndex = 0) {
    const sheet = this.getSheet(sheetIndex);
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    return data[0];
  }

}
