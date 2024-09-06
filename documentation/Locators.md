

To implement a locator we have many different approaches. but the most common are: **Test Ids**, **Accessabiulity Attributes**, **CSS class selectors**

### CSS class selectors 
This approach is not verry reliable and can result in lots of false positive test.
When delaing with class selectors it is verry common that we get the following locator

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

```ts
this.page.locatior('.inbound-create-page > form .form-input:nth-child(2)');
```
These kinds of selectors are less reliable since the UI could change a little, like using a different styling class or library, or moving the order of the elements which will result in failed tests. Although this appraoch is not avisible, sometimes we have no other way to modify the compoennt and add any accessability attribute sor test id's and we have to resort to this appraoch.

### Test Ids
Test Ids are a common way in frontend testing to tag an element with an id whcih we can directly access without comming up with complicated css selector paths.
These ids are a basic html data attributes that are defined the following way

```html
<div>
    <input type="text" name="username">   
    <span data-testid="error-message">input error message</span>
<div>
```
and which can be accessed the following way
```ts
this.page.getByTestId('error-message');
```

### Accessabiulity Attributes
Using accessability attributes is a preferred way of writing locators whcih is even suggested by the official [playwright documentation ](https://playwright.dev/docs/api/class-locator).

Give we have the following html document

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