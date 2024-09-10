[Back to README](/README.md)

# Authentication Setup for Tests

> **[!IMPORTANT]** For more information please refer to the [playwright authetication documentation](https://playwright.dev/docs/auth) since the implementation for user authentication was done based on the provided examples in the official playwright documentation.

Before executing the test suite, an authentication setup script (`auth.setup.ts`) is run to initialize user credentials provided in the `.env` file. The process involves the following steps:

1. **User Login:** Each user, defined by their _username_ and _password_ in the `.env` file, is logged into the application.
```ts
await loginPage.goToPage();

await loginPage.fillLoginForm(user.username, user.password);
await loginPage.loginButton.click();
```

2. **Main Location Access:** After successful login, each user is directed to the main location specified in the `.env` file.
```ts
const { data: location } = await locationService.getLocation(
    AppConfig.instance.locations['main'].id
);
await locationChooser.getOrganization(location.organization?.name).click();
await locationChooser.getLocation(location.name).click();

await navbar.isLoaded();
```

3. **User ID Extraction:** Since the `.env` file contains only the username and password, the script extracts the user ID from the `getLoggedInUser()` response and writes it to `.data.json` file. <br>This user ID can be useful to us in scenarios where we interact with the API directly and are required to pass a user id to the payload.

```ts
const loggedInUser = await genericService.getLoggedInUser();

const data = readFile(AppConfig.TEST_DATA_FILE_PATH) || {};

data.users = { ...data?.users };
data.users[`${name}`] = loggedInUser.id;

writeToFile(AppConfig.TEST_DATA_FILE_PATH, data);
```


4. **Save Current Authenticated Session In A File:** Based on the example showed in [playwright authetication documentation](https://playwright.dev/docs/auth), after succesful login we save current session in a file _(path to the file is specified in the `AppConfig` under each user `storageFileName` porperty [read more](/documentation/ApplicationConfiguration.md#user-configuration))_ <br>
Later we can use these sessions to open browsers in already logged in users.

```ts
await page.context().storageState({ path: user.storagePath });
```

## Usage

### Start the test with a different user

```ts
import AppConfig from '@/config/AppConfig';

test.describe('Log in as alt user', () => {
    const altUser = AppConfig.instance.users.alternative;
    // indicate that we want to use altUser saved storage file in the following describe block 
    test.use({ storageState: altUser.storageFileName });

    test('example test with alt user' async ({ page }) => {
        // test starts with alt user already logged in
        await page.goTo('./stockMovement?direction=INBOUND');
        ...
    });

    ...
})
```


### Login as a differnt user in the middle of the test.

```ts
test('example test with alt user' async ({ page, altUserContext }) => {
    // go to inbound list page as main user
    await page.goTo('./stockMovement?direction=INBOUND');

    // creates a new page with alt user session in use
    const altUserPage = altUserContext.newPage();

    // go to outbound list page as lat user
    await altUserPage.goTo('./stockMovement?direction=OUTBOUND');
    ...
});
```

## [!IMPORTANT] Try to avoid loggin out from a user
When ever we want to have a differnt user to log in, **always** open a fresh new window (create a new context and a new page) and log in manually.
If we log out from the user it will remove the active session and we will not be able to use the user sessions that we have stored before executing all of the tests.