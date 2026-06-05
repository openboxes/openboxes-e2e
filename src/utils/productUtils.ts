import ProductEditPage from '@/pages/product/productEdit/ProductEditPage';
import ProductShowPage from '@/pages/product/productShow/ProductShowPage';
import { LocationResponse, ProductResponse } from '@/types';

export async function assignPreferredBin(
  {
    productShowPage,
    productEditPage,
  }: {
    productShowPage: ProductShowPage;
    productEditPage: ProductEditPage;
  },
  product: ProductResponse,
  bin: LocationResponse
) {
  await productShowPage.goToPage(product.id);
  await productShowPage.editProductkButton.click();
  await productEditPage.inventoryLevelsTab.click();
  await productEditPage.inventoryLevelsTabSection.createStockLevelButton.click();
  await productEditPage.inventoryLevelsTabSection.createStockLevelModal.receivingTab.click();
  await productEditPage.inventoryLevelsTabSection.createStockLevelModal.defaultPutawayLocation.click();
  await productEditPage.inventoryLevelsTabSection.createStockLevelModal
    .getDefaultPutawayLocation(bin.name)
    .click();
  await productEditPage.inventoryLevelsTabSection.createStockLevelModal.createButton.click();
}
