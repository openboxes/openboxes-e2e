import AppConfig from '@/config/AppConfig';
import { test } from '@/fixtures/fixtures';
import { writeToFile } from '@/utils/FileIOUtils';
import { parseUrl } from '@/utils/UrlUtils';

test('create data', async ({
  page,
  createProductPage,
  productShowPage,
  locationService,
  mainLocation,
}) => {
  const seedData: Record<'products' | 'locations', Record<string, string>> = {
    products: {},
    locations: {},
  };

  // // PRODUCST
  const products = Object.values(AppConfig.instance.products).filter(
    (product) => product.isCreateNew
  );

  for (const product of products) {
    await test.step(`create product ${product.key}`, async () => {
      await createProductPage.goToPage();
      await createProductPage.waitForUrl();
      await createProductPage.productDetails.nameField.fill(product.name);
      await createProductPage.productDetails.categorySelect.click();
      await createProductPage.productDetails.categorySelectDropdown
        .getByRole('listitem')
        .first()
        .click();
      await createProductPage.saveButton.click();

      await productShowPage.recordStockButton.click();

      await productShowPage.recordStock.lineItemsTable
        .row(1)
        .newQuantity.getByRole('textbox')
        .fill(`${product.quantity}`);
      await productShowPage.recordStock.lineItemsTable.saveButton.click();
      await productShowPage.showStockCardButton.click();

      const productUrl = parseUrl(
        page.url(),
        '/openboxes/inventoryItem/showStockCard/$id'
      );
      seedData.products[`${product.key}`] = productUrl.id;
    });
  }

  // LOCATIONS
  const { organization } = await mainLocation.getLocation();
  const { data: locationTypes } = await locationService.getLocationTypes();

  const locations = Object.values(AppConfig.instance.locations).filter(
    (location) => location.isCreateNew
  );

  for (const location of locations) {
    await test.step(`create location ${location.key}`, async () => {
      const locationType = locationTypes.find(
        (it) => it.locationTypeCode == location.type
      );
      const payload = {
        active: true,
        name: location.name,
        locationType: locationType,
        organization: { id: organization.id },
        supportedActivities: location.requiredActivityCodes,
      };
      const { data: createdLocation } = await locationService.createLocation(
        payload,
        { useDefaultActivities: true }
      );
      seedData.locations[`${location.key}`] = createdLocation.id;
    });
  }
  writeToFile(AppConfig.TEST_DATA_FILE_PATH, seedData);
});
