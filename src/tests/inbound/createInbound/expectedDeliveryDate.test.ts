import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse, User } from '@/types';
import { formatDate, getDateByOffset } from '@/utils/DateUtils';
import productService from '@/api/ProductService';

test.describe('Expected delivery date tests', () => {
  let STOCK_MOVEMENT: StockMovementResponse;
  let USER: User;
  const SHIPMENT_TYPE = 'Air';

  test.beforeEach(
    async ({
      supplierLocationService,
      mainUserService,
      stockMovementService,
      productService,
    }) => {
      const supplierLocation = await supplierLocationService.getLocation();
      USER = await mainUserService.getUser();
      productService.setProduct('3');
      const PRODUCT_THREE = await productService.getProduct();
      productService.setProduct('4');
      const PRODUCT_FOUR = await productService.getProduct();

      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });

      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          { productId: PRODUCT_THREE.id, quantity: 50 },
          { productId: PRODUCT_FOUR.id, quantity: 200 },
        ]
      );
    }
  );

  test.afterEach(async ({ stockMovementShowPage, stockMovementService }) => {
    await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
    const isRollbackButtonVisible =
      await stockMovementShowPage.rollbackButton.isVisible();
    if (isRollbackButtonVisible) {
      await stockMovementShowPage.rollbackButton.click();
    }
    await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
  });

  test('Leave exp delivery date empty and assert dialog when go backward', async ({
    stockMovementShowPage,
    createInboundPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Go backward when exp delivey date empty, accept dialog', async () => {
      await stockMovementShowPage.editButton.click();
      await createInboundPage.sendStep.isLoaded();
      await createInboundPage.previousButton.click();
      await createInboundPage.sendStep.validationPopup.assertPopupVisible();
      await createInboundPage.sendStep.validationPopup.confirmButton.click();
      await createInboundPage.addItemsStep.isLoaded();
    });

    await test.step('Go to stock send page', async () => {
      await createInboundPage.nextButton.click();
      await createInboundPage.sendStep.isLoaded();
    });

    await test.step('Go backward when exp delivey date empty, cancel dialog', async () => {
      await createInboundPage.previousButton.click();
      await createInboundPage.sendStep.validationPopup.assertPopupVisible();
      await createInboundPage.sendStep.validationPopup.cancelButton.click();
      await createInboundPage.sendStep.isLoaded();
    });
  });

  test('Leave exp delivery date empty and assert dialog when save and exit', async ({
    stockMovementShowPage,
    createInboundPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Save and exit when exp delivey date empty, cancel', async () => {
      await stockMovementShowPage.editButton.click();
      await createInboundPage.sendStep.isLoaded();
      await createInboundPage.sendStep.saveAndExitButton.click();
      await createInboundPage.sendStep.validationPopup.assertPopupVisible();
      await createInboundPage.sendStep.validationPopup.noButton.click();
      await createInboundPage.sendStep.isLoaded();
    });

    await test.step('Save and exit when exp delivey date empty, accept dialog', async () => {
      await createInboundPage.sendStep.saveAndExitButton.click();
      await createInboundPage.sendStep.validationPopup.assertPopupVisible();
      await createInboundPage.sendStep.validationPopup.yesButton.click();
      await stockMovementShowPage.isLoaded();
    });
  });

  test('Set ship date and expected delivery date to past values', async ({
    stockMovementShowPage,
    createInboundPage,
    inboundListPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Set ship date and exp delivery date to past values', async () => {
      await stockMovementShowPage.editButton.click();
      await createInboundPage.sendStep.isLoaded();
      await createInboundPage.sendStep.expectedDeliveryDatePicker.fillWithFormat(
        getDateByOffset(new Date(), -1),
        'MM/DD/YYYY'
      );
      await createInboundPage.sendStep.shipDateDatePicker.fillWithFormat(
        getDateByOffset(new Date(), -2),
        'MM/DD/YYYY HH:mm:ss Z'
      );
      await createInboundPage.sendStep.shipmentTypeSelect.findAndSelectOption(
        SHIPMENT_TYPE
      );
    });

    await test.step('Send stock stock movement', async () => {
      await createInboundPage.sendStep.sendShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Assert date shipped on stock movement view page', async () => {
      await expect(
        stockMovementShowPage.auditingTable.dateShippedRow
      ).toContainText(
        `${formatDate(getDateByOffset(new Date(), -2), 'DD/MMM/YYYY')} by ${USER.name}`
      );
    });

    await test.step('Go to list page and assert date created', async () => {
      const inboundShipmentIdentifier =
        await stockMovementShowPage.detailsListTable.identifierValue.textContent();
      await inboundListPage.goToPage();
      await inboundListPage.filters.searchField.textbox.fill(
        `${inboundShipmentIdentifier}`.toString().trim()
      );
      await inboundListPage.search();
      await expect(inboundListPage.table.row(0).dateCreated).toContainText(
        `${formatDate(new Date(), 'MMM DD, YYYY')}`
      );
    });

    await test.step('Assert expected delivery date on list page', async () => {
      await expect(
        inboundListPage.table.row(0).expectedReceiptDate
      ).toContainText(
        `${formatDate(getDateByOffset(new Date(), -1), 'MMM DD, YYYY')}`
      );
    });
  });

  test('Edit expected devlivery date in shipped inbound', async ({
    stockMovementShowPage,
    createInboundPage,
    inboundListPage,
  }) => {
    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Set exp delivery date and send shipment', async () => {
      await stockMovementShowPage.editButton.click();
      await createInboundPage.sendStep.isLoaded();
      await createInboundPage.sendStep.expectedDeliveryDatePicker.fillWithFormat(
        getDateByOffset(new Date(), 1),
        'MM/DD/YYYY'
      );
      await createInboundPage.sendStep.shipmentTypeSelect.findAndSelectOption(
        SHIPMENT_TYPE
      );
      await createInboundPage.sendStep.sendShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Update expected delivery date in shipped sm', async () => {
      await stockMovementShowPage.editButton.click();
      await createInboundPage.sendStep.isLoaded();
      await createInboundPage.sendStep.expectedDeliveryDatePicker.fillWithFormat(
        getDateByOffset(new Date(), 2),
        'MM/DD/YYYY'
      );
      await createInboundPage.sendStep.saveAndExitButton.click();
    });

    await test.step('Go to list page and use enter on search bar', async () => {
      const inboundShipmentIdentifier =
        await stockMovementShowPage.detailsListTable.identifierValue.textContent();
      await inboundListPage.goToPage();
      await inboundListPage.filters.searchField.textbox.fill(
        `${inboundShipmentIdentifier}`.toString().trim()
      );
      await inboundListPage.filters.searchField.textbox.press('Enter');
    });

    await test.step('Assert updated exp delivery date', async () => {
      await expect(
        inboundListPage.table.row(0).expectedReceiptDate
      ).toContainText(
        `${formatDate(getDateByOffset(new Date(), 2), 'MMM DD, YYYY')}`
      );
    });
  });
});
