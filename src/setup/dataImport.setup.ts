import ProductService from '@/api/ProductService';
import AppConfig from '@/config/AppConfig';
import { test } from '@/fixtures/fixtures';
import { readCsvFile, readFile, writeToFile } from '@/utils/FileIOUtils';

test('import data', async ({ request }) => {
  // eslint-disable-next-line playwright/no-conditional-in-test
  const data = readFile(AppConfig.TEST_DATA_FILE_PATH) || {};

  const seedData: Record<'products', Record<string, string>> = {
    ...data,
    products: {},
  };

  // PRODUCTS
  const productService = new ProductService(request);

  const productsData = readCsvFile(AppConfig.PRODUCTS_IMPORT_FILE_PATH);

  await test.step(`importing ${productsData.length} products`, async () => {
    const importedData = await productService.importProducts(productsData);
    importedData.data.forEach((product) => {
      seedData.products[product.productCode] = product.id;
    })
  })

  writeToFile(AppConfig.TEST_DATA_FILE_PATH, seedData);
});
