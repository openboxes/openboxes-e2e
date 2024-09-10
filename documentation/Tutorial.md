[↩️ Back to README](/README.md)

# 🗒️ Imeplement a test

Lets try to implement the following test


## Prerequisites
Before running the test, ensure that you have:
1. Properly set up the required environment variables.
2. Installed all necessary dependencies for Playwright to function correctly.

## Test Overview
### Test Objective:

1. Create an inbound stock movement.
2. Add line items to the movement.
3. Send the movement.

### Steps Overview
1. Navigate to the Create Inbound Stock Movement page.
2. Complete the Create Step form.
3. Add line items in the Add Items Step.
4. Fill out details in the Send Step and send the shipment.

## Test skeleton
Let's start by preparing a test skeleton and breaking down each step, which we will implement later. We can use the [step](https://playwright.dev/docs/api/class-test#test-step) method to divide a test into "steps" that the test will follow. These steps are useful for grouping actions into organized blocks. Additionally, they make Playwright's reports easier to navigate, as it's simpler to identify which section of the test has failed.

> **❗IMPORTANT**: Note that we are importing the test object from `@/fixtures/fixtures` instead of `@playwright/test` to access our Page Object Model (POM) instances. [(Read more)](/documentation/Fixtures.md)

```ts
import { test } from '@/fixtures/fixtures';
import { expect } from '@playwright/test';

test('create inbound stock movement and send it', async () => {
    await test.step('Go to create inbound page', async () => {
        // TBI...
    });

    await test.step('Fill out values on "Create" step', async () => {
        // TBI...
    });

    await test.step('Go next step (Add items)', async () => {
        // TBI...
    });

    await test.step('Add line item (Add items)', async () => {
        // TBI...
    });

    await test.step('Go to next step (Send)', async () => {
        // TBI...
    });

    await test.step('Fill out fields on send step', async () => {
        // TBI...
    });

    await test.step('Send shipment', async () => {
        // TBI...
    });
});
```
## Implement Inbound Create Page POM

Each page should have it's own [Page Object Model](https://playwright.dev/docs/pom) class which we have defined in `src/pages`. Since Inbound is a larger feature and has more pages like _List Page_, _Create Page_ etc.. lets create a folder inbound where we will house all of our inbound related pages.
<br>Additionally, since we expect to implement multiple pages for inbound workflow lets put the `CreateInboundPage.ts` in the following path `src/pages/inbound/create`

```ts
import BasePageModel from '@/pages/BasePageModel';

class CreateInboundPage extends BasePageModel {
    // TBI...
}

export default CreateInboundPage;
```

## "Go to create inboudn page"

To navigate to a specific page, use the `page.goto('/path')` method. It's best to define this as a method in the Page class itself, so URLs can be managed more easily.

We have access to the `page` object in our class thanks to extending our class with `BasePageModel`.
```ts
class CreateInboundPage extends BasePageModel {
    async goToPage() {
        await this.page.goto('./stockMovement/createInbound?direction=INBOUND');
    }
}
```
> The provided path will be concatenated with the base url provided in the `.env` file.

Now, let's use this class method in the test:
```ts
import CreateInboundPage from '@/pages/inbound/create/CreateInboundPage';

test('create inbound stock movement and send it', async ({ page }) => {
    await test.step('Go to create inbound page', async ({ page }) => {
        const createInboundPage = new CreateInboundPage(page);
        await createInboundPage.goToPage();
    });
});

```

We can further improve this test by using [Fixtures](/documentation/Fixtures.md).

First, import `CreateInboundPage` in `fixtures.ts`:

```ts
import CreateInboundPage from '@/pages/inbound/create/CreateInboundPage';

export const test = baseTest.extend<Fixtures>({
  createInboundPage: async ({ page }, use) =>  use(new CreateInboundPage(page))
});
```

Now, since we are using the `test` instance from `@/fixtures/fixtures`, we have direct access to `createInboundPage` in our test properties, allowing us to simplify the code:

```ts
test('create inbound stock movement and send it', async ({ createInboundPage }) => {
    await test.step('Go to create inbound page', async () => {
        await createInboundPage.goToPage();
    });
});
```

## Fill out values on "Create" step and "Go to next step"

Looking at the page that we have navigated to we have to access all of the required fields and fill in the values. Lets implement locators for these element in our page class.

![image](/documentation/images/inbound-create-step.png)

> For more information on writing locators [(read more)](/documentation/Locators.md)

```ts
class CreateInboundPage extends BasePageModel {
  
    ...

    get descriptionField() {
        return this.page.getByRole('textbox', { name: 'Description' });
    }

    get originField() {
        return this.page.getByRole('textbox', { name: 'Origin' });
    }

    get requestedByField() {
        return this.page.getByRole('textbox', { name: 'Requested By' });
    }

    get dateRequestedField() {
        return this.page.getByRole('textbox', { name: 'Date Requested' });
    }

    get nextButton() {
        return this.page.getByRole('button', { name: 'Next' });
    }
}
```

>The locators presented above are simplified versions of those used in our application. In practice, many components are far more complex than simple input fields and require more detailed implementation to handle various aspects of elements like an Input Field or a Select Field. For this reason, we create separate reusable components, such as `Select` from `'@/components/Select'` or `TextField` from `'@/components/TextField'`.

Now that we have our simplified locators in place, it's time to incorporate them into a test

```ts
test('create inbound stock movement and send it', async ({ createInboundPage }) => {

    ...

    await test.step('Fill out values on "Create" step', async () => {
        await createInboundPage.descriptionField.fill('text description');
        await createInboundPage.originField.fill('Imres');
        await createInboundPage.requestedByField.fill('Test User');
        await createInboundPage.dateRequestedField.fill('09/05/2024');
    });

    await test.step('Go next step (Add items)', async () => {
        await createInboundPage.nextButton.click();
    });
});
```

## "Add line item" (Add items) and go to next step ""

Now that we've moved on to the next step of adding items, we need to automate the selection of both the product name and quantity for each line item in the form.

To do this, we will follow a structured approach using the component-based locators we established earlier, ensuring that the logic remains reusable and maintainable.

![image](/documentation/images/inbound-add-items-step.png)

```ts
class CreateInboundPage extends BasePageModel {
  
    ...

    get getTable() {
        return this.page.getBytestId('data-table');
    }

    async getProductFieldInRow(row: number) {
        return this.table
            .getByTestId('table-row')
            .nth(row)
            .getByRole('textbox', { name: 'Product' });
    }

    async getQuantityFieldInRow(row: number) {
        return this.table
            .getByTestId('table-row')
            .nth(row)
            .getByRole('textbox', { name: 'Product' });
    }

}
```
> Just like in the previous example, I am simplifying the selectors for these components for the sake of this tutorial. However, a more generic component for handling table locators has been implemented, and you can find it in the `src/components` directory.

```ts
test('create inbound stock movement and send it', async ({ createInboundPage }) => {

    ...

    await test.step('Add line item (Add items)', async () => {
        await createInboundPage.getProductFieldInRow(0).fill('10001');
        await createInboundPage.getQuantityFieldInRow(0).fill('23');
    });

    await test.step('Go to next step (Send)', async () => {
        await createInboundPage.nextButton.click();
    });
});
```

## Fill out fields on send step and send shipment

Now, in the final step, we need to automate the selection of both the _shipment type_ and the _expected delivery date_. These are required fields for completing the form. We'll use locators to interact with the dropdown for shipment types and the date picker for the delivery date.

![alt text](/documentation/images/inbound-send-step.png)

```ts
class CreateInboundPage extends BasePageModel {
  
    ...

    get shipmentTypeSelect() {
        return this.page.getByTestId('select-element');
    }

    get shipmentTypeSelectDropdown() {
        return this.shipmentTypeSelect.getByTestId('select-menu-dropdown');
    }

    get expectedDeliveryDate() {
        return this.page.getByRole('textbox', { name: 'EXPECTED DELIVERY DATE' });
    }

    get sendShipmentButton() {
        return this.getByRole('button', { name: 'Send shipment' });
    }

}

```
Now let's incorporate these elements into the test.

```ts
test('create inbound stock movement and send it', async ({ createInboundPage }) => {

    ...

    await test.step('Fill out fields on send step', async () => {

        await createInboundPage.shipmentTypeSelect.click();
        await createInboundPage.shipmentTypeSelectDropdown.getByText('Sea').click();

        await createInboundPage.expectedDeliveryDate.fill('09/05/2024');
    });

    await test.step('Send Shipment', async () => {
        await createInboundPage.sendShipmentButton.click();
    });
});
```

## Test overview

Great! Below is the full Playwright test, combining all the previously implemented steps, including input field handling, item selection, and the final shipment selection and expected delivery date:

```ts
import { test } from '@/fixtures/fixtures';
import { expect } from '@playwright/test';

test('create inbound stock movement and send it', async ({ createInboundPage }) => {
    await test.step('Go to create inbound page', async () => {
        await createInboundPage.goToPage();
    });

    await test.step('Fill out values on "Create" step', async () => {
        await createInboundPage.descriptionField.fill('text description');
        await createInboundPage.originField.fill('Imres');
        await createInboundPage.requestedByField.fill('Test User');
        await createInboundPage.dateRequestedField.fill('09/05/2024');
    });

    await test.step('Go next step (Add items)', async () => {
        await createInboundPage.nextButton.click();
    });

    await test.step('Add line item (Add items)', async () => {
        await createInboundPage.getProductFieldInRow(0).fill('10001');
        await createInboundPage.getQuantityFieldInRow(0).fill('23');
    });

    await test.step('Go to next step (Send)', async () => {
        await createInboundPage.nextButton.click();
    });

    await test.step('Fill out fields on send step', async () => {

        await createInboundPage.shipmentTypeSelect.click();
        await createInboundPage.shipmentTypeSelectDropdown.getByText('Sea').click();

        await createInboundPage.expectedDeliveryDate.fill('09/05/2024');
    });

    await test.step('Send Shipment', async () => {
        await createInboundPage.sendShipmentButton.click();
    });
});
```

## Inbound Create Page POM overview

Here is a Create Inbound Page POM class with all of the previously implemented locators.

```ts
import BasePageModel from '@/pages/BasePageModel';

class CreateInboundPage extends BasePageModel {
    async goToPage() {
        await this.page.goto('./stockMovement/createInbound?direction=INBOUND');
    }

     get descriptionField() {
        return this.page.getByRole('textbox', { name: 'Description' });
    }

    get originField() {
        return this.page.getByRole('textbox', { name: 'Origin' });
    }

    get requestedByField() {
        return this.page.getByRole('textbox', { name: 'Requested By' });
    }

    get dateRequestedField() {
        return this.page.getByRole('textbox', { name: 'Date Requested' });
    }

    get nextButton() {
        return this.page.getByRole('button', { name: 'Next' });
    }

    get getTable() {
        return this.page.getBytestId('data-table');
    }

    async getProductFieldInRow(row: number) {
        return this.table
            .getByTestId('table-row')
            .nth(row)
            .getByRole('textbox', { name: 'Product' });
    }

    async getQuantityFieldInRow(row: number) {
        return this.table
            .getByTestId('table-row')
            .nth(row)
            .getByRole('textbox', { name: 'Product' });
    }

    get shipmentTypeSelect() {
        return this.page.getByTestId('select-element');
    }

    get shipmentTypeSelectDropdown() {
        return this.shipmentTypeSelect.getByTestId('select-menu-dropdown');
    }

    get expectedDeliveryDate() {
        return this.page.getByRole('textbox', { name: 'EXPECTED DELIVERY DATE' });
    }

    get sendShipmentButton() {
        return this.getByRole('button', { name: 'Send shipment' });
    }
}

export default CreateInboundPage;
```

## Improvements

To make the code more maintainable and scalable, we can break down the `CreateInboundPage` into three smaller classes: `CreateStep`, `AddItemsStep`, and `SendShipmentStep`. Each class will encapsulate the functionality related to a specific step, and the main `CreateInboundPage` class will interact with them.

Here’s how you can refactor the CreateInboundPage class:

`CreateStep.ts`

```ts
import BasePageModel from '@/pages/BasePageModel';

class CreateStep extends BasePageModel {

    get descriptionField() {
        return this.page.getByRole('textbox', { name: 'Description' });
    }

    get originField() {
        return this.page.getByRole('textbox', { name: 'Origin' });
    }

    get requestedByField() {
        return this.page.getByRole('textbox', { name: 'Requested By' });
    }

    get dateRequestedField() {
        return this.page.getByRole('textbox', { name: 'Date Requested' });
    }

    get nextButton() {
        return this.page.getByRole('button', { name: 'Next' });
    }
}

export default CreateStep;
```

`AddItemsStep.ts`

```ts
import BasePageModel from '@/pages/BasePageModel';

class AddItemsStep extends BasePageModel {
    get nextButton() {
        return this.page.getByRole('button', { name: 'Next' });
    }

    get getTable() {
        return this.page.getBytestId('data-table');
    }

    async getProductFieldInRow(row: number) {
        return this.table
            .getByTestId('table-row')
            .nth(row)
            .getByRole('textbox', { name: 'Product' });
    }

    async getQuantityFieldInRow(row: number) {
        return this.table
            .getByTestId('table-row')
            .nth(row)
            .getByRole('textbox', { name: 'Product' });
    }
}

export default AddItemsStep;
```

`SendShipmentStep.ts`
```ts
import BasePageModel from '@/pages/BasePageModel';

class SendShipmentStep extends BasePageModel {
    get shipmentTypeSelect() {
        return this.page.getByTestId('select-element');
    }

    get shipmentTypeSelectDropdown() {
        return this.shipmentTypeSelect.getByTestId('select-menu-dropdown');
    }

    get expectedDeliveryDate() {
        return this.page.getByRole('textbox', { name: 'EXPECTED DELIVERY DATE' });
    }

    get sendShipmentButton() {
        return this.getByRole('button', { name: 'Send shipment' });
    }
}

export default SendShipmentStep;
```

And now lets glue everything together in the main **Create Inbound Page**.

`CreateInboundPage.ts`
```ts
import BasePageModel from '@/pages/BasePageModel';

class CreateInboundPage extends BasePageModel {
   
    createStep: CreateStep;
    addItemsStep: AddItemsStep;
    sendShipmentStep: SendShipmentStep;
   
   async goToPage() {
        await this.page.goto('./stockMovement/createInbound?direction=INBOUND');
    }

}

export default CreateInboundPage;
```

With the refactored `CreateInboundPage`, you'll need to update the test methods to utilize the new structure. Here’s how you can adjust the test to use the smaller step classes (`CreateStep`, `AddItemsStep`, and `SendShipmentStep`) through the `CreateInboundPage` class:


```ts
import { test } from '@/fixtures/fixtures';
import { expect } from '@playwright/test';

test('create inbound stock movement and send it', async ({ createInboundPage }) => {
    await test.step('Go to create inbound page', async () => {
        await createInboundPage.goToPage();
    });

    await test.step('Fill out values on "Create" step', async () => {
        await createInboundPage.createStep.descriptionField.fill('text description');
        await createInboundPage.createStep.originField.fill('Imres');
        await createInboundPage.createStep.requestedByField.fill('Test User');
        await createInboundPage.createStep.dateRequestedField.fill('09/05/2024');
    });

    await test.step('Go next step (Add items)', async () => {
        await createInboundPage.createStep.nextButton.click();
    });

    await test.step('Add line item (Add items)', async () => {
        await createInboundPage.addItemsStep.getProductFieldInRow(0).fill('10001');
        await createInboundPage.addItemsStep.getQuantityFieldInRow(0).fill('23');
    });

    await test.step('Go to next step (Send)', async () => {
        await createInboundPage.addItemsStep.nextButton.click();
    });

    await test.step('Fill out fields on send step', async () => {
        await createInboundPage.sendShipmentStep.shipmentTypeSelect.click();
        await createInboundPage.sendShipmentStep.shipmentTypeSelectDropdown.getByText('Sea').click();

        await createInboundPage.sendShipmentStep.expectedDeliveryDate.fill('09/05/2024');
    });

    await test.step('Send Shipment', async () => {
        await createInboundPage.sendShipmentStep.sendShipmentButton.click();
    });
});
```
By breaking down the CreateInboundPage into smaller, more focused classes, you gain several advantages:

1. **Increased Readability**: Each class handles a specific part of the form, making it clearer what each section of the form does. This helps anyone reading the test understand the context of each action better.

2. **Easier Maintenance**: Smaller classes that encapsulate specific functionality make it easier to manage changes. If a form field or component changes, you only need to update the relevant class rather than sifting through a large, monolithic class.

3. **Enhanced Reusability**: By creating modular classes for each step of the process, you can reuse them in different tests or scenarios. This reduces duplication and keeps your test suite DRY (Don’t Repeat Yourself).

4. **Improved Legacy Code Management**: When dealing with legacy systems, having a structured approach like this can simplify updates and debugging. You can easily locate which part of the page is being interacted with and make necessary adjustments without impacting other parts

## Handling test data

In the example test, you might have observed that we used hardcoded data, such as the product code _10001_ and the origin location _Imres_. However, relying on hardcoded values can be problematic since this data may not be present in every instance of the OpenBoxes application. To address this, it is crucial to verify the existence of the required data or to create it as needed.

For detailed instructions on setting up and validating test data, please refer to the [Data Setup documentation](/documentation/DataSetup.md).

To ensure that your test data is dynamic and up-to-date, it is recommended to fetch the necessary data from the server prior to test execution. This approach helps you work with real, current values and prevents issues related to missing or inconsistent data.


```ts
test.describe('create inbound', () => {
    let PRODUCT;
    let USER;
    let ORIGIN;

    test.beforeEach(({ mainProductService, mainUserService, supplierLocationService }) => {
      PRODUCT = await mainProductService.getProduct();
      USER = await mainUserService.getUser();
      ORIGIN = await supplierLocationService.getLocation();
    });

    test('create inbound stock movement and send it ', async ({ createInboundPage }) => {
        await test.step('Go to create inbound page', async () => {
            await createInboundPage.goToPage();
        });

        await test.step('Fill out values on "Create" step', async () => {
            await createInboundPage.createStep.descriptionField.fill('text description');
            await createInboundPage.createStep.originField.fill(ORIGIN.name);
            await createInboundPage.createStep.requestedByField.fill(USER.name);
            await createInboundPage.createStep.dateRequestedField.fill('09/05/2024');
        });

        await test.step('Go next step (Add items)', async () => {
            await createInboundPage.createStep.nextButton.click();
        });

        await test.step('Add line item (Add items)', async () => {
            await createInboundPage.addItemsStep.getProductFieldInRow(0).fill(PRODUCT.productCode);
            await createInboundPage.addItemsStep.getQuantityFieldInRow(0).fill('23');
        });

        await test.step('Go to next step (Send)', async () => {
            await createInboundPage.addItemsStep.nextButton.click();
        });

        await test.step('Fill out fields on send step', async () => {
            await createInboundPage.sendShipmentStep.shipmentTypeSelect.click();
            await createInboundPage.sendShipmentStep.shipmentTypeSelectDropdown.getByText('Sea').click();

            await createInboundPage.sendShipmentStep.expectedDeliveryDate.fill('09/05/2024');
        });

        await test.step('Send Shipment', async () => {
            await createInboundPage.sendShipmentStep.sendShipmentButton.click();
        });
    });
})

```