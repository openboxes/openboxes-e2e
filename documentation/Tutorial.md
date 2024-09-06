[Back to README](/README.md)

# Imeplement a simple test

Lets try to implement the following test

**Create an Inbound Stock Movement and send it**
1. Go to create inbound page
2. Fill all required fields on Create step
3. Click Next to Add items
4. Add some items ot the table with proper quantity
5. Click Next to Send step
6. Fill All required fi fields on Sen step
7. Click send shipment Butotn

## Test skeleton
Let's start by preparing a test skeleton and breaking down each step, which we will implement later. We can use the [step](https://playwright.dev/docs/api/class-test#test-step) method to divide a test into "steps" that the test will follow. These steps are useful for grouping actions into organized blocks. Additionally, they make Playwright's reports easier to navigate, as it's simpler to identify which section of the test has failed.

> **[!IMPORTANT]** Note that we are importing the test object from `@/fixtures/fixtures` instead of `@playwright/test` to access our Page Object Model (POM) instances. [(Read more)](/documentation/Fixtures.md)

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
<br>Additionally, since we expect to implement multiple pages for inbound workflow lets create an organized hiehrachy and create the POM for `CreateInboundPage.ts` in the following path `src/pages/inbound/create`

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

Looking at the page that we have navigated to we have to access all of the required fields and fill in values, lets implement lcoators for these element in our page class.

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

>The above locators are a simplified versions of the ones we currently use in the application. Some components are a lot more complicated than a simple input and require a little more implementation into different parts of the _Input field_ or _Select Field_ which is why we create seperate components that we can later reuse in tests like `Select` from `'@/components/Select'` or `TextField` from  `'@/components/TextField'`.
<br>These components are design in a similar way to the POM page classes and hold all of the methods to access differnt little parts of the components itself.
<br><br>For the sake of this tutorial I have simplifie dthe implementation of the text fields to simple inputs, if you want to see an actuall example of usage of these form inputs then look in the actuall implemenatation of the tests.

Now with the element locators are implemented lets use them ina  test

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

Moving on to the next step (Add items), we have to select the product name and quantity for the line item.

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
> Just like in the previous example I am simplifying selectors for these components for the sake of this tutorial, but a generic component for handling table locators is implemented and you can see it in the `/components` directory.

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

Now at the final step we need to select a _shipment type_ and _expected delivery date_

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
Now lets use these elements in the test

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

This is the whole test with all previously implemented steps combined.

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

Here is a Create Inbound Page POM class with all of the locators.

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

Although at the moment this classs is not that big it will definetely get bigger and we can improve it a bit by moving certain methos and values to smaller classes which will be called within this main create inbound page class.
<br>
Lets create 3 classes for each of the steps `CreateStep`, `AddItemsStep` and `SendShipmentStep`

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

And now lets glue everything together in the main Create Inbound Page.

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

Now since we have modified the `CreateInboundPage` we have to fix the methods whcih were called in the test.


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
Now when looking at the test we have a little bit more context to the are that the element is located and with smaller classes it will be easier to find and maintain legacy code.

## Handling test data

You may have noticed that in the example test, we used some hardcoded data, such as the _product code_ **10001** or origin _location_ **Imres**. However, we cannot guarantee that this data will exist in every instance of the OpenBoxes application. Therefore, we need to ensure its availability by either verifying its existence or creating it ourselves.

For more information on how to set up and validate this data, refer to the [Data Setup documentation](/documentation/DataSetup.md).

To ensure that the test data is dynamic and fetched from the server rather than using hardcoded values, we can retrieve the necessary data before the test execution. This allows us to work with real, up-to-date values and avoid issues caused by missing or inconsistent data.

Here’s how we can implement it:

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