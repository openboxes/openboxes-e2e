import BasePageModel from '@/pages/BasePageModel';

class SendStep extends BasePageModel {
  get sendShipmentButton() {
    return this.page.getByRole('textbox', { name: 'Send shipment' });
  }
}

export default SendStep;
