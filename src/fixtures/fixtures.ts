import { mergeTests } from "@playwright/test";

import { test as navigationTest } from "./navigation";

export const test = mergeTests(navigationTest);
