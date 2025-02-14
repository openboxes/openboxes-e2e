import { expect } from '@playwright/test';

import BasePageModel from '@/pages/BasePageModel';

class Navbar extends BasePageModel {
  get navbar() {
    return this.page.getByRole('navigation', { name: 'main' });
  }

  get locationChooserButton() {
    return this.navbar.getByLabel('location-chooser');
  }

  get profileButton() {
    return this.navbar.getByLabel('profile');
  }

  async isLoaded() {
    await expect(this.navbar).toBeVisible();
  }

  get configurationButton() {
    return this.navbar.getByLabel('configuration');
  }

  getNavItem(name: string) {
    return this.navbar.getByRole('menuitem', { name: name, exact: true });
  }

  get editProfileButton() {
    return this.navbar.getByRole('menuitem', { name: 'Edit Profile' });
  }

  // Nav Items
  get dashboard() {
    return this.getNavItem('Dashboard');
  }

  get locationGroup() {
    return this.getNavItem('Location groups');
  }

  get locations() {
    return this.getNavItem('Locations');
  }

  get users() {
    return this.getNavItem('Users');
  }

  get purchasing() {
    return this.getNavItem('Purchasing');
  }

  get listSuppliers() {
    return this.getNavItem('List Suppliers');
  }

  get listPurchaseOrders() {
    return this.getNavItem('List Purchase Orders');
  }

  get organizations() {
    return this.getNavItem('Organizations');
  }

  get outbound() {
    return this.getNavItem('Outbound');
  }

  get createOutboundMovement() {
    return this.getNavItem('Create Outbound Movement');
  }

  get products() {
    return this.getNavItem('Products');
  }

  get listProducts() {
    return this.getNavItem('List Products');
  }
}

export default Navbar;
