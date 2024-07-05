import _ from 'lodash';

import AppConfig from '@/config/AppConfig';
import { readFile } from '@/utils/FileIOUtils';

class ProductConfig {
  key: string;
  name: string;
  quantity: number;

  constructor({
    key,
    name,
    quantity,
  }: {
    key: string;
    name: string;
    quantity: number;
    code?: string;
  }) {
    this.key = key;
    this.name = name;
    this.quantity = quantity;
  }

  readId() {
    const data = readFile(AppConfig.TEST_DATA_FILE_PATH);
    return _.get(data, `products.${this.key}`) as string;
  }
}

export default ProductConfig;
