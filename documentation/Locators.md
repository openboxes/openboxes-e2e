
[↩️ Back to README](/README.md)

# 📍 Locators
To implement a locator we have many different approaches. but the most common are: 
- **Test Ids**
- **Accessabiulity Attributes**
- **CSS class selectors**

### CSS class selectors 
This approach is not verry reliable and can result in lots of false-positive test results.

```html
<div class="inbound-create-page">
    <form>
        <input type="text" name="first-field" class="form-input">   
        <input type="text" name="second-field" class="form-input">   
        <input type="text" name="third-field" class="form-input">   
        <input type="text" name="fourth-field" class="form-input">   
    </form>
<div>
```
When delaing with class selectors it is verry common that we get the following locator

```ts
this.page.locatior('.inbound-create-page > form .form-input:nth-child(2)');
```
Selectors like these can be less stable, as even minor UI changes—such as adjustments in styling, updates to the library, or reordering elements—can cause tests to break. While this approach is generally not recommended due to its fragility, there are instances where modifying the component to add accessibility attributes or test IDs isn't feasible. In such cases, relying on these selectors becomes necessary, though it's important to be aware of the potential for increased maintenance as the UI evolves.

### Test Ids
Test IDs are commonly used in frontend testing to tag elements with unique identifiers, allowing testers to directly target those elements without relying on complex CSS selector paths. These IDs are implemented using basic HTML data attributes, typically defined in the following format:

```html
<div>
    <input type="text" name="username">   
    <span data-testid="error-message">input error message</span>
<div>
```
By incorporating test IDs in this manner, it simplifies test automation and reduces the fragility of tests, as the IDs are less likely to change compared to classes or other attributes tied to the visual design.

```ts
this.page.getByTestId('error-message');
```



### Accessabiulity Attributes

Using accessibility attributes is a preferred method for writing locators, as even recommended by the official [Playwright documentation](https://playwright.dev/docs/api/class-locator). This approach ensures your tests are more reliable, and it improves both the testability and accessibility of the application.

For example, given the following HTML document:

```html
<div class="inbound-create-page">
    <form>
        <input type="text" name="first-field" class="form-input">   
        <input type="text" name="second-field" class="form-input">   
        <input type="text" name="third-field" class="form-input">   
        <input type="text" name="fourth-field" class="form-input">   
    </form>
<div>
```
we can access the field we desire the following way

```ts
this.page.getByRole('textbox', { name: 'third-field' })
```

This approach relies on attributes that are commonly used by screen readers, such as `aria-label`, `name`, `role`, and other accessibility-related attributes. These attributes are designed to provide meaningful context to assistive technologies but also serve as stable, semantic identifiers that can be used in testing.