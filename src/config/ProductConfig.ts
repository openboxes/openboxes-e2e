import _ from 'lodash';

import AppConfig from '@/config/AppConfig';
import { readFile } from '@/utils/FileIOUtils';

type ProductConfigProps = {
  key: string;
} & (
  | {
      id: string;
      required: true;
      name?: string;
      code?: string;
      quantity?: number;
    }
  | {
      id?: string;
      required: false;
      name: string;
      code?: string;
      quantity: number;
    }
);

class ProductConfig {
  id: string;
  key: string;
  name: string;
  quantity: number;
  required: boolean;

  constructor({ id, key, name, quantity, required }: ProductConfigProps) {
    this.id = id || '';
    this.key = key;
    this.name = name || '';
    this.quantity = quantity || 0;
    this.required = required;
  }

  /** Should create a new product for testing
   * Indicates if a new product should be created before a test
   * By providing the product id in the .env application will not create a new location
   * and instead will use the provided one
   * @returns {boolean}
   */
  get isCreateNew() {
    return !this.id;
  }

  /**
   * Returns a product Id either from .env if provided or from a file that's created before test run
   * @returns
   */
  readId() {
    if (this.id) {
      return this.id;
    }
    const data = readFile(AppConfig.TEST_DATA_FILE_PATH);
    return _.get(data, `products.${this.key}`) as string;
  }
}

export default ProductConfig;
