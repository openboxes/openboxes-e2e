# Openboxes E2E tests
End to end testing for OpenBoxes 

# Table of Contents
1. [Environment Variables](/documentation/EnvironmentVariables.md)
2. [Folder Structure](/documentation/ProjectFolderStructure.md)
3. [Application Configuration](/documentation/ApplicationConfiguration.md)
4. [Pages - Page Object Model (POM)](/documentation/Pages.md)
5. [API Service (direct interaaction with backend)](/documentation/ApiService.md)
6. [User Authentication](/documentation/Authentication.md)
7. [Fixtures](/documentation/Fixtures.md)

## Setup
### Required
- NPM 6.14.6
- Node 14+

### Install Dependencies

```
npm run install

npx playwright install
```

## Environment Variables
Below environment variables are r equired for the test application to be fully functional
```
// base URL of the running openboxes environment
APP_BASE_URL=http://localhost:8080/openboxes/
```
```
// login credentials of the test user that will be used for most of the tests 
USER_MAIN_USERNAME=username 
USER_MAIN_USERNAME=password 
```
```
// login credentials of the alternative test user that can be used 
USER_ALT_USERNAME=username 
USER_ALT_PASSWORD=password 
```

```
// location Id of the default location that will be used in most of the tests
LOCATION_MAIN=abcdeefg123id
```
Check out [Config File](/src/config/AppConfig.ts) to see which roles are required for any particular user 


[Read more about environment variables](documentation/EnvironmentVariables.md)


## Scripts

### Running tests
For more information on available flags when running tests in playwright reffer to the [documentation](https://playwright.dev/docs/running-tests).
```
npm run test
```
_To add a flag to the npm script, do the following eg._ `npm run test -- --headed`

### Code Linting
To check if there are any linter errors that require attention run the following command

```
npm run lint
```
If you wish to handle these errors automatically run
```
npm run lint-fix
```

### Code formatting

To format your code run the following command 
```
npm run format
```
