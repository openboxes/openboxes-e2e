# 📦 Openboxes E2E tests
End to end testing for OpenBoxes

[![Playwright Tests](https://img.shields.io/badge/Latest_E2E_run-report-blue)](https://openboxes.github.io/openboxes-e2e/)
&nbsp;
[![Playwright Tests](https://github.com/openboxes/openboxes-e2e/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/openboxes/openboxes-e2e/actions/workflows/playwright.yml)

## 🧰 Setup
### Required
- NPM 6.14.6
- Node 14.21.x

### Install Dependencies

```
npm install

npx playwright install
```

## 🔠 Environment Variables
To configure this project on your chosen instance of OpenBoxes, you need to set up the required environment variables in the `.env` file.
<br>
For detailed information on the required environment variables, please refer to the [Environment Variables documentation](documentation/EnvironmentVariables.md#required-variables).


# 📖 Documentation
1. [🗒️ Introduction (Tutorial)](/documentation/Tutorial.md)
2. [🔠 Environment Variables](/documentation/EnvironmentVariables.md)
3. [📂 Folder Structure](/documentation/ProjectFolderStructure.md)
4. [⚙️ Application Configuration](/documentation/ApplicationConfiguration.md)
5. [🛡️ User Authentication](/documentation/Authentication.md)
6. [⚓ Fixtures](/documentation/Fixtures.md)
7. [📍 Locators](/documentation/Locators.md)
8. [🧰 Data Setup](/documentation/DataSetup.md)
9. [🚀 DCI/CD](/documentation/CICD.md)


# 🗒️ Scripts

### 🧪 Running tests
For more information on available flags when running tests in playwright reffer to the [documentation](https://playwright.dev/docs/running-tests).
```
npm run test
```
_To add a flag to the npm script, do the following eg._ `npm run test -- --headed`

### 🧹 Code Linting
To check if there are any linter errors that require attention run the following command

```
npm run lint
```
If you wish to handle these errors automatically run
```
npm run lint-fix
```

### 🧱 Code formatting

To format your code run the following command 
```
npm run format
```
