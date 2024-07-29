import { expect, test } from '@/fixtures/fixtures';
import { StockMovementResponse } from '@/types';
import { formatDate, getDayOfMonth, getToday } from '@/utils/DateUtils';

test('Clicking clear button should clear all of the editable filters', async ({
  inboundListPage,
  supplierLocationService,
  mainLocationService,
  genericService,
}) => {
  const mainLocation = await mainLocationService.getLocation();
  const supplierLocation = await supplierLocationService.getLocation();
  const user = await genericService.getLoggedInUser();
  const TODAY = getToday();

  const filters = {
    search: 'TEST',
    receiptStatus: 'Created',
    destination: mainLocation.name,
    origin: supplierLocation.name,
    shipmentType: 'Air',
    requestedBy: user.name,
    createdBy: user.name,
    updatedBy: user.name,
    createdAfter: TODAY,
    createdBefore: TODAY,
  };

  await test.step('Go to inbound list page', async () => {
    await inboundListPage.goToPage();
  });

  await test.step('Fill search filter', async () => {
    await inboundListPage.filters.searchField.textbox.fill(filters.search);
  });

  await test.step('Fill receipt status filter', async () => {
    await inboundListPage.filters.receiptStatusSelect.click();
    await inboundListPage.filters.receiptStatusSelect
      .getSelectOption(filters.receiptStatus)
      .click();
  });

  await test.step('Fill origin filter', async () => {
    await inboundListPage.filters.originSelect.findAndSelectOption(
      supplierLocation.name
    );
  });

  await test.step('Fill shipment type filter', async () => {
    await inboundListPage.filters.shipmentTypeSelect.click();
    await inboundListPage.filters.shipmentTypeSelect
      .getSelectOption(filters.shipmentType)
      .click();
  });

  await test.step('Fill requested by filter', async () => {
    await inboundListPage.filters.requestedBySelect.findAndSelectOption(
      user.name
    );
  });

  await test.step('Fill created by filter', async () => {
    await inboundListPage.filters.createdBySelect.findAndSelectOption(
      user.name
    );
  });

  await test.step('Fill updated by filter', async () => {
    await inboundListPage.filters.updatedBySelect.findAndSelectOption(
      user.name
    );
  });

  await test.step('Fill created Before filter', async () => {
    await inboundListPage.filters.createdBeforeDateFilter.click();
    await inboundListPage.filters.createdBeforeDateFilter
      .getMonthDay(getDayOfMonth(filters.createdBefore))
      .click();
  });

  await test.step('Fill created after filter', async () => {
    await inboundListPage.filters.createdAfterDateFilter.click();
    await inboundListPage.filters.createdAfterDateFilter
      .getMonthDay(getDayOfMonth(filters.createdAfter))
      .click();
  });

  await test.step('Assert that all filters are filled', async () => {
    await expect(inboundListPage.filters.searchField.textbox).toHaveValue(
      filters.search
    );
    await expect(
      inboundListPage.filters.receiptStatusSelect.countIndicator
    ).toBeVisible();
    await expect(inboundListPage.filters.originSelect.field).toContainText(
      filters.origin
    );
    await expect(inboundListPage.filters.destinationSelect.field).toContainText(
      filters.destination
    );
    await expect(
      inboundListPage.filters.shipmentTypeSelect.countIndicator
    ).toBeVisible();
    await expect(inboundListPage.filters.requestedBySelect.field).toContainText(
      filters.requestedBy
    );
    await expect(inboundListPage.filters.createdBySelect.field).toContainText(
      filters.createdBy
    );
    await expect(inboundListPage.filters.updatedBySelect.field).toContainText(
      filters.updatedBy
    );
    await expect(
      inboundListPage.filters.createdAfterDateFilter.field
    ).toContainText(formatDate(filters.createdAfter));
    await expect(
      inboundListPage.filters.createdBeforeDateFilter.field
    ).toContainText(formatDate(filters.createdBefore));
  });

  await test.step('Clear filters', async () => {
    await inboundListPage.filters.clearButton.click();
  });

  await test.step('Assert that destination filter is not cleared', async () => {
    await expect(inboundListPage.filters.destinationSelect.field).toContainText(
      filters.destination
    );
  });

  await test.step('Assert that all filteres are cleared', async () => {
    await expect(inboundListPage.filters.searchField.textbox).not.toHaveValue(
      filters.search
    );
    await expect(
      inboundListPage.filters.receiptStatusSelect.countIndicator
    ).toBeHidden();
    await expect(inboundListPage.filters.originSelect.field).not.toContainText(
      filters.origin
    );
    await expect(
      inboundListPage.filters.shipmentTypeSelect.countIndicator
    ).toBeHidden();
    await expect(
      inboundListPage.filters.requestedBySelect.field
    ).not.toContainText(filters.requestedBy);
    await expect(
      inboundListPage.filters.createdBySelect.field
    ).not.toContainText(filters.createdBy);
    await expect(
      inboundListPage.filters.updatedBySelect.field
    ).not.toContainText(filters.updatedBy);
    await expect(
      inboundListPage.filters.createdAfterDateFilter.field
    ).not.toContainText(formatDate(filters.createdAfter));
    await expect(
      inboundListPage.filters.createdBeforeDateFilter.field
    ).not.toContainText(formatDate(filters.createdBefore));
  });
});

test('"Destination" filter should be disabled', async ({ inboundListPage }) => {
  await test.step('Go to inbound list page', async () => {
    await inboundListPage.goToPage();
  });

  await inboundListPage.filters.destinationSelect.assertDisabled();
});

test.describe('Switch locations on inbound list page', () => {
  let STOCK_MOVEMENT: StockMovementResponse;

  test.beforeEach(async ({ supplierLocationService, stockMovementService }) => {
    const supplierLocation = await supplierLocationService.getLocation();

    STOCK_MOVEMENT = await stockMovementService.createInbound({
      originId: supplierLocation.id,
    });
  });

  test.afterEach(
    async ({
      stockMovementService,
      navbar,
      locationChooser,
      mainLocationService,
      inboundListPage,
    }) => {
      await stockMovementService.deleteStockMovement(STOCK_MOVEMENT.id);

      await inboundListPage.goToPage();

      const location = await mainLocationService.getLocation();

      await test.step('Switch to other depot location', async () => {
        await navbar.locationChooserButton.click();
        await locationChooser
          .getOrganization(location.organization?.name as string)
          .click();
        await locationChooser.getLocation(location.name).click();
      });
    }
  );

  test('Destination filter should change to current logged in location', async ({
    inboundListPage,
    mainLocationService,
    depotLocationService,
    navbar,
    locationChooser,
  }) => {
    const mainLocation = await mainLocationService.getLocation();
    const depotLocation = await depotLocationService.getLocation();

    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Assert that destination filter is fillted with current logged in location', async () => {
      await expect(
        inboundListPage.filters.destinationSelect.field
      ).toContainText(mainLocation.name);
    });

    await test.step('Switch to other depot location', async () => {
      await navbar.locationChooserButton.click();
      await locationChooser
        .getOrganization(depotLocation.organization?.name as string)
        .click();
      await locationChooser.getLocation(depotLocation.name).click();
    });

    await test.step('Assert that destination filter is fillted with current logged in location', async () => {
      await expect(
        inboundListPage.filters.destinationSelect.field
      ).toContainText(depotLocation.name);
    });
  });

  test('All editable fields should be cleared when switching a location', async ({
    inboundListPage,
    supplierLocationService,
    mainLocationService,
    depotLocationService,
    genericService,
    locationChooser,
    navbar,
  }) => {
    const mainLocation = await mainLocationService.getLocation();
    const depotLocation = await depotLocationService.getLocation();
    const supplierLocation = await supplierLocationService.getLocation();
    const user = await genericService.getLoggedInUser();
    const TODAY = getToday();

    const filters = {
      search: 'TEST',
      receiptStatus: 'Created',
      destination: mainLocation.name,
      origin: supplierLocation.name,
      shipmentType: 'Air',
      requestedBy: user.name,
      createdBy: user.name,
      updatedBy: user.name,
      createdAfter: TODAY,
      createdBefore: TODAY,
    };

    await test.step('Go to inbound list page', async () => {
      await inboundListPage.goToPage();
    });

    await test.step('Assert that created stock movement is visible in the table', async () => {
      await expect(inboundListPage.table.table).toContainText(
        STOCK_MOVEMENT.identifier
      );
    });

    await test.step('Fill search filter', async () => {
      await inboundListPage.filters.searchField.textbox.fill(filters.search);
    });

    await test.step('Fill receipt status filter', async () => {
      await inboundListPage.filters.receiptStatusSelect.click();
      await inboundListPage.filters.receiptStatusSelect
        .getSelectOption(filters.receiptStatus)
        .click();
    });

    await test.step('Fill origin filter', async () => {
      await inboundListPage.filters.originSelect.findAndSelectOption(
        supplierLocation.name
      );
    });

    await test.step('Fill shipment type filter', async () => {
      await inboundListPage.filters.shipmentTypeSelect.click();
      await inboundListPage.filters.shipmentTypeSelect
        .getSelectOption(filters.shipmentType)
        .click();
    });

    await test.step('Fill requested by filter', async () => {
      await inboundListPage.filters.requestedBySelect.findAndSelectOption(
        user.name
      );
    });

    await test.step('Fill created by filter', async () => {
      await inboundListPage.filters.createdBySelect.findAndSelectOption(
        user.name
      );
    });

    await test.step('Fill updated by filter', async () => {
      await inboundListPage.filters.updatedBySelect.findAndSelectOption(
        user.name
      );
    });

    await test.step('Fill created Before filter', async () => {
      await inboundListPage.filters.createdBeforeDateFilter.click();
      await inboundListPage.filters.createdBeforeDateFilter
        .getMonthDay(getDayOfMonth(filters.createdBefore))
        .click();
    });

    await test.step('Fill created after filter', async () => {
      await inboundListPage.filters.createdAfterDateFilter.click();
      await inboundListPage.filters.createdAfterDateFilter
        .getMonthDay(getDayOfMonth(filters.createdAfter))
        .click();
    });

    await test.step('Assert that all filters are filled', async () => {
      await expect(inboundListPage.filters.searchField.textbox).toHaveValue(
        filters.search
      );
      await expect(
        inboundListPage.filters.receiptStatusSelect.countIndicator
      ).toBeVisible();
      await expect(inboundListPage.filters.originSelect.field).toContainText(
        filters.origin
      );
      await expect(
        inboundListPage.filters.shipmentTypeSelect.countIndicator
      ).toBeVisible();
      await expect(
        inboundListPage.filters.requestedBySelect.field
      ).toContainText(filters.requestedBy);
      await expect(inboundListPage.filters.createdBySelect.field).toContainText(
        filters.createdBy
      );
      await expect(inboundListPage.filters.updatedBySelect.field).toContainText(
        filters.updatedBy
      );
      await expect(
        inboundListPage.filters.createdAfterDateFilter.field
      ).toContainText(formatDate(filters.createdAfter));
      await expect(
        inboundListPage.filters.createdBeforeDateFilter.field
      ).toContainText(formatDate(filters.createdBefore));
    });

    await test.step('Switch to other depot location', async () => {
      await navbar.locationChooserButton.click();
      await locationChooser
        .getOrganization(depotLocation.organization?.name as string)
        .click();
      await locationChooser.getLocation(depotLocation.name).click();
    });

    await test.step('Assert that created stock movement is visible in the table', async () => {
      await expect(inboundListPage.table.table).not.toContainText(
        STOCK_MOVEMENT.identifier
      );
    });
  });
});
