import path from 'node:path';

import { Download } from '@playwright/test';

import AppConfig from '@/config/AppConfig';
import BasePageModel from '@/pages/BasePageModel';

export type DownloadFileOptions = {
  fileName?: string;
};

export type DeleteFileOptions = {
    fileName?: string;
  };

class DownloadFile extends BasePageModel {
  private downloadPromise!: Promise<Download>;

  async onDownload() {
    this.downloadPromise = this.page.waitForEvent('download');
  }

  async saveFile(props: DownloadFileOptions = {}) {
    const download = await this.downloadPromise;

    const fileName = props?.fileName || download.suggestedFilename()

    const fullFilePath = path.join(
      AppConfig.DOWNLOADS_DIR_PATRH,
      fileName
    );

    await download.saveAs(fullFilePath);
    return { fileName, fullFilePath }
  }

}

export default DownloadFile;
