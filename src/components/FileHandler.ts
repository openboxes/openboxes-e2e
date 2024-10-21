import path from 'node:path';

import { Download, FileChooser } from '@playwright/test';

import AppConfig from '@/config/AppConfig';
import BasePageModel from '@/pages/BasePageModel';

export type FileHandlerOptions = {
  fileName?: string;
};

class FileHandler extends BasePageModel {
  private downloadPromise!: Promise<Download>;
  private fileChooserPromise!: Promise<FileChooser>;

  async onDownload() {
    this.downloadPromise = this.page.waitForEvent('download');
  }

  async onFileChooser() {
    this.fileChooserPromise = this.page.waitForEvent('filechooser');
  }

  async saveFile(props: FileHandlerOptions = {}) {
    const download = await this.downloadPromise;

    const fileName = props?.fileName || download.suggestedFilename();

    const fullFilePath = path.join(AppConfig.DOWNLOADS_DIR_PATRH, fileName);

    await download.saveAs(fullFilePath);
    return { fileName, fullFilePath };
  }

  async uploadFile(path: string) {
    const fileChooser = await this.fileChooserPromise;
    await fileChooser.setFiles(path);
  }
}

export default FileHandler;
