[Back to README](/README.md)

> For more information on **Fixtures**, please check out the official playwright [documentation](https://playwright.dev/docs/test-fixtures).

# Fixtures

Fixtures is a neat way for use to make the code a little more DRY and avoid repetitive instantiation of POM object.

So normaly we have import the POM class and create a new instance with passing a `page` of objectas an argument. 

```ts
import ProductShowPage from '@/pages/product/ProductShowPage'

test('example', async ({ page }) => {
    const productShowPage = new ProductShowPage(page);

    await productShowPage.saveButton.click();
    ...
})
```

Instead we can import it in the `fixtures.ts`

```ts
import ProductShowPage from '@/pages/product/ProductShowPage'

export const test = baseTest.extend<Fixtures>({
  productShowPage: async ({ page }, use) => {
    // code before use() will be executed before the test as a setup
    
    const productPageInstance = new ProductShowPage(page);
    // any value passed to use can be extracted from test
    // ('example', ({ productShowPage }) => ...)
    use(productPageInstance)
    
    // code after use() will be executes as cleanup at the end of the test
  }
});
```

and access the `productShowPage` object instance from the properties of the tests

```ts
test('example', async ({ productShowPage }) => {
    await productShowPage.saveButton.click();
    ...
})
```
