/* eslint-disable playwright/no-conditional-in-test */
import { expect, Locator, Page, test } from '@playwright/test';
import _ from 'lodash';

import DatePicker from '@/components/DatePicker';
import Select from '@/components/Select';
import TextField from '@/components/TextField';
import BasePageModel from '@/pages/BasePageModel';
import { CreateInboundAddItemsTableEntity } from '@/types';
import { formatDate } from '@/utils/DateUtils';

class AddItemsTable extends BasePageModel {
  constructor(page: Page) {
    super(page);
  }

  get table() {
    return this.page.getByTestId('items-table');
  }

  get rows() {
    return this.table.getByRole('row');
  }

  row(index: number) {
    return new Row(this.page, this.rows.nth(index));
  }
}

class Row extends BasePageModel {
  row: Locator;
  productSelect: Select;
  recipientSelect: Select;
  expirationDate: DatePicker;
  packLevel1Field: TextField;
  packLevel2Field: TextField;
  lotField: TextField;
  quantityField: TextField;

  constructor(page: Page, row: Locator) {
    super(page);
    this.row = row;
    this.productSelect = new Select(page, 'Product', row);
    this.recipientSelect = new Select(page, 'Recipient', row);
    this.packLevel1Field = new TextField(page, 'Pack level 1', row);
    this.packLevel2Field = new TextField(page, 'Pack level 2', row);
    this.lotField = new TextField(page, 'Lot', row);
    this.quantityField = new TextField(page, 'Quantity', row);
    this.expirationDate = new DatePicker(page, 'Expiry', row);
  }

  get deleteButton() {
    return this.row.getByRole('button', { name: 'Delete' });
  }

  async fillRowValues(rowValues: CreateInboundAddItemsTableEntity) {
    await test.step('Add item to row (Add items)', async () => {
      if (!_.isNil(rowValues.palletName)) {
        await this.packLevel1Field.textbox.fill(rowValues.palletName);
      }
      if (!_.isNil(rowValues.boxName)) {
        await this.packLevel2Field.textbox.fill(rowValues.boxName);
      }
      if (!_.isNil(rowValues.product?.productName)) {
        await this.productSelect.findAndSelectOption(
          rowValues.product?.productName
        );
      }
      if (!_.isNil(rowValues.quantity)) {
        await this.quantityField.numberbox.fill(`${rowValues.quantity}`);
      }
      if (!_.isNil(rowValues.lotNumber)) {
        await this.lotField.textbox.fill(rowValues.lotNumber);
      }
      if (!_.isNil(rowValues.recipient?.name)) {
        await this.recipientSelect.findAndSelectOption(
          rowValues.recipient.name
        );
      }
      if (!_.isNil(rowValues.expirationDate)) {
        await this.expirationDate.fill(rowValues.expirationDate);
      }
    });
  }

  async assertRowValues(rowValues: CreateInboundAddItemsTableEntity) {
    if (!_.isNil(rowValues.palletName)) {
      await test.step('Assert value in pack level 1 field', async () => {
        await expect(this.packLevel1Field.textbox).toHaveValue(
          rowValues.palletName as string
        );
      });
    }

    if (!_.isNil(rowValues.boxName)) {
      await test.step('Assert value in pack level 2 field', async () => {
        await expect(this.packLevel2Field.textbox).toHaveValue(
          rowValues.boxName as string
        );
      });
    }

    await test.step('Assert value in product field', async () => {
      await expect(this.productSelect.selectField).toContainText(
        rowValues.product.productCode
      );
    });

    if (!_.isNil(rowValues.lotNumber)) {
      await test.step('Assert value in lot field', async () => {
        await expect(this.lotField.textbox).toHaveValue(
          rowValues.lotNumber as string
        );
      });
    }

    if (!_.isNil(rowValues.expirationDate)) {
      await test.step('Assert value in expiry date field', async () => {
        await expect(this.expirationDate.textbox).toHaveValue(
          formatDate(rowValues.expirationDate as Date, 'DD/MMM/YYYY')
        );
      });
    }

    await test.step('Assert value in quantity field', async () => {
      await expect(this.quantityField.numberbox).toHaveValue(
        `${rowValues.quantity}`
      );
    });

    if (!_.isNil(rowValues.recipient?.name)) {
      await test.step('Assert value in recipient field', async () => {
        await expect(this.recipientSelect.selectField).toContainText(
          rowValues.recipient?.name as string
        );
      });
    }
  }
}

export default AddItemsTable;
