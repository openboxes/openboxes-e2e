[↩️ Back to README](/README.md)

# 🚀 CI/CD End-to-End Testing with Playwright on GitHub Actions

[![Playwright Tests](https://img.shields.io/badge/Latest_E2E_run-report-blue)](https://openboxes.github.io/openboxes-e2e/)
&nbsp;
[![Playwright Tests](https://github.com/openboxes/openboxes-e2e/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/openboxes/openboxes-e2e/actions/workflows/playwright.yml)


This document outlines the setup and configuration of automated end-to-end testing for our project using Playwright in GitHub Actions. The test run reports are automatically deployed to GitHub Pages at https://openboxes.github.io/openboxes-e2e/, ensuring continuous availability of the latest test results.

## GitHub Actions Workflow Overview

The workflow defined in `.github/workflows/playwright.yml` is responsible for executing the Playwright end-to-end tests. The workflow is triggered under the following conditions:

- **Scheduled Runs:** The tests run daily at midnight UTC using a cron schedule.
- **Push Events:** Tests are triggered on every push to the `main` branch.
- **Pull Requests:** Tests are executed when a pull request is opened or updated against the `main` branch.
- **Manual Triggers:** The workflow can also be manually triggered using the `workflow_dispatch` event.

## Secrets Configuration

The workflow uses GitHub Secrets to manage environment-specific variables securely. This prevents sensitive data, such as usernames, passwords, and API keys, from being exposed in the codebase.

For more information on environment variables read here [Environment Variables](/documentation/EnvironmentVariables.md)

### To set up these secrets in your GitHub repository:

1. Navigate to **Settings** > **Secrets and variables** > **Actions**.
2. Add each required secret key with its corresponding value.

## Test Reports Deployment

The test results are collected and deployed to GitHub Pages, ensuring continuous visibility of the latest reports:

- **Artifact Upload:** The `actions/upload-artifact@v3` step saves the test reports as artifacts.
- **GitHub Pages Configuration:** The workflow configures GitHub Pages using actions/configure-pages@v2 and uploads the test report artifact.
- **Deployment:** Finally, the `actions/deploy-pages@v1` step deploys the test reports to https://openboxes.github.io/openboxes-e2e/.