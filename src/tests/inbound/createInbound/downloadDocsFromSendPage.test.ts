import { expect, test } from '@/fixtures/fixtures';
import { AddItemsTableRow, LocationResponse, User } from '@/types';
import { getDateByOffset, getToday } from '@/utils/DateUtils';
import UniqueIdentifier from '@/utils/UniqueIdentifier';

test.describe('Download documents from inbound send page', () => {
  const TODAY = getToday();
  let ROWS: AddItemsTableRow[];
  let INBOUND_ID: string;
  const DESCRIPTION = 'some description';
  let ORIGIN: LocationResponse;
  let USER: User;
  const EXPECTED_DELIVERY_DATE = getDateByOffset(TODAY, 1);
  const SHIPMENT_TYPE = 'Land';
  const uniqueIdentifier = new UniqueIdentifier();

  test.beforeEach(
    async ({
      mainProductService,
      mainUserService,
      supplierLocationService,
    }) => {
      const PRODUCT_ONE = await mainProductService.getProduct();
      USER = await mainUserService.getUser();
      ORIGIN = await supplierLocationService.getLocation();

      ROWS = [
        {
          packLevel1: 'pallet1',
          packLevel2: 'box2',
          productCode: PRODUCT_ONE.productCode,
          productName: PRODUCT_ONE.name,
          quantity: '50',
          lotNumber: uniqueIdentifier.generateUniqueString('lot'),
          recipient: USER.name,
          expirationDate: getDateByOffset(new Date(), 3),
        },
      ];
    }
  );

  test.afterEach(async ({ stockMovementShowPage, stockMovementService }) => {
    await stockMovementShowPage.goToPage(INBOUND_ID);
    await stockMovementShowPage.rollbackButton.click();
    await stockMovementService.deleteStockMovement(INBOUND_ID);
  });

  test('Download documents from Send page of Inbound shipment', async ({
    createInboundPage,
    page,
    stockMovementShowPage,
  }) => {
    await test.step('Go to create inbound page', async () => {
      await createInboundPage.goToPage();
      await createInboundPage.createStep.isLoaded();
      await createInboundPage.wizzardSteps.assertActiveStep('Create');
    });

    await test.step('Fill create stock movement page', async () => {
      await createInboundPage.createStep.originSelect.findAndSelectOption(
        ORIGIN.name
      );
      await createInboundPage.createStep.requestedBySelect.findAndSelectOption(
        USER.name
      );
      await createInboundPage.createStep.dateRequestedDatePicker.fill(TODAY);
      await createInboundPage.createStep.descriptionField.textbox.fill(
        DESCRIPTION
      );
    });

    await test.step('Go to add items page)', async () => {
      await createInboundPage.nextButton.click();
      await createInboundPage.addItemsStep.isLoaded();
    });

    INBOUND_ID = createInboundPage.getId();

    await test.step('Add first line items (Add items)', async () => {
      const data = ROWS[0];
      const row = createInboundPage.addItemsStep.table.row(0);
      await row.productSelect.findAndSelectOption(data.productName);
      await row.quantityField.numberbox.fill(data.quantity);
      await row.lotField.textbox.fill(data.lotNumber);
      await row.expirationDate.fill(data.expirationDate);
      await row.recipientSelect.findAndSelectOption(data.recipient);
      await row.packLevel1Field.textbox.fill(data.packLevel1);
      await row.packLevel2Field.textbox.fill(data.packLevel2);

      expect(await createInboundPage.addItemsStep.table.rows.count()).toBe(1);
    });

    await test.step('Go to send page', async () => {
      await createInboundPage.nextButton.click();
      await createInboundPage.wizzardSteps.assertActiveStep('Send');
      await createInboundPage.sendStep.isLoaded();
    });

    await test.step('Expand download dropdown and assert documents in pending shipment', async () => {
      await createInboundPage.sendStep.downloadButton.click();
      await expect(
        createInboundPage.sendStep.getDocuments('Export Packing List (.xls)')
      ).toBeVisible();
      await expect(
        createInboundPage.sendStep.getDocuments('Packing List')
      ).toBeVisible();
      await expect(
        createInboundPage.sendStep.getDocuments('Certificate of Donation')
      ).toBeVisible();
      await expect(
        createInboundPage.sendStep.getDocuments('Delivery Note')
      ).toBeHidden();
    });

    await test.step('Download Certificate of Donation file', async () => {
      const popupPromise = page.waitForEvent('popup');
      await createInboundPage.sendStep
        .getDocuments('Certificate of Donation')
        .click();
      const popup = await popupPromise;
      await popup.close();
    });

    await test.step('Download Export Packing List (.xls) file', async () => {
      const popupPromise = page.waitForEvent('popup');
      await createInboundPage.sendStep
        .getDocuments('Export Packing List (.xls)')
        .click();
      const popup = await popupPromise;
      await popup.close();
    });

    await test.step('Download Packing List file', async () => {
      const popupPromise = page.waitForEvent('popup');
      await createInboundPage.sendStep.getDocuments('Packing List').click();
      const popup = await popupPromise;
      await popup.close();
    });

    await test.step('Fill send page and send shipment', async () => {
      await createInboundPage.sendStep.shipmentTypeSelect.findAndSelectOption(
        SHIPMENT_TYPE
      );
      await createInboundPage.sendStep.expectedDeliveryDatePicker.fill(
        EXPECTED_DELIVERY_DATE
      );
      await createInboundPage.sendStep.sendShipmentButton.click();
      await stockMovementShowPage.isLoaded();
    });

    const inboundShipmentIdentifier =
      await stockMovementShowPage.detailsListTable.identifierValue.textContent();

    await test.step('Assert documents to download in Shipped shipment', async () => {
      await stockMovementShowPage.editButton.click();
      await createInboundPage.sendStep.isLoaded();
      await createInboundPage.sendStep.downloadButton.click();
      await expect(
        createInboundPage.sendStep.getDocuments('Export Packing List (.xls)')
      ).toBeVisible();
      await expect(
        createInboundPage.sendStep.getDocuments('Packing List')
      ).toBeVisible();
      await expect(
        createInboundPage.sendStep.getDocuments('Certificate of Donation')
      ).toBeVisible();
      await expect(
        createInboundPage.sendStep.getDocuments('Delivery Note')
      ).toBeHidden();
    });

    const certificateOfDonationFileName =
      'Certificate of Donation - ' +
      `${inboundShipmentIdentifier}`.toString().trim() +
      '.xls';
    const exportPackingListFileName =
      'Shipment ' +
      `${inboundShipmentIdentifier}`.toString().trim() +
      ' - Packing List.xls';

    await test.step('Download Certificate of Donation file', async () => {
      const popupPromise = page.waitForEvent('popup');
      await createInboundPage.sendStep
        .getDocuments('Certificate of Donation')
        .click();
      const popup = await popupPromise;
      const downloadPromise = popup.waitForEvent('download');
      const download = await downloadPromise;
      await popup.close();
      await expect(download.suggestedFilename()).toBe(
        certificateOfDonationFileName
      );
    });

    await test.step('Download Export Packing List (.xls) file', async () => {
      await createInboundPage.sendStep.isLoaded();
      const popupPromise = page.waitForEvent('popup');
      await createInboundPage.sendStep
        .getDocuments('Export Packing List (.xls)')
        .click();
      const popup = await popupPromise;
      const downloadPromise = popup.waitForEvent('download');
      const download = await downloadPromise;
      await popup.close();
      await expect(download.suggestedFilename()).toBe(
        exportPackingListFileName
      );
    });

    await test.step('Download Packing list file', async () => {
      await createInboundPage.sendStep.isLoaded();
      const popupPromise = page.waitForEvent('popup');
      await createInboundPage.sendStep.getDocuments('Packing List').click();
      const popup = await popupPromise;
      const downloadPromise = popup.waitForEvent('download');
      const download = await downloadPromise;
      await popup.close();
      await expect(download.suggestedFilename()).toMatch(
        /^Packing List - .*\.xls(x)?$/
      );
    });
  });
});
