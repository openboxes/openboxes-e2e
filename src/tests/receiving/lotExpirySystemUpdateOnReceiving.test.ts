import AppConfig from '@/config/AppConfig';
import { ShipmentType } from '@/constants/ShipmentType';
import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { formatDate, getDateByOffset, getToday } from '@/utils/DateUtils';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test.describe('Lot number system expiry date modification on receiving workflow', () => {
  const STOCK_MOVEMENTS: StockMovementResponse[] = [];

  test.afterEach(
    async ({
      stockMovementShowPage,
      stockMovementService,
      mainLocationService,
      page,
      locationListPage,
      createLocationPage,
    }) => {
      // TODO: Improve this one, it is prone to getting stuck if there are not deleted SMs in the tested location
      while (STOCK_MOVEMENTS.length > 0) {
        const STOCK_MOVEMENT = STOCK_MOVEMENTS.pop() as StockMovementResponse;

        await test.step(`Go to stock movement "${STOCK_MOVEMENT.id}" show page`, async () => {
          await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
          await stockMovementShowPage.waitForUrl();
          await stockMovementShowPage.isLoaded();
        });

        const isButtonVisible =
          await stockMovementShowPage.rollbackLastReceiptButton.isVisible();
        // due to failed test, shipment might not be received which will not show the button
        if (isButtonVisible) {
          await stockMovementShowPage.rollbackLastReceiptButton.click();
        }

        await test.step('Rollback shipment', async () => {
          await stockMovementShowPage.rollbackButton.click();
        });

        await test.step(`Delete stock movement "${STOCK_MOVEMENT.id}"`, async () => {
          await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);
        });

        await test.step('Deactivate receiving bin', async () => {
          const mainLocation = await mainLocationService.getLocation();
          const receivingBin =
            AppConfig.instance.receivingBinPrefix + STOCK_MOVEMENT.identifier;
          await page.goto('./location/list');
          await locationListPage.searchByLocationNameField.fill(
            mainLocation.name
          );
          await locationListPage.findButton.click();
          await locationListPage
            .getLocationEditButton(mainLocation.name)
            .click();
          await createLocationPage.binLocationTab.click();
          await createLocationPage.binLocationTabSection.isLoaded();
          await createLocationPage.binLocationTabSection.searchField.fill(
            receivingBin
          );
          await createLocationPage.binLocationTabSection.searchField.press(
            'Enter'
          );
          await createLocationPage.binLocationTabSection.isLoaded();
          await createLocationPage.binLocationTabSection.editBinButton.click();
          await createLocationPage.locationConfigurationTab.click();
          await createLocationPage.locationConfigurationTabSection.activeCheckbox.uncheck();
          await createLocationPage.locationConfigurationTabSection.saveButton.click();
        });
      }
    }
  );

  test('Edit lot expiration date on a new lot does not render a confirmation modal', async ({
    stockMovementShowPage,
    receivingPage,
    stockMovementService,
    mainProductService,
    productShowPage,
    supplierLocationService,
  }) => {
    const uniqueIdentifier = new UniqueIdentifier();

    let STOCK_MOVEMENT: StockMovementResponse;

    const TEST_INPUT_STOCK_NEW_LOT = {
      lotNumber: uniqueIdentifier.generateUniqueString('lot'),
      expirationDate: getDateByOffset(getToday(), 1),
    };

    const UPDATED_EXPIRY_DATE_NEW_LOT = getDateByOffset(getToday(), 2);

    const product = await mainProductService.getProduct();

    await test.step('Ensure that lot number does not exist in product stock', async () => {
      await productShowPage.goToPage(product.id);
      await productShowPage.recordStockButton.click();
      await expect(
        productShowPage.recordStock.lineItemsTable.table
      ).not.toContainText(TEST_INPUT_STOCK_NEW_LOT.lotNumber);
    });

    await test.step('Create inbound stock movement', async () => {
      const supplierLocation = await supplierLocationService.getLocation();
      STOCK_MOVEMENT = await stockMovementService.createInbound({
        originId: supplierLocation.id,
      });
      STOCK_MOVEMENTS.push(STOCK_MOVEMENT);
    });

    await test.step('Add item to stock movement', async () => {
      await stockMovementService.addItemsToInboundStockMovement(
        STOCK_MOVEMENT.id,
        [
          {
            productId: product.id,
            quantity: 10,
            lotNumber: TEST_INPUT_STOCK_NEW_LOT.lotNumber,
            expirationDate: TEST_INPUT_STOCK_NEW_LOT.expirationDate,
          },
        ]
      );
    });

    await test.step('Send stock movement', async () => {
      await stockMovementService.sendInboundStockMovement(STOCK_MOVEMENT.id, {
        shipmentType: ShipmentType.AIR,
      });
    });

    await test.step('Go to stock movement show page', async () => {
      await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
      await stockMovementShowPage.waitForUrl();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Start receiving process', async () => {
      await stockMovementShowPage.receiveButton.click();
      await receivingPage.receivingStep.isLoaded();
    });

    await test.step('Open edit modal of receving item', async () => {
      await receivingPage.receivingStep.table.row(1).editButton.click();
      await expect(receivingPage.receivingStep.editModal.modal).toBeVisible();
    });

    await test.step('Update expiration date of selected item lot', async () => {
      await receivingPage.receivingStep.editModal.table
        .row(0)
        .expiryDatePickerField.fill(UPDATED_EXPIRY_DATE_NEW_LOT);

      await receivingPage.receivingStep.editModal.saveButton.click();
    });

    await test.step('Edit modal should be hidden after save', async () => {
      await expect(receivingPage.receivingStep.editModal.modal).toBeHidden();
    });

    await test.step('Warning popup should not be visible after save', async () => {
      await expect(
        receivingPage.receivingStep.updateExpiryDatePopup.tableDialog
      ).toBeHidden();
    });

    await test.step('Autofill all quantities of receving items', async () => {
      await receivingPage.receivingStep.autofillQuantitiesButton.click();
    });

    await test.step('Go to next step', async () => {
      await receivingPage.nextButton.click();
    });

    await test.step('Receive shipment', async () => {
      await receivingPage.checkStep.isLoaded();
      await receivingPage.checkStep.receiveShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    await test.step('Ensure that lot number exist in product stock', async () => {
      await productShowPage.goToPage(product.id);
      await productShowPage.recordStockButton.click();
      await expect(
        productShowPage.recordStock.lineItemsTable.table
      ).toContainText(TEST_INPUT_STOCK_NEW_LOT.lotNumber);
    });

    await test.step('Ensure that lot has updated expiration date', async () => {
      await expect(
        productShowPage.recordStock.lineItemsTable
          .getRowByLot(TEST_INPUT_STOCK_NEW_LOT.lotNumber)
          .first()
      ).toContainText(formatDate(UPDATED_EXPIRY_DATE_NEW_LOT, 'DD/MMM/YYYY'));
    });
  });

  test.describe('Update existing lot', () => {
    const TEST_INPUT_STOCK_EXISTING_LOT = {
      lotNumber: 'lot',
      expirationDate: getDateByOffset(getToday(), 3),
    };

    const UPDATED_EXPIRY_DATE = getDateByOffset(getToday(), 4);

    test.beforeEach(
      async ({
        stockMovementShowPage,
        receivingPage,
        stockMovementService,
        mainProductService,
        productShowPage,
        supplierLocationService,
      }) => {
        const uniqueIdentifier = new UniqueIdentifier();

        let STOCK_MOVEMENT: StockMovementResponse;

        const product = await mainProductService.getProduct();

        TEST_INPUT_STOCK_EXISTING_LOT.lotNumber =
          uniqueIdentifier.generateUniqueString('lot');

        await test.step('Ensure that lot number does not exist in product stock', async () => {
          await productShowPage.goToPage(product.id);
          await productShowPage.recordStockButton.click();
          await expect(
            productShowPage.recordStock.lineItemsTable.table
          ).not.toContainText(TEST_INPUT_STOCK_EXISTING_LOT.lotNumber);
        });

        await test.step('Create inbound stock movement', async () => {
          const supplierLocation = await supplierLocationService.getLocation();
          STOCK_MOVEMENT = await stockMovementService.createInbound({
            originId: supplierLocation.id,
          });
          STOCK_MOVEMENTS.push(STOCK_MOVEMENT);
        });

        await test.step('Add item to stock movement', async () => {
          await stockMovementService.addItemsToInboundStockMovement(
            STOCK_MOVEMENT.id,
            [
              {
                productId: product.id,
                quantity: 10,
                lotNumber: TEST_INPUT_STOCK_EXISTING_LOT.lotNumber,
                expirationDate: TEST_INPUT_STOCK_EXISTING_LOT.expirationDate,
              },
            ]
          );
        });

        await test.step('Send stock movement', async () => {
          await stockMovementService.sendInboundStockMovement(
            STOCK_MOVEMENT.id,
            {
              shipmentType: ShipmentType.AIR,
            }
          );
        });

        await test.step('Go to stock movement show page', async () => {
          await stockMovementShowPage.goToPage(STOCK_MOVEMENT.id);
          await stockMovementShowPage.waitForUrl();
          await stockMovementShowPage.isLoaded();
        });

        await test.step('Start receiving process', async () => {
          await stockMovementShowPage.receiveButton.click();
          await receivingPage.receivingStep.isLoaded();
        });

        await test.step('Autofill all quantities of receving items', async () => {
          await receivingPage.receivingStep.autofillQuantitiesButton.click();
        });

        await test.step('Go to next step', async () => {
          await receivingPage.nextButton.click();
        });

        await test.step('Receive shipment', async () => {
          await receivingPage.checkStep.isLoaded();
          await receivingPage.checkStep.receiveShipmentButton.click();
          await stockMovementShowPage.isLoaded();
        });

        await test.step('Ensure that lot number exist in product stock', async () => {
          await productShowPage.goToPage(product.id);
          await productShowPage.recordStockButton.click();
          await expect(
            productShowPage.recordStock.lineItemsTable.table
          ).toContainText(TEST_INPUT_STOCK_EXISTING_LOT.lotNumber);
        });
      }
    );

    test('Should not update expiration date on an existing lot when canceling popup', async ({
      stockMovementShowPage,
      receivingPage,
      stockMovementService,
      mainProductService,
      productShowPage,
      supplierLocationService,
    }) => {
      let STOCK_MOVEMENT_2: StockMovementResponse;

      const product = await mainProductService.getProduct();

      await test.step('Create second inbound stock movement', async () => {
        const supplierLocation = await supplierLocationService.getLocation();
        STOCK_MOVEMENT_2 = await stockMovementService.createInbound({
          originId: supplierLocation.id,
        });
        STOCK_MOVEMENTS.push(STOCK_MOVEMENT_2);
      });

      await test.step('Add item to second stock movement', async () => {
        await stockMovementService.addItemsToInboundStockMovement(
          STOCK_MOVEMENT_2.id,
          [
            {
              productId: product.id,
              quantity: 10,
              lotNumber: TEST_INPUT_STOCK_EXISTING_LOT.lotNumber,
              expirationDate: TEST_INPUT_STOCK_EXISTING_LOT.expirationDate,
            },
          ]
        );
      });

      await test.step('Send second stock movement', async () => {
        await stockMovementService.sendInboundStockMovement(
          STOCK_MOVEMENT_2.id,
          {
            shipmentType: ShipmentType.AIR,
          }
        );
      });

      await test.step('Go to second stock movement show page', async () => {
        await stockMovementShowPage.goToPage(STOCK_MOVEMENT_2.id);
        await stockMovementShowPage.waitForUrl();
        await stockMovementShowPage.isLoaded();
      });

      await test.step('Start receiving process of second stock movement', async () => {
        await stockMovementShowPage.receiveButton.click();
        await receivingPage.receivingStep.isLoaded();
      });

      await test.step('Open edit modal of receving item', async () => {
        await receivingPage.receivingStep.table.row(1).editButton.click();
        await expect(receivingPage.receivingStep.editModal.modal).toBeVisible();
      });

      await test.step('Update expiration date of selected item lot', async () => {
        await receivingPage.receivingStep.editModal.table
          .row(0)
          .expiryDatePickerField.fill(UPDATED_EXPIRY_DATE);

        await receivingPage.receivingStep.editModal.saveButton.click();
      });

      await test.step('Warning popup should be visible after save', async () => {
        await expect(
          receivingPage.receivingStep.updateExpiryDatePopup.tableDialog
        ).toBeVisible();
      });

      await test.step('Cancel update expiry date popup', async () => {
        await receivingPage.receivingStep.updateExpiryDatePopup.noButton.click();
        await expect(
          receivingPage.receivingStep.updateExpiryDatePopup.tableDialog
        ).toBeHidden();
      });

      await test.step('Autofill all quantities of receving items', async () => {
        await receivingPage.receivingStep.autofillQuantitiesButton.click();
      });

      await test.step('Go to next step', async () => {
        await receivingPage.nextButton.click();
      });

      await test.step('Receive shipment', async () => {
        await receivingPage.checkStep.isLoaded();
        await receivingPage.checkStep.receiveShipmentButton.click();
        await stockMovementShowPage.isLoaded();
      });

      await test.step('Ensure that lot number expiry date has not updated', async () => {
        await productShowPage.goToPage(product.id);
        await productShowPage.recordStockButton.click();
        await expect(
          productShowPage.recordStock.lineItemsTable.table
        ).toContainText(TEST_INPUT_STOCK_EXISTING_LOT.lotNumber);

        await expect(
          productShowPage.recordStock.lineItemsTable
            .getRowByLot(TEST_INPUT_STOCK_EXISTING_LOT.lotNumber)
            .first()
        ).toContainText(
          formatDate(
            TEST_INPUT_STOCK_EXISTING_LOT.expirationDate,
            'DD/MMM/YYYY'
          )
        );
      });
    });

    test('Should update expiration date on an existing lot when confirming popup', async ({
      stockMovementShowPage,
      receivingPage,
      stockMovementService,
      mainProductService,
      productShowPage,
      supplierLocationService,
    }) => {
      let STOCK_MOVEMENT_2: StockMovementResponse;

      const product = await mainProductService.getProduct();

      await test.step('Create second inbound stock movement', async () => {
        const supplierLocation = await supplierLocationService.getLocation();
        STOCK_MOVEMENT_2 = await stockMovementService.createInbound({
          originId: supplierLocation.id,
        });
        STOCK_MOVEMENTS.push(STOCK_MOVEMENT_2);
      });

      await test.step('Add item to second stock movement', async () => {
        await stockMovementService.addItemsToInboundStockMovement(
          STOCK_MOVEMENT_2.id,
          [
            {
              productId: product.id,
              quantity: 10,
              lotNumber: TEST_INPUT_STOCK_EXISTING_LOT.lotNumber,
              expirationDate: TEST_INPUT_STOCK_EXISTING_LOT.expirationDate,
            },
          ]
        );
      });

      await test.step('Send second stock movement', async () => {
        await stockMovementService.sendInboundStockMovement(
          STOCK_MOVEMENT_2.id,
          {
            shipmentType: ShipmentType.AIR,
          }
        );
      });

      await test.step('Go to second stock movement show page', async () => {
        await stockMovementShowPage.goToPage(STOCK_MOVEMENT_2.id);
        await stockMovementShowPage.waitForUrl();
        await stockMovementShowPage.isLoaded();
      });

      await test.step('Start receiving process of second stock movement', async () => {
        await stockMovementShowPage.receiveButton.click();
        await receivingPage.receivingStep.isLoaded();
      });

      await test.step('Open edit modal of receving item', async () => {
        await receivingPage.receivingStep.table.row(1).editButton.click();
        await expect(receivingPage.receivingStep.editModal.modal).toBeVisible();
      });

      await test.step('Update expiration date of selected item lot', async () => {
        await receivingPage.receivingStep.editModal.table
          .row(0)
          .expiryDatePickerField.fill(UPDATED_EXPIRY_DATE);

        await receivingPage.receivingStep.editModal.saveButton.click();
      });

      await test.step('Warning popup should be visible after save', async () => {
        await expect(
          receivingPage.receivingStep.updateExpiryDatePopup.tableDialog
        ).toBeVisible();
      });

      await test.step('Confirm update expiry date popup', async () => {
        await receivingPage.receivingStep.updateExpiryDatePopup.yesButton.click();
        await expect(
          receivingPage.receivingStep.updateExpiryDatePopup.tableDialog
        ).toBeHidden();
      });

      await test.step('Autofill all quantities of receving items', async () => {
        await receivingPage.receivingStep.autofillQuantitiesButton.click();
      });

      await test.step('Go to next step', async () => {
        await receivingPage.nextButton.click();
      });

      await test.step('Receive shipment', async () => {
        await receivingPage.checkStep.isLoaded();
        await receivingPage.checkStep.receiveShipmentButton.click();
        await stockMovementShowPage.isLoaded();
      });

      await test.step('Ensure that lot number expiry date has been updated', async () => {
        await productShowPage.goToPage(product.id);
        await productShowPage.recordStockButton.click();
        await expect(
          productShowPage.recordStock.lineItemsTable.table
        ).toContainText(TEST_INPUT_STOCK_EXISTING_LOT.lotNumber);

        await expect(
          productShowPage.recordStock.lineItemsTable
            .getRowByLot(TEST_INPUT_STOCK_EXISTING_LOT.lotNumber)
            .first()
        ).toContainText(formatDate(UPDATED_EXPIRY_DATE, 'DD/MMM/YYYY'));
      });
    });
  });
});
