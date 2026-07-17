import { expect, test } from '@/fixtures/fixtures';
import { Product } from '@/generated/ProductCodes.generated';
import {
  LocationResponse,
  ProductResponse,
  StockMovementResponse,
} from '@/types';
import { assignPreferredBin } from '@/utils/productUtils';
import { cleanupPendingPutaways } from '@/utils/putawayUtils';
import RefreshCachesUtils from '@/utils/RefreshCaches';
import { deleteShipment, receiveInbound } from '@/utils/shipmentUtils';
import { byNameAsc } from '@/utils/sortUtils';

/**
  Sort putaway items by current bin, preferred bin and original order.

  Data is designed so each sort returns a different order

  Orders by backend comparators:
    - original     -> product name            => [A, B, C]
    - currentBins  -> current bins string asc => [B, C, A]
    - preferredBin -> preferred bin name asc  => [C, B, A]
*/
test.describe('Sort putaway by current bin, preferred bin and original order', () => {
  let inboundOne: StockMovementResponse;
  let inboundTwo: StockMovementResponse | undefined;

  let productA: ProductResponse;
  let productB: ProductResponse;
  let productC: ProductResponse;

  let binOne: LocationResponse;
  let binTwo: LocationResponse;

  let PUTAWAY_ORDER_IDS: string[] = [];

  test.beforeEach(
    async ({
      supplierLocationService,
      stockMovementService,
      receivingService,
      productService,
      internalLocationService,
      internalLocation2Service,
      productShowPage,
      productEditPage,
    }) => {
      PUTAWAY_ORDER_IDS = [];
      inboundTwo = undefined;
      [productA, productB, productC] = [
        await productService.getProduct(Product.ONE),
        await productService.getProduct(Product.TWO),
        await productService.getProduct(Product.THREE),
      ].sort(byNameAsc);

      [binOne, binTwo] = [
        await internalLocationService.getLocation(),
        await internalLocation2Service.getLocation(),
      ].sort(byNameAsc);

      const supplierLocation = await supplierLocationService.getLocation();

      // 1st inbound - only item A (will get a current bin via putaway).
      inboundOne = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });
      await stockMovementService.addItemsToInboundStockMovement(inboundOne.id, [
        { productId: productA.id, quantity: 10 },
      ]);
      await receiveInbound(
        { stockMovementService, receivingService },
        inboundOne,
        [10]
      );

      // Assign preferred bins: A -> binTwo, B -> binOne (C has none).
      await assignPreferredBin(
        { productShowPage, productEditPage },
        productA,
        binTwo
      );
      await assignPreferredBin(
        { productShowPage, productEditPage },
        productB,
        binOne
      );
    }
  );

  test.afterEach(
    async (
      {
        stockMovementService,
        transactionService,
        putawayService,
        productShowPage,
        productEditPage,
      },
      testInfo
    ) => {
      const { anyPutawayCompleted } = await cleanupPendingPutaways({
        putawayService,
        putawayOrderIds: PUTAWAY_ORDER_IDS,
        testInfo,
      });

      if (anyPutawayCompleted) {
        await transactionService.deleteRecentTransactions(3);
      }

      if (inboundTwo) {
        await deleteShipment({
          stockMovementService,
          STOCK_MOVEMENT: inboundTwo,
        });
      }
      await deleteShipment({
        stockMovementService,
        STOCK_MOVEMENT: inboundOne,
      });

      // Remove preferred bins for A and B.
      for (const product of [productA, productB]) {
        await productShowPage.goToPage(product.id);
        await productShowPage.editProductButton.click();
        await productEditPage.inventoryLevelsTab.click();
        await productEditPage.inventoryLevelsTabSection
          .row(1)
          .editInventoryLevelButton.click();
        await expect(
          productEditPage.inventoryLevelsTabSection.table
        ).toBeVisible();
        await productEditPage.inventoryLevelsTabSection.createStockLevelModal.clickDeleteInventoryLevel();
      }
    }
  );

  test('Sort putaway by current bin, preferred bin and original order', async ({
    stockMovementShowPage,
    navbar,
    createPutawayPage,
    putawayDetailsPage,
    stockMovementService,
    receivingService,
    supplierLocationService,
  }) => {
    // Extended timeout: those pages are loading slower than others.
    test.setTimeout(180_000);

    await test.step('create putaway for item A and complete it', async () => {
      await stockMovementShowPage.goToPage(inboundOne.id);
      await stockMovementShowPage.isLoaded();
      await RefreshCachesUtils.refreshCaches({ navbar });
      await navbar.inbound.click();
      await navbar.createPutaway.click();
      await createPutawayPage.isLoaded();

      // Flatten the table (Show by -> Product) and select item A by name.
      await createPutawayPage.showByStockMovementFilter.click();
      await createPutawayPage.table
        .rowByProductName(productA.name)
        .checkbox.click();
      PUTAWAY_ORDER_IDS.push(await createPutawayPage.startPutaway());
      await createPutawayPage.startStep.isLoaded();

      // Putaway A into binTwo (its preferred bin is auto-suggested).
      await expect(
        createPutawayPage.startStep.table.row(0).putawayBinSelect
      ).toContainText(binTwo.name);
      await createPutawayPage.startStep.nextButton.click();
      await createPutawayPage.completeStep.isLoaded();
      await createPutawayPage.completeStep.completePutawayButton.click();
      await putawayDetailsPage.isLoaded();
      await expect(putawayDetailsPage.statusTag).toHaveText('Completed');
    });

    await test.step('create and receive 2nd inbound with items A, B and C', async () => {
      const supplierLocation = await supplierLocationService.getLocation();
      inboundTwo = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });
      await stockMovementService.addItemsToInboundStockMovement(inboundTwo.id, [
        { productId: productA.id, quantity: 10 },
        { productId: productB.id, quantity: 10 },
        { productId: productC.id, quantity: 10 },
      ]);
      await receiveInbound(
        { stockMovementService, receivingService },
        inboundTwo,
        [10, 10, 10]
      );
    });

    const allProducts = [productA.name, productB.name, productC.name];

    await test.step('go to create putaway page and start putaway for all items', async () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await stockMovementShowPage.goToPage(inboundTwo!.id);
      await stockMovementShowPage.isLoaded();
      await RefreshCachesUtils.refreshCaches({ navbar });
      await navbar.inbound.click();
      await navbar.createPutaway.click();
      await createPutawayPage.isLoaded();

      // Flatten the table (Show by -> Product) and select items A, B, C by name.
      await createPutawayPage.showByStockMovementFilter.click();
      await createPutawayPage.table
        .rowByProductName(productA.name)
        .checkbox.click();
      await createPutawayPage.table
        .rowByProductName(productB.name)
        .checkbox.click();
      await createPutawayPage.table
        .rowByProductName(productC.name)
        .checkbox.click();
      PUTAWAY_ORDER_IDS.push(await createPutawayPage.startPutaway());
      await createPutawayPage.startStep.isLoaded();
    });

    await test.step('assert original order of items', async () => {
      await expect(createPutawayPage.startStep.sortButton).toContainText(
        'Sort by current bins'
      );
      await expect
        .poll(() =>
          createPutawayPage.startStep.table.getProductsOrder(allProducts)
        )
        .toEqual([productA.name, productB.name, productC.name]);
    });

    await test.step('sort by current bin and assert order', async () => {
      await createPutawayPage.startStep.sortButton.click();
      await expect(createPutawayPage.startStep.sortButton).toContainText(
        'Sort by preferred bin'
      );
      await expect
        .poll(() =>
          createPutawayPage.startStep.table.getProductsOrder(allProducts)
        )
        .toEqual([productB.name, productC.name, productA.name]);
    });

    await test.step('sort by preferred bin and assert order', async () => {
      await createPutawayPage.startStep.sortButton.click();
      await expect(createPutawayPage.startStep.sortButton).toContainText(
        'Original order'
      );
      await expect
        .poll(() =>
          createPutawayPage.startStep.table.getProductsOrder(allProducts)
        )
        .toEqual([productC.name, productB.name, productA.name]);
    });

    await test.step('use original order button and assert order', async () => {
      await createPutawayPage.startStep.sortButton.click();
      await expect(createPutawayPage.startStep.sortButton).toContainText(
        'Sort by current bins'
      );
      await expect
        .poll(() =>
          createPutawayPage.startStep.table.getProductsOrder(allProducts)
        )
        .toEqual([productA.name, productB.name, productC.name]);
    });
  });
});
