import { Page } from '@playwright/test';

import DateFilter from '@/components/DateFilter';
import Select from '@/components/Select';
import TextField from '@/components/TextField';
import BasePageModel from '@/pages/BasePageModel';

class InboundListFilters extends BasePageModel {
  searchField: TextField;
  receiptStatusSelect: Select;
  originSelect: Select;
  destinationSelect: Select;
  shipmentTypeSelect: Select;
  requestedBySelect: Select;
  createdBySelect: Select;
  updatedBySelect: Select;
  createdAfterDateFilter: DateFilter;
  createdBeforeDateFilter: DateFilter;

  constructor(page: Page) {
    super(page);
    this.searchField = new TextField(page, 'Search');
    this.receiptStatusSelect = new Select(page, 'Receipt Status');
    this.originSelect = new Select(page, 'Origin');
    this.destinationSelect = new Select(page, 'Destination');
    this.shipmentTypeSelect = new Select(page, 'Shipment type');
    this.requestedBySelect = new Select(page, 'Requested By');
    this.createdBySelect = new Select(page, 'Created By');
    this.updatedBySelect = new Select(page, 'Updated By');
    this.createdAfterDateFilter = new DateFilter(page, 'Created after');
    this.createdBeforeDateFilter = new DateFilter(page, 'Created before');
  }

  get searchButton() {
    return this.page.getByRole('button', { name: 'Search' });
  }

  get clearButton() {
    return this.page.getByRole('button', { name: 'Clear' });
  }
}

export default InboundListFilters;
