# Openboxes E2E tests
End to end testing for OpenBoxes 

## Setup
### Required
- NPM 6.14.6
- Node 14+

### Install Dependencies

```
npm run install
```

## Environment Variables
Environment variables facilitate the configuration of our testing project by allowing us to set appropriate configuration settings. A sample file can be located in the root directory of the project under the title .env.example. To configure this project effectively, it is imperative to create a .env file and declare all necessary variables within it.

**APP_BASE_URL** 
<br>base URL of the running openboxes environment

**CI** [optional]
<br>`true` or `false` flag indicating whether tests are running in Continuous Integration.

## Scripts

### Running tests
For more information on available flags when running tests in playwright reffer to the [documentation](https://playwright.dev/docs/running-tests).
```
npm run test
```
_To add a flag to the npm script, do the following eg._ `npm run test -- --headed`

### Linting project
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
