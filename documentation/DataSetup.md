[Back to README](/README.md)

# Data Setup

Before running any tests, it's essential to ensure that the data provided by the configuration exists and is valid. For this reason, two "test projects" are executed before the actual tests: `createData.setup.ts` and `validateData.setup.ts`.

## Data Validation
The script `validateData.setup.ts` checks the data provided in the `.env` file, such as locations, users, and more [(read more about application configuration)](/documentation/ApplicationConfiguration.md). It verifies that the data meets all necessary requirements. For example, it ensures that a location has the required activities or that a user has the necessary roles. <br> By doing this, we can ensure that any issues encountered in the tests are due to system bugs, not misconfigured or invalid data.

## Data Creation
Data Creation
Unlike the validation script, `createData.setup.ts` focuses on generating the required data specified in the Application Configuration. For example, if the configuration includes a location or a product, this script creates the necessary data before any tests are executed. This way, the tests have all the data they need in advance, ensuring consistency.