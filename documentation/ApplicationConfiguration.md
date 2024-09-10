[↩️ Back to README](/README.md)

# ⚙️ AppConfig Class Documentation

The `AppConfig` class is a singleton configuration manager designed for end-to-end testing. It centralizes configuration details, such as URLs, environment settings, test user credentials, and other configurations needed for running tests. This class ensures that all configurations are loaded from environment variables and are accessible throughout the test suite.

## Reading Environment variables

To access envirnoment variables in any place of the applciation it is suggested to access it through `AppConfig` instance since it handles validation and parsing of these variables.

Lets looks at an example: <br>
One of the required env variables is application base url
`APP_BASE_URL=http://localhost:8080/openboxes/` 
That is read during AppConfig initialization and uses library [env-var](https://www.npmjs.com/package/env-var) to read validate these variables.

Here is an example of **baseUrl** and **CI** variables that are read and assigned as a class property during initialization.

```ts
this.appURL = env.get('APP_BASE_URL').required().asString();
```

As you can see `APP_BASE_URL` is marked as **required** and parsed as a string. By not providing this value in `.env` file application will throw an Exception and fail with a message 

```
EnvVarError: env-var: "APP_BASE_URL" is a required variable, but it was not set
```
<br>

As for `CI` variable, it is a boolean not required whcih has a default value of `false`
```ts
this.isCI = env.get('CI').default('false').asBool();
```

### Usage

Retrieving the Singleton Instance
You can access the AppConfig instance using the static instance getter method. If an instance doesn't already exist, it will be created automatically.

```ts
import AppConfig from '@/config/AppConfig';

test('example test', async ({ page }) => {
    const url = AppConfig.instance.appURL;

    await page.goTo(url);
})
```

## User Configuration

`TestUserConfig` is a utility class that stores all of the configuration related to a user with properties described below.

| | |
| -- | -- |
| **key** | user variable identifier which will be used to access a given user |
| **username** | user username value of the variable provided in `.env` file |
| **password**  | user password value of the variable provided in `.env` file |
| **storageFileName** | path to the file of authenticated session [read more]() |
| **requiredRoles** | exact roles that the provided user is required to have |

> **❗IMPORTANT**: if provided user contains more roles than specified in the config - application will fail

<br>


```ts
this.users = {
    main: new TestUserConfig({
        key: USER_KEY.MAIN,
        username: env.get('USER_MAIN_USERNAME').required().asString(),
        password: env.get('USER_MAIN_PASSWORD').required().asString(),
        storageFileName: '.auth-storage-MAIN-USER.json',
        requiredRoles: new Set([
            RoleType.ROLE_SUPERUSER,
            RoleType.ROLE_FINANCE,
            RoleType.ROLE_PRODUCT_MANAGER,
            RoleType.ROLE_INVOICE,
            RoleType.ROLE_PURCHASE_APPROVER,
        ]),
    }),
}
```

## Location Configuration

`LocationConfig` is a utility class that stores all of the configuration related to a location with properties described below.

| | |
|-- | --|
| **key**  | location variable identifier which will be used to access a given location |
| **required** | boolean value that specifies if **id** and **name** properties are required  |
| **id** | _id_ value of the location that will be used to fetch a given location
| **name** | if existing location is not provided in the `.env` it will create a brand new location based on the specified config with provided **name** ([read more](/documentation/DataSetup.md#data-creation)) |
| **type** | required location type which will be validated before running all of the tests. eg. DEPOT, SUPPLIER etc... |
| **requiredRoles** | exact supported activities that the provided locations is required to have |

> **❗IMPORTANT**: if provided location contains more activities than specified in the config - application will fail

<br>

```ts
this.locations = {
   main: new LocationConfig({
        key: LOCATION_KEY.MAIN,
        id: env.get('LOCATION_MAIN').required().asString(),
        requiredActivityCodes: new Set([
            ActivityCode.MANAGE_INVENTORY,
            ActivityCode.DYNAMIC_CREATION,
            ActivityCode.AUTOSAVE,
            ActivityCode.SUBMIT_REQUEST,
            ActivityCode.SEND_STOCK,
            ActivityCode.PLACE_REQUEST,
            ActivityCode.FULFILL_REQUEST,
            ActivityCode.EXTERNAL,
            ActivityCode.RECEIVE_STOCK,
            ActivityCode.PARTIAL_RECEIVING,
        ]),
        type: LocationTypeCode.DEPOT,
        required: true,
    }),
}
```

## Product Configuration

`ProductConfig` is a utility class that stores all of the configuration related to a product with properties described below.

|  |  |
|-- |-- |
| **key** | product variable identifier which will be used to access a given product |
| **required** | boolean value that specifies if **id** property is required  |
| **id**  | _id_ value of the product that will be used to fetch a given product |
| **name** | if existing product is not provided in the `.env` it will create a brand new product based on the specified config with provided **name**  ([read more](/documentation/DataSetup.md#data-creation)) |
| **quantity**  | Quantity available that will be set for a product when it will be created at setup stage |

<br>

```ts
this.products = {
    productOne: new ProductConfig({
        id: env.get('PRODUCT_ONE').asString(),
        key: PRODUCT_KEY.ONE,
        name: this.uniqueIdentifier.generateUniqueString('product-one'),
        quantity: 122,
        required: false,
    }),
}
```

